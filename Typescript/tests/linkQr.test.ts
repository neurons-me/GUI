import assert from 'node:assert/strict';
import { hostNamesNamespace, linkQrValue, namespaceOfQrValue } from '../src/react/linkQr';

// a public namespace: the address already says it, the code stays the plain address
assert.equal(linkQrValue({ endpoint: 'https://cleaker.me', namespace: 'cleaker.me' }), 'https://cleaker.me');
assert.equal(linkQrValue({ endpoint: 'https://cleaker.me', namespace: 'cleaker.me', handle: 'ana' }), 'https://ana.cleaker.me');
assert.deepEqual(namespaceOfQrValue('https://cleaker.me'), { namespace: 'cleaker.me', handle: null, endpoint: 'https://cleaker.me', from: 'host' });

// ONE door, two namespaces: the codes differ, and each one gives its namespace back
const door = 'http://192.168.0.226:8080';
const a = linkQrValue({ endpoint: door, namespace: 'a.local' });
const b = linkQrValue({ endpoint: door, namespace: 'b.local' });
assert.notEqual(a, b, 'two links on one transport must not produce one code');
assert.equal(namespaceOfQrValue(a)?.namespace, 'a.local');
assert.equal(namespaceOfQrValue(b)?.namespace, 'b.local');
assert.equal(namespaceOfQrValue(a)?.endpoint, door);
assert.equal(a, 'http://192.168.0.226:8080/?namespace=a.local');
assert.equal(namespaceOfQrValue(a)?.from, 'parameter');

// a bare door says nothing about which namespace: that is reported, not guessed
assert.equal(namespaceOfQrValue(door)?.namespace, null);
// ...while `localhost` is a name (a declared one-label space): it is its own namespace unless a parameter says another
assert.equal(namespaceOfQrValue('http://localhost:55858')?.namespace, 'localhost');
assert.equal(namespaceOfQrValue('http://localhost:55858')?.from, 'host');
assert.equal(namespaceOfQrValue('http://localhost:55858/?namespace=a.local')?.namespace, 'a.local');
// one door at localhost serving two names: the code of each one is different and recoverable
assert.notEqual(linkQrValue({ endpoint: 'http://localhost:55858', namespace: 'localhost' }), linkQrValue({ endpoint: 'http://localhost:55858', namespace: 'a.local' }));
// an IP door never reads as a namespace; an IP door with the namespace carried does
assert.equal(namespaceOfQrValue('http://127.0.0.1:55858')?.namespace, null);
assert.equal(namespaceOfQrValue(linkQrValue({ endpoint: 'http://127.0.0.1:55858', namespace: 'localhost' }))?.namespace, 'localhost');
// the scheme is the one the door is reached by, and the address is not mangled
assert.equal(linkQrValue({ endpoint: 'http://192.168.0.226:8080', namespace: 'a.local' }), 'http://192.168.0.226:8080/?namespace=a.local');

// a handle on a local door keeps both: the handle in the path, the namespace from the host (`localhost`) or the parameter
const h = linkQrValue({ endpoint: 'http://localhost:55858', namespace: 'localhost', handle: 'ana' });
assert.deepEqual(namespaceOfQrValue(h), { namespace: 'localhost', handle: 'ana', endpoint: 'http://localhost:55858', from: 'host' });
const h2 = linkQrValue({ endpoint: 'http://localhost:55858', namespace: 'a.local', handle: 'ana' });
assert.deepEqual(namespaceOfQrValue(h2), { namespace: 'a.local', handle: 'ana', endpoint: 'http://localhost:55858', from: 'parameter' });

// a name under another namespace is not "the host names it"
assert.equal(hostNamesNamespace('https://evilcleaker.me', 'cleaker.me'), false);
assert.equal(hostNamesNamespace('https://x.cleaker.me', 'cleaker.me'), true);
assert.equal(linkQrValue({ endpoint: 'https://evilcleaker.me', namespace: 'cleaker.me' }), 'https://evilcleaker.me/?namespace=cleaker.me');

// not a web address: nothing is recovered
assert.equal(namespaceOfQrValue('me://a.local'), null);
assert.equal(namespaceOfQrValue('not a url'), null);
console.log('linkQr: ok');
