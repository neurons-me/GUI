// Sizes that come from other sizes in the theme's type scale.
//
// A subtitle that accompanies a title takes its size FROM that title: the geometric mean of the title's size and the
// body size, so it sits halfway between them on the scale the eye reads (a log scale): always under its title, always
// over the text it introduces. A bigger title gets a bigger subtitle. (Medium sets its deck the same way: title 42,
// body 21, deck 28 ≈ √(42·21).)

const ROOT_FONT_PX = 16;

/** A CSS font size as the theme writes it (`1.3125rem`, `21px`, `21`) in px; null when it cannot be read. */
export function fontSizePx(value: unknown, rootPx = ROOT_FONT_PX): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').trim();
  const m = /^(-?\d*\.?\d+)\s*(px|rem|em)?$/.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === 'rem' || m[2] === 'em' ? n * rootPx : n;
}

/** The subtitle size for a title of `titlePx` over body text of `bodyPx`: √(title · body), never under the body. */
export function relativeSubtitlePx(titlePx: number, bodyPx: number): number {
  if (!(titlePx > 0) || !(bodyPx > 0)) return bodyPx > 0 ? bodyPx : titlePx;
  return Math.max(bodyPx, Math.sqrt(titlePx * bodyPx));
}
