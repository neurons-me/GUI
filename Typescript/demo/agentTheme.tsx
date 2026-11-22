// The .GUI theme for the whole agent page (agent.main.ts). It mounts GUI's own <Theme> with nothing inside, so the
// page gets the same palette CSS variables (--mui-palette-*), CssBaseline and typography as Storybook; agent.html's
// own CSS reads those variables. It only reads the person's saved light/dark choice; it writes nothing and sends
// nothing. The approval screens stay plain DOM built with textContent.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from '@mui/material/styles';
import Theme from '@/gui/Theme/Theme';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';

function PageVars() {
  const theme = useTheme();
  const { mode } = useThemeContext();
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.style.setProperty('--gui-font', String(theme.typography.fontFamily ?? ''));
  }, [theme, mode]);
  return null;
}

export function mountAgentTheme(): void {
  const host = document.createElement('div');
  host.hidden = true;
  document.body.append(host);
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  createRoot(host).render(
    <Theme initialMode={prefersDark ? 'dark' : 'light'}>
      <PageVars />
    </Theme>,
  );
}
