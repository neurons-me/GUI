// The identity agent's protocol (src/agent/protocol.ts): the canonical encoding matches the one the gateway already
// verifies (signedRequest.ts), the v2 bytes bind what an approval must be bound to, and malformed or overreaching
// requests are refused before anything is shown or signed.
import assert from 'node:assert/strict';
import { canonicalJson as gatewayCanonicalJson, canonicalizeQuery as gatewayCanonicalizeQuery } from '../src/gui/All.This/Cleaker/signedRequest';
import {
  AGENT_PROTOCOL,
  EMPTY_BODY_SHA256,
  PROOF_V2_TAG,
  buildReadFields,
  buildV2Bytes,
  canonicalJson,
  parseV2Bytes,
  canonicalizeQuery,
  isOrigin,
  parseRequest,
  validateOperation,
  type ReadOperation,
} from '../src/agent/protocol';
import { createHash } from 'node:crypto';

const op: ReadOperation = { action: 'read', namespace: 'test.local', audience: 'http://127.0.0.1:4000', method: 'GET', path: '/domains', query: '[]', ttlMs: 60_000 };

// same encodings as the gateway's
const sample = { path: '/x', method: 'GET', nonce: 'n', bodyHash: 'h', timestamp: 1, query: '[]' };
assert.equal(canonicalJson(sample), gatewayCanonicalJson(sample));
const qs = new URLSearchParams('b=2&a=1&a=0');
assert.equal(canonicalizeQuery(qs), gatewayCanonicalizeQuery(qs));
assert.equal(EMPTY_BODY_SHA256, createHash('sha256').update('').digest('hex'));

// v2: what is signed starts with the tag and carries every bound field (Agent-Protocol.md R7)
const fields = buildReadFields({ operation: op, requestingOrigin: 'http://host.test', identityHash: 'h'.repeat(64), keyId: 'k'.repeat(32), nonce: 'abc', issuedAt: 1000 });
const bytes = buildV2Bytes(fields);
assert.ok(bytes.startsWith(PROOF_V2_TAG));
assert.deepEqual(parseV2Bytes(bytes), {
  audience: op.audience, bodyHash: EMPTY_BODY_SHA256, expiresAt: 61_000, identityHash: 'h'.repeat(64), issuedAt: 1000, keyId: 'k'.repeat(32),
  method: 'GET', nonce: 'abc', op: 'read', origin: 'http://host.test', path: '/domains', query: '[]', v: 'me-proof/2',
});
// a v2 message is not JSON, so a v1 verifier (which JSON.parses the message) cannot read it (N9)
assert.throws(() => JSON.parse(bytes));
// strict: no tag, a missing or an extra field, or a non-canonical encoding is not a v2 message
assert.equal(parseV2Bytes(canonicalJson(fields as unknown as Record<string, unknown>)), null, 'no tag');
const { keyId: _drop, ...missing } = fields;
assert.equal(parseV2Bytes(PROOF_V2_TAG + canonicalJson(missing)), null, 'missing field');
assert.equal(parseV2Bytes(PROOF_V2_TAG + canonicalJson({ ...fields, extra: 1 })), null, 'extra field');
assert.equal(parseV2Bytes(PROOF_V2_TAG + JSON.stringify(fields)), null, 'not canonical');
assert.equal(parseV2Bytes(PROOF_V2_TAG + canonicalJson({ ...fields, v: 'me-proof/3' })), null, 'unknown version');

// operations: only the one read, exactly shaped
assert.equal(validateOperation(op), null);
const bad: Array<[string, unknown]> = [
  ['write action', { ...op, action: 'write' }],
  ['POST', { ...op, method: 'POST' }],
  ['audience with a path', { ...op, audience: 'http://127.0.0.1:4000/x' }],
  ['audience not http(s)', { ...op, audience: 'javascript:alert(1)' }],
  ['path traversal', { ...op, path: '/a/../admin' }],
  ['relative path', { ...op, path: 'domains' }],
  ['namespace with a slash', { ...op, namespace: 'cleaker.me\\' }],
  ['query not canonical', { ...op, query: 'a=1' }],
  ['ttl too long', { ...op, ttlMs: 24 * 3600_000 }],
  ['extra field', { ...op, origin: 'https://trusted.example' }],
];
for (const [what, value] of bad) assert.notEqual(validateOperation(value), null, what);

// requests: the envelope is exact too
const good = { protocol: AGENT_PROTOCOL, type: 'agent.request', id: 'f'.repeat(32), operation: op };
assert.ok(parseRequest(good));
assert.equal(parseRequest({ ...good, origin: 'https://trusted.example' }), null, 'a request cannot name its own origin');
assert.equal(parseRequest({ ...good, id: 'not-hex' }), null);
assert.equal(parseRequest({ ...good, protocol: 'me-agent/0' }), null);
assert.equal(parseRequest({ ...good, operation: { ...op, method: 'DELETE' } }), null);

assert.ok(isOrigin('https://cleaker.me') && isOrigin('http://127.0.0.1:5173'));
assert.ok(!isOrigin('https://cleaker.me/') && !isOrigin('file:///x') && !isOrigin('cleaker.me'));

// ── admitted writes: the netget gateway bootstrap (Agent-Protocol.md section 3a) ──────────────────────────────────
// A storage spy BEFORE the approval kernel is loaded: the temporary kernel must write nothing (no this.me.seed:v1).
const storageWrites: string[] = [];
(globalThis as any).localStorage = { getItem: () => null, setItem: (k: string) => { storageWrites.push(k); }, removeItem: (k: string) => { storageWrites.push(`-${k}`); }, clear() {}, key: () => null, length: 0 };
const { canonicalBody, sha256Hex, buildCallFields } = await import('../src/agent/protocol');
const { validateCall, ADMITTED_OPERATIONS } = await import('../src/agent/admittedOperations');
const { validateCallRequest, approvalFor, approvedCallBytes, ApprovalInvalidated } = await import('../src/agent/approval');
const { approvalView, APPROVAL_KERNEL_SEED } = await import('../src/agent/approvalKernel');

let callChecks = 0;
const ok = (cond: unknown, what: string) => { assert.ok(cond, what); callChecks += 1; };

const challengeFor = (gatewayId: string, nonce = 'n'.repeat(22)) => canonicalBody({ purpose: 'gateway-claim', gatewayId, nonce, timestamp: 1_800_000_000_000 });
async function bootstrapOp(gatewayId: string, extra: Record<string, unknown> = {}) {
  const body = { gatewayId, challenge: challengeFor(gatewayId) };
  return {
    action: 'call', kind: 'netget.gateway.bootstrap', namespace: 'test.local', audience: 'http://127.0.0.1:4000', method: 'POST',
    path: `/api/v1/gateway/${gatewayId}/bootstrap`, body, bodyHash: await sha256Hex(canonicalBody(body)), ttlMs: 120_000, ...extra,
  } as any;
}
const HOST = 'http://host.test';
const RID = 'a'.repeat(32);

// encodings
ok(canonicalBody({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: null } }) === '{"a":{"c":null,"d":[2,{"y":2,"z":1}]},"b":1}', 'canonicalBody sorts keys at every level');
assert.throws(() => canonicalBody({ a: undefined as unknown as null }), 'undefined is not plain JSON');
assert.throws(() => canonicalBody({ a: new Date() as unknown as null }), 'a Date is not plain JSON');
ok((await sha256Hex('')) === EMPTY_BODY_SHA256, 'sha256Hex = node sha256');

// shape (protocol.ts) and admission (admittedOperations.ts)
const opA = await bootstrapOp('gw-alpha');
ok(validateOperation(opA) === null, 'a bootstrap call has an acceptable shape');
ok(parseRequest({ protocol: AGENT_PROTOCOL, type: 'agent.request', id: RID, operation: opA }), 'a bootstrap request parses');
ok((await validateCall(opA)).ok, 'netget.gateway.bootstrap is admitted');
ok(Object.keys(ADMITTED_OPERATIONS).join() === 'netget.gateway.bootstrap', 'exactly one admitted operation in the first cut');
const refusedShape: Array<[string, unknown]> = [
  ['unknown envelope field', { ...opA, description: 'Sign in' }],
  ['GET call', { ...opA, method: 'GET' }],
  ['bodyHash not hex', { ...opA, bodyHash: 'xyz' }],
  ['body not an object', { ...opA, body: 'x' }],
  ['appLabel too long', { ...opA, appLabel: 'x'.repeat(500) }],
  ['audience with a path', { ...opA, audience: 'http://127.0.0.1:4000/x' }],
];
for (const [what, v] of refusedShape) ok(validateOperation(v) !== null, `shape refused: ${what}`);
const refusedAdmission: Array<[string, any]> = [
  ['unknown operation', { ...opA, kind: 'netget.gateway.transfer' }],
  ['bodyHash mismatch', { ...opA, bodyHash: 'f'.repeat(64) }],
  ['extra body field (an explanation is not a parameter)', await (async () => { const body = { ...opA.body, explain: { value: true } }; return { ...opA, body, bodyHash: await sha256Hex(canonicalBody(body)) }; })()],
  ['path for another gateway', { ...opA, path: '/api/v1/gateway/gw-other/bootstrap' }],
  ['challenge for another gateway', await (async () => { const body = { gatewayId: 'gw-alpha', challenge: challengeFor('gw-other') }; return { ...opA, body, bodyHash: await sha256Hex(canonicalBody(body)) }; })()],
  ['challenge not canonical', await (async () => { const body = { gatewayId: 'gw-alpha', challenge: JSON.stringify({ purpose: 'gateway-claim', gatewayId: 'gw-alpha', nonce: 'n'.repeat(22), timestamp: 1 }) }; return { ...opA, body, bodyHash: await sha256Hex(canonicalBody(body)) }; })()],
  ['challenge with another purpose', await (async () => { const body = { gatewayId: 'gw-alpha', challenge: canonicalBody({ purpose: 'sign-in', gatewayId: 'gw-alpha', nonce: 'n'.repeat(22), timestamp: 1 }) }; return { ...opA, body, bodyHash: await sha256Hex(canonicalBody(body)) }; })()],
];
for (const [what, v] of refusedAdmission) ok(!(await validateCall(v)).ok, `admission refused: ${what}`);

// the app's label is ignored: same digest, same operation, label nowhere in what is shown or signed
const labelled = await validateCallRequest(RID, { ...opA, appLabel: 'Sign in to netget (harmless)' }, HOST);
const plain = await validateCallRequest(RID, opA, HOST);
assert.ok(labelled.ok && plain.ok);
if (!labelled.ok || !plain.ok) throw new Error('unreachable');
ok(labelled.validated.digest === plain.validated.digest, 'a misleading appLabel does not change the approval digest');
ok(!JSON.stringify(labelled.validated).includes('Sign in'), 'the label is not in the validated request');
ok(labelled.admitted.title(labelled.validated.operation.body as any) === 'Claim gateway gw-alpha', 'the operation is named by the agent table');

// frozen: a mutation throws (strict mode) and the digest does not move
assert.throws(() => { (labelled.validated.operation.body as any).gatewayId = 'gw-evil'; }, TypeError);
assert.throws(() => { (labelled.validated as any).origin = 'https://evil.test'; }, TypeError);
ok(labelled.validated.operation.body.gatewayId === 'gw-alpha', 'the validated request cannot be mutated');

// one approval, bound to the digest of what was shown
const signer = { identityHash: 'h'.repeat(64), keyId: 'k'.repeat(32), identityNamespace: 'me1.test.local' };
const approval = approvalFor(plain.validated);
const signed = await approvedCallBytes(approval, plain.validated, signer, 'nonce-1', 1000);
const parsedCall = parseV2Bytes(signed.bytes) as any;
ok(parsedCall && parsedCall.op === 'call' && parsedCall.kind === 'netget.gateway.bootstrap' && parsedCall.path === '/api/v1/gateway/gw-alpha/bootstrap'
  && parsedCall.bodyHash === opA.bodyHash && parsedCall.origin === HOST && parsedCall.audience === opA.audience && parsedCall.namespace === 'me1.test.local'
  && parsedCall.expiresAt === 121_000, 'the approved request signs exactly its own fields (v2 call)');
ok(signed.bytes === buildV2Bytes(buildCallFields({ operation: plain.validated.operation, requestingOrigin: HOST, ...signer, nonce: 'nonce-1', issuedAt: 1000 })), 'signed bytes = canonical v2 bytes');
// any field changed after display -> the old approval signs nothing
const alterations: Array<[string, any]> = [
  ['gateway', await bootstrapOp('gw-beta')],
  ['audience', { ...opA, audience: 'http://127.0.0.1:4001' }],
  ['ttl', { ...opA, ttlMs: 300_000 }],
  ['namespace', { ...opA, namespace: 'other.local' }],
  ['challenge', await (async () => { const body = { gatewayId: 'gw-alpha', challenge: challengeFor('gw-alpha', 'm'.repeat(22)) }; return { ...opA, body, bodyHash: await sha256Hex(canonicalBody(body)) }; })()],
];
for (const [what, altered] of alterations) {
  const v = await validateCallRequest(RID, altered, HOST);
  assert.ok(v.ok, `altered ${what} is itself valid`);
  if (!v.ok) continue;
  await assert.rejects(approvedCallBytes(approval, v.validated, signer, 'n2', 1000), ApprovalInvalidated, `altered ${what}: the old approval is invalid`);
  callChecks += 1;
}
const otherOrigin = await validateCallRequest(RID, opA, 'https://evil.test');
if (otherOrigin.ok) { await assert.rejects(approvedCallBytes(approval, otherOrigin.validated, signer, 'n3', 1000), ApprovalInvalidated); callChecks += 1; }
// a forged "validated" object that copies the approved digest but carries another operation
const beta = await validateCallRequest(RID, await bootstrapOp('gw-beta'), HOST);
if (beta.ok) { await assert.rejects(approvedCallBytes(approval, { ...beta.validated, digest: approval.digest }, signer, 'n4', 1000), ApprovalInvalidated, 'forged digest field'); callChecks += 1; }

// v2 call bytes are strict too
ok(parseV2Bytes(PROOF_V2_TAG + canonicalJson({ ...parsedCall, explain: true })) === null, 'a call proof with an extra field is not a v2 message');

// the temporary kernel: the agent's rules, explained, nothing written anywhere
const view = approvalView(plain.validated, plain.admitted);
const eff = Object.fromEntries(view.effects.map((e) => [e.name, e]));
ok(eff.makesYouOwner.value === true && eff.givesControlAway.value === false && eff.shortLived.value === true, 'effects computed by the agent rules');
ok(eff.makesYouOwner.sentence.includes('gw-alpha') && eff.makesYouOwner.sentence.includes(opA.audience), 'effect words filled from validated facts');
ok(eff.makesYouOwner.inputs.map((i) => i.path).join() === 'request.claimsGateway,request.hasTarget', 'explain() trace names the exact request facts');
ok(storageWrites.length === 0, `the approval kernel writes no storage (saw: ${storageWrites.join(',')})`);
ok(APPROVAL_KERNEL_SEED === 'agent-approval:public-test' && !JSON.stringify(view).includes(APPROVAL_KERNEL_SEED), 'public test seed, not in the view');
ok(Object.isFrozen(view) && Object.isFrozen(view.effects[0]), 'the view is frozen');
console.log(`agentProtocol (bootstrap call): ${callChecks} checks ok`);

console.log('agentProtocol: ok');
