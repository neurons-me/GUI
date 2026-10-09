import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const require = createRequire(import.meta.url);

function findStorybookPackageDir() {
  try {
    return path.dirname(require.resolve('storybook/package.json'));
  } catch {
    const nodePathEntries = String(process.env.NODE_PATH || '')
      .split(path.delimiter)
      .filter(Boolean);

    for (const entry of nodePathEntries) {
      const packageJson = path.join(entry, 'storybook', 'package.json');
      if (fs.existsSync(packageJson)) return path.dirname(packageJson);
    }
  }

  return null;
}

function appendAlias(currentAlias: any, find: string, replacement: string) {
  if (Array.isArray(currentAlias)) {
    return [...currentAlias, { find, replacement }];
  }

  return {
    ...(currentAlias || {}),
    [find]: replacement,
  };
}

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "staticDirs": [
    "../public"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-themes",
    "@storybook/addon-links",
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  viteFinal: async (viteConfig) => {
    // Storybook's preview iframe uses an internal router whose basename
    // defaults from Vite's `base`. Left unset, it defaults to "/", which
    // breaks the static build once it's deployed under a subpath (e.g.
    // /GUI/storybook/) — the router strips the .html extension and any
    // query string from the URL, silently losing the selected story id.
    viteConfig.base = './';
    viteConfig.plugins = viteConfig.plugins || [];
    viteConfig.plugins.push(tsconfigPaths());
    // The Audience Lab needs a this.me that exposes the audience algebra (ME.sealAudience / ME.openAudience). Until that is
    // in the .me this package resolves, point THIS_ME_SRC at a .me source that has it, e.g.
    //   THIS_ME_SRC=../../me-export-audience/Typescript/index.ts npm run storybook
    if (process.env.THIS_ME_SRC) {
      viteConfig.resolve = viteConfig.resolve || {};
      const target = path.resolve(process.cwd(), process.env.THIS_ME_SRC);
      const current = viteConfig.resolve.alias;
      viteConfig.resolve.alias = Array.isArray(current)
        ? [{ find: /^this\.me$/, replacement: target }, ...current]
        : [{ find: /^this\.me$/, replacement: target }, ...Object.entries(current || {}).map(([find, replacement]) => ({ find, replacement: String(replacement) }))];
    }
    const storybookPackageDir = findStorybookPackageDir();
    if (storybookPackageDir) {
      viteConfig.resolve = viteConfig.resolve || {};
      viteConfig.resolve.alias = appendAlias(
        viteConfig.resolve.alias,
        'storybook/internal/preview/runtime',
        path.join(storybookPackageDir, 'dist/preview/runtime.js'),
      );
    }
    return viteConfig;
  },
  docs: { defaultName: 'Docs' },
  
};
export default config;
