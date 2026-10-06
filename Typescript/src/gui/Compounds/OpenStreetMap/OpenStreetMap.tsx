/*
 * GUI.OpenStreetMap — presents an OpenStreetMap-derived basemap that a
 * project already produced (e.g. a static SVG pre-projected by its own
 * generator script), plus markers and canvas layers, all on one transform.
 *
 * GUI only presents: it does not fetch tiles, query Overpass or process OSM
 * data. The project passes pre-projected basemap layers and the frame they
 * were projected into (bbox, width, height, pad), and the map renders them
 * with the OpenStreetMap attribution (© OpenStreetMap contributors, ODbL),
 * which is always shown.
 */
import * as React from 'react';
import { OpenStreetMapContext, useOpenStreetMap } from './context';
import {
  OSM_ATTRIBUTION,
  createOsmProjection,
  createOsmTransform,
  fitOsmView,
  type OsmBBox,
  type OsmProjectionKind,
  type OsmTransform,
} from './projection';
import OpenStreetMapMarker from './OpenStreetMapMarker';
import OpenStreetMapCanvas from './OpenStreetMapCanvas';

export type OsmBasemapLayerStyle = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
};

export type OsmBasemapLayer = {
  id: string;
  style?: OsmBasemapLayerStyle;
  /** SVG path data, already projected into the map frame (map pixels). */
  paths?: string[];
  circles?: Array<{ cx: number; cy: number; r: number }>;
};

export type OsmBasemap = {
  background?: string;
  layers: OsmBasemapLayer[];
};

export type OsmSourceMeta = {
  /** Tool that produced the basemap, e.g. "veracruz-port/build_basemap.py". */
  generator?: string;
  /** Where the data came from, e.g. "OpenStreetMap via Overpass API". */
  dataSource?: string;
  /** Query or extract used, e.g. "overpass_query.txt". */
  query?: string;
  generatedAt?: string;
  notes?: string;
  /** Data licence; defaults to ODbL. */
  license?: string;
};

export type OsmAttributionPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type OpenStreetMapProps = {
  /** Geographic bounds the basemap was projected from. */
  bbox: OsmBBox;
  /** Map frame size in map pixels (the basemap's viewBox). Default 1200×800. */
  width?: number;
  height?: number;
  /** Padding (map pixels) the generator left around the bbox. Default 0. */
  pad?: number;
  projection?: OsmProjectionKind;
  basemap?: OsmBasemap;
  source?: OsmSourceMeta;
  /** Placement and extra text for the (always rendered) OSM attribution. */
  attribution?: { position?: OsmAttributionPosition; extra?: React.ReactNode };
  background?: string;
  ariaLabel?: string;
  /** Upper bound for the canvas device-pixel ratio. Default 2. */
  maxDpr?: number;
  /** Called whenever the shared transform changes (mount, resize). */
  onTransformChange?: (transform: OsmTransform) => void;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  /** Markers / SVG overlays (map-pixel space) and Canvas layers. */
  children?: React.ReactNode;
};

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const OsmBasemapLayers = React.memo(function OsmBasemapLayers({ layers }: { layers: OsmBasemapLayer[] }) {
  return (
    <g className="gui-osm__basemap">
      {layers.map((layer) => {
        const s = layer.style ?? {};
        return (
          <g
            key={layer.id}
            id={layer.id}
            className="gui-osm__layer"
            fill={s.fill ?? 'none'}
            stroke={s.stroke}
            strokeWidth={s.strokeWidth}
            opacity={s.opacity}
            strokeLinecap={s.strokeLinecap}
            strokeLinejoin={s.strokeLinejoin}
          >
            {(layer.paths ?? []).map((d, i) => <path key={`p${i}`} d={d} />)}
            {(layer.circles ?? []).map((c, i) => <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} />)}
          </g>
        );
      })}
    </g>
  );
});

const ATTRIBUTION_POS: Record<OsmAttributionPosition, React.CSSProperties> = {
  'bottom-right': { right: 0, bottom: 0 },
  'bottom-left': { left: 0, bottom: 0 },
  'top-right': { right: 0, top: 0 },
  'top-left': { left: 0, top: 0 },
};

function readDpr(maxDpr: number) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(maxDpr, dpr);
}

function OpenStreetMapRoot({
  bbox,
  width = 1200,
  height = 800,
  pad = 0,
  projection: projectionKind = 'equirectangular',
  basemap,
  source,
  attribution,
  background,
  ariaLabel = 'OpenStreetMap',
  maxDpr = 2,
  onTransformChange,
  id,
  className,
  style,
  'data-testid': dataTestId,
  children,
}: OpenStreetMapProps) {
  const projection = React.useMemo(
    () => createOsmProjection({ bbox, width, height, pad, projection: projectionKind }),
    [bbox.south, bbox.west, bbox.north, bbox.east, width, height, pad, projectionKind]
  );
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0, dpr: 1 });

  useIsoLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const dpr = readDpr(maxDpr);
      setSize((prev) => (prev.w === r.width && prev.h === r.height && prev.dpr === dpr ? prev : { w: r.width, h: r.height, dpr }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxDpr]);

  const transform = React.useMemo(
    () => createOsmTransform(projection, fitOsmView(projection, size.w, size.h, size.dpr)),
    [projection, size]
  );
  const transformRef = React.useRef(transform);
  transformRef.current = transform;
  const contextValue = React.useMemo(() => ({ transform, transformRef }), [transform]);

  React.useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

  const svgChildren: React.ReactNode[] = [];
  const canvasLayers: React.ReactNode[] = [];
  React.Children.toArray(children).forEach((child) => {
    if (React.isValidElement(child) && child.type === OpenStreetMapCanvas) canvasLayers.push(child);
    else svgChildren.push(child);
  });

  const license = source?.license ?? OSM_ATTRIBUTION.license;
  const metadata = {
    bbox: projection.bbox,
    projection: projection.kind,
    frame: { width: projection.width, height: projection.height, pad: projection.pad },
    attribution: OSM_ATTRIBUTION.text,
    license,
    ...(source ? { source } : {}),
  };
  const sourceTitle = [
    source?.dataSource,
    source?.generator ? `generated by ${source.generator}` : null,
    source?.query ? `query: ${source.query}` : null,
    source?.generatedAt ? `at ${source.generatedAt}` : null,
    `bbox W=${projection.bbox.west} S=${projection.bbox.south} E=${projection.bbox.east} N=${projection.bbox.north}`,
    projection.kind,
  ].filter(Boolean).join(' · ');
  const bg = background ?? basemap?.background;

  return (
    <OpenStreetMapContext.Provider value={contextValue}>
      <div
        ref={rootRef}
        id={id}
        className={['gui-osm', className].filter(Boolean).join(' ')}
        data-gui-component="OpenStreetMap"
        data-testid={dataTestId}
        data-osm-bbox={`${projection.bbox.west},${projection.bbox.south},${projection.bbox.east},${projection.bbox.north}`}
        data-osm-projection={projection.kind}
        data-osm-frame={`${projection.width}x${projection.height}+${projection.pad}`}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: bg, ...style }}
      >
        <svg
          className="gui-osm__svg"
          viewBox={projection.viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={ariaLabel}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        >
          <metadata>{JSON.stringify(metadata)}</metadata>
          {bg ? <rect className="gui-osm__background" width={projection.width} height={projection.height} fill={bg} /> : null}
          {basemap?.layers?.length ? <OsmBasemapLayers layers={basemap.layers} /> : null}
          <g className="gui-osm__overlay">{svgChildren}</g>
        </svg>
        {canvasLayers}
        <div
          className="gui-osm__attribution"
          title={sourceTitle}
          style={{
            position: 'absolute',
            ...ATTRIBUTION_POS[attribution?.position ?? 'bottom-right'],
            zIndex: 2,
            padding: '1px 6px',
            font: '10px/1.5 system-ui, sans-serif',
            color: 'rgba(220,232,239,0.75)',
            background: 'rgba(11,13,16,0.6)',
          }}
        >
          <a href={OSM_ATTRIBUTION.href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            {OSM_ATTRIBUTION.text}
          </a>
          {' · '}
          <a href={OSM_ATTRIBUTION.licenseHref} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            {license}
          </a>
          {attribution?.extra ? <> · {attribution.extra}</> : null}
        </div>
      </div>
    </OpenStreetMapContext.Provider>
  );
}

type OpenStreetMapComponent = typeof OpenStreetMapRoot & {
  Marker: typeof OpenStreetMapMarker;
  Canvas: typeof OpenStreetMapCanvas;
  useMap: typeof useOpenStreetMap;
};

const OpenStreetMap = Object.assign(OpenStreetMapRoot, {
  Marker: OpenStreetMapMarker,
  Canvas: OpenStreetMapCanvas,
  useMap: useOpenStreetMap,
}) as OpenStreetMapComponent;

export default OpenStreetMap;
