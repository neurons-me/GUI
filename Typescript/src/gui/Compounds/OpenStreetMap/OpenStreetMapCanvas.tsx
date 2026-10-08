import * as React from 'react';
import { useOpenStreetMapContext } from './context';
import { osmCanvasMatrix, type OsmPoint, type OsmTransform } from './projection';
import type { OsmPalette } from './mapPalette';

export type OsmFrameInfo = {
  /** 2D context, already transformed to map pixels (and clipped to the frame unless clip=false). */
  ctx: CanvasRenderingContext2D;
  /** rAF timestamp (ms). */
  now: number;
  /** Seconds since the previous frame (0 on the first frame). */
  dt: number;
  /** Frame counter since mount. */
  frame: number;
  /** The same transform the basemap and markers use. */
  transform: OsmTransform;
  /** geo -> map pixels. */
  project(lat: number, lon: number): OsmPoint;
  /** The map's theme-derived palette (current theme and mode), for drawing in theme colours. */
  palette: OsmPalette;
  /** The user asked for reduced motion (prefers-reduced-motion) and the layer throttles; draw a calmer frame. */
  reducedMotion: boolean;
};

export type OsmCanvasProps = {
  /** Per-frame draw callback. Draw in map pixels; the layer clears before each call. */
  onFrame: (info: OsmFrameInfo) => void;
  /** Run a requestAnimationFrame loop (default true). When false, draws on resize and when `redrawKey` changes. */
  animate?: boolean;
  redrawKey?: unknown;
  /** Clip drawing to the map frame (default true). */
  clip?: boolean;
  /**
   * With prefers-reduced-motion: 'throttle' (default) draws an animated layer at
   * most every `reducedMotionInterval` ms (and on view / theme changes); 'ignore'
   * keeps the full frame rate. `info.reducedMotion` tells onFrame either way.
   */
  reducedMotion?: 'throttle' | 'ignore';
  /** Default 500. */
  reducedMotionInterval?: number;
  /** GUI node id (set by the spec renderer, or by hand) for the Semantic Inspector / Layout Grid. */
  'data-gui-node-id'?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Draw one frame of a canvas layer with the shared transform. Exported for tests/tools. */
export function drawOsmCanvasFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  transform: OsmTransform,
  onFrame: OsmCanvasProps['onFrame'],
  timing: { now: number; dt: number; frame: number },
  clip = true,
  palette?: OsmPalette,
  reducedMotion = false,
) {
  const { view, projection } = transform;
  const bw = Math.round(view.width * view.dpr);
  const bh = Math.round(view.height * view.dpr);
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bw, bh);
  if (!(view.scale > 0)) return;
  ctx.setTransform(...osmCanvasMatrix(view));
  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(0, 0, projection.width, projection.height);
    ctx.clip();
  }
  try {
    onFrame({ ctx, now: timing.now, dt: timing.dt, frame: timing.frame, transform, project: transform.project, palette: palette as OsmPalette, reducedMotion });
  } finally {
    ctx.restore();
  }
}

/** Live prefers-reduced-motion (false on the server / without matchMedia). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function OpenStreetMapCanvas({
  onFrame,
  animate = true,
  redrawKey,
  clip = true,
  reducedMotion: reducedMotionMode = 'throttle',
  reducedMotionInterval = 500,
  id,
  className,
  style,
  'data-gui-node-id': guiNodeId,
}: OsmCanvasProps) {
  const prefersReduced = usePrefersReducedMotion();
  const throttle = prefersReduced && reducedMotionMode === 'throttle';
  const { transform, transformRef, palette, paletteRef } = useOpenStreetMapContext();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const onFrameRef = React.useRef(onFrame);
  onFrameRef.current = onFrame;
  const timing = React.useRef({ last: 0, frame: 0 });

  const drawNow = React.useCallback((now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const t = timing.current;
    const dt = t.last ? Math.max(0, (now - t.last) / 1000) : 0;
    t.last = now;
    t.frame += 1;
    drawOsmCanvasFrame(canvas, ctx, transformRef.current, onFrameRef.current, { now, dt, frame: t.frame }, clip, paletteRef.current, prefersReduced);
  }, [transformRef, paletteRef, clip, prefersReduced]);

  React.useEffect(() => {
    if (!animate || typeof requestAnimationFrame !== 'function') return;
    let raf = 0;
    let lastDraw = -Infinity;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (throttle && now - lastDraw < reducedMotionInterval) return;
      lastDraw = now;
      drawNow(now);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, drawNow, throttle, reducedMotionInterval]);

  React.useEffect(() => {
    if (animate && !throttle) return;
    drawNow(typeof performance !== 'undefined' ? performance.now() : Date.now());
  }, [animate, throttle, drawNow, redrawKey, transform, palette]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={['gui-osm__canvas', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-gui-component="OpenStreetMap.Canvas"
      data-gui-node-id={guiNodeId || undefined}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', ...style }}
    />
  );
}
