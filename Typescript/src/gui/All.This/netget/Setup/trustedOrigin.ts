// trustedOrigin.ts -- which origins the claim / admin-sign flows may send a person to.
//
// A person is sent to an origin to unlock a key and type a passphrase there, so the origin is where
// a credential is entered. The value that names it comes from the gateway's own configuration
// (`/main-server-namespace`); it is accepted only when it is exactly an origin: https (http only for
// loopback development), no credentials, no path, query or fragment. Anything else is not "close
// enough" -- it is refused, and the next configured candidate (or the local fallback) is used.
//
// This checks the SHAPE of an origin. It does not prove that the origin is the namespace's; that
// rests on the name being the one the gateway is configured with, and on TLS for that name.

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.localhost');
}

/** The origin `raw` names, or null when it is not a destination a credential may be entered at. */
export function trustedCleakerOrigin(raw: string): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (!url.hostname) return null;
  if (url.username || url.password) return null;
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) return null;
  if (url.protocol === 'https:') return url.origin;
  if (url.protocol === 'http:' && isLoopbackHost(url.hostname)) return url.origin;
  return null;
}

/**
 * The setup code and the claim go to the gateway at the page's OWN origin only. `endpoint` may have come
 * from a name (a namespace Beatle resolved, a verified root); that is good enough to read a status from,
 * not to receive a setup code. Origins are compared as origins: www and the apex are different ones.
 */
export function isOwnGatewayOrigin(endpoint: string, ownOrigin: string): boolean {
  try {
    if (!endpoint || !ownOrigin) return false;
    return new URL(endpoint).origin === new URL(ownOrigin).origin;
  } catch {
    return false;
  }
}
