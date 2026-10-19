// The development path, end to end, disposable: the interface through netget's door, the API on its OWN port, and the
// namespace independent of the port -- with the NEW client code (cleaker's binder, the link model) in front.
//
//   fulltrailer.<root>:<door>/        the interface, served through a real OpenResty (netget's generated blocks + Lua)
//   fulltrailer.<root>:<door>/api/..  a declared connection of the door -> the app's server
//   fulltrailer.<root>:<apiPort>/     the same server reached directly on ITS port (the ":9901" role)
//
// What is checked, as a client sees it:
//   * the namespace is the same through the three addresses; the transports are three different ones;
//   * a sign-in written with the door's port reaches the door's monad; written with the API's port it goes THERE and only
//     there (the API is not a monad: it refuses, and no signed proof reaches the door's monad or anywhere else);
//   * a written port that contradicts the transport the node was built for is a conflict, nothing sent;
//   * verification and session of one door do not appear on the other (the link model).
//
// Disposable only: its own data dir, its own ports, nginx killed by pid. Needs OpenResty (skips without it). Run from the
// GUI worktree: npx tsx tests/port-namespace/recorrido.netget.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const ALL = path.resolve(process.cwd(), '../..');                         // all.this
const NETGET = path.join(ALL, 'netget-main-entry/Typescript');
const CLEAKER = path.join(ALL, 'cleaker-port-namespace/Typescript');
const openrestyBin = ['/opt/homebrew/bin/openresty', '/usr/local/bin/openresty', '/usr/bin/openresty'].find((p) => fs.existsSync(p));
if (!openrestyBin) { console.log('recorrido.netget: skipped (no openresty on this machine)'); process.exit(0); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'port-recorrido-'));
const dataDir = path.join(tmp, 'data');
process.env.NETGET_DATA_DIR = dataDir;
process.env.NETGET_LETSENCRYPT_LIVE_DIR = path.join(tmp, 'live');
fs.mkdirSync(path.join(dataDir, 'runtime'), { recursive: true });
delete process.env.NETGET_GATEWAY_UPSTREAM;

const { getNetgetAppConfContent } = await import(path.join(NETGET, 'src/modules/NetGetX/OpenResty/setNginxConfigRoutes.ts'));
const { default: cleaker } = await import(path.join(CLEAKER, 'index.ts'));
const { default: ME } = await import('this.me');
const { targetKey, openLink, applyReading, isReady, checkWrittenDoor } = await import('../../src/react/link');
const { parseNamespaceExpression } = await import(path.join(CLEAKER, 'src/namespace/expression.ts'));

const results: boolean[] = [];
const check = (name: string, ok: boolean, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`); };

// ── the generated blocks ────────────────────────────────────────────────────────────────────────────────────────────
const conf = getNetgetAppConfContent();
function block(from: number): string {
  let depth = 0;
  for (let i = conf.indexOf('{', from); i < conf.length; i += 1) {
    if (conf[i] === '{') depth += 1;
    else if (conf[i] === '}') { depth -= 1; if (depth === 0) return conf.slice(from, i + 1); }
  }
  throw new Error('unbalanced block');
}
const appsBlock = block(conf.indexOf('location ~ ^/apps/([^/]+)(/.*)?$ {'));
const slashStart = [...conf.matchAll(/location \/ \{/g)].map((m) => m.index!).find((i) => /surface_proxy\.lua/.test(block(i)))!;
const slashBlock = block(slashStart);
const connStart = conf.indexOf('location @door_connection {');
const errStart = conf.indexOf('location @door_connection_error {');
const doorConnection = `    set $door_connection_target "";\n    set $door_connection_prefix "";\n${block(connStart)}\n${block(errStart)}`;
const meshError = block(conf.indexOf('location @mesh_gateway_error {'));
const cacheMap = (conf.match(/map \$upstream_http_cache_control \$netget_default_cache_control \{[\s\S]*?\n    \}/) ?? [''])[0];

// ── upstreams: the door's monad, and the app's own server on its OWN port ───────────────────────────────────────────
const freePort = () => new Promise<number>((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as any).port; s.close(() => resolve(p)); }); });
const [monadPort, apiPort, doorPort] = [await freePort(), await freePort(), await freePort()];
const ROOT = 'suis-macbook-air.local';
const APP = `fulltrailer.${ROOT}`;           // the namespace under test: the app's namespace
const signIns: Array<{ via: 'monad' | 'api'; namespace: string; signed: boolean }> = [];
const monad = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    let body: any = {}; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* none */ }
    if (req.method === 'POST' && /\/claims\/signIn$/.test(req.url ?? '')) {
      signIns.push({ via: 'monad', namespace: String(body?.namespace || ''), signed: Boolean(body?.proof?.signature) });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, namespace: body.namespace, identityHash: String(body?.proof?.identityHash || 'h'), memories: [], openedAt: Date.now() }));
      return;
    }
    if (req.url === '/') { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><title>FullTrailer</title>'); return; }
    res.statusCode = 404; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ who: 'monad', url: req.url }));
  });
});
const api = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    if (req.method === 'POST' && /\/claims\/signIn$/.test(req.url ?? '')) signIns.push({ via: 'api', namespace: '', signed: true });
    res.statusCode = /^\/api\/fuel/.test(req.url ?? '') ? 200 : 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ who: 'api', url: req.url, host: req.headers.host }));
  });
});
const listen = (s: http.Server, p: number) => new Promise<void>((r) => s.listen(p, '127.0.0.1', () => r()));
await listen(monad, monadPort); await listen(api, apiPort);

const now = Date.now();
fs.writeFileSync(path.join(dataDir, 'runtime', 'apps.json'), JSON.stringify({ apps: { a: {
  name: 'monad:fulltrailer', kind: 'monad', host: '127.0.0.1', port: monadPort, protocol: 'http', ttlMs: 600000, lastSeenMs: now, trust: 'peer', tags: ['monad'],
  exposure: { enabled: true, visibility: 'loopback', network: { allowLoopback: true, allowLan: false, allowPublic: false } },
  metadata: { monadName: 'fulltrailer', namespace: APP, identity: APP, identity_hash: 'fulltrailer-id', endpoint: `http://127.0.0.1:${monadPort}`, directEndpoint: `http://127.0.0.1:${monadPort}`, claimed_namespaces: [APP] },
} } }));
fs.writeFileSync(path.join(dataDir, 'runtime', 'domain-map.json'), JSON.stringify({ version: 1, domains: {
  [APP]: { type: 'server', target: 'app:fulltrailer', ssl: { enabled: false }, connections: [{ prefix: '/api/fuel', target: `127.0.0.1:${apiPort}` }] },
} }));

// ── a real OpenResty with those blocks ──────────────────────────────────────────────────────────────────────────────
const prefix = path.join(tmp, 'or');
for (const d of ['conf', 'logs']) fs.mkdirSync(path.join(prefix, d), { recursive: true });
fs.symlinkSync(path.join(NETGET, 'src/modules/NetGetX/OpenResty/lua'), path.join(prefix, 'lua'));
fs.writeFileSync(path.join(prefix, 'conf', 'nginx.conf'), `worker_processes 1;
pid ${path.join(prefix, 'logs', 'nginx.pid')};
error_log ${path.join(prefix, 'logs', 'error.log')} info;
env NETGET_DATA_DIR;
events { worker_connections 64; }
http {
    access_log off;
    lua_package_path "${path.join(prefix, 'lua')}/?.lua;;";
${cacheMap}
    server {
        listen 127.0.0.1:${doorPort};
        server_name _;
        client_max_body_size 50m;
        set $door_entry "";
        set $door_status "";
${appsBlock}
${slashBlock}
${doorConnection}
${meshError}
    }
}
`);
const confPath = path.join(prefix, 'conf', 'nginx.conf');
execFileSync(openrestyBin, ['-t', '-p', prefix, '-c', confPath], { stdio: 'pipe' });
const nginx = spawn(openrestyBin, ['-p', prefix, '-c', confPath, '-g', 'daemon off;'], { stdio: 'ignore', env: { ...process.env, NETGET_DATA_DIR: dataDir } });
const nginxPid = nginx.pid;
const up = () => new Promise<boolean>((r) => { const c = net.connect(doorPort, '127.0.0.1', () => { c.destroy(); r(true); }); c.on('error', () => r(false)); });
for (let i = 0; i < 60 && !(await up()); i += 1) await new Promise((r) => setTimeout(r, 100));

/** The names are not in DNS: the client's fetch connects to 127.0.0.1 at the port written in the URL and keeps the Host. */
const everything: string[] = [];
const fetcher: typeof fetch = async (input: any, init?: RequestInit) => {
  const url = new URL(String(input));
  everything.push(`${url.protocol}//${url.host}${url.pathname}`);
  // the disposable door and API speak plain HTTP: a request that asks for TLS cannot be answered by them
  if (url.protocol === 'https:') return Object.assign(new Response('', { status: 0 }), { __networkError: true });
  return new Promise<Response>((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: Number(url.port || 80), path: url.pathname + url.search, method: init?.method ?? 'GET',
      headers: { ...(init?.headers as Record<string, string> | undefined), Host: url.host } }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks).toString('utf8'), { status: res.statusCode ?? 0, headers: res.headers as any })));
    });
    req.on('error', () => resolve(Object.assign(new Response('', { status: 0 }), { __networkError: true })));
    if (init?.body) req.write(init.body as any);
    req.end();
  });
};
const get = (host: string, p: string) => fetcher(`http://${host}${p}`, { headers: { Accept: 'application/json' } }).then(async (r) => ({ status: r.status, text: await r.text() }));

async function signInFor(base: string, namespace: string) {
  const me: any = new (ME as any)('ana', 'a-long-secret-1', { namespace: APP });
  const node = cleaker(me, base, { fetcher });
  await new Promise((r) => setTimeout(r, 80));                // the background auto-open settles first
  const sentBefore = signIns.length;
  const seenBefore = everything.length;
  let result: any = null; let error: string | null = null;
  try { result = await node.signIn({ namespace }); } catch (e: any) { error = String(e?.message || e); }
  return { result, error, signIns: signIns.slice(sentBefore), contacted: everything.slice(seenBefore) };
}

try {
  check('0. the disposable door is up', await up(), `door :${doorPort}, API :${apiPort}, monad :${monadPort}`);

  // 1. the interface and the API, as netget serves them
  const ui = await get(`${APP}:${doorPort}`, '/');
  check('1.1 the interface comes through the door', ui.status === 200 && /FullTrailer/.test(ui.text), `status ${ui.status}`);
  const viaDoor = await get(`${APP}:${doorPort}`, '/api/fuel/2026');
  check('1.2 /api/fuel goes through the door to the app\'s server', JSON.parse(viaDoor.text || '{}').who === 'api' && viaDoor.status === 200);
  const direct = await get(`${APP}:${apiPort}`, '/api/fuel/2026');
  check('1.3 the same server answers on its own port', JSON.parse(direct.text || '{}').who === 'api' && direct.status === 200);

  // 2. the namespace is the same through every address; the transports are not
  const forms = [`ana.${APP}`, `ana.${APP}:${doorPort}`, `ana.${APP}:${apiPort}`].map((f) => parseNamespaceExpression(f));
  check('2.1 one namespace through three addresses', new Set(forms.map((f: any) => f.constant)).size === 1 && forms[0].constant === APP, forms.map((f: any) => f.constant).join(' | '));
  check('2.2 three transports', new Set(forms.map((f: any) => f.transport.origin)).size === 3);

  // 3. a sign-in through the DOOR's port reaches the door's monad, with the bare namespace
  const door = await signInFor(`http://${APP}:${doorPort}`, `ana.${APP}`);
  check('3.1 through the door: it signs in', door.error === null && door.signIns.length === 1 && door.signIns[0].via === 'monad', door.error ?? `${door.signIns.length} sign-in(s)`);
  check('3.2 the namespace that arrived is the bare one, signed', door.signIns[0]?.namespace === `ana.${APP}` && door.signIns[0]?.signed === true, door.signIns[0]?.namespace);

  // 4. written with the API's port: goes THERE, only there; no signed proof reaches the door's monad
  const viaApi = await signInFor(`http://${APP}`, `ana.${APP}:${apiPort}`);
  check('4.1 the API is not a monad: the attempt fails', viaApi.error !== null, String(viaApi.error));
  check('4.2 every destination contacted is the API\'s port', viaApi.contacted.length > 0 && viaApi.contacted.every((c) => c.includes(`:${apiPort}`)), viaApi.contacted.join(', '));
  check('4.3 no signed proof reached the door\'s monad', viaApi.signIns.filter((s) => s.via === 'monad').length === 0);

  // 5. a written port that contradicts the transport the node was built for
  const conflict = await signInFor(`http://${APP}:${doorPort}`, `ana.${APP}:${apiPort}`);
  check('5.1 the contradiction is reported, not resolved', conflict.error === 'TRANSPORT_PORT_CONFLICT', String(conflict.error));
  check('5.2 nothing was sent for it', conflict.contacted.length === 0 && conflict.signIns.length === 0);
  const door2 = checkWrittenDoor({ namespace: APP, transport: `http://${APP}:${doorPort}` }, apiPort);
  check('5.3 the GUI says the same (conflict)', door2.state === 'conflict');

  // 6. verification of one door is not the other's (the link model)
  const A = openLink({ namespace: APP, transport: `http://${APP}:${doorPort}` });
  const B = openLink({ namespace: APP, transport: `http://${APP}:${apiPort}` });
  const A2 = applyReading(A, { kind: 'answer', of: A.id, answeredNamespace: APP, signature: 'valid' });
  check('6.1 two doors are two links', A.id !== B.id && targetKey(A.target) !== targetKey(B.target));
  check('6.2 the door that answered is ready; the API\'s is not', isReady(A2) && !isReady(B));
  check('6.3 a reading for one door does not confirm the other', !isReady(applyReading(B, { kind: 'answer', of: A.id, answeredNamespace: APP, signature: 'valid' })));
} finally {
  try { process.kill(nginxPid!, 'SIGTERM'); } catch { /* gone */ }
  monad.close(); api.close();
  await new Promise((r) => setTimeout(r, 300));
  fs.rmSync(tmp, { recursive: true, force: true });
}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length}`);
process.exit(failed ? 1 : 0);
