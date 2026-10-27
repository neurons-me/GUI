// Declarative requirements, checked against the REAL shell (src/runtime/capabilities.ts, tests/capabilities.test.ts).
//
// What runs: the real <Cleaker> in a real browser (Playwright/Chromium), served by the demo dev server (demo/capabilities.html),
// with a document whose parts declare requirements and resolvers that ask the SELECTED link's own transport. What is controlled:
// the transports (fake monads at the network layer, as in links.browser.test.mjs) and what each says a given identity may do.
//
//   node tests/integration/capabilities.browser.test.mjs          (from Typescript/)
//
// Each condition prints PASS/FAIL with what was observed. The point of the whole file: what one link (or one identity, or one
// scope) grants never enables another, and a part's link and its page follow the same declaration.
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fakeMonad, routeMonads } from './fakeMonads.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-expose-headers': '*',
};

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

async function startHarness() {
  const port = await freePort();
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, env: { ...process.env, DEMO: 'true' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* already gone */ } };
  process.on('exit', stop);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i += 1) {
    try { const r = await fetch(`${origin}/capabilities.html`); if (r.ok) return { origin, stop, pid: child.pid }; } catch { /* not up yet */ }
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
const until = async (page, fn, arg, timeout = 3500) => {
  try { await page.waitForFunction(fn, arg, { timeout }); return true; } catch { return false; }
};

/** What each fake monad answers about capabilities: granted per (name, identity, scope). Records every question. */
function withCapabilities(monad) {
  monad.grants = new Set();
  monad.asked = [];
  monad.capabilityGate = null;
  monad.grant = (name, identity, scope = '*') => monad.grants.add(`${name}|${identity}|${scope}`);
  monad.revoke = (name, identity, scope = '*') => monad.grants.delete(`${name}|${identity}|${scope}`);
  monad.hold = () => { let release; const p = new Promise((r) => { release = r; }); monad.capabilityGate = p; return () => { monad.capabilityGate = null; release(); }; };
  return monad;
}
async function routeCapabilities(context, monads) {
  for (const m of monads) {
    await context.route((u) => u.hostname === m.host && u.pathname.startsWith('/__capability/'), async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      const u = new URL(req.url());
      const name = decodeURIComponent(u.pathname.slice('/__capability/'.length));
      const identity = req.headers()['x-identity'] || '';
      const scope = u.searchParams.get('scope') || '';
      m.asked.push({ name, identity, scope });
      if (m.capabilityGate) await m.capabilityGate;
      const granted = m.grants.has(`${name}|${identity}|${scope}`) || m.grants.has(`${name}|${identity}|*`);
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ granted }) });
    });
  }
}

async function open(browser, harness, monads, { ns = 'a.test', transport = 'http://a.test' } = {}) {
  const context = await browser.newContext();
  await routeMonads(context, monads);
  await routeCapabilities(context, monads);
  const page = await context.newPage();
  page.on('pageerror', () => { /* reported by the check that did it */ });
  await page.goto(`${harness.origin}/capabilities.html?ns=${ns}&transport=${encodeURIComponent(transport)}`);
  await until(page, () => !!document.querySelector('input[type=password]'), null, 6000);
  return { context, page };
}

async function signIn(page, username, secret) {
  await page.fill('input[type=text]:not([placeholder])', username);
  await page.fill('input[type=password]', secret);
  await page.click('button:has-text(".me"):not([disabled])', { timeout: 3000 });
}
const signedIn = (page) => until(page, () => /Sign out/i.test(document.body.innerText), null, 3000);

async function selectLink(page, namespace) {
  const edit = page.locator('button[aria-label="Edit namespace"]');
  if (!(await edit.count())) return false;
  await edit.first().click();
  const input = page.locator('input[placeholder="namespace root"]');
  if (!(await input.count())) return false;
  await input.fill(namespace);
  await input.press('Enter');
  return true;
}

/** The sidebar as the person sees it: the document's own links, with whether each is shown disabled. */
const rail = (page) => page.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('a[href]')]
    .map((a) => [a.getAttribute('href'), a.getAttribute('data-gui-off') === 'true'])
    .filter(([href]) => ['/open', '/signed', '/admin', '/audit'].includes(href)),
));
const hasLink = async (page, href) => Object.prototype.hasOwnProperty.call(await rail(page), href);
const settle = (page, ms = 700) => page.waitForTimeout(ms);
const goTo = async (page, route) => {
  await page.evaluate((r) => { window.history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
  await settle(page, 600);
};
const pageShown = (page, id) => page.locator(`[data-page="${id}"]`).count().then((n) => n > 0);
const identityOf = (m) => (m.asked.length ? m.asked[m.asked.length - 1].identity : null);

async function main() {
  const harness = await startHarness();
  const browser = await chromium.launch();
  console.log(`harness ${harness.origin} (pid ${harness.pid})\n`);
  try {
    // ── 1. no session: only what asks for nothing is enabled ─────────────────────────────────────────────────────────
    {
      const a = withCapabilities(fakeMonad({ origin: 'http://a.test', namespace: 'a.test' }));
      const { context, page } = await open(browser, harness, [a]);
      await settle(page);
      const r = await rail(page);
      check('1.1 no session: the open link is there', '/open' in r && r['/open'] === false, JSON.stringify(r));
      check('1.2 no session: a session-gated link and a capability-gated link (hide) are not offered', !('/signed' in r) && !('/admin' in r));
      check('1.3 no session: the capability marked `disable` is shown, disabled', r['/audit'] === true);
      check('1.4 nothing was asked of the transport for someone who is not signed in', a.asked.length === 0, `asked: ${a.asked.length}`);
      await goTo(page, '/admin');
      check('1.5 typing the hidden page\'s route does not render it', !(await pageShown(page, 'admin')));
      await goTo(page, '/audit');
      check('1.6 the disabled page says it is not available instead of rendering', !(await pageShown(page, 'audit')) && /Not available through the selected link/.test(await page.evaluate(() => document.body.innerText)));
      await context.close();
    }

    // ── 2. a session is necessary and never sufficient ───────────────────────────────────────────────────────────────
    // ── 3. a grant is for one scope; changing the app's scope asks again ───────────────────────────────────────────────
    {
      const a = withCapabilities(fakeMonad({ origin: 'http://a.test', namespace: 'a.test' }));
      const { context, page } = await open(browser, harness, [a]);
      await signIn(page, 'ana', 'secret-a');
      check('2.0 ana is signed in at A (setup)', await signedIn(page));
      await until(page, () => true, null, 100);
      await page.waitForTimeout(900);
      const ana = identityOf(a);
      check('2.1 the resolver was asked with the identity signed in through A', Boolean(ana) && a.asked.every((q) => q.identity === ana), `identity ${String(ana).slice(0, 10)}…`);
      let r = await rail(page);
      check('2.2 signed in but not granted: the session-gated link appears, the capability-gated one does not', '/signed' in r && !('/admin' in r), JSON.stringify(r));

      a.grant('demo:admin', ana, 'two');                   // granted, but for the app's scope "two"
      await page.evaluate(() => window.__harness.setScope('two'));
      const shown = await until(page, () => !!document.querySelector('a[href="/admin"]'), null, 3500);
      check('3.1 the app selects scope "two": the capability is asked again and the link appears', shown, JSON.stringify(await rail(page)));
      await goTo(page, '/admin');
      check('3.2 the page behind it renders, and reads the same resolved state', (await pageShown(page, 'admin')) && (await page.locator('[data-page="admin"]').getAttribute('data-capability-state')) === 'granted');
      await page.evaluate(() => window.__harness.setScope('one'));
      const gone = await until(page, () => !document.querySelector('a[href="/admin"]'), null, 3500);
      check('3.3 back to scope "one": the grant of "two" does not enable it', gone, JSON.stringify(await rail(page)));
      check('3.4 ...and the page is no longer reachable by its route', !(await pageShown(page, 'admin')));
      await context.close();
    }

    // ── 4. selecting another link does not lend it the first link's grant ───────────────────────────────────────────
    {
      const a = withCapabilities(fakeMonad({ origin: 'http://a.test', namespace: 'a.test' }));
      const b = withCapabilities(fakeMonad({ origin: 'http://b.test', namespace: 'b.test' }));
      const { context, page } = await open(browser, harness, [a, b]);
      await signIn(page, 'ana', 'secret-a');
      await signedIn(page);
      await page.waitForTimeout(900);
      const ana = identityOf(a);
      a.grant('demo:admin', ana, 'two');
      await page.evaluate(() => window.__harness.setScope('two'));
      check('4.0 granted through A (setup)', await until(page, () => !!document.querySelector('a[href="/admin"]'), null, 3500));
      const askedAtA = a.asked.length;

      const selected = await selectLink(page, 'b.test');
      await settle(page, 1200);
      check('4.1 selecting B (no session through it): A\'s grant does not show up', selected && !(await hasLink(page, '/admin')), JSON.stringify(await rail(page)));
      check('4.2 nothing was asked of A on behalf of B', a.asked.length === askedAtA, `A asked ${a.asked.length - askedAtA} more`);

      await signIn(page, 'ana', 'secret-a');               // the same person signs in through B as well
      await settle(page, 1500);
      check('4.3 signed in through B too: B is asked, B has granted nothing, so still not offered', b.asked.length > 0 && !(await hasLink(page, '/admin')), `B asked ${b.asked.length}; ${JSON.stringify(await rail(page))}`);
      check('4.4 ...and what B was asked is B\'s question (its own transport, its identity)', b.asked.every((q) => q.name.startsWith('demo:')));

      b.grant('demo:admin', identityOf(b), 'twob');         // B grants it for the scope "twob"
      await page.evaluate(() => window.__harness.setScope('twob'));
      check('4.5 once B grants it for its own identity (and the app is in that scope), B offers it', await until(page, () => !!document.querySelector('a[href="/admin"]'), null, 3500), JSON.stringify(await rail(page)));

      await page.evaluate(() => window.__harness.setScope('two'));
      const back = await selectLink(page, 'a.test');
      await settle(page, 1200);
      check('4.6 back at A, scope "two": A\'s own grant is still its own', back && (await hasLink(page, '/admin')), JSON.stringify(await rail(page)));
      await context.close();
    }

    // ── 5. another identity through the same link ───────────────────────────────────────────────────────────────────
    {
      const a = withCapabilities(fakeMonad({ origin: 'http://a.test', namespace: 'a.test' }));
      const { context, page } = await open(browser, harness, [a]);
      await signIn(page, 'ana', 'secret-a');
      await signedIn(page);
      await page.waitForTimeout(900);
      const ana = identityOf(a);
      a.grant('demo:admin', ana, 'two');
      await page.evaluate(() => window.__harness.setScope('two'));
      check('5.0 ana is granted at A (setup)', await until(page, () => !!document.querySelector('a[href="/admin"]'), null, 3500));
      await page.click('button:has-text("Sign out")', { timeout: 3000 }).catch(() => {});
      await settle(page, 900);
      check('5.1 after signing out: not offered', !(await hasLink(page, '/admin')), JSON.stringify(await rail(page)));
      await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
      await signIn(page, 'bob', 'secret-b');
      await signedIn(page);
      await settle(page, 1200);
      const bob = identityOf(a);
      check('5.2 bob signs in through the same link: asked with bob\'s identity, not ana\'s', Boolean(bob) && bob !== ana, `bob ${String(bob).slice(0, 10)}… ana ${String(ana).slice(0, 10)}…`);
      check('5.3 ana\'s grant does not enable bob', !(await hasLink(page, '/admin')), JSON.stringify(await rail(page)));
      await context.close();
    }

    // ── 6. a late answer for the link that was left does not enable the one selected now ─────────────────────────────
    {
      const a = withCapabilities(fakeMonad({ origin: 'http://a.test', namespace: 'a.test' }));
      const b = withCapabilities(fakeMonad({ origin: 'http://b.test', namespace: 'b.test' }));
      const { context, page } = await open(browser, harness, [a, b]);
      await signIn(page, 'ana', 'secret-a');
      await signedIn(page);
      await page.waitForTimeout(900);
      const ana = identityOf(a);
      a.grant('demo:admin', ana, 'late');
      const release = a.hold();                             // A's answer will arrive late
      await page.evaluate(() => window.__harness.setScope('late'));
      await settle(page, 400);
      const selected = await selectLink(page, 'b.test');    // the person moves on to B meanwhile
      await settle(page, 600);
      release();                                            // A's answer (granted) arrives now
      await settle(page, 1200);
      check('6.1 the late grant for A does not enable B', selected && !(await hasLink(page, '/admin')), JSON.stringify(await rail(page)));
      const back = await selectLink(page, 'a.test');
      await settle(page, 1500);
      check('6.2 selecting A again asks again and gets A\'s own answer', back && (await hasLink(page, '/admin')), JSON.stringify(await rail(page)));
      await context.close();
    }
  } finally {
    await browser.close();
    harness.stop();
  }
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length}`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => { console.error(error); process.exit(1); });
