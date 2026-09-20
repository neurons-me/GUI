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

console.log('netgetSetupClient.test.ts: all assertions passed');
