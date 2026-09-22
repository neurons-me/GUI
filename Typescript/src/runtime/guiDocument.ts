import documentJson from './GUI.document.json';
import { renderNode } from './renderer';
import type { LeftBarElement } from '@/gui/Layout/Sidebars/LeftBar/LeftBar.types';

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
  /** Human name for this part, declared by the GUI ("Users", "Left bar"). */
  label?: string;
  note?: string;
  /**
   * Name of the component that implements this part -- content.landing
   * (CleakerLanding). Resolved through the registry the app hands to
   * renderGuiDocumentPage; the document never holds the component itself.
   */
  component?: string;
  /** Where a page is served, e.g. "/" (index) or "/users". */
  route?: string;
  /**
   * An element of a bar (children of `GUI.bars.left`): where it navigates and its icon. A part with `to`
   * under a bar is an element of that bar; the bar's own composition (what the namespace adds) layers
   * around these.
   */
  to?: string;
  icon?: string;
  /** Shown only when the person has proven an identity (`session`). Visibility of DATA is the kernel's; this only hides a link that would lead nowhere. */
  requires?: 'session';
  /**
   * Where the element sits in the bar: `start` (before what the namespace declares), `default` (a fallback the
   * namespace may override by declaring the same id) or `end` (after). Defaults to `default`.
   */
  placement?: 'start' | 'default' | 'end';
  children?: Record<string, GuiDocumentNode>;
};

export type GuiDocument = Record<string, GuiDocumentNode>;

export type GuiDocumentEntry = {
  /** Path, e.g. `GUI.bars.left`. */
  id: string;
  /** Last path segment, e.g. `left`. */
  type: string;
  parentId?: string;
  label?: string;
  note?: string;
  component?: string;
  route?: string;
  to?: string;
  icon?: string;
  requires?: 'session';
  placement?: 'start' | 'default' | 'end';
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
      label: node.label,
      note: node.note,
      component: node.component,
      route: node.route,
      to: node.to,
      icon: node.icon,
      requires: node.requires,
      placement: node.placement,
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


/**
 * Adds the parts of `extension` to `base` without changing `base`: a part in both keeps the base's own fields
 * and gains the extension's children; a part only in the extension is added. This is how an app (netget) puts its
 * own pages and bar elements on top of the root GUI instead of being a second GUI. The extension can add parts;
 * it cannot remove or replace the base's `component`/`route` of a part that already has one.
 */
export function mergeGuiDocument(base: GuiDocument, extension: GuiDocument | undefined): GuiDocument {
  if (!extension) return base;
  const mergeNode = (a: GuiDocumentNode | undefined, b: GuiDocumentNode): GuiDocumentNode => {
    if (!a) return structuredCloneNode(b);
    const out: GuiDocumentNode = { ...b, ...a };
    const keys = new Set([...Object.keys(a.children ?? {}), ...Object.keys(b.children ?? {})]);
    if (keys.size) {
      out.children = {};
      keys.forEach((k) => {
        out.children![k] = mergeNode(a.children?.[k], b.children?.[k] ?? ({} as GuiDocumentNode));
      });
    }
    return out;
  };
  const out: GuiDocument = { ...base };
  Object.keys(extension).forEach((k) => {
    out[k] = base[k] ? mergeNode(base[k], extension[k]) : structuredCloneNode(extension[k]);
  });
  return out;
}

function structuredCloneNode(node: GuiDocumentNode): GuiDocumentNode {
  return JSON.parse(JSON.stringify(node));
}

export type LeftBarSlots = {
  start: LeftBarElement[];
  defaults: LeftBarElement[];
  end: LeftBarElement[];
};

/**
 * The left bar's elements as the document declares them (children of `GUI.bars.left` that have `to`), split by
 * `placement`, in declaration order. An element carries its document path as its node id, so the inspector shows
 * ONE node for it (the declared one), not a second runtime-numbered copy. Elements that `require` a session are
 * left out until `authenticated`.
 */
export function leftBarSlots(
  doc: GuiDocument = GUI_DOCUMENT,
  options: { authenticated?: boolean } = {}
): LeftBarSlots {
  const slots: LeftBarSlots = { start: [], defaults: [], end: [] };
  const prefix = 'GUI.bars.left.';
  flattenGuiDocument(doc)
    .filter((e) => e.parentId === 'GUI.bars.left' && e.to)
    .forEach((e) => {
      if (e.requires === 'session' && !options.authenticated) return;
      const key = e.id.slice(prefix.length);
      const element = {
        type: 'link' as const,
        props: { id: key, label: e.label ?? key, to: e.to, icon: e.icon, 'data-gui-node-id': e.id },
      } as LeftBarElement;
      (e.placement === 'start' ? slots.start : e.placement === 'end' ? slots.end : slots.defaults).push(element);
    });
  return slots;
}
