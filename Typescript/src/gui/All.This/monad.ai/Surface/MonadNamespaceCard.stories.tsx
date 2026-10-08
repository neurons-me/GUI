import type { Meta, StoryObj } from '@storybook/react';
import MonadNamespaceCard from './MonadNamespaceCard';

const meta: Meta<typeof MonadNamespaceCard> = {
  title: 'All.This/monad.ai/MonadNamespaceCard',
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
