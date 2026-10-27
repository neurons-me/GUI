import type { GuiDocument, GuiDocumentNode } from './guiDocument';

/**
 * Where the GUI's own parts live. Ids are paths (`GUI.window.layout.bars.left`), the same syntax as `me.GUI.window.layout.bars.left`;
 * a node's parent is its path minus the last segment.
 *
 *   GUI
 *   └── window            the surface the GUI is presented on
 *       └── layout        the window's structure
 *           ├── bars      left, right, top, bottom (and sticky)
 *           └── content   the pages
 *
 * `bottom` is a side, like the others; `footer` is a role and stays where a bar has one (`bars.left.footer`).
 * This module is the one place the shape is written down: the document, Layout and the bar ids build from it, and
 * `migrateLegacyGuiDocument` reads the previous shape (`GUI.bars.*`, `GUI.content.*`, `bars.footer`) so an app that
 * declares its own document that way keeps working.
 */
export const GUI_ROOT_ID = 'GUI';
export const GUI_WINDOW_ID = `${GUI_ROOT_ID}.window`;
export const GUI_LAYOUT_ID = `${GUI_WINDOW_ID}.layout`;
export const GUI_BARS_ID = `${GUI_LAYOUT_ID}.bars`;
export const GUI_CONTENT_ID = `${GUI_LAYOUT_ID}.content`;

export type BarSide = 'left' | 'right' | 'top' | 'bottom';

export const barId = (side: BarSide | 'sticky'): string => `${GUI_BARS_ID}.${side}`;
export const contentId = (page?: string): string => (page ? `${GUI_CONTENT_ID}.${page}` : GUI_CONTENT_ID);

// Longest first: `GUI.bars.footer` (a bar that is now `bottom`) before `GUI.bars`.
const LEGACY_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['GUI.bars.footer', `${GUI_BARS_ID}.bottom`],
  ['GUI.bars', GUI_BARS_ID],
  ['GUI.content', GUI_CONTENT_ID],
];

/** An id in the previous shape becomes the current one; anything else comes back unchanged. */
export function migrateLegacyGuiId(id: string): string {
  for (const [from, to] of LEGACY_PREFIXES) {
    if (id === from || id.startsWith(`${from}.`)) return to + id.slice(from.length);
  }
  return id;
}

/**
 * A document that declares `GUI.bars` / `GUI.content` directly (the previous shape) comes back with them under
 * `GUI.window.layout`, and `bars.footer` as `bars.bottom`. A document already in the current shape comes back as it is,
 * so this is safe to apply at every entry point.
 */
export function migrateLegacyGuiDocument(doc: GuiDocument): GuiDocument {
  const root = doc?.[GUI_ROOT_ID];
  const kids = root?.children;
  if (!kids || !('bars' in kids || 'content' in kids)) return doc;

  const moved: Record<string, GuiDocumentNode> = {};
  if (kids.bars) {
    const bars = kids.bars;
    const barKids = { ...(bars.children ?? {}) };
    if (barKids.footer) {
      barKids.bottom = barKids.bottom ? { ...barKids.footer, ...barKids.bottom } : barKids.footer;
      delete barKids.footer;
    }
    moved.bars = { ...bars, children: barKids };
  }
  if (kids.content) moved.content = kids.content;

  const rest: Record<string, GuiDocumentNode> = { ...kids };
  delete rest.bars;
  delete rest.content;
  const window = rest.window ?? {};
  const layout = window.children?.layout ?? {};
  return {
    ...doc,
    [GUI_ROOT_ID]: {
      ...root,
      children: {
        ...rest,
        window: {
          ...window,
          children: { ...(window.children ?? {}), layout: { ...layout, children: { ...(layout.children ?? {}), ...moved } } },
        },
      },
    },
  };
}
