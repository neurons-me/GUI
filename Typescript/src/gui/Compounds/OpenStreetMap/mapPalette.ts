/*
 * GUI.OpenStreetMap — map palette derived from the active GUI theme.
 *
 * Every colour comes from the theme tokens GUI already maps into the MUI
 * palette (background, text, divider-free semantic colours). There are no
 * map-specific tokens: the 8 catalog themes need no manifest changes.
 *
 *   land          background.default
 *   water         mix(land → info.main)            line 45 % (light 60 %), area 18 % (light 26 %);
 *                 a line under 2.25:1 on land (most light modes, CherryByte dark) is pushed
 *                 further toward info.main (then text.primary) until it reaches 2.25:1, and
 *                 the area becomes 35 % (light) / 40 % (dark) of that line: subtle, same hue
 *   roads         mix(land → text.primary)         primary 42 %, secondary 32 %, tertiary 24 %, minor 15 %
 *   places        mix(land → text.secondary) 50 %
 *   label / meta  text.primary / text.secondary    (≥ 4.5:1 on land, nudged toward text.primary if needed)
 *   halo          land
 *   tones         primary / secondary / info / success / warning / error / text.secondary (neutral)
 *                 (≥ 3:1 on land, WCAG 1.4.11 non-text contrast, nudged toward text.primary if needed)
 *   domain tones  port → primary, ship → info, train → warning, yard → success, queue → neutral;
 *                 when two would look alike (ΔE76 < 15, e.g. a theme whose primary = info),
 *                 the later one takes its next candidate (secondary, …) or, failing that,
 *                 a darker/lighter variant of its own colour
 *   accent        theme.custom.accent (the manifest's `color.accent`) replaces primary for the
 *                 primary / port / highlight roles when primary is under 3:1 on land and the
 *                 accent contrasts better (PrinceOfDarkness dark, Seafoam dark)
 *   states        busy = warning, done = success, highlight = primary (+ glow)
 *   attribution   background.paper @ 85 % / text.secondary
 *   overlay       legend / chip surfaces: background.paper @ 90 %, border = divider (or a
 *                 text.primary mix when the divider is too faint), text / muted = text.secondary
 *                 and strong = text.primary (≥ 4.5:1 on the surface), accent = primary tone,
 *                 adapter = warning tone (≥ 3:1 on the surface, for borders and badges)
 *
 * Colours are flattened to opaque rgb over the land, so layer opacity never
 * stacks and the same values work in SVG, CSS variables and canvas.
 */
import { decomposeColor, getContrastRatio, useTheme, type Theme } from '@mui/material/styles';
import * as React from 'react';

export type OsmBaseTone = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
/** Domain aliases used by port / logistics maps; each maps to a base tone. */
export type OsmDomainTone = 'port' | 'ship' | 'train' | 'yard' | 'queue';
export type OsmMarkerTone = OsmBaseTone | OsmDomainTone;
export type OsmMarkerState = 'default' | 'highlight' | 'busy' | 'done' | 'dimmed';

export const OSM_DOMAIN_TONES: Record<OsmDomainTone, OsmBaseTone> = {
  port: 'primary',
  ship: 'info',
  train: 'warning',
  yard: 'success',
  queue: 'neutral',
};

export type OsmLayerKind =
  | 'land'
  | 'water'
  | 'water-area'
  | 'road-primary'
  | 'road-secondary'
  | 'road-tertiary'
  | 'road-minor'
  | 'place'
  | 'custom';

export type OsmPalette = {
  mode: 'light' | 'dark';
  land: string;
  water: string;
  waterArea: string;
  road: { primary: string; secondary: string; tertiary: string; minor: string };
  place: string;
  label: string;
  meta: string;
  halo: string;
  tones: Record<OsmBaseTone, string>;
  /** The theme accent when it took over the primary role, else null. */
  accent: string | null;
  /** Domain aliases resolved to distinct colours for this theme. */
  domain: Record<OsmDomainTone, string>;
  states: { busy: string; done: string; highlight: string; glow: string };
  attribution: { background: string; text: string };
  /** HTML overlays on the map (legend, chips): colours for their surface. */
  overlay: {
    /** Translucent surface colour (CSS). */
    background: string;
    /** The surface flattened over the land: what overlay text actually sits on. */
    surface: string;
    border: string;
    text: string;
    strong: string;
    muted: string;
    accent: string;
    adapter: string;
  };
};

type Rgba = [number, number, number, number];

function parse(color: string): Rgba {
  const c = decomposeColor(String(color).trim().replace(/;$/, ''));
  let [r, g, b] = c.values as number[];
  const a = c.values.length > 3 ? Number(c.values[3]) : 1;
  if (c.type === 'color') {
    // color(srgb r g b) — channels in 0..1
    r *= 255; g *= 255; b *= 255;
  }
  if (c.type.startsWith('hsl')) {
    return parse(hslToRgb(c.values as number[]));
  }
  return [r, g, b, Number.isFinite(a) ? a : 1];
}

function hslToRgb([h, s, l]: number[]): string {
  const sat = s / 100, lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `rgb(${Math.round(f(0) * 255)}, ${Math.round(f(8) * 255)}, ${Math.round(f(4) * 255)})`;
}

const rgb = ([r, g, b]: Rgba | number[]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

/** Composite `color` over an opaque `base`, returning opaque rgb(). */
export function flatten(color: string, base: string): string {
  const [r, g, b, a] = parse(color);
  if (a >= 1) return rgb([r, g, b]);
  const [br, bg, bb] = parse(base);
  return rgb([br + (r - br) * a, bg + (g - bg) * a, bb + (b - bb) * a]);
}

/** Opaque mix: t = 0 → a, t = 1 → b (both flattened over a). */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parse(flatten(a, a));
  const [br, bg, bb] = parse(flatten(b, a));
  return rgb([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

export function contrast(fg: string, bg: string): number {
  return getContrastRatio(flatten(fg, bg), flatten(bg, bg));
}

/** Move `fg` toward `toward` until it reaches `min` contrast on `bg` (or gives up at `toward`). */
export function ensureContrast(fg: string, bg: string, min: number, toward: string): string {
  let out = flatten(fg, bg);
  for (let t = 0.1; contrast(out, bg) < min && t <= 1.0001; t += 0.1) {
    out = mix(flatten(fg, bg), flatten(toward, bg), t);
  }
  return out;
}

export function rgba(color: string, alpha: number): string {
  const [r, g, b] = parse(color);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

export function resolveTone(tone: OsmMarkerTone | undefined): OsmBaseTone {
  if (!tone) return 'neutral';
  return (OSM_DOMAIN_TONES as Record<string, OsmBaseTone>)[tone] ?? (tone as OsmBaseTone);
}

/** The colour of a tone (base or domain) in a palette. Unknown tones fall back to neutral. */
export function osmToneColor(palette: OsmPalette, tone: OsmMarkerTone | undefined): string {
  if (tone && tone in palette.domain) return palette.domain[tone as OsmDomainTone];
  return palette.tones[(tone as OsmBaseTone) in palette.tones ? (tone as OsmBaseTone) : 'neutral'];
}

function toLab(color: string): [number, number, number] {
  const [r, g, b] = parse(color).slice(0, 3).map((v) => v / 255).map((v) => (v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92));
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE76 colour difference (≈ 2.3 is a just-noticeable difference). */
export function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const DOMAIN_CANDIDATES: Array<[OsmDomainTone, OsmBaseTone[]]> = [
  ['port', ['primary', 'secondary', 'info']],
  ['queue', ['neutral']],
  ['train', ['warning', 'error', 'secondary']],
  ['ship', ['info', 'secondary', 'primary']],
  ['yard', ['success', 'secondary', 'info']],
];
const MIN_DOMAIN_DELTA_E = 15;

function resolveDomainTones(tones: Record<OsmBaseTone, string>, land: string, text: string): Record<OsmDomainTone, string> {
  const out = {} as Record<OsmDomainTone, string>;
  const taken: string[] = [];
  const distinct = (c: string) => taken.every((t) => deltaE(c, t) >= MIN_DOMAIN_DELTA_E);
  for (const [domain, candidates] of DOMAIN_CANDIDATES) {
    let pick = candidates.map((k) => tones[k]).find(distinct);
    if (!pick) {
      // No distinct token left: a darker / lighter variant of the first candidate.
      const base = tones[candidates[0]];
      for (const t of [0.35, 0.5, 0.65]) {
        const variant = ensureContrast(mix(base, land, t), land, 3, text);
        if (distinct(variant)) { pick = variant; break; }
      }
      pick = pick ?? base;
    }
    out[domain] = pick;
    taken.push(pick);
  }
  return out;
}

/** Minimum contrast of water lines on land (non-text, decorative but should read as water). */
export const OSM_WATER_MIN_CONTRAST = 2.25;

function waterColors(land: string, info: string, text: string, light: boolean): { water: string; waterArea: string } {
  const lineT = light ? 0.6 : 0.45;
  let water = mix(land, info, lineT);
  if (contrast(water, land) >= OSM_WATER_MIN_CONTRAST) {
    return { water, waterArea: mix(land, info, light ? 0.26 : 0.18) };
  }
  for (let t = lineT + 0.05; t <= 1.0001 && contrast(water, land) < OSM_WATER_MIN_CONTRAST; t += 0.05) {
    water = mix(land, info, Math.min(1, t));
  }
  water = ensureContrast(water, land, OSM_WATER_MIN_CONTRAST, text);
  return { water, waterArea: mix(land, water, light ? 0.35 : 0.4) };
}

function overlayColors(p: Theme['palette'], land: string, textPrimary: string, textSecondary: string, tones: Record<OsmBaseTone, string>, mode: 'light' | 'dark'): OsmPalette['overlay'] {
  const paper = flatten(p.background.paper, land);
  const background = rgba(paper, 0.9);
  const surface = flatten(background, land);
  let divider = surface;
  try { divider = flatten(String(p.divider), surface); } catch { /* unparsable divider: use the mix below */ }
  const text = ensureContrast(textSecondary, surface, 4.5, textPrimary);
  return {
    background,
    surface,
    border: contrast(divider, surface) >= 1.3 ? divider : mix(surface, textPrimary, 0.22),
    text,
    strong: ensureContrast(textPrimary, surface, 4.5, mode === 'dark' ? '#fff' : '#000'),
    muted: ensureContrast(mix(surface, textSecondary, 0.8), surface, 4.5, textPrimary),
    accent: ensureContrast(tones.primary, surface, 3, textPrimary),
    adapter: ensureContrast(tones.warning, surface, 3, textPrimary),
  };
}

/** A tone's colour for TEXT on an overlay surface (≥ 4.5:1), e.g. a chip value. */
export function osmToneText(palette: OsmPalette, tone: OsmMarkerTone): string {
  return ensureContrast(osmToneColor(palette, tone), palette.overlay.surface, 4.5, palette.overlay.strong);
}

/** Build the map palette from a (GUI-built) MUI theme. Pure; safe on the server. */
export function buildOsmPalette(theme: Theme): OsmPalette {
  const p = theme.palette;
  const mode = p.mode === 'dark' ? 'dark' : 'light';
  const land = flatten(p.background.default, mode === 'dark' ? '#000' : '#fff');
  const textPrimary = flatten(p.text.primary, land);
  const textSecondary = flatten(p.text.secondary, land);
  const tone = (c: string) => ensureContrast(c, land, 3, textPrimary);
  const themeAccent = typeof (theme as any).custom?.accent === 'string' ? ((theme as any).custom.accent as string) : undefined;
  const primaryRaw = contrast(flatten(p.primary.main, land), land);
  const accent = themeAccent && primaryRaw < 3 && contrast(flatten(themeAccent, land), land) > primaryRaw
    ? flatten(themeAccent, land) : null;
  const tones: Record<OsmBaseTone, string> = {
    primary: tone(accent ?? p.primary.main),
    secondary: tone(p.secondary.main),
    info: tone(p.info.main),
    success: tone(p.success.main),
    warning: tone(p.warning.main),
    error: tone(p.error.main),
    neutral: tone(textSecondary),
  };
  const light = mode === 'light';
  return {
    mode,
    land,
    ...waterColors(land, p.info.main, textPrimary, light),
    road: {
      primary: mix(land, textPrimary, 0.42),
      secondary: mix(land, textPrimary, 0.32),
      tertiary: mix(land, textPrimary, 0.24),
      minor: mix(land, textPrimary, 0.15),
    },
    place: mix(land, textSecondary, 0.5),
    label: ensureContrast(textPrimary, land, 4.5, mode === 'dark' ? '#fff' : '#000'),
    meta: ensureContrast(textSecondary, land, 4.5, textPrimary),
    halo: land,
    tones,
    accent,
    domain: resolveDomainTones(tones, land, textPrimary),
    states: {
      busy: tones.warning,
      done: tones.success,
      highlight: tones.primary,
      glow: rgba(tones.primary, 0.55),
    },
    attribution: {
      background: rgba(flatten(p.background.paper, land), 0.85),
      text: ensureContrast(textSecondary, flatten(p.background.paper, land), 4.5, textPrimary),
    },
    overlay: overlayColors(p, land, textPrimary, textSecondary, tones, mode),
  };
}

/** The palette for the theme in scope (MUI default theme when there is no GUI <Theme>). */
export function useOsmPalette(): OsmPalette {
  const theme = useTheme();
  return React.useMemo(() => buildOsmPalette(theme), [theme.palette]);
}

const LAYER_ID_KINDS: Array<[RegExp, OsmLayerKind]> = [
  [/^(water-?polys?|water-?areas?)$/i, 'water-area'],
  [/^water(ways?|-lines?)?$/i, 'water'],
  [/^roads?-primary$/i, 'road-primary'],
  [/^roads?-secondary$/i, 'road-secondary'],
  [/^roads?-tertiary$/i, 'road-tertiary'],
  [/^roads?-(residential|minor|service|unclassified)$/i, 'road-minor'],
  [/^places?$/i, 'place'],
  [/^land$/i, 'land'],
];

/** Layer kind from an explicit `kind`, else inferred from the layer id (build_basemap.py ids). */
export function osmLayerKind(layer: { id: string; kind?: OsmLayerKind }): OsmLayerKind {
  if (layer.kind) return layer.kind;
  for (const [re, kind] of LAYER_ID_KINDS) if (re.test(layer.id)) return kind;
  return 'custom';
}

/** Paint for a layer kind; `null` = keep the layer's own style (custom). */
export function osmLayerPaint(kind: OsmLayerKind, palette: OsmPalette): { fill: string; stroke?: string } | null {
  switch (kind) {
    case 'land': return { fill: palette.land };
    case 'water': return { fill: 'none', stroke: palette.water };
    case 'water-area': return { fill: palette.waterArea, stroke: palette.water };
    case 'road-primary': return { fill: 'none', stroke: palette.road.primary };
    case 'road-secondary': return { fill: 'none', stroke: palette.road.secondary };
    case 'road-tertiary': return { fill: 'none', stroke: palette.road.tertiary };
    case 'road-minor': return { fill: 'none', stroke: palette.road.minor };
    case 'place': return { fill: palette.place };
    default: return null;
  }
}

/** CSS custom properties put on the map root, for page CSS that wants the same colours. */
export function osmPaletteCssVars(palette: OsmPalette): Record<string, string> {
  return {
    '--gui-osm-land': palette.land,
    '--gui-osm-water': palette.water,
    '--gui-osm-water-area': palette.waterArea,
    '--gui-osm-road-primary': palette.road.primary,
    '--gui-osm-road-secondary': palette.road.secondary,
    '--gui-osm-road-tertiary': palette.road.tertiary,
    '--gui-osm-road-minor': palette.road.minor,
    '--gui-osm-place': palette.place,
    '--gui-osm-label': palette.label,
    '--gui-osm-meta': palette.meta,
    '--gui-osm-halo': palette.halo,
    '--gui-osm-busy': palette.states.busy,
    '--gui-osm-done': palette.states.done,
    '--gui-osm-highlight': palette.states.highlight,
    '--gui-osm-overlay-bg': palette.overlay.background,
    '--gui-osm-overlay-border': palette.overlay.border,
    '--gui-osm-overlay-text': palette.overlay.text,
    '--gui-osm-overlay-strong': palette.overlay.strong,
    '--gui-osm-overlay-accent': palette.overlay.accent,
    '--gui-osm-overlay-muted': palette.overlay.muted,
    ...Object.fromEntries(Object.entries(palette.tones).map(([k, v]) => [`--gui-osm-tone-${k}`, v])),
    ...Object.fromEntries(Object.entries(palette.domain).map(([k, v]) => [`--gui-osm-tone-${k}`, v])),
  };
}
