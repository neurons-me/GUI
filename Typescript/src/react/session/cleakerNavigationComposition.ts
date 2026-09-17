import * as React from 'react';
import type { SeedSession } from '@/core/session/createSeedSession';
import { createMonadClient } from '@/core/session/monadClient';
import { readScope, readScopePublic } from '@/gui/Layout/Sidebars/Composition/sidebarCompositionIO';
import {
  resolveSidebarComposition,
  type ResolvedSidebarItem,
  type ScopeData,
} from '@/gui/Layout/Sidebars/Composition/sidebarComposition';

// The real app's built-in navigation defaults -- a plain JS constant, never
// read from or written to `.me`. This is the LAST-RESORT layer: it only
// shows up for an id neither of the two `.me` layers below declares.
const BUILTIN_SCOPE: ScopeData = {
  itemIds: ['users', 'blockchain', 'url'],
  items: {
    users: { type: 'link', props: { id: 'users', label: 'Users', to: '/users' } },
    blockchain: { type: 'link', props: { id: 'blockchain', label: 'Blockchain', to: '/blockchain' } },
    url: { type: 'link', props: { id: 'url', label: 'URL', to: '/url' } },
  },
};

const BUILTIN_ONLY = resolveSidebarComposition(['builtin'], { builtin: BUILTIN_SCOPE });

/**
 * Resolves Cleaker's real root sidebar as three layers, most-specific last:
 *
 *   1. 'builtin'  -- the plain JS defaults above. Final fallback only; never
 *      read from or written to `.me`.
 *   2. 'visited'  -- the PUBLIC root scope of `namespaceRootLabel` (the
 *      namespace/context this page is actually showing, e.g.
 *      "local.cleaker"). Read with readScopePublic(), a disclosure-checked
 *      GET that needs no session and no signing capability -- available to
 *      an unauthenticated visitor exactly as much as to a signed-in one.
 *      This is "the place you're standing," independent of who (if anyone)
 *      is authenticated.
 *   3. 'personal' -- only when signed in: the authenticated identity's OWN
 *      root scope (its own `.me` namespace, via the existing signed
 *      readScope()) -- personal preferences layered ON TOP of the visited
 *      context, never a replacement for it.
 *
 * `namespaceRootLabel`/`transportOrigin` come from the same
 * window.location-derived values every other view on this page already
 * uses (see CleakerLanding.tsx's defaultCleakerEndpoint/
 * deriveNamespaceRootLabel/getNetgetMonadOrigin) -- NOT from the session,
 * so signing in or out never changes which namespace is considered
 * "visited." Only whether the 'personal' layer is present depends on
 * session state. Every layer here is read-only; navigation never writes.
 */
export function useCleakerRootSidebar(
  namespaceRootLabel: string,
  transportOrigin: string,
  session: SeedSession | null
): { resolved: ResolvedSidebarItem[]; loading: boolean } {
  const [resolved, setResolved] = React.useState<ResolvedSidebarItem[]>(BUILTIN_ONLY);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!namespaceRootLabel || !transportOrigin) {
      setResolved(BUILTIN_ONLY);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const monad = createMonadClient({ transportOrigin });
    (async () => {
      const scopes: Record<string, ScopeData> = { builtin: BUILTIN_SCOPE };

      try {
        scopes.visited = await readScopePublic(monad, transportOrigin, namespaceRootLabel, 'root');
      } catch {
        // A closed or unreachable public root isn't an error for this page --
        // it just means this namespace hasn't declared anything extra yet.
      }

      if (session?.readConfirmed) {
        try {
          scopes.personal = await readScope(session, 'root');
        } catch {
          // Same reasoning: fall back to the visited/builtin layers alone.
        }
      }

      if (cancelled) return;
      const chain = ['builtin', 'visited', 'personal'].filter((id) => Boolean(scopes[id]));
      setResolved(resolveSidebarComposition(chain, scopes));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [namespaceRootLabel, transportOrigin, session]);

  return { resolved, loading };
}
