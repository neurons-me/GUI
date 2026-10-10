import type { Meta, StoryObj } from '@storybook/react';
import { Button, TextField } from '@mui/material';
import { Hero } from './Hero';

const meta: Meta<typeof Hero> = {
  title: 'Molecules/Display/Hero',
  component: Hero,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**HeroSection** is a full-screen display component that supports image, GIF, video, or color backgrounds with overlay and blur options.

---
## Features
- Background types: \`image\`, \`gif\`, \`video\`, \`color\`.
- Overlay color and opacity control.
- Theme-aware blur effects: \`light\`, \`medium\`, \`heavy\`, \`all\`.
- Fully responsive and fills viewport (100vh).
- Structured content helpers: brand image, header, subheader, description, options.

---
## Props
- \`backgroundSrc\`: Media URL (image, gif, or video).
- \`backgroundType\`: Type of background media ('image', 'gif', 'video', or 'color').
- \`backgroundColor\`: Color when backgroundType = 'color'.
- \`overlayColor\`: Color of overlay.
- \`blur\`: Theme-based blur intensity (\`light\`, \`medium\`, \`heavy\`, \`all\`).
- \`accent\`: Optional \`theme.visuals.accents\` key (\`aurora\` | \`ember\` | \`monolith\` | \`neutral\`) for overlay/background.
        `,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Hero>;

export const ImageBackground: Story = {
  args: {
    backgroundSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    backgroundType: 'image',
    blur: 'none',
    layout: 'fixed',
    children: (
      <div style={{ color: 'white', fontSize: '2rem', fontWeight: 600, textAlign: 'center', marginTop: '40vh' }}>
        Example: Image Background, Blur none
      </div>
    ),
  },
};

export const GifBackground: Story = {
  args: {
    backgroundSrc: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    backgroundType: 'gif',
    blur: 'light',
    layout: 'fixed',
    children: (
      <div style={{ color: 'white', fontSize: '2rem', fontWeight: 600, textAlign: 'center', marginTop: '40vh' }}>
        Example: GIF Background, Blur light
      </div>
    ),
  },
};

export const VideoBackground: Story = {
  args: {
    backgroundSrc: 'https://www.neurons.me/media/neurons.mp4',
    backgroundType: 'video',
    blur: 'medium',
    layout: 'fixed',
    children: (
      <div style={{ color: 'white', fontSize: '2rem', fontWeight: 600, textAlign: 'center', marginTop: '40vh' }}>
        Example: Video Background, Blur medium
      </div>
    ),
  },
};

export const StructuredHero: Story = {
  args: {
    backgroundType: 'color',
    backgroundColor: '#0b1114',
    overlayColor: 'rgba(8, 14, 24, 0.55)',
    brand: {
      src: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760629119/this.gui.neurons.me_mkapde.png',
      alt: 'this.GUI',
      width: 220,
      maxWidth: '70vw',
    },
    header: 'this.GUI Runtime',
    subheader: 'Hero Section',
    typography: 'Runtime overview and quick links for the GUI toolchain.',
    options: (
      <>
        <Button variant="contained" color="primary">Get Started</Button>
        <Button variant="outlined" color="inherit">Docs</Button>
        <TextField size="small" placeholder="Search..." />
      </>
    ),
    mode: 'left',
  },
};

export const HeavyExample: Story = {
  args: {
    backgroundSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    backgroundType: 'image',
    blur: 'heavy',
    children: (
      <div
        style={{
          color: 'white',
          fontSize: '2rem',
          fontWeight: 600,
          textAlign: 'center',
          marginTop: '40vh',
        }}
      >
        Example: Heavy blur overlay (theme preset)
      </div>
    ),
  },
};

export const BlurVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {(['none', 'light', 'medium', 'heavy', 'all'] as const).map((b) => (
        <Hero
          key={b}
          backgroundSrc="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          backgroundType="image"
          blur={b}
          children={
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', marginTop: '40vh' }}>
              Blur = {b}
            </div>
          }
        />
      ))}
    </div>
  ),
};

export const CustomColorExample: Story = {
  args: {
    backgroundSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    backgroundType: 'image',
    overlayColor: 'rgba(15, 21, 37, 0.89)', // Semi-transparent dark overlay
    children: (
      <div style={{
        color: 'white',
        fontSize: '2rem',
        fontWeight: 600,
        textAlign: 'center',
        marginTop: '40vh',
      }}>
        Example: Custom Color Overlay
      </div>
    ),
  },
};


export const AccentPresets: Story = {
  args: {
    backgroundType: 'color',
    accent: 'aurora',
    layout: 'flow',
    height: '40vh',
    mode: 'center',
    header: 'Accent: aurora',
    typography: 'Hero maps accent → theme.visuals.accents[accent] (soft overlay / strong color bg).',
  },
  argTypes: {
    accent: {
      control: 'select',
      options: ['aurora', 'ember', 'monolith', 'neutral'],
    },
  },
};
