import assert from 'node:assert/strict';

// The mount reference (namespace + node path) a self-contained page uses to tie into `.me`
// (GatewayAccessContract.md §7): never derived from a hostname, explicit when it cannot be resolved,
// and the same description whether it arrived injected or was fetched.
const { mountReferenceFromBoot, fetchMountReference, mountReferencesEquivalent } = await import(
  '../src/runtime/mountReference'
);

function boot(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'namespace-provider',
    version: 1,
    namespace: 'acme.test',
    rootNamespace: 'acme.test',
    handle: null,
    nodePath: '',
    route: '/',
    origin: 'http://acme.test',
    apiOrigin: 'http://acme.test',
    resolverHostName: 'acme.test',
    resolverDisplayName: 'acme.test',
    endpoints: { resolve: '/__provider/resolve', surface: '/__provider/surface', subscribe: null },
    surfaceEntry: null,
    modules: [],
    ...overrides,
  };
}

// ── mountReferenceFromBoot: pure, no globals, no hostname ──────────────────────────────────────────
{
  const r = mountReferenceFromBoot(boot());
  assert.equal(r.status, 'resolved');
  assert.equal((r as any).namespace, 'acme.test');
  assert.equal((r as any).nodePath, '', 'root by default');
}
{
  const r = mountReferenceFromBoot(boot({ nodePath: '//dashboard//status//' }));
  assert.equal((r as any).nodePath, 'dashboard/status', 'normalized the same way the server does');
}
for (const bad of [null, undefined, {}, { kind: 'namespace-provider', version: 1, namespace: '' }, { kind: 'other', version: 1, namespace: 'x' }]) {
  const r = mountReferenceFromBoot(bad as any);
  assert.equal(r.status, 'unresolved', JSON.stringify(bad));
  assert.equal((r as any).reason, 'BOOT_INCOMPLETE');
}

// ── fetchMountReference: explicit unresolved states, never a silent guess ──────────────────────────
{
  const r = await fetchMountReference('http://nonexistent.invalid', {
    fetchImpl: async () => { throw new Error('network down'); },
  });
  assert.equal(r.status, 'unresolved');
  assert.equal((r as any).reason, 'FETCH_FAILED');
}
{
  const r = await fetchMountReference('http://x.test', {
    fetchImpl: async () => new Response('not json', { status: 200 }) as any,
  });
  assert.equal(r.status, 'unresolved');
  assert.equal((r as any).reason, 'MALFORMED_RESPONSE');
}
{
  const r = await fetchMountReference('http://x.test', {
    fetchImpl: async () => new Response('{}', { status: 502 }) as any,
  });
  assert.equal(r.status, 'unresolved');
  assert.equal((r as any).reason, 'FETCH_FAILED');
}
{
  const r = await fetchMountReference('', {});
  assert.equal(r.status, 'unresolved', 'no providerOrigin is not treated as "same origin"');
}
{
  // The request actually made: providerOrigin is configuration, nodePath is a real query param -- and
  // nothing about the URL is derived from any hostname the test also sets to something else entirely.
  let requested: string | undefined;
  (globalThis as any).window = { location: { hostname: 'unrelated.example', origin: 'http://unrelated.example' } };
  const r = await fetchMountReference('http://configured-origin.test', {
    nodePath: 'a/b',
    fetchImpl: async (url: any) => {
      requested = String(url);
      return new Response(JSON.stringify({ provider: boot({ nodePath: 'a/b' }) }), { status: 200 }) as any;
    },
  });
  delete (globalThis as any).window;
  assert.equal(r.status, 'resolved');
  assert.equal((r as any).nodePath, 'a/b');
  assert.ok(requested!.startsWith('http://configured-origin.test/__provider'), requested);
  assert.ok(!requested!.includes('unrelated.example'), 'window.location never leaks into the request');
  assert.ok(requested!.includes('nodePath=a%2Fb') || requested!.includes('nodePath=a/b'));
}

{
  // The real case this exists for: providerOrigin ITSELF carries a path (netget.site's own
  // ".../apps/netget"), which must be preserved, not dropped by absolute-path URL resolution.
  let requested: string | undefined;
  const r = await fetchMountReference('http://netget.site/apps/netget', {
    fetchImpl: async (url: any) => {
      requested = String(url);
      return new Response(JSON.stringify({ provider: boot() }), { status: 200 }) as any;
    },
  });
  assert.equal(r.status, 'resolved');
  assert.equal(requested, 'http://netget.site/apps/netget/__provider', requested);
}

// ── mountReferencesEquivalent ───────────────────────────────────────────────────────────────────
{
  const a = mountReferenceFromBoot(boot());
  const b = mountReferenceFromBoot(boot({ origin: 'http://other-door.example', resolverHostName: 'other' }));
  assert.equal(mountReferencesEquivalent(a, b), true, 'boot-only fields differing does not change the PLACE');
}
{
  const a = mountReferenceFromBoot(boot({ nodePath: '' }));
  const b = mountReferenceFromBoot(boot({ nodePath: 'dashboard' }));
  assert.equal(mountReferencesEquivalent(a, b), false, 'a different node path is a different place');
}
{
  const a = mountReferenceFromBoot(boot());
  const b = mountReferenceFromBoot(null as any);
  assert.equal(mountReferencesEquivalent(a, b), false, 'unresolved is never equivalent to anything');
}

console.log('mountReference.test.ts: all assertions passed');
