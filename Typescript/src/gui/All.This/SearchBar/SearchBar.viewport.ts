// The part of the page the user can actually see. On mobile the on-screen keyboard shrinks only
// `window.visualViewport` (iOS Safari, Android Chrome); the layout viewport, 100vh and often 100dvh stay tall.
export type VisibleViewport = { top: number; left: number; width: number; height: number };

export function readVisibleViewport(win: any = typeof window !== 'undefined' ? window : undefined): VisibleViewport | null {
  if (!win) return null;
  const vv = win.visualViewport;
  if (vv && vv.height > 0) {
    return { top: vv.offsetTop || 0, left: vv.offsetLeft || 0, width: vv.width, height: vv.height };
  }
  return { top: 0, left: 0, width: win.innerWidth, height: win.innerHeight };
}

/**
 * Max height for a dropdown that opens below a field whose bottom edge is at `anchorBottom`
 * (layout-viewport/client px, as getBoundingClientRect gives), so it ends above the keyboard.
 */
export function dropdownMaxHeight(anchorBottom: number, vp: VisibleViewport | null, gap = 6, margin = 8, min = 96): number | undefined {
  if (!vp) return undefined;
  const available = vp.top + vp.height - anchorBottom - gap - margin;
  return Math.max(min, Math.floor(available));
}
