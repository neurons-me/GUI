/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import type { ResolvedNodeRecord } from './renderer';
import type { GuiNodeProvenance } from '@/types/gui.types';
import { selectionStore, type SelectionMeta } from './selectionStore';

type SelectionState = {
  inspectorEnabled: boolean;
  setInspectorEnabled: (enabled: boolean) => void;
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
  selectedNodeId: string | null;
  selected: ResolvedNodeRecord | null;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  registerNode: (record: ResolvedNodeRecord) => void;
  unregisterNode: (id: string | null | undefined) => void;
  getNode: (id: string | null | undefined) => ResolvedNodeRecord | null;
  getNodeByPath: (path: string | null | undefined) => ResolvedNodeRecord | null;
  selectedMeta: SelectionMeta | null;
  setSelectedMeta: (meta: SelectionMeta | null) => void;
};

const SelectionContext = React.createContext<SelectionState | undefined>(undefined);

export function useSelection(): SelectionState {
  const ctx = React.useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}

// Non-throwing variant for components (e.g. ThemeLauncher) that are used
// both inside dev-tooling contexts (SelectionProvider present) and in real
// consumer apps that never mount it — returns undefined instead of
// crashing when there's no provider, so those components can *optionally*
// react to selection/inspector state without requiring it.
export function useOptionalSelection(): SelectionState | undefined {
  return React.useContext(SelectionContext);
}

// Registers a hand-written (non-spec-rendered) element into the same node
// registry the declarative render(spec) pipeline uses (mount.ts collects
// onNodeResolved records and calls this same registerNode/unregisterNode
// pair) — so dev-tooling chrome like ThemeLauncher/DevToolsLauncher can
// participate in the grid overlay and Semantic Inspector without being
// backed by a real spec. `spec` is still synthetic (`{ type }`), but
// `provenance` is a real opt-in contract: pass `{ semanticPath }` (or
// `explainPath`) when this node actually corresponds to a kernel-backed
// value, and the Inspector's "Explain" button lights up for it exactly the
// same way a spec-rendered node's would. Omit it (or pass nothing) and the
// node still shows in the grid/tree, just with Explain showing "Not
// declared" — same as before. No-ops outside a SelectionProvider.
// The caller still renders `data-gui-node-id={id}` / `data-gui-component`
// on the element itself — this hook only adds it to the registry so
// `getNode`/`selectNode`/the highlight effect can resolve it by id.
export function useRegisterGuiNode(
  id: string,
  type: string,
  parentId?: string,
  provenance?: GuiNodeProvenance
) {
  const ctx = React.useContext(SelectionContext);
  const registerNode = ctx?.registerNode;
  const unregisterNode = ctx?.unregisterNode;
  React.useEffect(() => {
    if (!registerNode || !unregisterNode) return;
    registerNode({ id, type, spec: { type }, path: id, parentId, provenance });
    return () => unregisterNode(id);
  }, [registerNode, unregisterNode, id, type, parentId, provenance]);
}

export type GuiDeclaredNode = {
  id: string;
  type: string;
  parentId?: string;
  /** false = the GUI knows this part exists but it isn't rendered right now. */
  enabled?: boolean;
};

// Declares several parts of the GUI at once (a component that knows its own
// shape -- e.g. Layout and its bars -- states it, instead of leaving the tree
// to be inferred from whatever happens to be in the DOM). Re-declares when
// the description changes; withdraws it on unmount. No-ops outside a
// SelectionProvider.
export function useRegisterGuiNodes(nodes: GuiDeclaredNode[]) {
  const ctx = React.useContext(SelectionContext);
  const registerNode = ctx?.registerNode;
  const unregisterNode = ctx?.unregisterNode;
  const key = JSON.stringify(nodes);
  React.useEffect(() => {
    if (!registerNode || !unregisterNode) return;
    const list = JSON.parse(key) as GuiDeclaredNode[];
    list.forEach((n) =>
      registerNode({ id: n.id, type: n.type, spec: { type: n.type }, path: n.id, parentId: n.parentId, enabled: n.enabled })
    );
    return () => list.forEach((n) => unregisterNode(n.id));
  }, [registerNode, unregisterNode, key]);
}

export function SelectionProvider({
  children,
  initialInspectorEnabled = false,
}: {
  children: React.ReactNode;
  initialInspectorEnabled?: boolean;
}) {
  const [state, setState] = React.useState(selectionStore.getState());

  React.useEffect(() => {
    const unsub = selectionStore.subscribe(() => {
      setState(selectionStore.getState());
    });
    return unsub;
  }, [initialInspectorEnabled]);

  const registerNode = selectionStore.actions.registerNode;
  const unregisterNode = selectionStore.actions.unregisterNode;
  const selectNode = selectionStore.actions.selectNode;
  const clearSelection = selectionStore.actions.clearSelection;
  const getNode = selectionStore.actions.getNode;
  const getNodeByPath = selectionStore.actions.getNodeByPath;
  const setSelectedMeta = selectionStore.actions.setSelectedMeta;
  const setInspectorEnabled = selectionStore.actions.setInspectorEnabled;
  const setGridEnabled = selectionStore.actions.setGridEnabled;
  const selected = state.selectedNodeId ? state.records[state.selectedNodeId] ?? null : null;

  const value = React.useMemo<SelectionState>(
    () => ({
      inspectorEnabled: state.inspectorEnabled,
      setInspectorEnabled,
      gridEnabled: state.gridEnabled,
      setGridEnabled,
      selectedNodeId: state.selectedNodeId,
      selected,
      selectNode,
      clearSelection,
      registerNode,
      unregisterNode,
      getNode,
      getNodeByPath,
      selectedMeta: state.selectedMeta,
      setSelectedMeta,
    }),
    [
      state.inspectorEnabled,
      state.gridEnabled,
      state.selectedNodeId,
      selected,
      selectNode,
      clearSelection,
      registerNode,
      unregisterNode,
      getNode,
      getNodeByPath,
      state.selectedMeta,
      setSelectedMeta,
      setInspectorEnabled,
      setGridEnabled,
    ]
  );

  React.useEffect(() => {
    selectionStore.actions.setInspectorEnabled(Boolean(initialInspectorEnabled));
  }, [initialInspectorEnabled]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
