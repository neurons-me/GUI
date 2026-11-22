// Facebook connect for the approval window: PKCE login, token exchange, and
// writing Pages / Instagram references into the encrypted keys vault.
// Secrets and tokens stay in memory only, go only to graph.facebook.com, and
// are sealed with the existing vault. Never logged, never written to
// localStorage or sessionStorage in the clear.
import {
  getCustomKeys, hasCustomKeys, listCustomKeyGroups, sanitizeKeyPath, saveCustomKeys,
  removeCustomKeys, setCustomKeyDisplay, setCustomKeyStatus, type ServiceFields,
} from './serviceKeyVault';

export const FACEBOOK_GRAPH = 'https://graph.facebook.com';
export const FACEBOOK_DIALOG = 'https://www.facebook.com';
export const FACEBOOK_API_VERSION = 'v21.0';
export const FACEBOOK_SCOPES = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
export const FACEBOOK_SESSION_KEY = 'me.keys.facebook.oauth';

export type FacebookOAuthSession = {
  state: string;
  verifier: string;
  redirectUri: string;
  namespace: string;
  /** Started in a popup: the popup only hands the code back to the window that opened it, then closes. */
  popup?: boolean;
};

/**
 * Same-origin channel the Facebook popup uses to hand `code`/`state` back to the window that started the connect.
 * Facebook's pages cut `window.opener` (Cross-Origin-Opener-Policy), so postMessage to the opener is not enough.
 */
export const FACEBOOK_RETURN_CHANNEL = 'me.facebook.oauth';

export type FacebookPkce = { verifier: string; challenge: string; method: 'S256' };

export type FacebookUserToken = { token: string; expires: string; scopes: string };

/** The person's public Facebook profile (me?fields=id,name,picture). No secrets. */
export type FacebookProfile = { id: string; name?: string; picture?: string };

/**
 * A profile picture URL we accept: https on Meta's own image hosts (facebook.com / *.fbcdn.net / platform-lookaside.fbsbx.com,
 * and *.cdninstagram.com for Instagram profile_picture_url).
 * Anything else is dropped, so the tree never loads an image from a host the person did not sign in with.
 */
export function safeProfilePicture(url: unknown): string | undefined {
  if (typeof url !== 'string' || url.length > 2048) return undefined;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return undefined;
    const h = u.hostname;
    // App-scoped users get their picture from platform-lookaside.fbsbx.com (it redirects to *.fbcdn.net).
    return h === 'facebook.com' || h.endsWith('.facebook.com') || h.endsWith('.fbcdn.net') || h === 'platform-lookaside.fbsbx.com'
      || h.endsWith('.cdninstagram.com')
      ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export type FacebookAccount = {
  id: string;
  name: string;
  access_token: string;
  /** Page profile photo (safe Facebook host only). Public. */
  picture?: string;
  instagram_business_account?: { id: string; username?: string; picture?: string };
};

export type FacebookConnectError = { ok: false; message: string; cancelled?: boolean; code?: number };
export type FacebookConnectOk = { ok: true };

type FetchLike = typeof fetch;

const META_HOSTS = new Set(['graph.facebook.com', 'www.facebook.com', 'facebook.com']);

export function isMetaGraphUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return META_HOSTS.has(host) || host.endsWith('.facebook.com') || host.endsWith('.fbcdn.net');
  } catch {
    return false;
  }
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export async function generatePkce(): Promise<FacebookPkce> {
  const verifier = b64url(randomBytes(32));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return { verifier, challenge: b64url(digest), method: 'S256' };
}

export function randomState(): string {
  return b64url(randomBytes(16));
}

/** Prefer /oauth/callback; fall back to the window itself (this origin's root, /) when that path is not served yet. */
export function facebookRedirectUri(origin: string, callbackAvailable = true): string {
  const base = origin.replace(/\/$/, '');
  return callbackAvailable ? `${base}/oauth/callback` : `${base}/`;
}


/** True when GET /oauth/callback is this window, not another demo page. */
export async function facebookCallbackAvailable(origin: string, run: FetchLike = fetch): Promise<boolean> {
  try {
    const res = await run(`${origin.replace(/\/$/, '')}/oauth/callback`, { method: 'GET', headers: { Accept: 'text/html' } });
    const text = await res.text();
    if (/claimFlow/i.test(text) && !/oauth=facebook/i.test(text) && !/\.me — approve/i.test(text)) return false;
    return res.ok;
  } catch {
    return false;
  }
}

export function facebookAuthUrl(opts: {
  clientId: string; redirectUri: string; state: string; challenge: string; scopes?: string;
}): string {
  const q = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: opts.scopes ?? FACEBOOK_SCOPES,
    response_type: 'code',
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: 'S256',
  });
  return `${FACEBOOK_DIALOG}/${FACEBOOK_API_VERSION}/dialog/oauth?${q}`;
}

function sessionStore(): Storage | null {
  try { return typeof sessionStorage !== 'undefined' ? sessionStorage : null; } catch { return null; }
}

export function readFacebookSession(): FacebookOAuthSession | null {
  const raw = sessionStore()?.getItem(FACEBOOK_SESSION_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<FacebookOAuthSession>;
    if (!v.state || !v.verifier || !v.redirectUri || !v.namespace) return null;
    return { state: v.state, verifier: v.verifier, redirectUri: v.redirectUri, namespace: v.namespace, ...(v.popup === true ? { popup: true } : {}) };
  } catch {
    return null;
  }
}

export function clearFacebookSession(): void {
  try { sessionStore()?.removeItem(FACEBOOK_SESSION_KEY); } catch { /* ignore */ }
}

export function writeFacebookSession(session: FacebookOAuthSession): void {
  // Only PKCE + redirect + namespace. Never a secret or token.
  sessionStore()?.setItem(FACEBOOK_SESSION_KEY, JSON.stringify({
    state: session.state,
    verifier: session.verifier,
    redirectUri: session.redirectUri,
    namespace: session.namespace,
    ...(session.popup ? { popup: true } : {}),
  }));
}

/**
 * Marks the pending connect as running in a popup (or not). Call it BEFORE window.open: the popup gets a copy of
 * this tab's sessionStorage at that moment, and the flag is how it knows to hand the code back instead of finishing.
 */
export function markFacebookSessionPopup(popup: boolean): void {
  const s = readFacebookSession();
  if (s) writeFacebookSession({ ...s, popup });
}

export async function beginFacebookConnect(opts: {
  namespace: string; clientId: string; redirectUri: string;
}): Promise<{ url: string; session: FacebookOAuthSession }> {
  const pkce = await generatePkce();
  const session: FacebookOAuthSession = {
    state: randomState(),
    verifier: pkce.verifier,
    redirectUri: opts.redirectUri,
    namespace: opts.namespace,
  };
  writeFacebookSession(session);
  const url = facebookAuthUrl({
    clientId: opts.clientId, redirectUri: opts.redirectUri, state: session.state, challenge: pkce.challenge,
  });
  return { url, session };
}

export function isFacebookOAuthReturn(params: URLSearchParams, session = readFacebookSession(), hasOpener = false): boolean {
  if (params.get('oauth') === 'facebook') return true;
  if (!params.has('code') && !params.has('error')) return false;
  // Same-window return has the session; a popup forwards code/state to its opener.
  return !!session || hasOpener;
}

export function readFacebookReturn(params: URLSearchParams, session: FacebookOAuthSession | null):
  | { ok: true; code: string }
  | FacebookConnectError {
  const cancelled = params.get('error') === 'access_denied' || params.get('error_reason') === 'user_denied';
  if (cancelled) return { ok: false, cancelled: true, message: 'Cancelled.' };
  const metaErr = params.get('error_description') || params.get('error');
  if (metaErr && !params.has('code')) return { ok: false, message: metaErr };
  if (!session) return { ok: false, message: 'This sign-in expired or did not match. Try again.' };
  const state = params.get('state');
  if (!state || state !== session.state) return { ok: false, message: 'This sign-in expired or did not match. Try again.' };
  const code = params.get('code');
  if (!code) return { ok: false, message: 'Facebook did not return a code. Try again.' };
  return { ok: true, code };
}

type TokenReply = { access_token?: string; expires_in?: number; error?: { message?: string; code?: number } | string; error_description?: string };

function tokenError(data: TokenReply, fallback: string): FacebookConnectError {
  const err = data.error;
  const code = typeof err === 'object' && err ? err.code : undefined;
  const message = (typeof err === 'object' && err?.message) || data.error_description || (typeof err === 'string' ? err : '') || fallback;
  if (code === 190) return { ok: false, code, message: `The token is no longer valid (error 190). Connect again. ${message}`.trim() };
  return { ok: false, code, message };
}

async function readTokenResponse(res: Response): Promise<TokenReply> {
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try { return JSON.parse(trimmed) as TokenReply; } catch { return { error_description: trimmed.slice(0, 200) }; }
  }
  const q = new URLSearchParams(trimmed);
  const access_token = q.get('access_token') ?? undefined;
  const expires_in = q.has('expires_in') ? Number(q.get('expires_in')) : undefined;
  if (access_token) return { access_token, expires_in: Number.isFinite(expires_in) ? expires_in : undefined };
  return { error_description: q.get('error_description') || q.get('error') || trimmed.slice(0, 200) };
}

export async function exchangeFacebookCode(opts: {
  code: string;
  redirectUri: string;
  verifier: string;
  clientId: string;
  clientSecret: string;
  scopes?: string;
  now?: number;
  fetch?: FetchLike;
}): Promise<{ ok: true; user: FacebookUserToken } | FacebookConnectError> {
  const run = opts.fetch ?? fetch;
  const tokenUrl = `${FACEBOOK_GRAPH}/${FACEBOOK_API_VERSION}/oauth/access_token`;

  const shortAttempt = async (withSecret: boolean) => {
    const q = new URLSearchParams({
      client_id: opts.clientId,
      redirect_uri: opts.redirectUri,
      code: opts.code,
      code_verifier: opts.verifier,
    });
    if (withSecret) q.set('client_secret', opts.clientSecret);
    const res = await run(`${tokenUrl}?${q}`, { method: 'GET', mode: 'cors' });
    return readTokenResponse(res);
  };

  let short = await shortAttempt(false);
  if (!short.access_token) short = await shortAttempt(true);
  if (!short.access_token) return tokenError(short, 'Could not exchange the Facebook code.');

  const longQ = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    fb_exchange_token: short.access_token,
  });
  const longRes = await run(`${tokenUrl}?${longQ}`, { method: 'GET', mode: 'cors' });
  const long = await readTokenResponse(longRes);
  if (!long.access_token) return tokenError(long, 'Could not exchange for a long-lived token.');

  const now = opts.now ?? Date.now();
  const seconds = long.expires_in && Number.isFinite(long.expires_in) ? long.expires_in : 60 * 24 * 60 * 60;
  // Public field is the UTC calendar day of that instant: expires_in is a duration, not a local date.
  const end = new Date(now + seconds * 1000);
  const expires = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`;
  return { ok: true, user: { token: long.access_token, expires, scopes: opts.scopes ?? FACEBOOK_SCOPES } };
}

/**
 * The person's id, name and picture, with the same user token and the same way as me/accounts.
 * Best effort: any failure returns null and the connect goes on without it. The token is never logged.
 */
export async function fetchFacebookProfile(opts: { accessToken: string; fetch?: FetchLike }): Promise<FacebookProfile | null> {
  const run = opts.fetch ?? fetch;
  const url = `${FACEBOOK_GRAPH}/${FACEBOOK_API_VERSION}/me?${new URLSearchParams({
    fields: 'id,name,picture.type(large)',
    access_token: opts.accessToken,
  })}`;
  try {
    const res = await run(url, { method: 'GET', mode: 'cors' });
    const data = await res.json() as { id?: unknown; name?: unknown; picture?: { data?: { url?: unknown; is_silhouette?: unknown } }; error?: unknown };
    if (!res.ok || data.error || typeof data.id !== 'string' || !/^\d{1,32}$/.test(data.id)) return null;
    const name = typeof data.name === 'string' ? data.name.trim().slice(0, 120) : '';
    const picture = data.picture?.data?.is_silhouette === true ? undefined : safeProfilePicture(data.picture?.data?.url);
    return { id: data.id, ...(name ? { name } : {}), ...(picture ? { picture } : {}) };
  } catch {
    return null;
  }
}

/**
 * The Meta App's public face (graph /<app-id>?fields=name,icon_url,logo_url). These fields are PUBLIC: Graph answers
 * them with no token at all, so the first try sends only the numeric App ID. `accessToken` (the user token, during a
 * connect) is a fallback for an app Graph will not describe anonymously. Never the App Secret. Best effort: null on
 * any failure.
 */
export type FacebookAppInfo = { name?: string; picture?: string };
export async function fetchFacebookApp(opts: { appId: string; accessToken?: string; fetch?: FetchLike }): Promise<FacebookAppInfo | null> {
  const run = opts.fetch ?? fetch;
  if (!/^\d{1,32}$/.test(opts.appId)) return null;
  const attempt = async (token?: string): Promise<FacebookAppInfo | null> => {
    const params = new URLSearchParams({ fields: 'name,icon_url,logo_url' });
    if (token) params.set('access_token', token);
    try {
      const res = await run(`${FACEBOOK_GRAPH}/${FACEBOOK_API_VERSION}/${opts.appId}?${params}`, { method: 'GET', mode: 'cors' });
      if (!res.ok) return null;
      const data = await res.json() as { name?: unknown; icon_url?: unknown; logo_url?: unknown; error?: unknown };
      if (data.error) return null;
      const name = typeof data.name === 'string' ? data.name.trim().slice(0, 120) : '';
      // Prefer the bigger logo; both come from Facebook's own CDN (scontent-*.xx.fbcdn.net), anything else is dropped.
      const picture = safeProfilePicture(data.logo_url) ?? safeProfilePicture(data.icon_url);
      if (!name && !picture) return null;
      return { ...(name ? { name } : {}), ...(picture ? { picture } : {}) };
    } catch {
      return null;
    }
  };
  return (await attempt()) ?? (opts.accessToken ? attempt(opts.accessToken) : null);
}

const appDisplayTried = new Set<string>();
/** A Facebook CDN link carries its expiry as `oe` (hex unix seconds). Fresh = still valid for more than a day. */
function cdnLinkFresh(url: string | undefined, now: number): boolean {
  if (!url) return false;
  try {
    const oe = new URL(url).searchParams.get('oe');
    if (!oe || !/^[0-9a-f]{1,12}$/i.test(oe)) return true;   // no expiry stamp: treat as stable
    return parseInt(oe, 16) * 1000 - now > 86_400_000;
  } catch { return false; }
}
/**
 * Fills meta.app's public display (App name + icon) from its PUBLIC App ID alone: no token, no secret, nothing
 * decrypted. Runs when the keys open and after a save, so an App saved before this existed, or saved by hand,
 * still gets its icon. Only when the display is missing or its CDN link is about to expire, and at most once per
 * namespace + App ID per page life. Returns whether the display changed.
 */
export async function refreshFacebookAppDisplay(namespace: string, opts: { fetch?: FetchLike; now?: number } = {}): Promise<boolean> {
  const g = listCustomKeyGroups(namespace).find((x) => x.name === 'meta.app');
  const appId = g?.publicValues?.id?.trim() ?? '';
  if (!g || !/^\d{1,32}$/.test(appId)) return false;
  // Already has a name and an icon link that is still good: nothing to ask.
  if (g.display?.name && cdnLinkFresh(g.display.picture, opts.now ?? Date.now())) return false;
  const tried = `${namespace}|${appId}`;
  if (appDisplayTried.has(tried)) return false;
  appDisplayTried.add(tried);
  const info = await fetchFacebookApp({ appId, fetch: opts.fetch });
  if (!info) return false;
  const now = listCustomKeyGroups(namespace).find((x) => x.name === 'meta.app');
  if (!now || now.publicValues?.id?.trim() !== appId) return false;   // changed meanwhile
  if (now.display?.name === info.name && now.display?.picture === info.picture) return false;
  setCustomKeyDisplay(namespace, 'meta.app', info);
  try { window.dispatchEvent(new CustomEvent('cleaker:service-keys-changed', { detail: { namespace } })); } catch { /* non-browser */ }
  return true;
}

export async function listFacebookAccounts(opts: {
  accessToken: string; fetch?: FetchLike;
}): Promise<{ ok: true; accounts: FacebookAccount[] } | FacebookConnectError> {
  const run = opts.fetch ?? fetch;
  const accounts: FacebookAccount[] = [];
  let url: string | null = `${FACEBOOK_GRAPH}/${FACEBOOK_API_VERSION}/me/accounts?${new URLSearchParams({
    fields: 'id,name,access_token,picture.type(large),instagram_business_account{id,username,profile_picture_url}',
    access_token: opts.accessToken,
  })}`;
  while (url) {
    if (!isMetaGraphUrl(url)) return { ok: false, message: 'Unexpected pagination URL.' };
    const res = await run(url, { method: 'GET', mode: 'cors' });
    const data = await res.json() as {
      data?: Array<{
        id?: string; name?: string; access_token?: string;
        picture?: { data?: { url?: unknown; is_silhouette?: unknown } };
        instagram_business_account?: { id?: string; username?: string; profile_picture_url?: unknown } | null;
      }>;
      paging?: { next?: string };
      error?: { message?: string; code?: number };
    };
    if (data.error) return tokenError(data, 'Could not list Pages.');
    for (const row of data.data ?? []) {
      if (!row.id || !row.access_token || !row.name) continue;
      const ig = row.instagram_business_account;
      const picture = row.picture?.data?.is_silhouette === true ? undefined : safeProfilePicture(row.picture?.data?.url);
      const igPicture = safeProfilePicture(ig?.profile_picture_url);
      accounts.push({
        id: row.id,
        name: row.name,
        access_token: row.access_token,
        ...(picture ? { picture } : {}),
        ...(ig?.id ? { instagram_business_account: {
          id: ig.id,
          ...(ig.username ? { username: ig.username } : {}),
          ...(igPicture ? { picture: igPicture } : {}),
        } } : {}),
      });
    }
    url = data.paging?.next ?? null;
  }
  return { ok: true, accounts };
}

/** Characters a tree path treats as structure; inside a Page / account name they are just text. */
const PATH_SEPARATORS = /[./\\:#?]+/g;
/** Words the tree uses for its own controls; a Page called "more" must not become one. */
const RESERVED_SLUGS = new Set(['add', 'custom', 'more', 'less']);

/** One path segment for a name: 'neurons.me' -> 'neurons-me' (a '.' in a name is never a new level). */
export function slugSegment(raw: string): string {
  // Accents are part of the letter, not a separator: 'Filósofo' -> 'filosofo', 'Niño' -> 'nino', 'Straße' -> 'strasse'.
  const plain = String(raw ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss').replace(/[æÆ]/g, 'ae').replace(/[øØ]/g, 'o').replace(/[łŁ]/g, 'l').replace(/[đĐ]/g, 'd');
  return sanitizeKeyPath(plain.replace(PATH_SEPARATORS, '-'));
}

/** Whether a saved slug still fits a name (same base, maybe with a uniqueness suffix), so it is kept stable. */
function slugFitsName(slug: string, name: string): boolean {
  const base = slugSegment(name);
  return !!base && isSingleSegmentSlug(slug) && (slug === base || slug.startsWith(`${base}-`) || (RESERVED_SLUGS.has(base) && slug.startsWith(`${base}-page`)));
}

/** Whether a saved slug is a single segment (old connects could save 'neurons.me' as two levels). */
export function isSingleSegmentSlug(slug: string): boolean {
  return !!slug && !slug.includes('.') && slugSegment(slug) === slug;
}

export function slugPageName(name: string, id?: string, taken?: Set<string>): string {
  let slug = slugSegment(name) || (id ? slugSegment(id) : '');
  if (!slug) slug = 'page';
  if (RESERVED_SLUGS.has(slug)) slug = `${slug}-page`;
  if (taken?.has(slug) && id) slug = sanitizeKeyPath(`${slug}-${id.slice(-6)}`) || slug;
  let n = 2;
  const base = slug;
  while (taken?.has(slug)) { slug = `${base}-${n}`; n += 1; }
  taken?.add(slug);
  return slug;
}

export function hasFacebookAppCredentials(namespace: string): boolean {
  if (!hasCustomKeys(namespace, 'meta.app')) return false;
  const g = listCustomKeyGroups(namespace).find((x) => x.name === 'meta.app');
  if (!g) return false;
  const fields = new Set(g.fields);
  const hasId = fields.has('id') || !!g.publicValues?.id;
  const hasSecret = fields.has('secret');
  return hasId && hasSecret;
}

export async function publicFacebookAppId(namespace: string): Promise<string | null> {
  const g = listCustomKeyGroups(namespace).find((x) => x.name === 'meta.app');
  const id = g?.publicValues?.id?.trim();
  return id || null;
}

function expiresFromDays(iso: string): string {
  return iso.slice(0, 10);
}

export async function applyFacebookAccounts(opts: {
  namespace: string;
  passphrase: string;
  user: FacebookUserToken;
  accounts: FacebookAccount[];
  /** Public profile for the meta.user card (id, name, picture). Optional: missing keeps the card plain. */
  profile?: FacebookProfile | null;
}): Promise<{ ok: true; added: string[]; updated: string[]; disconnected: string[]; migrated: string[] } | FacebookConnectError> {
  const ns = opts.namespace;
  const groups = listCustomKeyGroups(ns);
  const existingFb = groups.filter((g) => g.name.startsWith('meta.facebook.'));
  const existingIg = groups.filter((g) => g.name.startsWith('meta.instagram.'));
  // Reuse a Page's saved slug only when it is a clean single segment. An old slug with a '.'
  // ('meta.facebook.neurons.me') is rebuilt normalized and the broken group removed below.
  // A saved slug is kept only while it still fits the name ('neurons.me' or 'el-fil-sofo-ebrio' no longer do);
  // otherwise the Page moves to the new slug and the old group is removed below (same id = same Page).
  const savedFb = new Map<string, string>();
  for (const g of existingFb) {
    const id = g.publicValues?.id;
    const slug = g.name.slice('meta.facebook.'.length);
    if (id) savedFb.set(id, slug);
  }
  const savedIg = new Map<string, string>();
  for (const g of existingIg) {
    const id = g.publicValues?.userid;
    const slug = g.name.slice('meta.instagram.'.length);
    if (id) savedIg.set(id, slug);
  }
  const idToSlug = new Map<string, string>();
  for (const a of opts.accounts) {
    const s = savedFb.get(a.id);
    if (s && slugFitsName(s, a.name)) idToSlug.set(a.id, s);
  }
  const igIdToSlug = new Map<string, string>();
  for (const a of opts.accounts) {
    const ig = a.instagram_business_account;
    const s = ig?.id ? savedIg.get(ig.id) : undefined;
    if (ig?.id && s && slugFitsName(s, ig.username || ig.id)) igIdToSlug.set(ig.id, s);
  }
  const taken = new Set(idToSlug.values());
  const takenIg = new Set(igIdToSlug.values());
  const seenFb = new Set<string>();
  const seenIg = new Set<string>();
  const seenPageIds = new Set<string>();
  const seenIgIds = new Set<string>();
  const added: string[] = [];
  const updated: string[] = [];

  try {
    for (const acct of opts.accounts) {
      const slug = idToSlug.get(acct.id) ?? slugPageName(acct.name, acct.id, taken);
      idToSlug.set(acct.id, slug);
      const path = `meta.facebook.${slug}`;
      const existed = existingFb.some((g) => g.name === path);
      seenFb.add(path);
      seenPageIds.add(acct.id);
      const picture = safeProfilePicture(acct.picture);
      const fields: ServiceFields = { id: acct.id, token: acct.access_token, name: acct.name, ...(picture ? { picture } : {}) };
      if (acct.instagram_business_account?.id) fields.instagram_business_account = acct.instagram_business_account.id;
      await saveCustomKeys(ns, path, fields, opts.passphrase, undefined, {
        publicFields: ['id', 'name', 'picture', 'instagram_business_account'],
        status: null,
      });
      (existed ? updated : added).push(path);
      const ig = acct.instagram_business_account;
      if (ig?.id) {
        const igSlug = igIdToSlug.get(ig.id) ?? slugPageName(ig.username || ig.id, ig.id, takenIg);
        igIdToSlug.set(ig.id, igSlug);
        const igPath = `meta.instagram.${igSlug}`;
        seenIg.add(igPath);
        seenIgIds.add(ig.id);
        const igPicture = safeProfilePicture(ig.picture);
        await saveCustomKeys(ns, igPath, {
          userId: ig.id, page: `facebook.${slug}`,
          ...(ig.username ? { username: ig.username } : {}),
          ...(igPicture ? { picture: igPicture } : {}),
        }, opts.passphrase, undefined, {
          publicFields: ['userId', 'page', 'username', 'picture'],
          status: null,
        });
      }
    }

    await saveCustomKeys(ns, 'meta.user', {
      token: opts.user.token,
      // `expires` (was `expiresAt`): re-saving the group replaces its fields, so an old `expiresat` is dropped here.
      expires: expiresFromDays(opts.user.expires),
      scopes: opts.user.scopes,
      ...(opts.profile?.id ? { id: opts.profile.id } : {}),
      ...(opts.profile?.name ? { name: opts.profile.name } : {}),
      ...(safeProfilePicture(opts.profile?.picture) ? { picture: safeProfilePicture(opts.profile?.picture)! } : {}),
    }, opts.passphrase, undefined, { publicFields: ['expires', 'scopes', 'id', 'name', 'picture'], status: null });

    const disconnected: string[] = [];
    const migrated: string[] = [];
    for (const g of existingFb) {
      if (seenFb.has(g.name)) continue;
      // Same Page saved under an old path ('neurons.me', 'el-fil-sofo-ebrio', a renamed Page): moved to the new one.
      if (g.publicValues?.id && seenPageIds.has(g.publicValues.id)) {
        removeCustomKeys(ns, g.name);
        migrated.push(g.name);
        continue;
      }
      setCustomKeyStatus(ns, g.name, 'disconnected');
      disconnected.push(g.name);
    }
    for (const g of existingIg) {
      if (seenIg.has(g.name)) continue;
      if (g.publicValues?.userid && seenIgIds.has(g.publicValues.userid)) {
        removeCustomKeys(ns, g.name);
        migrated.push(g.name);
        continue;
      }
      setCustomKeyStatus(ns, g.name, 'disconnected');
      disconnected.push(g.name);
    }
    try { window.dispatchEvent(new CustomEvent('cleaker:service-keys-changed', { detail: { namespace: ns } })); } catch { /* non-browser */ }
    return { ok: true, added, updated, disconnected, migrated };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not save the keys.';
    if (message === 'WRONG_PASSPHRASE') return { ok: false, message: 'Wrong passphrase.' };
    return { ok: false, message };
  }
}

export async function finishFacebookConnect(opts: {
  code: string;
  session: FacebookOAuthSession;
  passphrase: string;
  now?: number;
  fetch?: FetchLike;
}): Promise<{ ok: true; added: string[]; updated: string[]; disconnected: string[]; migrated: string[] } | FacebookConnectError> {
  const app = await getCustomKeys(opts.session.namespace, 'meta.app', opts.passphrase);
  if (!app) return { ok: false, message: 'Could not open .keys.meta.app. Check the passphrase.' };
  const clientId = String(app.id || '').trim();
  const clientSecret = String(app.secret || '').trim();
  if (!clientId || !clientSecret) return { ok: false, message: 'Add your App ID and App Secret under .keys.meta.app first.' };

  const exchanged = await exchangeFacebookCode({
    code: opts.code,
    redirectUri: opts.session.redirectUri,
    verifier: opts.session.verifier,
    clientId,
    clientSecret,
    now: opts.now,
    fetch: opts.fetch,
  });
  if (!exchanged.ok) return exchanged;

  const listed = await listFacebookAccounts({ accessToken: exchanged.user.token, fetch: opts.fetch });
  if (!listed.ok) return listed;
  const profile = await fetchFacebookProfile({ accessToken: exchanged.user.token, fetch: opts.fetch });
  const appInfo = await fetchFacebookApp({ appId: clientId, accessToken: exchanged.user.token, fetch: opts.fetch });

  const out = await applyFacebookAccounts({
    namespace: opts.session.namespace,
    passphrase: opts.passphrase,
    user: exchanged.user,
    accounts: listed.accounts,
    profile,
  });
  // meta.app is user-made: its fields (id, secret, redirect) are never re-saved here. Only its public display
  // info (the App's name + icon) is set, beside the fields, so the node and card can show it.
  if (out.ok && appInfo) {
    setCustomKeyDisplay(opts.session.namespace, 'meta.app', appInfo);
    try { window.dispatchEvent(new CustomEvent('cleaker:service-keys-changed', { detail: { namespace: opts.session.namespace } })); } catch { /* non-browser */ }
  }
  return out;
}
