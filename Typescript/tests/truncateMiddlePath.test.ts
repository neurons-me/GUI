import assert from 'node:assert/strict';
import { middlePathCandidates, truncateMiddlePath, truncateMiddlePathToChars, ELLIPSIS } from '../src/gui/All.This/me/QR/truncateMiddlePath';

let n = 0;
const test = (name: string, fn: () => void) => { fn(); n += 1; console.log(`PASS ${name}`); };
const A = 'jabellae.cleaker.me/keys/paypal/sandbox';

test('T1 eats the host suffix first, then path segments from the first one down', () => {
  assert.deepEqual(middlePathCandidates(A).slice(0, 4), [
    'jabellae.cleaker.me/keys/paypal/sandbox',
    'jabellae…/keys/paypal/sandbox',
    'jabellae…/paypal/sandbox',
    'jabellae…/sandbox',
  ]);
});

test('T2 picks the longest that fits; start (username) and end (deepest) always kept', () => {
  assert.equal(truncateMiddlePathToChars(A, 99), A);
  assert.equal(truncateMiddlePathToChars(A, 29), 'jabellae…/keys/paypal/sandbox');
  assert.equal(truncateMiddlePathToChars(A, 28), 'jabellae…/paypal/sandbox');
  assert.equal(truncateMiddlePathToChars(A, 20), 'jabellae…/sandbox');
  for (const max of [29, 24, 17]) {
    const s = truncateMiddlePathToChars(A, max);
    assert.ok(s.startsWith('jabellae') && s.endsWith('sandbox'), s);
  }
});

test('T3 char-level last resort, never empty, one ellipsis', () => {
  assert.equal(truncateMiddlePathToChars(A, 14), 'jabel…/sandbox');
  const tiny = truncateMiddlePathToChars(A, 4);
  assert.ok(tiny.length <= 4 && tiny.startsWith('j') && tiny.includes(ELLIPSIS), tiny);
  for (const c of middlePathCandidates(A)) assert.ok(c.split(ELLIPSIS).length <= 2, c);
});

test('T4 short paths and host-only labels', () => {
  assert.equal(truncateMiddlePathToChars('jabellae.cleaker.me/keys', 99), 'jabellae.cleaker.me/keys');
  assert.equal(truncateMiddlePathToChars('jabellae.cleaker.me/keys', 22), 'jabellae…/keys');
  assert.equal(truncateMiddlePathToChars('jabellae.cleaker.me', 18), 'jabellae…');
  assert.equal(truncateMiddlePathToChars('jabellae.cleaker.me', 6), 'jabel…');
  assert.equal(truncateMiddlePath('abcdefghij', (c) => c.length <= 5), 'ab…ij');
});

test('T5 candidates shrink monotonically', () => {
  const list = middlePathCandidates(A);
  for (let i = 1; i < list.length; i++) assert.ok(list[i].length < list[i - 1].length, `${list[i - 1]} -> ${list[i]}`);
});

console.log(`${n} passed`);
