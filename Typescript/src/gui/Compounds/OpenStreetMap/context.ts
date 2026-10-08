import * as React from 'react';
import type { OsmTransform } from './projection';
import type { OsmPalette } from './mapPalette';

export type OpenStreetMapContextValue = {
  /** Transform as of the last render (re-renders when the container resizes). */
  transform: OsmTransform;
  /** Always-current transform, for per-frame readers (canvas layers). */
  transformRef: React.MutableRefObject<OsmTransform>;
  /** Map palette derived from the theme in scope (see mapPalette.ts). */
  palette: OsmPalette;
  /** Always-current palette, for per-frame readers (canvas layers). */
  paletteRef: React.MutableRefObject<OsmPalette>;
};

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
