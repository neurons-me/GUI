/*
 * GUI.OpenStreetMap — pin selection (S5b.2, plan §4a): controlled /
 * uncontrolled multiple selection, a store of the markers on the map (for the
 * list, the label layout and edge pins), and a "link" that lets a MarkerList
 * outside the map share both.
 *
 * Selection mode starts only when `selected` or `defaultSelected` is passed (an
 * empty array = every pin a dot). Without either, every pin renders in full,
 * exactly as before.
 */
import * as React from 'react';
import type { OsmMarkerShape } from './OpenStreetMapMarker';
import type { OsmMarkerState, OsmMarkerTone, OsmPalette } from './mapPalette';

export type OsmSelectionSource = 'map' | 'list' | 'keyboard' | 'api';
export type OsmSelectionChangeInfo = { id: string | null; selected: boolean; source: OsmSelectionSource };

export type OsmSelectionProps = {
  /** Controlled selection: marker ids, in selection order (last = most recent). */
  selected?: string[];
  /** Uncontrolled initial selection. Passing either prop turns selection mode on. */
  defaultSelected?: string[];
  onSelectionChange?: (ids: string[], info: OsmSelectionChangeInfo) => void;
};

/** Toggle one id: removed when selected, else appended (most recent last). */
export function toggleOsmSelection(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export type OsmSelectionState = {
  /** Selection mode is on (a selection prop was passed). */
  enabled: boolean;
  /** Selected ids in selection order. */
  ids: string[];
  has(id: string): boolean;
  toggle(id: string, source?: OsmSelectionSource): void;
  set(ids: string[], source?: OsmSelectionSource): void;
};

export function useOsmSelectionState(props: OsmSelectionProps, onChange?: (ids: string[], info: OsmSelectionChangeInfo) => void): OsmSelectionState {
  const controlled = props.selected !== undefined;
  const enabled = controlled || props.defaultSelected !== undefined;
  const [inner, setInner] = React.useState<string[]>(() => props.defaultSelected ?? []);
  const ids = controlled ? props.selected! : inner;
  const key = ids.join('\u0000');
  const idsRef = React.useRef(ids);
  idsRef.current = ids;
  const cbRef = React.useRef({ user: props.onSelectionChange, root: onChange });
  cbRef.current = { user: props.onSelectionChange, root: onChange };
  const commit = React.useCallback(
    (next: string[], info: OsmSelectionChangeInfo) => {
      idsRef.current = next;
      if (!controlled) setInner(next);
      cbRef.current.user?.(next, info);
      cbRef.current.root?.(next, info);
    },
    [controlled],
  );
  return React.useMemo<OsmSelectionState>(() => {
    const set = new Set(ids);
    return {
      enabled,
      ids,
      has: (id) => set.has(id),
      toggle: (id, source = 'api') => {
        const next = toggleOsmSelection(idsRef.current, id);
        commit(next, { id, selected: next.includes(id), source });
      },
      set: (next, source = 'api') => commit([...next], { id: null, selected: next.length > 0, source }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, commit]);
}

/** What a marker tells the map about itself (resolved, bound values included). */
export type OsmMarkerInfo = {
  id: string;
  lat: number;
  lon: number;
  shape: OsmMarkerShape;
  size: number;
  width?: number;
  height?: number;
  icon?: string;
  tone?: OsmMarkerTone;
  state: OsmMarkerState;
  color: string;
  label?: string;
  meta?: string;
  labelPlacement?: 'right' | 'left' | 'top' | 'bottom';
  labelOffset?: number;
  /** Declaration order (stable list / focus order). */
  order: number;
};

const sameInfo = (a: OsmMarkerInfo | undefined, b: OsmMarkerInfo) =>
  !!a && (Object.keys(b) as (keyof OsmMarkerInfo)[]).every((k) => a[k] === b[k]) && Object.keys(a).length === Object.keys(b).length;

export type OsmMarkerStore = {
  set(info: OsmMarkerInfo): void;
  remove(id: string): void;
  list(): OsmMarkerInfo[];
  get(id: string): OsmMarkerInfo | undefined;
  subscribe(cb: () => void): () => void;
  version(): number;
  nextOrder(): number;
};

export function createOsmMarkerStore(): OsmMarkerStore {
  const map = new Map<string, OsmMarkerInfo>();
  const subs = new Set<() => void>();
  let v = 0;
  let cache: OsmMarkerInfo[] | null = null;
  let order = 0;
  const bump = () => {
    v += 1;
    cache = null;
    subs.forEach((cb) => cb());
  };
  return {
    set(info) {
      if (sameInfo(map.get(info.id), info)) return;
      map.set(info.id, info);
      bump();
    },
    remove(id) {
      if (map.delete(id)) bump();
    },
    list() {
      if (!cache) cache = [...map.values()].sort((a, b) => a.order - b.order);
      return cache;
    },
    get: (id) => map.get(id),
    subscribe(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    version: () => v,
    nextOrder: () => order++,
  };
}

export function useOsmMarkerList(store: OsmMarkerStore | null | undefined): OsmMarkerInfo[] {
  const subscribe = React.useCallback((cb: () => void) => (store ? store.subscribe(cb) : () => {}), [store]);
  const getV = React.useCallback(() => (store ? store.version() : 0), [store]);
  React.useSyncExternalStore(subscribe, getV, getV);
  return store ? store.list() : [];
}

/** What a linked MarkerList outside the map needs. */
export type OsmLinkSnapshot = {
  store: OsmMarkerStore;
  selection: OsmSelectionState;
  palette: OsmPalette;
  /** Pan the map so the pin is in view. */
  showPin(id: string): void;
};

export type OsmLink = {
  get(): OsmLinkSnapshot | null;
  publish(s: OsmLinkSnapshot | null): void;
  subscribe(cb: () => void): () => void;
};

export function createOsmLink(): OsmLink {
  let snap: OsmLinkSnapshot | null = null;
  const subs = new Set<() => void>();
  return {
    get: () => snap,
    publish(s) {
      snap = s;
      subs.forEach((cb) => cb());
    },
    subscribe(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}

/** A stable link: pass it as `link` to <OpenStreetMap> and to a MarkerList rendered outside the map. */
export function useOpenStreetMapLink(): OsmLink {
  const [link] = React.useState(createOsmLink);
  return link;
}

export function useOsmLinkSnapshot(link: OsmLink | undefined): OsmLinkSnapshot | null {
  const subscribe = React.useCallback((cb: () => void) => (link ? link.subscribe(cb) : () => {}), [link]);
  const get = React.useCallback(() => (link ? link.get() : null), [link]);
  return React.useSyncExternalStore(subscribe, get, get);
}

/** Text of a node for labels / names ('' for non-text React nodes). */
export function osmNodeText(v: unknown): string {
  if (v === null || v === undefined || v === false) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(osmNodeText).join('');
  return '';
}
