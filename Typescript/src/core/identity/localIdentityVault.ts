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


// ── identity vaults, found by NAMESPACE (a port is not part of it) ───────────────────────────────────────────────────
//
// A phrase-made identity's root lives in a vault whose key is the full namespace. A port written in the root used to be
// part of that key, so the same person under `name.space:8080` looked for another key, found nothing, and tried the
// compound seed instead (a different identity, refused by the monad). The vault of an identity is now FOUND by the
// namespace without its port, and written under that name. Rules, because two spellings may hold different identities:
//
//   * the canonical key (no port) is where new vaults are written; the original keys are NEVER removed or rewritten;
//   * a lookup reads every stored spelling of the same namespace; if they unlock to ONE root it is used (and copied to
//     the canonical key when that is missing); if they unlock to DIFFERENT roots it is a conflict and nothing is written
//     or chosen: the caller shows it and asks;
//   * sharing the namespace's name does not hand a credential to another transport: a vault is only a stored root, what
//     it signs is decided by the link the person signs in through.
//
// The low-level functions above are untouched (the keychain's vault slots reuse them with keys that are not namespaces).

/** The namespace as a vault names it: lower case, no trailing `:port`. */
export function canonicalVaultNamespace(namespace: string): string {
  return String(namespace || '').trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

/** Every stored vault key whose namespace is `namespace` once a port is ignored (any spelling). */
export function storedVaultKeysFor(namespace: string): string[] {
  const storage = getStorage();
  const canonical = canonicalVaultNamespace(namespace);
  if (!storage || !canonical) return [];
  const out: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    if (canonicalVaultNamespace(key.slice(STORAGE_PREFIX.length)) === canonical) out.push(key.slice(STORAGE_PREFIX.length));
  }
  return out;
}

export type VaultCandidate = { key: string; root: Uint8Array };

export type VaultFinding =
  | { status: 'none' }
  | { status: 'found'; key: string; root: Uint8Array; migrated: boolean; otherKeys: string[] }
  | { status: 'conflict'; candidates: VaultCandidate[] };

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Finds the identity vault of `namespace` under `password`, whatever port its key was written with.
 * Throws what `unwrapIdentityRoot` throws when vaults exist and none opens with this password.
 */
export async function findLocalIdentityVault(namespace: string, password: string): Promise<VaultFinding> {
  const storage = getStorage();
  const keys = storedVaultKeysFor(namespace);
  if (!storage || keys.length === 0) return { status: 'none' };

  const opened: VaultCandidate[] = [];
  let authError: unknown = null;
  for (const key of keys) {
    const raw = storage.getItem(STORAGE_PREFIX + key);
    if (!raw) continue;
    try {
      opened.push({ key, root: await unwrapIdentityRoot(JSON.parse(raw) as IdentityRootEnvelope, password) });
    } catch (error) {
      authError = error;
    }
  }
  if (opened.length === 0) throw authError ?? new Error('IDENTITY_VAULT_UNREADABLE');

  const distinct: VaultCandidate[] = [];
  for (const c of opened) if (!distinct.some((d) => sameBytes(d.root, c.root))) distinct.push(c);
  if (distinct.length > 1) {
    // prefer showing the canonical spelling first, then the rest in stored order
    const canonicalKey = canonicalVaultNamespace(namespace);
    const ordered = [...opened].sort((x, y) => Number(y.key === canonicalKey) - Number(x.key === canonicalKey));
    return { status: 'conflict', candidates: ordered.filter((c, i) => ordered.findIndex((o) => sameBytes(o.root, c.root)) === i) };
  }

  const canonicalKey = canonicalVaultNamespace(namespace);
  const source = opened.find((c) => c.key === canonicalKey) ?? opened[0];
  let migrated = false;
  if (!keys.includes(canonicalKey)) {
    // a copy under the canonical name; the original stays where it was
    const raw = storage.getItem(STORAGE_PREFIX + source.key);
    if (raw) { storage.setItem(STORAGE_PREFIX + canonicalKey, raw); migrated = true; }
  }
  return { status: 'found', key: source.key, root: source.root, migrated, otherKeys: keys.filter((k) => k !== source.key) };
}

/** Writes an identity's vault under the canonical (port-free) namespace. Other spellings are left as they are. */
export async function saveIdentityVault(namespace: string, rootBytes: Uint8Array, password: string): Promise<void> {
  await saveLocalIdentityVault(canonicalVaultNamespace(namespace), rootBytes, password);
}

/** Is there a vault for this namespace under any spelling? */
export function hasIdentityVault(namespace: string): boolean {
  return storedVaultKeysFor(namespace).length > 0;
}
