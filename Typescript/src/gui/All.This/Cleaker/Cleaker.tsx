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
// HOW `me` IS ACTUALLY USED (2026-10-01 decision, verified against the real
// code before building this, not assumed): `me`'s entire job is a ONE-TIME,
// SYNCHRONOUS read at render time, purely to derive configuration — namely
// `profile.rootNamespace` (the bare root a `.me` kernel constructed with a
// namespace option writes at construction time — see `me/Typescript/src/
// me.ts`'s `rootProxy.profile.rootNamespace(...)` call, and `src/factory.ts`'s
// identical write), which becomes `cleakerEndpoint`. That is the full extent
// of what `me` does here. `me` is NEVER "logged in", never propagated
// downstream as a live/ongoing identity channel, and never read again after
// this one derivation — confirmed before writing this file that
// `Namespace.tsx` has ZERO `useMe()`/`useMeValue`/`MeLike`-prop references
// anywhere in its real code; every identity/session read inside it (and
// everything it renders, including `CleakerIdentityCard`) goes exclusively
// through `useOptionalSeedSessionContext()`. So there is no live consumer
// anywhere that needs `me` to keep governing anything past this one read —
// which is also exactly why an earlier pass's `CleakerBaseRuntimeContext`/
// `useCleakerBaseRuntime()` experiment (a context built specifically to keep
// a stable, ongoing reference to an injected `me` across login/logout) was
// abandoned: there was never a real consumer to justify carrying `me` live
// into the subtree at all, from either direction. Omitting `me` falls back
// to the literal default destination (`'cleaker.me'`) directly — no kernel
// gets self-minted just to read back its own (necessarily empty)
// `profile.rootNamespace`, since that would reach the exact same default
// through needless work.
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
  // One-time, synchronous derivation — see `me`'s own doc comment above.
  // Skipped entirely when the caller already supplies an explicit
  // `cleakerEndpoint` (no kernel read needed, and none is self-minted when
  // `me` is also omitted: an un-configured kernel has no
  // `profile.rootNamespace` to read back out anyway, so "no `me`" and
  // "default to 'cleaker.me'" are the same outcome without needing an
  // object to exist for it).
  const rootNamespace =
    !explicitCleakerEndpoint && me
      ? String(readMeValue(me, 'profile.rootNamespace', { allowBarePath: true }) || '').trim()
      : '';

  const namespaceConfig = React.useMemo(() => {
    try {
      return parseCleakerNamespaceExpression(rootNamespace || DEFAULT_CLEAKER_NAMESPACE_EXPRESSION);
    } catch {
      return parseCleakerNamespaceExpression(DEFAULT_CLEAKER_NAMESPACE_EXPRESSION);
    }
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
