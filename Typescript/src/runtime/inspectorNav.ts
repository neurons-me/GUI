/**
 * Where you can go from the node in focus, one step at a time:
 *
 *              parent
 *   prev sibling ← [focus] → next sibling
 *              first child
 *
 * The Inspector shows one node at a time (its detail is the focus). This is
 * pure tree arithmetic over whatever ordering the model provides; it is not
 * `.me` path syntax, and the kernel has no equivalent (wildcard, first/last,
 * random selectors do not exist there -- checked against me/Typescript).
 *
 * "Child" is the FIRST child, in the model's order, and that is by design:
 * the other children are one sideways step away (prev/next), and the tree
 * diagram lists them all.
 */
export type NavModel = {
  parentOf: (id: string) => string | null;
  /** Direct children, in a defined, stable order. */
  childrenOf: (id: string) => string[];
};

export type Around = {
  parent: string | null;
  prev: string | null;
  next: string | null;
  child: string | null;
  /** Position among its siblings (0-based) and how many there are. A node
   *  without a parent counts as an only child. */
  at: number;
  total: number;
};

export function around(model: NavModel, id: string): Around {
  const parent = model.parentOf(id);
  const siblings = parent ? model.childrenOf(parent) : [id];
  const at = Math.max(0, siblings.indexOf(id));
  const child = model.childrenOf(id).filter((c) => c !== id)[0] ?? null;
  return {
    parent,
    prev: at > 0 ? siblings[at - 1] : null,
    next: at < siblings.length - 1 ? siblings[at + 1] : null,
    child,
    at,
    total: siblings.length,
  };
}

/**
 * Who is whose parent. Every node must be reachable from the root by going
 * down, and reach the root by going up -- otherwise the tree has parts you
 * cannot walk to. So the rules are strict:
 *
 *  - a node's parent is what the GUI declared, else the nearest tagged
 *    element above it in the page, else the node its own id is a path under
 *    (`a.b.c` and `a/b` are parts of `a.b` and `a`) -- so a part that is not
 *    on the page right now (a table's empty-state) still hangs where it
 *    belongs;
 *  - a parent that does not exist, a node with no parent at all, and a cycle
 *    all become ORPHANS: they are attached to the root so they can still be
 *    reached, and reported, so a gap in what the GUI declares is visible
 *    rather than silently hidden.
 */
export function linkTree(input: {
  ids: string[];
  declaredParent: (id: string) => string | null | undefined;
  domParent: (id: string) => string | null | undefined;
  /** The one node with no parent, if it exists (usually 'GUI'). */
  root: string;
}): { parents: Map<string, string | null>; orphans: string[] } {
  const known = new Set(input.ids);
  const parents = new Map<string, string | null>();
  const orphans: string[] = [];
  const hasRoot = known.has(input.root);
  // The longest known node this id is a path under: 'x/empty-state' -> 'x',
  // 'a.b.c' -> 'a.b' (or 'a' if 'a.b' isn't a node).
  const idParent = (id: string): string | null => {
    let cursor = id;
    for (let guard = 0; guard < 40; guard++) {
      const cut = Math.max(cursor.lastIndexOf('/'), cursor.lastIndexOf('.'));
      if (cut <= 0) return null;
      cursor = cursor.slice(0, cut);
      if (known.has(cursor)) return cursor;
    }
    return null;
  };
  for (const id of input.ids) {
    if (id === input.root) {
      parents.set(id, null);
      continue;
    }
    const wanted = input.declaredParent(id) || input.domParent(id) || idParent(id);
    if (wanted && wanted !== id && known.has(wanted)) {
      parents.set(id, wanted);
    } else if (hasRoot) {
      parents.set(id, input.root);
      orphans.push(id);
    } else {
      parents.set(id, null);
    }
  }
  // A cycle (a -> b -> a) never reaches the root: cut it at the node where it
  // closes and hang that node from the root.
  for (const id of input.ids) {
    const seen = new Set<string>();
    let cursor: string | null = id;
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      cursor = parents.get(cursor) ?? null;
    }
    if (cursor && hasRoot) {
      parents.set(cursor, input.root);
      if (!orphans.includes(cursor)) orphans.push(cursor);
    }
  }
  return { parents, orphans };
}
