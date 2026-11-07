// The two marks in the bars (Roles-and-Territories.md §3): the person places their QR, the brand takes the other end.
import assert from 'node:assert/strict';
import { MARK_CORNERS, placeMarks, type MarkCorner } from '../src/gui/Layout/Position/placeMarks';

const both = { top: true, left: true };
const wide = (identity: MarkCorner, bars = both, brand = true) => placeMarks({ identity, bars, brand });

// top + left bars (AppShell, netget): the QR where the person puts it, the brand at the other end of the same edge
assert.deepEqual(wide('top-left'), { identity: 'left.brand', brand: 'top.end' });
assert.deepEqual(wide('top-right'), { identity: 'top.end', brand: 'left.brand' });
// bottom-left: its mirror (bottom-right) has no bar, so the diagonal (top-right)
assert.deepEqual(wide('bottom-left'), { identity: 'left.footer', brand: 'top.end' });
// bottom-right: no bar holds it, the QR floats there; the brand takes its mirror (bottom-left, the left bar's foot)
assert.deepEqual(wide('bottom-right'), { identity: 'float:bottom-right', brand: 'left.footer' });

// only a top bar
assert.deepEqual(wide('top-left', { top: true, left: false }), { identity: 'top.start', brand: 'top.end' });
assert.deepEqual(wide('top-right', { top: true, left: false }), { identity: 'top.end', brand: 'top.start' });
// only a left bar: top-left's mirror and diagonal have no bar, so the first free place
assert.deepEqual(wide('top-left', { top: false, left: true }), { identity: 'left.brand', brand: 'left.footer' });

// the marks never share a cell, whatever the corner and bars
for (const identity of MARK_CORNERS) {
  for (const bars of [both, { top: true, left: false }, { top: false, left: true }]) {
    for (const narrow of [false, true]) {
      const p = placeMarks({ identity, bars, narrow });
      assert.notEqual(p.identity, p.brand, `${identity} ${JSON.stringify(bars)} narrow=${narrow}`);
    }
  }
}

// no brand: only the QR is placed
assert.deepEqual(wide('top-left', both, false), { identity: 'left.brand', brand: 'none' });
// no bars: the scannable corner QR, no brand to place
assert.deepEqual(placeMarks({ identity: 'bottom-right', bars: { top: false, left: false } }), { identity: 'corner', brand: 'none' });

// narrow: the QR in the top bar at the person's end, the brand leads the drawer
assert.deepEqual(placeMarks({ identity: 'top-left', bars: both, narrow: true }), { identity: 'top.start', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'bottom-right', bars: both, narrow: true }), { identity: 'top.end', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'top-left', bars: { top: true, left: false }, narrow: true }), { identity: 'top.start', brand: 'top.end' });

// the placement depends on the corner, the bars and the width only: the same input, the same answer
assert.deepEqual(wide('top-left'), wide('top-left'));

console.log('placeMarks: ok');
