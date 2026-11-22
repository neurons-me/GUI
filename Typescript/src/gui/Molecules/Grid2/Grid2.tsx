import MuiGrid2 from '@mui/material/Grid2';
import * as React from 'react';
import type { Grid2Props } from './Grid2.types';

/**
 * This.GUI — Grid2
 *
 * Thin wrapper around MUI 6's `Grid2` (`@mui/material/Grid2`). The existing
 * Molecules/Grid wraps the legacy MUI `Grid` and is left unchanged.
 *
 * Extra prop `query="container"` sets `container-type: inline-size` so
 * children can use `theme.containerQueries` in `sx`. See Grid2.types.ts.
 */
const Grid2 = React.forwardRef<HTMLDivElement, Grid2Props>(function Grid2(props, ref) {
  const { query, sx, ...rest } = props;
  const sxMerged =
    query === 'container'
      ? ([{ containerType: 'inline-size' as const }, sx] as Grid2Props['sx'])
      : sx;
  return <MuiGrid2 ref={ref} sx={sxMerged} {...rest} />;
});

(Grid2 as typeof Grid2 & { displayName?: string }).displayName = 'Gui.Grid2';
export default Grid2;
