import assert from 'node:assert/strict';
import { relatedIds, resolveQuery, type RelationModel } from '../src/runtime/inspectorQuery';

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

// Siblings exclude the node itself, and keep the model's order.
assert.deepEqual(relatedIds(model, 'left', 'siblings'), ['top', 'sticky', 'right', 'footer']);
// Children are the model's children, in its order.
assert.deepEqual(relatedIds(model, 'bars', 'children'), children.bars);
// The root has no parent and no siblings; a leaf has no children. Empty is empty.
assert.deepEqual(relatedIds(model, 'GUI', 'parent'), []);
assert.deepEqual(relatedIds(model, 'GUI', 'siblings'), []);
assert.deepEqual(relatedIds(model, 'left', 'children'), []);
assert.deepEqual(relatedIds(model, 'left', 'parent'), ['bars']);
assert.deepEqual(relatedIds(model, 'left', 'self'), ['left']);

// A query is just its relation.
assert.deepEqual(resolveQuery(model, { axis: 'siblings', originId: 'left' }), ['top', 'sticky', 'right', 'footer']);
assert.deepEqual(resolveQuery(model, { axis: 'parent', originId: 'GUI' }), []);

console.log('inspectorQuery.test.ts: all assertions passed');
