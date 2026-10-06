import * as React from 'react';
import type { OsmTransform } from './projection';

export type OpenStreetMapContextValue = {
  /** Transform as of the last render (re-renders when the container resizes). */
  transform: OsmTransform;
  /** Always-current transform, for per-frame readers (canvas layers). */
  transformRef: React.MutableRefObject<OsmTransform>;
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
