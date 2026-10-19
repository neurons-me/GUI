import assert from 'node:assert/strict';
import { namespaceAddress } from '../src/react/namespaceAddress';

// the page is served by the namespace's own host: its scheme and port are the truth
assert.equal(namespaceAddress({ namespaceOrigin: 'http://localhost', pageOrigin: 'http://localhost:6016' }), 'http://localhost:6016');
// a transport on the same host wins, and keeps its origin (not its /apps/netget path)
assert.equal(
  namespaceAddress({ namespaceOrigin: 'https://netget.site', transport: 'https://netget.site/apps/netget', pageOrigin: 'https://netget.site' }),
  'https://netget.site',
);
// a different host is a different place: the namespace's own address, however the page is served
assert.equal(namespaceAddress({ namespaceOrigin: 'https://cleaker.me', pageOrigin: 'http://localhost:6016' }), 'https://cleaker.me');
assert.equal(
  namespaceAddress({ namespaceOrigin: 'http://disposable-test.local', transport: 'http://127.0.0.1:18322', pageOrigin: 'http://localhost:6016' }),
  'http://disposable-test.local',
);
// nothing to read (server render, no page): the name's own address
assert.equal(namespaceAddress({ namespaceOrigin: 'https://cleaker.me', pageOrigin: '' }), 'https://cleaker.me');
// garbage in the optional parts never breaks it
assert.equal(namespaceAddress({ namespaceOrigin: 'https://cleaker.me', transport: 'not a url', pageOrigin: null }), 'https://cleaker.me');

console.log('namespaceAddress: ok');
