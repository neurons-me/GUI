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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useOptionalSeedSession } from '@/react/session/useSeedSession';
import { writeKernelThemeFacts, type SeedSession } from '@/core/session/createSeedSession';
import { setGuiLocalKernel } from '@/runtime/guiLocalKernel';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { useRegisterGuiNode, useRegisterGuiNodes } from '@/runtime/selection';
import { flattenGuiDocument, renderGuiDocumentPage, mergeGuiDocument, leftBarSlots, GUI_DOCUMENT, type GuiDocument } from '@/runtime/guiDocument';
import CleakerKeychain, { type PendingLocalRegistration } from '@/gui/All.This/Cleaker/Keychain/CleakerKeychain';
import { createKeychainClient, type KeychainClient } from '@/gui/All.This/Cleaker/Keychain/keychainClient';
import type { KeychainKey, KeychainView as KeychainScreen } from '@/gui/All.This/Cleaker/Keychain/keychainState';
import Layout from '@/gui/Layout/Layout';
import { useCleakerRootSidebar } from './cleakerNavigationComposition';
import { useVerifiedCleakerRoot, pickRootTransport, type CleakerRootSeed, type CleakerRootStatus, probeNetgetGateway } from './verifiedCleakerRoot';
import { useMeLauncherView } from './MeLauncher';
import { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import { makeDefaultResolvers } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import type { NamespaceChannel, ResolutionState } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';
import RegisterMe from './RegisterMe';
import RecoverAccount from './RecoverAccount';
import MainServerView from '@/gui/All.This/netget/MainServer/MainServerView';
import GatewaySetup from '@/gui/All.This/netget/Setup/GatewaySetup';
import { createNetgetSetupClient } from '@/gui/All.This/netget/Setup/netgetSetupClient';
import { isOwnGatewayOrigin } from '@/gui/All.This/netget/Setup/trustedOrigin';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import DevToolsLauncher from '@/runtime/DevToolsLauncher';

interface DirectoryUser {
  username: string;
  profileImg?: string | null;
}

export interface CleakerLandingProps {
  sx?: any;
  /**
   * The real namespace root this component binds to, e.g.
   * "http://local.cleaker". Optional in the type for flexibility, but
   * effectively required: omitting it throws CLEAKER_ENDPOINT_REQUIRED at
   * render time rather than guessing from window.location (see
   * requireCleakerEndpoint's own doc comment) — this component has no
   * reliable way to know it's being self-hosted by the origin it should
   * bind to versus embedded somewhere else entirely.
   */
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
  /**
   * Parts an app adds on top of the root GUI's document (pages and left-bar elements). The shell is the one
   * GUI: an app such as netget declares its own pages here instead of being a second application.
   */
  document?: GuiDocument;
  /** Components the added parts name (`component`), by that name. Merged over the shell's own. */
  pages?: Record<string, React.ComponentType<any>>;
}

// No hardcoded root here on purpose — cleaker.me/local.cleaker were never
// structurally special, just two values `cleakerEndpoint` happened to hold
// in this session's dev environment (see SetChemistry.findings.md's
// "generalizes past 2" note). Every REAL caller today already passes
// `cleakerEndpoint` explicitly (netget's App.jsx, every Storybook story,
// every demo pilot) — window.location was never actually load-bearing, it
// was a silent guess sitting behind an `||` that happened to agree with
// reality only because this component has so far only ever been mounted
// as the whole page, self-hosted by the exact origin it names. That
// coincidence breaks the moment this same component is mounted somewhere
// that ISN'T the namespace it should bind to — an embedded script on an
// unrelated third-party page (e.g. inserted into a Wikipedia article) is
// the clearest case: window.location would name that OTHER site, and this
// used to silently bind there instead, with no error, no warning, just a
// wrong namespace resolved with total confidence. Same principle as
// cleaker's own `confirmedNamespace` fix (binder.ts): never let a guess
// this consequential stand in for a value the caller can simply be
// required to supply. `cleakerEndpoint` stays optional in the TS type
// (existing callers, external consumers) — this is the runtime guard.
function requireCleakerEndpoint(cleakerEndpoint: string | undefined): string {
  const explicit = String(cleakerEndpoint || '').trim();
  if (explicit) return explicit;
  throw new Error(
    'CLEAKER_ENDPOINT_REQUIRED: this component needs an explicit `cleakerEndpoint` prop -- ' +
    'it never guesses one from window.location. Pass the real namespace root it should bind ' +
    'to (e.g. "http://local.cleaker"), even when this page happens to be self-hosted from ' +
    'that same origin.'
  );
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

// Same mixed-content fix as rootSeed's own derivation below (see
// CleakerLayoutShell): when the namespace being resolved IS the host this
// page is already loaded from, trust window.location's own scheme over a
// guessed https -- probing a scheme this page didn't actually load over
// is indistinguishable from the destination being down.
//
// Also matches a SUB-identity of the current host (namespace ends with
// ".<hostname>"), not just an exact match -- this is what beatleExpression
// resolves to once authenticated (the signed-in identity's OWN
// semanticNamespace, e.g. "jabellae.local.cleaker"), and that identity's
// data lives on the exact same origin the page is already on (one monad
// holds every users.<handle>.* branch under its own root -- see CLAUDE.md's
// namespaceToKernelPrefix). The old exact-match-only check sent this case
// down the `https://${namespace}` guess instead, assuming every namespace
// gets its own separately-resolvable DNS subdomain (true for a real
// wildcard-DNS SaaS deployment, false here) -- confirmed live:
// ERR_NAME_NOT_RESOLVED against "jabellae.local.cleaker" the moment Beatle
// auto-connected to the just-signed-in identity, since no such host was
// ever registered, only the bare root.
function cleakerEndpointForNamespace(namespace: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === namespace || namespace.endsWith(`.${host}`)) {
      return window.location.origin;
    }
  }
  return `https://${namespace}`;
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

// Local extensions of CleakerLandingProps (like the removed `destination`
// prop before them), not a change to that shared, exported type -- only
// CleakerLayoutShell supplies these, wiring Beatle's own resolution into
// the SAME shared context the sidebar and /netget read from, instead of
// independently-drifting "current root" facts. onBeatleNamespaceResolved:
// see handleBeatleConnect below and verifiedCleakerRoot.ts's `promote`.
// sharedRootStatus: the shared context's OWN in-flight/settled status, so
// the QR can wait for that re-verification instead of reporting success
// the instant Beatle's own (weaker) mesh resolution does.
// Handed in by the renderer (renderGuiDocumentPage): the document path a page
// was declared at. Defaults keep each page usable on its own.
type DocumentPageProps = CleakerLandingProps & {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
};

type CleakerLandingHomeProps = DocumentPageProps & {
  onBeatleNamespaceResolved?: (namespace: string) => void;
  sharedRootStatus?: CleakerRootStatus;
};

// The ONE root of this page's Inspector tree. `GUI` is the same branch name
// writeKernelWindowLocation/writeKernelThemeFacts already write into `.me`
// (GUI.window.location, GUI.theme.*) -- the tree the Inspector shows and
// the kernel branch share one name, so "everything hangs under GUI" is
// literally true of both. Only the ROOT carries provenance: children are
// render containers, not values. The provenance itself is real -- the
// monad's own answer (its /__surface identity + signed claim, via
// useVerifiedCleakerRoot), not text we wrote about it. Data-driven nodes
// (BlocksTable rows etc.) hang from GUI in the render tree but their data
// lives in the namespace, not under GUI.
const GUI_ROOT_ID = 'GUI';
// 'monad:d8bb83d5e71a…' (64 hex) -> 'monad:d8bb83d5…dab6d0': recognisable, readable.
function shortMonadId(id: string): string {
  const m = /^(monad:)?([0-9a-f]{20,})$/i.exec(String(id || ''));
  return m ? `${m[1] ?? ''}${m[2].slice(0, 8)}…${m[2].slice(-6)}` : String(id || '');
}
// Where the GUI document (runtime/GUI.document.json) declares the landing page.
const LANDING_ID = 'GUI.content.landing';

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

// Local mirror only -- same "GUI.*" branch, same reasoning as
// writeKernelWindowLocation (createSeedSession.ts): a plain instance fact,
// not a synced/signed write. localStorage (this.gui's own Theme.tsx) stays
// the real, always-available store, including with no session at all --
// this only ever ADDS a reflection into the active `me`, on top of that,
// whenever both a session and a theme choice exist. Renders nothing; pure
// effect. Not the write-and-subscribe shape LiveOwnProfile uses (that's
// for a namespace-scoped, signed, cross-device fact -- this is neither).
const ThemeKernelMirror: React.FC<{ session: SeedSession | null }> = ({ session }) => {
  const { themeId, mode } = useThemeContext();

  // The tab's own kernel, where GUI.window.* and GUI.theme.* are written, is
  // what the Inspector's Explain asks first for GUI paths (read-only).
  useEffect(() => {
    const me = session?.me;
    if (!me) return;
    setGuiLocalKernel(me);
    return () => setGuiLocalKernel(null, me);
  }, [session]);

  useEffect(() => {
    if (!session?.me || !themeId) return;
    writeKernelThemeFacts(session.me, themeId, mode);
  }, [session, themeId, mode]);

  return null;
};

// The directory search. It belongs to the TOP of the GUI (GUI.bars.top.search),
// not to any one page: fixed to the top-right corner, it comes from above
// every route. Filtering is the only piece specific to it -- collapse, expand,
// focus and the results dropdown live in SearchField (a generic Molecule);
// this supplies the live directory (netget's own monad: every claim made
// through here, whichever root it was made under) and where a pick goes.
// Filtered client-side -- the list is small enough that a real search
// endpoint would be overbuilding it.
const CleakerTopSearch: React.FC<{ cleakerEndpoint?: string; netgetMonadOrigin?: string }> = ({ cleakerEndpoint, netgetMonadOrigin }) => {
  const resolvedEndpoint = requireCleakerEndpoint(cleakerEndpoint);
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

  return (
    <Box sx={{ position: 'fixed', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 20 }}>
      <SearchField
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchMatches}
        onSelectResult={visitUser}
        placeholder="Search .me"
        ariaLabel="Search .me"
        data-gui-node-id="GUI.bars.top.search"
      />
    </Box>
  );
};

const CleakerLandingHome: React.FC<CleakerLandingHomeProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin, onBeatleNamespaceResolved, sharedRootStatus = 'checking', 'data-gui-node-id': nodeId = LANDING_ID, 'data-gui-component': nodeComponent = 'Landing' }) => {
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
  const qrStatusLabel = beatleState === 'idle' || beatleState === 'disconnected' ? '' : BEATLE_STATE_LABEL[beatleState];

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
  // above), called directly instead of through that component. Flagged
  // live, twice, as still showing SOMETHING under the QR no matter how
  // small ("porque sigues poniendo al escarabajo") after a bar-with-text,
  // then an icon-only bubble, both still duplicated what the QR's own
  // perimeter already displays. "Solo queremos el QR" is literal: no
  // separate control, icon, or box of any kind -- so the channel now
  // opens on its own, the moment there's an expression to open (mount,
  // and again whenever beatleExpression itself changes), rather than
  // waiting on a tap that had nowhere left to live.
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
        minHeight: '100vh',
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
          in the shared sidebar -- see CleakerLayoutShell below, which
          mounts the real Layout/LeftBar around this whole route tree.
          Removed from here entirely rather than duplicated. */}

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
            {/* Keychain moved to the shared sidebar (CleakerLayoutShell,
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

// The other half of the /users route — same minimal chrome as the home
// view (centered column, no Layout sidebars), reusing UsersTable (already
// the real public-claims-directory component, see its own doc comment)
// rather than building a second directory view. namespaceRootUrl is
// deliberately separate from endpoint (the API to fetch FROM, netget's own
// monad) — reusing endpoint as the display root was exactly the bug this
// session already found and fixed in UsersTable's own Storybook story.
const CleakerUsersView: React.FC<DocumentPageProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin, 'data-gui-node-id': nodeId = 'GUI.content.users', 'data-gui-component': nodeComponent = 'Users' }) => {
  // Declared by the GUI document (GUI.content.users), not registered by a hook.
  const resolvedEndpoint = requireCleakerEndpoint(cleakerEndpoint);
  const namespaceRootLabel = useMemo(
    () => deriveNamespaceRootLabel(resolvedEndpoint),
    [resolvedEndpoint],
  );

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      // pt: clear the search, fixed at the top-right of every route.
      sx={{ p: 3, pt: 9, width: '100%', boxSizing: 'border-box', ...sx }}
    >
      <UsersTable
        endpoint={getNetgetMonadOrigin(netgetMonadOrigin)}
        namespaceRootUrl={resolvedEndpoint}
        namespaceLabel={namespaceRootLabel}
        data-gui-node-id={`${nodeId}.table`}
      />
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
const CleakerBlockchainView: React.FC<DocumentPageProps> = ({ sx, cleakerEndpoint, netgetMonadOrigin, 'data-gui-node-id': nodeId = 'GUI.content.blockchain', 'data-gui-component': nodeComponent = 'Blockchain' }) => {
  // Declared by the GUI document (GUI.content.blockchain), not registered by a hook.
  const resolvedEndpoint = requireCleakerEndpoint(cleakerEndpoint);
  const namespaceRootLabel = useMemo(
    () => deriveNamespaceRootLabel(resolvedEndpoint),
    [resolvedEndpoint],
  );

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      // pt: clear the search, fixed at the top-right of every route.
      sx={{ p: 3, pt: 9, width: '100%', boxSizing: 'border-box', ...sx }}
    >
      <BlocksTable
        endpoint={getNetgetMonadOrigin(netgetMonadOrigin)}
        namespaceRootUrl={resolvedEndpoint}
        namespaceLabel={namespaceRootLabel}
        data-gui-node-id={`${nodeId}.table`}
      />
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
const CleakerUrlView: React.FC<DocumentPageProps> = ({ sx, cleakerEndpoint, 'data-gui-node-id': nodeId = 'GUI.content.url', 'data-gui-component': nodeComponent = 'Url' }) => {
  const resolvedEndpoint = requireCleakerEndpoint(cleakerEndpoint);
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
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      sx={{ p: 3, width: '100%', maxWidth: 480, boxSizing: 'border-box', ...sx }}
    >
      <Typography variant="h5" data-gui-node-id={`${nodeId}.heading`} sx={{ fontWeight: 700, mb: 2 }}>
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
          data-gui-node-id={`${nodeId}.input`}
        />
        <Box
          component="button"
          type="button"
          onClick={handleSubmit}
          data-gui-node-id={`${nodeId}.submit`}
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
  );
};

// The other half of "Keychain" above — real signing keys for the real
// authenticated identity, not a mock. Reuses keychainClient.ts exactly as
// demo/main.tsx (packages/GUI/Typescript/demo/) does, except the signer
// comes from the ambient SeedSessionProvider already wrapping this whole
// tree instead of a hardcoded demo phrase, and the endpoint is whatever
// transportOrigin the session itself claimed/opened against — never a
// second, separately-configured origin to keep in sync.
const CleakerKeychainView: React.FC<DocumentPageProps> = ({ 'data-gui-node-id': nodeId = 'GUI.content.keychain', 'data-gui-component': nodeComponent = 'Keychain' }) => {
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

  if (!ctx?.authenticated || !client) {
    return (
      <Box data-gui-node-id={nodeId} data-gui-component={nodeComponent} sx={{ p: 3, width: '100%', maxWidth: 480, boxSizing: 'border-box' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sign in first to see your keychain.</Typography>
      </Box>
    );
  }

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      sx={{ p: 3, width: '100%', maxWidth: 480, boxSizing: 'border-box' }}
    >
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
            // eslint-disable-next-line no-console
            console.debug('[keychain] onSubmitAddKey:validating', { label: keyLabel, admin, existingKeyCount: keys.length });
            const actingKeyId = keys.length === 0 ? undefined : pickUnlockedAdminKeyId() ?? undefined;
            if (keys.length > 0 && !actingKeyId) {
              // eslint-disable-next-line no-console
              console.debug('[keychain] onSubmitAddKey:no-unlocked-admin-key');
              setNotice('Unlock an admin key on this device before adding a key.');
              setView('list');
              return;
            }
            const outcome = await client.generateAndRegisterKey({ label: keyLabel, admin, passphrase, actingKeyId });
            // eslint-disable-next-line no-console
            console.debug('[keychain] onSubmitAddKey:outcome', { ok: outcome.ok, status: outcome.status, error: outcome.error });
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
const CleakerNetgetClaimView: React.FC<DocumentPageProps> = ({ 'data-gui-node-id': nodeId = 'GUI.content.netget.claim', 'data-gui-component': nodeComponent = 'Claim' }) => {
  const ctx = useOptionalSeedSessionContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // Authorized against the ONE record that actually knows the answer --
  // the live setup session itself (verifyClaimCallback, gatewaySetupSession.ts)
  // -- not a client-side guess at "what netget's origin should be."
  //
  // Flagged live, correctly, that an earlier version of this check (just
  // `returnToUrl.origin === window.location.origin`) proved too little:
  // matching the CURRENT page's own origin only shows the browser hasn't
  // been redirected somewhere else since loading THIS page -- it says
  // nothing about whether THIS SPECIFIC returnTo (this exact path, for
  // this exact setup attempt) is the one the session actually recorded at
  // /setup/challenge time, as opposed to some other allowed-looking value
  // substituted in afterward. Querying the session directly closes that
  // gap for both deployment shapes at once (embedded same-origin AND a
  // genuinely separate netget origin) with one mechanism instead of two
  // guesses -- see verifyClaimCallback's own doc comment for the full
  // reasoning, including why it also catches a returnTo tampered with
  // after the session was created.
  //
  // Queried relative to `window.location.origin`: in this repo's actual
  // deployment shape, local.cleaker and local.netget are routed by
  // nginx's admin block to the SAME backend Express app (see
  // setNginxConfigRoutes.ts), so a same-origin fetch from wherever this
  // page loaded reaches the one backend that holds this session's own
  // record either way. A genuinely separate, non-shared-backend
  // deployment has no path to that record from here at all -- the fetch
  // fails, and this stays `false`. Fails closed, never open: there is no
  // fallback default to fall back to.
  const [returnToAuthorized, setReturnToAuthorized] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!returnToUrl || !state) { setReturnToAuthorized(false); return; }
    (async () => {
      try {
        const res = await fetch(`${window.location.origin}/setup/verify-callback`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ state, returnOrigin: returnToUrl.origin, returnPath: returnToUrl.pathname }),
        });
        const body = await res.json().catch(() => null);
        if (!cancelled) setReturnToAuthorized(res.ok && body?.ok === true);
      } catch {
        if (!cancelled) setReturnToAuthorized(false);
      }
    })();
    return () => { cancelled = true; };
  }, [returnToUrl, state]);

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
      if (target.origin === window.location.origin) {
        // The claim was started, and is signed, at THIS origin: go back inside the app. A full
        // page load here drops the in-memory session, and the person lands signed out.
        navigate(`${target.pathname}${target.search}${target.hash}`);
      } else {
        window.location.href = target.toString();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Signing failed.');
      setSigning(false);
    }
  }

  const shellSx = { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', px: 3, py: 6, boxSizing: 'border-box' as const };

  if (!gatewayId || !challenge || !state || !returnTo || !returnToUrl) {
    return (
      <Box data-gui-node-id={nodeId} sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            This link is missing required claim details. Go back to your gateway's setup page and try again.
          </Typography>
        </Box>
      </Box>
    );
  }

  // `returnToAuthorized` is null while the server round-trip above is
  // still in flight -- shown as a neutral, brief wait rather than
  // flashing the "blocked" message first and then replacing it once the
  // real answer comes back.
  if (returnToAuthorized === null) {
    return (
      <Box data-gui-node-id={nodeId} sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Verifying this claim link…
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
      <Box data-gui-node-id={nodeId} sx={shellSx}>
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
      <Box data-gui-node-id={nodeId} sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>Sign in first to claim this gateway.</Typography>
          <Typography component="a" data-gui-node-id={`${nodeId}.signin`} href={signInHref} variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
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
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      sx={shellSx}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Typography variant="h6" data-gui-node-id={`${nodeId}.heading`} sx={{ mb: 1 }}>Claim gateway</Typography>
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
            data-gui-node-id={`${nodeId}.passphrase`}
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
          data-gui-node-id={`${nodeId}.confirm`}
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
const CleakerNetgetAdminSignView: React.FC<DocumentPageProps> = ({ 'data-gui-node-id': nodeId = 'GUI.content.netget.sign', 'data-gui-component': nodeComponent = 'Sign' }) => {
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

  // Two DIFFERENT jobs, easy to conflate: (1) this resolves WHERE to send
  // the cross-origin admin-session calls below (netget's own origin) --
  // still needed as a fetch target regardless of trust; (2) whether that
  // destination is trustworthy at all. This flow has no server-side
  // "waiting session" until a challenge is actually requested (unlike
  // CleakerNetgetClaimView's gatewaySetupSession.ts-backed one), so there
  // is nothing for an upfront, verified check to consult yet -- the real
  // trust decision instead happens where a genuine session record DOES
  // exist: adminSession.ts commits each challenge to the exact
  // returnOrigin/returnPath supplied when it's requested (see the
  // challenge/verify calls below), and refuses to mint a session if verify
  // time doesn't match. This client-side guess stays only as an early,
  // best-effort heads-up (same fetch/parse as CleakerNetgetClaimView's own
  // allowedReturnOrigin, kept separate rather than shared: this is the
  // only other call site, and duplicating ~20 lines once is clearer than a
  // premature shared abstraction) -- it is not, and no longer needs to be,
  // the actual security boundary.
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
        // Same fix, same reasoning as netgetSetupClient.ts's own
        // localCleakerOrigin(): scheme comes from THIS page's own
        // window.location.protocol, never a hardcoded 'http://' literal --
        // that literal here mismatches the moment this page loads over
        // https, making the /admin-session/challenge and /admin-session/verify
        // fetches below target the wrong origin (or a scheme mismatch that
        // fails outright) in exactly the deployment shape this fix exists for.
        const netgetOrigin = isLocalMesh
          ? `${window.location.protocol}//local.netget`
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

      // returnOrigin/returnPath commit THIS challenge to this exact
      // destination server-side (adminSession.ts's own
      // issueAdminSessionChallenge) -- verify below must present the same
      // values, or the server refuses to mint a session, regardless of
      // what allowedReturnOrigin's own client-side guess concluded above.
      // Real defense against the destination being swapped mid-flow, not
      // just a repeat of the same client guess.
      const challengeRes = await fetch(`${allowedReturnOrigin}/admin-session/challenge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identityHash, returnOrigin: returnToUrl.origin, returnPath: returnToUrl.pathname }),
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
        body: JSON.stringify({
          identityHash, namespace: semanticNamespace, keyId: selectedKey.keyId, signature,
          returnOrigin: returnToUrl.origin, returnPath: returnToUrl.pathname,
        }),
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
      <Box data-gui-node-id={nodeId} sx={shellSx}>
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
      <Box data-gui-node-id={nodeId} sx={shellSx}>
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
      <Box data-gui-node-id={nodeId} sx={shellSx}>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>Sign in first to continue as an admin.</Typography>
          <Typography component="a" data-gui-node-id={`${nodeId}.signin`} href={signInHref} variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
            Sign in →
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component={nodeComponent}
      sx={shellSx}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Typography variant="h6" data-gui-node-id={`${nodeId}.heading`} sx={{ mb: 1 }}>Confirm admin session</Typography>
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
            data-gui-node-id={`${nodeId}.passphrase`}
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
          data-gui-node-id={`${nodeId}.confirm`}
        >
          {signing ? 'Signing…' : 'Sign and continue'}
        </Button>
      </Box>
    </Box>
  );
};

// CleakerNetgetView — Netget's own real views (MainServerView, GatewaySetup)
// mounted inside this SAME Layout, at /netget, reading the ONE shared
// confirmed context CleakerLayoutShell already resolves (see
// verifiedCleakerRoot.ts) -- never a second, independently-guessed
// gateway address. No new frontend, no new login, no new claim mechanism:
// GatewaySetup's own existing checking→unclaimed→claim flow already
// redirects to CleakerNetgetClaimView above for keychain signing, and
// `/netget` is already in gatewaySetupSession.ts's own
// ALLOWED_CLAIM_RETURN_PATHS -- this integration was anticipated, not
// newly invented.
//
// `netget.available` is Netget's OWN, independently-checked signal
// (probeNetgetGateway -- /gateway-identity, a route that only exists on a
// real netget backend) -- NOT inferred from the Monad surface being
// compatible. A Monad can run its own local context with no gateway in
// front of it at all; this view's "no gateway available" state reflects
// that fact directly rather than assuming one implies the other.
//
// A grant-admin panel (gatewayAuthorityClient.ts's grantAdmin/revokeAdmin/
// transferOwner -- documented in its own header as "not yet wired into
// any admin-panel UI") is deliberately NOT built here yet: that changes
// authority, not just visibility, and belongs in its own pass, verified
// against disposable infrastructure rather than this installation's real
// gateway. This pass only reads and displays.
const CleakerNetgetView: React.FC<DocumentPageProps & { netget: { endpoint: string; available: boolean; gatewayId: string | null } }> = ({ netget, 'data-gui-node-id': nodeId = 'GUI.content.netget', 'data-gui-component': nodeComponent = 'Netget' }) => {
  // The setup code and the claim go to the gateway at THIS page's own origin, and to nowhere else. An
  // endpoint that came from a name (a namespace Beatle resolved, a verified root) is good enough to
  // READ a status from, but the setup code is what makes a claim as trustworthy as one made at the
  // machine's terminal: it is not sent to a destination just because its name looks right.
  const ownOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const canClaimHere = isOwnGatewayOrigin(netget.endpoint, ownOrigin);
  const setupClient = useMemo(
    () => (netget.available && canClaimHere
      ? createNetgetSetupClient(netget.endpoint, {
          returnPath: '/netget',
          // the gateway answers at this very origin: the claim is signed here, in this session
          signHere: true,
        })
      : null),
    [netget.endpoint, netget.available, canClaimHere],
  );
  // GatewaySetup is mounted embedded, in THIS SAME react-router tree --
  // passed down so its own redirect to the Cleaker-origin sign view can
  // use client-side navigation instead of a real browser reload. See
  // GatewaySetup's own onNavigateSameOrigin doc comment for why a plain
  // window.location.href there silently signed people back out mid-claim
  // (this app's session lives in memory only, and a full reload remounts
  // the whole tree, SeedSessionProvider included) -- confirmed live.
  const navigate = useNavigate();

  if (!netget.available) {
    return (
      <Box data-gui-node-id={nodeId} data-gui-component={nodeComponent} sx={{ p: 3, maxWidth: 560 }}>
        <Typography variant="h5" data-gui-node-id={`${nodeId}.heading`} sx={{ fontWeight: 700, mb: 1 }}>Netget</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No Netget gateway is available in this context yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box data-gui-node-id={nodeId} data-gui-component={nodeComponent} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <MainServerView data-gui-node-id={`${nodeId}.status`} endpoint={netget.endpoint} namespaceRootUrl={netget.endpoint} />

      {!canClaimHere && (
        <Typography variant="body2" data-gui-node-id={`${nodeId}.setup`} sx={{ color: 'text.secondary', maxWidth: 560 }}>
          Claiming is not available through this address: it does not serve this gateway itself, so no setup
          code is sent from here. Open the gateway at its own address to claim it.
        </Typography>
      )}

      {setupClient && (
        <GatewaySetup
          data-gui-node-id={`${nodeId}.setup`}
          endpoint={netget.endpoint}
          onSubmitSetupCode={setupClient.onSubmitSetupCode}
          onVerifySetupCode={setupClient.onVerifySetupCode}
          resolveCleakerClaimUrl={setupClient.resolveCleakerClaimUrl}
          onCommitClaim={setupClient.onCommitClaim}
          onNavigateSameOrigin={(pathWithQuery) => navigate(pathWithQuery)}
        />
      )}
    </Box>
  );
};

// Mounts the REAL Layout/LeftBar once for Cleaker's own navigation (/,
// /users, /blockchain, /url, /keychain) -- nested <Routes> inside one
// Layout instance, so it never remounts across these pages.
// Users/Blockchain/URL come from useCleakerRootSidebar (the .me-backed
// composition: the VISITED namespace's own public root scope first --
// readable with or without a session -- then the authenticated identity's
// own preferences layered on top if signed in, with these JS labels as
// the last-resort fallback). Keychain and Netget are added via Layout's
// own native `elements` merge (LeftBar.tsx's mergeLeftSidebarCollections)
// since Keychain is a client auth-state fact, not shared .me structure --
// its real gate is still `authenticated` here, never whether it happens
// to be visible in some namespace's own declared sidebar.
// /keychain/claim and /keychain/admin-sign are deliberately NOT nested
// here -- they stay separate sibling routes (CleakerRoutes below),
// unchanged.
const CleakerLayoutShell: React.FC<CleakerLandingProps> = (props) => {
  const ctx = useOptionalSeedSessionContext();
  const session = ctx?.session ?? null;
  const authenticated = ctx?.authenticated ?? false;
  // Same derivation CleakerLandingHome/CleakerUsersView already use for
  // "which namespace is this page" -- the explicit `cleakerEndpoint` prop,
  // never the session's own namespace, so signing in or out can't move it,
  // and never window.location either (see requireCleakerEndpoint's own
  // doc comment for why that guess was removed).
  const resolvedEndpoint = requireCleakerEndpoint(props.cleakerEndpoint);
  const namespaceRootLabel = deriveNamespaceRootLabel(resolvedEndpoint);

  // A real, verified transport for the sidebar's public read -- seeded
  // ONCE from window.location, not re-derived on every render (this isn't
  // a user-facing switcher; Beatle above the credentials form already
  // owns "let the user explore/switch what's on screen." See
  // verifiedCleakerRoot.ts for what "verified" actually checks).
  const rootSeed = useMemo<CleakerRootSeed>(() => {
    // The namespace (`namespaceRootLabel`) is a name; where its reads go is chosen separately. netget's
    // App.jsx passes cleakerEndpoint="http://local.cleaker" literally, regardless of the scheme the
    // browser loaded this page over -- probing a mismatched origin from an https-loaded page is mixed
    // content, silently blocked, and indistinguishable from the destination being down. So when this
    // page is loaded from a door of the namespace (its own host, www.<ns>, <handle>.<ns>), the reads use
    // this page's own origin -- never a https://<ns> built from the name, which from another door is a
    // different origin the gateway refuses -- and at a door other than the namespace's own host the choice
    // is checked against what the transport answers (see pickRootTransport / expectNamespace).
    return pickRootTransport({
      label: namespaceRootLabel,
      resolvedEndpoint,
      page: typeof window !== 'undefined' ? { origin: window.location.origin, hostname: window.location.hostname } : null,
    });
    // Intentionally NOT re-created when resolvedEndpoint/namespaceRootLabel
    // change across renders -- a one-time seed, not a live binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const verifiedRoot = useVerifiedCleakerRoot(rootSeed);

  // The gateway is reached at the address this page was loaded from when that address answers it
  // (every host of a namespace -- its root, www, a handle -- is served by the same monad). Browser
  // state is per origin: a session, a local vault, and a same-origin request all belong to the
  // address the person is on, so the claim starts, is signed and returns THERE. Only when this
  // origin does not answer the gateway contract does the verified root's origin stand in.
  const pageOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const [ownGateway, setOwnGateway] = React.useState<{ available: boolean; gatewayId: string | null } | null>(null);
  React.useEffect(() => {
    if (!pageOrigin) return undefined;
    let alive = true;
    probeNetgetGateway(pageOrigin).then((check) => { if (alive) setOwnGateway(check); });
    return () => { alive = false; };
  }, [pageOrigin]);
  const netgetForView = ownGateway?.available
    ? { endpoint: pageOrigin, available: true, gatewayId: ownGateway.gatewayId }
    : { endpoint: verifiedRoot.cleakerEndpoint, available: verifiedRoot.netget.available, gatewayId: verifiedRoot.netget.gatewayId };
  // Real provenance for the tree's root: which monad actually answered for
  // this namespace, straight from its own /__surface payload. `selfSignature`
  // is only "the claim is internally consistent" (see checkMonadSurfaceClaim)
  // -- never authority over the namespace. Fields only appear once a probe
  // confirmed something; before that the root honestly declares only its
  // own GUI branch.
  const guiRootProvenance = useMemo(() => {
    const confirmed = verifiedRoot.status === 'confirmed' && verifiedRoot.monad;
    // Short on purpose: what the GUI is, the .me it reads, the monad by NAME.
    // (A monad's raw id is 64 hex characters -- nobody can read it; the name
    // and a short form of the id are enough to tell monads apart.)
    return {
      semanticPath: 'GUI',
      note: 'Generative User Interface',
      ...(confirmed
        ? {
            namespace: namespaceRootLabel,
            monad: { name: verifiedRoot.monad!.name, id: shortMonadId(verifiedRoot.monad!.id) },
            source: verifiedRoot.transportOrigin,
            selfSignature: verifiedRoot.signature,
          }
        : { verification: verifiedRoot.status }),
    };
  }, [verifiedRoot.status, verifiedRoot.monad, verifiedRoot.transportOrigin, verifiedRoot.signature, namespaceRootLabel]);
  useRegisterGuiNode(GUI_ROOT_ID, 'GUI', undefined, guiRootProvenance);
  // At a door the reads NAME their namespace (?namespace=) instead of leaving it to the door: the connection
  // carries them, the request says which tree they are about. They wait for a transport CONFIRMED to serve
  // that namespace (asked the same way) -- a monad that does not honor the parameter answers for the door's
  // namespace, and is not confirmed, so nothing is read from it and no other tree's content is shown. The
  // built-in defaults render meanwhile.
  const namedReads = Boolean(rootSeed.expectNamespace);
  const sidebarTransport = namedReads && verifiedRoot.status !== 'confirmed' ? '' : verifiedRoot.transportOrigin;
  // The root GUI's document plus whatever the app adds on top (netget's pages): one GUI, not two.
  const doc = useMemo<GuiDocument>(() => mergeGuiDocument(GUI_DOCUMENT, props.document), [props.document]);
  const pageRegistry = useMemo(() => ({ ...DOCUMENT_PAGES, ...(props.pages ?? {}) }), [props.pages]);
  const { resolved } = useCleakerRootSidebar(rootSeed.label, sidebarTransport, session, { namedNamespace: namedReads, document: doc });

  // A genuine Beatle "connected" resolution re-verifies that SAME
  // namespace here and only promotes it into the shared context on
  // success -- this is what keeps the sidebar (and /netget) from silently
  // drifting from whatever Beatle's own resolution shows in the QR.
  const handleBeatleNamespaceResolved = useCallback((namespace: string) => {
    verifiedRoot.promote({ label: namespace, cleakerEndpoint: cleakerEndpointForNamespace(namespace) });
  }, [verifiedRoot.promote]);

  // The left bar's own elements come from the document (`GUI.bars.left`): what leads the bar ("back to the
  // start of everything"), then what the namespace declares, then what closes it (a session-gated Keychain,
  // Netget). The document decides which of them exist; the session only decides whether a `requires: session`
  // element is shown.
  const barSlots = leftBarSlots(doc, { authenticated });

  // Every page the document declares under GUI.content: what renders and
  // where it is served both come from the document.
  const documentPageRoutes = flattenGuiDocument(doc)
    .filter((entry) => entry.parentId === 'GUI.content' && entry.component && entry.route)
    .map((entry) => {
      const route = documentRoute(entry.route);
      const element = renderGuiDocumentPage(entry.id, {
        React,
        registry: pageRegistry,
        doc,
        props:
          entry.id === LANDING_ID
            ? { ...props, onBeatleNamespaceResolved: handleBeatleNamespaceResolved, sharedRootStatus: verifiedRoot.status }
            : entry.id === 'GUI.content.netget'
              ? {
                  ...props,
                  netget: netgetForView,
                }
              : props,
      });
      return route.index
        ? <Route key={entry.id} index element={element} />
        : <Route key={entry.id} path={route.path} element={element} />;
    });

  return (
    <Box data-gui-node-id={GUI_ROOT_ID} data-gui-component="GUI">
      <CleakerTopSearch cleakerEndpoint={props.cleakerEndpoint} netgetMonadOrigin={props.netgetMonadOrigin} />
      <Layout
        LeftBar={{
          elements: [...barSlots.start, ...resolved.map((r) => r.element), ...barSlots.end],
          // Same footer slot netget's own NetGetShell (App.jsx) uses for both
          // of these exact components -- ThemeLauncher and DevToolsLauncher
          // are real, already-built launchers (this.gui's own ThemeContext/
          // ThemesCatalog, and the Semantic Inspector's on/off toggle),
          // nothing new built for this page. `useLauncherPopover` degrades to
          // local state with no provider (see runtime/launcherPopover.tsx's
          // own doc comment), so both work standalone here, coordinating with
          // each other the same way they already do in NetGetShell.
          // DevToolsLauncher itself renders nothing (useOptionalSelection()
          // returns null) unless the app's own mount() call actually
          // requested the inspector infrastructure -- see main.jsx's own
          // devtools option.
          footerElements: [
            { type: 'action', props: { label: 'Theme', element: <ThemeLauncher />, tooltip: false } },
            { type: 'action', props: { label: 'Dev Tools', element: <DevToolsLauncher />, tooltip: false } },
          ],
        }}
      >
        <ThemeKernelMirror session={session} />
        <Routes>
          {/* Every page is declared by the GUI document and rendered through the
              same renderer mount(spec) uses. */}
          {documentPageRoutes}
        </Routes>
      </Layout>
    </Box>
  );
};

// Components the GUI document may name (`component`), by that name.
const DOCUMENT_PAGES: Record<string, React.ComponentType<any>> = {
  Landing: CleakerLandingHome,
  Users: CleakerUsersView,
  Blockchain: CleakerBlockchainView,
  Url: CleakerUrlView,
  Keychain: CleakerKeychainView,
  Netget: CleakerNetgetView,
  Claim: CleakerNetgetClaimView,
  Sign: CleakerNetgetAdminSignView,
};

// A document `route` ("/" or "/users") as react-router wants it: the index
// route, or a path relative to the shell.
function documentRoute(route?: string): { index?: true; path?: string } {
  if (!route) return {};
  return route === '/' ? { index: true } : { path: route.replace(/^\//, '') };
}

// A signing screen is not a page inside the GUI's navigation, so it renders
// without the shell's Layout -- but it is still the same GUI: the same root
// and the same declared parts, so the tree above it reaches `GUI`.
// One object, not one per render: a fresh provenance each render is a new
// record each time, and the registry re-renders whatever registered it.
const STANDALONE_ROOT_PROVENANCE = { semanticPath: 'GUI', note: 'Generative User Interface' };

const StandalonePage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRegisterGuiNode(GUI_ROOT_ID, 'GUI', undefined, STANDALONE_ROOT_PROVENANCE);
  useRegisterGuiNodes(
    flattenGuiDocument()
      .filter((entry) => entry.parentId)
      .map((entry) => ({
        id: entry.id,
        type: entry.component ?? entry.type,
        parentId: entry.parentId,
        // No bars here: declared, off.
        enabled: entry.parentId !== 'GUI.bars',
        provenance: { source: 'document', documentPath: entry.id, note: entry.note },
      }))
  );
  return <Box data-gui-node-id={GUI_ROOT_ID} data-gui-component="GUI">{children}</Box>;
};

// The steps of the netget claim (claim, sign) are declared under
// GUI.content.netget and served on their own routes, outside the shell.
const CleakerRoutes: React.FC<CleakerLandingProps> = (props) => (
  <Routes>
    <Route path="/*" element={<CleakerLayoutShell {...props} />} />
    {flattenGuiDocument()
      .filter((entry) => entry.parentId === 'GUI.content.netget' && entry.component && entry.route)
      .map((entry) => (
        <Route
          key={entry.id}
          path={entry.route}
          element={<StandalonePage>{renderGuiDocumentPage(entry.id, { React, registry: DOCUMENT_PAGES, props })}</StandalonePage>}
        />
      ))}
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
