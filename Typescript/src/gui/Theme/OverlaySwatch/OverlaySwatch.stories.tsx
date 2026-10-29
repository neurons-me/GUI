import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react';
import OverlaySwatch from './OverlaySwatch';
import { ThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { makeMuiTheme } from '@/gui/Theme/fromTokens';
import { themeTokens } from '@/gui/Theme/styles/theme.tokens';
import { getGuiTheme } from '@/gui/Theme/utils/catalog';

// Pins one catalog theme for this story (independent of the toolbar/persisted theme),
// providing the same MUI theme + GUI ThemeContext that <Theme> provides.
function WithTheme({ themeId, mode, children }: { themeId: string; mode: 'light' | 'dark'; children: React.ReactNode }) {
  const manifest: any = getGuiTheme(themeId);
  const mui = useMemo(() => makeMuiTheme(themeTokens, manifest?.mode?.[mode] ?? {}, mode), [manifest, mode]);
  const ctx = useMemo(() => ({ themeId, themeName: manifest?.themeName ?? themeId, mode, setThemeId: () => {}, setMode: () => {}, toggleMode: () => {} }), [themeId, mode, manifest]);
  return (
    <ThemeProvider theme={mui}>
      <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
    </ThemeProvider>
  );
}

const meta: Meta<typeof OverlaySwatch> = {
  title: 'Getting Started/Theme/OverlaySwatch',
  component: OverlaySwatch,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'One circle tints a full-screen overlay. Drag ↔ hue, ↕ opacity. Starts on the theme primary color and follows theme changes until dragged; double-click resets to the theme. Persisted per theme in localStorage.' } },
  },
  args: { storageKey: 'storybook:overlay-hsl', size: 40, position: 'top-right', defaultOpacity: 89 },
};
export default meta;
type Story = StoryObj<typeof OverlaySwatch>;

const Content = () => (
  <div style={{ position: 'relative', zIndex: 1, padding: 48, fontFamily: 'sans-serif', color: 'white' }}>
    <h1>Overlay swatch</h1>
    <p>Drag the circle (top-right): ↔ color · ↕ opacity · double-click: theme color.</p>
  </div>
);
const themed = (themeId: string, mode: 'light' | 'dark'): Story => ({
  render: (args) => (
    <WithTheme themeId={themeId} mode={mode}>
        <OverlaySwatch {...args} />
        <Content />
      </WithTheme>
  ),
});

export const NeuronsDark = themed('neurons.me', 'dark');
export const NeuronsLight = themed('neurons.me', 'light');
export const CherryByteDark = themed('cherrybyte', 'dark');
export const SeafoamLight = themed('seafoam', 'light');
export const ControlOnly: Story = { args: { overlay: false, position: 'bottom-left', size: 56 } };
/** Uses the live <Theme> from the toolbar: switch Mode / ThemeLauncher and it follows until dragged. */
export const FollowsTheme: Story = {};
