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
