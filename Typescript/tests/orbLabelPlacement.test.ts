import assert from 'node:assert/strict';
import { placeOrbLabel } from '../src/gui/All.This/monad.ai/orbLabelPlacement';

const vp = { width: 800, height: 600 };
const label = { width: 72, height: 26 };
const orb = (cx: number, top = 200) => ({ left: cx - 30, top, width: 60, height: 60 });

// with room: starts a little left of the orb's centre and extends to the right, above the orb
let p = placeOrbLabel(orb(400), label, vp);
assert.equal(p.left, 400 - 12);
assert.equal(p.top, 200 - 8 - 26);
assert.ok(p.left + label.width <= vp.width - 8);

// the right margin is short: it slides left until it fits, inside the margin
p = placeOrbLabel(orb(780), label, vp);
assert.equal(p.left, 800 - 8 - 72);
assert.ok(p.left + label.width <= 800 - 8);

// the orb is at the left edge: never beyond the left margin
p = placeOrbLabel(orb(5), label, vp);
assert.equal(p.left, 8);

// no room above: below the orb
p = placeOrbLabel(orb(400, 10), label, vp);
assert.equal(p.top, 10 + 60 + 8);

// a viewport narrower than the label: capped to the viewport (the element ellipsizes), still at the margin
p = placeOrbLabel(orb(100), { width: 300, height: 26 }, { width: 200, height: 600 });
assert.equal(p.left, 8);
assert.equal(p.maxWidth, 200 - 16);

console.log('orbLabelPlacement: ok');
