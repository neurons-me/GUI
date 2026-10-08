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
 *
 * Colours: by default the basemap, markers and attribution take their colours
 * from the GUI theme in scope (mapPalette.ts: derived from existing theme
 * tokens, both modes). Basemap layers are painted by kind (water, roads-*,
 * places), inferred from the layer id or given as `kind`; the layer's own
 * fill/stroke/opacity are ignored for known kinds (stroke width and caps are
 * kept). `basemapStyle="source"` keeps the generator's own colours instead.
 */
import * as React from 'react';
import { OpenStreetMapContext, useOpenStreetMap, useOpenStreetMapPalette } from './context';
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
import { osmLayerKind, osmLayerPaint, osmPaletteCssVars, useOsmPalette, type OsmLayerKind, type OsmPalette } from './mapPalette';

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
  /**
   * What the layer is, for theme colours. Inferred from the id when omitted
   * (water, water-polys, roads-primary|secondary|tertiary|residential, places);
   * 'custom' (or an unknown id) keeps the layer's own style.
   */
  kind?: OsmLayerKind;
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
  /**
   * 'theme' (default): basemap colours come from the GUI theme in scope, by layer kind.
   * 'source': use each layer's own `style` and `basemap.background`, as given.
   */
  basemapStyle?: 'theme' | 'source';
  source?: OsmSourceMeta;
  /** Placement and extra text for the (always rendered) OSM attribution. */
  attribution?: { position?: OsmAttributionPosition; extra?: React.ReactNode };
  /** Explicit map background; wins over the theme's land colour and `basemap.background`. */
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
  /** GUI node id (set by the spec renderer, or by hand) for the Semantic Inspector / Layout Grid. */
  'data-gui-node-id'?: string;
  /** Markers / SVG overlays (map-pixel space) and Canvas layers. */
  children?: React.ReactNode;
};

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const OsmBasemapLayers = React.memo(function OsmBasemapLayers({ layers, palette }: { layers: OsmBasemapLayer[]; palette: OsmPalette | null }) {
  return (
    <g className="gui-osm__basemap">
      {layers.map((layer) => {
        const s = layer.style ?? {};
        const kind = osmLayerKind(layer);
        const paint = palette ? osmLayerPaint(kind, palette) : null;
        return (
          <g
            key={layer.id}
            id={layer.id}
            className="gui-osm__layer"
            data-osm-layer-kind={kind}
            fill={paint ? paint.fill : s.fill ?? 'none'}
            stroke={paint ? paint.stroke : s.stroke}
            strokeWidth={s.strokeWidth}
            opacity={paint ? undefined : s.opacity}
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

/**
 * Split children into SVG overlay content and Canvas layers. Fragments are
 * looked through: a spec renderer (mount / renderNode) wraps every child in a
 * keyed React.Fragment, and a page may group layers in one itself. Keys are
 * prefixed with the fragment's key so siblings from different groups stay unique.
 */
function partitionLayers(children: React.ReactNode, svg: React.ReactNode[], canvas: React.ReactNode[], prefix = '') {
  React.Children.toArray(children).forEach((child) => {
    if (!React.isValidElement(child)) {
      svg.push(child);
      return;
    }
    const keyed = prefix ? React.cloneElement(child, { key: `${prefix}/${child.key ?? ''}` }) : child;
    if (child.type === React.Fragment) {
      partitionLayers((child.props as { children?: React.ReactNode }).children, svg, canvas, `${prefix}${child.key ?? ''}`);
    } else if (child.type === OpenStreetMapCanvas) {
      canvas.push(keyed);
    } else {
      svg.push(keyed);
    }
  });
}

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
  basemapStyle = 'theme',
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
  'data-gui-node-id': guiNodeId,
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
  const palette = useOsmPalette();
  const paletteRef = React.useRef(palette);
  paletteRef.current = palette;
  const contextValue = React.useMemo(() => ({ transform, transformRef, palette, paletteRef }), [transform, palette]);
  const themed = basemapStyle !== 'source';

  React.useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

  const svgChildren: React.ReactNode[] = [];
  const canvasLayers: React.ReactNode[] = [];
  partitionLayers(children, svgChildren, canvasLayers);

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
  const bg = background ?? (themed ? palette.land : basemap?.background);
  const cssVars = osmPaletteCssVars(palette) as React.CSSProperties;

  return (
    <OpenStreetMapContext.Provider value={contextValue}>
      <div
        ref={rootRef}
        id={id}
        className={['gui-osm', className].filter(Boolean).join(' ')}
        data-gui-component="OpenStreetMap"
        data-gui-node-id={guiNodeId || undefined}
        data-testid={dataTestId}
        data-osm-bbox={`${projection.bbox.west},${projection.bbox.south},${projection.bbox.east},${projection.bbox.north}`}
        data-osm-projection={projection.kind}
        data-osm-frame={`${projection.width}x${projection.height}+${projection.pad}`}
        data-osm-basemap-style={themed ? 'theme' : 'source'}
        style={{ ...cssVars, position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: bg, ...style }}
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
          {basemap?.layers?.length ? <OsmBasemapLayers layers={basemap.layers} palette={themed ? palette : null} /> : null}
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
            color: palette.attribution.text,
            background: palette.attribution.background,
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
  usePalette: typeof useOpenStreetMapPalette;
};

const OpenStreetMap = Object.assign(OpenStreetMapRoot, {
  Marker: OpenStreetMapMarker,
  Canvas: OpenStreetMapCanvas,
  useMap: useOpenStreetMap,
  usePalette: useOpenStreetMapPalette,
}) as OpenStreetMapComponent;

export default OpenStreetMap;
