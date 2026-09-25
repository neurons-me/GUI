// createCleakerSession.ts — the SeedSession shape, backed by cleaker's own
// bindKernel() (cleaker(me, {...})) instead of monadClient.ts's bare REST
// calls. Exists ALONGSIDE createSeedSession.ts, not replacing it (see
// SeedSessionProvider.tsx's pluggable backend) — this is what actually
// "mounts you onto the .me kernel" rather than just validating a shared
// secret against the server: it constructs a real kernel already bound to
// a namespace (ME(username, secret, { namespace })), and lets cleaker's own
// claim/signIn send a REAL signed proof (me['!'].prove()) — the ONLY thing
// either call sends now, since a shared "secret" was removed from the wire
// protocol entirely (it used to be the exact same material the signing key
// itself derives from, so sending it leaked key-deriving material for no
// security gain — see typedocs/Architecture/Identity-Namespace-Recovery-
// Audit.md §12 item 7, modules/monad's typedocs).
import ME, {
  deriveBranchProofSeed,
  importEd25519SigningKey,
  normalizeProofMessage,
  signEd25519Proof,
} from 'this.me';
import cleaker from 'cleaker';
import type { CleakerNode, MeKernel } from 'cleaker';
import type { RuntimeAdapter } from '@/runtime/adapter';
import { createMeRuntime, readMeValue, writeMeValue } from '@/runtime/run-me';
import { deriveCompoundSeed } from '@/gui/All.This/Cleaker/signedRequest';
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
  writeKernelWindowLocation,
  type SeedSession,
  type SeedSessionWriteOptions,
  type CreateSessionRuntime,
} from './createSeedSession';
import { buildGuessedFullNamespace } from '@/gui/All.This/Cleaker/signedRequest';

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
  /** See CreateSessionRuntime's own doc comment (createSeedSession.ts). */
  createRuntime?: CreateSessionRuntime;
  /**
   * Passed straight through to cleaker(me, { live }) -- see
   * BindKernelOptions.live's own doc comment (modules/cleaker's binder.ts)
   * for what it actually does. When true and `createRuntime` was NOT also
   * given, the default createMeRuntime(me) this session builds is wired
   * to re-render on cleaker's own 'value:changed' event, so declarative
   * reads (useMeValue) stay current without GUI ever opening a socket
   * itself.
   */
  live?: boolean;
  /**
   * Overrides what the kernel's identity root (`#seed`) is derived from.
   * Default (omitted): `#seed` is deriveCompoundSeed(username, password) —
   * the identity IS the password, with no independent backup.
   *
   * Pass a hex root (e.g. from recoveryPhrase.ts's
   * deriveIdentityRootHexFromPhrase, itself reconstructible from either a
   * 12-word phrase or a password-unwrapped local vault) to make the signed
   * proof (identityHash/publicKey — see prove()) derive from this root
   * instead of the password.
   *
   * This is also the whole recovery mechanism now, with no separate wire
   * concept needed: re-deriving the same root from the phrase later
   * reproduces the exact same signing key prove() used originally, so
   * recovery is just calling the ALREADY-EXISTING claim/signIn endpoints
   * with a proof signed by the recovered key — not a new server capability,
   * and not a value ever sent over the wire on its own. The password itself
   * never factors into anything sent to the server on this path at all; it
   * only ever unlocks the local vault. (Previously this also swapped what
   * a separate "wire secret" derived from, back when open() sent one —
   * that mechanism is gone; see this file's own header comment for why.)
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
function toMonadOpenResult(result: { namespace: string; identityHash: string; openedAt: number }): MonadOpenResult {
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
    // all), so prove() below needs it set explicitly via the '@' identity
    // call (Axiom A1) before anything else touches the kernel. me.ts's
    // persistSeed() never fires for an explicit seed either way (see
    // this.me's own seed-persistence fix) — this root only ever gets
    // stored where THIS session explicitly puts it (see
    // localIdentityVault.ts), never as a plaintext side effect here.
    //
    // Namespace binding can't go through the (who, secret, {namespace})
    // constructor shape below -- this is the 1-arg raw-seed constructor,
    // which has no "who" until '@' runs one line down, and ME's own
    // namespace-binding requires an active expression already set. Written
    // directly instead, via the exact same profile.rootNamespace/
    // profile.namespace paths that constructor shape writes internally --
    // `me` here is already the path-DSL proxy ME's constructor returns, so
    // this needs no special method, just the same generic writes any other
    // stored value would use.
    me = new (ME as any)(explicitIdentityRootHex);
    me['@'](username);
    me.profile.rootNamespace(rootNamespace);
    me.profile.namespace(`${username}.${rootNamespace}`);
  } else {
    // Default: the 2-arg constructor both derives the compound seed AND
    // sets #activeExpression in one step — required for prove() to work at
    // all (confirmed live: the 1-arg seed-string form createSeedSession.ts
    // uses never sets it, and prove() throws ACTIVE_EXPRESSION_REQUIRED
    // without it). Passing `namespace` in the options bag here binds it in
    // the SAME constructor call, using #activeExpression the moment it's
    // set — see MEOptions.namespace's own doc comment.
    me = new (ME as any)(username, password, { namespace: rootNamespace });
  }

  // See writeKernelWindowLocation's own doc comment (createSeedSession.ts)
  // for the full reasoning -- this backend always freshly constructs `me`
  // above, so unlike that file's own call site, no options.me guard needed.
  writeKernelWindowLocation(me);

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
  // Note: `me` here always has a resolvable active expression (2-arg
  // constructor, or the explicit `me['@'](username)` call above) --
  // bindKernel's "Triad auto-open" (binder.ts) fires a background signIn()
  // whenever that's true, regardless of anything passed here, so it fires
  // for real. That races the claim()/open() calls below (confirmed live:
  // two concurrent claim attempts for the same brand-new namespace, one
  // racing to NAMESPACE_TAKEN and cascading through every origin fallback
  // down to a real CORS-blocked cleaker.me request) -- unrelated to
  // anything this session passes as options, so there is no option here to
  // avoid it with; it's inherent to constructing `me` with an active
  // expression at all.
  const node: CleakerNode = cleaker(me as unknown as MeKernel, {
    bootstrap: [transportOrigin],
    fetcher: options.fetchImpl,
    // See CleakerSessionOptions.live's own doc comment -- this is what
    // makes cleaker itself (not a second, parallel GUI-side WebSocket
    // client) the one place that keeps a remote path current after the
    // first read.
    live: options.live,
  });

  // The runtime factory (createRuntime) stays for a caller that genuinely
  // needs full control -- but the ordinary way to get live updates is
  // `live: true` above, which needs nothing from the caller except this:
  // wrap the same createMeRuntime(me) every non-live session already gets,
  // and re-render whenever cleaker's own 'value:changed' fires (emitted
  // from binder.ts's live channel, AFTER the kernel's memory is already
  // updated -- see that event's own doc comment in types/kernel.ts).
  // GUI never talks to a WebSocket directly for this; it only listens to
  // an event cleaker already emits.
  const runtime = options.createRuntime
    ? options.createRuntime(me, {
        semanticNamespace: buildGuessedFullNamespace(username, rootNamespace),
        transportOrigin,
      })
    : (options.runtime || createMeRuntime(me));
  if (!options.runtime && !options.createRuntime && options.live && typeof node.on === 'function') {
    node.on('value:changed', () => runtime.notify?.());
  }

  let activeNamespace: string | null = null;
  let identityHash = '';

  const claim = async (namespace: string): Promise<MonadClaimResult> => {
    const semanticNamespace = normalizeMonadSemanticNamespace(String(namespace || '').trim());
    if (!semanticNamespace) {
      throw new SeedSessionError('NAMESPACE_REQUIRED', 'Namespace is required for claim.');
    }

    try {
      // node.claim() builds its own real proof internally (proveKernelNamespace,
      // cleaker's binder.ts) -- no secret to pass on this path at all anymore.
      const result = await node.claim({ namespace: semanticNamespace });
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
      // node.signIn() builds its own real proof internally too, with a
      // fresh per-open nonce as its challenge -- same as claim, no secret.
      const result = await node.signIn({ namespace: semanticNamespace });
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
    // The one signed-write entry point GUI code should call: "save this
    // value at this path", nothing more. Builds and signs the exact
    // canonical body the server verifies against (see monadClient.ts's
    // writeNamespace() — operation/expression/value/identityHash/namespace/
    // expectedHeadHash, no other fields — and modules/monad's replay.ts's
    // isNamespaceWriteAuthorized(), which checks the signature against
    // toStableJson() of precisely that object; normalizeProofMessage is
    // this.me's own copy of the same sorted-key canonical-JSON algorithm,
    // confirmed byte-for-byte equivalent by reading both). A caller never
    // assembles this payload itself — that was the exact mistake this
    // method replaces.
    //
    // namespace + expectedHeadHash are read fresh (fetchWriteHead) right
    // before signing, never cached across calls: a signature only proves
    // "the claim holder authorized exactly this body" -- without binding it
    // to which namespace and what state that namespace was in, the same
    // signed body could be replayed later (e.g. silently un-revoking a
    // delegate) or against a different namespace this same key also holds a
    // claim on. The server rejects a mismatch as STALE_HEAD, distinct from
    // NAMESPACE_WRITE_FORBIDDEN, precisely so a caller here knows to retry
    // with a fresh head rather than treat it as a permission failure. See
    // Surface-Identity-Claims.md §7.7 (cleaker repo typedocs) for the full
    // design.
    //
    // identityHash/activeNamespace are read fresh at call time (the same
    // closure variables `write` and `open`/`claim` already share), so this
    // can never sign or target a namespace other than the one THIS session
    // is actually bound to.
    async signAndWrite<TValue = unknown>(expression: string, value: TValue): Promise<MonadWriteResult> {
      if (!activeNamespace) {
        throw new SeedSessionError('NAMESPACE_REQUIRED', 'An active namespace is required for signAndWrite.');
      }
      const semanticNamespace = normalizeMonadSemanticNamespace(activeNamespace);
      const { expectedHeadHash } = await monad.fetchWriteHead({ semanticNamespace, transportOrigin });
      const signedFields = { operation: 'write', expression, value, identityHash, namespace: semanticNamespace, expectedHeadHash };
      const signedPayload = normalizeProofMessage(signedFields);
      const branchSeed = await deriveBranchProofSeed(kernelSeedHex, username);
      const { privateKey } = await importEd25519SigningKey(branchSeed);
      const signature = await signEd25519Proof(privateKey, signedPayload);
      const result = await this.write(expression, value, {
        signature,
        signedPayload,
        body: { namespace: semanticNamespace, expectedHeadHash },
      });
      // Mirror the now-CONFIRMED value into the local kernel so reactive
      // consumers (useMeValue, the Inspector's me.explain()) observe the
      // same destination this write just durably reached — this mirroring
      // only ever runs after a real write() has already succeeded; it is
      // never itself the persistence mechanism (that's the line above).
      try { writeMeValue(me, expression, value); } catch { /* local mirror is best-effort */ }
      return result;
    },
    // The read-side counterpart: a genuine GET against this session's own
    // monad/namespace (monadClient.ts's readNamespacePath, the real
    // disclosure-checked endpoint — never the local-only read() above,
    // which only ever answers from whatever this tab already has in
    // memory). Resolves the namespace the exact same way write()/
    // signAndWrite() do, from the SAME activeNamespace closure variable —
    // read and write can never silently target different namespaces.
    // A path that genuinely doesn't exist yet (NOT_FOUND/PATH_NOT_FOUND)
    // is a legitimate empty state, not an error worth throwing.
    async readConfirmed<TValue = unknown>(expression: string): Promise<TValue | undefined> {
      const semanticNamespace = normalizeMonadSemanticNamespace(String(activeNamespace || '').trim());
      if (!semanticNamespace) {
        throw new SeedSessionError('NAMESPACE_REQUIRED', 'An active namespace is required for readConfirmed.');
      }
      try {
        const result = await monad.readNamespacePath<TValue>({
          semanticNamespace,
          transportOrigin,
          path: expression,
        });
        try { writeMeValue(me, expression, result.value as any); } catch { /* local mirror is best-effort */ }
        return result.value;
      } catch (cause) {
        if (cause instanceof MonadClientError && (cause.code === 'NOT_FOUND' || cause.code === 'PATH_NOT_FOUND')) {
          return undefined;
        }
        throw cause;
      }
    },
    // Live remote read via cleaker's own <owner>.cleaker.<path> convention
    // (modules/cleaker's binder.ts) -- walks the node's own path-DSL proxy
    // programmatically since `owner`/`path` are dynamic here, then awaits
    // the (possibly "thenable" facade, possibly already-resolved) result.
    // First call for a given owner/path is a real network round-trip
    // (subscribing live too, if this session's `live` option was set);
    // later calls answer from cleaker's own remoteOverlay cache -- see
    // that module's getOrCreateRemoteSlot for exactly which.
    async readOwnerPath<TValue = unknown>(owner: string, path: string): Promise<TValue | undefined> {
      const segments = [owner, 'cleaker', ...String(path || '').split('.').filter(Boolean)];
      let facade: any = node;
      for (const segment of segments) facade = facade[segment];
      const raw = await facade;
      if (raw && typeof raw === 'object' && 'ok' in raw) {
        return raw.ok ? (raw.data?.value as TValue) : undefined;
      }
      return raw as TValue;
    },
    onOwnerPathChange(handler: (key: string, value: unknown) => void): () => void {
      return node.on('value:changed', (payload) => handler(payload.path, payload.value));
    },
    clear,
    logout() {
      clear();
    },
  };
}

export default createCleakerSession;
