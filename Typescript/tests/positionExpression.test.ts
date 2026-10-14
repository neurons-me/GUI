import assert from 'node:assert/strict';
import { pageIsNamespace, withSurface } from '../src/react/positionExpression';
import { parseNRPExpression } from '../src/gui/All.This/NRP/Beatle/NRPExpression';

// the page IS the namespace: nothing is added
assert.equal(withSurface('cleaker.me', 'cleaker.me'), 'cleaker.me');
assert.equal(withSurface('cleaker.me', 'www.cleaker.me'), 'cleaker.me');
assert.equal(withSurface('localhost', 'localhost:5180'), 'localhost');
assert.equal(withSurface('127.0.0.1', '127.0.0.1:3000'), '127.0.0.1');
assert.equal(withSurface('jabellae.cleaker.me', 'cleaker.me'), 'jabellae.cleaker.me');
// two channels, in the NRP's canonical overlay spelling
assert.equal(withSurface('cleaker.me', 'localhost'), 'cleaker.me @ localhost');
assert.equal(withSurface('jabellae.cleaker.me', 'localhost'), 'jabellae.cleaker.me @ localhost');
assert.equal(withSurface('cleaker.me', 'alice.cleaker.me'), 'cleaker.me @ alice.cleaker.me');
// a port makes the surface a quoted URI (bare surfaces are hostname tokens)
assert.equal(withSurface('localhost', '127.0.0.1:3000', 'http:'), 'localhost @ "http://127.0.0.1:3000"');
assert.equal(withSurface('cleaker.me', 'localhost:5180', 'https:'), 'cleaker.me @ "https://localhost:5180"');
// the path stays with the NAMESPACE: `@` is last
assert.equal(withSurface('cleaker.me/netget', 'localhost'), 'cleaker.me/netget @ localhost');
assert.equal(withSurface('localhost/netget', 'localhost'), 'localhost/netget');
// never twice, never invented
assert.equal(withSurface('cleaker.me @ localhost', 'localhost'), 'cleaker.me @ localhost');
assert.equal(withSurface('cleaker.me', ''), 'cleaker.me');
assert.equal(withSurface('', 'localhost'), '');
assert.equal(pageIsNamespace('evilcleaker.me', 'cleaker.me'), false, 'a label boundary, not a suffix of characters');

// What is written must READ back as what was meant, by the NRP's own parser: namespace (with its path) overlaid on
// the surface -- not a namespace over a surface that swallowed the path.
const cases: Array<[string, string, string, string, string]> = [
  // label, host, protocol, expected namespace leaf, expected surface
  ['cleaker.me', 'localhost', 'http:', 'cleaker.me', 'localhost'],
  ['cleaker.me/netget', 'localhost', 'http:', 'cleaker.me/netget', 'localhost'],
  ['jabellae.cleaker.me/users', 'localhost', 'http:', 'jabellae.cleaker.me/users', 'localhost'],
  ['localhost', '127.0.0.1:3000', 'http:', 'localhost', 'http://127.0.0.1:3000'],
];
for (const [label, host, protocol, ns, surface] of cases) {
  const written = withSurface(label, host, protocol);
  const parsed: any = parseNRPExpression(written);
  assert.equal(parsed.syntaxValid, true, written);
  assert.equal(parsed.ast.kind, 'overlay', written);
  assert.equal(parsed.ast.namespace.value, ns, `${written}: the path is the namespace's`);
  assert.equal(parsed.ast.surface, surface, `${written}: the surface is only where the page is`);
  assert.equal(parsed.canonical, written, `${written} is already canonical`);
}
console.log('positionExpression: ok');
