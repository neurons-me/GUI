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

console.log('agentProtocol: ok');
