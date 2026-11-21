// Query the GUI's own graph for the top-bar Search.
//
// The index is the document the shell already declares (`flattenGuiDocument`:
// pages and bar links with a route or `to`) plus the two ThemeLauncher tools
// (Inspector, Grid) that live on the selection store rather than as routes.
// Directory handles and recents are passed in by the caller — this module
// does not fetch. this.me is not called: its public search APIs are vector
// search, and `explain` needs a path you already know.
import { flattenGuiDocument, GUI_DOCUMENT, type GuiDocument, type GuiDocumentEntry } from '@/runtime/guiDocument';

export const SEARCH_GRAPH_MAX = 8;

export type SearchGraphKind = 'page' | 'tool' | 'handle' | 'recent';

export type SearchGraphItem = {
  id: string;
  label: string;
  path: string;
  kind: SearchGraphKind;
  icon: string;
  route?: string;
  tool?: 'grid' | 'inspector';
  handle?: string;
  recent?: boolean;
  avatarSrc?: string | null;
  avatarFallback?: string;
};

export type SearchGraphHandles = {
  username: string;
  profileImg?: string | null;
};

export type SearchGraphSources = {
  recents?: string[];
  handles?: SearchGraphHandles[];
  document?: GuiDocument;
};

const TOOL_ITEMS: SearchGraphItem[] = [
  {
    id: 'GUI.window.layout.bars.left.theme.inspector',
    label: 'Inspector',
    path: 'inspector',
    kind: 'tool',
    icon: 'code',
    tool: 'inspector',
  },
  {
    id: 'GUI.window.layout.bars.left.theme.grid',
    label: 'Grid',
    path: 'grid',
    kind: 'tool',
    icon: 'grid_on',
    tool: 'grid',
  },
];

const ICONS: Record<string, string> = {
  home: 'home',
  landing: 'home',
  users: 'group',
  blockchain: 'hub',
  url: 'link',
  keychain: 'key',
  keys: 'key',
  netget: 'public',
  claim: 'how_to_reg',
  sign: 'draw',
  gui: 'space_dashboard',
  themes: 'palette',
  typography: 'text_fields',
  layout: 'account_tree',
  theme: 'palette',
};

function iconFor(entry: GuiDocumentEntry, dest: string): string {
  if (entry.icon) return entry.icon;
  const leaf = (entry.type || entry.id.split('.').pop() || '').toLowerCase();
  const destLeaf = dest.replace(/\/$/, '').split('/').pop()?.toLowerCase() || '';
  return ICONS[leaf] || ICONS[destLeaf] || 'chevron_right';
}

/** Pages and bar links the document already exposes — not a hand-written catalog. */
export function documentSearchItems(doc: GuiDocument = GUI_DOCUMENT): SearchGraphItem[] {
  const out: SearchGraphItem[] = [];
  const seen = new Set<string>();
  for (const entry of flattenGuiDocument(doc)) {
    const dest = entry.route || entry.to;
    const label = entry.label?.trim();
    if (!dest || !label) continue;
    const key = `${dest.toLowerCase()}::${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: entry.id,
      label,
      path: entry.id,
      kind: 'page',
      icon: iconFor(entry, dest),
      route: dest,
    });
  }
  return out;
}

function handleOf(value: unknown): string {
  return String(value ?? '').trim().replace(/^@+/, '');
}

function recentItems(recents: string[]): SearchGraphItem[] {
  const out: SearchGraphItem[] = [];
  const seen = new Set<string>();
  for (const raw of recents) {
    const handle = handleOf(raw);
    const key = handle.toLowerCase();
    if (!handle || seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `recent:${handle}`,
      label: `@${handle}`,
      path: handle,
      kind: 'recent',
      icon: 'history',
      handle,
      recent: true,
      avatarFallback: handle,
    });
  }
  return out;
}

function handleItems(handles: SearchGraphHandles[], skip: Set<string>): SearchGraphItem[] {
  const out: SearchGraphItem[] = [];
  for (const row of handles) {
    const handle = handleOf(row.username);
    const key = handle.toLowerCase();
    if (!handle || skip.has(key)) continue;
    skip.add(key);
    out.push({
      id: `handle:${handle}`,
      label: `@${handle}`,
      path: handle,
      kind: 'handle',
      icon: 'person',
      handle,
      avatarSrc: row.profileImg,
      avatarFallback: handle,
    });
  }
  return out;
}

// Document ids all live under `GUI.window.layout`, so a raw substring on
// the full path would make "layout" (or "window") match every page. Search
// the label, the route, the handle, and the path after that shared prefix.
function pathHaystack(path: string): string {
  return path.replace(/^GUI\.window\.layout\.(content\.|bars\.)?/i, '');
}

function haystack(item: SearchGraphItem): string {
  return [item.label, pathHaystack(item.path), item.route, item.handle].filter(Boolean).join('\n').toLowerCase();
}

function matches(item: SearchGraphItem, query: string): boolean {
  return haystack(item).includes(query);
}

function score(item: SearchGraphItem, query: string): number {
  const label = item.label.toLowerCase().replace(/^@+/, '');
  const pathLeaf = (item.path.split('.').pop() || '').toLowerCase();
  if (label === query || pathLeaf === query) return 0;
  if (label.startsWith(query) || pathLeaf.startsWith(query)) return 1;
  if (item.handle?.toLowerCase() === query) return 0;
  if (item.handle?.toLowerCase().startsWith(query)) return 1;
  if (item.route?.toLowerCase().includes(query)) return 2;
  return 3;
}

const KIND_ORDER: Record<SearchGraphKind, number> = {
  recent: 0,
  tool: 1,
  page: 2,
  handle: 3,
};

/**
 * Substring, case-insensitive match over path and label (and route / handle).
 * Empty query returns only recents. Capped, recents first, no duplicates.
 */
export function querySearchGraph(
  query: string,
  sources: SearchGraphSources = {},
  max = SEARCH_GRAPH_MAX,
): SearchGraphItem[] {
  const recents = recentItems(sources.recents ?? []);
  const q = query.trim().toLowerCase();
  if (!q) return recents.slice(0, max);

  const skipHandles = new Set(
    recents
      .filter((item) => matches(item, q))
      .map((item) => (item.handle || '').toLowerCase())
      .filter(Boolean),
  );
  const hits = [
    ...recents,
    ...TOOL_ITEMS,
    ...documentSearchItems(sources.document),
    ...handleItems(sources.handles ?? [], skipHandles),
  ].filter((item) => matches(item, q));

  const seen = new Set<string>();
  const ranked = hits
    .map((item, index) => ({ item, index, score: score(item, q), kind: KIND_ORDER[item.kind] }))
    .sort((a, b) => a.score - b.score || a.kind - b.kind || a.index - b.index)
    .map((row) => row.item)
    .filter((item) => {
      const key = item.handle ? `h:${item.handle.toLowerCase()}` : item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return ranked.slice(0, max);
}
