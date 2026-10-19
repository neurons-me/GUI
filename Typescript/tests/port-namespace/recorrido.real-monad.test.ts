// The development path with a REAL disposable monad behind the door: claim, re-entry with the same identity, a
// contradictory written port, and no proof sent to implicit fallbacks -- the client is the GUI's own session code over the
// new cleaker; the monad is monad-candidate's source run in a process of its own; the door is a real OpenResty with
// netget's generated blocks and Lua.
//
//   REAL_MONAD_SRC=<monad tree>  (default: all.this/monad-candidate/Typescript, whose node_modules must point at the
//   cleaker under test and a this.me >= 4.2.0)  npx tsx tests/port-namespace/recorrido.real-monad.test.ts
//
// Disposable only: its own data dir and ports; the monad and nginx are killed by pid; nothing is written outside tmp.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const ALL = path.resolve(process.cwd(), '../..');
const NETGET = path.join(ALL, 'netget-main-entry/Typescript');
const MONAD = path.resolve(process.env.REAL_MONAD_SRC || path.join(ALL, 'monad-candidate/Typescript'));
const openrestyBin = ['/opt/homebrew/bin/openresty', '/usr/local/bin/openresty', '/usr/bin/openresty'].find((p) => fs.existsSync(p));
if (!openrestyBin) { console.log('recorrido.real-monad: skipped (no openresty on this machine)'); process.exit(0); }
if (!fs.existsSync(path.join(MONAD, 'node_modules'))) { console.log('recorrido.real-monad: skipped (monad tree has no node_modules)'); process.exit(0); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'port-real-monad-'));
const dataDir = path.join(tmp, 'data');
process.env.NETGET_DATA_DIR = dataDir;
process.env.NETGET_LETSENCRYPT_LIVE_DIR = path.join(tmp, 'live');
fs.mkdirSync(path.join(dataDir, 'runtime'), { recursive: true });
delete process.env.NETGET_GATEWAY_UPSTREAM;

const { getNetgetAppConfContent } = await import(path.join(NETGET, 'src/modules/NetGetX/OpenResty/setNginxConfigRoutes.ts'));
const { createCleakerSession } = await import('../../src/core/session/createCleakerSession');

const results: boolean[] = [];
const check = (name: string, ok: boolean, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`); };

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

const freePort = () => new Promise<number>((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = (s.address() as any).port; s.close(() => resolve(p)); }); });
const [monadPort, apiPort, doorPort, deadPort] = [await freePort(), await freePort(), await freePort(), await freePort()];
const ROOT = 'suis-macbook-air.local';
const APP = `fulltrailer.${ROOT}`;
const tag = Math.random().toString(36).slice(2, 7);

// the app's own server on its own port (not a monad)
const api = http.createServer((req, res) => { res.setHeader('content-type', 'application/json'); res.statusCode = /^\/api\/fuel/.test(req.url ?? '') ? 200 : 404; res.end(JSON.stringify({ who: 'api', url: req.url })); });
await new Promise<void>((r) => api.listen(apiPort, '127.0.0.1', () => r()));

// the REAL monad, in a process of its own, run from its own tree
const monadProc = spawn(path.join(MONAD, 'node_modules/.bin/tsx'), [path.resolve('tests/port-namespace/monad-disposable.mts'), String(monadPort), ROOT, `seed-${tag}-${'m'.repeat(24)}`, MONAD],
  { cwd: MONAD, stdio: ['ignore', 'pipe', 'pipe'] });
let monadLog = '';
monadProc.stdout.on('data', (d) => { monadLog += String(d); });
monadProc.stderr.on('data', (d) => { monadLog += String(d); });
for (let i = 0; i < 120 && !/READY/.test(monadLog); i += 1) await new Promise((r) => setTimeout(r, 250));
if (!/READY/.test(monadLog)) { console.log('FAIL  the disposable monad did not start\n' + monadLog.slice(-600)); try { monadProc.kill('SIGTERM'); } catch { /* gone */ } fs.rmSync(tmp, { recursive: true, force: true }); api.close(); process.exit(1); }

const now = Date.now();
fs.writeFileSync(path.join(dataDir, 'runtime', 'apps.json'), JSON.stringify({ apps: { a: {
  name: 'monad:fulltrailer', kind: 'monad', host: '127.0.0.1', port: monadPort, protocol: 'http', ttlMs: 600000, lastSeenMs: now, trust: 'peer', tags: ['monad'],
  exposure: { enabled: true, visibility: 'loopback', network: { allowLoopback: true, allowLan: false, allowPublic: false } },
  metadata: { monadName: 'fulltrailer', namespace: APP, identity: APP, identity_hash: 'fulltrailer-id', endpoint: `http://127.0.0.1:${monadPort}`, directEndpoint: `http://127.0.0.1:${monadPort}`, claimed_namespaces: [APP, ROOT] },
} } }));
fs.writeFileSync(path.join(dataDir, 'runtime', 'domain-map.json'), JSON.stringify({ version: 1, domains: {
  [APP]: { type: 'server', target: 'app:fulltrailer', ssl: { enabled: false }, connections: [{ prefix: '/api/fuel', target: `127.0.0.1:${apiPort}` }] },
} }));

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
const up = (p: number) => new Promise<boolean>((r) => { const c = net.connect(p, '127.0.0.1', () => { c.destroy(); r(true); }); c.on('error', () => r(false)); });
for (let i = 0; i < 60 && !(await up(doorPort)); i += 1) await new Promise((r) => setTimeout(r, 100));

/** The names are not in DNS: connect to 127.0.0.1 at the port written in the URL, keep the Host; TLS cannot be answered. */
const log: string[] = [];
const fetcher: typeof fetch = async (input: any, init?: RequestInit) => {
  const url = new URL(String(input));
  log.push(`${url.protocol}//${url.host}${url.pathname}`);
  if (url.protocol === 'https:') return Object.assign(new Response('', { status: 0 }), { __networkError: true });
  return new Promise<Response>((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: Number(url.port || 80), path: url.pathname + url.search, method: init?.method ?? 'GET',
      headers: { ...(init?.headers as Record<string, string> | undefined), Host: url.host } }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks).toString('utf8'), { status: res.statusCode ?? 0, headers: res.headers as any })));
    });
    req.on('error', (e) => reject(e));
    if (init?.body) req.write(init.body as any);
    req.end();
  });
};
const attempt = async <T,>(fn: () => Promise<T>) => { try { return { ok: true as const, value: await fn() }; } catch (e: any) { return { ok: false as const, code: String(e?.code || e?.message || e) }; } };
const link = (o: Record<string, unknown>) => createCleakerSession({ fetchImpl: fetcher, ...o } as any) as any;

const handle = `ana${tag}`;
const pw = `pw-${tag}-correct-horse`;
const NS = `${handle}.${ROOT}`;
const doorOrigin = `http://${APP}:${doorPort}`;

try {
  check('0. the door and the real monad are up', (await up(doorPort)) && (await up(monadPort)), `door :${doorPort}, monad :${monadPort}, API :${apiPort}`);

  // 1. claim and open through the door
  const s1 = link({ username: handle, password: pw, namespace: ROOT, transportOrigin: doorOrigin });
  const claimed = await attempt(() => s1.claimAndOpen(NS));
  check('1.1 claim + open through the door, against a real monad', claimed.ok && s1.semanticNamespace === NS,
    claimed.ok ? `identity ${String(s1.identityHash).slice(0, 12)}` : String((claimed as any).code));
  if (!claimed.ok) { console.log('monad log tail:\n' + monadLog.slice(-500)); throw new Error('claim failed'); }
  const H = s1.identityHash;

  // 2. coming back in: same name and secret -> the same identity, the same namespace
  const s2 = link({ username: handle, password: pw, namespace: ROOT, transportOrigin: doorOrigin });
  const again = await attempt(() => s2.open(NS));
  check('2.1 back in through the door: the same identity and namespace', again.ok && s2.identityHash === H && s2.semanticNamespace === NS);

  // 3. the same identity directly on the monad's own port: the namespace does not depend on the door used
  const s3 = link({ username: handle, password: pw, namespace: ROOT, transportOrigin: `http://127.0.0.1:${monadPort}` });
  const direct = await attempt(() => s3.open(NS));
  check('3.1 the same identity and namespace through the monad\'s own port', direct.ok && s3.identityHash === H && s3.semanticNamespace === NS,
    direct.ok ? '' : String((direct as any).code));

  // 4. the root written with the API's port against the door the session was built for: a conflict, nothing sent
  const s4 = link({ username: handle, password: pw, namespace: `${ROOT}:${apiPort}`, transportOrigin: doorOrigin });
  await new Promise((r) => setTimeout(r, 150));
  const before4 = log.length;
  const conflict = await attempt(() => s4.open(`${handle}.${ROOT}:${apiPort}`));
  check('4.1 a contradictory written port is refused', !conflict.ok && /TRANSPORT_PORT_CONFLICT/.test(String((conflict as any).code)), String((conflict as any).code));
  check('4.2 nothing was sent for it', log.length === before4, log.slice(before4).join(', '));

  // 5. a page served from the DOOR, a link declared toward a dead door: nothing reaches the door, the monad or any fallback
  const g = globalThis as any;
  const hadLocation = Object.prototype.hasOwnProperty.call(g, 'location'); const prevLocation = g.location;
  g.location = { origin: `http://${APP}:${doorPort}`, href: `http://${APP}:${doorPort}/app`, hostname: APP, host: `${APP}:${doorPort}`, protocol: 'http:' };
  try {
    const s5 = link({ username: handle, password: pw, namespace: ROOT, transportOrigin: `http://${APP}:${deadPort}` });
    await new Promise((r) => setTimeout(r, 150));
    const before5 = log.length;
    const dead = await attempt(() => s5.open(NS));
    const touched = [...new Set(log.slice(before5).map((u) => new URL(u).host))];
    check('5.1 the declared door is down: the attempt fails', !dead.ok, String((dead as any).code));
    check('5.2 only that door was contacted (not the page\'s door, not the monad, not cleaker.me/localhost)',
      touched.length > 0 && touched.every((h) => h === `${APP}:${deadPort}`), touched.join(', ') || '(none)');
  } finally {
    if (hadLocation) g.location = prevLocation; else delete g.location;
  }

  // 6. the three doors are still one namespace and one identity
  check('6.1 one identity, one namespace, three transports', [s1, s2, s3].every((s) => s.identityHash === H && s.semanticNamespace === NS));
} finally {
  try { process.kill(nginxPid!, 'SIGTERM'); } catch { /* gone */ }
  try { monadProc.kill('SIGTERM'); } catch { /* gone */ }
  api.close();
  await new Promise((r) => setTimeout(r, 800));
  const left = (await up(monadPort)) ? 'STILL LISTENING' : 'gone';
  console.log(`disposable monad port: ${left}`);
  fs.rmSync(tmp, { recursive: true, force: true });
}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length}`);
process.exit(failed ? 1 : 0);
