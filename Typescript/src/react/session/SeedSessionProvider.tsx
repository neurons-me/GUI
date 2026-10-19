import ME from 'this.me';
import * as React from 'react';
import { Me } from '@/react/Me';
import type { RuntimeAdapter } from '@/runtime/adapter';
import type { MeLike } from '@/react/types';
import {
  createSeedSession,
  writeKernelWindowLocation,
  type SeedSession,
  type SeedSessionOptions,
  type SeedSessionWriteOptions,
  type CreateSessionRuntime,
  identityHashOfRoot,
} from '@/core/session/createSeedSession';
import { createCleakerSession } from '@/core/session/createCleakerSession';
import { readAddress as readAddressThrough, subscribeAddress as subscribeAddressThrough, type AddressRead, type AddressReadOptions, type AddressSubscription } from '@/core/session/addressRead';
import { useOptionalMe } from '@/react/useMe';
import { heldIdentitiesOf, rootOf, sessionHolding, watchHeldIdentities, type HeldIdentity } from '@/core/session/heldIdentities';
import {
  DEFAULT_MONAD_TRANSPORT_ORIGIN,
  normalizeMonadTransportOrigin,
  MonadClientError,
  type MonadClaimResult,
  type MonadClientOptions,
  type MonadOpenResult,
  type MonadWriteResult,
} from '@/core/session/monadClient';
import { getActiveNamespaceRoot, fetchGatewayHostname, splitTypedNamespace, foreignNamespaceMessage, buildGuessedFullNamespace } from '@/gui/All.This/Cleaker/signedRequest';
import { bytesToHex, deriveIdentityRootBytesFromPhrase, hexToBytes } from '@/core/identity/recoveryPhrase';
import { chooseIdentityMechanism, findLocalIdentityVault, hasIdentityVault, saveIdentityVault } from '@/core/identity/localIdentityVault';
import { checkWrittenDoor } from '@/react/link';
import { targetKey, type LinkTarget } from '@/react/link';

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
  /**
   * loginWithCredentials(), 'cleaker' backend: which stored vault to use when two spellings of the namespace hold
   * different identities (a `VAULT_CONFLICT` lists them; the person picks one and signs in again with its `key`).
   */
  vaultChoice?: string | null;
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
  /**
   * 'cleaker' backend only. The local context this link belongs to (the `.me` `<Me>` provides). Links that share a
   * context list the identities they hold there, so one of them can be asked, explicitly, to use an identity another
   * one holds (`linkExistingIdentity`). It is only the key of that list: nothing is read from or written to it, and each
   * link keeps its own kernel and its own credentials. Without it, `heldIdentities` is empty.
   */
  context?: object | null;
};

export type SeedSessionContextErrorCode =
  | 'SESSION_REQUIRED'
  | 'CREDENTIAL_LOGIN_UNAVAILABLE'
  | 'INVALID_CREDENTIAL_RESULT'
  | 'INVALID_CLAIM'
  | 'INVALID_RECOVERY_PHRASE'
  | 'IDENTITY_NOT_HELD'
  /** Two stored vaults of the same namespace hold DIFFERENT identities: the person chooses, nothing is picked silently. */
  | 'VAULT_CONFLICT'
  /** The port written in the address and the explicit port of the transport it goes through disagree: nothing is sent. */
  | 'TRANSPORT_PORT_CONFLICT';

export type SeedRecoveryInput = {
  username: string;
  /** Exactly 12 words, in order — see recoveryPhrase.ts's WORD_COUNT. */
  words: string[];
  namespace?: string | null;
  transportOrigin?: string | null;
};

export type LinkExistingIdentityInput = {
  /** Which held identity to use (`heldIdentities[i].identityHash`). Asked for by identity, never by position. */
  identityHash: string;
  /** The handle to claim in this namespace; it need not match the one the identity has elsewhere. */
  username: string;
  namespace?: string | null;
  transportOrigin?: string | null;
  /**
   * Optional. When given, the identity is sealed into this browser's local vault for this name under it, so the link can
   * be opened here later with this password. Without it the link exists only while it stays open.
   */
  password?: string;
};

export class SeedSessionContextError<
  Code extends SeedSessionContextErrorCode = SeedSessionContextErrorCode,
> extends Error {
  readonly code: Code;
  /** Structured data an error may carry for the interface (e.g. the identities of a VAULT_CONFLICT). */
  readonly details?: unknown;

  constructor(code: Code, message?: string, details?: unknown) {
    super(message || code);
    this.name = 'SeedSessionContextError';
    this.code = code;
    this.details = details;
  }
}

/** One identity found in a local vault when two or more disagree (what the person is asked to choose between). */
export type VaultConflictCandidate = {
  /** The vault key (the namespace spelling it was stored under). */
  key: string;
  /** The identity's public fingerprint. */
  identityHash: string;
};

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
  /**
   * The links this provider holds a session for, each with its own session. The fields above (`session`,
   * `authenticated`, `semanticNamespace`, ...) are those of the SELECTED link; the others stay open, and operations
   * run against the link they were started for (a reply that arrives after the selection moved lands on its own link).
   */
  readonly openLinks: readonly OpenLink[];
  /** The id (link.ts `targetKey`) of the link the fields above describe; null before any link has opened or been selected. */
  readonly selectedLinkId: string | null;
  /** The link the person chose on the card, or null while the view follows the page's own. */
  readonly selectedLink: LinkTarget | null;
  /**
   * Selects the link the session view follows: a namespace and, for a root served by another host, its transport
   * (omitted = this provider's own). It opens nothing, closes nothing and changes no session: a link with no session
   * is simply unauthenticated. Until one is selected, the view follows the link that most recently opened.
   */
  selectLink(target: { namespace: string; transport?: string }): void;
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
  /**
   * The identities held by the OPEN links under this link's context (including this one's own), by identity: each with
   * its fingerprint, the handles it is open under and its links. Sorted by fingerprint; nothing is "the latest".
   */
  readonly heldIdentities: readonly HeldIdentity[];
  /**
   * Explicit, and separate from registering: claims a name in THIS namespace with an identity another open link under
   * the same context already holds. It presents that identity's proof and asks for the claim; it generates no new
   * identity and no recovery phrase, and never changes what `registerWithCredentials` does. IDENTITY_NOT_HELD when no
   * open link holds that identity.
   */
  linkExistingIdentity(input: LinkExistingIdentityInput): Promise<SeedSession>;
  /**
   * Reads a value by its address (`me://ana.a-test.local:read/battery`) through an open link of this context that serves
   * that root: never "the last one opened", never another context's. The answer keeps public / sealed / closed / absent /
   * no_link / ambiguous / error apart (see `AddressRead`). Anonymous like any ledger read; nothing is copied to a kernel.
   */
  readAddress(expression: string, options?: AddressReadOptions): Promise<AddressRead>;
  /**
   * Calls back when the local fact an address names (`me://self:read/...`) may have changed, so it can be read again.
   * `live` says whether it ever will: an address in a ledger is not pushed here yet. See `subscribeAddress`.
   */
  subscribeAddress(expression: string, onChange: () => void): AddressSubscription;
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

/** A link that holds a session in this provider (link.ts: the target's id, and who is signed in through it). */
export type OpenLink = {
  readonly id: string;
  readonly semanticNamespace: string | null;
  readonly identityHash: string | null;
  readonly transportOrigin: string;
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
          "This browser has no saved key for that identity on this address (browser storage is separate for each address, such as cleaker.me and www.cleaker.me), so this sign-in tried the identity derived from your name and secret, and it is not the registered one. Sign in at the address where you created it, or use Recover Account here.",
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
  context = null,
}: SeedSessionProviderProps) {
  const defaultTransportOrigin = React.useMemo(
    () => normalizeMonadTransportOrigin(transportOrigin),
    [transportOrigin],
  );
  // One snapshot per LINK (link.ts targetKey: namespace + transport origin), not one for the provider: a session opened
  // through one link stays open while another is selected, and what a reply changes is the link it was asked for.
  const [snapshots, setSnapshots] = React.useState<Record<string, SessionSnapshot>>({});
  const [activity, setActivity] = React.useState<Record<string, { status: SeedSessionStatus; error: Error | null }>>({});
  // The link the person selected (the card's namespace), and the link that most recently opened. With nothing selected
  // the view follows the latter, which is what a provider with a single link always did.
  const [explicit, setExplicit] = React.useState<LinkTarget | null>(null);
  const [lastKey, setLastKey] = React.useState<string | null>(null);
  const explicitRef = React.useRef<LinkTarget | null>(explicit);
  explicitRef.current = explicit;

  const selectedKey = explicit ? targetKey(explicit) : lastKey ?? '';
  const selectedSnapshot = snapshots[selectedKey];
  const snapshot = React.useMemo<SessionSnapshot>(
    () => selectedSnapshot ?? createEmptySnapshot(explicit ? normalizeMonadTransportOrigin(explicit.transport) : defaultTransportOrigin),
    [selectedSnapshot, explicit, defaultTransportOrigin],
  );
  const status: SeedSessionStatus = activity[selectedKey]?.status ?? (snapshot.session ? 'ready' : 'idle');
  const error: Error | null = activity[selectedKey]?.error ?? null;

  /** The link an operation is about: the selected one when it is the same transport (and a name under its root), else its own. */
  const linkKeyFor = React.useCallback((namespace: string, transport: string): string => {
    const t = normalizeMonadTransportOrigin(transport || defaultTransportOrigin);
    const ns = String(namespace || '').trim();
    const chosen = explicitRef.current;
    if (chosen && targetKey({ namespace: '', transport: chosen.transport }) === targetKey({ namespace: '', transport: t })) {
      const root = chosen.namespace.trim().toLowerCase().replace(/\.$/, '');
      const name = ns.toLowerCase().replace(/\.$/, '');
      if (!name || name === root || name.endsWith(`.${root}`)) return targetKey(chosen);
    }
    return targetKey({ namespace: ns, transport: t });
  }, [defaultTransportOrigin]);

  const selectLink = React.useCallback((target: { namespace: string; transport?: string }) => {
    const next: LinkTarget = {
      namespace: String(target.namespace || '').trim(),
      transport: normalizeMonadTransportOrigin(target.transport || defaultTransportOrigin),
    };
    setExplicit((current) => (current && targetKey(current) === targetKey(next) ? current : next));
  }, [defaultTransportOrigin]);

  // What an operation reports, always for the link it was started for.
  const commitSnapshotFor = React.useCallback(
    (nextSession: SeedSession | null, key: string) => {
      React.startTransition(() => {
        setSnapshots((current) => {
          if (nextSession) return { ...current, [key]: snapshotSession(nextSession) };
          if (!(key in current)) return current;
          const { [key]: _closed, ...rest } = current;
          return rest;
        });
        if (nextSession) setLastKey(key);
        setActivity((current) => ({ ...current, [key]: { status: nextSession ? 'ready' : 'idle', error: null } }));
      });

      onSessionChange?.(nextSession);
      return nextSession;
    },
    [onSessionChange],
  );

  const beginFor = React.useCallback((key: string) => {
    React.startTransition(() => {
      setActivity((current) => ({ ...current, [key]: { status: 'pending', error: null } }));
    });
  }, []);

  const failFor = React.useCallback((cause: unknown, key: string) => {
    const normalized = toError(cause);
    React.startTransition(() => {
      setActivity((current) => ({ ...current, [key]: { status: 'error', error: normalized } }));
    });
    throw normalized;
  }, []);

  /** An operation scoped to one link. `key` may be refined once its target is known (before the first `begin`). */
  const scope = React.useCallback((key: string) => {
    const op = {
      key,
      begin: () => beginFor(op.key),
      commit: (nextSession: SeedSession | null) => commitSnapshotFor(nextSession, op.key),
      fail: (cause: unknown) => failFor(cause, op.key),
    };
    return op;
  }, [beginFor, commitSnapshotFor, failFor]);

  // Called from outside with a session of its own: it opens (or replaces) the link it belongs to.
  const activateSession = React.useCallback(
    (nextSession: SeedSession | null) => {
      if (nextSession) {
        const key = linkKeyFor(nextSession.semanticNamespace || '', nextSession.transportOrigin);
        return commitSnapshotFor(nextSession, key);
      }
      return commitSnapshotFor(null, selectedKey);
    },
    [commitSnapshotFor, linkKeyFor, selectedKey],
  );

  // Compatibility for the operations below that act on the selected link (their `fail` has no link of its own to name).
  const fail = React.useCallback((cause: unknown) => failFor(cause, selectedKey), [failFor, selectedKey]);

  const requireSession = React.useCallback(() => {
    if (snapshot.session) return snapshot.session;
    throw new SeedSessionContextError(
      'SESSION_REQUIRED',
      'A seed session is required for this operation.',
    );
  }, [snapshot.session]);

  const loginWithSeed = React.useCallback(
    async (input: SeedSessionLoginInput) => {
      const op = scope(selectedKey);
      const options = buildSeedSessionOptions(input, {
        transportOrigin: defaultTransportOrigin,
        fetchImpl,
        headers,
      });
      op.key = linkKeyFor(options.semanticNamespace || '', options.transportOrigin || defaultTransportOrigin);
      op.begin();
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
        op.commit(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for failed logins.
        }
        op.commit(null);
        return op.fail(cause);
      }
    },
    [createRuntime, defaultTransportOrigin, fetchImpl, headers, linkKeyFor, scope, selectedKey],
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
      const op = scope(selectedKey);
      const username = String(input.username || input.email || '').trim();
      const password = String(input.password || '');

      if (!username) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
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
          return op.fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      // A name under another namespace is refused up front, never read as a handle of this one.
      if (splitTypedNamespace(username, rootNamespace).kind === 'foreign') {
        return op.fail(new SeedSessionContextError('INVALID_CLAIM', foreignNamespaceMessage(username, rootNamespace)));
      }

      // The root is never added twice: a complete name stays as typed (see splitTypedNamespace).
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
      // The vault is found by the NAMESPACE (a port written in the root is not part of it), under any spelling it was
      // stored with. Two spellings that unlock to different identities are a conflict the person resolves: nothing is
      // picked, overwritten or merged here.
      let identityRootHex: string | undefined;
      let vaultFound = false;
      let vaultFailure: SeedSessionContextError | null = null;
      try {
        const found = await findLocalIdentityVault(fullNamespace, password);
        const mechanism = chooseIdentityMechanism(found, input.vaultChoice, bytesToHex);
        if (mechanism.kind === 'vault') {
          identityRootHex = mechanism.rootHex;
          vaultFound = true;
        } else if (mechanism.kind === 'conflict' || mechanism.kind === 'conflict-unresolved-choice') {
          // Fingerprints are computed locally: nothing is signed in, bound or sent for identities not yet chosen.
          const candidates: VaultConflictCandidate[] = mechanism.candidates.map((c) => {
            let identityHash = '';
            try { identityHash = identityHashOfRoot(bytesToHex(c.root)); } catch { identityHash = ''; }
            return { key: c.key, identityHash };
          });
          vaultFailure = new SeedSessionContextError(
            'VAULT_CONFLICT',
            'This browser holds more than one saved identity for this name. Choose which one to use; nothing was changed.',
            candidates,
          );
        }
        // kind === 'password': no vault in this browser under any spelling -> the identity derived from the name and the
        // secret is what this form attempts, as an open only (see chooseIdentityMechanism).
      } catch (cause) {
        // "Incorrect secret," not "password" -- this app's own vocabulary everywhere else (the field label,
        // RegisterMe/RecoverAccount) never uses "password," and a lone message that did read as an inconsistency, flagged live.
        vaultFailure = new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Incorrect secret.');
      }
      // Reported outside the try above: op.fail throws, and that must not be read as a wrong secret.
      if (vaultFailure) return op.fail(vaultFailure);

      const cleakerTransportOrigin = normalizeMonadTransportOrigin(
        input.transportOrigin || defaultTransportOrigin,
      );
      op.key = linkKeyFor(rootNamespace, cleakerTransportOrigin);
      // A port written in the root against the explicit port of the transport this sign-in goes through: both are
      // statements about the door, and they disagree. Reported; neither is dropped.
      {
        const writtenPort = Number(String(rootNamespace).match(/:(\d{1,5})$/)?.[1] || 0) || null;
        const door = checkWrittenDoor({ namespace: rootNamespace.replace(/:\d{1,5}$/, ''), transport: cleakerTransportOrigin }, writtenPort);
        if (door.state === 'conflict') {
          return op.fail(new SeedSessionContextError(
            'TRANSPORT_PORT_CONFLICT',
            `The address names port ${door.written}, but this sign-in goes through port ${door.link}. Nothing was sent; choose one door.`,
            door,
          ));
        }
      }
      op.begin();
      // Creating the session can be refused; that is a result like any other, not an exception that leaves the form
      // pending.
      let nextSession: SeedSession;
      try {
        nextSession = createCleakerSession({
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
          context,
        });
      } catch (cause) {
        return op.fail(cause);
      }
      const shouldAutoOpen = input.autoOpen !== false;

      try {
        if (shouldAutoOpen) {
          await openExistingNamespace(nextSession, fullNamespace, { hasLocalVault: vaultFound || hasIdentityVault(fullNamespace) });
        }
        op.commit(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for failed logins.
        }
        op.commit(null);
        return op.fail(cause);
      }
    },
    [context, createRuntime, defaultTransportOrigin, fetchImpl, headers, live, linkKeyFor, scope, selectedKey],
  );

  const registerWithCredentials = React.useCallback(
    async (input: SeedCredentialsLoginInput) => {
      const op = scope(selectedKey);
      const username = String(input.username || input.email || '').trim();
      const password = String(input.password || '');

      if (!username) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
      }

      let rootNamespace = String(input.namespace || '').trim() || getActiveNamespaceRoot() || '';
      if (!rootNamespace) {
        try {
          rootNamespace = await fetchGatewayHostname();
        } catch (cause) {
          return op.fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      // A name under another namespace is refused up front, never read as a handle of this one.
      if (splitTypedNamespace(username, rootNamespace).kind === 'foreign') {
        return op.fail(new SeedSessionContextError('INVALID_CLAIM', foreignNamespaceMessage(username, rootNamespace)));
      }

      const cleakerTransportOrigin = normalizeMonadTransportOrigin(
        input.transportOrigin || defaultTransportOrigin,
      );
      op.key = linkKeyFor(rootNamespace, cleakerTransportOrigin);
      op.begin();
      // Creating the session can be refused; that is a result like any other, not an exception that leaves the form
      // pending.
      let nextSession: SeedSession;
      try {
        nextSession = createCleakerSession({
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
          context,
        });
      } catch (cause) {
        return op.fail(cause);
      }
      // The root is never added twice: a complete name stays as typed (see splitTypedNamespace).
      const { fullNamespace } = splitTypedNamespace(username, rootNamespace);

      try {
        // Deliberate register action — always claims, never tries open()
        // first. The explicit counterpart to loginWithCredentials' refusal
        // to auto-create an identity on CLAIM_NOT_FOUND: this is the one
        // path allowed to, because the caller (a real "Register User"
        // form/button) has already said so on purpose.
        await nextSession.claimAndOpen(fullNamespace);
        op.commit(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for failed registration.
        }
        op.commit(null);
        return op.fail(cause);
      }
    },
    [context, createRuntime, defaultTransportOrigin, fetchImpl, headers, live, linkKeyFor, scope, selectedKey],
  );

  // The identities held under this link's context. The registry is module-level and keyed by the context object; this
  // only mirrors it into React state so the list re-renders when a link opens or closes anywhere under the context.
  const [heldIdentities, setHeldIdentities] = React.useState<readonly HeldIdentity[]>(() => heldIdentitiesOf(context));
  React.useEffect(() => {
    setHeldIdentities(heldIdentitiesOf(context));
    if (!context) return undefined;
    return watchHeldIdentities(context, () => setHeldIdentities(heldIdentitiesOf(context)));
  }, [context]);

  const readAddress = React.useCallback(
    (expression: string, readOptions?: AddressReadOptions) => readAddressThrough(context, expression, readOptions),
    [context],
  );

  // The runtime of the `.me` this link was given, found ABOVE this provider (inside it, the nearest runtime is the
  // link's own). It is the local runtime only when it is the runtime of that very `.me`.
  const above = useOptionalMe();
  const localRuntime = context && above && (above.me as unknown) === context ? above.runtime : null;
  const subscribeAddress = React.useCallback(
    (expression: string, onChange: () => void) => subscribeAddressThrough(localRuntime, expression, onChange),
    [localRuntime],
  );

  // The explicit counterpart to registerWithCredentials for an identity that already exists in this context: same claim,
  // same signed proof, but the root is the one an open link already holds. Nothing is generated and no phrase is shown.
  const linkExistingIdentity = React.useCallback(
    async (input: LinkExistingIdentityInput) => {
      const op = scope(selectedKey);
      const username = String(input.username || '').trim();
      const password = String(input.password || '');

      if (!username) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
      }

      const source = sessionHolding(context, String(input.identityHash || ''));
      if (!source) {
        return op.fail(new SeedSessionContextError(
          'IDENTITY_NOT_HELD',
          'That identity is not open in any link here: open it first, or create a new identity.',
        ));
      }

      let rootNamespace = String(input.namespace || '').trim() || getActiveNamespaceRoot() || '';
      if (!rootNamespace) {
        try {
          rootNamespace = await fetchGatewayHostname();
        } catch (cause) {
          return op.fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      if (splitTypedNamespace(username, rootNamespace).kind === 'foreign') {
        return op.fail(new SeedSessionContextError('INVALID_CLAIM', foreignNamespaceMessage(username, rootNamespace)));
      }

      const linkTransportOrigin = normalizeMonadTransportOrigin(input.transportOrigin || defaultTransportOrigin);
      op.key = linkKeyFor(rootNamespace, linkTransportOrigin);
      op.begin();
      let nextSession: SeedSession;
      try {
        nextSession = createCleakerSession({
          username: splitTypedNamespace(username, rootNamespace).handle,
          namespace: rootNamespace,
          transportOrigin: linkTransportOrigin,
          fetchImpl,
          headers,
          createRuntime,
          live,
          context,
          identityFrom: source,
        });
      } catch (cause) {
        return op.fail(cause);
      }
      const { fullNamespace } = splitTypedNamespace(username, rootNamespace);

      try {
        await nextSession.claimAndOpen(fullNamespace);
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for a refused claim.
        }
        op.commit(null);
        return op.fail(cause);
      }
      op.commit(nextSession);

      // Sealing is a separate, optional step after the claim is accepted: a failure here is reported, and the link that
      // was accepted stays open (it was claimed; only the way back in by password is missing).
      if (password) {
        try {
          const rootHex = rootOf(context, nextSession);
          if (!rootHex) throw new Error('The identity is no longer held by this link.');
          await saveIdentityVault(buildGuessedFullNamespace(username, rootNamespace), hexToBytes(rootHex), password);
        } catch (cause) {
          return op.fail(cause);
        }
      }
      return nextSession;
    },
    [context, createRuntime, defaultTransportOrigin, fetchImpl, headers, live, linkKeyFor, scope, selectedKey],
  );

  const recoverWithPhrase = React.useCallback(
    async (input: SeedRecoveryInput) => {
      const op = scope(selectedKey);
      const username = String(input.username || '').trim();
      const words = Array.isArray(input.words) ? input.words : [];

      if (!username) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'Username is required.'));
      }

      let rootNamespace = String(input.namespace || '').trim() || getActiveNamespaceRoot() || '';
      if (!rootNamespace) {
        try {
          rootNamespace = await fetchGatewayHostname();
        } catch (cause) {
          return op.fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
      if (!rootNamespace) {
        return op.fail(new SeedSessionContextError('INVALID_CREDENTIAL_RESULT', 'A root namespace is required.'));
      }

      // A name under another namespace is refused up front, never read as a handle of this one.
      if (splitTypedNamespace(username, rootNamespace).kind === 'foreign') {
        return op.fail(new SeedSessionContextError('INVALID_CLAIM', foreignNamespaceMessage(username, rootNamespace)));
      }

      // Derived and validated BEFORE flipping to 'pending' — an invalid
      // phrase is a purely local, instant failure, same reasoning
      // RegisterMe.tsx's derivation-error guard uses.
      let identityRootHex: string;
      try {
        identityRootHex = bytesToHex(await deriveIdentityRootBytesFromPhrase(words));
      } catch (cause) {
        return op.fail(new SeedSessionContextError('INVALID_RECOVERY_PHRASE', 'That phrase is not a valid recovery phrase.'));
      }

      const cleakerTransportOrigin = normalizeMonadTransportOrigin(
        input.transportOrigin || defaultTransportOrigin,
      );
      op.key = linkKeyFor(rootNamespace, cleakerTransportOrigin);
      op.begin();
      // Creating the session can be refused; that is a result like any other, not an exception that leaves the form
      // pending.
      let nextSession: SeedSession;
      try {
        nextSession = createCleakerSession({
          // the handle, whether the person typed it short or as a complete namespace
          username: splitTypedNamespace(username, rootNamespace).handle,
          namespace: rootNamespace,
          transportOrigin: cleakerTransportOrigin,
          fetchImpl,
          headers,
          identityRootHex,
          createRuntime,
          live,
          context,
        });
      } catch (cause) {
        return op.fail(cause);
      }
      // The root is never added twice: a complete name stays as typed (see splitTypedNamespace).
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
        op.commit(nextSession);
        return nextSession;
      } catch (cause) {
        try {
          nextSession.logout();
        } catch {
          // Best-effort cleanup for a failed recovery attempt.
        }
        op.commit(null);
        return op.fail(cause);
      }
    },
    [context, createRuntime, defaultTransportOrigin, fetchImpl, headers, live, linkKeyFor, scope, selectedKey],
  );

  const loginWithCredentials = React.useCallback(
    async (input: SeedCredentialsLoginInput) => {
      const op = scope(selectedKey);
      if (sessionBackend === 'cleaker') {
        return loginWithCleaker(input);
      }

      if (typeof resolveSeedFromCredentials !== 'function') {
        return op.fail(new SeedSessionContextError(
          'CREDENTIAL_LOGIN_UNAVAILABLE',
          'No credential resolver was provided to SeedSessionProvider.',
        ));
      }

      op.key = linkKeyFor(String(input.namespace || ''), input.transportOrigin || '');
      op.begin();

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
        return op.fail(cause);
      }
    },
    [defaultTransportOrigin, loginWithCleaker, loginWithSeed, resolveSeedFromCredentials, sessionBackend, linkKeyFor, scope, selectedKey],
  );

  const claim = React.useCallback(async (namespace: string) => {
    const op = scope(selectedKey);
    const session = requireSession();
    op.begin();

    try {
      const result = await session.claim(namespace);
      op.commit(session);
      return result;
    } catch (cause) {
      return op.fail(cause);
    }
  }, [requireSession, scope, selectedKey]);

  const open = React.useCallback(async (namespace?: string | null) => {
    const op = scope(selectedKey);
    const session = requireSession();
    op.begin();

    try {
      const result = await session.open(namespace);
      op.commit(session);
      return result;
    } catch (cause) {
      return op.fail(cause);
    }
  }, [requireSession, scope, selectedKey]);

  const claimAndOpen = React.useCallback(async (namespace: string) => {
    const op = scope(selectedKey);
    const session = requireSession();
    op.begin();

    try {
      const result = await session.claimAndOpen(namespace);
      op.commit(session);
      return result;
    } catch (cause) {
      return op.fail(cause);
    }
  }, [requireSession, scope, selectedKey]);

  const sync = React.useCallback(async () => {
    const op = scope(selectedKey);
    const session = requireSession();
    op.begin();

    try {
      const result = await session.sync();
      op.commit(session);
      return result;
    } catch (cause) {
      return op.fail(cause);
    }
  }, [requireSession, scope, selectedKey]);

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
      const op = scope(selectedKey);
      const session = requireSession();
      op.begin();

      try {
        const result = await session.write(expression, value, options);
        op.commit(session);
        return result;
      } catch (cause) {
        return op.fail(cause);
      }
    },
    [requireSession, scope, selectedKey],
  );

  // Signs out of the SELECTED link only; the others keep their sessions.
  const logout = React.useCallback(() => {
    if (snapshot.session) {
      try {
        snapshot.session.logout();
      } catch {
        // Ignore logout cleanup failures and always clear local state.
      }
    }
    commitSnapshotFor(null, selectedKey);
  }, [commitSnapshotFor, selectedKey, snapshot.session]);

  const clearError = React.useCallback(() => {
    React.startTransition(() => {
      setActivity((current) => ({ ...current, [selectedKey]: { status: snapshot.session ? 'ready' : 'idle', error: null } }));
    });
  }, [selectedKey, snapshot.session]);

  const openLinks = React.useMemo<readonly OpenLink[]>(
    () => Object.entries(snapshots).map(([id, entry]) => ({
      id,
      semanticNamespace: entry.semanticNamespace,
      identityHash: entry.identityHash,
      transportOrigin: entry.transportOrigin,
    })),
    [snapshots],
  );

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
      openLinks,
      selectedLinkId: selectedKey || null,
      selectedLink: explicit,
      selectLink,
      activateSession,
      loginWithSeed,
      loginWithCredentials,
      registerWithCredentials,
      recoverWithPhrase,
      heldIdentities,
      linkExistingIdentity,
      readAddress,
      subscribeAddress,
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
      heldIdentities,
      linkExistingIdentity,
      readAddress,
      subscribeAddress,
      loginWithSeed,
      activateSession,
      open,
      read,
      snapshot,
      openLinks,
      selectedKey,
      explicit,
      selectLink,
      status,
      sync,
      write,
      logout,
    ],
  );

  // Always the same wrapper, whether or not a session exists yet — see
  // Me's own doc comment for why conditionally inserting it
  // only post-auth used to remount (and silently wipe the state of)
  // everything underneath it the instant a claim/login succeeded.
  const content = (
    <Me me={snapshot.me} runtime={snapshot.runtime}>
      {children}
    </Me>
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
