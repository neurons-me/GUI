// <Me> provides a local `.me` and the handle it declares; useOptionalMe finds it (what <Cleaker> relies on). Rendered on
// the server renderer: no DOM needed, and the provider draws nothing of its own. It says nothing about namespaces: a
// `.me` is linked to those from outside (<Cleaker namespace>).
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ME from 'this.me';
import { Me } from '../src/react/Me';
import { useOptionalMe } from '../src/react/useMe';
import { readMeUsername, writeMeUsername } from '../src/react/meIdentity';

type Seen = { found: boolean; username: string; me: unknown };
function seenFrom(tree: (probe: React.ReactElement) => React.ReactElement): Seen {
  let seen: Seen | null = null;
  const Probe = () => {
    const found = useOptionalMe();
    seen = { found: Boolean(found), username: readMeUsername(found?.me), me: found?.me ?? null };
    return null;
  };
  renderToStaticMarkup(tree(React.createElement(Probe)));
  assert.ok(seen, 'the probe rendered');
  return seen;
}

// no <Me> above: nothing is found, nothing is invented
{
  const seen = seenFrom((probe) => probe);
  assert.equal(seen.found, false);
  assert.equal(seen.username, '');
}

// a bare <Me> makes a local .me, with no handle
{
  const seen = seenFrom((probe) => React.createElement(Me, null, probe));
  assert.equal(seen.found, true);
  assert.equal(seen.username, '');
}

// a handle is declared and normalized; no secret, no session
assert.equal(seenFrom((probe) => React.createElement(Me, { username: 'Ana' }, probe)).username, 'ana');

// a .me that already exists is provided as it is
{
  const existing: any = new (ME as any)();
  writeMeUsername(existing, 'robot-1');
  const seen = seenFrom((probe) => React.createElement(Me, { me: existing }, probe));
  assert.equal(seen.me, existing, 'the very same object, not a copy');
  assert.equal(seen.username, 'robot-1');

  // two <Me> given the same .me share it; each given nothing makes its own
  const a = seenFrom((probe) => React.createElement(Me, { me: existing }, probe));
  const b = seenFrom((probe) => React.createElement(Me, { me: existing }, probe));
  assert.equal(a.me, b.me);
  const c = seenFrom((probe) => React.createElement(Me, null, probe));
  const d = seenFrom((probe) => React.createElement(Me, null, probe));
  assert.notEqual(c.me, d.me);
}

// `me={null}` provides nothing here: whatever sits above passes through (what SeedSessionProvider relies on)
{
  const seen = seenFrom((probe) =>
    React.createElement(Me, { username: 'outer' }, React.createElement(Me, { me: null }, probe)),
  );
  assert.equal(seen.found, true);
  assert.equal(seen.username, 'outer');
}

// two sources for one .me is an error, not a precedence rule
assert.throws(
  () => renderToStaticMarkup(React.createElement(Me, { me: new (ME as any)(), username: 'ana' } as any, React.createElement('i'))),
  /either `me` or `username`, not both/,
);

console.log('meProvider: ok');
