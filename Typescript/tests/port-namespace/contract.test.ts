// The contract: the same person at the same namespace is the same identity through any port.
// Fails on the base where the root's port changes the full namespace and, with it, the vault's key.
import assert from 'node:assert/strict';
import './shim';
import { buildGuessedFullNamespace, splitTypedNamespace } from '../../src/gui/All.This/Cleaker/signedRequest';
import { hasLocalIdentityVault, saveLocalIdentityVault } from '../../src/core/identity/localIdentityVault';

const results: Array<{ name: string; ok: boolean }> = [];
async function contract(name: string, fn: () => Promise<void> | void) {
  try { await fn(); results.push({ name, ok: true }); console.log(`PASS ${name}`); }
  catch (e: any) { results.push({ name, ok: false }); console.log(`FAIL ${name}\n       ${String(e.message).split('\n')[0]}`); }
}
const root = new Uint8Array(32).fill(9);

await contract('H1 the full namespace under a ported root is the bare one', () => {
  assert.equal(buildGuessedFullNamespace('ana', 'name.space:8080'), 'ana.name.space');
});
await contract('H2 a complete name typed under a ported root is complete, not foreign', () => {
  assert.equal(splitTypedNamespace('ana.name.space', 'name.space:8080').kind, 'complete');
});
await contract('H3 a vault saved through one door is found through the other', async () => {
  await saveLocalIdentityVault(buildGuessedFullNamespace('bea', 'name.space:8080'), root, 'a-long-secret-1');
  assert.equal(hasLocalIdentityVault(buildGuessedFullNamespace('bea', 'name.space')), true);
});
await contract('H4 and the other way round', async () => {
  await saveLocalIdentityVault(buildGuessedFullNamespace('cy', 'name.space'), root, 'a-long-secret-1');
  assert.equal(hasLocalIdentityVault(buildGuessedFullNamespace('cy', 'name.space:8080')), true);
});

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} (failures: the port still changes the key a person's vault is stored under)`);
process.exit(failed ? 1 : 0);
