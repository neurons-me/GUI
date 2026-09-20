/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { createPortal } from 'react-dom';
import { RightSidebarContext } from '@/gui-internals/Contexts/RightSidebarContext';
import { useSelection } from './selection';
import { useRuntimeEnvironment } from './runtimeContext';
import CodeBlock from '@/gui/Molecules/CodeBlock/CodeBlock';
import { alpha, getContrastRatio } from '@mui/material/styles';
import { useGuiTheme } from '@/gui-internals/Hooks/useGuiTheme';
import { useDocumentPalette } from './useDocumentPalette';
import { selectionStore } from './selectionStore';
import { findGuiDocumentEntry, flattenGuiDocument } from './guiDocument';
import { around, linkTree } from './inspectorNav';

const DATA_URI_PREFIXES = ['data:', 'blob:'];
const DATA_URI_PREVIEW_CHARS = 32;
const LARGE_STRING_LIMIT = 1024;
const ADMIN_VIEW_SCOPE_KEY = 'gui.runtime.admin.view.scope.v1';
const ADMIN_VIEW_SCOPE_SET_EVENT = 'this.gui:adminView:scope:set';
const ADMIN_VIEW_SCOPE_CHANGED_EVENT = 'this.gui:adminView:scope:changed';
type AdminScopeMode = 'global' | 'scoped';

type TreeEntry = {
  id: string;
  label: string;
  /** false = declared by the GUI but not rendered right now. */
  enabled: boolean;
  /** 'declared' = the GUI registered it; 'dom' = only detected in the page. */
  source: 'declared' | 'dom';
  /** Has an element of its own. */
  hasElement: boolean;
  /**
   * Something that tells same-kind siblings apart (link.0 ... link.4): its
   * aria-label / title, a link's path, a name or placeholder, or its short
   * text -- read from the element. Absent when the node has no element.
   */
  hint: string | null;
  /** 'declared' = the GUI named it; 'guessed' = read off the markup. */
  hintKind: 'declared' | 'guessed' | null;
  /**
   * Actually on the page: an element of its own, or -- for a group like
   * GUI.bars -- one below it. Distinct from `enabled`: a page that is
   * declared and configured but whose route isn't active is enabled and not
   * rendered.
   */
  rendered: boolean;
};
/** One line of the tree diagram. */
type TreeRow =
  | {
      kind: 'node';
      entry: TreeEntry;
      /** Connector guides drawn before the node: '│  ├─ ' etc. */
      prefix: string;
      hasChildren: boolean;
      open: boolean;
    }
  | { kind: 'more'; id: string; prefix: string; count: number };
type TreeView = {
  /** Root -> focus. */
  path: TreeEntry[];
  /** Where you can go from the focus: parent, sibling before / after, first child. */
  around: {
    parent: TreeEntry | null;
    prev: TreeEntry | null;
    next: TreeEntry | null;
    child: TreeEntry | null;
    at: number;
    total: number;
  };
  /** The tree as a diagram: the root, and whatever is expanded below it. */
  rows: TreeRow[];
};
const TREE_ROW_LIMIT = 80;
const TREE_HOVER_ATTR = 'data-gui-inspector-hover';

// Two different things feed this tree, and they are kept apart on purpose:
//  - the GUI's own declarations (the node registry: id, parentId, enabled).
//    The GUI is generative and states its own shape, including parts that
//    exist but are off -- that is the authority.
//  - the DOM, which the GUI does not own (it may be reading a page it didn't
//    generate). Tagged elements that nobody declared are still shown, but as
//    "detected" (source: 'dom'), and only ever fill in what the registry
//    doesn't say: an undeclared node's parent is its nearest tagged DOM
//    ancestor.
// Only the Inspector's own PANEL is left out of the tree. Other things are
// flagged as Inspector controls just so a click on them isn't captured (the
// Theme and Dev Tools launchers, which hold the on/off switch); they are part
// of the page and are on it.
function isInspectorElement(el: Element): boolean {
  return !!el.closest('aside[data-gui-inspector-control="true"]');
}

function findTaggedElement(id: string, nth = 0): HTMLElement | null {
  try {
    const all = document.querySelectorAll<HTMLElement>(`[data-gui-node-id="${CSS.escape(id)}"]`);
    return all[nth] ?? all[0] ?? null;
  } catch {
    return null;
  }
}

function visibleText(el: Element): string {
  let out = '';
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? '';
    } else if (node instanceof HTMLElement) {
      const cls = typeof node.className === 'string' ? node.className : '';
      // Skip icons and anything hidden from assistive tech.
      if (node.getAttribute('aria-hidden') === 'true' || /material|icon/i.test(cls) || /^[a-z]+(_[a-z0-9]+)+$/.test((node.textContent ?? '').trim())) return;
      out += ` ${visibleText(node)} `;
    }
  });
  return out;
}

// What makes THIS one of several similar nodes recognisable. Best signal
// first; never anything that could be typed-in content of a field.
function hintFor(
  el: HTMLElement | undefined,
  label: string,
  declared: string | null
): { text: string | null; kind: 'declared' | 'guessed' | null } {
  // What the GUI itself says this is (the document's `label`, or a
  // data-gui-label the component set) always wins; the rest is a guess.
  if (declared) return { text: declared !== label ? declared : null, kind: declared !== label ? 'declared' : null };
  const guess = guessHint(el, label);
  return { text: guess, kind: guess ? 'guessed' : null };
}

function guessHint(el: HTMLElement | undefined, label: string): string | null {
  if (!el) return null;
  const clean = (v: string | null | undefined) => (v ?? '').replace(/\s+/g, ' ').trim();
  const shorten = (v: string) => (v.length > 28 ? `${v.slice(0, 26)}…` : v);
  let hint = clean(el.getAttribute('aria-label')) || clean(el.getAttribute('title'));
  if (!hint && el.tagName === 'A') {
    const href = el.getAttribute('href');
    if (href) {
      try {
        hint = new URL(href, window.location.href).pathname;
      } catch {
        hint = href;
      }
    }
  }
  if (!hint) hint = clean(el.getAttribute('name')) || clean(el.getAttribute('placeholder'));
  const tag = el.tagName;
  if (!hint && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    // The element's own words, without icon glyphs (a Material icon is text --
    // 'chevron_left', 'dark_mode' -- that would read as a label). A container's
    // whole text is not a name for it: only short text, or a leaf, qualifies.
    const words = clean(visibleText(el));
    if (words && (words.length <= 28 || el.childElementCount === 0)) hint = words;
  }
  if (!hint && el.id && !/^:r/.test(el.id)) hint = `#${el.id}`;
  hint = shorten(hint);
  return hint && hint !== label ? hint : null;
}

// The tree as the Inspector sees it right now: the GUI's declarations plus
// whatever the DOM shows that nobody declared. Built once per refresh and
// shared by the breadcrumb and the query.
export function buildTreeModel() {
  const records = selectionStore.getState().records;

  // First rendered element per tagged id, in DOM order.
  const elements = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-gui-node-id]').forEach((el) => {
    const id = el.getAttribute('data-gui-node-id');
    if (!id || elements.has(id) || isInspectorElement(el)) return;
    elements.set(id, el);
  });

  const nearestTaggedAncestor = (id: string): string | null =>
    elements.get(id)?.parentElement?.closest('[data-gui-node-id]')?.getAttribute('data-gui-node-id') ?? null;

  const docLabels = new Map(flattenGuiDocument().map((e) => [e.id, e.label] as const));
  const indexOf = (ids: string[]) => new Map(ids.map((id, i) => [id, i] as const));
  const docIndex = indexOf(flattenGuiDocument().map((e) => e.id));
  const domIndex = indexOf([...elements.keys()]);
  // mount(spec) names a spec node that has no id of its own `node:<path>`
  // (`node:r` = the root, `node:r.0` = its first child): the app's host chain
  // -- StrictMode, the theme provider, the App component -- React wrappers
  // with no element and no meaning as GUI parts. Not GUI, so not in the tree.
  const isAnonymousHost = (id: string) => id.startsWith('node:');
  const universe = [...new Set([...Object.keys(records), ...elements.keys()])].filter((id) => !isAnonymousHost(id));
  const regIndex = indexOf(universe);
  // A defined, stable order for siblings: the GUI document's own order first
  // (top, sticky, left, right, footer); then position on the page (DOM
  // order); then registration order only as the last tiebreak, since
  // re-registering a node moves it to the end.
  const rank = (id: string) => [docIndex.get(id) ?? Infinity, domIndex.get(id) ?? Infinity, regIndex.get(id) ?? Infinity];
  const byRank = (a: string, b: string) => {
    const ra = rank(a);
    const rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
  };

  // Every parent, once -- strictly: see linkTree (orphans hang from the root).
  const { parents, orphans } = linkTree({
    ids: universe,
    declaredParent: (id) => records[id]?.parentId,
    domParent: nearestTaggedAncestor,
    root: 'GUI',
  });
  const kids = new Map<string, string[]>();
  parents.forEach((parent, child) => {
    if (parent) kids.set(parent, [...(kids.get(parent) ?? []), child]);
  });

  const parentOf = (id: string): string | null => parents.get(id) ?? null;
  const childrenOf = (id: string): string[] => {
    return (kids.get(id) ?? []).filter((c) => c !== id).sort(byRank);
  };

  const entryFor = (id: string): TreeEntry => {
    const rec = records[id];
    const parent = parentOf(id);
    const el = elements.get(id);
    // Relative to the nearest ancestor whose id it extends (a toggle under
    // the header is 'GUI.bars.left.toggle': relative to the bar, not the header).
    let prefixed: string | null = null;
    for (let a: string | null = parent, hops = 0; a && hops < 30; a = parentOf(a), hops++) {
      if (id.startsWith(`${a}.`)) {
        prefixed = id.slice(a.length + 1);
        break;
      }
    }
    const label =
      prefixed
        ? prefixed
        : // A part named after its component (ThemeLauncher.preview.showAll,
          // hung under whatever hosts the launcher): the part's own path.
          rec && id.includes('.')
          ? id.slice(id.indexOf('.') + 1)
          : el?.getAttribute('data-gui-component') || rec?.type || id;
    const hint = hintFor(el, label, docLabels.get(id) || el?.getAttribute('data-gui-label') || null);
    return {
      id,
      label,
      enabled: rec?.enabled !== false,
      source: rec ? 'declared' : 'dom',
      hasElement: !!el,
      hint: hint.text,
      hintKind: hint.kind,
      rendered: !!el || [...elements.keys()].some((k) => k.startsWith(`${id}.`)),
    };
  };

  const typeOf = (id: string): string =>
    records[id]?.type ||
    elements.get(id)?.getAttribute('data-gui-component') ||
    elements.get(id)?.tagName.toLowerCase() ||
    entryFor(id).label;

  return { parentOf, childrenOf, entryFor, typeOf, ids: universe, orphans };
}

function readTreeView(
  selectedId: string | null,
  expanded: Set<string>,
  model = buildTreeModel()
): TreeView | null {
  if (!selectedId) return null;
  const path: TreeEntry[] = [];
  const seen = new Set<string>();
  for (let cursor: string | null = selectedId; cursor && !seen.has(cursor); cursor = model.parentOf(cursor)) {
    seen.add(cursor);
    path.unshift(model.entryFor(cursor));
  }

  // The diagram, drawn like a file tree: connectors in front of each node,
  // only what is expanded is listed.
  const rows: TreeRow[] = [];
  const walk = (id: string, depth: number, guides: boolean[], isLast: boolean) => {
    const kids = model.childrenOf(id);
    const open = expanded.has(id) && kids.length > 0;
    const prefix = depth === 0 ? '' : guides.map((last) => (last ? '   ' : '│  ')).join('') + (isLast ? '└─ ' : '├─ ');
    rows.push({ kind: 'node', entry: model.entryFor(id), prefix, hasChildren: kids.length > 0, open });
    if (!open) return;
    const shown = kids.slice(0, TREE_ROW_LIMIT);
    const childGuides = depth === 0 ? [] : [...guides, isLast];
    shown.forEach((kid, i) => walk(kid, depth + 1, childGuides, i === shown.length - 1 && kids.length <= TREE_ROW_LIMIT));
    if (kids.length > TREE_ROW_LIMIT) {
      rows.push({
        kind: 'more',
        id: `${id}#more`,
        prefix: childGuides.map((last) => (last ? '   ' : '│  ')).join('') + '└─ ',
        count: kids.length - TREE_ROW_LIMIT,
      });
    }
  };
  walk(path[0].id, 0, [], true);
  const nb = around(model, selectedId);
  const entry = (id: string | null) => (id ? model.entryFor(id) : null);
  return {
    path,
    rows,
    around: {
      parent: entry(nb.parent),
      prev: entry(nb.prev),
      next: entry(nb.next),
      child: entry(nb.child),
      at: nb.at,
      total: nb.total,
    },
  };
}

// The piece of the tree a node covers, as JSON: itself and every part below
// it, nested by name. The root covers the whole rendered tree; a leaf covers
// only itself. Capped so a table with hundreds of rows stays readable.
const SUBTREE_MAX_DEPTH = 8;
const SUBTREE_MAX_CHILDREN = 40;
const SUBTREE_MAX_NODES = 400;

function readSubtree(id: string | null, model = buildTreeModel()): Record<string, unknown> | null {
  if (!id) return null;
  let budget = SUBTREE_MAX_NODES;
  const build = (nodeId: string, depth: number): Record<string, unknown> => {
    budget--;
    const e = model.entryFor(nodeId);
    const out: Record<string, unknown> = { type: model.typeOf(nodeId) };
    if (e.hint) out[e.hintKind === 'declared' ? 'label' : 'hint'] = e.hint;
    if (e.source === 'dom') out.source = 'dom';
    if (!e.enabled && !e.rendered) out.state = 'off';
    else if (e.source === 'declared' && !e.rendered) out.state = 'not mounted';
    const kids = model.childrenOf(nodeId);
    if (kids.length === 0) return out;
    if (depth >= SUBTREE_MAX_DEPTH || budget <= 0) {
      out.children = `… ${kids.length} more`;
      return out;
    }
    const children: Record<string, unknown> = {};
    kids.slice(0, SUBTREE_MAX_CHILDREN).forEach((kid) => {
      if (budget <= 0) return;
      const entry = model.entryFor(kid);
      let key = entry.label;
      for (let n = 2; key in children; n++) key = `${entry.label} (${n})`;
      children[key] = build(kid, depth + 1);
    });
    if (kids.length > SUBTREE_MAX_CHILDREN) children['…'] = `${kids.length - SUBTREE_MAX_CHILDREN} more`;
    out.children = children;
    return out;
  };
  return build(id, 0);
}

function treeSignature(view: TreeView | null): string {
  if (!view) return '';
  const key = (e: TreeEntry) => `${e.id}:${e.label}:${e.hint}:${e.enabled}:${e.source}:${e.hasElement}:${e.rendered}`;
  const rowKey = (r: TreeRow) => (r.kind === 'node' ? `${key(r.entry)}|${r.prefix}|${r.hasChildren}|${r.open}` : `${r.id}|${r.count}`);
  return `${view.path.map(key).join('>')}#${view.rows.map(rowKey).join(';')}#${view.around.parent?.id}|${view.around.prev?.id}|${view.around.next?.id}|${view.around.child?.id}|${view.around.at}/${view.around.total}`;
}

// One neighbour of the focus, with its arrow and its NAME -- so it is clear
// where the move goes before you make it. Empty (faint, no name) where there
// is nothing that way. `caption` ("Parent:", "Child:") says what kind of move.
function NavCell({
  dir,
  entry,
  hint,
  caption,
  icon,
  label,
  onGo,
  onHover,
}: {
  dir: 'up' | 'down' | 'left' | 'right' | 'root';
  entry: TreeEntry | null;
  hint: string;
  caption?: string;
  /** Overrides the arrow (the root shortcut uses its own glyph). */
  icon?: string;
  /** Overrides the node name (the root shortcut just says "Root"). */
  label?: string;
  onGo: (entry: TreeEntry) => void;
  onHover: (entry: TreeEntry | null) => void;
}) {
  const arrow = icon ?? { up: '↑', down: '↓', left: '←', right: '→', root: '⤒' }[dir];
  const off = !entry;
  return (
    <button
      type="button"
      disabled={off}
      title={entry ? `${hint}: ${entry.id}` : `${hint} — none`}
      aria-label={hint}
      onClick={() => entry && onGo(entry)}
      onMouseEnter={() => onHover(entry)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        maxWidth: '100%',
        minWidth: 0,
        padding: '2px 8px',
        border: 'none',
        borderRadius: 7,
        background: 'color-mix(in srgb, currentColor 9%, transparent)',
        color: 'inherit',
        fontSize: 11,
        lineHeight: '16px',
        fontFamily: 'inherit',
        cursor: off ? 'default' : 'pointer',
        opacity: off ? 0.3 : 1,
        flexDirection: dir === 'right' ? 'row-reverse' : 'row',
      }}
    >
      {caption && <span style={{ opacity: 0.6 }}>{caption}</span>}
      <span aria-hidden="true" style={{ opacity: 0.75 }}>{arrow}</span>
      {label !== '' && (
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {label ?? (entry ? entry.label : '—')}
        </span>
      )}
    </button>
  );
}

type LayoutInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: string;
  margin: string;
  display: string;
  position: string;
  // Only present for the layout mode that has something to say.
  tracks?: { label: string; value: string }[];
  /** Numbers for the box diagram; sides are [top, right, bottom, left], px. */
  box: {
    margin: number[];
    border: number[];
    padding: number[];
    /** Content box (what is left after border and padding). */
    content: { w: number; h: number };
    /** width/height edits mean the border box when this is true. */
    borderBox: boolean;
  };
};

function boxSides(cs: CSSStyleDeclaration, prop: 'padding' | 'margin'): string {
  const px = (v: string) => String(Math.round(parseFloat(v) || 0));
  return [`${prop}Top`, `${prop}Right`, `${prop}Bottom`, `${prop}Left`]
    .map((k) => px((cs as any)[k]))
    .join(' ');
}

// What the browser actually laid the selected element out as -- measured, not
// declared, so it stays true to what the grid overlay draws around it.
function readLayout(selectedId: string | null): LayoutInfo | null {
  if (!selectedId) return null;
  const host = findTaggedElement(selectedId);
  if (!host) return null;
  const rect = host.getBoundingClientRect();
  const cs = getComputedStyle(host);
  const sides = (prefix: 'margin' | 'padding', suffix = '') =>
    ['Top', 'Right', 'Bottom', 'Left'].map((side) => Math.round(parseFloat((cs as any)[`${prefix}${side}${suffix}`]) || 0));
  const border = ['Top', 'Right', 'Bottom', 'Left'].map((side) => Math.round(parseFloat((cs as any)[`border${side}Width`]) || 0));
  const padding = sides('padding');
  const info: LayoutInfo = {
    box: {
      margin: sides('margin'),
      border,
      padding,
      content: {
        w: Math.max(0, Math.round(rect.width) - padding[1] - padding[3] - border[1] - border[3]),
        h: Math.max(0, Math.round(rect.height) - padding[0] - padding[2] - border[0] - border[2]),
      },
      borderBox: cs.boxSizing === 'border-box',
    },
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    padding: boxSides(cs, 'padding'),
    margin: boxSides(cs, 'margin'),
    display: cs.display,
    position: cs.position,
  };
  if (cs.display.includes('grid')) {
    info.tracks = [
      { label: 'columns', value: cs.gridTemplateColumns },
      { label: 'rows', value: cs.gridTemplateRows },
      { label: 'gap', value: cs.gap },
    ];
  } else if (cs.display.includes('flex')) {
    info.tracks = [
      { label: 'direction', value: cs.flexDirection },
      { label: 'wrap', value: cs.flexWrap },
      { label: 'gap', value: cs.gap },
    ];
  }
  return info;
}

function layoutSignature(info: LayoutInfo | null): string {
  return info ? JSON.stringify(info) : '';
}

// A number that can be typed over: click, type, Enter to apply, Esc to cancel;
// arrows step it (Shift = 10) and apply as you go.
function EditableNum({
  value,
  onCommit,
  title,
  min,
}: {
  value: number;
  onCommit: (next: number) => void;
  title: string;
  min?: number;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const clamp = (n: number) => (min == null ? n : Math.max(min, n));
  if (!editing) {
    return (
      <button
        type="button"
        className="gui-num"
        title={`${title} — click to edit`}
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        style={{ border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', padding: '0 2px', borderRadius: 4, cursor: 'text' }}
      >
        {value}
      </button>
    );
  }
  const finish = (apply: boolean) => {
    setEditing(false);
    const n = Number(draft);
    if (apply && draft.trim() !== '' && Number.isFinite(n) && n !== value) onCommit(clamp(Math.round(n)));
  };
  return (
    <input
      autoFocus
      value={draft}
      inputMode="numeric"
      aria-label={title}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true);
        else if (e.key === 'Escape') finish(false);
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
          const next = clamp((Number(draft) || 0) + step);
          setDraft(String(next));
          onCommit(next);
        }
      }}
      style={{ width: `${Math.max(3, draft.length + 1)}ch`, border: '1px solid currentColor', borderRadius: 4, background: 'transparent', color: 'inherit', font: 'inherit', padding: '0 2px', textAlign: 'center', outline: 'none' }}
    />
  );
}

// The few layout facts that are not in the diagram, and only when they are
// not the default -- a plain block at 0,0 says nothing worth a line.
function layoutMeta(info: LayoutInfo): string[] {
  const out: string[] = [];
  if (info.x || info.y) out.push(`at ${info.x}, ${info.y}`);
  const t = Object.fromEntries((info.tracks ?? []).map((row) => [row.label, row.value]));
  if (info.display.includes('flex')) {
    out.push(`flex ${t.direction ?? 'row'}${t.wrap && t.wrap !== 'nowrap' ? ` ${t.wrap}` : ''}`);
    if (t.gap && t.gap !== 'normal') out.push(`gap ${t.gap}`);
  } else if (info.display.includes('grid')) {
    out.push(`grid ${t.columns ?? ''}`.trim());
    if (t.rows && t.rows !== 'none') out.push(`rows ${t.rows}`);
    if (t.gap && t.gap !== 'normal') out.push(`gap ${t.gap}`);
  } else if (info.display !== 'block') {
    out.push(info.display);
  }
  if (info.position !== 'static') out.push(info.position);
  return out;
}

// The box model as a picture: margin around border around padding around the
// content, each side a number you can edit (a live preview on the element in
// this tab -- nothing is saved).
function BoxModel({
  info,
  ui,
  onEdit,
}: {
  info: LayoutInfo;
  ui: any;
  onEdit: (prop: string, value: number) => void;
}) {
  const { margin, border, padding, content } = info.box;
  const T = 20;
  const sideNames = ['top', 'right', 'bottom', 'left'] as const;
  const ring = (
    kind: 'margin' | 'border' | 'padding',
    values: number[],
    tone: { border: string; bg: string; fg: string },
    editable: boolean,
    children: React.ReactNode,
    dashed = false
  ) => {
    const cell = (i: number, style: React.CSSProperties) => (
      <span style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', width: T, height: T, fontSize: 10, ...style }}>
        {editable ? (
          <EditableNum
            value={values[i]}
            title={`${kind}-${sideNames[i]}`}
            min={kind === 'margin' ? undefined : 0}
            onCommit={(n) => onEdit(`${kind}-${sideNames[i]}`, n)}
          />
        ) : (
          values[i]
        )}
      </span>
    );
    return (
      <div
        style={{
          position: 'relative',
          padding: T,
          borderRadius: 6,
          border: `1px ${dashed ? 'dashed' : 'solid'} ${tone.border}`,
          background: tone.bg,
          color: tone.fg,
        }}
      >
        <span style={{ position: 'absolute', top: 1, left: 4, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7 }}>{kind}</span>
        {cell(0, { top: 0, left: '50%', transform: 'translateX(-50%)' })}
        {cell(2, { bottom: 0, left: '50%', transform: 'translateX(-50%)' })}
        {cell(3, { left: 0, top: '50%', transform: 'translateY(-50%)' })}
        {cell(1, { right: 0, top: '50%', transform: 'translateY(-50%)' })}
        {children}
      </div>
    );
  };
  const hasBorder = border.some((n) => n > 0);
  const contentBox = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        minHeight: 24,
        padding: '2px 6px',
        borderRadius: 4,
        border: `1px solid ${ui.info.border}`,
        background: ui.info.bg,
        color: ui.info.fg,
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
      title={`content box — the element is ${info.width} × ${info.height} with padding and border`}
    >
      <EditableNum value={content.w} title="width" min={0} onCommit={(n) => onEdit('width', n)} />
      <span style={{ opacity: 0.6 }}>×</span>
      <EditableNum value={content.h} title="height" min={0} onCommit={(n) => onEdit('height', n)} />
    </div>
  );
  const inner = ring('padding', padding, ui.success, true, contentBox);
  return ring('margin', margin, ui.warning, true, hasBorder ? ring('border', border, ui.neutral, false, inner) : inner, true);
}

// The HTML behind a node -- only for a node that IS an element. A GUI node
// that is just a group / declared part has nodes below it and no HTML yet, so
// it has none of this. This is the page's own markup, read as-is: detected in
// the DOM, not declared by the GUI.
type HtmlInfo = {
  tag: string;
  id: string | null;
  /** Classes a person of this app chose. */
  classes: string[];
  /**
   * Classes the UI library itself writes (MuiBox-root, css-1x2y3z, ...). GUI
   * wraps MUI in its API, but the markup MUI emits still carries them, so they
   * are shown apart, collapsed, not as the element's own classes.
   */
  frameworkClasses: string[];
  attrs: { name: string; value: string }[];
};
// Identifying attributes only. `value` is deliberately NOT among them: on a
// field it can be what someone is typing (a password).
const HTML_ATTRS = ['name', 'type', 'role', 'aria-label', 'placeholder', 'title', 'for', 'href', 'target', 'alt', 'tabindex', 'disabled', 'checked', 'readonly'];
const FRAMEWORK_CLASS = /^(Mui[A-Za-z0-9_-]*|css-[A-Za-z0-9_-]+|emotion-[A-Za-z0-9_-]+|jss[0-9-]+|sc-[A-Za-z0-9_-]+)$/;

function readHtml(selectedId: string | null): HtmlInfo | null {
  if (!selectedId) return null;
  const el = findTaggedElement(selectedId);
  if (!el) return null;
  // Not the Inspector's own highlight class (gui-inspector-selected ...).
  const all = Array.from(el.classList).filter((c) => !c.startsWith('gui-inspector-'));
  const attrs: HtmlInfo['attrs'] = [];
  for (const name of HTML_ATTRS) {
    if (!el.hasAttribute(name)) continue;
    const raw = el.getAttribute(name) ?? '';
    attrs.push({ name, value: raw.length > 80 ? `${raw.slice(0, 80)}…` : raw });
  }
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classes: all.filter((c) => !FRAMEWORK_CLASS.test(c)),
    frameworkClasses: all.filter((c) => FRAMEWORK_CLASS.test(c)),
    attrs,
  };
}

const PANEL_WIDTH_KEY = 'this.gui:inspectorWidth';
const PANEL_WIDTH_DEFAULT = 440;
const PANEL_WIDTH_MIN = 280;
const PANEL_OPEN_CLASS = 'gui-inspector-split';

function clampPanelWidth(width: number): number {
  const max = Math.max(PANEL_WIDTH_MIN, Math.floor(window.innerWidth * 0.7));
  return Math.min(max, Math.max(PANEL_WIDTH_MIN, Math.round(width)));
}

function readPanelWidth(): number {
  try {
    const raw = Number(localStorage.getItem(PANEL_WIDTH_KEY));
    if (Number.isFinite(raw) && raw > 0) return clampPanelWidth(raw);
  } catch {}
  return PANEL_WIDTH_DEFAULT;
}

// Split layout, not an overlay: while the panel is open the app is squeezed
// into the left part of the window so the GUI stays fully visible next to
// the Inspector instead of being covered by it. The app can't be resized
// through its own layout (position: fixed sidebars, 100vh shells), so <body>
// is narrowed and given a transform, which makes it the containing block of
// every fixed descendant -- they all follow the new width. The panel itself
// is portaled onto <html>, outside <body>, so it is NOT inside that
// containing block and keeps docking to the real viewport edge.
const PANEL_SPLIT_CSS = `
html.${PANEL_OPEN_CLASS} { overflow: hidden; }
html.${PANEL_OPEN_CLASS} > body {
  width: calc(100vw - var(--gui-inspector-width, ${PANEL_WIDTH_DEFAULT}px));
  height: 100vh;
  overflow: auto;
  transform: translateZ(0);
}
`;

function readAdminScopeMode(): AdminScopeMode {
  try {
    const raw = String(localStorage.getItem(ADMIN_VIEW_SCOPE_KEY) || '').toLowerCase();
    return raw === 'scoped' ? 'scoped' : 'global';
  } catch {
    return 'global';
  }
}

function writeAdminScopeMode(mode: AdminScopeMode) {
  try {
    localStorage.setItem(ADMIN_VIEW_SCOPE_KEY, mode);
  } catch {}
}

function truncateString(value: string): string {
  if (DATA_URI_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    const head = value.slice(0, DATA_URI_PREVIEW_CHARS);
    return `${head}… [truncated data uri]`;
  }
  if (value.length > LARGE_STRING_LIMIT) {
    return `${value.slice(0, LARGE_STRING_LIMIT)}… [large string truncated]`;
  }
  return value;
}

function normalizeForInspector(value: any): any {
  if (typeof value === 'string') return truncateString(value);
  return value;
}

function safeStringify(value: any): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(
      value,
      (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
        return normalizeForInspector(v);
      },
      2
    );
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

type InspectorTab = 'spec' | 'resolved' | 'diff';
type ExplainPanelStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';
type ExplainPanelTone = 'ready' | 'warning' | 'redacted' | 'unknown';

type ExplainPanelState = {
  status: ExplainPanelStatus;
  sourcePath: string | null;
  sourceMethod?: string;
  payload?: any;
  inspectMethod?: string;
  inspectPayload?: any;
  error?: string;
};

type ExplainPanelSummary = {
  label: string;
  message: string;
  tone: ExplainPanelTone;
};

type TruthMetric = {
  label: string;
  value: string;
};

type TruthDependency = {
  label: string;
  path: string;
  origin: 'public' | 'stealth';
  masked: boolean;
  valueLabel: string;
};

type TruthTimelineEntry = {
  id: string;
  kind: 'recompute' | 'memory';
  label: string;
  detail: string;
  path?: string;
  operator?: string;
  hash?: string;
  timestamp?: number;
  tone?: 'default' | 'warning' | 'redacted';
};

function isPlainObject(value: any): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const FLATTEN_MAX_DEPTH = 20;

function flattenObject(
  input: any,
  prefix = '',
  out: Record<string, any> = {},
  seen: WeakSet<object> = new WeakSet(),
  depth = 0
): Record<string, any> {
  if (!isPlainObject(input)) {
    out[prefix || '$'] = input;
    return out;
  }
  // Props can carry circular references (DOM nodes, React fibers, class
  // instances with back-pointers) — without cycle detection this recurses
  // until the call stack overflows. depth is a belt-and-suspenders cap for
  // pathologically deep (but acyclic) trees.
  if (seen.has(input) || depth >= FLATTEN_MAX_DEPTH) {
    out[prefix || '$'] = seen.has(input) ? '[Circular]' : '[Max depth exceeded]';
    return out;
  }
  seen.add(input);
  const keys = Object.keys(input);
  if (!keys.length && prefix) out[prefix] = {};
  for (const key of keys) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    const value = input[key];
    if (isPlainObject(value)) {
      flattenObject(value, nextPath, out, seen, depth + 1);
    } else {
      out[nextPath] = value;
    }
  }
  return out;
}

function buildPropsDiff(rawSpec: any, resolvedProps: any) {
  const specProps = isPlainObject(rawSpec?.props) ? rawSpec.props : {};
  const flatSpec = flattenObject(specProps);
  const flatResolved = flattenObject(isPlainObject(resolvedProps) ? resolvedProps : {});
  const normalizeFlat = (input: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      out[key] = normalizeForInspector(input[key]);
    }
    return out;
  };
  const normalizedSpec = normalizeFlat(flatSpec);
  const normalizedResolved = normalizeFlat(flatResolved);

  const added: Record<string, any> = {};
  const removed: Record<string, any> = {};
  const changed: Record<string, { from: any; to: any }> = {};

  for (const key of Object.keys(normalizedResolved)) {
    if (!(key in normalizedSpec)) {
      added[key] = normalizedResolved[key];
      continue;
    }
    const a = normalizedSpec[key];
    const b = normalizedResolved[key];
    // flattenObject only recurses into plain objects, so a leaf value here
    // can still be an array (or another non-plain-object) carrying a
    // circular reference — safeStringify (cycle-guarded, never throws) is
    // required here; a bare JSON.stringify crashed the whole inspector on
    // exactly this shape (RangeError / "Converting circular structure to JSON").
    if (safeStringify(a) !== safeStringify(b)) {
      changed[key] = { from: a, to: b };
    }
  }

  for (const key of Object.keys(normalizedSpec)) {
    if (!(key in normalizedResolved)) {
      removed[key] = normalizedSpec[key];
    }
  }

  return {
    summary: {
      added: Object.keys(added).length,
      removed: Object.keys(removed).length,
      changed: Object.keys(changed).length,
    },
    added,
    removed,
    changed,
  };
}

function normalizeExplainPathValue(value: any): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (raw.startsWith('me://')) {
    const target = raw.slice('me://'.length);
    const slashIndex = target.indexOf('/');
    if (slashIndex >= 0) {
      const path = target.slice(slashIndex + 1).trim();
      if (path) return path.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
    }
    return target.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
  }

  if (raw.startsWith('me/')) {
    return raw.slice('me/'.length).trim().replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
  }

  return raw.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
}

function resolveExplainPath(provenance: any): string | null {
  const direct = normalizeExplainPathValue(provenance?.explainPath);
  if (direct) return direct;

  const semantic = normalizeExplainPathValue(provenance?.semanticPath);
  if (semantic) return semantic;

  const binding = String(provenance?.binding || '').trim();
  if (binding.startsWith('me/') || binding.startsWith('me://')) {
    return normalizeExplainPathValue(binding);
  }

  return null;
}

function hasProvenanceContract(provenance: any): boolean {
  return !!provenance && typeof provenance === 'object' && Object.keys(provenance).length > 0;
}

function describeExplainGap(provenance: any): string {
  if (!hasProvenanceContract(provenance)) {
    return 'This node has no provenance contract yet. Add `provenance.semanticPath` or `provenance.explainPath` to make it explainable.';
  }

  return 'This node has provenance metadata, but it does not point at a kernel path yet. Add `provenance.semanticPath` or `provenance.explainPath` to make Explain available.';
}

function hasKernelExplain(me: any): boolean {
  if (!me) return false;
  if (typeof me?.explain === 'function') return true;
  if (typeof me?.execute === 'function') return true;
  if (typeof me?.['!']?.explain === 'function') return true;
  return false;
}

async function requestKernelExplain(
  me: any,
  path: string
): Promise<{ method: string; payload: any }> {
  if (typeof me?.explain === 'function') {
    return {
      method: 'me.explain(path)',
      payload: await Promise.resolve(me.explain(path)),
    };
  }

  if (typeof me?.['!']?.explain === 'function') {
    return {
      method: "me['!'].explain(path)",
      payload: await Promise.resolve(me['!'].explain(path)),
    };
  }

  if (typeof me?.execute === 'function') {
    return {
      method: 'me.execute(self:explain/...)',
      payload: await Promise.resolve(me.execute(`self:explain/${path}`)),
    };
  }

  throw new Error('No explain-capable `.me` kernel is attached to this mount.');
}

async function requestKernelInspect(
  me: any,
  path: string
): Promise<{ method: string; payload: any }> {
  if (typeof me?.execute === 'function') {
    return {
      method: 'me.execute(self:inspect/...)',
      payload: await Promise.resolve(
        me.execute({
          scheme: 'me',
          namespace: 'self',
          operation: 'inspect',
          path,
          raw: `me://self:inspect/${path}`,
          contextRaw: null,
        })
      ),
    };
  }

  if (typeof me?.inspect === 'function') {
    return {
      method: 'me.inspect() [client-scoped]',
      payload: await Promise.resolve(me.inspect()),
    };
  }

  if (typeof me?.['!']?.inspect === 'function') {
    return {
      method: "me['!'].inspect() [client-scoped]",
      payload: await Promise.resolve(me['!'].inspect()),
    };
  }

  throw new Error('No inspect-capable `.me` kernel is attached to this mount.');
}

function summarizeExplainPayload(payload: any, provenance: any): ExplainPanelSummary {
  const maskedInputs = Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs.filter((input: any) => Boolean(input?.masked)).length
    : 0;

  // "Stealth Dependencies Masked" describes a fact the kernel's own response
  // actually contains -- derivation.ts's explain() marks individual
  // derivation INPUTS with `masked: true` when they resolve inside a secret
  // scope (see resolveBranchScope/pathStartsWith there). That fact stands on
  // its own regardless of whether the node's own top-level `value` happens
  // to be present or not -- a derivation can have masked inputs and still
  // compute a public result, so this no longer requires `value === undefined`
  // to fire (that co-occurrence was never something the kernel actually
  // asserted; it was this file inferring a link the payload doesn't make).
  if (maskedInputs > 0) {
    return {
      label: 'Stealth Dependencies Masked',
      message:
        maskedInputs === 1
          ? 'One dependency was masked by the kernel while explaining this node.'
          : `${maskedInputs} dependencies were masked by the kernel while explaining this node.`,
      tone: 'warning',
    };
  }

  // Beyond that, the kernel's explain() contract has no field anywhere that
  // marks the primary `value` itself as redacted -- for a plain
  // (non-derived) path it returns `value: self.readPath(target)` verbatim,
  // with nothing distinguishing "this path is under a secret scope" from
  // "this path simply has no local value yet" (confirmed by reading its
  // early-return branch directly). `provenance.policy` is metadata THIS
  // component's author wrote, not something the kernel declared, so it
  // can't stand in for that missing signal either. Until the kernel's own
  // explain() contract adds a real field for this, "Value Not Available" is
  // the only honest label for `value === undefined` — anything more
  // specific would be inventing a cause the response doesn't support.
  if (payload?.value === undefined) {
    return {
      label: 'Value Not Available',
      message:
        'The kernel returned no value for this path, and nothing in the response says why -- it may not be set on this kernel instance yet, or it may be under a secret scope the current contract can\'t distinguish. Compare a direct local read against a confirmed server read to narrow it down.',
      tone: 'unknown',
    };
  }

  if (payload?.derivation) {
    return {
      label: 'Causality Resolved',
      message: 'The kernel returned derivation metadata, dependencies, and recompute context for this node.',
      tone: 'ready',
    };
  }

  return {
    label: 'Direct Memory Read',
    message: 'The kernel resolved the path directly without an active derivation record.',
    tone: 'ready',
  };
}

function shortHash(value: any): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.length <= 8 ? raw : raw.slice(0, 8);
}

function formatAbsoluteTime(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Unknown time';
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return String(timestamp);
  }
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) return 'unknown';
  const diff = timestamp - Date.now();
  const abs = Math.abs(diff);
  const rtf =
    typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function'
      ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
      : null;

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ];

  for (const [unit, size] of units) {
    if (abs >= size || unit === 'second') {
      const value = Math.round(diff / size);
      if (rtf) return rtf.format(value, unit);
      return `${Math.abs(value)} ${unit}${Math.abs(value) === 1 ? '' : 's'} ${value < 0 ? 'ago' : 'from now'}`;
    }
  }

  return 'just now';
}

function formatValueLabel(value: any): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

function matchesTruthPath(candidate: string, focus: string): boolean {
  if (!candidate || !focus) return false;
  return (
    candidate === focus ||
    candidate.startsWith(`${focus}.`) ||
    focus.startsWith(`${candidate}.`)
  );
}

function getDependencyPaths(payload: any): string[] {
  return Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs
        .map((input: any) => String(input?.path || '').trim())
        .filter(Boolean)
    : [];
}

function getRelevantMemoryPool(payload: any, inspectPayload: any, explainPath: string | null): any[] {
  const dependencyPaths = getDependencyPaths(payload);
  const pool = Array.isArray(inspectPayload?.memories) ? inspectPayload.memories : [];
  return pool.filter((memory: any) => {
    const path = String(memory?.path || '').trim();
    if (!path) return false;
    if (explainPath && matchesTruthPath(path, explainPath)) return true;
    return dependencyPaths.some((dependencyPath) => matchesTruthPath(path, dependencyPath));
  });
}

function buildTruthDependencies(payload: any): TruthDependency[] {
  const inputs = Array.isArray(payload?.derivation?.inputs) ? payload.derivation.inputs : [];
  return inputs.map((input: any, index: number) => ({
    label: String(input?.label || `input_${index + 1}`),
    path: String(input?.path || ''),
    origin: input?.origin === 'stealth' ? 'stealth' : 'public',
    masked: Boolean(input?.masked),
    valueLabel: input?.masked ? '●●●●' : formatValueLabel(input?.value),
  }));
}

function buildTruthMetrics(payload: any, inspectPayload: any, explainPath: string | null): TruthMetric[] {
  const dependencies = Array.isArray(payload?.derivation?.inputs) ? payload.derivation.inputs.length : 0;
  const masked = Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs.filter((input: any) => Boolean(input?.masked)).length
    : 0;
  const memories = getRelevantMemoryPool(payload, inspectPayload, explainPath).length;
  const mode = inspectPayload?.recomputeMode ?? 'unknown';

  return [
    { label: 'Dependencies (k)', value: String(dependencies) },
    { label: 'Masked', value: String(masked) },
    { label: 'Memories', value: String(memories) },
    { label: 'Mode', value: String(mode) },
  ];
}

function buildShieldMessage(payload: any, inspectPayload: any, explainPath: string | null): string | null {
  const secretScopes = Array.isArray(inspectPayload?.secretScopes)
    ? inspectPayload.secretScopes.filter((scope: any) =>
        explainPath ? matchesTruthPath(String(scope || '').trim(), explainPath) : Boolean(scope)
      )
    : [];
  const encryptedScopes = Array.isArray(inspectPayload?.encryptedScopes)
    ? inspectPayload.encryptedScopes.filter((scope: any) =>
        explainPath ? matchesTruthPath(String(scope || '').trim(), explainPath) : Boolean(scope)
      )
    : [];
  const masked = Array.isArray(payload?.derivation?.inputs)
    ? payload.derivation.inputs.some((input: any) => Boolean(input?.masked))
    : false;

  if (payload?.value === undefined && (secretScopes.length > 0 || encryptedScopes.length > 0 || masked)) {
    return 'This node is currently under kernel stealth. The UI is rendering the public absence, not bypassing the policy.';
  }

  if (masked) {
    return 'The kernel revealed the lineage, but one or more dependencies remain masked behind secret scope policy.';
  }

  if (secretScopes.length > 0 || encryptedScopes.length > 0) {
    return 'This scope intersects encrypted or secret branches managed by the kernel.';
  }

  return null;
}

function buildTruthTimeline(payload: any, inspectPayload: any, explainPath: string | null): TruthTimelineEntry[] {
  const entries: TruthTimelineEntry[] = [];
  const lastComputedAt = payload?.meta?.lastComputedAt;
  if (lastComputedAt && Number.isFinite(lastComputedAt)) {
    entries.push({
      id: `recompute:${lastComputedAt}`,
      kind: 'recompute',
      label: 'Derivation recomputed',
      detail: `${formatRelativeTime(lastComputedAt)} at ${formatAbsoluteTime(lastComputedAt)}`,
      timestamp: lastComputedAt,
    });
  }

  const dependencyPaths = new Set<string>(getDependencyPaths(payload));
  const memoryPool = getRelevantMemoryPool(payload, inspectPayload, explainPath);

  const scored = memoryPool
    .map((memory: any) => {
      const path = String(memory?.path || '').trim();
      let priority = 0;
      if (explainPath && path === explainPath) priority = 3;
      else if (dependencyPaths.has(path)) priority = 2;
      else if (explainPath && path.startsWith(`${explainPath}.`)) priority = 1;
      return { memory, path, priority };
    })
    .filter((entry) => entry.priority > 0)
    .sort((a, b) => {
      const aTs = Number(a.memory?.timestamp || 0);
      const bTs = Number(b.memory?.timestamp || 0);
      if (b.priority !== a.priority) return b.priority - a.priority;
      return bTs - aTs;
    })
    .slice(0, 8);

  for (const { memory, path, priority } of scored) {
    const timestamp = Number(memory?.timestamp || 0);
    const operator = String(memory?.operator || 'set');
    const pathLabel = path || '(root)';
    const focusLabel =
      priority === 3 ? 'Target memory' : priority === 2 ? 'Dependency memory' : 'Scoped memory';
    entries.push({
      id: `memory:${String(memory?.hash || `${pathLabel}:${timestamp}`)}`,
      kind: 'memory',
      label: focusLabel,
      detail: `${operator} on ${pathLabel} ${timestamp ? `${formatRelativeTime(timestamp)} at ${formatAbsoluteTime(timestamp)}` : ''}`.trim(),
      path: pathLabel,
      operator,
      hash: shortHash(memory?.hash) || undefined,
      timestamp: timestamp || undefined,
      tone: priority === 2 ? 'warning' : 'default',
    });
  }

  return entries;
}

export function RuntimeInspector({
  toggleVisible = false,
}: {
  toggleVisible?: boolean;
}) {
  const { me } = useRuntimeEnvironment();
  const {
    inspectorEnabled,
    setInspectorEnabled,
    gridEnabled,
    setGridEnabled,
    selectedNodeId,
    selected: selectedRecord,
    selectNode,
    clearSelection,
    selectedMeta,
    setSelectedMeta,
    getNode,
    getNodeByPath,
  } = useSelection();
  const rightSidebar = React.useContext(RightSidebarContext);
  // A node nobody registered (its element is only tagged) still has a JSON to
  // show: what the page says about it. Read from the element, never stored,
  // and never a field's value.
  const selected = React.useMemo(() => {
    if (selectedRecord || !selectedNodeId) return selectedRecord;
    const html = readHtml(selectedNodeId);
    const el = findTaggedElement(selectedNodeId);
    if (!html || !el) return selectedRecord;
    const type = el.getAttribute('data-gui-component') || html.tag;
    const props: Record<string, unknown> = { tag: html.tag };
    if (html.id) props.id = html.id;
    if (html.classes.length) props.class = html.classes.join(' ');
    html.attrs.forEach((a) => (props[a.name] = a.value === '' ? true : a.value));
    const label = el.getAttribute('data-gui-label');
    if (label) props.label = label;
    return {
      id: selectedNodeId,
      type,
      path: selectedNodeId,
      spec: { type, props },
      resolvedProps: props,
    } as any;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecord, selectedNodeId]);
  const theme = useGuiTheme();
  const docPalette = useDocumentPalette();
  // Every color in this panel comes from the active theme's palette, so it
  // follows theme + light/dark switches like the rest of the app. Fallbacks
  // are the old hard-coded dark-navy values, used only if no palette exists
  // (a bare mount outside <Theme>).
  const ui = React.useMemo(() => {
    const p: any = docPalette ?? theme?.palette;
    const dark = (p?.mode ?? 'dark') === 'dark';
    const text = p?.text?.primary ?? '#e5e7eb';
    const tone = (key: string, fallback: string) => {
      const main = p?.[key]?.main ?? fallback;
      return {
        border: alpha(main, 0.45),
        bg: alpha(main, dark ? 0.16 : 0.1),
        fg: (dark ? p?.[key]?.light : p?.[key]?.dark) ?? main,
      };
    };
    // Highlight/grid accent: the first theme color that actually reads
    // against the PAGE background (primary is often a dark brand color that
    // vanishes on a dark theme -- Seafoam's does). Falls back to whichever
    // candidate has the best contrast.
    const pageBg = p?.background?.default ?? p?.background?.paper ?? '#0b1220';
    const candidates = [p?.primary?.main, p?.primary?.light, p?.secondary?.main, p?.secondary?.light, p?.info?.main].filter(Boolean) as string[];
    let accent = candidates[0] ?? '#3b82f6';
    let bestRatio = 0;
    for (const c of candidates) {
      let ratio = 0;
      try { ratio = getContrastRatio(c, pageBg); } catch { continue; }
      if (ratio >= 3) { accent = c; break; }
      if (ratio > bestRatio) { bestRatio = ratio; accent = c; }
    }
    return {
      accent,
      bg: p?.background?.paper ?? '#0b1220',
      fg: text,
      fgMuted: p?.text?.secondary ?? 'rgba(229,231,235,0.75)',
      line: p?.divider ?? alpha(text, 0.12),
      lineStrong: alpha(text, 0.28),
      fillFaint: alpha(text, 0.04),
      fillSoft: alpha(text, 0.07),
      fillHover: alpha(text, 0.1),
      fillActive: alpha(text, 0.16),
      primary: p?.primary?.main ?? '#3b82f6',
      primaryContrast: p?.primary?.contrastText ?? '#fff',
      error: tone('error', '#f87171'),
      warning: tone('warning', '#fbbf24'),
      info: tone('info', '#60a5fa'),
      success: tone('success', '#4ade80'),
      neutral: {
        border: alpha(text, 0.28),
        bg: alpha(text, 0.07),
        fg: p?.text?.secondary ?? '#cbd5e1',
      },
    };
  }, [theme, docPalette]);
  const codeVariant = (docPalette?.mode ?? theme?.palette?.mode) === 'light' ? 'light' : 'dark';
  const [tab, setTab] = React.useState<InspectorTab>('spec');
  const [adminScopeMode, setAdminScopeMode] = React.useState<AdminScopeMode>(() => readAdminScopeMode());
  const lastHighlighted = React.useRef<HTMLElement | null>(null);
  const highlightClass = 'gui-inspector-selected';
  const lastInspectorEnabled = React.useRef<boolean>(inspectorEnabled);

  const getLabel = React.useCallback((el: HTMLElement) => {
    const dataName = el.getAttribute('data-gui-component');
    if (dataName) return dataName;
    return el.tagName.toLowerCase();
  }, []);

  const buildResolvedPath = React.useCallback(
    (start: HTMLElement, host: HTMLElement) => {
      const path: string[] = [];
      let current: HTMLElement | null = start;
      while (current) {
        path.unshift(getLabel(current));
        if (current === host) break;
        current = current.parentElement;
      }
      return path;
    },
    [getLabel]
  );

  const resolveNodeId = React.useCallback(
    (rawId?: string | null) => {
      if (!rawId) return null;
      let resolvedId = rawId;
      if (!getNode(resolvedId)) {
        const parts = rawId.split(':');
        const path = parts.length > 1 ? parts.slice(1).join(':') : '';
        const fallback = getNodeByPath(path);
        if (fallback?.id) resolvedId = fallback.id;
      }
      return resolvedId;
    },
    [getNode, getNodeByPath]
  );

  const selectHostElement = React.useCallback(
    (host: HTMLElement, metaFrom?: HTMLElement | null) => {
      const rawId = host.getAttribute('data-gui-node-id');
      const resolvedId = resolveNodeId(rawId);
      if (!resolvedId) return false;
      selectNode(resolvedId);
      const metaSource = metaFrom ?? host;
      setSelectedMeta({
        elementTag: metaSource.tagName.toLowerCase(),
        resolvedTag: host.tagName.toLowerCase(),
        resolvedPath: buildResolvedPath(metaSource, host),
        domComponentAttr: host.getAttribute('data-gui-component') || undefined,
      });
      rightSidebar?.setView?.('expanded');
      return true;
    },
    [resolveNodeId, selectNode, setSelectedMeta, buildResolvedPath, rightSidebar]
  );

  // Turning the Inspector ON with nothing selected starts at the tree's root
  // instead of leaving the first click to land on whatever child is closest
  // (the outermost node wraps everything, so that was almost never it and
  // reaching it meant "Select parent" up the whole chain). "Root" here is
  // the same thing Alt+click's "topmost" means: a tagged element with no
  // tagged ancestor in the DOM -- deliberately NOT derived from the
  // registry's parentId links, which only some nodes declare (a layout's
  // own internal registrations look like parentless "roots" too). Only
  // acted on when that is unambiguous (exactly one such element); anything
  // else leaves behavior exactly as before. Only on an off -> on transition
  // after mount, never on initial load: an inspector that starts enabled
  // (mount()'s `inspector: true`) must not pop its panel open on every
  // page view.
  const prevInspectorEnabledRef = React.useRef<boolean>(inspectorEnabled);
  React.useEffect(() => {
    const wasEnabled = prevInspectorEnabledRef.current;
    prevInspectorEnabledRef.current = inspectorEnabled;
    if (!inspectorEnabled || wasEnabled) return;
    if (selectedNodeId) return;

    const topmost = Array.from(document.querySelectorAll<HTMLElement>('[data-gui-node-id]')).filter(
      (el) => !el.parentElement?.closest('[data-gui-node-id]') && !el.closest('[data-gui-inspector-control="true"]')
    );
    if (topmost.length === 1) selectHostElement(topmost[0], topmost[0]);
  }, [inspectorEnabled]);

  const getSelectedHostElement = React.useCallback(() => {
    if (!selectedNodeId) return null;
    let host: HTMLElement | null = null;
    try {
      host = document.querySelector(
        `[data-gui-node-id="${CSS.escape(selectedNodeId)}"]`
      ) as HTMLElement | null;
    } catch {
      host = document.querySelector(
        `[data-gui-node-id="${selectedNodeId}"]`
      ) as HTMLElement | null;
    }
    return host;
  }, [selectedNodeId]);

  const findNearestChildNode = React.useCallback((root: HTMLElement) => {
    const queue: HTMLElement[] = Array.from(root.children) as HTMLElement[];
    while (queue.length) {
      const node = queue.shift();
      if (!node) continue;
      if (node.hasAttribute('data-gui-node-id')) return node;
      queue.push(...Array.from(node.children) as HTMLElement[]);
    }
    return null;
  }, []);

  const open = inspectorEnabled && !!selectedNodeId;

  const [treeView, setTreeView] = React.useState<TreeView | null>(null);
  const [layoutInfo, setLayoutInfo] = React.useState<LayoutInfo | null>(null);
  const [htmlInfo, setHtmlInfo] = React.useState<HtmlInfo | null>(null);
  const [subtree, setSubtree] = React.useState<Record<string, unknown> | null>(null);
  const [showFrameworkClasses, setShowFrameworkClasses] = React.useState(false);
  // The HTML card is collapsed unless someone opens it (and remembers that).
  const [htmlOpen, setHtmlOpenState] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('this.gui:inspectorHtmlOpen') === '1';
    } catch {
      return false;
    }
  });
  const setHtmlOpen = React.useCallback((open: boolean) => {
    setHtmlOpenState(open);
    try {
      localStorage.setItem('this.gui:inspectorHtmlOpen', open ? '1' : '0');
    } catch {}
  }, []);
  // Which nodes of the tree diagram are open. The focus and its ancestors are
  // always opened when the focus moves (so its children show); anything else
  // opens and closes only when asked.
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  React.useEffect(() => {
    if (!open) {
      setTreeView(null);
      setLayoutInfo(null);
      setHtmlInfo(null);
      setSubtree(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSig = '\0';
    let lastLayoutSig = '\0';
    let lastHtmlSig = '\0';
    let lastSubtreeSig = '\0';
    const refresh = () => {
      const model = buildTreeModel();
      const next = readTreeView(selectedNodeId, expanded, model);
      const sig = treeSignature(next);
      if (sig !== lastSig) {
        lastSig = sig;
        setTreeView(next);
      }
      const sub = readSubtree(selectedNodeId, model);
      const subSig = sub ? JSON.stringify(sub) : '';
      if (subSig !== lastSubtreeSig) {
        lastSubtreeSig = subSig;
        setSubtree(sub);
      }
      const html = readHtml(selectedNodeId);
      const htmlSig = html ? JSON.stringify(html) : '';
      if (htmlSig !== lastHtmlSig) {
        lastHtmlSig = htmlSig;
        setHtmlInfo(html);
      }
      const layout = readLayout(selectedNodeId);
      const layoutSig = layoutSignature(layout);
      if (layoutSig !== lastLayoutSig) {
        lastLayoutSig = layoutSig;
        setLayoutInfo(layout);
      }
    };
    refresh();
    // The page keeps changing under the panel (route changes, live data), so
    // re-read on DOM mutations -- debounced, and only committed to state when
    // the tree's shape actually differs. <body> only: the panel itself lives
    // on <html>, so its own updates never feed back into this observer.
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-gui-node-id', 'data-gui-component'],
    });
    // Geometry changes without any DOM mutation (window or panel resized,
    // CSS transitions), so watch the element's own box and the viewport too.
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    };
    // The GUI's own declarations changing (a part turned on/off, registered,
    // withdrawn) is not a DOM event at all.
    const unsubscribeStore = selectionStore.subscribe(scheduleRefresh);
    const host = selectedNodeId ? findTaggedElement(selectedNodeId) : null;
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleRefresh) : null;
    if (host) resizeObserver?.observe(host);
    window.addEventListener('resize', scheduleRefresh);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      unsubscribeStore();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleRefresh);
    };
  }, [open, selectedNodeId, expanded]);

  const focusPathKey = treeView ? treeView.path.map((e) => e.id).join('>') : '';
  React.useEffect(() => {
    if (!treeView) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      treeView.path.forEach((e) => next.add(e.id));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPathKey]);
  const toggleExpanded = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  // Live edits from the box diagram. They write an inline style on the
  // element in THIS tab, remembering what was there so Reset can put it back.
  // Nothing is saved and the GUI document is not touched.
  const originalStyles = React.useRef(new Map<HTMLElement, Map<string, string>>());
  const [, setEditTick] = React.useState(0);
  const editLayout = React.useCallback(
    (prop: string, value: number) => {
      const el = selectedNodeId ? findTaggedElement(selectedNodeId) : null;
      if (!el || !Number.isFinite(value)) return;
      let px = value;
      const b = layoutInfo?.box;
      if (b?.borderBox && (prop === 'width' || prop === 'height')) {
        // The diagram shows the CONTENT box; a border-box element's width is
        // the whole box, so add padding and border back.
        px += prop === 'width' ? b.padding[1] + b.padding[3] + b.border[1] + b.border[3] : b.padding[0] + b.padding[2] + b.border[0] + b.border[2];
      }
      let saved = originalStyles.current.get(el);
      if (!saved) {
        saved = new Map();
        originalStyles.current.set(el, saved);
      }
      if (!saved.has(prop)) saved.set(prop, el.style.getPropertyValue(prop));
      el.style.setProperty(prop, `${px}px`);
      setLayoutInfo(readLayout(selectedNodeId));
      setEditTick((t) => t + 1);
    },
    [selectedNodeId, layoutInfo]
  );
  const resetLayout = React.useCallback(() => {
    const el = selectedNodeId ? findTaggedElement(selectedNodeId) : null;
    const saved = el ? originalStyles.current.get(el) : null;
    if (!el || !saved) return;
    saved.forEach((original, prop) => (original ? el.style.setProperty(prop, original) : el.style.removeProperty(prop)));
    originalStyles.current.delete(el);
    setLayoutInfo(readLayout(selectedNodeId));
    setEditTick((t) => t + 1);
  }, [selectedNodeId]);
  const layoutEdited = (() => {
    const el = selectedNodeId ? findTaggedElement(selectedNodeId) : null;
    return !!el && originalStyles.current.has(el);
  })();

  const treeBoxRef = React.useRef<HTMLDivElement>(null);
  // Keep the focused row in view as the focus moves.
  React.useEffect(() => {
    treeBoxRef.current?.querySelector('[data-tree-focus="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedNodeId, treeView]);

  const hoveredTreeEl = React.useRef<HTMLElement | null>(null);
  const hoverTreeNode = React.useCallback((entry: TreeEntry | null) => {
    hoveredTreeEl.current?.removeAttribute(TREE_HOVER_ATTR);
    hoveredTreeEl.current = null;
    if (!entry) return;
    const el = findTaggedElement(entry.id);
    if (!el) return;
    el.setAttribute(TREE_HOVER_ATTR, '');
    hoveredTreeEl.current = el;
  }, []);
  React.useEffect(() => () => hoverTreeNode(null), [hoverTreeNode]);

  const selectTreeNode = React.useCallback(
    (entry: TreeEntry) => {
      hoverTreeNode(null);
      const el = findTaggedElement(entry.id);
      if (el) {
        selectHostElement(el, el);
        return;
      }
      // A declared part with nothing rendered (an off bar, a group like
      // GUI.bars): selectable by id, there is just no element behind it.
      selectNode(entry.id);
      setSelectedMeta(null);
    },
    [hoverTreeNode, selectHostElement, selectNode, setSelectedMeta]
  );

  // Arrow keys walk the diagram like any tree widget: up/down through the
  // visible rows, right to open (then step into the first child), left to
  // close (then step out to the parent).
  const onTreeKeyDown = React.useCallback(
    (ev: React.KeyboardEvent) => {
      if (!treeView) return;
      const nodes = treeView.rows.filter((r): r is Extract<TreeRow, { kind: 'node' }> => r.kind === 'node');
      const at = nodes.findIndex((r) => r.entry.id === selectedNodeId);
      if (at < 0) return;
      const row = nodes[at];
      let target: TreeEntry | null = null;
      switch (ev.key) {
        case 'ArrowDown': target = nodes[at + 1]?.entry ?? null; break;
        case 'ArrowUp': target = nodes[at - 1]?.entry ?? null; break;
        case 'Home': target = nodes[0].entry; break;
        case 'End': target = nodes[nodes.length - 1].entry; break;
        case 'ArrowRight':
          if (row.hasChildren && !row.open) toggleExpanded(row.entry.id);
          else if (row.open) target = nodes[at + 1]?.entry ?? null;
          break;
        case 'ArrowLeft':
          if (row.open) toggleExpanded(row.entry.id);
          else target = treeView.path.length > 1 && treeView.path[treeView.path.length - 1].id === row.entry.id
            ? treeView.path[treeView.path.length - 2]
            : nodes.slice(0, at).reverse().find((r) => r.prefix.length < row.prefix.length)?.entry ?? null;
          break;
        default:
          return;
      }
      ev.preventDefault();
      if (target) selectTreeNode(target);
    },
    [treeView, selectedNodeId, toggleExpanded, selectTreeNode]
  );

  const imagePreviews = React.useMemo(() => {
    const results: { path: string; src: string }[] = [];
    const maxDepth = 6;
    const maxResults = 6;
    const maxKeys = 200;

    const isImageLike = (value: string, keyHint?: string) => {
      if (value.startsWith('data:image/')) return true;
      if (value.startsWith('blob:')) return true;
      if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
        if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value)) return true;
        if (keyHint && /image|img|icon|avatar|badge|src/i.test(keyHint)) return true;
      }
      return false;
    };

    const walk = (node: any, path: string[], depth: number) => {
      if (results.length >= maxResults) return;
      if (depth > maxDepth || !node) return;
      if (typeof node === 'string') {
        const keyHint = path[path.length - 1];
        if (isImageLike(node, keyHint)) {
          results.push({ path: path.join('.'), src: node });
        }
        return;
      }
      if (Array.isArray(node)) {
        const limit = Math.min(node.length, 25);
        for (let i = 0; i < limit; i += 1) {
          walk(node[i], [...path, String(i)], depth + 1);
          if (results.length >= maxResults) return;
        }
        return;
      }
      if (typeof node === 'object') {
        const keys = Object.keys(node).slice(0, maxKeys);
        for (const key of keys) {
          walk(node[key], [...path, key], depth + 1);
          if (results.length >= maxResults) return;
        }
      }
    };

    walk(selected?.resolvedProps ?? null, [], 0);
    return results;
  }, [selected?.resolvedProps]);

  React.useEffect(() => {
    const onExternalInspectorSet = (ev: Event) => {
      const custom = ev as CustomEvent<{ enabled?: boolean }>;
      const nextEnabled = custom?.detail?.enabled;
      if (typeof nextEnabled !== 'boolean') return;
      setInspectorEnabled(nextEnabled);
      if (!nextEnabled) {
        clearSelection();
      }
    };

    window.addEventListener('this.gui:inspector:set', onExternalInspectorSet as EventListener);
    return () => {
      window.removeEventListener('this.gui:inspector:set', onExternalInspectorSet as EventListener);
    };
  }, [clearSelection, setInspectorEnabled]);

  React.useEffect(() => {
    const onScopeChanged = (ev: Event) => {
      const custom = ev as CustomEvent<{ mode?: AdminScopeMode }>;
      const nextMode = custom?.detail?.mode;
      if (nextMode === 'scoped' || nextMode === 'global') {
        setAdminScopeMode(nextMode);
      }
    };
    window.addEventListener(ADMIN_VIEW_SCOPE_CHANGED_EVENT, onScopeChanged as EventListener);
    return () => {
      window.removeEventListener(ADMIN_VIEW_SCOPE_CHANGED_EVENT, onScopeChanged as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lastInspectorEnabled.current === inspectorEnabled) return;
    lastInspectorEnabled.current = inspectorEnabled;
    window.dispatchEvent(
      new CustomEvent('this.gui:inspector:changed', { detail: { enabled: inspectorEnabled } })
    );
  }, [inspectorEnabled]);

  React.useEffect(() => {
    const styleId = 'gui-inspector-highlight-style';
    document.getElementById(styleId)?.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :root { --gui-inspector-accent: ${ui.accent}; }
      .${highlightClass} {
        outline: 2px solid color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 85%, transparent);
        outline-offset: 2px;
        box-shadow:
          0 0 0 2px color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 25%, transparent),
          inset 0 0 0 2px color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 40%, transparent);
        border-radius: 6px;
      }
      .gui-inspector-preview {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 6px;
        border: 1px solid var(--palette-divider, ${ui.line});
        border-radius: 8px;
        background: color-mix(in srgb, var(--palette-text-primary, ${ui.fg}) 6%, transparent);
        color: var(--palette-text-primary, ${ui.fg});
        font-size: 11px;
        cursor: default;
      }
      .gui-inspector-preview-pop {
        position: absolute;
        left: 0;
        top: calc(100% + 6px);
        background: var(--palette-background-paper, ${ui.bg});
        border: 1px solid var(--palette-divider, ${ui.lineStrong});
        border-radius: 8px;
        padding: 6px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        opacity: 0;
        transform: translateY(-4px);
        pointer-events: none;
        transition: opacity 120ms ease, transform 120ms ease;
        z-index: 2002;
        max-width: 220px;
      }
      .gui-inspector-preview:hover .gui-inspector-preview-pop {
        opacity: 1;
        transform: translateY(0);
      }
      .gui-inspector-preview-pop img {
        display: block;
        width: auto;
        height: auto;
        max-width: 180px;
        max-height: 180px;
        border-radius: 6px;
      }
      /* Long unbreakable values (monad ids, hashes, signatures) must wrap
         inside the panel instead of running past its edge. */
      aside[data-gui-inspector-control] code {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      /* Highlighted code (CodeBlock uses wrapLongLines + line numbers, which
         react-syntax-highlighter renders as a flex row per line with every
         token a flex item: a long value can't wrap as text, it just squeezes
         or overflows its item). Lay the line out as normal inline text with
         a hanging line-number gutter instead, so long values wrap in place. */
      aside[data-gui-inspector-control] pre code > span {
        display: block !important;
        padding-left: 3.25em;
        text-indent: -3.25em;
        overflow-wrap: break-word;
      }
      aside[data-gui-inspector-control] pre code > span > span {
        display: inline !important;
        text-indent: 0;
      }
      aside[data-gui-inspector-control] pre code > span > .linenumber {
        display: inline-block !important;
        box-sizing: content-box;
        min-width: 2.25em;
        padding-right: 1em;
        text-align: right;
      }
      [${TREE_HOVER_ATTR}] {
        outline: 2px dashed var(--gui-inspector-accent, #3b82f6) !important;
        outline-offset: -2px !important;
      }
      .gui-crumb:hover {
        background: color-mix(in srgb, currentColor 16%, transparent) !important;
        opacity: 1 !important;
      }
      .gui-num:hover {
        background: color-mix(in srgb, currentColor 18%, transparent) !important;
      }
      [aria-label="Move from the focus"] button:not(:disabled):hover {
        background: color-mix(in srgb, currentColor 20%, transparent) !important;
      }
      [aria-label="Move from the focus"] button:not(:disabled):active {
        background: color-mix(in srgb, currentColor 30%, transparent) !important;
      }
      .gui-grid-overlay-active [data-gui-node-id] {
        outline: 1px solid color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 35%, transparent);
        outline-offset: -1px;
      }
      /* Controls draw their own border in (about) the accent color at the
         very same edge, so an inset outline disappears into it. Push the
         outline out past the border and dash it so the two read apart. */
      .gui-grid-overlay-active :is(button, a, input, textarea, select, [role="button"], .MuiFormControl-root)[data-gui-node-id] {
        outline: 1px dashed color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 70%, transparent);
        outline-offset: 3px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [highlightClass, ui.accent]);

  React.useEffect(() => {
    const clearHighlight = () => {
      if (lastHighlighted.current) {
        lastHighlighted.current.classList.remove(highlightClass);
        lastHighlighted.current = null;
      }
    };

    if (!inspectorEnabled) {
      clearHighlight();
      return;
    }

    if (!selectedNodeId) {
      clearHighlight();
      return;
    }

    let host: HTMLElement | null = null;
    try {
      host = document.querySelector(
        `[data-gui-node-id="${CSS.escape(selectedNodeId)}"]`
      ) as HTMLElement | null;
    } catch {
      host = document.querySelector(
        `[data-gui-node-id="${selectedNodeId}"]`
      ) as HTMLElement | null;
    }

    if (!host) {
      clearHighlight();
      return;
    }

    if (lastHighlighted.current && lastHighlighted.current !== host) {
      lastHighlighted.current.classList.remove(highlightClass);
    }
    host.classList.add(highlightClass);
    lastHighlighted.current = host;
  }, [highlightClass, inspectorEnabled, selectedNodeId]);

  // Outlines every registered node at once (see CSS rule above) — a global
  // layout debug view, independent of the single-node inspector selection.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('gui-grid-overlay-active', Boolean(gridEnabled));
    return () => {
      document.body.classList.remove('gui-grid-overlay-active');
    };
  }, [gridEnabled]);

  React.useEffect(() => {
    const onClickCapture = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-gui-inspector-control="true"]')) return;
      let host = target.closest('[data-gui-node-id]') as HTMLElement | null;
      if (!host) return;

      // Respect OFF strictly: no click-to-inspect path when disabled.
      if (!inspectorEnabled) return;

      let metaSource: HTMLElement = target;
      if (ev.metaKey || ev.ctrlKey) {
        const child = findNearestChildNode(host);
        if (child) {
          host = child;
          if (!child.contains(target)) {
            metaSource = child;
          }
        }
      } else if (ev.altKey) {
        let cursor: HTMLElement | null = host;
        let topMost: HTMLElement | null = host;
        while (cursor) {
          if (cursor.hasAttribute('data-gui-node-id')) {
            topMost = cursor;
          }
          cursor = cursor.parentElement;
        }
        host = topMost ?? host;
      } else if (ev.shiftKey) {
        let cursor: HTMLElement | null = host.parentElement;
        let parentMatch: HTMLElement | null = null;
        while (cursor) {
          if (cursor.hasAttribute('data-gui-node-id')) {
            parentMatch = cursor;
            break;
          }
          cursor = cursor.parentElement;
        }
        if (parentMatch) host = parentMatch;
      }

      selectHostElement(host, metaSource);

      ev.preventDefault();
      ev.stopPropagation();
    };

    window.addEventListener('click', onClickCapture, true);
    return () => window.removeEventListener('click', onClickCapture, true);
  }, [inspectorEnabled, findNearestChildNode, selectHostElement]);


  const [panelWidth, setPanelWidth] = React.useState<number>(() => readPanelWidth());
  const [resizing, setResizing] = React.useState(false);
  // Room for the tree and the element's box side by side.
  const twoColumns = panelWidth >= 520;
  const [panelFont, setPanelFont] = React.useState<string>('');

  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    setPanelFont(getComputedStyle(document.body).fontFamily);
    const style = document.createElement('style');
    style.setAttribute('data-gui-inspector-split', 'true');
    style.textContent = PANEL_SPLIT_CSS;
    document.head.appendChild(style);
    root.classList.add(PANEL_OPEN_CLASS);
    return () => {
      root.classList.remove(PANEL_OPEN_CLASS);
      root.style.removeProperty('--gui-inspector-width');
      style.remove();
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    document.documentElement.style.setProperty('--gui-inspector-width', `${panelWidth}px`);
  }, [open, panelWidth]);

  React.useEffect(() => {
    if (!open) return;
    const onResize = () => setPanelWidth((w) => clampPanelWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  const startPanelResize = React.useCallback((ev: React.PointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const handle = ev.currentTarget;
    handle.setPointerCapture(ev.pointerId);
    setResizing(true);
    const onMove = (e: PointerEvent) => setPanelWidth(clampPanelWidth(window.innerWidth - e.clientX));
    const onUp = (e: PointerEvent) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      try { handle.releasePointerCapture(e.pointerId); } catch {}
      setResizing(false);
      setPanelWidth((w) => {
        try { localStorage.setItem(PANEL_WIDTH_KEY, String(w)); } catch {}
        return w;
      });
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }, []);
  const diffPayload = React.useMemo(
    () => buildPropsDiff(selected?.spec, selected?.resolvedProps),
    [selected?.spec, selected?.resolvedProps]
  );
  const provenance = React.useMemo(
    () => selected?.provenance ?? selected?.spec?.provenance ?? null,
    [selected?.provenance, selected?.spec]
  );
  const kernelAvailable = React.useMemo(
    () => hasKernelExplain(me),
    [me]
  );
  const explainPath = React.useMemo(
    () => resolveExplainPath(provenance),
    [provenance]
  );
  // A part the GUI document declares is explainable on its own terms -- no
  // runtime and no kernel path needed: it says where it is declared, what it
  // resolved to, and that nothing is bound to the kernel (yet).
  const documentEntry = React.useMemo(
    () =>
      provenance?.source === 'document'
        ? findGuiDocumentEntry(String(provenance.documentPath || selectedNodeId || ''))
        : null,
    [provenance, selectedNodeId]
  );
  const documentOnly = Boolean(documentEntry) && !explainPath;
  // "Rendered" is a fact about the page right now (an element for this part,
  // or -- for a group -- for something below it), NOT the same as the app
  // having configured it. Re-read whenever the tree view refreshes.
  const documentRendered = React.useMemo(() => {
    if (!documentEntry) return false;
    try {
      return !!document.querySelector(
        `[data-gui-node-id="${CSS.escape(documentEntry.id)}"], [data-gui-node-id^="${CSS.escape(documentEntry.id + '.')}"]`
      );
    } catch {
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentEntry, treeView]);
  const [explainState, setExplainState] = React.useState<ExplainPanelState>({
    status: 'idle',
    sourcePath: null,
  });
  const explainSummary = React.useMemo(
    () =>
      explainState.status === 'ready' && explainState.payload
        ? summarizeExplainPayload(explainState.payload, provenance)
        : null,
    [explainState, provenance]
  );
  const truthMetrics = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildTruthMetrics(explainState.payload, explainState.inspectPayload, explainPath)
        : [],
    [explainState, explainPath]
  );
  const truthDependencies = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildTruthDependencies(explainState.payload)
        : [],
    [explainState]
  );
  const truthTimeline = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildTruthTimeline(explainState.payload, explainState.inspectPayload, explainPath)
        : [],
    [explainState, explainPath]
  );
  const shieldMessage = React.useMemo(
    () =>
      explainState.status === 'ready'
        ? buildShieldMessage(explainState.payload, explainState.inspectPayload, explainPath)
        : null,
    [explainState, explainPath]
  );

  React.useEffect(() => {
    setExplainState({
      status: 'idle',
      sourcePath: explainPath,
    });
  }, [selectedNodeId, explainPath, me]);

  const handleExplain = React.useCallback(async () => {
    // No-op, not an error state: the permanent "no provenance contract"
    // notice below (rendered whenever !explainPath, regardless of whether
    // Explain was ever clicked) already says this. Setting explainState to
    // 'error' here duplicated that exact same describeExplainGap() text a
    // second time, in its own separate error-styled box, the moment this
    // button was clicked — the button is also disabled in this state now,
    // but this guard stays as a safety net against calling it any other way.
    if (!explainPath) return;

    if (!kernelAvailable) {
      setExplainState({
        status: 'unsupported',
        sourcePath: explainPath,
        error:
          'No `.me` kernel is attached to this runtime context. Mount with `{ me }`, or pass `runtime: render(me)`, to enable kernel truth.',
      });
      return;
    }

    setExplainState({
      status: 'loading',
      sourcePath: explainPath,
    });

    try {
      const [explainResult, inspectResult] = await Promise.allSettled([
        requestKernelExplain(me, explainPath),
        requestKernelInspect(me, explainPath),
      ]);

      if (explainResult.status !== 'fulfilled') {
        throw explainResult.reason;
      }

      setExplainState({
        status: 'ready',
        sourcePath: explainPath,
        sourceMethod: explainResult.value.method,
        payload: explainResult.value.payload,
        inspectMethod:
          inspectResult.status === 'fulfilled' ? inspectResult.value.method : undefined,
        inspectPayload:
          inspectResult.status === 'fulfilled' ? inspectResult.value.payload : undefined,
      });
    } catch (error) {
      setExplainState({
        status: 'error',
        sourcePath: explainPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [explainPath, kernelAvailable, me, provenance]);

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${ui.lineStrong}`,
    background: active ? ui.fillActive : 'transparent',
    color: ui.fg,
    borderRadius: 8,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: active ? 700 : 500,
  });
  const tabMetaLabel =
    tab === 'spec'
      ? 'Intent'
      : tab === 'resolved'
        ? 'JSON after runtime resolution'
        : 'Spec props vs resolved props';

  const treeButtonStyle: React.CSSProperties = {
    border: `1px solid ${ui.lineStrong}`,
    background: 'transparent',
    color: ui.fg,
    borderRadius: 6,
    padding: '2px 6px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  };
  // Two different reasons a declared part isn't on the page, kept apart:
  //  off         -- the app didn't configure it (a bar it wasn't given)
  //  not mounted -- configured, but nothing is rendering it right now
  //                 (a page whose route isn't the active one)
  // (A bar the app didn't configure but that still holds something on the page
  // -- the top bar with the search -- is not 'off'.)
  const treeEntryState = (entry: TreeEntry): 'off' | 'not mounted' | null =>
    !entry.enabled && !entry.rendered ? 'off' : entry.source === 'declared' && !entry.rendered ? 'not mounted' : null;
  const treeEntryLabel = (entry: TreeEntry) => {
    const state = treeEntryState(entry);
    return state ? `${entry.label} · ${state}` : entry.label;
  };
  const treeEntryTitle = (entry: TreeEntry) =>
    [
      entry.id,
      entry.source === 'dom' ? 'detected in the DOM, not declared by the GUI' : null,
      treeEntryState(entry) === 'off' ? 'declared by the GUI; the app did not configure it' : null,
      treeEntryState(entry) === 'not mounted' ? 'declared by the GUI and configured; not mounted right now' : null,
    ]
      .filter(Boolean)
      .join(' — ');
  const explainToneStyle = React.useMemo<React.CSSProperties | null>(() => {
    if (!explainSummary) return null;
    if (explainSummary.tone === 'redacted') {
      return {
        border: `1px solid ${ui.error.border}`,
        background: ui.error.bg,
        color: ui.error.fg,
      };
    }
    if (explainSummary.tone === 'warning') {
      return {
        border: `1px solid ${ui.warning.border}`,
        background: ui.warning.bg,
        color: ui.warning.fg,
      };
    }
    if (explainSummary.tone === 'unknown') {
      return {
        border: `1px solid ${ui.neutral.border}`,
        background: ui.neutral.bg,
        color: ui.neutral.fg,
      };
    }
    return {
      border: `1px solid ${ui.success.border}`,
      background: ui.success.bg,
      color: ui.success.fg,
    };
  }, [explainSummary]);

  return (
    <>
      {toggleVisible && (
        <button
          type="button"
          data-gui-inspector-control="true"
          onClick={() => setInspectorEnabled(!inspectorEnabled)}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2000,
            borderRadius: 999,
            border: `1px solid ${ui.lineStrong}`,
            background: inspectorEnabled ? ui.primary : ui.bg,
            color: inspectorEnabled ? ui.primaryContrast : ui.fg,
            fontSize: 12,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          {inspectorEnabled ? 'Inspector ON' : 'Inspector OFF'}
        </button>
      )}

      {open && createPortal(
        <aside
          data-gui-inspector-control="true"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: panelWidth,
            height: '100vh',
            zIndex: 1999,
            background: ui.bg,
            color: ui.fg,
            fontFamily: panelFont || undefined,
            borderLeft: `1px solid ${ui.line}`,
            display: 'flex',
            flexDirection: 'column',
            userSelect: resizing ? 'none' : undefined,
          }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize inspector"
            title="Drag to resize"
            data-gui-inspector-control="true"
            onPointerDown={startPanelResize}
            onDoubleClick={() => {
              setPanelWidth(PANEL_WIDTH_DEFAULT);
              try { localStorage.removeItem(PANEL_WIDTH_KEY); } catch {}
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: 7,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 1,
              background: resizing ? ui.accent : 'transparent',
              opacity: resizing ? 0.5 : 1,
              touchAction: 'none',
            }}
          />
          <header
            style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${ui.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <strong style={{ fontSize: 13 }}>Inspector</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                role="switch"
                aria-checked={gridEnabled}
                onClick={() => setGridEnabled(!gridEnabled)}
                title="Outline every tagged element on the page"
                style={{
                  border: `1px solid ${ui.lineStrong}`,
                  background: gridEnabled ? ui.fillActive : 'transparent',
                  color: ui.fg,
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: gridEnabled ? 700 : 400,
                }}
              >
                Grid {gridEnabled ? 'on' : 'off'}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: `1px solid ${ui.lineStrong}`,
                  background: 'transparent',
                  color: ui.fg,
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSelection();
                  setInspectorEnabled(false);
                }}
                aria-label="Close inspector"
                title="Close inspector"
                style={{
                  border: `1px solid ${ui.lineStrong}`,
                  background: 'transparent',
                  color: ui.fg,
                  borderRadius: 999,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </header>

          <div style={{ padding: 12, overflow: 'auto', fontSize: 12, lineHeight: 1.45 }}>
            {treeView && (
              <div style={{ marginBottom: 12 }}>
                {/* WHICH NODE this is, as the section's title: TREE › path to the
                    node (each ancestor a link), then its type. It follows the
                    focus wherever it goes. */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 4px', minWidth: 0, lineHeight: 1.5 }}>
                    <span
                      style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.6 }}
                      title="On the page: ⇧ click = parent · ⌘/Ctrl click = child · ⌥ click = topmost"
                    >
                      TREE
                    </span>
                    {treeView.path.map((entry, i) => {
                      const last = i === treeView.path.length - 1;
                      return (
                        <React.Fragment key={entry.id}>
                          <span aria-hidden="true" style={{ opacity: 0.4 }}>›</span>
                          {last ? (
                            <span
                              title={entry.id}
                              style={{ fontSize: 14, fontWeight: 700, padding: '0 8px', borderRadius: 6, background: ui.fillActive, opacity: treeEntryState(entry) ? 0.65 : 1 }}
                            >
                              {treeEntryLabel(entry)}
                              {entry.hint && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, opacity: 0.65, fontStyle: entry.hintKind === 'guessed' ? 'italic' : 'normal' }}>{entry.hint}</span>}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="gui-crumb"
                              title={`${entry.id} — go to it`}
                              onClick={() => selectTreeNode(entry)}
                              onMouseEnter={() => hoverTreeNode(entry)}
                              onMouseLeave={() => hoverTreeNode(null)}
                              style={{ border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', fontSize: 13, fontWeight: 600, padding: '0 3px', borderRadius: 4, cursor: 'pointer', opacity: treeEntryState(entry) ? 0.6 : 0.9 }}
                            >
                              {entry.label}
                            </button>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 8px', marginBottom: 8, fontSize: 11 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, padding: '1px 8px', borderRadius: 999, background: ui.fillSoft }}>
                    <span style={{ opacity: 0.6 }}>type</span>
                    <code style={{ fontWeight: 700 }}>{selected?.type ?? (selectedNodeId ? findTaggedElement(selectedNodeId)?.getAttribute('data-gui-component') : null) ?? selectedMeta?.domComponentAttr ?? treeView.path[treeView.path.length - 1].label}</code>
                  </span>
                  <span style={{ opacity: 0.6 }}>level {treeView.path.length - 1}</span>
                  {/* Two shortcuts the tree itself doesn't give you: the top, and
                      sideways along the current level. */}
                  <div role="group" aria-label="Move from the focus" style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 4, marginLeft: 'auto', color: ui.fg }}>
                    <NavCell
                      dir="root"
                      label="Root"
                      entry={treeView.path.length > 1 ? treeView.path[0] : null}
                      hint="Root node — jump to the top of the tree"
                      onGo={selectTreeNode}
                      onHover={hoverTreeNode}
                    />
                    <NavCell dir="left" label="" entry={treeView.around.prev} hint="Previous sibling — same level, before this one" onGo={selectTreeNode} onHover={hoverTreeNode} />
                    <span style={{ fontSize: 10.5, minWidth: 26, textAlign: 'center', opacity: 0.75, fontVariantNumeric: 'tabular-nums' }} title="Position among its siblings">
                      {treeView.around.at + 1}/{treeView.around.total}
                    </span>
                    <NavCell dir="right" label="" entry={treeView.around.next} hint="Next sibling — same level, after this one" onGo={selectTreeNode} onHover={hoverTreeNode} />
                  </div>
                </div>

                {/* Wide enough: the tree on the left, the selected node's element
                    (dimensions, HTML) on the right. Narrow: one under the other. */}
                <div
                  style={twoColumns ? { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 236px', gap: 8, alignItems: 'start' } : undefined}
                >
                  <div style={{ minWidth: 0 }}>
                {/* The tree, as a diagram. Arrow keys walk it. */}
                <div
                  role="tree"
                  aria-label="GUI tree"
                  tabIndex={0}
                  ref={treeBoxRef}
                  onKeyDown={onTreeKeyDown}
                  style={{
                    border: `1px solid ${ui.line}`,
                    borderRadius: 8,
                    padding: '4px 6px',
                    maxHeight: twoColumns ? 340 : 190,
                    overflowY: 'auto',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: 11,
                    lineHeight: '18px',
                    outline: 'none',
                  }}
                  className="gui-inspector-tree"
                >
                  {treeView.rows.map((row) => {
                    if (row.kind === 'more') {
                      return (
                        <div key={row.id} style={{ whiteSpace: 'pre', opacity: 0.55 }}>
                          <span style={{ color: ui.fgMuted }}>{row.prefix}</span>… {row.count} more
                        </div>
                      );
                    }
                    const { entry } = row;
                    const focused = entry.id === selectedNodeId;
                    const state = treeEntryState(entry);
                    return (
                      <div
                        key={entry.id}
                        role="treeitem"
                        aria-selected={focused}
                        aria-expanded={row.hasChildren ? row.open : undefined}
                        data-tree-focus={focused ? 'true' : undefined}
                        title={treeEntryTitle(entry)}
                        onClick={() => {
                          selectTreeNode(entry);
                          treeBoxRef.current?.focus();
                        }}
                        onMouseEnter={() => hoverTreeNode(entry)}
                        onMouseLeave={() => hoverTreeNode(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          whiteSpace: 'pre',
                          cursor: 'pointer',
                          borderRadius: 4,
                          background: focused ? ui.fillActive : 'transparent',
                          fontWeight: focused ? 700 : 400,
                          opacity: state ? 0.55 : 1,
                        }}
                      >
                        <span style={{ color: ui.fgMuted, userSelect: 'none' }}>{row.prefix}</span>
                        <span
                          onClick={(ev) => {
                            if (!row.hasChildren) return;
                            ev.stopPropagation();
                            toggleExpanded(entry.id);
                          }}
                          style={{ width: 14, textAlign: 'center', color: ui.fgMuted, userSelect: 'none', cursor: row.hasChildren ? 'pointer' : 'default' }}
                        >
                          {row.hasChildren ? (row.open ? '▾' : '▸') : '·'}
                        </span>
                        <span style={{ fontStyle: entry.source === 'dom' ? 'italic' : 'normal' }}>{entry.label}</span>
                        {entry.hint && (
                          <span
                            title={entry.hintKind === 'declared' ? 'Named by the GUI' : 'Guessed from the markup (the GUI did not name it)'}
                            style={{ marginLeft: 8, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', color: ui.fgMuted, fontWeight: 400, fontStyle: entry.hintKind === 'guessed' ? 'italic' : 'normal' }}
                          >
                            {entry.hint}
                          </span>
                        )}
                        {state && <span style={{ color: ui.fgMuted, fontWeight: 400 }}>{` · ${state}`}</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                  ↑↓ rows · ← close / parent · → open / child · italic = only in the DOM
                </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                {/* DIMENSIONS of the selected node only: the box, editable. */}
                <div
                  style={{
                    marginTop: twoColumns ? 0 : 8,
                    padding: '6px 10px 8px',
                    borderRadius: 10,
                    border: `1px solid ${ui.line}`,
                    background: ui.fillFaint,
                    color: ui.fg,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 8px', minWidth: 0 }}>
                      <span style={{ fontWeight: 700, opacity: 0.75, fontSize: 11 }}>DIMENSIONS</span>
                      {/* Which node these dimensions are of: its full id. */}
                      <code style={{ fontSize: 11, fontWeight: 700, minWidth: 0, overflowWrap: 'anywhere' }} title="The node these dimensions belong to">
                        {selectedNodeId}
                      </code>
                    </div>
                    {layoutEdited && (
                      <button
                        type="button"
                        onClick={resetLayout}
                        title="Put the element's own styles back (edits are a live preview in this tab; nothing is saved)"
                        style={{ ...treeButtonStyle, padding: '1px 7px' }}
                      >
                        reset
                      </button>
                    )}
                  </div>
                  {layoutInfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <BoxModel info={layoutInfo} ui={ui} onEdit={editLayout} />
                      {layoutMeta(layoutInfo).length > 0 && (
                        <div style={{ fontSize: 10.5, opacity: 0.7, display: 'flex', flexWrap: 'wrap', gap: '0 10px', justifyContent: 'center' }}>
                          {layoutMeta(layoutInfo).map((line) => (
                            <span key={line}>{line}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.55, fontSize: 11, textAlign: 'center', padding: '10px 0' }}>Nothing rendered for this node.</div>
                  )}
                </div>

                {/* HTML: only when this node IS an element. A GUI node that is
                    just a part with nodes below it has no HTML yet. */}
                {htmlInfo && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '6px 10px 8px',
                      borderRadius: 10,
                      border: `1px solid ${ui.line}`,
                      background: ui.fillFaint,
                      color: ui.fg,
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={htmlOpen}
                      onClick={() => setHtmlOpen(!htmlOpen)}
                      title={htmlOpen ? 'Collapse' : 'Show the element\'s HTML'}
                      style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: htmlOpen ? 6 : 0,
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: 'inherit',
                        font: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span aria-hidden="true" style={{ width: 10, opacity: 0.6, fontSize: 10 }}>{htmlOpen ? '▾' : '▸'}</span>
                      <span style={{ fontWeight: 700, opacity: 0.75, fontSize: 11 }}>HTML</span>
                      {htmlOpen ? (
                        <span style={{ fontSize: 10.5, opacity: 0.55 }}>detected in the DOM</span>
                      ) : (
                        // Collapsed: just enough to know what it is.
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 11, opacity: 0.7 }}>
                          {`<${htmlInfo.tag}>`}{htmlInfo.id ? ` #${htmlInfo.id}` : ''}
                        </span>
                      )}
                    </button>
                    {htmlOpen && (<>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 11 }}>
                      <span style={{ padding: '1px 7px', borderRadius: 6, background: ui.fillActive, fontWeight: 700 }}>{`<${htmlInfo.tag}>`}</span>
                      {htmlInfo.id && <span style={{ padding: '1px 7px', borderRadius: 6, background: ui.fillSoft }} title="id">#{htmlInfo.id}</span>}
                      {htmlInfo.classes.map((c) => (
                        <span key={c} style={{ padding: '1px 7px', borderRadius: 6, background: ui.fillSoft }} title="class">.{c}</span>
                      ))}
                      {htmlInfo.frameworkClasses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowFrameworkClasses((v) => !v)}
                          title="Classes the UI library writes (MuiBox-root, css-…) -- an implementation detail, hidden by default. Click to show or hide."
                          style={{ border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', opacity: 0.55, cursor: 'pointer', padding: '0 2px' }}
                        >
                          {showFrameworkClasses ? '− ' : '+'}{htmlInfo.frameworkClasses.length} framework
                        </button>
                      )}
                    </div>
                    {showFrameworkClasses && htmlInfo.frameworkClasses.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 4, opacity: 0.55, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 10.5 }}>
                        {htmlInfo.frameworkClasses.map((c) => <span key={c}>.{c}</span>)}
                      </div>
                    )}
                    {htmlInfo.attrs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', marginTop: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 11 }}>
                        {htmlInfo.attrs.map((a) => (
                          <span key={a.name} style={{ overflowWrap: 'anywhere' }}>
                            <span style={{ opacity: 0.6 }}>{a.name}</span>
                            {a.value !== '' && <>=<span>"{a.value}"</span></>}
                          </span>
                        ))}
                      </div>
                    )}
                    </>)}
                  </div>
                )}
                  </div>
                </div>
              </div>
            )}
            {selected?.part && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75 }}>part</div>
                <code>{selected.part}</code>
              </div>
            )}
            {/* SPEC: this node and the parts it covers -- the main thing to read. */}
            <div style={{ borderTop: `1px solid ${ui.line}`, paddingTop: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.75 }}>SPEC</span>
                  <span style={{ fontSize: 10.5, opacity: 0.55 }}>
                    {tab === 'spec' ? 'this node and the parts it covers' : tab === 'resolved' ? 'after runtime resolution' : 'spec vs runtime'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" onClick={() => setTab('spec')} style={tabButtonStyle(tab === 'spec')}>
                    Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('resolved')}
                    style={tabButtonStyle(tab === 'resolved')}
                    title="Shows the JSON after runtime prop resolution"
                  >
                    Runtime
                  </button>
                  <button type="button" onClick={() => setTab('diff')} style={tabButtonStyle(tab === 'diff')}>
                    Diff
                  </button>
                </div>
              </div>
            {tab === 'spec' && (
              <div style={{ marginBottom: 10 }}>
                <CodeBlock
                  code={safeStringify(
                    // The node's own spec, then the parts it covers below it.
                    subtree
                      ? (() => {
                          const { children, ...own } = subtree;
                          return {
                            ...own,
                            ...(selected?.spec?.props && Object.keys(selected.spec.props).length ? { props: selected.spec.props } : {}),
                            ...(children ? { children } : {}),
                          };
                        })()
                      : selected?.spec ?? null
                  )}
                  language="json"
                  variant={codeVariant}
                  title="raw.spec.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}

            {tab === 'resolved' && (
              <div>
                <CodeBlock
                  code={safeStringify(selected?.resolvedProps ?? null)}
                  language="json"
                  variant={codeVariant}
                  title="resolved.props.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}

            {tab === 'diff' && (
              <div>
                <CodeBlock
                  code={safeStringify(diffPayload)}
                  language="json"
                  variant={codeVariant}
                  title="spec-vs-resolved.diff.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}
            </div>
            {provenance && (
              <div style={{ borderTop: `1px solid ${ui.line}`, paddingTop: 10, marginBottom: 12 }}>
                <div style={{ ...{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.75 }, marginBottom: 6 }}>PROVENANCE</div>
                <CodeBlock
                  code={safeStringify(provenance)}
                  language="json"
                  variant={codeVariant}
                  title="node.provenance.json"
                  showLineNumbers
                  wrapLongLines
                  showCopyButton
                />
              </div>
            )}
            {explainPath ? (
            <div style={{ borderTop: `1px solid ${ui.line}`, paddingTop: 10, marginBottom: 12 }}>
              <div style={{ ...{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.75 }, marginBottom: 6 }}>EXPLAIN</div>
              <div
                style={{
                  border: `1px solid ${ui.line}`,
                  borderRadius: 12,
                  padding: 10,
                  background: ui.fillFaint,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ opacity: 0.75 }}>explain path</div>
                  <code>{explainPath || (documentEntry ? 'none — declared in the GUI document' : 'Not declared')}</code>
                </div>
                {documentEntry && (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ opacity: 0.75 }}>declared</div>
                      <code>
                        yes — GUI.document.json › {documentEntry.id}
                        {documentEntry.component ? ` (${documentEntry.component})` : ''}
                      </code>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ opacity: 0.75 }}>rendered</div>
                      <code>
                        {documentRendered
                          ? 'yes — on the page now'
                          : selected?.enabled === false
                            ? 'no — the app did not configure it'
                            : 'no — configured, not mounted right now'}
                      </code>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ opacity: 0.75 }}>resolved (kernel)</div>
                      <code>
                        {!explainPath
                          ? 'not bound — no kernel path, nothing to resolve'
                          : !kernelAvailable
                            ? `bound to ${explainPath} — no runtime attached, unresolved`
                            : explainState.status === 'ready'
                              ? `resolved via ${explainPath}`
                              : `bound to ${explainPath} — not resolved yet (Explain)`}
                      </code>
                    </div>
                    {documentEntry.route && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ opacity: 0.75 }}>route</div>
                        <code>{documentEntry.route}</code>
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ opacity: 0.75 }}>declares</div>
                      <code>{documentEntry.childIds.length ? documentEntry.childIds.join(', ') : 'no parts below'}</code>
                    </div>
                    {documentEntry.note && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ opacity: 0.75 }}>note</div>
                        <span>{documentEntry.note}</span>
                      </div>
                    )}
                  </>
                )}
                {provenance?.policy && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>policy</div>
                    <code>{String(provenance.policy)}</code>
                  </div>
                )}
                {provenance?.binding && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>binding</div>
                    <code>{String(provenance.binding)}</code>
                  </div>
                )}
                {explainState.sourceMethod && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>explain call</div>
                    <code>{explainState.sourceMethod}</code>
                  </div>
                )}
                {explainState.inspectMethod && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75 }}>timeline source</div>
                    <code>{explainState.inspectMethod}</code>
                  </div>
                )}
                {!documentOnly && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={handleExplain}
                    disabled={explainState.status === 'loading' || !explainPath}
                    title={!explainPath ? describeExplainGap(provenance) : undefined}
                    style={{
                      border: `1px solid ${ui.lineStrong}`,
                      background: explainState.status === 'loading' ? ui.fillHover : 'transparent',
                      color: ui.fg,
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: explainState.status === 'loading' ? 'wait' : !explainPath ? 'not-allowed' : 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      opacity: !explainPath ? 0.5 : 1,
                    }}
                  >
                    {explainState.status === 'ready' ? 'Refresh Explain' : 'Explain'}
                  </button>
                  {explainPath && !kernelAvailable && (
                    <span style={{ fontSize: 11, opacity: 0.82 }}>
                      Attach a kernel with <code>{'{ me }'}</code> or <code>{'{ runtime: render(me) }'}</code> to enable Explain.
                    </span>
                  )}
                </div>}
                {!explainPath && !documentOnly && (
                  <div
                    style={{
                      border: `1px solid ${ui.warning.border}`,
                      background: ui.warning.bg,
                      color: ui.warning.fg,
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    {describeExplainGap(provenance)}
                  </div>
                )}
                {explainState.status === 'loading' && (
                  <div style={{ fontSize: 11, opacity: 0.82 }}>
                    Loading kernel explanation...
                  </div>
                )}
                {(explainState.status === 'error' || explainState.status === 'unsupported') &&
                  explainState.error && (
                    <div
                      style={{
                        border: `1px solid ${ui.error.border}`,
                        background: ui.error.bg,
                        color: ui.error.fg,
                        borderRadius: 10,
                        padding: '8px 10px',
                        fontSize: 11,
                      }}
                    >
                      {explainState.error}
                    </div>
                  )}
                {explainSummary && explainToneStyle && (
                  <div
                    style={{
                      ...explainToneStyle,
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{explainSummary.label}</div>
                    <div>{explainSummary.message}</div>
                  </div>
                )}
                {shieldMessage && (
                  <div
                    style={{
                      border: `1px solid ${ui.info.border}`,
                      background: ui.info.bg,
                      color: ui.info.fg,
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Kernel Shield</div>
                    <div>{shieldMessage}</div>
                  </div>
                )}
                {truthMetrics.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {truthMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        style={{
                          border: `1px solid ${ui.line}`,
                          background: ui.fillFaint,
                          borderRadius: 10,
                          padding: '8px 10px',
                        }}
                      >
                        <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 4 }}>{metric.label}</div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{metric.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {truthDependencies.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>DEPENDENCY MAP</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {truthDependencies.map((dependency) => (
                        <div
                          key={`${dependency.path}:${dependency.label}`}
                          style={{
                            border: `1px solid ${ui.line}`,
                            background:
                              dependency.masked
                                ? ui.error.bg
                                : ui.fillFaint,
                            borderRadius: 10,
                            padding: '8px 10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <strong style={{ fontSize: 11 }}>{dependency.label}</strong>
                            <span style={{ fontSize: 10, opacity: 0.75 }}>
                              {dependency.masked ? 'stealth' : dependency.origin}
                            </span>
                          </div>
                          <div style={{ marginBottom: 4 }}>
                            <code>{dependency.path}</code>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.9 }}>{dependency.valueLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {truthTimeline.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ opacity: 0.75, marginBottom: 6, fontWeight: 700 }}>CAUSALITY TIMELINE</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {truthTimeline.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            border:
                              entry.tone === 'warning'
                                ? `1px solid ${ui.warning.border}`
                                : entry.tone === 'redacted'
                                  ? `1px solid ${ui.error.border}`
                                  : `1px solid ${ui.line}`,
                            background:
                              entry.tone === 'warning'
                                ? ui.warning.bg
                                : entry.tone === 'redacted'
                                  ? ui.error.bg
                                  : ui.fillFaint,
                            borderRadius: 10,
                            padding: '8px 10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <strong style={{ fontSize: 11 }}>{entry.label}</strong>
                            {entry.hash && (
                              <span style={{ fontSize: 10, opacity: 0.75 }}>
                                #{entry.hash}
                              </span>
                            )}
                          </div>
                          {entry.path && (
                            <div style={{ marginBottom: 4 }}>
                              <code>{entry.path}</code>
                            </div>
                          )}
                          <div style={{ fontSize: 11 }}>{entry.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {explainState.status === 'ready' && (
                  <CodeBlock
                    code={safeStringify(explainState.payload ?? null)}
                    language="json"
                    variant={codeVariant}
                    title="kernel.explain.json"
                    showLineNumbers
                    wrapLongLines
                    showCopyButton
                  />
                )}
              </div>
            </div>
            ) : (
              // Nothing to ask the kernel: just where the node stands.
              <div style={{ borderTop: `1px solid ${ui.line}`, paddingTop: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.75, marginBottom: 6 }}>EXPLAIN</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 12, rowGap: 2, fontSize: 11.5 }}>
                  {documentEntry && (
                    <>
                      <span style={{ opacity: 0.6 }}>declared</span>
                      <span>
                        yes — GUI.document.json{documentEntry.component ? ` (${documentEntry.component})` : ''}
                      </span>
                      <span style={{ opacity: 0.6 }}>rendered</span>
                      <span>
                        {documentRendered
                          ? 'yes — on the page now'
                          : selected?.enabled === false
                            ? 'no — the app did not configure it'
                            : 'no — configured, not mounted right now'}
                      </span>
                      {documentEntry.route && (
                        <>
                          <span style={{ opacity: 0.6 }}>route</span>
                          <code>{documentEntry.route}</code>
                        </>
                      )}
                    </>
                  )}
                  <span style={{ opacity: 0.6 }}>kernel</span>
                  <span>not bound</span>
                </div>
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ opacity: 0.75, marginBottom: 6 }}>image preview</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {imagePreviews.map((item, idx) => (
                    <div key={`${item.path}-${idx}`} className="gui-inspector-preview" title={item.path}>
                      <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Zm-2 0H5V5h14Zm-2-2H7l3.5-4.5 2.5 3 2-2.5L17 17Z" />
                        </svg>
                      </span>
                      <span>{item.path || 'image'}</span>
                      <div className="gui-inspector-preview-pop">
                        <img src={item.src} alt={item.path || 'preview'} loading="lazy" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>,
        document.documentElement
      )}
    </>
  );
}
