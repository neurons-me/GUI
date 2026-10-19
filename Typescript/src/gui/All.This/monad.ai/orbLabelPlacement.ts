// orbLabelPlacement.ts -- where the orb's hover label goes, against the real margins.
//
// It starts over the RIGHT half of the orb (a little left of the orb's centre) and extends to the right; when the right
// margin is short it slides left to stay inside the viewport; above the orb, below it when there is no room above.
export type Box = { left: number; top: number; width: number; height: number };

export function placeOrbLabel(
  anchor: Box,
  label: { width: number; height: number },
  viewport: { width: number; height: number },
  options: { margin?: number; gap?: number; inset?: number } = {},
): { left: number; top: number; maxWidth: number } {
  const margin = options.margin ?? 8;
  const gap = options.gap ?? 8;
  const inset = options.inset ?? 12;
  const maxWidth = Math.max(0, viewport.width - 2 * margin);
  const width = Math.min(label.width, maxWidth);
  const wanted = anchor.left + anchor.width / 2 - inset;
  const left = Math.max(margin, Math.min(wanted, viewport.width - margin - width));
  let top = anchor.top - gap - label.height;
  if (top < margin) top = anchor.top + anchor.height + gap;
  return { left, top, maxWidth };
}
