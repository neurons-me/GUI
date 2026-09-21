import assert from 'node:assert/strict';

// What the person typed vs the namespace it names: a short name is completed with the monad's own
// namespace once; a name already complete under it is respected, never suffixed again.
const { splitTypedNamespace, buildGuessedFullNamespace } = await import('../src/gui/All.This/Cleaker/signedRequest');

const split = (typed: string, root = 'cleaker.me') => splitTypedNamespace(typed, root);

assert.deepEqual(split('jabellae'), { handle: 'jabellae', fullNamespace: 'jabellae.cleaker.me' });
assert.deepEqual(split('jabellae.cleaker.me'), { handle: 'jabellae', fullNamespace: 'jabellae.cleaker.me' }, 'a complete name is not suffixed again');
assert.deepEqual(split('Jabellae.Cleaker.ME'), { handle: 'Jabellae', fullNamespace: 'jabellae.cleaker.me' }, 'case does not defeat it');
assert.deepEqual(split('  jabellae.cleaker.me  '), { handle: 'jabellae', fullNamespace: 'jabellae.cleaker.me' }, 'surrounding space is not part of the name');

// a handle may itself contain dots: `a.b` is short, `a.b.cleaker.me` is complete
assert.deepEqual(split('a.b'), { handle: 'a.b', fullNamespace: 'a.b.cleaker.me' });
assert.deepEqual(split('a.b.cleaker.me'), { handle: 'a.b', fullNamespace: 'a.b.cleaker.me' });

// only a real label boundary counts as "complete"
assert.equal(split('notcleaker.me').fullNamespace, 'notcleaker.me.cleaker.me');
// a name under ANOTHER namespace is not recognised here (choosing a different namespace is selection and
// transport, not something the typed text can decide); it is treated as short
assert.equal(split('jabellae.other.me').fullNamespace, 'jabellae.other.me.cleaker.me');

// without a root nothing is stripped or guessed (unchanged behaviour)
assert.equal(splitTypedNamespace('jabellae', '').fullNamespace, 'jabellae.');

// the vault key and the claimed namespace come from the same formula, so they cannot disagree
for (const typed of ['jabellae', 'jabellae.cleaker.me', 'Jabellae.Cleaker.ME']) {
  assert.equal(buildGuessedFullNamespace(typed, 'cleaker.me'), 'jabellae.cleaker.me');
}

console.log('namespaceNames.test.ts: all assertions passed');
