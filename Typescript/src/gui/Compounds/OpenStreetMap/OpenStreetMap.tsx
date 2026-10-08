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
 *
 * HTML overlays (<OpenStreetMap.Overlay>, .Legend, .Chip) dock in 8 places
 * (corners and edges) on a grid above the map; the attribution keeps its own
 * row, so docked overlays never cover it or each other.
 */
import * as React from 'react';
import {
  OSM_OVERLAY_POSITIONS,
  OpenStreetMapContext,
  OsmSvgScopeContext,
  useOpenStreetMap,
  useOpenStreetMapPalette,
  type OsmOverlayPosition,
} from './context';
import {
  OSM_ATTRIBUTION,
  createOsmProjection,
  createOsmTransform,
  fitOsmView,
  osmViewBox,
  zoomOsmView,
  OSM_STROKE_ZOOM_EXPONENT,
  osmMarkerScale,
  type OsmBBox,
  type OsmProjectionKind,
  type OsmTransform,
} from './projection';
import OpenStreetMapMarker from './OpenStreetMapMarker';
import OpenStreetMapCanvas from './OpenStreetMapCanvas';
import OpenStreetMapOverlay from './OpenStreetMapOverlay';
import OpenStreetMapLegend, { OpenStreetMapLegendRow } from './OpenStreetMapLegend';
import OpenStreetMapChip from './OpenStreetMapChip';
import OpenStreetMapControls from './OpenStreetMapControls';
import { osmLayerLabel, useOsmLayersState, useOsmViewState, type OsmLayersProps, type OsmViewProps } from './viewport';
import type { OsmMarkerDefaults, OsmMarkerScaleMode, OsmViewport } from './context';
import { useOsmGestures, type OsmGestureOptions } from './gestures';
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
  /** Name in the layer toggle. Default: by kind ("Primary roads", "Water", …), else the id. */
  label?: string;
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

export type OpenStreetMapProps = OsmViewProps & OsmLayersProps & {
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
  /**
   * Zoom / pan by wheel, drag, pinch, double-click and keyboard (arrows, + / −, 0
   * on the focused map). Default true; false keeps only Controls and the API.
   */
  zoomPan?: boolean | OsmGestureOptions;
  /**
   * Marker size while zooming: 'fit' (default) keeps the size markers have at the
   * fit view, 'screen' makes marker sizes CSS px. Either way only the geometry zooms.
   */
  markerScale?: OsmMarkerScaleMode;
  /** Defaults for markers that leave shape / size / tone unset. */
  markerDefaults?: OsmMarkerDefaults;
  /** Space between the map edge and docked overlays (CSS px). Default 10. */
  overlayInset?: number;
  /** Space between docks, and between overlays in one dock (CSS px). Default 8. */
  overlayGap?: number;
  /** Called whenever the shared transform changes (mount, resize). */
  onTransformChange?: (transform: OsmTransform) => void;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  /** GUI node id (set by the spec renderer, or by hand) for the Semantic Inspector / Layout Grid. */
  'data-gui-node-id'?: string;
  /** Markers / SVG overlays (map-pixel space), Canvas layers and HTML overlays (Overlay, Legend, Chip). */
  children?: React.ReactNode;
};

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/** A layer's geometry; memoised so view / visibility changes only touch the layer's <g>. */
const OsmLayerPaths = React.memo(function OsmLayerPaths({ layer }: { layer: OsmBasemapLayer }) {
  return <>{(layer.paths ?? []).map((d, i) => <path key={`p${i}`} d={d} />)}</>;
});
const OsmLayerCircles = React.memo(function OsmLayerCircles({ layer, rScale }: { layer: OsmBasemapLayer; rScale: number }) {
  const r = (n: number) => (rScale === 1 ? n : Math.round(n * rScale * 1000) / 1000);
  return <>{(layer.circles ?? []).map((c, i) => <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={r(c.r)} />)}</>;
});

/**
 * Basemap layers. While zoomed, stroke widths and place dots shrink by
 * zoom^OSM_STROKE_ZOOM_EXPONENT so lines grow only gently on screen.
 */
const OsmBasemapLayers = React.memo(function OsmBasemapLayers({ layers, palette, hidden, zoom }: { layers: OsmBasemapLayer[]; palette: OsmPalette | null; hidden: ReadonlySet<string>; zoom: number }) {
  const k = zoom === 1 ? 1 : 1 / Math.pow(zoom, OSM_STROKE_ZOOM_EXPONENT);
  const sw = (w: number | undefined) => (k === 1 ? w : Math.round((w ?? 1) * k * 1000) / 1000);
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
            strokeWidth={sw(s.strokeWidth)}
            opacity={paint ? undefined : s.opacity}
            strokeLinecap={s.strokeLinecap}
            strokeLinejoin={s.strokeLinejoin}
            display={hidden.has(layer.id) ? 'none' : undefined}
          >
            <OsmLayerPaths layer={layer} />
            {layer.circles?.length ? <OsmLayerCircles layer={layer} rScale={k} /> : null}
          </g>
        );
      })}
    </g>
  );
});

type OsmOverlayDocks = Partial<Record<OsmOverlayPosition, React.ReactNode[]>>;

/**
 * Split children into SVG overlay content, Canvas layers and HTML overlays
 * (by dock). Fragments are looked through: a spec renderer (mount /
 * renderNode) wraps every child in a keyed React.Fragment, and a page may
 * group layers in one itself. Keys are prefixed with the fragment's key so
 * siblings from different groups stay unique. Components mark themselves as
 * HTML overlays with a static `osmSlot = 'overlay'` (Overlay, Legend, Chip).
 */
function partitionLayers(children: React.ReactNode, svg: React.ReactNode[], canvas: React.ReactNode[], docks: OsmOverlayDocks, prefix = '', flags: { interactive: boolean } = { interactive: false }) {
  React.Children.toArray(children).forEach((child) => {
    if (!React.isValidElement(child)) {
      svg.push(child);
      return;
    }
    const keyed = prefix ? React.cloneElement(child, { key: `${prefix}/${child.key ?? ''}` }) : child;
    const slot = (child.type as { osmSlot?: string } | null)?.osmSlot;
    if (child.type === React.Fragment) {
      partitionLayers((child.props as { children?: React.ReactNode }).children, svg, canvas, docks, `${prefix}${child.key ?? ''}`, flags);
    } else if (child.type === OpenStreetMapCanvas) {
      canvas.push(keyed);
    } else if (slot === 'overlay') {
      const requested = (child.props as { position?: OsmOverlayPosition }).position;
      const fallback = (child.type as { osmDefaultPosition?: OsmOverlayPosition }).osmDefaultPosition ?? 'top-right';
      const position = requested && OSM_OVERLAY_POSITIONS.includes(requested) ? requested : fallback;
      (docks[position] ??= []).push(keyed);
    } else {
      if (typeof (child.props as { onClick?: unknown }).onClick === 'function') flags.interactive = true;
      svg.push(keyed);
    }
  });
  return flags;
}

/**
 * Docks sit in three independent rows (top, middle, bottom), each a flex row
 * [corner-left] [edge] [corner-right]: a corner's width only affects its own
 * row, so a wide top-right legend never squeezes the bottom HUD. Empty docks
 * are display:none, and flex gaps only separate docks that are shown.
 */
const DOCK_ROWS: Array<{ row: 'top' | 'middle' | 'bottom'; docks: OsmOverlayPosition[] }> = [
  { row: 'top', docks: ['top-left', 'top', 'top-right'] },
  { row: 'middle', docks: ['left', 'right'] },
  { row: 'bottom', docks: ['bottom-left', 'bottom', 'bottom-right'] },
];

function dockStyle(position: OsmOverlayPosition, gap: number): React.CSSProperties {
  const edge = position === 'top' || position === 'bottom';
  const right = position === 'top-right' || position === 'right' || position === 'bottom-right';
  const bottom = position.startsWith('bottom');
  const middle = position === 'left' || position === 'right';
  return {
    display: 'flex',
    flexDirection: edge ? 'row' : 'column',
    flexWrap: edge ? 'wrap' : 'nowrap',
    gap,
    minWidth: 0,
    flex: edge ? '1 1 0' : '0 1 auto',
    alignItems: edge ? (bottom ? 'flex-end' : 'flex-start') : right ? 'flex-end' : 'flex-start',
    alignContent: bottom ? 'flex-end' : 'flex-start',
    alignSelf: middle ? 'center' : bottom ? 'flex-end' : 'flex-start',
    justifyContent: bottom && !edge ? 'flex-end' : 'flex-start',
    // a right dock hugs the right edge even when its row has nothing else
    marginLeft: right ? 'auto' : undefined,
    pointerEvents: 'none',
  };
}

function dockRowStyle(row: 'top' | 'middle' | 'bottom', gap: number): React.CSSProperties {
  return {
    display: 'flex',
    gap,
    minWidth: 0,
    minHeight: 0,
    flex: row === 'middle' ? '1 1 auto' : '0 0 auto',
    alignItems: row === 'bottom' ? 'flex-end' : row === 'middle' ? 'center' : 'flex-start',
    pointerEvents: 'none',
  };
}

const DOCK_CSS = [
  '.gui-osm__dock:empty{display:none}',
  '.gui-osm[data-osm-dragging]{cursor:grabbing!important}',
  '.gui-osm:focus-visible{outline:2px solid var(--gui-osm-overlay-accent);outline-offset:-2px}',
  '.gui-osm__overlays .gui-osm__dock>*{cursor:auto}',
  '.gui-osm-control:hover:not([aria-disabled=true]){border-color:var(--gui-osm-overlay-accent)}',
  '.gui-osm-control:focus-visible{outline:2px solid var(--gui-osm-overlay-accent);outline-offset:2px;position:relative;z-index:1}',
].join('');

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
  view,
  defaultView,
  onViewChange,
  minZoom,
  maxZoom,
  hiddenLayers,
  defaultHiddenLayers,
  onLayersChange,
  markerDefaults,
  zoomPan = true,
  markerScale: markerScaleMode = 'fit',
  overlayInset = 10,
  overlayGap = 8,
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

  const fit = React.useMemo(() => fitOsmView(projection, size.w, size.h, size.dpr), [projection, size]);
  const { state: viewState, viewport } = useOsmViewState(projection, fit, { view, defaultView, onViewChange, minZoom, maxZoom });
  const isFit = viewport.isFit;
  const viewportRef = React.useRef<OsmViewport>(viewport);
  viewportRef.current = viewport;
  const zoom = isFit ? 1 : viewState.zoom;
  const transform = React.useMemo(() => {
    const v = isFit ? fit : zoomOsmView(fit, viewState);
    // markers keep their size: 'fit' = size at zoom 1, 'screen' = CSS px
    return createOsmTransform(projection, { ...v, zoom, markerScale: osmMarkerScale(markerScaleMode, v, zoom) });
  }, [projection, fit, viewState, isFit, zoom, markerScaleMode]);
  const gestures: OsmGestureOptions | null = zoomPan === false ? null : zoomPan === true ? {} : zoomPan;
  useOsmGestures(rootRef, viewportRef, Boolean(gestures), gestures ?? undefined);
  const keyboardNav = Boolean(gestures) && gestures?.keyboard !== false;
  const touchPan = Boolean(gestures) && (gestures?.drag !== false || gestures?.pinch !== false);
  const viewBox = isFit ? projection.viewBox : osmViewBox(projection, fit, viewState);
  const layerList = React.useMemo(
    () => (basemap?.layers ?? []).map((l) => {
      const kind = osmLayerKind(l);
      return { id: l.id, kind, label: osmLayerLabel(l, kind) };
    }),
    [basemap?.layers],
  );
  const layers = useOsmLayersState(layerList, { hiddenLayers, defaultHiddenLayers, onLayersChange });
  const mdKey = markerDefaults ? `${markerDefaults.shape ?? ''}|${markerDefaults.size ?? ''}|${markerDefaults.tone ?? ''}` : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const markerDefaultsValue = React.useMemo<OsmMarkerDefaults>(() => ({ ...(markerDefaults ?? {}) }), [mdKey]);
  const transformRef = React.useRef(transform);
  transformRef.current = transform;
  const palette = useOsmPalette();
  const paletteRef = React.useRef(palette);
  paletteRef.current = palette;
  const dockEls = React.useRef<Partial<Record<OsmOverlayPosition, HTMLDivElement | null>>>({});
  const [docksReady, setDocksReady] = React.useState(false);
  useIsoLayoutEffect(() => setDocksReady(true), []);
  const getDock = React.useCallback((position: OsmOverlayPosition) => dockEls.current[position] ?? null, []);
  const contextValue = React.useMemo(
    () => ({ transform, transformRef, palette, paletteRef, getDock, docksReady, viewport, layers, markerDefaults: markerDefaultsValue }),
    [transform, palette, getDock, docksReady, viewport, layers, markerDefaultsValue],
  );
  const themed = basemapStyle !== 'source';

  React.useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

  const svgChildren: React.ReactNode[] = [];
  const canvasLayers: React.ReactNode[] = [];
  const docks: OsmOverlayDocks = {};
  const { interactive } = partitionLayers(children, svgChildren, canvasLayers, docks);

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
  const attributionPos = attribution?.position ?? 'bottom-right';
  const attributionTop = attributionPos.startsWith('top');
  const attributionLeft = attributionPos.endsWith('left');
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
        data-osm-zoom={isFit ? undefined : Math.round(viewState.zoom * 1000) / 1000}
        data-osm-gestures={gestures ? '' : undefined}
        tabIndex={keyboardNav ? 0 : undefined}
        role={keyboardNav ? 'region' : undefined}
        aria-label={keyboardNav ? ariaLabel : undefined}
        aria-keyshortcuts={keyboardNav ? 'ArrowLeft ArrowRight ArrowUp ArrowDown + - 0' : undefined}
        style={{
          ...cssVars,
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: bg,
          ...(touchPan ? { touchAction: 'none', cursor: 'grab' } : {}),
          ...style,
        }}
      >
        <svg
          className="gui-osm__svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          // markers you can click make the map a group of controls, not a picture
          role={interactive ? 'group' : 'img'}
          aria-roledescription={interactive ? 'map' : undefined}
          aria-label={ariaLabel}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        >
          <metadata>{JSON.stringify(metadata)}</metadata>
          {bg ? <rect className="gui-osm__background" width={projection.width} height={projection.height} fill={bg} /> : null}
          {basemap?.layers?.length ? <OsmBasemapLayers layers={basemap.layers} palette={themed ? palette : null} hidden={layers.hidden} zoom={zoom} /> : null}
          <g className="gui-osm__overlay">
            <OsmSvgScopeContext.Provider value={true}>{svgChildren}</OsmSvgScopeContext.Provider>
          </g>
        </svg>
        {canvasLayers}
        <div
          className="gui-osm__overlays"
          style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: attributionTop ? 'column-reverse' : 'column', pointerEvents: 'none' }}
        >
          <style>{DOCK_CSS}</style>
          <div
            className="gui-osm__docks"
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: overlayGap,
              padding: overlayInset,
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          >
            {DOCK_ROWS.map(({ row, docks: positions }) => (
              <div key={row} className={`gui-osm__dock-row gui-osm__dock-row--${row}`} style={dockRowStyle(row, overlayGap)}>
                {positions.map((position) => (
                  <div
                    key={position}
                    ref={(el) => { dockEls.current[position] = el; }}
                    className={`gui-osm__dock gui-osm__dock--${position}`}
                    data-osm-dock={position}
                    style={dockStyle(position, overlayGap)}
                  >
                    {docks[position]}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            className="gui-osm__attribution"
            title={sourceTitle}
            style={{
              flex: '0 0 auto',
              alignSelf: attributionLeft ? 'flex-start' : 'flex-end',
              padding: '1px 6px',
              font: '10px/1.5 system-ui, sans-serif',
              color: palette.attribution.text,
              background: palette.attribution.background,
              pointerEvents: 'auto',
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
      </div>
    </OpenStreetMapContext.Provider>
  );
}

type OpenStreetMapComponent = typeof OpenStreetMapRoot & {
  Marker: typeof OpenStreetMapMarker;
  Canvas: typeof OpenStreetMapCanvas;
  Overlay: typeof OpenStreetMapOverlay;
  Legend: typeof OpenStreetMapLegend;
  LegendRow: typeof OpenStreetMapLegendRow;
  Chip: typeof OpenStreetMapChip;
  Controls: typeof OpenStreetMapControls;
  useMap: typeof useOpenStreetMap;
  usePalette: typeof useOpenStreetMapPalette;
};

const OpenStreetMap = Object.assign(OpenStreetMapRoot, {
  Marker: OpenStreetMapMarker,
  Canvas: OpenStreetMapCanvas,
  Overlay: OpenStreetMapOverlay,
  Legend: OpenStreetMapLegend,
  LegendRow: OpenStreetMapLegendRow,
  Chip: OpenStreetMapChip,
  Controls: OpenStreetMapControls,
  useMap: useOpenStreetMap,
  usePalette: useOpenStreetMapPalette,
}) as OpenStreetMapComponent;

export default OpenStreetMap;
