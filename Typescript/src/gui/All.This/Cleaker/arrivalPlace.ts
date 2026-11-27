// arrivalPlace.ts -- the place a shared QR points at: `https://<namespace>/?at=<exact place>`.
//
// Whoever scans a QR.me lands on the namespace's own door with `at=` = the exact place the person who shared it was
// standing (react/positionExpression.ts pagePlaceUrl: host + path + query + section). The door offers to take them
// there. It never goes on its own: `at=` is written by whoever made the link, so following it silently would turn the
// namespace's door into an open redirect (`cleaker.me/?at=<anything>`). The destination is shown in full, and the
// person decides.
//
// Only an http(s) place can be opened from a page; a file is a place on the sharer's device, shown but not opened.
import { surfaceOf } from 'cleaker';

export type ArrivalPlace = {
  /** The exact URL, as it was shared. */
  url: string;
  /** How it is drawn: the surface grammar (`es.wikipedia.org/wiki/…#Historia`). */
  label: string;
  /** The host alone, so the person sees at a glance which site it is. */
  host: string;
  /** http(s): can be opened. A file: only on the device that shared it. */
  openable: boolean;
};

const MAX_LENGTH = 4096;

/** `at=` from a page's query, validated; null when there is none, it is not a place, or it is where the page already is. */
export function readArrivalPlace(search: string, here?: string): ArrivalPlace | null {
  let raw: string | null = null;
  try {
    raw = new URLSearchParams(search || '').get('at');
  } catch {
    return null;
  }
  const value = String(raw || '').trim();
  if (!value || value.length > MAX_LENGTH) return null;
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return null;
  }
  const scheme = u.protocol.toLowerCase();
  if (scheme !== 'http:' && scheme !== 'https:' && scheme !== 'file:') return null; // never javascript:, data:, blob:…
  if (scheme !== 'file:' && !u.host) return null;
  if (u.username || u.password) return null; // `https://cleaker.me@evil.example` style: not a place to offer
  if (here && sameDocument(u, here)) return null;
  const surface = surfaceOf({ protocol: u.protocol, host: u.host, pathname: u.pathname, search: u.search, hash: u.hash });
  return {
    url: u.toString(),
    label: readable(surface?.compact || u.toString()),
    host: scheme === 'file:' ? 'this device' : u.host.toLowerCase(),
    openable: scheme !== 'file:',
  };
}

/** For reading only: `alem%C3%A1n` as `alemán`. The url itself stays exactly as shared. */
function readable(text: string): string {
  try { return decodeURI(text); } catch { return text; }
}

function sameDocument(u: URL, here: string): boolean {
  try {
    const h = new URL(here);
    // where the page is, without the at= that brought it here
    return u.origin === h.origin && u.pathname === h.pathname && u.search === withoutArrival(h.search) && u.hash === h.hash;
  } catch {
    return false;
  }
}

/** The page's query without `at=` (after the person goes or dismisses it), keeping every other parameter. */
export function withoutArrival(search: string): string {
  const params = new URLSearchParams(search || '');
  params.delete('at');
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}
