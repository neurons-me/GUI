import * as React from 'react';
import type { OsmTransform, OsmUserView } from './projection';
import type { OsmLayerKind, OsmMarkerTone, OsmPalette } from './mapPalette';
import type { OsmMarkerStore, OsmSelectionSource, OsmSelectionState } from './selection';
import type { OsmPinLayoutEntry } from './usePinLayout';

export type OpenStreetMapContextValue = {
  /** Transform as of the last render (re-renders when the container resizes). */
  transform: OsmTransform;
  /** Always-current transform, for per-frame readers (canvas layers). */
  transformRef: React.MutableRefObject<OsmTransform>;
  /** Map palette derived from the theme in scope (see mapPalette.ts). */
  palette: OsmPalette;
  /** Always-current palette, for per-frame readers (canvas layers). */
  paletteRef: React.MutableRefObject<OsmPalette>;
  /**
   * The HTML dock element for an overlay position, once mounted (null before
   * the first commit and on the server). Used by overlays that end up inside
   * the SVG subtree (e.g. wrapped by a spec renderer node) to portal out.
   */
  getDock(position: OsmOverlayPosition): HTMLElement | null;
  /** True after the docks mounted (re-renders portalled overlays once). */
  docksReady: boolean;
  /** Zoom / pan state and actions (buttons, keyboard, gestures). */
  viewport: OsmViewport;
  /** Basemap layers and their visibility (layer toggle). */
  layers: OsmLayersState;
  /** Defaults for markers that do not set these props themselves. */
  markerDefaults: OsmMarkerDefaults;
  /** Pin selection (enabled only with `selected` / `defaultSelected`). */
  selection: OsmSelectionState;
  /** Markers on the map (registered by OpenStreetMap.Marker). */
  markerStore: OsmMarkerStore;
  /** Screen-space layout of selected pins (edge pins, labels); null outside selection mode or before measuring. */
  pinLayout: Map<string, OsmPinLayoutEntry> | null;
  /** Hovered / focused pin (label priority). */
  setPinFocus(id: string | null): void;
  /** Click / Enter / Space on a pin: an edge pin pans the map to it, others toggle. */
  activatePin(id: string, source: OsmSelectionSource): void;
  /** Pan (animated unless reduced motion) so a pin is in view. */
  showPin(id: string): void;
};

export type OsmViewSource = 'button' | 'keyboard' | 'wheel' | 'drag' | 'pinch' | 'reset' | 'pin' | 'api';

/**
 * How markers (and other screen-space symbols) are sized while the map zooms.
 * 'fit' (default): their size at the fit view, kept while zooming (today's look at zoom 1).
 * 'screen': sizes are CSS px, whatever the container size.
 */
export type OsmMarkerScaleMode = 'fit' | 'screen';

export type OsmViewport = {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  /** The view is the plain fit (zoom 1, frame centre). */
  isFit: boolean;
  view: OsmUserView;
  setView(view: Partial<OsmUserView>, source?: OsmViewSource): void;
  /** Zoom by a factor around a container point (CSS px; default the centre). */
  zoomBy(factor: number, source?: OsmViewSource, at?: { x: number; y: number }): void;
  /** Move the map content by (dx, dy) CSS px (a drag). */
  panBy(dx: number, dy: number, source?: OsmViewSource): void;
  /**
   * Centre the view on a point. `animate` eases the pan (~280 ms); it is instant
   * under prefers-reduced-motion or without requestAnimationFrame.
   */
  panTo(lat: number, lon: number, source?: OsmViewSource, options?: { animate?: boolean }): void;
  reset(source?: OsmViewSource): void;
};

export type OsmLayerInfo = { id: string; kind: OsmLayerKind; label: string };

export type OsmLayersState = {
  list: OsmLayerInfo[];
  hidden: ReadonlySet<string>;
  setHidden(ids: string[]): void;
  toggle(id: string): void;
};

export type OsmMarkerDefaults = {
  shape?: 'circle' | 'square' | 'triangle' | 'rect' | 'icon';
  size?: number;
  tone?: OsmMarkerTone;
};

export type OsmOverlayPosition =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

export const OSM_OVERLAY_POSITIONS: readonly OsmOverlayPosition[] = [
  'top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right',
];

/** True inside the map's <svg> subtree (markers / svg overlays), false in HTML docks. */
export const OsmSvgScopeContext = React.createContext(false);

export const OpenStreetMapContext = React.createContext<OpenStreetMapContextValue | null>(null);

/** The map's shared transform (projection + view). Must be used inside <OpenStreetMap>. */
export function useOpenStreetMap(): OsmTransform {
  const ctx = React.useContext(OpenStreetMapContext);
  if (!ctx) throw new Error('[GUI.OpenStreetMap] useOpenStreetMap must be used inside <OpenStreetMap>.');
  return ctx.transform;
}

export function useOpenStreetMapContext(): OpenStreetMapContextValue {
  const ctx = React.useContext(OpenStreetMapContext);
  if (!ctx) throw new Error('[GUI.OpenStreetMap] this component must be used inside <OpenStreetMap>.');
  return ctx;
}

/** The map's theme-derived palette. Must be used inside <OpenStreetMap>. */
export function useOpenStreetMapPalette(): OsmPalette {
  return useOpenStreetMapContext().palette;
}
