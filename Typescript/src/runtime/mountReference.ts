// mountReference.ts -- the mount reference (namespace + node path) that ties a self-contained page to
// `.me` (GatewayAccessContract.md §7). A page renders fine with none of this; a mount reference only
// says WHERE in the tree it is mounted. It grants no identity and no permission -- that is a separate
// step (a proven identity, checked against tree state), never inferred from resolving this reference.
//
// Two ways to get the SAME description: the monad may INJECT it into the HTML it serves
// (window.__MONAD_NAMESPACE_PROVIDER_BOOT__, read elsewhere -- this module does not read globals), or a
// standalone page that was served some other way (a static file, no monad in the loop) can FETCH it with
// GET <providerOrigin>/__provider. `providerOrigin` always arrives as configuration the caller supplies --
// never guessed from window.location.hostname, and never a hardcoded app name. A caller with an
// already-injected boot should use mountReferenceFromBoot() directly and never has to fetch.

import type { NamespaceProviderBoot } from './provider';

export type MountReference = {
  status: 'resolved';
  namespace: string;
  rootNamespace: string;
  handle: string | null;
  /** '' at the namespace's own root; a slash-form path at an interior node. */
  nodePath: string;
  boot: NamespaceProviderBoot;
} | {
  status: 'unresolved';
  /** Why, for an explicit state a page can show -- never silently treated as "at the root". */
  reason: 'FETCH_FAILED' | 'MALFORMED_RESPONSE' | 'BOOT_INCOMPLETE';
  detail?: string;
};

function normalizeSemanticPath(input: string): string {
  return String(input ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/{2,}/g, '/');
}

/**
 * A boot object (injected or fetched) as a MountReference, or explicitly unresolved when the object is
 * not a well-formed namespace-provider boot. Pure: no network, no globals, no hostname read anywhere --
 * the reference is only ever what the boot itself says.
 */
export function mountReferenceFromBoot(boot: NamespaceProviderBoot | null | undefined): MountReference {
  if (!boot || typeof boot !== 'object') {
    return { status: 'unresolved', reason: 'BOOT_INCOMPLETE', detail: 'no boot object' };
  }
  const namespace = String(boot.namespace || '').trim();
  if (boot.kind !== 'namespace-provider' || boot.version !== 1 || !namespace) {
    return { status: 'unresolved', reason: 'BOOT_INCOMPLETE', detail: 'missing kind/version/namespace' };
  }
  const rootNamespace = String(boot.rootNamespace || '').trim() || namespace;
  return {
    status: 'resolved',
    namespace,
    rootNamespace,
    handle: boot.handle ?? null,
    nodePath: normalizeSemanticPath(String(boot.nodePath ?? '')),
    boot,
  };
}

export type FetchMountReferenceOptions = {
  /** An interior node under the namespace; omitted or '' asks for the namespace's own root. */
  nodePath?: string;
  /** A namespace override, the same way GET /__provider?namespace= already accepts -- rarely needed. */
  namespace?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Fetches the mount reference from `GET <providerOrigin>/__provider` -- the discovery path for a page
 * that was served without an injected boot. `providerOrigin` is configuration the caller supplies (see
 * this file's header); this function never reads window.location and never assumes an app name.
 */
export async function fetchMountReference(
  providerOrigin: string,
  options: FetchMountReferenceOptions = {}
): Promise<MountReference> {
  const origin = String(providerOrigin || '').trim();
  if (!origin) return { status: 'unresolved', reason: 'BOOT_INCOMPLETE', detail: 'no providerOrigin given' };

  const fetchImpl = options.fetchImpl ?? (typeof fetch === 'function' ? fetch : undefined);
  if (!fetchImpl) return { status: 'unresolved', reason: 'FETCH_FAILED', detail: 'no fetch implementation available' };

  // Built as one absolute string, not `new URL('/__provider', origin)`: that resolves an absolute
  // path against the ORIGIN alone, silently dropping any path segment `providerOrigin` itself carries
  // (e.g. ".../apps/netget") -- and a plain relative "__provider" drops the base's own last segment
  // instead. providerOrigin's full path is part of the configuration; append to it, never replace it.
  const url = new URL(`${origin.replace(/\/+$/, '')}/__provider`);
  if (options.namespace) url.searchParams.set('namespace', options.namespace);
  if (options.nodePath) url.searchParams.set('nodePath', options.nodePath);

  let response: Response;
  try {
    response = await fetchImpl(url.toString(), { method: 'GET', headers: { accept: 'application/json' } });
  } catch (error) {
    return { status: 'unresolved', reason: 'FETCH_FAILED', detail: error instanceof Error ? error.message : String(error) };
  }
  if (!response.ok) {
    return { status: 'unresolved', reason: 'FETCH_FAILED', detail: `HTTP ${response.status}` };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    return { status: 'unresolved', reason: 'MALFORMED_RESPONSE', detail: error instanceof Error ? error.message : String(error) };
  }
  const provider = (body as { provider?: unknown } | null)?.provider;
  return mountReferenceFromBoot(provider as NamespaceProviderBoot | null | undefined);
}

/**
 * Two mount references describe the SAME place: same namespace, root and node path. `handle` follows
 * from `namespace`/`rootNamespace` already, and boot-only fields (route, origin, resolverHostName, the
 * surface entry) may legitimately differ between an injected and a fetched boot without the PLACE being
 * different -- this is deliberately not a deep-equal of the two `boot` objects.
 */
export function mountReferencesEquivalent(a: MountReference, b: MountReference): boolean {
  if (a.status !== 'resolved' || b.status !== 'resolved') return false;
  return a.namespace === b.namespace && a.rootNamespace === b.rootNamespace && a.nodePath === b.nodePath;
}
