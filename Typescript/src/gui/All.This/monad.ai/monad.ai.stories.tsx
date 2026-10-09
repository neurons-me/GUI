import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Monad from './monad.ai';
import { Theme } from '../../Theme/Theme';
import { getGuiTheme } from '../../Theme/utils/catalog';
import { makeMuiTheme } from '../../Theme/fromTokens';
import { themeTokens } from '../../Theme/styles/theme.tokens';
const meta: Meta<typeof Monad> = {
  title: 'Pieces/monad.ai/monad.ai',
  component: Monad,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Monad>;
export const Bubble: Story = {
  args: {
    variant: 'bubble',
  },
};

export const Identity: Story = {
  args: {
    variant: 'identity',
    kind: 'me',
    seed: 'jabellae',
  },
};

/**
 * Fixed-dark embed target. Bypasses the shared `<Theme>` wrapper entirely —
 * its persistence layer (`readThemeModeFromScope`) reads a single
 * localStorage key (`this.gui:themeMode`) shared across every `<Theme>`
 * instance on the page, so a nested `initialMode="dark"` can be clobbered
 * by an outer instance's own effect writing "light" back after mount.
 * A plain MUI `ThemeProvider` with a directly-built dark theme has no such
 * shared state, so it can't race with the global preview.tsx decorator.
 *
 * `html`/`body` also get forced transparent via inline style (highest CSS
 * specificity, wins over CssBaseline's stylesheet rule regardless of
 * injection order) — this story is meant to be embedded via <iframe>, so it
 * should show through to whatever page frames it rather than paint its own
 * background color.
 */
const neuronsManifest = getGuiTheme('neurons.me');
const darkTheme = makeMuiTheme(themeTokens, neuronsManifest?.mode?.dark ?? {}, 'dark');

function TransparentDarkFrame({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // preview-head.html ships a `!important` rule syncing html/body/#storybook-root
    // background to `var(--mui-palette-background-default)`, read off the *outer*
    // (light) Theme's CSS var on <html>. A plain inline style can't beat an author
    // !important rule — only an inline !important can, so use setProperty here.
    const targets = [document.documentElement, document.body, document.getElementById('storybook-root')].filter(
      (el): el is HTMLElement => !!el,
    );
    for (const el of targets) {
      el.style.setProperty('background', 'transparent', 'important');
    }
  }, []);
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export const IdentityEmbedDark: Story = {
  args: {
    variant: 'identity',
    kind: 'me',
    seed: 'jabellae',
  },
  decorators: [(StoryFn) => <TransparentDarkFrame><StoryFn /></TransparentDarkFrame>],
};

export const IdentityMonad: Story = {
  args: {
    variant: 'identity',
    kind: 'monad',
    seed: 'jabellae',
  },
  parameters: {
    docs: {
      description: {
        story:
          'monad has no identityHash-ring concept yet — variant="identity" intentionally falls back to the same pixel-grid it uses under variant="bubble".',
      },
    },
  },
};

export const Inline: Story = {
  args: {
    variant: 'inline',
    children: 'monad.ai is present with no shape.',
  },
  parameters: {
    layout: 'padded',
  },
};
