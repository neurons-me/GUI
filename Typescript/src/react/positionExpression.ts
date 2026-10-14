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
  /** The label that was actually confirmed (verifiedRoot.confirmedLabel). When given, the namespace must be under it. */
  confirmedLabel?: string | null;
  /** The latest attempt failed (verifiedRoot.lastAttemptFailed): an older confirmation says nothing about what is shown. */
  lastAttemptFailed?: boolean;
};

const norm = (value: string) => String(value || '').trim().toLowerCase().replace(/\.$/, '');
const under = (ns: string, root: string) => !!ns && !!root && (ns === root || ns.endsWith(`.${root}`));

/** Is the confirmation CURRENT and about this namespace?  (Everything except which origin the page is on.) */
function confirmationCovers(namespace: string, root: RootCheck | null | undefined): boolean {
  if (!root || root.status !== 'confirmed') return false;
  // `status` stays 'confirmed' after a later promote() fails; that confirmation is not about what is shown now.
  if (root.lastAttemptFailed) return false;
  const ns = norm(namespace);
  const answered = norm(root.answeredNamespace || '');
  if (!under(ns, answered)) return false;
  if (root.confirmedLabel !== undefined && root.confirmedLabel !== null && !under(ns, norm(root.confirmedLabel))) return false;
  return true;
}

/**
 * Is `namespace` bound to the page's own origin?  Requires, all of:
 *   - the root was confirmed and the LATEST attempt did not fail (not checking / error / off / superseded by a failure);
 *   - the confirmed transport's origin IS the page's origin, exactly (scheme, host and port);
 *   - that transport answered for the namespace: the same name, or `namespace` is a handle under the name it answered
 *     (the monad serves every door of a namespace, handles included) -- and under the label that was confirmed.
 */
export function isBoundToPage(input: { namespace: string; pageOrigin: string; root: RootCheck | null | undefined }): boolean {
  const { namespace, pageOrigin, root } = input;
  if (!confirmationCovers(namespace, root)) return false;
  const page = originOf(pageOrigin);
  return !!page && originOf(root!.cleakerEndpoint) === page;
}

/** Same host and port, different scheme: the confirmation covers the namespace but through the other scheme. */
function onlySchemeDiffers(pageOrigin: string, endpoint: string): boolean {
  try {
    const a = new URL(pageOrigin);
    const b = new URL(endpoint);
    return a.host.toLowerCase() === b.host.toLowerCase() && a.protocol !== b.protocol;
  } catch {
    return false;
  }
}

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|[^.:\s]+\.localhost)(?::\d+)?$/i;

/**
 * The surface as the grammar writes it, as short as it can be: a bare `host` or `host:port`; quoted with its scheme only
 * when the scheme is news (`http:` on a non-loopback host), is the REASON the page is not bound to the namespace
 * (`forceScheme`), or the host is not a bare token (an IPv6 literal).
 */
export function surfaceToken(pageUrl: { host: string; protocol: string }, forceScheme = false): string {
  const host = String(pageUrl.host || '').trim().toLowerCase();
  if (!host) return '';
  const scheme = String(pageUrl.protocol || 'http:').toLowerCase().replace(/:?$/, ':');
  const schemeIsNews = scheme === 'http:' && !LOOPBACK.test(host);
  if (forceScheme || schemeIsNews || host.startsWith('[')) return `"${scheme}//${host}"`;
  return host;
}

export type PositionExpression = {
  /** What is drawn: short, abbreviated where it is safe to. */
  compact: string;
  /**
   * Unambiguous, for copying or executing: namespace, semantic path and the page's FULL origin (scheme included, quoted),
   * whether or not the two coincide. The compact form is not to be pasted anywhere that has to mean the same thing.
   */
  full: string;
  /** The namespace is bound to the page's own origin (checked), so `compact` leaves the surface out. */
  bound: boolean;
};

/**
 * `namespace[/path]` and ` @ surface` unless the namespace is bound to the page. `path` is the semantic path ('' or '/'
 * = the namespace's root, which is not written). Both parts stay available to the caller; this only composes the text.
 */
export function positionExpression(input: {
  namespace: string;
  /** Semantic path; '' or '/' is the root. */
  path?: string;
  page: { origin: string; host: string; protocol: string } | null;
  root: RootCheck | null | undefined;
}): PositionExpression {
  const ns = String(input.namespace || '').trim();
  if (!ns) return { compact: '', full: '', bound: false };
  const raw = String(input.path ?? '/').trim();
  // the root is the namespace itself: nothing is written for it
  const path = raw === '' || raw === '/' ? '' : raw.startsWith('/') ? raw : `/${raw}`;
  const base = `${ns}${path}`;
  const page = input.page;
  if (!page || !page.host) return { compact: base, full: base, bound: false };
  const scheme = String(page.protocol || 'http:').toLowerCase().replace(/:?$/, ':');
  const full = `${base} @ "${scheme}//${String(page.host).trim().toLowerCase()}"`;
  const bound = isBoundToPage({ namespace: ns, pageOrigin: page.origin, root: input.root });
  if (bound) return { compact: base, full, bound: true };
  // Not collapsed. If the SCHEME is the only reason (same host and port, confirmed for this namespace), it is printed:
  // `x @ x` would show that a difference exists and then hide which one.
  const schemeExplains = confirmationCovers(ns, input.root) && onlySchemeDiffers(page.origin, input.root!.cleakerEndpoint);
  return { compact: `${base} @ ${surfaceToken(page, schemeExplains)}`, full, bound: false };
}

/** The compact label (what is drawn). */
export function positionLabel(input: Parameters<typeof positionExpression>[0]): string {
  return positionExpression(input).compact;
}

/**
 * WHICH namespace the shell names, in order of how much is known:
 *   1. the signed-in identity's own namespace;
 *   2. the namespace the person selected and that connected;
 *   3. the namespace the monad at this origin ANSWERED for (a current confirmation, never a failed attempt's):
 *      what it says it is, whatever address it was reached by;
 *   4. only then the address-derived guess (the page's hostname) -- a first draw, before anything has answered.
 * The address is the surface. A page loaded from fulltrailer.com.mx, from the machine's .local name or from a LAN IP is
 * the same namespace three times, so the name shown must not be taken from the address when the monad has said
 * which namespace it is.
 */
export function shownNamespace(input: {
  authenticated?: string | null;
  selected?: string | null;
  root?: RootCheck | null;
  guess: string;
}): string {
  const pick = (v: string | null | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  const own = pick(input.authenticated);
  if (own) return own;
  const chosen = pick(input.selected);
  if (chosen) return chosen;
  const root = input.root;
  if (root && root.status === 'confirmed' && !root.lastAttemptFailed) {
    const answered = pick(root.answeredNamespace);
    if (answered && answered.toLowerCase() !== 'unknown') return answered;
  }
  return pick(input.guess);
}
