import ME from 'this.me';
import type { RuntimeAdapter } from '@/runtime/adapter';
import { createMeRuntime, readMeValue, writeMeValue } from '@/runtime/run-me';
import type { MeLike } from '@/react/types';
import {
  claimNamespace,
  createMonadClient,
  DEFAULT_MONAD_TRANSPORT_ORIGIN,
  MonadClientError,
  type MonadClaimResult,
  type MonadClient,
  type MonadClientOptions,
  type MonadOpenResult,
  type MonadReplayMemory,
  type MonadWriteInput,
  type MonadWriteResult,
  normalizeMonadSemanticNamespace,
  normalizeMonadTransportOrigin,
} from './monadClient';

const THIS_ME_SEED_STORAGE_KEY = 'this.me.seed:v1';

/**
 * "This tab started here" -- a plain instance fact, written once at
 * construction, the same way any other value would be (me.whatever(what) --
 * the kernel never learns what "window" is, it just holds a string at this
 * path). GUI is already the layer that legitimately reads window.location
 * everywhere; this hands that same read to the kernel instance too, instead
 * of only living in a local variable. Origin only, never the full href: a
 * query string can carry a one-time setup/claim token (CleakerLanding.tsx's
 * own returnTo/setupToken handling) that has no business landing in a value
 * this kernel might later disclose.
 *
 * Called from every site that actually constructs a fresh `me` -- both
 * session factories below, AND SeedSessionProvider.tsx's own loginWithSeed
 * (its createRuntime branch constructs `me` itself, before either factory
 * ever sees it, so that construction needs the exact same call). Never
 * called when a caller supplies an already-built `me` -- its own
 * construction site already had this chance, or deliberately skipped it.
 */
export function writeKernelWindowLocation(me: MeLike): void {
  if (typeof window === 'undefined') return;
  (me as any).window.location(window.location.origin);
}

export type SeedSessionErrorCode =
  | 'SEED_REQUIRED'
  | 'IDENTITY_HASH_UNAVAILABLE'
  | 'REPLAY_UNAVAILABLE'
  | 'NAMESPACE_REQUIRED';

export class SeedSessionError<Code extends SeedSessionErrorCode = SeedSessionErrorCode> extends Error {
  readonly code: Code;

  constructor(code: Code, message?: string) {
    super(message || code);
    this.name = 'SeedSessionError';
    this.code = code;
  }
}

export type SeedSessionOptions = MonadClientOptions & {
  seed: string;
  me?: MeLike;
  runtime?: RuntimeAdapter | null;
  semanticNamespace?: string | null;
};

/**
 * A runtime FACTORY, not a pre-built RuntimeAdapter -- both session
 * backends (this file's createSeedSession, and createCleakerSession.ts)
 * construct their own `me` internally, so a caller can never hand over a
 * ready-made runtime bound to it in advance. Pass e.g.
 * `(me, ctx) => createWsMeRuntime(me, ctx)` for a session whose declarative
 * reads (useMeValue) stay live against the real namespace tree over the
 * monad's own /nrp WebSocket channel, instead of the default
 * createMeRuntime(me) — local-only, reflects nothing this session didn't
 * itself write or read. SeedSessionProvider.tsx re-exports this under the
 * same name it originally defined it under (CreateSeedSessionRuntime) --
 * this is the one definition, not two independently-typed copies.
 */
export type CreateSessionRuntime = (
  me: MeLike,
  context: { semanticNamespace: string | null; transportOrigin: string },
) => RuntimeAdapter;

export type SeedSessionWriteOptions<TValue = unknown> = Omit<
  MonadWriteInput<TValue>,
  'semanticNamespace' | 'identityHash' | 'transportOrigin' | 'fetchImpl' | 'headers' | 'expression' | 'value'
>;

export interface SeedSession {
  readonly me: MeLike;
  readonly runtime: RuntimeAdapter;
  readonly monad: MonadClient;
  readonly identityHash: string;
  readonly transportOrigin: string;
  readonly semanticNamespace: string | null;
  claim(namespace: string): Promise<MonadClaimResult>;
  claimAndOpen(namespace: string): Promise<MonadOpenResult>;
  open(namespace?: string | null): Promise<MonadOpenResult>;
  sync(): Promise<MonadOpenResult>;
  read<TValue = unknown>(path: string): TValue;
  write<TValue = unknown>(
    expression: string,
    value: TValue,
    options?: SeedSessionWriteOptions<TValue>,
  ): Promise<MonadWriteResult>;
  /**
   * Sign an arbitrary message with this session's own claim-identity key —
   * the same Ed25519 key derived at claim time (this.me's
   * deriveBranchProofSeed/importEd25519SigningKey/signEd25519Proof
   * pipeline), not a new parallel credential. For write paths that need to
   * prove authorship of specific content (e.g. monad's /api/v1/commit,
   * which verifies via isNamespaceWriteAuthorized against the caller's own
   * claim), sign the canonical JSON of that content and attach the result
   * as `signature`. Optional because not every session backend can produce
   * one (the plain REST createSeedSession.ts backend holds only a derived
   * seed string, not necessarily one bound to an active expression).
   */
  signPayload?(message: string): Promise<string>;
  /**
   * The one signed-write entry point GUI code should use: "save this value
   * at this path" — nothing about signatures, canonical JSON, or which
   * namespace this targets is the caller's concern. Composes this same
   * session's own write()+signPayload() internally, using ITS OWN bound
   * identityHash/namespace, so a caller can never sign a payload for one
   * namespace and have it land against another. Optional for the same
   * reason signPayload is: a session backend that can't sign (no
   * signPayload) can't offer this either.
   */
  signAndWrite?<TValue = unknown>(expression: string, value: TValue): Promise<MonadWriteResult>;
  /**
   * The read-side counterpart to signAndWrite — a genuine, disclosure-
   * checked read against this session's own monad/namespace (never the
   * local-only read() above, which only ever answers from whatever this
   * tab already has in memory). Resolves the SAME namespace write()/
   * signAndWrite() do, so a caller can't accidentally read one namespace's
   * copy of a path while having written another's. Returns `undefined` for
   * a path that genuinely doesn't exist yet, rather than throwing.
   */
  readConfirmed?<TValue = unknown>(expression: string): Promise<TValue | undefined>;
  /**
   * Live read of ANOTHER identity's (or this same one's, addressed by its
   * own username) namespace value, over cleaker's own `<owner>.cleaker.
   * <path>` remote convention (modules/cleaker's binder.ts -- see
   * BindKernelOptions.live's own doc comment). Only createCleakerSession()
   * can offer this (it's the only backend that constructs a real
   * cleaker(me, ...) node) -- optional so a caller can feature-detect
   * rather than assume. Returns undefined for a path that doesn't resolve,
   * same convention as readConfirmed.
   */
  readOwnerPath?<TValue = unknown>(owner: string, path: string): Promise<TValue | undefined>;
  /**
   * Fires whenever a path previously read via readOwnerPath changes on the
   * server, pushed live (requires the session's own `live: true`) --
   * `key` is `"<owner>.cleaker.<path>"`, matching what readOwnerPath was
   * called with (joined by '.'). Returns an unsubscribe function. Optional
   * for the same reason readOwnerPath is.
   */
  onOwnerPathChange?(handler: (key: string, value: unknown) => void): () => void;
  clear(): void;
  logout(): void;
}

function scrubSeedStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(THIS_ME_SEED_STORAGE_KEY);
  } catch {
    // Storage cleanup is best-effort until .me exposes seedPersistence controls.
  }
}

function resolveRuntimeSurface(me: MeLike): any {
  return (me as any)?.['!'] || null;
}

function resolveIdentityHash(me: MeLike): string {
  const runtimeSurface = resolveRuntimeSurface(me);
  const identity = typeof runtimeSurface?.identity === 'function'
    ? runtimeSurface.identity()
    : null;
  const hash = String(identity?.hash || '').trim();

  if (!hash) {
    throw new SeedSessionError(
      'IDENTITY_HASH_UNAVAILABLE',
      '.me did not expose an identity hash for this seed session.',
    );
  }

  return hash;
}

function replayKernelMemories(me: MeLike, memories: MonadReplayMemory[]) {
  if (typeof (me as any)?.replayMemories === 'function') {
    (me as any).replayMemories(memories);
    return;
  }

  const runtimeSurface = resolveRuntimeSurface(me);
  if (typeof runtimeSurface?.memories?.replay === 'function') {
    runtimeSurface.memories.replay(memories);
    return;
  }

  throw new SeedSessionError(
    'REPLAY_UNAVAILABLE',
    '.me does not expose replayMemories() on this runtime.',
  );
}

// Exported so createCleakerSession.ts (the cleaker(me,...)-backed session
// alternative — see SeedSessionProvider.tsx's pluggable backend) can write
// the exact same local session-state paths after its own claim/open, rather
// than re-deriving this convention. SeedSessionProvider.tsx's own
// snapshotSession() reads `identity.session.authenticated`/`.openedAt`
// straight off the session's kernel via session.read(...) — any session
// implementation that skips this write silently reports "not authenticated"
// even after a real, successful claim/open.
export function writeLocalSessionState(
  me: MeLike,
  runtime: RuntimeAdapter,
  namespace: string | null,
  authenticated: boolean,
  identityHash: string | null,
  openedAt: number | null,
) {
  const safeNamespace = String(namespace || '').trim();

  writeMeValue(me, 'identity.session.namespace', safeNamespace, { allowBarePath: true });
  writeMeValue(me, 'identity.session.authenticated', authenticated, { allowBarePath: true });
  writeMeValue(
    me,
    'identity.session.identityHash',
    authenticated ? String(identityHash || '').trim() : '',
    { allowBarePath: true },
  );
  writeMeValue(
    me,
    'identity.session.openedAt',
    authenticated && Number.isFinite(openedAt) ? Number(openedAt) : null,
    { allowBarePath: true },
  );
  runtime.notify?.('identity.session');
}

function normalizeRequiredNamespace(namespace: string | null | undefined): string {
  return normalizeMonadSemanticNamespace(String(namespace || '').trim());
}

export function createSeedSession(options: SeedSessionOptions): SeedSession {
  const seed = String(options.seed || '').trim();
  if (!seed) {
    throw new SeedSessionError('SEED_REQUIRED', 'Seed is required to create a seed session.');
  }

  const me = (options.me || (new ME(seed) as unknown as MeLike));
  scrubSeedStorage();

  // Only when THIS call actually constructed `me` -- see
  // writeKernelWindowLocation's own doc comment for why an options.me
  // caller is skipped.
  if (!options.me) writeKernelWindowLocation(me);

  const runtime = options.runtime || createMeRuntime(me);
  const monad = createMonadClient(options);
  const identityHash = resolveIdentityHash(me);
  const transportOrigin = normalizeMonadTransportOrigin(
    options.transportOrigin || DEFAULT_MONAD_TRANSPORT_ORIGIN,
  );
  let activeNamespace = normalizeRequiredNamespace(options.semanticNamespace) || null;

  const claim = async (namespace: string) => {
    const semanticNamespace = normalizeRequiredNamespace(namespace);
    if (!semanticNamespace) {
      throw new SeedSessionError('NAMESPACE_REQUIRED', 'Namespace is required for claim.');
    }

    const result = await claimNamespace({
      semanticNamespace,
      seed,
      identityHash,
      transportOrigin,
      fetchImpl: options.fetchImpl,
      headers: options.headers,
    });

    activeNamespace = result.namespace;
    writeLocalSessionState(me, runtime, activeNamespace, true, identityHash, null);
    return result;
  };

  const open = async (namespace?: string | null) => {
    const semanticNamespace = normalizeRequiredNamespace(namespace || activeNamespace);
    if (!semanticNamespace) {
      throw new SeedSessionError('NAMESPACE_REQUIRED', 'Namespace is required for open.');
    }

    const result = await monad.openNamespace({
      semanticNamespace,
      seed,
      identityHash,
    });

    replayKernelMemories(me, result.memories);
    activeNamespace = result.namespace;
    writeLocalSessionState(
      me,
      runtime,
      activeNamespace,
      true,
      result.identityHash || identityHash,
      result.openedAt,
    );
    return result;
  };

  const clear = () => {
    replayKernelMemories(me, []);
    activeNamespace = null;
    writeLocalSessionState(me, runtime, null, false, null, null);
  };

  return {
    me,
    runtime,
    monad,
    identityHash,
    transportOrigin,
    get semanticNamespace() {
      return activeNamespace;
    },
    claim,
    async claimAndOpen(namespace: string) {
      await claim(namespace);
      return open(namespace);
    },
    open,
    async sync() {
      return open(activeNamespace);
    },
    read(path) {
      return readMeValue(me, path, { allowBarePath: true });
    },
    // Mirrors createCleakerSession.ts's own readConfirmed exactly (same
    // contract, same doc comment on the SeedSession interface above) — this
    // backend was missing it entirely, which meant every caller reading
    // profile-shaped values (name/email/phone/...) through a plain
    // createSeedSession() session had no way to ask for anything but the
    // local mirror, no matter how stale. A genuine GET against this
    // session's own monad/namespace, resolved from the SAME activeNamespace
    // closure variable read()/write() already share.
    async readConfirmed<TValue = unknown>(expression: string): Promise<TValue | undefined> {
      const semanticNamespace = normalizeRequiredNamespace(activeNamespace);
      if (!semanticNamespace) {
        throw new SeedSessionError('NAMESPACE_REQUIRED', 'An active namespace is required for readConfirmed.');
      }
      try {
        const result = await monad.readNamespacePath<TValue>({
          semanticNamespace,
          transportOrigin,
          path: expression,
        });
        try { writeMeValue(me, expression, result.value as any, { allowBarePath: true }); } catch { /* local mirror is best-effort */ }
        return result.value;
      } catch (cause) {
        if (cause instanceof MonadClientError && (cause.code === 'NOT_FOUND' || cause.code === 'PATH_NOT_FOUND')) {
          return undefined;
        }
        throw cause;
      }
    },
    async write(expression, value, writeOptions = {}) {
      const semanticNamespace = normalizeRequiredNamespace(activeNamespace);
      if (!semanticNamespace) {
        throw new SeedSessionError('NAMESPACE_REQUIRED', 'An active namespace is required for write.');
      }

      const result = await monad.writeNamespace({
        semanticNamespace,
        expression,
        value,
        identityHash,
        signature: writeOptions.signature,
        signedPayload: writeOptions.signedPayload,
        signatureEncoding: writeOptions.signatureEncoding,
        signatureFormat: writeOptions.signatureFormat,
        body: writeOptions.body,
        signal: writeOptions.signal,
      });

      writeMeValue(me, expression, value, { allowBarePath: true });
      runtime.notify?.();
      return result;
    },
    clear,
    logout() {
      clear();
      scrubSeedStorage();
    },
  };
}

export default createSeedSession;
