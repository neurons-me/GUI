// The identity agent's message protocol (Identity-Custody-Contract.md, first cut). PROTOTYPE: not deployed anywhere.
//
// A host page REQUESTS one concrete operation; the agent (its own origin, a visible window) shows it, lets the person
// unlock and approve it, and answers with a proof bound to exactly that operation. Nothing here carries a secret, a
// key or a session: this module is shared by the host side and the agent, so it holds only data shapes, strict
// validation and the canonical encoding both sides (and the verifying server) must agree on byte for byte.
//
// Proofs are v2 (Agent-Protocol.md R7): `me-proof/2\n` + canonical JSON, signed by the identity's registered agent
// key. They bind method, path, query, bodyHash, nonce, issuedAt/expiresAt, the requesting origin AS THE BROWSER
// REPORTED IT to the agent, the audience (the resource server), the identity and the key. Old proofs are not
// reinterpreted: the tag is inside the signed bytes.

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

/**
 * A WRITE: one operation the agent explicitly ADMITS (admittedOperations.ts), sent to one authority (the audience).
 * The envelope is common to every app; what `body` means is fixed by `kind`'s schema in the AGENT, never by the app.
 * The agent recomputes `bodyHash` from `body` (canonicalBody) and refuses a mismatch. First admitted kind:
 * `netget.gateway.bootstrap`.
 */
export type CallOperation = {
  action: 'call';
  /** An id from the agent's admitted-operations table. Anything not in that table is refused. */
  kind: string;
  /** The root namespace whose identities may approve, e.g. `cleaker.me`. */
  namespace: string;
  /** The authority that verifies AND authorizes (scheme://host[:port]) -- the only server this approval is good for. */
  audience: string;
  method: 'POST';
  /** Must equal the path the admitted operation derives from `body`. */
  path: string;
  /** The operation's parameters, exactly. Plain JSON only. */
  body: Record<string, unknown>;
  /** sha256 (hex) of canonicalBody(body). */
  bodyHash: string;
  ttlMs: number;
  /** Optional text the app may send about itself. UNTRUSTED: never shown as the operation, never signed. */
  appLabel?: string;
};

/**
 * A LOCAL read the agent answers itself: the names of your keys under `<your namespace>.keys`. Nothing is signed and
 * nothing goes to a server: the keys live in the agent's own origin. The app receives paths and whether each is set
 * -- never a value (keysList.ts). `namespace` is the root whose identities may approve (as in the other operations).
 */
export type KeysListOperation = {
  action: 'keys.list';
  namespace: string;
};

export type AgentOperation = ReadOperation | CallOperation | KeysListOperation;

/** One entry of a key listing: a public path under `keys` and its status. Never a value, never a field's content. */
export type KeyListingEntry = { path: string; status: 'set' };
/** What an approved `keys.list` gives the app. */
export type KeyListing = { resource: string; entries: KeyListingEntry[] };

export type AgentReady = { protocol: typeof AGENT_PROTOCOL; type: 'agent.ready' };
export type AgentRequest = { protocol: typeof AGENT_PROTOCOL; type: 'agent.request'; id: string; operation: AgentOperation };
export type AgentResult =
  | {
      protocol: typeof AGENT_PROTOCOL;
      type: 'agent.result';
      id: string;
      ok: true;
      /** base64url(JSON(V2Proof)) -- the X-Me-Proof header value for exactly the approved request. */
      proof: string;
      /** Public: who approved. Never a key, a seed or a session. */
      identity: { namespace: string; identityHash: string; keyId: string };
    }
  | {
      protocol: typeof AGENT_PROTOCOL;
      type: 'agent.result';
      id: string;
      ok: true;
      /** keys.list only: names/paths/status, built by the agent from its own vault. No proof: nothing was signed. */
      keys: KeyListing;
      identity: { namespace: string; identityHash: string; keyId: string };
    }
  | { protocol: typeof AGENT_PROTOCOL; type: 'agent.result'; id: string; ok: false; reason: 'rejected' | 'invalid' | 'error' };

export const TTL_MIN_MS = 5_000;
export const TTL_MAX_MS = 10 * 60_000;
const MAX_QUERY_CHARS = 2_048;
const ID_RE = /^[0-9a-f]{32}$/;
const NAMESPACE_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

/** A namespace as requests name it (lowercase dotted labels). */
export const isNamespace = (value: unknown): value is string => typeof value === 'string' && NAMESPACE_RE.test(value);
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

/**
 * null when the operation is acceptable IN SHAPE; otherwise what is wrong. Strict: unknown fields are refused too.
 * A `call` additionally has to pass the agent's admitted-operations check (admittedOperations.ts validateCall) before
 * anything is shown or signed: its kind, its body schema, its path and its bodyHash.
 */
export function validateOperation(op: unknown): string | null {
  if (!op || typeof op !== 'object' || Array.isArray(op)) return 'not an object';
  const o = op as Record<string, unknown>;
  if (o.action === 'call') return validateCallShape(o);
  if (o.action === 'keys.list') {
    const extraKeys = Object.keys(o).filter((k) => k !== 'action' && k !== 'namespace');
    if (extraKeys.length) return `unknown fields: ${extraKeys.join(', ')}`;
    if (typeof o.namespace !== 'string' || !NAMESPACE_RE.test(o.namespace)) return 'namespace is not a valid name';
    return null;
  }
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

const KIND_RE = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const HASH_RE = /^[0-9a-f]{64}$/;
const MAX_LABEL_CHARS = 200;
const MAX_BODY_CHARS = 8_192;

function validateCallShape(o: Record<string, unknown>): string | null {
  const allowed = new Set(['action', 'kind', 'namespace', 'audience', 'method', 'path', 'body', 'bodyHash', 'ttlMs', 'appLabel']);
  const extra = Object.keys(o).filter((k) => !allowed.has(k));
  if (extra.length) return `unknown fields: ${extra.join(', ')}`;
  if (typeof o.kind !== 'string' || o.kind.length > 64 || !KIND_RE.test(o.kind)) return 'kind is not acceptable';
  if (o.method !== 'POST') return 'method must be POST';
  if (typeof o.namespace !== 'string' || !NAMESPACE_RE.test(o.namespace)) return 'namespace is not a valid name';
  if (!isOrigin(o.audience)) return 'audience must be an origin (scheme://host[:port])';
  if (typeof o.path !== 'string' || !PATH_RE.test(o.path) || o.path.split('/').some((s) => s === '..' || s === '.')) return 'path is not acceptable';
  if (!o.body || typeof o.body !== 'object' || Array.isArray(o.body)) return 'body must be an object';
  let canonical: string;
  try { canonical = canonicalBody(o.body); } catch { return 'body is not plain JSON'; }
  if (canonical.length > MAX_BODY_CHARS) return 'body too large';
  if (typeof o.bodyHash !== 'string' || !HASH_RE.test(o.bodyHash)) return 'bodyHash must be sha256 hex';
  if (typeof o.ttlMs !== 'number' || !Number.isInteger(o.ttlMs) || o.ttlMs < TTL_MIN_MS || o.ttlMs > TTL_MAX_MS) return 'ttlMs out of range';
  if (o.appLabel !== undefined && (typeof o.appLabel !== 'string' || o.appLabel.length > MAX_LABEL_CHARS)) return 'appLabel is not acceptable';
  return null;
}

/**
 * The canonical encoding of a call's body (what bodyHash is computed over): JSON with object keys sorted at EVERY
 * level (the same rule as this.me's normalizeProofMessage). Only plain JSON values; anything else throws.
 */
export function canonicalBody(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('NOT_PLAIN_JSON');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((v) => canonicalBody(v)).join(',')}]`;
  const proto = typeof value === 'object' ? Object.getPrototypeOf(value) : undefined;
  if (typeof value === 'object' && (proto === Object.prototype || proto === null)) {
    const rec = value as Record<string, unknown>;
    return `{${Object.keys(rec).sort().map((k) => `${JSON.stringify(k)}:${canonicalBody(rec[k])}`).join(',')}}`;
  }
  throw new Error('NOT_PLAIN_JSON');
}

/** sha256 of a UTF-8 string, lowercase hex (WebCrypto: the same in the agent, the host and node). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
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

// ── v2 proofs (Agent-Protocol.md R7) ────────────────────────────────────────────────────────────────────────────────
// What an agent signs is `me-proof/2\n` + canonical JSON. The tag is part of the signed bytes, so a v2 message can
// never parse as a v1 one (v1 verifiers JSON.parse the message, and this is not JSON) and a v1 message can never pass
// as v2. The signing key is the AGENT key registered for the identity (agentKeys.ts), not a key a page can derive.

export const PROOF_V2_TAG = 'me-proof/2\n';
export const PROOF_V2 = 'me-proof/2';

export type V2ReadFields = {
  v: typeof PROOF_V2; op: 'read'; identityHash: string; keyId: string;
  method: 'GET'; path: string; query: string; bodyHash: string;
  nonce: string; issuedAt: number; expiresAt: number; origin: string; audience: string;
};
export type V2RegisterFields = {
  v: typeof PROOF_V2; op: 'register'; identityHash: string; namespace: string; keyId: string;
  /** The agent's Ed25519 public key (JWK `x`, base64url). */
  agentKey: string;
  nonce: string; issuedAt: number; expiresAt: number; origin: string; audience: string;
};
/**
 * A v2 proof for an admitted WRITE (`call`). `namespace` is the approving identity's own namespace (chosen in the
 * agent, never by the app); `kind` names the admitted operation; `bodyHash` binds the exact body.
 */
export type V2CallFields = {
  v: typeof PROOF_V2; op: 'call'; kind: string; identityHash: string; keyId: string; namespace: string;
  method: 'POST'; path: string; bodyHash: string;
  nonce: string; issuedAt: number; expiresAt: number; origin: string; audience: string;
};
export type V2Fields = V2ReadFields | V2RegisterFields | V2CallFields;

const V2_KEYS: Record<V2Fields['op'], string[]> = {
  call: ['v', 'op', 'kind', 'identityHash', 'keyId', 'namespace', 'method', 'path', 'bodyHash', 'nonce', 'issuedAt', 'expiresAt', 'origin', 'audience'],
  read: ['v', 'op', 'identityHash', 'keyId', 'method', 'path', 'query', 'bodyHash', 'nonce', 'issuedAt', 'expiresAt', 'origin', 'audience'],
  register: ['v', 'op', 'identityHash', 'namespace', 'keyId', 'agentKey', 'nonce', 'issuedAt', 'expiresAt', 'origin', 'audience'],
};

/** The exact bytes an agent signs. */
export function buildV2Bytes(fields: V2Fields): string {
  return PROOF_V2_TAG + canonicalJson(fields as unknown as Record<string, unknown>);
}

/** The fields of a v2 message, or null: wrong or missing tag, not canonical, missing or unknown fields. */
export function parseV2Bytes(bytes: unknown): V2Fields | null {
  if (typeof bytes !== 'string' || !bytes.startsWith(PROOF_V2_TAG)) return null;
  let obj: Record<string, unknown>;
  try { obj = JSON.parse(bytes.slice(PROOF_V2_TAG.length)); } catch { return null; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj.v !== PROOF_V2) return null;
  const keys = V2_KEYS[obj.op as V2Fields['op']];
  if (!keys) return null;
  const present = Object.keys(obj);
  if (present.length !== keys.length || !keys.every((k) => present.includes(k))) return null;
  if (buildV2Bytes(obj as unknown as V2Fields) !== bytes) return null;   // canonical, byte for byte
  for (const k of ['identityHash', 'keyId', 'nonce', 'origin', 'audience']) if (typeof obj[k] !== 'string' || !obj[k]) return null;
  if (!Number.isInteger(obj.issuedAt) || !Number.isInteger(obj.expiresAt)) return null;
  return obj as unknown as V2Fields;
}

/** What the read proof signs for an approved operation. `origin` is what the BROWSER reported to the agent. */
export function buildReadFields(input: { operation: ReadOperation; requestingOrigin: string; identityHash: string; keyId: string; nonce: string; issuedAt: number }): V2ReadFields {
  const { operation: op } = input;
  return {
    v: PROOF_V2, op: 'read', identityHash: input.identityHash, keyId: input.keyId,
    method: op.method, path: op.path, query: op.query, bodyHash: EMPTY_BODY_SHA256,
    nonce: input.nonce, issuedAt: input.issuedAt, expiresAt: input.issuedAt + op.ttlMs,
    origin: input.requestingOrigin, audience: op.audience,
  };
}

/** What the call proof signs. Built ONLY from a validated, frozen request (approval.ts), never from a raw message. */
export function buildCallFields(input: {
  operation: Pick<CallOperation, 'kind' | 'method' | 'path' | 'bodyHash' | 'audience' | 'ttlMs'>;
  requestingOrigin: string; identityHash: string; keyId: string; identityNamespace: string; nonce: string; issuedAt: number;
}): V2CallFields {
  const { operation: op } = input;
  return {
    v: PROOF_V2, op: 'call', kind: op.kind, identityHash: input.identityHash, keyId: input.keyId, namespace: input.identityNamespace,
    method: op.method, path: op.path, bodyHash: op.bodyHash,
    nonce: input.nonce, issuedAt: input.issuedAt, expiresAt: input.issuedAt + op.ttlMs,
    origin: input.requestingOrigin, audience: op.audience,
  };
}

/** The X-Me-Proof value of a v2 proof: base64url(JSON{ bytes, signature }). */
export type V2Proof = { bytes: string; signature: string };

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

export function base64urlBytes(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
