import type { Meta, StoryObj } from '@storybook/react';
import MonadMesh from './MonadMesh';

const meta: Meta<typeof MonadMesh> = {
  title: 'All.This/monad.ai/MonadMesh',
  component: MonadMesh,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MonadMesh>;

const apps = [
  { name: 'monad:cleaker', port: 4101, healthy: true },
  { name: 'monad:netget', port: 4102, healthy: true },
];

export const Collapsed: Story = {
  args: { apps, sleepingEntries: [{ name: 'monad:cold-store' }] },
};

export const Expanded: Story = {
  args: { apps, sleepingEntries: [{ name: 'monad:cold-store' }], defaultOpen: true },
};

export const Empty: Story = {
  args: { apps: [], sleepingEntries: [], defaultOpen: true },
};

export const Restarting: Story = {
  args: { apps, sleepingEntries: [], defaultOpen: true, restartStatus: 'restarting' },
};

export const RestartError: Story = {
  args: { apps, sleepingEntries: [], defaultOpen: true, restartStatus: 'error', restartError: 'apps/restart-all failed: 502' },
};
