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
};

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
