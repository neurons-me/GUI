// A resource server for the identity agent prototype (tests/integration/agent.browser.test.mjs). It serves one
// protected read, GET /domains, and authorizes EVERY request itself -- as the contract requires of a resource server,
// whatever the GUI did or did not show.
//
// Verification mirrors the gateway's X-Me-Proof checks (modules/netget/.../lua/middleware/me_sig.lua) and adds what an
// agent approval is bound to:
//   - the proof is an agent proof (`v`), for this request: method, path, canonical query, empty-body hash;
//   - for THIS server (`audience`), from the page the browser says is calling (`origin` == the request's Origin);
//   - inside its time window and not after `expiresAt`; its nonce used once (single-threaded: check-and-add is atomic);
//   - signed by the public key registered for that identity (the server's own claim binding), Ed25519 over `message`.
// Then authorization, separately: a valid proof from an identity without the permission is 403, not data.
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AGENT_PROTOCOL = 'me-agent/1';
const EMPTY_BODY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const SKEW_MS = 60_000;
const TTL_MAX_MS = 10 * 60_000;
export const DOMAINS = [{ domain: 'example.test', target: 'http://127.0.0.1:4100' }];

const here = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.resolve(here, '../../package.json'));

/** The public key and identity hash an identity proves with, derived the way the agent derives them. */
export async function identityOf(username, secret, namespace) {
  // The kernel's own prove(), as the agent calls it (src/agent/prove.ts) -- no cleaker binding, no network.
  const MeKernel = (await import(req.resolve('this.me'))).default;
  const me = new MeKernel();
  me[Symbol.for('me.internal.reseed')](username, secret);
  const proof = await me['!'].prove({ rootNamespace: namespace, challenge: '{}' });
  return { identityHash: proof.identityHash, publicKey: proof.publicKey, namespace: proof.namespace };
}

const json = (res, status, body, origin) => {
  res.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
  });
  res.end(JSON.stringify(body));
};

function verify(request, url, selfOrigin, registered, seenNonces) {
  const header = request.headers['x-me-proof'];
  if (typeof header !== 'string' || !header) return { status: 401, error: 'PROOF_MISSING' };
  let proof, message, challenge;
  try {
    proof = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    message = JSON.parse(proof.message);
    challenge = JSON.parse(message.challenge);
  } catch {
    return { status: 401, error: 'PROOF_INVALID' };
  }
  if (challenge.v !== AGENT_PROTOCOL || challenge.action !== 'read') return { status: 401, error: 'NOT_AN_AGENT_PROOF' };
  if (challenge.method !== request.method || challenge.path !== url.pathname) return { status: 401, error: 'REQUEST_MISMATCH' };
  if (challenge.query !== JSON.stringify(Array.from(url.searchParams.entries()))) return { status: 401, error: 'QUERY_MISMATCH' };
  if (challenge.bodyHash !== EMPTY_BODY_SHA256) return { status: 401, error: 'BODY_MISMATCH' };
  if (challenge.audience !== selfOrigin) return { status: 401, error: 'WRONG_AUDIENCE' };
  if (!request.headers.origin || challenge.origin !== request.headers.origin) return { status: 401, error: 'ORIGIN_MISMATCH' };
  const now = Date.now();
  if (typeof challenge.timestamp !== 'number' || typeof challenge.expiresAt !== 'number') return { status: 401, error: 'PROOF_INVALID' };
  if (challenge.timestamp > now + SKEW_MS || challenge.expiresAt - challenge.timestamp > TTL_MAX_MS) return { status: 401, error: 'PROOF_INVALID' };
  if (now > challenge.expiresAt) return { status: 401, error: 'EXPIRED' };
  if (typeof challenge.nonce !== 'string' || seenNonces.has(challenge.nonce)) return { status: 401, error: 'REPLAY' };
  if (proof.identityHash !== message.identityHash) return { status: 401, error: 'PROOF_INVALID' };
  const expectedKey = registered.get(proof.identityHash);
  if (!expectedKey || expectedKey !== proof.publicKey) return { status: 401, error: 'UNKNOWN_KEY' };
  let ok = false;
  try {
    ok = crypto.verify(null, Buffer.from(proof.message, 'utf8'),
      { key: { kty: 'OKP', crv: 'Ed25519', x: proof.publicKey }, format: 'jwk' },
      Buffer.from(proof.signature, 'base64url'));
  } catch { ok = false; }
  if (!ok) return { status: 401, error: 'SIGNATURE_INVALID' };
  seenNonces.add(challenge.nonce);   // only a fully verified proof consumes its nonce
  return { status: 200, identityHash: proof.identityHash };
}

/**
 * registered: identityHash -> publicKey (the server's own claim/key binding).
 * allowed: identityHashes that may read the domain list.
 */
export function startAgentResource({ registered, allowed, port = 0 }) {
  const seenNonces = new Set();
  const state = { requests: [], outcomes: [], origin: '' };
  const server = http.createServer((request, res) => {
    const url = new URL(request.url, state.origin);
    const origin = request.headers.origin;
    if (request.method === 'OPTIONS') {
      // Anyone may ASK (CORS says nothing about permission); the proof and the policy below decide.
      res.writeHead(204, {
        'access-control-allow-origin': origin || '*',
        'access-control-allow-methods': 'GET',
        'access-control-allow-headers': 'X-Me-Proof',
        'access-control-max-age': '60',
        vary: 'Origin',
      });
      return res.end();
    }
    state.requests.push({ method: request.method, path: url.pathname + url.search, origin: origin || null });
    if (request.method !== 'GET' || url.pathname !== '/domains') return json(res, 404, { error: 'NOT_FOUND' }, origin);
    const verdict = verify(request, url, state.origin, registered, seenNonces);
    if (verdict.status !== 200) { state.outcomes.push(verdict.error); return json(res, verdict.status, { error: verdict.error }, origin); }
    if (!allowed.has(verdict.identityHash)) { state.outcomes.push('FORBIDDEN'); return json(res, 403, { error: 'FORBIDDEN' }, origin); }
    state.outcomes.push('OK');
    return json(res, 200, { domains: DOMAINS }, origin);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      state.origin = `http://127.0.0.1:${server.address().port}`;
      state.close = () => new Promise((r) => server.close(() => r()));
      resolve(state);
    });
  });
}
