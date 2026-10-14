import assert from 'node:assert/strict';
import { pageIsNamespace, withSurface } from '../src/react/positionExpression';

// the page IS the namespace: nothing is added
assert.equal(withSurface('cleaker.me', 'cleaker.me'), 'cleaker.me');
assert.equal(withSurface('cleaker.me', 'www.cleaker.me'), 'cleaker.me');
assert.equal(withSurface('localhost', 'localhost:5180'), 'localhost');
assert.equal(withSurface('127.0.0.1', '127.0.0.1:3000'), '127.0.0.1');
// a handle under the page's own host is that host's namespace
assert.equal(withSurface('jabellae.cleaker.me', 'cleaker.me'), 'jabellae.cleaker.me');
// two channels: the namespace, then where the page is
assert.equal(withSurface('cleaker.me', 'localhost'), 'cleaker.me@localhost');
assert.equal(withSurface('localhost', '127.0.0.1:3000'), 'localhost@127.0.0.1:3000');
assert.equal(withSurface('jabellae.cleaker.me', 'localhost'), 'jabellae.cleaker.me@localhost');
// the surface goes before the path
assert.equal(withSurface('cleaker.me/netget', 'localhost'), 'cleaker.me@localhost/netget');
assert.equal(withSurface('localhost/netget', 'localhost'), 'localhost/netget');
// a page under a handle is a different place from the root it reads
assert.equal(withSurface('cleaker.me', 'alice.cleaker.me'), 'cleaker.me@alice.cleaker.me');
// never twice, never invented
assert.equal(withSurface('cleaker.me@localhost', 'localhost'), 'cleaker.me@localhost');
assert.equal(withSurface('cleaker.me', ''), 'cleaker.me');
assert.equal(withSurface('', 'localhost'), '');
assert.equal(pageIsNamespace('evilcleaker.me', 'cleaker.me'), false, 'a label boundary, not a suffix of characters');
console.log('positionExpression: ok');
