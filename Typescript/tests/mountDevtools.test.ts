import assert from 'node:assert/strict';

// What a `devtools` option mounts (requested) and what starts ON (enabled). They are two decisions:
// `inspector: true` alone asks for BOTH, which is why frontend_local opened with the inspector on every load.
const { normalizeMountDevtools } = await import('../src/runtime/mount');

// the old frontend_local option: mounted AND on
const before = normalizeMountDevtools({ devtools: { inspector: true, inspectorToggleVisible: false } } as any);
assert.equal(before.inspectorRequested, true);
assert.equal(before.inspectorEnabled, true, 'inspector:true starts it ON (the behaviour being removed)');

// frontend_local now: mounted (so its Dev Tools launcher can switch it on) but OFF at load
const after = normalizeMountDevtools({ devtools: { enabled: true, inspector: false, adminView: false, inspectorToggleVisible: false } } as any);
assert.equal(after.requested, true, 'still mounted, so the wrench toggle keeps working');
assert.equal(after.inspectorRequested, true);
assert.equal(after.inspectorEnabled, false, 'starts OFF');
assert.equal(after.adminViewEnabled, false, 'admin view stays off too');
assert.equal(after.inspectorToggleVisible, false, 'no second floating toggle');

// an explicit false wins over a stored preference: the page does not reopen ON because of an old toggle
const store = new Map<string, string>([['gui.runtime.inspector.v2', 'true']]);
(globalThis as any).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: () => {}, removeItem: () => {} }, addEventListener() {}, dispatchEvent() {} };
const withStoredOn = normalizeMountDevtools({ devtools: { enabled: true, inspector: false } } as any);
assert.equal(withStoredOn.inspectorEnabled, false, 'a stored "true" does not override an explicit false');
// ...whereas leaving `inspector` unset defers to the stored preference (documented behaviour)
assert.equal(normalizeMountDevtools({ devtools: { enabled: true } } as any).inspectorEnabled, true);

// nothing requested: nothing mounted
assert.equal(normalizeMountDevtools({} as any).requested, false);
assert.equal(normalizeMountDevtools({ devtools: { inspector: false } } as any).requested, false);

console.log('mountDevtools.test.ts: all assertions passed');
