/**
 * The Inspector's selection model. Three things, kept apart:
 *
 *  - QUERY  -- from which node, over which relation (parent / children /
 *              siblings), and how to pick from what that relation yields.
 *  - RESULT -- the set of nodes the query found.
 *  - FOCUS  -- the one node whose detail is on screen, inside that set
 *              (it lives in the selection store as `selectedNodeId`, not here).
 *
 * This is an INSPECTOR query. It is not `.me` path syntax: the kernel's own
 * selectors (`[2]`, `[1..3]`, `[[1,3]]`, `[fuel >= 200]`) address members of a
 * kernel plural, and the kernel has no wildcard, first/last or random
 * selector (checked against me/Typescript: `.*`, `[*]`, `[..]`, `[0]`,
 * `[-1]` and `[?]` all read as undefined; `?` there is the collect operator).
 * Nothing here is written as, or should be read as, a kernel path.
 */
export type QueryAxis = 'parent' | 'children' | 'siblings' | 'self';
export type QueryPick = 'all' | 'first' | 'last' | 'random';

export type InspectorQuery = {
  axis: QueryAxis;
  /** The node the relation is taken from. */
  originId: string;
  pick: QueryPick;
  /**
   * Fixed at the moment the user chose Random, in [0, 1). The pick is derived
   * from it, so it does not change on re-render -- only a new Random action
   * draws a new seed.
   */
  seed: number;
};

/** What the query needs to know about the tree. Ordering is the model's job. */
export type RelationModel = {
  parentOf: (id: string) => string | null;
  /** Direct children, in a defined, stable order. */
  childrenOf: (id: string) => string[];
};

/** Every node the relation yields, before picking. */
export function relatedIds(model: RelationModel, originId: string, axis: QueryAxis): string[] {
  switch (axis) {
    case 'self':
      return [originId];
    case 'parent': {
      const parent = model.parentOf(originId);
      return parent ? [parent] : [];
    }
    case 'children':
      return model.childrenOf(originId).filter((id) => id !== originId);
    case 'siblings': {
      const parent = model.parentOf(originId);
      // A node without a parent has no siblings. Siblings never include the
      // node itself.
      return parent ? model.childrenOf(parent).filter((id) => id !== originId) : [];
    }
  }
}

/** All / First / Last / Random over an ordered list. Empty stays empty. */
export function pickIds(ids: string[], pick: QueryPick, seed: number): string[] {
  if (ids.length === 0) return [];
  switch (pick) {
    case 'all':
      return ids;
    case 'first':
      return [ids[0]];
    case 'last':
      return [ids[ids.length - 1]];
    case 'random': {
      const s = Number.isFinite(seed) ? Math.min(Math.max(seed, 0), 0.9999999999) : 0;
      return [ids[Math.floor(s * ids.length)]];
    }
  }
}

export function resolveQuery(
  model: RelationModel,
  query: InspectorQuery
): { candidates: string[]; result: string[] } {
  const candidates = relatedIds(model, query.originId, query.axis);
  return { candidates, result: pickIds(candidates, query.pick, query.seed) };
}
