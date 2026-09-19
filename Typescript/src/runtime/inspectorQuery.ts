/**
 * The Inspector's selection model. Three things, kept apart:
 *
 *  - QUERY  -- from which node, over which relation (parent / children). The
 *              selection is everything that relation yields.
 *  - RESULT -- the set of nodes found.
 *  - FOCUS  -- the one node whose detail is on screen, inside that set
 *              (it lives in the selection store as `selectedNodeId`, not here).
 *
 * This is an INSPECTOR query. It is not `.me` path syntax: the kernel's own
 * selectors (`[2]`, `[1..3]`, `[[1,3]]`, `[fuel >= 200]`) address members of a
 * kernel plural, and it has no wildcard, first/last or random selector
 * (checked against me/Typescript). Nothing here should be read as a kernel
 * path.
 *
 * (An earlier version also picked All / First / Last / Random from what a
 * relation found. Removed: with the tree diagram on screen, choosing a node
 * is a click, and the extra control only added noise.)
 */
export type QueryAxis = 'parent' | 'children' | 'self';

export type InspectorQuery = {
  axis: QueryAxis;
  /** The node the relation is taken from. */
  originId: string;
};

/** What the query needs to know about the tree. Ordering is the model's job. */
export type RelationModel = {
  parentOf: (id: string) => string | null;
  /** Direct children, in a defined, stable order. */
  childrenOf: (id: string) => string[];
};

/** Every node the relation yields, in the model's order. */
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
  }
}

/**
 * Moving sideways is a move of the FOCUS, not a query: the sibling before and
 * the one after, in the model's order, and where this node sits among them.
 * A node without a parent has no siblings (total 1, nowhere to go).
 */
export function neighbours(
  model: RelationModel,
  id: string
): { prev: string | null; next: string | null; at: number; total: number } {
  const parent = model.parentOf(id);
  const all = parent ? model.childrenOf(parent) : [id];
  const at = Math.max(0, all.indexOf(id));
  return { prev: at > 0 ? all[at - 1] : null, next: at < all.length - 1 ? all[at + 1] : null, at, total: all.length };
}

export function resolveQuery(model: RelationModel, query: InspectorQuery): string[] {
  return relatedIds(model, query.originId, query.axis);
}
