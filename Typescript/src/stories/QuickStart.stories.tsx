// src/stories/QuickStart.stories.tsx
//
// This story renders what `npx this.gui <AppName>` produces: the same
// shell (AppShell with the top-bar position and the brand mark, as
// npx/template/src/Root.tsx passes them), the same Home view
// (npx/template/src/views/Home.tsx) and the same app declaration
// (npx/template/src/app.ts). If the template changes, update this story to
// match — it exists so "what you see here" === "what you get from the CLI".
// Two deliberate differences: the template imports from the published
// `this.gui/*` entries and this story from `@/`; and the template connects
// to its monad through createWsMeRuntime, while this story runs the kernel
// in memory (RunMe) so it needs no server. The FrontendModeLauncherDemo
// bubble in the rail is extra: it is netget's, not part of the scaffold.
import React, { useMemo } from 'react';
import ME from 'this.me';
import type { Meta, StoryObj } from '@storybook/react';

import { useLauncherPopover } from '@/runtime/launcherPopover';
import { useRegisterGuiNode } from '@/runtime/selection';
import { AppShell } from '@/runtime/AppShell';
import { useMeAction } from '@/react/useMeAction';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { SeedSessionProvider } from '@/react/session/SeedSessionProvider';
import { SessionSurface } from '@/react/session/SessionSurface';
import type { AppDeclaration } from '@/runtime/mountApp';
import { RunMe } from '@/runtime/run-me';
import { Typography, Button } from '@/gui/Atoms';
import { Hero, Stack } from '@/gui/Molecules';

// ── Mirrors npx/template/src/views/Home.tsx ────────────────────────────────
function Home() {
  const setRoute = useMeAction('apps.my-app.route');
  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }} contentMaxWidth={680}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h1">.GUI</Typography>
        <Typography variant="h5">Powered by .me</Typography>
        <Button variant="contained" size="large" onClick={() => setRoute('admin')}>
          Get started
        </Button>
      </Stack>
    </Hero>
  );
}

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
// `admin` (the Spaces explorer) is not drawn here: "Get started" would open it.
const templateApp: AppDeclaration = {
  id: 'my-app',
  namespace: 'apps.my-app',
  title: '.GUI',
  theme: 'neurons.me',
  views: { home: Home, admin: Home },
};

// ── Mirrors npx/template/src/Root.tsx ──────────────────────────────────────
const NAV_ITEMS = [
  { route: 'home', label: 'Home', icon: 'home' },
  { route: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
];

const BRAND_SX = {
  width: '100%',
  height: '100%',
  minWidth: 56,
  minHeight: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '1.25rem',
  color: 'primary.main',
} as const;

function QuickStartPreview() {
  // Created once, not per render: a fresh `me` every render would re-declare
  // the kernel (AppShell's declareApp) on every render for no reason.
  const me = useMemo(() => new ME() as any, []);
  const runtime = useMemo(() => RunMe(me), [me]);

  return (
    // SeedSessionProvider + SessionSurface: the one-click anonymous session
    // (client-generated seed, no credentials form). MeLauncher, which AppShell
    // puts in the rail, detects this provider and renders its bubble from it.
    <SeedSessionProvider>
      <SessionSurface claimRootNamespace="my-app.demo.local" seedStorageKey="this-gui-quickstart-demo-seed:v1">
        <AppShell
          app={templateApp}
          me={me}
          runtime={runtime}
          navItems={NAV_ITEMS}
          position={`${templateApp.namespace} @ ${window.location.host}`}
          brand={<Box sx={BRAND_SX}>{templateApp.title.replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase()}</Box>}
          footerElements={[<FrontendModeLauncherDemo key="frontend-mode" />]}
        />
      </SessionSurface>
    </SeedSessionProvider>
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
