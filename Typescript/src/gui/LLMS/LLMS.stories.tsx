import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LLMS } from './LLMS';
import { MENU_EN, MENU_ES, MENU_FULL, ROBOT } from './examples';
import { WithTheme } from '../Twitch/WithTheme.story';

const Frame = ({ themeId, mode, title, width, children }: { themeId?: string; mode: 'light' | 'dark'; title?: string; width?: number | string; children: React.ReactNode }) => (
  <WithTheme themeId={themeId} mode={mode}>
    <Box sx={{ p: 2, bgcolor: 'background.default', color: 'text.primary', minHeight: '100%', width: width ?? '100%', maxWidth: '100%' }}>
      {title && <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>{title}</Typography>}
      {children}
    </Box>
  </WithTheme>
);

const meta: Meta<typeof LLMS> = {
  title: 'LLMS/LLMS',
  component: LLMS,
  parameters: { layout: 'fullscreen', docs: { description: { component:
    'How a sentence becomes .me: the phrase, the ops as .me code, the state graph and me.explain(), sharing one active path. ' +
    'Hover (or tap) a word, a code token, a graph node or an explain row; everything that names the same path lights up. ' +
    'Graph: wheel / pinch to zoom, drag to pan, ⟲ resets, ⤢ expands.' } } },
};
export default meta;
type S = StoryObj<typeof LLMS>;

export const MenuDark: S = { name: 'Menu (e24) · dark', render: () => <Frame mode="dark" title="menu · bread 20 → 25"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame> };
export const MenuLight: S = { name: 'Menu (e24) · light', render: () => <Frame mode="light"><LLMS {...MENU_EN} expandedGraph={MENU_FULL} /></Frame> };
export const MenuEspanol: S = { name: 'Menú (español)', render: () => <Frame mode="dark" title="menú · pan 20 → 25"><LLMS {...MENU_ES} /></Frame> };
export const Robot: S = { name: 'Robot canProceed', render: () => <Frame mode="dark" title="robot.canProceed = battery >= minimumBattery"><LLMS {...ROBOT} /></Frame> };

export const Themes: S = {
  name: 'Three themes',
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
      <Frame themeId="neurons.me" mode="dark" title="neurons.me · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="ghost.shell" mode="dark" title="GhostShell · dark"><LLMS {...MENU_EN} /></Frame>
      <Frame themeId="prince-of-darkness" mode="light" title="PrinceOfDarkness · light"><LLMS {...ROBOT} /></Frame>
    </Box>
  ),
};

export const Mobile: S = { name: 'Mobile (360px)', parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <Frame mode="dark" width={360}><LLMS {...MENU_ES} graphHeight={160} /></Frame> };

/** compose the parts yourself: one Provider shares the active path; report it out with onActivePath */
export const Composed: S = {
  name: 'Composed parts',
  render: function Composed() {
    const [a, setA] = useState<string | null>(null);
    return (
      <Frame mode="dark">
        <LLMS {...MENU_EN} onActivePath={setA}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box><LLMS.Phrase /><Box sx={{ mt: 1 }}><LLMS.Syntax /></Box><LLMS.Explain /></Box>
            <LLMS.Graph height={260} />
          </Box>
        </LLMS>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>active: {a ?? '—'}</Typography>
      </Frame>
    );
  },
};

/** controlled: the page owns the active path (e.g. several LLMS on one page staying in sync) */
export const Controlled: S = {
  name: 'Controlled (two in sync)',
  render: function Controlled() {
    const [hov, setHov] = useState<string | null>(null), [pin, setPin] = useState<string | null>('menu.bread.price');
    const p = { activePath: hov ?? pin, onHoverPath: setHov, onPinPath: (k: string) => setPin((x) => (x === k ? null : k)) };
    return (
      <Frame mode="dark">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <LLMS {...MENU_EN} {...p} parts={['phrase', 'syntax']} />
          <LLMS {...MENU_EN} {...p} parts={['graph', 'explain']} />
        </Box>
      </Frame>
    );
  },
};
