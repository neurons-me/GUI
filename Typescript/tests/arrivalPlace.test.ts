// The place a shared QR points at (`?at=`): read, validated, never followed on its own (arrivalPlace.ts).
import assert from 'node:assert/strict';
import { readArrivalPlace, withoutArrival } from '../src/gui/All.This/Cleaker/arrivalPlace';

const q = (at: string, extra = '') => `?${extra}at=${encodeURIComponent(at)}`;

// a section of a page: offered in full
const wiki = readArrivalPlace(q('https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n?oldid=1#Historia'), 'https://cleaker.me/');
assert.deepEqual(wiki, {
  url: 'https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n?oldid=1#Historia',
  label: 'es.wikipedia.org/wiki/Pastor_alemán?oldid=1#Historia',
  host: 'es.wikipedia.org',
  openable: true,
});
assert.equal(readArrivalPlace(q('http://cleaker.me/x'))?.label, '"http://cleaker.me/x"', 'http off loopback keeps its scheme');
// a text fragment (the highlight itself) survives
assert.equal(readArrivalPlace(q('https://example.org/a#:~:text=three%20lines'))?.url, 'https://example.org/a#:~:text=three%20lines');
// a file: shown, not opened
const file = readArrivalPlace(q('file:///Users/me/notes/page.html#p3'));
assert.equal(file?.openable, false);
assert.equal(file?.host, 'this device');

// not places: nothing is offered
for (const bad of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'blob:https://x.org/1', 'not a url', '', 'https://', 'https://cleaker.me@evil.example/']) {
  assert.equal(readArrivalPlace(q(bad)), null, bad);
}
assert.equal(readArrivalPlace('?x=1'), null, 'no at=');
assert.equal(readArrivalPlace(q('https://x.org/' + 'a'.repeat(5000))), null, 'too long');
// already there
assert.equal(readArrivalPlace(q('https://cleaker.me/'), 'https://cleaker.me/?at=https%3A%2F%2Fcleaker.me%2F'), null);

// leaving: only at= goes, the rest stays
assert.equal(withoutArrival(q('https://x.org', 'corner=top-left&')), '?corner=top-left');
assert.equal(withoutArrival(q('https://x.org')), '');

console.log('arrivalPlace: ok');
