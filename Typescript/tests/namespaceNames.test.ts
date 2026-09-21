import assert from 'node:assert/strict';

// What the person typed vs the namespace it names: a short name is completed with the monad's own
// namespace once; a name already complete under it is respected, never suffixed again.
const { splitTypedNamespace, buildGuessedFullNamespace, foreignNamespaceMessage } = await import('../src/gui/All.This/Cleaker/signedRequest');

const split = (typed: string, root = 'cleaker.me') => splitTypedNamespace(typed, root);

assert.deepEqual(split('jabellae'), { handle: 'jabellae', fullNamespace: 'jabellae.cleaker.me', kind: 'short' });
assert.deepEqual(split('jabellae.cleaker.me'), { handle: 'jabellae', fullNamespace: 'jabellae.cleaker.me', kind: 'complete' }, 'a complete name is not suffixed again');
assert.deepEqual(split('Jabellae.Cleaker.ME'), { handle: 'Jabellae', fullNamespace: 'jabellae.cleaker.me', kind: 'complete' }, 'case does not defeat it');
assert.deepEqual(split('  jabellae.cleaker.me  '), { handle: 'jabellae', fullNamespace: 'jabellae.cleaker.me', kind: 'complete' }, 'surrounding space is not part of the name');

// a handle is one DNS label, so a dotted name is a full name -- of THIS namespace (complete) or of another (foreign)
for (const typed of ['jabellae.other.me', 'a.b', 'notcleaker.me', 'cleaker.me', 'jabellae.cleaker.me.evil.example']) {
  const r = split(typed);
  assert.equal(r.kind, 'foreign', `${typed} is under another namespace`);
  assert.equal(r.fullNamespace, typed.toLowerCase(), `${typed}: the current namespace is never appended to it`);
}
// deeper names under this namespace are complete, not foreign
assert.deepEqual(split('a.b.cleaker.me'), { handle: 'a.b', fullNamespace: 'a.b.cleaker.me', kind: 'complete' });

// an email used as a username keeps its old (short) treatment
assert.equal(split('ana@example.com').kind, 'short');

// without a root nothing is stripped or guessed (unchanged behaviour)
assert.equal(splitTypedNamespace('jabellae', '').fullNamespace, 'jabellae.');
assert.equal(splitTypedNamespace('jabellae', '').kind, 'short');

// the vault key and the claimed namespace come from the same formula, so they cannot disagree
for (const typed of ['jabellae', 'jabellae.cleaker.me', 'Jabellae.Cleaker.ME']) {
  assert.equal(buildGuessedFullNamespace(typed, 'cleaker.me'), 'jabellae.cleaker.me');
}
assert.equal(buildGuessedFullNamespace('jabellae.other.me', 'cleaker.me'), 'jabellae.other.me', 'never rewritten into the current namespace');

// what the person is told
const message = foreignNamespaceMessage('jabellae.other.me', 'cleaker.me');
assert.match(message, /jabellae\.other\.me/);
assert.match(message, /not available yet/);
assert.match(message, /\.cleaker\.me/);

console.log('namespaceNames.test.ts: all assertions passed');
