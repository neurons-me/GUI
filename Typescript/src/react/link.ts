/**
 * Links, sessions, context and place, as plain values.
 *
 * Five things, kept apart (typedocs/Namespace-App-Responsibilities.md):
 *
 *   Link      the namespace pointed at + the transport that carries it + what has been verified about THAT pair.
 *   Session   an identity signed in through one link. Not part of the link: a link can be open with no session.
 *   Context   which links are available and which one is selected. The selection belongs to the context, not to a
 *             link: a link stays open when it is not selected.
 *   Location  a path inside a namespace (the semantic channel).
 *   Surface   a full external URL with its own path (the content channel).
 *
 * Nothing here persists, parses new syntax, or knows about React. Every function returns a new value and leaves
 * its inputs untouched, so "selecting B does not modify A" is a property of the types, and the tests check it.
 */
import { originOf } from './positionExpression';
import { namespaceIsServed } from './session/verifiedCleakerRoot';

// ── link ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export type LinkTarget = {
  /** The space pointed at (`acme.test`): a name, not an address. */
  namespace: string;
  /** Where its reads go. Compared by origin: a path or a trailing slash is not a different transport. */
  transport: string;
};

/**
 * What has been established about the link's CURRENT target. Every state that records a reading names the target the
 * reading was made for (`of`); a link whose target changed is back to `unverified`, and a reading that arrives for
 * another target is dropped (see `applyReading`).
 *
 *   answered     the service at that transport said which namespace it serves, and it is this one. A capability:
 *                something there will take requests for the namespace. NOT proof of authority -- a valid
 *                self-signature is internally consistent, anyone can make one (verifiedCleakerRoot.ts).
 *   authorized   authority was checked against evidence held independently of the answering service. Nothing in
 *                the client produces this today; it exists so the difference has a place to go.
 */
export type Verification =
  | { state: 'unverified' }
  | { state: 'checking'; of: string }
  | { state: 'answered'; of: string; answeredNamespace: string; signature: 'absent' | 'valid' }
  | { state: 'authorized'; of: string; answeredNamespace: string; evidence: string }
  | { state: 'failed'; of: string; reason: 'no-answer' | 'wrong-namespace' | 'invalid-signature' };

export type Link = {
  /** The target key. Two links with the same namespace and transport origin are the same link. */
  readonly id: string;
  readonly target: LinkTarget;
  readonly verification: Verification;
};

/** What a probe or a proof reports. It carries the target it was made for; that is how a stale one is told apart. */
export type Reading =
  | { kind: 'checking'; of: string }
  | { kind: 'answer'; of: string; answeredNamespace: string | null; signature: 'absent' | 'valid' | 'invalid' }
  | { kind: 'unreachable'; of: string }
  | { kind: 'authority'; of: string; namespace: string; evidence: string };

const normNamespace = (s: string) => String(s ?? '').trim().toLowerCase().replace(/\.$/, '');
const normTransport = (s: string) => originOf(s) || String(s ?? '').trim().toLowerCase().replace(/\/+$/, '');

/** The identity of a target: namespace and transport origin, nothing else. */
export function targetKey(target: LinkTarget): string {
  return `${normNamespace(target.namespace)}@${normTransport(target.transport)}`;
}

export function openLink(target: LinkTarget): Link {
  const t = { namespace: String(target.namespace).trim(), transport: String(target.transport).trim() };
  return { id: targetKey(t), target: t, verification: { state: 'unverified' } };
}

/** True when the link's verification was made for the link's current target. Always true for links built here. */
export function verificationHolds(link: Link): boolean {
  const v = link.verification;
  return v.state === 'unverified' || v.of === link.id;
}

/** `answered` or better: operations aimed at this link have a destination that said it serves the namespace. */
export function isReady(link: Link): boolean {
  return link.verification.state === 'answered' || link.verification.state === 'authorized';
}

export function isAuthorized(link: Link): boolean {
  return link.verification.state === 'authorized';
}

/** Same link, new target. A different target starts unverified: what was checked for the old one proves nothing here. */
export function retarget(link: Link, target: LinkTarget): Link {
  return targetKey(target) === link.id ? link : openLink(target);
}

/**
 * Fold a reading into a link. A reading made for another target (an earlier target of this link, or another
 * link's) leaves the link as it was. A failure replaces an earlier answer: the current reading is the failed one.
 * `authority` only upgrades a link that currently holds an answer for the same target and the same namespace.
 */
export function applyReading(link: Link, reading: Reading): Link {
  if (reading.of !== link.id) return link;
  const of = link.id;
  switch (reading.kind) {
    case 'checking':
      return { ...link, verification: { state: 'checking', of } };
    case 'unreachable':
      return { ...link, verification: { state: 'failed', of, reason: 'no-answer' } };
    case 'answer': {
      if (reading.signature === 'invalid') return { ...link, verification: { state: 'failed', of, reason: 'invalid-signature' } };
      const said = String(reading.answeredNamespace ?? '').trim();
      if (!said) return { ...link, verification: { state: 'failed', of, reason: 'no-answer' } };
      if (!namespaceIsServed(said, link.target.namespace)) return { ...link, verification: { state: 'failed', of, reason: 'wrong-namespace' } };
      return { ...link, verification: { state: 'answered', of, answeredNamespace: said, signature: reading.signature } };
    }
    case 'authority': {
      const v = link.verification;
      if (v.state !== 'answered' || v.of !== of) return link;
      if (!namespaceIsServed(reading.namespace, link.target.namespace)) return link;
      return { ...link, verification: { state: 'authorized', of, answeredNamespace: v.answeredNamespace, evidence: reading.evidence } };
    }
  }
}

// ── session ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** An identity signed in through ONE link. Credentials are not held here, only which identity and through what. */
export type Session = { readonly linkId: string; readonly identity: string };

// ── context ──────────────────────────────────────────────────────────────────────────────────────────────────────

export type LinkContext = {
  readonly links: readonly Link[];
  /** The link operations are aimed at, or null. Chosen by whoever holds the context; links do not know about it. */
  readonly selected: string | null;
  readonly sessions: Readonly<Record<string, Session>>;
};

export const EMPTY_CONTEXT: LinkContext = { links: [], selected: null, sessions: {} };

const linkAt = (ctx: LinkContext, id: string) => ctx.links.find((l) => l.id === id) ?? null;

/** Adds a link (nothing happens if that target is already open). Opening a link never selects it. */
export function addLink(ctx: LinkContext, target: LinkTarget): LinkContext {
  const link = openLink(target);
  if (linkAt(ctx, link.id)) return ctx;
  return { ...ctx, links: [...ctx.links, link] };
}

/** Closes a link and drops its session. The selection falls to null if it was the one selected; no other link moves. */
export function closeLink(ctx: LinkContext, id: string): LinkContext {
  if (!linkAt(ctx, id)) return ctx;
  const { [id]: _gone, ...sessions } = ctx.sessions;
  return { links: ctx.links.filter((l) => l.id !== id), selected: ctx.selected === id ? null : ctx.selected, sessions };
}

/** Selects an open link, or clears the selection with null. Selecting an id that is not open changes nothing. */
export function select(ctx: LinkContext, id: string | null): LinkContext {
  if (id !== null && !linkAt(ctx, id)) return ctx;
  return ctx.selected === id ? ctx : { ...ctx, selected: id };
}

export function selectedLink(ctx: LinkContext): Link | null {
  return ctx.selected === null ? null : linkAt(ctx, ctx.selected);
}

/** Routes a reading to the link it was made for. A reading for no open link, or for an old target, changes nothing. */
export function applyReadingTo(ctx: LinkContext, reading: Reading): LinkContext {
  const link = linkAt(ctx, reading.of);
  if (!link) return ctx;
  const next = applyReading(link, reading);
  if (next === link) return ctx;
  return { ...ctx, links: ctx.links.map((l) => (l.id === link.id ? next : l)) };
}

/**
 * Points an open link somewhere else. The link becomes unverified and its session is dropped (an identity signed in
 * through the old target is not signed in through the new one). Selection follows the link. Refused when the new
 * target is already another open link.
 */
export function retargetLink(ctx: LinkContext, id: string, target: LinkTarget): LinkContext {
  const link = linkAt(ctx, id);
  if (!link) return ctx;
  const next = retarget(link, target);
  if (next === link) return ctx;
  if (linkAt(ctx, next.id)) return ctx;
  const { [id]: _gone, ...sessions } = ctx.sessions;
  return {
    links: ctx.links.map((l) => (l.id === id ? next : l)),
    selected: ctx.selected === id ? next.id : ctx.selected,
    sessions,
  };
}

/** Signs an identity in through one link. Only that link's session changes. */
export function attachSession(ctx: LinkContext, linkId: string, identity: string): LinkContext {
  if (!linkAt(ctx, linkId)) return ctx;
  return { ...ctx, sessions: { ...ctx.sessions, [linkId]: { linkId, identity } } };
}

export function detachSession(ctx: LinkContext, linkId: string): LinkContext {
  if (!(linkId in ctx.sessions)) return ctx;
  const { [linkId]: _gone, ...sessions } = ctx.sessions;
  return { ...ctx, sessions };
}

/**
 * What the card and its operations are aimed at: the selected link, the session through THAT link (not any other),
 * and whether the destination may be acted on yet. `ready` is false for an unverified, checking or failed link.
 */
export function operationsTarget(ctx: LinkContext): { link: Link; session: Session | null; ready: boolean } | null {
  const link = selectedLink(ctx);
  if (!link) return null;
  return { link, session: ctx.sessions[link.id] ?? null, ready: isReady(link) };
}

// ── place: the two paths, independent ────────────────────────────────────────────────────────────────────────────

/** A path inside a namespace. `path` always starts with `/`; it means nothing about any URL. */
export type SemanticLocation = { readonly namespace: string; readonly path: string };

/** An external page: the full URL, and its own origin and path. It need not use anything of `.me`. */
export type Surface = { readonly url: string; readonly origin: string; readonly path: string };

export type Place = { readonly location: SemanticLocation | null; readonly surface: Surface | null };

export const NOWHERE: Place = { location: null, surface: null };

/** An http(s) URL as a Surface, or null. The path is the URL's own, whatever the namespace's path is. */
export function parseSurface(url: string): Surface | null {
  try {
    const u = new URL(String(url ?? '').trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return { url: u.href, origin: u.origin.toLowerCase(), path: u.pathname };
  } catch {
    return null;
  }
}

const semanticPath = (p: string) => {
  const s = String(p ?? '').trim();
  return s.startsWith('/') ? s : `/${s}`;
};

/** Moves inside the namespace. The surface is the same value afterwards: it is not navigated. */
export function moveSemantic(place: Place, namespace: string, path: string): Place {
  return { location: { namespace: String(namespace).trim(), path: semanticPath(path) }, surface: place.surface };
}

/** Navigates the surface. The location is the same value afterwards: the namespace path does not follow the URL. */
export function navigateSurface(place: Place, url: string): Place {
  const surface = parseSurface(url);
  return surface ? { location: place.location, surface } : place;
}
