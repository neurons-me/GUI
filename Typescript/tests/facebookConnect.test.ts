import assert from 'node:assert/strict';
import { vaultStore } from './port-namespace/shim';
import {
  getCustomKeys, listCustomKeyGroups, lockServiceKeys, saveCustomKeys, setCustomKeyDisplay, setCustomKeyStatus,
} from '../src/gui/All.This/Cleaker/Keys/serviceKeyVault';
import {
  FACEBOOK_SCOPES, FACEBOOK_EXCHANGE_PATH, FACEBOOK_APP_PATH, applyFacebookAccounts, beginFacebookConnect, clearFacebookSession,
  exchangeFacebookCodeViaServer, facebookAuthUrl, facebookRedirectUri, finishFacebookConnect,
  generatePkce, hasFacebookAppCredentials, isFacebookOAuthReturn, isMetaGraphUrl, publicFacebookAppId,
  fetchFacebookProfile, listFacebookAccounts, markFacebookSessionPopup, writeFacebookSession, randomState, safeProfilePicture, readFacebookReturn, readFacebookSession, slugPageName, slugSegment, fetchFacebookApp, refreshFacebookAppDisplay,
} from '../src/gui/All.This/Cleaker/Keys/facebookConnect';

const sess = new Map<string, string>();
(globalThis as any).sessionStorage = {
  getItem: (k: string) => (sess.has(k) ? sess.get(k)! : null),
  setItem: (k: string, v: string) => void sess.set(k, String(v)),
  removeItem: (k: string) => void sess.delete(k),
  clear: () => sess.clear(),
  key: (i: number) => [...sess.keys()][i] ?? null,
  get length() { return sess.size; },
};

const PW = 'a-long-secret-1';
const NS = 'ana.name.space';
const APP_SECRET = 'FAKE_APP_SECRET_not-real';
const USER_TOKEN = 'FAKE_USER_LONG_TOKEN';
const SHORT_TOKEN = 'FAKE_SHORT_TOKEN';
const PAGE_TOKEN = 'FAKE_PAGE_TOKEN_elbueno';
const PAGE_TOKEN_2 = 'FAKE_PAGE_TOKEN_neurons';
const SECRETS = [APP_SECRET, USER_TOKEN, SHORT_TOKEN, PAGE_TOKEN, PAGE_TOKEN_2];

let n = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  vaultStore.clear(); sess.clear(); lockServiceKeys();
  try { await fn(); console.log(`PASS ${name}`); n += 1; }
  catch (e: any) { console.log(`FAIL ${name}\n       ${e && e.stack ? e.stack : e}`); process.exitCode = 1; }
}

function assertNoPlaintext(extra: string[] = []) {
  const dump = JSON.stringify([...vaultStore.entries()]) + JSON.stringify([...sess.entries()]);
  for (const s of [...SECRETS, ...extra]) {
    assert.ok(!dump.includes(s), `plaintext secret leaked: ${s.slice(0, 8)}…`);
  }
}

type FetchCall = { url: string; method: string };
function graphFetch(script: (url: URL, calls: FetchCall[]) => { status?: number; body: unknown }) {
  const calls: FetchCall[] = [];
  const run: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : (input as Request).url);
    calls.push({ url: url.toString(), method: String(init?.method || 'GET') });
    assert.ok(isMetaGraphUrl(url.toString()), `fetch left Meta: ${url.origin}`);
    const out = script(url, calls);
    const body = typeof out.body === 'string' ? out.body : JSON.stringify(out.body);
    return new Response(body, { status: out.status ?? 200, headers: { 'content-type': 'application/json' } });
  };
  return { run, calls };
}


function connectFetch(script: (url: URL, init: RequestInit | undefined, calls: FetchCall[]) => { status?: number; body: unknown }) {
  const calls: FetchCall[] = [];
  const run: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : (input as Request).url);
    calls.push({ url: url.toString(), method: String(init?.method || 'GET') });
    const local = url.pathname === FACEBOOK_EXCHANGE_PATH || url.pathname === FACEBOOK_APP_PATH;
    if (!local) assert.ok(isMetaGraphUrl(url.toString()), `fetch left Meta: ${url.origin}`);
    const out = script(url, init, calls);
    const body = typeof out.body === 'string' ? out.body : JSON.stringify(out.body);
    return new Response(body, { status: out.status ?? 200, headers: { 'content-type': 'application/json' } });
  };
  return { run, calls };
}

await test('F1 PKCE verifier and S256 challenge are unique, URL-safe, and match SHA-256', async () => {
  const a = await generatePkce();
  const b = await generatePkce();
  assert.equal(a.method, 'S256');
  assert.notEqual(a.verifier, b.verifier);
  assert.notEqual(a.challenge, b.challenge);
  assert.match(a.verifier, /^[A-Za-z0-9_-]+$/);
  assert.match(a.challenge, /^[A-Za-z0-9_-]+$/);
  assert.ok(a.verifier.length >= 43);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a.verifier)));
  const expected = Buffer.from(digest).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  assert.equal(a.challenge, expected);
  const state = randomState();
  assert.match(state, /^[A-Za-z0-9_-]+$/);
  assert.ok(state.length >= 16);
});

await test('F2 auth URL has PKCE params and the window redirect', () => {
  const url = facebookAuthUrl({
    clientId: '123', redirectUri: 'http://127.0.0.1:5320/oauth/callback', state: 'st', challenge: 'ch',
  });
  const u = new URL(url);
  assert.equal(u.origin, 'https://www.facebook.com');
  assert.equal(u.searchParams.get('code_challenge'), 'ch');
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(u.searchParams.get('response_type'), 'code');
  assert.equal(u.searchParams.get('scope'), FACEBOOK_SCOPES);
  assert.equal(u.searchParams.get('redirect_uri'), 'http://127.0.0.1:5320/oauth/callback');
  assert.equal(facebookRedirectUri('http://127.0.0.1:5320', true), 'http://127.0.0.1:5320/oauth/callback');
  assert.equal(facebookRedirectUri('http://127.0.0.1:5320', false), 'http://127.0.0.1:5320/');
});

await test('F3 session stores only PKCE + namespace, never secrets; state must match', async () => {
  const { session } = await beginFacebookConnect({ namespace: NS, clientId: '123', redirectUri: 'http://127.0.0.1:5320/agent.html' });
  const stored = readFacebookSession();
  assert.equal(stored?.state, session.state);
  assert.equal(stored?.verifier, session.verifier);
  assert.equal(stored?.namespace, NS);
  const raw = sess.get('me.keys.facebook.oauth') || '';
  for (const s of SECRETS) assert.ok(!raw.includes(s));
  assert.ok(!raw.includes('client_secret') && !raw.includes('access_token'));

  assert.deepEqual(readFacebookReturn(new URLSearchParams('error=access_denied'), session), { ok: false, cancelled: true, message: 'Cancelled.' });
  assert.equal(readFacebookReturn(new URLSearchParams('code=abc&state=WRONG'), session).ok, false);
  assert.equal((readFacebookReturn(new URLSearchParams('code=abc&state=WRONG'), session) as { message: string }).message, 'This sign-in expired or did not match. Try again.');
  const ok = readFacebookReturn(new URLSearchParams(`code=abc&state=${session.state}`), session);
  assert.deepEqual(ok, { ok: true, code: 'abc' });
  assert.equal(isFacebookOAuthReturn(new URLSearchParams('foo=1')), false);
  assert.equal(isFacebookOAuthReturn(new URLSearchParams('code=x'), null, true), true);
  clearFacebookSession();
  assert.equal(readFacebookSession(), null);
});

await test('F4 the window exchanges the code with the server, never with Facebook and never with the App Secret', async () => {
  const { run, calls } = connectFetch((url, init) => {
    if (url.pathname === FACEBOOK_EXCHANGE_PATH) {
      const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
      assert.equal(init?.method, 'POST');
      assert.equal(body.code, 'the-code');
      assert.equal(body.verifier, 'ver');
      assert.equal(body.redirectUri, 'http://127.0.0.1:5320/oauth/callback');
      assert.ok(!('clientSecret' in body) && !('client_secret' in body) && !('secret' in body) && !('appSecret' in body));
      const dumped = JSON.stringify(body) + url.toString();
      for (const s of SECRETS) assert.ok(!dumped.includes(s), 'App Secret must not leave the window');
      return { body: { ok: true, token: USER_TOKEN, expires: '2027-01-15' } };
    }
    throw new Error(`unexpected ${url}`);
  });
  const out = await exchangeFacebookCodeViaServer({
    code: 'the-code', redirectUri: 'http://127.0.0.1:5320/oauth/callback', verifier: 'ver', fetch: run,
  });
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.equal(out.user.token, USER_TOKEN);
    assert.equal(out.user.expires, '2027-01-15');
    assert.equal(out.user.scopes, FACEBOOK_SCOPES);
  }
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).pathname, FACEBOOK_EXCHANGE_PATH);
  assert.notEqual(new URL(calls[0].url).hostname, 'graph.facebook.com');
});

await test('F5 me/accounts paginates and rejects a non-Meta next URL', async () => {
  const { run } = graphFetch((url) => {
    if (url.searchParams.get('after') === 'c2') {
      return { body: { data: [{ id: '222', name: 'neuronsme', access_token: PAGE_TOKEN_2, instagram_business_account: { id: '17842', username: 'neuronsme' } }] } };
    }
    return {
      body: {
        data: [{ id: '111', name: 'El Buen Tono', access_token: PAGE_TOKEN }],
        paging: { next: `${url.origin}${url.pathname}?access_token=${USER_TOKEN}&after=c2` },
      },
    };
  });
  const listed = await listFacebookAccounts({ accessToken: USER_TOKEN, fetch: run });
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(listed.accounts.length, 2);
    assert.equal(listed.accounts[0].name, 'El Buen Tono');
    assert.equal(listed.accounts[1].instagram_business_account?.username, 'neuronsme');
  }

  const bad = await listFacebookAccounts({
    accessToken: USER_TOKEN,
    fetch: async () => new Response(JSON.stringify({ data: [], paging: { next: 'https://evil.example/steal' } }), { status: 200 }),
  });
  assert.equal(bad.ok, false);
});

await test('F6 apply writes user + pages + instagram refs, reconnect marks missing disconnected, no plaintext', async () => {
  await saveCustomKeys(NS, 'meta.app', { id: '123456789', secret: APP_SECRET, redirect: 'http://127.0.0.1:5320/oauth/callback' }, PW);
  await saveCustomKeys(NS, 'meta.facebook.vieja', { id: '999', token: 'FAKE_OLD_PAGE' }, PW, undefined, { publicFields: ['id'] });
  await saveCustomKeys(NS, 'meta.facebook.elbuentono', { id: '111', token: 'FAKE_STALE' }, PW, undefined, { publicFields: ['id'] });
  // A meta.user saved before the rename (field `expiresAt`): still public, and dropped by the next connect.
  await saveCustomKeys(NS, 'meta.user', { token: 'FAKE_OLD_USER', expiresAt: '2026-11-20', scopes: 'pages_show_list' }, PW, undefined, { publicFields: ['expiresAt', 'scopes'] });
  assert.equal(listCustomKeyGroups(NS).find((g) => g.name === 'meta.user')!.publicValues!.expiresat, '2026-11-20');

  const out = await applyFacebookAccounts({
    namespace: NS,
    passphrase: PW,
    user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES },
    accounts: [
      { id: '111', name: 'El Buen Tono', access_token: PAGE_TOKEN, instagram_business_account: { id: '17841', username: 'elbuentono' } },
      { id: '222', name: 'neuronsme', access_token: PAGE_TOKEN_2, instagram_business_account: { id: '17842', username: 'neuronsme' } },
    ],
  });
  assert.equal(out.ok, true);
  if (out.ok) {
    // 'elbuentono' no longer fits 'El Buen Tono': same Page id, moved to the normalized slug.
    assert.ok(out.added.includes('meta.facebook.el-buen-tono'));
    assert.deepEqual(out.migrated, ['meta.facebook.elbuentono']);
    assert.ok(out.added.includes('meta.facebook.neuronsme'));
    assert.deepEqual(out.disconnected, ['meta.facebook.vieja']);
  }
  const groups = listCustomKeyGroups(NS);
  const vieja = groups.find((g) => g.name === 'meta.facebook.vieja')!;
  assert.equal(vieja.status, 'disconnected');
  const ig = groups.find((g) => g.name === 'meta.instagram.neuronsme')!;
  assert.deepEqual(ig.publicValues, { userid: '17842', page: 'facebook.neuronsme', username: 'neuronsme' });
  assert.ok(!ig.fields.includes('token'));
  lockServiceKeys();
  const user = await getCustomKeys(NS, 'meta.user', PW);
  assert.equal(user!.token, USER_TOKEN);
  assert.equal(user!.expires, '2027-01-14');
  assert.equal(user!.expiresat, undefined, 'the old expiresAt field is gone after reconnect');
  const userGroup = listCustomKeyGroups(NS).find((g) => g.name === 'meta.user')!;
  assert.deepEqual(userGroup.fields.sort(), ['expires', 'scopes', 'token']);
  assert.equal(userGroup.publicValues!.expires, '2027-01-14');
  assert.equal(userGroup.publicValues!.expiresat, undefined);
  assert.ok(!groups.some((g) => g.name === 'meta.facebook.elbuentono'));
  const page = await getCustomKeys(NS, 'meta.facebook.el-buen-tono', PW);
  assert.equal(page!.token, PAGE_TOKEN);
  const old = await getCustomKeys(NS, 'meta.facebook.vieja', PW);
  assert.equal(old!.token, 'FAKE_OLD_PAGE', 'disconnected page keeps its stored token, not deleted');
  assertNoPlaintext(['FAKE_OLD_PAGE', 'FAKE_STALE']);
  assert.equal(hasFacebookAppCredentials(NS), true);
  assert.equal(slugPageName('El Buen Tono'), 'el-buen-tono');
});

await test('F7 finishFacebookConnect runs the full sequence without a user-level App Secret; a failed exchange stays a plain error', async () => {
  const { session } = await beginFacebookConnect({ namespace: NS, clientId: '123456789', redirectUri: 'http://127.0.0.1:5320/agent.html' });
  const { run, calls } = connectFetch((url, init) => {
    if (url.pathname === FACEBOOK_EXCHANGE_PATH) {
      const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
      assert.ok(!('secret' in body) && !('client_secret' in body) && !('clientSecret' in body));
      for (const s of SECRETS) assert.ok(!JSON.stringify(body).includes(s));
      return { body: { ok: true, token: USER_TOKEN, expires: '2027-01-15' } };
    }
    if (url.pathname === FACEBOOK_APP_PATH) return { body: { appId: '123456789' } };
    if (url.pathname.endsWith('/me/accounts')) {
      return { body: { data: [{ id: '111', name: 'elbuentono', access_token: PAGE_TOKEN }] } };
    }
    if (url.pathname.endsWith('/me')) {
      assert.equal(url.searchParams.get('fields'), 'id,name,picture.type(large)');
      return { body: { id: '4242', name: 'Test Person', picture: { data: { url: 'https://scontent.xx.fbcdn.net/v/t1/p.jpg?oh=1', is_silhouette: false } } } };
    }
    if (url.pathname.endsWith('/123456789')) {
      return { body: { id: '123456789', name: 'Cleaker' } };
    }
    throw new Error(`unexpected ${url}`);
  });
  const done = await finishFacebookConnect({ code: 'ok-code', session, passphrase: PW, fetch: run, now: Date.parse('2026-11-15T22:00:00-06:00') });
  assert.equal(done.ok, true);
  const me = listCustomKeyGroups(NS).find((g) => g.name === 'meta.user')!;
  assert.equal(me.publicValues!.id, '4242');
  assert.equal(me.publicValues!.name, 'Test Person');
  assert.equal(me.publicValues!.picture, 'https://scontent.xx.fbcdn.net/v/t1/p.jpg?oh=1');
  assert.ok(!JSON.stringify(me).includes(USER_TOKEN), 'the user token is not public');
  assert.ok(calls.some((c) => new URL(c.url).pathname === FACEBOOK_EXCHANGE_PATH));
  assert.ok(calls.every((c) => {
    const host = new URL(c.url).hostname;
    return host === 'graph.facebook.com' || new URL(c.url).pathname.startsWith('/oauth/facebook/');
  }));
  assert.ok(calls.every((c) => !c.url.includes('client_secret')));
  assertNoPlaintext();

  const { run: dead } = connectFetch((url) => {
    if (url.pathname === FACEBOOK_EXCHANGE_PATH) return { status: 400, body: { ok: false, message: 'Invalid OAuth access token (error 190)' } };
    throw new Error(`unexpected ${url}`);
  });
  const err = await exchangeFacebookCodeViaServer({
    code: 'bad', redirectUri: session.redirectUri, verifier: session.verifier, fetch: dead,
  });
  assert.equal(err.ok, false);
  if (!err.ok) {
    assert.match(err.message, /error 190/);
  }
});

await test('F8 profile: id/name/picture are public and best effort; only Facebook https pictures are kept', async () => {
  assert.equal(safeProfilePicture('https://scontent.xx.fbcdn.net/a.jpg'), 'https://scontent.xx.fbcdn.net/a.jpg');
  assert.equal(safeProfilePicture('https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1&height=200'), 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1&height=200');
  assert.equal(safeProfilePicture('https://evil.fbsbx.com/a.jpg'), undefined);
  assert.equal(safeProfilePicture('http://scontent.xx.fbcdn.net/a.jpg'), undefined);
  assert.equal(safeProfilePicture('https://evil.example/fbcdn.net.jpg'), undefined);
  assert.equal(safeProfilePicture('javascript:alert(1)'), undefined);
  const { run: broken } = graphFetch(() => ({ status: 400, body: { error: { message: 'nope', code: 100 } } }));
  assert.equal(await fetchFacebookProfile({ accessToken: USER_TOKEN, fetch: broken }), null);
  const { run: evil } = graphFetch(() => ({ body: { id: '7', name: 'X', picture: { data: { url: 'https://evil.example/p.jpg' } } } }));
  assert.deepEqual(await fetchFacebookProfile({ accessToken: USER_TOKEN, fetch: evil }), { id: '7', name: 'X' });
  // A connect whose profile call fails still saves meta.user (without the profile).
  await applyFacebookAccounts({ namespace: NS, passphrase: PW, user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES }, accounts: [], profile: null });
  const me = listCustomKeyGroups(NS).find((g) => g.name === 'meta.user')!;
  assert.deepEqual(me.fields.sort(), ['expires', 'scopes', 'token']);
  assertNoPlaintext();
});

await test('F9 popup flag survives the session round trip; no secret in it', async () => {
  clearFacebookSession();
  markFacebookSessionPopup(true);
  assert.equal(readFacebookSession(), null, 'no session, nothing to mark');
  writeFacebookSession({ state: 's1', verifier: 'v1', redirectUri: 'http://127.0.0.1:5320/oauth/callback', namespace: NS });
  assert.equal(readFacebookSession()!.popup, undefined);
  markFacebookSessionPopup(true);
  assert.equal(readFacebookSession()!.popup, true);
  assert.equal(readFacebookSession()!.state, 's1');
  markFacebookSessionPopup(false);
  assert.equal(readFacebookSession()!.popup, undefined);
  clearFacebookSession();
  assertNoPlaintext();
});

await test('F10 dot names are one level: slugs normalize, stay unique, keep the original name public', async () => {
  assert.equal(slugSegment('neurons.me'), 'neurons-me');
  assert.equal(slugPageName('neurons.me'), 'neurons-me');
  assert.equal(slugPageName('a/b\\c:d#e?f'), 'a-b-c-d-e-f');
  assert.equal(slugPageName('...'), 'page');
  assert.equal(slugPageName('...', '123456'), '123456');
  assert.equal(slugPageName('More'), 'more-page');
  const taken = new Set<string>();
  assert.equal(slugPageName('neurons.me', '1000001', taken), 'neurons-me');
  assert.equal(slugPageName('neurons-me', '1000002', taken), 'neurons-me-000002');
  assert.equal(slugPageName('Neurons Me', '1000002', taken), 'neurons-me-000002-2');
  for (const s of taken) assert.ok(!s.includes('.'), s);

  const PIC = 'https://scontent.xx.fbcdn.net/v/t39/page.jpg';
  const IG_PIC = 'https://scontent.cdninstagram.com/ig.jpg';
  const { run, calls } = graphFetch(() => ({ body: { data: [
    { id: '333', name: 'neurons.me', access_token: PAGE_TOKEN, picture: { data: { url: PIC, is_silhouette: false } },
      instagram_business_account: { id: '17843', username: 'neurons.me', profile_picture_url: 'https://scontent.xx.fbcdn.net/ig.jpg' } },
    { id: '444', name: 'Plain', access_token: PAGE_TOKEN_2, picture: { data: { url: 'https://evil.example/x.jpg' } },
      instagram_business_account: { id: '17844', username: 'plain', profile_picture_url: IG_PIC } },
  ] } }));
  const listed = await listFacebookAccounts({ accessToken: USER_TOKEN, fetch: run });
  assert.ok(new URL(calls[0].url).searchParams.get('fields')!.includes('picture'));
  assert.equal(listed.ok, true);
  if (!listed.ok) return;
  assert.equal(listed.accounts[0].picture, PIC);
  assert.equal(listed.accounts[0].instagram_business_account?.picture, 'https://scontent.xx.fbcdn.net/ig.jpg');
  assert.equal(listed.accounts[1].picture, undefined, 'unsafe host dropped');
  assert.equal(listed.accounts[1].instagram_business_account?.picture, IG_PIC, 'Instagram CDN host is allowed');

  const out = await applyFacebookAccounts({ namespace: NS, passphrase: PW, user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES }, accounts: listed.accounts });
  assert.equal(out.ok, true);
  const groups = listCustomKeyGroups(NS);
  const page = groups.find((g) => g.name === 'meta.facebook.neurons-me')!;
  assert.ok(page, 'saved as one level');
  assert.equal(page.publicValues!.name, 'neurons.me');
  assert.equal(page.publicValues!.picture, PIC);
  assert.ok(!('token' in page.publicValues!));
  const ig = groups.find((g) => g.name === 'meta.instagram.neurons-me')!;
  assert.equal(ig.publicValues!.username, 'neurons.me');
  assert.equal(ig.publicValues!.page, 'facebook.neurons-me');
  assert.ok(groups.every((g) => !/^meta\.(facebook|instagram)\.[^.]+\./.test(g.name)), 'no extra levels');
  assertNoPlaintext();
});

await test('F11 migration: an old broken group with dots is replaced by the normalized one (token moved, old deleted)', async () => {
  await saveCustomKeys(NS, 'meta.facebook.neurons.me', { id: '333', token: 'FAKE_BROKEN_PAGE' }, PW, undefined, { publicFields: ['id'] });
  await saveCustomKeys(NS, 'meta.instagram.neurons.me', { userId: '17843', page: 'facebook.neurons.me' }, PW, undefined, { publicFields: ['userId', 'page'] });
  await saveCustomKeys(NS, 'meta.facebook.gone', { id: '999', token: 'FAKE_GONE' }, PW, undefined, { publicFields: ['id'] });
  const out = await applyFacebookAccounts({
    namespace: NS, passphrase: PW, user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES },
    accounts: [{ id: '333', name: 'neurons.me', access_token: PAGE_TOKEN, instagram_business_account: { id: '17843', username: 'neurons.me' } }],
  });
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.deepEqual(out.migrated.sort(), ['meta.facebook.neurons.me', 'meta.instagram.neurons.me']);
    assert.deepEqual(out.disconnected, ['meta.facebook.gone'], 'only the really missing Page is disconnected');
    assert.ok(out.added.includes('meta.facebook.neurons-me'));
  }
  const names = listCustomKeyGroups(NS).map((g) => g.name).sort();
  assert.ok(!names.includes('meta.facebook.neurons.me') && !names.includes('meta.instagram.neurons.me'));
  assert.ok(names.includes('meta.facebook.neurons-me') && names.includes('meta.instagram.neurons-me'));
  lockServiceKeys();
  assert.equal((await getCustomKeys(NS, 'meta.facebook.neurons-me', PW))!.token, PAGE_TOKEN);
  assertNoPlaintext(['FAKE_BROKEN_PAGE', 'FAKE_GONE']);
  const dump = JSON.stringify([...vaultStore.entries()]);
  assert.ok(!dump.includes('meta.facebook.neurons.me'), 'old broken group fully gone from storage');

  // A second connect is stable: same slug, nothing migrated.
  const again = await applyFacebookAccounts({
    namespace: NS, passphrase: PW, user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES },
    accounts: [{ id: '333', name: 'neurons.me', access_token: PAGE_TOKEN, instagram_business_account: { id: '17843', username: 'neurons.me' } }],
  });
  assert.equal(again.ok, true);
  if (again.ok) { assert.deepEqual(again.migrated, []); assert.ok(again.updated.includes('meta.facebook.neurons-me')); }
});

await test('F12 accents fold to plain letters; any old slug of the same Page / IG id moves to the new one', async () => {
  assert.equal(safeProfilePicture('https://scontent-qro1-1.cdninstagram.com/v/p.jpg'), 'https://scontent-qro1-1.cdninstagram.com/v/p.jpg');
  assert.equal(safeProfilePicture('https://cdninstagram.com.evil.example/p.jpg'), undefined);
  assert.equal(safeProfilePicture('https://evilcdninstagram.com/p.jpg'), undefined);
  assert.equal(slugPageName('El Filósofo Ebrio'), 'el-filosofo-ebrio');
  assert.equal(slugPageName('Niño Año Ñandú'), 'nino-ano-nandu');
  assert.equal(slugPageName('Café Crème'), 'cafe-creme');
  assert.equal(slugPageName('Straße'), 'strasse');
  assert.equal(slugPageName('😀 Página'), 'pagina');

  await saveCustomKeys(NS, 'meta.facebook.el-fil-sofo-ebrio', { id: '555', token: 'FAKE_OLD_ACCENT' }, PW, undefined, { publicFields: ['id'] });
  await saveCustomKeys(NS, 'meta.instagram.el-fil-sofo', { userId: '17855', page: 'facebook.el-fil-sofo-ebrio' }, PW, undefined, { publicFields: ['userId', 'page'] });
  // A kept slug with a uniqueness suffix that still fits the name is not moved.
  await saveCustomKeys(NS, 'meta.facebook.cafe-2', { id: '666', token: 'FAKE_CAFE' }, PW, undefined, { publicFields: ['id'] });
  const accounts = [
    { id: '555', name: 'El Filósofo Ebrio', access_token: PAGE_TOKEN, instagram_business_account: { id: '17855', username: 'el.filósofo' } },
    { id: '666', name: 'Café', access_token: PAGE_TOKEN_2 },
  ];
  const out = await applyFacebookAccounts({ namespace: NS, passphrase: PW, user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES }, accounts });
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.deepEqual(out.migrated.sort(), ['meta.facebook.el-fil-sofo-ebrio', 'meta.instagram.el-fil-sofo']);
    assert.deepEqual(out.disconnected, []);
    assert.ok(out.added.includes('meta.facebook.el-filosofo-ebrio'));
    assert.ok(out.updated.includes('meta.facebook.cafe-2'), 'fitting suffixed slug kept');
  }
  const names = listCustomKeyGroups(NS).map((g) => g.name);
  assert.ok(names.includes('meta.facebook.el-filosofo-ebrio') && names.includes('meta.instagram.el-filosofo'));
  assert.ok(!names.includes('meta.facebook.el-fil-sofo-ebrio') && !names.includes('meta.instagram.el-fil-sofo'));
  assert.equal(listCustomKeyGroups(NS).find((g) => g.name === 'meta.facebook.el-filosofo-ebrio')!.publicValues!.name, 'El Filósofo Ebrio');
  assert.equal(listCustomKeyGroups(NS).find((g) => g.name === 'meta.instagram.el-filosofo')!.publicValues!.page, 'facebook.el-filosofo-ebrio');
  lockServiceKeys();
  assert.equal((await getCustomKeys(NS, 'meta.facebook.el-filosofo-ebrio', PW))!.token, PAGE_TOKEN);
  assertNoPlaintext(['FAKE_OLD_ACCENT', 'FAKE_CAFE']);
  const again = await applyFacebookAccounts({ namespace: NS, passphrase: PW, user: { token: USER_TOKEN, expires: '2027-01-14', scopes: FACEBOOK_SCOPES }, accounts });
  if (again.ok) assert.deepEqual(again.migrated, [], 'stable on the next connect');
});

await test('F13 meta.app gets the App name + icon as display info; id/secret/redirect untouched; survives re-save and status', async () => {
  const REDIRECT = 'http://127.0.0.1:5320/oauth/callback';
  await saveCustomKeys(NS, 'meta.app', { id: '123456789', secret: APP_SECRET, redirect: REDIRECT }, PW);
  const before = listCustomKeyGroups(NS).find((g) => g.name === 'meta.app')!;
  const { session } = await beginFacebookConnect({ namespace: NS, clientId: '123456789', redirectUri: REDIRECT });
  const LOGO = 'https://static.xx.fbcdn.net/rsrc.php/app-logo.png';
  const { run, calls } = connectFetch((url) => {
    if (url.pathname === FACEBOOK_EXCHANGE_PATH) return { body: { ok: true, token: USER_TOKEN, expires: '2027-01-15' } };
    if (url.pathname === FACEBOOK_APP_PATH) return { body: { appId: '123456789' } };
    if (url.pathname.endsWith('/me/accounts')) return { body: { data: [] } };
    if (url.pathname.endsWith('/me')) return { body: { id: '4242', name: 'Test Person' } };
    if (url.pathname.endsWith('/123456789')) {
      assert.equal(url.searchParams.get('fields'), 'name,icon_url,logo_url');
      assert.equal(url.searchParams.get('access_token'), null, 'public fields: no token sent');
      return { body: { id: '123456789', name: 'Cleaker', icon_url: 'https://static.xx.fbcdn.net/rsrc.php/app-icon.png', logo_url: LOGO } };
    }
    throw new Error(`unexpected ${url}`);
  });
  const done = await finishFacebookConnect({ code: 'ok-code', session, passphrase: PW, fetch: run, now: Date.parse('2026-11-15T22:00:00-06:00') });
  assert.equal(done.ok, true);
  const app = listCustomKeyGroups(NS).find((g) => g.name === 'meta.app')!;
  assert.deepEqual(app.display, { name: 'Cleaker', picture: LOGO });
  assert.deepEqual(app.fields.sort(), before.fields.sort(), 'fields unchanged');
  assert.deepEqual(app.publicValues, before.publicValues, 'public values unchanged');
  lockServiceKeys();
  const vals = await getCustomKeys(NS, 'meta.app', PW);
  assert.deepEqual(vals, { id: '123456789', secret: APP_SECRET, redirect: REDIRECT }, 'secret kept, nothing added');
  const appCall = calls.find((c) => new URL(c.url).pathname.endsWith('/123456789'))!;
  assert.ok(!appCall.url.includes(APP_SECRET), 'the app call never carries the secret');
  assert.ok(calls.every((c) => new URL(c.url).hostname === 'graph.facebook.com' || new URL(c.url).pathname.startsWith('/oauth/facebook/')));
  assert.ok(calls.every((c) => !c.url.includes('client_secret')));
  assertNoPlaintext();
  // The user edits meta.app later (re-save replaces fields): display stays. A status change keeps it too.
  await saveCustomKeys(NS, 'meta.app', { id: '123456789', secret: APP_SECRET, redirect: 'https://cleaker.me/oauth/callback' }, PW);
  setCustomKeyStatus(NS, 'meta.app', 'disconnected');
  setCustomKeyStatus(NS, 'meta.app', null);
  assert.deepEqual(listCustomKeyGroups(NS).find((g) => g.name === 'meta.app')!.display, { name: 'Cleaker', picture: LOGO });

  // icon_url when the logo is missing or off-host; failures are just null (connect still works).
  const one = (body: unknown, status = 200) => graphFetch(() => ({ status, body })).run;
  assert.deepEqual(await fetchFacebookApp({ appId: '1', accessToken: USER_TOKEN, fetch: one({ name: 'X', logo_url: 'https://evil.example/l.png', icon_url: 'https://static.xx.fbcdn.net/i.png' }) }), { name: 'X', picture: 'https://static.xx.fbcdn.net/i.png' });
  assert.equal(await fetchFacebookApp({ appId: '1', accessToken: USER_TOKEN, fetch: one({ error: { message: 'no', code: 100 } }, 400) }), null);
  assert.equal(await fetchFacebookApp({ appId: '../me', accessToken: USER_TOKEN, fetch: one({ name: 'X' }) }), null, 'only a numeric app id');
});

await test('F14 meta.app icon fills from its public App ID alone (no token, no secret), once per window; token only as fallback', async () => {
  await saveCustomKeys(NS, 'meta.app', { id: '123456789', secret: APP_SECRET, redirect: 'https://cleaker.me/oauth/callback' }, PW);
  setCustomKeyDisplay(NS, 'meta.app', null);
  assert.equal(listCustomKeyGroups(NS).find((g) => g.name === 'meta.app')!.display, undefined);
  const LOGO = 'https://scontent-qro1-1.xx.fbcdn.net/v/t39.2081-6/logo.png?stp=p75x75';
  const { run, calls } = graphFetch((url) => {
    if (url.pathname.endsWith('/123456789')) return { body: { id: '123456789', name: 'My App', logo_url: LOGO } };
    throw new Error(`unexpected ${url}`);
  });
  assert.equal(await refreshFacebookAppDisplay(NS, { fetch: run }), true);
  assert.deepEqual(listCustomKeyGroups(NS).find((g) => g.name === 'meta.app')!.display, { name: 'My App', picture: LOGO });
  assert.equal(calls.length, 1);
  const u = new URL(calls[0].url);
  assert.equal(u.hostname, 'graph.facebook.com');
  assert.equal(u.searchParams.get('access_token'), null, 'no token at all');
  assert.ok(!calls[0].url.includes(APP_SECRET), 'never the secret');
  assert.equal(await refreshFacebookAppDisplay(NS, { fetch: run }), false, 'once per App ID per window');
  assert.equal(calls.length, 1);
  // A fresh, unexpired icon link is not asked again (another App ID, so the per-window memo does not decide).
  await saveCustomKeys(NS, 'meta.app', { id: '777', secret: APP_SECRET }, PW);
  const T0 = Date.parse('2026-11-16T12:00:00-06:00');
  const fresh = `https://scontent.xx.fbcdn.net/l.png?oe=${Math.floor((T0 + 30 * 86_400_000) / 1000).toString(16)}`;
  setCustomKeyDisplay(NS, 'meta.app', { name: 'My App', picture: fresh });
  assert.equal(await refreshFacebookAppDisplay(NS, { fetch: run, now: T0 }), false);
  assert.equal(calls.length, 1, 'fresh link: no request');
  const stale = `https://scontent.xx.fbcdn.net/l.png?oe=${Math.floor((T0 - 86_400_000) / 1000).toString(16)}`;
  await saveCustomKeys(NS, 'meta.app', { id: '123456789', secret: APP_SECRET }, PW);
  setCustomKeyDisplay(NS, 'meta.app', { name: 'My App', picture: stale });
  assertNoPlaintext();
  // An app Graph will not describe anonymously: the connect's user token is the fallback.
  let n2 = 0;
  const fb = graphFetch((url) => { n2 += 1; return url.searchParams.get('access_token') ? { body: { name: 'Dev App' } } : { status: 400, body: { error: { code: 104 } } }; }).run;
  assert.deepEqual(await fetchFacebookApp({ appId: '5', accessToken: USER_TOKEN, fetch: fb }), { name: 'Dev App' });
  assert.equal(n2, 2);
  assert.equal(await fetchFacebookApp({ appId: '5', fetch: fb }), null, 'no token, no fallback');
});

console.log(`${n} passed`);
