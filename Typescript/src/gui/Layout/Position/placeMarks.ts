// The two marks in the bars and where each goes (Roles-and-Territories.md §3, "Two marks in the bars"): the site's
// BRAND (the author's: whose page this is) and the person's QR.me (their IDENTITY: who I am, where I go).
//
// The person places their QR; by DEFAULT the brand takes the other end of the same edge, else the diagonal, else the
// first free place — they never share a cell. When a `brandCorner` is declared (the author, a story control, or the
// person from the brand's own placement panel), the two marks are independent: each sits at its own corner. They
// may be placed freely, but NEVER in the same place: if one is moved onto the other, the other jumps by this same
// opposition rule (`opposingCorner` / `resolveMarkCorners`). Pure: every shell that draws the marks asks this, so
// the rule is decided once.
//
// It depends only on the corners, which bars exist and whether the screen is narrow -- never on whether a bar
// is open or a rail, so opening or closing a bar never moves a mark.

export type MarkCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export const MARK_CORNERS: readonly MarkCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

/**
 * A place for a mark:
 * - `left.brand`  the left bar's leading cell (its `brand` slot; on a narrow screen, the head of the drawer)
 * - `top.start`   the top bar's first element
 * - `top.end`     the top bar's far end, before the author's own elements there (search, account, actions)
 * - `left.footer` the left bar's bottom
 * - `right.brand` the right bar's leading cell (its `brand` slot; the counterpart of `left.brand`)
 * - `right.footer` the right bar's bottom
 * - `float:<corner>` no bar holds that corner: the mark floats there, as a badge
 * - `corner`      no bars at all: the identity is the scannable corner QR (level 1)
 * - `none`        not drawn (no brand to draw, or no bars to draw it in)
 */
export type MarkSlot = 'left.brand' | 'top.start' | 'top.end' | 'left.footer' | 'right.brand' | 'right.footer' | `float:${MarkCorner}` | 'corner' | 'none';

export type MarkBars = { top: boolean; left: boolean; right?: boolean };
export type MarksInput = {
  /** The person's corner for their QR. */
  identity: MarkCorner;
  /** The bars the page draws (present, whatever their state: a rail is present). */
  bars: MarkBars;
  /** Under 600px: the left bar is a drawer. */
  narrow?: boolean;
  /** Whether there is a brand to place. */
  brand?: boolean;
  /**
   * The brand's own corner. When omitted, the brand takes the other end of the QR (the default). When set, the two
   * marks are independent — but if that corner is the QR's (or the same cell), the brand jumps by the default
   * opposition rule, so they never share a place. Callers that know which mark just moved use `resolveMarkCorners`
   * first, so the one that was picked stays and the other jumps.
   */
  brandCorner?: MarkCorner;
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
    case 'top-right': return bars.right ? 'right.brand' : bars.top ? 'top.end' : null;
    case 'bottom-left': return bars.left ? 'left.footer' : null;
    case 'bottom-right': return bars.right ? 'right.footer' : null;
  }
}

/** The bar cell that holds a corner, if a bar does; otherwise the mark floats there. */
export function slotForCorner(corner: MarkCorner, bars: MarkBars): MarkSlot {
  return slotAt(corner, bars) ?? `float:${corner}`;
}

/** The corner a placed slot stands for (a float carries its corner; a bar cell has one). */
export function cornerOfSlot(slot: MarkSlot | string, fallback: MarkCorner): MarkCorner {
  if (typeof slot === 'string' && slot.startsWith('float:')) {
    const at = slot.slice(6);
    if (isMarkCorner(at)) return at;
  }
  if (slot === 'left.brand' || slot === 'top.start') return 'top-left';
  if (slot === 'top.end' || slot === 'right.brand') return 'top-right';
  if (slot === 'left.footer') return 'bottom-left';
  if (slot === 'right.footer') return 'bottom-right';
  return fallback;
}

/** Which edge a mark's slot sits on, so each sidebar can follow its mark. */
export function slotEdge(slot: MarkSlot | string): 'left' | 'right' | 'none' {
  if (!slot || slot === 'none' || slot === 'corner') return 'none';
  if (slot === 'top.end' || slot === 'right.brand' || slot === 'right.footer' || String(slot).startsWith('right.') || String(slot).endsWith('right')) return 'right';
  return 'left';
}

const FREE_ORDER: readonly MarkSlot[] = ['left.brand', 'top.start', 'top.end', 'left.footer', 'right.brand', 'right.footer'];
const available = (slot: MarkSlot, bars: MarkBars) =>
  slot === 'left.brand' || slot === 'left.footer' ? bars.left
    : slot === 'top.start' || slot === 'top.end' ? bars.top
    : slot === 'right.brand' || slot === 'right.footer' ? Boolean(bars.right)
    : false;

/**
 * The corner the other mark takes when one sits at `occupied` — exactly the default brand
 * placement (no `brandCorner`): the other end of the same edge (mirror), else the diagonal,
 * else the first free place. Calls `placeMarks` itself; does not invent a second rule.
 */
export function opposingCorner(occupied: MarkCorner, bars: MarkBars): MarkCorner {
  const { brand } = placeMarks({ identity: occupied, bars, brand: true });
  if (brand === 'none' || brand === 'corner') return mirror(occupied);
  return cornerOfSlot(brand, mirror(occupied));
}

/**
 * After a new pair of corners, if they collide, the mark that just moved stays and the other
 * jumps to `opposingCorner`. If the brand moved onto the QR, the QR jumps; if the QR moved
 * onto the brand, or it is unknown who moved, the brand jumps (the historical default: the
 * person places their QR, the brand takes the other end).
 */
export function resolveMarkCorners(
  identity: MarkCorner,
  brandCorner: MarkCorner | undefined,
  bars: MarkBars,
  prev?: { identity: MarkCorner; brandCorner?: MarkCorner },
): { identity: MarkCorner; brandCorner?: MarkCorner } {
  if (!brandCorner || brandCorner !== identity) return { identity, brandCorner };
  const identityMoved = Boolean(prev && prev.identity !== identity);
  const brandMoved = Boolean(prev && prev.brandCorner !== brandCorner);
  if (brandMoved && !identityMoved) {
    return { identity: opposingCorner(brandCorner, bars), brandCorner };
  }
  return { identity, brandCorner: opposingCorner(identity, bars) };
}

/** If a declared brand corner would land on the QR's cell, jump the brand by the default rule. */
function brandSlotAvoiding(identity: MarkCorner, id: MarkSlot, brandCorner: MarkCorner, bars: MarkBars): MarkSlot {
  const raw = slotForCorner(brandCorner, bars);
  if (brandCorner !== identity && raw !== id) return raw;
  const jumped = opposingCorner(identity, bars);
  const next = slotForCorner(jumped, bars);
  return next !== id ? next : raw;
}

export function placeMarks({ identity, bars, narrow = false, brand = true, brandCorner }: MarksInput): MarksPlacement {
  // No bars: the QR is the corner QR, and there is nowhere for a brand (the page draws its own, if any).
  if (!bars.top && !bars.left) return { identity: 'corner', brand: 'none' };

  if (narrow) {
    if (!bars.top) {
      // Only the left bar (the drawer). The brand (or, with no brand, the QR at top-left) is the
      // collapsed handle: keep the QR out of that corner so the two never overlap. Other corners
      // are honored, so picking a position on a narrow screen actually moves the mark.
      // With a brand handle occupying the top-left chrome, every chosen corner
      // is a distinct content-area float (FloatingMark keeps the QR off the handle).
      // With no brand, the QR itself is the handle at top-left.
      const honorIdentity = (): MarkSlot => {
        if (!brand) {
          if (identity === 'top-left') return 'left.brand';
          const raw = slotForCorner(identity, bars);
          return raw === 'left.brand' ? 'left.footer' : raw;
        }
        return (`float:${identity}` as MarkSlot);
      };
      if (!brand) return { identity: honorIdentity(), brand: 'none' };
      const id = honorIdentity();
      if (brandCorner) {
        const raw = slotForCorner(brandCorner, bars);
        const brandSlot: MarkSlot = raw === 'left.footer' && id !== 'left.footer' ? 'left.footer' : 'left.brand';
        return { identity: id === brandSlot ? (brandSlot === 'left.brand' ? 'left.footer' : id) : id, brand: brandSlot };
      }
      return { identity: id, brand: 'left.brand' };
    }
    // One layout of its own: the QR in the top bar at the end the person chose.
    const side: MarkSlot = identity.endsWith('left') ? 'top.start' : 'top.end';
    const id: MarkSlot = side;
    if (!brand) return { identity: id, brand: 'none' };
    // Declared brand corner: honor it, but never share the QR's cell. Otherwise the brand leads the drawer.
    if (brandCorner) return { identity: id, brand: brandSlotAvoiding(identity, id, brandCorner, bars) };
    if (bars.left) return { identity: id, brand: 'left.brand' };
    // no drawer: the other end of the top bar
    return { identity: id, brand: id === 'top.start' ? 'top.end' : id === 'top.end' ? 'top.start' : 'top.start' };
  }

  const id: MarkSlot = slotForCorner(identity, bars);
  if (!brand) return { identity: id, brand: 'none' };
  if (brandCorner) return { identity: id, brand: brandSlotAvoiding(identity, id, brandCorner, bars) };
  const candidates = [slotAt(mirror(identity), bars), slotAt(diagonal(identity), bars), ...FREE_ORDER.filter((s) => available(s, bars))];
  const placed = candidates.find((s): s is MarkSlot => Boolean(s) && s !== id) ?? 'none';
  return { identity: id, brand: placed };
}

/**
 * Whether placing `kind` at `corner` is actually honored (the resulting slot
 * still stands for that corner). Used by the position grid to mark a cell as
 * not droppable instead of silently ignoring the drop. When no bars are
 * present both marks float, so every corner is honored (they still may not
 * share a cell — the grid treats that as a swap).
 */
export function honorsMarkCorner(
  kind: 'identity' | 'brand',
  corner: MarkCorner,
  input: MarksInput,
): boolean {
  if (kind === 'brand' && input.brand === false) return false;
  const bars = input.bars;
  if (!bars.top && !bars.left && !bars.right) return kind === 'identity' || Boolean(input.brand);
  const placed = kind === 'identity'
    ? placeMarks({ ...input, identity: corner })
    : placeMarks({ ...input, brand: true, brandCorner: corner });
  const slot = kind === 'identity' ? placed.identity : placed.brand;
  if (slot === 'none') return false;
  if (slot === 'corner') return kind === 'identity';
  return cornerOfSlot(slot, corner) === corner;
}

/**
 * A corner `kind` can actually occupy, other than `busy`. Prefers the default
 * opposition, then the remaining corners, so a mark evicted by an un-swappable
 * landing still lands somewhere placeMarks would honor.
 */
export function evictMarkCorner(
  kind: 'identity' | 'brand',
  busy: MarkCorner,
  input: MarksInput,
): MarkCorner | undefined {
  const preferred = opposingCorner(busy, input.bars);
  const seen = new Set<MarkCorner>();
  for (const c of [preferred, ...MARK_CORNERS]) {
    if (c === busy || seen.has(c)) continue;
    seen.add(c);
    const ok = kind === 'brand'
      ? honorsMarkCorner('brand', c, { ...input, identity: input.identity, brand: true, brandCorner: c })
      : honorsMarkCorner('identity', c, { ...input, identity: c, brand: true, brandCorner: input.brandCorner });
    if (ok) return c;
  }
  return undefined;
}

/**
 * Where both marks end up after moving `who` to `to`. Returns null when that
 * corner is not honored for the moving mark (the grid shows it as not
 * droppable). Landing on the other tile swaps when the vacated cell is
 * honored for it; otherwise the other mark is evicted to a valid corner
 * instead of refusing the move.
 */
export function arrangeMove(
  who: 'identity' | 'brand',
  to: MarkCorner,
  current: { identity: MarkCorner; brand: MarkCorner | null },
  input: Pick<MarksInput, 'bars' | 'narrow'> & { brand?: boolean },
): { identity: MarkCorner; brand: MarkCorner | null } | null {
  const hasBrand = current.brand != null && input.brand !== false;
  if (who === 'brand' && !hasBrand) return null;
  if (who === 'identity' && to === current.identity) return { identity: current.identity, brand: current.brand };
  if (who === 'brand' && to === current.brand) return { identity: current.identity, brand: current.brand };
  // Probe the moving mark as if the other were not sitting on `to`.
  // honorsMarkCorner(brand, qr's cell) is otherwise false because placeMarks
  // jumps the brand off a collision before the slot is scored.
  const otherForProbe = who === 'identity'
    ? (current.brand && current.brand !== to ? current.brand : undefined)
    : (current.identity !== to ? current.identity : MARK_CORNERS.find((c) => c !== to));
  const probe: MarksInput = {
    identity: who === 'identity' ? to : (otherForProbe as MarkCorner),
    bars: input.bars,
    narrow: input.narrow,
    brand: hasBrand,
    brandCorner: who === 'brand' ? to : otherForProbe,
  };
  if (!honorsMarkCorner(who, to, probe)) return null;
  if (!hasBrand) {
    return { identity: who === 'identity' ? to : current.identity, brand: null };
  }
  const other = who === 'identity' ? current.brand : current.identity;
  if (to !== other) {
    return who === 'identity'
      ? { identity: to, brand: current.brand }
      : { identity: current.identity, brand: to };
  }
  const vacated = who === 'identity' ? current.identity : current.brand!;
  const otherKind = who === 'identity' ? 'brand' : 'identity';
  const swapProbe: MarksInput = {
    identity: who === 'identity' ? to : vacated,
    bars: input.bars,
    narrow: input.narrow,
    brand: true,
    brandCorner: who === 'identity' ? vacated : to,
  };
  if (honorsMarkCorner(otherKind, vacated, swapProbe)) {
    return who === 'identity'
      ? { identity: to, brand: vacated }
      : { identity: vacated, brand: to };
  }
  const evicted = evictMarkCorner(otherKind, to, {
    identity: who === 'identity' ? to : current.identity,
    bars: input.bars,
    narrow: input.narrow,
    brand: true,
    brandCorner: who === 'brand' ? to : (current.brand ?? undefined),
  });
  return who === 'identity'
    ? { identity: to, brand: evicted ?? current.brand }
    : { identity: evicted ?? current.identity, brand: to };
}
