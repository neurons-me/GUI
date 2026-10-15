// One DISPOSABLE monad (own process, kernel, state dir) for tests/port-namespace/recorrido.real-monad.test.ts.
//   tsx monad-disposable.mts <port> <root> <seed> <monadSrcDir>
// Run it from the monad's own tree (so its node_modules are the ones under test). SIGTERM removes its state dir.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [port, root, seed, monadSrc] = process.argv.slice(2);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), `port-monad-${root}-`));
process.env.ME_STATE_DIR = path.join(dir, 'me-state'); process.env.MONAD_CLAIM_DIR = path.join(dir, 'claims');
process.env.SEED = seed; process.env.ME_NAMESPACE = root; process.env.MONADS_HOME = path.join(dir, 'home');
process.env.MONAD_NETGET_DISABLED = '1';
const { createMonadApp } = await import(path.join(monadSrc, 'src/index.ts'));
const app = await createMonadApp({ cwd: dir, seed, namespace: root, stateDir: path.join(dir, 'me-state'), claimDir: path.join(dir, 'claims'), selfConfigPath: path.join(dir, 'self.json') });
const srv = app.listen(Number(port), '127.0.0.1', () => console.log('READY', port, root));
const stop = () => { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
