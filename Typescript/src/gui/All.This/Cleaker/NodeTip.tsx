// NodeTip.tsx — the one tooltip every tree node uses (the top row keys / wallet / profile / contacts and
// every level below): the .GUI Tooltip, one small monospace line with the node's own segment, above it.
import * as React from 'react';
import Tooltip from '@/gui/Atoms/Tooltip/Tooltip';

/**
 * Node tooltip offset (px), from the node's stable outer box (34px). The row's Dock hover scales the visible
 * button to ~50px around its centre (+8px up), so 10px keeps the line ~2px clear of it and below the row above.
 */
const NODE_TIP_POPPER = { modifiers: [{ name: 'offset', options: { offset: [0, 10] } }] };
const NODE_TIP_SX = {
  m: '0 !important', px: 0.75, py: 0, typography: 'caption', lineHeight: 1.2, fontWeight: 500,
  fontFamily: 'monospace', whiteSpace: 'nowrap', maxWidth: '16rem', overflow: 'hidden', textOverflow: 'ellipsis',
  borderRadius: 0.5, pointerEvents: 'none',
};

/**
 * Hover/focus tooltip: ONE line, the node's own level (e.g. `.neurons-me`), or the action name for
 * add / more / less. Above the node, small and quick (120 ms, instant between nodes), so it never covers the row below or
 * flashes while moving across a row. Off on an open node: its `.segment` label already shows under it.
 */
export default function NodeTip({ name, path, off = false, placement = 'top', children }: { name: string; path?: string; off?: boolean; /** Beside a stacked column (so it never covers its neighbour). */ placement?: 'top' | 'left'; children: React.ReactElement }) {
  return (
    <Tooltip
      size="sm" placement={placement} enterDelay={120} enterNextDelay={0} leaveDelay={0}
      disableInteractive /* hint only: never blocks a row */
      slotProps={{ popper: placement === 'top' ? NODE_TIP_POPPER : { modifiers: [{ name: 'offset', options: { offset: [0, 6] } }] }, tooltip: { sx: NODE_TIP_SX } }}
      title={off ? '' : (path || name)}
    >
      {children}
    </Tooltip>
  );
}
