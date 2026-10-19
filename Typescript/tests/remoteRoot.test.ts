// A root typed into the QR that is not this page's own is asked directly by the browser; the page's own roots are not.
import assert from 'node:assert/strict';
import { endpointForRoot, isLocalRoot, remoteRootFor } from '../src/react/session/remoteRoot';

const here = { localRoot: 'localhost', confirmedRoot: null };

// the page's own roots and aliases stay with the page's own gateway
for (const r of ['localhost', 'LOCALHOST', 'local.cleaker', 'local.host', 'suis-macbook-air.local', 'ana.localhost', '']) {
  assert.equal(isLocalRoot(r, here), true, `${r || '(empty)'} is local`);
  assert.equal(remoteRootFor(r, here), null, `${r || '(empty)'} is not opened directly`);
}
// the root the page's monad confirmed for itself is local even if it is a public-looking name
assert.equal(remoteRootFor('netget.site', { localRoot: 'localhost', confirmedRoot: 'netget.site' }), null);
assert.equal(remoteRootFor('cleaker.me', { localRoot: 'cleaker.me' }), null, 'the page IS cleaker.me: its own gateway answers');

// another host is asked directly
assert.equal(remoteRootFor('cleaker.me', here), 'cleaker.me');
assert.equal(remoteRootFor(' Cleaker.ME ', here), 'cleaker.me', 'case and whitespace folded');
assert.equal(remoteRootFor('netget.site', here), 'netget.site');

// anything that is not a bare host name is never turned into a socket address
for (const bad of ['https://cleaker.me', 'cleaker.me/path', 'cleaker.me:8443', 'cleaker me', 'x', '.me', 'a..b', 'cleaker.me@evil.test', 'jabellae.cleaker.me?x=1']) {
  assert.equal(remoteRootFor(bad, here), null, `${bad} is not a host name`);
}
// where a root's QR points: the page's own address for its own roots, the host itself for another's
{
  const ctx = { resolvedEndpoint: 'http://localhost:55858', localRoot: 'localhost', confirmedRoot: null };
  assert.equal(endpointForRoot('localhost', ctx), 'http://localhost:55858');
  assert.equal(endpointForRoot('', ctx), 'http://localhost:55858');
  assert.equal(endpointForRoot('cleaker.me', ctx), 'https://cleaker.me');
  assert.equal(endpointForRoot('Cleaker.ME', ctx), 'https://cleaker.me');
  assert.equal(endpointForRoot('cleaker.me/path', ctx), 'http://localhost:55858', 'not a host: stays with the page');
}
console.log('remoteRoot: ok');
