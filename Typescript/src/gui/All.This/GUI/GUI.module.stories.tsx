import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ModuleSource } from '../All.This.types';
import GUIModule, { type GUIModuleProps } from './GUI.module';

function GUIModuleStory(args: GUIModuleProps) {
  const [source, setSource] = React.useState<ModuleSource>(args.source);

  React.useEffect(() => {
    setSource(args.source);
  }, [args.source]);

  return <GUIModule {...args} source={source} onSourceChange={setSource} />;
}

const meta: Meta<typeof GUIModule> = {
  title: 'All.This/GUI/Runtime',
  component: GUIModule,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'GUI runtime module example based on the runtime topbar controls: source selection, asset status, and resolved asset URL.',
      },
    },
  },
  render: (args) => <GUIModuleStory {...args} />,
};

export default meta;
type Story = StoryObj<typeof GUIModule>;

export const RuntimeControl: Story = {
  args: {
    source: 'local',
    state: 'on',
    assetUrl: '../../this/GUI/npm/dist/this.gui.umd.js',
    version: '1.4.89',
  },
};
