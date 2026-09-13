/// <reference types="vitest/config" />
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { resolve } from 'path';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const cleakerSourceEntry = resolve(dirname, '../../../modules/cleaker/Typescript/src/index.ts');
const meSourceEntry = resolve(dirname, '../../../me/Typescript/dist/me.es.js');
// Only use monorepo aliases when the local paths actually exist (local dev).
// In CI, fall back to the published npm packages.
const useMonorepoAliases = fs.existsSync(meSourceEntry) && fs.existsSync(cleakerSourceEntry);
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const isDemo = process.env.DEMO === 'true';
const lifecycle = process.env.npm_lifecycle_event || '';
const argv = process.argv.join(' ');
const isStorybook =
  process.env.STORYBOOK === 'true' ||
  process.env.SB === 'true' ||
  lifecycle.includes('storybook') ||
  argv.includes('storybook');
const isUMD = process.env.UMD === 'true';
const umdTarget = process.env.UMD_TARGET || 'core'; // 'core' | 'bootstrap' | 'searchbar'
const isSearchbarUMD = isUMD && umdTarget === 'searchbar';
const isDev = !isUMD && !isStorybook && !isDemo && process.env.NODE_ENV !== 'test';
export default defineConfig({
  plugins: [
    ...(isStorybook ? [] : [mdx({ include: ['**/*.mdx', '**/*.md'] })]),
    // Use the automatic JSX runtime so components don't need `import React`.
    // Storybook renders source TSX directly, so forcing the classic runtime causes
    // `ReferenceError: React is not defined` in any component that only imports hooks.
    react({ jsxRuntime: 'automatic' }),
    // demo/ has more than one HTML entry (index.html, claimFlow.html) --
    // Vite's dev-server SPA fallback only ever serves index.html for an
    // unmatched path, which breaks claimFlow.main.tsx's own client-side
    // router (CleakerLanding's BrowserRouter expects to see e.g.
    // "/keychain/claim" in the URL it loaded from). Dev-only, demo-only:
    // any request that isn't a real file and isn't already index.html
    // falls back to claimFlow.html instead of Vite's own default.
    ...(isDemo ? [{
      name: 'demo-claim-flow-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return next();
          const url = req.url || '';
          // Stands in for the REAL topology's shared backend: netget's
          // own /main-server-namespace, reachable same-origin from
          // wherever Cleaker is served because nginx's admin block
          // routes every configured hostname to the one Express app.
          // This demo has no such shared process -- two separate Vite
          // instances on two ports -- so CleakerNetgetClaimView's
          // returnTo-allowlist fetch needs a same-origin stand-in here,
          // pointed at whichever port this run's "netget role" is on.
          if (url.startsWith('/main-server-namespace')) {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({
              namespace: 'local.cleaker',
              mainServerName: process.env.DEMO_NETGET_ORIGIN || 'http://127.0.0.1:5173',
            }));
            return;
          }
          // gatewaySetupSession.ts's real, production ALLOWED_CLAIM_RETURN_PATHS
          // only ever allows "/" -- GatewaySetup's one real mount point.
          // This demo instance IS the netget role when DEMO_ROLE=netget is
          // set (the netget-role vite instance in the two-port harness),
          // so its own "/" must serve claimFlow.html too, matching that
          // real constraint, instead of falling through to index.html
          // (the unrelated older keychain-only demo).
          if (url === '/' && process.env.DEMO_ROLE === 'netget') {
            req.url = '/claimFlow.html?role=netget';
            return next();
          }
          // cleakerHome.main.tsx composes the real CleakerLanding (its own
          // nested <Routes> for "/", "/users", "/blockchain", "/keychain",
          // ...) plus "/netget", "/netget/apps", "/netget/apps/:appId" and
          // "/netget/apps/:appId/pages/:pageId" for administering mounted
          // apps and editing their pages. CleakerLanding's internal route
          // matching needs the browser's ACTUAL pathname to be exactly "/"
          // (and the others exactly themselves) — same reasoning as
          // claimFlow's own fallback above, just a different route set.
          // "/netget/apps/*" is prefix-matched (not a fixed list) because
          // appId/pageId are real route params now, not a hardcoded pair.
          // Gated behind DEMO_ROLE=cleakerHome so it never shadows "/" for
          // the other demos (index.html, claimFlow.html) sharing this same
          // dev server.
          if (process.env.DEMO_ROLE === 'cleakerHome') {
            const cleakerHomeExactPaths = ['/', '/users', '/blockchain', '/keychain', '/keychain/claim', '/keychain/admin-sign', '/netget', '/netget/logs', '/netget/apps'];
            const pathOnly = url.split('?')[0];
            if (cleakerHomeExactPaths.includes(pathOnly) || pathOnly.startsWith('/netget/apps/')) {
              const queryIndex = url.indexOf('?');
              req.url = queryIndex === -1 ? '/cleakerHome.html' : `/cleakerHome.html${url.slice(queryIndex)}`;
              return next();
            }
          }
          // Disposable stand-in for netget's real mesh registry endpoint
          // (GET /apps in modules/netget/Typescript/.../backend/routes/
          // localNetget.js, backed by apps.json + readReportedApps() in
          // src/runtime/appRegistry.ts). This demo runs no netget backend
          // process of its own, so "/netget/apps" has nothing real to read
          // from unless something serves that same shape here — this
          // middleware mirrors readReportedApps()'s exact reduction
          // (lastSeenMs/ttlMs -> alive) against a disposable, file-backed
          // apps.json seeded once with this pilot's one real app ("gui",
          // pointed at the disposable monad this harness already runs).
          // It is NOT wired to a live heartbeat (this harness's monad
          // never calls /apps/report) — the entry is seeded, not reported
          // — that gap is called out explicitly in cleakerHome.main.tsx's
          // own top comment and is real future work, not hidden here.
          if (process.env.DEMO_ROLE === 'cleakerHome' && url.startsWith('/api/netget/apps')) {
            const registryDir = path.join(os.tmpdir(), 'gui-catalog-harness-netget-data', 'runtime');
            const registryPath = path.join(registryDir, 'apps.json');
            if (!fs.existsSync(registryPath)) {
              fs.mkdirSync(registryDir, { recursive: true });
              const seeded = {
                version: 1,
                updatedAt: new Date().toISOString(),
                apps: {
                  gui: {
                    id: 'gui',
                    name: 'gui',
                    host: '127.0.0.1',
                    port: 8162,
                    lastSeenMs: Date.now(),
                    ttlMs: 45_000,
                    trust: 'owner',
                    frontendMode: 'dev',
                    localOnly: true,
                    metadata: {
                      monadName: 'gui-catalog-harness-dev',
                      namespace: 'gui-catalog-harness.local',
                      endpoint: 'http://127.0.0.1:8162',
                    },
                    tags: ['pilot', 'disposable'],
                  },
                },
              };
              fs.writeFileSync(registryPath, JSON.stringify(seeded, null, 2));
            }
            let registry = { apps: {}, updatedAt: null };
            try {
              registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
            } catch { /* treat unreadable registry as empty, same as readReportedApps() */ }
            const now = Date.now();
            const apps = Object.values(registry.apps || {}).map((app) => {
              const lastSeenMs = Number(app.lastSeenMs || 0);
              const ttlMs = Number(app.ttlMs || 45_000);
              return { ...app, alive: lastSeenMs > 0 && now - lastSeenMs <= ttlMs };
            }).sort((a, b) => a.name.localeCompare(b.name));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ apps, count: apps.length, updatedAt: registry.updatedAt }));
            return;
          }
          if (url === '/' || url.startsWith('/index.html') || url.startsWith('/claimFlow.html')) return next();
          if (url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/')) return next();
          if (/\.[a-zA-Z0-9]+(\?|$)/.test(url)) return next(); // has a file extension -> a real asset request
          const queryIndex = url.indexOf('?');
          req.url = queryIndex === -1 ? '/claimFlow.html' : `/claimFlow.html${url.slice(queryIndex)}`;
          next();
        });
      },
    }] : []),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    __GUI_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: [
      { find: /^@\/gui\/Atoms$/, replacement: resolve(dirname, 'src/gui/Atoms/atoms.ts') },
      { find: /^@\/gui\/Atoms\//, replacement: `${resolve(dirname, 'src/gui/Atoms')}/` },
      { find: /^@\/gui\/atoms$/, replacement: resolve(dirname, 'src/gui/Atoms/atoms.ts') },
      { find: /^@\/gui\/atoms\//, replacement: `${resolve(dirname, 'src/gui/Atoms')}/` },
      { find: /^@\/gui\/Molecules$/, replacement: resolve(dirname, 'src/gui/Molecules/molecules.ts') },
      { find: /^@\/gui\/Molecules\//, replacement: `${resolve(dirname, 'src/gui/Molecules')}/` },
      { find: /^@\/gui\/molecules$/, replacement: resolve(dirname, 'src/gui/Molecules/molecules.ts') },
      { find: /^@\/gui\/molecules\//, replacement: `${resolve(dirname, 'src/gui/Molecules')}/` },
      { find: /^@\/gui\/Compounds$/, replacement: resolve(dirname, 'src/gui/Compounds/compounds.ts') },
      { find: /^@\/gui\/Compounds\//, replacement: `${resolve(dirname, 'src/gui/Compounds')}/` },
      { find: /^@\/gui\/compounds$/, replacement: resolve(dirname, 'src/gui/Compounds/compounds.ts') },
      { find: /^@\/gui\/compounds\//, replacement: `${resolve(dirname, 'src/gui/Compounds')}/` },
      { find: /^@\/gui\/Marketplace$/, replacement: resolve(dirname, 'src/gui/Marketplace/marketplace.ts') },
      { find: /^@\/gui\/Marketplace\//, replacement: `${resolve(dirname, 'src/gui/Marketplace')}/` },
      { find: /^@\/gui\/marketplace$/, replacement: resolve(dirname, 'src/gui/Marketplace/marketplace.ts') },
      { find: /^@\/gui\/marketplace\//, replacement: `${resolve(dirname, 'src/gui/Marketplace')}/` },
      { find: /^@\/gui\/Hooks$/, replacement: resolve(dirname, 'src/gui-internals/Hooks/index.ts') },
      { find: /^@\/gui\/Hooks\//, replacement: `${resolve(dirname, 'src/gui-internals/Hooks')}/` },
      { find: /^@\/gui\/hooks$/, replacement: resolve(dirname, 'src/gui-internals/Hooks/index.ts') },
      { find: /^@\/gui\/hooks\//, replacement: `${resolve(dirname, 'src/gui-internals/Hooks')}/` },
      { find: /^@\/gui\/Contexts$/, replacement: resolve(dirname, 'src/gui-internals/Contexts/index.ts') },
      { find: /^@\/gui\/Contexts\//, replacement: `${resolve(dirname, 'src/gui-internals/Contexts')}/` },
      { find: /^@\/gui\/contexts$/, replacement: resolve(dirname, 'src/gui-internals/Contexts/index.ts') },
      { find: /^@\/gui\/contexts\//, replacement: `${resolve(dirname, 'src/gui-internals/Contexts')}/` },
      { find: /^@\/gui\/components$/, replacement: resolve(dirname, 'src/gui/Compounds/compounds.ts') },
      { find: /^@\/gui\/components\//, replacement: `${resolve(dirname, 'src/gui/Compounds')}/` },
      ...(useMonorepoAliases ? [
        { find: /^cleaker$/, replacement: cleakerSourceEntry },
        { find: /^this\.me$/, replacement: meSourceEntry },
      ] : []),
      { find: '@', replacement: resolve(dirname, 'src') },
    ],
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom']
  },
  build: isDemo ? undefined : {
    emptyOutDir: !isUMD,
    lib: isUMD
      ? {
          // UMD builds must be single-entry.
          // We support two targets via env:
          //   UMD_TARGET=core      -> dist/this.gui.umd.js
          //   UMD_TARGET=bootstrap -> dist/this.gui.bootstrap.umd.js
          //   UMD_TARGET=searchbar -> dist/gui-searchbar.iife.js
          entry:
            umdTarget === 'bootstrap'
              ? resolve(dirname, 'src/runtime/bootstrap-umd.ts')
              : umdTarget === 'searchbar'
                ? resolve(dirname, 'src/runtime/searchbar-standalone.tsx')
              : resolve(dirname, 'index.ts'),
          name: umdTarget === 'searchbar' ? 'GUISearchBar' : 'GUI',
          fileName: (format) => {
            if (umdTarget === 'searchbar') return 'gui-searchbar.iife.js';
            if (format === 'umd') {
              return umdTarget === 'bootstrap' ? 'this.gui.bootstrap.umd.js' : 'this.gui.umd.js';
            }
            if (format === 'iife') {
              return umdTarget === 'bootstrap' ? 'this.gui.bootstrap.iife.js' : 'this.gui.iife.js';
            }
            return umdTarget === 'bootstrap'
              ? `this.gui.bootstrap.${format}.js`
              : `this.gui.${format}.js`;
          },
          formats: umdTarget === 'searchbar' ? ['iife'] : ['umd'],
        }
      : {
          entry: {
            index: resolve(dirname, 'index.ts'),
            legacy: resolve(dirname, 'src/legacy/index.tsx'),
            runtime: resolve(dirname, 'src/runtime-entry.ts'),
            react: resolve(dirname, 'src/react-entry.ts'),
            devtools: resolve(dirname, 'src/devtools-entry.ts'),
            cleaker: resolve(dirname, 'src/cleaker-entry.ts'),
            atoms: resolve(dirname, 'src/gui/Atoms/atoms.ts'),
            molecules: resolve(dirname, 'src/gui/Molecules/molecules.ts'),
            compounds: resolve(dirname, 'src/gui/Compounds/compounds.ts'),
            components: resolve(dirname, 'src/gui/Compounds/compounds.ts'), //deprecated
          },
          name: 'GUI',
          fileName: (format, entryName) => {
            // IMPORTANT: These filenames must match package.json "main/module/exports".
            // Root entry
            if (entryName === 'index') {
              if (format === 'es') return 'this.gui.es.js';
              if (format === 'cjs') return 'this.gui.cjs';
              return `this.gui.${format}.js`;
            }

            // Subpath entries
            if (entryName === 'atoms') {
              if (format === 'es') return 'atoms/index.js';
              if (format === 'cjs') return 'atoms/index.cjs';
              return `atoms/index.${format}.js`;
            }
            if (entryName === 'legacy') {
              if (format === 'es') return 'legacy/index.js';
              if (format === 'cjs') return 'legacy/index.cjs';
              return `legacy/index.${format}.js`;
            }
            if (entryName === 'runtime') {
              if (format === 'es') return 'runtime/index.js';
              if (format === 'cjs') return 'runtime/index.cjs';
              return `runtime/index.${format}.js`;
            }
            if (entryName === 'react') {
              if (format === 'es') return 'react/index.js';
              if (format === 'cjs') return 'react/index.cjs';
              return `react/index.${format}.js`;
            }
            if (entryName === 'cleaker') {
              if (format === 'es') return 'cleaker/index.js';
              if (format === 'cjs') return 'cleaker/index.cjs';
              return `cleaker/index.${format}.js`;
            }
            if (entryName === 'devtools') {
              if (format === 'es') return 'devtools/index.js';
              if (format === 'cjs') return 'devtools/index.cjs';
              return `devtools/index.${format}.js`;
            }
            if (entryName === 'molecules') {
              if (format === 'es') return 'molecules/index.js';
              if (format === 'cjs') return 'molecules/index.cjs';
              return `molecules/index.${format}.js`;
            }
            if (entryName === 'compounds') {
              if (format === 'es') return 'compounds/index.js';
              if (format === 'cjs') return 'compounds/index.cjs';
              return `compounds/index.${format}.js`;
            }
            if (entryName === 'components') {
              if (format === 'es') return 'components/index.js';
              if (format === 'cjs') return 'components/index.cjs';
              return `components/index.${format}.js`;
            }
            // Fallback for any future entrypoints
            if (format === 'cjs') return `${entryName}.cjs`;
            return `${entryName}.${format}.js`;
          },
          formats: ['es', 'cjs'],
        },
    rollupOptions: {
      external: (id) => {
        // IMPORTANT:
        // - Always keep React and ReactDOM external (peer deps) for both UMD and ESM/CJS.
        // - For UMD browser runtime, we BUNDLE router + JSX runtime so the UMD works
        //   without global shims like ReactJSXRuntime / ReactRouterDOM.

        const baseExternalIds = new Set([
          'fs',
          'path',
          'url',
          'child_process',
          'fs-extra',
        ]);

        if (!isSearchbarUMD) {
          baseExternalIds.add('react');
          baseExternalIds.add('react-dom');
          baseExternalIds.add('react-dom/client');
        }

        // In non-UMD builds, keep these as externals (peer deps / helpers).
        if (!isUMD) {
          baseExternalIds.add('react-router');
          baseExternalIds.add('react-router-dom');
          baseExternalIds.add('react/jsx-runtime');
          baseExternalIds.add('react/jsx-dev-runtime');
        }

        // In UMD, ensure JSX runtime is bundled (no global ReactJSXRuntime requirement).
        if (isUMD && (id === 'react/jsx-runtime' || id === 'react/jsx-dev-runtime')) {
          return false;
        }

        // @mui/material and @mui/system as peer deps (non-UMD only — UMD stays
        // self-contained, same reasoning as router/JSX runtime above). Without
        // this, this.gui bundles its OWN internal copy of MUI, and any
        // consuming app's OWN @mui/material usage (a different module
        // instance, with its own separate ThemeContext object) never sees
        // values from this.gui's <Theme> — confirmed by testing: raw MUI
        // components (Dialog, Table, Select) in a consuming app rendered with
        // literal unmodified MUI defaults (#fff background, rgba(0,0,0,.87)
        // text) regardless of the app's actual dark theme, because
        // useTheme() was reading a completely different Context. Matched by
        // prefix, not exact id, since MUI is imported via deep subpaths
        // throughout this codebase (e.g. '@mui/material/Box').
        if (!isUMD && (
          id === '@mui/material' || id.startsWith('@mui/material/') ||
          id === '@mui/system' || id.startsWith('@mui/system/')
        )) {
          return true;
        }

        return baseExternalIds.has(id);
      },
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOM',
          'react-router': 'ReactRouter',
          'react-router-dom': 'ReactRouterDOM',
        },
        exports: 'named',
        // Force CSS bundle to have a stable filename for consumers.
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'styles.css';
          return 'assets/[name].[ext]';
        },
        banner: `;(function(){
          try {
            var g = (typeof globalThis !== 'undefined') ? globalThis : (typeof window !== 'undefined' ? window : this);
            if (!g.process) g.process = { env: {} };
            if (!g.process.env) g.process.env = {};
            if (!g.process.env.NODE_ENV) g.process.env.NODE_ENV = 'production';

            // Fallback: if a consumer accidentally externalizes jsx-runtime, provide a minimal shim
            // so UMD can still execute (it maps jsx/jsxs to React.createElement).
            if (!g.ReactJSXRuntime && g.React && typeof g.React.createElement === 'function') {
              g.ReactJSXRuntime = {
                jsx: g.React.createElement,
                jsxs: g.React.createElement,
                Fragment: g.React.Fragment,
              };
            }
          } catch (e) {}
        })();
        /* this.GUI — Neurons.me embeddable UI system */`,
      },
    },
  },
  optimizeDeps: isStorybook ? {} : {
    include: ['@uiw/react-md-editor', '@uiw/react-markdown-preview']
  },
  root: isDemo ? resolve(dirname, 'demo') : '.',
  publicDir: isDemo ? resolve(dirname, 'demo/public') : 'public',
  // Dev server: serve under /gui/ so the monad can proxy /gui/* to Vite.
  // The monad handles all API routes; Vite only handles GUI assets + HMR.
  base: isDev ? '/gui/' : '/',
  server: isDev ? {
    port: 5173,
    strictPort: true,
    // Allow the monad (any local host) to load assets from this dev server.
    cors: true,
    hmr: {
      // HMR websocket path stays under /gui/ so the monad can proxy it too.
      path: '/gui/__vite_hmr',
    },
  } : isDemo ? {
    open: true,
    // CleakerNetgetAdminSignView's /admin-session/challenge and
    // /admin-session/verify calls target `allowedReturnOrigin` --
    // which MUST equal returnTo's own origin (this vite instance, the
    // "netget role" page) for the returnToAuthorized check to pass, per
    // its real production assumption that netget's frontend and its own
    // backend are same-origin (true when proxy.js serves both; not true
    // in this harness, where logs-harness-server.mjs is a separate
    // process). Proxying just this one path through to DEMO_BACKEND_ORIGIN
    // makes that assumption hold here too, without changing the real
    // component. LogsView's OWN /logs and /main-server-namespace calls
    // are unaffected -- they go directly to the real backend origin via
    // its `endpoint` prop, cross-origin but CORS-enabled there already.
    // No-op unless DEMO_BACKEND_ORIGIN is set.
    ...(process.env.DEMO_BACKEND_ORIGIN ? {
      proxy: {
        '/admin-session': process.env.DEMO_BACKEND_ORIGIN,
      },
    } : {}),
  } : false,
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.js']
      }
    }]
  }
});

const CLI_DIST_PATH = resolve(dirname, 'dist/bin/cli.js');

async function ensureNodeShebang(filePath) {
  const contents = await fsp.readFile(filePath, 'utf8');
  const shebang = '#!/usr/bin/env node';
  const hasShebang = contents.startsWith(shebang);

  let normalized = contents.replace(/\r\n/g, '\n');
  if (hasShebang) {
    const lines = normalized.split('\n');
    let index = 0;
    while (lines[index] === shebang) index += 1;
    normalized = [shebang, ...lines.slice(index)].join('\n');
  } else {
    normalized = `${shebang}\n${normalized}`;
  }

  if (normalized !== contents) await fsp.writeFile(filePath, normalized, 'utf8');
}

// Post-process CLI after tsc build
async function buildCLI() {
  if (!fs.existsSync(CLI_DIST_PATH)) {
    throw new Error(
      `Could not find CLI entry at "${CLI_DIST_PATH}". ` +
        `Make sure "tsc --project tsconfig.cli.json" ran successfully.`,
    );
  }

  await ensureNodeShebang(CLI_DIST_PATH);

  // Ensure it's executable when packed/published.
  // (No-op on platforms where chmod is unsupported.)
  try {
    await fsp.chmod(CLI_DIST_PATH, 0o755);
  } catch {
    // ignore
  }
}

// Hook to run CLI build after Vite build
export async function buildFinished() {
  await buildCLI();
}
