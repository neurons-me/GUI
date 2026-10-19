import type { Meta, StoryObj } from '@storybook/react';
import HostSurface from './HostSurface';

const meta: Meta<typeof HostSurface> = {
  title: 'Pieces/Host/HostSurface',
  component: HostSurface,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof HostSurface>;

export const Default: Story = {
  args: {
    endpoint: 'http://local.host/apps/netget',
  },
};
