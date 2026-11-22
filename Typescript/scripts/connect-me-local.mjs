// LOCAL try-out of "connect your .me" on the identity QR (AppShell identityConnect) -- disposable, nothing real, stops with Ctrl-C.
//
//   MONAD_DIR=<built monad Typescript dir> node scripts/connect-me-local.mjs      (from Typescript/)
//
// Starts, on this machine only:
//   - the identity window at http://127.0.0.1:5391/ (its own origin's root; /agent.html is an alias; DEMO=true)
//   - a DISPOSABLE monad at http://127.0.0.1:5392, root `cleaker.me`, a throwaway seed, state in a temp dir
//   Ports 3000, 5320, 80 and 443 are reserved (real backend / real .me) and are refused.
// Then: open the printed "create" link once to make a test identity, and in Storybook open
// Getting Started/Namespace → "2 · Namespace + site with .GUI" and tap the QR in the corner (top left).
// Nothing is published, nothing reaches the internet (the monad's fetch is blocked outside itself).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MONAD_DIR = process.env.MONAD_DIR || path.join(os.homedir(), 'Desktop/Neuroverse/.grok-tmp/monad-pinned-53ab050f/Typescript');
const AGENT_PORT = Number(process.env.AGENT_PORT || 5391);
const MONAD_PORT = Number(process.env.MONAD_PORT || 5392);
const RESERVED = new Set([80, 443, 3000, 5320]);
if (RESERVED.has(AGENT_PORT) || RESERVED.has(MONAD_PORT)) {
  console.error('refusing reserved port (80, 443, 3000, 5320); set AGENT_PORT / MONAD_PORT to a free disposable port');
  process.exit(1);
}
const NS = 'cleaker.me';
const agentOrigin = `http://127.0.0.1:${AGENT_PORT}`;
const monadOrigin = `http://127.0.0.1:${MONAD_PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'connect-me-local-'));
for (const d of ['home', 'state', 'claims']) fs.mkdirSync(path.join(dir, d), { recursive: true });
const trust = path.join(dir, 'cleaker-trust.json');
fs.writeFileSync(trust, JSON.stringify([{ audience: monadOrigin, transports: [monadOrigin] }]));
const block = path.join(dir, 'block-fetch.mjs');
fs.writeFileSync(block, "const port=Number(process.env.PORT);const real=globalThis.fetch;globalThis.fetch=(i,o)=>{const u=new URL(typeof i==='string'||i instanceof URL?i:i.url);if(!['127.0.0.1','localhost'].includes(u.hostname)||Number(u.port)!==port)return Promise.reject(new Error('blocked outside fixture: '+u.origin));return real(i,o);};\n");

const children = [];
const stopAll = () => { for (const c of children) { try { c.kill('SIGTERM'); } catch { /* gone */ } } };
process.on('exit', stopAll);
process.on('SIGINT', () => { stopAll(); process.exit(0); });
process.on('SIGTERM', () => { stopAll(); process.exit(0); });

children.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(AGENT_PORT), '--strictPort', '--host', '127.0.0.1'], {
  cwd: root, env: { ...process.env, DEMO: 'true', BROWSER: 'none', CLEAKER_TRUST_FILE: trust }, stdio: 'ignore',
}));
const log = fs.openSync(path.join(dir, 'monad.log'), 'a');
children.push(spawn(process.execPath, [path.join(MONAD_DIR, 'dist/server.js')], {
  cwd: MONAD_DIR, stdio: ['ignore', log, log], env: {
    PATH: process.env.PATH, HOME: path.join(dir, 'home'), ME_STATE_DIR: path.join(dir, 'state'), MONAD_CLAIM_DIR: path.join(dir, 'claims'),
    MONAD_SELF_CONFIG_PATH: path.join(dir, 'self.json'), ME_NAMESPACE: NS, SEED: 'disposable-connect-me-local-not-real',
    MONAD_NETGET_DISABLED: '1', NETGET_LOCAL: 'http://127.0.0.1:9', MONAD_SURFACE_URL: '', PORT: String(MONAD_PORT), MONAD_PORT: String(MONAD_PORT),
    NODE_OPTIONS: `--import ${block}`, MONAD_AGENT_AUDIENCES: monadOrigin, MONAD_AGENT_ORIGINS: agentOrigin,
  },
}));

const up = async (url) => { for (let i = 0; i < 150; i += 1) { try { if ((await fetch(url)).ok) return true; } catch { /* not yet */ } await new Promise((r) => setTimeout(r, 200)); } return false; };
const [a, m] = await Promise.all([up(`${agentOrigin}/agent.html`), up(`${monadOrigin}/__surface`)]);
if (!a || !m) { console.error(`did not come up (agent ${a}, monad ${m}); monad log: ${dir}/monad.log`); stopAll(); process.exit(1); }
console.log(`READY
  window ${agentOrigin}/
  monad  ${monadOrigin}   (disposable, root ${NS}, state ${dir})

1. Make a test identity (once):  ${agentOrigin}/?create=${encodeURIComponent(monadOrigin)}&ns=${NS}
2. Storybook (npm run storybook): Getting Started/Namespace → "2 · Namespace + site with .GUI" → tap the corner QR
   or the plain test site:        ${agentOrigin}/connectMe.html?agent=${encodeURIComponent(`${agentOrigin}/`)}&root=${NS}&audience=${encodeURIComponent(monadOrigin)}
Ctrl-C stops everything.`);
