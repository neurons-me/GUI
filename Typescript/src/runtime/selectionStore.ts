/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ResolvedNodeRecord } from './renderer';

export type SelectionMeta = {
  elementTag?: string;
  resolvedTag?: string;
  resolvedPath?: string[];
  /**
   * The selected element's own `data-gui-component` DOM attribute, captured
   * at click time regardless of whether a matching record was ever
   * registered (registerNode/useRegisterGuiNode). A hand-written component
   * can tag itself `data-gui-node-id`/`data-gui-component` for hit-testing
   * and path-building (buildResolvedPath) without ever calling
   * useRegisterGuiNode -- CleakerLanding.tsx does this at 31 call sites,
   * none registered. Without this fallback the Inspector's own type field
   * showed "unknown" for every one of them despite the DOM plainly naming
   * itself. Never a substitute for a real registration: still no
   * provenance/explain contract, no resolvedProps, nothing else a genuine
   * registerNode() call provides -- purely the display-level fallback for
   * "what does the DOM itself call this."
   */
  domComponentAttr?: string;
};

export type SelectionStateCore = {
  inspectorEnabled: boolean;
  gridEnabled: boolean;
  selectedNodeId: string | null;
  records: Record<string, ResolvedNodeRecord>;
  recordsByPath: Record<string, ResolvedNodeRecord>;
  selectedMeta: SelectionMeta | null;
};

type Listener = () => void;

export type SelectionStore = {
  getState: () => SelectionStateCore;
  setState: (next: Partial<SelectionStateCore>) => void;
  subscribe: (listener: Listener) => () => void;
  actions: {
    setInspectorEnabled: (enabled: boolean) => void;
    setGridEnabled: (enabled: boolean) => void;
    selectNode: (id: string | null) => void;
    clearSelection: () => void;
    registerNode: (record: ResolvedNodeRecord) => void;
    unregisterNode: (id: string | null | undefined) => void;
    getNode: (id: string | null | undefined) => ResolvedNodeRecord | null;
    getNodeByPath: (path: string | null | undefined) => ResolvedNodeRecord | null;
    setSelectedMeta: (meta: SelectionMeta | null) => void;
  };
};

const STORE_KEY = 'GUI-NODES-STORE';

function scheduleMicrotask(callback: () => void) {
  const schedule =
    (typeof queueMicrotask === 'function' && queueMicrotask) ||
    ((cb: () => void) => Promise.resolve().then(cb));
  schedule(callback);
}

function hasMeaningfulValue(value: any): boolean {
  return !!value && typeof value === 'object' && Object.keys(value).length > 0;
}

function mergeRecord(
  current: ResolvedNodeRecord,
  incoming: ResolvedNodeRecord
): ResolvedNodeRecord {
  const currentProvenance = hasMeaningfulValue(current.provenance)
    ? current.provenance
    : current.spec?.provenance;
  const incomingProvenance = hasMeaningfulValue(incoming.provenance)
    ? incoming.provenance
    : incoming.spec?.provenance;
  const mergedProvenance = incomingProvenance ?? currentProvenance;

  return {
    ...current,
    ...incoming,
    type: incoming.type ?? current.type,
    path: incoming.path || current.path,
    part: incoming.part ?? current.part,
    parentId: incoming.parentId ?? current.parentId,
    enabled: incoming.enabled ?? current.enabled,
    provenance: mergedProvenance,
    spec: {
      ...(current.spec ?? {}),
      ...(incoming.spec ?? {}),
      type: incoming.spec?.type ?? current.spec?.type,
      props: incoming.spec?.props ?? current.spec?.props,
      provenance: incoming.spec?.provenance ?? current.spec?.provenance ?? mergedProvenance,
    },
    resolvedProps: incoming.resolvedProps ?? current.resolvedProps,
  };
}

function isSameRecord(
  current: ResolvedNodeRecord,
  next: ResolvedNodeRecord
): boolean {
  return (
    current.id === next.id &&
    current.path === next.path &&
    current.type === next.type &&
    current.resolvedProps === next.resolvedProps &&
    current.part === next.part &&
    current.parentId === next.parentId &&
    current.enabled === next.enabled &&
    current.provenance === next.provenance &&
    current.spec?.type === next.spec?.type &&
    current.spec?.props === next.spec?.props &&
    current.spec?.provenance === next.spec?.provenance
  );
}

function createSelectionStore(): SelectionStore {
  let state: SelectionStateCore = {
    inspectorEnabled: false,
    gridEnabled: false,
    selectedNodeId: null,
    records: {},
    recordsByPath: {},
    selectedMeta: null,
  };
  const listeners = new Set<Listener>();
  const pendingUnregisterIds = new Set<string>();
  let pruneScheduled = false;

  const notify = () => {
    listeners.forEach((fn) => fn());
  };

  const setState = (next: Partial<SelectionStateCore>) => {
    state = { ...state, ...next };
    notify();
  };

  const prunePendingUnregisters = () => {
    pruneScheduled = false;
    if (!pendingUnregisterIds.size) return;

    let nextState = state;
    let changed = false;
    const ids = Array.from(pendingUnregisterIds);
    pendingUnregisterIds.clear();

    for (const id of ids) {
      const current = nextState.records[id];
      if (!current) continue;

      const nextRecords = { ...nextState.records };
      delete nextRecords[id];

      const nextRecordsByPath = { ...nextState.recordsByPath };
      if (nextRecordsByPath[current.path]?.id === id) {
        delete nextRecordsByPath[current.path];
      }

      const selectedGone = nextState.selectedNodeId === id;
      nextState = {
        ...nextState,
        records: nextRecords,
        recordsByPath: nextRecordsByPath,
        selectedNodeId: selectedGone ? null : nextState.selectedNodeId,
        selectedMeta: selectedGone ? null : nextState.selectedMeta,
      };
      changed = true;
    }

    if (changed) {
      state = nextState;
      notify();
    }
  };

  const schedulePrune = () => {
    if (pruneScheduled) return;
    pruneScheduled = true;
    scheduleMicrotask(prunePendingUnregisters);
  };

  const store: SelectionStore = {
    getState: () => state,
    setState,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions: {
      setInspectorEnabled: (enabled: boolean) => {
        setState({
          inspectorEnabled: Boolean(enabled),
          selectedNodeId: enabled ? state.selectedNodeId : null,
          selectedMeta: enabled ? state.selectedMeta : null,
        });
      },
      setGridEnabled: (enabled: boolean) => {
        setState({ gridEnabled: Boolean(enabled) });
      },
      selectNode: (id: string | null) => {
        setState({ selectedNodeId: id });
      },
      clearSelection: () => {
        setState({ selectedNodeId: null, selectedMeta: null });
      },
      registerNode: (record: ResolvedNodeRecord) => {
        pendingUnregisterIds.delete(record.id);
        const curr = state.records[record.id];
        const nextRecord = curr ? mergeRecord(curr, record) : record;
        if (curr && isSameRecord(curr, nextRecord)) {
          return;
        }

        const nextRecordsByPath = { ...state.recordsByPath };
        if (curr && curr.path !== nextRecord.path && nextRecordsByPath[curr.path]?.id === curr.id) {
          delete nextRecordsByPath[curr.path];
        }
        nextRecordsByPath[nextRecord.path] = nextRecord;

        state = {
          ...state,
          records: { ...state.records, [nextRecord.id]: nextRecord },
          recordsByPath: nextRecordsByPath,
        };
        notify();
      },
      unregisterNode: (id: string | null | undefined) => {
        if (!id) return;
        const curr = state.records[id];
        if (!curr) return;
        pendingUnregisterIds.add(id);
        schedulePrune();
      },
      getNode: (id: string | null | undefined) => {
        if (!id) return null;
        return state.records[id] ?? null;
      },
      getNodeByPath: (path: string | null | undefined) => {
        if (!path) return null;
        return state.recordsByPath[path] ?? null;
      },
      setSelectedMeta: (meta: SelectionMeta | null) => {
        setState({ selectedMeta: meta });
      },
    },
  };

  return store;
}

function getGlobalStore(): SelectionStore {
  const g = globalThis as any;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = createSelectionStore();
  }
  return g[STORE_KEY] as SelectionStore;
}

export const selectionStore = getGlobalStore();
