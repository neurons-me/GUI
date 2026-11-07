// Cleaker in a corner (level 1), in a real browser: src/gui/All.This/Cleaker/Corner/cleakerCorner.ts, mounted as an app
// imports it (demo/cleakerCorner.html, a deliberately hostile page) and as the one-line script (dist cleaker.js, built
// here into a temporary directory and served from a plain static page). cleaker.me is a fake (fakeMonads.mjs);
// everything else outside the test servers is stopped.
//
//   node tests/integration/cleakerCorner.browser.test.mjs          (from Typescript/)
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fakeMonad, routeMonads } from './fakeMonads.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

async function startDemo() {
  const port = await freePort();
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* gone */ } };
  process.on('exit', stop);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i += 1) {
    try { const r = await fetch(`${origin}/cleakerCorner.html`); if (r.ok) return { origin, stop }; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  stop();
  throw new Error('demo server did not come up');
}

/** Builds dist-style cleaker.js into a temp dir and serves it with one plain page that loads it in one line. */
async function startStandalone() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cleaker-js-'));
  const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', out, '--emptyOutDir'], {
    cwd: root, env: { ...process.env, UMD: 'true', UMD_TARGET: 'cleaker', BROWSER: 'none' }, encoding: 'utf8',
  });
  if (build.status !== 0) throw new Error(`cleaker.js build failed:\n${build.stdout}${build.stderr}`);
  const js = fs.readFileSync(path.join(out, 'cleaker.js'));
  const page = '<!doctype html><meta charset="utf-8"><title>plain page</title><p>A plain static page.</p>\n<script src="/cleaker.js" data-corner="top-left"></script>';
  // level 2: bars declared inline (top opened by the author, left closed), and the same from a document file
  const doc = { bars: {
    top: { label: 'Top bar', state: 'open', children: { docs: { label: 'Docs', to: '/bars' } } },
    left: { label: 'Left bar', children: {
      home: { label: 'Home', to: '/' },
      evil: { label: 'Evil', to: 'javascript:alert(1)' },
      beatle: { label: 'Beatle', to: '/beatle', icon: 'glyph:𓆣' },
    } },
  } };
  const barsPage = `<!doctype html><meta charset="utf-8"><title>bars</title><p>page with bars</p><script type="application/json" data-cleaker-document>${JSON.stringify(doc)}</script><script src="/cleaker.js"></script>`;
  const barsDocPage = '<!doctype html><meta charset="utf-8"><title>bars from a document</title><p>page</p><script src="/cleaker.js" data-document="/gui.document.json"></script>';
  const server = http.createServer((req, res) => {
    if (req.url === '/cleaker.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(js); }
    if (req.url === '/bars') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(barsPage); }
    if (req.url === '/bars-doc') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(barsDocPage); }
    if (req.url === '/gui.document.json') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(doc)); }
    res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  // the same script, next to a page opened as a FILE (file://), the way someone drops the tag into any local html
  fs.writeFileSync(path.join(out, 'local page.html'), '<!doctype html><meta charset="utf-8"><p>a local file</p><script src="cleaker.js" data-corner="bottom-left"></script>');
  return { origin: `http://127.0.0.1:${server.address().port}`, bytes: js.length, fileUrl: `file://${encodeURI(path.join(out, 'local page.html'))}`, stop: () => server.close() };
}

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

async function main() {
  const [demo, standalone] = await Promise.all([startDemo(), startStandalone()]);
  const browser = await chromium.launch();
  const cleaker = fakeMonad({ origin: 'https://cleaker.me', namespace: 'cleaker.me' });
  const outside = [];
  const newPage = async () => {
    const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    await routeMonads(context, [cleaker]);
    const allowed = [demo.origin, standalone.origin];
    // local files (file://) are this device, not the network
    await context.route((u) => u.protocol !== 'file:' && !allowed.includes(u.origin) && u.hostname !== 'cleaker.me', (r) => { outside.push(r.request().url()); r.abort(); });
    return { context, page: await context.newPage() };
  };
  // everything Cleaker draws is inside its shadow root
  const inShadow = (page, fn, arg) => page.evaluate(([src, a]) => {
    const host = document.querySelector('[data-cleaker]');
    // eslint-disable-next-line no-new-func
    return new Function('host', 'shadow', 'arg', src)(host, host?.shadowRoot, a);
  }, [fn, arg]);
  const rect = (page) => page.evaluate(() => { const r = document.querySelector('[data-cleaker]').getBoundingClientRect(); return { left: r.left, top: r.top, right: innerWidth - r.right, bottom: innerHeight - r.bottom }; });
  const label = (page) => inShadow(page, `return shadow.querySelector('.label .text').textContent`);

  try {
    // ── as an app imports it, on a hostile page ─────────────────────────────────────────────────────────────────
    {
      const { context, page } = await newPage();
      await page.goto(`${demo.origin}/cleakerCorner.html`);
      await page.waitForSelector('[data-cleaker]');
      const host = new URL(demo.origin).host;
      check('1.1 one element appears, with its own shadow root', await page.evaluate(() => document.querySelectorAll('[data-cleaker]').length === 1 && !!document.querySelector('[data-cleaker]').shadowRoot));
      await page.waitForFunction(() => document.querySelector('[data-cleaker]').shadowRoot.querySelector('.dot').getAttribute('data-state') === 'ok', null, { timeout: 8000 }).catch(() => {});
      check('1.2 with no setup it starts on cleaker.me (and it answered): `cleaker.me @ <page>`', (await label(page)) === `cleaker.me @ ${host}`, await label(page));
      const qr = await inShadow(page, `const b = shadow.querySelector('.qr'); const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, border: s.borderTopColor, svg: shadow.querySelector('.qr svg').getBoundingClientRect().width }`);
      check('1.3 the page\'s styles do not reach it (no red borders, no 900px svg)', qr.w === 64 && qr.h === 64 && qr.border !== 'rgb(255, 0, 0)' && qr.svg <= 64, JSON.stringify(qr));
      const own = await page.evaluate(() => { const p = document.querySelector('[data-page="own"]'); const s = getComputedStyle(p); return { color: s.color, border: s.borderTopColor }; });
      check('1.4 its styles do not leak into the page (the page\'s own .label keeps its look)', own.color === 'rgb(1, 2, 3)' && own.border === 'rgb(255, 0, 0)', JSON.stringify(own));
      const r = await rect(page);
      check('1.5 default corner: bottom-right', r.right <= 20 && r.bottom <= 20, JSON.stringify(r));
      // the panel
      await inShadow(page, `shadow.querySelector('.qr').click()`);
      check('1.6 the QR opens its panel', await inShadow(page, `return !shadow.querySelector('.panel').hidden`));
      await page.keyboard.press('Escape');
      check('1.7 Escape closes it', await inShadow(page, `return shadow.querySelector('.panel').hidden`));
      // corners
      await inShadow(page, `shadow.querySelector('.qr').click(); shadow.querySelector('[data-corner-choice="top-left"]').click()`);
      const tl = await rect(page);
      check('1.8 moved to top-left', tl.left <= 20 && tl.top <= 20, JSON.stringify(tl));
      await page.goto(`${demo.origin}/cleakerCorner.html?corner=bottom-left`);
      await page.waitForSelector('[data-cleaker]');
      const kept = await rect(page);
      check('1.9 after a reload it stays where the person put it, over the author\'s default', kept.left <= 20 && kept.top <= 20, JSON.stringify(kept));
      // namespaces
      const submit = (ns) => inShadow(page, `shadow.querySelector('.qr').click(); const i = shadow.querySelector('input'); i.value = arg; shadow.querySelector('form').requestSubmit()`, ns);
      await submit('cleaker.me\\');
      await page.waitForTimeout(200);
      const refused = await inShadow(page, `return { status: shadow.querySelector('.status').textContent, label: shadow.querySelector('.label .text').textContent }`);
      check('2.1 a name that is not a namespace is refused, and nothing changes', /not a namespace name/.test(refused.status) && refused.label === `cleaker.me @ ${host}`, JSON.stringify(refused));
      await submit('cleaker.me');
      await page.waitForFunction(() => document.querySelector('[data-cleaker]').shadowRoot.querySelector('.dot').getAttribute('data-state') === 'ok', null, { timeout: 8000 }).catch(() => {});
      const chosen = await inShadow(page, `return { label: shadow.querySelector('.label .text').textContent, state: shadow.querySelector('.dot').getAttribute('data-state'), value: shadow.querySelector('.qr').getAttribute('data-value') }`);
      check('2.2 choosing cleaker.me: `cleaker.me @ <page>`, it answered, the QR says both (namespace + at=<page>)', chosen.label === `cleaker.me @ ${host}` && chosen.state === 'ok' && /^https:\/\/cleaker\.me/.test(chosen.value) && new URL(chosen.value).searchParams.get('at') === demo.origin, JSON.stringify(chosen));
      const events = await page.evaluate(() => window.__events);
      check('2.3 the page is told which namespace answered (cleaker:namespace event)', events.length >= 1 && events.every((e) => e === 'cleaker.me'), JSON.stringify(events));
      check('2.4 only its public /__surface was asked', cleaker.calls.every((c) => /\/__surface/.test(c.path)) && cleaker.calls.length >= 1, JSON.stringify(cleaker.calls.map((c) => c.path)));
      await submit('nobody.test');
      await page.waitForFunction(() => document.querySelector('[data-cleaker]').shadowRoot.querySelector('.dot').getAttribute('data-state') === 'off', null, { timeout: 8000 }).catch(() => {});
      check('2.5 a namespace that does not answer says so', (await inShadow(page, `return shadow.querySelector('.status').textContent`)) === 'nobody.test did not answer.');
      // the person chooses none: the address alone, and it stays so after a reload (the default does not come back)
      await inShadow(page, `shadow.querySelector('.qr').click(); shadow.querySelector('input').value = ''; shadow.querySelector('form').requestSubmit()`);
      await page.reload();
      await page.waitForSelector('[data-cleaker]');
      check('2.6 choosing none shows the page\'s address alone, also after a reload', (await label(page)) === host, await label(page));
      await context.close();
    }
    // the author starts it with no namespace: data-namespace="" / namespace: null
    {
      const { context, page } = await newPage();
      await page.goto(`${demo.origin}/cleakerCorner.html?namespace=`);
      await page.waitForSelector('[data-cleaker]');
      check('2.7 an author can start it with no namespace', (await label(page)) === new URL(demo.origin).host, await label(page));
      await context.close();
    }

    // ── the one-line script on a plain static page ────────────────────────────────────────────────────────────────
    {
      const { context, page } = await newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(`${standalone.origin}/`);
      await page.waitForSelector('[data-cleaker]', { timeout: 10000 }).catch(() => {});
      const r = await rect(page).catch(() => null);
      const api = await page.evaluate(() => typeof window.Cleaker?.mount === 'function' && !window.React);
      check(`3.1 <script src="cleaker.js" data-corner="top-left"> puts it top-left on a plain page (${Math.round(standalone.bytes / 1024)} kB, no React)`, !!r && r.left <= 20 && r.top <= 20 && api && errors.length === 0, JSON.stringify({ r, api, errors }));
      await page.waitForFunction(() => document.querySelector('[data-cleaker]').shadowRoot.querySelector('.dot').getAttribute('data-state') === 'ok', null, { timeout: 8000 }).catch(() => {});
      check('3.2 with no data-namespace it starts on cleaker.me at that page', (await label(page)) === `cleaker.me @ ${new URL(standalone.origin).host}`, await label(page));
      await context.close();
    }
    // ── level 2: bars unfolding from the QR ─────────────────────────────────────────────────────────────────────
    {
      const { context, page } = await newPage();
      await page.goto(`${standalone.origin}/bars`);
      await page.waitForSelector('[data-cleaker]');
      const bars = () => inShadow(page, `return [...shadow.querySelectorAll('.bars nav')].map((n) => { const r = n.getBoundingClientRect(); return { bar: n.dataset.bar, state: n.dataset.state, hidden: n.hidden, w: Math.round(r.width), h: Math.round(r.height), items: [...n.querySelectorAll('a')].map((a) => a.dataset.item + (a.getAttribute('aria-current') ? '*' : '')), labels: [...n.querySelectorAll('a .text')].filter((t) => t.offsetParent).map((t) => t.textContent), pos: n.querySelector('.pos')?.textContent || null }; })`);
      let b = await bars();
      const top = b.find((x) => x.bar === 'top'); const left = b.find((x) => x.bar === 'left');
      check('5.1 the author opened the top bar: it shows, with where you are and its element (current page marked)', top && !top.hidden && top.pos?.startsWith('cleaker.me @') && top.items.join() === 'docs*', JSON.stringify(top));
      check('5.2 the left bar starts closed (the page is unchanged until someone opens it)', left && left.hidden, JSON.stringify(left));
      check('5.3 an element with an unsafe link (javascript:) is not drawn', left && left.items.join() === 'home,beatle', JSON.stringify(left?.items));
      const rows = await inShadow(page, `return [...shadow.querySelectorAll('.barsec .barrow')].map((r) => r.textContent)`);
      check('5.4 the QR\'s panel offers each declared bar as a collection (open / icons / closed)', rows.length === 2 && rows.every((r) => /open.*icons.*closed/.test(r)), JSON.stringify(rows));
      await inShadow(page, `shadow.querySelector('.qr').click(); shadow.querySelector('[data-bar-choice="left:open"]').click()`);
      b = await bars();
      const openLeft = b.find((x) => x.bar === 'left');
      check('5.5 opened: the left bar shows its elements with their names, below the top bar', !openLeft.hidden && openLeft.w === 200 && openLeft.labels.join() === 'Home,Beatle', JSON.stringify(openLeft));
      await inShadow(page, `shadow.querySelector('[data-bar-choice="left:icons"]').click(); shadow.querySelector('[data-bar-choice="top:closed"]').click()`);
      b = await bars();
      const iconLeft = b.find((x) => x.bar === 'left'); const closedTop = b.find((x) => x.bar === 'top');
      check('5.6 icons only: narrow, no names; and the top bar closed by the person', iconLeft.w === 52 && iconLeft.labels.length === 0 && closedTop.hidden, JSON.stringify({ iconLeft, closedTop }));
      await page.reload();
      await page.waitForSelector('[data-cleaker]');
      b = await bars();
      check('5.7 after a reload the person\'s choices are kept, over the author\'s defaults', b.find((x) => x.bar === 'left').state === 'icons' && b.find((x) => x.bar === 'top').hidden, JSON.stringify(b.map((x) => [x.bar, x.state, x.hidden])));
      const ownStyle = await page.evaluate(() => getComputedStyle(document.body).marginLeft + ' ' + document.body.children.length);
      check('5.8 the page itself is not changed (bars live in Cleaker\'s shadow root)', ownStyle.startsWith('8px'), ownStyle);
      await context.close();
    }
    {
      const { context, page } = await newPage();
      await page.goto(`${standalone.origin}/bars-doc`);
      await page.waitForFunction(() => document.querySelector('[data-cleaker]')?.shadowRoot?.querySelectorAll('.bars nav').length === 2, null, { timeout: 8000 }).catch(() => {});
      const count = await inShadow(page, `return shadow.querySelectorAll('.bars nav').length`);
      check('5.9 data-document: the bars come from a document file', count === 2, String(count));
      await context.close();
    }
    // nobody.test is asked on purpose (2.5) and stopped here: that is what "does not answer" means
    const unexpected = outside.filter((u) => new URL(u).hostname !== 'nobody.test');
    // ── the one-line script in a local file (file://) ────────────────────────────────────────────────────────────
    {
      const { context, page } = await newPage();
      await page.goto(standalone.fileUrl);
      await page.waitForSelector('[data-cleaker]', { timeout: 10000 }).catch(() => {});
      const seen = await inShadow(page, `return { label: shadow.querySelector('.label .text').textContent, title: shadow.querySelector('.label').title, value: shadow.querySelector('.qr').getAttribute('data-value') }`).catch(() => null);
      check('4.1 opened as a file, it says which file: `cleaker.me @ <its name>`', seen?.label === 'cleaker.me @ local page.html', JSON.stringify(seen));
      check('4.2 the tooltip carries the whole file (file:///…/local page.html)', seen?.title.includes(decodeURI(standalone.fileUrl)), JSON.stringify(seen));
      check('4.3 the QR says both: cleaker.me + at=<the whole file>', !!seen && new URL(seen.value).origin === 'https://cleaker.me' && new URL(seen.value).searchParams.get('at') === standalone.fileUrl, seen?.value);
      await context.close();
    }
    check('nothing else requested outside the test servers and the fake cleaker.me', unexpected.length === 0, unexpected.slice(0, 3).join(', '));
  } finally {
    await browser.close();
    demo.stop();
    standalone.stop();
  }
  console.log(failed ? `\n${failed} failed` : '\nno failures');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
