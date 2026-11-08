import type { Meta, StoryObj } from '@storybook/react';
import SearchBar from './SearchBar';
import type { JsonSearchItem } from './SearchBar.types';

const mockItems: JsonSearchItem[] = [
  {
    id: 'me',
    title: '.me',
    desc: 'Own your knowledge.',
    url: 'https://neurons-me.github.io/.me/',
    icon: {
      light: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1761149332/this.me-removebg-preview_2_j1eoiy.png',
      dark: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760758662/this.me-removebg-preview_fvyeda.png',
    },
    repo: '.me',
    kind: 'root',
  },
  {
    id: 'cleaker',
    title: 'cleaker',
    desc: 'Who am I, here.',
    url: 'https://neurons-me.github.io/Cleaker/',
    icon: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1765054949/cleaker.me_gusn1q.png',
    repo: 'cleaker',
    kind: 'root',
  },
  {
    id: 'monad',
    title: 'monad',
    desc: 'Federated runtime surfaces.',
    url: 'https://neurons-me.github.io/monad/',
    icon: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1778090977/monad.ai.profile-removebg-preview_np26yp.png',
    repo: 'monad',
    kind: 'root',
  },
  {
    id: 'gui',
    title: '.GUI',
    desc: 'Generative User Interface.',
    url: 'https://neurons-me.github.io/GUI/',
    icon: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760629119/this.gui.neurons.me_mkapde.png',
    repo: 'GUI',
    kind: 'root',
  },
  {
    id: 'netget',
    title: 'netget',
    desc: 'A Gateway to the Web. Routes http/https requests.',
    url: 'https://neurons-me.github.io/netget/',
    icon: {
      light: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1778254832/me.docs.axioms__1_-removebg-preview_xvdqof.png',
      dark: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1778177581/ChatGPT_Image_May_7_2026_12_12_28_PM_xzkwtc.png',
    },
    repo: 'netget',
    kind: 'root',
  },
  {
    id: 'all-this',
    title: 'All.This',
    desc: 'Across the neurons.me ecosystem.',
    url: 'https://github.com/neurons-me',
    icon: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1765903003/all.this_sr55ml.webp',
    repo: 'all.this',
    kind: 'root',
  },
  {
    id: 'npm-org',
    title: 'npm',
    desc: 'All packages published under suiGn / neurons.me',
    url: 'https://www.npmjs.com/org/neurons-me',
    icon: 'https://static.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png',
    repo: null,
    kind: 'source',
  },
  {
    id: 'github-org',
    title: 'GitHub',
    desc: 'Open source repositories.',
    url: 'https://github.com/neurons-me',
    icon: {
      light: 'https://cdn.simpleicons.org/github/0f1720',
      dark: 'https://cdn.simpleicons.org/github/ffffff',
    },
    repo: null,
    kind: 'source',
  },
  {
    id: 'neurons-me-network',
    title: 'neurons.me',
    desc: 'The live network. Run a monad. Claim your namespace.',
    url: 'https://neurons.me',
    icon: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760629040/media.neurons.me_copy_tgilfg.png',
    iconPlate: true,
    repo: null,
    kind: 'source',
  },
  {
    id: 'nrp',
    title: 'NRP: Namespace Resolution Protocol',
    desc: 'How a me:// path resolves to a monad, hop by hop, across the mesh.',
    url: 'https://neurons-me.github.io/NRP.html',
    icon: '🛰️',
    repo: null,
    kind: 'doc',
  },
  {
    id: 'me-primitives',
    title: 'Primitives',
    desc: 'The irreducible vocabulary of .me — the symbols you actually type.',
    url: 'https://neurons-me.github.io/.me/docs/Primitives.html',
    icon: '𓂀',
    repo: '.me',
    kind: 'doc',
  },
  {
    id: 'me-axioms',
    title: 'Axioms',
    desc: 'The invariants the kernel guarantees, with runtime proof.',
    url: 'https://neurons-me.github.io/.me/docs/Axioms.html',
    icon: '𓋹',
    repo: '.me',
    kind: 'doc',
  },
  {
    id: 'me-architecture',
    title: 'What is O(k)?',
    desc: 'Infinite Proxy Chaining with inline Path Algebra — one write recomputes only the k nodes that depend on it.',
    url: 'https://neurons-me.github.io/.me/docs/Architecture.html',
    icon: '🏗️',
    repo: '.me',
    kind: 'doc',
  },
  {
    id: 'me-npm',
    title: 'npm: this.me',
    desc: 'Install: npm install this.me',
    url: 'https://www.npmjs.com/package/this.me',
    icon: '📦',
    repo: '.me',
    kind: 'source',
  },
];

const meta: Meta<typeof SearchBar> = {
  title: 'Pieces/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  args: {
    items: mockItems,
    placeholder: 'Search in All.This',
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  name: 'Default (mock items)',
};

export const Empty: Story = {
  name: 'No Query',
  args: {
    items: mockItems,
  },
};

export const PreloadedQuery: Story = {
  name: 'Preloaded results via onSelect',
  args: {
    onSelect: (item) => {
      // eslint-disable-next-line no-alert
      alert(`Selected: ${item.title}`);
    },
  },
};

export const FromRemoteIndex: Story = {
  name: 'Fetched from live index.json',
  args: {
    items: undefined,
    src: 'https://neurons-me.github.io/index.json',
  },
};

// The quick-access grid as the neurons.me home uses it: square tiles, the theme's colors, and each entry's `tile`
// telling how it draws -- a wordmark painted in the accent color inside an accent frame (netget), a QR with a
// muted name (cleaker), a wide picture across the tile (All.This). No page CSS: all of it is SearchBar + data.
const NG = 'https://neurons-me.github.io/assets';
const compactItems: JsonSearchItem[] = [
  { id: 'me', title: '.me', url: 'https://neurons-me.github.io/.me/', kind: 'root', icon: { light: '', dark: '', monad: { variant: 'identity', kind: 'me', seed: 'jabellae' } } },
  { id: 'cleaker', title: 'cleaker', url: 'https://neurons-me.github.io/Cleaker/', kind: 'root',
    icon: { light: `${NG}/cleaker-qr-on-light.png`, dark: `${NG}/cleaker-qr-on-dark.png` }, tile: { label: 'muted' } },
  { id: 'monad', title: 'monad', url: 'https://neurons-me.github.io/monad/', kind: 'root', icon: { light: '', dark: '', monad: { variant: 'bubble', kind: 'monad', texture: 'matte' } } },
  { id: 'gui', title: '.GUI', url: 'https://neurons-me.github.io/GUI/', kind: 'root', icon: 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760629119/this.gui.neurons.me_mkapde.png' },
  { id: 'netget', title: 'netget', url: 'https://neurons-me.github.io/netget/', kind: 'root',
    icon: { light: `${NG}/netget-letters-on-light.svg`, dark: `${NG}/netget-letters-on-dark.svg` },
    tile: { width: 55, hideLabel: true, frame: true, tint: true } },
  { id: 'all-this', title: 'All.This', url: 'https://github.com/neurons-me', kind: 'root',
    icon: { light: `${NG}/all-this-on-light.svg`, dark: `${NG}/all-this-on-dark.svg` } },
  { id: 'npm', title: 'npm', url: 'https://www.npmjs.com/org/neurons.me', kind: 'source', icon: 'https://cdn.simpleicons.org/npm/CB3837' },
  { id: 'github', title: 'GitHub', url: 'https://github.com/neurons-me', kind: 'source', icon: { light: 'https://cdn.simpleicons.org/github/0f1720', dark: 'https://cdn.simpleicons.org/github/ffffff' } },
  { id: 'nrp', title: 'Namespaces', url: 'https://neurons-me.github.io/NRP/', kind: 'root', icon: '𓆣' },
];

export const CompactThemed: Story = {
  name: 'Compact grid, theme colors',
  args: {
    items: compactItems,
    density: 'compact',
    colors: 'theme',
  },
  render: (args) => (
    <div style={{ width: 280, paddingBottom: 380 }}>
      <SearchBar {...args} />
    </div>
  ),
};
