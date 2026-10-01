// Cleaker — the one public entry point for a complete, namespace-scoped
// identity surface:
//
//   <Cleaker me={me} />
//
// One prop. No `namespace` prop, no manually-assembled
// `<SeedSessionProvider>` above it, no second context. Internally this
// reuses what already works rather than reinventing any of it:
// `Namespace.tsx`'s own real rendering logic (the production identity-
// landing shell — QR/sign-in/register/recover/users/blockchain/url/
// keychain, already live), `SeedSessionProvider` (the real session/claim/
// open/logout machinery), `CleakerIdentityCard`/`Claim`/`RecoverAccount`
// (the real identity-flow UI `Namespace.tsx` already mounts as its Landing
// page). This file does none of that work itself — it is a thin
// destination-derivation + wiring layer, nothing more.
//
// HOW `me` IS ACTUALLY USED TODAY (2026-10-01, corrected 2026-10-02 after
// review found this section overstated what was actually built): `me` is
// read for CONFIGURATION ONLY — `profile.rootNamespace` (the bare root a
// `.me` kernel constructed with a namespace option writes at construction
// time — see `me/Typescript/src/me.ts`'s `rootProxy.profile.rootNamespace(...)`
// call, and `src/factory.ts`'s identical write) becomes `cleakerEndpoint`.
// That is the full extent of what `me` does here. It is NEVER "logged in",
// and nothing below this derivation (`SeedSessionProvider`, `Namespace`,
// `CleakerIdentityCard`) ever receives or operates on this `me` object —
// confirmed by grep: zero `useMe()`/`useMeValue`/`MeLike`-prop references
// anywhere in `Namespace.tsx`'s real code; every identity/session read in
// the tree this component renders goes exclusively through
// `useOptionalSeedSessionContext()`, which builds and owns its own,
// entirely separate kernel the moment a real claim/open succeeds.
//
// THIS IS NOT YET "ONE SHARED RUNTIME CONSUMING GUI" — that is still an
// OPEN, UNRESOLVED gap, not a closed decision. The earlier framing of this
// comment described the one-time-read design as the deliberate, sufficient
// answer to that goal; it is not. A caller who passes `me={me}` reasonably
// expects the GUI tree to actually operate against that connection —
// instead, `me` is read once for a string and then discarded, while
// `SeedSessionProvider` mints its own, independent kernel on real
// authentication. Closing this gap means changing `SeedSessionProvider`
// itself to accept and operate on a caller-supplied `me` (or an equivalent
// mechanism) — NOT adding a second context to carry `me` alongside the
// session the way the earlier, abandoned `CleakerBaseRuntimeContext`/
// `useCleakerBaseRuntime()` experiment tried to. That experiment was
// correctly abandoned because nothing consumed it live; the fix for THIS
// gap is to make something real consume `me` live, not to re-justify not
// doing so. See this consolidation's own handoff notes for the next step:
// mapping exactly which runtime each component in this tree operates on
// before attempting any change here.
//
// Finished, not in question: retiring the old `Cleaker.tsx`/
// `CleakerComposer.tsx` (below) and the single public `<Cleaker>` entry
// point's composition shape. Open, not finished: making `me` a real,
// shared runtime rather than a one-time config read.
//
// THIS REPLACES THE OLDER `Cleaker.tsx`/`CleakerComposer.tsx` THAT USED TO
// LIVE IN THIS DIRECTORY (2026-10-01 retirement — both already independently
// flagged legacy in this codebase's own history; see `CleakerIdentityCard
// .tsx`'s 2026-09-29 comment). Two real, distinct capabilities existed only
// in that old code and do NOT exist here. Both were investigated in full
// before this retirement (not assumed) and explicitly decided, not silently
// dropped:
//
// 1. MESH-PAIRING QR CLAIM FLOW (`GeneratePairingQR`/`useCleakerMeshPairing`/
//    `ClaimSurface`/`meshPairing.ts`) — ABANDONED, deleted outright, not
//    ported. Investigation found: zero network calls anywhere in it (grepped
//    for fetch/axios/WebSocket/literal URLs — nothing); "scanning" a QR was
//    never real — there was no camera path, only a `window` CustomEvent or a
//    URL query param standing in for a scan; the claim token was an unsigned,
//    client-generated hex string checked only against in-kernel bookkeeping,
//    never a server; it only ever worked when host and claiming surface
//    shared the same `.me` kernel/tab state. Zero consumers anywhere in the
//    monorepo besides old `Cleaker.tsx`/`CleakerCard.tsx` and one Storybook
//    story (also deleted). None of the deleted files were exported from this
//    package's published root (`index.ts`) or any other public entry point —
//    confirmed by grep before deleting — so this is NOT a breaking change to
//    the published `this.gui` package.
// 2. PIN-BASED ACCESS-GRANT (`Cleaker/access/`'s `<AccessRequestHandler/>`
//    mount point) — the MOUNT is abandoned (not rendered here); the session
//    handlers it sits alongside are kept, exported, and marked `@deprecated`
//    (see `access/index.ts` and its handler files), not deleted — different
//    bar because those ARE exported from the published root and "no internal
//    consumer" doesn't rule out an external one. Investigation found PIN
//    verification was already provably unreachable before this retirement:
//    `AccessRequestHandler.tsx` only ever registered the confirmation half of
//    `access/ui/bridge.ts`'s UI bridge, never `requestPinVerification` — so
//    any call to `requestAccess()` with `requirePin` (the default) already
//    failed closed with `PIN_REQUIRED` regardless of whether this mount
//    existed. `requestAccess()` itself has zero callers anywhere in the
//    monorepo today. Verified explicitly, by re-reading `requestAccess.ts`'s
//    own fail path, that removing this mount does not change that function's
//    behavior from "fails closed" to "silently grants access": both its
//    confirmation step and its PIN step call through `access/ui/bridge.ts`'s
//    own module-singleton directly (`requestAccessConfirmationFromUi`/
//    `requestPinVerificationFromUi`), independent of whether any particular
//    component is mounted — with no UI registered at all (the state after
//    this retirement), `requestAccess()` now fails even earlier, at the
//    confirmation step (`CONFIRMATION_REQUIRED`), before it would ever reach
//    the PIN check. Retiring an incomplete, already-unreachable interface
//    does not mean skipping verification; it was never reachable to skip.
//
// See this consolidation's own handoff reports for the full investigation
// trail (file-by-file consumer greps across the whole monorepo, not just
// this package) behind both decisions above.
import * as React from 'react';
import type { MeLike } from '@/react/types';
import { readMeValue } from '@/runtime/run-me';
import { SeedSessionProvider, type ResolveSeedFromCredentials } from '@/react/session/SeedSessionProvider';
import Namespace from '@/react/session/Namespace';
import type { GuiDocument } from '@/runtime/guiDocument';
import type { LeftBarElement } from '@/gui/Layout/Sidebars/LeftBar/LeftBar.types';
import {
  parseCleakerNamespaceExpression,
  DEFAULT_CLEAKER_NAMESPACE_EXPRESSION,
} from './namespaceExpression';

export type CleakerProps = {
  sx?: any;
  /**
   * The base runtime this Cleaker derives its destination from. Read ONCE,
   * synchronously, at render time, purely to compute `cleakerEndpoint` via
   * `profile.rootNamespace` — see this file's own header comment for the
   * full reasoning. Never propagated downstream, never read again after
   * this derivation, never "logged in". Omit to get the literal default
   * destination (`'cleaker.me'`).
   */
  me?: MeLike;
  /**
   * Transport origin `SeedSessionProvider`/`Namespace` actually send
   * requests to. Defaults to `${window.location.origin}/apps/netget` when
   * omitted — the exact fallback `Namespace.tsx`'s own (private)
   * `getNetgetMonadOrigin()` already uses, mirrored here by formula (that
   * function isn't exported, and this file deliberately doesn't touch
   * `Namespace.tsx` to change that) — NOT `SeedSessionProvider`'s own
   * internal default (`http://localhost:8161`), which is only ever correct
   * for a bare local dev kernel, never a real deployment.
   */
  transportOrigin?: string;
  /**
   * Explicit destination override — wins outright over whatever `me` would
   * otherwise derive, and means `me` need not be given at all. For a caller
   * that already resolves its own correct destination through its own
   * means (e.g. netget's App.jsx, which resolves `cleakerEndpoint` from the
   * page's own boot/mount context depending on which door it's serving —
   * see its own header comment — not from an identity kernel at all: there
   * is no live `.me` object to pass as `me` in that case). Most callers
   * should prefer `me` and leave this omitted.
   */
  cleakerEndpoint?: string;
  /**
   * `Namespace`'s own data-fetch origin (where the CONNECTED namespace's
   * own directory/blockchain data actually lives) — defaults to the same
   * resolved value as `transportOrigin` when omitted, which is correct for
   * the common case (this app's own session transport and the namespace it
   * serves live at the same origin). Pass this separately only when they
   * genuinely differ — e.g. netget's App.jsx uses its OWN transport for
   * `SeedSessionProvider` (its own login/credentials) while a `cleaker`-role
   * door's `Namespace` must read a DIFFERENT, foreign namespace's own monad
   * for its directory data.
   */
  netgetMonadOrigin?: string;
  /** Passed straight through to `SeedSessionProvider` — see its own doc comment. */
  resolveSeedFromCredentials?: ResolveSeedFromCredentials;
  /**
   * Passed straight through to `Namespace` — its own existing content-
   * extension contract (an app such as netget adding its own pages/left-bar
   * elements on top of the shared shell), unrelated to identity composition.
   */
  document?: GuiDocument;
  pages?: Record<string, React.ComponentType<any>>;
  footerExtras?: LeftBarElement[];
};

export default function Cleaker({
  sx,
  me,
  transportOrigin,
  cleakerEndpoint: explicitCleakerEndpoint,
  netgetMonadOrigin: explicitNetgetMonadOrigin,
  resolveSeedFromCredentials,
  document,
  pages,
  footerExtras,
}: CleakerProps) {
  // Config-only derivation (see `me`'s own doc comment above for what this
  // does NOT do). Memoized on `[me, explicitCleakerEndpoint]`, not a plain
  // per-render read and not a true one-time-ever read either — it
  // recomputes if the `me` reference or `cleakerEndpoint` prop actually
  // changes between renders, and is a no-op otherwise. (A prior version of
  // this comment claimed "one-time" while the code read on every render
  // regardless of memoization; this corrects that mismatch.) Skipped
  // entirely when the caller already supplies an explicit `cleakerEndpoint`
  // (no kernel read needed, and none is self-minted when `me` is also
  // omitted: an un-configured kernel has no `profile.rootNamespace` to read
  // back out anyway, so "no `me`" and "default to 'cleaker.me'" are the
  // same outcome without needing an object to exist for it).
  const rootNamespace = React.useMemo(
    () =>
      !explicitCleakerEndpoint && me
        ? String(readMeValue(me, 'profile.rootNamespace', { allowBarePath: true }) || '').trim()
        : '',
    [me, explicitCleakerEndpoint],
  );

  // No silent fallback: an EMPTY rootNamespace (omitted `me`, or a `me`
  // with no namespace configured) is the one case where substituting the
  // default is correct. A NON-EMPTY rootNamespace that fails to parse must
  // throw for real, not be swallowed into the default -- same principle
  // this package already enforces for an explicit, malformed `namespace`
  // prop elsewhere (a caller/kernel with a genuinely broken root deserves a
  // real error, not a silent redirect to 'cleaker.me' as if nothing were
  // wrong). A prior version of this code wrapped BOTH cases in the same
  // try/catch, which silently re-introduced exactly that bug for the `me`
  // path -- confirmed and fixed, not assumed fine.
  const namespaceConfig = React.useMemo(() => {
    if (!rootNamespace) {
      return parseCleakerNamespaceExpression(DEFAULT_CLEAKER_NAMESPACE_EXPRESSION);
    }
    return parseCleakerNamespaceExpression(rootNamespace);
  }, [rootNamespace]);
  const cleakerEndpoint = String(explicitCleakerEndpoint || namespaceConfig.transport.origin).trim();

  const resolvedTransportOrigin = String(
    transportOrigin ||
      (typeof window !== 'undefined' ? `${window.location.origin}/apps/netget` : ''),
  ).trim();
  const resolvedNetgetMonadOrigin = String(explicitNetgetMonadOrigin || resolvedTransportOrigin).trim();

  return (
    <SeedSessionProvider
      transportOrigin={resolvedTransportOrigin}
      resolveSeedFromCredentials={resolveSeedFromCredentials}
      sessionBackend="cleaker"
    >
      <Namespace
        sx={sx}
        cleakerEndpoint={cleakerEndpoint}
        netgetMonadOrigin={resolvedNetgetMonadOrigin}
        document={document}
        pages={pages}
        footerExtras={footerExtras}
      />
    </SeedSessionProvider>
  );
}
