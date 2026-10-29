import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import StreamStage from './StreamStage';
import { WithTheme } from './WithTheme.story';
import { SampleGuiLayer } from './SampleGuiLayer.story';

const meta: Meta<typeof StreamStage> = {
  title: 'Twitch/Overlay',
  component: StreamStage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Stream layer, bottom to top: camera (PLACEHOLDER gradient/sample video) → tint overlay (opacity 0 = clean camera, 100 = full cover) → .GUI components. fit="fill" (default) covers the container width+height; fit="contain" / transparent = fixed 1920x1080 scaled (OBS).' } },
  },
  argTypes: {
    hue: { control: { type: 'range', min: 0, max: 360 } },
    opacity: { control: { type: 'range', min: 0, max: 100 } },
    fit: { control: 'inline-radio', options: ['fill', 'contain'] },
  },
  args: { hue: 210, opacity: 50 },
  render: (args) => (
    <WithTheme mode="dark">
      <div style={{ background: '#111', height: '100vh', boxSizing: 'border-box' }}>
        <StreamStage {...args}><SampleGuiLayer /></StreamStage>
      </div>
    </WithTheme>
  ),
};
export default meta;
type Story = StoryObj<typeof StreamStage>;

/** Stage driven by args (hue/opacity) over the placeholder camera. */
export const Stage: Story = {};
export const Opacity0: Story = { args: { opacity: 0 } };
export const Opacity50: Story = { args: { opacity: 50 } };
export const Opacity100: Story = { args: { opacity: 100 } };

/** Fixed 1920x1080 scaled to width (letterboxed by the container). */
export const Contain: Story = { args: { fit: 'contain' } };

/** What OBS loads as a browser source: transparent, no camera, no controls; args drive hue/opacity. */
export const OBSSource: Story = {
  args: { transparent: true, opacity: 30 },
  render: (args) => (
    <WithTheme mode="dark">
      <div style={{ background: 'transparent' }}>
        <StreamStage {...args}><SampleGuiLayer /></StreamStage>
      </div>
    </WithTheme>
  ),
};

/** Control view: theme-bound OverlaySwatch on the stage (drag ↔ hue, ↕ opacity, double-click = theme). */
export const ControlView: Story = { args: { controls: true, opacity: 50, storageKey: 'storybook:twitch-overlay' } };
