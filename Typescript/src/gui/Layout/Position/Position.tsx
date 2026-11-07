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
import Box, { type BoxProps } from '@/gui/Atoms/Box/Box';
import { useLeftSidebar } from '@/gui-internals/Hooks';
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

const LEFT_POSITION_SX: SxProps<Theme> = {
  display: 'block',
  minWidth: 0,
  // Pulled in over the brand cell's empty right margin so it hangs ~6px from the mark instead of ~25px; the mark itself
  // stays exactly where it is in the rail (its cell is as wide as the rail).
  ml: '-10px',
  position: 'relative',
  zIndex: 1,
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

/** The position in the left bar's header, beside the brand, while the bar is expanded (wraps instead of cutting). */
export function LeftBarPosition({ sx, ...rest }: PositionProps) {
  return <Box data-gui-node-id="GUI.window.layout.bars.left.position" {...rest} sx={withSx(LEFT_POSITION_SX, sx)} />;
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
export function BarBrandCell({ sx, ...rest }: PositionProps) {
  return <Box {...rest} sx={withSx(BRAND_CELL_SX, sx)} />;
}
