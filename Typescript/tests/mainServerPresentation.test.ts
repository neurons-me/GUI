import assert from 'node:assert/strict';

// What the main-server screen says about the facts it was given, and what it must not infer from their absence.
const { hostnameOf, gatewayIdOf, describePublicIP, describeEntrypoints } = await import('../src/gui/All.This/netget/MainServer/mainServerPresentation');

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

console.log('mainServerPresentation: ok');
