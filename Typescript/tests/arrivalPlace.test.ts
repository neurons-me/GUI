// The place a shared QR points at (`?at=`): read, validated, never followed on its own (arrivalPlace.ts).
import assert from 'node:assert/strict';
import { readArrivalPlace, withoutArrival } from '../src/gui/All.This/Cleaker/arrivalPlace';
import { atParam, withAt } from '../src/react/positionExpression';

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

// ── at= is written readable, and reads back exactly (atParam / withAt) ─────────────────────────────────────────
{
  // readable: no %3A%2F%2F; only what would break the query is escaped
  assert.equal(
    withAt('https://cleaker.me/', 'https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n#Historia'),
    'https://cleaker.me/?at=https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n%23Historia',
  );
  assert.equal(withAt('https://cleaker.me/', 'https://neurons-me.github.io/Cleaker/#notes'), 'https://cleaker.me/?at=https://neurons-me.github.io/Cleaker/%23notes');
  assert.equal(withAt('https://cleaker.me/?x=1', 'https://a.org/b?c=d&e=f'), 'https://cleaker.me/?x=1&at=https://a.org/b?c=d%26e=f', 'the link keeps its own query; & is escaped');

  // unbreakable: whatever the place, the door reads back the very same URL
  const hostile = [
    'https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n?oldid=1#Historia',
    'https://x.org/a%2Fb/c',                       // an escaped slash is not a slash
    'https://x.org/100%25/done',                   // an escaped percent
    'https://x.org/q?a=1&b=2+3&c=%2B#frag&x=1',     // &, + and an escaped + in the query, & in the fragment
    'https://x.org/a b/ñ?q=ü ö#sección 2',         // spaces and non-ASCII everywhere
    'https://x.org/#:~:text=three%20lines,end',     // a text fragment (a highlight)
    'https://x.org/%E2%9C%93/%F0%9F%90%95',        // emoji and symbols
    'https://x.org/bad%ZZescape/%C3',              // malformed escapes stay as they were
    'http://[::1]:8080/p?#',                       // IPv6, empty query and fragment
    'https://user.example/a;b=c/d@e:f!$\'()*,',    // every sub-delimiter
    'file:///Users/me/notes/page.html#p3',
    'https://x.org/' + 'é'.repeat(300),
  ];
  for (const place of hostile) {
    const link = withAt('https://cleaker.me/', place);
    const back = new URL(link).searchParams.get('at');
    assert.equal(new URL(back!).href, new URL(place).href, `round trip: ${place}`);
    assert.equal(readArrivalPlace(new URL(link).search)?.url, new URL(place).href, `the door offers exactly: ${place}`);
    assert.ok(!/#/.test(link.slice(link.indexOf('?'))) || new URL(link).hash === '', 'the place never leaks into the door\'s own section');
  }
  // not a URL: fully escaped, still exact as a string
  assert.equal(atParam('not a url & #'), encodeURIComponent('not a url & #'));
}

console.log('arrivalPlace: ok');
