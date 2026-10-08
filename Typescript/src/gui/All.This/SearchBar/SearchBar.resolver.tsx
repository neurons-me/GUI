import * as React from 'react';
import type { RegistryEntry, ResolveCtx } from '@/Registry/types';
import { ensureNodeId } from '@/gui-internals/utils/nodeID';
import type { SearchBarResolverSpec } from './SearchBar.types';

// Lazy-loaded so the search index UI only downloads when something actually
// resolves a `SearchBar` node.
const SearchBar = React.lazy(() => import('./SearchBar'));

const SearchBarResolver: RegistryEntry = {
  type: 'SearchBar',
  resolve(spec: SearchBarResolverSpec, _ctx?: ResolveCtx) {
    const p = spec.props ?? ({} as any);
    const { id, ...rest } = p;
    const searchBarId = ensureNodeId('searchbar', id);
    return (
      <React.Suspense fallback={null}>
        <SearchBar id={searchBarId} data-testid={p['data-testid']} {...rest} />
      </React.Suspense>
    );
  },
};

export default SearchBarResolver;
