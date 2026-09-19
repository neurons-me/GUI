import assert from 'node:assert/strict';
import { pickIds, relatedIds, resolveQuery, type RelationModel } from '../src/runtime/inspectorQuery';

// GUI ─┬─ bars ─┬─ top / sticky / left / right / footer
//      └─ content ─ landing
const children: Record<string, string[]> = {
  GUI: ['bars', 'content'],
  bars: ['top', 'sticky', 'left', 'right', 'footer'],
  content: ['landing'],
  top: [], sticky: [], left: [], right: [], footer: [], landing: [],
};
const parents: Record<string, string | null> = {
  GUI: null, bars: 'GUI', content: 'GUI',
  top: 'bars', sticky: 'bars', left: 'bars', right: 'bars', footer: 'bars', landing: 'content',
};
const model: RelationModel = { parentOf: (id) => parents[id] ?? null, childrenOf: (id) => children[id] ?? [] };

// Siblings exclude the node itself.
assert.deepEqual(relatedIds(model, 'left', 'siblings'), ['top', 'sticky', 'right', 'footer']);
// The root has no parent and no siblings; a leaf has no children. Empty is empty.
assert.deepEqual(relatedIds(model, 'GUI', 'parent'), []);
assert.deepEqual(relatedIds(model, 'GUI', 'siblings'), []);
assert.deepEqual(relatedIds(model, 'left', 'children'), []);
assert.deepEqual(relatedIds(model, 'left', 'parent'), ['bars']);
assert.deepEqual(relatedIds(model, 'left', 'self'), ['left']);

const bars = children.bars;
// All keeps the model's order; First/Last are the ends of that same order.
assert.deepEqual(pickIds(bars, 'all', 0.5), bars);
assert.deepEqual(pickIds(bars, 'first', 0.9), ['top']);
assert.deepEqual(pickIds(bars, 'last', 0.1), ['footer']);
// Random is a pure function of the seed: same seed, same node, every time.
assert.deepEqual(pickIds(bars, 'random', 0.5), pickIds(bars, 'random', 0.5));
assert.deepEqual(pickIds(bars, 'random', 0), ['top']);
assert.deepEqual(pickIds(bars, 'random', 0.999999), ['footer']);
assert.deepEqual(pickIds(bars, 'random', 0.5), ['left']);
// Out-of-range / non-finite seeds cannot index out of bounds.
assert.equal(pickIds(bars, 'random', 1).length, 1);
assert.equal(pickIds(bars, 'random', -3).length, 1);
assert.equal(pickIds(bars, 'random', NaN).length, 1);
// An empty set stays empty for every pick -- nothing else is chosen.
for (const pick of ['all', 'first', 'last', 'random'] as const) {
  assert.deepEqual(pickIds([], pick, 0.5), []);
}

// A whole query: candidates before picking, result after.
const q = resolveQuery(model, { axis: 'siblings', originId: 'left', pick: 'last', seed: 0.3 });
assert.deepEqual(q.candidates, ['top', 'sticky', 'right', 'footer']);
assert.deepEqual(q.result, ['footer']);
const empty = resolveQuery(model, { axis: 'parent', originId: 'GUI', pick: 'first', seed: 0.3 });
assert.deepEqual(empty, { candidates: [], result: [] });

console.log('inspectorQuery.test.ts: all assertions passed');
