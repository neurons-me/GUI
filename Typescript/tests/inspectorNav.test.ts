import assert from 'node:assert/strict';
import { around, linkTree, type NavModel } from '../src/runtime/inspectorNav';

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

// ---- linkTree: everything must go up to the root and down from it ----
const climb = (parents: Map<string, string | null>, id: string) => {
  const chain: string[] = [];
  let cur: string | null = id;
  while (cur && chain.length < 50) { chain.push(cur); cur = parents.get(cur) ?? null; }
  return chain;
};
const reachDown = (parents: Map<string, string | null>, root: string) => {
  const kids = new Map<string, string[]>();
  parents.forEach((p, c) => { if (p) kids.set(p, [...(kids.get(p) ?? []), c]); });
  const seen = new Set<string>();
  const walk = (id: string) => { if (seen.has(id)) return; seen.add(id); (kids.get(id) ?? []).forEach(walk); };
  walk(root);
  return seen;
};
{
  // A healthy tree: nothing orphaned, everything climbs to GUI and is reached from it.
  const ids = ['GUI', 'GUI.bars', 'GUI.bars.left', 'GUI.bars.left.link.0', 'GUI.content'];
  const dom: Record<string, string> = { 'GUI.bars.left.link.0': 'GUI.bars.left' };
  const decl: Record<string, string> = { 'GUI.bars': 'GUI', 'GUI.bars.left': 'GUI.bars', 'GUI.content': 'GUI' };
  const { parents, orphans } = linkTree({ ids, declaredParent: (i) => decl[i], domParent: (i) => dom[i], root: 'GUI' });
  assert.deepEqual(orphans, []);
  for (const id of ids) assert.equal(climb(parents, id).at(-1), 'GUI');
  assert.equal(reachDown(parents, 'GUI').size, ids.length);
}
{
  // A part with no declared parent and no element (a table's empty-state) is
  // filed under the node its id is a path under -- not orphaned.
  const ids = ['GUI', 'GUI.content', 'GUI.content.users.table', 'GUI.content.users.table/empty-state', 'GUI.content.users.table/rows/x'];
  const { parents, orphans } = linkTree({ ids, declaredParent: (i) => (i === 'GUI.content' ? 'GUI' : i === 'GUI.content.users.table' ? 'GUI.content' : null), domParent: () => null, root: 'GUI' });
  assert.equal(parents.get('GUI.content.users.table/empty-state'), 'GUI.content.users.table');
  assert.equal(parents.get('GUI.content.users.table/rows/x'), 'GUI.content.users.table');
  assert.deepEqual(orphans, []);
}
{
  // No parent at all, a parent that does not exist, and a cycle: all end up
  // reachable from the root, and all are reported as orphans.
  const ids = ['GUI', 'lonely', 'ghost.child', 'a', 'b'];
  const decl: Record<string, string> = { 'ghost.child': 'ghost', a: 'b', b: 'a' };
  const { parents, orphans } = linkTree({ ids, declaredParent: (i) => decl[i], domParent: () => null, root: 'GUI' });
  assert.ok(orphans.includes('lonely') && orphans.includes('ghost.child'));
  assert.ok(orphans.includes('a') || orphans.includes('b'));
  for (const id of ids) assert.equal(climb(parents, id).at(-1), 'GUI', `${id} climbs to the root`);
  assert.equal(reachDown(parents, 'GUI').size, ids.length, 'everything is reached going down');
}

console.log('inspectorNav.test.ts: all assertions passed');
