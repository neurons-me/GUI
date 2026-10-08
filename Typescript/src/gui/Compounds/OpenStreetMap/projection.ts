/*
 * GUI.OpenStreetMap — the single visual transform contract.
 *
 * One projection (geo -> map pixels) plus one view fit (map pixels -> screen
 * pixels) is shared by the basemap, the markers and every canvas layer, so
 * the three can never drift apart. The map owns this conversion; the kernel
 * never stores pixel coordinates.
 *
 * Projection: plain equirectangular over a bbox with an optional pad, the
 * same formula a project's own basemap generator uses to pre-project its
 * paths (e.g. veracruz-port/build_basemap.py):
 *   x = pad + (lon - west)  / (east  - west)  * (width  - 2*pad)
 *   y = pad + (north - lat) / (north - south) * (height - 2*pad)
 * View fit: SVG `preserveAspectRatio="xMidYMid meet"` semantics.
 */

export type OsmBBox = { south: number; west: number; north: number; east: number };

export type OsmProjectionKind = 'equirectangular';

export type OsmFrame = {
  bbox: OsmBBox;
  /** Map frame width in map pixels (the basemap's viewBox width). */
  width: number;
  /** Map frame height in map pixels (the basemap's viewBox height). */
  height: number;
  /** Inner padding in map pixels between the frame edge and the bbox. */
  pad?: number;
  projection?: OsmProjectionKind;
};

export type OsmPoint = { x: number; y: number };
export type OsmLatLon = { lat: number; lon: number };

export type OsmProjection = {
  kind: OsmProjectionKind;
  bbox: OsmBBox;
  width: number;
  height: number;
  pad: number;
  viewBox: string;
  project(lat: number, lon: number): OsmPoint;
  unproject(x: number, y: number): OsmLatLon;
};

export type OsmView = {
  /** Uniform scale from map pixels to CSS pixels. */
  scale: number;
  /** CSS-pixel offset of map pixel (0,0) inside the container. */
  offsetX: number;
  offsetY: number;
  /** Container size in CSS pixels. */
  width: number;
  height: number;
  /** Device pixel ratio used for canvas backing stores. */
  dpr: number;
  /** User zoom over the fit (1 = fit). Set by the map root; absent = 1. */
  zoom?: number;
  /**
   * Scale applied to marker geometry (map px) so markers keep their on-screen
   * size while the map zooms: 1 at the fit with markerScale 'fit'. Absent = 1.
   */
  markerScale?: number;
};

/**
 * Marker scale for a view: map px per marker unit. 'fit' keeps the size a marker
 * has at zoom 1 (1 / zoom); 'screen' makes marker units CSS px (1 / view scale).
 */
export function osmMarkerScale(mode: 'fit' | 'screen', view: Pick<OsmView, 'scale'>, zoom: number): number {
  if (mode === 'screen') return view.scale > 0 ? 1 / view.scale : 1;
  return zoom > 0 ? 1 / zoom : 1;
}

/** Exponent for basemap stroke widths under zoom: drawn width grows as zoom^(1 − e). */
export const OSM_STROKE_ZOOM_EXPONENT = 0.75;

export type OsmTransform = {
  projection: OsmProjection;
  view: OsmView;
  /** geo -> map pixels (basemap / marker / canvas-layer space). */
  project(lat: number, lon: number): OsmPoint;
  /** geo -> CSS pixels inside the map container. */
  toScreen(lat: number, lon: number): OsmPoint;
  /** map pixels -> CSS pixels inside the map container. */
  mapToScreen(x: number, y: number): OsmPoint;
};

function assertFinite(name: string, value: number) {
  if (!Number.isFinite(value)) throw new Error(`[GUI.OpenStreetMap] ${name} must be a finite number`);
}

export function createOsmProjection(frame: OsmFrame): OsmProjection {
  const { bbox } = frame;
  const width = Number(frame.width);
  const height = Number(frame.height);
  const pad = Number(frame.pad ?? 0);
  const kind = frame.projection ?? 'equirectangular';
  if (kind !== 'equirectangular') throw new Error(`[GUI.OpenStreetMap] unsupported projection "${String(kind)}"`);
  [['bbox.south', bbox?.south], ['bbox.west', bbox?.west], ['bbox.north', bbox?.north], ['bbox.east', bbox?.east],
    ['width', width], ['height', height], ['pad', pad]].forEach(([n, v]) => assertFinite(n as string, v as number));
  if (!(bbox.east > bbox.west) || !(bbox.north > bbox.south)) {
    throw new Error('[GUI.OpenStreetMap] bbox must satisfy east > west and north > south');
  }
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  if (!(innerW > 0) || !(innerH > 0)) throw new Error('[GUI.OpenStreetMap] pad leaves no drawable area');
  const lonSpan = bbox.east - bbox.west;
  const latSpan = bbox.north - bbox.south;
  return {
    kind,
    bbox: { ...bbox },
    width,
    height,
    pad,
    viewBox: `0 0 ${width} ${height}`,
    project(lat: number, lon: number): OsmPoint {
      return {
        x: pad + ((lon - bbox.west) / lonSpan) * innerW,
        y: pad + ((bbox.north - lat) / latSpan) * innerH,
      };
    },
    unproject(x: number, y: number): OsmLatLon {
      return {
        lon: bbox.west + ((x - pad) / innerW) * lonSpan,
        lat: bbox.north - ((y - pad) / innerH) * latSpan,
      };
    },
  };
}

/** Fit the map frame into a container (xMidYMid meet), like the SVG does. */
export function fitOsmView(
  projection: Pick<OsmProjection, 'width' | 'height'>,
  containerWidth: number,
  containerHeight: number,
  dpr = 1,
): OsmView {
  const width = Math.max(0, Number(containerWidth) || 0);
  const height = Math.max(0, Number(containerHeight) || 0);
  const scale = width > 0 && height > 0 ? Math.min(width / projection.width, height / projection.height) : 0;
  return {
    scale,
    offsetX: (width - projection.width * scale) / 2,
    offsetY: (height - projection.height * scale) / 2,
    width,
    height,
    dpr: dpr > 0 ? dpr : 1,
  };
}

export function createOsmTransform(projection: OsmProjection, view: OsmView): OsmTransform {
  const mapToScreen = (x: number, y: number): OsmPoint => ({
    x: view.offsetX + x * view.scale,
    y: view.offsetY + y * view.scale,
  });
  return {
    projection,
    view,
    project: projection.project,
    toScreen(lat: number, lon: number) {
      const p = projection.project(lat, lon);
      return mapToScreen(p.x, p.y);
    },
    mapToScreen,
  };
}

/**
 * User view on top of the fit: a zoom factor (1 = the whole frame fits, as
 * without zoom) and the geographic point at the centre of the container.
 */
export type OsmUserView = { zoom: number; center: OsmLatLon };

/** Internal view state in map pixels. */
export type OsmViewState = { zoom: number; cx: number; cy: number };

export const OSM_DEFAULT_MIN_ZOOM = 1;
export const OSM_DEFAULT_MAX_ZOOM = 16;

/** The fit view (zoom 1, frame centre). */
export function osmFitViewState(projection: Pick<OsmProjection, 'width' | 'height'>): OsmViewState {
  return { zoom: 1, cx: projection.width / 2, cy: projection.height / 2 };
}

export function isOsmFitViewState(projection: Pick<OsmProjection, 'width' | 'height'>, s: OsmViewState): boolean {
  const eps = 1e-6;
  return Math.abs(s.zoom - 1) < eps && Math.abs(s.cx - projection.width / 2) < eps && Math.abs(s.cy - projection.height / 2) < eps;
}

/**
 * Keep a view state inside sensible bounds: zoom in [minZoom, maxZoom], and the
 * centre inside the map frame. With the fit view (`fit`, measured container) the
 * bounds are tighter: the visible rectangle stays on the map (no panning into
 * empty space; an axis where the whole frame is visible stays centred). Without
 * a measured size the frame aspect stands in for the container.
 */
export function clampOsmViewState(
  projection: Pick<OsmProjection, 'width' | 'height'>,
  s: OsmViewState,
  minZoom = OSM_DEFAULT_MIN_ZOOM,
  maxZoom = OSM_DEFAULT_MAX_ZOOM,
  fit?: OsmView,
): OsmViewState {
  const W = projection.width;
  const H = projection.height;
  const zoom = Math.min(Math.max(Number.isFinite(s.zoom) ? s.zoom : 1, minZoom), Math.max(minZoom, maxZoom));
  let cx = Math.min(Math.max(Number.isFinite(s.cx) ? s.cx : W / 2, 0), W);
  let cy = Math.min(Math.max(Number.isFinite(s.cy) ? s.cy : H / 2, 0), H);
  if (fit) {
    const measured = fit.width > 0 && fit.height > 0 && fit.scale > 0;
    const hw = measured ? fit.width / (2 * fit.scale * zoom) : W / (2 * zoom);
    const hh = measured ? fit.height / (2 * fit.scale * zoom) : H / (2 * zoom);
    cx = 2 * hw >= W - 1e-6 ? W / 2 : Math.min(Math.max(cx, hw), W - hw);
    cy = 2 * hh >= H - 1e-6 ? H / 2 : Math.min(Math.max(cy, hh), H - hh);
  }
  return { zoom, cx, cy };
}

/** The fit view zoomed by `zoom` around the map point (cx, cy), which lands at the container centre. */
export function zoomOsmView(fit: OsmView, s: OsmViewState): OsmView {
  const scale = fit.scale * s.zoom;
  return { ...fit, scale, offsetX: fit.width / 2 - s.cx * scale, offsetY: fit.height / 2 - s.cy * scale };
}

/** View state after zooming by `factor` around a container point (CSS px); the map point under it stays put. */
export function zoomOsmViewStateAt(
  fit: OsmView,
  s: OsmViewState,
  factor: number,
  at?: { x: number; y: number },
): OsmViewState {
  const view = zoomOsmView(fit, s);
  if (!(view.scale > 0)) return { ...s, zoom: s.zoom * factor };
  const px = at ?? { x: fit.width / 2, y: fit.height / 2 };
  const mx = (px.x - view.offsetX) / view.scale;
  const my = (px.y - view.offsetY) / view.scale;
  const zoom = s.zoom * factor;
  const scale = fit.scale * zoom;
  return { zoom, cx: mx - (px.x - fit.width / 2) / scale, cy: my - (px.y - fit.height / 2) / scale };
}

/** View state after dragging the map by (dx, dy) CSS px. */
export function panOsmViewState(fit: OsmView, s: OsmViewState, dx: number, dy: number): OsmViewState {
  const scale = fit.scale * s.zoom;
  if (!(scale > 0)) return s;
  return { ...s, cx: s.cx - dx / scale, cy: s.cy - dy / scale };
}

/** The visible map rectangle (map px) as an SVG viewBox; falls back to the frame aspect without a container size. */
export function osmViewBox(projection: Pick<OsmProjection, 'width' | 'height'>, fit: OsmView, s: OsmViewState): string {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  if (fit.width > 0 && fit.height > 0 && fit.scale > 0) {
    const scale = fit.scale * s.zoom;
    const w = fit.width / scale;
    const h = fit.height / scale;
    return `${r(s.cx - w / 2)} ${r(s.cy - h / 2)} ${r(w)} ${r(h)}`;
  }
  const w = projection.width / s.zoom;
  const h = projection.height / s.zoom;
  return `${r(s.cx - w / 2)} ${r(s.cy - h / 2)} ${r(w)} ${r(h)}`;
}

/**
 * Canvas 2D matrix that makes a context draw in map pixels:
 * ctx.setTransform(...osmCanvasMatrix(view)).
 */
export function osmCanvasMatrix(view: OsmView): [number, number, number, number, number, number] {
  const k = view.dpr * view.scale;
  return [k, 0, 0, k, view.dpr * view.offsetX, view.dpr * view.offsetY];
}

export const OSM_ATTRIBUTION = {
  text: '© OpenStreetMap contributors',
  href: 'https://www.openstreetmap.org/copyright',
  license: 'ODbL',
  licenseHref: 'https://opendatacommons.org/licenses/odbl/',
} as const;
