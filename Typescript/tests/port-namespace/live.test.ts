// The recorrido against a DISPOSABLE monad with a real (throwaway) identity: registering, then coming back in.
// Skipped unless a disposable monad is given:
//   PT_ORIGIN=http://127.0.0.1:18441 PT_ROOT=port-test.local npx tsx tests/port-namespace/live.test.ts
// "Coming back in" must keep the same identity: a new registration working is not enough.
import './shim';
import { createCleakerSession } from '../../src/core/session/createCleakerSession';
import { findLocalIdentityVault, saveLocalIdentityVault } from '../../src/core/identity/localIdentityVault';
import { splitTypedNamespace } from '../../src/gui/All.This/Cleaker/signedRequest';
import { bytesToHex } from '../../src/core/identity/recoveryPhrase';
import { identityHashOfRoot } from '../../src/core/session/createSeedSession';

const ORIGIN = process.env.PT_ORIGIN, ROOT = process.env.PT_ROOT;
if (!ORIGIN || !ROOT) { console.log('port-namespace live: skipped (set PT_ORIGIN, PT_ROOT)'); process.exit(0); }
const port = new URL(ORIGIN).port;
const tag = Math.random().toString(36).slice(2, 7);
const pw = `pw-${tag}-correct-horse`;
const link = (o: Record<string, unknown>) => createCleakerSession(o as any) as any;
const attempt = async <T,>(fn: () => Promise<T>) => { try { return { ok: true as const, value: await fn() }; } catch (e: any) { return { ok: false as const, code: String(e?.code || ''), message: String(e?.message || e).slice(0, 90) }; } };
const results: boolean[] = [];
const check = (kind: 'CHAR' | 'CONTRACT', name: string, ok: boolean, detail = '') => { if (kind === 'CONTRACT') results.push(ok); console.log(`${kind === 'CHAR' ? 'OBSERVED' : ok ? 'PASS    ' : 'FAIL    '} ${name}${detail ? `  — ${detail}` : ''}`); };

async function main() {
  const handle = `ana-${tag}`;
  // registered through the bare root: the baseline identity
  const s1 = link({ username: handle, password: pw, namespace: ROOT, transportOrigin: ORIGIN });
  const reg = await attempt(() => s1.claimAndOpen(`${handle}.${ROOT}`));
  check('CHAR', 'registration through the bare root', reg.ok, reg.ok ? `identity ${String(s1.identityHash).slice(0, 12)}` : `${(reg as any).code} ${(reg as any).message}`);
  if (!reg.ok) process.exit(2);
  const H = s1.identityHash;

  // coming back in the same way
  const s2 = link({ username: handle, password: pw, namespace: ROOT, transportOrigin: ORIGIN });
  const again = await attempt(() => s2.open(`${handle}.${ROOT}`));
  check('CONTRACT', 'back in through the same name: the same identity', again.ok && s2.identityHash === H);

  // coming back in with the PORT written in the root
  const rootWithPort = `${ROOT}:${port}`;
  const s3 = link({ username: handle, password: pw, namespace: rootWithPort, transportOrigin: ORIGIN });
  const viaPort = await attempt(() => s3.open(`${handle}.${rootWithPort}`));
  check('CHAR', `back in with the port written (${rootWithPort})`, viaPort.ok, viaPort.ok ? `identity ${String(s3.identityHash).slice(0, 12)} ns ${s3.semanticNamespace}` : `${(viaPort as any).code} ${(viaPort as any).message}`);
  check('CONTRACT', 'back in with the port written: the SAME identity, under the SAME namespace', viaPort.ok && s3.identityHash === H && s3.semanticNamespace === `${handle}.${ROOT}`,
    viaPort.ok ? `ns ${s3.semanticNamespace}` : 'refused');

  // registered with the port written, then back in without it
  const h2 = `bea-${tag}`;
  const s4 = link({ username: h2, password: pw, namespace: rootWithPort, transportOrigin: ORIGIN });
  const reg2 = await attempt(() => s4.claimAndOpen(`${h2}.${rootWithPort}`));
  check('CHAR', 'registration with the port written', reg2.ok, reg2.ok ? `ns ${s4.semanticNamespace}` : `${(reg2 as any).code} ${(reg2 as any).message}`);
  if (reg2.ok) {
    const s5 = link({ username: h2, password: pw, namespace: ROOT, transportOrigin: ORIGIN });
    const back = await attempt(() => s5.open(`${h2}.${ROOT}`));
    check('CONTRACT', 'registered with the port, back in without it: the same identity', back.ok && s5.identityHash === s4.identityHash,
      back.ok ? '' : `${(back as any).code} ${(back as any).message}`);
  } else {
    check('CONTRACT', 'registered with the port, back in without it: the same identity', false, 'the registration itself was refused');
  }

  // ── an identity made from a recovery phrase: its root lives in the local vault, keyed by the full namespace ─────────
  // The same lookup loginWithCleaker does: the vault of the full name, unlocked with the password; no vault -> the
  // compound seed (a different identity). So the key's spelling decides which identity comes back.
  const h3 = `cy-${tag}`;
  const phraseRoot = new Uint8Array(32).map((_, i) => (i * 7 + tag.charCodeAt(0)) & 0xff);
  const bareFull = splitTypedNamespace(h3, ROOT!).fullNamespace;
  await saveLocalIdentityVault(bareFull, phraseRoot, pw);
  const sv = link({ username: h3, password: pw, namespace: ROOT, transportOrigin: ORIGIN, identityRootHex: bytesToHex(phraseRoot) });
  const regV = await attempt(() => sv.claimAndOpen(bareFull));
  check('CHAR', 'phrase-made identity registered through the bare root', regV.ok, regV.ok ? `identity ${String(sv.identityHash).slice(0, 12)}` : `${(regV as any).code} ${(regV as any).message}`);
  // the same lookup loginWithCleaker does (findLocalIdentityVault); `choice` is the person's pick on a conflict
  const enter = async (rootSpelling: string, choice?: string) => {
    const full = splitTypedNamespace(h3, rootSpelling).fullNamespace;
    const found = await findLocalIdentityVault(full, pw);
    if (found.status === 'conflict' && !choice) return { r: { ok: false as const, code: 'VAULT_CONFLICT', message: `${found.candidates.length} identities` }, sess: null as any, vaultFound: false, conflict: found.candidates.map((c) => c.key) };
    const pick = found.status === 'found' ? found.root : found.status === 'conflict' ? found.candidates.find((c) => c.key === choice)?.root : undefined;
    const identityRootHex = pick ? bytesToHex(pick) : undefined;
    const sess = link({ username: h3, password: pw, namespace: rootSpelling, transportOrigin: ORIGIN, identityRootHex });
    const r = await attempt(() => sess.open(full));
    return { r, sess, vaultFound: identityRootHex !== undefined, conflict: null as string[] | null };
  };
  check('CONTRACT', 'the offline fingerprint of a root is the identity the session holds', identityHashOfRoot(bytesToHex(phraseRoot)) === sv.identityHash);
  const viaBare = await enter(ROOT!);
  check('CONTRACT', 'phrase identity, back in through the bare root: its own identity', viaBare.r.ok && viaBare.sess.identityHash === sv.identityHash);
  const viaPortRoot = await enter(rootWithPort);
  check('CHAR', `phrase identity, root written with the port: vault found = ${viaPortRoot.vaultFound}`, viaPortRoot.r.ok,
    viaPortRoot.r.ok ? `identity ${String(viaPortRoot.sess.identityHash).slice(0, 12)}` : `${(viaPortRoot.r as any).code} ${(viaPortRoot.r as any).message}`);
  check('CONTRACT', 'phrase identity, root written with the port: still its own identity (the vault is found)', viaPortRoot.r.ok && viaPortRoot.sess.identityHash === sv.identityHash,
    viaPortRoot.vaultFound ? '' : 'the vault was not found');

  // ── a vault stored under the OLD key (with the port) only: the identity of a browser that wrote it before this change ──
  const h4 = `di-${tag}`;
  const root4 = new Uint8Array(32).map((_, i) => (i * 11 + 3) & 0xff);
  const sv4 = link({ username: h4, password: pw, namespace: ROOT, transportOrigin: ORIGIN, identityRootHex: bytesToHex(root4) });
  await sv4.claimAndOpen(`${h4}.${ROOT}`);
  await saveLocalIdentityVault(`${h4}.${rootWithPort}`, root4, pw);            // only under the legacy key
  const legacyBare = await (async () => {
    const full = `${h4}.${ROOT}`;
    const f = await findLocalIdentityVault(full, pw);
    const sess = link({ username: h4, password: pw, namespace: ROOT, transportOrigin: ORIGIN, identityRootHex: f.status === 'found' ? bytesToHex(f.root) : undefined });
    const r = await attempt(() => sess.open(full));
    return { f, r, sess };
  })();
  check('CONTRACT', 'a vault only under the legacy (ported) key: found from the bare root, same identity', legacyBare.f.status === 'found' && legacyBare.r.ok && legacyBare.sess.identityHash === sv4.identityHash);

  // ── two OLD vaults with DIFFERENT identities for one name: a conflict, not a silent choice ──────────────────────────
  const h5 = `ed-${tag}`;
  const rootX = new Uint8Array(32).map((_, i) => (i * 5 + 1) & 0xff);
  const rootY = new Uint8Array(32).map((_, i) => (i * 9 + 7) & 0xff);
  const svX = link({ username: h5, password: pw, namespace: ROOT, transportOrigin: ORIGIN, identityRootHex: bytesToHex(rootX) });
  await svX.claimAndOpen(`${h5}.${ROOT}`);
  await saveLocalIdentityVault(`${h5}.${ROOT}`, rootX, pw);
  await saveLocalIdentityVault(`${h5}.${rootWithPort}`, rootY, pw);            // another identity under the ported key
  const conflict = await enter(ROOT!, undefined);
  // `enter` rebuilds from h3; use the h5 name through the same lookup:
  const full5 = `${h5}.${ROOT}`;
  const f5 = await findLocalIdentityVault(full5, pw);
  check('CONTRACT', 'two old vaults, different identities: reported as a conflict, nothing signed in', f5.status === 'conflict' && f5.candidates.length === 2);
  void conflict;
  if (f5.status === 'conflict') {
    const own = f5.candidates.find((c) => c.key === full5)!;
    const sess = link({ username: h5, password: pw, namespace: ROOT, transportOrigin: ORIGIN, identityRootHex: bytesToHex(own.root) });
    const r = await attempt(() => sess.open(full5));
    check('CONTRACT', 'choosing the one that was registered here: that identity enters', r.ok && sess.identityHash === svX.identityHash);
    const other = f5.candidates.find((c) => c.key !== full5)!;
    const sessY = link({ username: h5, password: pw, namespace: ROOT, transportOrigin: ORIGIN, identityRootHex: bytesToHex(other.root) });
    const rY = await attempt(() => sessY.open(full5));
    check('CONTRACT', 'choosing the other one: it is refused by the monad (it is not the registered identity), nothing is created', !rY.ok, rY.ok ? 'it was accepted' : (rY as any).code);
  }

  // ── no vault at all and no such identity: the monad refuses, nothing is registered ──────────────────────────────────
  const none = link({ username: `zz-${tag}`, password: pw, namespace: ROOT, transportOrigin: ORIGIN });
  const noneOpen = await attempt(() => none.open(`zz-${tag}.${ROOT}`));
  check('CONTRACT', 'an identity this browser has no vault for and the monad does not know: refused, not created', !noneOpen.ok, noneOpen.ok ? 'it was created' : (noneOpen as any).code);
}
main().then(() => {
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} contract checks`);
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
