import assert from 'node:assert/strict';
import { fontSizePx, relativeSubtitlePx } from '../src/gui/Theme/utils/typeScale';

// reading the theme's sizes
assert.equal(fontSizePx('1.3125rem'), 21);
assert.equal(fontSizePx('21px'), 21);
assert.equal(fontSizePx(21), 21);
assert.equal(fontSizePx('2.5rem'), 40);
assert.equal(fontSizePx('large'), null);
assert.equal(fontSizePx(undefined), null);

const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
// halfway between title and body on a log scale
assert.ok(near(relativeSubtitlePx(21, 16), 18.33), String(relativeSubtitlePx(21, 16)));
assert.ok(near(relativeSubtitlePx(40, 16), 25.30));
assert.ok(near(relativeSubtitlePx(42, 21), 29.70), 'Medium: title 42, body 21');
// follows its title
assert.ok(relativeSubtitlePx(40, 16) > relativeSubtitlePx(21, 16));
// always under its title, never under the body
for (const t of [16, 18, 21, 26, 32, 40]) {
  const s = relativeSubtitlePx(t, 16);
  assert.ok(s <= t && s >= 16, `${t} -> ${s}`);
}
assert.equal(relativeSubtitlePx(12, 16), 16, 'a title smaller than the body: the subtitle stays at the body size');
assert.equal(relativeSubtitlePx(0, 16), 16);

console.log('typeScale: ok');
