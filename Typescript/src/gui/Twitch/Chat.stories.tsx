import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Box from '@mui/material/Box';
import TwitchChat from './TwitchChat';
import { SAMPLE_CHAT } from './sampleData';
import { WithTheme } from './WithTheme.story';

const meta: Meta<typeof TwitchChat> = {
  title: 'Twitch/Chat',
  component: TwitchChat,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Stream chat panel from theme tokens. Messages are EXAMPLE DATA.' } } },
  args: { messages: SAMPLE_CHAT, caption: 'Sample messages (example data)' },
};
export default meta;
type Story = StoryObj<typeof TwitchChat>;

const themed = (mode: 'light' | 'dark'): Story => ({
  render: (args) => (
    <WithTheme mode={mode}>
      <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}><TwitchChat {...args} /></Box>
    </WithTheme>
  ),
});
export const Dark = themed('dark');
export const Light = themed('light');
export const ReadOnly: Story = { ...themed('dark'), args: { readOnly: true } };
