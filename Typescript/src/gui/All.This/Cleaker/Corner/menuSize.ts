// How the QR card may grow: it floats in the content area, which is the
// space between the bars at their live size. The viewport is only the
// fallback when there are no bars. One rule for open, drag, resize and
// bar expand/collapse: stay still while it fits; push only as much as
// needed when it no longer does; shrink and scroll if even that is not
// enough. A contracting bar must not pull the card back.
export const MENU_EDGE_PAD_PX = 12;
/** Horizontal padding reserved for the control column, mirrored on the left so the QR and icons stay centered. */
export const MENU_SIDE_GUTTER = '2.75rem';
/** Band, in px, over which the QR starts to yield as the card approaches a bar. Shift is exactly 0 outside this band. */
export const MENU_CONTACT_BAND = 8;
/**
 * Natural frequency of the critically-damped size spring (rad/s).
 * e^{-ωt}(1+ωt) drops below 1% around 300 ms (ω≈22).
 */
export const MENU_SPRING_OMEGA = 22;
/** Duration of the short mid-reversal tween, in ms. */
export const MENU_REVERSE_MS = 140;
/** Enable the keys when |W−W1| < 0.5 px and speed is below this, in px/s. */
export const MENU_READY_VEL = 30;

export type MenuBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  hasBars: boolean;
};

export type MenuPlacement = {
  left: number;
  top: number;
  w: number;
  h: number;
  qrShiftX: number;
  qrShiftY: number;
  qrX: number;
  capped: boolean;
};

export type Spring1D = { x: number; v: number };

/** Live side-bar / top-bar / footer selectors, so bounds can follow a CSS width animation. */
export const MENU_BAR_SELECTORS = {
  left: 'aside.LeftSidebar, [data-gui-node-id="GUI.window.layout.bars.left"]',
  right: 'aside.RightBar',
  top: '[data-gui-component="top"]',
  bottom: '[data-gui-component="footer"]',
} as const;

function cssInset(name: string): number {
  if (typeof window === 'undefined') return 0;
  const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Visible inset of a fixed bar, or 0 if that bar is missing or not on this edge. */
/** True when a click landed on a bar (the live walls of the content area). */
export function isMenuBoundsChrome(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Object.values(MENU_BAR_SELECTORS).some((sel) => !!target.closest(sel));
}

export function liveBarInset(side: 'left' | 'right' | 'top' | 'bottom'): number {
  if (typeof window === 'undefined') return 0;
  const el = document.querySelector(MENU_BAR_SELECTORS[side]);
  if (!(el instanceof HTMLElement)) return 0;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (side === 'left') return r.left < 8 && r.right > 0 ? r.right : 0;
  if (side === 'right') return r.right > vw - 8 && r.left < vw ? vw - r.left : 0;
  if (side === 'top') return r.top < 8 && r.bottom > 0 ? r.bottom : 0;
  return r.bottom > vh - 8 && r.top < vh ? vh - r.top : 0;
}

/** Content-area bounds: live bar boxes first, then --gui-inset-*, then the viewport pad if there are no bars. */
export function readMenuBounds(edgePad = MENU_EDGE_PAD_PX): MenuBounds {
  if (typeof window === 'undefined') {
    return { left: 0, top: 0, right: 0, bottom: 0, hasBars: false };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = liveBarInset('left') || cssInset('--gui-inset-left');
  const right = liveBarInset('right') || cssInset('--gui-inset-right');
  const top = liveBarInset('top') || cssInset('--gui-inset-top');
  const bottom = liveBarInset('bottom') || cssInset('--gui-inset-bottom');
  const hasBars = left + right + top + bottom > 0;
  if (!hasBars) {
    return { left: edgePad, top: edgePad, right: vw - edgePad, bottom: vh - edgePad, hasBars: false };
  }
  return { left, top, right: vw - right, bottom: vh - bottom, hasBars: true };
}

export function sameMenuBounds(a: MenuBounds, b: MenuBounds, eps = 0.5): boolean {
  return Math.abs(a.left - b.left) < eps
    && Math.abs(a.right - b.right) < eps
    && Math.abs(a.top - b.top) < eps
    && Math.abs(a.bottom - b.bottom) < eps;
}

/**
 * Perlin C2 smootherstep: 0→1, with S′=S″=0 at both ends.
 */
export function smootherstep(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** ∫₀ᵗ smootherstep(u) du. Equals 1/2 at t=1. */
export function smootherstepIntegral(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 0.5;
  const t2 = t * t;
  const t4 = t2 * t2;
  return t4 * t2 - 3 * t4 * t + 2.5 * t4;
}

/**
 * One-sided contact shift vs overflow `o` (`o = W/2 − (C − Xedge)`; remaining
 * room is −o when o < 0).
 *
 *  - s = 0 for o ≤ −d (more than `d` px of room)
 *  - C2 ramp for o ∈ [−d, d], with ds/do going 0→1 (so ds/dW goes 0→1/2)
 *  - s = o for o ≥ d (exact clamp, from `d` px past geometric contact)
 *
 * Joining the clamp at +d (not at 0) is what keeps s, s′ and s″ continuous.
 * At geometric contact (o = 0) the shift is 1.25 px when d = 8.
 */
export function contactShift(o: number, d = MENU_CONTACT_BAND): number {
  if (!(d > 0) || !Number.isFinite(o)) return Math.max(0, o);
  if (o <= -d) return 0;
  if (o >= d) return o;
  const t = (o + d) / (2 * d);
  return 2 * d * smootherstepIntegral(t);
}

/** Cubic Hermite from (x0, v0) to (x1, 0) at τ∈[0,1] over duration T seconds. */
export function hermiteToRest(x0: number, v0: number, x1: number, tau: number, T: number): Spring1D {
  const t = Math.max(0, Math.min(1, tau));
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const x = h00 * x0 + h10 * (T * v0) + h01 * x1;
  const d00 = 6 * t2 - 6 * t;
  const d10 = 3 * t2 - 4 * t + 1;
  const d01 = -6 * t2 + 6 * t;
  const dxdtau = d00 * x0 + d10 * (T * v0) + d01 * x1;
  const v = T > 0 ? dxdtau / T : 0;
  return { x, v };
}

/** Viewport bounds: used only when there are no bars. */
export function readViewportBounds(pad = MENU_EDGE_PAD_PX): MenuBounds {
  if (typeof window === 'undefined') {
    return { left: 0, top: 0, right: 0, bottom: 0, hasBars: false };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    left: pad,
    top: pad,
    right: Math.max(pad, vw - pad),
    bottom: Math.max(pad, vh - pad),
    hasBars: false,
  };
}

/** Hard clamp of a rect into `bounds` (used while dragging). Shrinks if needed. */
export function clampRectToBounds(
  r: { left: number; top: number; w: number; h: number },
  b: MenuBounds,
): { left: number; top: number; w: number; h: number } {
  const availW = Math.max(0, b.right - b.left);
  const availH = Math.max(0, b.bottom - b.top);
  const w = Math.min(Math.max(0, r.w), availW);
  const h = Math.min(Math.max(0, r.h), availH);
  let left = r.left;
  let top = r.top;
  if (left + w > b.right) left = b.right - w;
  if (top + h > b.bottom) top = b.bottom - h;
  if (left < b.left) left = b.left;
  if (top < b.top) top = b.top;
  return { left, top, w, h };
}

/**
 * Fit a preferred rect into `bounds`. Stays still while it already fits;
 * a C2 contact push moves it only as much as needed when it overflows;
 * if it still cannot fit, width/height shrink to the gap. A bound that
 * recedes (a bar contracting) does not pull the card back.
 */
export function fitMenuCard(opts: {
  left: number;
  top: number;
  w: number;
  h: number;
  bounds: MenuBounds;
  qrCenterX?: number;
  d?: number;
}): MenuPlacement {
  const { bounds, d = MENU_CONTACT_BAND } = opts;
  const Xmin = bounds.left;
  const Xmax = bounds.right;
  const Ymin = bounds.top;
  const Ymax = bounds.bottom;
  const availW = Math.max(0, Xmax - Xmin);
  const availH = Math.max(0, Ymax - Ymin);
  let w = opts.w;
  let h = opts.h;
  let capped = false;
  if (w > availW) { w = availW; capped = true; }
  if (h > availH) { h = availH; capped = true; }

  // Stay still on an axis while the current box still fits. Re-applying the
  // contact band every frame was walking a resting card toward the 8px margin.
  let left = opts.left;
  if (left < Xmin || left + w > Xmax) {
    left = opts.left + contactShift(Xmin - opts.left, d) - contactShift(opts.left + w - Xmax, d);
    if (left < Xmin) left = Xmin;
    if (left + w > Xmax) left = Xmax - w;
    if (left < Xmin) left = Xmin;
  }

  let top = opts.top;
  if (top < Ymin || top + h > Ymax) {
    top = opts.top + contactShift(Ymin - opts.top, d) - contactShift(opts.top + h - Ymax, d);
    if (top < Ymin) top = Ymin;
    if (top + h > Ymax) top = Ymax - h;
    if (top < Ymin) top = Ymin;
  }

  const gapFull = capped || availW - w < 1e-6;
  const xQr = gapFull ? (Xmin + Xmax) / 2 : left + w / 2;
  const C = opts.qrCenterX ?? xQr;
  return {
    left,
    top,
    w,
    h,
    qrX: xQr,
    qrShiftX: xQr - C,
    qrShiftY: top - opts.top,
    capped,
  };
}

/** Size-change placement: expand around the QR, then apply `fitMenuCard`. */
export function placeMenuCard(opts: {
  w: number;
  h: number;
  qrCenterX: number;
  cardTop0: number;
  bounds: MenuBounds;
  d?: number;
}): MenuPlacement {
  const { qrCenterX: C, cardTop0: T0, bounds, d } = opts;
  // Grow downward from the resting top. If the tree is taller than the
  // remaining room, clamp height so the QR does not travel; the tree scrolls.
  const room = Math.max(0, bounds.bottom - Math.max(T0, bounds.top));
  const h = Math.min(opts.h, room);
  return fitMenuCard({ left: C - opts.w / 2, top: T0, w: opts.w, h, bounds, qrCenterX: C, d });
}

/**
 * Integrate a critically damped spring (ζ = 1) over `dt` seconds toward
 * `target`, keeping the current value and velocity (so a mid-flight retarget
 * is velocity-continuous).
 */
export function stepCriticalSpring(
  state: Spring1D,
  target: number,
  dt: number,
  omega = MENU_SPRING_OMEGA,
): Spring1D {
  if (!(dt > 0) || !(omega > 0)) return state;
  const y0 = state.x - target;
  const v0 = state.v;
  const e = Math.exp(-omega * dt);
  const B = v0 + omega * y0;
  const y = (y0 + B * dt) * e;
  const v = (v0 - omega * B * dt) * e;
  if (Math.abs(y) < 0.05 && Math.abs(v) < 0.5) return { x: target, v: 0 };
  return { x: y + target, v };
}

export function springSettled(state: Spring1D, target: number, posEps = 0.5, velEps = 8): boolean {
  return Math.abs(state.x - target) < posEps && Math.abs(state.v) < velEps;
}

/** Cubic-bezier unit easing (CSS timing-function). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = X(t) - x;
      const d = dX(t);
      if (Math.abs(err) < 1e-6 || Math.abs(d) < 1e-6) break;
      t = Math.max(0, Math.min(1, t - err / d));
    }
    return Y(t);
  };
}

/** Open: M3 emphasized (0.2, 0, 0, 1). Close: ease-in-out (0.4, 0, 0.2, 1). */
export const easeMenuOpen = cubicBezier(0.2, 0, 0, 1);
export const easeMenuClose = cubicBezier(0.4, 0, 0.2, 1);

/** Intrinsic size of the menu body (plus the paper's border), hiding a leaving keys branch so close can target the home size. */
export function measureMenuBody(body: HTMLElement, paper: HTMLElement): { w: number; h: number } {
  const leaving = body.querySelector('[data-keys-phase="leave"]') as HTMLElement | null;
  const prev = leaving?.style.display;
  if (leaving) leaving.style.display = 'none';
  const r = body.getBoundingClientRect();
  const cs = getComputedStyle(paper);
  const bx = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
  const by = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
  const w = Math.ceil(r.width + bx);
  const h = Math.ceil(r.height + by);
  if (leaving) leaving.style.display = prev ?? '';
  return { w, h };
}

/**
 * Measure the body's unconstrained size in an offscreen clone, so the live
 * paper's current width cannot shrink the reading. Leaving keys branches are
 * hidden only on the clone, so close targets the home size.
 */
export function measureMenuClone(body: HTMLElement, paper: HTMLElement, maxWidth: number): { w: number; h: number } {
  const cs = getComputedStyle(paper);
  const bx = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
  const by = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
  const cap = Math.max(0, maxWidth);
  const host = document.createElement('div');
  host.setAttribute('data-qr-menu-measure', '');
  host.style.cssText = [
    'position:absolute',
    'left:-12400px',
    'top:0',
    `width:${cap}px`,
    'pointer-events:none',
    'visibility:hidden',
    'z-index:-1',
  ].join(';');
  host.style.font = cs.font;
  const clone = body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-keys-phase="leave"]').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });
  clone.style.width = 'max-content';
  clone.style.maxWidth = `${cap}px`;
  clone.style.height = 'auto';
  clone.style.position = 'static';
  clone.style.transform = 'none';
  clone.style.overflow = 'visible';
  const contentMax = paper.style.getPropertyValue('--qr-menu-content-max')
    || getComputedStyle(paper).getPropertyValue('--qr-menu-content-max')
    || `${Math.max(0, cap - bx)}px`;
  clone.style.setProperty('--qr-menu-max-width', `${cap}px`);
  clone.style.setProperty('--qr-menu-content-max', contentMax.trim() || `${cap}px`);
  host.appendChild(clone);
  document.body.appendChild(host);
  const r = clone.getBoundingClientRect();
  // Width 100% children (the tree, the login column) do not expand a
  // max-content clone, so the action row can overflow and get clipped
  // unless we count it. Air covers dock scale (~0.48 of a node) and the
  // 2px+1px focus ring, measured from visible contours, in theme rem.
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const air = 0.5 * rem;
  const csBody = getComputedStyle(clone);
  const pad = (parseFloat(csBody.paddingLeft) || 0) + (parseFloat(csBody.paddingRight) || 0);
  let inner = 0;
  // Rows are width:100% inside the card, so they do not stretch a max-content
  // clone. Measure each row as nowrap/max-content: the card grows with the
  // icons up to `cap` (the room between the bars). An icon wraps only when
  // it cannot fit whole in that room.
  const chromeOf = (node: HTMLElement) => {
    let extra = 0;
    for (let el = node.parentElement; el && el !== clone; el = el.parentElement) {
      const cs = getComputedStyle(el);
      extra += (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
        + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0)
        + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
    }
    return extra;
  };
  const measureRow = (node: HTMLElement, addChrome: boolean) => {
    const prevW = node.style.width;
    const prevMax = node.style.maxWidth;
    const prevWrap = node.style.flexWrap;
    node.style.width = 'max-content';
    node.style.maxWidth = 'none';
    node.style.flexWrap = 'nowrap';
    const er = node.getBoundingClientRect();
    const raw = Math.max(er.width, node.scrollWidth);
    inner = Math.max(inner, raw + (addChrome ? chromeOf(node) : 0));
    node.style.width = prevW;
    node.style.maxWidth = prevMax;
    node.style.flexWrap = prevWrap;
  };
  const rowSels = ['[data-identity-actions]', '[data-qr-anchor]', '[data-keys-row]'];
  for (const sel of rowSels) {
    clone.querySelectorAll(sel).forEach((el) => {
      const node = el as HTMLElement;
      const treeRow = node.hasAttribute('data-keys-row') || node.hasAttribute('data-tree-row');
      measureRow(node, treeRow);
    });
  }
  // Icon rows in scroll mode only have data-tree-row. Skip any row that
  // contains the leaf form: nowrap would put the form beside the icons
  // and inflate the card far past the row width.
  clone.querySelectorAll('[data-tree-row]').forEach((el) => {
    const node = el as HTMLElement;
    if (node.querySelector('[data-branch-editor], [data-tree-editor]')) return;
    if (node.closest('[data-branch-editor], [data-tree-editor]')) return;
    measureRow(node, true);
  });
  const editor = clone.querySelector('[data-branch-editor]') as HTMLElement | null;
  if (editor) {
    const er = editor.getBoundingClientRect();
    inner = Math.max(inner, Math.max(er.width, editor.scrollWidth) + chromeOf(editor));
  }
  const fromBody = r.width + bx;
  const fromRows = inner > 0 ? inner + pad + bx : 0;
  // The measure host is as wide as the bounds, so width:100% children
  // (the editor host, the tree) can fill it and make r.width near cap
  // once a form is open. The card follows the rows, or the form if it
  // is genuinely wider (max 32rem under its node).
  const inflated = !!editor && fromBody > fromRows + 1;
  const filledHost = cap > 0 && fromBody >= cap - 1;
  const w = Math.min(cap, Math.ceil(Math.max(fromRows, (inflated || filledHost) ? 0 : fromBody)));
  // Remeasure height at the chosen width so rows that now fit on one line
  // do not keep the tall, narrow-clone height.
  const innerW = Math.max(0, w - bx);
  clone.style.width = `${innerW}px`;
  clone.style.maxWidth = `${innerW}px`;
  const r2 = clone.getBoundingClientRect();
  host.remove();
  const h = Math.ceil(r2.height + by);
  if (!(w > 0) || !(h > 0)) return measureMenuBody(body, paper);
  return { w, h };
}

/**
 * Maximum width in px the menu paper may take: the content area between the
 * bars (or the viewport when there are none). `capPx` is an optional extra cap.
 */
export function availableMenuWidth(panel: HTMLElement | null, capPx?: number, edgePad = MENU_EDGE_PAD_PX): number {
  if (typeof window === 'undefined') return capPx && capPx > 0 ? capPx : 360;
  const b = readMenuBounds(edgePad);
  let available = Math.max(0, b.right - b.left);
  if (capPx && capPx > 0) available = Math.min(available, capPx);
  return available;
}

/**
 * Content-box width the tree / theme row may grow into (the card's max
 * minus the menu body's padding), not the card's current shrink-wrapped width.
 */
export function availableMenuContentWidth(panel: HTMLElement | null, capPx?: number, fallbackEl?: HTMLElement | null): number {
  if (panel) {
    const raw = panel.style.getPropertyValue('--qr-menu-content-max')
      || getComputedStyle(panel).getPropertyValue('--qr-menu-content-max');
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) return n;
    const max = availableMenuWidth(panel, capPx);
    const inner = panel.querySelector('[data-cleaker-panel-body]') as HTMLElement | null;
    const box = inner ?? panel;
    const boxCs = getComputedStyle(box);
    const pad = (parseFloat(boxCs.paddingLeft) || 0) + (parseFloat(boxCs.paddingRight) || 0);
    return Math.max(0, max - pad);
  }
  // Outside the QR card (stories, other surfaces): wrap to the container we
  // already have, not the viewport, so a 360-wide collection still paginates.
  const el = fallbackEl;
  return (el?.getBoundingClientRect().width || capPx || 0);
}
