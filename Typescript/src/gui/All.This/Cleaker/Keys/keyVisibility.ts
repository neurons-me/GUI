/** Roots under `keys` that are never listed to an app nor shown in the agent's login view. */
export const LOGIN_EXCLUDED_ROOTS: readonly string[] = Object.freeze(['netget']);

/** Path of the namespace-owned Meta app under `keys`. */
export const NAMESPACE_KEYS_ROOT = 'namespace';
export const NAMESPACE_META_APP = 'namespace.meta.app';
export const NAMESPACE_NETGET = 'namespace.netget';
export const NAMESPACE_META_APP_FIELDS: readonly string[] = Object.freeze(['id', 'secret', 'redirect']);

/** `rel` is a path under `keys` (`netget`, `netget.gateway`, `meta.instagram`). */
export function isLoginExcluded(rel: string): boolean {
  return LOGIN_EXCLUDED_ROOTS.some((r) => rel === r || rel.startsWith(`${r}.`))
    || rel === NAMESPACE_NETGET
    || rel.startsWith(`${NAMESPACE_NETGET}.`);
}

/** Keys that belong to the namespace, not to a person (`keys.namespace…`). */
export function isNamespaceOwnedKey(rel: string): boolean {
  return rel === NAMESPACE_KEYS_ROOT || rel.startsWith(`${NAMESPACE_KEYS_ROOT}.`);
}

/**
 * Signed in as the namespace root itself (`cleaker.me`), not as a handle
 * (`suign.cleaker.me`). `rootLabel` is the page's namespace root.
 */
export function isRootNamespaceSession(
  sessionNamespace: string | null | undefined,
  rootLabel: string | null | undefined,
): boolean {
  const session = String(sessionNamespace || '').trim().toLowerCase();
  const root = String(rootLabel || '').trim().toLowerCase();
  return !!session && !!root && session === root;
}

/** Root owner view: signed in as the root, or this device holds the root vault. */
export function isRootOwnerView(
  sessionNamespace: string | null | undefined,
  rootLabel: string | null | undefined,
  hasRootVault = false,
): boolean {
  const root = String(rootLabel || '').trim();
  if (!root) return false;
  return isRootNamespaceSession(sessionNamespace, root) || hasRootVault;
}

/** Hide netget always; hide `keys.namespace` unless this is the root owner. */
export function hideKeysInTree(rel: string, isRootOwner: boolean): boolean {
  if (isLoginExcluded(rel)) return true;
  if (isNamespaceOwnedKey(rel) && !isRootOwner) return true;
  return false;
}

/** Apps listing keys never see netget or any `keys.namespace` entry. */
export function isKeysListExcluded(rel: string): boolean {
  return isLoginExcluded(rel) || isNamespaceOwnedKey(rel);
}
