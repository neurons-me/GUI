// positionExpression.ts -- where you ARE, as the NRP writes it: `namespace/path @ surface`.
//
// Four things, kept apart (and kept apart internally; only the DISPLAY is abbreviated):
//   namespace   which .me you are reading
//   path        which node of it (the semantic path)
//   surface     where the page IS: its exact place (host + path + query + fragment), as the address bar shows it
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
// When is `@ surface` left out?  Only when the namespace is BOUND to this very origin AND the page is at that origin's
// root (no path, query or fragment) -- the surface then says nothing the namespace does not:
//     cleaker.me @ cleaker.me   ->   cleaker.me        (but cleaker.me @ cleaker.me/users stays: that is where you are)
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
//   * the surface is the page's exact place, written bare (`neurons-me.github.io/Cleaker`, `localhost:5173/users`);
//     the scheme is written only when it is news: `http:` on a host that is not loopback (`"http://cleaker.me/x"`).
//     The scheme is still part of the origin the binding compares (exactly); it is only left out of the text. IPv6
//     literals are not bare surfaces and stay quoted. A trailing `/` and `index.html` are dropped (same document).
//
// The surface rule lives in cleaker (`surfaceOf`, `node.position()`): one rule for every place that draws a position.
// The place is never shortened here -- a highlighted section of a page has to lead back to exactly that section
// (`es.wikipedia.org/wiki/Pastor_alemán#Historia`); a long label is for the drawing to trim (QR.me trims the middle).
//
// The PATH (`namespace/path`) is the SEMANTIC path only. A GUI route (`/netget`, `/users`) is not a node of the
// namespace: it is part of the SURFACE (where the page is), after the `@`, never before it.

import { surfaceOf, type PagePlace } from 'cleaker';

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

/**
 * A page opened as a file (`file:///Users/me/notes/page.html`) has no host: it is a place on this device. Its surface
 * is the file -- drawn by its name (`page.html`), written in full (`"file:///Users/me/notes/page.html"`) wherever the
 * expression must mean exactly one place. Only this device can open it; it is still where the page is.
 */
export function fileSurface(page: { protocol: string; pathname?: string } | null | undefined): { compact: string; full: string } | null {
  if (!page || String(page.protocol || '').toLowerCase().replace(/:?$/, ':') !== 'file:') return null;
  return surfaceOf({ protocol: 'file:', host: '', pathname: page.pathname });
}

/**
 * The page's exact place as a URL: scheme, host, path, query and fragment (a file: the whole file, and its fragment).
 * This is what `at=` carries, so whoever scans the QR lands exactly where the page is -- the same section of the same
 * page -- not only on its site.
 */
export function pagePlaceUrl(page: { protocol: string; origin?: string; host?: string; pathname?: string; search?: string; hash?: string }): string {
  if (page.protocol === 'file:') return `file://${page.pathname || ''}${page.hash || ''}`;
  const origin = page.origin || `${page.protocol}//${page.host || ''}`;
  return `${origin}${page.pathname || ''}${page.search || ''}${page.hash || ''}`;
}

/**
 * The value of `at=`, readable and exact: `?at=https://es.wikipedia.org/wiki/Pastor_alem%C3%A1n%23Historia`, not
 * `?at=https%3A%2F%2Fes.wikipedia.org%2F…`.
 *
 * Only what would break the query is escaped: `#` (it would become the door's own section), `&` and `+` (they would
 * split the parameter or turn into a space), `%`, spaces and controls, and every non-ASCII character (as UTF-8 %XX, a
 * single level: `á` is `%C3%A1`, never `%25C3%25A1`). An escape that means something in the URL (`%2F`, `%23`, `%25`…)
 * is kept exactly as it was, so `/a%2Fb` never becomes `/a/b`.
 *
 * Unbreakable: the result is read back the way the door reads it (URLSearchParams, then new URL) and must give the
 * very same URL; if it does not, the fully escaped form is used, which always does.
 */
export function atParam(place: string): string {
  let href: string;
  try {
    href = new URL(place).href;
  } catch {
    return encodeURIComponent(place);
  }
  // 1. escapes that only spell a plain character (á, ñ, ~) become that character; meaningful ones stay escaped
  const iri = href.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    try {
      const text = decodeURIComponent(run);
      return /^[^\u0000- \u007f%#&+\/?\[\]@!$'()*,;=:\\"<>^`{|}]+$/u.test(text) ? text : run;
    } catch {
      return run; // not UTF-8: keep the bytes as they were
    }
  });
  // 2. escape for the query only what would break it (and every non-ASCII character)
  let out = '';
  for (const ch of iri) {
    if (/^[A-Za-z0-9\-._~:\/?@!$'()*,;=]$/.test(ch)) out += ch;
    else out += encodeURIComponent(ch).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }
  // 3. the door must read back exactly this URL
  try {
    const back = new URLSearchParams(`at=${out}`).get('at');
    if (back !== null && new URL(back).href === href) return out;
  } catch { /* fall through */ }
  return encodeURIComponent(href);
}

/** `link` with `at=<place>` added (atParam), keeping the link's own query and section. */
export function withAt(link: string, place: string): string {
  const u = new URL(link);
  const query = u.search ? `${u.search}&` : '?';
  return `${u.origin}${u.pathname}${query}at=${atParam(place)}${u.hash}`;
}

/** A page's location: window.location, a URL, or a plain object with these parts. */
export type PageLocation = PagePlace & { origin?: string };

/**
 * The surface as the grammar writes it (cleaker's `surfaceOf`): the page's exact place, bare when the scheme is the usual
 * one; quoted with its scheme when the scheme is news (`http:` on a non-loopback host), is the REASON the page is not
 * bound to the namespace (`forceScheme`), or the host is not a bare token (an IPv6 literal).
 */
export function surfaceToken(pageUrl: PageLocation, forceScheme = false): string {
  return surfaceOf(pageUrl, { forceScheme })?.compact ?? '';
}

/** The page is at its origin's root: no path, query or fragment beyond what the surface drops as noise. */
function atOriginRoot(page: PageLocation): boolean {
  return surfaceOf(page)?.compact === surfaceOf({ protocol: page.protocol, host: page.host })?.compact;
}

export type PositionExpression = {
  /** What is drawn: short, abbreviated where it is safe to. */
  compact: string;
  /**
   * Unambiguous, for copying or executing: namespace, semantic path and the page's exact place (scheme included,
   * quoted), whether or not the two coincide. The compact form is not to be pasted anywhere that has to mean the same thing.
   */
  full: string;
  /** The namespace is bound to the page's own origin (checked). `compact` leaves the surface out when the page is at its root. */
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
  /** The page's location (window.location works as is): path, query and fragment are part of the surface. */
  page: (PageLocation & { origin: string }) | null;
  root: RootCheck | null | undefined;
}): PositionExpression {
  const ns = String(input.namespace || '').trim();
  if (!ns) return { compact: '', full: '', bound: false };
  const raw = String(input.path ?? '/').trim();
  // the root is the namespace itself: nothing is written for it
  const path = raw === '' || raw === '/' ? '' : raw.startsWith('/') ? raw : `/${raw}`;
  const base = `${ns}${path}`;
  const page = input.page;
  const file = fileSurface(page);
  // a file is never bound to a namespace: it is a place on this device, not a door any namespace answers at
  if (file) return { compact: `${base} @ ${file.compact}`, full: `${base} @ ${file.full}`, bound: false };
  if (!page || !page.host) return { compact: base, full: base, bound: false };
  const full = `${base} @ ${surfaceOf(page)?.full ?? ''}`;
  const bound = isBoundToPage({ namespace: ns, pageOrigin: page.origin, root: input.root });
  // bound and at the origin's root: the surface adds nothing. Bound but somewhere inside it: that place is still shown.
  if (bound) return { compact: atOriginRoot(page) ? base : `${base} @ ${surfaceToken(page)}`, full, bound: true };
  // Not collapsed. If the SCHEME is the only reason (same host and port, confirmed for this namespace), it is printed:
  // `x @ x` would show that a difference exists and then hide which one.
  const schemeExplains = confirmationCovers(ns, input.root) && onlySchemeDiffers(page.origin, input.root!.cleakerEndpoint);
  return { compact: `${base} @ ${surfaceToken(page, schemeExplains)}`, full, bound: false };
}

/**
 * The position when no `.me` has answered: only `where`, the page's own address (`localhost`). `me @ where` appears once
 * a `.me` answers; until then nothing stands in for it -- the `.me` is not guessed from the address (see
 * shownNamespace), and no placeholder is shown. `?` only when there is no page at all.
 */
export function unresolvedPosition(page: PageLocation | null | undefined): string {
  const where = page ? surfaceToken(page) : '';
  return where || '?';
}

/**
 * What is DRAWN for the position while the page's own door has not answered yet. A namespace known only from the
 * declaration (the guess) is not yet checked against this origin, so composing it would draw `cleaker.me @ cleaker.me`
 * on the namespace's own door for the moment it takes to answer, and then `cleaker.me`. Until something answered (an
 * identity, a selected link that connected, or the root's own answer), and while the root is still being checked, only
 * the surface is drawn: the same text the bound form will have on the namespace's own door, so nothing jumps. A root
 * that failed or is off keeps the composed form (`x @ x` in red/grey says the door did not answer for it).
 */
export function drawnPosition(input: {
  compact: string;
  unresolved: string;
  /** shownNamespace(...) with guessIsProvisional: true -- '' when only the guess names the namespace */
  answered: string;
  rootStatus: string;
}): string {
  const pending = input.rootStatus === 'checking' || input.rootStatus === 'idle';
  return !input.answered && pending ? input.unresolved : input.compact;
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
  /**
   * The guess came from the ADDRESS (nobody declared the namespace). Then it is not a namespace yet: with nothing
   * resolved the result is '' and the caller says "resolving", instead of presenting the hostname as the namespace.
   */
  guessIsProvisional?: boolean;
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
  return input.guessIsProvisional ? '' : pick(input.guess);
}

/**
 * The namespace a card ACTS on (what it signs for, proves, claims into) and whether it may yet. Order: the link the
 * person selected, then what the service at this origin ANSWERED (a current confirmation), then the address -- which is
 * a namespace only when the app declared it so; otherwise `ready` is false and the card resolves instead of acting.
 * The hostname is the transport's first draft; it never authorizes an operation by itself.
 */
export function cardNamespace(input: {
  selected?: string | null;
  root?: RootCheck | null;
  address: string;
  source: 'declared' | 'address';
}): { namespace: string; ready: boolean; from: 'selected' | 'answered' | 'declared' | 'address' } {
  const sel = String(input.selected ?? '').trim();
  if (sel) return { namespace: sel, ready: true, from: 'selected' };
  const root = input.root;
  if (root && root.status === 'confirmed' && !root.lastAttemptFailed) {
    const a = String(root.answeredNamespace ?? '').trim();
    if (a && a.toLowerCase() !== 'unknown') return { namespace: a, ready: true, from: 'answered' };
  }
  return input.source === 'declared'
    ? { namespace: input.address, ready: true, from: 'declared' }
    : { namespace: input.address, ready: false, from: 'address' };
}
