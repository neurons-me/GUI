import type { Meta, StoryObj } from '@storybook/react';
import MonadNamespaceCard from './MonadNamespaceCard';

const meta: Meta<typeof MonadNamespaceCard> = {
  title: 'Pieces/Monad',
  component: MonadNamespaceCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MonadNamespaceCard>;

const apps = [
  { name: 'monad:cleaker', port: 4101, healthy: true },
  { name: 'monad:netget', port: 4102, healthy: true },
];

export const Default: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [{ name: 'monad:cold-store' }],
    waking: {},
    restartStatus: 'idle',
  },
};

export const NoMonadsRegistered: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: false,
    apps: [],
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle',
  },
};

export const RestartingMesh: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [{ name: 'monad:cold-store' }],
    waking: { 'monad:cold-store': true },
    restartStatus: 'restarting',
  },
};

// The card is the whole of "monad" on screen: the orb as its header (its glow is `healthy`) and the mesh below. The
// states of each part are shown through the card, so there is no story per part:
//   orb glow     healthy true (green) / false (red) / null (default blue)    -> Default, NoMonadsRegistered, Checking
//   mesh         collapsed until opened (click it), empty, restarting, restart failed
export const Checking: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: null,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle',
  },
};

export const RestartFailed: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'error',
    restartError: 'apps/restart-all failed: 502',
  },
};
