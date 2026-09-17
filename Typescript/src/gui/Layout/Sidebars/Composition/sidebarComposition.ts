import type { LeftBarElement } from '@/gui/Layout/Sidebars/LeftBar/LeftBar.types';

// Pure data shapes and resolution logic for a scoped sidebar composition --
// no React, no `.me`. `.me` has no built-in "layered scopes, closest wins,
// hide-without-delete" primitive (confirmed by reading core-write.ts,
// core-index.ts, secret-context.ts, derivation.ts before writing this) --
// this is new application-level logic over plain path reads/writes, not a
// kernel mechanism. Kept separate from any I/O so the composition itself
// can be defined and tested as data first.

export type ScopeId = string;

export type SidebarItemElement = LeftBarElement;

export type ScopeData = {
  // Order items were added at this scope, oldest first.
  itemIds: string[];
  items: Record<string, SidebarItemElement>;
  // Ids to suppress starting at this scope -- by convention in this pass
  // only page scopes carry a non-empty list (hiding is page-scoped), but
  // the resolver itself doesn't enforce that; it just unions whatever it's
  // given across the chain.
  hiddenIds?: string[];
};

export type ResolvedSidebarItem = {
  element: SidebarItemElement;
  // Which scope in the chain contributed the element actually rendered --
  // if two scopes define the same id, the one closer to the page (later in
  // scopeChain) wins, and THAT scope is the origin, not the original
  // definer. Kept here so a later pass can attach it as real Inspector
  // provenance without re-deriving it.
  originScope: ScopeId;
  originPath: string;
};

/**
 * Resolves the effective sidebar item list for a page, given its scope
 * chain from most general to most specific (e.g.
 * `['root', 'branch__proyecto', 'page__proyecto__noticias']`).
 *
 * - An item added at an earlier (more general) scope is inherited by every
 *   later scope in the chain.
 * - An item with the SAME id re-added at a later scope overrides the
 *   earlier one (last-in-chain wins) -- its origin becomes the later scope.
 * - `hiddenIds` from ANY scope in the chain suppress that id from the
 *   final result, without removing it from `scopes` -- the origin scope's
 *   own `items`/`itemIds` are never touched by this function; hiding is
 *   purely a render-time filter over the resolved map.
 */
export function resolveSidebarComposition(
  scopeChain: ScopeId[],
  scopes: Record<ScopeId, ScopeData | undefined>
): ResolvedSidebarItem[] {
  const resolved = new Map<string, ResolvedSidebarItem>();
  const hidden = new Set<string>();

  for (const scopeId of scopeChain) {
    const scope = scopes[scopeId];
    if (!scope) continue;

    for (const hiddenId of scope.hiddenIds ?? []) {
      hidden.add(hiddenId);
    }

    for (const itemId of scope.itemIds ?? []) {
      const element = scope.items[itemId];
      if (!element) continue;
      resolved.set(itemId, {
        element,
        originScope: scopeId,
        originPath: `layout.sidebar.scopes.${scopeId}.items.${itemId}`,
      });
    }
  }

  return [...resolved.entries()]
    .filter(([itemId]) => !hidden.has(itemId))
    .map(([, entry]) => entry);
}
