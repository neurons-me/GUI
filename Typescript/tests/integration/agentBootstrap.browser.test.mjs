// The identity agent signs an ADMITTED WRITE: the netget gateway bootstrap (Agent-Protocol.md section 3a), with visible
// approval only. Four origins on loopback: the AGENT, a HOST page (stands in for netget's UI), a disposable REAL monad
// (only to register the identity: claim + agent key + agent-only) and a MOCK authority
// (tests/integration/agentBootstrapMock.mjs: netget's challenge + the monad's v2 bootstrap; the real monad and netget
// do not accept a v2 bootstrap yet and are not touched here). Every request outside those origins is aborted.
//
//   MONAD_DIR=<monad Typescript dir with a built dist/> node tests/integration/agentBootstrap.browser.test.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startBootstrapMock } from './agentBootstrapMock.mjs';

// The cleaker's trusted resources (src/agent/cleakerTrust.ts), served by the demo at /cleaker-trust.json from this
// file. The creation link only gives the transport; the audience comes from here.
const TRUST_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cleaker-trust-')), 'cleaker-trust.json');
const writeTrust = (entries) => fs.writeFileSync(TRUST_FILE, JSON.stringify(entries));

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const NS = 'test.local';
const MONAD_DIR = process.env.MONAD_DIR || path.join(os.homedir(), '.get/worktrees/monad-main/Typescript');
const INSTALL_CODE = 'install-code-for-this-test-only';
const LABEL = 'Sign in to netget (harmless)';

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

async function startMonad(agentOrigin) {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-bootstrap-monad-'));
  for (const d of ['home', 'state', 'claims']) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const block = path.join(dir, 'block-fetch.mjs');
  fs.writeFileSync(block, "const port=Number(process.env.PORT);const real=globalThis.fetch;globalThis.fetch=(i,o)=>{const u=new URL(typeof i==='string'||i instanceof URL?i:i.url);if(!['127.0.0.1','localhost'].includes(u.hostname)||Number(u.port)!==port)return Promise.reject(new Error('blocked outside fixture: '+u.origin));return real(i,o);};\n");
  const env = {
    PATH: process.env.PATH, HOME: path.join(dir, 'home'), ME_STATE_DIR: path.join(dir, 'state'), MONAD_CLAIM_DIR: path.join(dir, 'claims'),
    MONAD_SELF_CONFIG_PATH: path.join(dir, 'self.json'), ME_NAMESPACE: NS, SEED: 'disposable-agent-bootstrap-seed-not-real',
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
let passed = 0;
const check = (name, ok, detail = '') => {
  if (ok) passed += 1; else failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const decodeProof = (p) => { try { return JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); } catch { return null; } };

async function main() {
  const [agent, host] = await Promise.all([startDemo('agent'), startDemo('host')]);
  const monad = await startMonad(agent.origin);
  writeTrust([{ audience: monad.origin, transports: [monad.origin] }]);
  const mock = await startBootstrapMock({ hostOrigins: [host.origin], installCode: INSTALL_CODE });
  const agentUrl = `${agent.origin}/agent.html`;
  const browser = await chromium.launch();
  const outside = [];
  const allowed = [agent.origin, host.origin, monad.origin, mock.origin];
  const context = await browser.newContext();
  await context.route((u) => !allowed.includes(u.origin), (r) => { outside.push(r.request().url()); r.abort(); });
  console.log(`agent ${agent.origin}  host ${host.origin}  monad(real, registration) ${monad.origin}  mock authority ${mock.origin}\n`);

  const received = [];   // every message any page received
  await context.exposeBinding('__recordMessage', (src, data) => { received.push({ at: src.page.url(), data }); });
  await context.addInitScript(() => { window.addEventListener('message', (e) => { try { window.__recordMessage(JSON.parse(JSON.stringify(e.data))); } catch { /* not cloneable */ } }); });
  const results = () => received.filter((m) => m.data?.type === 'agent.result');
  const bootstrapRequests = () => mock.requests.filter((r) => r.path.endsWith('/bootstrap'));

  try {
    // 0. A NEW identity in the agent, registered with the REAL monad (agent-only). Its agent public key is read from
    //    the registration statement and given to the MOCK authority (its key registry).
    const page = await context.newPage();
    let statementBytes = null;
    page.on('request', (r) => { if (r.url() === `${monad.origin}/api/v1/agent/register`) { try { statementBytes = JSON.parse(r.postData()).statement.bytes; } catch { /* checked below */ } } });
    const registration = page.waitForResponse((r) => r.url() === `${monad.origin}/api/v1/agent/register`, { timeout: 30000 });
    await page.goto(`${agentUrl}?create=${encodeURIComponent(monad.origin)}&ns=${NS}`);
    await page.click('[data-agent="create"]');
    const regRes = await registration;
    const reg = await regRes.json();
    await page.waitForSelector('[data-agent="created"]', { timeout: 20000 });
    await page.close();
    const statement = JSON.parse(String(statementBytes).slice('me-proof/2\n'.length));
    mock.addKey(reg.identityHash, statement.keyId, statement.agentKey);
    check('0.1 the identity is registered on the real monad (201, agent-only)', regRes.status() === 201 && reg.agentOnly === true, reg.namespace);
    const identityHash = reg.identityHash;

    const hostUrl = (extra) => `${host.origin}/agentHost.html?mode=bootstrap&agent=${encodeURIComponent(agentUrl)}&resource=${encodeURIComponent(mock.origin)}&ns=${NS}&code=${INSTALL_CODE}&${extra}`;
    const open = async (extra) => {
      const hostPage = await context.newPage();
      await hostPage.goto(hostUrl(extra));
      const [popup] = await Promise.all([hostPage.waitForEvent('popup'), hostPage.click('[data-host="ask"]')]);
      return { hostPage, popup };
    };
    const hostStatus = async (hostPage) => {
      await hostPage.waitForFunction(() => /^(ok|refused|error|agent:)/.test(document.querySelector('[data-host="status"]').textContent), null, { timeout: 20000 });
      return hostPage.locator('[data-host="status"]').textContent();
    };

    // 1. The app asks to bootstrap gw-alpha and calls it "Sign in". The agent shows ITS OWN words.
    const r0 = results().length;
    const { hostPage, popup } = await open(`gateway=gw-alpha&label=${encodeURIComponent(LABEL)}`);
    await popup.waitForSelector('[data-agent="field-operation"]', { timeout: 15000 });
    const shown = await popup.locator('[data-agent="field-operation"]').textContent();
    const pageText = await popup.locator('body').innerText();
    check('1.1 the agent names the operation from its own table: "Claim gateway gw-alpha"', shown === 'Claim gateway gw-alpha', shown);
    check('1.2 the app\'s misleading label appears nowhere in the agent window', !pageText.includes(LABEL) && !/sign in/i.test(pageText), LABEL);
    check('1.3 the requesting origin is the one the browser reported', (await popup.locator('[data-agent="origin"]').textContent()) === host.origin);
    const ownerSentence = await popup.locator('[data-agent="effect-makesYouOwner"]').textContent();
    check('1.4 the effect is computed by the agent\'s rules ("you become the owner")', /owner/.test(ownerSentence) && ownerSentence.includes('gw-alpha') && ownerSentence.includes(mock.origin), ownerSentence);
    check('1.5 nothing is given to another identity (rule: request.hasTarget = false)', (await popup.locator('[data-agent="effect-givesControlAway"]').getAttribute('data-value')) === 'false');
    const trace = await popup.locator('[data-agent="trace-makesYouOwner"]').textContent();
    check('1.6 the me.explain() trace names the exact request facts', trace.includes('request.claimsGateway = true') && trace.includes('request.hasTarget = false'), trace);
    check('1.7 the screen says the authority decides (install code, owner, key)', (await popup.locator('[data-agent="server-decides"] li').count()) === 4);

    // 2. No auto-sign: nothing is signed or sent without the click.
    await wait(2500);
    check('2.1 no signature without a click (no result to the app, nothing at the authority)', results().length === r0 && bootstrapRequests().length === 0);

    // 3. Nothing secret in storage: the temporary kernel wrote nothing, no this.me.seed:v1; only the agent's key store exists.
    const agentStorage = await popup.evaluate(async () => ({
      ls: Object.keys(localStorage), seed: localStorage.getItem('this.me.seed:v1'), ss: Object.keys(sessionStorage),
      dbs: (await indexedDB.databases()).map((d) => d.name),
    }));
    check('3.1 the agent origin: localStorage and sessionStorage empty, no this.me.seed:v1', agentStorage.ls.length === 0 && agentStorage.ss.length === 0 && agentStorage.seed === null, JSON.stringify(agentStorage));
    check('3.2 the agent origin: IndexedDB holds only the agent key store (me-agent)', agentStorage.dbs.length === 1 && agentStorage.dbs[0] === 'me-agent', agentStorage.dbs.join(','));

    // 4. Approve: the app gets only {bytes, signature} + public identity; the authority verifies and authorizes.
    await popup.selectOption('[data-agent="identity"]', identityHash);
    await popup.click('[data-agent="approve"]');
    const status = await hostStatus(hostPage);
    const result = results().slice(r0).find((m) => m.at.startsWith(host.origin))?.data;
    check('4.1 approved: the mock authority verified the v2 call and recorded the owner', status === 'ok' && mock.owners.get('gw-alpha')?.identityHash === identityHash, status);
    check('4.2 the app received exactly one result', results().slice(r0).filter((m) => m.at.startsWith(host.origin)).length === 1);
    const proof = decodeProof(result?.proof);
    check('4.3 the result is {protocol,type,id,ok,proof,identity}; the proof is {bytes,signature}; identity is public fields only',
      result && Object.keys(result).sort().join() === 'id,identity,ok,proof,protocol,type' && proof && Object.keys(proof).sort().join() === 'bytes,signature'
      && Object.keys(result.identity).sort().join() === 'identityHash,keyId,namespace', JSON.stringify(Object.keys(result || {})));
    const everything = JSON.stringify(received.map((m) => m.data)) + JSON.stringify(mock.requests);
    check('4.4 no key material reached the app or the authority (no JWK d, private key, seed, explain)', !/"d"\s*:|privateKey|pendingSeed|seed|"explain"/i.test(everything.replace(/disposable-agent-bootstrap-seed-not-real/g, '')));
    const signed = JSON.parse(proof.bytes.slice('me-proof/2\n'.length));
    check('4.5 the signed bytes are a v2 call for exactly that operation', signed.op === 'call' && signed.kind === 'netget.gateway.bootstrap' && signed.path === '/api/v1/gateway/gw-alpha/bootstrap'
      && signed.origin === host.origin && signed.audience === mock.origin && signed.namespace === reg.namespace, proof.bytes.slice(0, 120));
    const hostStorage = await hostPage.evaluate(async () => ({ ls: Object.keys(localStorage), dbs: (await indexedDB.databases()).map((d) => d.name) }));
    check('4.6 the app origin stored nothing (no localStorage, no IndexedDB)', hostStorage.ls.length === 0 && hostStorage.dbs.length === 0, JSON.stringify(hostStorage));

    // 5. The same proof again: refused (replay). An explanation in the body does not authorize anything.
    const used = bootstrapRequests().find((r) => r.path.endsWith('/gw-alpha/bootstrap'));
    const replay = await fetch(`${mock.origin}/api/v1/gateway/gw-alpha/bootstrap`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-me-proof': used.proof, origin: host.origin }, body: used.body });
    check('5.1 replaying the used proof is refused', replay.status === 401 && (await replay.json()).error === 'REPLAY');
    const withExplain = JSON.stringify({ challenge: JSON.parse(used.body).challenge, explain: { path: 'effect.makesYouOwner', value: true }, gatewayId: 'gw-alpha' });
    const ex1 = await fetch(`${mock.origin}/api/v1/gateway/gw-alpha/bootstrap`, { method: 'POST', headers: { 'content-type': 'application/json', origin: host.origin }, body: withExplain });
    check('5.2 an explain() result without a proof authorizes nothing', ex1.status === 401 && (await ex1.json()).error === 'PROOF_MISSING');
    const ex2 = await fetch(`${mock.origin}/api/v1/gateway/gw-beta/bootstrap`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-me-proof': used.proof, origin: host.origin }, body: withExplain });
    check('5.3 a real proof + an explanation for another body/path is refused', ex2.status === 401, String(ex2.status));
    await hostPage.close();

    // 6. The app swaps the request after it was shown (gw-gamma -> gw-delta, same request id).
    const r6 = results().length;
    const swap = await open('gateway=gw-gamma&alter=gw-delta&alterMs=3000');
    await swap.popup.waitForSelector('[data-agent="field-operation"]', { timeout: 15000 });
    const first = await swap.popup.locator('[data-agent="field-operation"]').textContent();
    // Keep the form the person was looking at, to try to approve the OLD request after the swap.
    await swap.popup.evaluate(() => { window.__oldForm = document.querySelector('[data-agent="form"]'); });
    await swap.popup.waitForSelector('[data-agent="changed"]', { timeout: 15000 });
    const second = await swap.popup.locator('[data-agent="field-operation"]').textContent();
    check('6.1 the agent shows the NEW request, marked as changed', first === 'Claim gateway gw-gamma' && second === 'Claim gateway gw-delta', `${first} -> ${second}`);
    const disabledRightAfter = await swap.popup.locator('[data-agent="approve"]').isDisabled();
    check('6.2 Approve is held after a change (no click-through)', disabledRightAfter);
    await swap.popup.evaluate(() => { window.__oldForm.dispatchEvent(new Event('submit', { cancelable: true })); });
    await swap.popup.waitForSelector('[data-agent="invalidated"]', { timeout: 5000 });
    await wait(500);
    check('6.3 approving the OLD request after the change signs nothing (approval invalidated)', results().length === r6 && bootstrapRequests().filter((r) => r.path.includes('gw-gamma') || r.path.includes('gw-delta')).length === 0);
    await swap.popup.selectOption('[data-agent="identity"]', identityHash);
    await swap.popup.click('[data-agent="approve"]');   // waits until it is enabled again
    const swapStatus = await hostStatus(swap.hostPage);
    const swapBytes = await swap.hostPage.locator('[data-host="proof-bytes"]').textContent();
    check('6.4 re-approved: the signature is for gw-delta only, never gw-gamma', swapStatus === 'ok' && swapBytes.includes('/gateway/gw-delta/') && !swapBytes.includes('gw-gamma'), swapStatus);
    check('6.5 the authority recorded gw-delta, and gw-gamma has no owner', mock.owners.get('gw-delta')?.identityHash === identityHash && !mock.owners.has('gw-gamma'));
    await swap.hostPage.close();

    // 7. Refused before anything is shown or signed.
    const r7 = results().length;
    const unknown = await open('gateway=gw-epsilon&kind=netget.gateway.transfer');
    await unknown.popup.waitForSelector('[data-agent="refused"]', { timeout: 15000 }).catch(() => null);
    const unknownStatus = await hostStatus(unknown.hostPage);
    check('7.1 an operation that is not admitted is refused (agent: invalid, nothing signed)', unknownStatus === 'agent: invalid' && !results().slice(r7).some((m) => m.data.ok), unknownStatus);
    await unknown.hostPage.close();
    const badHash = await open('gateway=gw-zeta&badHash=1');
    await badHash.popup.waitForSelector('[data-agent="refused"]', { timeout: 15000 }).catch(() => null);
    const badHashStatus = await hostStatus(badHash.hostPage);
    check('7.2 a bodyHash that does not match the body is refused (agent: invalid, nothing signed)', badHashStatus === 'agent: invalid' && !results().slice(r7).some((m) => m.data.ok), badHashStatus);
    await badHash.hostPage.close();
    check('7.3 nothing reached the authority for 7.1-7.2', !bootstrapRequests().some((r) => r.path.includes('gw-epsilon') || r.path.includes('gw-zeta')));

    // 8. Reject: the app gets "rejected", nothing is sent.
    const rej = await open('gateway=gw-eta');
    await rej.popup.waitForSelector('[data-agent="reject"]', { timeout: 15000 });
    await rej.popup.click('[data-agent="reject"]');
    const rejStatus = await hostStatus(rej.hostPage);
    check('8.1 rejected in the agent: the app gets "rejected", nothing reaches the authority', rejStatus === 'agent: rejected' && !mock.owners.has('gw-eta') && !bootstrapRequests().some((r) => r.path.includes('gw-eta')), rejStatus);
    await rej.hostPage.close();

    check('9.1 nothing was requested outside the four test origins', outside.length === 0, outside.join(' '));
    console.log(`\nmock authority outcomes: ${mock.outcomes.join(', ')}`);
  } finally {
    await browser.close();
    await mock.close();
    monad.stop();
    agent.stop();
    host.stop();
  }
  console.log(`\n${failed ? `${failed} FAILED, ${passed} passed` : `ALL PASS (${passed})`}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
