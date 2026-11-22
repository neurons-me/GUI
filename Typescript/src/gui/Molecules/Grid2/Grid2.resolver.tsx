import type { RegistryEntry, ResolveCtx } from '@/Registry/types';
import { ensureNodeId } from '@/gui-internals/utils/nodeID';
import Grid2 from './Grid2';
import type { Grid2ResolverSpec } from './Grid2.types';

export const meta = {
  id: 'molecules.grid2',
  type: 'Grid2',
  label: 'Grid2',
  group: 'Molecules',
  path: ['Layout'],
  tags: ['grid', 'grid2', 'layout', 'container-query'],
  story: {
    title: 'Molecules/Grid2',
    primary: 'molecules-grid2--playground',
  },
  demoSpec: {
    type: 'Grid2',
    props: { container: true, spacing: 2, children: 'Grid2' },
  },
} as const;

const Grid2Resolver: RegistryEntry = {
  type: 'Grid2',
  resolve(spec: Grid2ResolverSpec, _ctx?: ResolveCtx) {
    const p = spec.props ?? {};
    const {
      children,
      id,
      className,
      sx,
      query,
      ...rest
    } = p;

    const gridId = ensureNodeId('grid2', id);

    return (
      <Grid2
        id={gridId}
        className={className}
        sx={sx}
        query={query}
        {...rest}
      >
        {children}
      </Grid2>
    );
  },
};

export default Grid2Resolver;
