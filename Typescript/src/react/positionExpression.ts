// positionExpression.ts -- where you ARE, as two channels written together.
//
// The namespace (which .me you are reading) and the address bar (which place the page was loaded from) are different
// facts and are never merged: you can be on `localhost` reading `cleaker.me`, or on `cleaker.me` reading `cleaker.me`, or
// on `127.0.0.1` with a QR on the namespace `localhost`. The NRP overlay operator writes it `namespace @ surface`
// (me://(jabellae + alex) @ "https://..."), and so does this: `cleaker.me@localhost`.
//
// When the page IS that namespace (its own host, `www.` of it, or a handle under it) there is nothing to say: the
// expression is the namespace alone, as before.

/** Lowercased host without port and without a leading `www.` (a comparison key, never shown). */
function hostKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

/** True when the page's host IS the namespace's own place (same host, or the namespace is a handle under it). */
export function pageIsNamespace(namespace: string, locationHost: string): boolean {
  const ns = hostKey(namespace);
  const here = hostKey(locationHost);
  if (!ns || !here) return true; // nothing to compare: do not invent a second channel
  return ns === here || ns.endsWith(`.${here}`);
}

/**
 * `label` (a namespace, optionally followed by a path) with the address bar's host appended as `@host`, placed before
 * any path: `cleaker.me/netget` read from localhost is `cleaker.me@localhost/netget`. Unchanged when the page is the
 * namespace. The port is kept in the shown host (it tells two local pages apart) but never decides sameness.
 */
export function withSurface(label: string, locationHost: string): string {
  const text = String(label || '');
  if (!text) return text;
  const cut = text.search(/[/?#]/);
  const ns = cut < 0 ? text : text.slice(0, cut);
  const rest = cut < 0 ? '' : text.slice(cut);
  if (/@/.test(ns)) return text; // already carries a surface
  if (pageIsNamespace(ns, locationHost)) return text;
  return `${ns}@${String(locationHost).trim().toLowerCase()}${rest}`;
}
