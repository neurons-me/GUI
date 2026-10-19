// The GUI's own namespace parser: the port is the transport, not the namespace.
import assert from 'node:assert/strict';
import { buildCleakerNamespaceUrl, parseCleakerNamespaceExpression } from '../../src/gui/All.This/Cleaker/namespaceExpression';
import { checkWrittenDoor } from '../../src/react/link';

let n = 0;
const test = (name: string, fn: () => void) => { try { fn(); console.log(`PASS ${name}`); n += 1; } catch (e: any) { console.log(`FAIL ${name}\n       ${String(e.message).split('\n')[0]}`); process.exitCode = 1; } };

test('P1 fqdn and constant do not include the port; transport does', () => {
  const p = parseCleakerNamespaceExpression('ana.name.space:8080');
  assert.equal(p.fqdn, 'ana.name.space');
  assert.equal(p.constant, 'name.space');
  assert.equal(p.prefix, 'ana');
  assert.equal(p.transport.port, 8080);
  assert.equal(p.transport.origin, 'https://ana.name.space:8080');
});
test('P2 name.space and name.space:8080: one namespace, two transports', () => {
  const a = parseCleakerNamespaceExpression('name.space');
  const b = parseCleakerNamespaceExpression('name.space:8080');
  assert.equal(a.constant, b.constant);
  assert.notEqual(a.transport.origin, b.transport.origin);
});
test('P3 localhost keeps its namespace across ports (compat change from NS1 in cleaker)', () => {
  const a = parseCleakerNamespaceExpression('localhost:55858');
  const b = parseCleakerNamespaceExpression('localhost:55859');
  assert.equal(a.constant, 'localhost');
  assert.equal(a.constant, b.constant);
  assert.equal(a.transport.origin, 'http://localhost:55858');
  assert.notEqual(a.transport.origin, b.transport.origin);
});
test('P4 the written address round-trips', () => {
  assert.equal(parseCleakerNamespaceExpression('name.space:8080').expression, 'name.space:8080');
  assert.equal(parseCleakerNamespaceExpression('localhost:55858/.me').expression, 'localhost:55858/.me');
});
test('P5 an IPv4 door is one host', () => {
  const p = parseCleakerNamespaceExpression('192.168.0.226:8080');
  assert.equal(p.constant, '192.168.0.226');
  assert.equal(p.prefix, null);
  assert.equal(p.transport.port, 8080);
});
test('P6 the address built for a namespace keeps its door (and the scheme)', () => {
  assert.equal(buildCleakerNamespaceUrl('http://localhost:55858'), 'http://localhost:55858');
  assert.equal(buildCleakerNamespaceUrl('https://name.space:8080'), 'https://name.space:8080');
  assert.equal(buildCleakerNamespaceUrl('http://localhost:55858', 'ana'), 'http://localhost:55858/@ana');
});
test('P7 a written port against a link: agrees / refines / conflict, never ignored', () => {
  assert.deepEqual(checkWrittenDoor({ namespace: 'name.space', transport: 'https://name.space:8080' }, 8080), { state: 'agrees', port: 8080 });
  assert.deepEqual(checkWrittenDoor({ namespace: 'name.space', transport: 'https://name.space' }, 8080), { state: 'refines', port: 8080 });
  assert.deepEqual(checkWrittenDoor({ namespace: 'name.space', transport: 'https://name.space:9090' }, 8080), { state: 'conflict', written: 8080, link: 9090 });
  assert.deepEqual(checkWrittenDoor({ namespace: 'name.space', transport: 'https://name.space:9090' }, null), { state: 'none' });
});
console.log(`\n${n}/7`);
