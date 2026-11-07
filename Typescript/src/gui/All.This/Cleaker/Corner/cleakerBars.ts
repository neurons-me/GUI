// Level 2 of Cleaker in a corner: the bars an author declares, unfolded from the QR (Roles-and-Territories.md §3).
// Pure and React-free: reads the bars out of a GUI document, keeps only what is safe to draw, and decides each bar's
// state from the author's default and the person's choice.
//
// The document is the same shape the GUI declares itself with (GUI.document.json: GUI.window.layout.bars.{top, left,
// right, bottom}, each with its elements: { label, to, icon }), or the short form { bars: { … } }. A bar's default
// state is the author's (`props.state` or `state`: 'open' | 'icons' | 'closed'; 'closed' if not said), so a page is
// unchanged until someone opens a bar. The person's choice -- kept in their browser, their layer -- wins.
//
// The document is input, not code: labels are text, a link is kept only when it goes somewhere a link may go (a
// relative path, a #fragment, http(s)), and nothing in it runs.

export type CleakerBarId = 'top' | 'left' | 'right' | 'bottom';
export const CLEAKER_BARS: readonly CleakerBarId[] = ['top', 'left', 'right', 'bottom'];
export type CleakerBarState = 'open' | 'icons' | 'closed';
export const CLEAKER_BAR_STATES: readonly CleakerBarState[] = ['open', 'icons', 'closed'];

/** `icon`: the author's icon for .GUI's Icon (`home`, `lucide:Menu`, `glyph:𓆣`), when it is one Icon draws. */
export type CleakerBarItem = { id: string; label: string; href: string; glyph: string; icon?: string };
export type CleakerBar = { id: CleakerBarId; label: string; defaultState: CleakerBarState; items: CleakerBarItem[] };

const MAX_ITEMS = 24;
const MAX_LABEL = 60;

export const isBarState = (value: unknown): value is CleakerBarState =>
  typeof value === 'string' && (CLEAKER_BAR_STATES as readonly string[]).includes(value);

/** A link target a bar may hold: a relative path, a #fragment, or an http(s) URL. Nothing else (javascript:, data:…). */
export function safeHref(to: unknown, base: string): string | null {
  if (typeof to !== 'string' || !to.trim()) return null;
  const raw = to.trim();
  if (raw.startsWith('#')) return raw;
  try {
    const url = new URL(raw, base);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
    // a relative link on a page opened as a file stays a file link on this device
    if (url.protocol === 'file:' && !/^[a-z][a-z0-9+.-]*:/i.test(raw)) return url.href;
    return null;
  } catch {
    return null;
  }
}

/** What stands for an item when only icons show: a glyph the author wrote (`glyph:𓆣`), else the label's first letter. */
export function itemGlyph(icon: unknown, label: string): string {
  if (typeof icon === 'string' && icon.startsWith('glyph:') && icon.length > 6) return Array.from(icon.slice(6))[0] ?? '';
  return (Array.from(label.trim())[0] ?? '•').toUpperCase();
}

/**
 * An icon .GUI's Icon draws: a name (`home`, `lucide:Menu`, `mui:Favorite`) or a glyph the author wrote (`glyph:𓆣`,
 * drawn as text in the icon's box, as the shell draws Netget). Anything else is not one.
 */
export function iconToken(icon: unknown): string | undefined {
  if (typeof icon !== 'string') return undefined;
  if (icon.startsWith('glyph:')) {
    const glyph = Array.from(icon.slice(6));
    return glyph.length >= 1 && glyph.length <= 2 && !/[<>&"'\s]/.test(icon.slice(6)) ? icon : undefined;
  }
  return /^([a-z]+:)?[A-Za-z][A-Za-z0-9_]{0,40}$/.test(icon) ? icon : undefined;
}

type DocNode = { label?: unknown; to?: unknown; icon?: unknown; state?: unknown; props?: { state?: unknown }; children?: Record<string, DocNode> };

/** The bars node of a GUI document, in the full shape or the short `{ bars }` one. */
function barsNode(doc: unknown): Record<string, DocNode> | null {
  if (!doc || typeof doc !== 'object') return null;
  const d = doc as Record<string, any>;
  const full = d.GUI?.children?.window?.children?.layout?.children?.bars?.children;
  if (full && typeof full === 'object') return full;
  if (d.bars && typeof d.bars === 'object') return d.bars;
  return null;
}

/** The bars a document declares, in top/left/right/bottom order, each with its safe items. */
export function readBars(doc: unknown, base: string): CleakerBar[] {
  const node = barsNode(doc);
  if (!node) return [];
  const bars: CleakerBar[] = [];
  for (const id of CLEAKER_BARS) {
    const bar = node[id];
    if (!bar || typeof bar !== 'object') continue;
    const items: CleakerBarItem[] = [];
    for (const [key, child] of Object.entries(bar.children ?? {})) {
      if (items.length >= MAX_ITEMS) break;
      if (!child || typeof child !== 'object') continue;
      const label = String(child.label ?? key).slice(0, MAX_LABEL);
      const href = safeHref(child.to, base);
      if (!href) continue;   // a bar element is a place to go; one without a safe target is not drawn
      const icon = iconToken(child.icon);
      items.push({ id: key, label, href, glyph: itemGlyph(child.icon, label), ...(icon ? { icon } : {}) });
    }
    const declared = bar.props?.state ?? bar.state;
    bars.push({
      id,
      label: String(bar.label ?? id).slice(0, MAX_LABEL),
      defaultState: isBarState(declared) ? declared : 'closed',
      items,
    });
  }
  return bars;
}

/** Each bar's state: the person's choice when they made one, else the author's default. */
export function barStates(bars: CleakerBar[], chosen: Partial<Record<CleakerBarId, unknown>>): Record<CleakerBarId, CleakerBarState> {
  const out = {} as Record<CleakerBarId, CleakerBarState>;
  for (const bar of bars) out[bar.id] = isBarState(chosen[bar.id]) ? (chosen[bar.id] as CleakerBarState) : bar.defaultState;
  return out;
}

/** The site's brand an author declares for the bars (`bars.brand`): whose page this is. Apart from the person's QR. */
export type CleakerBrand = { label: string; href: string | null; logo: string | null };

/**
 * The author's brand (`bars.brand: { label, to?, logo? }`), in the full GUI document shape or the short one; null when
 * none is declared. Text and safe links only, as for the bars: `to` and `logo` are kept only when they are somewhere a
 * link may go (relative, http(s)); a logo is an image address, never markup.
 */
export function readBrand(doc: unknown, base: string): CleakerBrand | null {
  const node = barsNode(doc) as Record<string, DocNode & { logo?: unknown }> | null;
  const brand = node?.brand;
  if (!brand || typeof brand !== 'object') return null;
  const label = typeof brand.label === 'string' && brand.label.trim() ? brand.label.trim().slice(0, MAX_LABEL) : '';
  if (!label) return null;
  const logo = safeHref(brand.logo, base);
  return { label, href: safeHref(brand.to, base), logo: logo && !logo.startsWith('#') ? logo : null };
}
