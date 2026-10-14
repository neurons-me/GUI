// positionExpression.ts -- where you ARE, as the NRP writes it: `namespace/path @ surface`.
//
// Four things, kept apart (and kept apart internally; only the DISPLAY is abbreviated):
//   namespace   which .me you are reading
//   path        which node of it (the semantic path)
//   surface     where the page was loaded from (the address bar's origin)
//   binding     whether that origin has been CHECKED to answer for that namespace
//
// What the NRP says (neurons-me.github.io/docs/NRP):
//   * v0.3.0 Rule 1: meaning lives in namespace + semantic path; hosts, ports and URLs are execution details. The page's
//     host is never part of a me:// address, nor of the QR's value, nor a path segment.
//   * v0.3.0 Rule 2: `[selector]` constrains EXECUTION (which monad answers), not meaning; it is not where "where I am"
//     goes.
//   * Surface-and-Overlay + NRPExpression: `namespace @ surface` is the operator for a .me projected over a surface.
//     `@` binds to the namespace WITH its path (`cleaker.me/netget @ localhost`); never `cleaker.me@localhost/netget`,
//     which the parser reads as surface "localhost/netget". A bare surface is a hostname; with a port or scheme it is a
//     quoted URI.
//
// When is `@ surface` left out?  Only when the namespace is BOUND to this very origin:
//     cleaker.me/ @ cleaker.me   ->   cleaker.me/
// "Bound" is a checked fact, not a resemblance of names: the origin the page came from (scheme + host + port, exactly)
// is the transport that was verified for the namespace, AND that transport answered for that namespace (its own
// /__surface says so). Two hosts that look alike, a different port, `www.`, a handle under a host: none is bound
// until it has been checked. (The check is what the origin SAYS about itself -- it is not proof of authority over the
// namespace; a self-signed /__surface is internally consistent, nothing more. The label states a coincidence of
// door, not an ownership.)
//
// Short on purpose (every character of the label is drawn around a QR):
//   * the namespace's root is the namespace itself: `cleaker.me`, not `cleaker.me/` (the parser's canonical form drops
//     the root slash; a path is shown only when it is not the root);
//   * the surface is a bare `host` or `host:port` (both valid bare surfaces); the scheme is written only when it is news:
//     `http:` on a host that is not loopback (`"http://cleaker.me"`). `https:` is the default and loopback http is the
//     norm for a local page, so neither is printed. The scheme is still part of the origin the binding compares
//     (exactly); it is only left out of the text. IPv6 literals are not bare surfaces and stay quoted.
//
// The path is the SEMANTIC path only. A GUI route (`/netget`, `/users`) is where the page navigates, not a node of the
// namespace, and is never printed here unless the door declares it (the main server's door does: see the caller).

/** `scheme://host[:port]` of a URL string, lowercased; '' when it is not one. */
export function originOf(url: string): string {
  try {
    const u = new URL(String(url || '').trim());
    return u.origin.toLowerCase();
  } catch {
    return '';
  }
}

export type RootCheck = {
  status: 'idle' | 'checking' | 'confirmed' | 'error' | 'off' | string;
  /** The origin the confirmed transport reads from (verifiedRoot.cleakerEndpoint). */
  cleakerEndpoint: string;
  /** What that transport answered for (verifiedRoot.answeredNamespace). */
  answeredNamespace: string | null;
};

const norm = (value: string) => String(value || '').trim().toLowerCase().replace(/\.$/, '');

/**
 * Is `namespace` bound to the page's own origin?  Requires, all of:
 *   - the root was confirmed (not checking / error / off);
 *   - the confirmed transport's origin IS the page's origin, exactly;
 *   - that transport answered for the namespace: the same name, or `namespace` is a handle under the name it answered
 *     (the monad serves every door of a namespace, handles included).
 */
export function isBoundToPage(input: { namespace: string; pageOrigin: string; root: RootCheck | null | undefined }): boolean {
  const { namespace, pageOrigin, root } = input;
  if (!root || root.status !== 'confirmed') return false;
  const page = originOf(pageOrigin);
  if (!page || originOf(root.cleakerEndpoint) !== page) return false;
  const answered = norm(root.answeredNamespace || '');
  const ns = norm(namespace);
  if (!answered || !ns) return false;
  return ns === answered || ns.endsWith(`.${answered}`);
}

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|[^.:\s]+\.localhost)(?::\d+)?$/i;

/**
 * The surface as the grammar writes it, as short as it can be: a bare `host` or `host:port`; quoted with its scheme only
 * when the scheme is news (`http:` on a non-loopback host) or the host is not a bare token (an IPv6 literal).
 */
export function surfaceToken(pageUrl: { host: string; protocol: string }): string {
  const host = String(pageUrl.host || '').trim().toLowerCase();
  if (!host) return '';
  const scheme = String(pageUrl.protocol || 'http:').toLowerCase().replace(/:?$/, ':');
  const schemeIsNews = scheme === 'http:' && !LOOPBACK.test(host);
  if (schemeIsNews || host.startsWith('[')) return `"${scheme}//${host}"`;
  return host;
}

/**
 * The position as it is displayed: `namespace[/path]`, then ` @ surface` unless the namespace is bound to the page.
 * `path` is the semantic path ('' or '/' = the namespace's root, which is not written). Both parts stay available to
 * the caller; this only composes the text.
 */
export function positionLabel(input: {
  namespace: string;
  /** Semantic path; '' or '/' is the root. */
  path?: string;
  page: { origin: string; host: string; protocol: string } | null;
  root: RootCheck | null | undefined;
}): string {
  const ns = String(input.namespace || '').trim();
  if (!ns) return '';
  const raw = String(input.path ?? '/').trim();
  // the root is the namespace itself: nothing is written for it
  const path = raw === '' || raw === '/' ? '' : raw.startsWith('/') ? raw : `/${raw}`;
  const base = `${ns}${path}`;
  const page = input.page;
  if (!page || !page.host) return base;
  if (isBoundToPage({ namespace: ns, pageOrigin: page.origin, root: input.root })) return base;
  return `${base} @ ${surfaceToken(page)}`;
}
