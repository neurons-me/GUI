// The identity agent against the REAL monad (monad commit 3aeea66c and later: POST /api/v1/agent/register,
// GET /api/v1/agent/open). Same demo pages as agent.browser.test.mjs (the AGENT, a HOST page, an ATTACKER page --
// three origins), but the verifier is a disposable compiled monad (dist/server.js, real startMonad persistence), not
// the test verifier. Isolated HOME/state, fake seed, loopback only; every request outside the four origins is aborted.
//
//   MONAD_DIR=<monad Typescript dir with a built dist/> node tests/integration/agentMonad.browser.test.mjs
//
// The page does NOT know the person's namespace: it asks to open with an empty query, and the monad finds the
// namespace from the identity that signed. The agent returns (and shows) the namespace the server confirmed.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

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
    cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none' }, stdio: ['ignore', 'pipe', 'pipe'],
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

async function startMonad(agentOrigin) {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-monad-browser-'));
  for (const d of ['home', 'state', 'claims']) fs.mkdirSync(path.join(dir, d));
  const block = path.join(dir, 'block-fetch.mjs');
  fs.writeFileSync(block, "const port=Number(process.env.PORT);const real=globalThis.fetch;globalThis.fetch=(i,o)=>{const u=new URL(typeof i==='string'||i instanceof URL?i:i.url);if(!['127.0.0.1','localhost'].includes(u.hostname)||Number(u.port)!==port)return Promise.reject(new Error('blocked outside fixture: '+u.origin));return real(i,o);};\n");
  const env = {
    PATH: process.env.PATH, HOME: path.join(dir, 'home'), ME_STATE_DIR: path.join(dir, 'state'), MONAD_CLAIM_DIR: path.join(dir, 'claims'),
    MONAD_SELF_CONFIG_PATH: path.join(dir, 'self.json'), ME_NAMESPACE: NS, SEED: 'disposable-agent-browser-seed-not-real',
    MONAD_NETGET_DISABLED: '1', NETGET_LOCAL: 'http://127.0.0.1:9', MONAD_SURFACE_URL: '', PORT: String(port), MONAD_PORT: String(port),
    NODE_OPTIONS: `--import ${block}`, MONAD_AGENT_AUDIENCES: origin, MONAD_AGENT_ORIGINS: agentOrigin,
  };
  const log = fs.openSync(path.join(dir, 'monad.log'), 'a');
  const child = spawn(process.execPath, [path.join(MONAD_DIR, 'dist/server.js')], { cwd: MONAD_DIR, env, stdio: ['ignore', log, log] });
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* gone */ } };
  process.on('exit', stop);
  for (let i = 0; i < 150; i += 1) {
    try { const r = await fetch(`${origin}/__surface`); if (r.ok) return { origin, stop, dir }; } catch { /* not up */ }
    await wait(200);
  }
  stop();
  throw new Error(`monad did not come up; see ${dir}/monad.log`);
}

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

async function main() {
  const [agent, host, attacker] = await Promise.all([startDemo('agent'), startDemo('host'), startDemo('attacker')]);
  const monad = await startMonad(agent.origin);
  const agentUrl = `${agent.origin}/agent.html`;
  const browser = await chromium.launch();
  const outside = [];
  const allowed = [agent.origin, host.origin, attacker.origin, monad.origin];
  const context = await browser.newContext();
  await context.route((u) => !allowed.includes(u.origin), (r) => { outside.push(r.request().url()); r.abort(); });
  console.log(`agent ${agent.origin}  host ${host.origin}  attacker ${attacker.origin}  monad ${monad.origin}\n`);

  const hostReceived = [];
  await context.exposeBinding('__recordMessage', (_src, data) => { hostReceived.push(data); });
  await context.addInitScript(() => { window.addEventListener('message', (e) => { try { window.__recordMessage(JSON.parse(JSON.stringify(e.data))); } catch { /* not cloneable */ } }); });

  try {
    // 1. A NEW identity, created in the agent and registered with the monad: claim + agent key + agent-only.
    const page = await context.newPage();
    const registration = page.waitForResponse((r) => r.url() === `${monad.origin}/api/v1/agent/register`, { timeout: 30000 });
    await page.goto(`${agentUrl}?create=${encodeURIComponent(monad.origin)}&ns=${NS}`);
    await page.click('[data-agent="create"]');
    const regRes = await registration;
    const reg = await regRes.json();
    await page.waitForSelector('[data-agent="created"]', { timeout: 20000 });
    const identityHash = await page.locator('[data-agent="created"]').textContent();
    const shownNamespace = await page.locator('[data-agent="created-namespace"]').textContent();
    await page.close();
    check('1.1 the agent registers a new identity on the monad (201, agent-only)', regRes.status() === 201 && reg.agentOnly === true && reg.identityHash === identityHash, JSON.stringify({ status: regRes.status(), namespace: reg.namespace }));
    const namespace = reg.namespace;
    check('1.2 the identity is a handle under the monad root, and the agent holds that same namespace', typeof namespace === 'string' && namespace.endsWith(`.${NS}`) && shownNamespace === namespace, `${namespace} / agent: ${shownNamespace}`);

    // 2. The host page asks to OPEN that namespace; the agent shows who asks; approve; the page is signed in.
    const query = '[]';   // the page does not know whose namespace it will be
    const hostUrl = `${host.origin}/agentHost.html?agent=${encodeURIComponent(agentUrl)}&resource=${encodeURIComponent(monad.origin)}&ns=${NS}&path=${encodeURIComponent('/api/v1/agent/open')}&query=${encodeURIComponent(query)}`;
    const hostPage = await context.newPage();
    let usedProof = null;
    hostPage.on('request', (r) => { if (r.url().startsWith(`${monad.origin}/api/v1/agent/open`)) usedProof = r.headers()['x-me-proof']; });
    await hostPage.goto(hostUrl);
    const [popup] = await Promise.all([hostPage.waitForEvent('popup'), hostPage.click('[data-host="ask"]')]);
    await popup.waitForSelector('[data-agent="origin"]', { timeout: 15000 });
    const shownOrigin = await popup.locator('[data-agent="origin"]').first().textContent();
    check('2.1 the agent window shows the requesting page origin', (shownOrigin || '').includes(host.origin), shownOrigin);
    await popup.waitForFunction(() => document.querySelectorAll('[data-agent="identity"] option').length > 0, null, { timeout: 10000 });
    await popup.selectOption('[data-agent="identity"]', identityHash);
    await popup.click('[data-agent="approve"]');
    await hostPage.waitForFunction(() => /ok|refused|error|agent:/.test(document.querySelector('[data-host="status"]').textContent), null, { timeout: 20000 });
    const status = await hostPage.locator('[data-host="status"]').textContent();
    const body = JSON.parse((await hostPage.locator('[data-host="result"]').textContent()) || 'null');
    const field = (k) => body?.[k] ?? body?.target?.[k];
    check('2.2 approved: the monad opens the signer\'s namespace for that page (v2), found from the identity', status === 'ok' && field('verified') === true && field('identityHash') === identityHash && (body?.target?.namespace?.me ?? field('namespace')) === namespace, `${status} ${JSON.stringify(body).slice(0, 160)}`);
    const shownToPage = await hostPage.locator('[data-host="identity"]').textContent();
    check('2.3 the page learns who signed in (the claimed namespace) only from the agent\'s answer', shownToPage === namespace, shownToPage);

    // 3. What the page received from the agent: the proof and public identity only.
    const flat = JSON.stringify(hostReceived);
    const results = hostReceived.filter((m) => m && m.type === 'agent.result');
    check('3.1 the page received exactly one result', results.length === 1, String(results.length));
    check('3.2 nothing private crossed to the page (no seed, private key or JWK d)', !/"d":|seed|privateKey|mnemonic/i.test(flat) && results.every((m) => Object.keys(m.identity || {}).sort().join() === 'identityHash,keyId,namespace'), Object.keys(results[0]?.identity || {}).join());

    // 4. The same proof again (replay), and the same proof sent from another page (attacker).
    const replay = await hostPage.evaluate(async ({ url, proof }) => { const r = await fetch(url, { headers: { 'X-Me-Proof': proof } }); return { status: r.status, body: await r.json() }; }, { url: `${monad.origin}/api/v1/agent/open`, proof: usedProof });
    check('4.1 the used proof cannot be used again', replay.status === 401 && (replay.body.error ?? replay.body.target?.error) === 'REPLAY', `${replay.status} ${replay.body.error}`);

    const attackerPage = await context.newPage();
    await attackerPage.goto(`${attacker.origin}/agentHost.html`);
    // A fresh, unused proof for the host page, captured before the host can use it, replayed from the attacker origin.
    const page2 = await context.newPage();
    let captured = null;
    await page2.route(`${monad.origin}/api/v1/agent/open`, (r) => { captured = r.request().headers()['x-me-proof']; r.abort(); });
    await page2.goto(hostUrl);
    const [popup2] = await Promise.all([page2.waitForEvent('popup'), page2.click('[data-host="ask"]')]);
    await popup2.waitForFunction(() => document.querySelectorAll('[data-agent="identity"] option').length > 0, null, { timeout: 15000 });
    await popup2.selectOption('[data-agent="identity"]', identityHash);
    await popup2.click('[data-agent="approve"]');
    for (let i = 0; i < 50 && !captured; i += 1) await wait(200);
    const stolen = await attackerPage.evaluate(async ({ url, proof }) => { const r = await fetch(url, { headers: { 'X-Me-Proof': proof } }); return { status: r.status, body: await r.json() }; }, { url: `${monad.origin}/api/v1/agent/open`, proof: captured });
    check('4.2 an approved proof sent from another page is refused (bound to the requesting origin)', !!captured && stolen.status === 401 && (stolen.body.error ?? stolen.body.target?.error) === 'ORIGIN_MISMATCH', `${stolen.status} ${stolen.body.error}`);

    // 5. Rejecting in the agent sends nothing to the monad.
    const page3 = await context.newPage();
    let reached = false;
    page3.on('request', (r) => { if (r.url().startsWith(`${monad.origin}/api/v1/agent/open`)) reached = true; });
    await page3.goto(hostUrl);
    const [popup3] = await Promise.all([page3.waitForEvent('popup'), page3.click('[data-host="ask"]')]);
    await popup3.waitForSelector('[data-agent="reject"]', { timeout: 15000 });
    await popup3.click('[data-agent="reject"]');
    await page3.waitForFunction(() => /agent:/.test(document.querySelector('[data-host="status"]').textContent), null, { timeout: 15000 });
    check('5.1 rejected in the agent: the page gets "rejected" and nothing reaches the monad', /rejected/.test(await page3.locator('[data-host="status"]').textContent()) && !reached);

    check('6.1 nothing was requested outside the four test origins', outside.length === 0, outside.slice(0, 3).join(' '));
  } finally {
    await browser.close();
    for (const s of [agent, host, attacker, monad]) s.stop();
  }
  console.log(`\n${failed ? `${failed} FAILED` : 'ALL PASS'}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
