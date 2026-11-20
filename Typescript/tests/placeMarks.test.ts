// The two marks in the bars (Roles-and-Territories.md §3): the person places their QR, the brand takes the other end.
// When a brandCorner is declared the two are independent, but they never share a cell: a collision jumps the other
// mark by the same opposition rule (`opposingCorner`).
import assert from 'node:assert/strict';
import { MARK_CORNERS, arrangeMove, cornerOfSlot, evictMarkCorner, honorsMarkCorner, opposingCorner, placeMarks, resolveMarkCorners, slotEdge, slotForCorner, type MarkCorner } from '../src/gui/Layout/Position/placeMarks';

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

// the marks never share a cell, whatever the corner and bars — default (no brandCorner)
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
// narrow, no top bar: with a brand handle, every chosen corner is a distinct content-area float
assert.deepEqual(placeMarks({ identity: 'top-left', bars: { top: false, left: true }, narrow: true }), { identity: 'float:top-left', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'top-left', bars: { top: false, left: true }, narrow: true, brand: false }), { identity: 'left.brand', brand: 'none' });
assert.deepEqual(placeMarks({ identity: 'top-right', bars: { top: false, left: true }, narrow: true }), { identity: 'float:top-right', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'bottom-right', bars: { top: false, left: true }, narrow: true }), { identity: 'float:bottom-right', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'bottom-left', bars: { top: false, left: true }, narrow: true }), { identity: 'float:bottom-left', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'top-right', bars: { top: false, left: true }, narrow: true, brand: false }), { identity: 'float:top-right', brand: 'none' });
// declared brand at bottom-left: QR at top-left floats in the content area; the brand takes the footer
assert.deepEqual(
  placeMarks({ identity: 'top-left', bars: { top: false, left: true }, narrow: true, brandCorner: 'bottom-left' }),
  { identity: 'float:top-left', brand: 'left.footer' },
);
assert.deepEqual(
  placeMarks({ identity: 'top-right', bars: { top: false, left: true }, narrow: true, brandCorner: 'bottom-left' }),
  { identity: 'float:top-right', brand: 'left.footer' },
);

// the placement depends on the corner, the bars and the width only: the same input, the same answer
assert.deepEqual(wide('top-left'), wide('top-left'));

// declared brandCorner: independent of the QR
assert.deepEqual(
  placeMarks({ identity: 'top-left', bars: both, brandCorner: 'bottom-left' }),
  { identity: 'left.brand', brand: 'left.footer' },
);
assert.deepEqual(
  placeMarks({ identity: 'top-right', bars: both, brandCorner: 'bottom-right' }),
  { identity: 'top.end', brand: 'float:bottom-right' },
);
assert.deepEqual(
  placeMarks({ identity: 'bottom-right', bars: both, brandCorner: 'top-right' }),
  { identity: 'float:bottom-right', brand: 'top.end' },
);

// opposingCorner IS the default brand placement (mirror, else diagonal, else first free)
assert.equal(opposingCorner('top-left', both), 'top-right');
assert.equal(opposingCorner('top-right', both), 'top-left');
assert.equal(opposingCorner('bottom-left', both), 'top-right');
assert.equal(opposingCorner('bottom-right', both), 'bottom-left');
assert.equal(opposingCorner('top-left', { top: true, left: false }), 'top-right');
assert.equal(opposingCorner('top-left', { top: false, left: true }), 'bottom-left');
for (const at of MARK_CORNERS) {
  const def = placeMarks({ identity: at, bars: both });
  assert.equal(opposingCorner(at, both), cornerOfSlot(def.brand, at), `opposingCorner(${at}) is default brand`);
}

// same declared corner: never share — placeMarks safety jumps the brand by that same rule
assert.deepEqual(
  placeMarks({ identity: 'top-left', bars: both, brandCorner: 'top-left' }),
  { identity: 'left.brand', brand: 'top.end' },
);
assert.deepEqual(
  placeMarks({ identity: 'bottom-right', bars: both, brandCorner: 'bottom-right' }),
  { identity: 'float:bottom-right', brand: 'left.footer' },
);
assert.deepEqual(
  placeMarks({ identity: 'top-right', bars: both, brandCorner: 'top-right' }),
  { identity: 'top.end', brand: 'left.brand' },
);
assert.deepEqual(
  placeMarks({ identity: 'bottom-left', bars: both, brandCorner: 'bottom-left' }),
  { identity: 'left.footer', brand: 'top.end' },
);

// resolveMarkCorners: the one that just moved stays, the other jumps
// QR moved onto the brand (was top-left, brand was top-right; QR is now top-right) → brand jumps to top-left
assert.deepEqual(
  resolveMarkCorners('top-right', 'top-right', both, { identity: 'top-left', brandCorner: 'top-right' }),
  { identity: 'top-right', brandCorner: 'top-left' },
);
// brand moved onto the QR (QR was top-left, brand was top-right; brand is now top-left) → QR jumps to top-right
assert.deepEqual(
  resolveMarkCorners('top-left', 'top-left', both, { identity: 'top-left', brandCorner: 'top-right' }),
  { identity: 'top-right', brandCorner: 'top-left' },
);
// QR moved onto brand at bottom-left → brand jumps to top-right (diagonal; mirror has no bar)
assert.deepEqual(
  resolveMarkCorners('bottom-left', 'bottom-left', both, { identity: 'top-right', brandCorner: 'bottom-left' }),
  { identity: 'bottom-left', brandCorner: 'top-right' },
);
// brand moved onto QR at bottom-right → QR jumps to bottom-left (mirror)
assert.deepEqual(
  resolveMarkCorners('bottom-right', 'bottom-right', both, { identity: 'bottom-right', brandCorner: 'top-left' }),
  { identity: 'bottom-left', brandCorner: 'bottom-right' },
);
// unknown who moved (no prev): brand jumps, the historical default
assert.deepEqual(
  resolveMarkCorners('top-left', 'top-left', both),
  { identity: 'top-left', brandCorner: 'top-right' },
);
// no collision: unchanged
assert.deepEqual(
  resolveMarkCorners('top-left', 'bottom-left', both, { identity: 'top-left', brandCorner: 'top-right' }),
  { identity: 'top-left', brandCorner: 'bottom-left' },
);

// never share a cell for any independent pair (including collisions)
for (const identity of MARK_CORNERS) {
  for (const brandCorner of MARK_CORNERS) {
    for (const bars of [both, { top: true, left: false }, { top: false, left: true }]) {
      for (const narrow of [false, true]) {
        const p = placeMarks({ identity, bars, narrow, brandCorner });
        assert.notEqual(p.identity, p.brand, `share ${identity} / ${brandCorner} ${JSON.stringify(bars)} narrow=${narrow}`);
      }
    }
  }
}

// narrow + declared brandCorner: QR stays in the top bar, brand honors its corner when free
assert.deepEqual(
  placeMarks({ identity: 'top-left', bars: both, narrow: true, brandCorner: 'bottom-left' }),
  { identity: 'top.start', brand: 'left.footer' },
);
assert.deepEqual(
  placeMarks({ identity: 'top-left', bars: both, narrow: true, brandCorner: 'top-right' }),
  { identity: 'top.start', brand: 'top.end' },
);
// narrow + same corner: brand jumps to the opposed corner (top-right), not into the drawer under the same place
assert.deepEqual(
  placeMarks({ identity: 'top-left', bars: both, narrow: true, brandCorner: 'top-left' }),
  { identity: 'top.start', brand: 'top.end' },
);

// with a right bar: top-right is the right bar's head, the counterpart of left.brand
const withRight = { top: true, left: true, right: true };
assert.deepEqual(placeMarks({ identity: 'top-left', bars: withRight }), { identity: 'left.brand', brand: 'right.brand' });
assert.deepEqual(placeMarks({ identity: 'top-right', bars: withRight }), { identity: 'right.brand', brand: 'left.brand' });
assert.deepEqual(placeMarks({ identity: 'bottom-right', bars: withRight }), { identity: 'right.footer', brand: 'left.footer' });
// bottom-left: its mirror (bottom-right) now has a bar, so the brand takes right.footer (the same opposition rule)
assert.deepEqual(placeMarks({ identity: 'bottom-left', bars: withRight }), { identity: 'left.footer', brand: 'right.footer' });
assert.equal(opposingCorner('top-left', withRight), 'top-right');
assert.equal(opposingCorner('top-right', withRight), 'top-left');
assert.equal(opposingCorner('bottom-right', withRight), 'bottom-left');
assert.equal(opposingCorner('bottom-left', withRight), 'bottom-right');
assert.equal(slotEdge('right.brand'), 'right');
assert.equal(slotEdge('right.footer'), 'right');
assert.equal(cornerOfSlot('right.brand', 'top-left'), 'top-right');
assert.equal(cornerOfSlot('right.footer', 'top-left'), 'bottom-right');
assert.equal(slotForCorner('top-right', withRight), 'right.brand');
assert.equal(slotForCorner('bottom-right', withRight), 'right.footer');
// never share, including when a right bar is present
for (const identity of MARK_CORNERS) {
  for (const brandCorner of [...MARK_CORNERS, undefined]) {
    const p = placeMarks({ identity, bars: withRight, brandCorner: brandCorner as MarkCorner | undefined });
    assert.notEqual(p.identity, p.brand, `right-bar share ${identity} / ${brandCorner}`);
  }
}

assert.equal(cornerOfSlot('left.brand', 'top-right'), 'top-left');
assert.equal(cornerOfSlot('top.end', 'top-left'), 'top-right');
assert.equal(cornerOfSlot('left.footer', 'top-left'), 'bottom-left');
assert.equal(cornerOfSlot('float:bottom-right', 'top-left'), 'bottom-right');
assert.equal(slotForCorner('bottom-right', both), 'float:bottom-right');
assert.equal(slotEdge('top.end'), 'right');
assert.equal(slotEdge('left.brand'), 'left');
assert.equal(slotEdge('float:bottom-right'), 'right');
assert.equal(slotEdge('none'), 'none');

console.log('placeMarks: ok');

const barsWide = { top: true, left: true };
assert.equal(honorsMarkCorner('identity', 'bottom-right', { identity: 'top-left', bars: barsWide, brand: true, brandCorner: 'top-right' }), true);
assert.equal(honorsMarkCorner('brand', 'bottom-left', { identity: 'top-left', bars: barsWide, brand: true }), true);
// narrow + top bar: the QR only sits at the top start/end, so a bottom cell is not honored
assert.equal(honorsMarkCorner('identity', 'bottom-left', { identity: 'top-left', bars: both, narrow: true, brand: true }), false);
assert.equal(honorsMarkCorner('identity', 'top-right', { identity: 'top-left', bars: both, narrow: true, brand: true }), true);
// narrow, no top: brand can be the handle or the footer, not a right-side float
assert.equal(honorsMarkCorner('brand', 'bottom-left', { identity: 'top-right', bars: { top: false, left: true }, narrow: true, brand: true }), true);
assert.equal(honorsMarkCorner('brand', 'top-right', { identity: 'bottom-left', bars: { top: false, left: true }, narrow: true, brand: true }), false);
assert.equal(honorsMarkCorner('brand', 'top-left', { identity: 'top-right', bars: barsWide, brand: false }), false);
console.log('honorsMarkCorner: ok');

const leftOnly = { top: false, left: true };
// empty cell: only the moving mark changes
assert.deepEqual(
  arrangeMove('identity', 'top-right', { identity: 'top-left', brand: 'bottom-left' }, { bars: barsWide, brand: true }),
  { identity: 'top-right', brand: 'bottom-left' },
);
assert.deepEqual(
  arrangeMove('brand', 'bottom-right', { identity: 'top-left', brand: 'bottom-left' }, { bars: barsWide, brand: true }),
  { identity: 'top-left', brand: 'bottom-right' },
);
// drop onto the other tile: swap when both landings are honored
assert.deepEqual(
  arrangeMove('identity', 'bottom-left', { identity: 'top-right', brand: 'bottom-left' }, { bars: barsWide, brand: true }),
  { identity: 'bottom-left', brand: 'top-right' },
);
assert.deepEqual(
  arrangeMove('brand', 'top-right', { identity: 'top-right', brand: 'bottom-left' }, { bars: barsWide, brand: true }),
  { identity: 'bottom-left', brand: 'top-right' },
);
// narrow, no top: brand cannot take a right-side float, so moving the QR onto
// the brand evicts the brand to a valid left cell instead of refusing
assert.deepEqual(
  arrangeMove('identity', 'bottom-left', { identity: 'bottom-right', brand: 'bottom-left' }, { bars: leftOnly, narrow: true, brand: true }),
  { identity: 'bottom-left', brand: 'top-left' },
);
assert.equal(
  evictMarkCorner('brand', 'bottom-left', { identity: 'bottom-left', bars: leftOnly, narrow: true, brand: true }),
  'top-left',
);
// a corner the moving mark itself cannot occupy stays not droppable
assert.equal(
  arrangeMove('brand', 'top-right', { identity: 'bottom-left', brand: 'top-left' }, { bars: leftOnly, narrow: true, brand: true }),
  null,
);
assert.equal(
  arrangeMove('identity', 'bottom-left', { identity: 'top-left', brand: 'top-right' }, { bars: both, narrow: true, brand: true }),
  null,
);
console.log('arrangeMove: ok');
