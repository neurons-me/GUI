// The address axis: the one vertical line the address (`me @ where` in the top bar) and the page under it start on.
// The page is what is at that address, so it is read as its continuation: the eye goes from the QR to the address and
// straight down into the content, with no sideways jump.
//
// Every number here comes from where it is defined or is a declared choice; nothing is a measurement copied by hand:
//   - the top bar's toolbar padding is set here and passed to the TopBar (Namespace.tsx);
//   - the Content gutter is the Layout's own (contentGutter.ts);
//   - the base gap and the e nudge are the design choice;
// and the axis is snapped to the device pixel so the text on it is drawn crisp, not between two pixels.
// tests/integration/addressAxis.browser.test.mjs measures the INK of the address and of the page's first line in a real
// browser and fails if they drift apart or the air under the top bar changes.
import * as React from 'react';
import { CONTENT_GUTTER_PX } from '@/gui/Layout/Content/contentGutter';

/** The top bar's toolbar padding on the left (the TopBar's `toolbarSx.pl`). */
export const TOP_BAR_TOOLBAR_PL_PX = 2;
/** The address starts this far past the toolbar's padding, before the nudge. */
export const ADDRESS_AXIS_BASE_PX = 8;
/** The step off the bar's line, shared by the address and the page: e. */
export const ADDRESS_AXIS_NUDGE_PX = Math.E;
/** The page's first line (its glyphs) under the top bar: 13px (21/φ, the Fibonacci step below 21). */
export const ADDRESS_PAGE_TOP_PX = 13;

/** A length rounded to what the device can draw (1/dpr of a CSS pixel). */
export function snapToDevicePixel(px: number, dpr: number): number {
  const ratio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  return Math.round(px * ratio) / ratio;
}

export type AddressAxis = {
  /** Where the address's text starts, from the left bar's edge, snapped to the device pixel. */
  fromBarEdgePx: number;
  /** The top bar's left elements' padding (after the toolbar's own). */
  addressPl: number;
  /** A page's left padding inside Content, so its first glyphs start on the same line. */
  pagePl: number;
  /** A page's top padding inside Content, for its first line's glyph box to sit ADDRESS_PAGE_TOP_PX under the bar. */
  pagePt: (glyphRisePx?: number) => number;
};

export function addressAxis(dpr: number): AddressAxis {
  const fromBarEdgePx = snapToDevicePixel(TOP_BAR_TOOLBAR_PL_PX + ADDRESS_AXIS_BASE_PX + ADDRESS_AXIS_NUDGE_PX, dpr);
  return {
    fromBarEdgePx,
    addressPl: fromBarEdgePx - TOP_BAR_TOOLBAR_PL_PX,
    pagePl: fromBarEdgePx - CONTENT_GUTTER_PX,
    pagePt: (glyphRisePx = 0) => ADDRESS_PAGE_TOP_PX - CONTENT_GUTTER_PX + glyphRisePx,
  };
}

function readDpr(): number {
  return typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
}

/** The axis for this screen; follows the device pixel ratio (zoom, moving the window to another display). */
export function useAddressAxis(): AddressAxis {
  const [dpr, setDpr] = React.useState(readDpr);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(`(resolution: ${dpr}dppx)`);
    const onChange = () => setDpr(readDpr());
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, [dpr]);
  return React.useMemo(() => addressAxis(dpr), [dpr]);
}
