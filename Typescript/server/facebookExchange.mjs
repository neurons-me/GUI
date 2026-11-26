// Server-only Facebook Login code exchange.
// Credentials come from keys.namespace.meta.app when a server-readable
// (encrypted-for-server) tree entry is available; otherwise from
// META_APP_ID / META_APP_SECRET. The App Secret must never be logged,
// returned to the client, or imported from a browser bundle.
// Graph calls go only to graph.facebook.com.

export const FACEBOOK_GRAPH = 'https://graph.facebook.com';
export const FACEBOOK_API_VERSION = 'v21.0';
export const META_APP_ID_ENV = 'META_APP_ID';
export const META_APP_SECRET_ENV = 'META_APP_SECRET';
export const FACEBOOK_EXCHANGE_PATH = '/oauth/facebook/exchange';
export const FACEBOOK_APP_PATH = '/oauth/facebook/app';

export function readMetaAppId() {
  const id = String(process.env.META_APP_ID || '').trim();
  return id || null;
}

export function hasMetaAppSecret() {
  return Boolean(String(process.env.META_APP_SECRET || '').trim());
}

function metaAppSecret() {
  return String(process.env.META_APP_SECRET || '').trim();
}


/** Official path of the namespace Meta app in the tree. */
export const NAMESPACE_META_APP_PATH = 'keys.namespace.meta.app';

/**
 * TODO: implement a reader that loads `keys.namespace.meta.app` from the
 * namespace tree and decrypts it with the server key. That needs the
 * hosting permission (encrypt-for-server-key) and kernel/monad work this
 * module does not include. Until that path exists, omit the reader and
 * the env vars META_APP_ID / META_APP_SECRET are the fallback.
 */

function envMetaAppCredentials() {
  const appId = readMetaAppId();
  const appSecret = metaAppSecret();
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

/** Prefer a server-readable tree entry; otherwise the env fallback. Never logs secrets. */
export async function resolveMetaAppCredentials(readFromTree) {
  if (readFromTree) {
    try {
      const fromTree = await readFromTree();
      const appId = String((fromTree && fromTree.appId) || '').trim();
      const appSecret = String((fromTree && fromTree.appSecret) || '').trim();
      if (appId && appSecret) return { appId, appSecret, source: 'tree' };
    } catch {
      // Fall through to env. Never log the error: it may contain secrets.
    }
  }
  const fromEnv = envMetaAppCredentials();
  return fromEnv ? { ...fromEnv, source: 'env' } : null;
}

export async function resolvePublicMetaAppId(readFromTree) {
  if (readFromTree) {
    try {
      const fromTree = await readFromTree();
      const appId = String((fromTree && fromTree.appId) || '').trim();
      if (appId) return appId;
    } catch {
      // Fall through to env. Never log the error.
    }
  }
  return readMetaAppId();
}

/** Public payload only. Never includes the secret. */
export async function publicFacebookAppPayload(readFromTree) {
  const appId = await resolvePublicMetaAppId(readFromTree);
  if (!appId) return { ok: false, message: 'Facebook connect is not available.', status: 503 };
  return { ok: true, appId };
}

function tokenError(data, fallback) {
  const message = (data && (data.error_description || data.error_message || data.error)) || fallback;
  return { ok: false, message: String(message), status: 400 };
}

async function readTokenReply(res) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return {
      access_token: typeof data.access_token === 'string' ? data.access_token : undefined,
      expires_in: typeof data.expires_in === 'number' ? data.expires_in : Number(data.expires_in) || undefined,
      error: data.error_description || data.error?.message || data.error || undefined,
    };
  } catch {
    return { error: text || `HTTP ${res.status}` };
  }
}

/**
 * Exchange a Facebook Login code for a long-lived user token, using the
 * server env credentials. `fetchImpl` is injectable so tests never hit the network.
 * The secret is sent only to graph.facebook.com and is never logged.
 */
export async function exchangeFacebookCodeWithEnv(opts) {
  const creds = await resolveMetaAppCredentials(opts.readFromTree);
  const clientId = (creds && creds.appId) || '';
  const clientSecret = (creds && creds.appSecret) || '';
  if (!clientId || !clientSecret) {
    return { ok: false, message: 'Facebook connect is not available.', status: 503 };
  }
  const code = String(opts.code || '').trim();
  const redirectUri = String(opts.redirectUri || '').trim();
  const verifier = String(opts.verifier || '').trim();
  if (!code || !redirectUri || !verifier) {
    return { ok: false, message: 'This sign-in expired or did not match. Try again.', status: 400 };
  }
  const run = opts.fetch ?? fetch;
  const tokenUrl = `${FACEBOOK_GRAPH}/${FACEBOOK_API_VERSION}/oauth/access_token`;

  const shortQ = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
    client_secret: clientSecret,
  });
  const shortRes = await run(`${tokenUrl}?${shortQ}`, { method: 'GET' });
  const short = await readTokenReply(shortRes);
  if (!short.access_token) return tokenError(short, 'Could not exchange the Facebook code.');

  const longQ = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: short.access_token,
  });
  const longRes = await run(`${tokenUrl}?${longQ}`, { method: 'GET' });
  const long = await readTokenReply(longRes);
  if (!long.access_token) return tokenError(long, 'Could not exchange for a long-lived token.');

  const now = opts.now ?? Date.now();
  const seconds = long.expires_in && Number.isFinite(long.expires_in) ? long.expires_in : 60 * 24 * 60 * 60;
  const end = new Date(now + seconds * 1000);
  const expires = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`;
  return { ok: true, token: long.access_token, expires };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

/** Node/vite middleware. Never writes the secret or a token to the log. */
export function facebookExchangeMiddleware({ fetchImpl, readFromTree } = {}) {
  return async (req, res, next) => {
    const url = req.url || '';
    const pathOnly = url.split('?')[0];
    if (pathOnly === FACEBOOK_APP_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
      const payload = await publicFacebookAppPayload(readFromTree);
      return sendJson(res, payload.ok ? 200 : (payload.status || 503), payload.ok ? { appId: payload.appId } : { ok: false, message: payload.message });
    }
    if (pathOnly === FACEBOOK_EXCHANGE_PATH && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await exchangeFacebookCodeWithEnv({
          code: body.code,
          redirectUri: body.redirectUri,
          verifier: body.verifier,
          fetch: fetchImpl,
          readFromTree,
        });
        if (!result.ok) return sendJson(res, result.status || 400, { ok: false, message: result.message });
        return sendJson(res, 200, { ok: true, token: result.token, expires: result.expires });
      } catch {
        return sendJson(res, 400, { ok: false, message: 'Could not exchange the Facebook code.' });
      }
    }
    return next();
  };
}
