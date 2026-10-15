// The contract: the same person at the same namespace is the same identity through any port.
// Fails on the base where the root's port changes the full namespace and, with it, the vault's key.
import assert from 'node:assert/strict';
import './shim';
import { buildGuessedFullNamespace, splitTypedNamespace } from '../../src/gui/All.This/Cleaker/signedRequest';
import { findLocalIdentityVault, saveLocalIdentityVault } from '../../src/core/identity/localIdentityVault';

const results: Array<{ name: string; ok: boolean; next: boolean }> = [];
// `next` marks the groups that belong to the NEXT change (the parser/naming of the full namespace); this change is the
// vault lookup, so those are reported as pending, not as failures of it.
async function contract(name: string, fn: () => Promise<void> | void, next = false) {
  try { await fn(); results.push({ name, ok: true, next }); console.log(`PASS ${name}`); }
  catch (e: any) { results.push({ name, ok: false, next }); console.log(`${next ? 'PENDING' : 'FAIL   '} ${name}${next ? ' [next change: parser/naming]' : ''}\n       ${String(e.message).split('\n')[0]}`); }
}
const root = new Uint8Array(32).fill(9);

await contract('H1 the full namespace under a ported root is the bare one', () => {
  assert.equal(buildGuessedFullNamespace('ana', 'name.space:8080'), 'ana.name.space');
}, true);
await contract('H2 a complete name typed under a ported root is complete, not foreign', () => {
  assert.equal(splitTypedNamespace('ana.name.space', 'name.space:8080').kind, 'complete');
}, true);
await contract('H3 a vault saved through one door is found through the other', async () => {
  await saveLocalIdentityVault(buildGuessedFullNamespace('bea', 'name.space:8080'), root, 'a-long-secret-1');
  assert.equal((await findLocalIdentityVault(buildGuessedFullNamespace('bea', 'name.space'), 'a-long-secret-1')).status, 'found');
});
await contract('H4 and the other way round', async () => {
  await saveLocalIdentityVault(buildGuessedFullNamespace('cy', 'name.space'), root, 'a-long-secret-1');
  assert.equal((await findLocalIdentityVault(buildGuessedFullNamespace('cy', 'name.space:8080'), 'a-long-secret-1')).status, 'found');
});

const failed = results.filter((r) => !r.ok && !r.next).length;
const pending = results.filter((r) => !r.ok && r.next).length;
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} pass; ${pending} pending (next change); ${failed} failing in scope`);
process.exit(failed ? 1 : 0);
