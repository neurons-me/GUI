import * as React from 'react';

// Where the devtools mount matters: mount() renders RuntimeDevtoolsLayer as a
// SIBLING of the app spec, so the Inspector sits outside the app's <Theme>
// (and outside its MUI ThemeProvider) -- useTheme() there answers with MUI's
// default light theme no matter what the user picked. What IS global is what
// <Theme> writes to :root (--palette-* via generatePaletteCssVars), so
// floating dev tooling reads the palette from there instead.
type ColorRole = { main?: string; light?: string; dark?: string; contrastText?: string };

export type DocumentPalette = {
  mode: 'light' | 'dark';
  background: { paper?: string; default?: string };
  text: { primary?: string; secondary?: string };
  divider?: string;
  primary: ColorRole;
  secondary: ColorRole;
  error: ColorRole;
  warning: ColorRole;
  info: ColorRole;
  success: ColorRole;
};

const THEME_EVENTS = [
  'this.gui:themeMode:changed',
  'this.gui:themeId:changed',
  'this.gui:themeScope:changed',
];

export function readDocumentPalette(): DocumentPalette | null {
  if (typeof document === 'undefined') return null;
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim() || undefined;
  const mode = v('--palette-mode');
  if (mode !== 'light' && mode !== 'dark') return null;
  const role = (key: string): ColorRole => ({
    main: v(`--palette-${key}-main`),
    light: v(`--palette-${key}-light`),
    dark: v(`--palette-${key}-dark`),
    contrastText: v(`--palette-${key}-contrastText`),
  });
  return {
    mode,
    background: { paper: v('--palette-background-paper'), default: v('--palette-background-default') },
    text: { primary: v('--palette-text-primary'), secondary: v('--palette-text-secondary') },
    divider: v('--palette-divider'),
    primary: role('primary'),
    secondary: role('secondary'),
    error: role('error'),
    warning: role('warning'),
    info: role('info'),
    success: role('success'),
  };
}

/**
 * The active theme's palette as <Theme> published it on :root, re-read
 * whenever the theme id or light/dark mode changes. null when no <Theme>
 * has run yet (callers fall back to their own defaults).
 */
export function useDocumentPalette(): DocumentPalette | null {
  const [palette, setPalette] = React.useState<DocumentPalette | null>(() => readDocumentPalette());

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Theme's own effect sets the CSS vars and dispatches these events in the
    // same commit; reading on the next task guarantees the new values are in.
    // setTimeout, not requestAnimationFrame: rAF never fires in a hidden tab,
    // which would leave the palette stuck on whatever the first render saw.
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setPalette(readDocumentPalette()), 0);
    };
    refresh();
    THEME_EVENTS.forEach((name) => window.addEventListener(name, refresh));
    return () => {
      clearTimeout(timer);
      THEME_EVENTS.forEach((name) => window.removeEventListener(name, refresh));
    };
  }, []);

  return palette;
}
