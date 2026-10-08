// A root typed into the QR that is not this page's own is asked directly by the browser; the page's own roots are not.
import assert from 'node:assert/strict';
import { isLocalRoot, remoteRootFor } from '../src/react/session/remoteRoot';

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
console.log('remoteRoot: ok');
