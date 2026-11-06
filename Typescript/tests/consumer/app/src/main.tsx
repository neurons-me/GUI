import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, Link as AppLink } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import { Theme, ThemeModeToggle, Link as GuiLink } from 'this.gui';
import 'this.gui/style.css';

// Every public subpath, loaded as the app's bundler resolves it (exports map).
const SUBPATHS: Record<string, () => Promise<Record<string, unknown>>> = {
  'this.gui': () => import('this.gui'),
  'this.gui/runtime': () => import('this.gui/runtime'),
  'this.gui/react': () => import('this.gui/react'),
  'this.gui/devtools': () => import('this.gui/devtools'),
  'this.gui/cleaker': () => import('this.gui/cleaker'),
  'this.gui/atoms': () => import('this.gui/atoms'),
  'this.gui/molecules': () => import('this.gui/molecules'),
  'this.gui/compounds': () => import('this.gui/compounds'),
  'this.gui/components': () => import('this.gui/components'),
  'this.gui/legacy': () => import('this.gui/legacy'),
};
(window as any).__subpaths = Promise.all(Object.entries(SUBPATHS).map(([k, load]) =>
  load().then((m) => [k, Object.keys(m).length] as const, (e) => [k, `ERROR ${String(e)}`] as const))).then(Object.fromEntries);

// The APP's own MUI reads the theme GUI's <Theme> provides: one ThemeContext, or this stays on MUI's default.
function AppPaper() {
  const t = useTheme();
  const { pathname } = useLocation();
  return (
    <Paper data-testid="app-paper" data-mode={t.palette.mode} sx={{ p: 2 }}>
      app paper · mode {t.palette.mode} · at {pathname}
    </Paper>
  );
}

function App() {
  return (
    <Theme>
      <ThemeModeToggle />
      <AppPaper />
      {/* GUI's Link inside the APP's router: one router context, or it falls back to a plain href. */}
      <GuiLink to="/b" data-testid="gui-link">to b</GuiLink>
      <AppLink to="/b" data-testid="app-link">app to b</AppLink>
      <Routes>
        <Route path="/" element={<div data-testid="page">page A</div>} />
        <Route path="/b" element={<div data-testid="page">page B</div>} />
      </Routes>
    </Theme>
  );
}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
