// Which identity a sign-in attempts, and where it comes from. No vault is not "derive and try another one" silently:
// the derived identity is the form's own mechanism, used only when there is no vault under any spelling, only as an open.
import assert from 'node:assert/strict';
import './shim';
import { vaultStore } from './shim';
import {
  chooseIdentityMechanism, findLocalIdentityVault, saveLocalIdentityVault,
} from '../../src/core/identity/localIdentityVault';
import { deriveCompoundSeed } from '../../src/gui/All.This/Cleaker/signedRequest';

const PW = 'a-long-secret-1';
const hex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
const rootA = new Uint8Array(32).fill(0x51);
const rootB = new Uint8Array(32).fill(0x62);
let n = 0;
async function test(name: string, fn: () => Promise<void>) {
  vaultStore.clear();
  try { await fn(); console.log(`PASS ${name}`); n += 1; } catch (e: any) { console.log(`FAIL ${name}\n       ${String(e.message).split('\n')[0]}`); process.exitCode = 1; }
}

await test('M1 no vault anywhere: the attempt is the password-derived identity, stated as such, and carries no stored root', async () => {
  const m = chooseIdentityMechanism(await findLocalIdentityVault('ana.name.space', PW), null, hex);
  assert.deepEqual(m, { kind: 'password', source: 'password' });
  // what that identity IS: a function of the name and the secret only (nothing from the namespace, the port or a vault)
  assert.equal(deriveCompoundSeed('ana', PW), deriveCompoundSeed('ana', PW));
  assert.notEqual(deriveCompoundSeed('ana', PW), deriveCompoundSeed('ana', 'another-secret-2'));
});

await test('M2 a vault under ANY spelling: that root is used, never the derived identity', async () => {
  await saveLocalIdentityVault('ana.name.space:8080', rootA, PW);
  const m = chooseIdentityMechanism(await findLocalIdentityVault('ana.name.space', PW), null, hex);
  assert.equal(m.kind, 'vault');
  if (m.kind === 'vault') assert.equal(m.rootHex, hex(rootA));
});

await test('M3 two different identities: a conflict; the derived identity is not an option here', async () => {
  await saveLocalIdentityVault('ana.name.space', rootA, PW);
  await saveLocalIdentityVault('ana.name.space:8080', rootB, PW);
  const finding = await findLocalIdentityVault('ana.name.space', PW);
  assert.equal(chooseIdentityMechanism(finding, null, hex).kind, 'conflict');
  const picked = chooseIdentityMechanism(finding, 'ana.name.space:8080', hex);
  assert.equal(picked.kind, 'vault');
  if (picked.kind === 'vault') assert.equal(picked.rootHex, hex(rootB));
  // a choice that is not one of the candidates is not accepted and does not fall back to anything
  assert.equal(chooseIdentityMechanism(finding, 'somebody.else', hex).kind, 'conflict-unresolved-choice');
});

await test('M4 a wrong secret with a vault present never becomes the derived identity', async () => {
  await saveLocalIdentityVault('ana.name.space', rootA, PW);
  await assert.rejects(() => findLocalIdentityVault('ana.name.space', 'another-secret-2'));
});

console.log(`\n${n}/4`);
