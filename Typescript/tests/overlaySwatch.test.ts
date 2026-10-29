import assert from 'node:assert/strict';
import {
  colorToHsl, dragTo, hslString, readSaved, resolveState, rgbToHsl, writeSaved, HUE_PER_PX, OPACITY_PER_PX,
} from '../src/gui/Theme/OverlaySwatch/overlaySwatchCore';

assert.equal(HUE_PER_PX, 1);
assert.equal(OPACITY_PER_PX, 0.6);
// suign.github.io default rgb(115 173 156)
const d = rgbToHsl(115, 173, 156);
assert.ok(Math.abs(d.h - 162.4) < 0.1);
assert.deepEqual(colorToHsl('#73ad9c'), d);
assert.deepEqual(colorToHsl('rgb(115, 173, 156)'), d);

// drag: right = +hue (wraps), up = +opacity (clamped)
assert.deepEqual(dragTo({ h: 350, a: 50 }, 20, -10), { h: 10, a: 56 });
assert.deepEqual(dragTo({ h: 10, a: 95 }, -30, -100), { h: 340, a: 100 });
assert.equal(dragTo({ h: 0, a: 5 }, 0, 100).a, 0);
assert.equal(hslString({ h: 1, s: 2, l: 3 }, 50), 'hsl(1.0 2.0% 3.0% / 50%)');

// per-theme persistence: theme default wins until the user drags under that theme
const mem: Record<string, string> = {};
const s = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
assert.equal(readSaved('k', 'neurons.me:dark', s), null);
assert.equal(resolveState('#ff0000', 89, null).h, 0);
assert.equal(resolveState('#ff0000', 89, null).a, 89);
writeSaved('k', 'neurons.me:dark', { h: 200, a: 40 }, s);
assert.deepEqual(readSaved('k', 'neurons.me:dark', s), { h: 200, a: 40 });
assert.equal(readSaved('k', 'seafoam:light', s), null); // other theme still follows its own color
const st = resolveState('#ff0000', 89, readSaved('k', 'neurons.me:dark', s));
assert.equal(st.h, 200); assert.equal(st.a, 40); assert.equal(st.s, 100); // s/l stay theme's
writeSaved('k', 'neurons.me:dark', null, s); // reset to theme
assert.equal(readSaved('k', 'neurons.me:dark', s), null);
console.log('overlaySwatch.test: ok');
