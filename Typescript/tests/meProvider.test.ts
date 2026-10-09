// <Me> provides a `.me` and its namespace; useOptionalMe finds it (what <Cleaker> relies on). Rendered on the server
// renderer: no DOM needed, and the provider draws nothing of its own.
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ME from 'this.me';
import { Me } from '../src/react/Me';
import { useOptionalMe } from '../src/react/useMe';
import { readMeNamespace } from '../src/react/meNamespace';

type Seen = { found: boolean; namespace: string; transport: string | null };
function seenFrom(tree: (probe: React.ReactElement) => React.ReactElement): Seen {
  let seen: Seen | null = null;
  const Probe = () => {
    const found = useOptionalMe();
    seen = { found: Boolean(found), namespace: readMeNamespace(found?.me), transport: found?.transport ?? null };
    return null;
  };
  renderToStaticMarkup(tree(React.createElement(Probe)));
  assert.ok(seen, 'the probe rendered');
  return seen;
}

// a namespace is enough: <Me> makes the kernel
assert.deepEqual(
  seenFrom((probe) => React.createElement(Me, { namespace: 'cleaker.me' }, probe)),
  { found: true, namespace: 'cleaker.me', transport: null },
);

// where the .me is reached, when that is not the namespace's own address
assert.deepEqual(
  seenFrom((probe) => React.createElement(Me, { namespace: 'localhost', transport: 'http://localhost/apps/netget' }, probe)),
  { found: true, namespace: 'localhost', transport: 'http://localhost/apps/netget' },
);

// a .me that already exists is used as it is (its own namespace is read back)
const existing = new (ME as any)('verify-user', 'verify-throwaway-secret', { namespace: 'disposable-test.local' });
assert.deepEqual(
  seenFrom((probe) => React.createElement(Me, { me: existing }, probe)),
  { found: true, namespace: 'disposable-test.local', transport: null },
);

// no <Me> above: nothing is found, nothing is invented
assert.deepEqual(seenFrom((probe) => probe), { found: false, namespace: '', transport: null });

// a .me with no namespace is found, and says it has none
assert.deepEqual(
  seenFrom((probe) => React.createElement(Me, { me: new (ME as any)() }, probe)),
  { found: true, namespace: '', transport: null },
);

console.log('meProvider: ok');
