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

// ── taking it: once, before the shell draws ─────────────────────────────────────────────────────────────────────────
// `at=` belongs to the arrival, not to where the page is: while it sits in the address bar, every label that writes
// "where you are" would read `cleaker.me @ cleaker.me?at=https://…` (and a QR made from it would nest one at= in another).
// So the door takes it before anything renders: the place is kept for the card, the address bar is cleaned at once.
// The tab's sessionStorage keeps it until the person goes or dismisses, so a reload before deciding does not lose it.

const STORE_KEY = 'cleaker.arrival';
let taken: { href: string; place: ArrivalPlace | null } | null = null;

type ArrivalEnv = {
  location: { href: string; pathname: string; search: string; hash: string };
  history?: { state: unknown; replaceState(data: unknown, unused: string, url?: string): void };
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
};

function browserEnv(): ArrivalEnv | null {
  if (typeof window === 'undefined') return null;
  let storage: ArrivalEnv['storage'] = null;
  try { storage = window.sessionStorage; } catch { storage = null; }
  return { location: window.location, history: window.history, storage };
}

/**
 * The arrival place for this page, taken once: from `at=` (then removed from the address bar, other parameters kept),
 * else from what this tab kept after an earlier visit with `at=`. Idempotent: a second call returns the same place.
 */
export function takeArrival(env: ArrivalEnv | null = browserEnv()): ArrivalPlace | null {
  if (!env) return null;
  const { location, history, storage } = env;
  const hasAt = /[?&]at=/.test(location.search);
  if (taken && !hasAt) return taken.place;
  let place = hasAt ? readArrivalPlace(location.search, location.href) : null;
  if (hasAt) {
    try { history?.replaceState(history.state, '', `${location.pathname}${withoutArrival(location.search)}${location.hash}`); } catch { /* stays in the bar */ }
    try { if (place) storage?.setItem(STORE_KEY, place.url); else storage?.removeItem(STORE_KEY); } catch { /* not kept */ }
  } else {
    let kept: string | null = null;
    try { kept = storage?.getItem(STORE_KEY) ?? null; } catch { kept = null; }
    // what was kept is read back through the same validation as a fresh at=
    if (kept) place = readArrivalPlace(`?at=${encodeURIComponent(kept)}`, location.href);
  }
  taken = { href: location.href, place };
  return place;
}

/** The person went or dismissed: nothing is offered again in this tab. */
export function forgetArrival(env: ArrivalEnv | null = browserEnv()): void {
  taken = { href: '', place: null };
  try { env?.storage?.removeItem(STORE_KEY); } catch { /* nothing kept */ }
}

/** Tests only. */
export function resetArrivalForTests(): void {
  taken = null;
}
