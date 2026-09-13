// createCleakerSession.ts — the SeedSession shape, backed by cleaker's own
// bindKernel() (cleaker(me, {...})) instead of monadClient.ts's bare REST
// calls. Exists ALONGSIDE createSeedSession.ts, not replacing it (see
// SeedSessionProvider.tsx's pluggable backend) — this is what actually
// "mounts you onto the .me kernel" rather than just validating a secret
// against the server: it constructs a real kernel (ME(username, secret)),
// binds it to a namespace (ME.bindNamespace), and lets cleaker's own
// claim/signIn send a REAL signed proof (me['!'].prove()) alongside the
// secret. monadClient.ts's claimNamespace()/openNamespace() send only
// { secret, identityHash } — the server accepts an unverified, self-asserted
// identityHash whenever no proof is present (confirmed live: claim/records.ts's
// resolveClaimIdentity()). cleaker's claim path closes that gap.
import ME, {
  deriveBranchProofSeed,
  importEd25519SigningKey,
  signEd25519Proof,
} from 'this.me';
import cleaker from 'cleaker';
import type { CleakerNode, MeKernel } from 'cleaker';
import type { RuntimeAdapter } from '@/runtime/adapter';
import { createMeRuntime, readMeValue } from '@/runtime/run-me';
import type { MeLike } from '@/react/types';
import { deriveCompoundSeed } from '@/gui/All.This/Cleaker/signedRequest';
import { deriveWireSecretFromRootBytes, hexToBytes } from '@/core/identity/recoveryPhrase';
import {
  DEFAULT_MONAD_TRANSPORT_ORIGIN,
  MonadClientError,
  createMonadClient,
  normalizeMonadSemanticNamespace,
  normalizeMonadTransportOrigin,
  type MonadClaimResult,
  type MonadClient,
  type MonadClientOptions,
  type MonadOpenResult,
  type MonadTarget,
  type MonadWriteResult,
} from './monadClient';
import {
  SeedSessionError,
  writeLocalSessionState,
  type SeedSession,
  type SeedSessionWriteOptions,
} from './createSeedSession';

export type CleakerSessionOptions = MonadClientOptions & {
  username: string;
  /**
   * Required for the default (no identityRootHex) path — that's where
   * `deriveCompoundSeed(username, password)` needs it, both for the
   * kernel's own `#seed` and for `secretForWire`. Not read at all when
   * identityRootHex is provided (see that field's own doc comment) —
   * optional here so a phrase-based caller (registration, day-to-day
   * vault-backed sign-in, or recovery) never has to invent one.
   */
  password?: string;
  /** Root namespace to bind into, e.g. "local.cleaker" or "cleaker.me". */
  namespace: string;
  runtime?: RuntimeAdapter | null;
  /**
   * Overrides what BOTH the kernel's identity root (`#seed`) AND the wire
   * `secret` are derived from. Default (omitted): `#seed` AND `secret`
   * are both deriveCompoundSeed(username, password) — the identity IS the
   * password, with no independent backup, exactly as before this field
   * existed.
   *
   * Pass a hex root (e.g. from recoveryPhrase.ts's
   * deriveIdentityRootHexFromPhrase, itself reconstructible from either a
   * 12-word phrase or a password-unwrapped local vault) to make BOTH:
   * - the signed proof (identityHash/publicKey — see prove()) derive from
   *   this root instead of the password, and
   * - `secretForWire` derive from this SAME root too (via
   *   deriveWireSecretFromRootBytes), NOT from username+password anymore.
   *
   * That second part is what makes recovery-with-data-access possible
   * without any server change: `secret` is what the server (modules/
   * monad's claim/records.ts) scrypt's into the key that encrypts/decrypts
   * `noise` — fully independent of identityHash/publicKey validation
   * (verified live). Re-deriving the same root from the phrase later
   * reproduces the exact same `secret`, which reproduces the exact same
   * `noise`-decryption key the original claim established — recovery
   * becomes calling the ALREADY-EXISTING signIn/open endpoint with a
   * re-derived secret, not a new server capability. The password itself
   * never factors into anything sent to the server on this path at all;
   * it only ever unlocks the local vault.
   */
  identityRootHex?: string;
};

// bindKernel's claim()/signIn() throw plain `Error(CODE)` strings (see
// binder.ts — e.g. "PROOF_INVALID", "CLAIM_NOT_FOUND", "NAMESPACE_TAKEN").
// Re-thrown here as MonadClientError so SeedSessionProvider.tsx's existing
// catch block (already handles IDENTITY_MISMATCH/CLAIM_VERIFICATION_FAILED
// → a clean "Invalid Claim" message) keeps working unmodified regardless of
// which session backend produced the error — no parallel error-code enum.
function toMonadClientError(
  cause: unknown,
  operation: 'claim' | 'open',
  semanticNamespace: string,
  transportOrigin: string,
): MonadClientError<string> {
  const code = cause instanceof Error ? cause.message : String(cause);
  return new MonadClientError<string>({
    code: code || 'UNKNOWN_ERROR',
    status: 0,
    operation,
    semanticNamespace,
    transportOrigin,
    cause,
  });
}

// CleakerNode's OpenNodeResult only carries a memoriesCount, not the actual
// memories array (bindKernel already hydrates them straight into the kernel
// as part of claim()/signIn() — confirmed live, see modules/cleaker's own
// bind.test.ts). So `memories: []` here is a real, deliberate difference
// from monadClient's shape, not a bug: nothing needs to replay them a
// second time the way createSeedSession.ts's open() does for the REST path.
function toMonadOpenResult(result: { namespace: string; identityHash: string; noise: string; openedAt: number }): MonadOpenResult {
  const target: MonadTarget = {
    namespace: { me: result.namespace, host: result.namespace },
    operation: 'open',
    path: result.namespace,
    nrp: `me://kernel:open/${result.namespace}`,
  };
  return {
    ok: true,
    target,
    namespace: result.namespace,
    identityHash: result.identityHash,
    noise: result.noise,
    memories: [],
    openedAt: result.openedAt,
    verified: true,
    identity: null,
    policy: null,
    audit: null,
    reason: null,
    reasonCode: null,
  };
}

function toMonadClaimResult(result: { namespace: string; identityHash: string; openedAt: number }): MonadClaimResult {
  const target: MonadTarget = {
    namespace: { me: result.namespace, host: result.namespace },
    operation: 'claim',
    path: result.namespace,
    nrp: `me://kernel:claim/${result.namespace}`,
  };
  return {
    ok: true,
    target,
    namespace: result.namespace,
    identityHash: result.identityHash,
    publicKey: null,
    createdAt: result.openedAt,
    persistentClaim: null,
  };
}

export function createCleakerSession(options: CleakerSessionOptions): SeedSession {
  const username = String(options.username || '').trim();
  const password = String(options.password || '');
  const rootNamespace = String(options.namespace || '').trim();

  if (!username) throw new SeedSessionError('SEED_REQUIRED', 'Username is required to create a cleaker session.');
  if (!rootNamespace) throw new SeedSessionError('NAMESPACE_REQUIRED', 'A root namespace is required to create a cleaker session.');

  const explicitIdentityRootHex = String(options.identityRootHex || '').trim();

  // Same `as any` cast signedRequest.ts already uses for this exact import —
  // this package's 'this.me' default export is typed as the factory
  // function (ThisMeInput-based), not the raw ME class's own constructor
  // overloads, so TS doesn't see either constructor form without it.
  // The kernel's actual #seed equivalent, kept explicit and separate from
  // secretForWire below (they're the SAME value in the default path only —
  // deriveCompoundSeed(username,password) IS what the 2-arg ME constructor
  // uses as #seed internally too — but genuinely different values on the
  // identityRootHex path). signPayload further down needs THIS, not
  // secretForWire, to derive the same branch-proof key prove() would.
  const kernelSeedHex = explicitIdentityRootHex || deriveCompoundSeed(username, password);

  let me: any;
  if (explicitIdentityRootHex) {
    // Explicit root (e.g. phrase-derived): the 1-arg raw-seed constructor,
    // same form createSeedSession.ts's loginWithSeed already uses — but
    // THAT path never sets #activeExpression (no username involved at
    // all), so prove()/bindNamespace() below need it set explicitly via
    // the '@' identity call (Axiom A1) before anything else touches the
    // kernel. me.ts's persistSeed() never fires for an explicit seed
    // either way (see this.me's own seed-persistence fix) — this root
    // only ever gets stored where THIS session explicitly puts it (see
    // localIdentityVault.ts), never as a plaintext side effect here.
    me = new (ME as any)(explicitIdentityRootHex);
    me['@'](username);
  } else {
    // Default: the 2-arg constructor both derives the compound seed AND
    // sets #activeExpression in one step — required for prove()/
    // bindNamespace() to work at all (confirmed live: the 1-arg seed-string
    // form createSeedSession.ts uses never sets it, and prove() throws
    // ACTIVE_EXPRESSION_REQUIRED without it).
    me = new (ME as any)(username, password);
  }
  (me as unknown as MeLike & { bindNamespace: (root: string) => unknown }).bindNamespace(rootNamespace);

  // Lazy + memoized: deriveWireSecretFromRootBytes is WebCrypto-async, and
  // this function itself stays synchronous (its existing contract — see
  // SeedSessionProvider.tsx's callers, none of which await construction).
  // Computed once, on first actual use (claim/open/sync), not at
  // construction time.
  let secretForWirePromise: Promise<string> | null = null;
  const getSecretForWire = (): Promise<string> => {
    if (!secretForWirePromise) {
      secretForWirePromise = explicitIdentityRootHex
        // See CleakerSessionOptions.identityRootHex's own doc comment for
        // why this is derived from the ROOT, not from username+password —
        // that's the entire mechanism that makes recovery-with-data
        // possible without a server change.
        ? deriveWireSecretFromRootBytes(hexToBytes(explicitIdentityRootHex))
        : Promise.resolve(deriveCompoundSeed(username, password));
    }
    return secretForWirePromise;
  };

  const runtime = options.runtime || createMeRuntime(me);
  const monad = createMonadClient(options);
  const transportOrigin = normalizeMonadTransportOrigin(
    options.transportOrigin || DEFAULT_MONAD_TRANSPORT_ORIGIN,
  );

  // Deliberately NOT passing `space` here. bindKernel's own origin
  // resolution (resolveSurfaceOrigins) only knows how to derive a
  // connection origin from a few fixed space shapes (public domain, bare
  // hostname+.local+port, IP) — it has no concept of netget's /apps/:name
  // mesh-proxy path (confirmed live: passing space: 'local.cleaker' tried
  // connecting to https://local.cleaker directly and got a real 405, the
  // same failure this session already diagnosed once for a raw POST to
  // local.cleaker's admin block outside /apps/netget). `bootstrap` is
  // cleaker's actual mechanism for "here is the exact origin to use" — the
  // namespace STRING (not the connection target) still resolves correctly
  // without `space` here because bindNamespace() already wrote it onto the
  // kernel, and resolveSurfaceNamespaceConstant()'s new fallback (Stage 2)
  // reads it from there.
  //
  // Also deliberately NOT passing `secret` here. bindKernel's "Triad
  // auto-open" fires a background signIn() the instant options.secret is
  // truthy (binder.ts: `if (options.secret) { _ready = signIn({namespace:
  // explicitNamespace, ...}) }`) — and explicitNamespace resolves from the
  // kernel's own bound root (Stage 2's fallback) even with no explicit
  // `namespace` passed here, so this fires for real. That races the
  // claim()/open() calls below, which already pass `secret` per-call
  // (confirmed live: two concurrent claim attempts for the same brand-new
  // namespace, one racing to NAMESPACE_TAKEN and cascading through every
  // origin fallback down to a real CORS-blocked cleaker.me request).
  const node: CleakerNode = cleaker(me as unknown as MeKernel, {
    bootstrap: [transportOrigin],
    fetcher: options.fetchImpl,
  });

  let activeNamespace: string | null = null;
  let identityHash = '';

  const claim = async (namespace: string): Promise<MonadClaimResult> => {
    const semanticNamespace = normalizeMonadSemanticNamespace(String(namespace || '').trim());
    if (!semanticNamespace) {
      throw new SeedSessionError('NAMESPACE_REQUIRED', 'Namespace is required for claim.');
    }

    try {
      const secret = await getSecretForWire();
      const result = await node.claim({ namespace: semanticNamespace, secret });
      activeNamespace = result.namespace;
      identityHash = result.identityHash;
      writeLocalSessionState(me, runtime, activeNamespace, true, identityHash, result.openedAt);
      return toMonadClaimResult(result);
    } catch (cause) {
      throw toMonadClientError(cause, 'claim', semanticNamespace, transportOrigin);
    }
  };

  const open = async (namespace?: string | null): Promise<MonadOpenResult> => {
    const semanticNamespace = normalizeMonadSemanticNamespace(String(namespace || activeNamespace || '').trim());
    if (!semanticNamespace) {
      throw new SeedSessionError('NAMESPACE_REQUIRED', 'Namespace is required for open.');
    }

    try {
      const secret = await getSecretForWire();
      const result = await node.signIn({ namespace: semanticNamespace, secret });
      activeNamespace = result.namespace;
      identityHash = result.identityHash;
      writeLocalSessionState(me, runtime, activeNamespace, true, identityHash, result.openedAt);
      return toMonadOpenResult(result);
    } catch (cause) {
      throw toMonadClientError(cause, 'open', semanticNamespace, transportOrigin);
    }
  };

  const clear = () => {
    activeNamespace = null;
    identityHash = '';
    writeLocalSessionState(me, runtime, null, false, null, null);
  };

  return {
    me,
    runtime,
    monad,
    get identityHash() {
      return identityHash;
    },
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
    // CleakerNode has no signed-write primitive today (confirmed: its
    // public surface is claim/signIn/pointer/discoverHosts/validateHosts —
    // no write). Falls back to the same REST write monadClient.ts already
    // provides, deliberately not reimplemented here.
    async write<TValue = unknown>(
      expression: string,
      value: TValue,
      writeOptions: SeedSessionWriteOptions<TValue> = {},
    ): Promise<MonadWriteResult> {
      const semanticNamespace = normalizeMonadSemanticNamespace(String(activeNamespace || '').trim());
      if (!semanticNamespace) {
        throw new SeedSessionError('NAMESPACE_REQUIRED', 'An active namespace is required for write.');
      }

      return monad.writeNamespace({
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
    },
    // Same branch-proof key derivation prove() uses internally
    // (deriveBranchProofSeed(seed, expression) -> importEd25519SigningKey),
    // now signing a caller-supplied message instead of prove()'s own fixed
    // claim/challenge shape. kernelSeedHex and username are already in
    // closure scope from session creation -- the raw key never leaves this
    // module, and this derives the exact same key the server already holds
    // the public half of from claim time (see modules/monad's
    // records.ts:rawEd25519PublicKeyToPem, and the cross-package
    // compatibility test in modules/monad's crossPackageSigning.test.ts).
    async signPayload(message: string): Promise<string> {
      const branchSeed = await deriveBranchProofSeed(kernelSeedHex, username);
      const { privateKey } = await importEd25519SigningKey(branchSeed);
      return signEd25519Proof(privateKey, message);
    },
    clear,
    logout() {
      clear();
    },
  };
}

export default createCleakerSession;
