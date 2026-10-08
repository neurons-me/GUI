// Who produced a response decides whether a layer is OFF (nothing behind it) or in ERROR (something answered and
// refused). These are the exact responses a netget door gives (captured from the real nginx/Lua/backend/monad).
import assert from 'node:assert/strict';
import { classifyLayerOutcome, probeDoorLayers, type ProbeOutcome } from '../src/react/session/doorLayers';

const html502: ProbeOutcome = { status: 502, contentType: 'text/html', json: null };
const spaFallback: ProbeOutcome = { status: 200, contentType: 'text/html', json: null };
const luaMonadNotFound: ProbeOutcome = { status: 404, contentType: 'application/json; charset=utf-8', json: { error: 'monad_not_found', message: "Monad 'netget' is not registered.", name: 'netget' } };
const gatewayOk: ProbeOutcome = { status: 200, contentType: 'application/json', json: { gatewayId: '8d2bc188', bootstrapped: true, adminCount: 1 } };
const surfaceOk: ProbeOutcome = { status: 200, contentType: 'application/json', json: { ok: true, monadId: 'monad:abc', monad: { id: 'monad:abc' } } };

// OFF: nothing behind
for (const kind of ['backend', 'monad'] as const) {
  assert.equal(classifyLayerOutcome(kind, html502).state, 'off', `${kind}: nginx's own 502`);
  assert.equal(classifyLayerOutcome(kind, { ...html502, status: 503 }).state, 'off');
  assert.equal(classifyLayerOutcome(kind, { ...html502, status: 504 }).state, 'off');
  assert.equal(classifyLayerOutcome(kind, spaFallback).state, 'off', `${kind}: a page where JSON was expected`);
  assert.equal(classifyLayerOutcome(kind, { status: null, contentType: '', json: null, networkError: 'Failed to fetch' }).state, 'off', `${kind}: no response at all`);
}
assert.equal(classifyLayerOutcome('monad', luaMonadNotFound).state, 'off', 'the Lua door says no monad is registered');

// UP
assert.equal(classifyLayerOutcome('backend', gatewayOk).state, 'up');
assert.equal(classifyLayerOutcome('monad', surfaceOk).state, 'up');

// ERROR: something answered and refused (JSON from the layer itself, not the success shape)
assert.equal(classifyLayerOutcome('backend', { status: 500, contentType: 'application/json', json: { error: 'INTERNAL_ERROR' } }).state, 'error');
assert.equal(classifyLayerOutcome('backend', { status: 401, contentType: 'application/json', json: { error: 'Unauthorized' } }).state, 'error');
assert.equal(classifyLayerOutcome('monad', { status: 500, contentType: 'application/json', json: { ok: false, error: 'boom' } }).state, 'error');
assert.equal(classifyLayerOutcome('monad', { status: 404, contentType: 'application/json', json: { ok: false, error: 'PATH_NOT_FOUND' } }).state, 'error', 'a monad that answers its own 404 is alive');
assert.equal(classifyLayerOutcome('backend', { status: 200, contentType: 'application/json', json: { hello: 'world' } }).state, 'error', '200 JSON that is not the gateway shape');
// monad_not_found only means "off" for the monad probe
assert.equal(classifyLayerOutcome('backend', luaMonadNotFound).state, 'error');

// end to end through a fake fetch
const responses: Record<string, () => Response | Promise<Response>> = {
  'https://door.test/gateway-identity': () => new Response('<html>502</html>', { status: 502, headers: { 'content-type': 'text/html' } }),
  'https://door.test/apps/netget/__surface': () => new Response(JSON.stringify(luaMonadNotFound.json), { status: 404, headers: { 'content-type': 'application/json' } }),
};
const layers = await probeDoorLayers({
  origin: 'https://door.test/', monadTransport: 'https://door.test/apps/netget/',
  fetchImpl: (async (url: any) => { const make = responses[String(url)]; if (!make) throw new TypeError('connection refused'); return make(); }) as typeof fetch,
});
assert.equal(layers.nginx, 'up');
assert.equal(layers.backend, 'off');
assert.equal(layers.monad, 'off');
assert.match(layers.backendReason, /502/);
assert.match(layers.monadReason, /no monad is registered/);
assert.ok(layers.checkedAt);

// a refused connection is off, not an exception
const down = await probeDoorLayers({ origin: 'https://nowhere.test', monadTransport: 'https://nowhere.test/apps/netget', fetchImpl: (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch });
assert.equal(down.backend, 'off'); assert.equal(down.monad, 'off');

console.log('✔ doorLayers tests passed');
