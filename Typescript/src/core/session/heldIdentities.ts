// What a local context (the `.me` that `<Me>` provides) holds: the identities of the links currently open under it, and
// which links they are. A link keeps its OWN kernel and its OWN credentials; this is only the list of what exists, so that
// "use the identity I already hold" can be asked for explicitly, by identity, never by position.
//
// Three rules the shape enforces:
//   * No ordering is exposed and nothing is "the latest": entries are listed by identity, links by namespace.
//   * A seed never leaves this module except to `createCleakerSession({ identityFrom })`, which asks for it by the session
//     that holds it, and to `rootBytesOf` for sealing a local vault entry. It is not on any session object or in any list.
//   * "Held" means a link that is open right now under THIS context. Closing a link removes it; a closed session's
//     identity cannot be used from it.
import type { SeedSession } from './createSeedSession';

export type HeldLink = { namespace: string; handle: string };
export type HeldIdentity = {
  /** The identity's public fingerprint (what is shown, and what a link is asked for by). */
  identityHash: string;
  /** The handles it is open under (usually one). */
  handles: string[];
  /** The links open with it, one per namespace. */
  links: HeldLink[];
};

type Entry = { session: SeedSession; namespace: string; handle: string; identityHash: string };

const SEEDS = new WeakMap<object, string>();                       // session -> its identity root (hex), private
const CONTEXTS = new WeakMap<object, Map<symbol, Entry>>();        // context -> open links
const WATCHERS = new WeakMap<object, Set<() => void>>();

const entriesOf = (context: object) => {
  let m = CONTEXTS.get(context);
  if (!m) { m = new Map(); CONTEXTS.set(context, m); }
  return m;
};
const notify = (context: object) => { WATCHERS.get(context)?.forEach((cb) => { try { cb(); } catch { /* a watcher must not break the others */ } }); };

/** Remembers the root a session was built from, for `identityFrom` (module-private). */
export function rememberRoot(session: SeedSession, rootHex: string): void {
  SEEDS.set(session as object, rootHex);
}

/** A link opened under `context`. Returns what to call when it closes. */
export function enlist(context: object, session: SeedSession, namespace: string, handle: string, identityHash: string): () => void {
  const token = Symbol('link');
  entriesOf(context).set(token, { session, namespace, handle, identityHash });
  notify(context);
  return () => { if (entriesOf(context).delete(token)) notify(context); };
}

/** The identities held under a context, each with its links. Sorted by fingerprint, never by when they opened. */
export function heldIdentitiesOf(context: object | null | undefined): HeldIdentity[] {
  if (!context) return [];
  const byId = new Map<string, HeldIdentity>();
  for (const e of entriesOf(context).values()) {
    const held = byId.get(e.identityHash) || { identityHash: e.identityHash, handles: [], links: [] };
    if (!held.handles.includes(e.handle)) held.handles.push(e.handle);
    if (!held.links.some((l) => l.namespace === e.namespace)) held.links.push({ namespace: e.namespace, handle: e.handle });
    byId.set(e.identityHash, held);
  }
  return [...byId.values()]
    .map((h) => ({ ...h, handles: [...h.handles].sort(), links: [...h.links].sort((a, b) => a.namespace.localeCompare(b.namespace)) }))
    .sort((a, b) => a.identityHash.localeCompare(b.identityHash));
}

/** Some open link under `context` that holds `identityHash` (any of them: they hold the same root). */
export function sessionHolding(context: object | null | undefined, identityHash: string): SeedSession | null {
  if (!context) return null;
  for (const e of entriesOf(context).values()) if (e.identityHash === identityHash) return e.session;
  return null;
}

export function isHeldBy(context: object | null | undefined, session: SeedSession): boolean {
  if (!context) return false;
  for (const e of entriesOf(context).values()) if (e.session === session) return true;
  return false;
}

/** The root a held session was built from, or null when this context does not hold that session. */
export function rootOf(context: object | null | undefined, session: SeedSession): string | null {
  return isHeldBy(context, session) ? SEEDS.get(session as object) ?? null : null;
}

export function watchHeldIdentities(context: object, cb: () => void): () => void {
  let set = WATCHERS.get(context);
  if (!set) { set = new Set(); WATCHERS.set(context, set); }
  set.add(cb);
  return () => { set!.delete(cb); };
}

/** An open link of a context, by what it serves: its own namespace and the root it is a name under. */
export type OpenLink = { session: SeedSession; namespace: string; root: string };

/**
 * The open links of a context, sorted by namespace (never by when they opened). `root` is what the link's namespace is a
 * name under: `ana.a-test.local` under `a-test.local`. Sessions are returned as they are; the roots they were built from
 * are not reachable from here.
 */
export function openLinksOf(context: object | null | undefined): OpenLink[] {
  if (!context) return [];
  return [...entriesOf(context).values()]
    .map((e) => {
      const prefix = `${e.handle}.`;
      const root = e.namespace.startsWith(prefix) ? e.namespace.slice(prefix.length) : e.namespace;
      return { session: e.session, namespace: e.namespace, root };
    })
    .sort((a, b) => a.namespace.localeCompare(b.namespace));
}
