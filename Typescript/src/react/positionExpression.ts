// positionExpression.ts -- where you ARE, as two channels written together, in the NRP's own expression grammar.
//
// The namespace (which .me you are reading) and the address bar (which place the page was loaded from) are different
// facts and are never merged: you can be on `localhost` reading `cleaker.me`, or on `cleaker.me` reading `cleaker.me`.
//
// What the NRP says about each (neurons-me.github.io/docs/NRP):
//   * v0.3.0 Rule 1: meaning lives in the namespace and the semantic path; hosts, ports and URLs are execution details.
//     So the page's host is never part of a `me://` address (nor of the QR's value), and it is not a path segment.
//   * v0.3.0 Rule 2 / §3: `[selector]` constrains EXECUTION (which monad answers), not meaning. The page's host is not
//     what picks a monad, so it is not a selector either.
//   * Surface-and-Overlay + NRPExpression: `namespace @ surface` is the operator for exactly this: a `.me` projected over
//     a surface, "two channels coexist". `@` binds to the namespace WITH its path, so the path stays on the namespace:
//         cleaker.me/netget @ localhost        overlay(namespace "cleaker.me/netget", surface "localhost")
//     and never `cleaker.me@localhost/netget`, which the parser reads as surface "localhost/netget".
//   * Bare surfaces are hostname tokens; anything with a port (or a scheme) is a quoted URI:
//         cleaker.me @ "http://127.0.0.1:3000"
// The same surface is what Beatle already sends as `client.surface` in nrp.open; this is how it is WRITTEN.
//
// When the page IS that namespace (its own host, `www.` of it, or a handle under it) there is nothing to add.

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

/** The surface as the grammar writes it: a bare hostname, or a quoted URI when the page has a port. */
export function surfaceToken(locationHost: string, protocol = 'http:'): string {
  const host = String(locationHost).trim().toLowerCase();
  if (/:\d+$/.test(host)) return `"${String(protocol || 'http:').replace(/:?$/, ':')}//${host}"`;
  return host;
}

/**
 * `label` (a namespace, optionally followed by its path) overlaid on the address bar's place, in the NRP's canonical
 * spelling: `cleaker.me/netget @ localhost`. Unchanged when the page is the namespace. The port never decides sameness;
 * when there is one it is shown in the quoted URI form.
 */
export function withSurface(label: string, locationHost: string, protocol = 'http:'): string {
  const text = String(label || '');
  if (!text) return text;
  const cut = text.search(/[/?#]/);
  const ns = cut < 0 ? text : text.slice(0, cut);
  if (/@/.test(text)) return text; // already an overlay
  if (pageIsNamespace(ns, locationHost)) return text;
  return `${text} @ ${surfaceToken(locationHost, protocol)}`;
}
