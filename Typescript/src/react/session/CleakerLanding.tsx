// CleakerLanding.tsx — full-page ".me" landing, for a host whose entire job
// is identity (e.g. local.cleaker) rather than an app dashboard. Same
// session as MeLauncher.tsx (shares useMeLauncherView() — one source of
// truth for "how do I get a seed"), different chrome: MeLauncher is a
// compact sidebar bubble behind a popover; this is the bubble made the
// centerpiece of its own page, form always visible, no popover to open.
// Design reference: this.gui's own ".me / Default" storybook story
// ("Hello, I am .me" — username in, identity derives out) — that story is
// a demo with a fake local hash; this wires the same shape to the real
// session (useMeLauncherView(), the same claim/open flow MeLauncher uses).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useInRouterContext, useSearchParams, useNavigate } from 'react-router-dom';
import { normalizeProofMessage } from 'this.me';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Button from '@/gui/Atoms/Button/Button';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import QRme from '@/gui/All.This/me/QR/QR.me';
import SearchField from '@/gui/Molecules/SearchField/SearchField';
import type { SearchFieldResult } from '@/gui/Molecules/SearchField/SearchField.types';
import UsersTable from '@/gui/All.This/Cleaker/Namespace/Usernames/Usernames';
import BlocksTable from '@/gui/All.This/Cleaker/Namespace/Blocks/BlocksTable';
import { buildCleakerNamespaceUrl } from '@/gui/All.This/Cleaker/namespaceExpression';
import { setActiveNamespaceRoot } from '@/gui/All.This/Cleaker/signedRequest';
import CleakerKeychain, { type PendingLocalRegistration } from '@/gui/All.This/Cleaker/Keychain/CleakerKeychain';
import { createKeychainClient, type KeychainClient } from '@/gui/All.This/Cleaker/Keychain/keychainClient';
import type { KeychainKey, KeychainView as KeychainScreen } from '@/gui/All.This/Cleaker/Keychain/keychainState';
import { useMeLauncherView } from './MeLauncher';
import Beatle from '@/gui/All.This/NRP/Beatle/Beatle';
import { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import { makeDefaultResolvers } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';
import RegisterMe from './RegisterMe';
import RecoverAccount from './RecoverAccount';

interface DirectoryUser {
  username: string;
  profileImg?: string | null;
}

export interface CleakerLandingProps {
  sx?: any;
  /** Same meaning as MeLauncher's — e.g. "http://local.cleaker". */
  cleakerEndpoint?: string;
  /**
   * Overrides getNetgetMonadOrigin()'s default `${window.location.origin}/
   * apps/netget` — that default is only correct when this page is actually
   * being SERVED by netget itself (the real deployment: netget's App.jsx
   * renders this at local.cleaker/cleaker.me, so window.location.origin
   * legitimately IS the gateway). Any other host — a Storybook preview
   * (localhost:6006) chief among them — has no such path at that origin,
   * so the claims directory search, /users, and /blockchain routes below
   * all 404. Pass the real reachable origin (e.g.
   * "http://local.netget/apps/netget") in any context where this page
   * isn't self-hosting the gateway it's describing.
   */
  netgetMonadOrigin?: string;
}

// No hardcoded root here on purpose — cleaker.me/local.cleaker were never
// structurally special, just two values `cleakerEndpoint` happened to hold
// in this session's dev environment (see SetChemistry.findings.md's
// "generalizes past 2" note). window.location is the one legitimate
// fallback: a physical fact about where this page is actually running,
// never a semantic guess about which root "should" be default. Any host
// this component is served from becomes its own default root, unmodified.
function defaultCleakerEndpoint(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

// netget's own monad, reached the same way any other app reaches its own —
// through netget's generic /apps/:name mesh proxy, not a dedicated port.
// Identical computation to netgetMonadTransportOrigin() in netget's own
// App.jsx/resolveNetgetSeed.js — this is the one monad backing the whole
// gateway, so it's also where the live claims directory (/users below,
// and the search bar's own directory fetch) reads from.
function getNetgetMonadOrigin(override?: string): string {
  const explicit = String(override || '').trim();
  if (explicit) return explicit;
  return typeof window !== 'undefined' ? `${window.location.origin}/apps/netget` : '';
}

// This project's IconButton wrapper isn't typed as MUI's polymorphic
// OverridableComponent (see @/gui/Atoms/IconButton/IconButton — a plain
// forwardRef over MuiIconButtonProps), so it doesn't know about `component`
// + `to` even though MUI's underlying IconButton renders them correctly.
// Cast once here rather than sprinkling `as any` at each call site.
const LinkIconButton = IconButton as React.ComponentType<any>;

// Same idea as netget resolving which app you're addressing — this landing
// page is the entry point for a namespace *root*, and until now gave no
// sign of which one. Derived straight from cleakerEndpoint (the same value
// that already drives the QR), so it's never a second source of truth: the
// prop netget's App.jsx passes ("http://local.cleaker") or the component's
// own absolute default ("https://cleaker.me") both reduce to just the host
// — "local.cleaker" or "cleaker.me" — matching <handle>.<root> exactly.
function deriveNamespaceRootLabel(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

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

const CleakerLandingHome: React.FC<CleakerLandingProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin }) => {
  const view = useMeLauncherView();
  const username = view?.credentialsForm?.username.trim() || '';
  const [expanded, setExpanded] = useState(false);
  // Sign in / Register are two distinct, explicit forms now (see
  // SeedSessionProvider.tsx's openExistingNamespace — signing in no longer
  // silently claims an unrecognized username). This just toggles which one
  // renders; RegisterMe itself calls the real registerWithCredentials().
  const [mode, setMode] = useState<'signin' | 'register' | 'recover'>('signin');
  // Claiming a namespace flips `authenticated` true the instant the claim
  // succeeds (SeedSessionProvider's registerWithCredentials commits the
  // session before RegisterMe gets to run its own post-claim backup step)
  // — without this flag, the `authenticated` branch below would take over
  // immediately and unmount RegisterMe mid-flow, skipping the recovery
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
  const resolvedEndpoint = cleakerEndpoint || defaultCleakerEndpoint();
  const namespaceRootLabel = useMemo(
    () => deriveNamespaceRootLabel(resolvedEndpoint),
    [resolvedEndpoint],
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

  // Reachability of whichever root is currently shown — a quiet, discrete
  // signal ("is this actually there before you try to claim into it"), not
  // a loud status widget. `no-cors` deliberately: this only needs to know
  // whether the host resolves and answers at all, not read its response —
  // an opaque 200 from no-cors and a real 404 both count as "up" here, only
  // a network-level failure (DNS, connection refused, timeout) is "down".
  // That sidesteps needing any CORS grant from cleaker.me specifically for
  // a check this shallow. Re-runs whenever the shown root changes (toggle
  // or prop), not on a timer — a one-shot check per root, not polling.
  const [rootReachable, setRootReachable] = useState<'checking' | 'up' | 'down'>('checking');
  useEffect(() => {
    let cancelled = false;
    setRootReachable('checking');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    // When the root being checked is the same host this page is already
    // loaded from, check window.location.origin instead of resolvedEndpoint
    // verbatim — a caller-supplied cleakerEndpoint prop can carry a scheme
    // that doesn't match what the browser actually loaded (seen live:
    // Chrome auto-upgrading a plain-http endpoint to https, "Not Secure"
    // cert warning and all), and fetching the mismatched-scheme version
    // from an https page is mixed content, silently blocked — read as
    // "down" even though the page obviously loaded fine. Using the exact
    // origin already proven to work sidesteps the protocol mismatch
    // entirely for the common case (checking the root you're actually
    // standing on); checking any OTHER namespace still uses the configured
    // endpoint as before, since that direction isn't blocked.
    const checkUrl = (typeof window !== 'undefined' && window.location.hostname === namespaceRootLabel)
      ? window.location.origin
      : resolvedEndpoint;
    fetch(checkUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
      .then(() => { if (!cancelled) setRootReachable('up'); })
      .catch(() => { if (!cancelled) setRootReachable('down'); })
      .finally(() => clearTimeout(timeoutId));
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [resolvedEndpoint]);

  // Directory search — "look up an existing .me identity" before doing
  // anything with your own. Same live claims directory UsersTable already
  // reads (GET {origin}/apps/netget/ → { users: [...] }), fetched once on
  // mount: this is the one monad backing the whole gateway (see
  // netgetMonadTransportOrigin() in netget's own App.jsx — same computation,
  // window.location.origin + '/apps/netget'), so it holds every claim made
  // through here regardless of which root (local.cleaker/cleaker.me) a
  // given claim was made under. Filtered client-side — this list is small
  // enough that a real search endpoint would be overbuilding it.
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    fetch(`${getNetgetMonadOrigin(netgetMonadOrigin)}/`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => { if (!cancelled) setDirectoryUsers(Array.isArray(data?.users) ? data.users : []); })
      .catch(() => { if (!cancelled) setDirectoryUsers([]); });
    return () => { cancelled = true; };
  }, [netgetMonadOrigin]);

  // Filtering is the only piece that's this page's own concern — collapse,
  // expand, focus, and the results dropdown all live in SearchField
  // (gui/Molecules/SearchField) now, a generic reusable Molecule extracted
  // out of this file. This just turns the live directory into
  // SearchFieldResult objects and opens whichever one gets picked.
  const [searchQuery, setSearchQuery] = useState('');
  const searchMatches = useMemo<SearchFieldResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return directoryUsers
      .filter((u) => u.username.toLowerCase().includes(query))
      .slice(0, 6)
      .map((u) => ({
        id: u.username,
        label: `@${u.username}`,
        avatarSrc: u.profileImg,
        avatarFallback: u.username,
      }));
  }, [directoryUsers, searchQuery]);

  const visitUser = (result: SearchFieldResult) => {
    try {
      const href = buildCleakerNamespaceUrl(resolvedEndpoint, result.id);
      window.open(href, '_blank', 'noopener,noreferrer');
    } catch {
      // Malformed handle — nothing to navigate to, just leave the field as-is.
    }
  };

  // The bubble IS the QR (QRme — flips to an avatar on hover/click) rather
  // than a separate icon with a QR shown below it. Same address CleakerQR
  // would compute (buildCleakerNamespaceUrl is the shared utility both
  // wrap), just resolved directly here since QRme takes a raw value, not a
  // username+endpoint pair to derive one from itself.
  const qrValue = useMemo(() => {
    try {
      return buildCleakerNamespaceUrl(resolvedEndpoint, username || undefined);
    } catch {
      return resolvedEndpoint;
    }
  }, [resolvedEndpoint, username]);

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
    // Same gate the render logic below already uses (line ~466) to decide
    // when the authenticated view is safe to show instead of RegisterMe/
    // RecoverAccount -- `authenticated` alone flips true the instant a
    // claim/recovery is ACCEPTED, well before RegisterMe's own backup step
    // writes the local encrypted vault (registrationComplete, set via its
    // onRegistered prop). Navigating on `authenticated` alone would unmount
    // RegisterMe mid-flow the same way the render logic already guards
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

  // The authenticated identity line links to its own real .me surface —
  // strip the root suffix off semanticNamespace to get just the handle
  // (same derivation SessionSurface.tsx already uses for its own `handle`),
  // then build the same kind of URL UsersTable's rows already link to.
  const authenticatedHandle = useMemo(() => {
    if (!semanticNamespace) return '';
    const suffix = `.${namespaceRootLabel}`;
    return semanticNamespace.endsWith(suffix) ? semanticNamespace.slice(0, -suffix.length) : semanticNamespace;
  }, [semanticNamespace, namespaceRootLabel]);
  const authenticatedHref = useMemo(() => {
    try {
      return buildCleakerNamespaceUrl(resolvedEndpoint, authenticatedHandle || undefined);
    } catch {
      return resolvedEndpoint;
    }
  }, [resolvedEndpoint, authenticatedHandle]);

  const handleEnter = async () => {
    if (credentialsForm && (!credentialsForm.username.trim() || !credentialsForm.password)) return;
    await onEnter();
  };

  return (
    <Box
      data-gui-node-id="CleakerLanding"
      data-gui-component="CleakerLanding"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        px: 3,
        py: 6,
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      {/* Users directory + Blockchain — mirrors the search icon's top-right
          placement on the opposite corner. Both are real routes (/users,
          /blockchain — client-side, see the <Routes> wrapper below), not
          modals or state toggles: each is an NRP-addressable subtree
          (local.cleaker/users vs local.cleaker/blockchain — the claims
          directory vs the full memory log behind it, see
          modules/cleaker/Typescript/typedocs/Namespace-Is-Context.md §4),
          so each needs its own URL. No sidebars/Layout shell here on
          purpose — this stays the same minimal, centered chrome as the
          landing page, just different center content. */}
      <Box sx={{ position: 'fixed', top: { xs: 12, sm: 20 }, left: { xs: 12, sm: 20 }, zIndex: 20, display: 'flex', gap: 1 }}>
        <LinkIconButton
          component={Link}
          to="/users"
          aria-label="Browse .me users"
          data-gui-node-id="CleakerLanding.usersLink"
          sx={{
            width: 40,
            height: 40,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <Icon name="group" fontSize={18 as any} />
        </LinkIconButton>
        <LinkIconButton
          component={Link}
          to="/blockchain"
          aria-label="Browse the namespace blockchain"
          data-gui-node-id="CleakerLanding.blockchainLink"
          sx={{
            width: 40,
            height: 40,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <Icon name="link" fontSize={18 as any} />
        </LinkIconButton>
        <LinkIconButton
          component={Link}
          to="/url"
          aria-label="Open the URL explorer"
          data-gui-node-id="CleakerLanding.urlLink"
          sx={{
            width: 40,
            height: 40,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <Icon name="language" fontSize={18 as any} />
        </LinkIconButton>
      </Box>

      {/* Directory search — fixed to the top-right corner, out of the
          centered identity flow entirely (looking someone else up is a
          different concern from becoming someone yourself, below). The
          collapse/expand/dropdown chrome itself lives in SearchField (a
          generic reusable Molecule); this only supplies what's real to
          this page — the live directory matches and where a pick goes. */}
      <Box sx={{ position: 'fixed', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 20 }}>
        <SearchField
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={searchMatches}
          onSelectResult={visitUser}
          placeholder="Search .me"
          ariaLabel="Search .me"
          data-gui-node-id="CleakerLanding.search"
        />
      </Box>

      {/* Bubble — QRme: the QR itself is the bubble, not a plain icon with
          a separate QR shown below. Click toggles size, not the
          avatar-flip QRme normally offers (hoverFlip/clickFlip off here —
          this bubble has no avatar image to flip to on a page nobody's
          signed into yet, and the click gesture is worth more spent on
          "make it scannable" than a flip animation). Skipped in register
          mode — RegisterMe renders its own (previewing the username being
          typed THERE, not this form's, which stays empty while it's not
          the active one) so a person doesn't see two bubbles stacked.
          Same reasoning covers recover mode — RecoverAccount has no
          identity to preview yet (it's what's being recovered, not typed
          fresh), so there's nothing meaningful for this bubble to show. */}
      {mode !== 'register' && mode !== 'recover' && (
        <Box
          role="button"
          tabIndex={0}
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
            data-gui-node-id="CleakerLanding.bubble"
            style={{ transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </Box>
      )}

      {authenticated
      && (mode !== 'register' || registrationComplete)
      && (mode !== 'recover' || recoveryComplete) ? (
        /* Authenticated — "Hello, I am…" and the root-switch badge were
           both about deciding WHO/WHERE to claim into before you had an
           identity yet; once you have one, they're just noise. Replaces
           both with the one thing worth showing: the real claimed
           namespace, whole (e.g. "jabellae.local.cleaker"), not split
           across a greeting and a separate pill. The identityHash-derived
           label stays underneath it — a human likes seeing that public,
           checkable fingerprint next to their name, not just the name
           alone. */
        <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography
            component="a"
            href={authenticatedHref}
            data-gui-node-id="CleakerLanding.identity"
            variant="body1"
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              textAlign: 'center',
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
            }}
          >
            {semanticNamespace || `${authenticatedHandle || '…'}.${namespaceRootLabel}`}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* jabellae.local.cleaker/keychain — the keys belonging to
                THIS authenticated identity, same route-per-subtree pattern
                as /users and /blockchain above. Only shown once signed
                in: the keychain is about your own keys, not something to
                browse pre-auth the way the public directory is. */}
            <LinkIconButton
              component={Link}
              to="/keychain"
              aria-label="Open keychain"
              data-gui-node-id="CleakerLanding.keychainLink"
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
              <Icon name="key" fontSize="1rem" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Keychain</Typography>
            </LinkIconButton>
            <Box
              component="button"
              type="button"
              onClick={onLogout}
              data-gui-node-id="CleakerLanding.logout"
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
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Salir</Typography>
            </Box>
          </Box>
        </Box>
      ) : mode === 'register' ? (
        // Register has its own heading/copy (RegisterMe.tsx) — showing
        // "Hello, I am…" above it too would repeat the same question this
        // form already answers ("who are you HERE"), just with a different
        // action attached.
        <RegisterMe
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
            {/* No trailing ".me" here — the Claim submit button below is now
                the answer to this sentence, not a repeat of it. The page
                reads as one continuous line: "Hello, I am…" [namespace]
                [username] [secret] "Claim". */}
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              Hello, I am…
            </Typography>
            {/* The connection badge that used to live here (a separate
                "here" pill, click-to-switch local.cleaker/cleaker.me) is
                gone — Beatle below IS that control now: its own connection
                dot + state label already show exactly what the badge did,
                and its input defaults to this same resolved value as real,
                editable text (see defaultExpression below), not a second
                display of it. Showing "local.cleaker" in two places at
                once was the actual bug, not which of the two survived.
                Known, accepted side effect: this removes the one-click
                switch to another root for the CREDENTIALS form's own
                target below -- that still resolves whatever
                cleakerEndpoint says (or window.location's own origin when
                no prop is given — no hardcoded root either way, same as
                before), just with no in-page toggle anymore. Beatle's own field can
                explore a different destination freely; it was never wired
                to change what the credentials form claims into, and still
                isn't -- exploring and claiming stay two different actions,
                on purpose. */}
            {!secureContextOk && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'warning.main', textAlign: 'center', fontSize: '0.8rem' }}>
                  Para iniciar sesión necesitas una conexión segura.
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
                  data-gui-node-id="CleakerLanding.openHttps"
                >
                  Abrir HTTPS
                </Button>
              </Box>
            )}
          </Box>

          {/* me:// — Beatle's own raw expression input (its parser/useBeatle
              already gate on domain shape — see isValidDomainShape in cleaker
              and ResolutionState's 'invalid' state — so free text is enough;
              no per-field chip editor needed for what's ultimately just one
              string). No separate "here" badge anymore — this IS that
              control now, defaulting to the current resolved root
              (defaultExpression), never a guessed expansion for anything
              typed after. showResolver=false: this page already answers
              "which server" via the warning/https flow above, so the
              resolver combobox would repeat that, not add to it. Opening a
              channel only ever reads disclosure/endpoints for what's
              public — nothing here claims, registers, or shares this page's
              active identity; that stays exactly what the credentials form
              below does, unconnected to whatever root this explores.
              Skipped entirely (not shown disabled) when the page itself
              isn't a secure context — useBeatle's own open() already
              refuses to connect there, and the warning above already
              explains why, so a second dead control here would just repeat
              it. */}
          {secureContextOk && (
            <Box sx={{ width: '100%', maxWidth: 420 }}>
              <Beatle defaultExpression={namespaceRootLabel} showResolver={false} />
            </Box>
          )}

        <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {credentialsForm && (
            <>
              <TextField
                label="Username"
                value={credentialsForm.username}
                onChange={(e) => credentialsForm.setUsername(e.target.value)}
                disabled={pending || !secureContextOk}
                autoFocus
                fullWidth
              />
              <TextField
                label="Secret"
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
            data-gui-node-id="CleakerLanding.submit"
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
              {pending ? '…' : 'Claim'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, alignSelf: 'center' }}>
            <Box
              component="button"
              type="button"
              onClick={() => { setRegistrationComplete(false); setMode('register'); }}
              disabled={!secureContextOk}
              data-gui-node-id="CleakerLanding.switchToRegister"
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
              data-gui-node-id="CleakerLanding.switchToRecover"
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

// The other half of the /users route — same minimal chrome as the home
// view (centered column, no Layout sidebars), reusing UsersTable (already
// the real public-claims-directory component, see its own doc comment)
// rather than building a second directory view. namespaceRootUrl is
// deliberately separate from endpoint (the API to fetch FROM, netget's own
// monad) — reusing endpoint as the display root was exactly the bug this
// session already found and fixed in UsersTable's own Storybook story.
const CleakerUsersView: React.FC<CleakerLandingProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin }) => {
  const resolvedEndpoint = cleakerEndpoint || defaultCleakerEndpoint();
  const namespaceRootLabel = useMemo(
    () => deriveNamespaceRootLabel(resolvedEndpoint),
    [resolvedEndpoint],
  );

  return (
    <Box
      data-gui-node-id="CleakerUsersView"
      data-gui-component="CleakerUsersView"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 3,
        py: 6,
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 720 }}>
        <LinkIconButton
          component={Link}
          to="/"
          aria-label="Back to .me"
          data-gui-node-id="CleakerUsersView.back"
          sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <Icon name="arrow_back" fontSize={18 as any} />
        </LinkIconButton>
        <UsersTable
          endpoint={getNetgetMonadOrigin(netgetMonadOrigin)}
          namespaceRootUrl={resolvedEndpoint}
          namespaceLabel={namespaceRootLabel}
          data-gui-node-id="CleakerUsersView.table"
        />
      </Box>
    </Box>
  );
};

// The other half of the /blockchain route — same shell as CleakerUsersView
// above (this route is its sibling, not its child: the claims directory
// lists WHO claimed this namespace, the blockchain shows EVERYTHING ever
// written to it — claim events, content, host self-report, all still shown
// as one stream today, see Namespace-Is-Context.md §4 for the split this
// should eventually render as). Reuses BlocksTable rather than building a
// second ledger view.
const CleakerBlockchainView: React.FC<CleakerLandingProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin }) => {
  const resolvedEndpoint = cleakerEndpoint || defaultCleakerEndpoint();
  const namespaceRootLabel = useMemo(
    () => deriveNamespaceRootLabel(resolvedEndpoint),
    [resolvedEndpoint],
  );

  return (
    <Box
      data-gui-node-id="CleakerBlockchainView"
      data-gui-component="CleakerBlockchainView"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 3,
        py: 6,
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 720 }}>
        <LinkIconButton
          component={Link}
          to="/"
          aria-label="Back to .me"
          data-gui-node-id="CleakerBlockchainView.back"
          sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <Icon name="arrow_back" fontSize={18 as any} />
        </LinkIconButton>
        <BlocksTable
          endpoint={getNetgetMonadOrigin(netgetMonadOrigin)}
          namespaceRootUrl={resolvedEndpoint}
          namespaceLabel={namespaceRootLabel}
          data-gui-node-id="CleakerBlockchainView.table"
        />
      </Box>
    </Box>
  );
};

const URL_VIEW_STATE_COLOR: Record<string, string> = {
  idle: '#555e66', parsing: '#ffb74d', connecting: '#ffb74d', resolving: '#ffcc02',
  connected: '#66bb6a', streaming: '#4fc3f7', error: '#666', invalid: '#e57373', disconnected: '#555e66',
};

// The /url route — same minimal shell as CleakerUsersView/CleakerBlockchainView
// above (sibling route, not a child), but NOT a static page: entering a URL
// here is a real NRP invocation, not client-side navigation. It composes the
// `@` overlay expression (`<namespace> @ "<url>"`) and opens it through the
// exact same useBeatle()/channel machinery Beatle itself uses — see
// SetChemistry.findings.md's "every URL has a me:// alter ego" note. Per the
// per-operator status table there, `@` is parsed client-side but never
// resolved server-side (handleNrpOpen ignores ast) — so this will sit at
// 'resolving' forever today. That's shown, not hidden: the point is
// expressing real NRP intent through the real protocol, not faking a result.
const CleakerUrlView: React.FC<CleakerLandingProps> = ({ sx, cleakerEndpoint }) => {
  const resolvedEndpoint = cleakerEndpoint || defaultCleakerEndpoint();
  const namespaceRootLabel = useMemo(
    () => deriveNamespaceRootLabel(resolvedEndpoint),
    [resolvedEndpoint],
  );
  const resolverWs = useMemo(() => makeDefaultResolvers()[0].ws, []);
  const { channel, open } = useBeatle(resolverWs);
  const [urlInput, setUrlInput] = useState('');
  const color = URL_VIEW_STATE_COLOR[channel.state] ?? URL_VIEW_STATE_COLOR.idle;

  const handleSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    open(`${namespaceRootLabel} @ "${trimmed}"`);
  };

  return (
    <Box
      data-gui-node-id="CleakerUrlView"
      data-gui-component="CleakerUrlView"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 3,
        py: 6,
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <LinkIconButton
          component={Link}
          to="/"
          aria-label="Back to .me"
          data-gui-node-id="CleakerUrlView.back"
          sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <Icon name="arrow_back" fontSize={18 as any} />
        </LinkIconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          URL
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {namespaceRootLabel} @ this URL — opens a real NRP channel, not a page fetch.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="https://example.com/page"
            fullWidth
            size="small"
            data-gui-node-id="CleakerUrlView.input"
          />
          <Box
            component="button"
            type="button"
            onClick={handleSubmit}
            data-gui-node-id="CleakerUrlView.submit"
            sx={{
              px: 2,
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              background: 'transparent',
              color: 'primary.main',
              cursor: 'pointer',
              fontWeight: 600,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            @
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
            {channel.state}
          </Typography>
          {channel.error && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              — {channel.error}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// The other half of "Keychain" above — real signing keys for the real
// authenticated identity, not a mock. Reuses keychainClient.ts exactly as
// demo/main.tsx (packages/GUI/Typescript/demo/) does, except the signer
// comes from the ambient SeedSessionProvider already wrapping this whole
// tree instead of a hardcoded demo phrase, and the endpoint is whatever
// transportOrigin the session itself claimed/opened against — never a
// second, separately-configured origin to keep in sync.
const CleakerKeychainView: React.FC<CleakerLandingProps> = () => {
  const ctx = useOptionalSeedSessionContext();
  const [client, setClient] = useState<KeychainClient | null>(null);
  const [keys, setKeys] = useState<KeychainKey[]>([]);
  const [pendingLocalRegistrations, setPendingLocalRegistrations] = useState<PendingLocalRegistration[]>([]);
  const [view, setView] = useState<KeychainScreen>('list');
  const [focusedKeyId, setFocusedKeyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const identityHash = ctx?.identityHash ?? null;
  const semanticNamespace = ctx?.semanticNamespace ?? null;
  const session = ctx?.session ?? null;
  const transportOrigin = ctx?.transportOrigin ?? '';

  useEffect(() => {
    // signPayload is optional on SeedSession (not every session backend
    // supports signing) -- the keychain simply isn't available without it,
    // same as the unauthenticated case below.
    if (!identityHash || !semanticNamespace || !session?.signPayload) {
      setClient(null);
      return;
    }
    const signPayload = session.signPayload.bind(session);
    setClient(createKeychainClient({
      endpoint: transportOrigin,
      namespace: semanticNamespace,
      rootSigner: { identityHash, signPayload },
    }));
  }, [identityHash, semanticNamespace, session, transportOrigin]);

  const refresh = React.useCallback(async () => {
    if (!client) return;
    setKeys(await client.listKeys());
    setPendingLocalRegistrations(client.listPendingLocalRegistrations());
  }, [client]);

  useEffect(() => { refresh(); }, [refresh]);

  function pickUnlockedAdminKeyId(excludeKeyId?: string): string | null {
    const candidate = keys.find(
      (k) => k.keyId !== excludeKeyId && k.authorization === 'active' && k.localAvailability === 'available-unlocked' && k.admin,
    );
    return candidate?.keyId ?? null;
  }

  const backLink = (
    <LinkIconButton
      component={Link}
      to="/"
      aria-label="Back to .me"
      data-gui-node-id="CleakerKeychainView.back"
      sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
    >
      <Icon name="arrow_back" fontSize={18 as any} />
    </LinkIconButton>
  );

  if (!ctx?.authenticated || !client) {
    return (
      <Box
        data-gui-node-id="CleakerKeychainView"
        sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 3, py: 6, boxSizing: 'border-box' }}
      >
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          {backLink}
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sign in first to see your keychain.</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      data-gui-node-id="CleakerKeychainView"
      data-gui-component="CleakerKeychainView"
      sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 3, py: 6, boxSizing: 'border-box' }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {backLink}
        {notice && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 1 }}>{notice}</Typography>
        )}
        <CleakerKeychain
          handle={(semanticNamespace || '').split('.')[0] || ''}
          keys={keys}
          pendingLocalRegistrations={pendingLocalRegistrations}
          view={view}
          focusedKeyId={focusedKeyId}
          onNavigate={(next, targetId) => {
            setView(next);
            if (targetId !== undefined) setFocusedKeyId(targetId ?? null);
          }}
          onRequestUnlock={async (keyId, passphrase) => {
            const ok = await client.unlockKey(keyId, passphrase);
            setNotice(ok ? null : 'Wrong passphrase for that key.');
            await refresh();
          }}
          onSubmitAddKey={async (keyLabel, admin, passphrase) => {
            const actingKeyId = keys.length === 0 ? undefined : pickUnlockedAdminKeyId() ?? undefined;
            if (keys.length > 0 && !actingKeyId) {
              setNotice('Unlock an admin key on this device before adding a key.');
              setView('list');
              return;
            }
            const outcome = await client.generateAndRegisterKey({ label: keyLabel, admin, passphrase, actingKeyId });
            setNotice(outcome.ok ? null : `Registration failed (${outcome.error}) — kept locally, retry from the list.`);
            setView('list');
            await refresh();
          }}
          onRetryRegistration={async (publicKeyRaw) => {
            const outcome = await client.retryRegistration(publicKeyRaw);
            setNotice(outcome.ok ? null : `Retry failed (${outcome.error}).`);
            await refresh();
          }}
          onConfirmRevoke={async (targetKeyId) => {
            const actingKeyId = pickUnlockedAdminKeyId(targetKeyId) ?? pickUnlockedAdminKeyId();
            if (!actingKeyId) {
              setNotice('No unlocked admin key available to sign this revocation.');
              setView('list');
              return;
            }
            const outcome = await client.revokeKey(actingKeyId, targetKeyId);
            setNotice(outcome.ok ? null : `Revoke failed (${outcome.error}).`);
            setView('list');
            await refresh();
          }}
          onRecoverKeychain={async (recoverLabel, passphrase) => {
            const outcome = await client.recoverKeychain({ label: recoverLabel, passphrase });
            setNotice(outcome.ok ? null : `Recovery failed (${outcome.error}).`);
            setView('list');
            await refresh();
          }}
        />
      </Box>
    </Box>
  );
};

// The other side of the cross-origin claim redirect: a caller (e.g.
// netget's own claim page, on a DIFFERENT origin) sends the browser here
// with ?gatewayId&challenge&returnTo because it structurally cannot reach
// the keychain vault itself -- localStorage and the in-memory unlock cache
// are both strictly origin-scoped, so "sign this" can only ever happen on
// the origin that actually holds the keys. This view signs LOCALLY (via
// keychainClient's signWithKeychainKey -- no network call, no privateKey
// or passphrase ever leaves this origin) and redirects back to `returnTo`
// with only the resulting proof as query params.
//
// `returnTo` IS restricted, to exactly one origin: netget's own
// configured address, resolved the same way netgetSetupClient.ts's
// resolveCleakerOrigin() resolves the CLEAKER origin from the OTHER
// side, just mirrored -- a same-origin fetch to THIS page's own
// "/main-server-namespace" (local.netget and local.cleaker are
// different origins to the browser, but nginx's admin block routes
// every configured hostname to the SAME backend Express app, so this
// reaches netget's real config, not a guess). Never transportOrigin --
// that's wherever THIS Cleaker page itself loaded from, never netget's.
// Exact origin match only (protocol + host + port) -- never
// startsWith/prefix matching, and never trusting the query param on its
// own. A `returnTo` pointing anywhere else is
// refused outright, before any key is even listed, rather than merely
// warned about -- unlike the gatewayId/origin display below (which stays,
// as a second, human-readable check on top of this one, not instead of
// it).
//
// This view is NOT what binds the redirect to a specific outgoing setup
// attempt -- it just carries `state` through unchanged, exactly like
// `namespace`/`identityHash`/etc, never touching or inspecting it. The
// actual binding (does this `state` match the session that issued the
// challenge?) happens server-side in gatewaySetupSession.ts's
// commitSignedClaim, which is the only place with the stored value to
// compare against. `state` is also never part of the SIGNED payload
// (normalizeProofMessage(payload) below) -- it proves WHICH attempt this
// return belongs to, not WHAT is being claimed, so signing it would
// conflate two different guarantees for no benefit.
const CleakerNetgetClaimView: React.FC<CleakerLandingProps> = () => {
  const ctx = useOptionalSeedSessionContext();
  const [searchParams] = useSearchParams();
  const gatewayId = searchParams.get('gatewayId') || '';
  const challenge = searchParams.get('challenge') || '';
  const state = searchParams.get('state') || '';
  const returnTo = searchParams.get('returnTo') || '';

  const returnToUrl = React.useMemo(() => {
    try { return returnTo ? new URL(returnTo) : null; } catch { return null; }
  }, [returnTo]);

  const [client, setClient] = useState<KeychainClient | null>(null);
  const [keys, setKeys] = useState<KeychainKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const identityHash = ctx?.identityHash ?? null;
  const semanticNamespace = ctx?.semanticNamespace ?? null;
  const session = ctx?.session ?? null;
  const transportOrigin = ctx?.transportOrigin ?? '';

  // The ONE trusted destination. NOT derived from transportOrigin --
  // transportOrigin's origin is wherever THIS Cleaker page itself is
  // currently loaded from (e.g. local.cleaker), never netget's own
  // origin, so it can't answer "is this the real netget gateway".
  //
  // Instead this mirrors netgetSetupClient.ts's own resolveCleakerOrigin()
  // in reverse, and rests on ONE assumption specific to THIS repo's
  // deployment shape, not a general mesh guarantee: that local.netget and
  // local.cleaker, though different origins to the browser, are routed by
  // nginx's admin block to the SAME backend Express app (see
  // setNginxConfigRoutes.ts) -- so a same-origin fetch to THIS page's own
  // "/main-server-namespace" reaches that one shared backend and returns
  // the real `mainServerName` config, the same value resolveCleakerOrigin()
  // reads from the other side. If that assumption doesn't hold for some
  // deployment -- a genuinely separate Cleaker service with no shared
  // backend -- the fetch below fails or 404s, `allowedReturnOrigin` stays
  // null, and every claim redirect is refused. Fails closed, never open:
  // there is no fallback default here to fall back to.
  const [allowedReturnOrigin, setAllowedReturnOrigin] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${window.location.origin}/main-server-namespace`, { cache: 'no-store' });
        if (!res.ok) return;
        const body = await res.json().catch(() => null);
        const mainServerName = typeof body?.mainServerName === 'string' ? body.mainServerName.trim() : '';
        const isLocalMesh = !mainServerName || /^(localhost|127\.0\.0\.1|local|local\..+)$/i.test(mainServerName);
        // A value that already spells out a scheme is never produced by
        // a real deployment (mainServerName is always a bare hostname
        // there) -- passed through as-is only so disposable, port-based
        // test setups (this repo's own demo/claimFlow harness) can point
        // this at a genuinely separate localhost origin, the same
        // exception netgetSetupClient.ts's resolveCleakerOrigin() makes
        // on the other side.
        const netgetOrigin = isLocalMesh
          ? 'http://local.netget'
          : /^https?:\/\//i.test(mainServerName) ? mainServerName.replace(/\/+$/, '') : `https://${mainServerName}`;
        if (!cancelled) setAllowedReturnOrigin(new URL(netgetOrigin).origin);
      } catch {
        // Leave allowedReturnOrigin null -- returnTo stays refused.
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const returnToAuthorized = !!returnToUrl && !!allowedReturnOrigin && returnToUrl.origin === allowedReturnOrigin;

  useEffect(() => {
    if (!identityHash || !semanticNamespace || !session?.signPayload) {
      setClient(null);
      return;
    }
    const signPayload = session.signPayload.bind(session);
    setClient(createKeychainClient({
      endpoint: transportOrigin,
      namespace: semanticNamespace,
      rootSigner: { identityHash, signPayload },
    }));
  }, [identityHash, semanticNamespace, session, transportOrigin]);

  const refresh = React.useCallback(async () => {
    if (!client) return;
    setKeys(await client.listKeys());
  }, [client]);

  useEffect(() => { refresh(); }, [refresh]);

  const activeKeys = keys.filter((k) => k.authorization === 'active');
  const selectedKey = activeKeys.find((k) => k.keyId === selectedKeyId) ?? null;

  async function handleSignAndReturn() {
    // Defense in depth, not the primary gate -- the render logic below
    // already refuses to reach this button at all when returnToAuthorized
    // is false. Re-checked here too since this is the one function that
    // actually performs the redirect.
    if (!client || !selectedKey || !identityHash || !semanticNamespace || !state || !returnToUrl || !returnToAuthorized) return;
    setSigning(true);
    setNotice(null);
    try {
      if (selectedKey.localAvailability !== 'available-unlocked') {
        const unlocked = await client.unlockKey(selectedKey.keyId, unlockPassphrase);
        if (!unlocked) {
          setNotice('Wrong passphrase for that key.');
          setSigning(false);
          return;
        }
      }
      const timestamp = Date.now();
      const payload = {
        op: 'netget-claim-gateway',
        gatewayId,
        namespace: semanticNamespace,
        identityHash,
        keyId: selectedKey.keyId,
        challenge,
        timestamp,
      };
      const signature = await client.signWithKeychainKey(selectedKey.keyId, normalizeProofMessage(payload));

      const target = new URL(returnToUrl.toString());
      target.searchParams.set('namespace', semanticNamespace);
      target.searchParams.set('identityHash', identityHash);
      target.searchParams.set('keyId', selectedKey.keyId);
      target.searchParams.set('signature', signature);
      target.searchParams.set('timestamp', String(timestamp));
      target.searchParams.set('state', state);
      window.location.href = target.toString();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Signing failed.');
      setSigning(false);
    }
  }

  const shellSx = { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', px: 3, py: 6, boxSizing: 'border-box' as const };

  if (!gatewayId || !challenge || !state || !returnTo || !returnToUrl) {
    return (
      <Box data-gui-node-id="CleakerNetgetClaimView" sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            This link is missing required claim details. Go back to your gateway's setup page and try again.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Checked before authentication, and before anything about the key
  // picker renders at all -- an untrusted returnTo is refused outright,
  // never merely flagged alongside a working sign flow.
  if (!returnToAuthorized) {
    return (
      <Box data-gui-node-id="CleakerNetgetClaimView" sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            This link would return your signed claim to an untrusted destination ({returnToUrl.origin}) and has been
            blocked. Go back to your gateway's setup page and try again.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!ctx?.authenticated || !client) {
    // role=cleaker/monad=... only matter to this repo's own
    // demo/claimFlow.main.tsx harness (two roles served from the same
    // bundle on two ports, disambiguated by query params since there's
    // no separate real hostname or SeedSessionProvider config in that
    // setup) -- harmless and unread by any real deployment, where
    // local.cleaker is its own actual host with its own fixed
    // transportOrigin. Carried through here so signing in doesn't
    // silently fall back to that demo's default monad origin, which
    // is what the earlier version of this link did.
    const carryParams = new URLSearchParams();
    carryParams.set('next', window.location.href);
    carryParams.set('role', 'cleaker');
    const currentMonadParam = new URLSearchParams(window.location.search).get('monad');
    if (currentMonadParam) carryParams.set('monad', currentMonadParam);
    const signInHref = `/?${carryParams.toString()}`;
    return (
      <Box data-gui-node-id="CleakerNetgetClaimView" sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>Sign in first to claim this gateway.</Typography>
          <Typography component="a" href={signInHref} variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
            Sign in →
          </Typography>
        </Box>
      </Box>
    );
  }

  let returnToOrigin = returnTo;
  try { returnToOrigin = new URL(returnTo).origin; } catch { /* keep raw string as a fallback */ }

  return (
    <Box
      data-gui-node-id="CleakerNetgetClaimView"
      data-gui-component="CleakerNetgetClaimView"
      sx={shellSx}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Claim gateway</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Signing as <strong>{semanticNamespace}</strong> for gateway <strong>{gatewayId}</strong>, returning to{' '}
          <strong>{returnToOrigin}</strong>.
        </Typography>

        {notice && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 1 }}>{notice}</Typography>
        )}

        {activeKeys.length === 0 ? (
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              No active keychain key available on this device. Add one from your keychain, then come back here (your browser's back button returns to this exact page).
            </Typography>
            <Typography component={Link} to="/keychain" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
              Open keychain →
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {activeKeys.map((k) => (
              <Box
                key={k.keyId}
                onClick={() => setSelectedKeyId(k.keyId)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1px solid', borderColor: k.keyId === selectedKeyId ? 'primary.main' : 'divider',
                  borderRadius: 1, px: 1.5, py: 1, cursor: 'pointer',
                }}
              >
                <Typography variant="body2">{k.label || k.keyId}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {k.localAvailability === 'available-unlocked' ? 'unlocked' : 'locked'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {selectedKey && selectedKey.localAvailability !== 'available-unlocked' && (
          <TextField
            type="password"
            label="Passphrase"
            size="small"
            fullWidth
            value={unlockPassphrase}
            onChange={(e) => setUnlockPassphrase(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

        <Button
          disabled={!selectedKey || signing}
          onClick={handleSignAndReturn}
          data-gui-node-id="CleakerNetgetClaimView.confirm"
        >
          {signing ? 'Signing…' : 'Sign and continue'}
        </Button>
      </Box>
    </Box>
  );
};

// me.netget.mainserver.logs' own sign-in — same cross-origin shape as
// CleakerNetgetClaimView right above (a real Ed25519 signature can only
// ever happen where the keychain actually lives), but for a much lower-
// stakes action: proving "I am this already-registered admin, right
// now" to unlock a real session token, not becoming an owner. Genuinely
// simpler than the claim flow because of that: no server-issued
// challenge arrives via the URL (there's no claim-challenge concept for
// this action at all) -- this view fetches its OWN challenge from
// netget directly, cross-origin, once it knows which identity is
// signing, and can also exchange the signature for a session token
// itself in the same cross-origin round trip, so only one opaque,
// short-lived, non-secret value (the session token) ever has to travel
// back through the URL -- never a raw signature or challenge.
const CleakerNetgetAdminSignView: React.FC<CleakerLandingProps> = () => {
  const ctx = useOptionalSeedSessionContext();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  // Anti mix-up token — same role, same non-secret handling as
  // gatewaySetupSession.ts's own `state` for the claim flow (see that
  // file's own comment on SetupSessionRecord.state for the full
  // reasoning): minted by whoever started this attempt (LogsView, client-
  // side — there is no server-side "waiting session" here the way the
  // claim flow has one), carried through this view UNCHANGED, never
  // inspected or signed. Its OWN check happens back where it was minted
  // (LogsView, against what it stored before redirecting here) — this
  // view's only job is to not lose it in transit.
  const state = searchParams.get('state') || '';

  const returnToUrl = React.useMemo(() => {
    try { return returnTo ? new URL(returnTo) : null; } catch { return null; }
  }, [returnTo]);

  const [client, setClient] = useState<KeychainClient | null>(null);
  const [keys, setKeys] = useState<KeychainKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const identityHash = ctx?.identityHash ?? null;
  const semanticNamespace = ctx?.semanticNamespace ?? null;
  const session = ctx?.session ?? null;
  const transportOrigin = ctx?.transportOrigin ?? '';

  // Identical reasoning and identical check as CleakerNetgetClaimView's
  // own allowedReturnOrigin above -- see that one's comment for the full
  // explanation of why this is a same-origin fetch to THIS page's own
  // "/main-server-namespace", never derived from transportOrigin. Kept
  // as its own effect rather than a shared hook: this is the only other
  // place in this file that needs it, and duplicating ~20 lines once is
  // clearer than a premature shared abstraction for two call sites.
  const [allowedReturnOrigin, setAllowedReturnOrigin] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${window.location.origin}/main-server-namespace`, { cache: 'no-store' });
        if (!res.ok) return;
        const body = await res.json().catch(() => null);
        const mainServerName = typeof body?.mainServerName === 'string' ? body.mainServerName.trim() : '';
        const isLocalMesh = !mainServerName || /^(localhost|127\.0\.0\.1|local|local\..+)$/i.test(mainServerName);
        const netgetOrigin = isLocalMesh
          ? 'http://local.netget'
          : /^https?:\/\//i.test(mainServerName) ? mainServerName.replace(/\/+$/, '') : `https://${mainServerName}`;
        if (!cancelled) setAllowedReturnOrigin(new URL(netgetOrigin).origin);
      } catch {
        // Leave allowedReturnOrigin null -- returnTo, and the cross-origin
        // challenge/verify calls below, stay refused.
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const returnToAuthorized = !!returnToUrl && !!allowedReturnOrigin && returnToUrl.origin === allowedReturnOrigin;

  useEffect(() => {
    if (!identityHash || !semanticNamespace || !session?.signPayload) {
      setClient(null);
      return;
    }
    const signPayload = session.signPayload.bind(session);
    setClient(createKeychainClient({
      endpoint: transportOrigin,
      namespace: semanticNamespace,
      rootSigner: { identityHash, signPayload },
    }));
  }, [identityHash, semanticNamespace, session, transportOrigin]);

  const refresh = React.useCallback(async () => {
    if (!client) return;
    setKeys(await client.listKeys());
  }, [client]);

  useEffect(() => { refresh(); }, [refresh]);

  const activeKeys = keys.filter((k) => k.authorization === 'active');
  const selectedKey = activeKeys.find((k) => k.keyId === selectedKeyId) ?? null;

  async function handleSignAndReturn() {
    if (!client || !selectedKey || !identityHash || !returnToUrl || !returnToAuthorized || !allowedReturnOrigin) return;
    setSigning(true);
    setNotice(null);
    try {
      if (selectedKey.localAvailability !== 'available-unlocked') {
        const unlocked = await client.unlockKey(selectedKey.keyId, unlockPassphrase);
        if (!unlocked) {
          setNotice('Wrong passphrase for that key.');
          setSigning(false);
          return;
        }
      }

      const challengeRes = await fetch(`${allowedReturnOrigin}/admin-session/challenge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identityHash }),
      });
      const challengeBody = await challengeRes.json().catch(() => null);
      if (!challengeRes.ok || !challengeBody?.challenge) {
        setNotice(challengeBody?.message || 'This identity is not a registered admin of that gateway.');
        setSigning(false);
        return;
      }

      // Signs the raw challenge string directly -- adminSession.ts
      // verifies against exactly this, deliberately not a canonicalized
      // payload object the way the claim flow's normalizeProofMessage is:
      // there is no separate "what is being claimed" to bind alongside
      // "who is proving it," so there is nothing to canonicalize.
      const signature = await client.signWithKeychainKey(selectedKey.keyId, challengeBody.challenge);

      const verifyRes = await fetch(`${allowedReturnOrigin}/admin-session/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identityHash, namespace: semanticNamespace, keyId: selectedKey.keyId, signature }),
      });
      const verifyBody = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok || !verifyBody?.sessionToken) {
        setNotice(verifyBody?.message || 'Could not verify that signature.');
        setSigning(false);
        return;
      }

      const target = new URL(returnToUrl.toString());
      if (state) target.searchParams.set('state', state);
      target.searchParams.set('adminSessionToken', verifyBody.sessionToken);
      window.location.href = target.toString();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Signing failed.');
      setSigning(false);
    }
  }

  const shellSx = { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', px: 3, py: 6, boxSizing: 'border-box' as const };

  if (!returnTo || !returnToUrl) {
    return (
      <Box data-gui-node-id="CleakerNetgetAdminSignView" sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            This link is missing where to return to. Go back to the page that sent you here and try again.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!returnToAuthorized) {
    return (
      <Box data-gui-node-id="CleakerNetgetAdminSignView" sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            This link would return your session to an untrusted destination
            {returnToUrl ? ` (${returnToUrl.origin})` : ''} and has been blocked.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!ctx?.authenticated || !client) {
    const carryParams = new URLSearchParams();
    carryParams.set('next', window.location.href);
    carryParams.set('role', 'cleaker');
    const currentMonadParam = new URLSearchParams(window.location.search).get('monad');
    if (currentMonadParam) carryParams.set('monad', currentMonadParam);
    const signInHref = `/?${carryParams.toString()}`;
    return (
      <Box data-gui-node-id="CleakerNetgetAdminSignView" sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>Sign in first to continue as an admin.</Typography>
          <Typography component="a" href={signInHref} variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
            Sign in →
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      data-gui-node-id="CleakerNetgetAdminSignView"
      data-gui-component="CleakerNetgetAdminSignView"
      sx={shellSx}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Confirm admin session</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Signing as <strong>{semanticNamespace}</strong>.
        </Typography>

        {notice && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 1 }}>{notice}</Typography>
        )}

        {activeKeys.length === 0 ? (
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              No active keychain key available on this device. Add one from your keychain, then come back here (your browser's back button returns to this exact page).
            </Typography>
            <Typography component={Link} to="/keychain" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
              Open keychain →
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {activeKeys.map((k) => (
              <Box
                key={k.keyId}
                onClick={() => setSelectedKeyId(k.keyId)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1px solid', borderColor: k.keyId === selectedKeyId ? 'primary.main' : 'divider',
                  borderRadius: 1, px: 1.5, py: 1, cursor: 'pointer',
                }}
              >
                <Typography variant="body2">{k.label || k.keyId}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {k.localAvailability === 'available-unlocked' ? 'unlocked' : 'locked'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {selectedKey && selectedKey.localAvailability !== 'available-unlocked' && (
          <TextField
            type="password"
            label="Passphrase"
            size="small"
            fullWidth
            value={unlockPassphrase}
            onChange={(e) => setUnlockPassphrase(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

        <Button
          disabled={!selectedKey || signing}
          onClick={handleSignAndReturn}
          data-gui-node-id="CleakerNetgetAdminSignView.confirm"
        >
          {signing ? 'Signing…' : 'Sign and continue'}
        </Button>
      </Box>
    </Box>
  );
};

const CleakerRoutes: React.FC<CleakerLandingProps> = (props) => (
  <Routes>
    <Route path="/" element={<CleakerLandingHome {...props} />} />
    <Route path="/users" element={<CleakerUsersView {...props} />} />
    <Route path="/blockchain" element={<CleakerBlockchainView {...props} />} />
    <Route path="/url" element={<CleakerUrlView {...props} />} />
    <Route path="/keychain" element={<CleakerKeychainView {...props} />} />
    <Route path="/keychain/claim" element={<CleakerNetgetClaimView {...props} />} />
    <Route path="/keychain/admin-sign" element={<CleakerNetgetAdminSignView {...props} />} />
  </Routes>
);

// CleakerLanding is meant to be dropped in as an entire page (see the file
// header), so it owns its own routing rather than depending on a host app
// to already have one — but it can't just always wrap itself in a fresh
// <BrowserRouter>: react-router v6 throws if a <Router> renders inside
// another Router's context, and this component IS rendered inside one
// already in at least one real place — Storybook's own global decorator
// wraps every story in <MemoryRouter> (.storybook/preview.tsx), and
// CleakerLanding is no exception. useInRouterContext() detects that case
// and reuses the ambient router (MemoryRouter in Storybook, or whatever a
// future host provides) instead of nesting a second one; only a truly
// standalone render (netget's real App.jsx today — CleakerLanding renders
// as a SIBLING of netget's own <Router>, not nested inside it) gets its
// own <BrowserRouter>.
const CleakerLanding: React.FC<CleakerLandingProps> = (props) => {
  const inRouterContext = useInRouterContext();
  if (inRouterContext) return <CleakerRoutes {...props} />;
  return (
    <BrowserRouter>
      <CleakerRoutes {...props} />
    </BrowserRouter>
  );
};

export default CleakerLanding;
