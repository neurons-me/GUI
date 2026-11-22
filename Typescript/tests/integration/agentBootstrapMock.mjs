// MOCK authority for the netget gateway bootstrap through the identity agent (tests/integration/agentBootstrap.browser.test.mjs).
// Disposable, in-process, loopback only. It is NOT netget and NOT the monad: it stands in for both until they speak v2
// (the monad and netget are not touched in this cut). It serves:
//   POST /setup/challenge                    MOCK of netget's setup session: the install code unlocks it, and it issues
//                                            the challenge the way gatewaySetupSession.ts issueClaimChallenge does
//                                            (normalizeProofMessage({purpose:'gateway-claim', gatewayId, nonce, timestamp}))
//   POST /api/v1/gateway/:id/bootstrap       MOCK of the monad's bootstrap, v2: VERIFY (strict v2 call, kind, method,
//                                            path, bodyHash of the exact body, audience, origin, time, key, signature,
//                                            then the nonce) and, separately, AUTHORIZE on its own state (the challenge
//                                            it issued, unused; the install code was presented; no owner yet).
// An explanation (me.explain output) in the body is not a parameter and authorizes nothing: the body must be exactly
// {gatewayId, challenge}. Agent keys come from the REAL monad registration, fed in by the test (addKey).
import http from 'node:http';
import crypto from 'node:crypto';

const PROOF_V2_TAG = 'me-proof/2\n';
const CALL_KEYS = ['v', 'op', 'kind', 'identityHash', 'keyId', 'namespace', 'method', 'path', 'bodyHash', 'nonce', 'issuedAt', 'expiresAt', 'origin', 'audience'];
const SKEW_MS = 60_000;
const TTL_MAX_MS = 10 * 60_000;

const canonical = (v) => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
};
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const keyIdOf = (x) => crypto.createHash('sha256').update(`me-agent-key:${x}`).digest().subarray(0, 16).toString('hex');
const verifyEd25519 = (x, message, signature) => {
  try { return crypto.verify(null, Buffer.from(message, 'utf8'), { key: { kty: 'OKP', crv: 'Ed25519', x }, format: 'jwk' }, Buffer.from(String(signature), 'base64url')); }
  catch { return false; }
};

function parseCall(bytes) {
  if (typeof bytes !== 'string' || !bytes.startsWith(PROOF_V2_TAG)) return null;
  let o; try { o = JSON.parse(bytes.slice(PROOF_V2_TAG.length)); } catch { return null; }
  if (!o || typeof o !== 'object' || o.v !== 'me-proof/2' || o.op !== 'call') return null;
  if (Object.keys(o).length !== CALL_KEYS.length || !CALL_KEYS.every((k) => k in o)) return null;
  if (PROOF_V2_TAG + JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))) !== bytes) return null;
  if (!Number.isInteger(o.issuedAt) || !Number.isInteger(o.expiresAt)) return null;
  return o;
}

export function startBootstrapMock({ hostOrigins, installCode }) {
  const keys = new Map();         // identityHash -> { keyId, agentKey, revoked }
  const sessions = new Map();     // gatewayId -> { challenge, used }
  const owners = new Map();       // gatewayId -> { identityHash, namespace }
  const nonces = new Set();
  const state = {
    origin: '', startedAt: Date.now(), requests: [], outcomes: [], owners, keys,
    addKey: (identityHash, keyId, agentKey) => keys.set(identityHash, { keyId, agentKey, revoked: false }),
    revoke: (identityHash) => { const k = keys.get(identityHash); if (k) k.revoked = true; },
  };

  function issueChallenge(body) {
    if (!body || body.code !== installCode) return { status: 403, error: 'SETUP_CODE_INVALID' };
    const gatewayId = String(body.gatewayId || '');
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(gatewayId)) return { status: 400, error: 'GATEWAY_ID_INVALID' };
    const challenge = canonical({ purpose: 'gateway-claim', gatewayId, nonce: crypto.randomBytes(16).toString('base64url'), timestamp: Date.now() });
    sessions.set(gatewayId, { challenge, used: false });
    return { status: 200, challenge, gatewayId };
  }

  function bootstrap(request, url, raw) {
    // ── verify ──
    const header = request.headers['x-me-proof'];
    if (typeof header !== 'string' || !header) return { status: 401, error: 'PROOF_MISSING' };
    let proof; try { proof = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')); } catch { return { status: 401, error: 'PROOF_INVALID' }; }
    const f = parseCall(proof?.bytes);
    if (!f) return { status: 401, error: 'NOT_A_V2_CALL' };
    if (f.kind !== 'netget.gateway.bootstrap') return { status: 401, error: 'KIND_NOT_ACCEPTED' };
    if (f.method !== request.method || f.path !== url.pathname || url.search) return { status: 401, error: 'REQUEST_MISMATCH' };
    let body; try { body = JSON.parse(raw); } catch { return { status: 400, error: 'BODY_INVALID' }; }
    if (canonical(body) !== raw || sha256(raw) !== f.bodyHash) return { status: 401, error: 'BODY_MISMATCH' };
    if (f.audience !== state.origin) return { status: 401, error: 'WRONG_AUDIENCE' };
    if (!request.headers.origin || f.origin !== request.headers.origin || !hostOrigins.includes(f.origin)) return { status: 401, error: 'ORIGIN_MISMATCH' };
    const now = Date.now();
    if (f.issuedAt > now + SKEW_MS || f.expiresAt <= f.issuedAt || f.expiresAt - f.issuedAt > TTL_MAX_MS) return { status: 401, error: 'PROOF_INVALID' };
    if (now > f.expiresAt) return { status: 401, error: 'EXPIRED' };
    if (f.issuedAt < state.startedAt) return { status: 401, error: 'ISSUED_BEFORE_RESTART' };
    const key = keys.get(f.identityHash);
    if (!key || key.keyId !== f.keyId || keyIdOf(key.agentKey) !== f.keyId) return { status: 401, error: 'UNKNOWN_KEY' };
    if (key.revoked) return { status: 401, error: 'KEY_REVOKED' };
    if (!verifyEd25519(key.agentKey, proof.bytes, proof.signature)) return { status: 401, error: 'SIGNATURE_INVALID' };
    if (nonces.has(`${f.identityHash}:${f.nonce}`)) return { status: 401, error: 'REPLAY' };
    nonces.add(`${f.identityHash}:${f.nonce}`);
    // ── authorize, on this authority's own state (a valid signature is not authority) ──
    const keysOk = body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).sort().join() === 'challenge,gatewayId';
    if (!keysOk) return { status: 400, error: 'BODY_NOT_ADMITTED' };
    const gatewayId = decodeURIComponent(url.pathname.split('/')[4] || '');
    if (body.gatewayId !== gatewayId) return { status: 403, error: 'GATEWAY_MISMATCH' };
    const session = sessions.get(gatewayId);
    if (!session) return { status: 403, error: 'NO_SETUP_SESSION' };          // the install code was never presented
    if (session.challenge !== body.challenge) return { status: 403, error: 'CHALLENGE_MISMATCH' };
    if (session.used) return { status: 403, error: 'CHALLENGE_USED' };
    const owner = owners.get(gatewayId);
    if (owner && owner.identityHash !== f.identityHash) return { status: 409, error: 'ALREADY_BOOTSTRAPPED' };
    session.used = true;
    owners.set(gatewayId, { identityHash: f.identityHash, namespace: f.namespace });
    return { status: 200, ok: true, gatewayId, owner: f.identityHash, namespace: f.namespace };
  }

  const server = http.createServer((request, res) => {
    const url = new URL(request.url, state.origin);
    const origin = request.headers.origin;
    const send = (status, payload) => {
      res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': origin || '*', vary: 'Origin' });
      res.end(JSON.stringify(payload));
    };
    if (request.method === 'OPTIONS') {
      res.writeHead(204, { 'access-control-allow-origin': origin || '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'X-Me-Proof, Content-Type', vary: 'Origin' });
      return res.end();
    }
    let raw = '';
    request.on('data', (c) => { raw += c; if (raw.length > 64_000) request.destroy(); });
    request.on('end', () => {
      state.requests.push({ method: request.method, path: url.pathname, origin: origin || null, body: raw, proof: request.headers['x-me-proof'] || null });
      let v;
      if (request.method === 'POST' && url.pathname === '/setup/challenge') {
        let body = null; try { body = JSON.parse(raw); } catch { /* refused */ }
        v = issueChallenge(body);
      } else if (request.method === 'POST' && /^\/api\/v1\/gateway\/[^/]+\/bootstrap$/.test(url.pathname)) {
        v = bootstrap(request, url, raw);
      } else {
        v = { status: 404, error: 'NOT_FOUND' };
      }
      state.outcomes.push(v.error || (url.pathname === '/setup/challenge' ? 'CHALLENGE' : 'BOOTSTRAPPED'));
      const { status, ...payload } = v;
      send(status, payload);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      state.origin = `http://127.0.0.1:${server.address().port}`;
      state.close = () => new Promise((r) => server.close(() => r()));
      resolve(state);
    });
  });
}
