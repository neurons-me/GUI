// What netget consists of is what me.explain("door.netget") says it depends on.
import assert from 'node:assert/strict';
import { createDoorKernel, explainNetget } from '../src/react/session/doorKernel';
import type { DoorLayers } from '../src/react/session/doorLayers';

const layers = (backend: DoorLayers['backend'], monad: DoorLayers['monad'], reasons: [string, string] = ['', '']): DoorLayers => ({
  nginx: 'up', backend, monad, backendReason: reasons[0], monadReason: reasons[1], checkedAt: 1,
});
const read = (l: DoorLayers) => explainNetget(createDoorKernel(), l);
const decided = (l: DoorLayers) => { const { state, cause } = read(l); return { state, cause }; };

assert.deepEqual(decided(layers('up', 'up')), { state: 'up', cause: null });
// the first failing layer, in the order a request meets them, decides and is named
assert.deepEqual(decided(layers('off', 'off')), { state: 'off', cause: 'backend' });
assert.deepEqual(decided(layers('up', 'off')), { state: 'off', cause: 'monad' });
assert.deepEqual(decided(layers('error', 'off')), { state: 'error', cause: 'backend' });
assert.deepEqual(decided(layers('up', 'error')), { state: 'error', cause: 'monad' });
// still being read: not failing yet
assert.deepEqual(decided(layers('checking', 'checking')), { state: 'checking', cause: null });
assert.deepEqual(decided(layers('up', 'checking')), { state: 'checking', cause: null });
// a failure already known wins over a layer still being read
assert.deepEqual(decided(layers('checking', 'off')), { state: 'off', cause: 'monad' });

// the breakdown is what explain listed: the three layers, in request order, with what was read for each
const broken = read(layers('off', 'off', ['answered a page (200, text/html), not JSON', 'no monad is registered']));
assert.equal(broken.up, false);
assert.deepEqual(broken.layers.map((entry) => entry.layer), ['nginx', 'backend', 'monad']);
assert.equal(broken.layers[1].reason, 'answered a page (200, text/html), not JSON');
assert.equal(broken.layers[2].state, 'off');

// the derived value follows the readings, on the same kernel, and lists the same dependencies
const kernel = createDoorKernel();
assert.equal(explainNetget(kernel, layers('off', 'off')).up, false);
const healed = explainNetget(kernel, layers('up', 'up'));
assert.equal(healed.up, true);
assert.deepEqual(healed.layers.map((entry) => entry.layer), ['nginx', 'backend', 'monad']);
assert.deepEqual([...kernel.explain('door.netget').meta.dependsOn].sort(), ['door.backend.up', 'door.monad.up', 'door.nginx.up']);

console.log('netgetState: ok');
