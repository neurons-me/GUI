// Where the theme launcher's settings (gear) go. A shell with a router and the GUI pages (Namespace.tsx) provides
// `open`, which navigates to `/GUI/themes`: the theme settings are a page with an address, not a dialog. Without a
// provider (an app that mounts the launcher on its own, no router) the launcher opens the same view as a dialog.
import * as React from 'react';

export const ThemeSettingsContext = React.createContext<(() => void) | null>(null);

export function useThemeSettings(): (() => void) | null {
  return React.useContext(ThemeSettingsContext);
}
