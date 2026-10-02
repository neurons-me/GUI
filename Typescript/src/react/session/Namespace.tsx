// Namespace.tsx — full-page ".me" landing, for a host whose entire job
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
import { Routes, Route, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { RouterProvider } from '@/Router/Router';
import { normalizeProofMessage } from 'this.me';
import Box from '@/gui/Atoms/Box/Box';
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
import {
  writeKernelThemeFacts,
  writeSyncedThemePreference,
  readSyncedThemePreference,
  type SeedSession,
} from '@/core/session/createSeedSession';
import { readMeValue } from '@/runtime/run-me';
import { setGuiLocalKernel } from '@/runtime/guiLocalKernel';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { useRegisterGuiNode, useRegisterGuiNodes } from '@/runtime/selection';
import { flattenGuiDocument, renderGuiDocumentPage, mergeGuiDocument, leftBarSlots, GUI_DOCUMENT, type GuiDocument } from '@/runtime/guiDocument';
import CleakerKeychain, { type PendingLocalRegistration } from '@/gui/All.This/Cleaker/Keychain/CleakerKeychain';
import { createKeychainClient, type KeychainClient } from '@/gui/All.This/Cleaker/Keychain/keychainClient';
import type { KeychainKey, KeychainView as KeychainScreen } from '@/gui/All.This/Cleaker/Keychain/keychainState';
import Layout from '@/gui/Layout/Layout';
import type { LeftBarElement } from '@/gui/Layout/Sidebars/LeftBar/LeftBar.types';
import { useCleakerRootSidebar } from './cleakerNavigationComposition';
import { useVerifiedCleakerRoot, pickRootTransport, type CleakerRootSeed, probeNetgetGateway } from './verifiedCleakerRoot';
import { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import { makeDefaultResolvers } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';
import MainServerView from '@/gui/All.This/netget/MainServer/MainServerView';
import GatewaySetup from '@/gui/All.This/netget/Setup/GatewaySetup';
import { createNetgetSetupClient } from '@/gui/All.This/netget/Setup/netgetSetupClient';
import { isOwnGatewayOrigin } from '@/gui/All.This/netget/Setup/trustedOrigin';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import DevToolsLauncher from '@/runtime/DevToolsLauncher';
import CleakerIdentityCard from '@/gui/All.This/Cleaker/CleakerIdentityCard';
import { requireCleakerEndpoint, deriveNamespaceRootLabel, LANDING_ID, type DocumentPageProps } from './documentPages';

interface DirectoryUser {
  username: string;
  profileImg?: string | null;
}

export interface NamespaceProps {
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
  /** Extra LeftBar footer actions this app adds after Theme/Dev Tools (netget's Frontend Mode toggle). */
  footerExtras?: LeftBarElement[];
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

// Same mixed-content fix as rootSeed's own derivation below (see
// GUI): when the namespace being resolved IS the host this
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
//
// Same gap, a second shape (found live, 2026-09-22): window.location's own
// host is not the only already-known-good origin -- `knownRoot` (the
// GUI's own rootSeed: the exact namespace/endpoint pair
// useVerifiedCleakerRoot already confirmed once) is checked first, because
// the page's origin and the resolved namespace root can legitimately
// differ (a disposable dev host served from "localhost:5178" whose real
// namespace root is "127.0.0.1:4603" -- no DNS relationship between the
// two at all). Without this, Beatle reconnecting to that SAME root on every
// remount fell through to the `https://${namespace}` guess below, which
// silently drops the real port and forces https -- confirmed live: Beatle
// reconnecting to its own already-confirmed root produced a hung/failing
// `https://127.0.0.1/__surface` probe (ERR_SSL_VERSION_OR_CIPHER_MISMATCH),
// leaving the position badge stuck on "Checking..." after a harmless
// same-root reconnect, not just on a genuine namespace switch.
function cleakerEndpointForNamespace(namespace: string, knownRoot?: CleakerRootSeed): string {
  if (knownRoot?.label) {
    const known = knownRoot.label;
    if (known === namespace || namespace.endsWith(`.${known}`)) {
      return knownRoot.cleakerEndpoint;
    }
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === namespace || namespace.endsWith(`.${host}`)) {
      return window.location.origin;
    }
  }
  return `https://${namespace}`;
}

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

// Two jobs, now genuinely different in kind:
// 1. Local mirror -- same "GUI.*" branch, same reasoning as
//    writeKernelWindowLocation (createSeedSession.ts): a plain instance
//    fact, not a synced/signed write. localStorage (this.gui's own
//    Theme.tsx) stays the real, always-available store pre-session.
// 2. Real sync -- once a namespace is actually authenticated,
//    writeSyncedThemePreference makes profile.theme.id/profile.theme.mode
//    a namespace-scoped fact (LiveOwnProfile's "signed, cross-device"
//    shape) under the profile branch, not loose at the kernel root, and
//    on the transition INTO authenticated, any theme already synced from
//    a prior session (any device/origin) overrides whatever localStorage
//    happened to have for THIS origin -- closing the exact bug where
//    cleaker.me/netget.site/local.cleaker each kept their own independent
//    theme choice forever, since localStorage can never cross origins no
//    matter who writes it.
// Renders nothing; pure effect.
const ThemeKernelMirror: React.FC<{ session: SeedSession | null }> = ({ session }) => {
  const { themeId, mode, setThemeId, setMode } = useThemeContext();
  const wasAuthenticatedRef = useRef(false);

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

  // Hydrate on the anonymous -> authenticated transition only: a synced
  // preference from a prior session (any origin) wins over this tab's own
  // localStorage default. Never re-runs while already authenticated, so it
  // can't fight the user's own live theme clicks during the session.
  useEffect(() => {
    const me = session?.me;
    const authenticated = Boolean(me && readMeValue(me, 'identity.session.authenticated', { allowBarePath: true }));
    const justAuthenticated = authenticated && !wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = authenticated;
    if (!justAuthenticated || !me) return;

    const synced = readSyncedThemePreference(me);
    if (synced.themeId) setThemeId(synced.themeId);
    if (synced.mode) setMode(synced.mode);
  }, [session, setMode, setThemeId]);

  // Push every live theme change into the synced, namespace-scoped fact --
  // but only once authenticated (an anonymous kernel has no namespace to
  // sync against yet, same timing claim.ts's own profile writes use).
  useEffect(() => {
    const me = session?.me;
    if (!me || !themeId) return;
    if (!readMeValue(me, 'identity.session.authenticated', { allowBarePath: true })) return;
    writeSyncedThemePreference(me, themeId, mode);
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
const CleakerTopSearch: React.FC<{ cleakerEndpoint?: string; netgetMonadOrigin?: string; onExpandedChange?: (expanded: boolean) => void }> = ({ cleakerEndpoint, netgetMonadOrigin, onExpandedChange }) => {
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

  // No longer its own `position: fixed` box -- lives inside the shared
  // flex row `GUI` renders (alongside the position QRme badge) so the two
  // align by flex centering, not by independently matching `top` offsets
  // on two differently-sized, independently-positioned elements (exactly
  // the alignment bug this replaced: the badge's height changes with
  // whatever size its own QR content needs -- see QR.me.tsx's own
  // "sizes itself to the real achievable size" fix -- so a hardcoded
  // shared `top` only aligned them when their heights happened to match).
  return (
    <SearchField
      query={searchQuery}
      onQueryChange={setSearchQuery}
      results={searchMatches}
      onSelectResult={visitUser}
      placeholder="Search .me"
      ariaLabel="Search .me"
      onExpandedChange={onExpandedChange}
      data-gui-node-id="GUI.bars.top.search"
    />
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
// confirmed context GUI already resolves (see
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
const GUI: React.FC<NamespaceProps> = (props) => {
  const ctx = useOptionalSeedSessionContext();
  const session = ctx?.session ?? null;
  const authenticated = ctx?.authenticated ?? false;
  // Same derivation CleakerIdentityCard/CleakerUsersView already use for
  // "which namespace is this page" -- the explicit `cleakerEndpoint` prop,
  // never the session's own namespace, so signing in or out can't move it,
  // and never window.location either (see requireCleakerEndpoint's own
  // doc comment for why that guess was removed).
  const resolvedEndpoint = requireCleakerEndpoint(props.cleakerEndpoint);
  const namespaceRootLabel = deriveNamespaceRootLabel(resolvedEndpoint);

  // CleakerTopSearch and the position QRme badge live together in ONE
  // fixed flex row (see the `GUI` return below) -- originally two
  // independent, fixed-position siblings each positioned by its own
  // hardcoded coordinates, which caused two separate real bugs before
  // this: (1) the search field expanding to `min(280px, 100vw-32px)` grew
  // past the badge's own coordinates, and since the badge sat at a higher
  // zIndex, it rendered ON TOP of the expanded search pill instead of
  // being pushed aside (flagged live 2026-10-02 as the badge looking
  // "cropped" -- it wasn't a cropped asset or the wrong QR component,
  // just two overlapping fixed-position elements); (2) once the badge
  // started sizing itself to its own QR's real achievable size (see
  // QR.me.tsx's own "sizes itself to the real achievable size" fix)
  // instead of a fixed 40px guess, its height no longer reliably matched
  // the search icon's, and two independently-positioned elements matched
  // only by a shared `top` value drifted out of visual alignment (flagged
  // live as "quedó desalineado"). A single flex row scoped to both
  // (`alignItems: center`) fixes both classes of bug at once -- the badge
  // fades out AND collapses its flex-row width while search is expanded
  // (not resized/repositioned, which would need ongoing width math
  // SearchField already owns internally), and the two always align by
  // their actual rendered height regardless of either one's size.
  const [topSearchExpanded, setTopSearchExpanded] = useState(false);

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

  // The persistent "where am I" position — namespace/identity + the CURRENT route's path — shown at the
  // shell level (below) so it survives navigation instead of only existing on the Landing page's own QR.
  // Three things kept separate, per the review that asked for this: WHICH namespace is queried
  // (namespaceRootLabel / session.semanticNamespace), WHICH node within it (location.pathname), and WHO
  // is authenticated (session — never re-derived from the path itself, e.g. visiting /@someone must not
  // read as "signed in as someone"). One expression, one QR value, both built from the SAME three parts
  // here — not two independent derivations that could drift (the earlier gap this closes).
  const location = useLocation();
  const currentNodePath = location.pathname && location.pathname !== '/' ? location.pathname : '';
  const positionIdentity = authenticated && session?.semanticNamespace ? session.semanticNamespace : namespaceRootLabel;
  const positionExpression = `${positionIdentity}${currentNodePath}`;
  const positionQrValue = useMemo(() => {
    try {
      const authedUsername = authenticated && session?.semanticNamespace
        ? String(session.semanticNamespace).split('.')[0]
        : undefined;
      // buildCleakerNamespaceUrl has no path parameter of its own (namespace/identity only) — the current
      // node path is appended here, after it. Verified correct for the plain-namespace case (no handle
      // prefix); the interaction with its own "/@handle" form for a localish surface is a real, named,
      // unverified edge case, not silently assumed to compose the same way.
      return `${buildCleakerNamespaceUrl(resolvedEndpoint, authedUsername)}${currentNodePath}`;
    } catch {
      return resolvedEndpoint;
    }
  }, [resolvedEndpoint, authenticated, session?.semanticNamespace, currentNodePath]);
  // One effective connection state for the position badge, from verifiedRoot ALONE — never from Beatle's
  // own separate channel state. This is deliberate, not an oversight: mixing two independently-updating
  // signals into one ring+label pair is exactly the bug found on the Landing page's own QR (the ring
  // factored a second check the label's text never did, so they could show contradictory things after a
  // real disconnect). verifiedRoot.status is already the one signal both the sidebar and /netget treat as
  // authoritative — reusing it here, rather than adding a second source, is what keeps the ring and the
  // label unable to disagree by construction.
  const positionStatus: 'idle' | 'checking' | 'confirmed' | 'error' = verifiedRoot.status;
  const positionStatusLabel = verifiedRoot.status === 'checking' ? 'Checking…'
    : verifiedRoot.status === 'error' ? 'Could not connect'
    : verifiedRoot.status === 'confirmed' ? 'Connected'
    : '';

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
    verifiedRoot.promote({ label: namespace, cleakerEndpoint: cleakerEndpointForNamespace(namespace, rootSeed) });
  }, [verifiedRoot.promote, rootSeed]);

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
      {/* The position badge (see positionExpression/positionQrValue above)
          and the search field, side by side in ONE fixed flex row --
          top-LEFT of the screen was tried first for the badge and
          collided with the sidebar's own toggle button occupying that
          exact corner, so both live top-right instead. Previously two
          INDEPENDENT `position: fixed` boxes matched by a shared `top`
          offset, which only actually aligned them when they happened to
          be the same height -- broke the moment the badge started sizing
          itself to its own QR's real achievable size (see QR.me.tsx's own
          "sizes itself to the real achievable size" fix) instead of a
          fixed 40px guess, flagged live (2026-10-02) as "quedó
          desalineado". A shared flex row with `alignItems: center`
          aligns them by their actual rendered height, automatically,
          regardless of either one's size -- no coordinate math to keep in
          sync between them. */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 12, sm: 20 },
          right: { xs: 12, sm: 20 },
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {/* The persistent position badge, visible on every route this
            shell renders, including /netget, not only the Landing page's
            own bigger QR -- a read-only "where am I" indicator, not the
            sign-in surface. Faded AND collapsed out of this row's flex
            flow (not unmounted — avoids losing QRme's own hover/flip
            local state) while the search field is expanded, so the two
            never visually overlap and the row doesn't reserve dead space
            for a hidden badge (see topSearchExpanded's own doc comment
            above). */}
        <Box
          sx={{
            opacity: topSearchExpanded ? 0 : 1,
            width: topSearchExpanded ? 0 : 'auto',
            overflow: 'hidden',
            pointerEvents: topSearchExpanded ? 'none' : 'auto',
            transition: 'opacity 150ms ease, width 150ms ease',
          }}
        >
          <QRme
            variant="topbar"
            value={positionQrValue}
            username={authenticated && session?.semanticNamespace ? String(session.semanticNamespace).split('.')[0] : undefined}
            status={positionStatus}
            statusLabel={positionStatusLabel}
            perimeterLabel={positionExpression}
            perimeterRootLabel={namespaceRootLabel}
            data-gui-node-id="GUI.bars.top.position"
          />
        </Box>
        <CleakerTopSearch
          cleakerEndpoint={props.cleakerEndpoint}
          netgetMonadOrigin={props.netgetMonadOrigin}
          onExpandedChange={setTopSearchExpanded}
        />
      </Box>
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
            // An app's own footer action (netget's Frontend Mode toggle) -- not part of the document's
            // bars.left system (that's navigation, this is a control), so it stays a plain prop rather
            // than a document part. Kept last so Theme/Dev Tools stay in the same place everywhere.
            ...(props.footerExtras ?? []),
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
  Landing: CleakerIdentityCard,
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
const CleakerRoutes: React.FC<NamespaceProps> = (props) => (
  <Routes>
    <Route path="/*" element={<GUI {...props} />} />
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

// Namespace is meant to be dropped in as an entire page (see the file
// header), so it owns its own routing rather than depending on a host app
// to already have one — but it can't just always wrap itself in a fresh
// router: react-router v6 throws if a <Router> renders inside another
// Router's context, and this component IS rendered inside one already in
// at least one real place — Storybook's own global decorator wraps every
// story in <MemoryRouter> (.storybook/preview.tsx), and Namespace is
// no exception. RouterProvider (Router/Router.tsx) is this exact guard,
// already written once there — reused here instead of a second, hand-rolled
// copy of the same useInRouterContext()+<BrowserRouter> check. It reuses
// the ambient router (MemoryRouter in Storybook, or whatever a future host
// provides) when already inside one; only a truly standalone render
// (netget's real App.jsx today — Namespace renders as a SIBLING of
// netget's own <Router>, not nested inside it) gets its own <BrowserRouter>.
const Namespace: React.FC<NamespaceProps> = (props) => (
  <RouterProvider>
    <CleakerRoutes {...props} />
  </RouterProvider>
);

export default Namespace;
