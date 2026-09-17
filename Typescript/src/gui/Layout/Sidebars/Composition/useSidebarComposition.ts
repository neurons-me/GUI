import * as React from 'react';
import type { SeedSession } from '@/core/session/createSeedSession';
import { readScope } from './sidebarCompositionIO';
import { resolveSidebarComposition, type ResolvedSidebarItem, type ScopeData, type ScopeId } from './sidebarComposition';

export type UseSidebarCompositionResult = {
  resolved: ResolvedSidebarItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Thin consumer of sidebarComposition.ts (pure resolver) and
 * sidebarCompositionIO.ts (the only `.me` I/O) -- has no composition
 * semantics of its own. Reads every scope in `scopeChain` from the
 * session's real, confirmed `.me` state and resolves the effective
 * sidebar for this page.
 */
export function useSidebarComposition(
  session: SeedSession | null,
  scopeChain: ScopeId[]
): UseSidebarCompositionResult {
  const [resolved, setResolved] = React.useState<ResolvedSidebarItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [refetchTick, setRefetchTick] = React.useState(0);
  const scopeChainKey = scopeChain.join('>');

  React.useEffect(() => {
    if (!session?.readConfirmed) {
      setResolved([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const scopes: Record<ScopeId, ScopeData> = {};
        for (const scopeId of scopeChainKey.split('>').filter(Boolean)) {
          scopes[scopeId] = await readScope(session, scopeId);
        }
        if (cancelled) return;
        setResolved(resolveSidebarComposition(scopeChainKey.split('>').filter(Boolean), scopes));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, scopeChainKey, refetchTick]);

  const refetch = React.useCallback(() => setRefetchTick((t) => t + 1), []);

  return { resolved, loading, error, refetch };
}
