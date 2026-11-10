// Cleaker in a corner, drawn with .GUI itself: the real `.me` QR (QR.me, its ring, the label around it, its status
// dot), the real Theme and .GUI atoms -- not a second, hand-drawn look. It lives in a Shadow DOM: Emotion (MUI's
// styling) writes its styles INTO that shadow root, and MUI's portals (tooltips, popovers) open inside it too, so the
// page's styles do not reach it and its styles do not leak out.
//
// The behaviour is the corner's (cleakerCorner.ts): the same label (`me @ where`), QR value (namespace + at=), default
// namespace (cleaker.me), probe (/__surface) and the person's choices kept in their browser (corner, namespace).
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, useTheme, type Theme as MuiTheme } from '@mui/material/styles';
import Theme from '@/gui/Theme/Theme';
import { Box } from '@/gui/Atoms';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CleakerQrMenu, { panelPositionFor } from './CleakerQrMenu';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import QRConnect from '@/gui/All.This/Cleaker/QRConnect';
import { SeedSessionProvider, useOptionalSeedSessionContext } from '@/react/session/SeedSessionProvider';
import { readQrMePosition, writeQrMePosition } from '@/gui/Layout/Position/qrMePosition';
import { barModeFromCleaker, barModeToCleaker, readStoredBarModes, writeBarMode } from '@/gui/Layout/Position/barMode';
import QRme from '@/gui/All.This/me/QR/QR.me';
import Layout from '@/gui/Layout/Layout';
import { MemoryRouter } from 'react-router-dom';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import DevToolsLauncher from '@/runtime/DevToolsLauncher';
import { SelectionProvider } from '@/runtime/selection';
import { ThemeSettingsContext } from '@/runtime/themeSettings';
import { NamespaceRoutePanel, type NamespaceRouteProps } from '@/gui/Layout/Position/NamespaceRoute';
import { BarBrandCell, CompactAt, FloatingMark, IdentityText, LeftBarPosition, QrBadge, SiteBrand, TopBarPosition, WhereText, atWhere, marksInBars, placeMarks, splitPosition, topBarPosition, useNarrowBars, whoLines } from '@/gui/Layout/Position/Position';
import {
  barStates,
  isBarState,
  readBars,
  readBrand,
  type CleakerBar,
  type CleakerBarId,
  type CleakerBarItem,
  type CleakerBarState,
} from './cleakerBars';
import {
  CLEAKER_CORNERS,
  DEFAULT_CLEAKER_NAMESPACE,
  cornerLabel,
  defaultProbe,
  isNamespaceName,
  namespaceEndpoint,
  positionQrValue,
  type CleakerCorner,
} from './cleakerCorner';

const STORE_NAMESPACE = 'cleaker:namespace';
const DRAWN_BARS: readonly CleakerBarId[] = ['top', 'left'];
const QR_DIAMETER = 76;

export type CleakerGuiOptions = {
  corner?: CleakerCorner;
  /** Default cleaker.me; null or '' starts with none. The person's choice wins. */
  namespace?: string | null;
  container?: HTMLElement;
  storage?: Storage | null;
  probe?: (namespace: string) => Promise<boolean>;
  /**
   * Level 2: the author's GUI document (or `{ bars }`). Its GUI.window.layout.bars are drawn with .GUI's own Layout
   * (LeftBar, TopBar), each in the author's state until the person chooses another. The author may declare the site's
   * brand (`bars.brand: { label, to?, logo? }`); the person's QR and the brand are placed by placeMarks() (the person's
   * corner; the brand at the other end).
   */
  document?: unknown;
  /**
   * The dev tools in the left bar's foot (the wrench), as the shell has them when its app asks for them: the inspector's
   * selection (SelectionProvider) is given to the bars. Off by default: a page's visitor has no dev tools.
   */
  devtools?: boolean;
  /**
   * Views for the namespace's routes, by route (`/users`): what opens over the page when an item with that `route` is
   * chosen. The GUI's own pages (`/GUI`, `/GUI/themes`, `/GUI/layout`) are always here; a route with no view says so
   * and offers the namespace's own door, where the route renders in the content area.
   */
  pages?: Record<string, React.ComponentType<CleakerRouteProps>>;
  /**
   * Pin the QR status for the bar and the panel together. When set, the mark
   * does not open a second probe just to colour itself (same as AppShell).
   */
  qrStatus?: 'idle' | 'checking' | 'confirmed' | 'error' | 'off';
  /** Handle shown with the QR (same role as AppShell's identityUsername). */
  username?: string;
};

export type CleakerGuiHandle = { host: HTMLElement; unmount(): void };

const isCorner = (v: unknown): v is CleakerCorner => typeof v === 'string' && (CLEAKER_CORNERS as readonly string[]).includes(v);
const read = (s: Storage | null, k: string) => { try { return s ? s.getItem(k) : null; } catch { return null; } };
const write = (s: Storage | null, k: string, v: string) => { try { s?.setItem(k, v); } catch { /* this page view only */ } };

type ProbeState = 'none' | 'checking' | 'ok' | 'off';
const QR_STATUS: Record<ProbeState, 'idle' | 'checking' | 'confirmed' | 'off'> = { none: 'idle', checking: 'checking', ok: 'confirmed', off: 'off' };

/** What a view of a namespace route is given when it opens over a page. */
export type CleakerRouteProps = NamespaceRouteProps;

function CleakerIdentityMenu({
  namespace,
  username,
  qrStatus,
  qr,
  onClose,
  goRoute,
}: {
  namespace: string | null;
  username?: string;
  qrStatus: 'idle' | 'checking' | 'confirmed' | 'error' | 'off';
  qr: React.ComponentProps<typeof MeLoginStatus>['qr'];
  onClose: () => void;
  goRoute: (route: string) => void;
}) {
  const session = useOptionalSeedSessionContext();
  const authenticated = Boolean(session?.authenticated);
  const [qrSignIn, setQrSignIn] = React.useState(false);
  React.useEffect(() => {
    if (authenticated) setQrSignIn(false);
  }, [authenticated]);
  if (qrSignIn && namespace) {
    return (
      <QRConnect
        compact
        qrStatus={qrStatus}
        cleakerEndpoint={namespaceEndpoint(namespace)}
        username={username}
        data-gui-node-id="GUI.window.layout.marks.identity.menu"
      />
    );
  }
  return (
    <MeLoginStatus
      nodeId="GUI.window.layout.marks.identity.menu"
      authenticated={authenticated}
      qr={qr}
      identityHash={session?.identityHash}
      onNavigate={(to) => { onClose(); goRoute(to); }}
      onLogout={() => { session?.logout(); onClose(); }}
      onSignIn={() => setQrSignIn(true)}
    />
  );
}

function CornerSession({ namespace, children }: { namespace: string | null; children: React.ReactNode }) {
  const existing = useOptionalSeedSessionContext();
  if (existing || !namespace) return <>{children}</>;
  return (
    <SeedSessionProvider transportOrigin={namespaceEndpoint(namespace)} sessionBackend="cleaker">
      {children}
    </SeedSessionProvider>
  );
}

function CornerApp({ options, storage }: { options: CleakerGuiOptions; storage: Storage | null }) {
  const page = window.location;
  const pageAddress = page.protocol === 'file:' ? `file://${page.pathname}` : page.origin;
  const probe = options.probe ?? defaultProbe;

  const [corner, setCornerState] = React.useState<CleakerCorner>(() => (
    readQrMePosition(storage, isCorner(options.corner) ? options.corner : 'bottom-right')
  ));
  const [namespace, setNamespaceState] = React.useState<string | null>(() => {
    const stored = read(storage, STORE_NAMESPACE);
    if (stored !== null) return isNamespaceName(stored) ? stored : null;
    const author = options.namespace === undefined ? DEFAULT_CLEAKER_NAMESPACE : options.namespace;
    return author && isNamespaceName(author) ? author : null;
  });
  // The bars drawn so far are the left (LeftBar) and the top (TopBar); right and bottom are read but not offered yet.
  const bars: CleakerBar[] = React.useMemo(
    () => readBars(options.document, page.href).filter((b) => DRAWN_BARS.includes(b.id)),
    [options.document, page.href],
  );
  const [chosenBars, setChosenBars] = React.useState<Partial<Record<CleakerBarId, CleakerBarState>>>(() => {
    const out: Partial<Record<CleakerBarId, CleakerBarState>> = {};
    const stored = readStoredBarModes(storage);
    for (const [k, v] of Object.entries(stored)) out[k as CleakerBarId] = barModeToCleaker(v);
    return out;
  });
  const states = barStates(bars, chosenBars);
  const chooseBar = (id: CleakerBarId, state: CleakerBarState) => {
    const next = { ...chosenBars, [id]: state };
    writeBarMode(id, barModeFromCleaker(state), storage);
    setChosenBars(next);
  };
  const cornerBarModes = {
    top: barModeFromCleaker(states.top ?? chosenBars.top ?? 'closed'),
    left: barModeFromCleaker(states.left ?? chosenBars.left ?? 'closed'),
    right: barModeFromCleaker(chosenBars.right ?? 'closed'),
    bottom: barModeFromCleaker(chosenBars.bottom ?? 'closed'),
  };
  const [probeState, setProbeState] = React.useState<ProbeState>('none');
  // The namespace route open over the page (a modal), if any; its item's label is the modal's title.
  const [openRoute, setOpenRoute] = React.useState<{ route: string; label?: string } | null>(null);
  const goRoute = React.useCallback((route: string) => setOpenRoute({ route }), []);
  const closeRoute = React.useCallback(() => setOpenRoute(null), []);
  const openThemeSettings = React.useCallback(() => setOpenRoute({ route: '/GUI/themes' }), []);
  // An item of a bar as the bar draws it: the author's link goes where it says; a route of the namespace opens over the page.
  const itemProps = (it: CleakerBarItem) => it.route
    ? { label: it.label, icon: it.icon ?? 'link', active: openRoute?.route === it.route, onClick: () => setOpenRoute((cur) => (cur?.route === it.route ? null : { route: it.route!, label: it.label })) }
    : { label: it.label, href: it.href, icon: it.icon ?? 'link' };
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [message, setMessage] = React.useState('');

  const qrCellRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (options.qrStatus) return undefined;
    if (!namespace) { setProbeState('none'); return undefined; }
    let live = true;
    setProbeState('checking');
    probe(namespace).then((ok) => { if (live) setProbeState(ok ? 'ok' : 'off'); }, () => { if (live) setProbeState('off'); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, options.qrStatus]);

  const choose = (raw: string) => {
    const next = raw.trim().toLowerCase();
    if (next && !isNamespaceName(next)) { setMessage(`"${raw}" is not a namespace name.`); return; }
    setMessage('');
    write(storage, STORE_NAMESPACE, next);   // '' remembers "none"
    setNamespaceState(next || null);
  };
  const moveTo = (c: CleakerCorner) => { writeQrMePosition(c, storage); setCornerState(c); };

  const top = corner.startsWith('top');
  const right = corner.endsWith('right');
  const label = cornerLabel(namespace, page);
  const value = namespace ? positionQrValue(namespace, pageAddress) : pageAddress;
  const statusText = probeState === 'ok' ? `${namespace} answered` : probeState === 'off' ? `${namespace} did not answer` : probeState === 'checking' ? `asking ${namespace}…` : undefined;
  const identityQrStatus = options.qrStatus ?? QR_STATUS[probeState];
  const identityStatusLabel = options.qrStatus === 'confirmed' ? 'Connected' : statusText;
  const identityUsername = options.username;

  const siteBrand = React.useMemo(() => readBrand(options.document, page.href), [options.document, page.href]);
  const narrow = useNarrowBars();
  const leftBar = bars.find((b) => b.id === 'left' && states.left !== 'closed');
  const topBar = bars.find((b) => b.id === 'top' && states.top !== 'closed');
  const toggle = () => { setOpen((o) => !o); setDraft(namespace ?? ''); };

  const qr = (props: Partial<React.ComponentProps<typeof QRme>>) => (
    <QRme
      value={value}
      status={identityQrStatus}
      statusLabel={identityStatusLabel}
      perimeterLabel={label}
      perimeterRootLabel={namespace ?? undefined}
      clickFlip={false}
      hoverFlip={false}
      cursor="pointer"
      {...props}
    />
  );

  // In a bar the QR is a badge, as in the shell: QR.me's topbar variant, scaled as a whole to the rail's size. Never the
  // scannable QR there -- QR.me keeps a scannable code at >= 4px per module, so a long value (namespace + at=) grows it
  // past any bar (176px for `cleaker.me @ localhost:5176`); the scannable one is the corner's, with no bars.
  // The badge opens Cleaker's panel; the left bar's own arrow expands and contracts the bar.
  const badge = (where: 'left' | 'top' | 'float') => (
    <BarBrandCell
      ref={qrCellRef}
      component="button"
      type="button"
      onClick={toggle}
      aria-label={`Cleaker: ${label}`}
      aria-expanded={open}
      title={label}
      data-cleaker-qr={value}
      data-cleaker-brand={placement.identity}
      data-gui-node-id={where === 'float' ? 'GUI.window.layout.marks.identity' : `GUI.window.layout.bars.${where}.identity`}
      sx={where === 'left' ? undefined : { width: 48, height: 48, minWidth: 48, flex: 'none', ...(where === 'float' ? { bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 } : {}) }}
    >
      <QrBadge
        value={value}
        username={identityUsername}
        status={identityQrStatus}
        statusLabel={identityStatusLabel}
        perimeterLabel={label}
        perimeterRootLabel={namespace ?? undefined}
        clickFlip={false}
        hoverFlip={false}
        cursor="pointer"
      />
    </BarBrandCell>
  );
  // The two marks (Roles-and-Territories.md §3): the person's QR where they put it, the site's brand at the other end.
  // Decided by the corner, which bars exist and the width -- never by whether a bar is open or a rail.
  const placement = placeMarks({ identity: corner, bars: { top: Boolean(topBar), left: Boolean(leftBar) }, narrow, brand: Boolean(siteBrand) });
  const idWhere = placement.identity === 'left.brand' ? 'left' : placement.identity.startsWith('float:') ? 'float' : 'top';
  // The position split between the marks: who beside the QR (no username here: Cleaker on a page holds no session, so
  // the namespace), @where beside the brand. Without a brand the place stays with the QR (a third, smaller line, and the
  // whole position in the top bar as before). Icons only: the marks alone; the whole position is the tooltip and the
  // panel's first line.
  const parts = namespace ? splitPosition(label) : { who: '', where: label };
  const who = whoLines(parts.who, identityUsername);
  const marks = marksInBars(
    placement,
    {
      identity: badge(idWhere),
      identityText: parts.who
        ? <IdentityText title={label} primary={who.primary} secondary={who.secondary} extra={siteBrand ? null : atWhere(parts.where)} />
        : undefined,
      brand: siteBrand ? <SiteBrand label={siteBrand.label} href={siteBrand.href} logo={siteBrand.logo} compact={placement.brand !== 'left.brand'} /> : undefined,
      brandText: siteBrand && parts.where ? <WhereText title={label} where={atWhere(parts.where)} /> : undefined,
    },
    { topText: states.top === 'open' && !narrow },
  );
  // The panel opens beside the QR, wherever the QR is.
  const panelAt = panelPositionFor(placement.identity, corner);

  const identityQr = {
    value,
    username: identityUsername,
    status: identityQrStatus,
    statusLabel: identityStatusLabel,
    perimeterLabel: label,
    perimeterRootLabel: namespace ?? undefined,
  };
  const closePanel = () => setOpen(false);
  const panel = open && (
    <ClickAwayListener
      onClickAway={(event) => {
        const target = event.target;
        if (qrCellRef.current && target instanceof Node && qrCellRef.current.contains(target)) return;
        setOpen(false);
      }}
    >
      <Box sx={{ position: 'fixed', zIndex: 2147483000, ...panelAt }} data-cleaker-qr-menu="">
        <CleakerQrMenu
          fullPosition={namespace ? `${namespace} @ ${pageAddress}` : pageAddress}
          statusText={message || identityStatusLabel || label}
          showNamespaceForm={!namespace}
          draft={draft}
          onDraftChange={setDraft}
          onUseNamespace={choose}
          corner={corner}
          onMoveTo={moveTo}
          onClose={closePanel}
          layout={{
            address: label,
            brand: siteBrand ? { label: siteBrand.label } : undefined,
          }}
        >
          <CleakerIdentityMenu
            namespace={namespace}
            username={identityUsername}
            qrStatus={identityQrStatus}
            qr={identityQr}
            onClose={closePanel}
            goRoute={goRoute}
          />
        </CleakerQrMenu>
      </Box>
    </ClickAwayListener>
  );

  const layout = (leftBar || topBar) && (
    // .GUI's own Layout, drawn over the author's page: its bars are fixed to the viewport and its content area is
    // empty, so the page is not covered beyond the bars themselves.
    // Its content area is the author's page, not Layout's: Layout's own <main> (its background, its padding) is not drawn.
    // The bars are one layer (fixed): at the app bar's level, over a namespace route open in the content area's place
    // (just under it) and under their own menus and drawer (portaled, higher).
    // The bars publish their insets on the document (--gui-inset-left/top/…), so an author who wants the page pushed
    // instead of covered can pad with them.
    <Box data-cleaker-bars="" sx={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', zIndex: (t: MuiTheme) => t.zIndex.appBar, '--gui-layout-min-height': '0px', '& main': { display: 'none' } } as any}>
      <Layout
        // The top bar is the shell's: the position on its left (while the left bar is not expanded), the author's top
        // elements on its right. Drawn only when it shows (the author's state or the person's choice): 'closed' is closed.
        TopBar={topBar ? {
          noBorder: true,
          hideBrand: true,
          toolbarSx: { pl: 0.25 },
          elementsLeftSx: { pl: 1 },
          elementsLeft: [
            ...marks.topStart,
            // the whole position only when no brand carries the place (with a brand it is split between the marks)
            ...(siteBrand ? [] : [topBarPosition(
              <TopBarPosition
                component="button"
                type="button"
                onClick={toggle}
                title={label}
                data-cleaker-position=""
                sx={{ p: 0, border: 0, background: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                <CompactAt text={label} />
              </TopBarPosition>,
            )]),
          ],
          // 'icons': the author's top elements as icons only; 'open': with their labels (where the bar's width allows).
          // the far end holds a mark first (before the author's own elements, never pushing them out)
          elementsRight: [...marks.topEnd, ...(topBar?.items ?? []).map((it) => ({ type: 'link' as const, props: { ...itemProps(it), ...(states.top === 'icons' ? { showLabel: false } : {}), 'data-gui-node-id': `GUI.window.layout.bars.top.${it.id}` } }))],
        } : false}
        LeftBar={leftBar ? {
          brand: marks.leftBrand,
          // The same foot as the shell's (Namespace.tsx): the theme and the dev tools, then a mark that sits at the foot.
          footerElements: [
            { type: 'action' as const, props: { label: 'Theme', element: <ThemeLauncher />, tooltip: false } },
            { type: 'action' as const, props: { label: 'Dev Tools', element: <DevToolsLauncher />, tooltip: false } },
            ...marks.leftFooter,
          ],
          initialView: states.left === 'open' ? 'expanded' : 'rail',
          // Shown while the bar is open: where you are, written out beside the QR (the top bar shows it otherwise).
          // beside the mark in the bar's head: its text (who, or @where); with neither mark there, the whole position
          header: marks.leftHeader ?? (siteBrand ? undefined : <LeftBarPosition title={label} data-cleaker-position="">{label}</LeftBarPosition>),
          elements: leftBar.items.map((it) => ({ type: 'link' as const, props: { ...itemProps(it), 'data-gui-node-id': `GUI.window.layout.bars.left.${it.id}` } })),
        } : false}
      >
        {null}
      </Layout>
    </Box>
  );

  // With bars the QR is in a bar, and its panel opens beside it; the corner (and its scannable QR) is for no bars.
  const routeDialog = (
    <NamespaceRoutePanel
      route={openRoute?.route ?? null}
      label={openRoute?.label}
      namespace={namespace}
      pages={options.pages}
      go={goRoute}
      onClose={closeRoute}
    />
  );

  if (leftBar || topBar) {
    return (
      <CornerSession namespace={namespace}>
      <ThemeSettingsContext.Provider value={openThemeSettings}>
        {layout}
        {routeDialog}
        {marks.float && <FloatingMark corner={marks.float.corner}>{marks.float.element}</FloatingMark>}
        {panel}
      </ThemeSettingsContext.Provider>
      </CornerSession>
    );
  }

  return (
    <CornerSession namespace={namespace}>
    <>
      {layout}
      <Box
        data-cleaker-corner={corner}
        sx={{
          position: 'fixed', zIndex: 2147483000, [top ? 'top' : 'bottom']: 16, [right ? 'right' : 'left']: 16,
          display: 'flex', flexDirection: top ? 'column' : 'column-reverse', alignItems: right ? 'flex-end' : 'flex-start', gap: 1,
        }}
      >
        <Box ref={qrCellRef} onClick={toggle} sx={{ cursor: 'pointer', lineHeight: 0 }} data-cleaker-qr={value}>
          {qr({ diameter: QR_DIAMETER })}
        </Box>
        {panel}
      </Box>
    </>
    </CornerSession>
  );
}

/**
 * The theme's font and text color on the Cleaker's root element: its menus and popovers (portaled there, outside the
 * bars) would otherwise inherit the author's page's (dark text on the theme's dark paper).
 */
function ThemeTextOn({ element }: { element: HTMLElement }) {
  const theme = useTheme();
  React.useLayoutEffect(() => {
    element.style.fontFamily = String(theme.typography.fontFamily ?? '');
    element.style.color = theme.palette.text.primary;
  }, [element, theme]);
  return null;
}

/** Mounts Cleaker's corner, drawn with .GUI, in its own Shadow DOM. */
export function mountCleakerGui(options: CleakerGuiOptions = {}): CleakerGuiHandle {
  const storage = options.storage === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : options.storage;
  const host = document.createElement('div');
  host.setAttribute('data-cleaker', '');
  const shadow = host.attachShadow({ mode: 'open' });
  const stylesRoot = document.createElement('div');
  // .GUI's icons are the global class `.material-symbols-rounded` (IconRegistry.tsx); a page's classes do not reach into
  // a shadow root, so the class is restated here. The font face itself is the page's (an @font-face in the document
  // applies inside the shadow root): without it an icon falls back to its name.
  const iconClass = document.createElement('style');
  iconClass.textContent = `.material-symbols-rounded{font-family:"Material Symbols Rounded";font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;font-feature-settings:"liga"}`;
  const mountPoint = document.createElement('div');
  shadow.append(iconClass, stylesRoot, mountPoint);
  (options.container ?? document.body).append(host);

  // Emotion writes into the shadow root, not the page's <head>
  const cache = createCache({ key: 'cleaker', container: stylesRoot, prepend: true });
  // MUI's portals (tooltips, popovers, dialogs) open inside the shadow root, where the styles are
  const portals = (outer: MuiTheme): MuiTheme => ({
    ...outer,
    components: {
      ...outer.components,
      MuiPopper: { ...outer.components?.MuiPopper, defaultProps: { ...outer.components?.MuiPopper?.defaultProps, container: mountPoint } },
      MuiPopover: { ...outer.components?.MuiPopover, defaultProps: { ...outer.components?.MuiPopover?.defaultProps, container: mountPoint } },
      MuiModal: { ...outer.components?.MuiModal, defaultProps: { ...outer.components?.MuiModal?.defaultProps, container: mountPoint } },
    },
  });

  const root: Root = createRoot(mountPoint);
  root.render(
    <CacheProvider value={cache}>
      <Theme>
        <ThemeProvider theme={portals}>
          <MemoryRouter>
            {/* text in the shadow root would inherit the page's font and color (its body); they are the theme's */}
            <ThemeTextOn element={mountPoint} />
            <Box sx={{ fontFamily: (t: MuiTheme) => t.typography.fontFamily, color: 'text.primary' }}>
              {options.devtools
                ? <SelectionProvider><CornerApp options={options} storage={storage} /></SelectionProvider>
                : <CornerApp options={options} storage={storage} />}
            </Box>
          </MemoryRouter>
        </ThemeProvider>
      </Theme>
    </CacheProvider>,
  );
  return { host, unmount() { root.unmount(); host.remove(); } };
}
