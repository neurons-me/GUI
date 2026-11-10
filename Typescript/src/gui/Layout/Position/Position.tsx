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
import { useLeftSidebar, useGuiTheme, useGuiMediaQuery } from '@/gui-internals/Hooks';
import type { MarksPlacement as _Placement, MarkCorner as _Corner } from './placeMarks';
import QRme, { resolveTopbarQrSize, type QRmeProps } from '@/gui/All.This/me/QR/QR.me';
import type { SxProps, Theme } from '@mui/material/styles';

/** The size a QR badge is drawn at in a bar (the rail's mark size). */
export const RAIL_BADGE_SIZE = 34;

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
const BESIDE_RAIL_MARK_SX = {
  ml: `calc((var(--gui-rail-width, 72px) - ${RAIL_BADGE_SIZE}px) / -2 + ${BESIDE_MARK_GAP_PX}px)`,
  position: 'relative' as const,
  zIndex: 1,
  minWidth: 0,
};

const LEFT_POSITION_SX: SxProps<Theme> = {
  display: 'block',
  minWidth: 0,
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

export { placeMarks, isMarkCorner, MARK_CORNERS } from './placeMarks';
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

/**
 * The person's half beside their QR: their username on top, the namespace below it, smaller (`jabellae` / `cleaker.me`);
 * the namespace alone without a username. `extra` is a third, smaller line (the place, when no brand carries it).
 */
export function IdentityText({ primary, secondary, extra, title }: { primary: string; secondary?: string | null; extra?: string | null; title?: string }) {
  return (
    <Box title={title} data-gui-node-id="GUI.window.layout.marks.identity.text" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.15 }}>
      <Box component="span" sx={{ fontWeight: 700, fontSize: '0.86rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</Box>
      {secondary ? <Box component="span" sx={(t: any) => ({ ...t.typography.subtitle2, fontSize: '0.72rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{secondary}</Box> : null}
      {extra ? <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extra}</Box> : null}
    </Box>
  );
}

/** The place's half beside the site's brand: `@localhost:5176`. */
export function WhereText({ where, title }: { where: string; title?: string }) {
  return (
    <Box component="span" title={title} data-gui-node-id="GUI.window.layout.marks.brand.where" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
      {where}
    </Box>
  );
}

const markRow = (mark: React.ReactNode, text: React.ReactNode) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, minWidth: 0 }}>{mark}{text}</Box>
);

/**
 * The two marks put where `placeMarks()` said, each with its text beside it when its bar shows text: LeftBar's
 * `brand` slot (its text becomes the bar's `header`, which the bar shows only expanded), the start and the far end of
 * the top bar (text when `topText`), the left bar's foot (text while expanded), or floating in a corner (the mark
 * alone). With icons only, the marks alone. The marks and texts themselves are the shell's.
 */
export function marksInBars(
  placement: _Placement,
  marks: { brand?: React.ReactNode; identity?: React.ReactNode; brandText?: React.ReactNode; identityText?: React.ReactNode },
  opts: { topText?: boolean } = {},
) {
  const out = {
    leftBrand: undefined as React.ReactNode,
    leftHeader: undefined as React.ReactNode,
    topStart: [] as TopElement[],
    topEnd: [] as TopElement[],
    leftFooter: [] as LeftAction[],
    float: null as null | { corner: _Corner; element: React.ReactNode },
  };
  const put = (slot: string, element: React.ReactNode, text: React.ReactNode) => {
    if (element == null || slot === 'none' || slot === 'corner') return;
    if (slot === 'left.brand') {
      out.leftBrand = element;
      out.leftHeader = text == null ? undefined : <Box sx={BESIDE_RAIL_MARK_SX}>{text}</Box>;
    }
    else if (slot === 'top.start') out.topStart.push({ type: 'action', props: { element: opts.topText && text ? markRow(element, text) : element } });
    else if (slot === 'top.end') out.topEnd.push({ type: 'action', props: { element: opts.topText && text ? markRow(element, text) : element } });
    else if (slot === 'left.footer') out.leftFooter.push({ type: 'action', props: { element: text ? markRow(element, <OnlyWhenLeftBarExpanded>{text}</OnlyWhenLeftBarExpanded>) : element, tooltip: false } });
    else if (slot.startsWith('float:')) out.float = { corner: slot.slice(6) as _Corner, element };
  };
  put(placement.identity, marks.identity, marks.identityText);
  put(placement.brand, marks.brand, marks.brandText);
  return out;
}

/** A mark floating in a corner no bar holds (fixed, over the page, clear of the bars' edges). */
export function FloatingMark({ corner, children }: { corner: _Corner; children: React.ReactNode }) {
  const top = corner.startsWith('top');
  const right = corner.endsWith('right');
  return (
    <Box data-gui-node-id={`GUI.window.layout.marks.${corner}`} sx={{ position: 'fixed', zIndex: (t: any) => (t.zIndex?.drawer ?? 1200) + 3, [top ? 'top' : 'bottom']: 8, [right ? 'right' : 'left']: 8 }}>
      {children}
    </Box>
  );
}

/**
 * The site's brand (the author's mark: whose page this is), in its own cell: a logo image, or the label's first letter.
 * A link when the author gave one. It is never the person's QR and never shares its cell (placeMarks).
 */
export function SiteBrand({ label, href, to, logo, icon, glyph, compact = false }: { label: string; href?: string | null; to?: string | null; logo?: string | null; icon?: string | null; glyph?: string | null; compact?: boolean }) {
  const initial = Array.from(label.replace(/[^\p{L}\p{N}]/gu, ''))[0]?.toUpperCase() ?? '•';
  // `to`: a route of this app (no reload); `href`: an address; neither: the mark alone.
  const link = to ? { component: RouterLink, to } : href ? { component: 'a', href } : { component: 'div' };
  return (
    <BarBrandCell
      {...link}
      title={label}
      aria-label={label}
      data-gui-node-id="GUI.window.layout.bars.brand"
      data-gui-component="brand"
      sx={{ fontWeight: 700, fontSize: glyph ? '1.5rem' : '1.25rem', color: 'primary.main', ...(compact ? { width: 'auto', height: 48, minWidth: 0, px: 0, flex: 'none' } : {}), ...(to || href ? {} : { cursor: 'default', '&:hover': {} }) }}
    >
      {logo ? <Box component="img" src={logo} alt="" sx={{ width: 28, height: 28, objectFit: 'contain' }} /> : icon ? <Icon name={icon} fontSize={28} /> : glyph || initial}
    </BarBrandCell>
  );
}
