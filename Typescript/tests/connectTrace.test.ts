import assert from 'node:assert/strict';
import { createTrace, layerEntries, doorIsUp } from '../src/react/session/connectTrace';
import { DOOR_LAYERS_CHECKING, type DoorLayers } from '../src/react/session/doorLayers';

const seen: string[] = [];
const trace = createTrace({ max: 3, sink: (e) => seen.push(`${e.step}:${e.outcome}`) });
trace.record({ expression: 'localhost', step: 'a', outcome: 'info', at: 1 });
trace.record({ expression: 'localhost', step: 'b', outcome: 'off', detail: 'nothing answered', at: 2 });
trace.record({ expression: 'localhost', step: 'c', outcome: 'ok', at: 3 });
trace.record({ expression: 'localhost', step: 'd', outcome: 'error', at: 4 });
assert.deepEqual(trace.entries().map((e) => e.step), ['b', 'c', 'd'], 'the buffer keeps the last `max` entries');
assert.equal(trace.entries()[0].detail, 'nothing answered');
assert.equal(trace.entries()[1].detail, '', 'detail defaults to empty');
assert.deepEqual(seen, ['a:info', 'b:off', 'c:ok', 'd:error'], 'every entry reaches the sink, including ones the buffer later drops');
trace.clear();
assert.deepEqual(trace.entries(), []);

// a sink that throws never breaks recording
const bad = createTrace({ sink: () => { throw new Error('sink'); } });
assert.equal(bad.record({ expression: 'x', step: 's', outcome: 'ok' }).step, 's');

// the layers as steps
const off: DoorLayers = { ...DOOR_LAYERS_CHECKING, backend: 'off', monad: 'off', backendReason: 'no backend', monadReason: 'monad_not_found', checkedAt: 1 };
assert.deepEqual(layerEntries('localhost', off).map((e) => `${e.step}:${e.outcome}`), ['nginx:ok', 'backend:off', 'monad:off']);
assert.equal(layerEntries('localhost', off)[2].detail, 'monad_not_found');
const err: DoorLayers = { ...off, backend: 'up', monad: 'error' };
assert.equal(layerEntries('localhost', err)[2].outcome, 'error');
assert.equal(doorIsUp({ ...off, backend: 'up', monad: 'up' }), true);
assert.equal(doorIsUp(err), false);
assert.equal(doorIsUp(DOOR_LAYERS_CHECKING), false, 'still checking is not up');

// reachable from the console
const { connectTrace } = await import('../src/react/session/connectTrace');
assert.equal((globalThis as any)['GUI-QR-TRACE'], connectTrace);
console.log('connectTrace: ok');
