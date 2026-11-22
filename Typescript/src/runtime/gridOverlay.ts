/**
 * Layout-grid overlay: when the grid is on, every `[data-gui-node-id]` is
 * outlined by a position:fixed layer whose boxes come from
 * getBoundingClientRect(). Outlines painted this way are not clipped by a
 * bar's overflow:hidden (the CSS `outline` on the node itself was).
 * pointer-events: none, so the layer does not change layout or hit-testing.
 * A rAF loop keeps the boxes in sync with Dock magnification and open/close
 * motion.
 */
const OVERLAY_ID = 'gui-grid-overlay';
const CONTROL_SELECTOR = 'button, a, input, textarea, select, [role="button"], .MuiFormControl-root';

function isSkippable(el: Element): boolean {
  if (el.closest(`#${OVERLAY_ID}`)) return true;
  // The inspector's own side panel only — ThemeLauncher also uses
  // data-gui-inspector-control (so clicks don't inspect it) and MUST still
  // be outlined.
  if (el.closest('aside[data-gui-inspector-control="true"]')) return true;
  return false;
}

export function startGridOverlay(): () => void {
  if (typeof document === 'undefined') return () => {};

  document.body.classList.add('gui-grid-overlay-active');

  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();

  const layer = document.createElement('div');
  layer.id = OVERLAY_ID;
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1990;overflow:visible;';
  document.body.appendChild(layer);

  const boxes: HTMLDivElement[] = [];
  let raf = 0;
  let running = true;

  const paint = () => {
    if (!running) return;
    raf = requestAnimationFrame(paint);
    const nodes = document.querySelectorAll<HTMLElement>('[data-gui-node-id]');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let i = 0;
    nodes.forEach((el) => {
      if (isSkippable(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) return;
      if (r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) return;
      const isControl = el.matches(CONTROL_SELECTOR);
      let box = boxes[i];
      if (!box) {
        box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.pointerEvents = 'none';
        box.style.boxSizing = 'border-box';
        box.style.borderRadius = '2px';
        layer.appendChild(box);
        boxes[i] = box;
      }
      // Controls: 3px outside (same as the old outline-offset), dashed.
      // Other nodes: flush with the box (inset-equivalent, no extra size).
      const pad = isControl ? 3 : 0;
      box.style.left = `${Math.round(r.left - pad)}px`;
      box.style.top = `${Math.round(r.top - pad)}px`;
      box.style.width = `${Math.round(r.width + pad * 2)}px`;
      box.style.height = `${Math.round(r.height + pad * 2)}px`;
      box.style.border = isControl
        ? '1px dashed color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 70%, transparent)'
        : '1px solid color-mix(in srgb, var(--gui-inspector-accent, #3b82f6) 35%, transparent)';
      box.style.display = '';
      i += 1;
    });
    for (let j = i; j < boxes.length; j += 1) {
      boxes[j].style.display = 'none';
    }
  };

  raf = requestAnimationFrame(paint);

  return () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    layer.remove();
    document.body.classList.remove('gui-grid-overlay-active');
  };
}
