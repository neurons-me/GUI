import assert from 'node:assert/strict';
import { around, type NavModel } from '../src/runtime/inspectorNav';

// GUI ─┬─ bars ─┬─ top / sticky / left / right / footer
//      └─ content ─ landing
const children: Record<string, string[]> = {
  GUI: ['bars', 'content'],
  bars: ['top', 'sticky', 'left', 'right', 'footer'],
  content: ['landing'],
  top: [], sticky: [], left: ['header', 'link'], right: [], footer: [], landing: [], header: [], link: [],
};
const parents: Record<string, string | null> = {
  GUI: null, bars: 'GUI', content: 'GUI',
  top: 'bars', sticky: 'bars', left: 'bars', right: 'bars', footer: 'bars', landing: 'content',
  header: 'left', link: 'left',
};
const model: NavModel = { parentOf: (id) => parents[id] ?? null, childrenOf: (id) => children[id] ?? [] };

// A node in the middle has all four ways out; child is the FIRST child.
assert.deepEqual(around(model, 'left'), { parent: 'bars', prev: 'sticky', next: 'right', child: 'header', at: 2, total: 5 });
// Ends of a row have nothing on one side.
assert.deepEqual(around(model, 'top'), { parent: 'bars', prev: null, next: 'sticky', child: null, at: 0, total: 5 });
assert.deepEqual(around(model, 'footer'), { parent: 'bars', prev: 'right', next: null, child: null, at: 4, total: 5 });
// An only child has no sideways move.
assert.deepEqual(around(model, 'landing'), { parent: 'content', prev: null, next: null, child: null, at: 0, total: 1 });
// The root has no parent and no siblings, only a way down.
assert.deepEqual(around(model, 'GUI'), { parent: null, prev: null, next: null, child: 'bars', at: 0, total: 1 });
// Going down then sideways reaches every child, not only the first.
let cur: string | null = around(model, 'left').child;
const seen: string[] = [];
while (cur) { seen.push(cur); cur = around(model, cur).next; }
assert.deepEqual(seen, children.left);

console.log('inspectorNav.test.ts: all assertions passed');
