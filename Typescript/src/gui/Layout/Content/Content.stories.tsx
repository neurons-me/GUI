import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Layout from '@/gui/Layout/Layout';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
const meta: Meta<typeof Layout> = {
  title: 'Getting Started/Layout/Content',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
`The **Content** area is the main space of the layout.

## What it does
- Shows the main page content.
- Adds padding automatically when bars are present.
- Keeps a shared page column centered on the window (maxWidth, minWidth and height come from \`GUI.window.layout.content\` in the document), so expanding a rail does not stretch the page edge-to-edge.
- Works with \`TopBar\`, \`LeftBar\`, \`RightBar\`, and \`Footer\`.

## What to pass
- Put your page UI inside \`<Layout>...</Layout>\`.
- Turn bars on by passing \`TopBar\`, \`LeftBar\`, \`RightBar\`, and \`Footer\` props.
- If you pass no bars, Content fills the page by itself.

## Basic shape
~~~tsx
<Layout>
  <YourPage />
</Layout>
~~~

## With bars
~~~tsx
<Layout
  TopBar={{ title: 'App' }}
  LeftBar={{ initialView: 'rail' }}
  RightBar={{ initialView: 'expanded' }}
  Footer={{ brandLabel: 'neurons.me' }}
>
  <YourPage />
</Layout>
~~~
`,
      },
    },
  },
};
export default meta;
interface DemoContentProps {
  text: string;
}

const DemoContent: React.FC<DemoContentProps> = ({ text }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      color: 'text.primary',
    }}
  >
    <Typography variant="h4">{text}</Typography>
  </Box>
);

const Template = (args: React.ComponentProps<typeof Layout>): React.JSX.Element => (
  <Layout {...args}>
    <DemoContent text="This is the Content area" />
  </Layout>
);

type Story = StoryObj<typeof Layout>;

export const NoBars: Story = {
  render: Template,
  args: {},
};

export const FullShell: Story = {
  render: Template,
  args: {
    TopBar: {
      title: 'Full Layout',
    },
    LeftBar: {
      initialView: 'rail',
      elements: [
        { type: 'link', props: { label: 'Dashboard', icon: 'dashboard' } },
        { type: 'link', props: { label: 'Analytics', icon: 'bar_chart' } },
      ],
      footerElements: [
        { type: 'link', props: { label: 'Settings', icon: 'settings' } },
      ],
    },
    RightBar: {
      initialView: 'expanded',
      elements: [
        { type: 'link', props: { label: 'Activity', icon: 'history' } },
        {
          type: 'menu',
          props: {
            label: 'Views',
            icon: 'view_cozy',
            items: [
              { label: 'Timeline', icon: 'timeline' },
            ],
          },
        },
      ],
      footerElements: [
        { type: 'action', props: { label: 'Help', icon: 'help' } },
      ],
    },
    Footer: {
      brandLabel: 'neurons.me',
      position: 'static',
      leftElements: [{ type: 'link', props: { label: 'Docs', href: '/docs' } }],
      rightElements: [{ type: 'link', props: { label: 'GitHub', href: 'https://github.com/neurons-me' } }],
    },
  },
};
