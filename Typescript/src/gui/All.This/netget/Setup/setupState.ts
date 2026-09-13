// setupState.ts — the state contract for netget's setup flow, shared by
// every screen in GatewaySetup.tsx. This is deliberately the FIRST thing
// written, before any screen: the CLI (`netget init`/`netget claim`) and
// the browser are two interfaces onto the same one setup process (per the
// architecture decision this implements), so both need to agree on what
// state that process can be in before either one can drive it.
//
// This file only names the states and the data each one carries — it has
// no fetch/poll logic (that's GatewaySetup.tsx's job) and no opinion about
// how a CLI would render the same states differently. A phase here must
// mean the same thing regardless of which interface is looking at it.

/**
 * One property is not yet true here: `netget init` and this screen don't
 * actually share a running process today. This type is the CONTRACT that
 * makes that wiring possible later — seeing "dependencies-required" here
 * must mean the same real-world condition a future CLI-side check of the
 * same name would mean.
 */
export type SetupPhase =
  /** Nothing known yet — first render, before any check has resolved. */
  | 'checking'
  /** This gateway's own backend didn't answer at all. */
  | 'unreachable'
  /** Backend answered, but something it needs isn't ready yet (see
   *  DependencyStatus below) — claiming is blocked until this clears. */
  | 'dependencies-required'
  /** Everything required is ready; nobody owns this gateway yet. */
  | 'unclaimed'
  /** Setup code accepted, challenge issued — the browser is about to
   *  navigate away to the Cleaker origin that actually holds the
   *  claimant's keychain (signing can only happen there; see
   *  GatewaySetup.tsx's header comment on why this isn't an in-page
   *  identity form). Almost never visible — it's the instant before a
   *  full-page navigation — but real, and worth a distinct label rather
   *  than silently reusing 'unclaimed' underneath a redirect. */
  | 'redirecting-to-sign'
  /** Back from that redirect with a signed proof in the URL; submitting
   *  it to become the actual claim. */
  | 'finishing-claim'
  /** Owned. Setup's job is done — MainServerView.tsx is the ongoing
   *  dashboard this hands off to. */
  | 'claimed';

/**
 * A dependency is reported `unknown`, never guessed into `ready`, when
 * this backend has no live signal for it yet (see GatewaySetup.tsx's own
 * comment on why netget's own monad ledger is `unknown` today, not a
 * fabricated green check) — `unknown` must never block reaching
 * `unclaimed`/`claimed` the way a confirmed `not-ready` does, or this
 * screen would wedge on every install until that signal exists.
 */
export type DependencyState = 'ready' | 'not-ready' | 'unknown';

export interface DependencyStatus {
  /** Stable id, e.g. "monad", "openresty" — not shown, just a React key
   *  and a hook for a future CLI-side check to reference the same thing. */
  id: string;
  label: string;
  state: DependencyState;
  /** Required dependencies gate `unclaimed`/claiming when `not-ready`.
   *  A dependency that's merely nice-to-have would report `false` here
   *  (none do yet — both current entries are required). */
  required: boolean;
  detail?: string;
}

/** The signed proof returned from the Cleaker-origin claim view, carried
 *  back on netget's own URL — see CleakerNetgetClaimView (CleakerLanding.tsx)
 *  for where these fields are produced. Never includes the private key or
 *  any unlock passphrase, only the resulting signature. */
export interface ClaimReturnProof {
  namespace: string;
  identityHash: string;
  keyId: string;
  signature: string;
  timestamp: number;
  /** Anti mix-up token — see gatewaySetupSession.ts's SetupSessionRecord
   *  doc comment. Round-tripped separately from the signed fields above:
   *  it proves WHICH attempt this return belongs to, not WHAT is being
   *  claimed, so it was never part of what got signed. */
  state: string;
}

export function blockingDependency(dependencies: DependencyStatus[]): DependencyStatus | null {
  return dependencies.find((d) => d.required && d.state === 'not-ready') ?? null;
}
