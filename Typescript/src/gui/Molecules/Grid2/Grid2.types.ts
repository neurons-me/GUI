import type { Grid2Props as MuiGrid2Props } from '@mui/material/Grid2';

/**
 * Optional container-query mode.
 *
 * `'viewport'` (default) — MUI Grid2's own `size` / `columns` / `spacing`
 * breakpoints follow the viewport, as Grid2 always does.
 *
 * `'container'` — the element also gets `container-type: inline-size`, so
 * children can use `theme.containerQueries` in their `sx` (e.g.
 * `sx={(theme) => ({ [theme.containerQueries.up('sm')]: { … } })}`).
 * Grid2's `size` prop itself still follows the viewport: MUI 6.5 does not
 * wire `size` to container queries, and remapping it here would fight
 * Grid2's own flex styles. Use `theme.containerQueries` in `sx` when a
 * child needs to react to this container's width.
 */
export type Grid2QueryMode = 'container' | 'viewport';

export type Grid2Props = MuiGrid2Props & {
  query?: Grid2QueryMode;
};

export type Grid2ResolverSpec = {
  type: 'Grid2';
  props?: Grid2Props;
};
