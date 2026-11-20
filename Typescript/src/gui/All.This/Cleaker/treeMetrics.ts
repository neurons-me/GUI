// treeMetrics.ts — the identity/keys tree's sizes, in rem so they follow the
// user's own font size (browser setting or zoom), like the .GUI theme's
// typography (fromTokens pxToRem). One node box = 2.125rem (34px at 16px).
// JS layout that needs pixels converts with remPx() at measure time.
export const NODE_REM = 2.125;
export const NODE_SIZE = `${NODE_REM}rem`;
/** Icon inside a node / preset tile (ServiceIcon's default, Icon fontSize). */
export const NODE_ICON = '1.25rem';
/** Current root font size in px (16 by default; larger when the user raised it). */
export function remPx(): number {
  if (typeof document === 'undefined') return 16;
  const n = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(n) && n > 0 ? n : 16;
}
export const nodePx = () => NODE_REM * remPx();
