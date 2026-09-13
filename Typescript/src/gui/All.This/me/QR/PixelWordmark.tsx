import React from 'react';

export type PixelWordmarkProps = {
  /** Rows of "0"/"1" — same bitmap format QR.tsx's embedBitmap uses. */
  bitmap: string[];
  /** Real screen px per bitmap cell (height) — this is what stays crisp at any size. */
  pixelSize?: number;
  /** Multiplier on pixelSize for cell width — >1 widens the whole glyph set without redrawing the bitmap. */
  pixelAspect?: number;
  fg?: string;
  /** Defaults to ".me" — this component started as the .me mark's own
   *  renderer (see meMark.ts) before any other bitmap used it; a caller
   *  drawing a different wordmark (e.g. NetGetMark.tsx's "NETGET") should
   *  pass its own label so the accessible name matches what's actually
   *  drawn. */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  'data-gui-node-id'?: string;
};

/**
 * Draws a bitmap as its own small, fixed-resolution pixel grid — no
 * connection to a QR's module count at all. Where QR.tsx's embedBitmap
 * mechanism must quantize a shape down to however many modules a safe
 * embedScale allows (a handful, for anything meant to stay scannable),
 * this renders at whatever pixelSize is asked for, so a full "m"/"e"/"."
 * wordmark stays legible at a size far smaller than embedding it into the
 * code ever could. Meant to sit on top of a QR that's cleared a blank
 * negative-space area for it (see QR.me.tsx) — this component draws
 * nothing about the QR itself.
 */
export default function PixelWordmark({
  bitmap,
  pixelSize = 2,
  pixelAspect = 1,
  fg = 'currentColor',
  ariaLabel = '.me',
  className,
  style,
  'data-gui-node-id': dataGuiNodeId,
}: PixelWordmarkProps) {
  const rows = bitmap.length;
  const cols = rows ? Math.max(...bitmap.map((row) => row.length)) : 0;
  const cellW = pixelSize * pixelAspect;
  const cellH = pixelSize;
  const width = cols * cellW;
  const height = rows * cellH;

  if (!width || !height) return null;

  const rects: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    const row = bitmap[y] ?? '';
    for (let x = 0; x < cols; x++) {
      if (row[x] !== '1') continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x * cellW} y={y * cellH} width={cellW} height={cellH} />,
      );
    }
  }

  return (
    <svg
      data-gui-node-id={dataGuiNodeId || 'PixelWordmark'}
      className={className}
      style={style}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      shapeRendering="crispEdges"
    >
      <g fill={fg}>{rects}</g>
    </svg>
  );
}
