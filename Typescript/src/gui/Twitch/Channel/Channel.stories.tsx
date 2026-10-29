import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Box from '@mui/material/Box';
import Channel from './Channel';
import type { ChannelProps } from './Channel.types';
import { ExampleChannel } from './ExampleChannel.story';
import { WithTheme } from '../WithTheme.story';

const meta: Meta<typeof Channel> = {
  title: 'Twitch/Channel',
  component: Channel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Twitch side panel ported from codex-me: header (wordmark, @channel, Settings, dock/float/minimize), chat, inspector with profile + Stream/Channel/Followers, and OBS/face slots. Presentational; all data shown is EXAMPLE DATA.' } } },
};
export default meta;
type Story = StoryObj<typeof Channel>;

const themed = (mode: 'light' | 'dark', extra: Partial<ChannelProps> = {}): Story => ({
  render: () => (
    <WithTheme mode={mode}>
      <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh', boxSizing: 'border-box', display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ExampleChannel {...extra} />
        <ExampleChannel defaultPanel="inspector" {...extra} />
      </Box>
    </WithTheme>
  ),
});
export const Dark = themed('dark');
export const Light = themed('light');
export const Floating = themed('dark', { defaultMode: 'floating' });
export const Minimized = themed('dark', { defaultMode: 'minimized' });
