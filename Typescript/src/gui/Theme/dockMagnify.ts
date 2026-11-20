// src/gui/Theme/dockMagnify.ts
// Shared macOS Dock-style magnification for the rail theme catalog (vertical,
// layout size grows so neighbors are pushed apart) and the /GUI/themes avatar
// strip (horizontal, transform-only so labels and layout stay put).
import { useCallback, useEffect, useRef } from 'react';

export const DOCK_MAX = 1.48;
export const DOCK_RANGE_ITEMS = 2;
export const DOCK_TRACK_MS = 100;
export const DOCK_LEAVE_MS = 150;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Cosine falloff: ~1.48 under the pointer, ~1.24 at one item, 1.0 at two. */
export function dockFalloff(distance: number, itemSpan: number): number {
  const range = itemSpan * DOCK_RANGE_ITEMS;
  if (range <= 0) return 1;
  const d = Math.abs(distance);
  if (d >= range) return 1;
  return 1 + (DOCK_MAX - 1) * 0.5 * (1 + Math.cos((Math.PI * d) / range));
}

export type DockAxis = 'x' | 'y';

export type DockApply = (
  items: Array<HTMLElement | null>,
  scales: number[],
  leaving: boolean,
) => void;

export function useDockMagnify({
  axis,
  itemSize,
  centers = 'layout',
  apply,
}: {
  axis: DockAxis;
  /** Resting size along the axis, used as the falloff pitch (plus gap). */
  itemSize: number;
  /**
   * 'layout': two-pass predicted centers after sizes grow (rail).
   * 'measured': live getBoundingClientRect centers (strip; layout stays put).
   */
  centers?: 'layout' | 'measured';
  apply: DockApply;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const rafRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  const hoveringRef = useRef(false);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const applyFromPointer = useCallback((coord: number | null, leaving: boolean) => {
    const root = listRef.current;
    const items = itemRefs.current;
    if (!root) return;
    const count = items.length;
    let scales = Array.from({ length: count }, () => 1);
    const applySizes = applyRef.current;

    if (coord != null && !prefersReducedMotion()) {
      const cs = window.getComputedStyle(root);
      const gapProp = axis === 'y'
        ? (cs.rowGap || (cs as unknown as { gap: string }).gap)
        : (cs.columnGap || (cs as unknown as { gap: string }).gap);
      const gap = parseFloat(gapProp) || 0;

      if (centers === 'measured') {
        const sizes = items.map((el) => {
          if (!el) return itemSize;
          const r = el.getBoundingClientRect();
          return axis === 'y' ? r.height : r.width;
        });
        const avg = sizes.reduce((a, b) => a + b, 0) / Math.max(sizes.length, 1);
        const itemSpan = avg + gap;
        scales = items.map((el) => {
          if (!el) return 1;
          const r = el.getBoundingClientRect();
          const c = axis === 'y' ? r.top + r.height / 2 : r.left + r.width / 2;
          return dockFalloff(coord - c, itemSpan);
        });
      } else {
        const pad = parseFloat(axis === 'y' ? cs.paddingTop : cs.paddingLeft) || 0;
        const itemSpan = itemSize + gap;
        scales = items.map((_, i) => {
          const center = pad + i * itemSpan + itemSize / 2;
          return dockFalloff(coord - center, itemSpan);
        });
        // Two layout passes so the peak tracks the cursor after neighbors
        // have already been pushed apart.
        for (let pass = 0; pass < 2; pass += 1) {
          let cursor = pad;
          const nextCenters = scales.map((s) => {
            const span = itemSize * s;
            const c = cursor + span / 2;
            cursor += span + gap;
            return c;
          });
          scales = nextCenters.map((c) => dockFalloff(coord - c, itemSpan));
        }
      }
    }
    applySizes(items, scales, leaving);
  }, [axis, itemSize, centers]);

  const flush = useCallback(() => {
    rafRef.current = 0;
    const root = listRef.current;
    const pending = pendingRef.current;
    if (!root || pending == null) return;
    if (centers === 'measured') {
      applyFromPointer(pending, false);
    } else {
      const rect = root.getBoundingClientRect();
      const start = axis === 'y' ? rect.top : rect.left;
      applyFromPointer(pending - start, false);
    }
  }, [applyFromPointer, axis, centers]);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (prefersReducedMotion()) return;
    pendingRef.current = axis === 'y' ? event.clientY : event.clientX;
    hoveringRef.current = true;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(flush);
  }, [flush, axis]);

  const onPointerLeave = useCallback(() => {
    pendingRef.current = null;
    hoveringRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    applyFromPointer(null, true);
  }, [applyFromPointer]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const syncItemCount = useCallback((count: number) => {
    itemRefs.current.length = count;
    if (!hoveringRef.current) applyFromPointer(null, false);
  }, [applyFromPointer]);

  return {
    listRef,
    itemRefs,
    onPointerMove,
    onPointerLeave,
    syncItemCount,
  };
}
