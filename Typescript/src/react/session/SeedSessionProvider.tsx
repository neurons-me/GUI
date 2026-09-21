import ME from 'this.me';
import * as React from 'react';
import { MeRuntimeProvider } from '@/react/MeRuntimeProvider';
import type { RuntimeAdapter } from '@/runtime/adapter';
import type { MeLike } from '@/react/types';
import {
  createSeedSession,
  writeKernelWindowLocation,
  type SeedSession,
  type SeedSessionOptions,
  type SeedSessionWriteOptions,
  type CreateSessionRuntime,
} from '@/core/session/createSeedSession';
import { createCleakerSession } from '@/core/session/createCleakerSession';
import {
  DEFAULT_MONAD_TRANSPORT_ORIGIN,
  normalizeMonadTransportOrigin,
  MonadClientError,
  type MonadClaimResult,
  type MonadClientOptions,
  type MonadOpenResult,
  type MonadWriteResult,
} from '@/core/session/monadClient';
import { getActiveNamespaceRoot, fetchGatewayHostname, splitTypedNamespace } from '@/gui/All.This/Cleaker/signedRequest';
import { bytesToHex, deriveIdentityRootBytesFromPhrase } from '@/core/identity/recoveryPhrase';
import { hasLocalIdentityVault, loadLocalIdentityVault } from '@/core/identity/localIdentityVault';

export type SeedSessionStatus = 'idle' | 'pending' | 'ready' | 'error';

export type SeedSessionLoginInput = {
  seed: string;
  namespace?: string | null;
  transportOrigin?: string | null;
  autoOpen?: boolean;
};

export type SeedCredentialsLoginInput = {
  email?: string | null;
  username?: string | null;
  password: string;
  namespace?: string | null;
  transportOrigin?: string | null;
  autoOpen?: boolean;
  /**
   * registerWithCredentials() only: overrides the claimed identity's root
   * (see createCleakerSession's identityRootHex — same doc comment applies
   * here). Ignored by loginWithCredentials()/loginWithSeed().
   */
  identityRootHex?: string | null;
};

export type SeedCredentialResolution =
  | string
  | {
      seed: string;
      namespace?: string | null;
      semanticNamespace?: string | null;
      transportOrigin?: string | null;
    };

export type ResolveSeedFromCredentials = (
  input: SeedCredentialsLoginInput,
) => Promise<SeedCredentialResolution> | SeedCredentialResolution;

// The one definition lives in createSeedSession.ts (both this provider and
// createCleakerSession.ts need it, and that file is the lower-level module
// both already depend on) -- re-exported here under this file's original
// name so existing importers of CreateSeedSessionRuntime from THIS module
// keep working unchanged.
export type CreateSeedSessionRuntime = CreateSessionRuntime;

export type SeedSessionProviderProps = MonadClientOptions & {
  children: React.ReactNode;
  transportOrigin?: string;
  resolveSeedFromCredentials?: ResolveSeedFromCredentials;
  onSessionChange?: (session: SeedSession | null) => void;
  /**
   * Overrides the RuntimeAdapter createSeedSession() builds internally
   * (default: createMeRuntime(me), local-only, no network subscribe).
   * Pass e.g. `(me, ctx) => createWsMeRuntime(me, ctx)` for a session with
   * live WS subscriptions against a remote monad — createSeedSession()
   * itself has no network-adapter concept, only this provider constructs
   * `me` early enough to hand it to a runtime factory before login.
   */
  createRuntime?: CreateSeedSessionRuntime;
  /**
   * Which session implementation loginWithCredentials() builds on.
   * - 'monad' (default, unchanged): createSeedSession() — REST-only
   *   claimNamespace()/openNamespace() against monadClient.ts, sending only
   *   { secret, identityHash }. Matches every existing real caller's
   *   behavior today.
   * - 'cleaker': createCleakerSession() — mounts a real ME(username,
   *   password) kernel and claims/opens through cleaker's own
   *   bindKernel(), which sends a real signed Ed25519 proof
   *   (me['!'].prove()) alongside the secret. Closes a real gap the REST
   *   path has: monad's claimNamespace() accepts a self-asserted,
   *   unverified identityHash whenever no proof is present (confirmed live
   *   this session). Only affects loginWithCredentials() — this backend
   *   needs the raw username+password directly (it derives its own seed),
   *   not a pre-resolved seed, so resolveSeedFromCredentials is bypassed
   *   entirely when this is 'cleaker'. loginWithSeed() is unaffected either
   *   way (it always uses createSeedSession()) since it starts from an
   *   already-derived seed, which the cleaker path can't use (it needs
   *   #activeExpression set from the real username, which only the
   *   2-arg ME(who, secret) constructor does).
   */
  sessionBackend?: 'monad' | 'cleaker';
  /**
   * 'cleaker' backend only. Keeps every remote path this session's kernel
   * reads current over cleaker's own live channel (binder.ts's
   * ensureLiveChannel/RemoteSlot, the monad's /nrp WebSocket) instead of
   * the default fetch-once-and-cache. GUI never opens a WebSocket itself
   * for this — cleaker is the one live-transport mechanism (see
   * modules/cleaker's live/liveChannel.ts and CleakerEvents['value:changed']'s
   * own doc comments); this flag just asks createCleakerSession() to pass
   * `live: true` through to cleaker(me, ...) and wire its own
   * createMeRuntime(me) to re-render on cleaker's 'value:changed' event.
   * Ignored (has no effect) when `createRuntime` is also passed — that
   * caller owns the runtime entirely and is assumed to have its own answer
   * for staying live, or to not want one.
   */
  live?: boolean;
};

export type SeedSessionContextErrorCode =
  | 'SESSION_REQUIRED'
  | 'CREDENTIAL_LOGIN_UNAVAILABLE'
  | 'INVALID_CREDENTIAL_RESULT'
  | 'INVALID_CLAIM'
  | 'INVALID_RECOVERY_PHRASE';

export type SeedRecoveryInput = {
  username: string;
  /** Exactly 12 words, in order — see recoveryPhrase.ts's WORD_COUNT. */
  words: string[];
  namespace?: string | null;
  transportOrigin?: string | null;
};

export class SeedSessionContextError<
  Code extends SeedSessionContextErrorCode = SeedSessionContextErrorCode,
> extends Error {
  readonly code: Code;

  constructor(code: Code, message?: string) {
    super(message || code);
    this.name = 'SeedSessionContextError';
    this.code = code;
  }
}

export type SeedSessionContextValue = {
  readonly session: SeedSession | null;
  readonly me: MeLike | null;
  readonly runtime: RuntimeAdapter | null;
  readonly status: SeedSessionStatus;
  readonly pending: boolean;
  readonly authenticated: boolean;
  readonly error: Error | null;
  readonly transportOrigin: string;
  readonly semanticNamespace: string | null;
  readonly identityHash: string | null;
  readonly openedAt: number | null;
  activateSession(session: SeedSession | null): SeedSession | null;
  loginWithSeed(input: SeedSessionLoginInput): Promise<SeedSession>;
  loginWithCredentials(input: SeedCredentialsLoginInput): Promise<SeedSession>;
  /**
   * The explicit, deliberate counterpart to loginWithCredentials(): always
   * claims (via cleaker's real signed-proof path, same as
   * sessionBackend="cleaker"), never tries an open() first. Exists so a
   * real "Register User" form/action is the only thing that can create a
   * new namespace — loginWithCredentials() itself no longer falls through
   * to claimAndOpen() on CLAIM_NOT_FOUND (see openExistingNamespace's own
   * comment for why that auto-claim was removed).
   */
  registerWithCredentials(input: SeedCredentialsLoginInput): Promise<SeedSession>;
  /**
   * Recovers an ALREADY-claimed identity from its 12-word phrase alone —
   * no password. Re-derives the exact same root the original registration
   * used, which reproduces the exact same wire secret and therefore the
   * exact same `noise`-decryption key: this calls the ordinary open()
   * endpoint (no server-side recovery capability needed), and on success
   * recovers real data access, not just a fresh empty claim. Never sends
   * the phrase or the derived root anywhere — only what claim/signIn
   * always sent (the derived secret + signed proof). Does not itself
   * touch the local vault; callers that want day-to-day password sign-in
   * again afterward should derive the root a second time from the same
   * words and call saveLocalIdentityVault with a NEW password (see
   * RecoverAccount.tsx).
   */
  recoverWithPhrase(input: SeedRecoveryInput): Promise<SeedSession>;
  claim(namespace: string): Promise<MonadClaimResult>;
  open(namespace?: string | null): Promise<MonadOpenResult>;
  claimAndOpen(namespace: string): Promise<MonadOpenResult>;
  sync(): Promise<MonadOpenResult>;
  read<TValue = unknown>(path: string): TValue | undefined;
  write<TValue = unknown>(
    expression: string,
    value: TValue,
    options?: SeedSessionWriteOptions<TValue>,
  ): Promise<MonadWriteResult>;
  logout(): void;
  clearError(): void;
};

type SessionSnapshot = {
  session: SeedSession | null;
  me: MeLike | null;
  runtime: RuntimeAdapter | null;
  transportOrigin: string;
  semanticNamespace: string | null;
  identityHash: string | null;
  openedAt: number | null;
  authenticated: boolean;
};

// This module ends up bundled into multiple separate chunks — this.gui
// ships runtime/react/devtools/cleaker as SEPARATE entry points, and a
// consumer pulled from each one drags its own copy of this file along with
// it (Vite doesn't dedupe a shared internal module across entry-point
// boundaries by default). Each copy calling React.createContext() at
// module scope produces a DIFFERENT context object, so a <Provider> from
// one copy (e.g. netget's App.jsx importing SeedSessionProvider via
// `this.gui/react`) is invisible to useContext() reading a different
// bundled copy (e.g. one pulled in via `this.gui` or `this.gui/devtools`)
// — every consumer of the "wrong" copy sees `null`/defaults regardless of
// what the real Provider was given, which is exactly what produced "No
// credential resolver was provided to SeedSessionProvider" on a real
// submit even though App.jsx correctly passes resolveSeedFromCredentials.
// Same root cause, same fix already applied to runtime/launcherPopover.tsx
// this session: key the actual Context object off `globalThis`, so every
// bundled copy of this file resolves to the exact same object no matter
// how many chunks it got duplicated into.
const SEED_SESSION_CONTEXT_KEY = '__THIS_GUI_SEED_SESSION_CONTEXT__';

function getSeedSessionContext(): React.Context<SeedSessionContextValue | null> {
  const g = globalThis as unknown as Record<string, React.Context<SeedSessionContextValue | null>>;
  if (!g[SEED_SESSION_CONTEXT_KEY]) {
    g[SEED_SESSION_CONTEXT_KEY] = React.createContext<SeedSessionContextValue | null>(null);
  }
  return g[SEED_SESSION_CONTEXT_KEY];
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : 'Unknown session error.');
}

function createEmptySnapshot(transportOrigin: string): SessionSnapshot {
  return {
    session: null,
    me: null,
    runtime: null,
    transportOrigin,
    semanticNamespace: null,
    identityHash: null,
    openedAt: null,
    authenticated: false,
  };
}

function readSessionNumber(session: SeedSession, path: string): number | null {
  try {
    const value = Number(session.read(path));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function readSessionBoolean(session: SeedSession, path: string): boolean {
  try {
    return Boolean(session.read(path));
  } catch {
    return false;
  }
}

function snapshotSession(session: SeedSession): SessionSnapshot {
  return {
    session,
    me: session.me,
    runtime: session.runtime,
    transportOrigin: session.transportOrigin,
    semanticNamespace: session.semanticNamespace,
    identityHash: String(session.identityHash || '').trim() || null,
    openedAt: readSessionNumber(session, 'identity.session.openedAt'),
    authenticated: readSessionBoolean(session, 'identity.session.authenticated'),
  };
}

function normalizeCredentialResolution(
  input: SeedCredentialResolution,
  fallbackNamespace: string | null | undefined,
  fallbackTransportOrigin: string,
) {
  if (typeof input === 'string') {
    const seed = String(input || '').trim();
    if (!seed) {
      throw new SeedSessionContextError(
        'INVALID_CREDENTIAL_RESULT',
        'Credential resolution must return a seed.',
      );
    }

    return {
      seed,
      namespace: String(fallbackNamespace || '').trim() || null,
      transportOrigin: fallbackTransportOrigin,
    };
  }

  const seed = String(input?.seed || '').trim();
  if (!seed) {
    throw new SeedSessionContextError(
      'INVALID_CREDENTIAL_RESULT',
      'Credential resolution must return a seed.',
    );
  }

  const namespace =
    String(input?.semanticNamespace || input?.namespace || fallbackNamespace || '').trim() || null;

  return {
    seed,
    namespace,
    transportOrigin: normalizeMonadTransportOrigin(
      input?.transportOrigin || fallbackTransportOrigin,
    ),
  };
}

// Shared by both backends (loginWithSeed's createSeedSession path and
// loginWithCredentials' opt-in createCleakerSession path) so they produce
// identical behavior and error messages regardless of which one is active.
//
// Deliberately does NOT fall through to claimAndOpen() on CLAIM_NOT_FOUND
// anymore ("first claimer wins" — auto-registering a brand-new identity the
// instant an unrecognized username is submitted). Claiming a namespace must
// be an explicit, separate action (a real "Register User" form/flow), never
// a silent side effect of a mistyped or new username in the sign-in form —
// otherwise a typo in your own username silently creates a new empty
// identity instead of telling you it doesn't exist.
//
// CLAIM_NOT_FOUND, IDENTITY_MISMATCH, and CLAIM_VERIFICATION_FAILED all
// surface as the same generic message here — the sign-in form should not
// reveal whether a username doesn't exist or the secret was wrong (that
// distinction is exactly what username enumeration attacks look for), NOR
// assert a specific cause it doesn't actually know: a wrong password and a
// vault that lives on a different browser/device produce the exact same
// three codes from here, so the message names neither and instead points
// at the one thing that's always a safe, correct next step regardless of
// which of those it actually was. CLAIM_NOT_FOUND used to propagate as the
// raw MonadClientError instead, which meant the sign-in form displayed its
// unhumanized fallback message ("OPEN CLAIM_NOT_FOUND") verbatim. A real
// "Register" affordance stays a separate, explicit action — never inferred
// from this error.
async function openExistingNamespace(
  session: SeedSession,
  namespace: string,
  opts: { hasLocalVault?: boolean } = {},
): Promise<void> {
  try {
    await session.open(namespace);
  } catch (openError) {
    const code = openError instanceof MonadClientError ? openError.code : null;
    if (
      code === 'IDENTITY_MISMATCH' ||
      code === 'CLAIM_VERIFICATION_FAILED' ||
      code === 'CLAIM_NOT_FOUND'
    ) {
      // Nothing on THIS address holds the identity's key: browser storage is per address (cleaker.me and
      // www.cleaker.me do not share it, whatever namespace they both point at). That is a fact about this
      // browser, not about the server, so saying so reveals nothing about which usernames exist.
      if (opts.hasLocalVault === false) {
        throw new SeedSessionContextError(
          'INVALID_CLAIM',
          "This browser has no key for that identity on this address (browser storage is separate for each address, such as cleaker.me and www.cleaker.me). Sign in at the address where you created it, or use Recover Account here.",
        );
      }
      throw new SeedSessionContextError(
        'INVALID_CLAIM',
        "We couldn't open this identity. Check your credentials. If you created it in another browser or on another device, use Recover Account.",
      );
    }
    throw openError;
  }
}

function buildSeedSessionOptions(
  input: SeedSessionLoginInput,
  defaults: Pick<SeedSessionProviderProps, 'fetchImpl' | 'headers'> & {
    transportOrigin: string;
  },
): SeedSessionOptions {
  return {
    seed: String(input.seed || '').trim(),
    semanticNamespace: String(input.namespace || '').trim() || null,
    transportOrigin: normalizeMonadTransportOrigin(
      input.transportOrigin || defaults.transportOrigin,
    ),
    fetchImpl: defaults.fetchImpl,
    headers: defaults.headers,
  };
}

export function SeedSessionProvider({
  children,
  transportOrigin = DEFAULT_MONAD_TRANSPORT_ORIGIN,
  resolveSeedFromCredentials,
  onSessionChange,
  fetchImpl,
  headers,
  createRuntime,
  sessionBackend = 'monad',
  live,
}: SeedSessionProviderProps) {
  const defaultTransportOrigin = React.useMemo(
    () => normalizeMonadTransportOrigin(transportOrigin),
    [transportOrigin],
  );
  const [snapshot, setSnapshot] = React.useState<SessionSnapshot>(() =>
    createEmptySnapshot(defaultTransportOrigin),
  );
  const [status, setStatus] = React.useState<SeedSessionStatus>('idle');
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (snapshot.session) return;
    setSnapshot((current) => {
      if (current.session || current.transportOrigin === defaultTransportOrigin) {
        return current;
      }
      return createEmptySnapshot(defaultTransportOrigin);
    });
  }, [defaultTransportOrigin, snapshot.session]);

  const commitSnapshot = React.useCallback(
    (nextSession: SeedSession | null) => {
      const nextSnapshot = nextSession
        ? snapshotSession(nextSession)
        : createEmptySnapshot(defaultTransportOrigin);

      React.startTransition(() => {
        setSnapshot(nextSnapshot);
        setStatus(nextSession ? 'ready' : 'idle');
        setError(null);
      });

      onSessionChange?.(nextSession);
      return nextSession;
    },
    [defaultTransportOrigin, onSessionChange],
  );

  const activateSession = React.useCallback(
    (nextSession: SeedSession | null) => commitSnapshot(nextSession),
    [commitSnapshot],
  );

  const fail = React.useCallback((cause: unknown) => {
    const normalized = toError(cause);
    React.startTransition(() => {
      setStatus('error');
      setError(normalized);
    });
    throw normalized;
  }, []);

  const requireSession = React.useCallback(() => {
    if (snapshot.session) return snapshot.session;
    throw new SeedSessionContextError(
      'SESSION_REQUIRED',
      'A seed session is required for this operation.',
    );
  }, [snapshot.session]);

  const loginWithSeed = React.useCallback(
    async (input: SeedSessionLoginInput) => {
      React.startTransition(() => {
        setStatus('pending');
        setError(null);
      });

      const options = buildSeedSessionOptions(input, {
        transportOrigin: defaultTransportOrigin,
        fetchImpl,
        headers,
      });
      if (createRuntime) {
        const me = (new ME(options.seed) as unknown) as MeLike;
        // This branch constructs `me` itself, before createSeedSession()
        // ever sees it (options.me below is how that factory learns to
        // skip its own construction) -- so this IS the one place that
        // needs to write the same "this tab started here" instance fact.
        // See writeKernelWindowLocation's own doc comment.
        writeKernelWindowLocation(me);
        options.me = me;
        options.runtime = createRuntime(me, {
          semanticNamespace: options.semanticNamespace ?? null,
          transportOrigin: options.transportOrigin || defaultTransportOrigin,
        });
      }
      const nextSession = createSeedSession(options);
      const shouldAutoOpen = input.autoOpen !== false && Boolean(options.semanticNamespace);

      try {
        if (shouldAutoOpen && options.semanticNamespace) {
          await openExistingNamespace(nextSession, options.semanticNamespace);
        }
        commitSnapshot(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for failed logins.
        }
        commitSnapshot(null);
        return fail(cause);
      }
    },
    [commitSnapshot, createRuntime, defaultTransportOrigin, fail, fetchImpl, headers],
  );

  // sessionBackend: 'cleaker' path — bypasses resolveSeedFromCredentials
  // entirely (it needs the raw username+password to construct
  // ME(username, password) directly, not a pre-derived seed — see
  // SeedSessionProviderProps.sessionBackend's doc comment for why). input.
  // namespace is the ROOT here (e.g. "local.cleaker"), not the full
  // <handle>.<root> loginWithSeed expects — createCleakerSession composes
  // the full namespace itself via ME.bindNamespace().
  const loginWithCleaker = React.useCallback(
    async (input: SeedCredentialsLoginInput) => {
      const username = String(input.username || input.email || '').trim();
      const password = String(input.password || '');

      if (!username) {
        return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
      }

      // Mirrors resolveNetgetSeedFromCredentials' own fallback chain
      // (getActiveNamespaceRoot() || await fetchGatewayHostname()) so a
      // caller like MeLauncher's onEnter — which never passes `namespace`,
      // relying on the 'monad' backend's resolveSeedFromCredentials to fill
      // it in — gets the same root resolved for free under this backend
      // too, instead of needing backend-aware wiring at every call site.
      let rootNamespace = String(input.namespace || '').trim() || getActiveNamespaceRoot() || '';
      if (!rootNamespace) {
        try {
          rootNamespace = await fetchGatewayHostname();
        } catch (cause) {
          return fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      // The typed name is a handle or an already-complete namespace; the root is never added twice.
      const { fullNamespace } = splitTypedNamespace(username, rootNamespace);

      // Day-to-day sign-in for a phrase-registered identity: if this
      // browser holds a local vault for this exact namespace (written at
      // registration or by a prior recovery — see RegisterMe.tsx/
      // RecoverAccount.tsx), unlock it with the password TYPED HERE and
      // reconstruct the SAME root the registration/recovery flow used,
      // rather than deriving a completely different, unrelated identity
      // via deriveCompoundSeed(username, password) (createCleakerSession's
      // default path). A vault that exists but won't unlock with this
      // password is a definitive, specific failure — surfaced directly
      // instead of falling through to a compound-seed attempt that would
      // only ever produce a confusing generic "Invalid Claim" further down.
      let identityRootHex: string | undefined;
      if (hasLocalIdentityVault(fullNamespace)) {
        try {
          const rootBytes = await loadLocalIdentityVault(fullNamespace, password);
          identityRootHex = rootBytes ? bytesToHex(rootBytes) : undefined;
        } catch (cause) {
          // "Incorrect secret," not "password" -- this app's own vocabulary
          // everywhere else (the field label, RegisterMe/RecoverAccount)
          // never uses "password," and a lone message that did read as an
          // inconsistency, flagged live.
          return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Incorrect secret.'));
        }
      }

      React.startTransition(() => {
        setStatus('pending');
        setError(null);
      });

      const cleakerTransportOrigin = normalizeMonadTransportOrigin(
        input.transportOrigin || defaultTransportOrigin,
      );
      const nextSession = createCleakerSession({
        // the handle, whether the person typed it short or as a complete namespace
        username: splitTypedNamespace(username, rootNamespace).handle,
        password,
        namespace: rootNamespace,
        transportOrigin: cleakerTransportOrigin,
        fetchImpl,
        headers,
        identityRootHex,
        createRuntime,
        live,
      });
      const shouldAutoOpen = input.autoOpen !== false;

      try {
        if (shouldAutoOpen) {
          await openExistingNamespace(nextSession, fullNamespace, { hasLocalVault: hasLocalIdentityVault(fullNamespace) });
        }
        commitSnapshot(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for failed logins.
        }
        commitSnapshot(null);
        return fail(cause);
      }
    },
    [commitSnapshot, createRuntime, defaultTransportOrigin, fail, fetchImpl, headers, live],
  );

  const registerWithCredentials = React.useCallback(
    async (input: SeedCredentialsLoginInput) => {
      const username = String(input.username || input.email || '').trim();
      const password = String(input.password || '');

      if (!username) {
        return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
      }

      let rootNamespace = String(input.namespace || '').trim() || getActiveNamespaceRoot() || '';
      if (!rootNamespace) {
        try {
          rootNamespace = await fetchGatewayHostname();
        } catch (cause) {
          return fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      React.startTransition(() => {
        setStatus('pending');
        setError(null);
      });

      const cleakerTransportOrigin = normalizeMonadTransportOrigin(
        input.transportOrigin || defaultTransportOrigin,
      );
      const nextSession = createCleakerSession({
        // the handle, whether the person typed it short or as a complete namespace
        username: splitTypedNamespace(username, rootNamespace).handle,
        password,
        namespace: rootNamespace,
        transportOrigin: cleakerTransportOrigin,
        fetchImpl,
        headers,
        identityRootHex: String(input.identityRootHex || '').trim() || undefined,
        createRuntime,
        live,
      });
      // The typed name is a handle or an already-complete namespace; the root is never added twice.
      const { fullNamespace } = splitTypedNamespace(username, rootNamespace);

      try {
        // Deliberate register action — always claims, never tries open()
        // first. The explicit counterpart to loginWithCredentials' refusal
        // to auto-create an identity on CLAIM_NOT_FOUND: this is the one
        // path allowed to, because the caller (a real "Register User"
        // form/button) has already said so on purpose.
        await nextSession.claimAndOpen(fullNamespace);
        commitSnapshot(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for failed registration.
        }
        commitSnapshot(null);
        return fail(cause);
      }
    },
    [commitSnapshot, createRuntime, defaultTransportOrigin, fail, fetchImpl, headers, live],
  );

  const recoverWithPhrase = React.useCallback(
    async (input: SeedRecoveryInput) => {
      const username = String(input.username || '').trim();
      const words = Array.isArray(input.words) ? input.words : [];

      if (!username) {
        return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
      }

      let rootNamespace = String(input.namespace || '').trim() || getActiveNamespaceRoot() || '';
      if (!rootNamespace) {
        try {
          rootNamespace = await fetchGatewayHostname();
        } catch (cause) {
          return fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      // Derived and validated BEFORE flipping to 'pending' — an invalid
      // phrase is a purely local, instant failure, same reasoning
      // RegisterMe.tsx's derivation-error guard uses.
      let identityRootHex: string;
      try {
        identityRootHex = bytesToHex(await deriveIdentityRootBytesFromPhrase(words));
      } catch (cause) {
        return fail(new SeedSessionContextError('INVALID_RECOVERY_PHRASE', 'That phrase is not a valid recovery phrase.'));
      }

      React.startTransition(() => {
        setStatus('pending');
        setError(null);
      });

      const cleakerTransportOrigin = normalizeMonadTransportOrigin(
        input.transportOrigin || defaultTransportOrigin,
      );
      const nextSession = createCleakerSession({
        // the handle, whether the person typed it short or as a complete namespace
        username: splitTypedNamespace(username, rootNamespace).handle,
        namespace: rootNamespace,
        transportOrigin: cleakerTransportOrigin,
        fetchImpl,
        headers,
        identityRootHex,
        createRuntime,
        live,
      });
      // The typed name is a handle or an already-complete namespace; the root is never added twice.
      const { fullNamespace } = splitTypedNamespace(username, rootNamespace);

      try {
        // open(), deliberately never claim(): recovery reconnects to an
        // ALREADY-existing claim. The re-derived root/secret either match
        // what that claim was created with (real recovery, real data back)
        // or the server rejects them (CLAIM_NOT_FOUND / IDENTITY_MISMATCH
        // / a secretCommitment mismatch) — openExistingNamespace's mapping
        // already turns all of those into one generic INVALID_CLAIM here,
        // exactly like a normal sign-in's wrong-secret case, so this can't
        // be used to enumerate which usernames exist either.
        await openExistingNamespace(nextSession, fullNamespace);
        commitSnapshot(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for a failed recovery attempt.
        }
        commitSnapshot(null);
        return fail(cause);
      }
    },
    [commitSnapshot, createRuntime, defaultTransportOrigin, fail, fetchImpl, headers, live],
  );

  const loginWithCredentials = React.useCallback(
    async (input: SeedCredentialsLoginInput) => {
      if (sessionBackend === 'cleaker') {
        return loginWithCleaker(input);
      }

      if (typeof resolveSeedFromCredentials !== 'function') {
        return fail(new SeedSessionContextError(
          'CREDENTIAL_LOGIN_UNAVAILABLE',
          'No credential resolver was provided to SeedSessionProvider.',
        ));
      }

      React.startTransition(() => {
        setStatus('pending');
        setError(null);
      });

      try {
        const resolved = await resolveSeedFromCredentials(input);
        const normalized = normalizeCredentialResolution(
          resolved,
          input.namespace,
          normalizeMonadTransportOrigin(input.transportOrigin || defaultTransportOrigin),
        );

        return await loginWithSeed({
          seed: normalized.seed,
          namespace: normalized.namespace,
          transportOrigin: normalized.transportOrigin,
          autoOpen: input.autoOpen,
        });
      } catch (cause) {
        return fail(cause);
      }
    },
    [defaultTransportOrigin, fail, loginWithCleaker, loginWithSeed, resolveSeedFromCredentials, sessionBackend],
  );

  const claim = React.useCallback(async (namespace: string) => {
    const session = requireSession();
    React.startTransition(() => {
      setStatus('pending');
      setError(null);
    });

    try {
      const result = await session.claim(namespace);
      commitSnapshot(session);
      return result;
    } catch (cause) {
      return fail(cause);
    }
  }, [commitSnapshot, fail, requireSession]);

  const open = React.useCallback(async (namespace?: string | null) => {
    const session = requireSession();
    React.startTransition(() => {
      setStatus('pending');
      setError(null);
    });

    try {
      const result = await session.open(namespace);
      commitSnapshot(session);
      return result;
    } catch (cause) {
      return fail(cause);
    }
  }, [commitSnapshot, fail, requireSession]);

  const claimAndOpen = React.useCallback(async (namespace: string) => {
    const session = requireSession();
    React.startTransition(() => {
      setStatus('pending');
      setError(null);
    });

    try {
      const result = await session.claimAndOpen(namespace);
      commitSnapshot(session);
      return result;
    } catch (cause) {
      return fail(cause);
    }
  }, [commitSnapshot, fail, requireSession]);

  const sync = React.useCallback(async () => {
    const session = requireSession();
    React.startTransition(() => {
      setStatus('pending');
      setError(null);
    });

    try {
      const result = await session.sync();
      commitSnapshot(session);
      return result;
    } catch (cause) {
      return fail(cause);
    }
  }, [commitSnapshot, fail, requireSession]);

  const read = React.useCallback(<TValue,>(path: string): TValue | undefined => {
    if (!snapshot.session) return undefined;
    try {
      return snapshot.session.read<TValue>(path);
    } catch {
      return undefined;
    }
  }, [snapshot.session]);

  const write = React.useCallback(
    async <TValue,>(
      expression: string,
      value: TValue,
      options?: SeedSessionWriteOptions<TValue>,
    ) => {
      const session = requireSession();
      React.startTransition(() => {
        setStatus('pending');
        setError(null);
      });

      try {
        const result = await session.write(expression, value, options);
        commitSnapshot(session);
        return result;
      } catch (cause) {
        return fail(cause);
      }
    },
    [commitSnapshot, fail, requireSession],
  );

  const logout = React.useCallback(() => {
    if (snapshot.session) {
      try {
        snapshot.session.logout();
      } catch {
        // Ignore logout cleanup failures and always clear local state.
      }
    }
    commitSnapshot(null);
  }, [commitSnapshot, snapshot.session]);

  const clearError = React.useCallback(() => {
    React.startTransition(() => {
      setError(null);
      setStatus(snapshot.session ? 'ready' : 'idle');
    });
  }, [snapshot.session]);

  const contextValue = React.useMemo<SeedSessionContextValue>(
    () => ({
      session: snapshot.session,
      me: snapshot.me,
      runtime: snapshot.runtime,
      status,
      pending: status === 'pending',
      authenticated: snapshot.authenticated,
      error,
      transportOrigin: snapshot.transportOrigin,
      semanticNamespace: snapshot.semanticNamespace,
      identityHash: snapshot.identityHash,
      openedAt: snapshot.openedAt,
      activateSession,
      loginWithSeed,
      loginWithCredentials,
      registerWithCredentials,
      recoverWithPhrase,
      claim,
      open,
      claimAndOpen,
      sync,
      read,
      write,
      logout,
      clearError,
    }),
    [
      claim,
      claimAndOpen,
      clearError,
      error,
      loginWithCredentials,
      registerWithCredentials,
      recoverWithPhrase,
      loginWithSeed,
      activateSession,
      open,
      read,
      snapshot,
      status,
      sync,
      write,
      logout,
    ],
  );

  // Always the same wrapper, whether or not a session exists yet — see
  // MeRuntimeProvider's own doc comment for why conditionally inserting it
  // only post-auth used to remount (and silently wipe the state of)
  // everything underneath it the instant a claim/login succeeded.
  const content = (
    <MeRuntimeProvider me={snapshot.me} runtime={snapshot.runtime}>
      {children}
    </MeRuntimeProvider>
  );

  const SeedSessionContext = getSeedSessionContext();
  return (
    <SeedSessionContext.Provider value={contextValue}>
      {content}
    </SeedSessionContext.Provider>
  );
}

export function useOptionalSeedSessionContext(): SeedSessionContextValue | null {
  return React.useContext(getSeedSessionContext());
}
