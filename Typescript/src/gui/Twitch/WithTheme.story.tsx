import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { makeMuiTheme } from '@/gui/Theme/fromTokens';
import { themeTokens } from '@/gui/Theme/styles/theme.tokens';
import { getGuiTheme } from '@/gui/Theme/utils/catalog';

/** Story helper: pins one catalog theme + mode (same providers <Theme> sets up). */
export function WithTheme({ themeId = 'neurons.me', mode, children }: { themeId?: string; mode: 'light' | 'dark'; children: React.ReactNode }) {
  const manifest: any = getGuiTheme(themeId);
  const mui = useMemo(() => makeMuiTheme(themeTokens, manifest?.mode?.[mode] ?? {}, mode), [manifest, mode]);
  const ctx = useMemo(() => ({ themeId, themeName: manifest?.themeName ?? themeId, mode, setThemeId: () => {}, setMode: () => {}, toggleMode: () => {} }), [themeId, mode, manifest]);
  return (
    <ThemeProvider theme={mui}>
      <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
    </ThemeProvider>
  );
}
