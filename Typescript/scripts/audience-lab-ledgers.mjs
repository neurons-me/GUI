#!/usr/bin/env node
// Local, disposable ledgers for the Audience Lab (Storybook: All.This/Audiences). Each ledger is a real monad in its own
// process (the monad's kernel is a process singleton): temp state, its own root and port, registered nowhere, nothing under
// ~/.monad or ~/.get is written (the release is only read, as code).
//
//   npm run lab:ledgers                 A :18331 a-test.local, B :18332 b-test.local, C :18333 c-test.local
//   LAB_LEDGERS=2 npm run lab:ledgers   only A and B
//   MONAD_DIST=/path/to/monad/dist/src/index.js npm run lab:ledgers
//
// Ctrl-C stops them all.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(import.meta.url);
const LEDGERS = [
  { id: 'A', root: 'a-test.local', port: 18331 },
  { id: 'B', root: 'b-test.local', port: 18332 },
  { id: 'C', root: 'c-test.local', port: 18333 },
];
const dist = process.env.MONAD_DIST || path.join(os.homedir(), '.get/releases/r20261008-3/modules/monad/Typescript/dist/src/index.js');

if (process.argv[2] === '--one') {
  const [root, portText] = process.argv.slice(3);
  const port = Number(portText);
  process.env.MONAD_NETGET_DISABLED = '1';
  process.env.NETGET_LOCAL = 'http://127.0.0.1:9';
  const { createMonadApp } = await import(dist);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'audience-lab-'));
  const dir = path.join(tmp, 'monad');
  fs.mkdirSync(dir, { recursive: true });
  const app = await createMonadApp({
    cwd: dir, seed: `audience-lab-seed-${root}`, namespace: root,
    stateDir: path.join(dir, 'me-state'), claimDir: path.join(dir, 'claims'), selfConfigPath: path.join(dir, 'self.json'),
    selfIdentity: root, selfHostname: root, selfEndpoint: `http://127.0.0.1:${port}`, selfTags: ['local'], port,
    guiPkgDistDir: dir, mePkgDistDir: dir, cleakerPkgDistDir: dir, reactUmdDir: dir, reactDomUmdDir: dir,
    routesPath: path.join(dir, 'routes.js'), modules: [], logger: false,
  });
  await new Promise((resolve) => app.listen(port, '127.0.0.1', resolve));
  console.log(`ledger ${root} on http://127.0.0.1:${port}  (state ${dir})`);
  setInterval(() => {}, 1 << 30);
} else {
  if (!fs.existsSync(dist)) {
    console.error(`No monad build at ${dist}\nSet MONAD_DIST to a monad dist/src/index.js.`);
    process.exit(1);
  }
  const count = Math.max(1, Math.min(LEDGERS.length, Number(process.env.LAB_LEDGERS || LEDGERS.length)));
  const children = LEDGERS.slice(0, count).map((l) => {
    const child = spawn(process.execPath, [here, '--one', l.root, String(l.port)], { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('exit', (code) => console.log(`ledger ${l.id} exited (${code})`));
    return child;
  });
  const stop = () => { children.forEach((c) => c.kill()); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  console.log(`starting ${count} ledger(s)…  Ctrl-C stops them.`);
}
