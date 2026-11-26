// Pure layout helpers for the keys tree's "+" / "…" paging.
// Kept off IdentityTree.tsx so tests can import them without loading MUI.
import { remPx, nodePx } from './treeMetrics';

const GAP = 10;
const ROW_PAD = 24; // row gap, level px*2 (node size: treeMetrics, rem)
/** Overflow past the node box: notice/pending dot (8px at -3) and the 2px+1px focus ring. */
const NODE_CONTOUR_REM = 0.5;

/**
 * Nodes that fit on one row of a level `width` px wide, counting each
 * icon's visible contour and the side air. Never force a count that would
 * let the margin cover an icon; wrap instead (min 1).
 */
export const rowCapacity = (width: number, node: number = nodePx()) => {
  const contour = 2 * NODE_CONTOUR_REM * remPx();
  const pad = Math.max(ROW_PAD, contour);
  return Math.max(1, Math.floor((width - pad + GAP) / (node + GAP)));
};

/**
 * Items to show for `blocks` blocks. Each row reads "+ content …": the "+"
 * and the "…" take a slot each, so the "…" always ends the last full row
 * (never wraps alone). When everything fits, no "…". Extended so an
 * active item is never hidden.
 */
export function visibleBlock<T>(items: T[], blocks: number, cap: number, pageSize: number | undefined, isActive: (t: T) => boolean): T[] {
  const room = pageSize ? blocks * pageSize : blocks * cap - 1; // slots after "+"
  const n = items.length <= room ? items.length : (pageSize ? room : room - 1);
  const i = items.findIndex(isActive);
  return items.slice(0, Math.max(n, i + 1));
}
