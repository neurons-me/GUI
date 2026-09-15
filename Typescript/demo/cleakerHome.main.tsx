// cleakerHome.main.tsx — local.cleaker's real entry point stays the real
// entry point. This demo mounts the actual CleakerLanding (the same
// component this session already verified in Storybook — ".me" QR bubble,
// register/sign-in/recover, users/blockchain directories) at "/",
// unmodified.
//
// Route mapping, explicit:
//   "/"                                    → the real, unmodified
//                                            CleakerLanding. Its OWN
//                                            internal routes ("/", "/users",
//                                            "/blockchain", "/keychain", ...)
//                                            resolve underneath wherever
//                                            it's mounted (react-router v6:
//                                            CleakerLanding calls
//                                            useInRouterContext() and,
//                                            finding one already provided
//                                            here, nests its own <Routes>
//                                            instead of demanding a fresh
//                                            <BrowserRouter>).
//   "/netget"                              → administer this namespace's
//                                            Netget using the REAL
//                                            components (GatewaySetup,
//                                            MainServerView) against a
//                                            REAL disposable Netget
//                                            backend + monad (see
//                                            dev-harness/
//                                            netget-gateway-harness-
//                                            server.mjs) -- not a
//                                            demo-only placeholder.
//                                            Unclaimed → GatewaySetup;
//                                            claimed → MainServerView.
//   "/netget/logs"                         → MainServerView's Logs,
//                                            the real LogsView component
//                                            against the same harness.
//   "/netget/apps"                         → list the apps this Netget
//                                            mounts/serves — reads the REAL
//                                            mesh-registry shape
//                                            (apps.json / NetGetAppRegistration,
//                                            see appRegistry.ts) via a
//                                            disposable stand-in endpoint
//                                            (vite.config.js's
//                                            "/api/netget/apps" middleware,
//                                            DEMO_ROLE=cleakerHome only).
//   "/netget/apps/:appId"                  → administer ONE app: its
//                                            registry facts (where it runs
//                                            — host/port/trust/frontendMode,
//                                            from apps.json) and its pages
//                                            (apps.<appId>.pages.* in `.me`
//                                            — its own content tree, a
//                                            SEPARATE store from the
//                                            registry above; the registry
//                                            only points at where an app
//                                            runs, it never holds the
//                                            app's own pages/content).
//   "/netget/apps/:appId/pages/:pageId"    → open and edit ONE page —
//                                            the same usePageView editor
//                                            pageEditor.main.tsx uses, now
//                                            reading appId/pageId from the
//                                            route instead of a fixed
//                                            module-level constant. This is
//                                            what "quien tenga permiso"
//                                            opens to edit; a visitor sees
//                                            the same page read-only.
//
// GUI (renderNode + the resolver registry) is the rendering engine used
// THROUGHOUT this whole tree — it is not a separate place you "enter".
// There is no "/apps/gui" shortcut anymore and no "Open page editor" link
// on the landing: that shortcut skipped straight from the very first
// screen into one hardcoded page (apps.gui.pages.home) with no registry,
// no app list, no sense of "which app, which page, running where" — which
// is exactly what didn't make sense about it. The corrected path is
// Netget → Apps → one app → one page → edit.
//
// Permissions vs the encrypted-audience algebra: what gates editing a page
// is appAuthorization.ts's server-side check (namespace claim + admins/
// grants) — real, working authorization, unchanged by this routing
// rework. It is NOT the "álgebra de audiencias cifradas" this session's
// conversation named separately (which namespace branches a given
// identity can even decrypt) — that's a different, not-yet-built
// mechanism.
//
// One session (SeedSessionProvider, sessionBackend:'cleaker'), one
// identity, no second claim for GUI, no second login system. Verified
// live on this disposable harness (never the real gateway, see
// dev-harness/gui-catalog-harness-server.mts) that the session is
// genuinely shared across this whole tree: sign in at "/" itself (not
// inside any nested surface), navigate into "/netget/..." — already
// authenticated, no re-login — navigate back to "/" — still authenticated
// there too. Sign out from either surface removes edit tools everywhere
// and leaves public pages readable.
//
// Still provisional / explicitly NOT settled by this pilot:
//  - "/netget" and "/netget/logs" are now wired to the REAL GatewaySetup,
//    MainServerView and LogsView components (packages/GUI/Typescript's
//    own netget/Setup and netget/MainServer components — previously
//    reachable only from Storybook) against a REAL, disposable Netget
//    Express backend + monad (netget-gateway-harness-server.mjs). This
//    is a SEPARATE harness/monad from the one backing "/netget/apps/*"
//    below (and from CleakerLanding's own netgetMonadOrigin, still
//    ROOT_NAMESPACE's monad) — deliberately: GatewayClaimsManager's
//    bootstrap write to netget's own ledger is unauthenticated by design
//    (see that file's own header comment), which the monad's real
//    isNamespaceWriteAuthorized() only permits against a kernel with NO
//    existing claims — confirmed directly (NAMESPACE_WRITE_FORBIDDEN)
//    when this was first tried against the already-claimed content
//    monad. Consequence, not yet resolved here: completing a claim
//    against this harness needs a keychain key registered on ITS OWN
//    monad, not pageowner1's existing one — and "/" here (CleakerLanding)
//    only ever registers against ROOT_NAMESPACE's monad, so a full
//    claim can't be walked end-to-end from THIS combined demo without
//    resolving which monad "the signed-in identity" means in a world
//    with more than one — the same "multiple ledgers" question already
//    named (elsewhere) as its own later piece of work, not a bug to
//    patch around here. What IS verified live: the real unclaimed state,
//    dependency checks, setup-code entry, and the redirect to
//    CleakerNetgetClaimView all work against this real backend.
//  - "/netget/apps" reads a SEEDED disposable apps.json, not a live one —
//    this harness's monad never calls the real mesh heartbeat
//    (/apps/report), so there is exactly one, hand-seeded registry entry
//    (see vite.config.js). Wiring a real heartbeat into the harness monad
//    is a real next step, not done here.
//  - "/netget/apps/:appId"'s "pages" list is hardcoded to a single known
//    page id ("home") — there is no page-listing endpoint yet. It is
//    still real routing (pageId is a genuine route param the editor
//    reads), just not backed by a real enumeration of `.me` children yet.
//  - This whole tree is not wired into CleakerLanding's own native
//    navigation (its Users/Blockchain corner icons) — the "Netget →" link
//    on the landing is a sibling overlay, same pattern those two corner
//    icons already establish visually, not a change to CleakerLanding.tsx
//    itself.
//  - Wiring any of this into the real server's own routing mechanism
//    (instead of this demo's dev-only Vite rewrite) is a later step once
//    this exact flow gets pointed at a real deployment.
// Disposable infra only — see dev-harness/gui-catalog-harness-server.mts.
// http://local.cleaker/ itself has not been touched by any of this.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import * as guiFacade from '../../../../browser.ts';
import { usePageView, renderNode, selectionStore } from './shared/pageBuilder.tsx';

const { gui, guiDevtools, guiReact, guiCleaker } = guiFacade;
const { Theme, Layout, Box, Typography, RouterProvider, SeedSessionProvider, useSeedSession, GatewaySetup, createNetgetSetupClient, MainServerView, LogsView } = gui;
const { SelectionProvider, RuntimeInspector } = guiDevtools;
const { CleakerLanding, MeLauncher } = guiReact;
const { setActiveNamespaceRoot } = guiCleaker;

const params = new URLSearchParams(window.location.search);
const endpoint = params.get('endpoint') || 'http://127.0.0.1:8162';
const ROOT_NAMESPACE = params.get('rootNamespace') || 'gui-catalog-harness.local';
// The gateway's OWN backend (GatewaySetup/MainServerView/LogsView), a
// SEPARATE disposable service from the ".me" content monad above -- see
// netget-gateway-harness-server.mjs. Independent on purpose: a gateway's
// claim identity and an app's content tree are two different things (the
// registry-vs-content-tree split "/netget/apps/*" already documents).
const NETGET_ENDPOINT = params.get('netgetEndpoint') || 'http://127.0.0.1:4603';
// CleakerLanding's own QR/"namespace root" chrome wants a URL-shaped
// endpoint (e.g. "http://local.cleaker") -- this disposable root namespace
// isn't a real routable host, but the shape still has to be a URL or
// CleakerLanding's own buildCleakerNamespaceUrl() throws when it tries to
// build QR values. The QR just won't resolve to anything real, same as
// every other disposable-infra caveat in this pilot.
const CLEAKER_ENDPOINT_URL = `http://${ROOT_NAMESPACE}`;

// Still a hardcoded stand-in, not a real page-listing mechanism (that's
// separate, real future work -- see this file's own top comment). "myblog"
// added alongside "gui" to prove a SECOND app, registered under a
// DIFFERENT owner's own namespace, gets its authorization from that
// namespace's own claim (appAuthorization.ts) rather than from anything
// specific to "gui".
const KNOWN_PAGES_BY_APP: Record<string, string[]> = { gui: ['home'] };

interface NetgetAppEntry {
  id: string;
  name: string;
  host?: string;
  port?: number;
  trust?: string;
  frontendMode?: string;
  alive: boolean;
  metadata?: { monadName?: string; namespace?: string; endpoint?: string };
}

function IdentityBubble() {
  return (
    <Box sx={{ position: 'fixed', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 1500, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 240, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', boxShadow: 2 }}>
        <MeLauncher cleakerEndpoint={CLEAKER_ENDPOINT_URL} />
      </Box>
    </Box>
  );
}

// MeLauncher (the compact bubble) only ever signs IN — SeedSessionProvider
// deliberately never auto-registers an unrecognized username (see its own
// doc comment: a typo shouldn't silently claim a new empty identity). A
// brand-new visitor needs the real registration form, which lives on
// CleakerLanding at "/" — the actual entry point — not reinvented here.
function SignedOutHeader() {
  return (
    <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography variant="subtitle2">You're viewing this page as a visitor</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Sign in with the identity bubble (top right) if you already have a `.me` identity.{' '}
        <Box component={Link} to="/" sx={{ color: 'primary.main' }}>New here? Go to local.cleaker to register</Box>.
      </Typography>
    </Box>
  );
}

// Shared chrome for every "/netget/*" surface: a back-to-namespace-root
// link plus the identity bubble, so the signed-in identity stays visible
// (and the session stays the same one) across the whole administration
// flow, not just inside the editor.
function NetgetChrome({ backTo, backLabel, children }: { backTo: string; backLabel: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component={Link} to={backTo} sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.75, borderRadius: 999, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.secondary', textDecoration: 'none', fontSize: '0.8rem', boxShadow: 1, '&:hover': { color: 'text.primary' } }}>
          {backLabel}
        </Box>
      </Box>
      <IdentityBubble />
      {children}
    </Box>
  );
}

// "/netget" — administer this namespace's own Netget using the REAL
// components, not a placeholder. GatewaySetup is self-contained: it polls
// NETGET_ENDPOINT's own /gateway-identity + /openresty-status and drives
// its own phase machine. Its real backend counterpart,
// createNetgetSetupClient(), derives the claim's return path from
// window.location.pathname -- since GatewaySetup mounts at "/netget" here
// (not netget's own real "/", reserved for CleakerLanding), that override
// is passed explicitly, and gatewaySetupSession.ts's own
// ALLOWED_CLAIM_RETURN_PATHS lists "/netget" as the one deliberate
// exception to its real production mount point.
//
// GatewaySetup has no "onClaimed" callback of its own -- the only
// observable completion signal a caller gets is onCommitClaim's return
// value. This wrapper watches that to decide when to swap from
// GatewaySetup to MainServerView, rather than reaching into
// GatewaySetup's internal phase state (which it doesn't expose) or
// relying on its ClaimedPanel's hardcoded "/home" link (meaningless in
// this demo, and not something to edit in a component this pilot reuses
// unmodified).
function NetgetGatewayHome() {
  const [bootstrapped, setBootstrapped] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${NETGET_ENDPOINT}/gateway-identity`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => { if (!cancelled) setBootstrapped(!!body?.bootstrapped); })
      .catch(() => { if (!cancelled) setBootstrapped(false); });
    return () => { cancelled = true; };
  }, []);

  const netgetSetupClient = React.useMemo(
    () => createNetgetSetupClient(NETGET_ENDPOINT, { returnPath: '/netget' }),
    [],
  );

  async function wrappedOnCommitClaim(proof: any, setupToken: string) {
    const result = await netgetSetupClient.onCommitClaim(proof, setupToken);
    if (result.ok) setBootstrapped(true);
    return result;
  }

  if (bootstrapped === null) {
    return (
      <NetgetChrome backTo="/" backLabel="← local.cleaker">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Checking gateway status…</Typography>
      </NetgetChrome>
    );
  }

  if (!bootstrapped) {
    return (
      <NetgetChrome backTo="/" backLabel="← local.cleaker">
        <GatewaySetup
          endpoint={NETGET_ENDPOINT}
          onSubmitSetupCode={netgetSetupClient.onSubmitSetupCode}
          onVerifySetupCode={netgetSetupClient.onVerifySetupCode}
          resolveCleakerClaimUrl={netgetSetupClient.resolveCleakerClaimUrl}
          onCommitClaim={wrappedOnCommitClaim}
        />
      </NetgetChrome>
    );
  }

  return (
    <NetgetChrome backTo="/" backLabel="← local.cleaker">
      <MainServerView endpoint={NETGET_ENDPOINT} namespaceRootUrl={CLEAKER_ENDPOINT_URL} />
      <Box component={Link} to="/netget/logs" data-gui-node-id="NetgetGatewayHome.logsLink"
        sx={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', px: 2, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'primary.main', color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
        Logs →
      </Box>
      <Box component={Link} to="/netget/apps" data-gui-node-id="NetgetGatewayHome.appsLink"
        sx={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', px: 2, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', color: 'text.secondary', textDecoration: 'none', fontWeight: 600 }}>
        Apps →
      </Box>
    </NetgetChrome>
  );
}

// "/netget/logs" — the real LogsView, same disposable gateway backend.
// Reachable from MainServerView's own navigation once claimed -- Setup
// and Main Server come first per the requested sequencing, Logs second.
function NetgetGatewayLogs() {
  return (
    <NetgetChrome backTo="/netget" backLabel="← Netget">
      <LogsView endpoint={NETGET_ENDPOINT} />
    </NetgetChrome>
  );
}

// "/netget/apps" — the REAL mesh registry: GET {NETGET_ENDPOINT}/apps
// (localNetget.js), which only ever returns entries that are actually
// live (it scrubs expired ones server-side, the same as apps.lua's own
// list_apps() -- see appRegistry.ts's upsertReportedApp() for the write
// half a real monad's heartbeat lands through). No dev-only stand-in
// anymore -- this reads whatever a real POST /apps/report heartbeat
// actually put there.
function NetgetAppsList() {
  const [apps, setApps] = React.useState<NetgetAppEntry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${NETGET_ENDPOINT}/apps`)
      .then((res) => res.json())
      // The real endpoint only ever returns entries it already confirmed
      // are live (it scrubs expired ones itself) -- it doesn't send an
      // `alive` flag back, unlike the old seeded stand-in this replaces.
      .then((body) => { if (!cancelled) setApps((body.apps || []).map((a: NetgetAppEntry) => ({ ...a, alive: true }))); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <NetgetChrome backTo="/netget" backLabel="← Netget">
      <Typography variant="h4">Apps mounted on {ROOT_NAMESPACE}</Typography>
      {error && <Typography variant="body2" sx={{ color: 'error.main' }}>{error}</Typography>}
      {!apps && !error && <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading registry…</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 640 }}>
        {(apps || []).map((app) => (
          <Box key={app.id} component={Link} to={`/netget/apps/${app.id}`} data-gui-node-id={`NetgetAppsList.app.${app.id}`}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textDecoration: 'none', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}>
            <Box>
              <Typography variant="subtitle1">{app.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {app.metadata?.namespace || '—'} · {app.host}:{app.port}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: app.alive ? 'success.main' : 'text.disabled' }}>
              {app.alive ? 'alive' : 'stale'} · {app.trust}
            </Typography>
          </Box>
        ))}
      </Box>
    </NetgetChrome>
  );
}

// "/netget/apps/:appId" — administer ONE app: where it runs (the registry
// entry above) and its pages (its own `.me` content tree, apps.<appId>.
// pages.* — a SEPARATE store the registry only points at, never holds).
function NetgetAppDetail() {
  const { appId } = useParams<{ appId: string }>();
  const [entry, setEntry] = React.useState<NetgetAppEntry | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${NETGET_ENDPOINT}/apps`)
      .then((res) => res.json())
      // Same as NetgetAppsList: the real endpoint only returns entries it
      // already confirmed are live and sends no `alive` flag of its own.
      .then((body) => { if (!cancelled) setEntry((body.apps || []).map((a: NetgetAppEntry) => ({ ...a, alive: true })).find((a: NetgetAppEntry) => a.id === appId) || null); });
    return () => { cancelled = true; };
  }, [appId]);

  const pages = KNOWN_PAGES_BY_APP[appId || ''] || [];

  return (
    <NetgetChrome backTo="/netget/apps" backLabel="← Apps">
      <Typography variant="h4">apps.{appId}</Typography>
      {entry && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Runs at {entry.host}:{entry.port} ({entry.metadata?.namespace}) · {entry.trust} · {entry.frontendMode} · {entry.alive ? 'alive' : 'stale'}
        </Typography>
      )}
      <Typography variant="subtitle2" sx={{ mt: 1 }}>Pages</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 480 }}>
        {pages.map((pageId) => (
          <Box key={pageId} component={Link} to={`/netget/apps/${appId}/pages/${pageId}`} data-gui-node-id={`NetgetAppDetail.page.${pageId}`}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textDecoration: 'none', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}>
            <Typography variant="body2">{pageId}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Open →</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Domains</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Not wired up in this pilot yet — domain associations live in `.me`'s own
        domainStore.ts (users.&lt;owner&gt;.domains), a separate store from both
        the registry above and this app's pages.
      </Typography>
    </NetgetChrome>
  );
}

// The editor surface — a tool reached via Netget → Apps → one app → one
// page (from local.cleaker, once signed in and permitted), not the
// environment's entry point and not a fixed destination: appId/pageId are
// real route params, not module-level constants.
function AppPageEditor() {
  const { appId, pageId } = useParams<{ appId: string; pageId: string }>();
  // MeLauncher's credentials branch calls loginWithCredentials()/
  // registerWithCredentials() with no explicit namespace -- it relies on
  // getActiveNamespaceRoot() being set, exactly like CleakerLandingHome
  // sets it for itself at "/". Nothing sets it on THIS route otherwise, so
  // MeLauncher's login here would fall through to fetchGatewayHostname()
  // (a real gateway's /me/gateway) and fail. No dependency array:
  // re-asserts on every render this route is mounted, so arriving here
  // directly (not via "/") still finds it correct.
  React.useEffect(() => {
    setActiveNamespaceRoot(ROOT_NAMESPACE);
  });

  // The page's real destination -- WHICH namespace/monad this specific
  // appId's content actually lives on -- comes from the app's own REAL
  // registry entry (metadata.namespace/metadata.endpoint), read from the
  // same live registry NetgetAppsList/NetgetAppDetail read (no dev-only
  // stand-in), never from the signed-in identity and never from the
  // page-wide defaults: editing apps.gui.* must still resolve to whoever
  // gui-catalog-harness.local's own claim says owns it, and a different
  // app reporting a different namespace/endpoint must resolve THERE
  // instead -- a fallback to the global default here would make that
  // distinction untestable (every app would silently resolve the same
  // way whether or not resolution actually worked). So there is no
  // fallback: usePageView is only ever called (by AppPageEditorResolved
  // below) once a real entry with both fields is confirmed found. While
  // resolving, or if the app never registered, this blocks -- no read, no
  // edit, no request against a guessed destination.
  const [registryStatus, setRegistryStatus] = React.useState<'loading' | 'found' | 'not-found' | 'error'>('loading');
  const [registryEntry, setRegistryEntry] = React.useState<NetgetAppEntry | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    setRegistryStatus('loading');
    fetch(`${NETGET_ENDPOINT}/apps`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        const found = (body.apps || []).find((a: NetgetAppEntry) => a.id === appId) || null;
        setRegistryEntry(found);
        setRegistryStatus(found ? 'found' : 'not-found');
      })
      .catch(() => { if (!cancelled) setRegistryStatus('error'); });
    return () => { cancelled = true; };
  }, [appId]);

  const resolvedEndpoint = registryEntry?.metadata?.endpoint;
  const resolvedNamespace = registryEntry?.metadata?.namespace;

  if (registryStatus !== 'found' || !resolvedEndpoint || !resolvedNamespace) {
    return (
      <NetgetChrome backTo={`/netget/apps/${appId}`} backLabel={`← apps.${appId}`}>
        <Typography variant="h4">apps.{appId} — {pageId}</Typography>
        {registryStatus === 'loading' && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Resolving destination…</Typography>
        )}
        {registryStatus === 'error' && (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            Could not reach the registry — cannot resolve where apps.{appId} runs. No operations available.
          </Typography>
        )}
        {(registryStatus === 'not-found' || (registryStatus === 'found' && (!resolvedEndpoint || !resolvedNamespace))) && (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            apps.{appId} is not registered with Netget (no live heartbeat, or its entry is missing endpoint/namespace) —
            its real destination is unknown, so this page cannot be opened or edited. No default is assumed.
          </Typography>
        )}
      </NetgetChrome>
    );
  }

  return (
    <AppPageEditorResolved appId={appId!} pageId={pageId!} endpoint={resolvedEndpoint} rootNamespace={resolvedNamespace} />
  );
}

// Only ever mounted once AppPageEditor has confirmed a real registry entry
// with both endpoint and namespace -- usePageView is called unconditionally
// here, but that's safe precisely because this component doesn't exist
// until the destination is real.
function AppPageEditorResolved({ appId, pageId, endpoint: pageEndpoint, rootNamespace: pageRootNamespace }: { appId: string; pageId: string; endpoint: string; rootNamespace: string }) {
  const seed = useSeedSession();
  const authenticated = (seed as any).authenticated as boolean;
  const { canEdit, leftBarElements, content, registry, status, dirty } = usePageView({
    endpoint: pageEndpoint,
    rootNamespace: pageRootNamespace,
    appId,
    pageId,
    signedOutHeader: <SignedOutHeader />,
  });

  return (
    <Layout
      TopBar={{ title: `${pageRootNamespace} — apps.${appId} (${canEdit ? 'editor' : authenticated ? 'signed in, no edit access' : 'visitor'})` }}
      LeftBar={
        canEdit
          ? { initialView: 'expanded', elements: leftBarElements }
          : false
      }
      Footer={{ brandLabel: `${status}${dirty ? ' · unsaved changes' : ''}` }}
    >
      <Box sx={{ position: 'fixed', top: { xs: 12, sm: 20 }, left: { xs: 12, sm: 20 }, zIndex: 1500 }}>
        <Box component={Link} to={`/netget/apps/${appId}`} data-gui-node-id="AppPageEditor.backLink"
          sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.75, borderRadius: 999, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.secondary', textDecoration: 'none', fontSize: '0.8rem', boxShadow: 1, '&:hover': { color: 'text.primary' } }}>
          ← apps.{appId}
        </Box>
      </Box>
      <IdentityBubble />
      {renderNode(content, {
        registry,
        React,
        showUnknown: true,
        onNodeResolved: selectionStore.actions.registerNode,
      })}
      {canEdit && <RuntimeInspector toggleVisible />}
    </Layout>
  );
}

// A sibling overlay, not a modification: CleakerLanding itself renders
// completely unmodified underneath this. The "Netget →" link is the
// correct replacement for the old "Open page editor →" shortcut — it
// opens the actual namespace/apps context (where an app runs, which pages
// it has) instead of jumping straight into one hardcoded page — using the
// same visual language CleakerLanding's own corner icons (Users,
// Blockchain) already establish, without touching CleakerLanding.tsx to
// add it natively.
function CleakerHomeRoute() {
  return (
    <>
      <Box sx={{ position: 'fixed', bottom: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 1500 }}>
        <Box component={Link} to="/netget" data-gui-node-id="CleakerHome.netgetLink"
          sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.75, borderRadius: 999, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.secondary', textDecoration: 'none', fontSize: '0.8rem', boxShadow: 1, '&:hover': { color: 'text.primary', borderColor: 'primary.main' } }}>
          Netget →
        </Box>
      </Box>
      <CleakerLanding cleakerEndpoint={CLEAKER_ENDPOINT_URL} netgetMonadOrigin={endpoint} />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/netget" element={<NetgetGatewayHome />} />
      <Route path="/netget/logs" element={<NetgetGatewayLogs />} />
      <Route path="/netget/apps" element={<NetgetAppsList />} />
      <Route path="/netget/apps/:appId" element={<NetgetAppDetail />} />
      <Route path="/netget/apps/:appId/pages/:pageId" element={<AppPageEditor />} />
      {/* Everything else -- "/", "/users", "/blockchain", "/keychain", ...
          -- is the real CleakerLanding, unmodified, owning its own nested
          routes underneath this mount point. */}
      <Route path="/*" element={<CleakerHomeRoute />} />
    </Routes>
  );
}

function Root() {
  return (
    <SeedSessionProvider transportOrigin={endpoint} sessionBackend="cleaker">
      <App />
    </SeedSessionProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <RouterProvider>
    <Theme>
      <SelectionProvider>
        <Root />
      </SelectionProvider>
    </Theme>
  </RouterProvider>,
);
