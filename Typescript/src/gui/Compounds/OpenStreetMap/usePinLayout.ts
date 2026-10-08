/*
 * GUI.OpenStreetMap — computes the screen-space pin layout (edge pins + labels)
 * for the selected markers, once per view / selection / overlay change.
 */
import * as React from 'react';
import { markerExtent } from './OpenStreetMapMarker';
import type { OsmTransform } from './projection';
import type { OsmMarkerInfo } from './selection';
import {
  OSM_LABEL_LINE,
  OSM_META_LINE,
  OSM_DOT_RADIUS,
  OSM_PIN_ARROW,
  osmEdgePin,
  osmLabelPriority,
  placeOsmLabels,
  type OsmLabelItem,
  type OsmLabelPlacement,
  type OsmRect,
} from './pinLayout';


export type OsmPinLayoutEntry = {
  /** Drawn pin centre, container CSS px. */
  x: number;
  y: number;
  clamped: boolean;
  reason?: 'off-view' | 'occluded';
  angle?: number;
  label: OsmLabelPlacement | null;
  /** CSS px per marker unit. */
  k: number;
};

let measureCtx: CanvasRenderingContext2D | null | undefined;
const widthCache = new Map<string, number>();

/** Text width in CSS px (canvas measureText on the client; ~0.58 em per character otherwise). */
export function measureOsmText(text: string, fontPx: number, weight: number | string = 400, family = 'system-ui, sans-serif'): number {
  if (!text) return 0;
  const key = `${weight}|${fontPx}|${family}|${text}`;
  const hit = widthCache.get(key);
  if (hit !== undefined) return hit;
  if (measureCtx === undefined) {
    try {
      measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    } catch {
      measureCtx = null;
    }
  }
  let w: number;
  if (measureCtx) {
    measureCtx.font = `${weight} ${fontPx}px ${family}`;
    w = measureCtx.measureText(text).width;
  } else {
    w = text.length * fontPx * 0.58;
  }
  if (widthCache.size > 2000) widthCache.clear();
  widthCache.set(key, w);
  return w;
}

/** Label box (marker units) of a marker: width of the longer line, 1 or 2 lines tall. */
export function osmLabelBox(info: Pick<OsmMarkerInfo, 'label' | 'meta' | 'state'>, family?: string): { w: number; h: number } {
  const wl = measureOsmText(info.label ?? '', 10, info.state === 'highlight' ? 600 : 400, family);
  const wm = measureOsmText(info.meta ?? '', 9, 400, family);
  const w = Math.max(wl, wm);
  if (!w) return { w: 0, h: 0 };
  // + 3: the 3-unit halo stroke around the glyphs
  return { w: w + 3, h: (info.meta ? OSM_LABEL_LINE + OSM_META_LINE : OSM_LABEL_LINE) + 2 };
}

export function computeOsmPinLayout(args: {
  markers: OsmMarkerInfo[];
  selected: string[];
  transform: OsmTransform;
  obstacles: OsmRect[];
  focusId: string | null;
  fontFamily?: string;
}): Map<string, OsmPinLayoutEntry> {
  const { markers, selected, transform, obstacles, focusId, fontFamily } = args;
  const out = new Map<string, OsmPinLayoutEntry>();
  const v = transform.view;
  if (!(v.width > 0 && v.height > 0 && v.scale > 0)) return out;
  const k = v.scale * (v.markerScale ?? 1);
  const byId = new Map(markers.map((m) => [m.id, m]));
  const present = selected.filter((id) => byId.has(id));
  // pins are placed in selection priority only: hover / focus must not move a pin
  // (it would jump away from the pointer); it only re-prioritises labels
  const pinOrder = osmLabelPriority(present, null);
  const order = osmLabelPriority(present, focusId);
  const bounds: OsmRect = { x: 0, y: 0, w: v.width, h: v.height };
  const A = (OSM_PIN_ARROW + 2) * k + 1; // arrow (2 + 8 marker units past the box edge) + halo
  const halfOf = (m: OsmMarkerInfo) => {
    const e = markerExtent(m.shape, m.size, m.width, m.height);
    return { w: e.halfW * k, h: e.halfH * k };
  };
  // pass 1: pins that can stay where they are; pass 2: edge / occluded pins, in priority order
  const fixed: OsmRect[] = [];
  const pending: OsmMarkerInfo[] = [];
  for (const id of pinOrder) {
    const m = byId.get(id)!;
    const p = transform.toScreen(m.lat, m.lon);
    const h = halfOf(m);
    const e = osmEdgePin(p, bounds, { w: h.w + A, h: h.h + A }, obstacles);
    if (e.clamped) pending.push(m);
    else {
      out.set(id, { x: p.x, y: p.y, clamped: false, label: null, k });
      fixed.push({ x: p.x - h.w, y: p.y - h.h, w: 2 * h.w, h: 2 * h.h });
    }
  }
  const taken = [...obstacles, ...fixed];
  for (const m of pending) {
    const p = transform.toScreen(m.lat, m.lon);
    const h = halfOf(m);
    const e = osmEdgePin(p, bounds, { w: h.w + A, h: h.h + A }, taken);
    out.set(m.id, { x: e.x, y: e.y, clamped: e.clamped, reason: e.reason, angle: e.angle, label: null, k });
    taken.push({ x: e.x - h.w - A, y: e.y - h.h - A, w: 2 * (h.w + A), h: 2 * (h.h + A) });
  }
  // labels
  const cx = v.width / 2;
  const cy = v.height / 2;
  const items: OsmLabelItem[] = [];
  // edge-pin arrows block labels (their own label included, so it goes inward)
  const arrows: OsmRect[] = [];
  for (const [id, ent] of out) {
    if (!ent.clamped || ent.angle === undefined) continue;
    const h = halfOf(byId.get(id)!);
    const ca = Math.abs(Math.cos(ent.angle));
    const sa = Math.abs(Math.sin(ent.angle));
    const d = Math.min(ca > 1e-6 ? h.w / ca : Infinity, sa > 1e-6 ? h.h / sa : Infinity) + (2 + OSM_PIN_ARROW / 2) * k;
    const s = (OSM_PIN_ARROW / 2 + 1) * k;
    arrows.push({ x: ent.x + Math.cos(ent.angle) * d - s, y: ent.y + Math.sin(ent.angle) * d - s, w: 2 * s, h: 2 * s });
  }
  // unselected dots in view block labels too (a label must not hide a pin)
  const sel = new Set(present);
  const dotR = OSM_DOT_RADIUS + 1.5;
  for (const m of markers) {
    if (sel.has(m.id)) continue;
    const p = transform.toScreen(m.lat, m.lon);
    if (p.x < -dotR || p.y < -dotR || p.x > v.width + dotR || p.y > v.height + dotR) continue;
    arrows.push({ x: p.x - dotR, y: p.y - dotR, w: 2 * dotR, h: 2 * dotR });
  }
  for (const id of order) {
    const m = byId.get(id)!;
    const box = osmLabelBox(m, fontFamily);
    if (!box.w) continue;
    const ent = out.get(id)!;
    const h = halfOf(m);
    let inward;
    if (ent.clamped) {
      const len = Math.hypot(cx - ent.x, cy - ent.y) || 1;
      inward = { x: (cx - ent.x) / len, y: (cy - ent.y) / len };
    }
    items.push({
      id,
      pin: { x: ent.x, y: ent.y },
      half: { w: h.w, h: h.h },
      w: box.w * k,
      h: box.h * k,
      gap: (m.labelOffset ?? 5) * k,
      inward,
      prefer: m.labelPlacement,
    });
  }
  const labels = placeOsmLabels(items, bounds, [...obstacles, ...arrows]);
  for (const [id, pl] of labels) out.get(id)!.label = pl;
  return out;
}

export function useOsmPinLayout(enabled: boolean, args: Parameters<typeof computeOsmPinLayout>[0]): Map<string, OsmPinLayoutEntry> | null {
  const { markers, selected, transform, obstacles, focusId, fontFamily } = args;
  return React.useMemo(
    () => (enabled ? computeOsmPinLayout({ markers, selected, transform, obstacles, focusId, fontFamily }) : null),
    [enabled, markers, selected, transform, obstacles, focusId, fontFamily],
  );
}
