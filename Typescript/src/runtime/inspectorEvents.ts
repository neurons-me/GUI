// inspectorEvents.ts — asks the mounted Runtime Inspector to select the tree's root and open its panel
// ("View all tree"). An event, not a context call: the inspector owns how it finds and selects the root.
export const INSPECTOR_SELECT_ROOT_EVENT = 'gui:inspector-select-root';

export function requestInspectorRoot() {
  if (typeof window === 'undefined') return;
  // After the enable has rendered, so the inspector is listening with selection on.
  window.setTimeout(() => window.dispatchEvent(new Event(INSPECTOR_SELECT_ROOT_EVENT)), 0);
}
