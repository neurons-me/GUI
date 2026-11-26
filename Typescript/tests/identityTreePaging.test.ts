// The keys tree pages the same way in the identity card and outside it:
// "+" first, a block of children, "…" last (then "Show less" once everything
// is shown). Being inside the panel must not dump every child on one row.
import assert from 'node:assert/strict';
import { rowCapacity, visibleBlock } from '../src/gui/All.This/Cleaker/identityTreePaging';

const kids = (n: number) => Array.from({ length: n }, (_, i) => `k${i}`);
const none = () => false;

{
  const items = kids(12);
  const cap = 6;
  const first = visibleBlock(items, 1, cap, undefined, none);
  // room = cap - 1 slots after "+"; one of those is "…", so cap - 2 children.
  assert.equal(first.length, cap - 2);
  assert.deepEqual(first, items.slice(0, cap - 2));
  assert.ok(first.length < items.length, 'first block leaves a remainder for "…"');
  const all = visibleBlock(items, 4, cap, undefined, none);
  assert.equal(all.length, items.length);
  console.log('PASS visibleBlock first row is "+" + content + "…", not the whole list');
}

{
  // An open child that would fall past the first block stays visible.
  const items = kids(12);
  const cap = 6;
  const open = visibleBlock(items, 1, cap, undefined, (k) => k === 'k10');
  assert.ok(open.includes('k10'));
  assert.ok(open.length >= 11);
  console.log('PASS visibleBlock keeps an open child in view');
}

{
  // A known row width (360px, 40px nodes) still pages a long collection.
  const cap = rowCapacity(360, 40);
  assert.ok(cap >= 1 && cap < 12, `cap at 360px: ${cap}`);
  const shown = visibleBlock(kids(20), 1, cap, undefined, none);
  assert.ok(shown.length < 20, 'a 360px row does not show 20 children');
  console.log(`PASS rowCapacity(360) = ${cap}; first block shows ${shown.length} of 20`);
}

{
  // The old panel path set cap to 1e6 and skipped visibleBlock — that would
  // return every child. The function itself never does that for a real cap.
  const dumped = visibleBlock(kids(20), 1, 1e6, undefined, none);
  assert.equal(dumped.length, 20);
  const paged = visibleBlock(kids(20), 1, 8, undefined, none);
  assert.ok(paged.length < 20);
  console.log('PASS a real cap pages; only an inflated cap would dump the row');
}

console.log('identityTreePaging: no failures');
