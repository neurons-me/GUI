// The identity agent's message protocol (Identity-Custody-Contract.md, first cut). PROTOTYPE: not deployed anywhere.
//
// A host page REQUESTS one concrete operation; the agent (its own origin, a visible window) shows it, lets the person
// unlock and approve it, and answers with a proof bound to exactly that operation. Nothing here carries a secret, a
// key or a session: this module is shared by the host side and the agent, so it holds only data shapes, strict
// validation and the canonical encoding both sides (and the verifying server) must agree on byte for byte.
//
// The proof challenge keeps the fields the gateway's verifier already checks (method, path, query, bodyHash, nonce,
// timestamp -- lua/middleware/me_sig.lua) and adds what the contract requires an approval to be bound to: the
// requesting origin AS THE BROWSER REPORTED IT to the agent, the audience (the resource server), an expiry and the
// protocol version. Old proofs are not reinterpreted: a proof without `v` is not an agent proof.

export const AGENT_PROTOCOL = 'me-agent/1';

/** sha256('') -- a read carries no body; the gateway hashes the empty body the same way. */
export const EMPTY_BODY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/** The one operation of the first cut: an authenticated read of a resource on one server. */
export type ReadOperation = {
  action: 'read';
  /** The namespace the identity proves itself in (its proof's root namespace), e.g. `cleaker.me`. */
  namespace: string;
  /** The resource server's origin (scheme://host[:port]) -- the only server this approval is good for. */
  audience: string;
  method: 'GET';
  /** e.g. `/domains`. */
  path: string;
  /** The canonical query (canonicalizeQuery): a JSON array of [key, value] pairs, `[]` when none. */
  query: string;
  /** How long the approval is valid, in ms. */
  ttlMs: number;
};

export type AgentReady = { protocol: typeof AGENT_PROTOCOL; type: 'agent.ready' };
export type AgentRequest = { protocol: typeof AGENT_PROTOCOL; type: 'agent.request'; id: string; operation: ReadOperation };
export type AgentResult =
  | {
      protocol: typeof AGENT_PROTOCOL;
      type: 'agent.result';
      id: string;
      ok: true;
      /** base64url(JSON(proof)) -- the X-Me-Proof header value for exactly the approved request. */
      proof: string;
      /** Public: who approved. Never a key, a seed or a session. */
      identity: { namespace: string; identityHash: string; publicKey: string };
    }
  | { protocol: typeof AGENT_PROTOCOL; type: 'agent.result'; id: string; ok: false; reason: 'rejected' | 'invalid' | 'error' };

export const TTL_MIN_MS = 5_000;
export const TTL_MAX_MS = 10 * 60_000;
const MAX_QUERY_CHARS = 2_048;
const ID_RE = /^[0-9a-f]{32}$/;
const NAMESPACE_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const PATH_RE = /^\/[A-Za-z0-9._~\-/]*$/;

/** Sorted top-level keys -- the same encoding as signedRequest.ts's canonicalJson (tests/agentProtocol.test.ts). */
export function canonicalJson(obj: Record<string, unknown>): string {
  return JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))));
}

/** The same encoding as signedRequest.ts's canonicalizeQuery: pairs in order, never sorted. */
export function canonicalizeQuery(searchParams: URLSearchParams): string {
  return JSON.stringify(Array.from(searchParams.entries()));
}

export function newRequestId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const isRequestId = (value: unknown): value is string => typeof value === 'string' && ID_RE.test(value);

/** An origin as the browser writes one: scheme://host[:port], nothing after it. */
export function isOrigin(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.origin === value;
  } catch {
    return false;
  }
}

/** null when the operation is acceptable; otherwise what is wrong. Strict: unknown fields are refused too. */
export function validateOperation(op: unknown): string | null {
  if (!op || typeof op !== 'object' || Array.isArray(op)) return 'not an object';
  const o = op as Record<string, unknown>;
  const allowed = new Set(['action', 'namespace', 'audience', 'method', 'path', 'query', 'ttlMs']);
  const extra = Object.keys(o).filter((k) => !allowed.has(k));
  if (extra.length) return `unknown fields: ${extra.join(', ')}`;
  if (o.action !== 'read') return 'action must be "read"';
  if (o.method !== 'GET') return 'method must be GET';
  if (typeof o.namespace !== 'string' || !NAMESPACE_RE.test(o.namespace)) return 'namespace is not a valid name';
  if (!isOrigin(o.audience)) return 'audience must be an origin (scheme://host[:port])';
  if (typeof o.path !== 'string' || !PATH_RE.test(o.path) || o.path.split('/').some((s) => s === '..' || s === '.')) return 'path is not acceptable';
  if (typeof o.query !== 'string' || o.query.length > MAX_QUERY_CHARS) return 'query is not acceptable';
  try {
    const pairs = JSON.parse(o.query);
    if (!Array.isArray(pairs) || !pairs.every((p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === 'string'))) return 'query is not canonical';
  } catch {
    return 'query is not canonical';
  }
  if (typeof o.ttlMs !== 'number' || !Number.isInteger(o.ttlMs) || o.ttlMs < TTL_MIN_MS || o.ttlMs > TTL_MAX_MS) return 'ttlMs out of range';
  return null;
}

/** A message from the host, validated; null if it is not exactly an agent request. */
export function parseRequest(data: unknown): AgentRequest | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.protocol !== AGENT_PROTOCOL || m.type !== 'agent.request' || !isRequestId(m.id)) return null;
  if (Object.keys(m).some((k) => !['protocol', 'type', 'id', 'operation'].includes(k))) return null;
  if (validateOperation(m.operation) !== null) return null;
  return m as unknown as AgentRequest;
}

/**
 * What the proof signs for an approved operation. `origin` is the requesting origin the BROWSER gave the agent
 * (MessageEvent.origin), never one the page wrote into a message.
 */
export function buildChallenge(input: { operation: ReadOperation; requestingOrigin: string; nonce: string; timestamp: number }): string {
  const { operation: op } = input;
  return canonicalJson({
    v: AGENT_PROTOCOL,
    action: op.action,
    method: op.method,
    path: op.path,
    query: op.query,
    bodyHash: EMPTY_BODY_SHA256,
    nonce: input.nonce,
    timestamp: input.timestamp,
    origin: input.requestingOrigin,
    audience: op.audience,
    expiresAt: input.timestamp + op.ttlMs,
  });
}

/** What the person is shown, from the operation alone (the host supplies no text, HTML or component for it). */
export function describeOperation(op: ReadOperation): { action: string; resource: string; expires: string } {
  const pairs: [string, string][] = JSON.parse(op.query);
  const qs = pairs.length ? `?${new URLSearchParams(pairs).toString()}` : '';
  return {
    action: 'Read',
    resource: `${op.audience}${op.path}${qs}`,
    expires: op.ttlMs >= 60_000 ? `${Math.round(op.ttlMs / 60_000)} min` : `${Math.round(op.ttlMs / 1000)} s`,
  };
}

export function base64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
