// The identity agent's first cut (Identity-Custody-Contract.md section 6), checked in a real browser with the
// isolated origins section 9 asks for: the AGENT, a HOST page, an ATTACKER page (three demo servers, three ports,
// three origins) and a RESOURCE server that verifies every request itself (agentResource.mjs). Test identities only
// (ana, bob, carol); nothing real is reached.
//
//   node tests/integration/agent.browser.test.mjs          (from Typescript/)
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startAgentResource, identityOf } from './agentResource.mjs';

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
    cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none' }, stdio: ['ignore', 'pipe', 'pipe'],
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
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [ana, bob, carol] = await Promise.all([identityOf('ana', 'secret-a', NS), identityOf('bob', 'secret-b', NS), identityOf('carol', 'secret-c', NS)]);
  const registered = new Map([[ana.identityHash, ana.publicKey], [bob.identityHash, bob.publicKey]]);   // carol: not registered
  const resource = await startAgentResource({ registered, allowed: new Set([ana.identityHash]) });   // bob: registered, not allowed
  const [agent, host, attacker] = await Promise.all([startDemo('agent'), startDemo('host'), startDemo('attacker')]);
  const agentUrl = `${agent.origin}/agent.html`;
  const hostUrl = (extra = '') => `${host.origin}/agentHost.html?agent=${encodeURIComponent(agentUrl)}&resource=${encodeURIComponent(resource.origin)}&ns=${NS}${extra}`;
  const browser = await chromium.launch();
  const outside = [];
  const allowedOrigins = [agent.origin, host.origin, attacker.origin, resource.origin];
  const newContext = async () => {
    const context = await browser.newContext();
    await context.route((u) => !allowedOrigins.includes(u.origin), (r) => { outside.push(r.request().url()); r.abort(); });
    await context.routeWebSocket((u) => !allowedOrigins.includes(`http://${u.host}`), (ws) => { outside.push(ws.url()); ws.close(); });
    return context;
  };
  console.log(`agent ${agent.origin}  host ${host.origin}  attacker ${attacker.origin}  resource ${resource.origin}\n`);

  // Opens the agent from the host's button; returns the popup once it shows the request.
  const ask = async (page) => {
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.click('[data-host="ask"]')]);
    await popup.waitForSelector('[data-agent="origin"]', { timeout: 15000 });
    return popup;
  };
  const approveAs = async (popup, username, secret) => {
    await popup.fill('input[name="username"]', username);
    await popup.fill('input[name="secret"]', secret);
    await popup.click('[data-agent="approve"]');
  };
  const hostStatus = (page, pattern) => page.waitForFunction((p) => new RegExp(p).test(document.querySelector('[data-host="status"]').textContent), pattern.source, { timeout: 15000 }).then(() => true, () => false);
  const text = (page, sel) => page.locator(sel).first().textContent();

  try {
    // 1. The whole way: ask -> the agent shows who asks -> approve -> the page reads with the proof.
    {
      const context = await newContext();
      const page = await context.newPage();
      const proofs = [];
      page.on('request', (r) => { if (r.url().startsWith(resource.origin) && r.method() === 'GET') proofs.push(r.headers()['x-me-proof']); });
      await page.goto(hostUrl());
      const popup = await ask(page);
      check('1.1 the agent opens in its own window, at its own origin', new URL(popup.url()).origin === agent.origin, popup.url());
      const shownOrigin = await text(popup, '[data-agent="origin"]');
      check('1.2 it shows the requesting origin as the browser reported it', shownOrigin === host.origin, shownOrigin);
      check('1.3 it shows the exact resource and action', (await text(popup, '[data-agent="field-resource"]')) === `${resource.origin}/domains` && (await text(popup, '[data-agent="field-action"]')) === 'Read');
      const secretReadable = await page.evaluate(() => document.body.innerHTML.includes('secret-a'));
      await approveAs(popup, 'ana', 'secret-a');
      const ok = await hostStatus(page, /^ok$/);
      check('1.4 approved: the page reads the domain list, verified by the resource server', ok && (await text(page, '[data-host="result"]')).includes('example.test'), await text(page, '[data-host="status"]'));
      check('1.5 the page learned who approved (public identity only)', (await text(page, '[data-host="identity"]')) === ana.namespace);
      check('1.6 the secret never reached the page', !secretReadable && !(await page.evaluate(() => document.body.innerHTML.includes('secret-a'))));
      const closed = popup.isClosed() || await popup.waitForEvent('close', { timeout: 3000 }).then(() => true, () => false);
      check('1.7 the agent window closed after answering', closed);
      const proof = proofs[0];

      // 2. That proof is good for that request, once, from that page.
      const replay = await page.evaluate(async ({ url, proof }) => (await fetch(url, { headers: { 'X-Me-Proof': proof } })).json(), { url: `${resource.origin}/domains`, proof });
      check('2.1 replaying the same proof is refused', replay.error === 'REPLAY', JSON.stringify(replay));
      const altered = await page.evaluate(async ({ url, proof }) => (await fetch(url, { headers: { 'X-Me-Proof': proof } })).json(), { url: `${resource.origin}/domains?all=1`, proof });
      check('2.2 the same proof for an altered request is refused', altered.error === 'QUERY_MISMATCH', JSON.stringify(altered));
      const direct = await page.evaluate(async (url) => (await fetch(url)).json(), `${resource.origin}/domains`);
      check('2.3 asking the resource directly, with no proof, is refused (the GUI is not the gate)', direct.error === 'PROOF_MISSING', JSON.stringify(direct));
      await context.close();
    }

    // 3. A proof taken to another page, or used after it expires.
    {
      const context = await newContext();
      const page = await context.newPage();
      let stolen = null;
      // the host's own read is held back, so the proof is still unused
      await context.route(`${resource.origin}/domains`, (r) => { stolen = r.request().headers()['x-me-proof']; r.abort(); });
      await page.goto(hostUrl('&ttl=5000'));
      const popup = await ask(page);
      await approveAs(popup, 'ana', 'secret-a');
      await hostStatus(page, /error|refused/);
      await context.unroute(`${resource.origin}/domains`);
      const attackerPage = await context.newPage();
      await attackerPage.goto(`${attacker.origin}/agentHost.html`);
      const fromAttacker = await attackerPage.evaluate(async ({ url, proof }) => (await fetch(url, { headers: { 'X-Me-Proof': proof } })).json(), { url: `${resource.origin}/domains`, proof: stolen });
      check('3.1 a proof used from another origin is refused', fromAttacker.error === 'ORIGIN_MISMATCH', JSON.stringify(fromAttacker));
      await wait(5500);
      const late = await page.evaluate(async ({ url, proof }) => (await fetch(url, { headers: { 'X-Me-Proof': proof } })).json(), { url: `${resource.origin}/domains`, proof: stolen });
      check('3.2 a proof used after it expired is refused', late.error === 'EXPIRED', JSON.stringify(late));
      await context.close();
    }

    // 4. Who approves still has to be allowed, and known.
    {
      const context = await newContext();
      const page = await context.newPage();
      await page.goto(hostUrl());
      await approveAs(await ask(page), 'bob', 'secret-b');
      check('4.1 a valid approval from an identity without the permission gets no data (403)', await hostStatus(page, /^refused: 403/), await text(page, '[data-host="status"]'));
      await approveAs(await ask(page), 'carol', 'secret-c');
      check('4.2 an identity whose key the server does not hold is refused (401)', await hostStatus(page, /^refused: 401 UNKNOWN_KEY/), await text(page, '[data-host="status"]'));
      await context.close();
    }

    // 5. Saying no, or walking away, ends it: nothing continues unsigned.
    {
      const context = await newContext();
      const page = await context.newPage();
      await page.goto(hostUrl());
      const before = resource.requests.length;
      await (await ask(page)).click('[data-agent="reject"]');
      check('5.1 rejecting ends the request; nothing is sent', (await hostStatus(page, /agent: rejected/)) && resource.requests.length === before);
      (await ask(page)).close();
      check('5.2 closing the agent window ends the request; nothing is sent', (await hostStatus(page, /agent: closed/)) && resource.requests.length === before);
      await context.close();
    }

    // 6. What an attacker page can and cannot do with the agent.
    {
      const context = await newContext();
      const page = await context.newPage();
      await page.goto(`${attacker.origin}/agentHost.html`);
      // embedding it
      await page.evaluate((url) => { const f = document.createElement('iframe'); f.src = url; f.name = 'embedded'; document.body.append(f); }, agentUrl);
      const frame = page.frameLocator('iframe[name="embedded"]');
      await frame.locator('[data-agent="framed"]').waitFor({ timeout: 10000 }).catch(() => {});
      check('6.1 embedded in another page, the agent refuses to run (no form)', (await frame.locator('[data-agent="framed"]').count()) === 1 && (await frame.locator('input[name="secret"]').count()) === 0);
      // reading it
      // after it has loaded: until then the new window is still its initial about:blank, which is same-origin
      const readable = await page.evaluate(async (url) => {
        const w = window.open(url, 'peek');
        await new Promise((r) => setTimeout(r, 2500));
        try { return String(w.document.body.innerHTML.length); } catch (e) { return `blocked: ${e.name}`; } finally { w.close(); }
      }, agentUrl);
      check('6.2 the page that opened the agent cannot read its window', readable.startsWith('blocked'), readable);
      // lying about who it is
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
      const shown = await popup.locator('[data-agent="origin"]').textContent().catch(() => '');
      check('6.3 a request that claims another origin is ignored; the agent shows the real one', shown === attacker.origin, shown);
      await popup.close();
      await context.close();
    }

    // 7. The answer goes only to the origin that asked.
    {
      const context = await newContext();
      const page = await context.newPage();
      await page.goto(hostUrl());
      const popup = await ask(page);
      await page.goto(`${attacker.origin}/agentHost.html`);   // the opener navigates to another origin before approving
      await page.evaluate(() => { window.__got = []; window.addEventListener('message', (e) => window.__got.push(e.data?.type)); });
      await approveAs(popup, 'ana', 'secret-a');
      await wait(1500);
      const got = await page.evaluate(() => window.__got);
      check('7.1 if the asking page navigated away, the new page does not receive the approval', got.length === 0, JSON.stringify(got));
      await context.close();
    }

    check('nothing was requested outside the test origins', outside.length === 0, outside.slice(0, 3).join(', '));
  } finally {
    await browser.close();
    [agent, host, attacker].forEach((s) => s.stop());
    await resource.close();
  }
  console.log(failed ? `\n${failed} failed` : '\nno failures');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
