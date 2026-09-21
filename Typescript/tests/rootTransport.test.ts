import assert from 'node:assert/strict';

// Which transport carries the reads for a namespace: the name never becomes an address by itself.
const { pickRootTransport, namespaceIsServed, checkMonadSurfaceClaim, probeCleakerRoot } =
  await import('../src/react/session/verifiedCleakerRoot');

// ── the answer names the namespace that was asked for, exactly ───────────────────────────────────
assert.equal(namespaceIsServed('acme.test', 'acme.test'), true);
assert.equal(namespaceIsServed('ACME.test', 'acme.test'), true);
assert.equal(namespaceIsServed('acme.test.', 'acme.test'), true);
assert.equal(namespaceIsServed('jabellae.acme.test', 'acme.test'), false, 'a handle is not the namespace above it');
assert.equal(namespaceIsServed('notacme.test', 'acme.test'), false);
assert.equal(namespaceIsServed(null, 'acme.test'), false, 'a transport that did not say is not confirmed');
assert.equal(namespaceIsServed('', 'acme.test'), false);

// ── the transport is chosen apart from the name ───────────────────────────────────────────────────
const at = (origin: string) => ({ origin, hostname: new URL(origin).hostname });
const pick = (page: string | null, resolvedEndpoint = 'https://acme.test') =>
  pickRootTransport({ label: 'acme.test', resolvedEndpoint, page: page ? at(page) : null });

assert.deepEqual(pick('https://acme.test'), { label: 'acme.test', cleakerEndpoint: 'https://acme.test' }, "the namespace's own host: its own origin");
assert.deepEqual(pick('http://acme.test:18443'), { label: 'acme.test', cleakerEndpoint: 'http://acme.test:18443' }, 'scheme and port are the page\'s');
assert.deepEqual(pick('https://www.acme.test'), { label: 'acme.test', cleakerEndpoint: 'https://www.acme.test', expectNamespace: 'acme.test' }, 'www: the page origin, checked against the answer');
assert.deepEqual(pick('https://jabellae.acme.test'), { label: 'acme.test', cleakerEndpoint: 'https://jabellae.acme.test', expectNamespace: 'acme.test' }, 'a handle door: the page origin, checked against the answer');
assert.deepEqual(pick('https://JABELLAE.Acme.Test'), { label: 'acme.test', cleakerEndpoint: 'https://JABELLAE.Acme.Test', expectNamespace: 'acme.test' }, 'case does not matter');
// not a door of the namespace: the supplied address is unchanged (the name is not turned into the page's origin)
for (const page of ['https://netget.site', 'https://evil-acme.test', 'https://acme.test.evil.example', 'https://notacme.test']) {
  assert.deepEqual(pick(page), { label: 'acme.test', cleakerEndpoint: 'https://acme.test' }, `${page} is not a door`);
}
assert.deepEqual(pick(null), { label: 'acme.test', cleakerEndpoint: 'https://acme.test' }, 'off-window: as supplied');
assert.deepEqual(pickRootTransport({ label: '', resolvedEndpoint: 'https://x.example', page: at('https://x.example') }), { label: '', cleakerEndpoint: 'https://x.example' });

// ── the surface payload says which namespace the request resolved to ─────────────────────────────
// the shape a real monad answers: the resolved namespace is in the envelope's target
const surface = (namespace: string | undefined) => ({
  ok: true, monadId: 'm1', monad: { id: 'm1', name: 'netget' },
  target: { namespace: namespace ? { me: namespace, host: namespace } : undefined, operation: 'read' },
  surfaceEntry: { resources: ['read'], monadId: 'm1' },
});
assert.equal((await checkMonadSurfaceClaim(surface('acme.test'))).namespace, 'acme.test');
// a payload that carries it at the top level is read too
assert.equal((await checkMonadSurfaceClaim({ ...surface(undefined), namespace: 'acme.test' })).namespace, 'acme.test');
assert.equal((await checkMonadSurfaceClaim({ ...surface(undefined), namespace: { me: 'acme.test', host: 'acme.test' } })).namespace, 'acme.test');
assert.equal((await checkMonadSurfaceClaim(surface('www-door-answers-the-namespace.example'))).namespace, 'www-door-answers-the-namespace.example');
assert.equal((await checkMonadSurfaceClaim(surface(undefined))).namespace, null);

// ── the probe accepts a transport only if it answers for the namespace asked ─────────────────────
function withFetch(answers: Record<string, unknown>, run: (asked: string[]) => Promise<void>) {
  const real = globalThis.fetch; const asked: string[] = [];
  globalThis.fetch = (async (input: any) => {
    const url = String(typeof input === 'string' ? input : input?.url);
    asked.push(url);
    const hit = Object.entries(answers).find(([prefix]) => url.startsWith(prefix));
    if (!hit) return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify(hit[1]), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as any;
  return run(asked).finally(() => { globalThis.fetch = real; });
}

// www: the request resolves to the namespace itself -> confirmed, same origin only
await withFetch({ 'https://www.acme.test/__surface': surface('acme.test') }, async (asked) => {
  const r = await probeCleakerRoot('https://www.acme.test', { expectNamespace: 'acme.test' });
  assert.equal(r.ok, true);
  assert.equal(r.via, 'direct');
  assert.ok(asked.every((u) => u.startsWith('https://www.acme.test/')), `only the page origin was asked: ${asked.join(' ')}`);
});

// a handle door: the request resolves to the handle's namespace -> NOT this root's transport, on either path
await withFetch({
  'https://jabellae.acme.test/__surface': surface('jabellae.acme.test'),
  'https://jabellae.acme.test/apps/netget/__surface': surface('jabellae.acme.test'),
}, async (asked) => {
  const r = await probeCleakerRoot('https://jabellae.acme.test', { expectNamespace: 'acme.test' });
  assert.equal(r.ok, false, 'the handle door answers for the handle');
  assert.ok(asked.every((u) => u.startsWith('https://jabellae.acme.test/')), 'and nothing was sent to the apex to find out');
});

// a transport that does not say which namespace it resolved cannot be confirmed when one is expected
await withFetch({ 'https://www.acme.test/__surface': surface(undefined) }, async () => {
  assert.equal((await probeCleakerRoot('https://www.acme.test', { expectNamespace: 'acme.test' })).ok, false);
});

// with no expectation the behaviour is what it was (no regression for pages that are not doors)
await withFetch({ 'https://jabellae.acme.test/__surface': surface('jabellae.acme.test') }, async () => {
  assert.equal((await probeCleakerRoot('https://jabellae.acme.test')).ok, true);
});

console.log('rootTransport.test.ts: all assertions passed');
