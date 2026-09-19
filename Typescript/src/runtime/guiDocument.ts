import documentJson from './GUI.document.json';

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
