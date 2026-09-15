// src/themes/catalog/MdrnChurch/manifest.ts
import type { ThemeManifest } from '@/types/theme';
import badgeImage from './mdrn_church.png?url';
import lightTokens from './light.tokens';
import darkTokens from './dark.tokens';

const mdrnChurchManifest: ThemeManifest = {
  themeId: 'mdrn.church',
  themeName: 'MdrnChurch',
  description: 'Editorial-liturgical theme based on la_iglesia_moderna main.css.',
  author: 'suiGn',
  version: '1.0.0',
  license: 'MIT',
  homepage: 'https://neurons.me/',
  tags: ['official', 'editorial', 'ritual'],
  createdAt: '2026-03-07T00:00:00.000Z',
  updatedAt: '2026-03-07T00:00:00.000Z',
  badgeUrl: badgeImage,
  mode: {
    light: lightTokens,
    dark: darkTokens,
  },
  defaultMode: 'light'
};

export default mdrnChurchManifest;
