// The conditions of the link model (src/react/link.ts, tests/link.test.ts), checked against the REAL components.
//
// What runs: the real <Cleaker> (as netget mounts it) in a real browser (Playwright/Chromium), served by the demo dev
// server (demo/links.html). What is controlled: the transports. Each link's origin is a fake monad (fakeMonads.mjs)
// reached through the browser's network layer, so the components fetch exactly as they ship and every request is
// counted per transport; a reply can be held (a late answer) and a transport can be made to fail.
//
//   node tests/integration/links.browser.test.mjs          (from Typescript/)
//
// Not part of `test:runtime` while any of this fails (that is the prebuild); it joins it when it passes.
// Each condition prints PASS/FAIL with what was observed, so a failure names where state is shared or replaced.
import { spawn } from 'node:child_process';
import net from 'node:net';
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

async function startHarness() {
  const port = await freePort();
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, env: { ...process.env, DEMO: 'true' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* already gone */ } };
  process.on('exit', stop);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i += 1) {
    try { const r = await fetch(`${origin}/links.html`); if (r.ok) return { origin, stop, pid: child.pid }; } catch { /* not up yet */ }
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

/** Wait for a condition in the page; true/false, never throws. */
const until = async (page, fn, arg, timeout = 3000) => {
  try { await page.waitForFunction(fn, arg, { timeout }); return true; } catch { return false; }
};

const bodyText = (page) => page.evaluate(() => document.body.innerText);
const signedInAs = (page) => until(page, () => /Sign out/i.test(document.body.innerText), null, 2500);

async function open(browser, harness, monads, { ns = 'a.test', transport = 'http://a.test' } = {}) {
  const context = await browser.newContext();
  await routeMonads(context, monads);
  const page = await context.newPage();
  page.on('pageerror', () => { /* an operation a link refuses is reported by the check that did it */ });
  await page.goto(`${harness.origin}/links.html?ns=${ns}&transport=${encodeURIComponent(transport)}`);
  await until(page, () => !!document.querySelector('input[type=password]'), null, 6000);
  return { context, page };
}

const fillCredentials = async (page, username, secret) => {
  await page.fill('input[type=text]:not([placeholder])', username);
  await page.fill('input[type=password]', secret);
};
const canSubmit = (page) => page.locator('button:has-text(".me"):not([disabled])').count().then((n) => n > 0);

async function signIn(page, username, secret) {
  await fillCredentials(page, username, secret);
  await page.click('button:has-text(".me"):not([disabled])', { timeout: 3000 });
}

/** The one control the card has for choosing which namespace it is about: its label and the pencil. */
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

const cardTarget = (page) => page.evaluate(() => {
  const input = document.querySelector('input[placeholder="namespace root"]');
  if (input) return input.value;
  const text = [...document.querySelectorAll('svg text')].map((t) => t.textContent || '').find((t) => /\S/.test(t));
  return (text || '').replace(/\s+/g, ' ').trim();
});

async function main() {
  const harness = await startHarness();
  const browser = await chromium.launch();
  console.log(`harness ${harness.origin} (pid ${harness.pid})\n`);
  try {
    // ── 1. A has a session; selecting B does not lend it, change it or close it ─────────────────────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const b = fakeMonad({ origin: 'http://b.test', namespace: 'b.test' });
      const { context, page } = await open(browser, harness, [a, b]);
      await signIn(page, 'ana', 'secret-a');
      const inA = await signedInAs(page);
      check('1.0 A is signed in (setup)', inA && a.opened.includes('ana.a.test'), `opened at A: ${a.opened.join(',') || '-'}`);
      const aOpensBefore = a.count(/POST \/claims\/signIn/);

      const selected = await selectLink(page, 'b.test');
      check('1.1 while A is signed in, the card can select another link', selected, selected ? '' : 'no control to choose another namespace once a session is open (QRConnect: editableRoot={!authenticated})');
      const notReached = 'not reached: B cannot be selected while A holds the only session';
      // B answers through its own channel; the card offers its form once it has
      if (selected) await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
      const text = selected ? await bodyText(page) : '';
      check('1.2 the card is now about B', selected && /b\.test/.test(await cardTarget(page)), selected ? `target: ${await cardTarget(page)}` : notReached);
      check('1.3 B does not borrow A\'s session', selected && !/Sign out/i.test(text) && (await page.locator('input[type=password]').count()) > 0,
        selected ? (/Sign out/i.test(text) ? 'B\'s card shows A\'s session (Sign out)' : `form offered: ${(await page.locator('input[type=password]').count()) > 0}`) : notReached);
      check('1.4 selecting B asked A for nothing', selected && a.count(/POST \/claims\/signIn/) === aOpensBefore, selected ? '' : notReached);
      const back = selected && await selectLink(page, 'a.test');
      check('1.5 selecting A again finds its session still open, unchanged', back && (await signedInAs(page)) && a.count(/POST \/claims\/signIn/) === aOpensBefore,
        back ? `A sign-ins: ${a.count(/POST \/claims\/signIn/)} (was ${aOpensBefore})` : notReached);
      await context.close();
    }

    // ── 2. An operation from the card reaches only the selected link, and replaces nothing ─────────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const b = fakeMonad({ origin: 'http://b.test', namespace: 'b.test' });
      const { context, page } = await open(browser, harness, [a, b]);
      await signIn(page, 'ana', 'secret-a');
      const inA = await signedInAs(page);
      check('2.0 A is signed in (setup)', inA);
      const selected = await selectLink(page, 'b.test');
      check('2.1 B is selected from the card while A holds a session', selected, selected ? '' : 'no control to choose another namespace once a session is open');
      let aSignIns = 0; let bSignIns = 0; let operated = false;
      if (selected) {
        await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
        const aBefore = a.count(/POST \/claims\/signIn/);
        b.reset();
        try { await signIn(page, 'bob', 'secret-b'); operated = true; } catch (e) { /* reported below */ }
        await page.waitForTimeout(1200);
        aSignIns = a.count(/POST \/claims\/signIn/) - aBefore;
        bSignIns = b.count(/POST \/claims\/signIn/);
      }
      check('2.2 the operation went to B\'s transport', operated && bSignIns > 0, `B sign-ins: ${bSignIns}`);
      check('2.3 A\'s transport got nothing from it', operated && aSignIns === 0, `A sign-ins since: ${aSignIns}`);
      check('2.4 what B opened is B\'s name', operated && b.opened.length > 0 && b.opened.every((n) => /\.b\.test$/.test(n)), `B opened: ${b.opened.join(',') || '-'}`);
      const back = selected && await selectLink(page, 'a.test');
      check('2.5 A\'s session was not replaced by the one made for B', back && (await signedInAs(page)) && /ana\.a\.test/.test(await bodyText(page)) && !/bob\.b\.test/.test(await bodyText(page).catch(() => '')),
        back ? '' : 'not reached');
      await context.close();
    }

    // ── 3. A late answer from the previous destination does not confirm the new one ────────────────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const b = fakeMonad({ origin: 'http://b.test', namespace: 'b.test' });
      const releaseA = a.gate('surface');                  // A's answers are held...
      const releaseB = b.gate('channel');                  // ...and so is B's: nothing has answered for B yet
      const context = await browser.newContext();
      await routeMonads(context, [a, b]);
      const page = await context.newPage();
      page.on('pageerror', () => {});
      await page.goto(`${harness.origin}/links.html?ns=a.test&transport=${encodeURIComponent('http://a.test')}`);
      await until(page, () => !!document.querySelector('button[aria-label="Edit namespace"]'), null, 4000);
      const selected = await selectLink(page, 'b.test');
      check('3.0 B selected while neither A nor B has answered (setup)', selected);
      const offered = async () => (await page.locator('input[type=password]').count()) > 0;
      await page.waitForTimeout(800);
      check('3.1 nothing has answered for B: the card offers no operation on it', !(await offered()) || !(await canSubmit(page)), `form offered: ${await offered()}`);
      releaseA();                                          // A answers now, late
      await page.waitForTimeout(1000);
      check('3.2 A\'s late answer does not make B actionable', !(await offered()) || !(await canSubmit(page)), `form offered after A answered: ${await offered()}`);
      releaseB();                                          // B's own answer
      const shown = await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
      if (shown) await fillCredentials(page, 'bob', 'secret-b');
      check('3.3 B\'s own answer is what makes it actionable', shown && (await canSubmit(page)), `form offered after B answered: ${shown}`);
      await context.close();
    }

    // ── 4. A reply that arrives after the selection moved lands on the link it was asked for ───────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const b = fakeMonad({ origin: 'http://b.test', namespace: 'b.test' });
      const { context, page } = await open(browser, harness, [a, b]);
      const releaseSignIn = a.gate('open');                // A's sign-in is held in flight
      await fillCredentials(page, 'ana', 'secret-a');
      await page.click('button:has-text(".me"):not([disabled])', { timeout: 3000 });
      const selected = await selectLink(page, 'b.test');   // the person moves on to B meanwhile
      check('4.0 B selected while A\'s sign-in is still in flight (setup)', selected);
      await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
      releaseSignIn();                                     // A's reply arrives now, late
      await page.waitForTimeout(1500);
      const text = await bodyText(page);
      check('4.1 the late reply does not make B look signed in', !/Sign out/i.test(text) && !/ana\.a\.test/.test(await cardTarget(page)),
        /Sign out/i.test(text) ? 'B\'s card shows A\'s late session' : '');
      const back = await selectLink(page, 'a.test');
      check('4.2 it did land on A', back && (await signedInAs(page)) && /ana\.a\.test/.test(await bodyText(page)), back ? '' : 'could not select A');
      await context.close();
    }

    // ── 5. The surface and the semantic path are independent ───────────────────────────────────────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const { context, page } = await open(browser, harness, [a]);
      await page.evaluate(() => window.__harness.setSemanticPath('/netget'));
      await until(page, () => true, null, 400);
      const labelBefore = await cardTarget(page);
      const pathBefore = await page.evaluate(() => window.location.pathname);
      check('5.0 the semantic path is shown with the link (setup)', /a\.test\/netget/.test(labelBefore), labelBefore);

      // navigate the surface: a route of the page
      await page.evaluate(() => { window.history.pushState({}, '', '/users'); window.dispatchEvent(new PopStateEvent('popstate')); });
      await until(page, () => true, null, 500);
      const labelAfterNav = await page.evaluate(() => [...document.querySelectorAll('svg text, a, span')].map((e) => e.textContent || '').find((t) => /a\.test/.test(t)) || '');
      check('5.1 navigating the surface keeps the link and the semantic path', /a\.test\/netget/.test(labelAfterNav) || /a\.test\/netget/.test(await bodyText(page)),
        `after /users: ${labelAfterNav.replace(/\s+/g, ' ').slice(0, 60)}`);

      // change the semantic path: the surface does not move
      await page.evaluate(() => window.__harness.setSemanticPath('/ideas'));
      await until(page, () => true, null, 500);
      const pathAfter = await page.evaluate(() => window.location.pathname);
      check('5.2 changing the semantic path leaves the surface where it was', pathAfter === '/users', `pathname: ${pathAfter} (was ${pathBefore} before navigating)`);
      check('5.3 ...and the semantic path is the new one', /a\.test\/ideas/.test(await bodyText(page)), '');
      await context.close();
    }
    // ── 6. The corner: a stable, whole-cell control that names the selected link and keeps the facts apart ──────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const b = fakeMonad({ origin: 'http://b.test', namespace: 'b.test' });
      const { context, page } = await open(browser, harness, [a, b]);
      const corner = () => page.evaluate(() => {
        const btn = document.querySelector('button[aria-label$="sidebar"], button[aria-label="Open navigation"]');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        const qr = btn.querySelector('[data-gui-node-id="GUI.bars.top.position"]');
        return { x: r.x, y: r.y, w: r.width, h: r.height, title: btn.getAttribute('title') || '', face: qr ? qr.getAttribute('aria-label') : null };
      });
      const qrValues = () => page.evaluate(() => {
        const all = [...document.querySelectorAll('[data-qr-value]')];
        const badge = all.find((e) => e.getAttribute('data-gui-node-id') === 'GUI.bars.top.position');
        const card = all.find((e) => e !== badge);
        return { badge: badge ? badge.getAttribute('data-qr-value') : null, card: card ? card.getAttribute('data-qr-value') : null };
      });
      const c0 = await corner();
      check('6.1 the control is the whole corner cell, flush with the window', !!c0 && c0.x === 0 && c0.y === 0 && c0.w >= 56 && c0.h >= 48, c0 ? `x=${c0.x} y=${c0.y} ${c0.w}x${c0.h}` : 'no control');
      await page.hover('button[aria-label="Expand sidebar"]');
      await page.waitForTimeout(250);
      const c1 = await corner();
      check('6.2 pointing at it does not change its face', !!c0 && !!c1 && c0.face === c1.face && /Show avatar/.test(c1.face || ''), `face before/after: ${c0 && c0.face} / ${c1 && c1.face}`);
      await page.focus('button[aria-label="Expand sidebar"]');
      const outline = await page.evaluate(() => getComputedStyle(document.querySelector('button[aria-label="Expand sidebar"]')).outlineStyle);
      check('6.3 keyboard focus is visible', outline !== 'none', `outline: ${outline}`);

      // three facts, kept apart
      check('6.4 service answered, no session, authority not verified are stated separately',
        /Service answered/.test(c0.title) && /No session/.test(c0.title) && /Authority not verified/.test(c0.title), c0.title);
      const v0 = await qrValues();
      check('6.5 the corner QR and the card QR name the same link', !!v0.badge && v0.badge === v0.card, `corner: ${v0.badge} card: ${v0.card}`);

      // another link selected: both follow it, together
      const selected = await selectLink(page, 'b.test');
      await page.waitForTimeout(800);
      const v1 = await qrValues();
      check('6.6 selecting B moves both codes to B, together', selected && !!v1.badge && v1.badge === v1.card && v1.badge !== v0.badge && /b\.test/.test(v1.badge || ''), `corner: ${v1.badge} card: ${v1.card}`);

      // signing in through A is a fact about A: the session mark and the sentence appear, the answer statement does not change
      const backA = await selectLink(page, 'a.test');
      await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
      await signIn(page, 'ana', 'secret-a');
      const inA = await signedInAs(page);
      const c2 = await corner();
      const mark = await page.locator('[data-gui-node-id="GUI.bars.left.session"]').count();
      check('6.7 a session is its own mark and sentence, apart from the answer', backA && inA && mark === 1 && /Signed in as ana\.a\.test/.test(c2.title) && /Service answered/.test(c2.title), c2 ? c2.title : '');
      check('6.8 nothing drawn claims verified authority', !/authority verified|Authority: verified/i.test(c2.title.replace(/Authority not verified/, '')) && /Authority not verified/.test(c2.title));
      await context.close();
    }

    // ── 7. Two namespaces on ONE transport: the code recovers WHICH one, not only the door ──────────────────────────
    {
      // The door is the namespace `door.test`; `b.local` and `c.local` are other names the same door serves.
      const door = fakeMonad({ origin: 'http://door.test', namespace: 'door.test' });
      const { context, page } = await open(browser, harness, [door], { ns: 'door.test', transport: 'http://door.test' });
      const values = () => page.evaluate(() => {
        const all = [...document.querySelectorAll('[data-qr-value]')];
        const badge = all.find((e) => e.getAttribute('data-gui-node-id') === 'GUI.bars.top.position');
        const card = all.find((e) => e !== badge);
        return { badge: badge ? badge.getAttribute('data-qr-value') : null, card: card ? card.getAttribute('data-qr-value') : null };
      });
      // what a scanner can recover: the parameter when present, otherwise the host
      const recover = (v) => { try { const u = new URL(v); return { namespace: u.searchParams.get('namespace') || u.hostname, door: u.origin }; } catch { return null; } };
      const first = await values();
      const pick = async (ns) => { const ok = await selectLink(page, ns); await page.waitForTimeout(700); return ok ? values() : null; };
      const b = await pick('b.local');
      const c = await pick('c.local');
      check('7.1 B and C share the transport, so the door is the same', !!b && !!c && recover(b.badge)?.door === recover(c.badge)?.door && recover(b.badge)?.door === recover(first.badge)?.door,
        `${b && b.badge} | ${c && c.badge}`);
      check('7.2 yet the codes differ: each carries its own namespace', !!b && !!c && b.badge !== c.badge && b.badge !== first.badge && c.badge !== first.badge);
      check('7.3 the corner code gives back the selected namespace', recover(b && b.badge)?.namespace === 'b.local' && recover(c && c.badge)?.namespace === 'c.local',
        `${recover(b && b.badge)?.namespace} / ${recover(c && c.badge)?.namespace}`);
      check('7.4 the card code gives back the same namespace', !!b && !!c && b.card === b.badge && c.card === c.badge && recover(c.card)?.namespace === 'c.local');
      check('7.5 and the first link still names itself', recover(first.badge)?.namespace === 'door.test' && first.badge === first.card, first.badge || '');
      const back = await pick('door.test');
      check('7.6 going back returns to the first code exactly', !!back && back.badge === first.badge, `${back && back.badge}`);
      await context.close();
    }

    // ── 8. Two old vaults of one name hold different identities: the card shows the conflict and asks ─────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const { context, page } = await open(browser, harness, [a]);
      const pw = 'a-long-secret-1';
      const vaultModule = `/@fs${path.join(root, 'src/core/identity/localIdentityVault.ts')}`;
      await page.evaluate(async ({ password, vaultModule }) => {
        const m = await import(/* @vite-ignore */ vaultModule);
        await m.saveLocalIdentityVault('vik.a.test', new Uint8Array(32).fill(0x31), password);
        await m.saveLocalIdentityVault('vik.a.test:8080', new Uint8Array(32).fill(0x42), password);   // legacy key, another identity
      }, { password: pw, vaultModule });
      const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => k.startsWith('this.me.identity-vault:')).sort().map((k) => [k, localStorage.getItem(k)])));
      a.reset();
      await fillCredentials(page, 'vik', pw);
      await page.click('button:has-text(".me"):not([disabled])', { timeout: 3000 });
      const shown = await until(page, () => !!document.querySelector('[data-gui-node-id$=".vault-conflict"] button'), null, 4000);
      const buttons = shown ? await page.locator('[data-gui-node-id$=".vault-conflict"] button').count() : 0;
      check('8.1 two vaults with different identities: the card lists both and asks', shown && buttons === 2, `choices shown: ${buttons}`);
      check('8.2 nothing was sent while it was undecided', a.count(/POST \/claims\/signIn/) === 0, `sign-ins: ${a.count(/POST \/claims\/signIn/)}`);
      check('8.3 not signed in, and the stored vaults were not touched',
        !/Sign out/i.test(await bodyText(page)) &&
        (await page.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => k.startsWith('this.me.identity-vault:')).sort().map((k) => [k, localStorage.getItem(k)])))) === before);
      if (shown) {
        await page.locator('[data-gui-node-id$=".vault-conflict"] button').first().click();
        const inNow = await signedInAs(page);
        check('8.4 choosing one signs in with that identity', inNow && a.count(/POST \/claims\/signIn/) > 0);
      }
      await context.close();
    }

    // ── 9. A written door that contradicts the transport of the link: reported, nothing sent ───────────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test:7000', namespace: 'a.test' });
      const { context, page } = await open(browser, harness, [a], { ns: 'a.test', transport: 'http://a.test:7000' });
      const selected = await selectLink(page, 'a.test:9999');             // the root, written with ANOTHER port than the link's
      await until(page, () => !!document.querySelector('input[type=password]'), null, 3000);
      a.reset();
      await fillCredentials(page, 'zed', 'a-long-secret-1');
      await page.click('button:has-text(".me"):not([disabled])', { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(800);
      const text = await bodyText(page);
      check('9.1 the card names the contradiction instead of choosing a door', selected && /port 9999/.test(text) && /port 7000/.test(text), text.match(/The address names[^.]*\./)?.[0] || `form shown: ${selected}`);
      check('9.2 nothing was sent for it', a.count(/POST \/claims\/signIn/) === 0, `sign-ins: ${a.count(/POST \/claims\/signIn/)}`);
      await context.close();
    }

    // ── 10. The mechanism is said BEFORE anything is signed ─────────────────────────────────────────────────────────────
    {
      const a = fakeMonad({ origin: 'http://a.test', namespace: 'a.test' });
      const { context, page } = await open(browser, harness, [a]);
      const vaultModule = `/@fs${path.join(root, 'src/core/identity/localIdentityVault.ts')}`;
      await page.evaluate(async ({ vaultModule }) => {
        const m = await import(/* @vite-ignore */ vaultModule);
        await m.saveLocalIdentityVault('saved.a.test:8080', new Uint8Array(32).fill(0x77), 'a-long-secret-1');   // a legacy key
      }, { vaultModule });
      a.reset();
      await page.fill('input[type=text]:not([placeholder])', 'nobody');
      const none = await page.locator('[data-gui-node-id$=".mechanism"]').first().innerText().catch(() => '');
      check('10.1 no saved key: it says the derived identity will be used, before signing', /derived from your name and secret/.test(none), none);
      await page.fill('input[type=text]:not([placeholder])', 'saved');
      const saved = await page.locator('[data-gui-node-id$=".mechanism"]').first().innerText().catch(() => '');
      check('10.2 a saved key (even under a legacy spelling): it says that one will be used', /saved key for this name/.test(saved) && !/derived/.test(saved), saved);
      check('10.3 saying it sent nothing', a.count(/POST \/claims\/signIn/) === 0);
      await context.close();
    }

  } finally {
    await browser.close();
    harness.stop();
  }
}

main().then(() => {
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length}`);
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
