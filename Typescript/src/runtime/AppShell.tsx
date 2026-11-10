import React, { Suspense, useCallback, useEffect, useMemo } from 'react';
import { GuiPage, GuiNavProvider, type GuiNav } from '@/gui/All.This/GUI/GuiPages';
import { flattenGuiDocument, renderGuiDocumentPage, GUI_DOCUMENT } from './guiDocument';
import { ThemeSettingsContext } from './themeSettings';
import Theme from '@/gui/Theme/Theme';
import Layout from '@/gui/Layout/Layout';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import DevToolsLauncher from './DevToolsLauncher';
import MeLauncher from '@/react/session/MeLauncher';
import { useOptionalSessionSurface } from '@/react/session/SessionSurface';
import { SeedSessionProvider, useOptionalSeedSessionContext } from '@/react/session/SeedSessionProvider';
import QRConnect from '@/gui/All.This/Cleaker/QRConnect';
import { Me, useOptionalMeRuntimeContext } from '@/react/Me';
import { useMeAction } from '@/react/useMeAction';
import { useMeValue } from '@/react/useMeValue';
import { CompactAt, FloatingMark, IdentityText, LeftBarPosition, TopBarPosition, WhereText, atWhere, marksInBars, placeMarks, splitPosition, topBarPosition, useNarrowBars, whoLines, type MarkCorner } from '@/gui/Layout/Position/Position';
import Box from '@/gui/Atoms/Box/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CleakerQrMenu, { panelPositionFor } from '@/gui/All.This/Cleaker/Corner/CleakerQrMenu';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import type { MeLike } from '@/react/types';
import { NamespaceRoutePanel, type NamespaceRouteItem, type NamespaceRouteProps } from '@/gui/Layout/Position/NamespaceRoute';
import { SelectionProvider } from './selection';
import { LauncherPopoverProvider } from './launcherPopover';
import { RuntimeEnvironmentProvider } from './runtimeContext';
import { RuntimeInspector } from './inspector';
import { declareApp, isSpecViewFactory } from './mountApp';
import type { AppDeclaration } from './mountApp';
import { SpecBoundary } from './SpecBoundary';
import type { RuntimeAdapter } from './adapter';
import { writeMeValue } from './run-me';


function readQrValue(node: React.ReactNode): string | undefined {
  if (!React.isValidElement(node)) return undefined;
  const props = node.props as { value?: unknown; children?: React.ReactNode };
  if (typeof props.value === 'string' && props.value) return props.value;
  for (const child of React.Children.toArray(props.children)) {
    const found = readQrValue(child);
    if (found) return found;
  }
  return undefined;
}

export interface AppShellNavItem {
  route: string;
  label: string;
  icon?: string;
}

export interface AppShellProps {
  app: AppDeclaration;
  me: MeLike;
  runtime?: RuntimeAdapter;
  /** LeftBar nav items — every app declares its own; nothing here is app-specific. */
  navItems: AppShellNavItem[];
  /**
   * Mounts SelectionProvider/RuntimeInspector (grid overlay + click-to-Explain
   * side panel) alongside the default ThemeLauncher footer bubble. On by
   * default — same "devtools available unless you opt out" stance as
   * mount()'s own `devtools` option, so an app gets this for free instead of
   * every app hand-wiring SelectionProvider+RuntimeEnvironmentProvider+
   * RuntimeInspector itself (the exact gap FullTrailer had before this was
   * extracted here).
   */
  devtools?: boolean;
  /** Extra LeftBar footer actions rendered after Theme/DevTools defaults. */
  footerElements?: React.ReactNode[];
  /**
   * Where you are, written once at the top-left of every view (e.g. `my-app.local @ localhost:5173`): in the top bar
   * while the left bar is closed, in the left bar's header (beside the brand) while it is open, so opening the bar moves
   * it instead of pushing it. Opt-in: with no `position` the shell draws no top bar, as before.
   */
  position?: string;
  /** The app's mark leading the LeftBar header (a logo, an initial). Opt-in; the bar's own arrow still expands it. */
  brand?: React.ReactNode;
  /**
   * The person's mark (their QR.me badge: who they are, where they go), apart from the app's `brand` -- two owners, never
   * one cell (Roles-and-Territories.md §3). Placed at `identityCorner` (the person's choice); the brand then takes the
   * other end (placeMarks). Without it the brand leads the left bar, as before.
   */
  identity?: React.ReactNode;
  /** The person's corner for `identity`. Default top-left. */
  identityCorner?: MarkCorner;
  /**
   * The person's username, shown on top of the namespace beside their QR (`jabellae` / `cleaker.me`) while the bar shows
   * text. Without it, the namespace alone. With `identity` and `brand`, the position is split between the marks: who
   * beside the QR, `@where` beside the brand.
   */
  identityUsername?: string;
  /**
   * The namespace this app is reached through (`cleaker.me`), when it is not the app itself: the person's, beside the
   * app's own views. Its routes (`namespaceRoutes`) are drawn in the left bar after the app's items and open in the
   * content area's place, over the app's view (which stays as it is underneath), never as a route of the app.
   */
  namespace?: string;
  /** The namespace's routes (Users, Blockchain, Netget, Monad…), as the namespace's own shell draws them. */
  namespaceRoutes?: NamespaceRouteItem[];
  /** Views for the namespace's routes, by route; the GUI's own pages are always there. */
  namespacePages?: Record<string, React.ComponentType<NamespaceRouteProps>>;
}

/**
 * Reads the current route from `.me` (`${app.namespace}.route`) and renders
 * the matching view. Route changes (a nav item calling useMeAction's setter)
 * re-render this automatically since useMeValue subscribes to that path —
 * this is what gives the shell live routing instead of mountApp()'s
 * one-shot `window.location.pathname` read at boot.
 *
 * Branches on isSpecViewFactory() the same way mountApp() does: a
 * defineSpecView()-tagged factory renders through SpecBoundary (so it
 * participates in the Semantic Inspector graph); anything else is treated
 * as a plain React.ComponentType. SpecBoundary's `runtime` prop is explicit,
 * not context-aware — passing nothing here silently falls back to the
 * renderer's identity-passthrough defaultAdapter, so a spec view's
 * {read: ...} tokens would just echo the raw path string back instead of
 * resolving. Pull the real adapter out of Me's own context
 * and hand it down explicitly.
 *
 * Suspense wraps the ComponentType branch for apps whose views are
 * React.lazy()-wrapped (a common pattern for splitting infrequently-visited
 * views out of the main bundle) — a plain component doesn't need it (lazy()'s
 * own promise resolves before render either way), but a lazy one throws a
 * promise on first render, and only a Suspense ancestor can catch that.
 */
// The GUI's own pages (/GUI, /GUI/themes, /GUI/layout), as GUI.document.json declares them, by their route without the
// leading slash: in AppShell they are routes of the app like its own views (`GUI/themes`), the same pages netget's shell
// serves at the same paths.
const GUI_PAGES_ID = 'GUI.window.layout.content.gui';
const GUI_PAGE_BY_ROUTE = new Map(
  flattenGuiDocument(GUI_DOCUMENT)
    .filter((e) => (e.id === GUI_PAGES_ID || e.id.startsWith(`${GUI_PAGES_ID}.`)) && e.component && e.route)
    .map((e) => [String(e.route).replace(/^\/+/, ''), e.id] as const),
);
const GUI_PAGE_REGISTRY = { GuiPage };
/** The route a GUI page's link goes to, as AppShell's `.me` route (`/GUI/themes` -> `GUI/themes`, `/` -> `home`). */
const routeOf = (to: string) => to.replace(/^\/+/, '').replace(/\/+$/, '') || 'home';

function ActiveView({ app }: { app: AppDeclaration }) {
  const route = useMeValue<string>(`${app.namespace}.route`);
  const setRoute = useMeAction(`${app.namespace}.route`);
  const runtimeContext = useOptionalMeRuntimeContext();
  const guiPageId = route ? GUI_PAGE_BY_ROUTE.get(route) : undefined;
  const nav = useMemo<GuiNav>(() => ({ pathname: `/${route ?? ''}`, go: (to) => setRoute(routeOf(to)) }), [route, setRoute]);
  if (guiPageId) {
    return (
      <GuiNavProvider value={nav}>
        {renderGuiDocumentPage(guiPageId, { React, registry: GUI_PAGE_REGISTRY, doc: GUI_DOCUMENT, props: { guiDocument: GUI_DOCUMENT } })}
      </GuiNavProvider>
    );
  }
  const view = app.views[route ?? ''] ?? app.views.home;
  if (isSpecViewFactory(view)) {
    return <SpecBoundary spec={view()} runtime={runtimeContext?.runtime ?? undefined} />;
  }
  const View = view as React.ComponentType;
  return (
    <Suspense fallback={null}>
      <View />
    </Suspense>
  );
}


function namespaceEndpoint(namespace: string): string {
  const host = namespace.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) || /\.local(?::\d+)?$/i.test(host) || host.includes('localhost');
  return `${local ? 'http' : 'https'}://${host}`;
}

/** When the page is not the namespace, AppShell still needs a session so Sign in can happen in the QR panel. */
function AppShellSession({ namespace, children }: { namespace?: string; children: React.ReactNode }) {
  const existing = useOptionalSeedSessionContext();
  if (existing || !namespace) return <>{children}</>;
  return (
    <SeedSessionProvider transportOrigin={namespaceEndpoint(namespace)} sessionBackend="cleaker">
      {children}
    </SeedSessionProvider>
  );
}

function AppShellNav({ app, navItems, footerElements, position, brand, identity, identityCorner = 'top-left', identityUsername, namespace, namespaceRoutes, namespacePages }: Pick<AppShellProps, 'app' | 'navItems' | 'footerElements' | 'position' | 'brand' | 'identity' | 'identityCorner' | 'identityUsername' | 'namespace' | 'namespaceRoutes' | 'namespacePages'>) {
  const route = useMeValue<string>(`${app.namespace}.route`) ?? 'home';
  const setRoute = useMeAction(`${app.namespace}.route`);
  // The theme launcher's gear opens the GUI's theme page (GUI/themes), as in netget's shell; not a dialog.
  const openThemeSettings = useCallback(() => setRoute('GUI/themes'), [setRoute]);
  // MeLauncher renders nothing without a session provider, but LeftBar still
  // wraps it in a padded row — that empty row sat between Theme and Dev Tools.
  const session = useOptionalSeedSessionContext();
  const showMeLauncher = Boolean(useOptionalSessionSurface() || session);
  const authenticated = Boolean(session?.authenticated);

  // The namespace route open over the app's view, if any (the app's own route is unchanged under it).
  const [openRoute, setOpenRoute] = React.useState<{ route: string; label?: string } | null>(null);
  const goRoute = useCallback((r: string) => setOpenRoute({ route: r }), []);
  const closeRoute = useCallback(() => setOpenRoute(null), []);
  const [corner, setCorner] = React.useState<MarkCorner>(identityCorner);
  React.useEffect(() => { setCorner(identityCorner); }, [identityCorner]);
  const [qrMenuOpen, setQrMenuOpen] = React.useState(false);
  const [qrSignIn, setQrSignIn] = React.useState(false);
  // One QR, one status: the bar mark and the panel are the same identity QR.
  // On a page that is not the namespace, that mark is already connected; the
  // panel must not open a second channel just to colour it.
  const identityQrStatus = 'confirmed' as const;
  const qrCellRef = React.useRef<HTMLElement>(null);
  const qrValue = React.useMemo(() => readQrValue(identity), [identity]);
  React.useEffect(() => {
    if (!qrMenuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setQrMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qrMenuOpen]);
  React.useEffect(() => {
    if (!qrMenuOpen || authenticated) setQrSignIn(false);
  }, [qrMenuOpen, authenticated]);
  const identityMark = React.useMemo(() => {
    if (!identity || !React.isValidElement(identity)) return identity;
    const prev = identity as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(prev, {
      ref: qrCellRef,
      onClick: (event: React.MouseEvent) => {
        const inherited = prev.props.onClick as ((e: React.MouseEvent) => void) | undefined;
        inherited?.(event);
        setQrMenuOpen((open) => !open);
      },
    } as Partial<typeof prev.props>);
  }, [identity]);

  const elements = [
    // the app's own views: choosing one shows it (and closes a namespace route open over it)
    ...navItems.map(({ route: r, label, icon }) => ({
      type: 'link' as const,
      props: {
        label,
        icon,
        active: !openRoute && route === r,
        onClick: () => { setOpenRoute(null); setRoute(r); },
      },
    })),
    // the namespace's routes: they open over the app's view, never as a route of the app
    ...(namespaceRoutes ?? []).map((it) => ({
      type: 'link' as const,
      props: {
        label: it.label,
        icon: it.icon ?? 'link',
        active: openRoute?.route === it.route,
        onClick: () => setOpenRoute((cur) => (cur?.route === it.route ? null : { route: it.route, label: it.label })),
        'data-gui-node-id': `GUI.window.layout.bars.left.${it.route.replace(/^\//, '').replace(/\//g, '.') || 'root'}`,
      },
    })),
  ];

  // The two marks: the person's where they put it, the app's at the other end (placeMarks). With no identity the brand
  // leads the left bar, as it always has.
  const narrow = useNarrowBars();
  const placement = identity
    ? placeMarks({ identity: corner, bars: { top: Boolean(position), left: true }, narrow, brand: Boolean(brand) })
    : { identity: 'none' as const, brand: brand ? ('left.brand' as const) : ('none' as const) };
  // With the person's mark, the position is split between the marks (who beside the QR, @where beside the brand); with
  // no brand the place stays with the QR, and the whole position stays in the top bar as before.
  const parts = splitPosition(position ?? '');
  const who = whoLines(parts.who, identityUsername);
  const split = Boolean(identity && brand && parts.where);
  const brandMark = React.useMemo(() => {
    if (!brand || !React.isValidElement(brand) || placement.brand === 'left.brand') return brand;
    return React.cloneElement(brand as React.ReactElement<{ compact?: boolean }>, { compact: true });
  }, [brand, placement.brand]);
  const marks = marksInBars(
    placement,
    {
      identity: identityMark,
      brand: brandMark,
      identityText: identity && parts.who ? <IdentityText title={position} primary={who.primary} secondary={who.secondary} extra={brand ? null : atWhere(parts.where)} /> : undefined,
      brandText: identity && brand && parts.where ? <WhereText title={position} where={atWhere(parts.where)} /> : undefined,
    },
    { topText: !narrow },
  );

  return (
    <ThemeSettingsContext.Provider value={openThemeSettings}>
    <Layout
      TopBar={position ? {
        hideBrand: true,
        noBorder: true,
        toolbarSx: { pl: 0.25 },
        elementsLeftSx: { pl: 1 },
        // the position while the left bar is not expanded (Position.tsx: written once, moved, not pushed)
        elementsLeft: [...marks.topStart, ...(split ? [] : [topBarPosition(<TopBarPosition title={position}><CompactAt text={position} /></TopBarPosition>)])],
        ...(marks.topEnd.length ? { elementsRight: marks.topEnd } : {}),
      } : undefined}
      LeftBar={{
        initialView: 'expanded',
        brand: marks.leftBrand,
        // Shown while the bar is open: where you are, written out (the top bar shows it only while the bar is closed).
        // the text of the mark in the bar's head (who, or @where); without the person's mark, the whole position as before
        header: identity ? marks.leftHeader : position ? <LeftBarPosition besideMark={!!marks.leftBrand} title={position}>{position}</LeftBarPosition> : undefined,
        elements,
        footerElements: [
          // tooltip: false — each of these already opens its own hover
          // popper (see LeftSidebarAction's `tooltip` prop doc).
          // Theme and Dev Tools stay adjacent, same as Namespace.
          { type: 'action', props: { element: <ThemeLauncher />, tooltip: false } },
          { type: 'action', props: { element: <DevToolsLauncher />, tooltip: false } },
          ...(showMeLauncher ? [{ type: 'action' as const, props: { element: <MeLauncher />, tooltip: false } }] : []),
          ...(footerElements ?? []).map((element) => ({ type: 'action' as const, props: { element } })),
          ...marks.leftFooter,
        ],
      }}
    >
      <ActiveView app={app} />
    </Layout>
    {marks.float && <FloatingMark corner={marks.float.corner}>{marks.float.element}</FloatingMark>}
    {qrMenuOpen && identity ? (
      <ClickAwayListener
        onClickAway={(event) => {
          const target = event.target;
          if (qrCellRef.current && target instanceof Node && qrCellRef.current.contains(target)) return;
          setQrMenuOpen(false);
        }}
      >
        <Box sx={{ position: 'fixed', zIndex: (theme: any) => (theme.zIndex?.modal ?? 1300) + 1, ...panelPositionFor(placement.identity, corner) }}>
          <CleakerQrMenu
            fullPosition={position ?? ''}
            showNamespaceForm={false}
            corner={corner}
            onMoveTo={setCorner}
            onClose={() => setQrMenuOpen(false)}
            layout={{ address: position, brand: undefined }}
          >
            {qrSignIn && namespace ? (
              <QRConnect
                compact
                qrStatus={identityQrStatus}
                cleakerEndpoint={namespaceEndpoint(namespace)}
                username={identityUsername}
                data-gui-node-id="GUI.window.layout.marks.identity.menu"
              />
            ) : (
              <MeLoginStatus
                nodeId="GUI.window.layout.marks.identity.menu"
                authenticated={authenticated}
                qr={{
                  value: qrValue || (namespace ? `https://${namespace}/?at=${encodeURIComponent(window.location.origin)}` : (position || window.location.origin)),
                  username: authenticated && session?.semanticNamespace ? String(session.semanticNamespace).split('.')[0] : identityUsername,
                  status: identityQrStatus,
                  statusLabel: "Connected",
                  perimeterLabel: position,
                  perimeterRootLabel: namespace,
                }}
                identityHash={session?.identityHash}
                onNavigate={(to) => { setQrMenuOpen(false); goRoute(to); }}
                onLogout={() => { session?.logout(); setQrMenuOpen(false); }}
                onSignIn={() => setQrSignIn(true)}
              />
            )}
          </CleakerQrMenu>
        </Box>
      </ClickAwayListener>
    ) : null}
    <NamespaceRoutePanel
      route={openRoute?.route ?? null}
      label={openRoute?.label}
      namespace={namespace ?? null}
      pages={namespacePages}
      go={goRoute}
      onClose={closeRoute}
    />
    </ThemeSettingsContext.Provider>
  );
}

/**
 * The generic app shell: declares the app in `.me`, seeds the initial route
 * from the URL once, then renders Theme -> (devtools providers) ->
 * Me -> nav + Layout -> the active view. This is the reactive,
 * mixed-view (spec-tree AND plain React), devtools-enabled counterpart to
 * mountApp() — mountApp() targets the UMD/global-`window.GUI` distribution
 * (one view resolved once at boot, no live route, devtools only on its
 * spec-factory branch); this targets a real Vite/ESM app that wants routing
 * driven by `.me` itself and a working DevTools bubble regardless of which
 * view type is active. Extracted from FullTrailer's own runtime.tsx, which
 * had reimplemented this exact composition — nothing below is
 * FullTrailer-specific; `navItems` is the one thing every app supplies.
 */
export function AppShell({ app, me, runtime, navItems, devtools = true, footerElements, position, brand, identity, identityCorner, identityUsername, namespace, namespaceRoutes, namespacePages }: AppShellProps) {
  useEffect(() => {
    declareApp(me, app);
    const initialPath = window.location.pathname.replace(/^\/+/, '') || 'home';
    writeMeValue(me, `${app.namespace}.route`, app.views[initialPath] ? initialPath : 'home');
    // Runs once per mount (i.e. once per session) — me/app/runtime are
    // stable for the lifetime of an authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const body = (
    <AppShellSession namespace={namespace}>
      <Me me={me} runtime={runtime}>
        <AppShellNav app={app} navItems={navItems} footerElements={footerElements} position={position} brand={brand} identity={identity} identityCorner={identityCorner} identityUsername={identityUsername} namespace={namespace} namespaceRoutes={namespaceRoutes} namespacePages={namespacePages} />
      </Me>
    </AppShellSession>
  );

  return (
    <Theme initialThemeId={app.theme}>
      <LauncherPopoverProvider>
        {devtools ? (
          <SelectionProvider>
            <RuntimeEnvironmentProvider value={{ me, runtime }}>
              {body}
              <RuntimeInspector />
            </RuntimeEnvironmentProvider>
          </SelectionProvider>
        ) : (
          body
        )}
      </LauncherPopoverProvider>
    </Theme>
  );
}

