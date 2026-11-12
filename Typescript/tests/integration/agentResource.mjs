// The TEST verifier for the identity agent's first cut (Agent-Protocol.md section 10). Disposable: started by
// tests/integration/agent.browser.test.mjs, nothing real behind it. It serves:
//   POST /register   a NEW identity created in the agent: claim + agent key + `agent-only`, in one atomic step (R10-R11)
//   GET  /domains    one protected read, authorized on EVERY request (custody contract section 6)
// and keeps its own security state (R13-R16): the identities (claim, keys, agent-only, revoked), the nonce store
// (reserved only after a proof is fully validated, atomically, fail-closed when unavailable) and the time it started
// (proofs issued before it are refused after a restart).
//
// Permission is TEST CONFIGURATION (Agent-Protocol.md section 5, last part): the harness says which identityHashes may
// read the FIXTURE domain list. No identity grants anything, nothing touches a real gateway.
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROOF_V2_TAG = 'me-proof/2\n';
const PROOF_V2 = 'me-proof/2';
const EMPTY_BODY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const SKEW_MS = 60_000;
const TTL_MAX_MS = 10 * 60_000;
export const DOMAINS = [{ domain: 'example.test', target: 'http://127.0.0.1:4100' }];

const here = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.resolve(here, '../../package.json'));

const canonicalJson = (obj) => JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))));
const READ_KEYS = ['v', 'op', 'identityHash', 'keyId', 'method', 'path', 'query', 'bodyHash', 'nonce', 'issuedAt', 'expiresAt', 'origin', 'audience'];
const REGISTER_KEYS = ['v', 'op', 'identityHash', 'namespace', 'keyId', 'agentKey', 'nonce', 'issuedAt', 'expiresAt', 'origin', 'audience'];

/** Strict v2 parse: the tag, exactly the fields of its op, canonical byte for byte. Same rule as src/agent/protocol.ts. */
function parseV2(bytes) {
  if (typeof bytes !== 'string' || !bytes.startsWith(PROOF_V2_TAG)) return null;
  let obj;
  try { obj = JSON.parse(bytes.slice(PROOF_V2_TAG.length)); } catch { return null; }
  if (!obj || typeof obj !== 'object' || obj.v !== PROOF_V2) return null;
  const keys = obj.op === 'read' ? READ_KEYS : obj.op === 'register' ? REGISTER_KEYS : null;
  if (!keys || Object.keys(obj).length !== keys.length || !keys.every((k) => k in obj)) return null;
  if (PROOF_V2_TAG + canonicalJson(obj) !== bytes) return null;
  return obj;
}

const keyIdOf = (agentKey) => crypto.createHash('sha256').update(`me-agent-key:${agentKey}`).digest().subarray(0, 16).toString('hex');
const verifyEd25519 = (x, message, signature) => {
  try { return crypto.verify(null, Buffer.from(message, 'utf8'), { key: { kty: 'OKP', crv: 'Ed25519', x }, format: 'jwk' }, Buffer.from(signature, 'base64url')); }
  catch { return false; }
};

/** A legacy identity, made the old way (name + secret -> kernel), for the v1 checks. Test identities only. */
export async function legacyIdentity(username, secret, namespace) {
  const MeKernel = (await import(req.resolve('this.me'))).default;
  const me = new MeKernel();
  me[Symbol.for('me.internal.reseed')](username, secret);
  const runtime = me['!'];
  const first = await runtime.prove({ rootNamespace: namespace, challenge: '{}' });
  /** A v1 proof (the old prove() format, with the gateway's challenge fields) for one request. */
  const v1Proof = async (challenge) => {
    const proof = await runtime.prove({ rootNamespace: namespace, challenge: canonicalJson(challenge) });
    return Buffer.from(JSON.stringify(proof)).toString('base64url');
  };
  return { identityHash: first.identityHash, publicKey: first.publicKey, v1Proof };
}

const json = (res, status, body, origin) => {
  res.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
  });
  res.end(JSON.stringify(body));
};

/**
 * agentOrigin: the only origin registrations are taken from (a hurdle, not a proof: Agent-Protocol.md section 5).
 * policy: the declared policy of GET /domains, 'v2' or 'v1+v2' (R19).
 */
export function startAgentResource({ agentOrigin, policy = 'v2', port = 0 }) {
  const identities = new Map();     // identityHash -> { v1Key, agentKey, keyId, agentOnly, revoked }
  const allowed = new Set();        // test configuration: who may read the fixture list
  const nonces = new Set();
  const state = {
    origin: '', startedAt: Date.now(), nonceStoreAvailable: true, requests: [], outcomes: [], policy,
    identities, allowed,
    allow: (identityHash) => allowed.add(identityHash),
    revoke: (identityHash) => { const r = identities.get(identityHash); if (r) r.revoked = true; },
    /** Operator-side fixture: a legacy identity known to this verifier (v1 key), optionally already agent-only. */
    addLegacy: (identityHash, v1Key, agentOnly = false) => identities.set(identityHash, { v1Key, agentKey: null, keyId: null, agentOnly, revoked: false }),
    /** A restart: the in-memory nonce store is new, and so is its start time (R15). */
    restart: () => { nonces.clear(); state.startedAt = Date.now(); },
  };

  // R13-R14: the nonce is reserved only for a fully validated proof, atomically (single-threaded check-and-add), and
  // refused when the store is unavailable.
  const reserveNonce = (nonce) => {
    if (!state.nonceStoreAvailable) return 'NONCE_STORE_UNAVAILABLE';
    if (nonces.has(nonce)) return 'REPLAY';
    nonces.add(nonce);
    return null;
  };

  const timeProblem = (f) => {
    const now = Date.now();
    if (f.issuedAt > now + SKEW_MS || f.expiresAt - f.issuedAt > TTL_MAX_MS || f.expiresAt <= f.issuedAt) return 'PROOF_INVALID';
    if (now > f.expiresAt) return 'EXPIRED';
    if (f.issuedAt < state.startedAt) return 'ISSUED_BEFORE_RESTART';   // R15
    return null;
  };

  function register(body, requestOrigin, selfOrigin) {
    if (requestOrigin !== agentOrigin) return { status: 403, error: 'NOT_FROM_AGENT' };
    const st = body?.statement;
    const f = parseV2(st?.bytes);
    if (!f || f.op !== 'register') return { status: 400, error: 'NOT_A_V2_REGISTRATION' };
    if (f.audience !== selfOrigin || f.origin !== requestOrigin) return { status: 401, error: 'AUDIENCE_OR_ORIGIN' };
    const t = timeProblem(f); if (t) return { status: 401, error: t };
    if (keyIdOf(f.agentKey) !== f.keyId) return { status: 401, error: 'KEY_ID_MISMATCH' };
    if (!verifyEd25519(f.agentKey, st.bytes, st.signature)) return { status: 401, error: 'AGENT_SIGNATURE_INVALID' };
    // The new identity signs the same statement with its own key: this binds identityHash to the agent key.
    const ip = body?.identityProof;
    let message;
    try { message = JSON.parse(ip?.message); } catch { return { status: 401, error: 'IDENTITY_PROOF_INVALID' }; }
    if (ip.identityHash !== f.identityHash || message.identityHash !== f.identityHash || message.challenge !== st.bytes) return { status: 401, error: 'IDENTITY_PROOF_MISMATCH' };
    if (!verifyEd25519(ip.publicKey, ip.message, ip.signature)) return { status: 401, error: 'IDENTITY_SIGNATURE_INVALID' };
    const n = reserveNonce(f.nonce); if (n) return { status: n === 'REPLAY' ? 401 : 503, error: n };
    // R11: one atomic step (single-threaded): only a name nobody holds; claim, agent key and agent-only together.
    if (identities.has(f.identityHash)) return { status: 409, error: 'ALREADY_REGISTERED' };
    identities.set(f.identityHash, { v1Key: ip.publicKey, agentKey: f.agentKey, keyId: f.keyId, agentOnly: true, revoked: false });
    return { status: 201, identityHash: f.identityHash, keyId: f.keyId };
  }

  function readDomains(request, url, selfOrigin) {
    const header = request.headers['x-me-proof'];
    if (typeof header !== 'string' || !header) return { status: 401, error: 'PROOF_MISSING' };
    let decoded;
    try { decoded = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')); } catch { return { status: 401, error: 'PROOF_INVALID' }; }

    // v1 (the old prove() format): refused for an agent-only identity whatever the endpoint policy (R20), and refused
    // by a v2-only endpoint (R19). Only a 'v1+v2' endpoint and an identity that is not agent-only get further.
    if (decoded && typeof decoded.message === 'string' && !('bytes' in decoded)) {
      const record = identities.get(String(decoded.identityHash || ''));
      if (record?.agentOnly) return { status: 401, error: 'V1_REFUSED_AGENT_ONLY' };
      if (state.policy !== 'v1+v2') return { status: 401, error: 'V1_NOT_ACCEPTED' };
      if (!record || record.revoked || !record.v1Key || decoded.publicKey !== record.v1Key) return { status: 401, error: 'UNKNOWN_KEY' };
      if (!verifyEd25519(record.v1Key, decoded.message, decoded.signature)) return { status: 401, error: 'SIGNATURE_INVALID' };
      let ch; try { ch = JSON.parse(JSON.parse(decoded.message).challenge); } catch { return { status: 401, error: 'PROOF_INVALID' }; }
      if (ch.method !== request.method || ch.path !== url.pathname) return { status: 401, error: 'REQUEST_MISMATCH' };
      const n = reserveNonce(`v1:${ch.nonce}`); if (n) return { status: n === 'REPLAY' ? 401 : 503, error: n };
      return { status: 200, identityHash: decoded.identityHash, version: 'v1' };
    }

    // v2 (R13: validate everything first, then reserve the nonce, then execute)
    const f = parseV2(decoded?.bytes);
    if (!f || f.op !== 'read') return { status: 401, error: 'NOT_A_V2_PROOF' };
    if (f.method !== request.method || f.path !== url.pathname) return { status: 401, error: 'REQUEST_MISMATCH' };
    if (f.query !== JSON.stringify(Array.from(url.searchParams.entries()))) return { status: 401, error: 'QUERY_MISMATCH' };
    if (f.bodyHash !== EMPTY_BODY_SHA256) return { status: 401, error: 'BODY_MISMATCH' };
    if (f.audience !== selfOrigin) return { status: 401, error: 'WRONG_AUDIENCE' };
    if (!request.headers.origin || f.origin !== request.headers.origin) return { status: 401, error: 'ORIGIN_MISMATCH' };
    const t = timeProblem(f); if (t) return { status: 401, error: t };
    // R16: key status read live from this verifier's own state; anything unknown is refused.
    const record = identities.get(f.identityHash);
    if (!record || !record.agentKey || record.keyId !== f.keyId) return { status: 401, error: 'UNKNOWN_KEY' };
    if (record.revoked) return { status: 401, error: 'KEY_REVOKED' };
    if (!verifyEd25519(record.agentKey, decoded.bytes, decoded.signature)) return { status: 401, error: 'SIGNATURE_INVALID' };
    const n = reserveNonce(f.nonce); if (n) return { status: n === 'REPLAY' ? 401 : 503, error: n };
    return { status: 200, identityHash: f.identityHash, version: 'v2' };
  }

  const server = http.createServer((request, res) => {
    const url = new URL(request.url, state.origin);
    const origin = request.headers.origin;
    if (request.method === 'OPTIONS') {
      // Anyone may ASK (CORS says nothing about permission); the proofs and the policy below decide.
      res.writeHead(204, {
        'access-control-allow-origin': origin || '*',
        'access-control-allow-methods': 'GET, POST',
        'access-control-allow-headers': 'X-Me-Proof, Content-Type',
        'access-control-max-age': '60',
        vary: 'Origin',
      });
      return res.end();
    }
    state.requests.push({ method: request.method, path: url.pathname + url.search, origin: origin || null });
    if (request.method === 'POST' && url.pathname === '/register') {
      let raw = '';
      request.on('data', (c) => { raw += c; if (raw.length > 64_000) request.destroy(); });
      request.on('end', () => {
        let body = null; try { body = JSON.parse(raw); } catch { /* refused below */ }
        const v = register(body, origin, state.origin);
        state.outcomes.push(v.error || 'REGISTERED');
        json(res, v.status, v.error ? { error: v.error } : { identityHash: v.identityHash, keyId: v.keyId, agentOnly: true }, origin);
      });
      return;
    }
    if (request.method !== 'GET' || url.pathname !== '/domains') return json(res, 404, { error: 'NOT_FOUND' }, origin);
    const verdict = readDomains(request, url, state.origin);
    if (verdict.status !== 200) { state.outcomes.push(verdict.error); return json(res, verdict.status, { error: verdict.error }, origin); }
    // Authorization, separately: a valid proof from an identity without the permission is 403, not data.
    if (!allowed.has(verdict.identityHash)) { state.outcomes.push('FORBIDDEN'); return json(res, 403, { error: 'FORBIDDEN' }, origin); }
    state.outcomes.push(`OK_${verdict.version}`);
    return json(res, 200, { domains: DOMAINS }, origin);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      state.origin = `http://127.0.0.1:${server.address().port}`;
      state.close = () => new Promise((r) => server.close(() => r()));
      resolve(state);
    });
  });
}
