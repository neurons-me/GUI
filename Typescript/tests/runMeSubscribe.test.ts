import assert from 'node:assert/strict';
import ME from 'this.me';
import { createMeRuntime } from '../src/runtime/run-me';

// Regression for duck-typed native subscribe detection in createMeRuntime.
//
// The .me proxy turns every unknown property into a semantic path, so
// `typeof me.subscribe === 'function'` holds even though ME instances have no
// subscribe method. Part A characterises the real kernel (this.me@4.1.0) so
// the hazard is pinned down precisely; Part B asserts the GUI runtime no longer
// writes to the kernel and documents both write paths honestly.

function newKernel(): any {
  return new (ME as any)();
}

function memoryPaths(me: any): string[] {
  return (me.memories as Array<{ path: string }>).map((m) => m.path);
}

function snapshotJson(me: any): string {
  return JSON.stringify(me.exportSnapshot());
}

function kernelCharacterisation() {
  // (a) `typeof me.subscribe` alone is a pure read: the proxy `get` trap only
  // builds a child path proxy. Nothing is committed.
  {
    const me = newKernel();
    me.a(1);
    const before = snapshotJson(me);
    const memoriesBefore = me.memories.length;
    assert.equal(typeof me.subscribe, 'function', 'proxy reports a callable for any unknown key');
    assert.equal(typeof me.subscribe, 'function');
    assert.equal(snapshotJson(me), before, '(a) typeof must not change kernel state');
    assert.equal(me.memories.length, memoriesBefore, '(a) typeof must not append a memory');
    assert.equal(me('subscribe'), undefined, '(a) no subscribe fact exists after typeof');
  }

  // (b) Invoking the fake method is an ordinary leaf write: subscribe = [path, callback].
  {
    const me = newKernel();
    me.a(1);
    const memoriesBefore = me.memories.length;
    const explainBefore = me.explain('subscribe');
    assert.equal(explainBefore.value, undefined);

    let calls = 0;
    const callback = () => {
      calls += 1;
    };
    const unsubscribe = me.subscribe('a', callback);

    assert.equal(me.memories.length, memoriesBefore + 1, '(b) invocation appends exactly one memory');
    assert.deepEqual(memoryPaths(me).slice(-1), ['subscribe']);
    const stored = me('subscribe');
    assert.ok(Array.isArray(stored), '(b) two args are normalised into an array value');
    assert.equal(stored[0], 'a');
    assert.equal(stored[1], callback, '(b) the live callback function is stored in the kernel');
    assert.deepEqual(me.explain('subscribe').value, ['a', callback]);
    assert.throws(() => me.exportSnapshot(), /could not be cloned/, '(b) the stored function breaks exportSnapshot');

    // The returned "unsubscribe" is just the chained path proxy for `subscribe`.
    assert.equal(typeof unsubscribe, 'function');

    // (c) The callback never fires on change: it was stored as data, not registered.
    me.a(2);
    me.b(3);
    assert.equal(calls, 0, '(c) callback never fires on kernel writes');

    // Calling the fake unsubscribe is a second write: subscribe = undefined.
    const memoriesBeforeUnsub = me.memories.length;
    unsubscribe();
    assert.equal(me.memories.length, memoriesBeforeUnsub + 1, 'fake unsubscribe appends another memory');
    assert.deepEqual(memoryPaths(me).slice(-1), ['subscribe']);
    assert.equal(me('subscribe'), undefined);
    assert.throws(() => me.exportSnapshot(), /could not be cloned/, 'callback still retained in memory log');
  }
}

function runtimeDoesNotWriteWithoutBridge() {
  const me = newKernel();
  me.a(1);
  const memoriesBefore = me.memories.length;
  const before = snapshotJson(me);

  const runtime = createMeRuntime(me as any);
  let calls = 0;
  const unsubscribe = runtime.subscribe('me/a', () => {
    calls += 1;
  });
  unsubscribe();

  assert.ok(!memoryPaths(me).includes('subscribe'), 'createMeRuntime must not write a `subscribe` fact');
  assert.equal(me.memories.length, memoriesBefore, 'subscribe/unsubscribe must not touch kernel memories');
  assert.equal(snapshotJson(me), before, 'kernel snapshot unchanged and still exportable');
  assert.equal(calls, 0);
}

function writePathThroughAdapterNotifies() {
  // Path (i): writes through the GUI adapter notify via the internal store.
  const me = newKernel();
  const runtime = createMeRuntime(me as any);
  let calls = 0;
  const unsubscribe = runtime.subscribe('me/count', () => {
    calls += 1;
  });
  const snapshotBefore = runtime.getSnapshot();

  runtime.action('me/count')(5);
  assert.equal(me('count'), 5, 'adapter action writes to the kernel');
  assert.equal(calls, 1, 'path (i): adapter write notifies subscribers');
  assert.equal(runtime.getSnapshot(), snapshotBefore + 1);

  runtime.notify();
  assert.equal(calls, 2, 'explicit notify() also reaches subscribers');

  unsubscribe();
  runtime.action('me/count')(6);
  assert.equal(calls, 2, 'unsubscribed listener is not called');
  assert.ok(!memoryPaths(me).includes('subscribe'));
}

function directKernelWriteIsNotObserved() {
  // Path (ii): writes made directly on the kernel bypass the adapter. this.me
  // exposes no per-instance change listener, so without an explicit bridge the
  // GUI is NOT notified. This documents the gap; it does not paper over it.
  const me = newKernel();
  const runtime = createMeRuntime(me as any);
  let calls = 0;
  runtime.subscribe('me/count', () => {
    calls += 1;
  });
  const snapshotBefore = runtime.getSnapshot();

  me.count(7);
  assert.equal(me('count'), 7, 'direct write landed in the kernel');
  assert.equal(calls, 0, 'path (ii): direct kernel write is not observed without a bridge');
  assert.equal(runtime.getSnapshot(), snapshotBefore, 'snapshot version unchanged');
  assert.equal(runtime.resolve('me/count'), 7, 'a fresh read still sees the value');

  // The existing escape hatch: whoever wrote outside the adapter calls notify().
  runtime.notify();
  assert.equal(calls, 1);
}

function explicitBridgeIsUsed() {
  // The explicit opts.subscribe bridge (MeRuntimeProvider's `subscribe` prop)
  // is the only way to wire external change sources.
  const me = newKernel();
  const bridgeListeners = new Map<string, Set<() => void>>();
  const bridgeCalls: string[] = [];
  const bridge = (path: string, cb: () => void) => {
    bridgeCalls.push(path);
    if (!bridgeListeners.has(path)) bridgeListeners.set(path, new Set());
    bridgeListeners.get(path)!.add(cb);
    return () => bridgeListeners.get(path)!.delete(cb);
  };

  const runtime = createMeRuntime(me as any, { subscribe: bridge });
  let calls = 0;
  const unsubscribe = runtime.subscribe('me/count', () => {
    calls += 1;
  });
  assert.deepEqual(bridgeCalls, ['me/count'], 'bridge receives the subscription');

  me.count(8);
  bridgeListeners.get('me/count')!.forEach((cb) => cb());
  assert.equal(calls, 1, 'bridge-driven change reaches the subscriber');

  runtime.action('me/count')(9);
  assert.equal(calls, 2, 'adapter writes still notify through the internal store');

  unsubscribe();
  assert.equal(bridgeListeners.get('me/count')!.size, 0, 'unsubscribe tears down the bridge registration');
  assert.ok(!memoryPaths(me).includes('subscribe'));
}

function main() {
  kernelCharacterisation();
  runtimeDoesNotWriteWithoutBridge();
  writePathThroughAdapterNotifies();
  directKernelWriteIsNotObserved();
  explicitBridgeIsUsed();
  console.log('runMeSubscribe.test.ts: all assertions passed');
}

main();
