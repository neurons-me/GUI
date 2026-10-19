import assert from 'node:assert/strict';

// What the main-server screen says about the facts it was given, and what it must not infer from their absence.
const { hostnameOf, gatewayIdOf, describePublicIP, describeEntrypoints, describePort, describeDoor, describeClaim, isOperatorView, readAdminSessionToken, isLocalMeshValue, ADMIN_SESSION_STORAGE_KEY } = await import('../src/gui/All.This/netget/MainServer/mainServerPresentation');

// gatewayId (stable identity) and hostname (the machine's name) are different facts; one never stands in for the other
const identity = { gatewayId: 'Gateway-ABC123', hostname: 'Netget-VM' };
assert.equal(hostnameOf(identity), 'netget-vm');
assert.equal(gatewayIdOf(identity), 'Gateway-ABC123', 'an identifier is shown as it is, not lower-cased like a name');
assert.equal(hostnameOf({ gatewayId: 'gw-1' }), '', 'a gateway that does not report a hostname has none -- the gatewayId is not used instead');
assert.equal(hostnameOf({ gatewayId: 'gw-1', hostname: 42 }), '');
assert.equal(hostnameOf(null), '');
assert.equal(gatewayIdOf(undefined), '');

// an IP nobody configured is "not configured", not a claim that the gateway is local-only
assert.deepEqual(describePublicIP(''), { text: 'not configured', configured: false });
assert.deepEqual(describePublicIP(null), { text: 'not configured', configured: false });
assert.deepEqual(describePublicIP('   '), { text: 'not configured', configured: false });
assert.deepEqual(describePublicIP('203.0.113.7'), { text: '203.0.113.7', configured: true });
assert.doesNotMatch(describePublicIP('').text, /local/i, 'no "local-only" inference from an empty value');

// an /entrypoints that did not answer (404, refused, not JSON -> null) is not the same as an answer with no entries
assert.deepEqual(describeEntrypoints(null), { kind: 'unavailable' });
assert.deepEqual(describeEntrypoints(undefined), { kind: 'unavailable' });
assert.deepEqual(describeEntrypoints({}), { kind: 'unavailable' }, 'a body without the list is not an empty list');
assert.deepEqual(describeEntrypoints({ entrypoints: 'nope' }), { kind: 'unavailable' });
assert.deepEqual(describeEntrypoints({ entrypoints: [] }), { kind: 'empty' });
assert.deepEqual(describeEntrypoints({ entrypoints: [{ host: 'netget.site' }, { host: ' cleaker.me ' }, { nohost: true }, null] }), { kind: 'list', rows: ['netget.site', 'cleaker.me'] });
assert.deepEqual(describeEntrypoints({ entrypoints: [{ nohost: true }] }), { kind: 'empty' }, 'entries without a host are not shown as rows');

// an /openresty-status that did not answer (401 for a non-operator, 404, refusal, not JSON -> null) says nothing about the
// ports: it is "unavailable", never "not listening"
assert.equal(describePort(null, 'httpListening'), 'unavailable');
assert.equal(describePort(undefined, 'httpsListening'), 'unavailable');
assert.equal(describePort({ ok: false, error: 'Unauthorized' }, 'httpListening'), 'unavailable', 'an error body is not a report of a closed port');
assert.equal(describePort({}, 'httpListening'), 'unavailable', 'a body without the field is not "false"');
assert.equal(describePort({ httpListening: 'true' }, 'httpListening'), 'unavailable', 'only an explicit boolean counts');
assert.equal(describePort({ httpListening: null }, 'httpListening'), 'unavailable');
assert.equal(describePort({ ok: true, httpListening: true, httpsListening: false }, 'httpListening'), 'listening');
assert.equal(describePort({ ok: true, httpListening: true, httpsListening: false }, 'httpsListening'), 'not-listening', 'an explicit false is a real negative');

console.log('mainServerPresentation: ok');
// a refusal to THIS caller is a fact about who is asking, not a port that is down and not a request that failed
assert.equal(describePort(null, 'httpListening', 401), 'restricted');
assert.equal(describePort({ ok: false, error: 'Unauthorized' }, 'httpsListening', 403), 'restricted');
assert.equal(describePort(null, 'httpListening', 404), 'unavailable', 'a 404 says nothing about who is asking');
assert.equal(describePort(null, 'httpListening', 0), 'unavailable', 'no answer at all');
assert.equal(describePort({ ok: true, httpListening: false }, 'httpListening', 200), 'not-listening');

// the public address with the gateway's own detection record: only what is known, nothing about reachability
const seen = { state: 'detected', observedAt: '2026-10-11T12:00:00.000Z', checkedAt: '2026-10-11T12:00:00.000Z' };
assert.deepEqual(describePublicIP('34.28.109.244', seen), { text: '34.28.109.244', configured: true }, 'a successful check is the address alone');
const stale = { state: 'failed', observedAt: '2026-10-11T12:00:00.000Z', checkedAt: '2026-10-12T12:00:00.000Z', error: 'HTTP 503' };
assert.equal(describePublicIP('34.28.109.244', stale).text, '34.28.109.244 · last known, observed 2026-10-11; the latest check failed: HTTP 503');
assert.deepEqual(describePublicIP('', { state: 'pending' }), { text: 'not detected yet', configured: false });
assert.deepEqual(describePublicIP('', { state: 'failed', error: 'no answer within 3000 ms' }), { text: 'not detected · the check failed: no answer within 3000 ms', configured: false });
assert.deepEqual(describePublicIP('', { state: 'bogus' } as any), { text: 'not configured', configured: false }, 'an unknown state falls back to the earlier wording');
assert.doesNotMatch(describePublicIP('34.28.109.244', seen).text, /online|reachable|accessible/i);
console.log('mainServerPresentation (public address detection): ok');

// The door and the namespace it points to are two facts on one line; a local mesh name is not a public door.
assert.deepEqual(describeDoor('netget.site', 'cleaker.me'), { door: 'netget.site', namespace: 'cleaker.me' });
assert.deepEqual(describeDoor('local.netget', 'cleaker.me'), { door: null, namespace: 'cleaker.me' }, 'a local name is not a public door');
assert.deepEqual(describeDoor('localhost', ''), { door: null, namespace: null });
assert.deepEqual(describeDoor(null, undefined), { door: null, namespace: null });
assert.deepEqual(describeDoor('  netget.site ', ' cleaker.me '), { door: 'netget.site', namespace: 'cleaker.me' }, 'whitespace is not part of a name');
assert.equal(isLocalMeshValue('Local.Cleaker'), true);
assert.equal(isLocalMeshValue('cleaker.me'), false);

// The stored admin session: only what the operator's own sign-in left under the key LogsView uses.
const store = (value: string | null) => ({ getItem: (k: string) => (k === ADMIN_SESSION_STORAGE_KEY ? value : null) });
assert.equal(ADMIN_SESSION_STORAGE_KEY, 'netget:admin-session-token');
assert.equal(readAdminSessionToken(store('tok-1')), 'tok-1');
assert.equal(readAdminSessionToken(store(null)), null);
assert.equal(readAdminSessionToken(store('')), null);
assert.equal(readAdminSessionToken({ getItem() { throw new Error('private mode'); } }), null, 'a storage that throws is no token');

// The operator's part of the screen needs a token AND a status route that did not refuse it.
assert.equal(isOperatorView('tok', 'listening'), true);
assert.equal(isOperatorView('tok', 'not-listening'), true, 'a closed port is still the operator reading the machine');
assert.equal(isOperatorView('tok', 'unavailable'), true, 'the route failing is not a refusal');
assert.equal(isOperatorView('tok', 'restricted'), false, 'a token the gateway refused is a visitor');
assert.equal(isOperatorView(null, 'listening'), false, 'no session, no operator view even if the route answered');
assert.equal(isOperatorView('', 'listening'), false);

// One line about the claim, from what the payload says and nothing it does not.
assert.equal(describeClaim({ bootstrapped: true, adminCount: 1, updatedAt: 1790013004738 }), 'claimed · 1 admin · updated 2026-09-21');
assert.equal(describeClaim({ bootstrapped: true, adminCount: 3 }), 'claimed · 3 admins');
assert.equal(describeClaim({ bootstrapped: true }), 'claimed');
assert.equal(describeClaim({ bootstrapped: true, adminCount: 'x', updatedAt: 'x' }), 'claimed', 'a malformed field is left out, not guessed');
assert.equal(describeClaim({ bootstrapped: true, updatedAt: 1e20 }), 'claimed', 'a timestamp that is not a date is left out');
assert.equal(describeClaim({ bootstrapped: false, adminCount: 0 }), null, 'an unclaimed gateway has no claim to describe');
assert.equal(describeClaim(null), null);
