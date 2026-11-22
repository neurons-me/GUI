// IdentityTree.tsx — the signed-in QR card's personal row, in "graph mode":
// tapping the key icon unfolds the keys tree downward instead of
// navigating. Every node is a .me path (data-gui-node-id + caption):
//
//   <user>.keys                         saved services  +  add
//   <user>.keys  [+] saved…  […]        collection rows: + first (always creates), content, … last (next row-block);
//                                       stable order; a newly created key is inserted right after + (keyOrder.ts)
//   <user>.keys.add                     the "+" CREATES at the level it sits on: one new-key card;
//                                       "Start from" offers built-ins missing under that level, else custom
//   <user>.keys.meta                    a GROUP level: its own branch (.meta) → .facebook .instagram …
//   <user>.keys.meta.instagram          a LEAF: only here does the value card open (rights: edit/read/none)
//   <user>.keys.meta.instagram.app.secret   (one field, labelled relative in the card)
//   <user>.keys.<a>.<b>                 custom keys are dotted paths too (stripe.test → stripe → test)
//
// Paths are RELATIVE: the namespace (jabellae.cleaker.me) is already on the
// QR above, so each branch (arm) shows only its own level, once, on its line:
// `.keys` on identity→keys, `.meta` on keys→meta, `.instagram` on meta→card.
// Tooltips and field titles are relative too. The full path lives only in
// data-gui-node-id. `onPathChange` reports the open public path (segments
// only — never values) so the caller's QR can follow it.
//
// The leaf reuses ServiceKeyCard (same encrypted serviceKeyVault writes);
// values are never rendered back — secret inputs are password fields
// (dots) and a saved service only says "Saved". Other entries (wallet,
// profile, contacts) still navigate through `onNavigate`.
import * as React from 'react';
import { createPortal } from 'react-dom';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import IdentityIconRow, { type PersonalEntryId } from './IdentityIconRow';
import NodeTip from './NodeTip';
export { NodeTip };
import ServiceIcon from './Keys/ServiceIcons';
import { NODE_ICON, NODE_SIZE, nodePx, remPx } from './treeMetrics';
import { ServiceKeyCard, SERVICE_KEYS_CHANGED_EVENT } from './Keys/ServiceKeysSection';
import CustomKeyCard, { CustomMark, autoKeyBrand } from './Keys/CustomKeyCard';
import { useDockRow } from './useDockRow';
import NewKeyCard from './Keys/NewKeyCard';
import ProfilePhoto, { profilePhotoSrc } from './Keys/ProfilePhoto';
import { SERVICE_DEFINITIONS, customKeyId, keyNoticeFromGroup, listCustomKeyGroups, listSavedServices, type CustomKeyGroup, type KeyNotice, type ServiceId } from './Keys/serviceKeyVault';
import { publicMetaReader, readPublicMeta, resolveNodeMeta, type MeReader, type NodeIcon, type ResolvedMeta } from './Keys/keyMeta';
import { presetsAt } from './Keys/keyPresets';
import { GROUP_INFO, accessFor, childrenAt, templatesAt, trimToExisting, type KeyAccessProp, type KeyChild, type KeyLeaf } from './Keys/keyTree';
import { filterKeyLeaves, filterPersonalEntries } from './Keys/searchTreeFilter';
import { useQrTreeSearch } from './qrTreeSearch';
import { KEYS_ROOT, fieldPath, servicePath } from './Keys/keyPaths';
import { orderByUsage, readKeyOrder, touchKey, type KeyOrderId } from './Keys/keyOrder';
import { availableMenuContentWidth } from './Corner/menuSize';
import { useKeysRowMode } from '@/gui/Layout/Position/keysRowMode';

import { QrMenuMotionCtx } from './Corner/menuMotion';
import { alpha, keyframes } from '@mui/system';
import { EASE, MOTION_CARD, MOTION_LEAVE, MOTION_MS, MOTION_SPACE, leaveDelay, leaveTotalMs, prefersReducedMotion, spatialSpring, staggerDelay } from '@/gui/Theme/motion';
import { HeightGlide, MotionScope, RevealHeight, useMotion, usePresence, useStaggerBatch } from '@/gui/Theme/MotionPresence';

export interface IdentityTreeProps {
  /** data-gui-node-id prefix of the card (e.g. "story.signedin"). */
  nodeId: string;
  /** Root of the visible path (e.g. "jabellae"). */
  username: string;
  /** Vault namespace the service keys are stored under. */
  namespace: string;
  /** Entries that don't unfold (wallet, profile, contacts) still navigate. */
  onNavigate: (to: string) => void;
  /** Fixed items per block. By default a block is one full row: "+" first, content, "…" last on the same row. */
  pageSize?: number;
  /** The open branch as public path segments: [] closed, ['keys'], ['keys','paypal','sandbox']. Never values. */
  onPathChange?: (segments: string[]) => void;
  /** Opt-in: opening a key moves it to the front (MRU). Off by default — the order stays stable; only a new key goes first. */
  reorderOnUse?: boolean;
  /** The viewer's rights per leaf path (`keys.meta.instagram`): 'edit' (default, the signed-in owner), 'read', 'none'. "+" shows only where it resolves to 'edit'. */
  access?: KeyAccessProp;
  /**
   * The .me tree the nodes' public `.icon` / `.label` are read from (a this.me instance works:
   * `me("keys.meta.icon")`). Declared values win over the built-in icons and names.
   */
  me?: MeReader;
  /**
   * Full paths with a pending app request (`keys.netget`): the node and its ancestors show a dot. Public paths
   * only — what the request asks lives in the consent card, never in the tree.
   */
  pending?: readonly string[];
  /**
   * Paths under `keys` (`netget`, `meta.instagram`) this view never shows -- e.g. the cleaker hides `keys.netget`
   * (the gateway's own material). Hidden, not deleted: the vault is unchanged.
   */
  hide?: (relPath: string) => boolean;
  /** Start with the keys branch already unfolded (a Keys view that is already the tree). */
  initialOpen?: boolean;
  /** Shown on the .keys.meta branch (approval window). No secrets in the label. */
  /**
   * The Meta branch's Facebook action. Not connected: a "Connect with Facebook" button in the .meta row. `connected`
   * (meta.user saved): nothing in the row; the meta.user card shows the status (Connected / Expiring / Disconnected,
   * from `notice`) and a Reconnect action.
   */
  facebookConnect?: { enabled: boolean; onClick: () => void; message?: string; connected?: boolean; notice?: 'expiring' | 'dead' };
  /** Live filter from the top-bar Search: matching leaves keep their ancestors; a matching branch stays whole. */
  filterQuery?: string;
}


const UNFOLDS: readonly PersonalEntryId[] = ['keys'];
const defOf = (id: ServiceId) => SERVICE_DEFINITIONS.find((d) => d.id === id)!;
/** `meta.instagram` → `keys.meta.instagram` (full path under the user). */
const full = (rel: string) => (rel ? `${KEYS_ROOT}.${rel}` : KEYS_ROOT);
const lastSeg = (p: string) => p.slice(p.lastIndexOf('.') + 1);
const leafId = (l: KeyLeaf): KeyOrderId => (l.kind === 'service' ? l.id : customKeyId(l.name));

const GAP = 10; const ROW_PAD = 24; // row gap, level px*2 (node size: treeMetrics, rem)
/** Overflow past the node box: notice/pending dot (8px at -3) and the 2px+1px focus ring. */
const NODE_CONTOUR_REM = 0.5;
/**
 * Nodes that fit on one row of a level `width` px wide, counting each
 * icon's visible contour and the side air. Never force a count that would
 * let the margin cover an icon; wrap instead (min 1).
 */
export const rowCapacity = (width: number, node: number = nodePx()) => {
  const contour = 2 * NODE_CONTOUR_REM * remPx();
  const pad = Math.max(ROW_PAD, contour);
  return Math.max(1, Math.floor((width - pad + GAP) / (node + GAP)));
};
/** Split a level's slots into visual rows of `cap` (the same size the row used to wrap to). */
function chunkRows<T>(items: readonly T[], cap: number): T[][] {
  const n = Math.max(1, cap);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n) as T[]);
  return out.length ? out : [[]];
}

/**
 * Items to show for `blocks` blocks. Each row reads "+ content …": the "+"
 * and the "…" take a slot each, so the "…" always ends the last full row
 * (never wraps alone). When everything fits, no "…". Extended so an
 * active item is never hidden.
 */
function visibleBlock<T>(items: T[], blocks: number, cap: number, pageSize: number | undefined, isActive: (t: T) => boolean): T[] {
  const room = pageSize ? blocks * pageSize : blocks * cap - 1; // slots after "+"
  const n = items.length <= room ? items.length : (pageSize ? room : room - 1);
  const i = items.findIndex(isActive);
  return items.slice(0, Math.max(n, i + 1));
}


/** Air kept under the last opened row or form, in rem (theme-sized). */
const FOLLOW_AIR_REM = 2;

function followAirPx(): number {
  if (typeof window === 'undefined') return 32;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return FOLLOW_AIR_REM * (Number.isFinite(rem) && rem > 0 ? rem : 16);
}

/** The card's inner tree scroller — never the paper, so the QR stays put. */
function menuScroller(from: HTMLElement | null): HTMLElement | null {
  const paper = from?.closest('[data-cleaker-panel]') as HTMLElement | null;
  if (!paper) return null;
  if (from?.hasAttribute('data-qr-scroll')) return from;
  return paper.querySelector('[data-qr-scroll]') as HTMLElement | null;
}

function openedRowTarget(tree: HTMLElement): HTMLElement | null {
  const editor = tree.querySelector('[data-tree-editor] [data-branch-editor], [data-branch-editor]') as HTMLElement | null;
  if (editor && editor.getBoundingClientRect().height > 1) return editor;
  const levels = Array.from(tree.querySelectorAll('[data-tree-level]')).filter((el) => el.querySelector(':scope > [data-keys-row], :scope > [data-tree-row]'));
  const last = levels[levels.length - 1];
  if (!last) return null;
  const rows = Array.from(last.querySelectorAll(':scope > [data-keys-row], :scope > [data-tree-row]'));
  return (rows[rows.length - 1] as HTMLElement | undefined) || (last as HTMLElement);
}

function selectedRowTarget(tree: HTMLElement): HTMLElement | null {
  const selected = Array.from(tree.querySelectorAll('[data-tree-node] [aria-expanded="true"]'))
    .map((el) => el.closest('[data-tree-node]'))
    .filter((el): el is HTMLElement => el instanceof HTMLElement);
  return selected[selected.length - 1] || openedRowTarget(tree);
}

function parentNodeOf(tree: HTMLElement): HTMLElement | null {
  const selected = Array.from(tree.querySelectorAll('[data-tree-node] [aria-expanded="true"]'))
    .map((el) => el.closest('[data-tree-node]'))
    .filter((el): el is HTMLElement => el instanceof HTMLElement);
  return selected[selected.length - 1] || null;
}

/**
 * Scroll the tree the least amount that keeps `el` fully visible, with air
 * under it. If it does not fit, pin the parent node at the top and start
 * the new content just under that line.
 */
function revealInScroller(scroller: HTMLElement, el: HTMLElement, parent: HTMLElement | null, behavior: ScrollBehavior): boolean {
  const sr = scroller.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  const cs = getComputedStyle(scroller);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const padBottom = Math.max(parseFloat(cs.paddingBottom) || 0, parseFloat(cs.scrollPaddingBottom) || 0, followAirPx());
  const viewH = sr.height - padTop - padBottom;
  let dy = 0;
  if (er.height > viewH - 1) {
    if (parent) {
      const pr = parent.getBoundingClientRect();
      dy = pr.top - (sr.top + padTop);
    } else {
      dy = er.top - (sr.top + padTop);
    }
  } else {
    if (er.bottom > sr.bottom - padBottom) dy = er.bottom - (sr.bottom - padBottom);
    else if (er.top < sr.top + padTop) dy = er.top - (sr.top + padTop);
    if (parent && dy > 0) {
      const pr = parent.getBoundingClientRect();
      if (pr.top - dy < sr.top + padTop) dy = pr.top - (sr.top + padTop);
    }
  }
  if (Math.abs(dy) < 1) return true;
  const top = Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, scroller.scrollTop + dy));
  if (behavior === 'smooth') scroller.scrollTo({ top, behavior: 'smooth' });
  else scroller.scrollTop = top;
  return false;
}

/**
 * When a level or form opens downward, the card grows first, then this
 * follows inside the tree scroller until the new content (and a little
 * air under it) is in view. Cancels if the person scrolls or drags.
 */
function useFollowOpenedRow(
  treeRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  depth: number,
  trail: string,
) {
  const prevDepth = React.useRef(0);
  React.useLayoutEffect(() => {
    const didOpen = depth > prevDepth.current;
    const didClose = depth < prevDepth.current;
    prevDepth.current = depth;
    if (!active || (!didOpen && !didClose)) return undefined;
    const tree = treeRef.current;
    const scroller = menuScroller(tree);
    if (!tree || !scroller) return undefined;

    let cancelled = false;
    let raf = 0;
    let writing = false;
    let visibleFrames = 0;
    let lastH = scroller.clientHeight;
    let smoothUntil = 0;
    const started = performance.now();
    const reduced = prefersReducedMotion();
    const stop = () => {
      cancelled = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const onUser = () => { if (!writing) stop(); };
    scroller.addEventListener('wheel', onUser, { passive: true });
    scroller.addEventListener('touchmove', onUser, { passive: true });
    const onPointer = (event: PointerEvent) => {
      if (writing) return;
      if (event.target === scroller || event.pointerType !== 'mouse') stop();
    };
    scroller.addEventListener('pointerdown', onPointer);
    const paper = tree.closest('[data-cleaker-panel]');
    const onPaperDown = () => { if (paper?.hasAttribute('data-cleaker-dragging')) stop(); };
    paper?.addEventListener('pointermove', onPaperDown);

    const tick = () => {
      raf = 0;
      if (cancelled) return;
      const el = didOpen ? openedRowTarget(tree) : selectedRowTarget(tree);
      if (el) {
        const h = scroller.clientHeight;
        const growing = Math.abs(h - lastH) > 0.5;
        lastH = h;
        // While the card is still growing, do not scroll: the Keys row lives
        // in this scroller, and tracking mid-spring would move it. Once the
        // size is stable, one smooth scroll (instant under reduced motion)
        // reveals the new content.
        if (growing) {
          visibleFrames = 0;
        } else {
          const now = performance.now();
          const allowSmooth = !reduced && now >= smoothUntil;
          writing = true;
          const fully = revealInScroller(scroller, el, parentNodeOf(tree), allowSmooth ? 'smooth' : 'auto');
          writing = false;
          if (!fully && allowSmooth) smoothUntil = now + 420;
          visibleFrames = fully ? visibleFrames + 1 : 0;
        }
      }
      const timedOut = performance.now() - started > 1800;
      if (!cancelled && !timedOut && visibleFrames < 8) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      if (cancelled || raf) return;
      visibleFrames = 0;
      raf = requestAnimationFrame(tick);
    }) : null;
    ro?.observe(scroller);
    ro?.observe(tree);

    return () => {
      stop();
      ro?.disconnect();
      scroller.removeEventListener('wheel', onUser);
      scroller.removeEventListener('touchmove', onUser);
      scroller.removeEventListener('pointerdown', onPointer);
      paper?.removeEventListener('pointermove', onPaperDown);
    };
  }, [active, depth, trail, treeRef]);
}

/** Shared by every level of the keys tree. */
type TreeCtx = {
  namespace: string; cap: number; inMenu?: boolean; /** `rows` wraps in the card; `scroll` is one horizontal row. */ rowMode?: 'rows' | 'scroll'; fixed?: number; leaves: KeyLeaf[]; filtering?: boolean; saved: ServiceId[];
  custom: CustomKeyGroup[]; sel: string[]; adding: string | null; access?: KeyAccessProp;
  nid: (path: string) => string; anchor: (path: string) => HTMLElement | undefined; setAnchor: (path: string) => (el: HTMLElement | null) => void;
  pick: (depth: number, child: KeyChild) => void; startAdd: (level: string) => void; closeCard: () => void;
  onCreated: (leafPath: string) => void;
  /** Where `.icon` / `.label` are read: the given this.me tree, then this device's public branch. */
  readers: MeReader[];
  pending?: readonly string[];
  /** Jump to a referenced branch (e.g. instagram.page → facebook.<page>). */
  revealPath?: (path: string) => void;
  facebookConnect?: IdentityTreeProps['facebookConnect'];
  /** In the QR card, new keys are geometrically stable (and clickable). */
  keysReady?: boolean;
};
const Ctx = React.createContext<TreeCtx | null>(null);
/** Host outside the keys-row overflow-x clip, so the leaf editor can fill the card width. */
const MenuEditorHost = React.createContext<HTMLElement | null>(null);

/** Story fixtures can provide the intended collection so the tree paints
 *  its icons immediately, without waiting for vault envelopes to be written
 *  (PBKDF2 on each save). Once the vault has entries, those win. */
export const IdentityTreeSeedCtx = React.createContext<{
  saved: ServiceId[];
  custom: CustomKeyGroup[];
} | null>(null);

export default function IdentityTree({ nodeId, username: _username, namespace, onNavigate, pageSize, reorderOnUse = false, onPathChange, access, me, pending, hide, initialOpen = false, facebookConnect, filterQuery }: IdentityTreeProps) {
  const fixed = pageSize ? Math.max(1, Math.floor(pageSize)) : undefined;
  const treeRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = treeRef.current; if (!el) return undefined;
    const read = () => {
      const panel = el.closest('[data-cleaker-panel]') as HTMLElement | null;
      // Wrap against the room the card can grow into (bounds minus body
      // padding and the clip's own padding), not the current paper width.
      // Using the live clip would lock a short card at 3 icons per row.
      const box = (el.querySelector('[data-keys-clip]') as HTMLElement | null)
        || (el.querySelector('[data-qr-scroll]') as HTMLElement | null)
        || el;
      const cs = getComputedStyle(box);
      const clipPad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const max = availableMenuContentWidth(panel, undefined, el);
      const room = max > 0 ? Math.max(0, max - clipPad) : 0;
      const inner = box.clientWidth - clipPad;
      setWidth(room > 0 ? room : (inner > 0 ? inner : (el.getBoundingClientRect().width || 0)));
    };
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    const panel = el.closest('[data-cleaker-panel]') as HTMLElement | null;
    if (panel) ro?.observe(panel);
    const clip = el.querySelector('[data-keys-clip], [data-qr-scroll]') as HTMLElement | null;
    if (clip) ro?.observe(clip);
    ro?.observe(el);
    window.addEventListener('resize', read);
    return () => { ro?.disconnect(); window.removeEventListener('resize', read); };
  }, []);
  const cap = rowCapacity(width);
  const [rowMode] = useKeysRowMode();
  const [open, setOpen] = React.useState(!!initialOpen);
  React.useEffect(() => { if (initialOpen) setOpen(true); }, [initialOpen]);
  /** The open trail under keys: ['meta'] → the meta level is open; ['meta','instagram'] → its card. */
  const [sel, setSel] = React.useState<string[]>([]);
  /** The level whose "+" card is open ('' = keys), or null. */
  const [adding, setAdding] = React.useState<string | null>(null);
  const seed = React.useContext(IdentityTreeSeedCtx);
  const listsFromVaultOrSeed = (): { saved: ServiceId[]; custom: CustomKeyGroup[] } => {
    const now = listSavedServices(namespace);
    const groups = listCustomKeyGroups(namespace);
    // Keep the seed visible until the vault has caught up — a partial write
    // (one envelope of many) must not shrink the tree mid-paint.
    if (seed && (seed.saved.length || seed.custom.length)) {
      const caughtUp = seed.saved.every((s) => now.includes(s))
        && seed.custom.every((c) => groups.some((g) => g.name === c.name));
      if (!caughtUp) return { saved: seed.saved, custom: seed.custom };
    }
    return { saved: now, custom: groups };
  };
  const [saved, setSaved] = React.useState<ServiceId[]>(() => listsFromVaultOrSeed().saved);
  const [custom, setCustom] = React.useState(() => listsFromVaultOrSeed().custom);
  const [order, setOrder] = React.useState<KeyOrderId[]>(() => readKeyOrder(namespace));
  const anchors = React.useRef(new Map<string, HTMLElement>());
  const setAnchor = React.useCallback((key: string) => (el: HTMLElement | null) => {
    if (el) anchors.current.set(key, el); else anchors.current.delete(key);
  }, []);

  // Every saved key as a leaf at its semantic path, in the stable order (a new key first, once).
  const hideRef = React.useRef(hide); hideRef.current = hide;
  const shown = (l: KeyLeaf) => !hideRef.current?.(l.path);
  const leaves: KeyLeaf[] = React.useMemo(() => orderByUsage<KeyLeaf>(
    [...saved.map((id) => ({ kind: 'service' as const, id, path: defOf(id).path })), ...custom.map((g) => ({ kind: 'custom' as const, name: g.name, path: g.name }))].filter(shown),
    order, leafId,
  ), [saved, custom, order, hide]);
  const leavesRef = React.useRef(leaves); leavesRef.current = leaves;
  const treeSearch = useQrTreeSearch();
  const searchQuery = (filterQuery ?? treeSearch?.query ?? '').trim();
  const filtered = React.useMemo(
    () => (searchQuery ? filterKeyLeaves(leaves, searchQuery) : { leaves, hits: [] as ReturnType<typeof filterKeyLeaves>['hits'] }),
    [leaves, searchQuery],
  );
  const keysEntryMatches = Boolean(searchQuery && filterPersonalEntries(searchQuery).some((hit) => hit.id === 'keys'));
  // A match on the Keys root is a matching branch: the whole keys tree stays visible.
  const visibleLeaves = searchQuery && !keysEntryMatches ? filtered.leaves : leaves;
  React.useEffect(() => {
    if (searchQuery) setOpen(true);
  }, [searchQuery]);
  const treeSearchRef = React.useRef(treeSearch);
  treeSearchRef.current = treeSearch;
  const hitsKey = React.useMemo(
    () => {
      const personal = searchQuery ? filterPersonalEntries(searchQuery) : [];
      return JSON.stringify([...personal, ...filtered.hits]);
    },
    [searchQuery, filtered.hits],
  );
  React.useEffect(() => {
    const api = treeSearchRef.current;
    if (!api) return undefined;
    const personal = searchQuery ? filterPersonalEntries(searchQuery) : [];
    api.setMatches([...personal, ...filtered.hits]);
    api.setActiveIndex(0);
    return () => api.setMatches([]);
  }, [searchQuery, hitsKey, filtered.hits]);

  React.useEffect(() => {
    const refresh = () => {
      const { saved: now, custom: groups } = listsFromVaultOrSeed();
      setSaved(now); setCustom(groups); setOrder(readKeyOrder(namespace));
      // A removed key's card must not stay open: the trail shrinks to what still exists.
      const next: KeyLeaf[] = [...now.map((id) => ({ kind: 'service' as const, id, path: defOf(id).path })), ...groups.map((g) => ({ kind: 'custom' as const, name: g.name, path: g.name }))].filter(shown);
      setSel((s) => { const t = trimToExisting(next, s); return t.length === s.length ? s : t; });
    };
    refresh();
    window.addEventListener(SERVICE_KEYS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(SERVICE_KEYS_CHANGED_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, [namespace, seed]);

  const focusNode = (path: string) => {
    const back = anchors.current.get(path)?.querySelector<HTMLElement>('button');
    requestAnimationFrame(() => back?.isConnected && back.focus());
  };
  // ✕, Esc, remove: same as tapping the open node again; focus returns to that node.
  const closeCard = () => {
    if (adding !== null) { focusNode(full(adding ? `${adding}.add` : 'add')); setAdding(null); return; }
    if (sel.length) { focusNode(full(sel.join('.'))); setSel(sel.slice(0, -1)); }
  };
  const toggleKeys = () => {
    // Set the opening/closing intent in the same click turn so the first
    // frame is never tagged "leave" while the keys are appearing.
    setOpen((o) => !o);
    setSel([]);
    setAdding(null);
  };
  const pick = (depth: number, child: KeyChild) => {
    const opening = sel[depth] !== child.seg || sel.length !== depth + 1;
    setAdding(null);
    setSel(opening ? [...sel.slice(0, depth), child.seg] : sel.slice(0, depth));
    // Opt-in MRU only: by default opening a key never moves it (stable order).
    if (reorderOnUse && opening && child.leaf && !child.group) setOrder(touchKey(namespace, leafId(child.leaf)));
  };
  const startAdd = (level: string) => {
    const depth = level ? level.split('.').length : 0;
    setSel((s) => s.slice(0, depth));
    setAdding((a) => (a === level ? null : level));
  };
  const onCreated = (leafPath: string) => { setAdding(null); setSel(leafPath.split('.')); };
  const revealPath = (raw: string) => {
    const cleaned = String(raw || '').trim().replace(/^keys\./, '').replace(/^\./, '');
    let segs = cleaned.split('.').filter(Boolean);
    if (segs[0] && segs[0] !== 'meta' && ['facebook', 'instagram', 'threads', 'app', 'user'].includes(segs[0])) {
      segs = ['meta', ...segs];
    }
    if (!cleaned || cleaned === 'keys') {
      setAdding(null);
      setOpen(true);
      setSel([]);
      return;
    }
    const next = trimToExisting(leavesRef.current, segs);
    if (!next.length) return;
    setAdding(null);
    setOpen(true);
    setSel(next);
  };
  React.useEffect(() => {
    if (!treeSearch) return undefined;
    treeSearch.registerReveal(revealPath);
    return () => treeSearch.registerReveal(null);
  }, [treeSearch]);

  // Public path of the open branch, for the QR: segments of the .me path, nothing else.
  const openSegs = !open ? [] : [KEYS_ROOT, ...(adding !== null ? (adding ? adding.split('.') : []) : sel)];
  const openPath = openSegs.join('.');
  const onPathRef = React.useRef(onPathChange); onPathRef.current = onPathChange;
  React.useEffect(() => { onPathRef.current?.(openPath ? openPath.split('.') : []); }, [openPath]);

  const nid = (path: string) => `${nodeId}.${path}`;
  const [inMenu, setInMenu] = React.useState(false);
  React.useLayoutEffect(() => { setInMenu(!!treeRef.current?.closest('[data-cleaker-panel]')); }, []);
  const wrap = inMenu && rowMode === 'rows';
  const scroll = inMenu && rowMode === 'scroll';
  const ctx: TreeCtx = {
    namespace, cap: scroll ? 1e6 : cap, inMenu, rowMode, fixed, leaves: visibleLeaves, saved, custom, sel, adding, access, filtering: Boolean(searchQuery),
    nid, anchor: (p) => anchors.current.get(p), setAnchor, pick, startAdd, closeCard, onCreated, revealPath,
    readers: [me, publicMetaReader(readPublicMeta(namespace))].filter(Boolean) as MeReader[],
    pending,
    facebookConnect,
  };
  // Presence (Theme/MotionPresence.tsx): the branch stays mounted until its exit has played.
  // Inside the QR card the paper itself animates the size, so the branch stays
  // mounted for the card's close duration and HeightGlide is skipped.
  const menu = React.useContext(QrMenuMotionCtx);
  const [holdKeys, setHoldKeys] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!inMenu) return;
    if (open) setHoldKeys(true);
    else if (menu.settled) setHoldKeys(false);
  }, [open, inMenu, menu.settled]);
  // New keys stay non-interactive only until their screen rect is stable
  // (<0.5px between frames), not until the card's residual motion ends.
  // The Keys trigger lives outside this box and stays clickable throughout.
  const keysClipRef = React.useRef<HTMLDivElement | null>(null);
  const [keysReady, setKeysReady] = React.useState(true);
  const gateKey = inMenu && open ? `${sel.join('.')}\n${adding ?? ''}` : '';
  const gateRef = React.useRef(gateKey);
  if (gateRef.current !== gateKey) {
    gateRef.current = gateKey;
    if (inMenu && open && keysReady) setKeysReady(false);
  }
  React.useLayoutEffect(() => {
    if (!inMenu || !open) {
      setKeysReady(true);
      return undefined;
    }
    setKeysReady(false);
    let raf = 0;
    let prev: { x: number; y: number }[] | null = null;
    const tick = () => {
      const root = keysClipRef.current;
      const nodes = root ? root.querySelectorAll('button, [data-dock-item], [data-dock-avatar]') : null;
      const next: { x: number; y: number }[] = [];
      if (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          const r = nodes[i].getBoundingClientRect();
          next.push({ x: r.left, y: r.top });
        }
      }
      if (prev && next.length && prev.length === next.length) {
        let max = 0;
        for (let i = 0; i < next.length; i++) {
          const d = Math.hypot(next[i].x - prev[i].x, next[i].y - prev[i].y);
          if (d > max) max = d;
        }
        if (max < 0.5) {
          setKeysReady(true);
          return;
        }
      }
      prev = next;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inMenu, open, sel, adding]);
  const keysMounted = inMenu ? (open || holdKeys) : open;
  const branch = usePresence(keysMounted ? KEYS_ROOT : null, (k) => k, inMenu ? 0 : MOTION_MS.contentOut);
  React.useLayoutEffect(() => {
    if (inMenu) menu.requestMeasure();
  }, [open, sel, adding, keysMounted, inMenu, menu, cap, rowMode]);
  const followDepth = inMenu && open ? 1 + sel.length + (adding !== null ? 1 : 0) : 0;
  useFollowOpenedRow(treeRef, Boolean(inMenu && open), followDepth, `${sel.join('.')}:${adding ?? ''}`);

  const keysBranch = branch.item ? (
        <MotionScope shown={inMenu ? keysMounted : branch.shown}>
        <Ctx.Provider value={{ ...ctx, keysReady }}>
          <Box sx={{ width: wrap ? '100%' : 'max-content', maxWidth: wrap ? '100%' : (inMenu ? 'none' : 'var(--qr-menu-content-max, none)'), display: 'flex', flexDirection: 'column' }}>
            <KeysLevel prefix="" />
          </Box>
        </Ctx.Provider>
        </MotionScope>
  ) : null;

  const keysPhase = open ? 'open' : (keysMounted || branch.item ? 'leave' : undefined);
  const [editorHost, setEditorHost] = React.useState<HTMLElement | null>(null);

  return (
    <MenuEditorHost.Provider value={editorHost}>
    <Box ref={treeRef} data-gui-component="IdentityTree" data-keys-row-mode={inMenu ? rowMode : undefined} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: inMenu ? '100%' : 'max-content', maxWidth: '100%', flex: inMenu ? '1 1 auto' : undefined, alignSelf: inMenu ? 'stretch' : undefined, minHeight: inMenu ? 0 : undefined, overflow: 'visible', boxSizing: 'border-box' }}>
      <Box
        sx={{
          // Keep its height so the tree scroller starts below this row.
          // Follow-form may scroll .meta under this edge; the scroller clips there.
          flex: '0 0 auto',
          width: inMenu ? '100%' : 'auto',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'visible',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
      <IdentityIconRow
        nodeId={nodeId}
        onNavigate={onNavigate}
        visibleIds={searchQuery ? filterPersonalEntries(searchQuery).map((hit) => hit.id as PersonalEntryId) : null}
        unfold={{ ids: UNFOLDS, expandedId: open ? 'keys' : null, onToggle: toggleKeys, entryRef: (_id, el) => setAnchor(KEYS_ROOT)(el) }}
      />
      </Box>
      <Box
        data-qr-scroll={inMenu ? '' : undefined}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: inMenu ? '100%' : 'max-content',
          maxWidth: '100%',
          flex: inMenu ? '1 1 auto' : undefined,
          minHeight: inMenu ? 0 : undefined,
          overflowX: inMenu ? 'hidden' : undefined,
          overflowY: inMenu ? 'auto' : undefined,
          // Clip scrolled rows at this top edge, just below the action row.
          // Do not paint tree icons underneath Keys / Wallet / Profile / Contacts.
          position: inMenu ? 'relative' : undefined,
          WebkitOverflowScrolling: inMenu ? 'touch' : undefined,
          boxSizing: 'border-box',
          pb: inMenu && keysMounted ? '2rem' : 0,
          scrollPaddingBottom: inMenu ? '2rem' : undefined,
          ...(inMenu ? { '& > *': { flexShrink: 0 } } : {}),
        }}
      >
      <Box
        ref={(el: HTMLDivElement | null) => {
          keysClipRef.current = el;
          if (!el) return;
          // inert blocks pointer, keyboard and focus; set it as a real attribute
          // so it works on React 18 as well as 19.
          if (inMenu && open && !keysReady) el.setAttribute('inert', '');
          else el.removeAttribute('inert');
        }}
        data-keys-clip=""
        data-keys-inert={inMenu && open && !keysReady ? '' : undefined}
        onFocusCapture={(event: React.FocusEvent<HTMLDivElement>) => {
          const t = event.target as HTMLElement;
          if (inMenu && t && t !== event.currentTarget) {
            t.scrollIntoView({ inline: 'nearest', block: 'nearest' });
          }
        }}
        sx={{
          width: inMenu ? (wrap ? '100%' : 'calc(100% + 1rem)') : 'auto',
          // 0.5rem covers the 8px badge (offset -3) and the 2px+1px focus ring
          // so overflow:hidden does not clip them. Negative margin keeps the
          // visual gap to the card edge equal to the body's side padding.
          // Only while keys are open: when collapsed this padding reserved a
          // 16px empty slot under the icon row.
          p: inMenu && open ? '0.5rem' : 0,
          m: inMenu && open ? (wrap ? 0 : '-0.5rem') : 0,
          overflowX: scroll && menu.settled ? 'auto' : (wrap ? 'visible' : 'hidden'),
          overflowY: scroll ? 'hidden' : 'visible',
          scrollSnapType: scroll ? 'x proximity' : undefined,
          WebkitOverflowScrolling: scroll ? 'touch' : undefined,
          // Edge fade hints that the single scroll row continues off-screen.
          maskImage: scroll ? 'linear-gradient(to right, transparent, #000 0.75rem, #000 calc(100% - 0.75rem), transparent)' : undefined,
          WebkitMaskImage: scroll ? 'linear-gradient(to right, transparent, #000 0.75rem, #000 calc(100% - 0.75rem), transparent)' : undefined,
        }}
      >
        <Box
          data-motion-glide="keys"
          data-keys-phase={keysPhase}
          sx={{
            width: wrap ? '100%' : 'max-content',
            maxWidth: wrap ? '100%' : (inMenu ? 'none' : 'var(--qr-menu-content-max, none)'),
            position: 'relative',
            left: 0,
            transform: 'none',
          }}
        >
          {inMenu ? keysBranch : <HeightGlide>{keysBranch}</HeightGlide>}
        </Box>
      </Box>
      {inMenu && (
        <Box
          ref={setEditorHost}
          data-tree-editor=""
          sx={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', alignSelf: 'stretch', overflow: 'hidden', flex: '0 0 auto' }}
        />
      )}
      </Box>
    </Box>
    </MenuEditorHost.Provider>
  );
}

/** What opens below a level: its "+" card, a child group's level, or a leaf's value card. */
type Sub = { kind: 'add' } | { kind: 'group'; child: KeyChild } | { kind: 'leaf'; child: KeyChild };
const subKey = (prefix: string, s: Sub) => (s.kind === 'add' ? `add:${prefix}` : s.child.path);

/**
 * One level of the keys tree: the children of `prefix` ('' = keys) on rows
 * that read "+ content …" (+ creates AT this level; … shows more; Show less
 * folds back), then whatever is open below it — recursively. Each branch
 * draws its own relative label once on its line (.keys, .meta, .instagram).
 */
function KeysLevel({ prefix }: { prefix: string }) {
  const c = React.useContext(Ctx)!;
  const { shown: parentShown } = useMotion();
  const depth = prefix ? prefix.split('.').length : 0;
  const levelPath = full(prefix);
  const children = childrenAt(c.leaves, prefix);
  const selSeg = c.sel.length > depth ? c.sel[depth] : undefined;
  const selected = selSeg !== undefined ? children.find((ch) => ch.seg === selSeg) : undefined;
  const canCreate = !c.filtering && accessFor(c.access, levelPath) === 'edit';
  const addPath = full(prefix ? `${prefix}.add` : 'add');

  const [shown, setShown] = React.useState(1); // blocks (rows) shown
  // "Show less": the extra rows leave first (reverse cascade), then the row-block resets and the space glides shut.
  const [collapsing, setCollapsing] = React.useState(false);
  const collapseTimer = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(collapseTimer.current), []);
  const isActive = (ch: KeyChild) => ch === selected;
  const visible = c.inMenu ? children : visibleBlock(children, shown, c.cap, c.fixed, isActive);
  const firstBlock = visibleBlock(children, 1, c.cap, c.fixed, isActive).length;
  const fullyShown = !c.inMenu && shown > 1 && visible.length === children.length;
  const showLess = () => {
    const leaving = visible.length - firstBlock;
    if (leaving <= 0 || prefersReducedMotion()) { setShown(1); return; }
    setCollapsing(true);
    window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => { setShown(1); setCollapsing(false); }, leaveTotalMs(leaving));
  };
  const leavingAt = (i: number) => (collapsing && i >= firstBlock ? leaveDelay(visible.length - 1 - i) : undefined);

  const subValue: Sub | null = c.adding === prefix ? { kind: 'add' }
    : selected ? (selected.group ? { kind: 'group', child: selected } : { kind: 'leaf', child: selected }) : null;
  const sub = usePresence(subValue, (s) => subKey(prefix, s), MOTION_CARD.exit);

  // Slot index among the nodes this level actually renders (add + visible + more/less).
  // Children open under that slot's ROW, so a wrap no longer buries them under later siblings.
  const lead = canCreate ? 1 : 0;
  const activeSlot: number | undefined = c.adding === prefix
    ? (canCreate ? 0 : undefined)
    : selected
      ? (() => { const i = visible.findIndex((ch) => ch === selected); return i >= 0 ? lead + i : undefined; })()
      : undefined;
  const insetAfterRow = sub.item && activeSlot !== undefined
    ? Math.floor(activeSlot / Math.max(1, c.cap))
    : undefined;
  const dimSiblings = Boolean(sub.item && sub.shown);
  const activeNodeId = c.adding === prefix
    ? c.nid(addPath)
    : selected
      ? c.nid(full(selected.path))
      : undefined;

  const subView = sub.item ? (() => {
    const S = sub.item!;
    const key = subKey(prefix, S);
    const anchorPath = S.kind === 'add' ? addPath : full(S.child.path);
    const at = () => c.anchor(anchorPath);
    return (
      <MotionScope key={key} shown={sub.shown && parentShown}>
        {/* The space below this row unfolds in one transition (grid 0fr→1fr). Later sibling rows ride with it. */}
        <RevealHeight instant={sub.swap}>
          {S.kind === 'group' ? (
            <KeysLevel prefix={S.child.path} />
          ) : (
            <TreeLevel
              anchor={at} nodeId={c.nid(anchorPath)} leaf card accentStem
              arm={S.kind === 'add' ? undefined : `.${S.child.seg}`}
            >
              <Box
                data-tree-node data-branch-editor=""
                sx={(t: any) => ({
                  // Size to the fields, not the card: 20–32rem, or the
                  // available width minus side air when the card is narrower.
                  width: 'fit-content',
                  boxSizing: 'border-box',
                  minWidth: 'min(20rem, calc(100% - 1.5rem))',
                  maxWidth: 'min(32rem, calc(100% - 1.5rem))',
                  alignSelf: 'flex-start',
                  // The selected branch's own line continues into the editor frame: an accent-tinted
                  // hairline, barely rounded (4.4px), lifted by the softest shadow. Same background as
                  // the tree (no paper fill), never a rounded modal.
                  border: '1px solid',
                  borderColor: t.palette.mode === 'dark' ? alpha(t.palette.primary.light, 0.7) : alpha(t.palette.primary.main, 0.55),
                  borderRadius: '4.4px',
                  bgcolor: 'transparent', px: 1.5, py: 1.25,
                  boxShadow: t.palette.mode === 'dark'
                    ? '0 6px 18px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : '0 1px 2px rgba(16,24,40,0.05), 0 6px 16px -6px rgba(16,24,40,0.10)',
                })}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); c.closeCard(); } }}
              >
                {S.kind === 'add' ? <AddCard prefix={prefix} /> : <LeafCard leaf={S.child.leaf!} />}
              </Box>
            </TreeLevel>
          )}
        </RevealHeight>
      </MotionScope>
    );
  })() : undefined;

  const editorHost = React.useContext(MenuEditorHost);
  const liftEditor = Boolean(c.inMenu && sub.item && sub.item.kind !== 'group');

  return (
    <>
    <TreeLevel
      anchor={() => c.anchor(levelPath)} arm={`.${depth === 0 ? KEYS_ROOT : lastSeg(prefix)}`} tall={depth === 0}
      nodeId={c.nid(levelPath)} collapsing={collapsing}
      activeNodeId={activeNodeId} accentStem={Boolean(sub.item)}
      insetAfterRow={liftEditor ? undefined : insetAfterRow} inset={liftEditor ? undefined : subView}
    >
      {canCreate && (
        <TreeNode
          ref={c.setAnchor(addPath)} nodeId={c.nid(addPath)} name={depth === 0 ? 'Add key' : `Add to ${metaOfGroup(prefix, c.readers).label}`} dashed expanded={c.adding === prefix}
          dimmed={dimSiblings && c.adding !== prefix}
          onClick={() => c.startAdd(prefix)}
        >
          <Icon name="add" fontSize={NODE_ICON} />
        </TreeNode>
      )}
      {visible.map((ch, i) => { const m = metaOf(ch, c); return (
        <TreeNode
          key={ch.path} ref={c.setAnchor(full(ch.path))} nodeId={c.nid(full(ch.path))}
          name={m.label} path={`.${ch.seg}`} group={ch.group} iconSource={m.iconSource}
          expanded={isActive(ch)} dimmed={dimSiblings && !isActive(ch)}
          onClick={() => c.pick(depth, ch)} leaving={leavingAt(i)}
          pending={!!c.pending?.some((p) => p === full(ch.path) || p.startsWith(`${full(ch.path)}.`))}
          notice={noticeOf(ch, c)} dashed={noticeOf(ch, c) === 'disconnected'}
        >
          {(() => {
            // meta.user / a Page / an Instagram account: its photo when the connect saved one (and the tree declares no icon).
            const lf = ch.leaf;
            const photo = !ch.group && lf?.kind === 'custom' && m.iconSource !== 'tree'
              ? (() => { const g = c.custom.find((x) => x.name === lf.name); return profilePhotoSrc(g?.publicValues?.picture ?? g?.display?.picture); })() : undefined;
            const live = brandLive(ch, c);
            return photo ? <ProfilePhoto src={photo} size={26} fallbackNode={<MetaIcon icon={m.icon} live={live} />} /> : <MetaIcon icon={m.icon} live={live} />;
          })()}
        </TreeNode>
      ); })}
      {/* Last slot: "…" while there is more; once everything is shown it becomes "Show less". */}
      {visible.length < children.length ? (
        <TreeNode key="more" nodeId={c.nid(full(prefix ? `${prefix}.more` : 'more'))} name={`${children.length - visible.length} more`} muted dimmed={dimSiblings} onClick={() => setShown((b) => b + 1)}>
          <Icon name="more_horiz" fontSize={NODE_ICON} />
        </TreeNode>
      ) : fullyShown ? (
        <TreeNode key="less" nodeId={c.nid(full(prefix ? `${prefix}.less` : 'less'))} name="Show less" muted dimmed={dimSiblings} onClick={showLess}>
          <Icon name="expand_less" fontSize={NODE_ICON} />
        </TreeNode>
      ) : null}
      {prefix === 'meta' && c.facebookConnect && !c.facebookConnect.connected && (
        <Box
          component="button"
          type="button"
          data-gui-node-id={c.nid(full('meta.connect-facebook'))}
          aria-label="Connect with Facebook"
          disabled={!c.facebookConnect.enabled}
          title={c.facebookConnect.enabled ? 'Connect with Facebook' : 'Add your App ID and App Secret under .keys.meta.app first.'}
          onClick={() => { if (c.facebookConnect?.enabled) c.facebookConnect.onClick(); }}
          sx={{
            display: 'inline-flex', alignItems: 'center', alignSelf: 'center', gap: 0.5, ml: 0.5, px: 1, py: 0.5,
            typography: 'body2', fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap',
            border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default', color: 'text.primary',
            cursor: c.facebookConnect.enabled ? 'pointer' : 'default', opacity: c.facebookConnect.enabled ? 1 : 0.45,
            '&:hover': c.facebookConnect.enabled ? { bgcolor: 'action.hover' } : undefined,
          }}
        >
          Connect with Facebook
        </Box>
      )}
    </TreeLevel>
    {liftEditor && editorHost && subView ? createPortal(subView, editorHost) : null}
    </>
  );
}


const NOTICE_LABEL: Record<Exclude<KeyNotice, 'ok'>, string> = {
  expiring: 'expiring',
  dead: 'invalid token',
  disconnected: 'disconnected',
};
const NOTICE_COLOR: Record<Exclude<KeyNotice, 'ok'>, string> = {
  expiring: 'warning.main',
  dead: 'error.main',
  disconnected: 'text.disabled',
};
function noticeOf(ch: KeyChild, c: TreeCtx): Exclude<KeyNotice, 'ok'> | undefined {
  const hits = c.custom.filter((g) => g.name === ch.path || g.name.startsWith(`${ch.path}.`));
  const notes = hits.map((g) => keyNoticeFromGroup(g)).filter((n): n is Exclude<KeyNotice, 'ok'> => !!n);
  if (notes.includes('dead')) return 'dead';
  if (notes.includes('expiring')) return 'expiring';
  if (notes.includes('disconnected')) return 'disconnected';
  return undefined;
}
/** Built-in icon/name of a group level (GROUP_INFO), used when the tree declares none. */
function groupBuiltin(path: string): { icon: NodeIcon; label: string } {
  const g = GROUP_INFO[path];
  return { icon: g?.service ? { kind: 'brand', service: g.service } : { kind: 'icon', name: g?.icon ?? 'folder' }, label: g?.name ?? lastSeg(path) };
}
/** Built-in icon of a Meta key: the person for meta.user, apps for meta.app, the brand for a Page / Instagram / Threads account. */
function autoKeyIcon(name: string): NodeIcon | undefined {
  if (name === 'meta.user') return { kind: 'icon', name: 'account_circle' };
  if (name === 'meta.app') return { kind: 'icon', name: 'apps' };
  const brand = autoKeyBrand(name);
  return brand ? { kind: 'brand', service: brand } : undefined;
}
const metaOfGroup = (prefix: string, readers: MeReader[]) => resolveNodeMeta(full(prefix), readers, groupBuiltin(prefix));
/** A node's icon + label: declared `.icon` / `.label` in the tree → built-in → default (keyMeta.ts). */
function metaOf(ch: KeyChild, c: TreeCtx): ResolvedMeta {
  if (ch.group) return metaOfGroup(ch.path, c.readers);
  const l = ch.leaf!;
  if (l.kind === 'service') { const d = defOf(l.id); return resolveNodeMeta(full(ch.path), c.readers, { icon: { kind: 'brand', service: l.id }, label: d.tooltip ?? d.name }); }
  return resolveNodeMeta(full(ch.path), c.readers, { icon: c.custom.find((g) => g.name === l.name)?.mark ?? autoKeyIcon(l.name), label: lastSeg(l.name) });
}
function MetaIcon({ icon, live = false }: { icon: NodeIcon; live?: boolean }) {
  return icon.kind === 'brand' ? <ServiceIcon service={icon.service} brand={live} /> : <CustomMark mark={icon} />;
}
/**
 * Saved services show their brand color (ServiceIcons BRAND_COLORS; monochrome marks stay plain).
 * Facebook / Instagram show their brand color only while live: Facebook connected (meta.user saved, token not dead)
 * and the node holds data that works. A Page / account: its own group is not dead or disconnected. The branch
 * (.facebook / .instagram): at least one such account under it. Anything else keeps the plain icon.
 */
function brandLive(ch: KeyChild, c: TreeCtx): boolean {
  if (!/^meta\.(facebook|instagram)(\.|$)/.test(ch.path)) {
    // A saved service (Twitch, PayPal, WhatsApp, Google, LinkedIn, npm, Twilio…): its leaf, and a level holding one.
    if (!ch.group) return ch.leaf?.kind === 'service';
    return c.saved.some((id) => { const p = defOf(id).path; return p === ch.path || p.startsWith(`${ch.path}.`); });
  }
  if (c.facebookConnect && (!c.facebookConnect.connected || c.facebookConnect.notice === 'dead')) return false;
  const hits = c.custom.filter((g) => g.name === ch.path || g.name.startsWith(`${ch.path}.`));
  return hits.some((g) => { const n = keyNoticeFromGroup(g); return n !== 'dead' && n !== 'disconnected'; });
}

/** The value card at a leaf, with the viewer's rights on that path. */
function LeafCard({ leaf }: { leaf: KeyLeaf }) {
  const c = React.useContext(Ctx)!;
  const access = accessFor(c.access, full(leaf.path));
  if (leaf.kind === 'service') {
    return (
      <ServiceKeyCard
        namespace={c.namespace} def={defOf(leaf.id)} access={access} onClose={c.closeCard} onRemoved={c.closeCard} tone="branch"
        fieldPath={(f) => fieldPath(leaf.id, f).slice(servicePath(leaf.id).length)} fieldNodeId={(f) => c.nid(fieldPath(leaf.id, f))}
      />
    );
  }
  const found = c.custom.find((g) => g.name === leaf.name) ?? null;
  // The card's icon picker starts from the node's declared .icon (else the old stored mark).
  const declared = resolveNodeMeta(full(leaf.path), c.readers).iconSource === 'tree' ? resolveNodeMeta(full(leaf.path), c.readers).icon : undefined;
  const group = found && declared && declared.kind !== 'brand' ? { ...found, mark: declared } : found;
  return (
    <CustomKeyCard
      key={leaf.name} namespace={c.namespace} group={group} access={access} tone="branch"
      connection={leaf.name === 'meta.user' && c.facebookConnect?.connected ? {
        ...(c.facebookConnect.notice ? { notice: c.facebookConnect.notice } : {}),
        enabled: c.facebookConnect.enabled,
        onReconnect: () => { if (c.facebookConnect?.enabled) c.facebookConnect.onClick(); },
      } : undefined}
      fieldPath={(_g, f) => `.${f}`} fieldNodeId={(g, f) => c.nid(`${full(g)}.${f}`)}
      onSaved={(name) => c.onCreated(name)} onRemoved={c.closeCard} onClose={c.closeCard}
      onOpenPath={c.revealPath}
    />
  );
}

/** "+" at a level: create a key under it — a built-in leaf still missing there, or a custom one. */
function AddCard({ prefix }: { prefix: string }) {
  const c = React.useContext(Ctx)!;
  const head = prefix ? `${prefix}.` : '';
  return (
    <NewKeyCard
      namespace={c.namespace} level={prefix} templates={templatesAt(prefix, c.saved)} tone="branch"
      soon={presetsAt(prefix, c.saved).filter((p) => p.kind === 'soon')}
      templateLabel={(id) => { const d = defOf(id); return `${d.name} · .${d.path.slice(head.length)}`; }}
      servicePath={(id, f) => fieldPath(id, f).slice(servicePath(id).length)} serviceNodeId={(id, f) => c.nid(fieldPath(id, f))}
      customPath={(_g, f) => `.${f}`} customNodeId={(g, f) => c.nid(`${full(g)}.${f}`)}
      onClose={c.closeCard}
      onSaved={(it) => c.onCreated(it.kind === 'service' ? defOf(it.id).path : it.name)}
      connect={c.facebookConnect && !c.facebookConnect.connected && (prefix === '' || prefix === 'meta')
        ? { onConnect: () => { c.facebookConnect?.onClick(); }, ...(c.facebookConnect.message ? { message: c.facebookConnect.message } : {}) }
        : undefined}
    />
  );
}

/**
 * A node: a stable outer box (tree anchor, obstacle, Dock item — never
 * transformed, so hairlines stay put) and the visible button inside, which the
 * row's Dock magnification scales (`data-dock-avatar`).
 */
export const TreeNode = React.forwardRef<HTMLDivElement, {
  nodeId: string; name: string; path?: string; expanded?: boolean; muted?: boolean; dashed?: boolean; onClick: () => void; children: React.ReactNode;
  /** Opens a level (not a card). */
  group?: boolean;
  /** Where its icon came from: the tree's declared .icon, a built-in, or the default key. */
  iconSource?: string;
  /** Set while "Show less" removes this node: its delay in the reverse cascade (ms). */
  leaving?: number;
  /** An app request waits at this path (or below it). */
  pending?: boolean;
  /** Non-selected sibling while a child of this level is open: quieter, so the eye stays on the path. */
  dimmed?: boolean;
  /** Token / connection badge: expiring (< 7 days), dead (error 190), or disconnected. */
  notice?: Exclude<KeyNotice, 'ok'>;
}>(function TreeNode({ nodeId, name, path, expanded = false, muted = false, dashed = false, onClick, children, leaving, group = false, iconSource, pending = false, dimmed = false, notice }, ref) {
  // Unfold: nodes mounting together cascade (24 ms apart, capped at 150 ms) — on the avatar, as an
  // animation (scale/translate/opacity, never `transform`, which the Dock hover owns); the outer box
  // keeps its layout (tree anchor / obstacle). Closing: a quick fade on the outer box.
  const { shown, reduced } = useMotion();
  const treeCtx = React.useContext(Ctx);
  const inMenu = Boolean(treeCtx?.inMenu);
  const keysReady = treeCtx?.keysReady ?? true;
  const [entered, setEntered] = React.useState(() => !inMenu);
  const sawUnready = React.useRef(!keysReady);
  if (!keysReady) sawUnready.current = true;
  React.useLayoutEffect(() => {
    if (!inMenu || reduced) { setEntered(true); return undefined; }
    if (keysReady && sawUnready.current) setEntered(true);
    return undefined;
  }, [inMenu, keysReady, reduced]);
  const take = React.useContext(StaggerContext);
  const [delay] = React.useState(() => staggerDelay(take()));
  const spring = spatialSpring();
  // The tooltip anchors to this stable outer box (never scaled), so its place does not depend on the Dock hover.
  return (
    <NodeTip name={name} path={path} off={expanded && !!group}>
    <Box
      ref={ref} data-tree-node data-dock-item
      sx={{
        width: NODE_SIZE, height: NODE_SIZE, flex: 'none', position: 'relative', zIndex: 1,
        opacity: inMenu
          ? (dimmed ? 0.55 : (entered || reduced ? 1 : 0.35))
          : (shown ? (dimmed ? 0.55 : 1) : 0),
        transition: inMenu
          ? (reduced ? 'none' : dimmed
            ? `opacity 180ms ${EASE.standardAccelerate}`
            : 'opacity 140ms linear')
          : `opacity ${reduced ? 0 : (dimmed || shown ? 180 : MOTION_MS.contentOut)}ms ${EASE.standardAccelerate}`,
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
        <Box
          component="button" type="button" data-dock-avatar data-gui-node-id={nodeId}
          aria-label={[name, pending ? 'request pending' : '', notice ? NOTICE_LABEL[notice] : ''].filter(Boolean).join(' · ')} aria-expanded={expanded} data-key-group={group || undefined} data-icon-source={iconSource} data-pending={pending || undefined} data-notice={notice || undefined} onClick={onClick}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE, p: 0, boxSizing: 'border-box',
            border: '1px', borderStyle: dashed && !expanded ? 'dashed' : 'solid', borderColor: expanded ? 'primary.main' : 'divider', borderRadius: 1,
            bgcolor: 'background.default', color: expanded ? 'primary.main' : muted ? 'text.secondary' : 'text.primary',
            cursor: 'pointer', position: 'relative', '&:hover': { bgcolor: 'action.hover', color: expanded ? 'primary.main' : 'text.primary' },
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
            pointerEvents: leaving !== undefined ? 'none' : undefined,
            // In the QR card, new keys fade 140ms linear once their rect is stable;
            // skip the staggered node fade/pop so that short fade is the one you see.
            animation: leaving !== undefined
              ? `${NODE_OUT} ${MOTION_LEAVE.item}ms ${EASE.standardAccelerate} ${leaving}ms forwards`
              : (reduced || inMenu)
              ? 'none'
              : `${NODE_FADE} ${MOTION_MS.contentIn}ms ${EASE.emphasizedDecelerate} ${delay}ms backwards, ${NODE_POP} ${spring.ms}ms ${spring.easing} ${delay}ms backwards`,
          }}
        >
          {children}
          {pending && (
            <Box aria-hidden data-pending-dot sx={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', boxShadow: (t) => `0 0 0 2px ${t.palette.background.default}` }} />
          )}
          {notice && (
            <Box aria-hidden data-notice-dot={notice} sx={{ position: 'absolute', bottom: -3, right: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: NOTICE_COLOR[notice], boxShadow: (t) => `0 0 0 2px ${t.palette.background.default}` }} />
          )}
        </Box>
    </Box>
    </NodeTip>
  );
});

const NODE_FADE = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const NODE_POP = keyframes`from { scale: ${MOTION_SPACE.nodeScale}; translate: 0 -${MOTION_SPACE.nodeLift}px; } to { scale: 1; translate: 0 0; }`;
const NODE_OUT = keyframes`to { opacity: 0; scale: 0.8; translate: 0 -4px; }`;
const LINE_DRAW = keyframes`from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; }`;
const ARM_IN = keyframes`from { opacity: 0; } to { opacity: 1; }`;
/** Per-level cascade counter (MotionPresence.tsx useStaggerBatch): nodes mounting in one frame get 0, 1, 2… */
const StaggerContext = React.createContext<() => number>(() => 0);

const DROP = 8; // bus sits this far above each row of nodes
const GUTTER = 4; // left spine x when a level wraps onto several rows

/** One level of the tree: a row of nodes hung from `anchor` by a hairline. */
function DockRow({ leaf, sx, children }: { leaf?: boolean; sx?: object; children: React.ReactNode }) {
  const dock = useDockRow(nodePx());
  const treeCtx = React.useContext(Ctx);
  const inMenu = Boolean(treeCtx?.inMenu);
  const wrap = inMenu && treeCtx?.rowMode !== 'scroll';
  const scroll = inMenu && treeCtx?.rowMode === 'scroll';
  return (
    <Box
      data-tree-row
      data-keys-row={wrap && !leaf ? '' : undefined}
      ref={leaf ? undefined : dock.ref}
      onPointerMove={leaf ? undefined : dock.onPointerMove}
      onPointerLeave={leaf ? undefined : dock.onPointerLeave}
      sx={{
        display: 'flex', flexWrap: 'nowrap',
        justifyContent: inMenu ? 'flex-start' : 'center',
        gap: leaf ? 0 : 1.25, position: 'relative',
        width: scroll && !leaf ? 'max-content' : '100%',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: wrap ? 'visible' : undefined,
        ...(scroll && !leaf ? { '& > *': { scrollSnapAlign: 'start', flex: '0 0 auto' } } : {}),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function TreeLevel({ anchor, arm, tall = false, nodeId, leaf = false, card = false, collapsing = false, activeNodeId, accentStem = false, insetAfterRow, inset, cap: capProp, children }: {
  anchor: () => HTMLElement | undefined;
  /** This branch's own level (relative, e.g. ".keys"), drawn once on its arm. */
  arm?: string; tall?: boolean; nodeId: string; leaf?: boolean;
  /** A card level: lines keep the card's tempo (they arrive with it). */
  card?: boolean;
  /** "Show less" in progress: every row after the first retracts its lines. */
  collapsing?: boolean;
  /** The selected node at this level: its drop and the stem are drawn in the theme primary. */
  activeNodeId?: string;
  /** Colour the stem as the active path (a card, or a group whose children are open). */
  accentStem?: boolean;
  /** Insert `inset` after this visual row (0-based), pushing later sibling rows below it. */
  insetAfterRow?: number;
  inset?: React.ReactNode;
  /** Nodes per row when used outside an IdentityTree (e.g. the card's themes); the tree's own width otherwise. */
  cap?: number;
  children: React.ReactNode;
}) {
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  type TreeSeg = { k: string; d: string; accent?: boolean; later?: boolean };
  const [segs, setSegs] = React.useState<TreeSeg[]>([]);
  const segsRef = React.useRef(segs); segsRef.current = segs;
  const { shown, reduced } = useMotion();
  const take = useStaggerBatch();
  const [armAt, setArmAt] = React.useState<{ x: number; y: number } | null>(null);
  const treeCtx = React.useContext(Ctx);
  const cap = Math.max(1, capProp ?? treeCtx?.cap ?? 99);
  const inMenu = Boolean(treeCtx?.inMenu);
  const scroll = inMenu && treeCtx?.rowMode === 'scroll';

  const items = React.Children.toArray(children);
  const rows = leaf || scroll ? [items] : chunkRows(items, cap);

  // A closing level keeps the lines it has (they are retracting) — no re-routing while the rows
  // above it collapse. And never more than a few re-measures per frame (no layout ping-pong).
  const shownRef = React.useRef(shown); shownRef.current = shown;
  const budget = React.useRef({ frame: -1, n: 0 });
  const measure = React.useCallback(() => {
    const box = boxRef.current; const a = anchor();
    if (!box || !a) return;
    if (!shownRef.current && segsRef.current.length) return;
    const f = Math.floor(performance.now() / 16);
    if (budget.current.frame !== f) budget.current = { frame: f, n: 0 };
    if ((budget.current.n += 1) > 6) return;
    const br = box.getBoundingClientRect(); const ar = a.getBoundingClientRect();
    const ax = ar.left + ar.width / 2 - br.left; const ay = ar.bottom - br.top;
    // A leaf editor is framed by the branch itself: the stem meets the top edge of the
    // square outline under the selected icon — never a drop to the box's centre.
    if (card) {
      const frame = box.querySelector<HTMLElement>('[data-branch-editor]')
        ?? box.querySelector<HTMLElement>(':scope > [data-tree-row] > [data-tree-node]');
      if (!frame) { setSegs((p) => (p.length ? [] : p)); return; }
      // Sit under the opening icon and grow toward the remaining room, so a
      // narrow form is not stretched across the card. The stem stays on ax.
      if (inMenu) {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const gutter = 0.75 * rem;
        const fw = frame.getBoundingClientRect().width;
        let left = ar.left - br.left;
        if (left + fw > br.width - gutter) left = br.width - gutter - fw;
        if (left < gutter) left = gutter;
        const ml = `${Math.round(Math.max(0, left) * 100) / 100}px`;
        if (frame.style.marginLeft !== ml) frame.style.marginLeft = ml;
      }
      const top = frame.getBoundingClientRect().top - br.top;
      const gapTop = Math.max(ay, 0);
      const armY = Math.round((gapTop + top) / 2); const armX = Math.round(ax);
      setArmAt((p) => (p && p.x === armX && p.y === armY ? p : { x: armX, y: armY }));
      const next = [{ k: 'stem', d: `M${ax} ${ay}V${top}`, accent: true }];
      setSegs((p) => (p.length === next.length && p.every((x, i) => x.k === next[i].k && x.d === next[i].d && !!x.accent) ? p : next));
      return;
    }
    // Only this level's rows — never nodes inside an inset (those belong to the child level).
    const nodes = Array.from(box.querySelectorAll<HTMLElement>(':scope > [data-tree-row] > [data-tree-node]'));
    type Pt = { x: number; id?: string };
    const grouped = new Map<number, Pt[]>();
    for (const n of nodes) {
      const r = n.getBoundingClientRect();
      const top = Math.round(r.top - br.top);
      const id = n.querySelector('[data-gui-node-id]')?.getAttribute('data-gui-node-id')
        ?? n.getAttribute('data-gui-node-id')
        ?? undefined;
      grouped.set(top, [...(grouped.get(top) ?? []), { x: r.left + r.width / 2 - br.left, id }]);
    }
    const tops = [...grouped.keys()].sort((x, y) => x - y);
    if (!tops.length) { setSegs((p) => (p.length ? [] : p)); return; }
    const multi = tops.length > 1;
    // Stem: straight down from the parent into the first row. Children now sit under that
    // parent's own row, so the stem no longer has to jog around later siblings.
    const root = box.closest('[data-gui-component="IdentityTree"]') ?? box.parentElement;
    const own = new Set(nodes);
    const firstBus = tops[0] - DROP;
    const obstacles = Array.from(root?.querySelectorAll<HTMLElement>('[data-tree-node]') ?? [])
      .filter((n) => n !== a && !own.has(n))
      .map((n) => { const r = n.getBoundingClientRect(); return { l: r.left - br.left - 4, r: r.right - br.left + 4, t: r.top - br.top, b: r.bottom - br.top }; })
      .filter((o) => o.b > ay && o.t < firstBus);
    const blocked = (x: number) => obstacles.some((o) => x > o.l && x < o.r);
    let sx = ax; let jog = ''; let armEnd = firstBus;
    if (blocked(ax)) {
      const cands = obstacles.flatMap((o) => [o.l, o.r]).filter((x) => !blocked(x)).sort((p, q) => Math.abs(p - ax) - Math.abs(q - ax));
      const firstTop = Math.min(...obstacles.map((o) => o.t));
      if (cands.length) { sx = cands[0]; const y1 = ay + Math.max(4, (firstTop - ay) / 2); jog = `M${ax} ${ay}V${y1}H${sx}V${firstBus}`; armEnd = y1; }
    }
    // Keep the arm label in this level's padding band, never over the parent or child rows.
    const gapTop = Math.max(ay, 0);
    const armY = Math.round((gapTop + Math.min(armEnd, firstBus)) / 2); const armX = Math.round(ax);
    setArmAt((p) => (p && p.x === armX && p.y === armY ? p : { x: armX, y: armY }));
    // Grey structure first: every row's bus + drops, and the wrap spine for
    // later rows / an inset. These stay neutral — never accent — so a wrapped
    // level doesn't paint a second "path" down the left side.
    const next: Array<{ k: string; d: string; accent?: boolean; later?: boolean }> = [];
    let hitRow = -1;
    let hitPt: { x: number; id?: string } | undefined;
    tops.forEach((top, i) => {
      const pts = grouped.get(top)!;
      const xs = pts.map((p) => p.x);
      const bus = top - DROP;
      const lo = Math.min(...xs, ...(i === 0 ? [sx] : []), ...(multi ? [GUTTER] : []));
      const hi = Math.max(...xs, ...(i === 0 ? [sx] : []));
      if (i === 0) next.push({ k: 'stem', d: jog || `M${ax} ${ay}V${bus}` });
      next.push({ k: `row${i}`, d: `M${lo} ${bus}H${hi}${pts.map((p) => `M${p.x} ${bus}V${top}`).join('')}` });
      const hit = activeNodeId ? pts.find((p) => p.id === activeNodeId) : undefined;
      if (hit) { hitRow = i; hitPt = hit; }
    });
    if (multi) next.push({ k: 'spine', d: `M${GUTTER} ${tops[0] - DROP}V${tops[tops.length - 1] - DROP}` });
    // One accent path: parent stem → this level's bus (via the left spine only
    // if the selected child sits on a wrapped row) → drop to that child.
    // Nothing else is colored. No path when this level has no selected child
    // (an open group with no leaf must not leave a stem hanging).
    if (hitPt) {
      const firstBusY = tops[0] - DROP;
      const bus = tops[hitRow] - DROP;
      const top = tops[hitRow];
      let d = jog || `M${ax} ${ay}V${firstBusY}`;
      if (hitRow === 0) d += `H${hitPt.x}V${top}`;
      else d += `H${GUTTER}V${bus}H${hitPt.x}V${top}`;
      next.push({ k: 'accent', d, accent: true, later: hitRow > 0 });
    }
    setSegs((p) => (p.length === next.length && p.every((x, i) => x.k === next[i].k && x.d === next[i].d && !!x.accent === !!next[i].accent) ? p : next));
  }, [anchor, activeNodeId, accentStem, card, inMenu]);

  React.useLayoutEffect(() => { measure(); });
  React.useEffect(() => {
    const box = boxRef.current; if (!box) return undefined;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null;
    ro?.observe(box); window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  return (
    <Box ref={boxRef} data-tree-level={nodeId} sx={{
      position: 'relative', pt: tall ? NODE_SIZE : arm ? '26px' : 2.5, px: leaf ? 0 : 1.5,
      ...(inMenu && leaf ? { width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' } : {}),
    }}>
      <Box component="svg" aria-hidden sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', color: 'divider' }}>
        {/* Lines grow toward the children with the opening (stem first, then each row's bus and drops)
            and retract with the content on close (pathLength=1 + stroke-dashoffset). */}
        {segs.map((sg) => {
          const stem = sg.k === 'stem';
          const T = card ? MOTION_CARD.enter : MOTION_MS.lineIn;
          const dur = stem ? T * 0.5 : T * 0.6;
          const delay = stem ? 0 : T * 0.4;
          const leavingRow = collapsing && (sg.k === 'spine' || (sg.k === 'accent' && sg.later) || (sg.k.startsWith('row') && sg.k !== 'row0'));
          const off = shown && !leavingRow ? 0 : 1;
          const outMs = leavingRow ? MOTION_LEAVE.item + MOTION_LEAVE.staggerCap / 2 : card ? MOTION_CARD.contentOut : MOTION_MS.lineOut;
          return (
            <Box
              component="path" key={sg.k} d={sg.d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={sg.accent ? 1.25 : 1}
              strokeLinecap={sg.accent ? 'square' : 'butt'} strokeLinejoin="miter"
              sx={{
                // Structure is a true grey (text.primary, no hue) so it cannot be
                // read as accent. The wrap spine is a touch stronger so it stays
                // visible beside an inset; it must never be primary.
                color: sg.accent ? 'primary.main' : 'text.primary',
                opacity: sg.accent ? 1 : sg.k === 'spine' ? 0.38 : 0.22,
                ...(reduced ? undefined : {
                  strokeDasharray: 1, strokeDashoffset: off,
                  transition: `stroke-dashoffset ${outMs}ms ${EASE.standardAccelerate}, color 180ms ${EASE.standardAccelerate}`,
                  animation: `${LINE_DRAW} ${dur}ms ${EASE.emphasizedDecelerate} ${delay}ms backwards`,
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none', animation: 'none' },
                }),
              }}
            />
          );
        })}
      </Box>
      {arm && armAt && (
        <Typography
          variant="caption"
          data-tree-arm
          sx={{
            position: 'absolute', left: armAt.x + 5, top: armAt.y, transform: 'translateY(-50%)', px: 0.4,
            bgcolor: 'background.default', borderRadius: 0.5, whiteSpace: 'nowrap', pointerEvents: 'none',
            typography: 'caption', fontFamily: 'monospace',
            color: card || activeNodeId ? 'primary.main' : 'text.secondary',
            lineHeight: 1.3, zIndex: 2,
            opacity: shown ? 1 : 0, transition: `opacity ${MOTION_MS.contentOut}ms ${EASE.standardAccelerate}, color 180ms ${EASE.standardAccelerate}`,
            animation: `${ARM_IN} ${reduced ? MOTION_MS.reduced : MOTION_MS.contentIn}ms ${EASE.emphasizedDecelerate} ${reduced ? 0 : MOTION_MS.lineIn * 0.4}ms backwards`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none', animation: 'none' },
          }}
        >
          {arm}
        </Typography>
      )}
      <StaggerContext.Provider value={take}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {/* data-tree-row is a direct child of the level so the stem measure can see it. */}
            <DockRow leaf={leaf} sx={{ mt: i === 0 ? 0 : 2.25 }}>{row}</DockRow>
            {inset && insetAfterRow === i ? (
              <Box data-tree-inset="" sx={{ width: '100%' }}>{inset}</Box>
            ) : null}
          </React.Fragment>
        ))}
      </StaggerContext.Provider>
    </Box>
  );
}
