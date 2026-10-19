/**
 * What a link's QR encodes, and how the namespace is read back from it.
 *
 * A QR that holds only the door's address names a door, not a link: a door can serve several namespaces, and two links
 * on one transport would produce the same code. So the value keeps the selected namespace whenever the address itself
 * does not say it:
 *
 *   - the host IS the namespace (`https://cleaker.me`, or `https://ana.cleaker.me` for a handle under it): the address
 *     already carries it, and the value stays the plain address;
 *   - anywhere else (a local door, an IP, a gateway serving other names): `?namespace=<namespace>` is added, the same
 *     parameter the monad already takes on reads and on `/__surface`.
 *
 * `namespaceOfQrValue` is the inverse: given a scanned value it returns the namespace and where to ask for it, or says
 * it cannot tell.
 */
import { buildCleakerNamespaceUrl } from '@/gui/All.This/Cleaker/namespaceExpression';

const norm = (s: string) => String(s ?? '').trim().toLowerCase().replace(/\.$/, '');

/** True when the address's own host names the namespace (the namespace itself, or a handle under it). */
export function hostNamesNamespace(url: string, namespace: string): boolean {
  const ns = norm(namespace);
  if (!ns) return false;
  try {
    const host = norm(new URL(url).hostname);
    return host === ns || host.endsWith(`.${ns}`);
  } catch {
    return false;
  }
}

/** The address as the page actually reaches the door: the namespace builder assumes https for any non-local name. */
function keepReachedScheme(built: string, endpoint: string): string {
  try {
    const reached = new URL(endpoint);
    const u = new URL(built);
    if (u.host === reached.host && u.protocol !== reached.protocol) {
      u.protocol = reached.protocol;
      return u.toString().replace(/\/$/, u.pathname === '/' && !u.search ? '' : '/');
    }
  } catch {
    // keep what was built
  }
  return built;
}

export function linkQrValue(input: { endpoint: string; namespace: string; handle?: string | null }): string {
  const base = keepReachedScheme(buildCleakerNamespaceUrl(input.endpoint, input.handle || undefined), input.endpoint);
  const ns = String(input.namespace ?? '').trim();
  if (!base || !ns || hostNamesNamespace(base, ns)) return base;
  try {
    const u = new URL(base);
    u.searchParams.set('namespace', ns);
    return u.toString();
  } catch {
    return base;
  }
}

export type QrLink = {
  /** The namespace the code names, or null when the code does not say (a bare door). */
  namespace: string | null;
  /** The handle in `/@handle`, when there is one. */
  handle: string | null;
  /** The door to ask: scheme, host and port. */
  endpoint: string;
  /** How the namespace was found: written in the code, or read from the host. */
  from: 'parameter' | 'host' | 'none';
};

export function namespaceOfQrValue(value: string): QrLink | null {
  let u: URL;
  try { u = new URL(String(value ?? '').trim()); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const handleMatch = u.pathname.match(/^\/@([^/]+)/);
  const handle = handleMatch ? decodeURIComponent(handleMatch[1]).toLowerCase() : null;
  const param = norm(u.searchParams.get('namespace') ?? '');
  if (param) return { namespace: param, handle, endpoint: u.origin, from: 'parameter' };
  // No parameter: the host is the namespace when it is a name (including a one-label declared space such as `localhost`).
  // An address (IPv4/IPv6) is only a door: it does not say which namespace is being asked for.
  const host = norm(u.hostname);
  const isAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host.startsWith('[');
  if (isAddress || !host) return { namespace: null, handle, endpoint: u.origin, from: 'none' };
  return { namespace: host, handle, endpoint: u.origin, from: 'host' };
}
