// localKeychainKeyVault.ts — where a freshly generated keychain key's
// PRIVATE half actually lives on this device: encrypted in localStorage,
// decrypted only into an in-memory cache that a page reload naturally
// clears (never persisted decrypted, never sent anywhere).
//
// Reuses localIdentityVault.ts's existing wrap/unwrap (PBKDF2 + AES-256-GCM)
// as-is -- it already just wraps/unwraps 32 raw bytes under a password and
// has no assumption those bytes are a BIP-39 root, so a fresh Ed25519
// signing seed fits directly. No sibling crypto function needed; only the
// addressing (which storage slot) and the index (which local keys exist
// for this namespace, and whether the server has confirmed each one yet)
// are new.
//
// Addressing choice, and why: a locally generated key is identified here
// by its own raw public key (`publicKeyRaw`, base64url) from the moment
// it's generated -- never by the server's keyId, which doesn't exist yet
// at generation time and is only a hash of the PEM-converted public key
// (see keychain.ts's computeKeyId() server-side). Recomputing that PEM+hash
// client-side just to predict a keyId before the server confirms it would
// be one more place for a byte-level mismatch to silently break signature
// verification. Instead: generate, store under publicKeyRaw immediately,
// attempt registration, and once the server responds with the real keyId,
// just remember the mapping (`markLocalKeyRegistered`). A failed attempt
// leaves the vault entry and its index record exactly as they were --
// retrying replays the same local key, never regenerates it.
import {
  saveLocalIdentityVault,
  loadLocalIdentityVault,
  hasLocalIdentityVault,
  clearLocalIdentityVault,
} from '@/core/identity/localIdentityVault';
import { exportEd25519PublicKey, importEd25519SigningKey, signEd25519Proof } from 'this.me';

export interface LocalKeychainKeyIndexEntry {
  publicKeyRaw: string;
  label: string;
  requestedAdmin: boolean;
  /** null = this was registered via the root/claim key (bootstrap or recovery). */
  actingKeyId: string | null;
  createdAt: number;
  /** Filled in once the server has confirmed this public key as a real keychain entry. */
  registeredKeyId: string | null;
}

function normalizeNs(namespace: string): string {
  return namespace.trim().toLowerCase();
}

function indexStorageKey(namespace: string): string {
  return `this.me.keychain-local-index:v1:${normalizeNs(namespace)}`;
}

function vaultSlot(namespace: string, publicKeyRaw: string): string {
  return `${normalizeNs(namespace)}:keychain-key:${publicKeyRaw}`;
}

function cacheKey(namespace: string, publicKeyRaw: string): string {
  return `${normalizeNs(namespace)}:${publicKeyRaw}`;
}

function readIndex(namespace: string): LocalKeychainKeyIndexEntry[] {
  try {
    const raw = localStorage.getItem(indexStorageKey(namespace));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(namespace: string, entries: LocalKeychainKeyIndexEntry[]): void {
  localStorage.setItem(indexStorageKey(namespace), JSON.stringify(entries));
}

export function listLocalKeychainEntries(namespace: string): LocalKeychainKeyIndexEntry[] {
  return readIndex(namespace);
}

export function findLocalEntryByPublicKey(namespace: string, publicKeyRaw: string): LocalKeychainKeyIndexEntry | null {
  return readIndex(namespace).find((e) => e.publicKeyRaw === publicKeyRaw) ?? null;
}

export function findLocalEntryByRegisteredKeyId(namespace: string, registeredKeyId: string): LocalKeychainKeyIndexEntry | null {
  return readIndex(namespace).find((e) => e.registeredKeyId === registeredKeyId) ?? null;
}

export async function generateAndStoreLocalKey(
  namespace: string,
  opts: { label: string; requestedAdmin: boolean; actingKeyId: string | null; passphrase: string },
): Promise<{ publicKeyRaw: string }> {
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const { publicKey } = await importEd25519SigningKey(seed);
  const publicKeyRaw = await exportEd25519PublicKey(publicKey);

  await saveLocalIdentityVault(vaultSlot(namespace, publicKeyRaw), seed, opts.passphrase);

  const entries = readIndex(namespace);
  entries.push({
    publicKeyRaw,
    label: opts.label,
    requestedAdmin: opts.requestedAdmin,
    actingKeyId: opts.actingKeyId,
    createdAt: Date.now(),
    registeredKeyId: null,
  });
  writeIndex(namespace, entries);

  return { publicKeyRaw };
}

export function markLocalKeyRegistered(namespace: string, publicKeyRaw: string, registeredKeyId: string): void {
  writeIndex(
    namespace,
    readIndex(namespace).map((e) => (e.publicKeyRaw === publicKeyRaw ? { ...e, registeredKeyId } : e)),
  );
}

export function removeLocalKeyEntry(namespace: string, publicKeyRaw: string): void {
  writeIndex(namespace, readIndex(namespace).filter((e) => e.publicKeyRaw !== publicKeyRaw));
  clearLocalIdentityVault(vaultSlot(namespace, publicKeyRaw));
  _unlocked.delete(cacheKey(namespace, publicKeyRaw));
}

export function hasLocalSeedFor(namespace: string, publicKeyRaw: string): boolean {
  return hasLocalIdentityVault(vaultSlot(namespace, publicKeyRaw));
}

// In-memory only -- populated exclusively by unlockLocalKey(), and a page
// reload clears it by construction (it is nothing but a module-level
// variable). The encrypted vault entry in localStorage is the only thing
// that survives a reload; unlocking has to happen again after one, on
// purpose.
const _unlocked = new Map<string, Uint8Array>();

export async function unlockLocalKey(namespace: string, publicKeyRaw: string, passphrase: string): Promise<boolean> {
  const seed = await loadLocalIdentityVault(vaultSlot(namespace, publicKeyRaw), passphrase);
  if (!seed) return false;
  _unlocked.set(cacheKey(namespace, publicKeyRaw), seed);
  return true;
}

export function lockLocalKey(namespace: string, publicKeyRaw: string): void {
  _unlocked.delete(cacheKey(namespace, publicKeyRaw));
}

export function isLocalKeyUnlocked(namespace: string, publicKeyRaw: string): boolean {
  return _unlocked.has(cacheKey(namespace, publicKeyRaw));
}

export async function signWithLocalKey(namespace: string, publicKeyRaw: string, message: string): Promise<string> {
  const seed = _unlocked.get(cacheKey(namespace, publicKeyRaw));
  if (!seed) throw new Error('LOCAL_KEY_LOCKED');
  const { privateKey } = await importEd25519SigningKey(seed);
  return signEd25519Proof(privateKey, message);
}
