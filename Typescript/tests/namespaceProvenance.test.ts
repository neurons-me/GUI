// Where the corner's namespace comes from (src/gui/All.This/Cleaker/Corner/cleakerCorner.ts): declared by the person or
// the author, else the page's host as an ADDRESS (port dropped from the name, kept in the transport), else none. No
// built-in domain. Provenance is not verification: nothing here says "verified".
import assert from 'node:assert/strict';
import {
  addressNamespace,
  cornerEndpoint,
  cornerLabel,
  pagePlaceUrl,
  positionQrValue,
  resolveCornerNamespace,
} from '../src/gui/All.This/Cleaker/Corner/cleakerCorner';
import { parseCleakerNamespaceExpression } from '../src/gui/All.This/Cleaker/namespaceExpression';

const storybook = { protocol: 'http:', hostname: 'localhost', host: 'localhost:6006', origin: 'http://localhost:6006', pathname: '/' };
const site = { protocol: 'https:', hostname: 'tienda.com', host: 'tienda.com', origin: 'https://tienda.com', pathname: '/' };
const file = { protocol: 'file:', hostname: '', host: '', origin: 'file://', pathname: '/Users/x/page.html' };

// 1. declared by the author
assert.deepEqual(resolveCornerNamespace({ stored: null, author: 'cleaker.me', page: storybook }), { namespace: 'cleaker.me', source: 'declared' });
// the author can start with none
assert.deepEqual(resolveCornerNamespace({ stored: null, author: null, page: storybook }), { namespace: null, source: 'none' });
assert.deepEqual(resolveCornerNamespace({ stored: null, author: '', page: storybook }), { namespace: null, source: 'none' });

// 2. the person's stored choice: declared; '' = they chose none (the address does not come back)
assert.deepEqual(resolveCornerNamespace({ stored: 'neurons.me', page: storybook }), { namespace: 'neurons.me', source: 'declared' });
assert.deepEqual(resolveCornerNamespace({ stored: '', page: storybook }), { namespace: null, source: 'none' });
// the corner's existing rule: the person's choice wins over the author's (documented in CleakerMountOptions)
assert.deepEqual(resolveCornerNamespace({ stored: 'neurons.me', author: 'cleaker.me', page: storybook }), { namespace: 'neurons.me', source: 'declared' });
// a stored choice wins over the address
assert.equal(resolveCornerNamespace({ stored: 'neurons.me', page: site }).source, 'declared');

// 3. nothing declared: the page's host, as an address, without the port
assert.deepEqual(resolveCornerNamespace({ stored: null, page: storybook }), { namespace: 'localhost', source: 'address' });
assert.deepEqual(resolveCornerNamespace({ stored: null, page: site }), { namespace: 'tienda.com', source: 'address' });

// 4. no usable address: a file, no page at all (SSR, tests, Node): none -- never cleaker.me
assert.deepEqual(resolveCornerNamespace({ stored: null, page: file }), { namespace: null, source: 'none' });
assert.deepEqual(resolveCornerNamespace({ stored: null, page: null }), { namespace: null, source: 'none' });
assert.deepEqual(resolveCornerNamespace({ stored: null }), { namespace: null, source: 'none' });
assert.equal(addressNamespace({ protocol: 'http:', hostname: '[::1]' }), null);
assert.equal(addressNamespace(undefined), null);

// transport: an address keeps the page's origin AND port; a declared name uses its own
assert.equal(cornerEndpoint({ namespace: 'localhost', source: 'address' }, storybook), 'http://localhost:6006');
assert.equal(cornerEndpoint({ namespace: 'tienda.com', source: 'address' }, site), 'https://tienda.com');
assert.equal(cornerEndpoint({ namespace: 'cleaker.me', source: 'declared' }, storybook), 'https://cleaker.me');
assert.equal(cornerEndpoint({ namespace: null, source: 'none' }, storybook), '');

// what is shown: an address says so; it is never shown as the namespace the page declared, nor as "verified"
assert.equal(cornerLabel('localhost', storybook, 'address'), 'localhost (address)');
assert.equal(cornerLabel('cleaker.me', storybook, 'declared'), 'cleaker.me @ localhost:6006');
assert.equal(cornerLabel(null, storybook, 'none'), 'localhost:6006');
for (const source of ['declared', 'address', 'none'] as const) assert.doesNotMatch(cornerLabel('localhost', storybook, source), /verif/i);

// the parser no longer turns an empty expression into cleaker.me
assert.throws(() => parseCleakerNamespaceExpression(''), /Namespace cannot be empty/);
assert.throws(() => parseCleakerNamespaceExpression('   '), /Namespace cannot be empty/);
assert.equal(parseCleakerNamespaceExpression('localhost:6006').constant, 'localhost');
assert.equal(parseCleakerNamespaceExpression('localhost:6006').transport.origin, 'http://localhost:6006');

// importing the module did not need a browser (this file runs in Node without window)
assert.equal(typeof (globalThis as { window?: unknown }).window, 'undefined');

// The QR's at= is the page's EXACT place: whoever scans it lands on the same section of the same page.
{
  const loc = (href: string) => { const u = new URL(href); return { protocol: u.protocol, origin: u.origin, host: u.host, pathname: u.pathname, search: u.search, hash: u.hash }; };
  const wiki = pagePlaceUrl(loc('https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n?oldid=1#Historia'));
  assert.equal(wiki, 'https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n?oldid=1#Historia');
  const qr = new URL(positionQrValue('ana.cleaker.me', wiki, 'https://cleaker.me'));
  assert.equal(qr.searchParams.get('at'), wiki, 'at= carries path, query and section');
  assert.equal(new URL(positionQrValue('cleaker.me', pagePlaceUrl(loc('https://neurons-me.github.io/Cleaker/#notes')), 'https://cleaker.me')).searchParams.get('at'), 'https://neurons-me.github.io/Cleaker/#notes');
  // the page IS the namespace's own root: nothing added
  assert.equal(new URL(positionQrValue('cleaker.me', pagePlaceUrl(loc('https://cleaker.me/')), 'https://cleaker.me')).searchParams.get('at'), null);
  // inside the namespace's own site: that place is still news
  assert.equal(new URL(positionQrValue('cleaker.me', pagePlaceUrl(loc('https://cleaker.me/users#keys')), 'https://cleaker.me')).searchParams.get('at'), 'https://cleaker.me/users#keys');
  // a file: the whole file and its section
  assert.equal(pagePlaceUrl({ protocol: 'file:', pathname: '/Users/me/notes/page.html', hash: '#p3' }), 'file:///Users/me/notes/page.html#p3');
}

console.log('namespaceProvenance: ok');
