import assert from 'node:assert/strict';
import {
  barModeFromCleaker,
  barModeToCleaker,
  CORNER_BAR,
  documentBarModes,
  nextBarMode,
  readBarModes,
  readStoredBarModes,
  writeBarMode,
} from '../src/gui/Layout/Position/barMode';

assert.equal(nextBarMode('off'), 'on');
assert.equal(nextBarMode('on'), 'expanded');
assert.equal(nextBarMode('expanded'), 'off');

assert.equal(barModeToCleaker('off'), 'closed');
assert.equal(barModeToCleaker('on'), 'icons');
assert.equal(barModeToCleaker('expanded'), 'open');
assert.equal(barModeFromCleaker('closed'), 'off');
assert.equal(barModeFromCleaker('icons'), 'on');
assert.equal(barModeFromCleaker('open'), 'expanded');

assert.deepEqual(CORNER_BAR, {
  'top-left': 'left',
  'top-right': 'top',
  'bottom-right': 'right',
  'bottom-left': 'bottom',
});

const declared = documentBarModes();
assert.equal(declared.top, 'on');
assert.equal(declared.left, 'on');
assert.equal(declared.right, 'off');
assert.equal(declared.bottom, 'off');

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  get length() { return this.data.size; }
}

const store = new MemoryStorage() as unknown as Storage;
assert.deepEqual(readStoredBarModes(store), {});
assert.deepEqual(readBarModes(store, declared), declared);

writeBarMode('left', 'expanded', store);
assert.deepEqual(readStoredBarModes(store), { left: 'expanded' });
assert.equal(readBarModes(store, declared).left, 'expanded');
assert.equal(readBarModes(store, declared).top, 'on');
assert.equal(JSON.parse(store.getItem('cleaker:bars') ?? '{}').left, 'open');
assert.equal(JSON.parse(store.getItem('GUI.window.layout.bars') ?? '{}').left, 'expanded');

writeBarMode('right', 'on', store);
assert.deepEqual(readStoredBarModes(store), { left: 'expanded', right: 'on' });
assert.equal(JSON.parse(store.getItem('cleaker:bars') ?? '{}').right, 'icons');

const legacyOnly = new MemoryStorage() as unknown as Storage;
legacyOnly.setItem('cleaker:bars', JSON.stringify({ top: 'closed', bottom: 'open' }));
assert.deepEqual(readStoredBarModes(legacyOnly), { top: 'off', bottom: 'expanded' });

console.log('barMode.test.ts: ok');
