// Contrast helpers for the QR.Position grid: empty-slot borders must stay
// readable on every theme × mode. Colors are theme tokens (text / primary)
// mixed with alpha — never hardcoded hex.
import { alpha, type Theme } from '@mui/material/styles';

export function parseCssColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const s = String(input || '').trim();
  if (!s) return null;
  const hex = s.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i);
  if (rgb) {
    const a = rgb[4] == null ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: Number.isFinite(a) ? a : 1 };
  }
  return null;
}

function lin(v: number) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function lum(r: number, g: number, b: number) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast of `fg` (possibly transparent) composited over `bg`. */
export function contrastRatio(fg: string, bg: string): number {
  const F = parseCssColor(fg);
  const B = parseCssColor(bg);
  if (!F || !B) return 0;
  const a = Math.max(0, Math.min(1, F.a));
  const r = F.r * a + B.r * (1 - a);
  const g = F.g * a + B.g * (1 - a);
  const b = F.b * a + B.b * (1 - a);
  const L1 = lum(r, g, b);
  const L2 = lum(B.r, B.g, B.b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

export const SLOT_CONTRAST_MIN = 3;

export type PositionSlotChrome = {
  paper: string;
  border: string;
  fill: string;
  brandFill: string;
  brandBorder: string;
  brandInk: string;
};

/** Empty-slot border/fill and brand-cell chrome from the active theme. */
export function positionSlotChrome(theme: Theme): PositionSlotChrome {
  const paper = theme.palette.background.default || theme.palette.background.paper;
  const ink = theme.palette.text.primary;
  let border = ink;
  for (let a = 0.58; a <= 0.95; a += 0.04) {
    const c = alpha(ink, a);
    if (contrastRatio(c, paper) >= SLOT_CONTRAST_MIN) { border = c; break; }
  }
  if (contrastRatio(border, paper) < SLOT_CONTRAST_MIN) border = ink;
  const fill = alpha(ink, theme.palette.mode === 'dark' ? 0.14 : 0.08);
  const brandFill = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.18);
  return {
    paper,
    border,
    fill,
    brandFill,
    brandBorder: theme.palette.primary.main,
    brandInk: theme.palette.primary.main,
  };
}
