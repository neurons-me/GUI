import assert from 'node:assert/strict';
import ME from 'this.me';
import { createMeRuntime } from '../src/runtime/run-me';

// Regression: a spec node's { read: 'me/x' } is rendered by RuntimeResolvedNode
// (src/runtime/renderer.ts) through useSyncExternalStore(subscribe, getSnapshot),
// with subscribe = runtime.subscribe(expr, cb) and getSnapshot =
// runtime.getSnapshot(expr). React re-renders only when getSnapshot() changes
// after a subscriber callback (Object.is). A page that writes to .me directly
// and then fires its explicit subscribe bridge (the Veracruz port does this
// after each flush) must therefore see a NEW snapshot -- without calling
// runtime.notify(). Before the fix the snapshot only moved on action()/notify(),
// so the read stayed stale. No DOM environment exists in this package, so the
// test exercises the exact store contract the hook relies on.

function readNode(runtime: any, expr: string) {
  let snapshot = runtime.getSnapshot(expr);
  let value = runtime.resolve(expr);
  let renders = 0;
  // useSyncExternalStore's check: re-render iff the snapshot changed.
  const onStoreChange = () => {
    const next = runtime.getSnapshot(expr);
    if (Object.is(next, snapshot)) return;
    snapshot = next;
    value = runtime.resolve(expr);
    renders += 1;
  };
  const unsubscribe = runtime.subscribe(expr, onStoreChange);
  return { get value() { return value; }, get renders() { return renders; }, unsubscribe };
}

function bridgeNotifyUpdatesReadWithoutRuntimeNotify() {
  const me: any = new (ME as any)();
  me.ships[1].remaining(5);

  // The page's bridge: listeners keyed by the path the runtime subscribes with.
  const listeners = new Map<string, Set<() => void>>();
  const bridge = (path: string, cb: () => void) => {
    let set = listeners.get(path);
    if (!set) listeners.set(path, (set = new Set()));
    set.add(cb);
    return () => { set!.delete(cb); if (!set!.size) listeners.delete(path); };
  };
  const runtime: any = createMeRuntime(me, { subscribe: bridge });
  let notifyCalls = 0;
  const realNotify = runtime.notify;
  runtime.notify = () => { notifyCalls += 1; realNotify(); };

  const node = readNode(runtime, 'me/ships.1.remaining');
  assert.equal(node.value, 5);
  assert.deepEqual([...listeners.keys()], ['me/ships.1.remaining'], 'bridge receives the read expression');

  // Write DIRECTLY to .me, then fire the bridge as the page does after a flush.
  me.ships[1].remaining(3);
  listeners.get('me/ships.1.remaining')!.forEach((cb) => cb());

  assert.equal(notifyCalls, 0, 'runtime.notify() was not used');
  assert.equal(node.renders, 1, 'bridge notification produced a new snapshot (one re-render)');
  assert.equal(node.value, 3, '{read} shows the value written to .me');

  // A second wave keeps working; an untouched sibling is not re-rendered by it.
  const other = readNode(runtime, 'me/ships.2.remaining');
  me.ships[1].remaining(1);
  listeners.get('me/ships.1.remaining')!.forEach((cb) => cb());
  assert.equal(node.value, 1);
  assert.equal(node.renders, 2);
  assert.equal(other.renders, 0, 'only subscribers of the announced path are called');

  node.unsubscribe();
  other.unsubscribe();
  assert.equal(listeners.size, 0, 'unsubscribe releases the bridge');
  assert.equal(me('subscribe'), undefined, 'no subscribe fact written to the kernel');
}

bridgeNotifyUpdatesReadWithoutRuntimeNotify();
console.log('runMeBridgeSnapshot: ok');
