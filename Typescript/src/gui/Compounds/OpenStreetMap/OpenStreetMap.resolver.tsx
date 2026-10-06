import * as React from 'react';
import type { RegistryEntry, ResolveCtx } from '@/Registry/types';
import { ensureNodeId } from '@/gui-internals/utils/nodeID';
import OpenStreetMap, { type OpenStreetMapProps } from './OpenStreetMap';
import OpenStreetMapMarker, { type OsmMarkerProps } from './OpenStreetMapMarker';

// Kernel bindings in declarative specs use the renderer's existing read
// expressions (e.g. `lat: "me/ships.1.lat"`), resolved and subscribed by the
// runtime like any other prop. Canvas layers take a draw callback, so they
// have no JSON spec; use <OpenStreetMap.Canvas> from code.

export type OpenStreetMapSpec = {
  type: 'OpenStreetMap';
  props?: Omit<OpenStreetMapProps, 'children'> & { children?: React.ReactNode; [key: string]: any };
  children?: any;
};

export type OpenStreetMapMarkerSpec = {
  type: 'OpenStreetMapMarker';
  props?: OsmMarkerProps & { [key: string]: any };
};

const DEMO_BBOX = { south: 19.192, west: -96.142, north: 19.205, east: -96.122 };

export const meta = {
  id: 'compounds.openstreetmap',
  label: 'OpenStreetMap',
  kind: 'molecule' as const,
  path: ['Maps'],
  tags: ['map', 'openstreetmap', 'osm', 'geo', 'marker', 'canvas'],
  story: { title: 'Compounds/OpenStreetMap' },
  demoSpec: {
    type: 'OpenStreetMap',
    props: {
      bbox: DEMO_BBOX,
      width: 600,
      height: 400,
      pad: 12,
      background: '#0b0d10',
      source: { dataSource: 'demo frame (no basemap layers)', license: 'ODbL' },
      style: { height: 260 },
    },
    children: [
      { type: 'OpenStreetMapMarker', props: { lat: 19.1985, lon: -96.132, shape: 'circle', size: 14, color: '#7eb8c9', label: 'centre' } },
    ],
  },
};

export const markerMeta = {
  id: 'compounds.openstreetmap.marker',
  label: 'OpenStreetMap.Marker',
  kind: 'atom' as const,
  path: ['Maps', 'OpenStreetMap'],
  tags: ['map', 'marker', 'pin', 'openstreetmap'],
  story: { title: 'Compounds/OpenStreetMap' },
  demoSpec: {
    type: 'OpenStreetMap',
    props: { bbox: DEMO_BBOX, width: 600, height: 400, background: '#0b0d10', style: { height: 200 } },
    children: [
      { type: 'OpenStreetMapMarker', props: { lat: 19.2, lon: -96.135, shape: 'triangle', size: 14, color: '#c9b87e', label: 'triangle' } },
      { type: 'OpenStreetMapMarker', props: { lat: 19.196, lon: -96.128, shape: 'icon', icon: 'directions_boat', size: 18, color: '#7eb8c9', label: 'icon' } },
    ],
  },
};

const OpenStreetMapResolver: RegistryEntry = {
  type: 'OpenStreetMap',
  meta,
  resolve(spec: OpenStreetMapSpec, _ctx?: ResolveCtx) {
    // `data-gui-node-id` (injected by the spec renderer) passes through in `rest`
    // and lands on the map root; React keys never travel in spread props.
    const { id, children, key: _key, ...rest } = (spec.props ?? {}) as NonNullable<OpenStreetMapSpec['props']>;
    const kids = children ?? spec.children;
    return (
      <OpenStreetMap id={ensureNodeId('openstreetmap', id)} {...(rest as OpenStreetMapProps)}>
        {kids}
      </OpenStreetMap>
    );
  },
};

export const OpenStreetMapMarkerResolver: RegistryEntry = {
  type: 'OpenStreetMapMarker',
  meta: markerMeta,
  resolve(spec: OpenStreetMapMarkerSpec, _ctx?: ResolveCtx) {
    // The renderer injects `data-gui-node-id` and records the node with the
    // spec's provenance, so the marker only tags its element (no second
    // registration that would replace the recorded spec). `bind` passes through.
    const { key: _key, ...props } = (spec.props ?? {}) as OsmMarkerProps & { key?: unknown };
    return <OpenStreetMapMarker {...(props as OsmMarkerProps)} />;
  },
};

export default OpenStreetMapResolver;
