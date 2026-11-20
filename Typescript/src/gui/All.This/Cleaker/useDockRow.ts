// useDockRow.ts — the Theme collection's hover motion for the identity/keys
// icon rows. Reuses the shared Dock magnification (src/gui/Theme/dockMagnify.ts:
// useDockMagnify + DOCK_TRACK_MS / DOCK_LEAVE_MS, cosine falloff to DOCK_MAX)
// exactly like the ThemeInspector strip: 'measured' centers on the x axis and
// transform-only scaling of an inner `[data-dock-avatar]`, so the outer
// item (the tree anchor / obstacle) keeps its layout box and the hairlines
// never move. prefers-reduced-motion is handled by the hook (no scaling).
//
// Tree rows can wrap: only items on the hovered line magnify.
import * as React from 'react';
import { DOCK_LEAVE_MS, DOCK_TRACK_MS, useDockMagnify } from '@/gui/Theme/dockMagnify';

/** Direct children of the row that take part (the stable wrappers). */
const ITEM_SELECTOR = ':scope > [data-dock-item]';

export function useDockRow(itemSize = 34) {
  const pointerY = React.useRef<number | null>(null);

  const apply = React.useCallback((items: Array<HTMLElement | null>, scales: number[], leaving: boolean) => {
    // Same as ThemeInspector's ThemeStrip apply.
    const ms = leaving ? DOCK_LEAVE_MS : DOCK_TRACK_MS;
    const transition = `transform ${ms}ms ease-out`;
    const y = pointerY.current;
    items.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const onLine = y == null || (y >= r.top - 12 && y <= r.bottom + 12);
      const s = onLine ? (scales[i] ?? 1) : 1;
      el.style.zIndex = String(Math.round(s * 100));
      const avatar = el.querySelector('[data-dock-avatar]') as HTMLElement | null;
      if (!avatar) return;
      avatar.style.transition = transition;
      avatar.style.transform = s === 1 ? '' : `scale(${s})`;
    });
  }, []);

  const { listRef, itemRefs, onPointerMove, onPointerLeave } = useDockMagnify({ axis: 'x', itemSize, centers: 'measured', apply });

  const collect = React.useCallback(() => {
    const root = listRef.current;
    itemRefs.current = root ? Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
  }, [listRef, itemRefs]);

  const handleMove = React.useCallback((e: React.PointerEvent) => {
    pointerY.current = e.clientY; collect(); onPointerMove(e);
  }, [collect, onPointerMove]);
  const handleLeave = React.useCallback(() => {
    pointerY.current = null; collect(); onPointerLeave();
  }, [collect, onPointerLeave]);

  return { ref: listRef, onPointerMove: handleMove, onPointerLeave: handleLeave };
}
