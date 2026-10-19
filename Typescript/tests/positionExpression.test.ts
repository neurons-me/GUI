import assert from 'node:assert/strict';
import { isBoundToPage, positionExpression, positionLabel, originOf, shownNamespace, cardNamespace } from '../src/react/positionExpression';
import { bindingFactsAfter, NO_ROOT_BINDING } from '../src/react/session/verifiedCleakerRoot';
import { parseNRPExpression } from '../src/gui/All.This/NRP/Beatle/NRPExpression';

const confirmed = (cleakerEndpoint: string, answeredNamespace: string | null, extra: object = {}) => ({ status: 'confirmed', cleakerEndpoint, answeredNamespace, ...extra });
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

// ── the scheme, when it is the reason the page is not bound: it is shown, never `x @ x` ───────────────────────────
{
  // confirmed through http://x, the page is on https://x: same names, the scheme is the whole difference
  const e = positionExpression({ namespace: 'x.test', page: page('https://x.test/'), root: confirmed('http://x.test', 'x.test') });
  assert.equal(e.bound, false);
  assert.equal(e.compact, 'x.test @ "https://x.test"', 'the scheme explains why it did not collapse, so it is printed');
  // not confirmed at all: that is not the scheme's doing, so nothing is added to the name
  const checking = positionExpression({ namespace: 'x.test', page: page('https://x.test/'), root: { status: 'checking', cleakerEndpoint: 'http://x.test', answeredNamespace: null } });
  assert.equal(checking.compact, 'x.test @ x.test');
  // a port is its own, visible difference
  const port = positionExpression({ namespace: 'x.test', page: page('https://x.test:8443/'), root: confirmed('https://x.test', 'x.test') });
  assert.equal(port.compact, 'x.test @ x.test:8443');
}

// ── what is copied is unambiguous: full origin, scheme included, even when the drawn label is short ───────────────
{
  const bound = positionExpression({ namespace: 'cleaker.me', page: page('https://cleaker.me/'), root: confirmed('https://cleaker.me', 'cleaker.me') });
  assert.equal(bound.compact, 'cleaker.me');
  assert.equal(bound.full, 'cleaker.me @ "https://cleaker.me"');
  const local = positionExpression({ namespace: 'cleaker.me', path: '/profile', page: page('http://localhost:3000/'), root: null });
  assert.equal(local.compact, 'cleaker.me/profile @ localhost:3000');
  assert.equal(local.full, 'cleaker.me/profile @ "http://localhost:3000"', '`localhost:3000` alone does not say http or https');
  // the full form reads back, by the NRP parser, as the namespace with its path over the whole origin
  for (const x of [bound, local]) {
    const parsed: any = parseNRPExpression(x.full);
    assert.equal(parsed.syntaxValid, true, x.full);
    assert.equal(parsed.ast.kind, 'overlay');
    assert.match(parsed.ast.surface, /^https?:\/\//);
  }
}

// ── the verifiedRoot transition: a failed NEW resolution must not let the OLD confirmation abbreviate the new context ─
{
  // A confirmed
  let facts = bindingFactsAfter(NO_ROOT_BINDING, { label: 'cleaker.me', ok: true, answeredNamespace: 'cleaker.me' });
  const root = (f: typeof facts) => ({ status: 'confirmed', cleakerEndpoint: 'https://cleaker.me', answeredNamespace: f.answeredNamespace, confirmedLabel: f.confirmedLabel, lastAttemptFailed: f.lastAttemptFailed });
  const here = (ns: string, f: typeof facts) => isBoundToPage({ namespace: ns, pageOrigin: 'https://cleaker.me', root: root(f) });
  assert.equal(here('cleaker.me', facts), true);
  assert.equal(here('ana.cleaker.me', facts), true, 'a handle under the confirmed root');
  // the person selects ana.cleaker.me and that resolution FAILS: status stays confirmed (the sidebar keeps working
  // against A), but the old confirmation is not about what is now being shown
  facts = bindingFactsAfter(facts, { label: 'ana.cleaker.me', ok: false, answeredNamespace: null });
  assert.equal(facts.confirmedLabel, 'cleaker.me', 'the older confirmation is kept for the rest of the app');
  assert.equal(facts.lastAttemptFailed, true);
  assert.equal(here('ana.cleaker.me', facts), false, 'a failed resolution is not abbreviated with the previous one');
  assert.equal(here('cleaker.me', facts), false, 'nor the root, until a resolution succeeds again');
  // and it recovers on the next success
  facts = bindingFactsAfter(facts, { label: 'cleaker.me', ok: true, answeredNamespace: 'cleaker.me' });
  assert.equal(here('cleaker.me', facts), true);
  // a confirmation of ANOTHER label does not cover a namespace outside it, even if the names look related
  const other = bindingFactsAfter(NO_ROOT_BINDING, { label: 'acme.test', ok: true, answeredNamespace: 'acme.test' });
  assert.equal(isBoundToPage({ namespace: 'cleaker.me', pageOrigin: 'https://acme.test', root: { status: 'confirmed', cleakerEndpoint: 'https://acme.test', answeredNamespace: 'acme.test', confirmedLabel: other.confirmedLabel, lastAttemptFailed: false } }), false);
}


// ── which namespace is NAMED: what the monad answered, not what the address says ───────────────────────────────────
{
  const root = (answered: string | null, extra: object = {}) => ({ status: 'confirmed', cleakerEndpoint: 'https://fulltrailer.com.mx', answeredNamespace: answered, ...extra });
  // loaded from fulltrailer.com.mx, the monad says it is fulltrailer.suis-macbook-air.local: that is the namespace
  assert.equal(shownNamespace({ root: root('fulltrailer.suis-macbook-air.local'), guess: 'fulltrailer.com.mx' }), 'fulltrailer.suis-macbook-air.local');
  // that origin is the one that was checked to answer for it, so the short form is the namespace alone; the address is
  // still the surface and is in the full form (and in the Welcome's "served from")
  const door = positionExpression({ namespace: 'fulltrailer.suis-macbook-air.local', page: page('https://fulltrailer.com.mx/'), root: root('fulltrailer.suis-macbook-air.local') });
  assert.equal(door.bound, true);
  assert.equal(door.compact, 'fulltrailer.suis-macbook-air.local');
  assert.equal(door.full, 'fulltrailer.suis-macbook-air.local @ "https://fulltrailer.com.mx"');
  // reached through ANOTHER address than the one that was confirmed (the LAN IP): same namespace, the surface is shown
  const other = positionExpression({ namespace: 'fulltrailer.suis-macbook-air.local', page: page('http://192.168.1.57:4100/'), root: root('fulltrailer.suis-macbook-air.local') });
  assert.equal(other.bound, false);
  // http on a non-loopback host (a LAN address) is news: the scheme is written
  assert.equal(other.compact, 'fulltrailer.suis-macbook-air.local @ "http://192.168.1.57:4100"');
  // the same monad reached by its LAN address, and confirmed there: that origin answered, so it collapses
  const lan = positionExpression({ namespace: 'fulltrailer.suis-macbook-air.local', page: page('http://192.168.1.57:4100/'), root: { status: 'confirmed', cleakerEndpoint: 'http://192.168.1.57:4100', answeredNamespace: 'fulltrailer.suis-macbook-air.local' } });
  assert.equal(lan.bound, true, 'that origin is the one that answered');
  assert.equal(lan.compact, 'fulltrailer.suis-macbook-air.local');
  // if the owner makes the monad's own namespace fulltrailer.com.mx, the name IS the address and they collapse
  assert.equal(shownNamespace({ root: root('fulltrailer.com.mx'), guess: 'fulltrailer.com.mx' }), 'fulltrailer.com.mx');
  assert.equal(positionExpression({ namespace: 'fulltrailer.com.mx', page: page('https://fulltrailer.com.mx/'), root: root('fulltrailer.com.mx') }).compact, 'fulltrailer.com.mx');
  // priority: identity > selection > answered > guess
  assert.equal(shownNamespace({ authenticated: 'ana.cleaker.me', selected: 'x.test', root: root('y.test'), guess: 'z.test' }), 'ana.cleaker.me');
  assert.equal(shownNamespace({ selected: 'x.test', root: root('y.test'), guess: 'z.test' }), 'x.test');
  // an answer that is not current is not used: still checking, failed, off, or "unknown"
  assert.equal(shownNamespace({ root: { status: 'checking', cleakerEndpoint: 'a', answeredNamespace: 'y.test' }, guess: 'z.test' }), 'z.test');
  assert.equal(shownNamespace({ root: root('y.test', { lastAttemptFailed: true }), guess: 'z.test' }), 'z.test');
  assert.equal(shownNamespace({ root: root('unknown'), guess: 'z.test' }), 'z.test');
  assert.equal(shownNamespace({ root: root(null), guess: 'z.test' }), 'z.test');
  // an address-only guess is not a namespace: with nothing resolved nothing is named
  assert.equal(shownNamespace({ root: root(null), guess: 'z.test', guessIsProvisional: true }), '');
  assert.equal(shownNamespace({ root: root('y.test'), guess: 'z.test', guessIsProvisional: true }), 'y.test');
}


// ── the card acts on the LINK that was selected; the hostname never does ─────────────────────────────────────────────
{
  const conf = (ns: string | null) => ({ status: 'confirmed', cleakerEndpoint: 'https://fulltrailer.com.mx', answeredNamespace: ns });
  // one page, address fulltrailer.com.mx, which the app did NOT declare as a namespace
  const base = { address: 'fulltrailer.com.mx', source: 'address' as const };
  // nothing has answered: resolving, and no operation may use the hostname
  let c = cardNamespace({ ...base, root: { status: 'checking', cleakerEndpoint: 'x', answeredNamespace: null } });
  assert.equal(c.ready, false);
  assert.equal(c.from, 'address');
  // the service answers: that is the link, and it is ready (the address is only the surface)
  c = cardNamespace({ ...base, root: conf('fulltrailer.suis-macbook-air.local') });
  assert.deepEqual([c.namespace, c.ready, c.from], ['fulltrailer.suis-macbook-air.local', true, 'answered']);
  // the person selects another link: the card follows the selection, not the answer or the address
  const a = cardNamespace({ ...base, selected: 'jabellae.cleaker.me', root: conf('fulltrailer.suis-macbook-air.local') });
  assert.deepEqual([a.namespace, a.from], ['jabellae.cleaker.me', 'selected']);
  // and back: the first link's target is intact, nothing was replaced
  const back = cardNamespace({ ...base, selected: null, root: conf('fulltrailer.suis-macbook-air.local') });
  assert.equal(back.namespace, 'fulltrailer.suis-macbook-air.local');
  // a failed attempt is not an answer
  assert.equal(cardNamespace({ ...base, root: { ...conf('y.test'), lastAttemptFailed: true } }).ready, false);
  // an app that declares the namespace is ready without waiting
  assert.deepEqual(cardNamespace({ address: 'cleaker.me', source: 'declared' }), { namespace: 'cleaker.me', ready: true, from: 'declared' });
  // the main server's door declares its namespace; a selection still wins
  assert.equal(cardNamespace({ address: 'cleaker.me', source: 'declared', selected: 'x.test' }).namespace, 'x.test');
}

console.log('positionExpression: ok');
