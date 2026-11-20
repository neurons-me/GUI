// Where you are, in the shell's bars -- one composition for every shell that draws it (AppShell, netget's Namespace,
// Cleaker on someone else's page), so they cannot drift apart:
//
//   - the position (`namespace @ where`) is written ONCE: in the top bar while the left bar is a rail or closed
//     (`TopBarPosition` inside `UnlessLeftBarExpanded`), beside the brand in the left bar's header while it is expanded
//     (`LeftBarPosition`), so opening the bar moves it instead of pushing it;
//   - in a monospace face, with the spaces around `@` drawn small (`CompactAt`);
//   - the identity QR in a bar is a badge (`QrBadge`): QR.me's topbar variant scaled as a whole to the rail's size. A bar
//     never holds the scannable QR -- QR.me keeps a scannable code at >= 4px per module, so a long value grows it past
//     any bar.
//
// What each shell decides stays with it: what the position links to (a route, a panel), its text while nothing has
// answered, and what surrounds the badge (a link, a session mark).
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box, { type BoxProps } from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Tooltip from '@/gui/Atoms/Tooltip/Tooltip';
import { LEAD_COL, LEAD_GAP, leadColSx, leadInset } from '@/gui/Layout/Sidebars/LeftBar/leadColumn';
import { useLeftSidebar, useRightBar, useGuiTheme, useGuiMediaQuery } from '@/gui-internals/Hooks';
import type { MarksPlacement as _Placement, MarkCorner as _Corner } from './placeMarks';
import QRme, { resolveTopbarQrSize, type QRmeProps } from '@/gui/All.This/me/QR/QR.me';
import { brandFaviconSvg, svgElementFaviconHref, useFavicon } from '@/react/session/namespaceFavicon';
import type { SxProps, Theme } from '@mui/material/styles';

/** The size a QR badge is drawn at in a bar (the rail's mark size). */
export const RAIL_BADGE_SIZE = 34;
/** The cell a floating corner mark sits in (QR and brand): badge centered inside, same as the identity float cell. */
export const FLOATING_MARK_CELL = 48;
/** Topbar QR face radius — keep the floating brand face on the same shape. */
const FLOATING_BRAND_FACE_RADIUS = '5px';

/**
 * Shows its children unless the left bar is expanded. The bar's `view` is only known inside the Layout, hence a
 * component: put it around what the top bar shows only while the bar is not open.
 */
export function UnlessLeftBarExpanded({ children }: { children: React.ReactNode }) {
  const { view } = useLeftSidebar();
  return view === 'expanded' ? null : <>{children}</>;
}

// In a monospace face each space around `@` is a full character wide and the `@` floats apart from both names. The
// spaces stay in the text (what is copied or read out is still `a @ b`) but are drawn at a fraction of the size.
const AT_SPACE_SX = { fontSize: '0.4em' } as const;

/** `a @ b` drawn with the `@` close to both names; any other text as is. */
export function CompactAt({ text }: { text: string }) {
  const at = text.indexOf(' @ ');
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Box component="span" sx={AT_SPACE_SX}>{' '}</Box>@<Box component="span" sx={AT_SPACE_SX}>{' '}</Box>
      {text.slice(at + 3)}
    </>
  );
}

const withSx = (base: SxProps<Theme>, sx: BoxProps['sx']): SxProps<Theme> =>
  [base, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>;

const TOP_POSITION_SX: SxProps<Theme> = {
  display: 'block',
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'text.primary',
  textDecoration: 'none',
};

// The mark stays centered in the rail-width cell; the label hangs over that cell's empty side so it sits a short,
// fixed gap from the mark (the username beside the QR, @where beside the brand) instead of from the cell edge.
// The gap was 1px and read as glued to the QR.
const BESIDE_MARK_GAP_PX = 8;
/** Pull the label toward the mark in a rail-width cell. `right` mirrors it (text on the inner/left side of the icon). */
export function besideRailMarkSx(side: 'left' | 'right' = 'left') {
  const inset = `calc((var(--gui-rail-width, 72px) - ${RAIL_BADGE_SIZE}px) / -2 + ${BESIDE_MARK_GAP_PX}px)`;
  return {
    [side === 'left' ? 'ml' : 'mr']: inset,
    position: 'relative' as const,
    zIndex: 1,
    minWidth: 0,
    ...(side === 'right' ? { textAlign: 'right' as const } : {}),
  };
}
const BESIDE_RAIL_MARK_SX = besideRailMarkSx('left');

const LEFT_POSITION_SX: SxProps<Theme> = {
  display: 'block',
  ...BESIDE_RAIL_MARK_SX,
  fontFamily: 'monospace',
  fontSize: '0.74rem',
  fontWeight: 600,
  lineHeight: 1.25,
  color: 'text.primary',
  textDecoration: 'none',
  wordBreak: 'break-word',
};

// The polymorphic Box props (component, to, href, onClick, …) pass through; only the face is fixed here.
type PositionProps = BoxProps & Record<string, unknown>;

/** The position in the top bar (one line, ellipsized). Wrap it in `UnlessLeftBarExpanded` (`topBarPosition` does). */
export function TopBarPosition({ sx, ...rest }: PositionProps) {
  return <Box data-gui-node-id="GUI.window.layout.bars.top.namespace" {...rest} sx={withSx(TOP_POSITION_SX, sx)} />;
}

/**
 * The position in the left bar's header, beside the brand, while the bar is expanded (wraps instead of cutting).
 * `besideMark`: a mark (the QR, a brand) occupies the bar's corner cell, so the label hangs over that cell's empty side
 * to sit next to it. With the cell empty (the QR moved to another corner) there is nothing to sit next to, and the
 * same pull would push the label past the bar's edge (`ocalhost`): it starts at the header's own padding instead.
 */
export function LeftBarPosition({ sx, besideMark = true, ...rest }: PositionProps & { besideMark?: boolean }) {
  const face = besideMark ? LEFT_POSITION_SX : { ...(LEFT_POSITION_SX as object), ml: 0 } as SxProps<Theme>;
  return <Box data-gui-node-id="GUI.window.layout.bars.left.position" {...rest} sx={withSx(face, sx)} />;
}

/** The position in the right bar's header, beside the mark, while the bar is expanded. Mirrored: the label hangs to the left of the icon. */
export function RightBarPosition({ sx, besideMark = true, ...rest }: PositionProps & { besideMark?: boolean }) {
  const face = besideMark
    ? ({ ...(LEFT_POSITION_SX as object), ml: 0, ...besideRailMarkSx('right') } as SxProps<Theme>)
    : ({ ...(LEFT_POSITION_SX as object), ml: 0 } as SxProps<Theme>);
  return <Box data-gui-node-id="GUI.window.layout.bars.right.position" {...rest} sx={withSx(face, sx)} />;
}

/** The top bar's left element for a position: shown only while the left bar is not expanded. */
export function topBarPosition(element: React.ReactNode) {
  return { type: 'action' as const, props: { element: <UnlessLeftBarExpanded>{element}</UnlessLeftBarExpanded> } };
}

/**
 * The identity QR as a bar's badge: QR.me's topbar variant at the one whole-pixel size its value allows, scaled as a
 * whole to `size` (the rail's, by default). What surrounds it -- a link, a button, a session mark -- is the shell's.
 */
export function QrBadge({ value, size = RAIL_BADGE_SIZE, ...qr }: Omit<QRmeProps, 'variant'> & { value: string; size?: number }) {
  const drawn = resolveTopbarQrSize(value);
  return (
    <Box sx={{ display: 'flex', transform: `scale(${size / drawn})`, transformOrigin: 'center' }}>
      <QRme variant="topbar" value={value} {...qr} />
    </Box>
  );
}

const BRAND_CELL_SX: SxProps<Theme> = {
  // The whole cell is the target, flush with the corner: a corner is a target that cannot be overshot.
  position: 'relative',
  display: 'flex',
  width: '100%',
  height: '100%',
  minWidth: 56,
  minHeight: 48,
  alignItems: 'center',
  justifyContent: 'center',
  p: 0,
  m: 0,
  border: 0,
  background: 'none',
  textDecoration: 'none',
  cursor: 'pointer',
  color: 'inherit',
  '&:hover': { backgroundColor: 'action.hover' },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-2px' },
};

/**
 * The cell around a bar's badge (LeftBar's `brand` slot): the whole cell is the shell's link or button -- to the identity
 * page, to a panel -- and nothing else; expanding the bar is the bar's own arrow.
 */
export const BarBrandCell = React.forwardRef<HTMLElement, PositionProps>(function BarBrandCell({ sx, ...rest }, ref) {
  return <Box ref={ref} {...rest} sx={withSx(BRAND_CELL_SX, sx as BoxProps['sx'])} />;
});

export { placeMarks, isMarkCorner, MARK_CORNERS, cornerOfSlot, opposingCorner, resolveMarkCorners, slotEdge, slotForCorner, honorsMarkCorner, evictMarkCorner, arrangeMove } from './placeMarks';
export { default as PositionGrid } from './PositionGrid';
export { positionSlotChrome, contrastRatio, SLOT_CONTRAST_MIN } from './positionSlotChrome';
export { readBrandPosition, writeBrandPosition, readQrMePosition, writeQrMePosition } from './qrMePosition';
export { splitPosition, atWhere, whoLines } from './positionText';
export type { PositionParts, WhoLines } from './positionText';
export type { MarkCorner, MarkSlot, MarksPlacement } from './placeMarks';

/** Whether the bars are in their narrow layout (under 600px: the left bar is a drawer), as the bars themselves decide. */
export function useNarrowBars(): boolean {
  const theme = useGuiTheme();
  return useGuiMediaQuery(theme.breakpoints.down('sm'));
}

type TopElement = { type: 'action'; props: { element: React.ReactNode } };
type LeftAction = { type: 'action'; props: { element: React.ReactNode; tooltip?: boolean } };

/** Shows its children only while the left bar is expanded (the counterpart of `UnlessLeftBarExpanded`). */
export function OnlyWhenLeftBarExpanded({ children }: { children: React.ReactNode }) {
  const { view } = useLeftSidebar();
  return view === 'expanded' ? <>{children}</> : null;
}

/** Shows its children only while the right bar is expanded — the same mechanism as `OnlyWhenLeftBarExpanded`. */
export function OnlyWhenRightBarExpanded({ children }: { children: React.ReactNode }) {
  const { view } = useRightBar();
  return view === 'expanded' ? <>{children}</> : null;
}

/**
 * The person's half beside their QR: their username on top, the namespace below it, smaller (`jabellae` / `cleaker.me`);
 * the namespace alone without a username. `extra` is a third, smaller line (the place, when no brand carries it).
 */
/** A status beside the QR (connecting, not connected…): what `IdentityText` shows on its third line. */
export type IdentityStatusInfo = { text: string; detail?: string; code?: string; tone?: 'busy' | 'warning' };

/**
 * One calm line (theme caption, ellipsis, never past its cell). Its tooltip: the full sentence on one line, with
 * "View all" (the whole text, wrapped) and "Copy error" (code + sentence to the clipboard) when there is an error.
 * The tooltip's clicks stay inside it (it lives in the QR's button through a portal).
 */
export function IdentityStatus({ status }: { status: IdentityStatusInfo }) {
  const [full, setFull] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const onTip = React.useRef(false);
  const close = () => { if (onTip.current) return; setOpen(false); setFull(false); };
  const detail = status.detail ?? status.text;
  const isError = status.tone === 'warning';
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    const textToCopy = status.code ? `${status.code}: ${detail}` : detail;
    try {
      void navigator.clipboard?.writeText(textToCopy).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }, () => {});
    } catch { /* no clipboard */ }
  };
  const action = { border: 0, background: 'none', p: 0, m: 0, cursor: 'pointer', color: 'primary.light', typography: 'caption', fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '1px solid', outlineColor: 'currentColor' } } as const;
  const title = (
    <Box
      data-identity-status-tip=""
      onClick={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      onKeyDown={(e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Escape') { onTip.current = false; close(); } }}
      onMouseEnter={() => { onTip.current = true; }}
      onMouseLeave={() => { onTip.current = false; close(); }}
      sx={{ display: 'flex', alignItems: full ? 'flex-start' : 'center', gap: 1, maxWidth: '22rem', typography: 'caption', lineHeight: 1.2 }}
    >
      <Box component="span" data-identity-status-detail="" sx={full ? { whiteSpace: 'normal', wordBreak: 'break-word' } : { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {full && status.code ? `${detail} (${status.code})` : detail}
      </Box>
      {isError && (
        <>
          <Box component="button" type="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setFull((f) => !f); }} sx={action}>{full ? 'Less' : 'View all'}</Box>
          <Box component="button" type="button" onClick={copy} sx={action}>{copied ? 'Copied' : 'Copy error'}</Box>
        </>
      )}
    </Box>
  );
  return (
    <Tooltip title={title} open={open} onOpen={() => setOpen(true)} onClose={close} placement="bottom-start" enterDelay={250} leaveDelay={200} slotProps={{ tooltip: { sx: { px: 1, py: 0.5 } } }}>
      <Box
        component="span"
        data-identity-status={status.code ?? status.tone ?? ''}
        sx={{ display: 'block', typography: 'caption', lineHeight: 1.25, minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isError ? 'warning.main' : 'text.secondary', opacity: isError ? 0.9 : 1 }}
      >
        {status.text}
      </Box>
    </Tooltip>
  );
}

export function IdentityText({ primary, secondary, extra, status, title }: { primary: string; secondary?: string | null; extra?: string | null; status?: IdentityStatusInfo | null; title?: string }) {
  return (
    <Box title={title} data-gui-node-id="GUI.window.layout.marks.identity.text" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', width: '100%', overflow: 'hidden', lineHeight: 1.15 }}>
      <Box component="span" sx={{ fontWeight: 700, fontSize: '0.86rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</Box>
      {secondary ? <Box component="span" sx={(t: any) => ({ ...t.typography.subtitle2, fontSize: '0.72rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{secondary}</Box> : null}
      {extra ? <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extra}</Box> : null}
      {status ? <IdentityStatus status={status} /> : null}
    </Box>
  );
}

/**
 * The person's QR and their text as ONE button in the left bar's head: one target, one hover / focus, the QR's own
 * action. In the rail only the QR shows (the text needs the open bar). `mark` is the shell's trigger (a BarBrandCell
 * holding the QR); its click, ref and aria come through unchanged.
 */
export const IdentityButton = React.forwardRef<HTMLElement, { mark: React.ReactElement; text: React.ReactNode; openProps?: Record<string, unknown> } & Record<string, unknown>>(function IdentityButton({ mark, text, openProps, ...rest }, ref) {
  const { view } = useLeftSidebar();
  const m = mark as React.ReactElement<Record<string, any>>;
  // Keep the mark's own ref when no one above passes one (a cell measured by its shell).
  const ownRef = (m as unknown as { ref?: unknown }).ref ?? m.props.ref;
  ref = (ref ?? ownRef ?? null) as typeof ref;
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    (m.props.onClick as ((ev: React.MouseEvent<HTMLElement>) => void) | undefined)?.(e);
    (rest.onClick as ((ev: React.MouseEvent<HTMLElement>) => void) | undefined)?.(e);
  };
  if (view === 'rail') return React.cloneElement(m, { ...rest, ref, onClick });
  const own = m.props.sx && typeof m.props.sx === 'object' && !Array.isArray(m.props.sx) ? m.props.sx : {};
  return React.cloneElement(m, {
    ...rest,
    ...(openProps as Record<string, unknown> | undefined),
    ref,
    onClick,
    'data-identity-button': '',
    sx: { ...own, width: '100%', minWidth: 0, flex: '1 1 auto', justifyContent: 'flex-start' },
    children: (
      <>
        {/* The QR in the bar's shared leading column (same inset and width as every row's mark), the text after it. */}
        <Box component="span" sx={{ pl: leadInset(), flexShrink: 0, display: 'flex', alignItems: 'center', height: '3rem' }}>
          <Box component="span" data-lead-col="" sx={leadColSx}>{m.props.children}</Box>
        </Box>
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden', textAlign: 'left', ml: LEAD_GAP, pr: 1 }}>{text as React.ReactNode}</Box>
      </>
    ),
  });
});

/** The place's half beside the site's brand: `@localhost:5176`. */
export function WhereText({ where, title }: { where: string; title?: string }) {
  return (
    <Box component="span" title={title} data-gui-node-id="GUI.window.layout.marks.brand.where" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, maxWidth: '100%', display: 'block' }}>
      {where}
    </Box>
  );
}

/** A row in the left bar's foot: the mark in the shared leading column, the text after it (the rail: the mark alone, centred). */
function LeadRow({ mark, text }: { mark: React.ReactNode; text: React.ReactNode }) {
  const { view } = useLeftSidebar();
  if (view === 'rail') return <>{mark}</>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, height: '1.5rem' }}>
      <Box data-lead-col="" sx={leadColSx}>{mark}</Box>
      <Box sx={{ ml: LEAD_GAP, minWidth: 0, flex: 1, overflow: 'hidden' }}>{text}</Box>
    </Box>
  );
}
const leadRow = (mark: React.ReactNode, text: React.ReactNode) => <LeadRow mark={mark} text={text} />;

const markRow = (mark: React.ReactNode, text: React.ReactNode, nameThenMark = false) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, minWidth: 0 }}>
    {nameThenMark ? <>{text}{mark}</> : <>{mark}{text}</>}
  </Box>
);

/**
 * The two marks put where `placeMarks()` said, each with its text beside it when its bar shows text: LeftBar's
 * `brand` slot (its text becomes the bar's `header`, which the bar shows only expanded), the start and the far end of
 * the top bar (text when `topText`), the left bar's foot (text while expanded), or floating in a corner (the mark
 * alone). With icons only, the marks alone. The marks and texts themselves are the shell's. They never share a cell:
 * a collision jumps one by the opposition rule (`opposingCorner`). `float` is the first floating corner (as before);
 * `floats` is every floating corner, so two independent marks at two empty corners both appear.
 */
export function marksInBars(
  placement: _Placement,
  marks: { brand?: React.ReactNode; identity?: React.ReactNode; brandText?: React.ReactNode; identityText?: React.ReactNode },
  opts: { topText?: boolean } = {},
) {
  const out = {
    leftBrand: undefined as React.ReactNode,
    leftHeader: undefined as React.ReactNode,
    rightBrand: undefined as React.ReactNode,
    rightHeader: undefined as React.ReactNode,
    topStart: [] as TopElement[],
    topEnd: [] as TopElement[],
    leftFooter: [] as LeftAction[],
    rightFooter: [] as LeftAction[],
    float: null as null | { corner: _Corner; element: React.ReactNode },
    floats: [] as { corner: _Corner; element: React.ReactNode }[],
  };
  const put = (slot: string, element: React.ReactNode, text: React.ReactNode, nameThenMark = false) => {
    if (element == null || slot === 'none' || slot === 'corner') return;
    if (slot === 'left.brand') {
      out.leftBrand = element;
      out.leftHeader = text == null ? undefined : <Box sx={BESIDE_RAIL_MARK_SX}>{text}</Box>;
    }
    else if (slot === 'right.brand') {
      // Same mechanism as left.brand, mirrored: the text hangs on the inner (left) side of the icon.
      out.rightBrand = element;
      out.rightHeader = text == null ? undefined : (
        <Box sx={{ ...besideRailMarkSx('right'), width: '100%', maxWidth: '100%', overflow: 'hidden' }}>{text}</Box>
      );
    }
    else if (slot === 'top.start') out.topStart.push({ type: 'action', props: { element: opts.topText && text ? markRow(element, text, nameThenMark) : element } });
    // On the far right of the top bar (when there is no right bar), name then logo sits at the end.
    else if (slot === 'top.end') out.topEnd.push({ type: 'action', props: { element: opts.topText && text ? markRow(element, text, nameThenMark) : element } });
    // The left bar's foot: mark first, in the bar's shared leading column, then its text (open bar only).
    else if (slot === 'left.footer') out.leftFooter.push({ type: 'action', props: { element: text ? leadRow(element, <OnlyWhenLeftBarExpanded>{text}</OnlyWhenLeftBarExpanded>) : element, tooltip: false } });
    else if (slot === 'right.footer') out.rightFooter.push({ type: 'action', props: { element: text ? markRow(element, <OnlyWhenRightBarExpanded>{text}</OnlyWhenRightBarExpanded>, nameThenMark) : element, tooltip: false } });
    else if (slot.startsWith('float:')) {
      const corner = slot.slice(6) as _Corner;
      if (!out.floats.some((f) => f.corner === corner)) out.floats.push({ corner, element });
      out.float = out.floats[0];
    }
  };
  put(placement.identity, marks.identity, marks.identityText);
  put(placement.brand, marks.brand, marks.brandText, true);
  return out;
}

/** Live content-area edges (open bars and the mobile drawer), in CSS px. */
function liveContentEdges(): { left: number; top: number; right: number; bottom: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const css = (name: string) => {
    const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const box = (sel: string) => {
    const el = document.querySelector(sel);
    if (!(el instanceof HTMLElement)) return 0;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 ? r : 0;
  };
  const leftEl = box('aside.LeftSidebar, [data-gui-node-id="GUI.window.layout.bars.left"]');
  const rightEl = box('aside.RightBar, [data-gui-component="right"]');
  const topEl = box('[data-gui-component="top"]');
  const bottomEl = box('[data-gui-component="footer"]');
  const left = (leftEl && leftEl.left < 8 && leftEl.right > 0 ? leftEl.right : 0) || css('--gui-inset-left');
  const right = (rightEl && rightEl.right > vw - 8 && rightEl.left < vw ? vw - rightEl.left : 0) || css('--gui-inset-right');
  const top = (topEl && topEl.top < 8 && topEl.bottom > 0 ? topEl.bottom : 0) || css('--gui-inset-top');
  const bottom = (bottomEl && bottomEl.bottom > vh - 8 && bottomEl.top < vh ? vh - bottomEl.top : 0) || css('--gui-inset-bottom');
  return { left, top, right, bottom };
}

/**
 * A mark floating in a content-area corner (the space the live bars leave), clear of their edges.
 * When the collapsed brand handle owns the top-left chrome, the QR sits just below it, never over it.
 */
export function FloatingMark({ corner, children }: { corner: _Corner; children: React.ReactNode }) {
  const isTop = corner.startsWith('top');
  const isRight = corner.endsWith('right');
  const GAP = 8;
  const [pos, setPos] = React.useState({ top: GAP, left: GAP });
  const place = React.useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const e = liveContentEdges();
    let top = isTop ? e.top + GAP : vh - e.bottom - FLOATING_MARK_CELL - GAP;
    let left = isRight ? vw - e.right - FLOATING_MARK_CELL - GAP : e.left + GAP;
    const handle = document.querySelector('[data-gui-mobile-handle]') as HTMLElement | null;
    if (handle) {
      const r = handle.getBoundingClientRect();
      const vis = r.width > 1 && r.height > 1 && getComputedStyle(handle).display !== 'none' && getComputedStyle(handle).visibility !== 'hidden';
      if (vis) {
        const overlaps = left < r.right && left + FLOATING_MARK_CELL > r.left && top < r.bottom && top + FLOATING_MARK_CELL > r.top;
        if (overlaps && !isRight && isTop) top = r.bottom + GAP;
      }
    }
    setPos((p) => (Math.abs(p.top - top) < 0.5 && Math.abs(p.left - left) < 0.5 ? p : { top, left }));
  }, [isTop, isRight]);
  React.useLayoutEffect(() => {
    place();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => place()) : null;
    ro?.observe(document.documentElement);
    const bar = document.querySelector('aside.LeftSidebar, [data-gui-node-id="GUI.window.layout.bars.left"], [data-gui-mobile-handle]');
    if (bar) ro?.observe(bar);
    window.addEventListener('resize', place);
    window.addEventListener('transitionend', place);
    // The mobile drawer animates for ~300ms; remeasure through that, then stop.
    const started = Date.now();
    const id = window.setInterval(() => {
      place();
      if (Date.now() - started > 800) window.clearInterval(id);
    }, 50);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('transitionend', place);
      window.clearInterval(id);
    };
  }, [place]);
  return (
    <Box data-gui-node-id={`GUI.window.layout.marks.${corner}`} sx={{ position: 'fixed', zIndex: (t: any) => (t.zIndex?.drawer ?? 1200) + 3, top: pos.top, left: pos.left }}>
      {children}
    </Box>
  );
}

/**
 * The closed-drawer corner mark on a narrow screen: the site's brand (a press opens the bar),
 * or nothing when the identity QR already sits in the top bar (it keeps its own action).
 * When there is no brand and the QR is in the left bar, leave `collapsedHandle` unset so the
 * bar uses that mark, which opens the identity card.
 */
export function collapsedBarHandleProps(opts: {
  narrow: boolean;
  brand?: React.ReactNode;
  identitySlot: string;
}): { collapsedHandle?: React.ReactNode | null; collapsedHandleOpensBar: boolean } {
  if (!opts.narrow) return { collapsedHandleOpensBar: true };
  if (opts.brand && React.isValidElement(opts.brand)) {
    return {
      collapsedHandle: React.cloneElement(opts.brand as React.ReactElement<Record<string, unknown>>, {
        compact: true,
        showLabel: false,
        floating: true,
        href: null,
        to: null,
      } as Partial<Record<string, unknown>>),
      collapsedHandleOpensBar: true,
    };
  }
  const inTop = opts.identitySlot === 'top.start' || opts.identitySlot === 'top.end';
  const floating = typeof opts.identitySlot === 'string' && opts.identitySlot.startsWith('float:');
  // The floating QR is already the visible handle; do not add a hamburger beside it.
  return { collapsedHandle: (inTop || floating) ? null : undefined, collapsedHandleOpensBar: false };
}

export type SiteBrandProps = {
  label: string;
  href?: string | null;
  to?: string | null;
  logo?: string | null;
  icon?: string | null;
  glyph?: string | null;
  compact?: boolean;
  /**
   * The brand is a floating corner mark (no bar holds it): a square cell the same size as the
   * floating QR, with the glyph/logo centered in a face the same size as the QR badge. Hides the
   * label. Does not affect the compact top-bar brand.
   */
  floating?: boolean;
  /** In app view the brand is also the tab's icon (default). `false` keeps the page's own. */
  favicon?: boolean;
  /** Show the label to the left of the logo (default). `false` keeps the mark alone. */
  showLabel?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  sx?: BoxProps['sx'];
};

/**
 * The site's brand (the author's mark: whose page this is), in its own cell: the name, then the logo
 * (`Neurons` then the mark — name, then brand, logo on the right). A link when the author gave one.
 * It is never the person's QR. Forwards a ref and click so
 * the shell can unfold the app's sidebar from it, the same way the QR unfolds its own.
 */
export const SiteBrand = React.forwardRef<HTMLElement, SiteBrandProps>(function SiteBrand(
  { label, href, to, logo, icon, glyph, compact = false, floating = false, favicon = true, showLabel = true, onClick, sx, ...rest },
  ref,
) {
  const initial = Array.from(label.replace(/[^\p{L}\p{N}]/gu, ''))[0]?.toUpperCase() ?? '•';
  const theme = useGuiTheme();
  const fg = theme.palette.primary.main;
  const bg = theme.palette.background.paper;
  const cellRef = React.useRef<HTMLElement | null>(null);
  const [iconHref, setIconHref] = React.useState<string | null>(null);
  // An Icon is drawn first; its <svg> is then read back so the tab shows the same mark.
  React.useEffect(() => {
    if (!icon || logo) { setIconHref(null); return; }
    const svg = cellRef.current?.querySelector('svg');
    setIconHref(svg ? svgElementFaviconHref(svg as SVGSVGElement, fg) : null);
  }, [icon, logo, fg]);
  const faviconHref = React.useMemo(() => {
    if (logo) return logo;
    if (icon && iconHref) return iconHref;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(brandFaviconSvg(glyph || initial, { fg, bg }))}`;
  }, [logo, icon, iconHref, glyph, initial, fg, bg]);
  useFavicon(faviconHref, favicon);
  const setRefs = (node: HTMLElement | null) => {
    cellRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
  };
  // `to`: a route of this app (no reload); `href`: an address; neither: a cell the shell may click.
  const link = to ? { component: RouterLink, to } : href ? { component: 'a', href } : { component: onClick ? 'button' : 'div', ...(onClick ? { type: 'button' } : {}) };
  const face = floating ? {
    width: RAIL_BADGE_SIZE,
    height: RAIL_BADGE_SIZE,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    borderRadius: FLOATING_BRAND_FACE_RADIUS,
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    boxSizing: 'border-box' as const,
  } : null;
  const mark = logo ? (
    <Box component="img" src={logo} alt="" sx={face ? { ...face, objectFit: 'contain', p: 0.5 } : { width: 28, height: 28, objectFit: 'contain', flex: 'none' }} />
  ) : icon ? (
    face ? <Box sx={face}><Icon name={icon} fontSize={Math.round(RAIL_BADGE_SIZE * 0.62)} /></Box> : <Icon name={icon} fontSize={28} />
  ) : (
    <Box
      component="span"
      sx={face ? {
        ...face,
        fontWeight: 700,
        fontSize: `${Math.round(RAIL_BADGE_SIZE * 0.62)}px`,
        color: 'primary.main',
        lineHeight: 1,
      } : { fontWeight: 700, fontSize: glyph ? '1.5rem' : '1.25rem', color: 'primary.main', lineHeight: 1, flex: 'none' }}
    >
      {glyph || initial}
    </Box>
  );
  return (
    <BarBrandCell
      {...link}
      {...rest}
      ref={setRefs as any}
      onClick={onClick}
      title={label}
      aria-label={label}
      data-gui-node-id="GUI.window.layout.bars.brand"
      data-gui-component="brand"
      sx={{
        fontWeight: 700,
        color: 'inherit',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        containerType: 'inline-size',
        ...(compact && !floating ? { width: 'auto', height: FLOATING_MARK_CELL, minWidth: 0, px: 1, flex: 'none' } : {}),
        ...(floating ? { width: FLOATING_MARK_CELL, height: FLOATING_MARK_CELL, minWidth: FLOATING_MARK_CELL, minHeight: FLOATING_MARK_CELL, px: 0, flex: 'none' } : {}),
        // Same hover/click affordance as the QR (BarBrandCell): a pointing cursor and a hover fill,
        // also when the shell wraps the mark (the collapsed handle) instead of passing onClick.
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' },
        ...(sx as object),
      }}
    >
      {showLabel && !floating && label ? (
        <Box
          component="span"
          data-gui-node-id="GUI.window.layout.bars.brand.label"
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            lineHeight: 1,
            color: 'text.primary',
            whiteSpace: 'nowrap',
            // In a rail-narrow cell the name has no room: the logo stays, the name returns when the cell widens.
            '@container (max-width: 80px)': { display: 'none' },
          }}
        >
          {label}
        </Box>
      ) : null}
      {mark}
    </BarBrandCell>
  );
});
