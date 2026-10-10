// QRConnect — the real, production ".me" identity card: QR +
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
// `QRConnect` on purpose — it is not itself the public `Cleaker`
// entry point, it's the identity-flow UI `Cleaker` reaches via `Namespace`.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInsets } from '@/gui-internals/Hooks';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Button from '@/gui/Atoms/Button/Button';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import QRme from '@/gui/All.This/me/QR/QR.me';
import ConnectFailure from './ConnectFailure';
import { connectTrace } from '@/react/session/connectTrace';
import { useQRConnect } from './useQRConnect';
import { buildCleakerNamespaceUrl } from '@/gui/All.This/Cleaker/namespaceExpression';
import { setActiveNamespaceRoot } from '@/gui/All.This/Cleaker/signedRequest';
import { useOptionalSeedSession } from '@/react/session/useSeedSession';
import type { SeedSession } from '@/core/session/createSeedSession';
import { useMeLauncherView } from '@/react/session/MeLauncher';
import Claim from '@/gui/All.This/Cleaker/Claim/Claim';
import LinkIdentity, { linkableIdentities } from '@/gui/All.This/Cleaker/Claim/LinkIdentity';
import RecoverAccount from '@/react/session/RecoverAccount';
import type { CleakerRootStatus } from '@/react/session/verifiedCleakerRoot';
import type { DoorLayers } from '@/react/session/doorLayers';
import {
  requireCleakerEndpoint,
  deriveNamespaceRootLabel,
  LANDING_ID,
  type DocumentPageProps,
} from '@/react/session/documentPages';

// Small by default (a badge, not something meant to be scanned from across a room); click grows it to a size worth
// holding a camera up to.
const QR_DIAMETER_DEFAULT = 125;
const QR_DIAMETER_EXPANDED = 214;

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
export type QRConnectProps = DocumentPageProps & {
  onBeatleNamespaceResolved?: (namespace: string) => void;
  sharedRootStatus?: CleakerRootStatus;
  /**
   * What is behind this door, layer by layer, and whether nothing answers (`doorOff`): then the QR is grey, the
   * sign-in form is not offered (it could not work) and the layers panel takes its place.
   */
  doorLayers?: DoorLayers;
  doorOff?: boolean;
  /** The layers have not been read yet: neither the form nor the panel is shown until they are. */
  doorChecking?: boolean;
  /** Reads the door's layers now (the same reading that decides doorOff), for executing the QR's expression. */
  probeDoor?: () => Promise<DoorLayers>;
};

const QRConnect: React.FC<QRConnectProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin, username: declaredUsername, onBeatleNamespaceResolved, sharedRootStatus = 'checking', doorLayers, doorOff = false, doorChecking = false, probeDoor, 'data-gui-node-id': nodeId = LANDING_ID, 'data-gui-component': nodeComponent = 'Landing' }) => {
  // No useRegisterGuiNode here: the page is declared by the GUI document
  // (GUI.content.landing) -- declared is not the same as mounted.
  const view = useMeLauncherView();
  const username = view?.credentialsForm?.username.trim() || '';
  // A handle the `.me` above declared goes into the sign-in field once, when the form first exists. Not again: if the
  // person clears it, it stays cleared. Typing it makes the page name `ana.<root>` the same way typing it does.
  const declaredSeededRef = useRef(false);
  const setFormUsername = view?.credentialsForm?.setUsername;
  useEffect(() => {
    if (declaredSeededRef.current || !declaredUsername || !setFormUsername) return;
    declaredSeededRef.current = true;
    setFormUsername(declaredUsername);
  }, [declaredUsername, setFormUsername]);
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
  // Sign in / Register are two distinct, explicit forms now (see
  // SeedSessionProvider.tsx's openExistingNamespace — signing in no longer
  // silently claims an unrecognized username). This just toggles which one
  // renders; Claim itself calls the real registerWithCredentials().
  const [mode, setMode] = useState<'signin' | 'register' | 'recover' | 'link'>('signin');
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
  //
  // WHAT HAPPENS ON RELOAD (so nobody has to guess, and so changing it is a decision, not a side effect):
  //   * the typed root (this state) is NOT kept: after a reload the root is derived again from the page's own address
  //     (deriveNamespaceRootLabel(resolvedEndpoint)). The same goes for the failure card and the trace.
  //   * the "active namespace root" the sign-in code reads (signedRequest's setActiveNamespaceRoot) is a global in
  //     memory: not kept either, and it is set from this root on every render.
  //   * what IS kept across a reload: the identity vault in localStorage (`this.me.identity-vault:v1:<handle>.<root>`),
  //     the theme, and the session if the provider persists one. A vault is per full namespace, so typing another
  //     root never reaches a different identity's vault.
  // Persisting the typed root is a possible choice, not an impossible one: ./hooks/useCleakerNamespace stores it
  // (localStorage + a kernel path) and is not wired in. It would trade the mismatch described above (a stale
  // override outliving the server's own idea of the root) for not retyping it. That trade is the owner's to make.
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


  const qrValue = defaultQrValue;

  if (!view) return null;

  const { authenticated, label, pending, error, onEnter, onLogout, credentialsForm, semanticNamespace } = view;

  // Me no longer remounts this tree when a session
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
  // Deliberately NOT just `beatleExpression` pre-auth, even though that's
  // what this was before -- `beatleExpression` also drives Beatle's own
  // real headless auto-connect (see the effect below, keyed on it
  // changing), so making IT follow every keystroke would re-trigger a
  // real mesh connection attempt on every character typed. Kept that
  // stable (root-only pre-auth, unchanged) and derived the LABEL
  // separately, for display only -- same reasoning already applied to
  // `defaultQrValue` above (the QR's own ENCODED value already follows
  // `username` live; this was the one remaining piece still frozen,
  // flagged live 2026-10-02: "cuando empecemos a typear el username
  // empiece a aparecer junto al namespace... j.cleaker.me ja.cleaker.me").
  const perimeterLabel = authenticated
    ? beatleExpression
    : (username ? `${username}.${namespaceRootLabel}` : namespaceRootLabel);
  // Same "visit this .me" pattern the directory search already uses
  // (visitUser, above) -- makes the handle drawn around your OWN QR a
  // real pointer to that identity's own surface, not just decoration.
  // Only meaningful once there's an actual handle (pre-auth, the
  // perimeter is just the bare root with no handle segment to link).
  const perimeterHandleHref = authenticated && authenticatedHandle
    ? buildCleakerNamespaceUrl(resolvedEndpoint, authenticatedHandle)
    : undefined;

  // The process of connecting (what the QR shows, what clicking it does, what is offered when it cannot be reached) is
  // useQRConnect's; this card draws the QR and the way forward, and keeps the form. It is not rendered while
  // registering or recovering, so nothing connects then. Only while that form is what is showing: `mode` stays 'register'
  // after the registration completes (it is reset on sign-out), and a signed-in link must still show its QR.
  const qrActive = !((mode === 'register' && !registrationComplete) || (mode === 'recover' && !recoveryComplete));
  const conn = useQRConnect({
    expression: namespaceRootLabel,
    onExpressionChange: setNamespaceOverride,
    localRoot: deriveNamespaceRootLabel(resolvedEndpoint),
    door: { off: doorOff, checking: doorChecking, layers: doorLayers, probe: probeDoor },
    sharedRootStatus,
    onLocalResolved: onBeatleNamespaceResolved,
    channelExpression: beatleExpression,
    channelEnabled: qrActive && secureContextOk,
    // Once a session is open the namespace is whatever it claimed/opened: no way around to offer.
    failureEnabled: !authenticated,
  });
  const remoteRoot = conn.remoteRoot;

  // The username field takes the focus when the form is shown (it used to be `autoFocus`, which focuses synchronously
  // while the form is being committed: after a click that is also what showed the form, that crashed under Storybook's
  // act() wrapper). A stable ref callback runs on mount only, and focusing on the next frame is the same for the person.
  const focusWhenShown = useCallback((element: HTMLInputElement | null) => {
    if (element) requestAnimationFrame(() => element.focus());
  }, []);

  const insets = useInsets();
  const topInset = Math.max(0, Number(insets?.top ?? 0)) + Math.max(0, Number(insets?.nav ?? 0));

  const handleEnter = async () => {
    if (credentialsForm && (!credentialsForm.username.trim() || !credentialsForm.password)) return;
    // A root that is another host is signed in AT that host: the session's own default is this page's gateway.
    // The root is this link's own, said explicitly: not read back from the page-wide active root, which another mounted
    // link may have written last.
    await onEnter({ ...(remoteRoot ? { transportOrigin: `https://${remoteRoot}` } : {}), namespace: namespaceRootLabel });
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
        // The top bar holds nothing but the search icon, so the eye takes the whole window as the page: the room Content
        // reserved for that bar is given back below, which puts the middle of this group on the middle of the window
        // instead of half a bar lower.
        pb: (theme: any) => `calc(${theme.spacing(6)} + ${topInset}px)`,
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      {/* Users/Blockchain/URL (and Keychain, once authenticated) now live
          in the shared sidebar -- see GUI in Namespace.tsx, which mounts
          the real Layout/LeftBar around this whole route tree. Removed
          from here entirely rather than duplicated. */}

      {/* The QR is the one control for "where am I connected": clicking it runs its expression (see
          useQRConnect). Skipped in register/recover mode: Claim renders its own, previewing the username typed
          THERE, and RecoverAccount has no identity to preview yet. */}
      {qrActive && (
        <Box
          role="button"
          tabIndex={0}
          data-gui-node-id={`${nodeId}.qr`}
          aria-label={conn.executes ? `Connect to ${namespaceRootLabel}` : conn.expanded ? 'Shrink .me QR' : 'Expand .me QR to scan'}
          onClick={conn.activate}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              conn.activate();
            }
          }}
          // A mouse click must not leave a rectangular focus box around the bubble and its label (it read as
          // something outside the QR); keyboard focus keeps a visible ring.
          sx={{ cursor: 'pointer', display: 'inline-flex', '&:focus': { outline: 'none' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4, borderRadius: 2 } }}
        >
          <QRme
            value={qrValue}
            username={username || undefined}
            diameter={conn.expanded ? QR_DIAMETER_EXPANDED : QR_DIAMETER_DEFAULT}
            hoverFlip={false}
            clickFlip={false}
            cursor="pointer"
            status={conn.status}
            statusLabel={conn.statusLabel}
            perimeterLabel={perimeterLabel}
            perimeterRootLabel={namespaceRootLabel}
            perimeterHandleHref={perimeterHandleHref}
            // Editable only pre-auth -- once a real session is open, the namespace is whatever that session actually
            // claimed/opened, not a guess left to edit further.
            editableRoot={!authenticated}
            editableRootValue={namespaceRootLabel}
            onEditableRootChange={setNamespaceOverride}
            data-gui-node-id={`${nodeId}.qr.code`}
            style={{ transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </Box>
      )}

      {qrActive && conn.failureShown && (
        // One sentence and three ways forward. The layers, the trace and the way to start the environment are behind "Diagnosis".
        <ConnectFailure
          expression={namespaceRootLabel}
          layers={conn.layers}
          trace={connectTrace.entries().filter((entry) => entry.expression === namespaceRootLabel)}
          location={typeof window !== 'undefined' ? window.location.origin : undefined}
          onConnectPublic={() => conn.changeExpression('cleaker.me')}
          onDismiss={conn.dismissFailure}
          data-gui-node-id={`${nodeId}.connect-failure`}
        />
      )}

      {doorChecking && !remoteRoot ? null : qrActive && conn.failureShown ? (
        // The "Unable to connect" card is QRConnect's, right under the QR: nothing else is offered meanwhile.
        null
      ) : (remoteRoot ? conn.status !== 'confirmed' : doorOff) ? (
        // Grey QR (or one still connecting to another host), nothing else: it is the way in. Clicking it executes its
        // expression. Once another host answers, the person is offered "Hello, I am…" there, whether or not this
        // page's own door is up.
        null
      ) : authenticated
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
      ) : mode === 'link' ? (
        // Its own form, not part of Register: it creates nothing, it presents an identity that is already open in
        // another link of this context and asks for the claim here.
        <LinkIdentity
          namespace={namespaceRootLabel}
          onSwitchToSignIn={() => setMode('signin')}
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
                inputRef={focusWhenShown}
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
              {/* A server that ANSWERED and refused the credentials says so itself; anything else, against another host,
                  is that host not taking the request from here (a cross-origin sign-in it does not allow), and the raw
                  transport code ("REQUEST_FAILED_405") says nothing to the person. */}
              {remoteRoot && !['INVALID_CLAIM', 'INVALID_CREDENTIAL_RESULT'].includes(String((error as { code?: unknown }).code ?? ''))
                ? `${remoteRoot} did not accept this sign-in from here.`
                : error.message}
            </Typography>
          )}
          {error && remoteRoot && (
            // Another host decides who may sign in to it from where: cleaker.me, for one, answers only requests that
            // come from cleaker.me itself. When that is why this failed, the way through is its own page.
            <Box
              component="a"
              href={`https://${remoteRoot}/`}
              data-gui-node-id={`${nodeId}.continue-remote`}
              sx={{ alignSelf: 'center', color: 'text.secondary', fontSize: '0.8rem', textDecoration: 'underline', textUnderlineOffset: '3px', '&:hover': { color: 'text.primary' } }}
            >
              Continue at {remoteRoot}
            </Box>
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
          {/* Registering and recovering are not aimed at another host yet: only signing in is. */}
          {!remoteRoot && (
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
          )}
          {/* Only when the local context holds an open identity that is not linked under this root yet. */}
          {!remoteRoot && linkableIdentities(seedSessionCtx?.heldIdentities ?? [], namespaceRootLabel).length > 0 && (
            <Box
              component="button"
              type="button"
              onClick={() => setMode('link')}
              disabled={!secureContextOk}
              data-gui-node-id={`${nodeId}.link`}
              sx={{
                alignSelf: 'center', background: 'transparent', border: 0, color: 'text.secondary',
                cursor: secureContextOk ? 'pointer' : 'not-allowed', opacity: secureContextOk ? 1 : 0.5,
                fontSize: '0.8rem', textDecoration: 'underline', p: 0,
              }}
            >
              Use my identity from another link
            </Box>
          )}
        </Box>
        </>
      )}
    </Box>
  );
};

export default QRConnect;
