import assert from 'node:assert/strict';
import { netgetState } from '../src/gui/All.This/netget/Door/DoorLayersPanel';
import type { DoorLayers } from '../src/react/session/doorLayers';

const layers = (backend: DoorLayers['backend'], monad: DoorLayers['monad']): DoorLayers => ({ nginx: 'up', backend, monad, backendReason: '', monadReason: '', checkedAt: 1 });

assert.deepEqual(netgetState(layers('up', 'up')), { state: 'up', cause: null });
// the first failing layer, in the order a request meets them, decides and is named
assert.deepEqual(netgetState(layers('off', 'off')), { state: 'off', cause: 'backend' });
assert.deepEqual(netgetState(layers('up', 'off')), { state: 'off', cause: 'monad' });
assert.deepEqual(netgetState(layers('error', 'off')), { state: 'error', cause: 'backend' });
assert.deepEqual(netgetState(layers('up', 'error')), { state: 'error', cause: 'monad' });
// still being read: not failing yet
assert.deepEqual(netgetState(layers('checking', 'checking')), { state: 'checking', cause: null });
assert.deepEqual(netgetState(layers('up', 'checking')), { state: 'checking', cause: null });
// a failure already known wins over a layer still being read
assert.deepEqual(netgetState(layers('checking', 'off')), { state: 'off', cause: 'monad' });
console.log('netgetState: ok');
