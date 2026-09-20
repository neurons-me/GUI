import * as React from 'react';

/**
 * The id a component's own parts hang under. A component that can be mounted
 * as a page of the GUI document (`GUI.content.netget.status`) or on its own
 * (`MainServerView`) takes its root id from a prop, provides it here, and
 * names its parts `${base}.host`, `${base}.owner`, ... so the same component
 * fits wherever the document puts it, and its parts always sit under it in
 * the tree.
 */
const GuiNodeIdBaseContext = React.createContext<string | null>(null);

export const GuiNodeIdBase = GuiNodeIdBaseContext.Provider;

export function useGuiNodeId(fallback: string): string {
  return React.useContext(GuiNodeIdBaseContext) ?? fallback;
}
