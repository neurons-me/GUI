import assert from 'node:assert/strict';

// Which transport carries the reads for a namespace: the name never becomes an address by itself.
const { pickRootTransport, namespaceIsServed, checkMonadSurfaceClaim, probeCleakerRoot } =
  await import('../src/react/session/verifiedCleakerRoot');
const { createMonadClient, MonadClientError } = await import('../src/core/session/monadClient');

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

// A monad that HONORS the namespace named in the request answers for it through any door; one that does not
// answers for the door's own. The probe asks in the request (/__surface?namespace=<ns>) and accepts the answer only
// if it is the namespace asked for.
const honoring = (door: string) => (url: string) => surface(new URL(url).searchParams.get('namespace') || door);
const ignoring = (door: string) => () => surface(door);

function withMonad(origin: string, answer: (url: string) => unknown, run: (asked: string[]) => Promise<void>) {
  const real = globalThis.fetch; const asked: string[] = [];
  globalThis.fetch = (async (input: any) => {
    const url = String(typeof input === 'string' ? input : input?.url);
    asked.push(url);
    if (!url.startsWith(origin + '/__surface')) return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify(answer(url)), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as any;
  return run(asked).finally(() => { globalThis.fetch = real; });
}

// a handle door on a monad that honors the request: confirmed for the ROOT namespace, from the page's own origin
await withMonad('https://jabellae.acme.test', honoring('jabellae.acme.test'), async (asked) => {
  const r = await probeCleakerRoot('https://jabellae.acme.test', { expectNamespace: 'acme.test' });
  assert.equal(r.ok, true, 'the handle door can serve the namespace when the request names it');
  assert.ok(asked.some((u) => u.includes('/__surface?namespace=acme.test')), `the question is in the request: ${asked.join(' ')}`);
  assert.ok(asked.every((u) => u.startsWith('https://jabellae.acme.test/')), 'and nothing was sent to the apex to find out');
});

// a handle door on a monad that does NOT honor it: answers for the handle -> not this root's transport
await withMonad('https://jabellae.acme.test', ignoring('jabellae.acme.test'), async () => {
  assert.equal((await probeCleakerRoot('https://jabellae.acme.test', { expectNamespace: 'acme.test' })).ok, false, 'an older monad is not mistaken for one that resolves the namespace');
});

// a transport that does not say which namespace it resolved cannot be confirmed when one is expected
await withFetch({ 'https://www.acme.test/__surface': surface(undefined) }, async () => {
  assert.equal((await probeCleakerRoot('https://www.acme.test', { expectNamespace: 'acme.test' })).ok, false);
});

// with no expectation the behaviour is what it was (no regression for pages that are not doors)
await withFetch({ 'https://jabellae.acme.test/__surface': surface('jabellae.acme.test') }, async () => {
  assert.equal((await probeCleakerRoot('https://jabellae.acme.test')).ok, true);
});


// ── a read that names its namespace sends it, and fails if the answer is about another one ────────
const envelope = (ns: string, value: unknown) => ({ ok: true, target: { namespace: { me: ns, host: ns }, operation: 'read', path: 'layout.sidebar.scopes.root.itemIds', nrp: `me://${ns}:read/x`, value } });
function withRead(answer: (url: string) => unknown, run: (asked: string[]) => Promise<void>) {
  const real = globalThis.fetch; const asked: string[] = [];
  globalThis.fetch = (async (input: any) => {
    const url = String(typeof input === 'string' ? input : input?.url);
    asked.push(url);
    return new Response(JSON.stringify(answer(url)), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as any;
  return run(asked).finally(() => { globalThis.fetch = real; });
}
const monad = createMonadClient({});
const readRoot = () => monad.readNamespacePath({ semanticNamespace: 'acme.test', transportOrigin: 'https://jabellae.acme.test', path: 'layout.sidebar.scopes.root.itemIds', namedNamespace: true });

// a monad that honors the request: the ROOT's content arrives through the handle's door
await withRead((url) => envelope(new URL(url).searchParams.get('namespace') || 'jabellae.acme.test', new URL(url).searchParams.get('namespace') === 'acme.test' ? ['root-item'] : ['handle-item']), async (asked) => {
  const r = await readRoot();
  assert.deepEqual(r.value, ['root-item']);
  assert.ok(asked[0].startsWith('https://jabellae.acme.test/layout/sidebar/scopes/root/itemIds?namespace=acme.test'), asked[0]);
});
// a monad that ignores it answers with the handle's tree: that is refused, not shown as the root's
await withRead(() => envelope('jabellae.acme.test', ['handle-item']), async () => {
  await assert.rejects(readRoot(), (e: any) => e instanceof MonadClientError && e.code === 'NAMESPACE_MISMATCH');
});
// a read that does not name a namespace is what it was: no parameter, no check
await withRead(() => envelope('jabellae.acme.test', ['handle-item']), async (asked) => {
  const r = await monad.readNamespacePath({ semanticNamespace: 'acme.test', transportOrigin: 'https://jabellae.acme.test', path: 'layout.sidebar.scopes.root.itemIds' });
  assert.deepEqual(r.value, ['handle-item']);
  assert.ok(!asked[0].includes('namespace='), asked[0]);
});

console.log('rootTransport.test.ts: all assertions passed');
