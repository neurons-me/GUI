// <Me> provides a `.me` and its namespace; useOptionalMe finds it (what <Cleaker> relies on). Rendered on the server
// renderer: no DOM needed, and the provider draws nothing of its own.
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ME from 'this.me';
import { Me } from '../src/react/Me';
import { useOptionalMe } from '../src/react/useMe';
import { readMeNamespace, readMeNamedNamespace, readMeUsername } from '../src/react/meNamespace';

type Seen = { found: boolean; namespace: string; transport: string | null; username?: string; named?: string };
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

// a handle: declared, normalized, and named inside the root; no secret, no session
const identity = (tree: (probe: React.ReactElement) => React.ReactElement) => {
  let out: { root: string; username: string; named: string } | null = null;
  const Probe = () => {
    const found = useOptionalMe();
    out = { root: readMeNamespace(found?.me), username: readMeUsername(found?.me), named: readMeNamedNamespace(found?.me) };
    return null;
  };
  renderToStaticMarkup(tree(React.createElement(Probe)));
  assert.ok(out);
  return out;
};
assert.deepEqual(
  identity((probe) => React.createElement(Me, { username: 'Ana', namespace: 'cleaker.me' }, probe)),
  { root: 'cleaker.me', username: 'ana', named: 'ana.cleaker.me' },
);
// the root a gateway serves can be a single label: the factory in this.me would refuse it, <Me> does not
assert.deepEqual(
  identity((probe) => React.createElement(Me, { username: 'ana', namespace: 'localhost' }, probe)),
  { root: 'localhost', username: 'ana', named: 'ana.localhost' },
);
// a handle with no root is declared, but names nothing
assert.deepEqual(
  identity((probe) => React.createElement(Me, { username: 'ana' }, probe)),
  { root: '', username: 'ana', named: '' },
);
// a root alone declares no handle
assert.deepEqual(
  identity((probe) => React.createElement(Me, { namespace: 'cleaker.me' }, probe)),
  { root: 'cleaker.me', username: '', named: '' },
);

// two sources for one .me is an error, not a precedence rule
for (const props of [{ me: existing, namespace: 'cleaker.me' }, { me: existing, username: 'ana' }]) {
  assert.throws(
    () => renderToStaticMarkup(React.createElement(Me, props as any, React.createElement('i'))),
    /either `me` or `namespace` \/ `username`, not both/,
  );
}

console.log('meProvider: ok');
