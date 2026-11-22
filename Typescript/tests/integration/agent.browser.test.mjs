// The identity agent's first cut (Agent-Protocol.md section 10), in a real browser with isolated origins: the AGENT,
// a HOST page, an ATTACKER page (three demo servers, three origins) and a disposable TEST VERIFIER
// (agentResource.mjs). New identities generated in the agent, a fixture domain list; nothing real is reached.
//
//   node tests/integration/agent.browser.test.mjs          (from Typescript/)
//
// Each check names the Agent-Protocol.md negative test (N) it covers. N rows outside this cut are printed as PENDING
// at the end and are not counted as covered.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startAgentResource, legacyIdentity } from './agentResource.mjs';

// The cleaker's trusted resources (src/agent/cleakerTrust.ts), served by the demo at /cleaker-trust.json from this
// file. The creation link only gives the transport; the audience comes from here.
const TRUST_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cleaker-trust-')), 'cleaker-trust.json');
const writeTrust = (entries) => fs.writeFileSync(TRUST_FILE, JSON.stringify(entries));

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const NS = 'test.local';

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

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
    await new Promise((r) => setTimeout(r, 200));
  }
  stop();
  throw new Error(`${name} server did not come up`);
}

let failed = 0;
const covered = new Set();
const check = (n, name, ok, detail = '') => {
  if (!ok) failed += 1;
  else for (const id of [].concat(n)) if (id) covered.add(id);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${[].concat(n).filter(Boolean).join(',').padEnd(8)} ${name}${detail ? `  — ${detail}` : ''}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [agent, host, attacker] = await Promise.all([startDemo('agent'), startDemo('host'), startDemo('attacker')]);
  const resource = await startAgentResource({ agentOrigin: agent.origin, policy: 'v2' });
  writeTrust([{ audience: resource.origin, transports: [resource.origin] }]);
  const agentUrl = `${agent.origin}/agent.html`;
  const hostUrl = (extra = '') => `${host.origin}/agentHost.html?agent=${encodeURIComponent(agentUrl)}&resource=${encodeURIComponent(resource.origin)}&ns=${NS}${extra}`;
  const domainsUrl = `${resource.origin}/domains`;
  const browser = await chromium.launch();
  const outside = [];
  const allowedOrigins = [agent.origin, host.origin, attacker.origin, resource.origin];
  // ONE browser context for the whole run: the agent's IndexedDB (its identities and non-exportable keys) lives here.
  const context = await browser.newContext();
  await context.route((u) => !allowedOrigins.includes(u.origin), (r) => { outside.push(r.request().url()); r.abort(); });
  await context.routeWebSocket((u) => !allowedOrigins.includes(`http://${u.host}`), (ws) => { outside.push(ws.url()); ws.close(); });
  console.log(`agent ${agent.origin}  host ${host.origin}  attacker ${attacker.origin}  verifier ${resource.origin}\n`);

  // Everything the host page ever receives from the agent, to check that nothing private crosses.
  const hostReceived = [];
  await context.exposeBinding('__recordMessage', (_src, data) => { hostReceived.push(data); });
  await context.addInitScript(() => { window.addEventListener('message', (e) => { try { window.__recordMessage(JSON.parse(JSON.stringify(e.data))); } catch { /* not cloneable */ } }); });

  const createIdentity = async () => {
    const page = await context.newPage();
    await page.goto(`${agentUrl}?create=${encodeURIComponent(resource.origin)}&ns=${NS}`);
    const logs = [];
    page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
    await page.click('[data-agent="create"]');
    try { await page.waitForSelector('[data-agent="created"]', { timeout: 20000 }); }
    catch (e) { throw new Error(`identity not created; agent says: ${await page.locator('[data-agent="status"]').textContent().catch(() => '?')}; ${logs.slice(-5).join(' | ')}`); }
    const identityHash = await page.locator('[data-agent="created"]').textContent();
    await page.close();
    return identityHash;
  };
  const ask = async (page) => {
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.click('[data-host="ask"]')]);
    await popup.waitForSelector('[data-agent="origin"]', { timeout: 15000 });
    return popup;
  };
  const approveAs = async (popup, identityHash) => {
    await popup.waitForFunction(() => document.querySelectorAll('[data-agent="identity"] option').length > 0, null, { timeout: 10000 });
    await popup.selectOption('[data-agent="identity"]', identityHash);
    await popup.click('[data-agent="approve"]');
  };
  const hostStatus = (page, pattern) => page.waitForFunction((p) => new RegExp(p).test(document.querySelector('[data-host="status"]').textContent), pattern.source, { timeout: 15000 }).then(() => true, () => false);
  const text = (page, sel) => page.locator(sel).first().textContent();
  const send = (page, proof, url = domainsUrl) => page.evaluate(async ({ url, proof }) => { const r = await fetch(url, { headers: { 'X-Me-Proof': proof } }); return { status: r.status, ...(await r.json()) }; }, { url, proof });

  // An approved proof the host never used (its own read is held back), to try things with.
  const captureProof = async (identityHash, extra = '') => {
    const page = await context.newPage();
    let proof = null;
    await page.route(domainsUrl, (r) => { proof = r.request().headers()['x-me-proof']; r.abort(); });
    await page.goto(hostUrl(extra));
    await approveAs(await ask(page), identityHash);
    await hostStatus(page, /error|refused/);
    await page.unroute(domainsUrl);
    return { page, proof };
  };

  try {
    // 0. A NEW identity, generated in the agent, registered with agent-only from the start (R10-R11).
    const ana = await createIdentity();
    const bob = await createIdentity();
    const carol = await createIdentity();
    const recAna = resource.identities.get(ana);
    check(['R11'], '0.1 the new identity is registered with its agent key and agent-only in one step', !!recAna && recAna.agentOnly === true && !!recAna.agentKey && !!recAna.keyId, JSON.stringify({ agentOnly: recAna?.agentOnly, keyId: recAna?.keyId }));
    resource.allow(ana);   // test configuration: only ana may read the fixture list
    resource.allow(carol);

    // 1. The whole way: ask -> the agent shows who asks -> approve -> the page reads with the v2 proof.
    {
      const page = await context.newPage();
      const sent = [];
      page.on('request', (r) => { if (r.url().startsWith(domainsUrl)) sent.push(r.headers()['x-me-proof']); });
      await page.goto(hostUrl());
      const popup = await ask(page);
      check(null, '1.1 the agent opens in its own window, at its own origin', new URL(popup.url()).origin === agent.origin, popup.url());
      check('N4', '1.2 it shows the requesting origin as the browser reported it', (await text(popup, '[data-agent="origin"]')) === host.origin);
      check('N7', '1.3 it shows the exact resource and action', (await text(popup, '[data-agent="field-resource"]')) === domainsUrl && (await text(popup, '[data-agent="field-action"]')) === 'Read');
      await approveAs(popup, ana);
      const ok = await hostStatus(page, /^ok$/);
      check(null, '1.4 approved: the page reads the fixture domain list, verified by the test verifier', ok && (await text(page, '[data-host="result"]')).includes('example.test'), await text(page, '[data-host="status"]'));
      const decoded = JSON.parse(Buffer.from(sent[0], 'base64url').toString('utf8'));
      check('N9', '1.5 what was sent is a v2 proof (tag inside the signed bytes)', typeof decoded.bytes === 'string' && decoded.bytes.startsWith('me-proof/2\n') && Object.keys(decoded).sort().join() === 'bytes,signature');
      const closed = popup.isClosed() || await popup.waitForEvent('close', { timeout: 3000 }).then(() => true, () => false);
      check(null, '1.6 the agent window closed after answering', closed);

      // 2. That proof is good for that request, once, from that page.
      check('N16', '2.1 replaying the same proof is refused', (await send(page, sent[0])).error === 'REPLAY');
      check('N8', '2.2 the same proof for an altered request is refused', (await send(page, sent[0], `${domainsUrl}?all=1`)).error === 'QUERY_MISMATCH');
      check(null, '2.3 asking the verifier directly, with no proof, is refused (the GUI is not the gate)', (await send(page, '')).error === 'PROOF_MISSING');
      await page.close();
    }

    // 3. Concurrent duplicates: exactly one execution (R13-R14).
    {
      const { page, proof } = await captureProof(ana);
      const before = resource.outcomes.filter((o) => o === 'OK_v2').length;
      const results = await page.evaluate(async ({ url, proof }) => Promise.all([0, 1, 2, 3].map(() => fetch(url, { headers: { 'X-Me-Proof': proof } }).then((r) => r.status))), { url: domainsUrl, proof });
      const oks = results.filter((s) => s === 200).length;
      check('N16', '3.1 four concurrent copies of one proof: exactly one is executed', oks === 1 && resource.outcomes.filter((o) => o === 'OK_v2').length === before + 1, JSON.stringify(results));
      await page.close();
    }

    // 4. A proof that fails validation does not burn the nonce (R13).
    {
      const { page, proof } = await captureProof(ana);
      const d = JSON.parse(Buffer.from(proof, 'base64url').toString('utf8'));
      const forged = Buffer.from(JSON.stringify({ ...d, signature: Buffer.alloc(64, 7).toString('base64url') })).toString('base64url');
      check('N15', '4.1 the same bytes with an invalid signature are refused', (await send(page, forged)).error === 'SIGNATURE_INVALID');
      check('N15', '4.2 ... and did not reserve the nonce: the real proof still works once', (await send(page, proof)).status === 200);
      await page.close();
    }

    // 5. Security state unavailable, or reset: refused (R14-R15).
    {
      const { page, proof } = await captureProof(ana);
      resource.nonceStoreAvailable = false;
      const down = await send(page, proof);
      resource.nonceStoreAvailable = true;
      check('N17', '5.1 the nonce store is unavailable: the read is refused (fail-closed)', down.status === 503 && down.error === 'NONCE_STORE_UNAVAILABLE', JSON.stringify(down));
      const { page: p2, proof: proof2 } = await captureProof(ana);
      await wait(5);
      resource.restart();
      check('N18', '5.2 after a verifier restart, a proof issued before it is refused', (await send(p2, proof2)).error === 'ISSUED_BEFORE_RESTART');
      await page.close(); await p2.close();
    }

    // 6. Who approves still has to be allowed, known and not revoked.
    {
      const page = await context.newPage();
      await page.goto(hostUrl());
      await approveAs(await ask(page), bob);
      check(null, '6.1 a valid approval from an identity without the permission gets no data (403)', await hostStatus(page, /^refused: 403 FORBIDDEN/), await text(page, '[data-host="status"]'));
      resource.revoke(carol);
      await approveAs(await ask(page), carol);
      check('N19', '6.2 a revoked agent key is refused at the verifier, live', await hostStatus(page, /^refused: 401 KEY_REVOKED/), await text(page, '[data-host="status"]'));
      await page.close();
    }

    // 7. A proof taken to another origin, or used after it expired.
    {
      const { page, proof } = await captureProof(ana, '&ttl=5000');
      const attackerPage = await context.newPage();
      await attackerPage.goto(`${attacker.origin}/agentHost.html`);
      check(null, '7.1 a proof used from another origin is refused', (await send(attackerPage, proof)).error === 'ORIGIN_MISMATCH');
      await wait(5500);
      check(null, '7.2 a proof used after it expired is refused', (await send(page, proof)).error === 'EXPIRED');
      await page.close(); await attackerPage.close();
    }

    // 8. v1 is closed (R19-R20).
    {
      const page = await context.newPage();
      await page.goto(hostUrl());
      // a v1-format proof claiming the agent-only identity
      const v1ForAna = Buffer.from(JSON.stringify({ identityHash: ana, publicKey: 'x', message: '{}', signature: 'x' })).toString('base64url');
      check('N13', '8.1 a v1 proof for an agent-only identity is refused', (await send(page, v1ForAna)).error === 'V1_REFUSED_AGENT_ONLY');
      // a legacy identity with a VALID v1 signature
      const legacy = await legacyIdentity('dave', 'secret-d', NS);
      resource.allow(legacy.identityHash);
      const v1 = (nonce) => legacy.v1Proof({ method: 'GET', path: '/domains', query: '[]', nonce, timestamp: Date.now() });
      resource.addLegacy(legacy.identityHash, legacy.publicKey, false);
      check('N23', '8.2 a valid v1 proof on an endpoint declared v2-only is refused', (await send(page, await v1('n-a'))).error === 'V1_NOT_ACCEPTED');
      resource.policy = 'v1+v2';
      check(null, '8.3 (contrast) the same valid v1 proof on an endpoint declared v1+v2 is accepted', (await send(page, await v1('n-b'))).status === 200);
      resource.addLegacy(legacy.identityHash, legacy.publicKey, true);
      check('N13', '8.4 once agent-only, a VALID v1 proof is refused even where v1 is allowed', (await send(page, await v1('n-c'))).error === 'V1_REFUSED_AGENT_ONLY');
      resource.policy = 'v2';
      await page.close();
    }

    // 9. Registration cannot be used by a page, or with the old authority (R10-R12).
    {
      const page = await context.newPage();
      await page.goto(`${attacker.origin}/agentHost.html`);
      const fromPage = await page.evaluate(async (url) => { const r = await fetch(`${url}/api/v1/agent/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); return (await r.json()).error; }, resource.origin);
      check('N12', '9.1 a registration sent from a page that is not the agent is refused (a hurdle: Origin, not proof)', fromPage === 'NOT_FROM_AGENT');
      const again = await page.evaluate(async (url) => { const r = await fetch(`${url}/api/v1/agent/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); return r.status; }, resource.origin);
      check(null, '9.2 (and nothing was created by it)', again === 403 && resource.identities.size === 4);
      await page.close();
    }

    // 10. Saying no, or walking away, ends it: nothing continues unsigned.
    {
      const page = await context.newPage();
      await page.goto(hostUrl());
      const before = resource.requests.length;
      await (await ask(page)).click('[data-agent="reject"]');
      check('N6', '10.1 rejecting ends the request; nothing is sent', (await hostStatus(page, /agent: rejected/)) && resource.requests.length === before);
      (await ask(page)).close();
      check('N6', '10.2 closing the agent window ends the request; nothing is sent', (await hostStatus(page, /agent: closed/)) && resource.requests.length === before);
      await page.close();
    }

    // 11. What an attacker page can and cannot do with the agent.
    {
      const page = await context.newPage();
      await page.goto(`${attacker.origin}/agentHost.html`);
      await page.evaluate((url) => { const f = document.createElement('iframe'); f.src = url; f.name = 'embedded'; document.body.append(f); }, agentUrl);
      const frame = page.frameLocator('iframe[name="embedded"]');
      await frame.locator('[data-agent="framed"]').waitFor({ timeout: 10000 }).catch(() => {});
      check(null, '11.1 embedded in another page, the agent refuses to run (by script; headers are N1, pending)', (await frame.locator('[data-agent="framed"]').count()) === 1 && (await frame.locator('[data-agent="approve"]').count()) === 0);
      const readable = await page.evaluate(async (url) => {
        const w = window.open(url, 'peek');
        await new Promise((r) => setTimeout(r, 2500));
        try { return String(w.document.body.innerHTML.length); } catch (e) { return `blocked: ${e.name}`; } finally { w.close(); }
      }, agentUrl);
      check(null, '11.2 the page that opened the agent cannot read its window', readable.startsWith('blocked'), readable);
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.evaluate(({ url, resource, ns }) => {
          const w = window.open(url, 'liar');
          window.addEventListener('message', (e) => {
            if (e.source !== w || e.data?.type !== 'agent.ready') return;
            const operation = { action: 'read', namespace: ns, audience: resource, method: 'GET', path: '/domains', query: '[]', ttlMs: 60000 };
            w.postMessage({ protocol: 'me-agent/1', type: 'agent.request', id: 'a'.repeat(32), operation, origin: 'https://trusted.example' }, '*');
            setTimeout(() => w.postMessage({ protocol: 'me-agent/1', type: 'agent.request', id: 'b'.repeat(32), operation }, '*'), 300);
          });
        }, { url: agentUrl, resource: resource.origin, ns: NS }),
      ]);
      await popup.waitForSelector('[data-agent="origin"]', { timeout: 10000 }).catch(() => {});
      check('N4', '11.3 a request that claims another origin is ignored; the agent shows the real one', (await popup.locator('[data-agent="origin"]').textContent().catch(() => '')) === attacker.origin);
      await popup.close();
      await page.close();
    }

    // 12. The answer goes only to the origin that asked (wrong window / navigated away).
    {
      const page = await context.newPage();
      await page.goto(hostUrl());
      const popup = await ask(page);
      await page.goto(`${attacker.origin}/agentHost.html`);
      await page.evaluate(() => { window.__got = []; window.addEventListener('message', (e) => window.__got.push(e.data?.type)); });
      await approveAs(popup, ana);
      await wait(1500);
      check('N11', '12.1 if the asking page navigated away, the new page does not receive the approval', (await page.evaluate(() => window.__got)).length === 0);
      await page.close();
    }

    // 13. The non-exportable key survives reloading the agent, and stays non-exportable.
    {
      const page = await context.newPage();
      await page.goto(agentUrl);   // a fresh load of the agent's origin
      const keys = await page.evaluate(async () => {
        const db = await new Promise((res, rej) => { const o = indexedDB.open('me-agent', 1); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
        const all = await new Promise((res, rej) => { const q = db.transaction('identities').objectStore('identities').getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
        const one = all[0];
        let exported = 'not exportable';
        try { await crypto.subtle.exportKey('jwk', one.privateKey); exported = 'EXPORTED'; } catch { /* expected */ }
        const sig = await crypto.subtle.sign({ name: 'Ed25519' }, one.privateKey, new TextEncoder().encode('reload check'));
        return { count: all.length, extractable: one.privateKey.extractable, exported, sigBytes: sig.byteLength };
      });
      check(null, '13.1 after reloading the agent, its stored keys are still usable', keys.count >= 3 && keys.sigBytes === 64, JSON.stringify(keys));
      check(null, '13.2 ... and still not exportable', keys.extractable === false && keys.exported === 'not exportable');
      await page.close();
      // and a full read after the reload works with the stored key
      const host2 = await context.newPage();
      await host2.goto(hostUrl());
      await approveAs(await ask(host2), ana);
      check(null, '13.3 a read approved after the reload is verified (the registered key, loaded from storage)', await hostStatus(host2, /^ok$/));
      await host2.close();
    }

    // 14. Nothing private ever reached the host.
    {
      const json = JSON.stringify(hostReceived);
      const results = hostReceived.filter((m) => m?.type === 'agent.result' && m.ok);
      const fieldsOk = results.every((m) => Object.keys(m.identity).sort().join() === 'identityHash,keyId,namespace'
        && Object.keys(JSON.parse(Buffer.from(m.proof, 'base64url').toString('utf8'))).sort().join() === 'bytes,signature');
      check(null, '14.1 every answer the host got holds only a proof (bytes + signature) and public identity fields', results.length > 0 && fieldsOk, `${results.length} answers`);
      check(null, '14.2 no private key, seed or secret material in anything the host received', !/"d"\s*:|privateKey|seed|secret/i.test(json));
    }

    // The agent origin runs no third-party code (Identity-Access-Design.md): its page loads scripts from itself only.
    const agentHtml = await (await fetch(agentUrl)).text();
    const scriptSrcs = [...agentHtml.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]);
    const foreign = scriptSrcs.filter((src) => /^(https?:)?\/\//i.test(src) && !src.startsWith(agent.origin));
    check(null, '15.1 the agent page loads no third-party script (no analytics, pixel or CDN)', foreign.length === 0 && !/fbq|googletagmanager|connect\.facebook/i.test(agentHtml), foreign.join(', '));

    // 16. The creation link is TRANSPORT only; the audience is the cleaker's configured one (cleakerTrust.ts).
    {
      const registerUrl = `${resource.origin}/api/v1/agent/register`;
      const openCreate = async (query) => {
        const page = await context.newPage();
        const posts = [];
        page.on('request', (r) => { if (r.method() === 'POST') posts.push({ url: r.url(), body: r.postData() || '' }); });
        await page.goto(`${agentUrl}?${query}`);
        await page.waitForSelector('[data-agent="create"], [data-agent="create-invalid"], [data-agent="pending"]', { timeout: 15000 });
        return { page, posts };
      };
      const tr = encodeURIComponent(resource.origin);
      let o = await openCreate(`create=${tr}&ns=${NS}&audience=${encodeURIComponent(attacker.origin)}`);
      check(null, '16.1 a link that tries to set the audience (audience=) is refused before anything is created or sent',
        (await o.page.locator('[data-agent="create-invalid"]').count()) === 1 && (await o.page.locator('[data-agent="create"]').count()) === 0 && o.posts.length === 0,
        await o.page.locator('[data-agent="create-invalid"]').textContent().catch(() => ''));
      await o.page.close();
      o = await openCreate(`create=${encodeURIComponent(attacker.origin)}&ns=${NS}`);
      check(null, '16.2 a transport this cleaker does not trust (the attacker\'s origin) is refused', (await o.page.locator('[data-agent="create-invalid"]').count()) === 1 && o.posts.length === 0);
      await o.page.close();
      o = await openCreate(`create=${tr}&ns=${NS}`);
      check(null, '16.3 a trusted transport: the screen names the configured audience', (await text(o.page, '[data-agent="create-audience"]')).includes(resource.origin));
      await o.page.close();
      // The SAME link, with the configuration mapping that transport to another audience: the registration is for the
      // configured audience (so this verifier, whose own origin is its audience, refuses it).
      writeTrust([{ audience: 'https://elsewhere.example', transports: [resource.origin] }]);
      o = await openCreate(`create=${tr}&ns=${NS}`);
      const before = resource.identities.size;
      await o.page.click('[data-agent="create"]');
      await o.page.waitForSelector('[data-agent="pending"], [data-agent="created"]', { timeout: 20000 }).catch(() => {});
      const reg = o.posts.find((x) => x.url === registerUrl);
      check(null, '16.4 the same link with another configured audience: the registration is sent to the transport but is FOR the configured audience, not the URL',
        !!reg && reg.body.includes('https://elsewhere.example') && !reg.body.includes(resource.origin) && resource.identities.size === before,
        reg ? reg.body.slice(0, 0) + `posted to ${reg.url}` : 'no registration sent');
      await o.page.close();
      fs.writeFileSync(TRUST_FILE, '{ not json');
      o = await openCreate(`create=${tr}&ns=${NS}`);
      check(null, '16.5 a broken configuration trusts nothing (fail closed)', (await o.page.locator('[data-agent="create-invalid"]').count()) === 1 && o.posts.length === 0);
      await o.page.close();
      writeTrust([{ audience: resource.origin, transports: [resource.origin] }]);
    }

    // 17. keys.list: the app gets the NAMES of your keys after you approve; never a value.
    const SECRET = 'sk_live_CLEAKER_TEST_9f1a2b';
    const FIELD_VALUE = 'cleaker-field-value-7c1d';
    const PASS = 'a-long-test-passphrase-1';
    let anaNs = '';
    {
      const seedPage = await context.newPage();
      await seedPage.goto(agentUrl);
      const vaultPath = `/@fs${path.join(root, 'src/gui/All.This/Cleaker/Keys/serviceKeyVault.ts')}`;
      anaNs = await seedPage.evaluate(async ({ vaultPath, ana, SECRET, FIELD_VALUE, PASS }) => {
        const db = await new Promise((res, rej) => { const o = indexedDB.open('me-agent', 1); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
        const one = await new Promise((res, rej) => { const q = db.transaction('identities').objectStore('identities').get(ana); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
        const ns = one.claimedNamespace ?? one.namespace;
        const v = await import(vaultPath);
        await v.saveServiceKeys(ns, 'instagram', { appId: FIELD_VALUE, appSecret: SECRET }, PASS);
        await v.saveCustomKeys(ns, 'stripe.test', { secretKey: SECRET }, PASS);
        await v.saveCustomKeys(ns, 'netget', { token: SECRET }, PASS);
        v.lockServiceKeys();
        return ns;
      }, { vaultPath, ana, SECRET, FIELD_VALUE, PASS });
      await seedPage.close();
      const keysUrl = (extra = '') => `${host.origin}/agentHost.html?mode=keys&agent=${encodeURIComponent(agentUrl)}&ns=${NS}${extra}`;
      const before = hostReceived.length;
      const page = await context.newPage();
      await page.goto(keysUrl());
      const popup = await ask(page);
      check(null, '17.1 the cleaker shows the request in its own words', (await text(popup, '[data-agent="field-operation"]')) === 'See the names of your keys'
        && (await text(popup, '[data-agent="description"]')).includes('will not see any value')
        && (await popup.locator('[data-agent="effect-valuesShared"]').getAttribute('data-value')) === 'false'
        && (await popup.locator('[data-agent="effect-leavesDevice"]').getAttribute('data-value')) === 'false');
      check(null, '17.2 ... at its own origin, naming who asks', new URL(popup.url()).origin === agent.origin && (await text(popup, '[data-agent="origin"]')) === host.origin);
      await approveAs(popup, ana);
      const okList = await hostStatus(page, /^ok$/);
      const listing = okList ? JSON.parse(await text(page, '[data-host="result"]')) : null;
      check(null, '17.3 approved: the app gets <ns>.keys and the paths that are set', okList && listing.resource === `${anaNs}.keys`
        && JSON.stringify(listing.entries) === JSON.stringify([{ path: 'keys.meta.instagram', status: 'set' }, { path: 'keys.stripe.test', status: 'set' }]),
        JSON.stringify(listing));
      const crossed = JSON.stringify(hostReceived.slice(before));
      check(null, '17.4 no value and no field name crossed postMessage; keys.netget is not listed', crossed.length > 0 && !crossed.includes(SECRET) && !crossed.includes(FIELD_VALUE)
        && !/appSecret|appId|secretKey|token|netget|seed|privateKey/.test(crossed));
      const answer = hostReceived.slice(before).find((m) => m?.type === 'agent.result' && m.ok);
      check(null, '17.5 the answer holds exactly {keys, identity}, no proof', !!answer && Object.keys(answer).sort().join() === 'id,identity,keys,ok,protocol,type');
      await page.close();

      // The app swaps the request after it is shown: the approval does not carry over.
      const page2 = await context.newPage();
      await page2.goto(keysUrl('&alter=other.local&alterMs=1200'));
      const popup2 = await ask(page2);
      await popup2.waitForSelector('[data-agent="changed"]', { timeout: 10000 }).catch(() => {});
      const changed = (await popup2.locator('[data-agent="changed"]').count()) === 1;
      const noIdentity = await popup2.waitForFunction(() => /No \.me for other\.local/.test(document.querySelector('[data-agent="status"]')?.textContent || ''), null, { timeout: 5000 }).then(() => true, () => false);
      check(null, '17.6 a request replaced by the app is shown as changed and needs a new approval (here: no identity for the new namespace)',
        changed && noIdentity && (await popup2.locator('[data-agent="approve"]').isDisabled()));
      await popup2.click('[data-agent="reject"]');
      check(null, '17.7 ... and nothing was answered for the first one', await hostStatus(page2, /refused: rejected/));
      await page2.close();
    }

    // 18. "Your keys" inside the cleaker window: the tree, values as dots, keys.netget hidden, typing writes nothing.
    {
      const page = await context.newPage();
      const posts = [];
      page.on('request', (r) => { const b = r.postData(); if (b) posts.push(b); });
      await page.goto(agentUrl);
      await page.waitForSelector('[data-agent="keys-identity"] option', { state: 'attached', timeout: 15000 });
      await page.selectOption('[data-agent="keys-identity"]', ana);
      await page.waitForSelector('[data-gui-node-id="cleaker.keys.keys"]', { timeout: 20000 });
      await page.click('[data-gui-node-id="cleaker.keys.keys"]');
      await page.waitForSelector('[data-gui-node-id="cleaker.keys.keys.meta"]', { timeout: 10000 }).catch(() => {});
      const ids = await page.evaluate(() => [...document.querySelectorAll('[data-gui-node-id]')].map((n) => n.getAttribute('data-gui-node-id')));
      check(null, '18.1 the cleaker shows the keys tree for the chosen identity (labels from the tree)', ids.includes('cleaker.keys.keys.meta') && ids.includes('cleaker.keys.keys.stripe'), ids.filter((i) => i.startsWith('cleaker.keys.keys')).join(' '));
      check(null, '18.2 keys.netget is not shown', !ids.some((i) => /\.netget\b/.test(i)));
      await page.click('[data-gui-node-id="cleaker.keys.keys.meta"]');
      await page.waitForSelector('[data-gui-node-id="cleaker.keys.keys.meta.instagram"]', { timeout: 10000 });
      await page.click('[data-gui-node-id="cleaker.keys.keys.meta.instagram"]');
      await page.waitForSelector('input', { timeout: 10000 });
      const html = await page.content();
      check(null, '18.3 the open key shows dots, never the value (locked)', !html.includes(SECRET) && !html.includes(FIELD_VALUE) && /••••/.test(await page.evaluate(() => document.body.innerText + [...document.querySelectorAll('input')].map((i) => i.value + i.placeholder).join(' '))));
      const snap = () => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
      const s0 = await snap();
      const field = page.locator('input:not([type=hidden])').first();
      await field.click();
      await field.pressSequentially('typed-not-saved-123', { delay: 10 });
      await wait(400);
      const s1 = await snap();
      const typed = (await field.inputValue().catch(() => '')).includes('typed-not-saved-123');
      check(null, '18.4 typing into a field (the text is in the field) does not change localStorage', typed && s0 === s1, `typed=${typed}`);
      check(null, '18.5 no seed or secret went on the network from the cleaker window', posts.every((b) => !b.includes(SECRET) && !b.includes('typed-not-saved-123') && !/seed/i.test(b)), `${posts.length} POSTs`);
      await page.close();
    }
    check(null, 'nothing was requested outside the test origins', outside.length === 0, outside.slice(0, 3).join(', '));
  } finally {
    await browser.close();
    [agent, host, attacker].forEach((s) => s.stop());
    await resource.close();
  }

  const ALL = Array.from({ length: 26 }, (_, i) => `N${i + 1}`);
  const unit = { N5: 'tests/agentProtocol.test.ts (validateOperation, parseRequest)', N9: 'tests/agentProtocol.test.ts (v2 bytes are not JSON; strict parse) + 1.5 here' };
  console.log('\nAgent-Protocol.md negative tests:');
  // Covered only in part: say what is not covered, so nothing is counted beyond what was shown.
  const partial = {
    N6: 'reject and close only; navigation, timeout and a signing failure not exercised',
    N7: 'exact origin and action shown; a host-supplied disguising label not exercised',
    N9: 'v2 format and strict parse only; the real v1 verifiers (me_sig.lua, monad) not exercised',
    N12: 'browser Origin hurdle only; a non-browser client can claim any Origin (Agent-Protocol.md section 5)',
    N13: 'on the test verifier only; keychain, recovery and the real endpoints not exercised',
    N16: 'one single-threaded test verifier; several processes or servers not exercised',
    N17: 'test verifier only', N18: 'test verifier only (in-memory store + start time)', N19: 'test verifier only', N23: 'test verifier only',
  };
  for (const n of ALL) {
    const where = covered.has(n) ? (partial[n] ? `covered in part: ${partial[n]}` : 'covered here') : unit[n] ? `covered by ${unit[n]}` : 'PENDING (not covered by this cut)';
    console.log(`  ${n.padEnd(4)} ${where}`);
  }
  console.log(failed ? `\n${failed} failed` : '\nno failures');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
