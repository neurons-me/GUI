import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Box from '@mui/material/Box';
import StreamStage from './StreamStage';
import TwitchChat from './TwitchChat';
import { SAMPLE_CHAT } from './sampleData';
import { WithTheme } from './WithTheme.story';
import { SampleGuiLayer } from './SampleGuiLayer.story';

function StreamView({ mode, controls }: { mode: 'light' | 'dark'; controls: boolean }) {
  const [msgs, setMsgs] = useState(SAMPLE_CHAT);
  return (
    <WithTheme mode={mode}>
      <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh', boxSizing: 'border-box', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StreamStage controls={controls} opacity={40} storageKey="storybook:twitch-stream"><SampleGuiLayer /></StreamStage>
        </Box>
        <TwitchChat messages={msgs} caption="Sample messages (example data)" height={560}
          onSend={(text) => setMsgs((m) => [...m, { id: String(m.length + 1), user: 'you', text }])} />
      </Box>
    </WithTheme>
  );
}

const meta: Meta = {
  title: 'Twitch/Stream',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Overlay stage (placeholder camera → overlay → .GUI) with chat side panel.' } } },
};
export default meta;
type Story = StoryObj;
export const Dark: Story = { render: () => <StreamView mode="dark" controls /> };
export const Light: Story = { render: () => <StreamView mode="light" controls /> };
