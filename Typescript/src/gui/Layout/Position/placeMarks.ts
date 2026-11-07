// The two marks in the bars and where each goes (Roles-and-Territories.md §3, "Two marks in the bars"): the site's
// BRAND (the author's: whose page this is) and the person's QR.me (their IDENTITY: who I am, where I go). They never
// share a cell. The person places their QR; the brand takes the other end of the same edge, else the diagonal, else the
// first free place. Pure: every shell that draws the marks asks this, so the rule is decided once.
//
// It depends only on the person's corner, which bars exist and whether the screen is narrow -- never on whether a bar
// is open or a rail, so opening or closing a bar never moves the brand.

export type MarkCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export const MARK_CORNERS: readonly MarkCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

/**
 * A place for a mark:
 * - `left.brand`  the left bar's leading cell (its `brand` slot; on a narrow screen, the head of the drawer)
 * - `top.start`   the top bar's first element
 * - `top.end`     the top bar's far end, before the author's own elements there (search, account, actions)
 * - `left.footer` the left bar's bottom
 * - `float:<corner>` no bar holds that corner: the mark floats there, as a badge
 * - `corner`      no bars at all: the identity is the scannable corner QR (level 1)
 * - `none`        not drawn (no brand to draw, or no bars to draw it in)
 */
export type MarkSlot = 'left.brand' | 'top.start' | 'top.end' | 'left.footer' | `float:${MarkCorner}` | 'corner' | 'none';

export type MarkBars = { top: boolean; left: boolean };
export type MarksInput = {
  /** The person's corner for their QR. */
  identity: MarkCorner;
  /** The bars the page draws (present, whatever their state: a rail is present). */
  bars: MarkBars;
  /** Under 600px: the left bar is a drawer. */
  narrow?: boolean;
  /** Whether there is a brand to place. */
  brand?: boolean;
};
export type MarksPlacement = { identity: MarkSlot; brand: MarkSlot };

export const isMarkCorner = (v: unknown): v is MarkCorner => typeof v === 'string' && (MARK_CORNERS as readonly string[]).includes(v);

const mirror = (c: MarkCorner): MarkCorner =>
  (c.endsWith('left') ? c.replace('left', 'right') : c.replace('right', 'left')) as MarkCorner;
const diagonal = (c: MarkCorner): MarkCorner =>
  `${c.startsWith('top') ? 'bottom' : 'top'}-${c.endsWith('left') ? 'right' : 'left'}` as MarkCorner;

/** The bar cell that holds a corner on a wide screen, if a bar does. */
function slotAt(corner: MarkCorner, bars: MarkBars): MarkSlot | null {
  switch (corner) {
    case 'top-left': return bars.left ? 'left.brand' : bars.top ? 'top.start' : null;
    case 'top-right': return bars.top ? 'top.end' : null;
    case 'bottom-left': return bars.left ? 'left.footer' : null;
    case 'bottom-right': return null;   // no right or bottom bar is drawn
  }
}

const FREE_ORDER: readonly MarkSlot[] = ['left.brand', 'top.start', 'top.end', 'left.footer'];
const available = (slot: MarkSlot, bars: MarkBars) =>
  slot === 'left.brand' || slot === 'left.footer' ? bars.left : slot === 'top.start' || slot === 'top.end' ? bars.top : false;

export function placeMarks({ identity, bars, narrow = false, brand = true }: MarksInput): MarksPlacement {
  // No bars: the QR is the corner QR, and there is nowhere for a brand (the page draws its own, if any).
  if (!bars.top && !bars.left) return { identity: 'corner', brand: 'none' };

  if (narrow) {
    // One layout of its own: the QR in the top bar at the end the person chose; the brand leads the drawer.
    const side: MarkSlot = identity.endsWith('left') ? 'top.start' : 'top.end';
    const id: MarkSlot = bars.top ? side : `float:${identity}`;
    if (!brand) return { identity: id, brand: 'none' };
    if (bars.left) return { identity: id, brand: 'left.brand' };
    // no drawer: the other end of the top bar
    return { identity: id, brand: id === 'top.start' ? 'top.end' : id === 'top.end' ? 'top.start' : 'top.start' };
  }

  const id: MarkSlot = slotAt(identity, bars) ?? `float:${identity}`;
  if (!brand) return { identity: id, brand: 'none' };
  const candidates = [slotAt(mirror(identity), bars), slotAt(diagonal(identity), bars), ...FREE_ORDER.filter((s) => available(s, bars))];
  const placed = candidates.find((s): s is MarkSlot => Boolean(s) && s !== id) ?? 'none';
  return { identity: id, brand: placed };
}
