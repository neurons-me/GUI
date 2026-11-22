import type { Meta, StoryObj } from '@storybook/react';
import { SpecBoundary } from '@/runtime/SpecBoundary';
import { GuiRegistry } from '@/Registry/GuiRegistry';
import {
  IndexCardsPage,
  ARCH,
  NRP,
  ESSAYS,
  NETWORK,
  TWO_COL_SIZE,
  cardSx,
} from './IndexCards';

const meta: Meta = {
  title: 'Molecules/Grid2/Index Cards',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Showcase of every card type from the [neurons-me.github.io](https://neurons-me.github.io/) index, each section in its own declarative Grid2 layout (neurons.me theme, light/dark from the Mode toolbar — follows the system choice you pick there).

| Section | Grid2 \`size\` | Per row |
| --- | --- | --- |
| Docs | \`{ xs: 6, sm: 4, md: 3 }\` | 2 / 3 / 4 |
| Demos | \`{ xs: 12, sm: 6, md: 4 }\` | 1 / 2 / 3 |
| Architecture, NRP, Essays | \`{ xs: 12, sm: 6 }\` | 1 / 2 |
| Network | \`{ xs: 12 }\` | 1 |

Demo titles use \`overflowWrap: 'anywhere'\` so they wrap instead of being cut (the live page still has \`wordBreak: 'keep-all'\`). Cards themselves keep the index designs: Docs row (.me, cleaker QR, monad, the .GUI play card, netget letters, mlearning.studio, .wallet graph, All.This), Demos image cards, and the 2-column resource cards.

The **Declarative sections** story renders Architecture, NRP, Essays and Network as \`{ type: 'Grid2', props, children }\` specs through the resolver.
        `,
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const AllSections: Story = {
  name: 'All index cards',
  render: () => <IndexCardsPage />,
};

const itemSx = { minWidth: 0, maxWidth: '100%' } as const;

function resourceSpec(c: any) {
  const descText = Array.isArray(c.desc)
    ? c.desc.map((x: string | { code: string }) => (typeof x === 'string' ? x : x.code)).join('')
    : c.desc;
  return {
    type: 'Grid2',
    props: { size: TWO_COL_SIZE, sx: itemSx },
    children: {
      type: 'Card',
      props: {
        component: 'a',
        href: c.href,
        variant: 'outlined',
        sx: {
          ...cardSx,
          display: 'flex',
          alignItems: 'center',
          gap: 1.75,
          px: 2,
          py: 1.75,
          minHeight: 78,
        },
      },
      children: [
        {
          type: 'Box',
          props: {
            sx: {
              width: 50,
              height: 50,
              borderRadius: '10px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
            },
          },
          children: {
            type: 'Typography',
            props: { component: 'span', sx: { fontSize: c.icon.size || '1.6rem', lineHeight: 1 }, children: c.icon.glyph || '·' },
          },
        },
        {
          type: 'Box',
          props: { sx: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: 0.25 } },
          children: [
            {
              type: 'Typography',
              props: { variant: 'subtitle2', sx: { fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, overflowWrap: 'anywhere' }, children: c.title },
            },
            {
              type: 'Typography',
              props: { variant: 'body2', color: 'text.secondary', sx: { fontSize: '0.78rem', lineHeight: 1.4, overflowWrap: 'anywhere' }, children: descText },
            },
          ],
        },
      ],
    },
  };
}

function sectionSpec(title: string, children: object[]) {
  return {
    type: 'Box',
    props: { component: 'section', sx: { mt: 5 } },
    children: [
      {
        type: 'Typography',
        props: {
          variant: 'overline',
          component: 'h2',
          color: 'text.secondary',
          sx: { display: 'block', letterSpacing: '0.14em', fontWeight: 700, lineHeight: 1.6, fontSize: '0.7rem', mb: 1.75 },
          children: title,
        },
      },
      {
        type: 'Grid2',
        props: { container: true, spacing: 2, columns: 12 },
        children,
      },
    ],
  };
}

const DECLARATIVE_SECTIONS = {
  type: 'Box',
  props: {
    sx: { maxWidth: 960, mx: 'auto', px: { xs: 1.5, sm: 2 }, py: 3, bgcolor: 'background.default', width: '100%', boxSizing: 'border-box' },
  },
  children: [
    {
      type: 'Typography',
      props: {
        variant: 'body2',
        color: 'text.secondary',
        sx: { mb: 0 },
        children:
          'These sections are a { type: "Grid2" } tree passed to SpecBoundary / GuiRegistry — the same resolve path as GUI.mount.',
      },
    },
    sectionSpec('Architecture & Benchmarks', ARCH.map(resourceSpec)),
    sectionSpec('NRP & Axioms', NRP.map(resourceSpec)),
    sectionSpec(
      'Essays & Notation',
      ESSAYS.map((c) => resourceSpec({ ...c, icon: 'glyph' in c.icon ? c.icon : { glyph: '◎', size: '1.6rem' } })),
    ),
    sectionSpec('Network', NETWORK.map(resourceSpec)),
  ],
};

export const DeclarativeSections: Story = {
  name: 'Declarative sections',
  render: () => <SpecBoundary spec={DECLARATIVE_SECTIONS as any} registry={GuiRegistry} />,
};
