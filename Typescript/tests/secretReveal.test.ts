import assert from 'node:assert/strict';
import { COPIED_MS, REVEAL_MS, revealErrorMessage, secretAction } from '../src/gui/All.This/Cleaker/Keys/secretReveal';

let n = 0;
const test = (name: string, fn: () => void) => { fn(); n++; console.log(`PASS ${name}`); };

test('S1 typed value acts in place, even when a saved value exists', () => {
  assert.equal(secretAction({ typed: 'abc', saved: false, passphrase: '' }), 'typed');
  assert.equal(secretAction({ typed: 'abc', saved: true, passphrase: 'pp' }), 'typed');
});
test('S2 saved value needs the passphrase, then decrypts on demand', () => {
  assert.equal(secretAction({ typed: '', saved: true, passphrase: '' }), 'need-passphrase');
  assert.equal(secretAction({ typed: '', saved: true, passphrase: 'pp' }), 'decrypt');
});
test('S3 nothing typed or saved: nothing to show or copy', () => {
  assert.equal(secretAction({ typed: '', saved: false, passphrase: 'pp' }), 'none');
});
test('S4 reveal auto-hides after ~10 s; Copied is brief', () => {
  assert.equal(REVEAL_MS, 10_000); assert.ok(COPIED_MS >= 1000 && COPIED_MS <= 2500);
});
test('S5 errors never echo a value', () => {
  assert.equal(revealErrorMessage('WRONG_PASSPHRASE'), 'Wrong passphrase.');
  assert.equal(revealErrorMessage('secret-123'), 'Could not unlock.');
});
console.log(`${n} passed`);
