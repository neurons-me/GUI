import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Box from '@mui/material/Box';
import StreamStage from './StreamStage';
import { ExampleChannel } from './Channel/ExampleChannel.story';
import { WithTheme } from './WithTheme.story';
import { SampleGuiLayer } from './SampleGuiLayer.story';

function StreamView({ mode, controls }: { mode: 'light' | 'dark'; controls: boolean }) {
  return (
    <WithTheme mode={mode}>
      <Box sx={{ bgcolor: 'background.default', height: '100vh', overflow: 'hidden', boxSizing: 'border-box', display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) 360px' }, gridTemplateRows: { xs: '45vh 55vh', md: '100vh' } }}>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>
          <StreamStage controls={controls} opacity={40} storageKey="storybook:twitch-stream"><SampleGuiLayer /></StreamStage>
        </Box>
        <ExampleChannel width="100%" height="100%" hideWindowControls />
      </Box>
    </WithTheme>
  );
}

const meta: Meta = {
  title: 'Twitch/Stream',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Overlay stage (placeholder camera → overlay → .GUI) with the Channel side panel docked (example data).' } } },
};
export default meta;
type Story = StoryObj;
export const Dark: Story = { render: () => <StreamView mode="dark" controls /> };
export const Light: Story = { render: () => <StreamView mode="light" controls /> };
