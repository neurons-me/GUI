// CleakerIdentityCard — the real, production ".me" identity card: QR +
// namespace label + username/secret sign-in fields + a ".me"-style submit
// button, plus "New here? Register" / "Recover Account" links, and (once
// authenticated) the signed-in identity readout + Sign out.
//
// Extracted verbatim (2026-09-29) from `CleakerLandingHome`, the inline
// component that used to live inside `@/react/session/Namespace.tsx`
// (Namespace.tsx's own `GUI` shell still mounts this at the document's
// `GUI.content.landing` page — see `DOCUMENT_PAGES.Landing` there). No
// behavior changed by the move: same mode state machine, same
// registrationComplete/recoveryComplete guards, same provider/session
// wiring. See this file's own inline comments (carried over unchanged) for
// why each of those exists.
//
// NAMING NOTE (updated 2026-10-01): this file was originally named
// differently from `Cleaker` to avoid colliding with the OLDER, independent,
// NOT-equivalent `Cleaker.tsx` that used to live in this directory (its own
// register modal, its own `useCleakerMeshPairing`/8-hook stack). That old
// file (and `CleakerComposer.tsx`, its only remaining consumer) has since
// been retired — `Cleaker.tsx` now names a DIFFERENT, new public component
// (a thin `me` → destination → `SeedSessionProvider` → `Namespace` wrapper;
// see its own header comment) that composes THIS file as `Namespace.tsx`'s
// Landing page, same as before. This file stays named
// `CleakerIdentityCard` on purpose — it is not itself the public `Cleaker`
// entry point, it's the identity-flow UI `Cleaker` reaches via `Namespace`.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Button from '@/gui/Atoms/Button/Button';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import QRme from '@/gui/All.This/me/QR/QR.me';
import { buildCleakerNamespaceUrl } from '@/gui/All.This/Cleaker/namespaceExpression';
import { setActiveNamespaceRoot } from '@/gui/All.This/Cleaker/signedRequest';
import { useOptionalSeedSession } from '@/react/session/useSeedSession';
import type { SeedSession } from '@/core/session/createSeedSession';
import { useMeLauncherView } from '@/react/session/MeLauncher';
import Claim from '@/gui/All.This/Cleaker/Claim/Claim';
import RecoverAccount from '@/react/session/RecoverAccount';
import { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import { makeDefaultResolvers } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import type { NamespaceChannel, ResolutionState } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import type { CleakerRootStatus } from '@/react/session/verifiedCleakerRoot';
import {
  requireCleakerEndpoint,
  deriveNamespaceRootLabel,
  LANDING_ID,
  type DocumentPageProps,
} from '@/react/session/documentPages';

const LIVE_PROFILE_FIELDS = ['name', 'email', 'phone'] as const;
type LiveProfileField = (typeof LIVE_PROFILE_FIELDS)[number];

// The first real GUI consumer of cleaker's own live channel (this
// session's own work: modules/cleaker's binder.ts ensureLiveChannel/
// RemoteSlot, wired through session.readOwnerPath/onOwnerPathChange).
// Deliberately reads THIS identity's own profile through the SAME
// <owner>.cleaker.<path> convention meant for viewing someone ELSE's
// namespace, just pointed at your own username -- there is no separate
// "read my own stuff live" primitive, and building one wasn't the point
// of this first pass. Two tabs/devices signed into the SAME identity:
// change profile.name from one (a disposable-infra signed write, today --
// there is no edit UI yet, a deliberately separate piece of work), and
// this component updates on its own, no refresh, the moment
// 'value:changed' fires. Read-only, and silently renders nothing if the
// backend can't offer readOwnerPath (createSeedSession()'s plain 'monad'
// backend has no cleaker node to walk).
const LiveOwnProfile: React.FC<{ session: SeedSession; username: string }> = ({ session, username }) => {
  const [fields, setFields] = useState<Partial<Record<LiveProfileField, string>>>({});

  useEffect(() => {
    setFields({});
    if (!username || typeof session.readOwnerPath !== 'function') return undefined;
    let cancelled = false;

    LIVE_PROFILE_FIELDS.forEach((field) => {
      session.readOwnerPath!<string>(username, `profile.${field}`)
        .then((value) => {
          if (cancelled || value === undefined) return;
          const trimmed = String(value).trim();
          if (trimmed) setFields((prev) => ({ ...prev, [field]: trimmed }));
        })
        .catch(() => { /* Best-effort — this is a live convenience, not a required read. */ });
    });

    const keyPrefix = `${username}.cleaker.profile.`;
    const unsubscribe = session.onOwnerPathChange?.((key, value) => {
      if (!key.startsWith(keyPrefix)) return;
      const field = key.slice(keyPrefix.length) as LiveProfileField;
      if (!LIVE_PROFILE_FIELDS.includes(field)) return;
      setFields((prev) => ({ ...prev, [field]: String(value ?? '').trim() }));
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [session, username]);

  if (!fields.name && !fields.email && !fields.phone) return null;

  return (
    <Box
      data-gui-node-id={`${LANDING_ID}.profile`}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}
    >
      {fields.name && <Typography variant="body2" sx={{ fontWeight: 600 }}>{fields.name}</Typography>}
      {fields.email && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fields.email}</Typography>}
      {fields.phone && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fields.phone}</Typography>}
    </Box>
  );
};

// QRme itself now always draws a crisp, legible ".me" (PixelWordmark,
// rendered independent of QR module resolution — see QR.me.tsx / meMark.ts),
// so expanding on click is purely about physical scan size, not legibility.
// Small by default (a badge, not something meant to be scanned from across
// a room); click grows it to a size worth holding a camera up to — its own
// "view mode," the dominant thing on the page instead of one element among
// several. Kept modest rather than huge — a QR this clean scans fine well
// below full-viewport size.
const QR_DIAMETER_DEFAULT = 125;
const QR_DIAMETER_EXPANDED = 214;

// Spanish-language mirror of Beatle.tsx's own (English, internal) STATE_LABEL
// -- not exported from there, and this page's other status copy ("No se
// pudo conectar a…") is already Spanish, so this stays consistent with it
// rather than pulling in Beatle's English wording.
const BEATLE_STATE_LABEL: Record<ResolutionState, string> = {
  idle: '',
  parsing: 'Parsing…',
  connecting: 'Connecting…',
  resolving: 'Resolving…',
  connected: 'Connected',
  streaming: 'Streaming',
  error: 'Could not connect',
  invalid: 'Invalid domain',
  disconnected: '',
};

// Local extensions of NamespaceProps/DocumentPageProps (like the removed
// `destination` prop before them), not a change to those shared, exported
// types -- only the GUI shell (Namespace.tsx) supplies these, wiring
// Beatle's own resolution into the SAME shared context the sidebar and
// /netget read from, instead of independently-drifting "current root"
// facts. onBeatleNamespaceResolved: see handleBeatleConnect below and
// verifiedCleakerRoot.ts's `promote`. sharedRootStatus: the shared
// context's OWN in-flight/settled status, so the QR can wait for that
// re-verification instead of reporting success the instant Beatle's own
// (weaker) mesh resolution does.
export type CleakerIdentityCardProps = DocumentPageProps & {
  onBeatleNamespaceResolved?: (namespace: string) => void;
  sharedRootStatus?: CleakerRootStatus;
};

const CleakerIdentityCard: React.FC<CleakerIdentityCardProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin, onBeatleNamespaceResolved, sharedRootStatus = 'checking', 'data-gui-node-id': nodeId = LANDING_ID, 'data-gui-component': nodeComponent = 'Landing' }) => {
  // No useRegisterGuiNode here: the page is declared by the GUI document
  // (GUI.content.landing) -- declared is not the same as mounted.
  const view = useMeLauncherView();
  const username = view?.credentialsForm?.username.trim() || '';
  // Separate from `username` above (that one's the sign-in FORM's own
  // field, empty once authenticated) -- this identity's real username,
  // for LiveOwnProfile below. Derived from the session's own confirmed
  // semanticNamespace (e.g. "jabellae.local.cleaker") rather than trusting
  // anything client-guessed, same reasoning as buildGuessedFullNamespace's
  // own doc comment: the session's own answer is authoritative once it
  // exists, a guess never is.
  const seedSessionCtx = useOptionalSeedSession();
  const activeSession = seedSessionCtx?.session ?? null;
  const ownUsername = String(activeSession?.semanticNamespace || '').split('.')[0] || '';
  const [expanded, setExpanded] = useState(false);
  // Sign in / Register are two distinct, explicit forms now (see
  // SeedSessionProvider.tsx's openExistingNamespace — signing in no longer
  // silently claims an unrecognized username). This just toggles which one
  // renders; Claim itself calls the real registerWithCredentials().
  const [mode, setMode] = useState<'signin' | 'register' | 'recover'>('signin');
  // Claiming a namespace flips `authenticated` true the instant the claim
  // succeeds (SeedSessionProvider's registerWithCredentials commits the
  // session before Claim gets to run its own post-claim backup step)
  // — without this flag, the `authenticated` branch below would take over
  // immediately and unmount Claim mid-flow, skipping the recovery
  // phrase backup and its local encrypted vault write entirely. Reset
  // whenever register mode is (re-)entered, so a second registration later
  // in the same session isn't short-circuited by a stale true from the
  // first one.
  const [registrationComplete, setRegistrationComplete] = useState(false);
  // Same reasoning as registrationComplete above — recoverWithPhrase()
  // also flips `authenticated` true (a successful open()) before
  // RecoverAccount gets to run its own post-recovery "set a new local
  // password" step.
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const resolvedEndpoint = requireCleakerEndpoint(cleakerEndpoint);
  // A person's own explicit override, entered via the QR's edit affordance
  // below -- takes over from deriveNamespaceRootLabel(resolvedEndpoint)'s
  // window.location-guessed default the moment it's set. Exists because
  // that guess can genuinely diverge from what a server actually resolves
  // a given root string to (confirmed live: claiming under a guessed
  // "localhost" landed under a monad's real configured root instead, e.g.
  // "local.cleaker", and a later sign-in re-guessing "localhost" from the
  // URL bar had no way to know that and failed) -- stating the root
  // directly sidesteps that guess entirely, rather than trying to make the
  // guess itself smarter. Session-only (not persisted): a stale override
  // surviving a reload/different device would be its own, worse kind of
  // silent mismatch.
  const [namespaceOverride, setNamespaceOverride] = useState<string | null>(null);
  const namespaceRootLabel = useMemo(
    () => namespaceOverride || deriveNamespaceRootLabel(resolvedEndpoint),
    [namespaceOverride, resolvedEndpoint],
  );

  // Real crypto capability of the page THIS component is actually running
  // on right now — not a string check on "https" (that misses the
  // legitimate localhost/127.0.0.1 exception, and says nothing about
  // whether crypto.subtle itself actually exists). This is a property of
  // the physical page, independent of whichever root resolvedEndpoint
  // names — a namespace string being "cleaker.me" says nothing about
  // whether THIS page is physically loaded over https. The server-side
  // redirect (see setNginxConfigRoutes.ts) is the fix that stops this from
  // ever being false in practice; this is the client-side backstop for
  // whenever it still is — a stale bookmark, a proxy that stripped the
  // redirect, a different deployment that hasn't wired it up yet.
  const secureContextOk = typeof window !== 'undefined'
    && window.isSecureContext === true
    && typeof window.crypto?.subtle === 'object'
    && window.crypto.subtle !== null;

  // The connection this page is actually loaded over — scheme + host
  // (+ port, when non-default, via URL's own .host) — never folded into
  // namespaceRootLabel itself, which stays the bare semantic root
  // (".<root>" in a claimed identity) regardless of transport. Falls back
  // to the resolved endpoint's own scheme when off-window (SSR) or when
  // showing the OTHER root than the one physically loaded.
  const connectionLabel = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.hostname === namespaceRootLabel) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    try {
      const u = new URL(resolvedEndpoint);
      return `${u.protocol}//${u.host}`;
    } catch {
      return resolvedEndpoint;
    }
  }, [resolvedEndpoint, namespaceRootLabel]);

  // The switch isn't just cosmetic — whatever root the badge shows is the
  // root that actually gets claimed. resolveNetgetSeedFromCredentials
  // (netget's App.jsx) reads this at submit time via getActiveNamespaceRoot()
  // instead of always resolving the physical gateway hostname, so a person
  // who picks "cleaker.me" here claims <username>.cleaker.me, not
  // <username>.local.cleaker. Synced on every change (not just on click) so
  // the very first submit — before anyone has touched the badge — already
  // matches whatever's on screen.
  useEffect(() => {
    setActiveNamespaceRoot(namespaceRootLabel);
    return () => setActiveNamespaceRoot(null);
  }, [namespaceRootLabel]);

  // The bubble IS the QR (QRme — flips to an avatar on hover/click) rather
  // than a separate icon with a QR shown below it. Same address CleakerQR
  // would compute (buildCleakerNamespaceUrl is the shared utility both
  // wrap), just resolved directly here since QRme takes a raw value, not a
  // username+endpoint pair to derive one from itself.
  const defaultQrValue = useMemo(() => {
    try {
      return buildCleakerNamespaceUrl(resolvedEndpoint, username || undefined);
    } catch {
      return resolvedEndpoint;
    }
  }, [resolvedEndpoint, username]);

  // Beatle's own connection state (idle/parsing/connecting/resolving/
  // connected/streaming/error/invalid/disconnected) drives the QR's
  // status -- no second, independent check for the "is Beatle talking to
  // something" part. Beatle already shows this itself (its scarab dot +
  // state label, right above); this only means the QR recolors in sync
  // with it instead of staying visually disconnected from the one real
  // signal already on screen.
  //
  // BUT Beatle's own "connected" only means netget's mesh resolver found
  // something -- it does NOT mean the shared confirmed context (sidebar,
  // /netget) has actually moved there yet. A genuine connect triggers a
  // SEPARATE re-verification (see handleBeatleConnect below,
  // onBeatleNamespaceResolved, verifiedCleakerRoot.ts's promote()); while
  // that's still in flight, sharedRootStatus stays 'checking', and the QR
  // must keep showing "checking" too -- otherwise it would report success
  // a beat before the sidebar/netget context that's supposed to match it
  // actually does, exactly the drift this was corrected to close.
  const [beatleState, setBeatleState] = useState<ResolutionState>('idle');
  const qrStatus: 'idle' | 'checking' | 'confirmed' | 'error' =
    beatleState === 'error' || beatleState === 'invalid' ? 'error'
    : beatleState === 'parsing' || beatleState === 'connecting' || beatleState === 'resolving' ? 'checking'
    : beatleState === 'connected' || beatleState === 'streaming'
      ? (sharedRootStatus === 'error' ? 'error' : sharedRootStatus === 'checking' ? 'checking' : 'confirmed')
      : 'idle';
  // Built from qrStatus (the COMBINED value above), never from beatleState alone — that was the actual
  // bug (found live, 2026-09-22): after a real disconnect, sharedRootStatus flipped qrStatus (the ring) to
  // 'error', but this line kept reading beatleState directly, which Beatle's own WebSocket still called
  // 'connected' — ring and label describing the same widget differently. One effective state now drives
  // both; Beatle's own finer-grained labels (Parsing…/Connecting…/Resolving…) still show during the
  // 'checking' bucket, since qrStatus collapses several beatleStates into it.
  const qrStatusLabel = qrStatus === 'idle' ? ''
    : qrStatus === 'error' ? 'Could not connect'
    : qrStatus === 'confirmed' ? 'Connected'
    : (BEATLE_STATE_LABEL[beatleState] || 'Checking…');

  // USED TO also override the QR's own encoded value with whatever
  // Beatle resolved (a `beatleResolvedUrl` state, permanently replacing
  // defaultQrValue once set) -- that made sense back when Beatle was a
  // visible, manually-typed switcher: you'd type a genuinely different
  // destination and the QR would deliberately follow it there. Now that
  // Beatle is headless and auto-connects to `beatleExpression` on its
  // own (see that hook above), it resolves the bare ROOT, not whatever
  // username is currently being typed into the sign-in form -- so that
  // override was firing on every page load and permanently freezing the
  // QR at the root's address, silently killing the "QR previews the
  // username you're typing" behavior (flagged live: "el QR ya no cambia
  // según el username que pongas"). There's no longer a user action that
  // means "follow this other destination instead," so the QR now just
  // always reflects defaultQrValue, and handleBeatleConnect only handles
  // the shared-context promotion below.
  const handleBeatleConnect = useCallback((channel: NamespaceChannel) => {
    // Beatle resolving is NOT the same fact as the shared context moving --
    // that only happens if a fresh probeCleakerRoot independently confirms
    // whatever namespace Beatle just resolved (see onBeatleNamespaceResolved's
    // own doc comment below). Only handles the common case (a bare
    // namespace leaf, e.g. typing "cleaker.me") -- a union/overlay/path
    // expression isn't "which root," so it's left alone here.
    const ast = channel.expression?.ast;
    if (ast?.kind === 'namespace' && ast.value) {
      onBeatleNamespaceResolved?.(ast.value);
    }
  }, [onBeatleNamespaceResolved]);

  const qrValue = defaultQrValue;

  if (!view) return null;

  const { authenticated, label, pending, error, onEnter, onLogout, credentialsForm, semanticNamespace } = view;

  // MeRuntimeProvider no longer remounts this tree when a session
  // completes (see its own doc comment), so `mode`/`registrationComplete`
  // are no longer cleared "for free" by unmounting on logout — they have
  // to be reset explicitly, and only on the actual falling edge
  // (authenticated true -> false), never just "whenever unauthenticated":
  // that's also true for the entire pre-auth register/recover flow, and
  // resetting on every unauthenticated render would snap `mode` back to
  // 'signin' the instant either button was clicked.
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (wasAuthenticatedRef.current && !authenticated) {
      setMode('signin');
      setRegistrationComplete(false);
      setRecoveryComplete(false);
    }
    wasAuthenticatedRef.current = authenticated;
  }, [authenticated]);

  // The rising edge of the same transition, for the opposite reason:
  // whoever linked here (e.g. CleakerNetgetClaimView, when it finds no
  // live session) can attach `?next=<url>` so signing in bounces the
  // person back to what they actually came here to do, instead of
  // stranding them on this generic landing page. Navigated via the
  // router, not window.location -- SeedSessionProvider holds no
  // persisted session at all (deliberately: no stored token, the
  // identity IS the credential, re-derived from username+password each
  // time), so the freshly-established session lives only in THIS
  // mounted React tree's memory. A full-page navigation would remount
  // that tree from scratch and lose it again immediately -- landing
  // back on the exact same "sign in first" screen this was meant to
  // get past. Only ever a same-app continuation link someone else on
  // this origin constructed — never acted on if it's not a well-formed,
  // same-origin URL.
  const navigate = useNavigate();
  useEffect(() => {
    // Same gate the render logic below already uses to decide when the
    // authenticated view is safe to show instead of Claim/
    // RecoverAccount -- `authenticated` alone flips true the instant a
    // claim/recovery is ACCEPTED, well before Claim's own backup step
    // writes the local encrypted vault (registrationComplete, set via its
    // onRegistered prop). Navigating on `authenticated` alone would unmount
    // Claim mid-flow the same way the render logic already guards
    // against, silently skipping the vault write -- exactly the gap that
    // later makes Sign in fail for this identity (it has no vault to open).
    const registrationSettled = mode !== 'register' || registrationComplete;
    const recoverySettled = mode !== 'recover' || recoveryComplete;
    if (!authenticated || !registrationSettled || !recoverySettled) return;
    const next = new URLSearchParams(window.location.search).get('next');
    if (!next) return;
    try {
      const target = new URL(next, window.location.origin);
      if (target.origin !== window.location.origin) return;
      navigate(`${target.pathname}${target.search}${target.hash}`, { replace: true });
    } catch {
      // Malformed `next` -- stay put rather than navigating somewhere unintended.
    }
  }, [authenticated, mode, registrationComplete, recoveryComplete]);

  // Strip the root suffix off semanticNamespace to get just the handle
  // (same derivation SessionSurface.tsx already uses for its own `handle`)
  // -- feeds beatleExpression below when semanticNamespace itself isn't
  // ready yet (claim accepted, session not fully settled).
  const authenticatedHandle = useMemo(() => {
    if (!semanticNamespace) return '';
    const suffix = `.${namespaceRootLabel}`;
    return semanticNamespace.endsWith(suffix) ? semanticNamespace.slice(0, -suffix.length) : semanticNamespace;
  }, [semanticNamespace, namespaceRootLabel]);

  // What Beatle, right under the QR, shows and connects to -- the SAME
  // expression this QR is currently positioned at, never a second,
  // independently-stale one. Pre-auth: the bare root (the switch between
  // e.g. "local.cleaker"/"cleaker.me"). Once claimed: the full identity,
  // exactly matching the (now-removed) big identity link's own text, so
  // there's one place this shows, not two.
  const beatleExpression = authenticated
    ? (semanticNamespace || `${authenticatedHandle || '…'}.${namespaceRootLabel}`)
    : namespaceRootLabel;
  // Used to be prepended with Beatle's own scarab glyph, back when a
  // visible Beatle instance sat right under the QR and this glyph
  // pointed at it. Now that Beatle is gone entirely (headless connect,
  // below), QR.me.tsx draws a real online/offline status dot at the same
  // spot instead of a fixed icon that never actually reflected
  // connection state -- see its own perimeterLabel/perimeterRootLabel
  // doc comments.
  const perimeterLabel = beatleExpression;
  // Same "visit this .me" pattern the directory search already uses
  // (visitUser, above) -- makes the handle drawn around your OWN QR a
  // real pointer to that identity's own surface, not just decoration.
  // Only meaningful once there's an actual handle (pre-auth, the
  // perimeter is just the bare root with no handle segment to link).
  const perimeterHandleHref = authenticated && authenticatedHandle
    ? buildCleakerNamespaceUrl(resolvedEndpoint, authenticatedHandle)
    : undefined;

  // Headless Beatle -- the exact same useBeatle()/channel machinery the
  // visible <Beatle> component wraps (see CleakerUrlView's own use of it
  // in Namespace.tsx), called directly instead of through that component.
  // Flagged live, twice, as still showing SOMETHING under the QR no matter
  // how small ("porque sigues poniendo al escarabajo") after a
  // bar-with-text, then an icon-only bubble, both still duplicated what
  // the QR's own perimeter already displays. "Solo queremos el QR" is
  // literal: no separate control, icon, or box of any kind -- so the
  // channel now opens on its own, the moment there's an expression to open
  // (mount, and again whenever beatleExpression itself changes), rather
  // than waiting on a tap that had nowhere left to live.
  const beatleResolverWs = useMemo(() => makeDefaultResolvers()[0].ws, []);
  const { channel: beatleChannel, open: openBeatleChannel } = useBeatle(beatleResolverWs);
  // Same mode gate the QR bubble itself uses (it isn't even rendered in
  // register/recover mode -- see that Box's own doc comment) -- nothing
  // on screen would reflect this channel's status there, so there's no
  // reason to open one.
  const beatleAutoConnectReady = mode !== 'register' && mode !== 'recover' && secureContextOk;
  useEffect(() => {
    if (beatleAutoConnectReady && beatleExpression) openBeatleChannel(beatleExpression);
    // openBeatleChannel is stable (useBeatle's own useCallback) except
    // when beatleResolverWs changes, which never happens post-mount here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatleAutoConnectReady, beatleExpression]);
  useEffect(() => {
    setBeatleState(beatleChannel.state);
    if (beatleChannel.state === 'connected') handleBeatleConnect(beatleChannel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatleChannel.state]);

  const handleEnter = async () => {
    if (credentialsForm && (!credentialsForm.username.trim() || !credentialsForm.password)) return;
    await onEnter();
  };

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      sx={{
        // `flex: 1, minHeight: 0` -- NOT `minHeight: '100vh'` (what this
        // was before) -- matches the exact idiom Content.tsx's own two
        // nested flex boxes already use to fill whatever space is left
        // after ITS OWN `paddingTop` (the TopBar's real measured height,
        // via the insets system). `100vh` ignored that entirely: it
        // measured against the RAW viewport, so the moment Namespace.tsx
        // adopted a real TopBar (2026-10-02, a prior commit) and
        // Content.tsx started reserving real space for it above this
        // component, a separate "centered within the full 100vh" box
        // starting BELOW that reserved space pushed its own visual center
        // down by roughly half the TopBar's height -- flagged live as
        // "se empujó mucho para abajo... no me parece centrado". `flex: 1`
        // instead makes this box fill exactly the space Content.tsx
        // already allocated (post-TopBar), so centering within it lines
        // up with the actually-visible content area, not the whole page.
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Was 4, then cut to 1.5 after that read as far too much air
        // between the QR/Beatle group and whatever renders below it --
        // flagged live again afterward as having overcorrected, both here
        // (QR to "Hello, I am…") and one level down (that heading to the
        // credentials inputs, which share this same gap -- see the
        // credentials Box below, a direct sibling of the heading Box
        // within this same flex container). Settled between the two:
        // real breathing room without returning to the original excess.
        gap: 2.5,
        px: 3,
        py: 6,
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      {/* Users/Blockchain/URL (and Keychain, once authenticated) now live
          in the shared sidebar -- see GUI in Namespace.tsx, which mounts
          the real Layout/LeftBar around this whole route tree. Removed
          from here entirely rather than duplicated. */}

      {/* Bubble — QRme: the QR itself is the bubble, not a plain icon with
          a separate QR shown below. Click toggles size, not the
          avatar-flip QRme normally offers (hoverFlip/clickFlip off here —
          this bubble has no avatar image to flip to on a page nobody's
          signed into yet, and the click gesture is worth more spent on
          "make it scannable" than a flip animation). Skipped in register
          mode — Claim renders its own (previewing the username being
          typed THERE, not this form's, which stays empty while it's not
          the active one) so a person doesn't see two bubbles stacked.
          Same reasoning covers recover mode — RecoverAccount has no
          identity to preview yet (it's what's being recovered, not typed
          fresh), so there's nothing meaningful for this bubble to show. */}
      {mode !== 'register' && mode !== 'recover' && (
        <Box
          role="button"
          tabIndex={0}
          data-gui-node-id={`${nodeId}.qr`}
          aria-label={expanded ? 'Shrink .me QR' : 'Expand .me QR to scan'}
          onClick={() => setExpanded((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setExpanded((value) => !value);
            }
          }}
          sx={{ cursor: 'pointer', display: 'inline-flex' }}
        >
          <QRme
            value={qrValue}
            username={username || undefined}
            diameter={expanded ? QR_DIAMETER_EXPANDED : QR_DIAMETER_DEFAULT}
            hoverFlip={false}
            clickFlip={false}
            // clickFlip is off (no flip-to-avatar here), but this bubble
            // IS clickable -- the wrapping Box above toggles expanded/
            // collapsed. Without this override, QRme's own root element
            // still carries its clickFlip-tied `cursor: 'default'`, which
            // wins over the wrapper's `cursor: 'pointer'` and silently
            // kills the hand cursor on hover ("manita como de push").
            cursor="pointer"
            status={qrStatus}
            statusLabel={qrStatusLabel}
            // The namespace/expression itself draws AROUND the QR's own
            // perimeter (see QR.me.tsx's own doc comment on
            // perimeterLabel) instead of sitting in a separate caption
            // box well below it -- flagged live as reading like two
            // disconnected things. Stays visible whether collapsed or
            // expanded -- this is the one that must always ring the
            // QR.me itself (corrected live: an earlier pass hid this
            // one instead of addressing Beatle's own field below, which
            // was backwards -- this is "the right one to keep").
            perimeterLabel={perimeterLabel}
            perimeterRootLabel={namespaceRootLabel}
            perimeterHandleHref={perimeterHandleHref}
            // Editable only pre-auth -- once a real session is open, the
            // namespace is whatever that session actually claimed/opened,
            // not a guess left to edit further.
            editableRoot={!authenticated}
            editableRootValue={namespaceRootLabel}
            onEditableRootChange={setNamespaceOverride}
            data-gui-node-id={`${nodeId}.qr.code`}
            style={{ transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </Box>
      )}

      {/* No visible Beatle here at all, in any form -- a full text bar,
          then an icon-only bubble, both still read as a second thing
          duplicating the QR ("porque sigues poniendo al escarabajo").
          "Solo queremos el QR" is literal: the channel itself still
          opens (see the headless useBeatle() call above, right next to
          handleBeatleConnect), it just no longer needs a visible control
          to do it -- it connects on its own the moment there's an
          expression to open. */}

      {authenticated
      && (mode !== 'register' || registrationComplete)
      && (mode !== 'recover' || recoveryComplete) ? (
        /* Authenticated — "Hello, I am…" and the root-switch badge were
           both about deciding WHO/WHERE to claim into before you had an
           identity yet; once you have one, they're just noise. The real
           claimed namespace, whole (e.g. "jabellae.local.cleaker"), is
           what Beatle now shows right under the QR (see beatleExpression
           above this branch) -- showing it a second time here, in a
           separate big link, was the exact "same thing twice" redundancy
           flagged live. The identityHash-derived label stays -- a human
           likes seeing that public, checkable fingerprint next to their
           name, not just the name alone -- it just no longer repeats the
           name alongside it. */
        <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {label}
          </Typography>
          {activeSession && ownUsername && (
            <LiveOwnProfile session={activeSession} username={ownUsername} />
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Keychain moved to the shared sidebar (GUI in Namespace.tsx,
                shown only once authenticated -- same condition as before,
                just relocated) instead of living inline here. Sign out stays
                -- it's an account action tied to this identity display,
                not a navigation control. */}
            <Box
              component="button"
              type="button"
              onClick={onLogout}
              data-gui-node-id={`${nodeId}.logout`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                px: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Icon name="logout" fontSize="1rem" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign out</Typography>
            </Box>
          </Box>
        </Box>
      ) : mode === 'register' ? (
        // Register has its own heading/copy (Claim.tsx) — showing
        // "Hello, I am…" above it too would repeat the same question this
        // form already answers ("who are you HERE"), just with a different
        // action attached.
        <Claim
          namespace={namespaceRootLabel}
          onSwitchToSignIn={() => setMode('signin')}
          onRegistered={() => setRegistrationComplete(true)}
        />
      ) : mode === 'recover' ? (
        // Same reasoning as the register branch above — RecoverAccount is
        // its own complete page (own heading, own back-link), not another
        // thing stacked under "Hello, I am…".
        <RecoverAccount
          namespace={namespaceRootLabel}
          onSwitchToSignIn={() => setMode('signin')}
          onRecovered={() => setRecoveryComplete(true)}
        />
      ) : (
        <>
          {/* Heading — the namespace-root badge sits where a generic "it
              anchors to this host" sentence used to: which root this is IS
              the answer to "anchors to WHAT host", so naming it concretely
              replaces the sentence rather than sitting alongside it. Same
              thing netget answers for an app ("which app am I
              addressing"), this answers for an identity root ("which root
              am I claiming into"). Pre-auth only now — see the
              authenticated branch above for why. */}
          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: -2 }}>
            {/* No trailing ".me" here — the .me submit button below is now
                the answer to this sentence, not a repeat of it. The page
                reads as one continuous line: "Hello, I am…" [namespace]
                [username] [secret] ".me". */}
            <Typography variant="h4" data-gui-node-id={`${nodeId}.heading`} sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              Hello, I am…
            </Typography>
            {/* The connection badge that used to live here (a separate
                "here" pill, click-to-switch local.cleaker/cleaker.me) is
                gone — Beatle, now positioned right under the QR above (see
                that Box), IS that control: its own connection dot + state
                label already show exactly what the badge did, and its
                input defaults to this same resolved value as real,
                editable text, not a second display of it. Showing
                "local.cleaker" in two places at once was the actual bug,
                not which of the two survived, and not where on the page
                the surviving one sits. Known, accepted side effect: this
                removes the one-click switch to another root for the
                CREDENTIALS form's own target below -- that still resolves
                whatever cleakerEndpoint says (or window.location's own
                origin when no prop is given — no hardcoded root either
                way, same as before), just with no in-page toggle anymore.
                Beatle's own field can explore a different destination
                freely; it was never wired to change what the credentials
                form claims into, and still isn't -- exploring and
                claiming stay two different actions, on purpose. */}
            {!secureContextOk && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'warning.main', textAlign: 'center', fontSize: '0.8rem' }}>
                  Signing in requires a secure connection.
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={() => {
                    if (typeof window === 'undefined') return;
                    // Swapping just the scheme on the CURRENT origin assumes
                    // https lives on the same port http does -- not
                    // guaranteed (a dev proxy, a non-standard port mapping).
                    // The configured endpoint's own origin is the one this
                    // page's own reachability/registration logic already
                    // trusts as "where https for this root actually is";
                    // preserve path/search/hash so the button lands you
                    // back where you were, not the bare root.
                    try {
                      const httpsOrigin = new URL(resolvedEndpoint).origin;
                      window.location.href = `${httpsOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;
                    } catch {
                      window.location.href = window.location.href.replace(/^http:/, 'https:');
                    }
                  }}
                  data-gui-node-id={`${nodeId}.https`}
                >
                  Open HTTPS
                </Button>
              </Box>
            )}
          </Box>

        <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {credentialsForm && (
            <>
              <TextField
                label="Username"
                data-gui-node-id={`${nodeId}.username`}
                value={credentialsForm.username}
                onChange={(e) => credentialsForm.setUsername(e.target.value)}
                disabled={pending || !secureContextOk}
                autoFocus
                fullWidth
              />
              <TextField
                label="Secret"
                data-gui-node-id={`${nodeId}.secret`}
                type="password"
                value={credentialsForm.password}
                onChange={(e) => credentialsForm.setPassword(e.target.value)}
                disabled={pending || !secureContextOk}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEnter(); }}
                fullWidth
              />
            </>
          )}
          {error && (
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              {error.message}
            </Typography>
          )}
          <Box
            component="button"
            type="button"
            onClick={handleEnter}
            disabled={pending || !secureContextOk || (!!credentialsForm && (!credentialsForm.username.trim() || !credentialsForm.password))}
            data-gui-node-id={`${nodeId}.submit`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 1.25,
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              background: 'transparent',
              color: 'primary.main',
              cursor: pending ? 'wait' : 'pointer',
              fontWeight: 600,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {pending ? '…' : '.me'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, alignSelf: 'center' }}>
            <Box
              component="button"
              type="button"
              onClick={() => { setRegistrationComplete(false); setMode('register'); }}
              disabled={!secureContextOk}
              data-gui-node-id={`${nodeId}.register`}
              sx={{
                background: 'transparent',
                border: 0,
                color: 'text.secondary',
                cursor: secureContextOk ? 'pointer' : 'not-allowed',
                opacity: secureContextOk ? 1 : 0.5,
                fontSize: '0.8rem',
                textDecoration: 'underline',
                p: 0,
              }}
            >
              New here? Register
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              ·
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={() => { setRecoveryComplete(false); setMode('recover'); }}
              disabled={!secureContextOk}
              data-gui-node-id={`${nodeId}.recover`}
              sx={{
                background: 'transparent',
                border: 0,
                color: 'text.secondary',
                cursor: secureContextOk ? 'pointer' : 'not-allowed',
                opacity: secureContextOk ? 1 : 0.5,
                fontSize: '0.8rem',
                textDecoration: 'underline',
                p: 0,
              }}
            >
              Recover Account
            </Box>
          </Box>
        </Box>
        </>
      )}
    </Box>
  );
};

export default CleakerIdentityCard;
