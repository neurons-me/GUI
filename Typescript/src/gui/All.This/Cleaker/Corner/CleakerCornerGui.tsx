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
import { ThemeProvider, type Theme as MuiTheme } from '@mui/material/styles';
import Theme from '@/gui/Theme/Theme';
import { Box, Button, Paper, TextField, Typography } from '@/gui/Atoms';
import QRme from '@/gui/All.This/me/QR/QR.me';
import Layout from '@/gui/Layout/Layout';
import { MemoryRouter } from 'react-router-dom';
import { BarBrandCell, CompactAt, FloatingMark, LeftBarPosition, QrBadge, SiteBrand, TopBarPosition, marksInBars, placeMarks, topBarPosition, useNarrowBars } from '@/gui/Layout/Position/Position';
import {
  CLEAKER_BAR_STATES,
  barStates,
  isBarState,
  readBars,
  readBrand,
  type CleakerBar,
  type CleakerBarId,
  type CleakerBarState,
} from './cleakerBars';
import {
  CLEAKER_CORNERS,
  DEFAULT_CLEAKER_NAMESPACE,
  cornerLabel,
  defaultProbe,
  isNamespaceName,
  positionQrValue,
  type CleakerCorner,
} from './cleakerCorner';

const STORE_CORNER = 'cleaker:corner';
const STORE_NAMESPACE = 'cleaker:namespace';
const STORE_BARS = 'cleaker:bars';
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
};

export type CleakerGuiHandle = { host: HTMLElement; unmount(): void };

const isCorner = (v: unknown): v is CleakerCorner => typeof v === 'string' && (CLEAKER_CORNERS as readonly string[]).includes(v);
const read = (s: Storage | null, k: string) => { try { return s ? s.getItem(k) : null; } catch { return null; } };
const write = (s: Storage | null, k: string, v: string) => { try { s?.setItem(k, v); } catch { /* this page view only */ } };

type ProbeState = 'none' | 'checking' | 'ok' | 'off';
const QR_STATUS: Record<ProbeState, 'idle' | 'checking' | 'confirmed' | 'off'> = { none: 'idle', checking: 'checking', ok: 'confirmed', off: 'off' };

function CornerApp({ options, storage }: { options: CleakerGuiOptions; storage: Storage | null }) {
  const page = window.location;
  const pageAddress = page.protocol === 'file:' ? `file://${page.pathname}` : page.origin;
  const probe = options.probe ?? defaultProbe;

  const [corner, setCornerState] = React.useState<CleakerCorner>(() => {
    const stored = read(storage, STORE_CORNER);
    return isCorner(stored) ? stored : isCorner(options.corner) ? options.corner : 'bottom-right';
  });
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
    try {
      const raw = JSON.parse(read(storage, STORE_BARS) ?? 'null');
      if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) if (isBarState(v)) out[k as CleakerBarId] = v;
    } catch { /* nothing chosen */ }
    return out;
  });
  const states = barStates(bars, chosenBars);
  const chooseBar = (id: CleakerBarId, state: CleakerBarState) => {
    const next = { ...chosenBars, [id]: state };
    write(storage, STORE_BARS, JSON.stringify(next));
    setChosenBars(next);
  };
  const [probeState, setProbeState] = React.useState<ProbeState>('none');
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!namespace) { setProbeState('none'); return; }
    let live = true;
    setProbeState('checking');
    probe(namespace).then((ok) => { if (live) setProbeState(ok ? 'ok' : 'off'); }, () => { if (live) setProbeState('off'); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  const choose = (raw: string) => {
    const next = raw.trim().toLowerCase();
    if (next && !isNamespaceName(next)) { setMessage(`"${raw}" is not a namespace name.`); return; }
    setMessage('');
    write(storage, STORE_NAMESPACE, next);   // '' remembers "none"
    setNamespaceState(next || null);
  };
  const moveTo = (c: CleakerCorner) => { write(storage, STORE_CORNER, c); setCornerState(c); };

  const top = corner.startsWith('top');
  const right = corner.endsWith('right');
  const label = cornerLabel(namespace, page);
  const value = namespace ? positionQrValue(namespace, pageAddress) : pageAddress;
  const statusText = probeState === 'ok' ? `${namespace} answered` : probeState === 'off' ? `${namespace} did not answer` : probeState === 'checking' ? `asking ${namespace}…` : undefined;

  const siteBrand = React.useMemo(() => readBrand(options.document, page.href), [options.document, page.href]);
  const narrow = useNarrowBars();
  const leftBar = bars.find((b) => b.id === 'left' && states.left !== 'closed');
  const topBar = bars.find((b) => b.id === 'top' && states.top !== 'closed');
  const toggle = () => { setOpen((o) => !o); setDraft(namespace ?? ''); };

  const qr = (props: Partial<React.ComponentProps<typeof QRme>>) => (
    <QRme
      value={value}
      status={QR_STATUS[probeState]}
      statusLabel={statusText}
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
        status={QR_STATUS[probeState]}
        statusLabel={statusText}
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
  const marks = marksInBars(placement, {
    identity: badge(idWhere),
    brand: siteBrand ? <SiteBrand label={siteBrand.label} href={siteBrand.href} logo={siteBrand.logo} compact={placement.brand !== 'left.brand'} /> : undefined,
  });
  // The panel opens beside the QR, wherever the QR is.
  const panelAt: Record<string, string | number> =
    placement.identity === 'left.brand' ? { top: 8, left: 72 }
      : placement.identity === 'top.start' ? { top: 52, left: 8 }
      : placement.identity === 'top.end' ? { top: 52, right: 8 }
      : placement.identity === 'left.footer' ? { bottom: 8, left: 72 }
      : { [corner.startsWith('top') ? 'top' : 'bottom']: 64, [corner.endsWith('right') ? 'right' : 'left']: 8 };

  const panel = open && (
    <Paper elevation={6} sx={{ p: 1.5, width: 280, display: 'flex', flexDirection: 'column', gap: 1 }} data-cleaker-panel="">
      <Box component="form" sx={{ display: 'flex', gap: 1 }} onSubmit={(e: React.FormEvent) => { e.preventDefault(); choose(draft); }}>
        <TextField size="small" fullWidth value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="namespace (e.g. cleaker.me)" inputProps={{ 'aria-label': 'Namespace', spellCheck: false, autoCapitalize: 'off' }} />
        <Button type="submit" variant="contained" size="small">Use</Button>
      </Box>
      <Typography variant="caption" color="text.secondary" data-cleaker-status="">{message || statusText || label}</Typography>
      {/* the person's corner: where their QR sits (in a bar when bars show, else the corner itself) */}
      {(
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
          {CLEAKER_CORNERS.map((c) => (
            <Button key={c} size="small" variant={c === corner ? 'contained' : 'outlined'} onClick={() => moveTo(c)} data-corner-choice={c}>
              {c.replace('-', ' ')}
            </Button>
          ))}
        </Box>
      )}
      {bars.length > 0 && (
        <Box role="group" aria-label="Bars" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          {bars.map((bar) => (
            <Box key={bar.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} data-bar-choice={bar.id}>
              <Typography variant="caption" sx={{ flex: 1 }}>{bar.label}</Typography>
              {CLEAKER_BAR_STATES.map((st) => (
                <Button key={st} size="small" sx={{ minWidth: 0, px: 1 }} variant={states[bar.id] === st ? 'contained' : 'text'} onClick={() => chooseBar(bar.id, st)} data-bar-state={st}>
                  {st}
                </Button>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );

  const layout = (leftBar || topBar) && (
    // .GUI's own Layout, drawn over the author's page: its bars are fixed to the viewport and its content area is
    // empty, so the page is not covered beyond the bars themselves.
    // Its content area is the author's page, not Layout's: Layout's own <main> (its background, its padding) is not drawn.
    // The bars publish their insets on the document (--gui-inset-left/top/…), so an author who wants the page pushed
    // instead of covered can pad with them.
    <Box data-cleaker-bars="" sx={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', '--gui-layout-min-height': '0px', '& main': { display: 'none' } } as any}>
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
            topBarPosition(
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
            ),
          ],
          // 'icons': the author's top elements as icons only; 'open': with their labels (where the bar's width allows).
          // the far end holds a mark first (before the author's own elements, never pushing them out)
          elementsRight: [...marks.topEnd, ...(topBar?.items ?? []).map((it) => ({ type: 'link' as const, props: { label: it.label, href: it.href, icon: it.icon ?? 'link', ...(states.top === 'icons' ? { showLabel: false } : {}), 'data-gui-node-id': `GUI.window.layout.bars.top.${it.id}` } }))],
        } : false}
        LeftBar={leftBar ? {
          brand: marks.leftBrand,
          footerElements: marks.leftFooter,
          initialView: states.left === 'open' ? 'expanded' : 'rail',
          // Shown while the bar is open: where you are, written out beside the QR (the top bar shows it otherwise).
          header: <LeftBarPosition title={label} data-cleaker-position="">{label}</LeftBarPosition>,
          elements: leftBar.items.map((it) => ({ type: 'link' as const, props: { label: it.label, href: it.href, icon: it.icon ?? 'link', 'data-gui-node-id': `GUI.window.layout.bars.left.${it.id}` } })),
        } : false}
      >
        {null}
      </Layout>
    </Box>
  );

  // With bars the QR is in a bar, and its panel opens beside it; the corner (and its scannable QR) is for no bars.
  if (leftBar || topBar) {
    return (
      <>
        {layout}
        {marks.float && <FloatingMark corner={marks.float.corner}>{marks.float.element}</FloatingMark>}
        {panel && <Box sx={{ position: 'fixed', zIndex: 2147483000, ...panelAt }}>{panel}</Box>}
      </>
    );
  }

  return (
    <>
      {layout}
      <Box
        data-cleaker-corner={corner}
        sx={{
          position: 'fixed', zIndex: 2147483000, [top ? 'top' : 'bottom']: 16, [right ? 'right' : 'left']: 16,
          display: 'flex', flexDirection: top ? 'column' : 'column-reverse', alignItems: right ? 'flex-end' : 'flex-start', gap: 1,
        }}
      >
        <Box onClick={toggle} sx={{ cursor: 'pointer', lineHeight: 0 }} data-cleaker-qr={value}>
          {qr({ diameter: QR_DIAMETER })}
        </Box>
        {panel}
      </Box>
    </>
  );
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
            {/* text in the shadow root would inherit the page's font (its body); it is the theme's */}
            <Box sx={{ fontFamily: (t: MuiTheme) => t.typography.fontFamily }}>
              <CornerApp options={options} storage={storage} />
            </Box>
          </MemoryRouter>
        </ThemeProvider>
      </Theme>
    </CacheProvider>,
  );
  return { host, unmount() { root.unmount(); host.remove(); } };
}
