// "Connect my .me" end to end (src/agent/connectMe.ts, useMeConnect.ts, AppShell `identityConnect`): a SITE (one origin)
// taps the identity QR in its shell corner (the same QR, no second one), the identity
// agent's window (another origin) asks "<site> wants to know which .me is yours", the person approves, the site gets
// the namespace and a one-time v2 read proof, and opens the namespace on a DISPOSABLE monad (pinned build; MONAD_DIR)
// with GET /api/v1/agent/open. An ATTACKER origin tries to reuse what it can.
//
//   MONAD_DIR=<built monad Typescript dir> node tests/integration/connectMe.browser.test.mjs   (from Typescript/)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// The cleaker's trusted resources (src/agent/cleakerTrust.ts), served by the demo at /cleaker-trust.json from this
// file. The creation link only gives the transport; the audience comes from here.
const TRUST_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cleaker-trust-')), 'cleaker-trust.json');
const writeTrust = (entries) => fs.writeFileSync(TRUST_FILE, JSON.stringify(entries));

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const NS = 'test.local';
const MONAD_DIR = process.env.MONAD_DIR || path.join(os.homedir(), '.get/worktrees/monad-main/Typescript');

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function startDemo(name) {
  const port = await freePort();
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none', CLEAKER_TRUST_FILE: TRUST_FILE }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* gone */ } };
  process.on('exit', stop);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i += 1) {
    try { const r = await fetch(`${origin}/agent.html`); if (r.ok) return { name, origin, stop }; } catch { /* not up */ }
    await wait(200);
  }
  stop();
  throw new Error(`${name} server did not come up`);
}

// Fault injection from outside the monad's code (same mechanism as the monad's own process tests): fs.fsyncSync is
// wrapped and re-exported to ESM importers, checked only when a DIRECTORY is synced (right after the snapshot rename).
// With `<dir>/faults/fail-dir-fsync` present, that sync throws: the new snapshot is installed, its durability unconfirmed.
const FAULTS_PRELOAD = "import fs from 'node:fs';import path from 'node:path';import {syncBuiltinESMExports} from 'node:module';"
  + "const dir=process.env.TEST_FAULT_DIR;const real=fs.fsyncSync;fs.fsyncSync=(fd)=>{if(dir&&fs.fstatSync(fd).isDirectory()&&fs.existsSync(path.join(dir,'fail-dir-fsync'))){throw Object.assign(new Error('EIO: injected'),{code:'EIO'});}return real(fd);};syncBuiltinESMExports();\n";

async function startMonad(agentOrigin, reuse = null) {
  const port = reuse?.port ?? await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const dir = reuse?.dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'agent-monad-browser-'));
  for (const d of ['home', 'state', 'claims', 'faults']) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const block = path.join(dir, 'block-fetch.mjs');
  fs.writeFileSync(block, "const port=Number(process.env.PORT);const real=globalThis.fetch;globalThis.fetch=(i,o)=>{const u=new URL(typeof i==='string'||i instanceof URL?i:i.url);if(!['127.0.0.1','localhost'].includes(u.hostname)||Number(u.port)!==port)return Promise.reject(new Error('blocked outside fixture: '+u.origin));return real(i,o);};\n");
  const faults = path.join(dir, 'faults.mjs');
  fs.writeFileSync(faults, FAULTS_PRELOAD);
  const env = {
    PATH: process.env.PATH, HOME: path.join(dir, 'home'), ME_STATE_DIR: path.join(dir, 'state'), MONAD_CLAIM_DIR: path.join(dir, 'claims'),
    MONAD_SELF_CONFIG_PATH: path.join(dir, 'self.json'), ME_NAMESPACE: NS, SEED: 'disposable-agent-browser-seed-not-real',
    MONAD_NETGET_DISABLED: '1', NETGET_LOCAL: 'http://127.0.0.1:9', MONAD_SURFACE_URL: '', PORT: String(port), MONAD_PORT: String(port),
    NODE_OPTIONS: `--import ${block} --import ${faults}`, MONAD_AGENT_AUDIENCES: origin, MONAD_AGENT_ORIGINS: agentOrigin,
    TEST_FAULT_DIR: path.join(dir, 'faults'),
  };
  const log = fs.openSync(path.join(dir, 'monad.log'), 'a');
  const child = spawn(process.execPath, [path.join(MONAD_DIR, 'dist/server.js')], { cwd: MONAD_DIR, env, stdio: ['ignore', log, log] });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* gone */ } };
  // SIGKILL: no shutdown handler, no second save.
  const kill = () => new Promise((resolve) => { if (child.exitCode !== null || child.signalCode !== null) return resolve(); child.once('exit', resolve); child.kill('SIGKILL'); });
  process.on('exit', stop);
  for (let i = 0; i < 150; i += 1) {
    try { const r = await fetch(`${origin}/__surface`); if (r.ok) return { origin, stop, kill, dir, port, fault: (name, on) => (on ? fs.writeFileSync(path.join(dir, 'faults', name), '') : fs.rmSync(path.join(dir, 'faults', name), { force: true })) }; } catch { /* not up */ }
    await wait(200);
  }
  stop();
  throw new Error(`monad did not come up; see ${dir}/monad.log`);
}


let failed = 0;
let passed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1; else passed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const decodeProof = (p) => { try { const o = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); return { o, f: JSON.parse(o.bytes.slice(o.bytes.indexOf('\n') + 1)) }; } catch { return null; } };

async function main() {
  const [agent, site, attacker] = await Promise.all([startDemo('agent'), startDemo('site'), startDemo('attacker')]);
  const monad = await startMonad(agent.origin);
  writeTrust([{ audience: monad.origin, transports: [monad.origin] }]);
  const agentUrl = `${agent.origin}/agent.html`;
  const openUrl = `${monad.origin}/api/v1/agent/open`;
  const siteUrl = (extra = '') => `${site.origin}/connectMe.html?agent=${encodeURIComponent(agentUrl)}&root=${NS}&audience=${encodeURIComponent(monad.origin)}${extra}`;
  const browser = await chromium.launch();
  const outside = [];
  const allowed = [agent.origin, site.origin, attacker.origin, monad.origin];
  const context = await browser.newContext();
  await context.route((u) => !allowed.includes(u.origin), (r) => { outside.push(r.request().url()); r.abort(); });
  const received = [];   // every message any page of the SITE origin received
  await context.exposeBinding('__recordMessage', (src, data) => { if (new URL(src.frame.url()).origin === site.origin) received.push(data); });
  await context.addInitScript(() => { window.addEventListener('message', (e) => { try { window.__recordMessage(JSON.parse(JSON.stringify(e.data))); } catch { /* not cloneable */ } }); });
  const bodies = [];
  context.on('request', (r) => { const b = r.postData(); if (b) bodies.push(b); });
  console.log(`agent ${agent.origin}  site ${site.origin}  attacker ${attacker.origin}  monad ${monad.origin}\n`);

  const QR = '[data-gui-node-id="GUI.window.layout.marks.identity"][data-me-connect]';   // the shell's corner QR
  const WHO = '[data-gui-node-id="GUI.window.layout.marks.identity.text"]';               // the text beside it
  const tap = async (page) => {
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.click(QR)]);
    await popup.waitForSelector('[data-agent="origin"]', { timeout: 15000 });
    return popup;
  };
  const approve = async (popup, identityHash) => {
    await popup.waitForFunction(() => document.querySelectorAll('[data-agent="identity"] option').length > 0, null, { timeout: 10000 });
    await popup.selectOption('[data-agent="identity"]', identityHash);
    await popup.click('[data-agent="approve"]');
  };
  const siteState = (page, kind) => page.waitForSelector(`[data-me-connect="${kind}"]`, { timeout: 20000 }).then(() => true, () => false);
  const statusText = (page) => page.locator(WHO).textContent();
  const whoLines = (page) => page.locator(`${WHO} > span`).allTextContents();

  try {
    // 0. A new identity in the agent, registered on the monad.
    const page0 = await context.newPage();
    const registration = page0.waitForResponse((r) => r.url() === `${monad.origin}/api/v1/agent/register`, { timeout: 30000 });
    await page0.goto(`${agentUrl}?create=${encodeURIComponent(monad.origin)}&ns=${NS}`);
    await page0.click('[data-agent="create"]');
    const reg = await (await registration).json();
    await page0.waitForSelector('[data-agent="created"]', { timeout: 20000 });
    const identityHash = await page0.locator('[data-agent="created"]').textContent();
    await page0.close();
    const namespace = reg.namespace;
    check('0.1 an identity exists in the agent, registered on the monad', reg.identityHash === identityHash && namespace?.endsWith(`.${NS}`), namespace);

    // 1. Tap the QR.me, approve, connected.
    const page = await context.newPage();
    const opens = [];
    page.on('request', (r) => { if (r.url().startsWith(openUrl)) opens.push(r.headers()['x-me-proof']); });
    await page.goto(siteUrl());
    await page.waitForSelector('[data-me-connect="idle"]');
    check('1.1 before connecting, the corner QR carries only the public root', (await page.locator(QR).getAttribute('data-qr-value')) === `https://${NS}`);
    check('1.1b ... and the corner text is the site\'s own (demo / root), no .me yet', (await whoLines(page)).slice(0, 2).join(' / ') === `demo / ${NS}`, (await whoLines(page)).join(' / '));
    const popup = await tap(page);
    check('1.2 the approval opens in its own window at the agent origin', new URL(popup.url()).origin === agent.origin && new URL(popup.url()).origin !== site.origin);
    const title = await popup.locator('[data-agent="connect-title"]').textContent();
    check('1.3 it says "<site> wants to know which .me is yours"', title === `${site.origin} wants to know which .me is yours`, title);
    const explain = await popup.locator('[data-agent="connect-explain"]').textContent();
    check('1.4 it says what the site gets: the name and a one-time proof, only at the monad, never the key', explain.includes(monad.origin) && explain.includes('never receives your key'), explain);
    check('1.5 nothing reached the monad before the approval', opens.length === 0);
    await approve(popup, identityHash);
    const ok1 = await siteState(page, 'connected');
    const [label, ...rest] = namespace.split('.');
    check('1.6 approved: the site is connected to that .me (the monad opened it); the corner text shows it, not the demo name', ok1 && (await whoLines(page)).slice(0, 2).join(' / ') === `${label} / ${rest.join('.')}` && (await page.locator(QR).getAttribute('title')) === `your .me: ${namespace}`, (await whoLines(page)).join(' / '));
    check('1.7 after connecting, the corner QR carries only the public namespace address', (await page.locator(QR).getAttribute('data-qr-value')) === `https://${namespace}`);
    const used = opens[0];
    const d1 = used && decodeProof(used);
    check('1.8 the proof is a v2 READ bound to the site origin, the monad audience, GET /api/v1/agent/open with no query, an expiry and a nonce',
      !!d1 && d1.o.bytes.startsWith('me-proof/2\n') && d1.f.op === 'read' && d1.f.origin === site.origin && d1.f.audience === monad.origin
      && d1.f.method === 'GET' && d1.f.path === '/api/v1/agent/open' && d1.f.query === '[]' && d1.f.expiresAt - d1.f.issuedAt === 60000 && typeof d1.f.nonce === 'string' && d1.f.nonce.length >= 16,
      d1 ? JSON.stringify({ op: d1.f.op, origin: d1.f.origin, audience: d1.f.audience, path: d1.f.path }) : 'no proof');
    const results = received.filter((m) => m?.type === 'agent.result');
    check('1.9 the site received exactly one answer: {proof, identity(namespace, identityHash, keyId)}', results.length === 1 && results[0].ok === true
      && Object.keys(results[0]).sort().join() === 'id,identity,ok,proof,protocol,type' && Object.keys(results[0].identity).sort().join() === 'identityHash,keyId,namespace' && results[0].identity.namespace === namespace);
    const flat = JSON.stringify(received);
    check('1.10 no key, seed or secret reached the site; no keys listing either', !/"d"\s*:|privateKey|seed|mnemonic|secret|"keys"/i.test(flat));

    // 2. Replay: the same proof again (from the same site) is refused.
    const replay = await page.evaluate(async ({ url, proof }) => { const r = await fetch(url, { headers: { 'X-Me-Proof': proof } }); return { status: r.status, body: await r.json() }; }, { url: openUrl, proof: used });
    check('2.1 replaying the used proof is refused (REPLAY)', replay.status === 401 && (replay.body.error ?? replay.body.target?.error) === 'REPLAY', `${replay.status} ${replay.body.error ?? replay.body.target?.error}`);

    // 1b. Connected, the same QR opens its menu (no new window); its Sign out disconnects.
    let popups = 0;
    const countPopup = () => { popups += 1; };
    page.on('popup', countPopup);
    await page.click(QR);
    const logout = page.locator('[data-gui-node-id="GUI.window.layout.marks.identity.menu.logout"]');
    const menuOk = await logout.waitFor({ timeout: 5000 }).then(() => true, () => false);
    check('1.11 connected: tapping the same QR opens its menu (showing that .me), not another approval window', menuOk && popups === 0);
    await logout.click();
    const back = await siteState(page, 'idle');
    check('1.12 Sign out in that menu disconnects: the QR is back to the root, the corner text to the site\'s own', back && (await page.locator(QR).getAttribute('data-qr-value')) === `https://${NS}` && (await whoLines(page))[0] === 'demo', (await whoLines(page)).join(' / '));
    page.off('popup', countPopup);
    await page.close();

    // A proof the site never used: the site's own call to the monad is held back.
    const capture = async (extra = '') => {
      const p = await context.newPage();
      let proof = null;
      await p.route(`${openUrl}*`, (r) => { proof = r.request().headers()['x-me-proof']; r.abort(); });
      await p.goto(siteUrl(extra));
      await approve(await tap(p), identityHash);
      await siteState(p, 'refused');
      await p.unroute(`${openUrl}*`);
      return { p, proof };
    };
    const send = (p, proof, url = openUrl) => p.evaluate(async ({ url, proof }) => { const r = await fetch(url, { headers: { 'X-Me-Proof': proof } }); return { status: r.status, body: await r.json() }; }, { url, proof });
    const err = (r) => r.body?.error ?? r.body?.target?.error;

    // 3. Another page origin with a captured proof.
    {
      const { p, proof } = await capture();
      const ap = await context.newPage();
      await ap.goto(`${attacker.origin}/connectMe.html`);
      const stolen = await send(ap, proof);
      check('3.1 a proof used from a page origin that is not the bound one is refused (ORIGIN_MISMATCH)', !!proof && stolen.status === 401 && err(stolen) === 'ORIGIN_MISMATCH', `${stolen.status} ${err(stolen)}`);
      // 4. Tamper: change the signed bytes, or the request the proof covers.
      const d = decodeProof(proof);
      const forged = { ...d.o, bytes: d.o.bytes.replace(`"expiresAt":${d.f.expiresAt}`, `"expiresAt":${d.f.expiresAt + 1000}`) };
      const t1 = await send(p, Buffer.from(JSON.stringify(forged)).toString('base64url'));
      check('4.1 tampered signed bytes are refused (signature)', t1.status === 401 && /SIGNATURE/.test(String(err(t1))), `${t1.status} ${err(t1)}`);
      const t2 = await send(p, proof, `${openUrl}?namespace=${encodeURIComponent(namespace)}`);
      check('4.2 the same proof for another request (a query it did not cover) is refused', t2.status === 401 && err(t2) === 'QUERY_MISMATCH', `${t2.status} ${err(t2)}`);
      const t3 = await send(p, proof);
      check('4.3 ... and those refusals did not use it up: the untouched proof still opens once, from the bound origin', t3.status === 200, `${t3.status} ${err(t3)}`);
      await ap.close(); await p.close();
    }

    // 5. Swap: the page sends a second, different request with the same id after the agent shows the first.
    {
      const p = await context.newPage();
      await p.goto(`${site.origin}/connectMe.html`);
      const [popup5] = await Promise.all([
        p.waitForEvent('popup'),
        p.evaluate(({ url, ns, a, b }) => {
          const w = window.open(url, 'swap');
          const id = 'c'.repeat(32);
          const op = (aud) => ({ action: 'read', namespace: ns, audience: aud, method: 'GET', path: '/api/v1/agent/open', query: '[]', ttlMs: 60000 });
          window.__got = null;
          window.addEventListener('message', (e) => {
            if (e.source !== w) return;
            if (e.data?.type === 'agent.ready') { w.postMessage({ protocol: 'me-agent/1', type: 'agent.request', id, operation: op(a) }, new URL(url).origin); setTimeout(() => w.postMessage({ protocol: 'me-agent/1', type: 'agent.request', id, operation: op(b) }, new URL(url).origin), 800); }
            if (e.data?.type === 'agent.result') window.__got = e.data;
          });
        }, { url: agentUrl, ns: NS, a: monad.origin, b: attacker.origin }),
      ]);
      await popup5.waitForSelector('[data-agent="connect-title"]', { timeout: 10000 });
      await wait(1500);
      const shownRes = await popup5.locator('[data-agent="field-resource"]').textContent();
      await approve(popup5, identityHash);
      await p.waitForFunction(() => window.__got, null, { timeout: 10000 });
      const got = await p.evaluate(() => window.__got);
      const dg = got?.proof && decodeProof(got.proof);
      check('5.1 a request swapped after it is shown is ignored: the screen and the signature are the first request', shownRes.startsWith(monad.origin) && dg?.f.audience === monad.origin, `${shownRes} / ${dg?.f.audience}`);
      await p.close();
    }

    // 6. Wrong audience: the site asks for a proof for another audience and sends it to the monad.
    {
      const p = await context.newPage();
      await p.goto(`${site.origin}/connectMe.html?agent=${encodeURIComponent(agentUrl)}&root=${NS}&audience=${encodeURIComponent(attacker.origin)}&monad=${encodeURIComponent(monad.origin)}`);
      const pp = await tap(p);
      check('6.1 the agent shows the audience the proof is for', (await pp.locator('[data-agent="connect-explain"]').textContent()).includes(attacker.origin));
      await approve(pp, identityHash);
      await siteState(p, 'refused');
      check('6.2 a proof for another audience is refused by the monad (WRONG_AUDIENCE); the site is not connected', /WRONG_AUDIENCE/.test(await statusText(p)), await statusText(p));
      await p.close();
    }

    // 7. Expiry: the proof arrives after it expired.
    {
      const p = await context.newPage();
      await p.goto(siteUrl('&ttl=5000&delayMs=6500'));
      await approve(await tap(p), identityHash);
      await siteState(p, 'refused');
      check('7.1 an expired proof is refused (EXPIRED); the site is not connected', /EXPIRED/.test(await statusText(p)), await statusText(p));
      await p.close();
    }

    // 8. Reject / close: nothing is signed, nothing reaches the monad.
    {
      const p = await context.newPage();
      let reached = false;
      p.on('request', (r) => { if (r.url().startsWith(openUrl)) reached = true; });
      await p.goto(siteUrl());
      const pp = await tap(p);
      await pp.click('[data-agent="reject"]');
      await siteState(p, 'refused');
      check('8.1 rejected: the site says so and nothing reached the monad', /did not approve/.test(await statusText(p)) && !reached, await statusText(p));
      const pp2 = await tap(p);
      await pp2.close();
      await p.waitForFunction((sel) => /window was closed/.test(document.querySelector(sel)?.textContent || ''), WHO, { timeout: 5000 }).catch(() => {});
      check('8.2 closing the window: not connected, nothing reached the monad', /window was closed/.test(await statusText(p)) && !reached, await statusText(p));
      check('8.3 rejected or closed, the corner QR stays on the root and the text on the site\'s own', (await p.locator(QR).getAttribute('data-qr-value')) === `https://${NS}` && (await p.locator(QR).getAttribute('data-me-connect')) === 'refused' && (await whoLines(p))[0] === 'demo');
      await p.close();
    }

    // 9. What went on the network.
    check('9.1 no request body carried a seed, a private key or a JWK d', bodies.every((b) => !/pendingSeed|privateKey|"d"\s*:|mnemonic/i.test(b)), `${bodies.length} bodies`);
    check('9.2 nothing was requested outside the four test origins', outside.length === 0, outside.slice(0, 3).join(' '));
  } finally {
    await browser.close();
    [agent, site, attacker].forEach((s) => s.stop());
    monad.stop();
  }
  console.log(failed ? `\n${passed} passed, ${failed} failed` : `\n${passed} passed, no failures`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
