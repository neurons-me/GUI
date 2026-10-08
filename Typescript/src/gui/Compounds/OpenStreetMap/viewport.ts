/*
 * GUI.OpenStreetMap — view state (zoom / pan) and layer visibility, each
 * controlled or uncontrolled like a React input:
 *   view / defaultView / onViewChange,  hiddenLayers / defaultHiddenLayers / onLayersChange.
 * The view is a zoom factor over the fit (1 = whole frame, as without zoom)
 * and a centre point; it never leaves [minZoom, maxZoom] or the map frame.
 */
import * as React from 'react';
import {
  OSM_DEFAULT_MAX_ZOOM,
  OSM_DEFAULT_MIN_ZOOM,
  clampOsmViewState,
  isOsmFitViewState,
  osmFitViewState,
  panOsmViewState,
  zoomOsmViewStateAt,
  type OsmProjection,
  type OsmUserView,
  type OsmView,
  type OsmViewState,
} from './projection';
import type { OsmLayerInfo, OsmLayersState, OsmViewSource, OsmViewport } from './context';

export type OsmViewChangeInfo = { source: OsmViewSource };

export type OsmViewProps = {
  /** Controlled view (zoom over the fit + centre). */
  view?: Partial<OsmUserView>;
  /** Initial view when uncontrolled. Default: the fit (zoom 1, frame centre). */
  defaultView?: Partial<OsmUserView>;
  onViewChange?: (view: OsmUserView, info: OsmViewChangeInfo) => void;
  /** Default 1 (the fit). */
  minZoom?: number;
  /** Default 16. */
  maxZoom?: number;
};

const same = (a: OsmViewState, b: OsmViewState) =>
  Math.abs(a.zoom - b.zoom) < 1e-9 && Math.abs(a.cx - b.cx) < 1e-9 && Math.abs(a.cy - b.cy) < 1e-9;

export function useOsmViewState(projection: OsmProjection, fit: OsmView, props: OsmViewProps): { state: OsmViewState; viewport: OsmViewport } {
  const minZoom = props.minZoom ?? OSM_DEFAULT_MIN_ZOOM;
  const maxZoom = Math.max(minZoom, props.maxZoom ?? OSM_DEFAULT_MAX_ZOOM);
  const fitKey = `${fit.width}x${fit.height}@${fit.scale}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fitForClamp = React.useMemo(() => fit, [fitKey]);
  const clamp = React.useCallback((s: OsmViewState) => clampOsmViewState(projection, s, minZoom, maxZoom, fitForClamp), [projection, minZoom, maxZoom, fitForClamp]);
  const toState = React.useCallback(
    (v: Partial<OsmUserView> | undefined, base: OsmViewState): OsmViewState => {
      const c = v?.center && Number.isFinite(v.center.lat) && Number.isFinite(v.center.lon) ? projection.project(v.center.lat, v.center.lon) : { x: base.cx, y: base.cy };
      return clamp({ zoom: v?.zoom ?? base.zoom, cx: c.x, cy: c.y });
    },
    [projection, clamp],
  );
  const toUser = React.useCallback((s: OsmViewState): OsmUserView => ({ zoom: s.zoom, center: projection.unproject(s.cx, s.cy) }), [projection]);

  const fitState = React.useMemo(() => osmFitViewState(projection), [projection]);
  // the fit and "zoom 1, centred" are the same view; tight bounds snap there
  const controlled = props.view !== undefined;
  const [inner, setInner] = React.useState<OsmViewState>(() => (props.defaultView ? toState(props.defaultView, fitState) : fitState));
  const cv = props.view;
  const state = React.useMemo(
    () => (controlled ? toState(cv, fitState) : clamp(inner)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled, cv?.zoom, cv?.center?.lat, cv?.center?.lon, inner, toState, clamp, fitState],
  );

  // Latest values for event handlers (gestures fire many events between renders).
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const fitRef = React.useRef(fit);
  fitRef.current = fit;
  const controlledRef = React.useRef(controlled);
  controlledRef.current = controlled;
  const onChangeRef = React.useRef(props.onViewChange);
  onChangeRef.current = props.onViewChange;

  const commit = React.useCallback(
    (next: OsmViewState, source: OsmViewSource) => {
      const c = clamp(next);
      if (same(c, stateRef.current)) return;
      stateRef.current = c;
      if (!controlledRef.current) setInner(c);
      onChangeRef.current?.(toUser(c), { source });
    },
    [clamp, toUser],
  );

  const viewport = React.useMemo<OsmViewport>(
    () => ({
      zoom: state.zoom,
      minZoom,
      maxZoom,
      isFit: isOsmFitViewState(projection, state),
      view: toUser(state),
      setView: (v, source = 'api') => commit(toState(v, stateRef.current), source),
      zoomBy: (factor, source = 'api', at) => commit(zoomOsmViewStateAt(fitRef.current, stateRef.current, factor, at), source),
      panBy: (dx, dy, source = 'api') => commit(panOsmViewState(fitRef.current, stateRef.current, dx, dy), source),
      panTo: (lat, lon, source = 'api') => {
        const p = projection.project(lat, lon);
        commit({ ...stateRef.current, cx: p.x, cy: p.y }, source);
      },
      reset: (source = 'reset') => commit(fitState, source),
    }),
    [state, minZoom, maxZoom, projection, toUser, toState, commit, fitState],
  );
  return { state, viewport };
}

export type OsmLayersProps = {
  /** Controlled list of hidden basemap layer ids. */
  hiddenLayers?: string[];
  defaultHiddenLayers?: string[];
  onLayersChange?: (hidden: string[]) => void;
};

export function useOsmLayersState(list: OsmLayerInfo[], props: OsmLayersProps): OsmLayersState {
  const controlled = props.hiddenLayers !== undefined;
  const [inner, setInner] = React.useState<string[]>(() => props.defaultHiddenLayers ?? []);
  const ids = controlled ? props.hiddenLayers! : inner;
  const key = ids.join('\u0000');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hidden = React.useMemo(() => new Set(ids), [key]);
  const onChangeRef = React.useRef(props.onLayersChange);
  onChangeRef.current = props.onLayersChange;
  const hiddenRef = React.useRef(hidden);
  hiddenRef.current = hidden;
  const setHidden = React.useCallback((next: string[]) => {
    if (!controlled) setInner(next);
    onChangeRef.current?.(next);
  }, [controlled]);
  return React.useMemo<OsmLayersState>(
    () => ({
      list,
      hidden,
      setHidden,
      toggle: (id) => {
        const cur = hiddenRef.current;
        setHidden(cur.has(id) ? [...cur].filter((x) => x !== id) : [...cur, id]);
      },
    }),
    [list, hidden, setHidden],
  );
}

const KIND_LABELS: Record<string, string> = {
  land: 'Land',
  water: 'Water',
  'water-area': 'Water areas',
  'road-primary': 'Primary roads',
  'road-secondary': 'Secondary roads',
  'road-tertiary': 'Tertiary roads',
  'road-minor': 'Minor roads',
  place: 'Places',
};

/** Human label for a basemap layer: its `label`, else by kind, else its id. */
export function osmLayerLabel(layer: { id: string; label?: string }, kind: string): string {
  return layer.label ?? KIND_LABELS[kind] ?? layer.id;
}
