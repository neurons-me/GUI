/*
 * GUI.OpenStreetMap — screen-space layout of selected pins (S5b.2, plan §4a).
 * Pure functions, container CSS px:
 *   osmEdgePin       a selected pin that is off view, or whose box would sit under
 *                    an overlay (legend, chips, controls, list, attribution), moves
 *                    to the nearest free spot on the ray from the view centre to its
 *                    true position (clamped to the inset viewport) and gets an
 *                    arrow pointing at that position.
 *   placeOsmLabels   greedy label placement in priority order: 8 slots around the
 *                    pin (right, left, above, below, then diagonals; edge pins
 *                    prefer the slots facing inward), else pushed out up to 24 px
 *                    with a leader line, else collapsed (hover / focus / list /
 *                    accessible name keep it).
 */

/** Arrow length beside an edge pin, in marker units. */
export const OSM_PIN_ARROW = 8;
/** Unselected pin dot radius (CSS px, constant on screen; + 1.5 px halo). */
export const OSM_DOT_RADIUS = 3.5;
/** Label / meta line heights, in marker units (fontSize 10 / 9 as the marker draws them). */
export const OSM_LABEL_LINE = 12;
export const OSM_META_LINE = 10;

export type OsmRect = { x: number; y: number; w: number; h: number };
export type OsmXY = { x: number; y: number };

export const OSM_LABEL_SLOTS = ['right', 'left', 'top', 'bottom', 'top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;
export type OsmLabelSlot = (typeof OSM_LABEL_SLOTS)[number];
export const OSM_LABEL_PUSH = [6, 12, 18, 24];

const SLOT_DIR: Record<OsmLabelSlot, OsmXY> = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  'top-right': { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
  'top-left': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  'bottom-right': { x: Math.SQRT1_2, y: Math.SQRT1_2 },
  'bottom-left': { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
};

export const rectsOverlap = (a: OsmRect, b: OsmRect, pad = 0) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
const inside = (a: OsmRect, bounds: OsmRect) => a.x >= bounds.x && a.y >= bounds.y && a.x + a.w <= bounds.x + bounds.w && a.y + a.h <= bounds.y + bounds.h;
const boxAt = (c: OsmXY, hw: number, hh: number): OsmRect => ({ x: c.x - hw, y: c.y - hh, w: 2 * hw, h: 2 * hh });

export type OsmEdgePin = {
  x: number;
  y: number;
  /** false: the pin sits at its true position. */
  clamped: boolean;
  /** Why it moved: off the view, or its box would sit under an overlay. */
  reason?: 'off-view' | 'occluded';
  /** Arrow direction (radians, screen axes) from the drawn pin toward the true position. */
  angle?: number;
};

/**
 * Where to draw a selected pin. `p` true position, `bounds` the map viewport,
 * `half` the pin's half extent (incl. its arrow), `inset` gap kept from the edge.
 */
export function osmEdgePin(
  p: OsmXY,
  bounds: OsmRect,
  half: { w: number; h: number },
  obstacles: OsmRect[] = [],
  inset = 4,
): OsmEdgePin {
  const visible = p.x >= bounds.x && p.x <= bounds.x + bounds.w && p.y >= bounds.y && p.y <= bounds.y + bounds.h;
  const hits = (q: OsmXY) => obstacles.some((o) => rectsOverlap(boxAt(q, half.w, half.h), o));
  if (visible && !hits(p)) return { x: p.x, y: p.y, clamped: false };
  const c = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
  const inner = { l: bounds.x + half.w + inset, r: bounds.x + bounds.w - half.w - inset, t: bounds.y + half.h + inset, b: bounds.y + bounds.h - half.h - inset };
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  let e: OsmXY;
  if (!visible || p.x < inner.l || p.x > inner.r || p.y < inner.t || p.y > inner.b) {
    // first point of the ray centre → p inside the inner rect
    let t = 1;
    if (dx > 0) t = Math.min(t, (inner.r - c.x) / dx);
    if (dx < 0) t = Math.min(t, (inner.l - c.x) / dx);
    if (dy > 0) t = Math.min(t, (inner.b - c.y) / dy);
    if (dy < 0) t = Math.min(t, (inner.t - c.y) / dy);
    t = Math.max(0, t);
    e = { x: c.x + dx * t, y: c.y + dy * t };
  } else {
    e = { x: p.x, y: p.y };
  }
  // walk inward along the ray until the pin box is clear of overlays
  const e0 = e;
  const len = Math.hypot(e.x - c.x, e.y - c.y);
  if (len > 0) {
    const ux = (c.x - e.x) / len;
    const uy = (c.y - e.y) / len;
    for (let s = 0; s <= len && hits(e); s += 3) e = { x: e.x + ux * 3, y: e.y + uy * 3 };
  }
  // the whole ray is covered (small map, big overlays): nearest clear spot to where the ray met the edge
  if (hits(e) && inner.r >= inner.l && inner.b >= inner.t) {
    let best: OsmXY | null = null;
    let bestD = Infinity;
    const step = 6;
    for (let y = inner.t; y <= inner.b + 0.01; y += step) {
      for (let x = inner.l; x <= inner.r + 0.01; x += step) {
        const d = (x - e0.x) ** 2 + (y - e0.y) ** 2;
        if (d < bestD && !hits({ x, y })) { best = { x, y }; bestD = d; }
      }
    }
    if (best) e = best;
  }
  const angle = Math.atan2(p.y - e.y, p.x - e.x);
  return { x: e.x, y: e.y, clamped: true, reason: visible ? 'occluded' : 'off-view', angle };
}

export type OsmLabelItem = {
  id: string;
  /** Pin centre (where it is drawn) and half extent, CSS px. */
  pin: OsmXY;
  half: { w: number; h: number };
  /** Label box size, CSS px. */
  w: number;
  h: number;
  gap: number;
  /** For edge pins: unit vector toward the view centre; slots facing it go first. */
  inward?: OsmXY;
  /** Preferred first slot (the marker's labelPlacement). */
  prefer?: OsmLabelSlot;
};

export type OsmLabelPlacement =
  | { kind: 'slot'; slot: OsmLabelSlot; box: OsmRect }
  | { kind: 'leader'; slot: OsmLabelSlot; box: OsmRect; from: OsmXY; to: OsmXY }
  | { kind: 'collapsed' };

/** Label box for a slot (plus an extra push along the slot direction). */
export function osmSlotBox(item: Pick<OsmLabelItem, 'pin' | 'half' | 'w' | 'h' | 'gap'>, slot: OsmLabelSlot, push = 0): OsmRect {
  const { pin: p, half, w, h, gap } = item;
  const d = SLOT_DIR[slot];
  let x: number;
  let y: number;
  switch (slot) {
    case 'right': x = p.x + half.w + gap; y = p.y - h / 2; break;
    case 'left': x = p.x - half.w - gap - w; y = p.y - h / 2; break;
    case 'top': x = p.x - w / 2; y = p.y - half.h - gap - h; break;
    case 'bottom': x = p.x - w / 2; y = p.y + half.h + gap; break;
    case 'top-right': x = p.x + half.w + gap / 2; y = p.y - half.h - gap / 2 - h; break;
    case 'top-left': x = p.x - half.w - gap / 2 - w; y = p.y - half.h - gap / 2 - h; break;
    case 'bottom-right': x = p.x + half.w + gap / 2; y = p.y + half.h + gap / 2; break;
    default: x = p.x - half.w - gap / 2 - w; y = p.y + half.h + gap / 2; break;
  }
  return { x: x + d.x * push, y: y + d.y * push, w, h };
}

/** Slot order for an item: preferred slot, then the fixed order (edge pins: inward-facing first). */
export function osmSlotOrder(item: Pick<OsmLabelItem, 'inward' | 'prefer'>): OsmLabelSlot[] {
  let order = [...OSM_LABEL_SLOTS];
  if (item.inward) {
    const iv = item.inward;
    order = order
      .map((s, i) => ({ s, i, score: SLOT_DIR[s].x * iv.x + SLOT_DIR[s].y * iv.y }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((o) => o.s);
  } else if (item.prefer) {
    order = [item.prefer, ...order.filter((s) => s !== item.prefer)];
  }
  return order;
}

function nearestPoint(box: OsmRect, p: OsmXY): OsmXY {
  return { x: Math.min(Math.max(p.x, box.x), box.x + box.w), y: Math.min(Math.max(p.y, box.y), box.y + box.h) };
}

/**
 * Greedy placement. `items` must already be in priority order (focused /
 * hovered, then most recently selected, then the rest). Blocked by: the
 * viewport edge, overlays, every pin box (except the item's own), and labels
 * placed before it.
 */
export function placeOsmLabels(
  items: OsmLabelItem[],
  bounds: OsmRect,
  obstacles: OsmRect[] = [],
  margin = 2,
): Map<string, OsmLabelPlacement> {
  const out = new Map<string, OsmLabelPlacement>();
  const placed: OsmRect[] = [];
  const pins = items.map((it) => ({ id: it.id, box: boxAt(it.pin, it.half.w, it.half.h) }));
  const area = { x: bounds.x + margin, y: bounds.y + margin, w: bounds.w - 2 * margin, h: bounds.h - 2 * margin };
  for (const it of items) {
    const free = (b: OsmRect) =>
      inside(b, area) &&
      !obstacles.some((o) => rectsOverlap(b, o)) &&
      !placed.some((o) => rectsOverlap(b, o, 1)) &&
      !pins.some((pp) => pp.id !== it.id && rectsOverlap(b, pp.box, 1));
    const order = osmSlotOrder(it);
    let result: OsmLabelPlacement | null = null;
    for (const slot of order) {
      const box = osmSlotBox(it, slot);
      if (free(box)) { result = { kind: 'slot', slot, box }; break; }
    }
    if (!result) {
      outer: for (const push of OSM_LABEL_PUSH) {
        for (const slot of order) {
          const box = osmSlotBox(it, slot, push);
          if (free(box)) {
            const d = SLOT_DIR[slot];
            const from = { x: it.pin.x + d.x * it.half.w, y: it.pin.y + d.y * it.half.h };
            result = { kind: 'leader', slot, box, from, to: nearestPoint(box, from) };
            break outer;
          }
        }
      }
    }
    if (!result) result = { kind: 'collapsed' };
    if (result.kind !== 'collapsed') placed.push(result.box);
    out.set(it.id, result);
  }
  return out;
}

/** Label priority: focused / hovered first, then most recently selected, then the rest in selection order. */
export function osmLabelPriority(selectionOrder: string[], focusId: string | null): string[] {
  const recent = [...selectionOrder].reverse();
  return focusId && recent.includes(focusId) ? [focusId, ...recent.filter((id) => id !== focusId)] : recent;
}

/** What activating (click / Enter / Space) a pin does: an edge pin pans to its spot, others toggle. */
export function osmPinActivation(entry: { clamped: boolean } | undefined): 'pan' | 'toggle' {
  return entry?.clamped ? 'pan' : 'toggle';
}
