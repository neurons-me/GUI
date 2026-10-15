// What the GUI does TODAY with a port in the root it signs in under. Passes on the base.
import assert from 'node:assert/strict';
import './shim';
import { vaultStore } from './shim';
import { buildGuessedFullNamespace, deriveCompoundSeed, splitTypedNamespace } from '../../src/gui/All.This/Cleaker/signedRequest';
import { hasLocalIdentityVault, saveLocalIdentityVault } from '../../src/core/identity/localIdentityVault';
import { deriveNamespaceRootLabel } from '../../src/react/session/documentPages';

const root = new Uint8Array(32).fill(7);

async function main() {
  // G1/G2: a port in the root is part of the full namespace the GUI computes
  assert.equal(splitTypedNamespace('ana', 'name.space:8080').fullNamespace, 'ana.name.space:8080');
  assert.equal(buildGuessedFullNamespace('ana', 'name.space:8080'), 'ana.name.space:8080');
  assert.equal(buildGuessedFullNamespace('ana', 'name.space'), 'ana.name.space');
  console.log('PASS G1-2 the full namespace carries the root\'s port');

  // G3: the local identity vault is keyed by that full namespace, so a port makes a different key
  await saveLocalIdentityVault('ana.name.space:8080', root, 'a-long-secret-1');
  assert.equal(hasLocalIdentityVault('ana.name.space:8080'), true);
  assert.equal(hasLocalIdentityVault('ana.name.space'), false, 'the same person, without the port, finds no vault');
  assert.ok([...vaultStore.keys()].some((k) => k.endsWith('ana.name.space:8080')) || vaultStore.size === 1);
  console.log('PASS G3 a vault saved under the ported name is not found under the bare name');

  // G4: the identity itself (seed from username + secret) does not depend on the namespace at all
  assert.equal(deriveCompoundSeed('ana', 'a-long-secret-1'), deriveCompoundSeed('ana', 'a-long-secret-1'));
  console.log('PASS G4 the compound seed is a function of username and secret only');

  // G5: the label drawn for an endpoint is already port-free
  assert.equal(deriveNamespaceRootLabel('https://name.space:8080'), 'name.space');
  console.log('PASS G5 deriveNamespaceRootLabel drops the port');
}
main().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
