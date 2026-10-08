import type { Meta, StoryObj } from '@storybook/react';
import Box from '@/gui/Atoms/Box/Box';
import Host from './Host';
const meta: Meta<typeof Host> = {
  title: 'All.This/monad.ai/Host/Status',
  component: Host,
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Suis-MacBook-Air.local:8161',
    status: 'online',
    variant: 'compact',
  },
};

export default meta;
type Story = StoryObj<typeof Host>;
export const Default: Story = {
  args: {
    variant: 'compact',
  },
};
export const Modal: Story = {
  args: {
    variant: 'modal',
  },
};
export const Offline: Story = {
  args: {
    label: 'localhost:8161',
    status: 'offline',
    variant: 'compact',
  },
};

export const Checking: Story = {
  args: {
    label: 'localhost:8161',
    status: 'checking',
    variant: 'compact',
  },
};

export const Unknown: Story = {
  args: {
    label: 'resolver.local',
    status: 'unknown',
    variant: 'compact',
  },
};

export const InCleakerShell: Story = {
  render: (args) => (
    <Box
      sx={{
        width: '300px',
        borderRadius: '12px',
        p: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, minWidth: 0 }}>
        <pre style={{ margin: 0, padding: 0, lineHeight: '12px', fontSize: '12px' }}>
          {`
   ┓   ┏┓
┓┏┏┣┓┏┓┏┛
•┗┻┛┛┗┗┛•
          `}
        </pre>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 0.45,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0,
              minWidth: 0,
              fontSize: '11px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            <Box sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              sui
            </Box>
            <Box sx={{ pl: 0.55, whiteSpace: 'nowrap', opacity: 0.9 }}>
              .cleaker.me
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Host {...args} variant="compact" />
          </Box>
        </Box>
      </Box>
    </Box>
  ),
  args: {
    label: 'Suis-MacBook-Air.local:8161',
    status: 'online',
    variant: 'compact',
  },
};