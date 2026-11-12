import { useEffect, useMemo } from 'react';
import qrcodegen from 'qrcode-generator';
import { useGuiTheme } from '@/gui-internals/Hooks';
import { ME_WORDMARK_EMBED_BITMAP } from '@/gui/All.This/me/QR/meMark';
import { resolveQrMeColors } from '@/gui/All.This/me/QR/qrContrast';

// When the page IS the namespace, its favicon is its own QR: the same value the corner QR draws, the same `.me` mark
// in the centre and the same theme colours (ink, paper, ring), like the static icon of neurons-me.github.io/Cleaker.
// Built as an SVG data URL, so every namespace (cleaker.me or any other) gets its own without shipping image files.
// When the page is an app with the namespace drawn over it (AppShell, the Cleaker corner), the app keeps its favicon:
// only <Namespace> mounts this.

export type NamespaceFaviconColors = { fg: string; bg: string; ring: string };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Pure: the favicon SVG for `value` (exported for tests). */
export function namespaceFaviconSvg(value: string, { fg, bg, ring }: NamespaceFaviconColors): string {
  const qr = (qrcodegen as any)(0, 'H');
  qr.addData(String(value ?? ''));
  qr.make();
  const n: number = qr.getModuleCount();
  const quiet = 1;
  const frame = 2; // ring stroke + gap, in modules
  const total = n + 2 * quiet + 2 * frame;
  const o = frame + quiet;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${o + c} ${o + r}h1v1h-1z`;
  }
  // `.me` wordmark over the centre, on a paper patch so it reads at 32px.
  const bm = ME_WORDMARK_EMBED_BITMAP;
  const bw = bm[0].length;
  const bh = bm.length;
  const scale = Math.max(1, Math.floor((n * 0.42) / bw));
  const ww = bw * scale;
  const wh = bh * scale;
  const wx = Math.round(o + (n - ww) / 2);
  const wy = Math.round(o + (n - wh) / 2);
  let m = '';
  for (let r = 0; r < bh; r++) {
    for (let c = 0; c < bw; c++) if (bm[r][c] === '1') m += `M${wx + c * scale} ${wy + r * scale}h${scale}v${scale}h-${scale}z`;
  }
  const rr = total * 0.14;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`
    + `<rect x="0.5" y="0.5" width="${total - 1}" height="${total - 1}" rx="${rr}" fill="${esc(bg)}" stroke="${esc(ring)}" stroke-width="1"/>`
    + `<path d="${d}" fill="${esc(fg)}"/>`
    + `<rect x="${wx - 1}" y="${wy - 1}" width="${ww + 2}" height="${wh + 2}" fill="${esc(bg)}"/>`
    + `<path d="${m}" fill="${esc(fg)}"/>`
    + `</svg>`;
}

export function namespaceFaviconHref(value: string, colors: NamespaceFaviconColors): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(namespaceFaviconSvg(value, colors))}`;
}

// One owner of the tab icon at a time: the last mounted mark wins, and when it unmounts the previous one comes back
// (or, with none left, the page's own <link rel="icon"> tags, removed while a mark owned the tab).
type FaviconEntry = { id: number; href: string };
const faviconStack: FaviconEntry[] = [];
let faviconSeq = 0;
let pageIcons: HTMLLinkElement[] | null = null;

function applyFavicon() {
  if (typeof document === 'undefined') return;
  const head = document.head;
  const top = faviconStack[faviconStack.length - 1];
  let ours = head.querySelector<HTMLLinkElement>('link[data-gui-favicon]');
  if (!top) {
    ours?.parentNode?.removeChild(ours);
    if (pageIcons) pageIcons.forEach((l) => head.appendChild(l));
    pageIcons = null;
    return;
  }
  if (!pageIcons) {
    pageIcons = Array.from(head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]:not([data-gui-favicon])'));
    pageIcons.forEach((l) => l.parentNode?.removeChild(l));
  }
  if (!ours) {
    ours = document.createElement('link');
    ours.rel = 'icon';
    ours.setAttribute('data-gui-favicon', '');
    head.appendChild(ours);
  }
  if (top.href.startsWith('data:image/svg')) ours.type = 'image/svg+xml';
  else ours.removeAttribute('type');
  if (ours.href !== top.href) ours.href = top.href;
}

/** While mounted (and enabled), the tab's icon is `href`. */
export function useFavicon(href: string | null | undefined, enabled = true) {
  useEffect(() => {
    if (!enabled || !href || typeof document === 'undefined') return;
    const entry = { id: ++faviconSeq, href };
    faviconStack.push(entry);
    applyFavicon();
    return () => {
      const i = faviconStack.indexOf(entry);
      if (i >= 0) faviconStack.splice(i, 1);
      applyFavicon();
    };
  }, [href, enabled]);
}

/** Pure: a brand mark (its glyph or initial, in the theme's primary on its paper) as an SVG favicon. */
export function brandFaviconSvg(text: string, { fg, bg }: { fg: string; bg: string }): string {
  const t = esc(Array.from(text)[0] ?? '•');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
    + `<rect width="64" height="64" rx="12" fill="${esc(bg)}"/>`
    + `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="700" font-size="40" fill="${esc(fg)}">${t}</text>`
    + `</svg>`;
}

/** Pure: an already-drawn <svg> (a brand's Icon) as a favicon, its currentColor fixed to `color`. */
export function svgElementFaviconHref(svg: SVGSVGElement, color: string): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('viewBox')) {
    const w = svg.width?.baseVal?.value || 24;
    const h = svg.height?.baseVal?.value || 24;
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('width', '64');
  clone.setAttribute('height', '64');
  clone.setAttribute('color', color);
  clone.setAttribute('fill', clone.getAttribute('fill') || 'currentColor');
  const xml = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}

/** Sets the tab's icon to the namespace QR while mounted (the page is the namespace). */
export function NamespaceFavicon({ value, enabled = true }: { value: string; enabled?: boolean }) {
  const theme = useGuiTheme();
  const { qrFg, qrBg, ringAccent } = resolveQrMeColors(theme.palette as any, { status: 'confirmed' });
  const href = useMemo(
    () => (value ? namespaceFaviconHref(value, { fg: qrFg, bg: qrBg, ring: ringAccent }) : ''),
    [value, qrFg, qrBg, ringAccent],
  );
  useFavicon(href, enabled);
  return null;
}

export default NamespaceFavicon;
