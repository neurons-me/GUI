import type { Meta, StoryObj } from '@storybook/react-vite';
import QRme from './QR.me';

const meta: Meta<typeof QRme> = {
  title: 'Pieces/QR.me',
  component: QRme,
  args: {
    value: 'https://jabellae.cleaker.me',
    username: 'jabellae',
    avatarSrc: 'https://neurons.me/media/neurons-grey.png',
    diameter: 124,
    variant: 'md',
    defaultFace: 'qr',
    hoverFlip: true,
    clickFlip: true,
    showAvatarLabel: false,
  },
};

export default meta;

type Story = StoryObj<typeof QRme>;

export const Default: Story = {};

export const AvatarFirst: Story = {
  args: {
    defaultFace: 'avatar',
  },
};

export const FallbackOnly: Story = {
  args: {
    avatarSrc: '',
    avatarFallback: 'JB',
    showAvatarLabel: true,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <QRme {...args} variant="xs" diameter={72} />
      <QRme {...args} variant="sm" diameter={96} />
      <QRme {...args} variant="md" diameter={112} />
      <QRme {...args} variant="lg" diameter={148} />
      <QRme {...args} variant="xl" diameter={184} />
    </div>
  ),
};
