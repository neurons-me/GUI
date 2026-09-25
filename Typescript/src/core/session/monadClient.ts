export const DEFAULT_MONAD_TRANSPORT_ORIGIN = 'http://localhost:8161';

const CLAIM_ERROR_CODES = [
  'NAMESPACE_REQUIRED',
  'PROOF_REQUIRED',
  'PROOF_INVALID',
  'PROOF_MESSAGE_INVALID',
  'PROOF_NAMESPACE_MISMATCH',
  'PROOF_TIMESTAMP_INVALID',
  'CLAIM_KEY_INVALID',
  'CLAIM_KEY_REQUIRED',
  'CLAIM_KEYPAIR_MISMATCH',
  'NAMESPACE_TAKEN',
  'CLAIM_PERSIST_FAILED',
  'FULL_NAMESPACE_REQUIRED',
] as const;

const OPEN_ERROR_CODES = [
  'NAMESPACE_REQUIRED',
  'PROOF_REQUIRED',
  'PROOF_MESSAGE_INVALID',
  'PROOF_NAMESPACE_MISMATCH',
  'PROOF_TIMESTAMP_INVALID',
  'NONCE_REQUIRED',
  'NONCE_REUSED',
  'CLAIM_NOT_FOUND',
  'CLAIM_KEY_UNAVAILABLE',
  'CLAIM_VERIFICATION_FAILED',
  'FULL_NAMESPACE_REQUIRED',
] as const;

const WRITE_ERROR_CODES = [
  'NAMESPACE_REQUIRED',
  'EXPRESSION_REQUIRED',
  'NAMESPACE_WRITE_FORBIDDEN',
  // The signed body's namespace/expectedHeadHash didn't match this
  // namespace's current chain head (or was missing) -- see writeNamespace's
  // own doc comment and Surface-Identity-Claims.md §7.7. The remedy is
  // always the same: fetchWriteHead() again and re-sign, never retry as-is.
  'STALE_HEAD',
] as const;

const WRITE_HEAD_ERROR_CODES = [
  'NAMESPACE_REQUIRED',
  'CLAIM_NOT_FOUND',
] as const;

const READ_ERROR_CODES = [
  'NAMESPACE_REQUIRED',
  'PATH_REQUIRED',
  'NOT_FOUND',
  'PATH_NOT_FOUND',
  'NAMESPACE_NOT_SERVED',
  'NAMESPACE_INVALID',
] as const;

type ClaimErrorCodeTuple = typeof CLAIM_ERROR_CODES;
type OpenErrorCodeTuple = typeof OPEN_ERROR_CODES;
type WriteErrorCodeTuple = typeof WRITE_ERROR_CODES;
type ReadErrorCodeTuple = typeof READ_ERROR_CODES;
type WriteHeadErrorCodeTuple = typeof WRITE_HEAD_ERROR_CODES;

export type MonadOperation = 'claim' | 'open' | 'write' | 'read';

export type MonadValidationErrorCode =
  | 'NAMESPACE_REQUIRED'
  | 'SEED_REQUIRED'
  | 'IDENTITY_HASH_REQUIRED'
  | 'EXPRESSION_REQUIRED'
  | 'PATH_REQUIRED';

export type MonadTransportErrorCode =
  | 'FETCH_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'INVALID_JSON'
  | 'INVALID_RESPONSE';

export type MonadClaimErrorCode =
  | ClaimErrorCodeTuple[number]
  | MonadTransportErrorCode;

export type MonadOpenErrorCode =
  | OpenErrorCodeTuple[number]
  | MonadTransportErrorCode;

export type MonadWriteErrorCode =
  | WriteErrorCodeTuple[number]
  | MonadTransportErrorCode;

export type MonadReadErrorCode =
  | ReadErrorCodeTuple[number]
  | 'NAMESPACE_MISMATCH'
  | MonadTransportErrorCode;

export type MonadWriteHeadErrorCode =
  | WriteHeadErrorCodeTuple[number]
  | MonadTransportErrorCode;

export type MonadErrorCode =
  | MonadClaimErrorCode
  | MonadOpenErrorCode
  | MonadWriteErrorCode
  | MonadReadErrorCode
  | MonadWriteHeadErrorCode;

export type MonadTargetNamespace = {
  me: string;
  host: string;
};

export type MonadTarget = {
  namespace: MonadTargetNamespace;
  operation: string;
  path: string;
  nrp: string;
  relation?: unknown;
  value?: unknown;
};

export type MonadReplayMemory = {
  path?: string;
  operator?: string | null;
  expression?: unknown;
  value?: unknown;
  hash?: string;
  prevHash?: string;
  timestamp?: number;
};

export type MonadRequestOptions = {
  transportOrigin?: string;
  fetchImpl?: typeof fetch;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export type MonadClientOptions = Omit<MonadRequestOptions, 'signal'>;

// this.me's own ME.prove() result shape (see modules/monad's
// claim/types.ts NamespaceClaimProof, which this mirrors exactly). Both
// claim and open verify through the identical pipeline server-side,
// distinguished only by `challenge` being present (open) or null (claim) --
// see monad's claim/records.ts openNamespace() for the full reasoning.
export type MonadClaimProof = {
  message: string;
  signature: string;
  publicKey: string;
  timestamp?: number | null;
};

export type MonadClaimInput = MonadRequestOptions & {
  semanticNamespace: string;
  proof: MonadClaimProof;
  identityHash?: string;
  publicKey?: string | null;
  privateKey?: string | null;
};

export type MonadOpenInput = MonadRequestOptions & {
  semanticNamespace: string;
  proof: MonadClaimProof;
  identityHash?: string;
};

export type MonadWriteInput<TValue = unknown> = MonadRequestOptions & {
  semanticNamespace: string;
  expression: string;
  value: TValue;
  identityHash?: string | null;
  signature?: string | null;
  signedPayload?: string | null;
  signatureEncoding?: string | null;
  signatureFormat?: string | null;
  body?: Record<string, unknown>;
};

export type MonadReadInput = MonadRequestOptions & {
  semanticNamespace: string;
  path: string;
  /**
   * The read is about `semanticNamespace` whichever door carried it: the request names it (`?namespace=`) and
   * the answer must say it resolved to exactly that namespace, or the read fails (NAMESPACE_MISMATCH) -- a
   * monad that does not honor the parameter answers for the door's namespace, and that must not pass for the
   * one that was asked for.
   */
  namedNamespace?: boolean;
};

export type MonadWriteHeadInput = MonadRequestOptions & {
  semanticNamespace: string;
};

export type MonadClaimResult = {
  ok: true;
  target: MonadTarget;
  namespace: string;
  identityHash: string;
  publicKey: string | null;
  createdAt: number;
  persistentClaim: unknown;
};

export type MonadOpenResult = {
  ok: true;
  target: MonadTarget;
  namespace: string;
  identityHash: string;
  memories: MonadReplayMemory[];
  openedAt: number;
  verified: boolean;
  identity: unknown;
  policy: unknown;
  audit: unknown;
  reason: string | null;
  reasonCode: string | null;
};

export type MonadWriteResult = {
  ok: true;
  target: MonadTarget;
  memoryHash: string;
  timestamp: number;
};

export type MonadReadResult<TValue = unknown> = {
  ok: true;
  target: MonadTarget;
  namespace: string;
  path: string;
  value: TValue;
};

export type MonadWriteHeadResult = {
  ok: true;
  namespace: string;
  expectedHeadHash: string;
};

export interface MonadClient {
  claimNamespace(input: MonadClaimInput): Promise<MonadClaimResult>;
  openNamespace(input: MonadOpenInput): Promise<MonadOpenResult>;
  writeNamespace<TValue = unknown>(input: MonadWriteInput<TValue>): Promise<MonadWriteResult>;
  readNamespacePath<TValue = unknown>(input: MonadReadInput): Promise<MonadReadResult<TValue>>;
  fetchWriteHead(input: MonadWriteHeadInput): Promise<MonadWriteHeadResult>;
}

export class MonadClientError<Code extends string = MonadErrorCode> extends Error {
  readonly code: Code;
  readonly status: number;
  readonly operation: MonadOperation;
  readonly semanticNamespace: string;
  readonly transportOrigin: string;
  readonly detail: string | null;
  readonly target: MonadTarget | null;
  readonly payload: unknown;

  constructor(input: {
    code: Code;
    status: number;
    operation: MonadOperation;
    semanticNamespace: string;
    transportOrigin: string;
    detail?: string | null;
    target?: MonadTarget | null;
    payload?: unknown;
    message?: string;
    cause?: unknown;
  }) {
    super(input.message || `${input.operation.toUpperCase()} ${input.code}`);
    this.name = 'MonadClientError';
    this.code = input.code;
    this.status = Number.isFinite(input.status) ? Number(input.status) : 0;
    this.operation = input.operation;
    this.semanticNamespace = input.semanticNamespace;
    this.transportOrigin = input.transportOrigin;
    this.detail = input.detail ?? null;
    this.target = input.target ?? null;
    this.payload = input.payload;

    if (input.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = input.cause;
    }
  }
}

type RawEnvelope = Record<string, unknown>;

type EnvelopeRequest<Code extends string> = {
  operation: MonadOperation;
  semanticNamespace: string;
  transportOrigin?: string;
  method: 'GET' | 'POST';
  path: string;
  knownErrorCodes: readonly Code[];
  body?: Record<string, unknown>;
  fetchImpl?: typeof fetch;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export function normalizeMonadTransportOrigin(raw?: string | null): string {
  const value = String(raw || DEFAULT_MONAD_TRANSPORT_ORIGIN).trim();
  if (!value) return DEFAULT_MONAD_TRANSPORT_ORIGIN;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

export function normalizeMonadSemanticNamespace(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) return '';

  const noProtocol = value.replace(/^https?:\/\//i, '');
  const firstSegment = noProtocol.split('/')[0] || '';
  return firstSegment.trim().toLowerCase();
}

export function normalizeMonadReadPath(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) return '';

  const trimmed = value.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) return '';

  if (trimmed.includes('/')) {
    return trimmed
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('/');
  }

  return trimmed
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

function resolveFetchImpl(fetchImpl?: typeof fetch): typeof fetch | null {
  if (typeof fetchImpl === 'function') return fetchImpl;
  if (typeof fetch === 'function') return fetch.bind(globalThis);
  return null;
}

function mergeHeaders(base?: HeadersInit, override?: HeadersInit): Headers {
  const headers = new Headers(base || {});
  const overrideHeaders = new Headers(override || {});
  overrideHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  return headers;
}

function createSemanticHeaders(
  semanticNamespace: string,
  headers?: HeadersInit,
  needsJsonBody = false,
): Headers {
  const out = mergeHeaders(headers);
  out.set('accept', 'application/json');
  out.set('x-forwarded-host', semanticNamespace);
  if (needsJsonBody && !out.has('content-type')) {
    out.set('content-type', 'application/json');
  }

  try {
    out.set('host', semanticNamespace);
  } catch {
    // Browsers may silently reject Host; x-forwarded-host remains authoritative.
  }

  return out;
}

function normalizeTarget(value: unknown): MonadTarget | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const rawNamespace = record.namespace;
  const namespaceRecord =
    rawNamespace && typeof rawNamespace === 'object'
      ? rawNamespace as Record<string, unknown>
      : null;

  return {
    namespace: {
      me: String(namespaceRecord?.me || '').trim() || 'unknown',
      host: String(namespaceRecord?.host || '').trim() || 'unknown',
    },
    operation: String(record.operation || '').trim() || 'unknown',
    path: String(record.path || '').trim() || '/',
    nrp: String(record.nrp || '').trim(),
    relation: record.relation,
    value: record.value,
  };
}

function readDetail(payload: RawEnvelope): string | null {
  const detail = payload.detail;
  return typeof detail === 'string' && detail.trim() ? detail.trim() : null;
}

function mapWireErrorCode(raw: string): string {
  return raw;
}

function toKnownErrorCode<Code extends string>(
  raw: unknown,
  known: readonly Code[],
): Code | MonadTransportErrorCode {
  const normalized = mapWireErrorCode(String(raw || '').trim());
  if (normalized && known.includes(normalized as Code)) {
    return normalized as Code;
  }
  return 'INVALID_RESPONSE';
}

function createClientError<Code extends string>(input: {
  code: Code;
  status: number;
  operation: MonadOperation;
  semanticNamespace: string;
  transportOrigin: string;
  detail?: string | null;
  target?: MonadTarget | null;
  payload?: unknown;
  message?: string;
  cause?: unknown;
}) {
  return new MonadClientError<Code>(input);
}

async function requestEnvelope<Code extends string>(
  input: EnvelopeRequest<Code>,
): Promise<RawEnvelope> {
  const semanticNamespace = normalizeMonadSemanticNamespace(input.semanticNamespace);
  const transportOrigin = normalizeMonadTransportOrigin(input.transportOrigin);
  const fetchImpl = resolveFetchImpl(input.fetchImpl);

  if (!semanticNamespace) {
    throw createClientError<Code | MonadValidationErrorCode>({
      code: 'NAMESPACE_REQUIRED',
      status: 400,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      message: 'Semantic namespace is required.',
    });
  }

  if (!fetchImpl) {
    throw createClientError<MonadTransportErrorCode>({
      code: 'FETCH_UNAVAILABLE',
      status: 0,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      message: 'Fetch implementation is not available.',
    });
  }

  // transportOrigin may itself carry a base path (e.g. netget's
  // /monads/<name> path-based proxy route, so a monad doesn't need its own
  // subdomain — see modules/netget's monad_proxy.lua). `new URL(path, base)`
  // would silently drop that base path: per the URL spec, an absolute path
  // (input.path always starts with "/") replaces the base's entire path
  // rather than appending to it. Resolve against the origin only, with the
  // base's own path prepended, so a path-prefixed transportOrigin survives.
  const baseUrl = new URL(transportOrigin);
  const basePath = baseUrl.pathname.replace(/\/+$/, '');
  const requestPath = input.path.startsWith('/') ? input.path : `/${input.path}`;
  const url = new URL(`${basePath}${requestPath}`, baseUrl.origin);
  const headers = createSemanticHeaders(
    semanticNamespace,
    input.headers,
    input.body !== undefined,
  );

  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      method: input.method,
      headers,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      signal: input.signal,
    });
  } catch (error) {
    throw createClientError<MonadTransportErrorCode>({
      code: 'NETWORK_ERROR',
      status: 0,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      message: `Network error while performing ${input.operation}.`,
      cause: error,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw createClientError<MonadTransportErrorCode>({
      code: 'INVALID_JSON',
      status: response.status,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      message: 'Monad returned a non-JSON response.',
      cause: error,
    });
  }

  if (!payload || typeof payload !== 'object') {
    throw createClientError<MonadTransportErrorCode>({
      code: 'INVALID_RESPONSE',
      status: response.status,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      message: 'Monad returned an invalid envelope.',
      payload,
    });
  }

  const envelope = payload as RawEnvelope;
  if (!response.ok || envelope.ok === false) {
    throw createClientError<Code | MonadTransportErrorCode>({
      code: toKnownErrorCode(envelope.error, input.knownErrorCodes),
      status: response.status,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      detail: readDetail(envelope),
      target: normalizeTarget(envelope.target),
      payload: envelope,
      message: typeof envelope.error === 'string' && envelope.error.trim()
        ? `${input.operation.toUpperCase()} ${mapWireErrorCode(envelope.error)}`
        : `${input.operation.toUpperCase()} failed`,
    });
  }

  if (envelope.ok !== true) {
    throw createClientError<MonadTransportErrorCode>({
      code: 'INVALID_RESPONSE',
      status: response.status,
      operation: input.operation,
      semanticNamespace,
      transportOrigin,
      message: 'Monad returned an invalid success envelope.',
      target: normalizeTarget(envelope.target),
      payload: envelope,
    });
  }

  return envelope;
}

function requireStringField<Code extends string>(
  payload: RawEnvelope,
  field: string,
  input: {
    operation: MonadOperation;
    semanticNamespace: string;
    transportOrigin: string;
  },
): string {
  const value = payload[field];
  if (typeof value === 'string') return value;

  throw createClientError<Code | MonadTransportErrorCode>({
    code: 'INVALID_RESPONSE',
    status: 200,
    operation: input.operation,
    semanticNamespace: input.semanticNamespace,
    transportOrigin: input.transportOrigin,
    message: `Monad response is missing ${field}.`,
    target: normalizeTarget(payload.target),
    payload,
  });
}

function requireNumberField<Code extends string>(
  payload: RawEnvelope,
  field: string,
  input: {
    operation: MonadOperation;
    semanticNamespace: string;
    transportOrigin: string;
  },
): number {
  const value = Number(payload[field]);
  if (Number.isFinite(value)) return value;

  throw createClientError<Code | MonadTransportErrorCode>({
    code: 'INVALID_RESPONSE',
    status: 200,
    operation: input.operation,
    semanticNamespace: input.semanticNamespace,
    transportOrigin: input.transportOrigin,
    message: `Monad response is missing ${field}.`,
    target: normalizeTarget(payload.target),
    payload,
  });
}

function requireTarget<Code extends string>(
  payload: RawEnvelope,
  input: {
    operation: MonadOperation;
    semanticNamespace: string;
    transportOrigin: string;
  },
): MonadTarget {
  const target = normalizeTarget(payload.target);
  if (target) return target;

  throw createClientError<Code | MonadTransportErrorCode>({
    code: 'INVALID_RESPONSE',
    status: 200,
    operation: input.operation,
    semanticNamespace: input.semanticNamespace,
    transportOrigin: input.transportOrigin,
    message: 'Monad response is missing target metadata.',
    payload,
  });
}

export async function claimNamespace(
  input: MonadClaimInput,
): Promise<MonadClaimResult> {
  const semanticNamespace = normalizeMonadSemanticNamespace(input.semanticNamespace);
  const transportOrigin = normalizeMonadTransportOrigin(input.transportOrigin);

  if (!semanticNamespace) {
    throw createClientError<MonadClaimErrorCode>({
      code: 'NAMESPACE_REQUIRED',
      status: 400,
      operation: 'claim',
      semanticNamespace,
      transportOrigin,
      message: 'Semantic namespace is required.',
    });
  }
  if (!input.proof) {
    throw createClientError<MonadClaimErrorCode>({
      code: 'PROOF_REQUIRED',
      status: 403,
      operation: 'claim',
      semanticNamespace,
      transportOrigin,
      message: 'A real Ed25519 proof is required for claim — see this.me\'s prove().',
    });
  }

  const payload = await requestEnvelope({
    operation: 'claim',
    semanticNamespace,
    transportOrigin,
    method: 'POST',
    // Kernel claim/open commands live on /me/*, not the generic write
    // endpoint (/) — meCommandHandler parses "kernel:claim" and the
    // namespace out of this exact path shape (see modules/monad's
    // handlers/commandHandler.ts). Posting to '/' silently fell through to
    // rootCommandHandler instead, which has no concept of claim/open at
    // all and always fails with NAMESPACE_REQUIRED (this path was never
    // exercised against a real monad before).
    path: `/me/kernel:claim/${encodeURIComponent(semanticNamespace)}`,
    knownErrorCodes: CLAIM_ERROR_CODES,
    body: {
      proof: input.proof,
      ...(input.identityHash ? { identityHash: String(input.identityHash).trim() } : {}),
      ...(input.publicKey ? { publicKey: String(input.publicKey).trim() } : {}),
      ...(input.privateKey ? { privateKey: String(input.privateKey).trim() } : {}),
    },
    fetchImpl: input.fetchImpl,
    headers: input.headers,
    signal: input.signal,
  });

  const target = requireTarget<MonadClaimErrorCode>(payload, {
    operation: 'claim',
    semanticNamespace,
    transportOrigin,
  });

  return {
    ok: true,
    target,
    namespace: target.namespace.me,
    identityHash: requireStringField<MonadClaimErrorCode>(payload, 'identityHash', {
      operation: 'claim',
      semanticNamespace,
      transportOrigin,
    }),
    publicKey:
      typeof payload.publicKey === 'string' && payload.publicKey.trim()
        ? payload.publicKey.trim()
        : null,
    createdAt: requireNumberField<MonadClaimErrorCode>(payload, 'createdAt', {
      operation: 'claim',
      semanticNamespace,
      transportOrigin,
    }),
    persistentClaim: payload.persistentClaim ?? null,
  };
}

export async function openNamespace(
  input: MonadOpenInput,
): Promise<MonadOpenResult> {
  const semanticNamespace = normalizeMonadSemanticNamespace(input.semanticNamespace);
  const transportOrigin = normalizeMonadTransportOrigin(input.transportOrigin);

  if (!semanticNamespace) {
    throw createClientError<MonadOpenErrorCode>({
      code: 'NAMESPACE_REQUIRED',
      status: 400,
      operation: 'open',
      semanticNamespace,
      transportOrigin,
      message: 'Semantic namespace is required.',
    });
  }
  if (!input.proof) {
    throw createClientError<MonadOpenErrorCode>({
      code: 'PROOF_REQUIRED',
      status: 403,
      operation: 'open',
      semanticNamespace,
      transportOrigin,
      message: 'A real Ed25519 proof (with a fresh per-open nonce as its challenge) is required for open.',
    });
  }

  const payload = await requestEnvelope({
    operation: 'open',
    semanticNamespace,
    transportOrigin,
    method: 'POST',
    // See claimNamespace()'s comment — same fix, same reason.
    path: `/me/kernel:open/${encodeURIComponent(semanticNamespace)}`,
    knownErrorCodes: OPEN_ERROR_CODES,
    body: {
      proof: input.proof,
    },
    fetchImpl: input.fetchImpl,
    headers: input.headers,
    signal: input.signal,
  });

  const target = requireTarget<MonadOpenErrorCode>(payload, {
    operation: 'open',
    semanticNamespace,
    transportOrigin,
  });

  return {
    ok: true,
    target,
    namespace: target.namespace.me,
    identityHash: requireStringField<MonadOpenErrorCode>(payload, 'identityHash', {
      operation: 'open',
      semanticNamespace,
      transportOrigin,
    }),
    memories: Array.isArray(payload.memories)
      ? payload.memories as MonadReplayMemory[]
      : [],
    openedAt: requireNumberField<MonadOpenErrorCode>(payload, 'openedAt', {
      operation: 'open',
      semanticNamespace,
      transportOrigin,
    }),
    verified: payload.verified !== false,
    identity: payload.identity,
    policy: payload.policy,
    audit: payload.audit,
    reason: typeof payload.reason === 'string' ? payload.reason : null,
    reasonCode: typeof payload.reasonCode === 'string' ? payload.reasonCode : null,
  };
}

export async function writeNamespace<TValue = unknown>(
  input: MonadWriteInput<TValue>,
): Promise<MonadWriteResult> {
  const semanticNamespace = normalizeMonadSemanticNamespace(input.semanticNamespace);
  const transportOrigin = normalizeMonadTransportOrigin(input.transportOrigin);
  const expression = String(input.expression || '').trim();

  if (!semanticNamespace) {
    throw createClientError<MonadWriteErrorCode>({
      code: 'NAMESPACE_REQUIRED',
      status: 400,
      operation: 'write',
      semanticNamespace,
      transportOrigin,
      message: 'Semantic namespace is required.',
    });
  }
  if (!expression) {
    throw createClientError<MonadWriteErrorCode>({
      code: 'EXPRESSION_REQUIRED',
      status: 400,
      operation: 'write',
      semanticNamespace,
      transportOrigin,
      message: 'Expression is required for write.',
    });
  }

  const payload = await requestEnvelope({
    operation: 'write',
    semanticNamespace,
    transportOrigin,
    method: 'POST',
    path: '/',
    knownErrorCodes: WRITE_ERROR_CODES,
    body: {
      ...(input.body || {}),
      operation: 'write',
      expression,
      value: input.value,
      ...(input.identityHash ? { identityHash: String(input.identityHash).trim() } : {}),
      ...(input.signature ? { signature: String(input.signature).trim() } : {}),
      ...(input.signedPayload ? { signedPayload: String(input.signedPayload).trim() } : {}),
      ...(input.signatureEncoding ? { signatureEncoding: String(input.signatureEncoding).trim() } : {}),
      ...(input.signatureFormat ? { signatureFormat: String(input.signatureFormat).trim() } : {}),
    },
    fetchImpl: input.fetchImpl,
    headers: input.headers,
    signal: input.signal,
  });

  return {
    ok: true,
    target: requireTarget<MonadWriteErrorCode>(payload, {
      operation: 'write',
      semanticNamespace,
      transportOrigin,
    }),
    memoryHash: requireStringField<MonadWriteErrorCode>(payload, 'memoryHash', {
      operation: 'write',
      semanticNamespace,
      transportOrigin,
    }),
    timestamp: requireNumberField<MonadWriteErrorCode>(payload, 'timestamp', {
      operation: 'write',
      semanticNamespace,
      transportOrigin,
    }),
  };
}

export async function readNamespacePath<TValue = unknown>(
  input: MonadReadInput,
): Promise<MonadReadResult<TValue>> {
  const semanticNamespace = normalizeMonadSemanticNamespace(input.semanticNamespace);
  const transportOrigin = normalizeMonadTransportOrigin(input.transportOrigin);
  const normalizedPath = normalizeMonadReadPath(input.path);

  if (!semanticNamespace) {
    throw createClientError<MonadReadErrorCode>({
      code: 'NAMESPACE_REQUIRED',
      status: 400,
      operation: 'read',
      semanticNamespace,
      transportOrigin,
      message: 'Semantic namespace is required.',
    });
  }
  if (!normalizedPath) {
    throw createClientError<MonadReadErrorCode>({
      code: 'PATH_REQUIRED',
      status: 400,
      operation: 'read',
      semanticNamespace,
      transportOrigin,
      message: 'Path is required for read.',
    });
  }

  const encodedPath = normalizedPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const payload = await requestEnvelope({
    operation: 'read',
    semanticNamespace,
    transportOrigin,
    method: 'GET',
    path: `/${encodedPath}${input.namedNamespace ? `?namespace=${encodeURIComponent(semanticNamespace)}` : ''}`,
    knownErrorCodes: READ_ERROR_CODES,
    fetchImpl: input.fetchImpl,
    headers: input.headers,
    signal: input.signal,
  });

  const target = requireTarget<MonadReadErrorCode>(payload, {
    operation: 'read',
    semanticNamespace,
    transportOrigin,
  });

  if (input.namedNamespace && normalizeMonadSemanticNamespace(target.namespace.me) !== semanticNamespace) {
    throw createClientError<MonadReadErrorCode>({
      code: 'NAMESPACE_MISMATCH',
      status: 409,
      operation: 'read',
      semanticNamespace,
      transportOrigin,
      message: `This transport answered for ${target.namespace.me}, not for ${semanticNamespace}.`,
    });
  }

  return {
    ok: true,
    target,
    namespace: target.namespace.me,
    path: target.path,
    value: target.value as TValue,
  };
}

// The chain head a caller must bind into a write's signed body before
// calling writeNamespace() with a signature -- see writeNamespace's own doc
// note and Surface-Identity-Claims.md §7.7. A successful writeNamespace()
// response already carries its own new `memoryHash` as the NEXT head, so a
// caller mid-session can chain off that directly without a fresh call here;
// this is for a session's first signed write, or after any change this
// session didn't itself make.
export async function fetchWriteHead(input: MonadWriteHeadInput): Promise<MonadWriteHeadResult> {
  const semanticNamespace = normalizeMonadSemanticNamespace(input.semanticNamespace);
  const transportOrigin = normalizeMonadTransportOrigin(input.transportOrigin);

  if (!semanticNamespace) {
    throw createClientError<MonadWriteHeadErrorCode>({
      code: 'NAMESPACE_REQUIRED',
      status: 400,
      operation: 'read',
      semanticNamespace,
      transportOrigin,
      message: 'Semantic namespace is required.',
    });
  }

  const payload = await requestEnvelope({
    operation: 'read',
    semanticNamespace,
    transportOrigin,
    method: 'GET',
    path: `/api/v1/write-head?namespace=${encodeURIComponent(semanticNamespace)}`,
    knownErrorCodes: WRITE_HEAD_ERROR_CODES,
    fetchImpl: input.fetchImpl,
    headers: input.headers,
    signal: input.signal,
  });

  // `namespace` nests under target.namespace.me, like readNamespacePath's
  // own target does (envelope.ts's nestResponseFields moves it there) --
  // `expectedHeadHash` stays a plain top-level field, since it's not one of
  // envelope.ts's three nested keys (namespace/path/value).
  const target = requireTarget<MonadWriteHeadErrorCode>(payload, {
    operation: 'read',
    semanticNamespace,
    transportOrigin,
  });

  return {
    ok: true,
    namespace: target.namespace.me,
    expectedHeadHash: requireStringField<MonadWriteHeadErrorCode>(payload, 'expectedHeadHash', {
      operation: 'read',
      semanticNamespace,
      transportOrigin,
    }),
  };
}

export function createMonadClient(options: MonadClientOptions = {}): MonadClient {
  return {
    claimNamespace(input) {
      return claimNamespace({
        ...input,
        transportOrigin: input.transportOrigin || options.transportOrigin,
        fetchImpl: input.fetchImpl || options.fetchImpl,
        headers: mergeHeaders(options.headers, input.headers),
      });
    },
    openNamespace(input) {
      return openNamespace({
        ...input,
        transportOrigin: input.transportOrigin || options.transportOrigin,
        fetchImpl: input.fetchImpl || options.fetchImpl,
        headers: mergeHeaders(options.headers, input.headers),
      });
    },
    writeNamespace(input) {
      return writeNamespace({
        ...input,
        transportOrigin: input.transportOrigin || options.transportOrigin,
        fetchImpl: input.fetchImpl || options.fetchImpl,
        headers: mergeHeaders(options.headers, input.headers),
      });
    },
    readNamespacePath(input) {
      return readNamespacePath({
        ...input,
        transportOrigin: input.transportOrigin || options.transportOrigin,
        fetchImpl: input.fetchImpl || options.fetchImpl,
        headers: mergeHeaders(options.headers, input.headers),
      });
    },
    fetchWriteHead(input) {
      return fetchWriteHead({
        ...input,
        transportOrigin: input.transportOrigin || options.transportOrigin,
        fetchImpl: input.fetchImpl || options.fetchImpl,
        headers: mergeHeaders(options.headers, input.headers),
      });
    },
  };
}
