import { alpha, decomposeColor, getContrastRatio, hslToRgb, recomposeColor } from '@mui/material/styles';
import type { Palette } from '@mui/material/styles';

/**
 * Contrast for the colours QR.me draws, kept apart from the component so it can be tested.
 *
 * Several themes' primary is a dark brand colour: Seafoam dark's `#244C4E` over its own paper `#182423` is ~1.7:1, so
 * the QR ink drawn straight in it was close to invisible and unreliable to scan. The ink and the ring now keep their
 * intended colour when it already contrasts, and only otherwise step through the theme's own fallbacks.
 */

/** QR ink against the QR's own background. Scanners need a clear dark/light split: WCAG's 4.5:1 for normal text. */
export const QR_INK_MIN_CONTRAST = 4.5;
/** The ring around the code sits on the page and only has to be seen, not decoded: WCAG's 3:1 for graphics. */
export const QR_RING_MIN_CONTRAST = 3;

/** A colour with alpha, laid over an opaque background, as the eye sees it. Opaque colours pass through unchanged. */
function flattenOver(color: string, background: string): string {
  const toRgb = (c: string) => decomposeColor(c.trim().startsWith('hsl') ? hslToRgb(c) : c);
  const f = toRgb(color);
  const a = f.type === 'rgba' ? Number(f.values[3] ?? 1) : 1;
  if (a >= 1) return color;
  const b = toRgb(background);
  const mix = [0, 1, 2].map((i) => Math.round(Number(f.values[i]) * a + Number(b.values[i]) * (1 - a)));
  return recomposeColor({ type: 'rgb', values: mix as [number, number, number] });
}

/**
 * Contrast ratio of `color` drawn on `background`. With `alphaAware` (the default) a translucent colour is first laid
 * over the background, so `rgba(0,0,0,0.38)` counts as the grey it renders as rather than as solid black.
 * Throws for a colour MUI cannot parse (e.g. `transparent`, a CSS variable), like getContrastRatio.
 */
export function contrastOn(color: string, background: string, alphaAware = true): number {
  return getContrastRatio(alphaAware ? flattenOver(color, background) : color, background);
}

/**
 * The first candidate with at least `minRatio` against `background`, else `fallback`. Undefined candidates are skipped.
 * A candidate or background that cannot be measured is returned as is: nothing is guessed about a colour we cannot read.
 */
export function firstContrasting(
  background: string,
  minRatio: number,
  candidates: Array<string | undefined>,
  fallback: string,
  alphaAware = true,
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      if (contrastOn(candidate, background, alphaAware) >= minRatio) return candidate;
    } catch {
      return candidate;
    }
  }
  return fallback;
}

/**
 * `color` with a two-digit hex alpha (`'55'`, `'8c'`, ...). A `#rrggbb` colour gets the suffix appended, exactly the
 * string it always produced; anything else (`#fff`, `rgb()`, `rgba()`) goes through MUI's `alpha`, where appending
 * would have produced an invalid colour and dropped the whole declaration.
 */
export function withHexAlpha(color: string, hexAlpha: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return `${color}${hexAlpha}`;
  try {
    const current = decomposeColor(color);
    const base = current.type === 'rgba' || current.type === 'hsla' ? Number(current.values[3] ?? 1) : 1;
    return alpha(color, base * (parseInt(hexAlpha, 16) / 255));
  } catch {
    return color;
  }
}

export type QrMeStatus = 'idle' | 'checking' | 'confirmed' | 'error' | 'off';

type QrPalette = Pick<Palette, 'mode' | 'primary' | 'warning' | 'error' | 'text' | 'background'>;

export type QrMeColors = {
  /** The status colour the ink and ring are meant to carry ('checking' / 'error' / 'off'), before any contrast step. */
  statusColor: string | undefined;
  qrBg: string;
  qrFg: string;
  ringAccent: string;
};

/**
 * The QR's background, ink and ring for one palette and status.
 *
 * - `bg` / `fg` given by the caller are used exactly as given.
 * - The ink, when no `fg` is given, is the status colour (or primary) if it reaches 4.5:1 against the QR background;
 *   otherwise the same colour's lighter variant in dark mode (its darker one in light mode), and finally the theme's
 *   own text colour.
 * - The ring follows the same steps at 3:1 against the page (`background.default`) it is drawn on.
 *
 * A theme whose primary already contrasts gets exactly the colour it had before.
 */
export function resolveQrMeColors(
  palette: QrPalette,
  { status, fg, bg }: { status?: QrMeStatus; fg?: string; bg?: string },
): QrMeColors {
  // 'confirmed' and 'idle' keep the QR's normal colour; only 'checking' / 'error' / 'off' recolour it.
  const step = palette.mode === 'dark' ? 'light' : 'dark';
  const family: [string, string | undefined] | undefined =
    status === 'checking'
      ? [palette.warning.main, palette.warning[step]]
      : status === 'error'
        ? [palette.error.main, palette.error[step]]
        : status === 'off'
          ? [palette.text.disabled, palette.text.secondary]
          : undefined;
  const statusColor = family?.[0];
  const [base, stepped] = family ?? [palette.primary.main, palette.primary[step]];
  const candidates = [base, stepped, palette.text.primary];

  const qrBg = bg ?? palette.background.paper;
  const qrFg = fg ?? firstContrasting(qrBg, QR_INK_MIN_CONTRAST, candidates, palette.text.primary);
  const pageBg = palette.background.default ?? palette.background.paper;
  const ringAccent = firstContrasting(pageBg, QR_RING_MIN_CONTRAST, candidates, palette.text.primary);
  return { statusColor, qrBg, qrFg, ringAccent };
}
