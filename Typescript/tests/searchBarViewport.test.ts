import assert from 'node:assert/strict';
import { dropdownMaxHeight, readVisibleViewport } from '../src/gui/All.This/SearchBar/SearchBar.viewport';

// Keyboard open: layout viewport 800 tall, visualViewport only 450.
const kb = readVisibleViewport({ innerWidth: 390, innerHeight: 800, visualViewport: { offsetTop: 0, offsetLeft: 0, width: 390, height: 450 } });
assert.deepEqual(kb, { top: 0, left: 0, width: 390, height: 450 });
assert.equal(dropdownMaxHeight(100, kb), 450 - 100 - 6 - 8);

// Visual viewport scrolled (iOS pans it when the keyboard opens).
const panned = readVisibleViewport({ innerWidth: 390, innerHeight: 800, visualViewport: { offsetTop: 120, offsetLeft: 0, width: 390, height: 450 } });
assert.equal(dropdownMaxHeight(300, panned), 120 + 450 - 300 - 14);

// No visualViewport: falls back to innerHeight.
const fb = readVisibleViewport({ innerWidth: 1280, innerHeight: 900 });
assert.deepEqual(fb, { top: 0, left: 0, width: 1280, height: 900 });
assert.equal(dropdownMaxHeight(100, fb), 900 - 114);

// Never collapses to nothing; no window → no cap.
assert.equal(dropdownMaxHeight(440, kb), 96);
assert.equal(dropdownMaxHeight(100, null), undefined);
console.log('searchBarViewport: ok');
