import * as React from 'react';
import { Box } from '@/gui/Atoms';
import PixelWordmark from '../me/QR/PixelWordmark';
import { NETGET_WORDMARK_BITMAP } from './netgetWordmarkBitmap';
import { useGuiNodeId } from '@/runtime/guiNodeId';

export interface NetGetMarkProps {
  /** Caps how wide the mark can grow inside a very wide container.
   *  Unset by default — it fills whatever width its parent gives it,
   *  same as any other block-level design element (see the header
   *  comment below for why this replaced a fixed square size). */
  maxWidth?: number | string;
  /** Border/wordmark color. Defaults to a fixed royal blue rather than
   *  `primary.main` — this is a brand mark (see the reference logo it's
   *  matching), not a themed UI element; it should look the same
   *  regardless of which theme/accent color the surrounding app picked. */
  color?: string;
  /** Background color. Defaults to a near-black navy, not `background.paper`
   *  or `background.default` — same reasoning as `color` above. */
  background?: string;
  sx?: any;
}

/**
 * NETGET brand mark — dark ground, thin blue border, the blocky NETGET
 * pixel wordmark filling the available width. Used as the header of
 * first-run/setup screens (see Setup/GatewaySetup.tsx).
 *
 * Deliberately NOT a fixed-size square badge (an earlier version of this
 * component was, sized in px) and deliberately NOT a raster image either:
 * the wordmark is still the same bitmap-driven SVG PixelWordmark.tsx
 * already draws (crisp at any resolution, no source image to go blurry or
 * pixelate-for-real), but sized here via CSS (`width: 100%`, viewBox doing
 * the scaling) instead of a fixed pixel size — so this mark now genuinely
 * fills whatever width its container gives it (matching a sibling card's
 * width one row down, for instance) rather than sitting at a fixed size
 * that reads as small/disconnected next to a wider neighbor.
 */
export default function NetGetMark({
  maxWidth,
  color = '#4d7fe6',
  background = '#0b0d12',
  sx,
}: NetGetMarkProps) {
  // Under a placed view it is that view's mark (`<view>.mark`); alone, its own.
  const viewId = useGuiNodeId('');

  return (
    <Box
      data-gui-component="NetGetMark"
      sx={{
        width: '100%',
        maxWidth: maxWidth ?? '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: background,
        border: '2px solid',
        borderColor: color,
        borderRadius: 2,
        px: { xs: 2.5, sm: 3.5 },
        py: { xs: 2, sm: 2.75 },
        ...sx,
      }}
    >
      {/* Sized well under the box's own full width on purpose — filling
          the box edge-to-edge left the letters crowding the border with
          no breathing room. 50% keeps the mark small inside the frame,
          matching the reference logo's proportions (a modest wordmark
          inside a generously bordered square), while still scaling
          fluidly with the box instead of a fixed px size. */}
      <PixelWordmark
        bitmap={NETGET_WORDMARK_BITMAP}
        pixelSize={4}
        pixelAspect={1}
        fg={color}
        ariaLabel="NETGET"
        style={{ width: '50%', height: 'auto', display: 'block' }}
        data-gui-node-id={viewId ? `${viewId}.mark` : 'NetGetMark/wordmark'}
      />
    </Box>
  );
}
