// Pure logic for OverlaySwatch (no React) — ported 1:1 from suign.github.io's
// `.overlay-swatch` script: HUE_PER_PX / OPACITY_PER_PX drag math, HSL with
// saturation/lightness fixed to the default color's own values.
import { decomposeColor } from '@mui/material/styles';

export const HUE_PER_PX = 1; // degrees per px dragged horizontally
export const OPACITY_PER_PX = 0.6; // percent per px dragged vertically
export const DEFAULT_OPACITY = 89;
export const DEFAULT_STORAGE_KEY = 'this.gui:overlay-hsl';

export type Hsl = { h: number; s: number; l: number };
export type OverlayState = Hsl & { a: number };
/** What is persisted per theme key — only what the user drags. */
export type SavedSwatch = { h: number; a: number };
export type SavedSwatchMap = Record<string, SavedSwatch>;

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** Any CSS color MUI understands (hex, rgb(a), hsl(a)) → HSL. */
export function colorToHsl(color: string): Hsl {
  try {
    const c = decomposeColor(color);
    if (c.type === 'hsl' || c.type === 'hsla') {
      return { h: c.values[0], s: c.values[1], l: c.values[2] };
    }
    if (c.type === 'rgb' || c.type === 'rgba') {
      return rgbToHsl(c.values[0], c.values[1], c.values[2]);
    }
  } catch { /* fall through */ }
  return rgbToHsl(115, 173, 156); // suign.github.io original default
}

/** One drag step from the gesture origin. */
export function dragTo(start: { h: number; a: number }, dx: number, dy: number) {
  return {
    h: (((start.h + dx * HUE_PER_PX) % 360) + 360) % 360,
    a: Math.max(0, Math.min(100, start.a - dy * OPACITY_PER_PX)),
  };
}

export function hslString({ h, s, l }: Hsl, a?: number) {
  const hs = `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
  return a === undefined ? `hsl(${hs})` : `hsl(${hs} / ${a}%)`;
}

/** Theme default wins unless the user has dragged under THIS theme key. */
export function resolveState(themeColor: string, defaultOpacity: number, saved?: SavedSwatch | null): OverlayState {
  const base = colorToHsl(themeColor);
  return {
    ...base,
    h: saved && typeof saved.h === 'number' ? saved.h : base.h,
    a: saved && typeof saved.a === 'number' ? saved.a : defaultOpacity,
  };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
function store(): StorageLike | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
export function readSaved(storageKey: string, themeKey: string, s: StorageLike | null = store()): SavedSwatch | null {
  try {
    const map = JSON.parse(s?.getItem(storageKey) || 'null') as SavedSwatchMap | null;
    return (map && map[themeKey]) || null;
  } catch { return null; }
}
export function writeSaved(storageKey: string, themeKey: string, value: SavedSwatch | null, s: StorageLike | null = store()) {
  if (!s) return;
  try {
    const map = (JSON.parse(s.getItem(storageKey) || 'null') as SavedSwatchMap | null) || {};
    if (value) map[themeKey] = value; else delete map[themeKey];
    s.setItem(storageKey, JSON.stringify(map));
  } catch { /* ignore */ }
}
