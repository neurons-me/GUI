// The address axis (src/runtime/addressAxis.ts), checked by the INK in a real browser (Playwright/Chromium).
//
// The address in the top bar (`<host>` while no .me answers, `me @ <host>` once one does) and the first lines of a GUI page under it start on one vertical line, and
// the page's first line sits ADDRESS_PAGE_TOP_PX under the top bar. Boxes can agree while the letters do not (each
// glyph carries its own side bearing, each font its own ascent), so this measures the drawn pixels: a screenshot of each
// line, scanned for the first column (and row) with ink. At device pixel ratio 1 and 2.
//
//   node tests/integration/addressAxis.browser.test.mjs          (from Typescript/)
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

// What the design says (addressAxis.ts) and how far the ink may stray from it.
const PAGE_TOP_PX = 13; // the glyph box (addressAxis.ts ADDRESS_PAGE_TOP_PX)
// The ink of the heading (`GUI / Themes`: the title's capitals) sits 2px under its glyph box: the air the eye sees is
// 15px. Kept as measured when the spacing was approved (2026-11-05); a font or size change moves it, and this says so.
const PAGE_TOP_INK_PX = 15;
const ALIGN_TOLERANCE_PX = 0.5;
// The face the ink values below were approved in (what macOS draws for the theme's `Roboto, sans-serif`: no Roboto is
// loaded). GuiPages.tsx's optical compensation for the trail was measured in it too.
const INK_APPROVED_FACE = {
  name: 'Helvetica (macOS)',
  // what the theme's `Roboto, sans-serif` draws at the heading's weight and size, measured where the spacing was tuned.
  // Width alone is not enough: Liberation Sans (Linux's stand-in) is built with Helvetica's widths; its ascent differs.
  font: '600 21px Roboto, sans-serif',
  sample: 'Layout Themes GUI',
  width: 197.203125,
  ascent: 15.50390625,
  fontAscent: 19,
  fontDescent: 5,
};
const TRAIL_INK_SHIFT_PX = 1;
const TOP_TOLERANCE_PX = 0.5;
const MEASURE_ONLY = process.argv.includes('--measure');

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

async function startHarness() {
  const port = await freePort();
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* already gone */ } };
  process.on('exit', stop);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i += 1) {
    try { const r = await fetch(`${origin}/addressAxis.html`); if (r.ok) return { origin, stop, pid: child.pid }; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  stop();
  throw new Error('harness server did not come up');
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

/** The text box of the first text node under `selector` (CSS px), or null. */
const textBox = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 3) });
  const node = walker.nextNode();
  if (!node) return null;
  const range = document.createRange();
  range.selectNodeContents(node);
  const b = range.getBoundingClientRect();
  return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, text: node.textContent.trim() };
}, selector);

/**
 * The first column and first row with ink inside `clip` (CSS px): a pixel counts as ink when it differs from the clip's
 * own background (its top-left corner) by more than `threshold` in any channel. Returned in CSS px, page coordinates.
 */
async function inkEdges(page, clip, dpr, threshold = 48) {
  const png = PNG.sync.read(await page.screenshot({ clip, animations: 'disabled' }));
  const at = (x, y) => { const i = (png.width * y + x) << 2; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
  const bg = at(0, 0);
  const isInk = (x, y) => { const p = at(x, y); return Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2])) > threshold; };
  let left = null; let top = null;
  for (let x = 0; x < png.width && left === null; x += 1) for (let y = 0; y < png.height; y += 1) if (isInk(x, y)) { left = x; break; }
  for (let y = 0; y < png.height && top === null; y += 1) for (let x = 0; x < png.width; x += 1) if (isInk(x, y)) { top = y; break; }
  return { left: left === null ? null : clip.x + left / dpr, top: top === null ? null : clip.y + top / dpr };
}

/** A clip around a text line, starting a little left of it (so the scan meets background first). */
const lineClip = (box, pad = 6) => ({ x: Math.max(0, box.left - pad), y: Math.max(0, box.top - 2), width: Math.min(60, box.right - box.left + pad), height: box.bottom - box.top + 4 });

async function measure(browser, harness, dpr) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: dpr, colorScheme: 'dark' });
  // Nothing answers for the namespace: its transport fails at once instead of waiting on a name that does not resolve.
  await context.route('http://axis.test/**', (route) => route.abort());
  const page = await context.newPage();
  await page.goto(`${harness.origin}/addressAxis.html?path=/GUI/layout`);
  await page.waitForSelector('[data-gui-node-id="GUI.window.layout.content.gui.layout.heading"]', { timeout: 15000 });
  // settled: the address shows the page's own host (nothing answers for a .me here), not the transient "resolviendo…"
  await page.waitForFunction(() => (document.querySelector('[data-gui-node-id="GUI.window.layout.bars.top.namespace"]')?.textContent || '').includes(location.host), null, { timeout: 15000 });
  await page.waitForTimeout(400);
  // The ink means something only in the font the spacing was approved with. The theme asks for `Roboto, sans-serif`
  // and loads no Roboto, so each machine draws its own sans-serif: Helvetica on the Mac where this was tuned
  // (2026-11-05), another face on CI's Linux. With another face the side bearings and the ascent differ, so there the
  // boxes (pure CSS, the same everywhere) are checked instead. Recognised by a fingerprint (width and vertical metrics of
  // a sample in the approved face), not by name: a Linux machine answers to "Helvetica" with another face, and document.fonts.check
  // answers true for a font the machine lacks.
  const face = await page.evaluate((fingerprint) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = fingerprint.font;
    const m = ctx.measureText(fingerprint.sample);
    return { width: m.width, ascent: m.actualBoundingBoxAscent, fontAscent: m.fontBoundingBoxAscent, fontDescent: m.fontBoundingBoxDescent };
  }, INK_APPROVED_FACE);
  const themeFont = ['width', 'ascent', 'fontAscent', 'fontDescent'].every((k) => Math.abs(face[k] - INK_APPROVED_FACE[k]) < 0.05);
  if (!themeFont) console.log(`      face drawn here: ${JSON.stringify(face)}`);
  const barBottom = await page.evaluate(() => document.querySelector('[data-gui-node-id="GUI.window.layout.bars.top"]').getBoundingClientRect().bottom);
  const address = await textBox(page, '[data-gui-node-id="GUI.window.layout.bars.top.namespace"]');
  const trail = await textBox(page, '[data-gui-node-id="GUI.window.layout.content.gui.layout.heading.trail"]');
  const title = await textBox(page, '[data-gui-node-id="GUI.window.layout.content.gui.layout.heading.title"]');
  const heading = await page.evaluate(() => { const b = document.querySelector('[data-gui-node-id="GUI.window.layout.content.gui.layout.heading"]').getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; });
  const ink = {
    address: await inkEdges(page, lineClip(address), dpr),
    trail: await inkEdges(page, lineClip(trail), dpr),
    title: await inkEdges(page, lineClip(title), dpr),
    // the whole heading line: its first ink row is the top of its tallest glyph (the title's capitals)
    heading: await inkEdges(page, { x: heading.left - 6, y: Math.max(0, heading.top - 6), width: heading.right - heading.left + 6, height: heading.bottom - heading.top + 8 }, dpr),
  };
  await context.close();
  return { barBottom, boxes: { address, trail, title, heading }, ink, themeFont };
}

async function main() {
  const harness = await startHarness();
  const browser = await chromium.launch();
  console.log(`harness ${harness.origin} (pid ${harness.pid})\n`);
  try {
    for (const dpr of [1, 2]) {
      const m = await measure(browser, harness, dpr);
      const f = (n) => (n === null ? '-' : n.toFixed(2));
      console.log(`dpr ${dpr}: ink left  address ${f(m.ink.address.left)}  trail ${f(m.ink.trail.left)}  title ${f(m.ink.title.left)}   |  box left  address ${f(m.boxes.address.left)}  trail ${f(m.boxes.trail.left)}  title ${f(m.boxes.title.left)}`);
      console.log(`dpr ${dpr}: heading ink top ${f(m.ink.heading.top)}  box top ${f(m.boxes.heading.top)}  bar bottom ${f(m.barBottom)}  -> ink air ${f(m.ink.heading.top - m.barBottom)}  box air ${f(m.boxes.heading.top - m.barBottom)}`);
      if (MEASURE_ONLY) continue;
      const air = m.boxes.heading.top - m.barBottom;
      check(`dpr ${dpr}: the heading's glyph box sits ${PAGE_TOP_PX}px under the top bar`, Math.abs(air - PAGE_TOP_PX) <= TOP_TOLERANCE_PX, `${air.toFixed(2)}px`);
      const sameLine = Math.abs((m.boxes.trail.bottom + m.boxes.trail.top) / 2 - (m.boxes.title.bottom + m.boxes.title.top) / 2) < 12;
      check(`dpr ${dpr}: the trail and the title are one line`, sameLine && m.boxes.title.left > m.boxes.trail.left, `trail ${m.boxes.trail.top.toFixed(1)}-${m.boxes.trail.bottom.toFixed(1)}, title ${m.boxes.title.top.toFixed(1)}-${m.boxes.title.bottom.toFixed(1)}`);
      if (m.themeFont) {
        const dAT = Math.abs(m.ink.address.left - m.ink.trail.left);
        check(`dpr ${dpr}: the page's first line starts on the address's line (ink)`, dAT <= ALIGN_TOLERANCE_PX, `|address - trail| = ${dAT.toFixed(2)}px (<= ${ALIGN_TOLERANCE_PX})`);
        const inkAir = m.ink.heading.top - m.barBottom;
        // ink is found row by row: it is known to a device pixel, so half of one is added to what it may stray
        const inkTolerance = TOP_TOLERANCE_PX + 0.5 / dpr;
        check(`dpr ${dpr}: its ink sits ${PAGE_TOP_INK_PX}px under the top bar`, Math.abs(inkAir - PAGE_TOP_INK_PX) <= inkTolerance, `${inkAir.toFixed(2)}px (± ${inkTolerance})`);
      } else {
        // In another face, the boxes: the trail's box sits TRAIL_INK_SHIFT_PX right of the address's (the optical
        // compensation measured in the approved face), so the axis itself is checked through them.
        const dBox = Math.abs(m.boxes.address.left - (m.boxes.trail.left - TRAIL_INK_SHIFT_PX));
        check(`dpr ${dpr}: the page's first line starts on the address's line (boxes; the approved face is not drawn here)`, dBox <= ALIGN_TOLERANCE_PX, `|address - (trail - ${TRAIL_INK_SHIFT_PX})| = ${dBox.toFixed(2)}px`);
        console.log(`      dpr ${dpr}: ink not compared: this machine draws another face than ${INK_APPROVED_FACE.name}`);
      }
      const onPixel = (x) => Math.abs(x * dpr - Math.round(x * dpr)) < 0.05;
      check(`dpr ${dpr}: the address starts on a device pixel`, onPixel(m.boxes.address.left), `box left ${m.boxes.address.left.toFixed(3)}`);
    }
  } finally {
    await browser.close();
    harness.stop();
  }
  if (MEASURE_ONLY) return;
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
