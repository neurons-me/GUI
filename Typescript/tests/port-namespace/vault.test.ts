// The identity vault is FOUND by the namespace (a port is not part of it) and never merged blindly:
// both directions of the migration, originals kept, and two old vaults with different identities = a conflict.
import assert from 'node:assert/strict';
import { vaultStore } from './shim';
import {
  canonicalVaultNamespace, findLocalIdentityVault, hasIdentityVault, saveIdentityVault, saveLocalIdentityVault, storedVaultKeysFor,
} from '../../src/core/identity/localIdentityVault';

const PW = 'a-long-secret-1';
const rootA = new Uint8Array(32).fill(0x11);
const rootB = new Uint8Array(32).fill(0x22);
const PREFIX = 'this.me.identity-vault:v1:';
const snapshot = () => JSON.stringify([...vaultStore.entries()].sort());
let n = 0;
async function test(name: string, fn: () => Promise<void>) {
  vaultStore.clear();
  try { await fn(); console.log(`PASS ${name}`); n += 1; } catch (e: any) { console.log(`FAIL ${name}\n       ${String(e.message).split('\n')[0]}`); process.exitCode = 1; }
}

await test('V0 canonical spelling drops only a trailing :port', async () => {
  assert.equal(canonicalVaultNamespace('Ana.Name.Space:8080'), 'ana.name.space');
  assert.equal(canonicalVaultNamespace('ana.name.space'), 'ana.name.space');
  assert.equal(canonicalVaultNamespace('localhost:55858'), 'localhost');
});

await test('V1 legacy -> canonical: a vault stored WITH the port is found without it; the original stays, a copy appears', async () => {
  await saveLocalIdentityVault('ana.name.space:8080', rootA, PW);
  const original = vaultStore.get(PREFIX + 'ana.name.space:8080');
  const found = await findLocalIdentityVault('ana.name.space', PW);
  assert.equal(found.status, 'found');
  if (found.status !== 'found') return;
  assert.deepEqual([...found.root], [...rootA]);
  assert.equal(found.migrated, true);
  assert.equal(vaultStore.get(PREFIX + 'ana.name.space:8080'), original, 'the original is untouched');
  assert.equal(vaultStore.get(PREFIX + 'ana.name.space'), original, 'the canonical key holds a copy of it');
});

await test('V2 canonical -> legacy spelling: a vault stored without the port is found with it', async () => {
  await saveIdentityVault('ana.name.space', rootA, PW);
  const before = snapshot();
  const found = await findLocalIdentityVault('ana.name.space:8080', PW);
  assert.equal(found.status, 'found');
  if (found.status !== 'found') return;
  assert.deepEqual([...found.root], [...rootA]);
  assert.equal(found.migrated, false);
  assert.equal(snapshot(), before, 'finding wrote nothing');
});

await test('V3 two spellings, SAME identity: found, no conflict', async () => {
  await saveLocalIdentityVault('ana.name.space', rootA, PW);
  await saveLocalIdentityVault('ana.name.space:8080', rootA, PW);
  const found = await findLocalIdentityVault('ana.name.space:8080', PW);
  assert.equal(found.status, 'found');
});

await test('V4 two spellings, DIFFERENT identities: a conflict; nothing chosen, written or overwritten', async () => {
  await saveLocalIdentityVault('ana.name.space', rootA, PW);
  await saveLocalIdentityVault('ana.name.space:8080', rootB, PW);
  const before = snapshot();
  const found = await findLocalIdentityVault('ana.name.space', PW);
  assert.equal(found.status, 'conflict');
  if (found.status !== 'conflict') return;
  assert.equal(found.candidates.length, 2);
  assert.deepEqual(found.candidates.map((c) => c.key).sort(), ['ana.name.space', 'ana.name.space:8080']);
  assert.equal(found.candidates[0].key, 'ana.name.space', 'the canonical spelling is listed first');
  assert.equal(snapshot(), before, 'both originals are exactly as they were');
});

await test('V5 two legacy spellings with different ports and different identities: a conflict too', async () => {
  await saveLocalIdentityVault('ana.name.space:8080', rootA, PW);
  await saveLocalIdentityVault('ana.name.space:8081', rootB, PW);
  const found = await findLocalIdentityVault('ana.name.space', PW);
  assert.equal(found.status, 'conflict');
  assert.equal(vaultStore.has(PREFIX + 'ana.name.space'), false, 'no canonical copy is made when it is ambiguous');
});

await test('V6 a wrong secret opens nothing and writes nothing', async () => {
  await saveLocalIdentityVault('ana.name.space:8080', rootA, PW);
  const before = snapshot();
  await assert.rejects(() => findLocalIdentityVault('ana.name.space', 'another-secret-2'));
  assert.equal(snapshot(), before);
});

await test('V7 no vault at all: none, and nothing is created', async () => {
  const found = await findLocalIdentityVault('ana.name.space:8080', PW);
  assert.equal(found.status, 'none');
  assert.equal(vaultStore.size, 0);
  assert.equal(hasIdentityVault('ana.name.space'), false);
});

await test('V8 another namespace is not matched', async () => {
  await saveLocalIdentityVault('ana.other.space:8080', rootA, PW);
  assert.equal((await findLocalIdentityVault('ana.name.space', PW)).status, 'none');
  assert.deepEqual(storedVaultKeysFor('ana.name.space'), []);
});

await test('V9 saving writes the canonical key and leaves the other spellings alone', async () => {
  await saveLocalIdentityVault('ana.name.space:8080', rootB, PW);
  const legacy = vaultStore.get(PREFIX + 'ana.name.space:8080');
  await saveIdentityVault('ana.name.space:8080', rootA, PW);
  assert.ok(vaultStore.has(PREFIX + 'ana.name.space'));
  assert.equal(vaultStore.get(PREFIX + 'ana.name.space:8080'), legacy);
});

await test('V10 keychain slots (not namespaces) are never read as a namespace\'s vault', async () => {
  await saveLocalIdentityVault('keychain:ana.name.space#abcdef0123', rootA, PW);
  assert.deepEqual(storedVaultKeysFor('ana.name.space'), []);
});

console.log(`\n${n} passed`);
