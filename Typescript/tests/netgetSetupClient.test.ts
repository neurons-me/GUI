import assert from 'node:assert/strict';

// Where the claim sends the person to sign: the namespace the gateway's monad
// serves (where their identity lives), not the host that shows the admin screens.
const { createNetgetSetupClient } = await import('../src/gui/All.This/netget/Setup/netgetSetupClient');

function withMainServerNamespace(body: unknown, run: () => Promise<void>) {
  const realFetch = globalThis.fetch;
  (globalThis as any).window = { location: { protocol: 'https:', origin: 'https://netget.site', pathname: '/' } };
  globalThis.fetch = (async () => ({ json: async () => body })) as any;
  return run().finally(() => { globalThis.fetch = realFetch; delete (globalThis as any).window; });
}

const claimUrl = async () =>
  new URL(await createNetgetSetupClient('').resolveCleakerClaimUrl({ gatewayId: 'g', challenge: 'c', state: 's', returnTo: 'https://netget.site/' }));

// the identity namespace wins over the admin host's name
await withMainServerNamespace({ namespace: 'cleaker.me', mainServerName: 'netget.site' }, async () => {
  const url = await claimUrl();
  assert.equal(url.origin, 'https://cleaker.me');
  assert.equal(url.pathname, '/keychain/claim');
  assert.equal(url.searchParams.get('gatewayId'), 'g');
  assert.equal(url.searchParams.get('returnTo'), 'https://netget.site/');
});

// signHere: the claim is signed in THIS app, at THIS origin -- never at the origin the identity is named by.
// (An origin has its own session and its own local vault; another origin arrives with nobody signed in.)
for (const page of ['https://www.cleaker.me', 'https://jabellae.cleaker.me', 'https://cleaker.me']) {
  const realFetch = globalThis.fetch;
  (globalThis as any).window = { location: { protocol: 'https:', origin: page, pathname: '/netget' } };
  let asked = 0;
  globalThis.fetch = (async () => { asked += 1; return { json: async () => ({ namespace: 'cleaker.me' }) }; }) as any;
  try {
    const here = new URL(await createNetgetSetupClient(page, { returnPath: '/netget', signHere: true }).resolveCleakerClaimUrl({ gatewayId: 'g', challenge: 'c', state: 's', returnTo: `${page}/netget` }));
    assert.equal(here.origin, page, `signs at ${page}`);
    assert.equal(here.pathname, '/keychain/claim');
    assert.equal(here.searchParams.get('returnTo'), `${page}/netget`);
    assert.equal(asked, 0, 'does not even ask which origin the identity is named by');
    // without signHere (a gateway-only screen) it still goes to the identity's origin
    const away = new URL(await createNetgetSetupClient(page).resolveCleakerClaimUrl({ gatewayId: 'g', challenge: 'c', state: 's', returnTo: page }));
    assert.equal(away.origin, 'https://cleaker.me');
  } finally { globalThis.fetch = realFetch; delete (globalThis as any).window; }
}

// an older gateway that only reports mainServerName still works
await withMainServerNamespace({ mainServerName: 'cleaker.example.com' }, async () => {
  assert.equal((await claimUrl()).origin, 'https://cleaker.example.com');
});

// a local namespace is not a public origin: fall through to mainServerName, then the local default
await withMainServerNamespace({ namespace: 'local.cleaker', mainServerName: 'cleaker.me' }, async () => {
  assert.equal((await claimUrl()).origin, 'https://cleaker.me');
});
await withMainServerNamespace({ namespace: 'local.cleaker', mainServerName: null }, async () => {
  assert.equal((await claimUrl()).origin, 'https://local.cleaker');
});

// a value that spells out its scheme (disposable, port-based testing) is used as it is
await withMainServerNamespace({ namespace: 'http://127.0.0.1:5174/' }, async () => {
  assert.equal((await claimUrl()).origin, 'http://127.0.0.1:5174');
});

// a gateway that cannot be reached: the local default, as before
{
  const realFetch = globalThis.fetch;
  (globalThis as any).window = { location: { protocol: 'https:', origin: 'https://x', pathname: '/' } };
  globalThis.fetch = (async () => { throw new Error('offline'); }) as any;
  assert.equal((await claimUrl()).origin, 'https://local.cleaker');
  globalThis.fetch = realFetch; delete (globalThis as any).window;
}

// ── where a passphrase may be typed: an exact origin, never a repaired lookalike ─────────────────────
const { trustedCleakerOrigin, isOwnGatewayOrigin } = await import('../src/gui/All.This/netget/Setup/trustedOrigin');

for (const [raw, origin] of [
  ['cleaker.me', 'https://cleaker.me'],
  ['https://cleaker.me', 'https://cleaker.me'],
  ['https://cleaker.me/', 'https://cleaker.me'],
  ['https://cleaker.me:8443', 'https://cleaker.me:8443'],
  ['http://127.0.0.1:5174', 'http://127.0.0.1:5174'],
  ['http://localhost:18461', 'http://localhost:18461'],
  ['http://acme.localhost:3000', 'http://acme.localhost:3000'],
] as const) assert.equal(trustedCleakerOrigin(raw), origin, raw);

for (const raw of [
  '', '   ', 'http://cleaker.me', 'http://evil.example', 'ftp://cleaker.me',
  'https://cleaker.me@evil.example', 'https://user:pw@cleaker.me',
  'https://evil.example/@cleaker.me', 'https://evil.example\\@cleaker.me',
  'https://cleaker.me/keychain', 'https://cleaker.me?x=1', 'https://cleaker.me#x',
  'javascript:alert(1)', 'https://', 'https://exa mple.com',
]) assert.equal(trustedCleakerOrigin(raw), null, `refused: ${raw}`);

// a configured value that is not an exact origin is skipped, and the next configured candidate is used
await withMainServerNamespace({ namespace: 'https://evil.example/steal', mainServerName: 'netget.site' }, async () => {
  assert.equal((await claimUrl()).origin, 'https://netget.site');
});
await withMainServerNamespace({ namespace: 'http://cleaker.me', mainServerName: 'https://x.example@evil.example' }, async () => {
  assert.equal((await claimUrl()).origin, 'https://local.cleaker', 'nothing acceptable: the local fallback, not a guess');
});

// the setup code goes to the gateway at the page's own origin only
assert.equal(isOwnGatewayOrigin('https://cleaker.me', 'https://cleaker.me'), true);
assert.equal(isOwnGatewayOrigin('https://cleaker.me/', 'https://cleaker.me'), true);
assert.equal(isOwnGatewayOrigin('https://jabellae.cleaker.me', 'https://jabellae.cleaker.me'), true);
assert.equal(isOwnGatewayOrigin('https://cleaker.me', 'https://www.cleaker.me'), false, 'www is another origin');
assert.equal(isOwnGatewayOrigin('https://other.example', 'https://cleaker.me'), false, 'a name-derived endpoint is not the page');
assert.equal(isOwnGatewayOrigin('http://cleaker.me', 'https://cleaker.me'), false);
assert.equal(isOwnGatewayOrigin('', 'https://cleaker.me'), false);
assert.equal(isOwnGatewayOrigin('https://cleaker.me', ''), false);

console.log('netgetSetupClient.test.ts: all assertions passed');
