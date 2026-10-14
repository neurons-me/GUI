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
// the namespace's root is always shown
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('https://cleaker.me/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me/');
// the semantic path is kept when it is not the root, and is the only path (a GUI route is never passed here)
assert.equal(positionLabel({ namespace: 'cleaker.me', path: '/profile', page: page('https://cleaker.me/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me/profile');
// a door that points at another node keeps that destination
assert.equal(positionLabel({ namespace: 'cleaker.me', path: '/netget', page: page('https://netget.site/'), root: confirmed('https://netget.site', 'cleaker.me') }), 'cleaker.me/netget');
// different places: both parts, path with the namespace
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://localhost/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me/ @ localhost');
assert.equal(positionLabel({ namespace: 'ana.cleaker.me', path: '/profile', page: page('http://localhost/'), root: null }), 'ana.cleaker.me/profile @ localhost');
// the same name but not (yet) confirmed: stated as it is, not abbreviated
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('https://cleaker.me/'), root: { status: 'checking', cleakerEndpoint: 'https://cleaker.me', answeredNamespace: null } }), 'cleaker.me/ @ cleaker.me');
// a port: the surface is a quoted URI, and the origin differs from a bare-host binding
assert.equal(positionLabel({ namespace: 'localhost', page: page('http://127.0.0.1:3000/'), root: null }), 'localhost/ @ "http://127.0.0.1:3000"');
assert.equal(positionLabel({ namespace: 'cleaker.me', page: page('http://cleaker.me:3000/'), root: confirmed('https://cleaker.me', 'cleaker.me') }), 'cleaker.me/ @ "http://cleaker.me:3000"');
assert.equal(positionLabel({ namespace: '', page: page('http://localhost/'), root: null }), '');

// What is written READS BACK as what was meant, by the NRP's own parser: the namespace with its path overlaid on the
// surface (or the namespace alone when bound) -- and is already canonical.
const rows: Array<[string, string, string, string | null]> = [
  // written, expected namespace leaf, expected surface
  [positionLabel({ namespace: 'cleaker.me', page: page('http://localhost/'), root: null }), 'cleaker.me/', 'localhost', null],
  [positionLabel({ namespace: 'cleaker.me', path: '/netget', page: page('http://localhost/'), root: null }), 'cleaker.me/netget', 'localhost', null],
  [positionLabel({ namespace: 'localhost', page: page('http://127.0.0.1:3000/'), root: null }), 'localhost/', 'http://127.0.0.1:3000', null],
];
for (const [written, ns, surface] of rows) {
  const parsed: any = parseNRPExpression(written);
  assert.equal(parsed.syntaxValid, true, written);
  assert.equal(parsed.ast.kind, 'overlay', written);
  assert.equal(parsed.ast.namespace.value, ns, `${written}: the path is the namespace's`);
  assert.equal(parsed.ast.surface, surface, `${written}: the surface is only where the page is`);
  // the root `/` is a display form: the parser's canonical form is the same expression without it
  assert.equal(parsed.canonical, written.replace('/ @ ', ' @ '), `${written}: canonical is the same expression (the root '/' is display only)`);
}
// bound: just a namespace with its path
const one: any = parseNRPExpression('cleaker.me/');
assert.equal(one.syntaxValid, true);
assert.equal(one.ast.kind, 'namespace');
assert.equal(one.canonical, 'cleaker.me', 'the root path is the namespace itself');
console.log('positionExpression: ok');
