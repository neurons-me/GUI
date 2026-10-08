/*
 * GUI.OpenStreetMap — zoom / pan gestures on the map root:
 *   wheel zooms about the pointer, cooperatively by default: only with Ctrl/⌘ held
 *   or once the map has focus (click / Tab); otherwise the page scrolls and the map
 *   shows a hint. Trackpad pinch arrives as ctrl+wheel, so it always zooms,
 *   drag pans (after a 4 px threshold, so marker clicks still work),
 *   two pointers pinch-zoom and pan, double-click zooms in (shift: out),
 *   keyboard on the focused map: arrows pan, + / − zoom, 0 resets.
 * Overlays (controls, legend, chips, attribution) keep their own events.
 * Updates are batched to one view change per animation frame.
 */
import * as React from 'react';
import type { OsmViewport } from './context';

export type OsmWheelMode = 'cooperative' | 'greedy';

export type OsmGestureOptions = {
  /**
   * Wheel zoom. 'cooperative' (default, also `true`): with Ctrl/⌘ held or once the
   * map has focus; otherwise the page scrolls and a hint shows. 'greedy': always.
   */
  wheel?: boolean | OsmWheelMode;
  drag?: boolean;
  pinch?: boolean;
  doubleClick?: boolean;
  keyboard?: boolean;
};

export const OSM_DRAG_THRESHOLD = 4;
export const OSM_KEY_PAN = 64;
export const OSM_KEY_ZOOM = 2;

/** Wheel delta (any deltaMode) → zoom factor. */
export function osmWheelZoomFactor(deltaY: number, deltaMode = 0, ctrlKey = false): number {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  // trackpad pinch (ctrl+wheel) sends small deltas: zoom faster per px
  const k = ctrlKey ? 0.01 : 0.002;
  return Math.exp(-Math.max(-600, Math.min(600, px)) * k);
}

/**
 * What a wheel event does: 'zoom' the map, show the 'hint' (and let the page
 * scroll), or 'none' (wheel zoom off).
 */
export function osmWheelAction(e: { ctrlKey?: boolean; metaKey?: boolean }, engaged: boolean, mode: boolean | OsmWheelMode = 'cooperative'): 'zoom' | 'hint' | 'none' {
  if (mode === false) return 'none';
  if (mode === 'greedy') return 'zoom';
  return e.ctrlKey || e.metaKey || engaged ? 'zoom' : 'hint';
}

/** Platform modifier name for the wheel hint. */
export function osmIsMac(nav: { platform?: string; userAgent?: string; userAgentData?: { platform?: string } } | undefined): boolean {
  if (!nav) return false;
  const p = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(p);
}

/** Key → view action, or null when the key is not a map key. */
export function osmKeyAction(key: string, shift = false): { pan?: [number, number]; zoom?: number; reset?: true } | null {
  const step = shift ? OSM_KEY_PAN * 3 : OSM_KEY_PAN;
  switch (key) {
    case 'ArrowLeft': return { pan: [step, 0] };
    case 'ArrowRight': return { pan: [-step, 0] };
    case 'ArrowUp': return { pan: [0, step] };
    case 'ArrowDown': return { pan: [0, -step] };
    case '+': case '=': return { zoom: OSM_KEY_ZOOM };
    case '-': case '_': return { zoom: 1 / OSM_KEY_ZOOM };
    case '0': return { reset: true };
    default: return null;
  }
}

const OVERLAY_SELECTOR = '.gui-osm__overlays .gui-osm__dock > *, .gui-osm__attribution, a, button, input, select, textarea, label';

export function useOsmGestures(
  rootRef: React.RefObject<HTMLElement | null>,
  viewportRef: React.MutableRefObject<OsmViewport>,
  enabled: boolean,
  options: OsmGestureOptions = {},
  onWheelHint?: () => void,
) {
  const { wheel = true, drag = true, pinch = true, doubleClick = true, keyboard = true } = options;
  const wheelMode: boolean | OsmWheelMode = wheel === true ? 'cooperative' : wheel;
  const hintRef = React.useRef(onWheelHint);
  hintRef.current = onWheelHint;
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !enabled) return undefined;
    const doc = el.ownerDocument;
    const win = doc.defaultView;
    if (!win) return undefined;

    // one view change per frame
    let raf = 0;
    let pend = { factor: 1, at: null as null | { x: number; y: number }, dx: 0, dy: 0, src: 'drag' as 'wheel' | 'drag' | 'pinch' };
    const flush = () => {
      raf = 0;
      const p = pend;
      pend = { factor: 1, at: null, dx: 0, dy: 0, src: 'drag' };
      const vp = viewportRef.current;
      if (p.dx || p.dy) vp.panBy(p.dx, p.dy, p.src);
      if (p.factor !== 1) vp.zoomBy(p.factor, p.src, p.at ?? undefined);
    };
    const schedule = () => {
      if (!raf) raf = win.requestAnimationFrame(flush);
    };
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onOverlay = (t: EventTarget | null) => t instanceof win.Element && t !== el && Boolean(t.closest(OVERLAY_SELECTOR)) && el.contains(t);

    // cooperative wheel: engaged after a press inside the map or while focus is inside it
    let pressed = false;
    const engaged = () => pressed || el.contains(doc.activeElement);
    const onDocPointerDown = (e: PointerEvent) => {
      pressed = e.target instanceof win.Node && el.contains(e.target);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!(e.relatedTarget instanceof win.Node) || !el.contains(e.relatedTarget)) pressed = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (onOverlay(e.target)) return;
      const action = osmWheelAction(e, engaged(), wheelMode);
      if (action === 'none') return;
      if (action === 'hint') {
        hintRef.current?.();
        return; // the page scrolls
      }
      e.preventDefault();
      pend.factor *= osmWheelZoomFactor(e.deltaY, e.deltaMode, e.ctrlKey);
      pend.at = local(e);
      pend.src = e.ctrlKey ? 'pinch' : 'wheel';
      schedule();
    };

    const pointers = new Map<number, { x: number; y: number }>();
    let dragging = false;
    let start: { x: number; y: number } | null = null;
    let suppressClick = false;
    let pinchDist = 0;
    let pinchMid: { x: number; y: number } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (onOverlay(e.target) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 1) {
        start = local(e);
        dragging = false;
        suppressClick = false;
      } else if (pointers.size === 2 && pinch) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        dragging = true;
        suppressClick = true;
        try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = local(e);
      pointers.set(e.pointerId, cur);
      if (pointers.size >= 2 && pinch) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (pinchMid) {
          pend.dx += mid.x - pinchMid.x;
          pend.dy += mid.y - pinchMid.y;
        }
        if (pinchDist > 0 && dist > 0) pend.factor *= dist / pinchDist;
        pend.at = mid;
        pend.src = 'pinch';
        pinchDist = dist;
        pinchMid = mid;
        schedule();
        return;
      }
      if (!drag || !start) return;
      if (!dragging) {
        if (Math.hypot(cur.x - start.x, cur.y - start.y) < OSM_DRAG_THRESHOLD) return;
        dragging = true;
        suppressClick = true;
        el.setAttribute('data-osm-dragging', '');
        try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        pend.dx += cur.x - start.x;
        pend.dy += cur.y - start.y;
      } else {
        pend.dx += cur.x - prev.x;
        pend.dy += cur.y - prev.y;
      }
      pend.src = 'drag';
      schedule();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size === 1) {
        // pinch → one finger left: continue as a drag from here
        start = [...pointers.values()][0];
        pinchMid = null;
        pinchDist = 0;
      }
      if (pointers.size === 0) {
        dragging = false;
        start = null;
        pinchMid = null;
        el.removeAttribute('data-osm-dragging');
      }
    };
    // a drag that ends on a marker must not click it
    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    };
    const onDblClick = (e: MouseEvent) => {
      if (!doubleClick || onOverlay(e.target)) return;
      e.preventDefault();
      viewportRef.current.zoomBy(e.shiftKey ? 1 / 2 : 2, 'button', local(e));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!keyboard || e.target !== el || e.altKey || e.ctrlKey || e.metaKey) return;
      const a = osmKeyAction(e.key, e.shiftKey);
      if (!a) return;
      e.preventDefault();
      const vp = viewportRef.current;
      if (a.pan) vp.panBy(a.pan[0], a.pan[1], 'keyboard');
      if (a.zoom) vp.zoomBy(a.zoom, 'keyboard');
      if (a.reset) vp.reset('keyboard');
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    doc.addEventListener('pointerdown', onDocPointerDown, true);
    el.addEventListener('focusout', onFocusOut);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('dblclick', onDblClick);
    el.addEventListener('keydown', onKeyDown);
    return () => {
      if (raf) win.cancelAnimationFrame(raf);
      el.removeEventListener('wheel', onWheel);
      doc.removeEventListener('pointerdown', onDocPointerDown, true);
      el.removeEventListener('focusout', onFocusOut);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('dblclick', onDblClick);
      el.removeEventListener('keydown', onKeyDown);
      el.removeAttribute('data-osm-dragging');
    };
  }, [rootRef, viewportRef, enabled, wheelMode, drag, pinch, doubleClick, keyboard]);
}
