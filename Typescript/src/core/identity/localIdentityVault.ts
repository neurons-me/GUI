// localIdentityVault.ts — browser-local, per-namespace encrypted storage
// for a phrase-derived identity root. Lets day-to-day sign-in use the
// password alone instead of re-entering the 12-word phrase every time,
// without ever putting the raw root in localStorage (see this.me's own
// identity-root.ts envelope: PBKDF2 + AES-256-GCM). Deliberately namespaced
// per identity (unlike this.me's own internal anonymous-fallback seed
// cache, a single shared key) — one browser can hold vaults for several
// claimed identities side by side.
import {
  generateIdentityRoot,
  unwrapIdentityRoot,
  wrapIdentityRoot,
  type IdentityRootEnvelope,
} from 'this.me';

const STORAGE_PREFIX = 'this.me.identity-vault:v1:';

function storageKey(namespace: string): string {
  const normalized = String(namespace || '').trim().toLowerCase();
  if (!normalized) throw new Error('A namespace is required to address the local identity vault.');
  return STORAGE_PREFIX + normalized;
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Encrypts `rootBytes` under `password` and stores the envelope for `namespace`. */
export async function saveLocalIdentityVault(
  namespace: string,
  rootBytes: Uint8Array,
  password: string,
): Promise<void> {
  const storage = getStorage();
  if (!storage) throw new Error('LOCAL_STORAGE_UNAVAILABLE');

  // Only the rootId half is used here — a public, non-secret label the
  // envelope's AEAD binds itself to (see identity-root.ts's aadFor()).
  // Generating a full unused random root alongside it is wasteful but
  // reuses the same audited randomness helper instead of a bespoke one for
  // "just give me a random id".
  const { rootId } = generateIdentityRoot();
  const envelope = await wrapIdentityRoot(rootBytes, rootId, password);
  storage.setItem(storageKey(namespace), JSON.stringify(envelope));
}

/** Returns the decrypted root bytes for `namespace`, or null if nothing is stored. */
export async function loadLocalIdentityVault(
  namespace: string,
  password: string,
): Promise<Uint8Array | null> {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(storageKey(namespace));
  if (!raw) return null;

  const envelope = JSON.parse(raw) as IdentityRootEnvelope;
  return unwrapIdentityRoot(envelope, password);
}

export function hasLocalIdentityVault(namespace: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(storageKey(namespace)) !== null;
}

export function clearLocalIdentityVault(namespace: string): void {
  const storage = getStorage();
  storage?.removeItem(storageKey(namespace));
}
