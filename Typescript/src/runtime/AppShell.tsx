import { pagePlaceUrl } from '@/react/positionExpression';
import React, { Suspense, useCallback, useEffect, useMemo } from 'react';
import { GuiPage, GuiNavProvider, type GuiNav } from '@/gui/All.This/GUI/GuiPages';
import { flattenGuiDocument, renderGuiDocumentPage, GUI_DOCUMENT } from './guiDocument';
import { ThemeSettingsContext, GuiPageContext } from './themeSettings';
import Theme from '@/gui/Theme/Theme';
import Layout from '@/gui/Layout/Layout';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import { SeedSessionProvider, useOptionalSeedSessionContext } from '@/react/session/SeedSessionProvider';
import QRConnect from '@/gui/All.This/Cleaker/QRConnect';
import { Me, useOptionalMeRuntimeContext } from '@/react/Me';
import { useMeAction } from '@/react/useMeAction';
import { useMeValue } from '@/react/useMeValue';
import { CompactAt, FloatingMark, IdentityButton, IdentityText, LeftBarPosition, TopBarPosition, WhereText, atWhere, collapsedBarHandleProps, cornerOfSlot, marksInBars, opposingCorner, placeMarks, resolveMarkCorners, slotEdge, slotForCorner, splitPosition, topBarPosition, useNarrowBars, whoLines, type MarkCorner } from '@/gui/Layout/Position/Position';
import { type BarMode, type LayoutBarId } from '@/gui/Layout/Position/barMode';
import { readBrandPosition, readQrMePosition, writeBrandPosition, writeQrMePosition } from '@/gui/Layout/Position/qrMePosition';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import type { MeLike } from '@/react/types';
import { NamespaceRoutePanel, type NamespaceRouteItem, type NamespaceRouteProps } from '@/gui/Layout/Position/NamespaceRoute';
import CornerMark, { CornerMarkHost } from '@/gui/Layout/Position/CornerMark';
import { SelectionProvider } from './selection';
import { LauncherPopoverProvider } from './launcherPopover';
import { RuntimeEnvironmentProvider } from './runtimeContext';
import { RuntimeInspector } from './inspector';
import { declareApp, isSpecViewFactory } from './mountApp';
import type { AppDeclaration } from './mountApp';
import { SpecBoundary } from './SpecBoundary';
import type { RuntimeAdapter } from './adapter';
import { writeMeValue } from './run-me';
import { meConnectStatus, useMeConnect, type MeConnectConfig } from '@/gui/All.This/me/QR/useMeConnect';


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

/** The identity mark with its QR's props replaced (the first element carrying a string `value`, as readQrValue finds it). */
function withQrProps(node: React.ReactNode, next: Record<string, unknown>): React.ReactNode {
  if (!React.isValidElement(node)) return node;
  const el = node as React.ReactElement<{ value?: unknown; children?: React.ReactNode }>;
  if (typeof el.props.value === 'string' && el.props.value) return React.cloneElement(el, next);
  if (el.props.children === undefined) return el;
  let done = false;
  const children = React.Children.map(el.props.children, (child) => {
    if (done) return child;
    const out = withQrProps(child, next);
    if (out !== child) done = true;
    return out;
  });
  return done ? React.cloneElement(el, undefined, ...(children ?? [])) : el;
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
   * The person's mark (their QR.me badge: who they are, where they go), apart from the app's `brand`. They share the
   * corner-mark rule (each with its own corner) but not the modal: the QR opens CleakerQrMenu; the brand unfolds its
   * icons in the bar it sits on. Placed at `identityCorner` (the person's choice); the brand takes the other end by
   * default (placeMarks), or `brandCorner` when that is declared. They may be placed freely but never in the same
   * place: a collision jumps the other by `opposingCorner`. Without a brand the left bar is as before.
   */
  identity?: React.ReactNode;
  /** The person's corner for `identity`. Default top-left. */
  identityCorner?: MarkCorner;
  /**
   * The brand's own corner. When omitted, the brand takes the other end of the QR (the default). When set, the two
   * marks are independent, but they never share a cell: if one is placed on the other, the other jumps by the same
   * opposition rule (`opposingCorner`). There is no settings panel on the brand — placement is this prop (and the
   * story's `brandCorner` control). The QR's position grid still shows where the brand sits.
   */
  brandCorner?: MarkCorner;
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
  /**
   * Starting mode of each shell bar (`off` closed, `on` icons/rail, `expanded` open).
   * Omitted sides keep the shell's current defaults: top on when `position` is set, left
   * expanded, right expanded when a mark sits on the right, bottom off. The person can
   * still open or close bars from the QR's position grid. Does not change the global default.
   */
  initialBarModes?: Partial<Record<LayoutBarId, BarMode>>;
  /**
   * Makes the identity QR "connect your .me" on a site that does not know whose .me is active: while not connected,
   * tapping it opens the identity agent's window (`agentUrl`, its own origin) to approve; once approved the QR carries
   * `https://<namespace>`, the text beside it shows that .me, and its menu signs it out (useMeConnect). The site gets the
   * namespace and a one-time proof, never a key. Without it, the QR behaves as before.
   */
  identityConnect?: MeConnectConfig;
  /**
   * When set, the signed-in identity card (the QR.me menu) shows this under the QR instead of the
   * icon row that navigates away — typically IdentityTree, the same component as Pieces/QR.me → Signed In.
   * Without it, the card is unchanged. The card opens only after the person is connected, or when
   * `identityConnect` is off (the menu as before).
   */
  identityTree?: React.ReactNode;
  /**
   * Where the theme is chosen. `bar` (default): the theme launcher in the left bar's foot. `card`: the theme is the
   * person's (their .me), not the app's, so it lives in the namespace card's settings (the QR card's gear, beside the
   * QR's position) and the bar holds no launcher.
   */
  themeIn?: 'bar' | 'card';
  /**
   * Public path segments of the open keys branch (`['keys']`, `['keys','paypal','sandbox']`), never values.
   * The QR in the card follows this path, the same way Pieces/QR.me → Signed In does.
   */
  identityQrPath?: readonly string[];
  /**
   * Namespace routes that open the identity card instead of the content-area overlay (e.g. `/keychain`,
   * whose view belongs in the card). Other routes still open over the page.
   */
  namespaceCardRoutes?: readonly string[];
  /** Called when a `namespaceCardRoutes` item is chosen, so the card can open that section. */
  onNamespaceCardRoute?: (route: string) => void;
  /** Called when the identity card opens or closes. */
  onIdentityCardOpenChange?: (open: boolean) => void;
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


function defaultAppShellBarModes(opts: {
  position?: string;
  identity?: React.ReactNode;
  brand?: React.ReactNode;
  identityCorner: MarkCorner;
  brandCorner?: MarkCorner;
}): Record<LayoutBarId, BarMode> {
  const markBarsBase = { top: Boolean(opts.position), left: true as const };
  const brandCornerForRight = opts.brand
    ? (opts.brandCorner ?? (opts.identity ? opposingCorner(opts.identityCorner, { ...markBarsBase, right: true }) : undefined))
    : undefined;
  const wantRight = Boolean(
    (opts.identity && opts.identityCorner.endsWith('right')) ||
    (brandCornerForRight && brandCornerForRight.endsWith('right')),
  );
  return {
    top: opts.position ? 'on' : 'off',
    left: 'expanded',
    right: wantRight ? 'expanded' : 'off',
    bottom: 'off',
  };
}

/** Public path only: `https://jabellae.cleaker.me` + ['keys','paypal'] → `https://jabellae.cleaker.me/keys/paypal`. Query strings stay at the end. */
function withQrPath(base: string, segments: readonly string[] | undefined): string {
  if (!base || !segments?.length) return base;
  const tail = `/${segments.map(encodeURIComponent).join('/')}`;
  const q = base.indexOf('?');
  const head = (q >= 0 ? base.slice(0, q) : base).replace(/\/+$/, '');
  return `${head}${tail}${q >= 0 ? base.slice(q) : ''}`;
}

function AppShellNav({ app, navItems, footerElements, position, brand, identity: identityProp, identityCorner = 'top-left', brandCorner: brandCornerProp, identityUsername, namespace, namespaceRoutes, namespacePages, initialBarModes, identityConnect, identityTree, identityQrPath, namespaceCardRoutes, onNamespaceCardRoute, onIdentityCardOpenChange, themeIn = 'bar' }: Pick<AppShellProps, 'themeIn' | 'app' | 'navItems' | 'footerElements' | 'position' | 'brand' | 'identity' | 'identityCorner' | 'brandCorner' | 'identityUsername' | 'namespace' | 'namespaceRoutes' | 'namespacePages' | 'initialBarModes' | 'identityConnect' | 'identityTree' | 'identityQrPath' | 'namespaceCardRoutes' | 'onNamespaceCardRoute' | 'onIdentityCardOpenChange'>) {
  const route = useMeValue<string>(`${app.namespace}.route`) ?? 'home';
  const setRoute = useMeAction(`${app.namespace}.route`);
  // The theme launcher's gear opens the GUI's theme page (GUI/themes), as in netget's shell; not a dialog.
  const openThemeSettings = useCallback(() => setRoute('GUI/themes'), [setRoute]);
  const openGuiPage = useCallback((route: string) => setRoute(route.replace(/^\//, '')), [setRoute]);
  const session = useOptionalSeedSessionContext();
  const authenticated = Boolean(session?.authenticated);
  // `identityConnect`: the identity QR itself connects the person's .me (useMeConnect); without it, untouched.
  const meConnect = useMeConnect(identityConnect);
  const connected = meConnect.connection;
  const connectedName = connected ? connected.namespace.split('.')[0] : undefined;
  const identity = React.useMemo(() => {
    if (!meConnect.enabled || !React.isValidElement(identityProp)) return identityProp;
    const qrStatus = connected ? 'confirmed' : meConnect.busy ? 'checking' : meConnect.state.kind === 'refused' ? 'error' : 'idle';
    const marked = withQrProps(identityProp, { value: meConnect.value, status: qrStatus });
    return React.isValidElement(marked)
      ? React.cloneElement(marked as React.ReactElement<Record<string, unknown>>, {
          'data-me-connect': meConnect.state.kind,
          'data-qr-value': meConnect.value,
          'aria-busy': meConnect.busy || undefined,
          title: connected ? `your .me: ${connected.namespace}` : 'connect your .me',
        })
      : marked;
  }, [identityProp, meConnect.enabled, meConnect.value, meConnect.busy, meConnect.state.kind, connected]);
  // The connect state as a calm status beside the QR (short words; the full sentence and its code in its tooltip).
  const connectStatus = meConnect.enabled ? meConnectStatus(meConnect.state) : null;

  // The namespace route open over the app's view, if any (the app's own route is unchanged under it).
  const [openRoute, setOpenRoute] = React.useState<{ route: string; label?: string } | null>(null);
  const goRoute = useCallback((r: string) => setOpenRoute({ route: r }), []);
  const closeRoute = useCallback(() => setOpenRoute(null), []);
  const markBarsForProps = { top: Boolean(position), left: true };
  const [corner, setCorner] = React.useState<MarkCorner>(() => resolveMarkCorners(readQrMePosition(undefined, identityCorner), brandCornerProp, markBarsForProps).identity);
  const [brandAt, setBrandAt] = React.useState<MarkCorner | undefined>(() => resolveMarkCorners(readQrMePosition(undefined, identityCorner), readBrandPosition() ?? brandCornerProp, markBarsForProps).brandCorner);
  const [qrMenuOpen, setQrMenuOpen] = React.useState(false);
  // The card's view lives here: moving the QR re-mounts the card in its new bar, and it must stay in its settings.
  const [qrMenuView, setQrMenuView] = React.useState<'home' | 'position'>('home');
  React.useEffect(() => { if (!qrMenuOpen) setQrMenuView('home'); }, [qrMenuOpen]);
  const [barModes, setBarModes] = React.useState<Record<LayoutBarId, BarMode>>(() => ({
    ...defaultAppShellBarModes({
      position,
      identity,
      brand,
      identityCorner,
      brandCorner: brandCornerProp,
    }),
    ...initialBarModes,
  }));
  const chooseBarMode = React.useCallback((id: LayoutBarId, mode: BarMode) => {
    setBarModes((prev) => ({ ...prev, [id]: mode }));
  }, []);
  // App icons (Home, Notes, ...) in the brand's bar — the same way namespace routes (Monad, ...) sit in the QR's bar.
  // Clicking the brand toggles them. They start open, like Monad in the QR's bar.
  const [brandNavOpen, setBrandNavOpen] = React.useState(true);
  const prevCorners = React.useRef({ identity: identityCorner, brandCorner: brandCornerProp });
  React.useEffect(() => {
    const bars = { top: Boolean(position), left: true };
    const prev = prevCorners.current;
    const identityChanged = prev.identity !== identityCorner;
    const brandPropChanged = prev.brandCorner !== brandCornerProp;
    prevCorners.current = { identity: identityCorner, brandCorner: brandCornerProp };
    if (!identityChanged && !brandPropChanged) return;
    // Story controls: the mark that just changed stays; the other jumps if they collide.
    // Panel picks live in corner/brandAt and must not be wiped when the other control is untouched.
    if (identityChanged && brandPropChanged) {
      const next = resolveMarkCorners(identityCorner, brandCornerProp, bars, prev);
      setCorner(next.identity);
      setBrandAt(next.brandCorner);
    } else if (identityChanged) {
      writeQrMePosition(identityCorner);
      setCorner(identityCorner);
      setBrandAt((prevAt) => (prevAt === identityCorner ? opposingCorner(identityCorner, bars) : prevAt));
    } else {
      setBrandAt(brandCornerProp);
      if (brandCornerProp) setCorner((prevQr) => (prevQr === brandCornerProp ? opposingCorner(brandCornerProp, bars) : prevQr));
    }
    if (identityChanged) setQrMenuOpen(false);
    // Icons follow the brand to its new bar; their open/closed state is left as it is.
  }, [identityCorner, brandCornerProp, position]);
  const [qrSignIn, setQrSignIn] = React.useState(false);
  // One QR, one status: the bar mark and the panel are the same identity QR.
  // On a page that is not the namespace, that mark is already connected; the
  // panel must not open a second channel just to colour it.
  const identityQrStatus = 'confirmed' as const;
  const qrValue = React.useMemo(() => readQrValue(identity), [identity]);
  React.useEffect(() => {
    if (!qrMenuOpen || authenticated) setQrSignIn(false);
  }, [qrMenuOpen, authenticated]);

  // The app's own views unfold in the bar the brand sits on (sidebar or top bar), the same way the
  // QR's namespace routes (Monad, ...) sit in the QR's bar. Choosing one shows it and closes a namespace route over it.
  // Fallback if there is no brand to unfold from: the app's items stay in the left bar, as before.
  const appElements = navItems.map(({ route: r, label, icon }) => ({
    type: 'link' as const,
    props: {
      label,
      icon,
      active: !openRoute && route === r,
      onClick: () => { setOpenRoute(null); setRoute(r); },
    },
  }));
  // The namespace's routes: they open over the app's view, never as a route of the app. They stay on the QR's side.
  const namespaceElements = (namespaceRoutes ?? []).map((it) => ({
    type: 'link' as const,
    props: {
      label: it.label,
      icon: it.icon ?? 'link',
      active: openRoute?.route === it.route || (Boolean(namespaceCardRoutes?.includes(it.route)) && qrMenuOpen),
      onClick: () => {
        if (namespaceCardRoutes?.includes(it.route)) {
          setOpenRoute(null);
          if (!qrMenuOpen) {
            setQrMenuOpen(true);
            onIdentityCardOpenChange?.(true);
          }
          onNamespaceCardRoute?.(it.route);
          return;
        }
        setOpenRoute((cur) => (cur?.route === it.route ? null : { route: it.route, label: it.label }));
      },
      'data-gui-node-id': `GUI.window.layout.bars.left.${it.route.replace(/^\//, '').replace(/\//g, '.') || 'root'}`,
    },
  }));

  // The two marks share the corner-mark rule (placeMarks, opposingCorner) but not the modal: the QR
  // opens CleakerQrMenu; the brand unfolds its icons in its bar. By default the brand takes the other
  // end of the QR. When brandAt is set, they are independent, but a collision jumps the other — they never share a place.
  const narrow = useNarrowBars();
  const markBars = {
    top: barModes.top !== 'off',
    left: barModes.left !== 'off',
    right: barModes.right !== 'off',
  };
  const placementRaw = identity
    ? placeMarks({ identity: corner, bars: markBars, narrow, brand: Boolean(brand), brandCorner: brandAt })
    : { identity: 'none' as const, brand: brand ? (brandAt ? slotForCorner(brandAt, markBars) : ('left.brand' as const)) : ('none' as const) };
  // No bars: placeMarks returns identity 'corner' and drops the brand. Float both marks so the QR
  // stays clickable (to open bars) and the brand stays visible at the other end.
  const placement = placementRaw.identity === 'corner' && identity
    ? {
        identity: `float:${corner}` as const,
        brand: brand
          ? (`float:${brandAt && brandAt !== corner ? brandAt : opposingCorner(corner, markBars)}` as const)
          : ('none' as const),
      }
    : placementRaw;
  const brandCornerResolved: MarkCorner | undefined = brand
    ? (brandAt ?? (placement.brand !== 'none' ? cornerOfSlot(placement.brand, corner) : undefined))
    : undefined;
  // With the person's mark, the position is split between the marks (who beside the QR, @where beside the brand); with
  // no brand the place stays with the QR, and the whole position stays in the top bar as before.
  const parts = splitPosition(position ?? '');
  const who = connected ? whoLines(connected.namespace, connectedName) : whoLines(parts.who, identityUsername);
  const split = Boolean(identity && brand && parts.where);
  const brandLabel = app.title;
  // In the left bar's head the QR and its text are ONE button (the QR's action); elsewhere the text sits beside it.
  const identityTextNode = identity && (parts.who || connected) ? <IdentityText title={position} primary={who.primary} secondary={who.secondary} extra={connectStatus ? null : (brand ? null : atWhere(parts.where))} status={connectStatus} /> : undefined;
  const joinIdentity = placement.identity === 'left.brand' && React.isValidElement(identity) && identityTextNode != null;
  const signOut = () => { if (connected) meConnect.forget(); else session?.logout(); setQrMenuOpen(false); };
  const identityMark = identity && React.isValidElement(identity) ? (
    <CornerMark
      corner={corner}
      onMoveTo={(c) => {
        const prevBrand = brandCornerResolved;
        writeQrMePosition(c);
        setCorner(c);
        if (prevBrand && prevBrand !== c) {
          writeBrandPosition(prevBrand);
          setBrandAt(prevBrand);
        }
      }}
      onMoveBrand={brand ? (c) => {
        writeBrandPosition(c);
        setBrandAt(c);
      } : undefined}
      otherCorner={brandCornerResolved ?? null}
      slot={placement.identity}
      trigger={joinIdentity ? <IdentityButton mark={identity as React.ReactElement} text={identityTextNode} /> : identity}
      open={qrMenuOpen}
      onOpenChange={(open) => {
        // Not connected yet: the tap asks for the .me (the agent's window opens inside this click) instead of the menu.
        if (open && meConnect.enabled && !connected) { meConnect.connect(); return; }
        setQrMenuOpen(open);
        onIdentityCardOpenChange?.(open);
      }}
      fullPosition={position ?? ''}
      showNamespaceForm={false}
      barModes={barModes}
      onChooseBarMode={chooseBarMode}
      layout={{ address: position, brand: brandLabel ? { label: brandLabel } : undefined }}
      view={qrMenuView}
      onViewChange={setQrMenuView}
      onSignOut={qrSignIn && namespace ? undefined : signOut}
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
          authenticated={authenticated || Boolean(connected) || Boolean(identityTree)}
          tree={identityTree}
          qr={{
            value: withQrPath(qrValue || (namespace ? `https://${namespace}/?at=${encodeURIComponent(pagePlaceUrl(window.location))}` : (position || window.location.origin)), identityQrPath),
            username: connectedName ?? (authenticated && session?.semanticNamespace ? String(session.semanticNamespace).split('.')[0] : identityUsername),
            status: identityQrStatus,
            statusLabel: "Connected",
            perimeterLabel: withQrPath(connected ? connected.namespace : (identityUsername && namespace ? `${identityUsername}.${namespace}` : (namespace || position || '')), identityQrPath),
            perimeterRootLabel: namespace,
          }}
          identityHash={connected?.identityHash ?? session?.identityHash}
          onNavigate={(to) => { setQrMenuOpen(false); goRoute(to); }}
          onLogout={signOut}
          onSignIn={() => setQrSignIn(true)}
        />
      )}
    </CornerMark>
  ) : identity;
  const brandIsFloating = typeof placement.brand === 'string' && placement.brand.startsWith('float:');
  const brandTrigger = brand && React.isValidElement(brand)
    ? React.cloneElement(brand as React.ReactElement<Record<string, unknown>>, {
        compact: placement.brand !== 'left.brand' && placement.brand !== 'right.brand' ? true : (brand as React.ReactElement<Record<string, unknown>>).props.compact,
        ...(brandIsFloating ? { floating: true } : {}),
      } as Partial<Record<string, unknown>>)
    : brand;
  const brandMark = brandTrigger && React.isValidElement(brandTrigger) ? (
    React.cloneElement(brandTrigger as React.ReactElement<Record<string, unknown>>, {
      'aria-expanded': brandNavOpen,
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        const inherited = (brandTrigger as React.ReactElement<Record<string, unknown>>).props.onClick as ((e: React.MouseEvent<HTMLElement>) => void) | undefined;
        inherited?.(event);
        event.preventDefault();
        event.stopPropagation();
        setBrandNavOpen((open) => !open);
      },
    } as Partial<Record<string, unknown>>)
  ) : brandTrigger;
  const marks = marksInBars(
    placement,
    {
      identity: identityMark,
      brand: brandMark,
      identityText: joinIdentity ? undefined : identityTextNode,
      brandText: identity && brand && parts.where ? <WhereText title={position} where={atWhere(parts.where)} /> : undefined,
    },
    { topText: !narrow },
  );

  // Namespace routes stay on the QR's side (a bar, as before). The app's icons unfold in the bar the
  // brand sits on — left or right sidebar, or the top bar — when brandNavOpen (toggled by clicking the brand).
  // With no brand, the app's items stay in the left bar so other stories keep working.
  const identityEdge = slotEdge(placement.identity);
  const brandSlot = placement.brand;
  const brandInLeft = brandSlot === 'left.brand' || brandSlot === 'left.footer';
  const brandInRight = brandSlot === 'right.brand' || brandSlot === 'right.footer';
  const brandInTopStart = brandSlot === 'top.start';
  const brandInTopEnd = brandSlot === 'top.end';
  const showAppNav = Boolean(brand && brandNavOpen);
  const topAppElements = showAppNav ? navItems.map(({ route: r, label, icon }) => ({
    type: 'link' as const,
    props: {
      label,
      icon,
      active: !openRoute && route === r,
      onClick: () => { setOpenRoute(null); setRoute(r); },
      'data-gui-node-id': `GUI.window.layout.bars.top.${r}`,
    },
  })) : [];
  const leftApp = showAppNav && brandInLeft ? appElements : [];
  const leftNs = brand && identityEdge === 'left' ? namespaceElements : [];
  const leftElements = !brand
    ? appElements
    : (brandSlot === 'left.brand' ? [...leftApp, ...leftNs] : [...leftNs, ...leftApp]);
  const rightApp = showAppNav && brandInRight ? appElements : [];
  const rightNs = brand && identityEdge === 'right' ? namespaceElements : [];
  const rightElements = brandSlot === 'right.brand' ? [...rightApp, ...rightNs] : [...rightNs, ...rightApp];

  const floating = marks.floats.length ? marks.floats : (marks.float ? [marks.float] : []);

  return (
    <ThemeSettingsContext.Provider value={openThemeSettings}><GuiPageContext.Provider value={openGuiPage}><CornerMarkHost>
    <Layout
      TopBar={(position && barModes.top !== 'off') ? {
        hideBrand: true,
        noBorder: true,
        toolbarSx: { pl: 0.25 },
        elementsLeftSx: { pl: 1 },
        // the position while the left bar is not expanded (Position.tsx: written once, moved, not pushed)
        elementsLeft: [...marks.topStart, ...(showAppNav && brandInTopStart ? topAppElements : []), ...(split ? [] : [topBarPosition(<TopBarPosition title={position}><CompactAt text={position} /></TopBarPosition>)])],
        ...((marks.topEnd.length || (showAppNav && brandInTopEnd)) ? { elementsRight: [...(showAppNav && brandInTopEnd ? topAppElements : []), ...marks.topEnd] } : {}),
      } : undefined}
      LeftBar={barModes.left === 'off' ? false : {
        initialView: barModes.left === 'expanded' ? 'expanded' : 'rail',
        brand: marks.leftBrand,
        togglePlacement: placement.brand === 'left.footer' ? 'footer' : 'header',
        ...collapsedBarHandleProps({ narrow, brand, identitySlot: placement.identity }),
        // Shown while the bar is open: where you are, written out (the top bar shows it only while the bar is closed).
        // the text of the mark in the bar's head (who, or @where); without the person's mark, the whole position as before
        header: identity ? marks.leftHeader : position ? <LeftBarPosition besideMark={!!marks.leftBrand} title={position}>{position}</LeftBarPosition> : undefined,
        elements: leftElements,
        footerElements: [
          // tooltip: false — each of these already opens its own hover
          // popper (see LeftSidebarAction's `tooltip` prop doc).
          // Theme and Dev Tools stay adjacent, same as Namespace.
          ...(themeIn === 'card' ? [] : [{ type: 'action' as const, props: { element: <ThemeLauncher />, tooltip: false } }]),
          ...(footerElements ?? []).map((element) => ({ type: 'action' as const, props: { element } })),
          ...marks.leftFooter,
        ],
      }}
      RightBar={barModes.right === 'off' ? undefined : {
        initialView: barModes.right === 'expanded' ? 'expanded' : 'rail',
        brand: marks.rightBrand,
        header: marks.rightHeader,
        elements: rightElements,
        footerElements: marks.rightFooter,
      }}
      Footer={barModes.bottom === 'off' ? false : {}}
    >
      <ActiveView app={app} />
    </Layout>
    {floating.map((f) => <FloatingMark key={f.corner} corner={f.corner}>{f.element}</FloatingMark>)}
    <NamespaceRoutePanel
      route={openRoute?.route ?? null}
      label={openRoute?.label}
      namespace={namespace ?? null}
      pages={namespacePages}
      go={goRoute}
      onClose={closeRoute}
    />
    </CornerMarkHost></GuiPageContext.Provider></ThemeSettingsContext.Provider>
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
export function AppShell({ app, me, runtime, navItems, devtools = true, footerElements, position, brand, identity, identityCorner, brandCorner, identityUsername, namespace, namespaceRoutes, namespacePages, initialBarModes, identityConnect, identityTree, identityQrPath, namespaceCardRoutes, onNamespaceCardRoute, onIdentityCardOpenChange, themeIn }: AppShellProps) {
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
        <AppShellNav app={app} navItems={navItems} footerElements={footerElements} position={position} brand={brand} identity={identity} identityCorner={identityCorner} brandCorner={brandCorner} identityUsername={identityUsername} namespace={namespace} namespaceRoutes={namespaceRoutes} namespacePages={namespacePages} initialBarModes={initialBarModes} identityConnect={identityConnect} identityTree={identityTree} identityQrPath={identityQrPath} namespaceCardRoutes={namespaceCardRoutes} onNamespaceCardRoute={onNamespaceCardRoute} onIdentityCardOpenChange={onIdentityCardOpenChange} themeIn={themeIn} />
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

