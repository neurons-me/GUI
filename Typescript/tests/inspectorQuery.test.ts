import assert from 'node:assert/strict';
import { neighbours, relatedIds, resolveQuery, type RelationModel } from '../src/runtime/inspectorQuery';

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

// Sideways: the sibling before and after, in the model's order.
assert.deepEqual(neighbours(model, 'left'), { prev: 'sticky', next: 'right', at: 2, total: 5 });
// First and last have nothing on one side.
assert.deepEqual(neighbours(model, 'top'), { prev: null, next: 'sticky', at: 0, total: 5 });
assert.deepEqual(neighbours(model, 'footer'), { prev: 'right', next: null, at: 4, total: 5 });
// An only child, and the root, have nowhere to go sideways.
assert.deepEqual(neighbours(model, 'landing'), { prev: null, next: null, at: 0, total: 1 });
assert.deepEqual(neighbours(model, 'GUI'), { prev: null, next: null, at: 0, total: 1 });
// Children are the model's children, in its order.
assert.deepEqual(relatedIds(model, 'bars', 'children'), children.bars);
// The root has no parent and no siblings; a leaf has no children. Empty is empty.
assert.deepEqual(relatedIds(model, 'GUI', 'parent'), []);
assert.deepEqual(relatedIds(model, 'left', 'children'), []);
assert.deepEqual(relatedIds(model, 'left', 'parent'), ['bars']);
assert.deepEqual(relatedIds(model, 'left', 'self'), ['left']);

// A query is just its relation.
assert.deepEqual(resolveQuery(model, { axis: 'children', originId: 'content' }), ['landing']);
assert.deepEqual(resolveQuery(model, { axis: 'parent', originId: 'GUI' }), []);

console.log('inspectorQuery.test.ts: all assertions passed');
