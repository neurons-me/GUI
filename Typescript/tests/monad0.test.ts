// "Is the monad answering here the one my session runs on?" decided only from what the transport answered and what
// the session is -- never from a name or a URL. monad0 is the reading that needs ALL of: a monad answered, its
// signature is not broken, a session is open on that same transport, and the monad answers for the session's namespace.
import assert from 'node:assert/strict';
import { readMonad0, type Monad0Facts } from '../src/react/session/monad0';

const T = 'http://localhost/apps/netget';
const answered = { monadId: 'monad:abc', monadName: 'netget', namespace: 'netget.local', signature: 'valid' as const };
const session = { transportOrigin: T, namespace: 'ana.netget.local' };
const base: Monad0Facts = { transport: T, answered, session };

// monad0: everything lines up (a handle under the root the monad answers for)
let r = readMonad0(base);
assert.equal(r.kind, 'monad0');
assert.ok(r.caveats.length > 0, 'monad0 never comes without saying what it does not establish');
assert.ok(r.caveats.some((c) => /nothing binds its key/.test(c)));
assert.ok(r.evidence.some((e) => /monad:abc/.test(e)));
assert.equal(readMonad0({ ...base, session: { transportOrigin: T, namespace: 'netget.local' } }).kind, 'monad0', 'the root itself');
assert.equal(readMonad0({ ...base, transport: `${T}/`, session: { transportOrigin: T.toUpperCase().replace('HTTP', 'http'), namespace: 'ana.netget.local' } }).kind, 'monad0', 'trailing slash and case do not matter');
assert.equal(readMonad0({ ...base, answered: { ...answered, signature: 'absent' } }).kind, 'monad0', 'no signed claim is minimal, not broken');
assert.ok(readMonad0({ ...base, answered: { ...answered, signature: 'absent' } }).caveats.some((c) => /no signed claim/.test(c)));

// none: nothing answered
r = readMonad0({ ...base, answered: null });
assert.equal(r.kind, 'none');
assert.ok(r.evidence[0].includes(T));

// never monad0 with a broken signature, even if everything else lines up
r = readMonad0({ ...base, answered: { ...answered, signature: 'invalid' } });
assert.equal(r.kind, 'monad');
assert.match(r.caveats[0], /failed to verify/);

// no session: a monad, whose it is cannot be told
r = readMonad0({ ...base, session: null });
assert.equal(r.kind, 'monad');
assert.match(r.caveats[0], /no session/);

// a session on ANOTHER transport is not this monad's
r = readMonad0({ ...base, session: { transportOrigin: 'http://localhost:8161', namespace: 'ana.netget.local' } });
assert.equal(r.kind, 'monad');
assert.match(r.caveats[0], /not here/);

// the monad did not say which namespace it answers for: not confirmed
assert.equal(readMonad0({ ...base, answered: { ...answered, namespace: null } }).kind, 'monad');

// a session in a namespace the monad does not answer for
assert.equal(readMonad0({ ...base, session: { transportOrigin: T, namespace: 'ana.other.local' } }).kind, 'monad');
assert.equal(readMonad0({ ...base, session: { transportOrigin: T, namespace: null } }).kind, 'monad');
// dot boundary: a name that merely ends with the root's text is not under it
assert.equal(readMonad0({ ...base, session: { transportOrigin: T, namespace: 'evilnetget.local' } }).kind, 'monad');
assert.equal(readMonad0({ ...base, session: { transportOrigin: T, namespace: 'ana.evilnetget.local' } }).kind, 'monad');

// the name of the monad is never what decides it
assert.equal(readMonad0({ ...base, answered: { ...answered, monadName: 'monad0' }, session: { transportOrigin: T, namespace: 'ana.other.local' } }).kind, 'monad');

console.log('monad0.test.ts: all assertions passed');
