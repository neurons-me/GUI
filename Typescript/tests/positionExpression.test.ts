import assert from 'node:assert/strict';
import { isBoundToPage, positionLabel, originOf } from '../src/react/positionExpression';
import { parseNRPExpression } from '../src/gui/All.This/NRP/Beatle/NRPExpression';

const confirmed = (cleakerEndpoint: string, answeredNamespace: string | null) => ({ status: 'confirmed', cleakerEndpoint, answeredNamespace });
const page = (url: string) => { const u = new URL(url); return { origin: u.origin, host: u.host, protocol: u.protocol }; };

// ── binding: a checked fact, never a resemblance of names ─────────────────────────────────────────────────────
const bound = (ns: string, pageUrl: string, root: any) => isBoundToPage({ namespace: ns, pageOrigin: new URL(pageUrl).origin, root });
assert.equal(bound('cleaker.me', 'https://cleaker.me/', confirmed('https://cleaker.me', 'cleaker.me')), true);
assert.equal(bound('jabellae.cleaker.me', 'https://cleaker.me/', confirmed('https://cleaker.me', 'cleaker.me')), true, 'a handle under the root the origin answered for');
// not checked yet / failed / off: no claim
for (const status of ['checking', 'error', 'off', 'idle']) {
  assert.equal(bound('cleaker.me', 'https://cleaker.me/', { status, cleakerEndpoint: 'https://cleaker.me', answeredNamespace: 'cleaker.me' }), false, status);
}
assert.equal(bound('cleaker.me', 'https://cleaker.me/', null), false);
// the transport that was verified is another origin, even a lookalike
assert.equal(bound('cleaker.me', 'https://cleaker.me:3000/', confirmed('https://cleaker.me', 'cleaker.me')), false, 'a different port is a different origin');
assert.equal(bound('cleaker.me', 'http://cleaker.me/', confirmed('https://cleaker.me', 'cleaker.me')), false, 'a different scheme is a different origin');
assert.equal(bound('cleaker.me', 'https://www.cleaker.me/', confirmed('https://cleaker.me', 'cleaker.me')), false, 'www. is not assumed');
assert.equal(bound('cleaker.me', 'https://alice.cleaker.me/', confirmed('https://cleaker.me', 'cleaker.me')), false);
// the origin answered for ANOTHER namespace, or did not say
assert.equal(bound('cleaker.me', 'https://cleaker.me/', confirmed('https://cleaker.me', 'localhost')), false);
assert.equal(bound('cleaker.me', 'https://cleaker.me/', confirmed('https://cleaker.me', null)), false);
assert.equal(bound('evilcleaker.me', 'https://cleaker.me/', confirmed('https://cleaker.me', 'cleaker.me')), false, 'a label boundary, not a suffix of characters');
assert.equal(originOf('not a url'), '');

// ── the label ─────────────────────────────────────────────────────────────────────────────────────────────────
// the namespace's root is the namespace itself: nothing is written for it
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('https://cleaker.me/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me');
assert.equal(positionLabel({ namespace: 'cleaker.me', path: '/', page: page('https://cleaker.me/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me');
// the semantic path is kept when it is not the root, and is the only path (a GUI route is never passed here)
assert.equal(positionLabel({ namespace: 'cleaker.me', path: '/profile', page: page('https://cleaker.me/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me/profile');
// a door that points at another node keeps that destination
assert.equal(positionLabel({ namespace: 'cleaker.me', path: '/netget', page: page('https://netget.site/'), root: confirmed('https://netget.site', 'cleaker.me') }), 'cleaker.me/netget');
// different places: both parts, path with the namespace
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://localhost/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me @ localhost');
assert.equal(positionLabel({ namespace: 'ana.cleaker.me', path: '/profile', page: page('http://localhost/'), root: null }), 'ana.cleaker.me/profile @ localhost');
// the same name but not (yet) confirmed: stated as it is, not abbreviated
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('https://cleaker.me/'), root: { status: 'checking', cleakerEndpoint: 'https://cleaker.me', answeredNamespace: null } }), 'cleaker.me @ cleaker.me');
// a port is part of the (bare) surface; the scheme is written only when it is news
assert.equal(positionLabel({ namespace: 'localhost', page: page('http://127.0.0.1:3000/'), root: null }), 'localhost @ 127.0.0.1:3000');
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('https://cleaker.me:3000/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me @ cleaker.me:3000');
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://localhost:5180/'), root: null }), 'cleaker.me @ localhost:5180', 'loopback http is the norm');
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://foo.localhost/'), root: null }), 'cleaker.me @ foo.localhost');
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://cleaker.me:3000/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me @ "http://cleaker.me:3000"', 'http on a non-loopback host is news');
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://[::1]:3000/'), root: null }), 'cleaker.me @ "http://[::1]:3000"', 'an IPv6 literal is not a bare surface');
// the scheme is still part of the BINDING even though it is not printed: same host, http vs https, is not bound
assert.equal(bound('cleaker.me', 'https://cleaker.me/', confirmed('http://cleaker.me', 'cleaker.me')), false);
assert.equal(positionLabel({ namespace: '', page: page('http://localhost/'), root: null }), '');

// What is written READS BACK as what was meant, by the NRP's own parser: the namespace with its path overlaid on the
// surface (or the namespace alone when bound) -- and is already canonical.
const rows: Array<[string, string, string, string | null]> = [
  // written, expected namespace leaf, expected surface
  [positionLabel({ namespace: 'cleaker.me', page: page('http://localhost/'), root: null }), 'cleaker.me', 'localhost', null],
  [positionLabel({ namespace: 'cleaker.me', path: '/netget', page: page('http://localhost/'), root: null }), 'cleaker.me/netget', 'localhost', null],
  [positionLabel({ namespace: 'localhost', page: page('http://127.0.0.1:3000/'), root: null }), 'localhost', '127.0.0.1:3000', null],
  [positionLabel({ namespace: 'cleaker.me', page: page('http://cleaker.me:3000/'), root: null }), 'cleaker.me', 'http://cleaker.me:3000', null],
];
for (const [written, ns, surface] of rows) {
  const parsed: any = parseNRPExpression(written);
  assert.equal(parsed.syntaxValid, true, written);
  assert.equal(parsed.ast.kind, 'overlay', written);
  assert.equal(parsed.ast.namespace.value, ns, `${written}: the path is the namespace's`);
  assert.equal(parsed.ast.surface, surface, `${written}: the surface is only where the page is`);
  assert.equal(parsed.canonical, written, `${written} is already canonical`);
}
// bound: just a namespace with its path
const one: any = parseNRPExpression('cleaker.me');
assert.equal(one.syntaxValid, true);
assert.equal(one.ast.kind, 'namespace');
// and the longer spelling the label used to print is the same expression
assert.equal((parseNRPExpression('cleaker.me/') as any).canonical, one.canonical, 'the root path is the namespace itself');
console.log('positionExpression: ok');
