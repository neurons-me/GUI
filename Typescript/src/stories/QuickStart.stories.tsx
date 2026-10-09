// src/stories/QuickStart.stories.tsx
//
// This story is a *literal* render of what `npx this.gui <AppName>` produces.
// It mirrors npx/template/src/{app.ts,views/Home.ts} content/shape exactly
// (same declareApp, same Home spec tree). If the template changes, update
// this story to match — it exists so "what you see here" === "what you get
// from the CLI". One deliberate bootstrap difference: the real template
// calls mount() (which owns its own DOM root + SelectionProvider); this
// story instead calls renderNode() directly against the same spec and
// bridges resolved nodes into Storybook's own ambient SelectionProvider
// (see .storybook/preview.tsx) — mount() can't be used here because it
// would create a second SelectionProvider that fights the toolbar's
// Inspector toggle and double-mounts the inspector panel.
import React, { useMemo } from 'react';
import ME from 'this.me';
import type { Meta, StoryObj } from '@storybook/react';

import Theme from '@/gui/Theme/Theme';
import Layout from '@/gui/Layout/Layout';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import DevToolsLauncher from '@/runtime/DevToolsLauncher';
import { LauncherPopoverProvider, useLauncherPopover } from '@/runtime/launcherPopover';
import { useRegisterGuiNode } from '@/runtime/selection';
import MeLauncher from '@/react/session/MeLauncher';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { SeedSessionProvider } from '@/react/session/SeedSessionProvider';
import { SessionSurface } from '@/react/session/SessionSurface';
import { Me } from '@/react/Me';
import { declareApp } from '@/runtime/mountApp';
import type { AppDeclaration } from '@/runtime/mountApp';
import { SpecBoundary } from '@/runtime/SpecBoundary';
import type { GuiSpecNode } from '@/runtime/renderer';
import { RunMe } from '@/runtime/run-me';
import { Typography, Button } from '@/gui/Atoms';
import { Hero, Stack } from '@/gui/Molecules';

const TITLE_PATH = 'me/apps.my-app.manifest.title';

// ── Mirrors npx/template/src/views/Home.ts ─────────────────────────────────
function createTemplateHomeSpec(): GuiSpecNode {
  return {
    type: 'Hero',
    props: { height: '100vh', mode: 'left', padding: { xs: 3, md: 8 }, contentMaxWidth: 680 },
    provenance: {
      source: 'views/Home.ts',
      note: 'Template landing view.',
    },
    children: {
      type: 'Stack',
      props: { spacing: 2, alignItems: 'flex-start' },
      children: [
        {
          type: 'Typography',
          props: { variant: 'h1', children: { read: TITLE_PATH } },
          provenance: {
            source: 'views/Home.ts#title',
            semanticPath: TITLE_PATH,
            note: 'App title, read live from the kernel manifest written by declareApp().',
          },
        },
        {
          type: 'Typography',
          props: { variant: 'h5', children: 'Powered by .me' },
          provenance: {
            source: 'views/Home.ts#subtitle',
            note: 'Static template copy — no kernel binding.',
          },
        },
        {
          type: 'Button',
          props: { variant: 'contained', size: 'large', children: 'Get started' },
          provenance: {
            source: 'views/Home.ts#cta',
            note: 'Template placeholder CTA — wire an onClick: { write: ... } action here.',
          },
        },
      ],
    },
  };
}

const SPEC_REGISTRY = { Typography, Button, Hero, Stack };

// ── Demo stand-in for netget's FrontendModeLauncher ────────────────────────
// netget's own LeftBar footer rail has a 4th bubble between Theme and .me
// (DevTools → Theme → Frontend Mode → .me — see App.jsx) that this.gui
// itself does not export: FrontendModeLauncher lives entirely in netget's
// own app (frontend_local/src/components/FrontendModeLauncher), because it
// switches netget's own gateway between dev (Vite proxy) and production
// (built dist) by calling netget's own `/frontend-mode` HTTP route — a
// concept specific to that one deployment, not something a generic
// `npx this.gui` scaffold has. It's reproduced here as a visual-only demo
// (local state, no real fetch) purely so this story shows the same 4-bubble
// rail shape netget's real sidebar has — not as a new this.gui export.
function FrontendModeLauncherDemo() {
  const [open, setOpen] = useLauncherPopover('frontendMode');
  const [mode, setMode] = React.useState<'dev' | 'production'>('dev');
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  useRegisterGuiNode('FrontendModeLauncherDemo.icon', 'FrontendModeLauncherDemoIcon');
  const production = mode === 'production';

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box
        ref={bubbleRef}
        data-gui-node-id="FrontendModeLauncherDemo.icon"
        role="button"
        tabIndex={0}
        aria-label="Open frontend mode switch (demo)"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((v) => !v)}
        sx={{ position: 'relative', width: 44, height: 44, flexShrink: 0, cursor: 'pointer' }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            border: '1px solid',
            borderColor: production ? 'success.main' : 'primary.main',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            transition: 'border-color 120ms ease, transform 120ms ease',
            '&:hover': { transform: 'translateY(-1px)' },
          }}
        >
          <Icon name={production ? 'cloud_done' : 'bolt'} fontSize="1.3rem" iconColor={production ? 'success' : 'primary'} />
        </Box>
      </Box>

      <Popper open={open} anchorEl={bubbleRef.current} placement="right-start" sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 3 }}>
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box
            sx={{
              ml: 1,
              p: 1.5,
              minWidth: 240,
              maxWidth: 300,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: 4,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>
              Frontend Mode (demo)
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Currently: {production ? 'Production' : 'Dev'}
            </Typography>
            {(['dev', 'production'] as const).map((candidate) => (
              <Box
                key={candidate}
                component="button"
                type="button"
                onClick={() => setMode(candidate)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.75,
                  mt: candidate === 'production' ? 0.75 : 0,
                  border: '1px solid',
                  borderColor: mode === candidate ? (candidate === 'production' ? 'success.main' : 'primary.main') : 'divider',
                  borderRadius: 1,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Icon
                  name={candidate === 'production' ? 'cloud_done' : 'bolt'}
                  fontSize="1rem"
                  iconColor={mode === candidate ? (candidate === 'production' ? 'success' : 'primary') : undefined}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {candidate === 'production' ? 'Production (dist)' : 'Dev (Vite)'}
                </Typography>
              </Box>
            ))}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, opacity: 0.7 }}>
              Real version regenerates netget's gateway config and reloads OpenResty — this demo just flips local state.
            </Typography>
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}

// ── Mirrors npx/template/src/app.ts ────────────────────────────────────────
const templateApp: AppDeclaration = {
  id: 'my-app',
  namespace: 'apps.my-app',
  title: '.GUI',
  theme: 'neurons.me',
  views: { home: createTemplateHomeSpec },
};

// ── Mirrors npx/template/src/runtime.tsx's mountApp() shell, as a React tree
// instead of a mount()/createRoot() call (Storybook already owns the root) ─
function QuickStartPreview() {
  // Both created once, not per-render: a fresh `me` every render defeats
  // `runtime`'s own useMemo below (its dep would never match across
  // renders) and re-seeds+re-declares the kernel on every render for no
  // reason — declareApp() only needs to run once per mounted instance.
  const me = useMemo(() => {
    const instance = new ME() as any;
    declareApp(instance, templateApp);
    return instance;
  }, []);
  const homeSpec = useMemo(() => (templateApp.views.home as () => GuiSpecNode)(), []);
  const runtime = useMemo(() => RunMe(me), [me]);

  return (
    <Theme initialThemeId={templateApp.theme}>
      <Me me={me}>
        {/* SeedSessionProvider + SessionSurface: the one-click anonymous
            session (client-generated seed, no credentials form) — the
            default shape for a bare `npx this.gui <AppName>` scaffold with
            no identity backend of its own yet. MeLauncher auto-detects this
            provider and renders its own bubble+popover from it, same as
            DevToolsLauncher/ThemeLauncher render from ambient context. */}
        <SeedSessionProvider>
          <SessionSurface claimRootNamespace="my-app.demo.local" seedStorageKey="this-gui-quickstart-demo-seed:v1">
            {/* LauncherPopoverProvider: without it, each footer launcher's
                useLauncherPopover() falls back to independent local state
                (its own documented no-provider fallback) — nothing then
                stops two of their poppers from being open at once. This
                story never had it, for either of the two launchers it
                already carried before MeLauncher was added — confirmed
                live (DevTools + .me both open simultaneously) before this
                was added. A real app built from this template needs this
                too, the same way it needs Theme/Me. */}
            <LauncherPopoverProvider>
              <Layout
                LeftBar={{
                  initialView: 'expanded',
                  footerElements: [
                    { type: 'action', props: { element: <DevToolsLauncher /> } },
                    { type: 'action', props: { element: <ThemeLauncher /> } },
                    { type: 'action', props: { element: <FrontendModeLauncherDemo /> } },
                    { type: 'action', props: { element: <MeLauncher /> } },
                  ],
                }}
              >
                <SpecBoundary spec={homeSpec} registry={SPEC_REGISTRY} runtime={runtime} />
              </Layout>
            </LauncherPopoverProvider>
          </SessionSurface>
        </SeedSessionProvider>
      </Me>
    </Theme>
  );
}

const meta = {
  title: 'Getting Started/Quick Start',
  component: QuickStartPreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof QuickStartPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'npx this.gui <AppName>',
};
