import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Grid2 from './Grid2';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import { SpecBoundary } from '@/runtime/SpecBoundary';
import { GuiRegistry } from '@/Registry/GuiRegistry';

const meta: Meta<typeof Grid2> = {
  title: 'Molecules/Grid2',
  component: Grid2,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 16, minHeight: 240, boxSizing: 'border-box', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
The **Grid2** molecule is a thin wrapper around MUI 6's \`Grid2\` (\`@mui/material/Grid2\`).
It keeps Grid2's own API (\`container\`, \`size\`, \`columns\`, \`spacing\`, \`offset\`, \`sx\`) and adds an optional \`query\` prop.

The existing **Molecules/Grid** molecule wraps the *legacy* MUI \`Grid\` (the one with \`item\` / \`xs\` / \`sm\`) and is left unchanged — including its catalog meta, which is still labeled \`atoms.grid\` / \`Atoms\`. Prefer Grid2 for new work. In MUI 7, Grid2 becomes \`Grid\` and the old one is \`GridLegacy\`.

---
## Features
- \`container\`, \`size\`, \`columns\`, \`spacing\`, \`offset\`, \`direction\`, \`wrap\`, \`sx\` — all passed through.
- \`size={{ xs: 12, sm: 6, md: 3 }}\` declares how many columns a child spans at each **viewport** breakpoint (12-column grid by default).
- \`query="container"\` sets \`container-type: inline-size\` on this element so children can use \`theme.containerQueries\` in their \`sx\`. Grid2's \`size\` prop itself still follows the viewport (MUI 6.5 does not wire \`size\` to container queries).
- Declarative usage via the resolver: \`{ type: "Grid2", props, children }\`.

---
## Basic usage (React)
~~~tsx
import Grid2 from '@/gui/Molecules/Grid2/Grid2';
import Box from '@/gui/Atoms/Box/Box';

<Grid2 container spacing={2}>
  <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
    <Box sx={{ bgcolor: 'primary.main', p: 2, color: '#fff' }}>4 / row at md</Box>
  </Grid2>
</Grid2>
~~~

---
## Declarative JSON / Config
~~~json
{
  "type": "Grid2",
  "props": { "container": true, "spacing": 2, "columns": 12 },
  "children": [
    {
      "type": "Grid2",
      "props": { "size": { "xs": 12, "sm": 6, "md": 3 } },
      "children": { "type": "Box", "props": { "sx": { "p": 2 }, "children": "Item" } }
    }
  ]
}
~~~

See **Molecules/Grid2/Index Cards** for the neurons-me.github.io card designs, each section with its own Grid2 declaration.
        `,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Grid2>;

function Cell({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Box sx={{ bgcolor: color, p: 2, color: '#fff', borderRadius: 1, minWidth: 0, overflowWrap: 'anywhere', fontWeight: 700 }}>
      {children}
    </Box>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Grid2 {...args} container spacing={2}>
      <Grid2 size={{ xs: 6, md: 3 }} sx={{ minWidth: 0 }}>
        <Cell color="primary.main">A</Cell>
      </Grid2>
      <Grid2 size={{ xs: 6, md: 3 }} sx={{ minWidth: 0 }}>
        <Cell color="secondary.main">B</Cell>
      </Grid2>
      <Grid2 size={{ xs: 6, md: 3 }} sx={{ minWidth: 0 }}>
        <Cell color="info.main">C</Cell>
      </Grid2>
      <Grid2 size={{ xs: 6, md: 3 }} sx={{ minWidth: 0 }}>
        <Cell color="success.main">D</Cell>
      </Grid2>
    </Grid2>
  ),
};

export const ResponsiveSizes: Story = {
  name: 'Responsive sizes (viewport)',
  render: () => (
    <Grid2 container spacing={2} columns={12}>
      {['one', 'two', 'three', 'four'].map((label, i) => (
        <Grid2 key={label} size={{ xs: 6, sm: 4, md: 3 }} sx={{ minWidth: 0 }}>
          <Cell color={(['primary.main', 'secondary.main', 'info.main', 'success.main'] as const)[i]}>
            {label}: size xs=6 sm=4 md=3 (2 / 3 / 4 per row)
          </Cell>
        </Grid2>
      ))}
    </Grid2>
  ),
};

export const ContainerQuery: Story = {
  name: 'query="container"',
  render: () => (
    <Box>
      <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary', maxWidth: 640 }}>
        The Grid2 has <code>query=&quot;container&quot;</code>, which sets <code>container-type: inline-size</code>.
        Drag the dashed box&apos;s right edge — the child&apos;s color follows this container&apos;s width via{' '}
        <code>theme.containerQueries</code>, not the viewport. Grid2 <code>size</code> still follows the viewport.
      </Typography>
      <Grid2
        container
        query="container"
        spacing={2}
        sx={{
          width: '100%',
          maxWidth: 800,
          resize: 'horizontal',
          overflow: 'auto',
          border: '1px dashed',
          borderColor: 'divider',
          p: 1,
          boxSizing: 'border-box',
          minWidth: 200,
        }}
      >
        <Grid2 size={12}>
          <Box
            sx={(theme) => ({
              p: 2,
              borderRadius: 1,
              color: '#fff',
              fontWeight: 700,
              bgcolor: 'info.main',
              [theme.containerQueries.up('sm')]: { bgcolor: 'success.main' },
              [theme.containerQueries.up('md')]: { bgcolor: 'warning.main' },
            })}
          >
            info below sm-container · success from sm · warning from md (container width)
          </Box>
        </Grid2>
      </Grid2>
    </Box>
  ),
};

const DECLARATIVE_SPEC = {
  type: 'Grid2',
  props: { container: true, spacing: 2, columns: 12 },
  children: [
    {
      type: 'Grid2',
      props: { size: { xs: 12, sm: 6, md: 3 }, sx: { minWidth: 0 } },
      children: {
        type: 'Box',
        props: {
          sx: { bgcolor: 'primary.main', p: 2, color: '#fff', borderRadius: 1, minWidth: 0, overflowWrap: 'anywhere', fontWeight: 700 },
          children: 'xs=12 sm=6 md=3 — from a { type: "Grid2" } spec',
        },
      },
    },
    {
      type: 'Grid2',
      props: { size: { xs: 12, sm: 6, md: 3 }, sx: { minWidth: 0 } },
      children: {
        type: 'Box',
        props: {
          sx: { bgcolor: 'secondary.main', p: 2, color: '#fff', borderRadius: 1, fontWeight: 700 },
          children: 'resolved by GuiRegistry',
        },
      },
    },
    {
      type: 'Grid2',
      props: { size: { xs: 12, sm: 6, md: 3 }, sx: { minWidth: 0 } },
      children: {
        type: 'Box',
        props: {
          sx: { bgcolor: 'info.main', p: 2, color: '#fff', borderRadius: 1, fontWeight: 700 },
          children: '4 / row at md',
        },
      },
    },
    {
      type: 'Grid2',
      props: { size: { xs: 12, sm: 6, md: 3 }, sx: { minWidth: 0 } },
      children: {
        type: 'Box',
        props: {
          sx: { bgcolor: 'success.main', p: 2, color: '#fff', borderRadius: 1, fontWeight: 700 },
          children: '2 / row at sm, 1 at xs',
        },
      },
    },
  ],
};

export const Declarative: Story = {
  name: 'Declarative spec (Grid2 resolver)',
  render: () => (
    <Box>
      <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
        This story is a plain <code>{`{ type: 'Grid2', props, children }`} </code> tree, rendered through{' '}
        <code>SpecBoundary</code> and <code>GuiRegistry</code> — the same pipeline <code>GUI.mount</code> uses.
      </Typography>
      <SpecBoundary spec={DECLARATIVE_SPEC as any} registry={GuiRegistry} />
    </Box>
  ),
};
