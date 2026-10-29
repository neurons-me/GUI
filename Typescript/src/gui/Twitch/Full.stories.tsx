import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import StreamStage from './StreamStage';
import { ExampleChannel } from './Channel/ExampleChannel.story';
import { WithTheme } from './WithTheme.story';
import { SampleGuiLayer } from './SampleGuiLayer.story';
import { SAMPLE_PROFILE, SAMPLE_STREAM } from './sampleData';

/** Slim top bar (codex-me web topbar arrangement): brand · title · live status. Example data. */
function TopBar() {
  return (
    <Box component="header" sx={{ gridArea: 'top', display: 'flex', alignItems: 'center', gap: 1.5, px: 2, minWidth: 0,
      borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>.GUI · Twitch</Typography>
      <Typography variant="body2" noWrap sx={{ color: 'text.secondary', flex: 1, minWidth: 0 }}>
        {SAMPLE_PROFILE.displayName} — {SAMPLE_STREAM.title}
      </Typography>
      <Chip size="small" color="error" label={`LIVE · ${SAMPLE_STREAM.viewers}`} />
      <Chip size="small" variant="outlined" label="Example data" />
    </Box>
  );
}

function FullView({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <WithTheme mode={mode}>
      <Box data-testid="twitch-full" sx={{ width: '100vw', height: '100vh', p: 0, m: 0, overflow: 'hidden', boxSizing: 'border-box',
        bgcolor: 'background.default', color: 'text.primary', display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) 380px' },
        gridTemplateRows: { xs: '44px 45vh minmax(0,1fr)', md: '44px minmax(0,1fr)' },
        gridTemplateAreas: { xs: '"top" "content" "right"', md: '"top top" "content right"' } }}>
        <TopBar />
        <Box component="main" sx={{ gridArea: 'content', minWidth: 0, minHeight: 0 }}>
          <StreamStage fit="fill" controls opacity={40} storageKey="storybook:twitch-full"><SampleGuiLayer /></StreamStage>
        </Box>
        <Box component="aside" sx={{ gridArea: 'right', minWidth: 0, minHeight: 0, borderLeft: { md: 1 }, borderColor: 'divider' }}>
          <ExampleChannel width="100%" height="100%" hideWindowControls />
        </Box>
      </Box>
    </WithTheme>
  );
}

const meta: Meta = {
  title: 'Twitch/Full',
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Complete Twitch experience: top bar, StreamStage (fill) with OverlaySwatch + .GUI layer, Channel docked right (stacks below on narrow screens). Example data only.' } } },
};
export default meta;
type Story = StoryObj;
export const Dark: Story = { render: () => <FullView mode="dark" /> };
export const Light: Story = { render: () => <FullView mode="light" /> };
