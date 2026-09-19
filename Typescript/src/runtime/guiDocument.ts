import documentJson from './GUI.document.json';
import { renderNode } from './renderer';

/**
 * The GUI's own declaration of itself: a static, JSON-serializable tree
 * (GUI.document.json). It says WHAT parts the GUI has, independent of any
 * runtime -- an app can boot from it alone. Whether a part is currently
 * rendered, and any value bound to it, is resolved later (Layout resolves
 * which bars are on; a connected `.me` kernel resolves values, visibility
 * and authorization). Declaring a part here does not expose anything:
 * visibility/encryption belong to the kernel, never to this file, and no
 * private value may be written into it.
 *
 * Ids are paths (`GUI.bars.left`), the same syntax as `me.GUI.bars.left`; a
 * node's parent is its path minus the last segment.
 */
export type GuiDocumentNode = {
  note?: string;
  /**
   * Name of the component that implements this part -- content.landing
   * (CleakerLanding). Resolved through the registry the app hands to
   * renderGuiDocumentPage; the document never holds the component itself.
   */
  component?: string;
  /** Where a page is served, e.g. "/" (index) or "/users". */
  route?: string;
  children?: Record<string, GuiDocumentNode>;
};

export type GuiDocument = Record<string, GuiDocumentNode>;

export type GuiDocumentEntry = {
  /** Path, e.g. `GUI.bars.left`. */
  id: string;
  /** Last path segment, e.g. `left`. */
  type: string;
  parentId?: string;
  note?: string;
  component?: string;
  route?: string;
  /** Ids of the parts the document declares directly under this one. */
  childIds: string[];
};

export const GUI_DOCUMENT = documentJson as GuiDocument;

export function flattenGuiDocument(doc: GuiDocument = GUI_DOCUMENT): GuiDocumentEntry[] {
  const out: GuiDocumentEntry[] = [];
  const walk = (key: string, node: GuiDocumentNode, parentId?: string) => {
    const id = parentId ? `${parentId}.${key}` : key;
    const childKeys = Object.keys(node.children ?? {});
    out.push({
      id,
      type: key,
      parentId,
      note: node.note,
      component: node.component,
      route: node.route,
      childIds: childKeys.map((k) => `${id}.${k}`),
    });
    childKeys.forEach((k) => walk(k, node.children![k], id));
  };
  Object.keys(doc).forEach((k) => walk(k, doc[k]));
  return out;
}

export function findGuiDocumentEntry(
  id: string,
  doc: GuiDocument = GUI_DOCUMENT
): GuiDocumentEntry | null {
  return flattenGuiDocument(doc).find((e) => e.id === id) ?? null;
}

/**
 * Renders a page the document declares, through the SAME renderer mount(spec)
 * uses (renderNode): the document entry becomes a spec node
 * `{ type: <component>, props }`, `type` is resolved through `registry`, and
 * the renderer hands the component its `data-gui-node-id` (the document
 * path) and `data-gui-component`. No second mounting mechanism: what differs
 * from a hand-written <Route element> is only where the "what renders here"
 * decision comes from -- the document, not the JSX.
 *
 * Returns null (and warns) when the id isn't declared, has no `component`, or
 * the registry doesn't know it, rather than rendering something else.
 */
export function renderGuiDocumentPage(
  id: string,
  options: {
    React: any;
    registry: Record<string, any>;
    props?: Record<string, any>;
    doc?: GuiDocument;
  }
): any {
  const entry = findGuiDocumentEntry(id, options.doc);
  if (!entry?.component || !options.registry[entry.component]) {
    // eslint-disable-next-line no-console
    console.warn(`[GUI document] cannot render "${id}": ${!entry ? 'not declared' : !entry.component ? 'no component declared' : `no "${entry.component}" in the registry`}.`);
    return null;
  }
  return renderNode(
    {
      type: entry.component,
      props: { ...(options.props ?? {}), 'data-gui-node-id': entry.id },
      provenance: { source: 'document', documentPath: entry.id, note: entry.note },
    },
    { React: options.React, registry: options.registry }
  );
}
