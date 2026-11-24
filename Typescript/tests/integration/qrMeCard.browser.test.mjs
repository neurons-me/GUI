// The shared QR.me panel: IdentityTree pages with "…" inside [data-cleaker-panel],
// and Sign out is the logout icon under the gear (not a button in the card).
//
//   node tests/integration/qrMeCard.browser.test.mjs          (from Typescript/)
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const FORBIDDEN = new Set([80, 443, 3000, 5320]);

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

async function safePort() {
  for (let i = 0; i < 8; i += 1) {
    const port = await freePort();
    if (!FORBIDDEN.has(port)) return port;
  }
  throw new Error('could not get a disposable port');
}

async function startHarness() {
  const port = await safePort();
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* gone */ } };
  process.on('exit', stop);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i += 1) {
    try { const r = await fetch(`${origin}/qrMeCard.html`); if (r.ok) return { origin, stop }; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  stop();
  throw new Error('QR.me card harness did not come up');
}

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

async function main() {
  const harness = await startHarness();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  try {
    await page.goto(`${harness.origin}/qrMeCard.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-cleaker-panel]', { timeout: 15000 });
    await page.waitForSelector('[data-gui-component="IdentityTree"]', { timeout: 15000 });

    const logout = page.getByRole('button', { name: 'Sign out' });
    check('panel shows the logout icon (aria-label Sign out)', await logout.count() === 1);
    const logoutInCard = await page.locator('[data-me-login]').getByRole('button', { name: 'Sign out' }).count();
    check('Sign out is not a button inside the card body', logoutInCard === 0);
    const underGear = await page.evaluate(() => {
      const panel = document.querySelector('[data-cleaker-panel]');
      const gear = panel?.querySelector('[aria-label="QR settings"], [title="QR settings"]');
      const out = panel?.querySelector('[aria-label="Sign out"]');
      if (!gear || !out) return { ok: false, reason: 'missing gear or logout' };
      const g = gear.getBoundingClientRect();
      const o = out.getBoundingClientRect();
      return { ok: o.top >= g.bottom - 1 && Math.abs(o.left - g.left) < 40, gearTop: g.top, outTop: o.top };
    });
    check('logout icon sits under the gear', Boolean(underGear.ok), JSON.stringify(underGear));

    const more = page.locator('[data-gui-component="IdentityTree"] [data-gui-node-id$=".more"], [data-gui-component="IdentityTree"] [data-gui-node-id*=".more"]');
    await more.first().waitFor({ timeout: 10000 }).catch(() => {});
    const moreCount = await more.count();
    check('tree inside the panel pages with a "…" control', moreCount >= 1, `more=${moreCount}`);

    if (moreCount >= 1) {
      await more.first().click();
      const less = page.getByRole('button', { name: /Show less/i });
      // May need another click if one block is not enough to show everything.
      for (let i = 0; i < 6 && await less.count() === 0; i += 1) {
        if (await more.count()) await more.first().click();
        else break;
      }
      check('after unfolding, Show less is available', await less.count() >= 1);
    }
  } catch (e) {
    failed += 1;
    console.log(`FAIL  harness run  — ${e && e.stack ? e.stack : e}`);
  } finally {
    await browser.close();
    harness.stop();
  }
  console.log(failed ? `\n${failed} failed` : '\nno failures');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
