import type { SeedSession } from '@/core/session/createSeedSession';
import { MonadClientError, type MonadClient } from '@/core/session/monadClient';
import type { ScopeData, ScopeId, SidebarItemElement } from './sidebarComposition';

// The only place this feature touches `.me` -- everything here is built
// directly on session.readConfirmed()/session.signAndWrite() (the real
// signed-write/confirmed-read channel proved by the profile.displayName
// binding), never the local-only session.read()/writeMeValue(). No new
// write/read mechanism: `.me` has no append-to-collection primitive
// (confirmed by reading core-write.ts/core-index.ts before writing this),
// so "adding an item" is an ordinary read-modify-write of a plain array
// value at `layout.sidebar.scopes.<scopeId>.itemIds`, exactly like any
// other `.me` write in this codebase.

function itemIdsPath(scopeId: ScopeId): string {
  return `layout.sidebar.scopes.${scopeId}.itemIds`;
}

function itemPath(scopeId: ScopeId, itemId: string): string {
  return `layout.sidebar.scopes.${scopeId}.items.${itemId}`;
}

function hiddenIdsPath(scopeId: ScopeId): string {
  return `layout.sidebar.scopes.${scopeId}.hiddenIds`;
}

function requireWritableSession(session: SeedSession): asserts session is SeedSession & {
  signAndWrite: NonNullable<SeedSession['signAndWrite']>;
  readConfirmed: NonNullable<SeedSession['readConfirmed']>;
} {
  if (!session.signAndWrite || !session.readConfirmed) {
    throw new Error('This session cannot sign writes or read confirmed values.');
  }
}

/** A real, disclosure-checked read of one scope's full data from `.me`. */
export async function readScope(session: SeedSession, scopeId: ScopeId): Promise<ScopeData> {
  requireWritableSession(session);
  const itemIds = (await session.readConfirmed<string[]>(itemIdsPath(scopeId))) ?? [];
  const items: Record<string, SidebarItemElement> = {};
  for (const itemId of itemIds) {
    const element = await session.readConfirmed<SidebarItemElement>(itemPath(scopeId, itemId));
    if (element) items[itemId] = element;
  }
  const hiddenIds = (await session.readConfirmed<string[]>(hiddenIdsPath(scopeId))) ?? [];
  return { itemIds, items, hiddenIds };
}

/**
 * The public counterpart to readScope() above: reads one scope's data from
 * ANY namespace, with no SeedSession and no signing capability required --
 * the same disclosure-checked GET (public/closed/404, see
 * monad.ai's pathResolver.ts) an unauthenticated visitor gets. This is for
 * "the namespace/context currently being visited" (e.g. the installation
 * root a landing page is served from), which is readable before anyone
 * signs in -- distinct from readScope(), which is always the CALLER's own
 * authenticated namespace. A closed or absent path resolves to an empty
 * scope, not an error: a namespace that has declared nothing here yet is
 * the common case, not a failure.
 */
export async function readScopePublic(
  monad: MonadClient,
  transportOrigin: string,
  semanticNamespace: string,
  scopeId: ScopeId
): Promise<ScopeData> {
  async function readPublic<TValue>(path: string): Promise<TValue | undefined> {
    try {
      const result = await monad.readNamespacePath<TValue>({ semanticNamespace, transportOrigin, path });
      return result.value;
    } catch (cause) {
      if (cause instanceof MonadClientError && (cause.code === 'NOT_FOUND' || cause.code === 'PATH_NOT_FOUND')) {
        return undefined;
      }
      throw cause;
    }
  }

  const itemIds = (await readPublic<string[]>(itemIdsPath(scopeId))) ?? [];
  const items: Record<string, SidebarItemElement> = {};
  for (const itemId of itemIds) {
    const element = await readPublic<SidebarItemElement>(itemPath(scopeId, itemId));
    if (element) items[itemId] = element;
  }
  const hiddenIds = (await readPublic<string[]>(hiddenIdsPath(scopeId))) ?? [];
  return { itemIds, items, hiddenIds };
}

/**
 * Adds (or replaces, if the same id already exists at this scope) an item
 * at the given scope. Never touches any other scope's data -- adding at
 * `root` does not require page scopes to do anything for the item to
 * become visible there; they simply include `root` in their own
 * scopeChain when resolving.
 */
export async function addItemToScope(
  session: SeedSession,
  scopeId: ScopeId,
  element: SidebarItemElement
): Promise<void> {
  requireWritableSession(session);
  const itemId = element.props?.id;
  if (!itemId) throw new Error('Sidebar item must have a stable props.id.');

  const currentIds = (await session.readConfirmed<string[]>(itemIdsPath(scopeId))) ?? [];
  if (!currentIds.includes(itemId)) {
    await session.signAndWrite(itemIdsPath(scopeId), [...currentIds, itemId]);
  }
  await session.signAndWrite(itemPath(scopeId, itemId), element);
}

/**
 * Hides an inherited item starting at `scopeId` (in this feature's
 * convention, always a page scope). This writes ONLY to `scopeId`'s own
 * `hiddenIds` list -- the item's origin definition (wherever it was
 * actually added) is never read, modified, or deleted by this call. A
 * sibling scope that never calls this for the same id keeps showing it.
 */
export async function hideItemAtScope(
  session: SeedSession,
  scopeId: ScopeId,
  itemId: string
): Promise<void> {
  requireWritableSession(session);
  const currentHidden = (await session.readConfirmed<string[]>(hiddenIdsPath(scopeId))) ?? [];
  if (!currentHidden.includes(itemId)) {
    await session.signAndWrite(hiddenIdsPath(scopeId), [...currentHidden, itemId]);
  }
}
