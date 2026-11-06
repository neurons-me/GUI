// this.gui as an independent app consumes it: from its packed tarball, in a clean Vite app with no aliases, no dedupe and
// no link to this repository (tests/consumer/app, copied to a temporary directory).
//
//   npm run build && npm run test:consumer            packs dist/ (npm pack) and checks that
//   node tests/consumer/check.mjs <this.gui-x.y.z.tgz>   checks a given tarball
//
// It checks:
// - types: every public entry resolves and is a REAL type (src/types-check.ts: under skipLibCheck an unresolvable
//   declaration silently becomes `any`, so each export is asserted not to be);
// - the production build (vite build, sourcemaps) holds ONE copy of React, React Router, MUI and Emotion;
// - that build, served (vite preview) in a real browser: every public subpath loads, this.gui/style.css applies, GUI's
//   mode toggle changes the APP's own MUI theme (one ThemeContext), GUI's Link navigates in the APP's router and Back
//   returns (one router context), no page error. Everything outside the preview server is stopped.
// The consumer installs its dependencies from the npm registry; nothing it does reaches any other service.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const PORT = Number(process.env.CONSUMER_PORT || 5195);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SHARED = ['react', 'react-dom', 'react-router', 'react-router-dom', '@mui/material', '@mui/system', '@mui/styled-engine', '@mui/utils', '@mui/private-theming', '@emotion/react', '@emotion/styled', '@emotion/cache'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, name, info = '') => { if (!ok) failed += 1; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ` — ${info}` : ''}`); };
const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, BROWSER: 'none' } });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}` };
};

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'gui-consumer-'));
let tarball = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!tarball) {
  if (!fs.existsSync(path.join(root, 'dist', 'this.gui.es.js'))) { console.error('dist/ is not built: npm run build first'); process.exit(1); }
  const packed = run('npm', ['pack', '--pack-destination', work, '--json'], root);
  if (!packed.ok) { console.error(packed.out); process.exit(1); }
  tarball = path.join(work, JSON.parse(packed.out.slice(packed.out.indexOf('[')))[0].filename);
}
console.log(`tarball ${tarball}\nconsumer ${work}/app\n`);

const app = path.join(work, 'app');
fs.cpSync(path.join(here, 'app'), app, { recursive: true });
const pkgFile = path.join(app, 'package.json');
fs.writeFileSync(pkgFile, fs.readFileSync(pkgFile, 'utf8').replace('__TARBALL__', `file:${tarball}`));

const install = run('npm', ['install', '--no-audit', '--no-fund'], app);
report(install.ok, 'the tarball installs in a clean app', install.ok ? '' : install.out.split('\n').slice(-5).join(' '));
if (!install.ok) process.exit(1);

const types = run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], app);
report(types.ok, 'types: every public entry resolves to a real type', types.ok ? '' : types.out.split('\n').filter(Boolean).slice(0, 4).join(' | '));

const build = run('npx', ['vite', 'build'], app);
report(build.ok, 'the app builds for production', build.ok ? '' : build.out.split('\n').slice(-5).join(' '));

// One copy of each shared package in the bundle, read from its sourcemaps.
const assets = path.join(app, 'dist', 'assets');
const roots = {};
for (const f of fs.readdirSync(assets).filter((f) => f.endsWith('.map'))) {
  const map = JSON.parse(fs.readFileSync(path.join(assets, f), 'utf8'));
  for (const src of map.sources) {
    const m = path.resolve(assets, map.sourceRoot || '', src).match(/^(.*\/node_modules\/(@[^/]+\/[^/]+|[^/@][^/]*))\//);
    if (m && SHARED.includes(m[2])) (roots[m[2]] ??= new Set()).add(m[1]);
  }
}
const dup = Object.entries(roots).filter(([, s]) => s.size > 1);
report(dup.length === 0 && ['react', 'react-router', '@mui/material', '@mui/system', '@emotion/react'].every((k) => roots[k]),
  'one copy each of React, Router, MUI, Emotion in the bundle',
  dup.length ? dup.map(([k, s]) => `${k}: ${[...s].join(' + ')}`).join('; ') : `${Object.keys(roots).length} packages, one root each`);

// The production build, in a browser.
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: app, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
server.stdout.on('data', (d) => (log += d));
server.stderr.on('data', (d) => (log += d));
const browser = await chromium.launch();
try {
  for (let i = 0; i < 60 && !log.includes('Local:'); i++) await wait(300);
  const context = await browser.newContext();
  const outside = [];
  await context.routeWebSocket(() => true, (ws) => { outside.push(`WS ${ws.url()}`); ws.close(); });
  const page = await context.newPage();
  await page.route('**/*', (r) => (r.request().url().startsWith(ORIGIN) ? r.continue() : (outside.push(r.request().url()), r.abort())));
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().split('\n')[0]); });
  await page.goto(`${ORIGIN}/`);
  await wait(2500);

  const subpaths = await page.evaluate(() => window.__subpaths);
  const bad = Object.entries(subpaths).filter(([, v]) => typeof v !== 'number' || v === 0);
  report(bad.length === 0, 'every public subpath loads and exports something', bad.length ? JSON.stringify(bad) : Object.entries(subpaths).map(([k, v]) => `${k}:${v}`).join(' '));

  const css = await page.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.cssText.includes('Material Symbols')); } catch { return false; } }));
  report(css, 'this.gui/style.css applies (Material Symbols @font-face)');

  const paper = () => page.evaluate(() => { const el = document.querySelector('[data-testid=app-paper]'); return [el.getAttribute('data-mode'), getComputedStyle(el).backgroundColor]; });
  const before = await paper();
  await page.click('button[aria-label="toggle theme mode"]'); await wait(600);
  const after = await paper();
  await page.click('button[aria-label="toggle theme mode"]'); await wait(600);
  const restored = await paper();
  report(before[0] !== after[0] && before[1] !== after[1] && restored.join() === before.join(),
    "GUI's mode toggle changes the app's own MUI theme (one ThemeContext), and back", `${before.join(' ')} -> ${after.join(' ')} -> ${restored.join(' ')}`);

  await page.evaluate(() => { window.__nav = 'kept'; });
  await page.click('[data-testid=gui-link]'); await wait(800);
  const atB = await page.evaluate(() => [location.pathname, document.querySelector('[data-testid=page]')?.textContent, window.__nav]);
  await page.goBack(); await wait(800);
  const atA = await page.evaluate(() => [location.pathname, document.querySelector('[data-testid=page]')?.textContent, window.__nav]);
  report(atB.join() === '/b,page B,kept' && atA.join() === '/,page A,kept',
    "GUI's Link navigates in the app's router (one router context), Back returns, no reload", `${atB.join(' ')} | ${atA.join(' ')}`);

  report(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));
  report(outside.length === 0, 'nothing requested outside the app', outside.slice(0, 3).join(', '));
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `\n${failed} failed` : '\nno failures');
process.exit(failed ? 1 : 0);
