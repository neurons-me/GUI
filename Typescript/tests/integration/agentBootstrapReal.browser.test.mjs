// The netget gateway bootstrap approved in the identity agent, against the REAL netget and a REAL compiled monad
// (Agent-Bootstrap-Server-Path.md): no mock authority. Four origins on loopback: the AGENT page, the HOST page (stands
// in for netget's setup page), netget's backend (in-process in the rig, real /setup/* routes) and netget's own monad
// (started by netget itself on a reserved port). Every browser request outside those origins is aborted.
//
// The rig is netget's own test fixture (tests/fixtures/agentBootstrapRig.ts in the netget tree): it opens setup sessions
// (install codes), reports the authority record, netget's cache and the installation authorization, and restarts the
// monad. All of it is disposable: its own data dir, monad name and state, deleted at the end.
//
//   NETGET_DIR=<netget Typescript dir> node tests/integration/agentBootstrapReal.browser.test.mjs
//   (netget's node_modules/monad.ai must resolve to a monad with the v2 bootstrap branch, built)
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
const NETGET_DIR = process.env.NETGET_DIR || path.join(os.homedir(), '.get/worktrees/netget-agent-bootstrap/Typescript');
const LABEL = 'Sign in to netget (harmless)';
const GW = 'gw-real.local';

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

async function startRig(agentOrigin, hostOrigin) {
  const child = spawn(path.join(NETGET_DIR, 'node_modules/.bin/tsx'), ['tests/fixtures/agentBootstrapRig.ts'], {
    cwd: NETGET_DIR, env: { PATH: process.env.PATH, HOME: process.env.HOME, AGENT_ORIGIN: agentOrigin, HOST_ORIGIN: hostOrigin }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let errText = '';
  child.stderr.on('data', (d) => { errText += String(d); });
  const stop = () => new Promise((resolve) => { if (child.exitCode !== null) return resolve(); child.once('exit', resolve); child.kill('SIGTERM'); setTimeout(resolve, 8000); });
  process.on('exit', () => { try { child.kill('SIGTERM'); } catch { /* gone */ } });
  const info = await new Promise((resolve, reject) => {
    let out = '';
    child.stdout.on('data', (d) => {
      out += String(d);
      const m = out.match(/^RIG (\{.*\})$/m);
      if (m) resolve(JSON.parse(m[1]));
    });
    child.once('exit', (code) => reject(new Error(`rig exited ${code}: ${errText.slice(-2000)}`)));
    setTimeout(() => reject(new Error(`rig did not start: ${errText.slice(-2000)}`)), 60000);
  });
  const call = async (method, p, body) => {
    const r = await fetch(`${info.netget}/__rig${p}`, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    return r.json();
  };
  return { ...info, stop, call };
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
  const rig = await startRig(agent.origin, host.origin);
  // The registration goes to the rig's loopback monad (transport); it is FOR the public audience (configured).
  writeTrust([{ audience: rig.audience, transports: [rig.monad] }]);
  const agentUrl = `${agent.origin}/agent.html`;
  const browser = await chromium.launch();
  const outside = [];
  const allowed = [agent.origin, host.origin, rig.netget, rig.monad];
  const context = await browser.newContext();
  await context.route((u) => !allowed.includes(u.origin), (r) => { outside.push(r.request().url()); r.abort(); });
  console.log(`agent ${agent.origin}  host ${host.origin}  netget(real) ${rig.netget}  monad(real) ${rig.monad}  root ${rig.root}\n`);

  const received = [];
  await context.exposeBinding('__recordMessage', (src, data) => { received.push({ at: src.page.url(), data }); });
  await context.addInitScript(() => { window.addEventListener('message', (e) => { try { window.__recordMessage(JSON.parse(JSON.stringify(e.data))); } catch { /* not cloneable */ } }); });
  const results = () => received.filter((m) => m.data?.type === 'agent.result');
  const netgetCalls = [];
  context.on('request', (r) => { if (r.url().startsWith(rig.netget)) netgetCalls.push({ url: r.url(), body: r.postData() }); });
  const state = () => rig.call('GET', `/state?gatewayId=${encodeURIComponent(GW)}`);
  const unchanged = async (label) => {
    const s = await state();
    check(`${label}: authority unchanged (no owner) and netget's cache has no owner`, s.authorityStatus === 200 && s.authority === null && !s.cache?.owner, JSON.stringify({ a: s.authority, c: s.cache?.owner ?? null }));
    return s;
  };

  try {
    // 0. A NEW identity in the agent, registered with netget's REAL monad (agent-only).
    const page = await context.newPage();
    const registration = page.waitForResponse((r) => r.url() === `${rig.monad}/api/v1/agent/register`, { timeout: 30000 });
    await page.goto(`${agentUrl}?create=${encodeURIComponent(rig.monad)}&ns=${rig.root}`);
    await page.click('[data-agent="create"]');
    const regRes = await registration;
    const reg = await regRes.json();
    await page.waitForSelector('[data-agent="created"]', { timeout: 20000 });
    await page.close();
    check('0.1 a new identity is created in the agent and registered on netget\'s monad (201, agent-only)', regRes.status() === 201 && reg.agentOnly === true, reg.namespace);
    // The link named only the transport (the loopback monad); the registration is FOR the configured public audience.
    const regStatement = JSON.parse(regRes.request().postData() || '{}')?.statement?.bytes || '';
    const regFields = (() => { try { return JSON.parse(regStatement.slice(regStatement.indexOf('\n') + 1)); } catch { return {}; } })();
    check('0.1b the registration was sent to the transport but its audience is the configured one, not the link\'s address', regFields.audience === rig.audience && regFields.audience !== rig.monad, String(regFields.audience));
    const identityHash = reg.identityHash;
    await unchanged('0.2 before anything');

    const hostUrl = (code, extra = '') => `${host.origin}/agentHost.html?mode=netget&agent=${encodeURIComponent(agentUrl)}&netget=${encodeURIComponent(rig.netget)}&ns=${rig.root}&code=${code}${extra ? `&${extra}` : ''}`;
    const open = async (extra = '', ttlMs) => {
      const { code } = await rig.call('POST', '/session', { gatewayId: GW, ...(ttlMs ? { ttlMs } : {}) });
      const hostPage = await context.newPage();
      await hostPage.goto(hostUrl(code, extra));
      const popupEvent = hostPage.waitForEvent('popup', { timeout: 20000 }).catch(async (e) => {
        throw new Error(`no agent window; host page says: ${await hostPage.locator('[data-host="status"]').textContent()} (${e.message})`);
      });
      await hostPage.click('[data-host="ask"]');
      const popup = await popupEvent;
      await popup.waitForSelector('[data-agent="field-operation"]', { timeout: 20000 });
      return { hostPage, popup };
    };
    const hostStatus = async (hostPage) => {
      await hostPage.waitForFunction(() => /^(ok|refused|error|agent:)/.test(document.querySelector('[data-host="status"]').textContent), null, { timeout: 30000 });
      return hostPage.locator('[data-host="status"]').textContent();
    };
    const approve = async (popup) => { await popup.selectOption('[data-agent="identity"]', identityHash); await popup.click('[data-agent="approve"]'); };

    // 1. Reject: visible approval, the person says no. Nothing is signed, nothing reaches netget's commit.
    {
      const before = netgetCalls.length;
      const { hostPage, popup } = await open(`label=${encodeURIComponent(LABEL)}`);
      const shown = await popup.locator('[data-agent="field-operation"]').textContent();
      const text = await popup.locator('body').innerText();
      check('1.1 the agent shows its own words for the real request: "Claim gateway gw-real.local"', shown === `Claim gateway ${GW}`, shown);
      check('1.2 the app\'s misleading label appears nowhere in the agent window', !text.includes(LABEL) && !/sign in/i.test(text));
      check('1.3 the requesting origin is the host page, as the browser reported it', (await popup.locator('[data-agent="origin"]').textContent()) === host.origin);
      const effect = await popup.locator('[data-agent="effect-makesYouOwner"]').textContent();
      check('1.4 the effect names the gateway and the verifier by its public audience, not the loopback transport', effect.includes(GW) && effect.includes(rig.audience) && !effect.includes(rig.monad), effect);
      const verifiedBy = await popup.locator('[data-agent="field-audience"]').textContent();
      check('1.4b "Asked by" is the page and "Verified by" is the configured audience; the transport address is not shown', verifiedBy === rig.audience && !text.includes(rig.monad), verifiedBy);
      await wait(2000);
      check('1.5 no signature without a click', !results().some((m) => m.at.startsWith(host.origin)));
      await popup.click('[data-agent="reject"]');
      const st = await hostStatus(hostPage);
      check('1.6 reject: the page gets "rejected" and sends no claim to netget', st === 'agent: rejected' && !netgetCalls.slice(before).some((c) => c.url.endsWith('/setup/agent/claim')), st);
      await unchanged('1.7 after reject');
      await hostPage.close();
    }

    // 2. Expiry: approved, but the approval runs out before it is sent.
    {
      const { hostPage, popup } = await open('ttl=5000&delayMs=6500');
      await approve(popup);
      const st = await hostStatus(hostPage);
      check('2.1 an expired approval is refused by netget (EXPIRED)', st === 'refused: 400 EXPIRED', st);
      const s = await unchanged('2.2 after expiry');
      check('2.3 refused before any write: no installation authorization', s.installAuth === null, JSON.stringify(s.installAuth));
      await hostPage.close();
    }

    // 3. Tampering: the page alters the proof (its signature) before sending it.
    {
      const { hostPage, popup } = await open('tamper=1');
      await approve(popup);
      const st = await hostStatus(hostPage);
      check('3.1 a tampered proof is refused by the monad (SIGNATURE_INVALID), forwarded by netget', st === 'refused: 400 SIGNATURE_INVALID', st);
      const s = await unchanged('3.2 after tampering');
      check('3.3 the installation authorization is not consumed', s.installAuth?.status === 'pending', s.installAuth?.status);
      await hostPage.close();
    }

    // 4. Altering the request after it was shown: the agent marks it changed and the old approval signs nothing.
    {
      const r4 = results().length;
      const { hostPage, popup } = await open('alter=1&alterMs=2500');
      await popup.evaluate(() => { window.__oldForm = document.querySelector('[data-agent="form"]'); });
      await popup.waitForSelector('[data-agent="changed"]', { timeout: 15000 });
      check('4.1 the agent shows the request was changed after it was shown', true);
      check('4.2 Approve is held right after the change', await popup.locator('[data-agent="approve"]').isDisabled());
      await popup.evaluate(() => { window.__oldForm.dispatchEvent(new Event('submit', { cancelable: true })); });
      await popup.waitForSelector('[data-agent="invalidated"]', { timeout: 5000 });
      await wait(500);
      check('4.3 the old approval signs nothing', results().length === r4);
      await popup.click('[data-agent="reject"]');
      const st = await hostStatus(hostPage);
      check('4.4 the person rejects the changed request; nothing reaches netget', st === 'agent: rejected', st);
      await unchanged('4.5 after the altered request');
      await hostPage.close();
    }

    // 5. The real bootstrap: approve, netget checks and forwards, the monad authorizes and records the owner.
    let proofBytes = '';
    {
      const r5 = results().length;
      const before = netgetCalls.length;
      const { hostPage, popup } = await open(`label=${encodeURIComponent(LABEL)}&replay=1`);
      await approve(popup);
      const st = await hostStatus(hostPage);
      check('5.1 approved: netget answers ok', st === 'ok', st);
      const answer = JSON.parse(await hostPage.locator('[data-host="result"]').textContent());
      check('5.2 the answer names the owner: this identity at its namespace, nothing else (no session, no token)',
        answer.ok === true && answer.identityHash === identityHash && answer.namespace === reg.namespace && Object.keys(answer).sort().join() === 'identityHash,namespace,ok,ownerUsername', JSON.stringify(answer));
      await hostPage.waitForFunction(() => document.querySelector('[data-host="replay"]')?.textContent, null, { timeout: 15000 }).catch(() => {});
      const replay = await hostPage.locator('[data-host="replay"]').textContent().catch(() => '');
      check('5.3 replay: the same claim sent again is refused (session consumed)', replay === 'refused: 400 SETUP_SESSION_INVALID', replay);
      const result = results().slice(r5).find((m) => m.at.startsWith(host.origin))?.data;
      const proof = decodeProof(result?.proof);
      proofBytes = proof?.bytes || '';
      const signed = JSON.parse(proofBytes.slice('me-proof/2\n'.length));
      check('5.4 the signed call: kind, path, origin (host), audience (the configured public one, not the transport), namespace (the identity\'s)',
        signed.op === 'call' && signed.kind === 'netget.gateway.bootstrap' && signed.path === `/api/v1/gateway/${GW}/bootstrap`
        && signed.origin === host.origin && signed.audience === rig.audience && signed.audience !== rig.monad && signed.namespace === reg.namespace, proofBytes.slice(0, 160));
      const sent = netgetCalls.slice(before).filter((c) => c.url.endsWith('/setup/agent/claim')).map((c) => JSON.parse(c.body));
      check('5.5 the page sent netget only {setupToken, state, proof}, proof = {bytes, signature}, never a body',
        sent.length === 2 && sent.every((b) => Object.keys(b).sort().join() === 'proof,setupToken,state' && Object.keys(b.proof).sort().join() === 'bytes,signature'));
      const everything = JSON.stringify(received.map((m) => m.data)) + JSON.stringify(netgetCalls);
      check('5.6 no key material reached the app or netget (no JWK d, private key, seed)', !/"d"\s*:|privateKey|pendingSeed|seed/i.test(everything));
      const s = await state();
      check('5.7 the monad\'s record: owner and only admin = this identity, anchored at its namespace, no v1 pubkey',
        s.authority?.owner === identityHash && Object.keys(s.authority.admins).join() === identityHash && s.authority.namespaces[identityHash] === reg.namespace && !s.authority.pubkeys?.[identityHash], JSON.stringify(s.authority).slice(0, 200));
      check('5.8 netget\'s materialized cache matches (owner, only admin)', s.cache?.owner === identityHash && Object.keys(s.cache.admins).join() === identityHash);
      check('5.9 the installation authorization is consumed', s.installAuth?.status === 'consumed');
      const hostStorage = await hostPage.evaluate(async () => ({ ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), dbs: (await indexedDB.databases()).map((d) => d.name), cookie: document.cookie }));
      check('5.10 no app session: the host page stored nothing and got no cookie', hostStorage.ls.length === 0 && hostStorage.ss.length === 0 && hostStorage.dbs.length === 0 && hostStorage.cookie === '', JSON.stringify(hostStorage));
      check('5.11 no cookies anywhere in the browser context', (await context.cookies()).length === 0);
      check('5.12 netget wrote no admin or app session file', !s.runtimeFiles.some((f) => /session/i.test(f) && f !== 'setup-session.json'), s.runtimeFiles.join(','));
      await hostPage.close();
    }

    // 6. Another approval after success (a new setup session, the same identity): the owner does not change.
    {
      const { hostPage, popup } = await open();
      await approve(popup);
      const st = await hostStatus(hostPage);
      check('6.1 a second bootstrap of the same gateway is refused; the owner stays', /^refused/.test(st) && (await state()).authority?.owner === identityHash, st);
      await hostPage.close();
    }

    // 7. Restart the monad: the owner is durable; netget's cache, wiped, rebuilds to the same owner.
    {
      const restarted = await rig.call('POST', '/restart');
      check('7.1 the monad process really restarted (new pid, same origin, healthy)', restarted.restarted && restarted.sameOrigin && restarted.healthy, JSON.stringify(restarted));
      const s = await state();
      check('7.2 after restart the monad still names this identity as owner at its namespace', s.authority?.owner === identityHash && s.authority.namespaces[identityHash] === reg.namespace);
      const refreshed = await rig.call('POST', '/refresh-cache', { gatewayId: GW });
      check('7.3 netget\'s cache, wiped and refreshed from the restarted monad, matches', refreshed.ok === true && refreshed.owner === identityHash && refreshed.admins.join() === identityHash, JSON.stringify(refreshed));
    }

    // 8. v1 stays refused for this agent-only identity, and the monad has no app-session route.
    {
      const v1 = await fetch(`${rig.monad}/api/v1/gateway/${GW}-v1/bootstrap`, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ namespace: reg.namespace, identityHash, keyId: reg.keyId, challenge: 'c', timestamp: Date.now(), signature: 'x' }) });
      check('8.1 a v1 bootstrap body for the agent-only identity -> V1_REFUSED_AGENT_ONLY', v1.status === 403 && (await v1.json()).error === 'V1_REFUSED_AGENT_ONLY');
      const direct = await fetch(`${rig.monad}/api/v1/gateway/${GW}-direct/bootstrap`, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ proof: { bytes: proofBytes, signature: 'x' }, body: { gatewayId: `${GW}-direct`, challenge: 'c' } }) });
      check('8.2 a v2 body straight to the monad (no netget, no token) -> NOT_FROM_GATEWAY', direct.status === 403 && (await direct.json()).error === 'NOT_FROM_GATEWAY');
      const session = await fetch(`${rig.monad}/api/v1/agent/session/read?path=profile`);
      check('8.3 no app-session route exists', session.status === 404);
    }

    check('9.1 no request left the four origins', outside.length === 0, outside.join(', '));
  } finally {
    await browser.close();
    await rig.stop();
    agent.stop(); host.stop();
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
