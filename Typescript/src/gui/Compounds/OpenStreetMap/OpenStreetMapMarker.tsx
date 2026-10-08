import * as React from 'react';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useOpenStreetMapContext } from './context';
import { osmToneColor, mix, type OsmMarkerState, type OsmMarkerTone } from './mapPalette';
import { useBoundValue } from './bindings';
import { useRegisterGuiNode } from '@/runtime/selection';
import { OSM_LABEL_LINE, OSM_DOT_RADIUS, OSM_PIN_ARROW } from './pinLayout';
import { osmNodeText } from './selection';
import type { GuiNodeProvenance } from '@/types/gui.types';

export type OsmMarkerShape = 'circle' | 'square' | 'triangle' | 'rect' | 'icon';
export type OsmMarkerLabelPlacement = 'right' | 'left' | 'top' | 'bottom';

/** Props that may be bound to a kernel path instead of given as values. */
export type OsmMarkerBindableProp =
  | 'lat' | 'lon' | 'label' | 'meta' | 'color' | 'fill' | 'shape' | 'icon' | 'size' | 'visible' | 'tone' | 'state';

export type OsmMarkerProps = {
  /** Latitude (WGS84 degrees). */
  lat?: number;
  /** Longitude (WGS84 degrees). */
  lon?: number;
  shape?: OsmMarkerShape;
  /** Circle diameter / square side / triangle height, in map pixels. */
  size?: number;
  /** Rect width/height in map pixels (shape="rect"). */
  width?: number;
  height?: number;
  /**
   * Theme colour role: a base tone (primary, secondary, info, success, warning,
   * error, neutral) or a domain alias (port, ship, train, yard, queue). Resolved
   * against the map's theme palette in both modes. Default 'neutral'.
   */
  tone?: OsmMarkerTone;
  /**
   * busy / done recolour the outline (theme warning / success), highlight
   * thickens it with a primary glow and bolds the label, dimmed fades the marker.
   */
  state?: OsmMarkerState;
  /** Outline colour. Overrides `tone` (busy / done states still win). */
  color?: string;
  /**
   * Fill colour. Default: with `tone` (or no `color`), a tint of the tone on the
   * map's land colour; with only `color`, `color` itself (or `none` when an icon
   * sits on the shape), as before.
   */
  fill?: string;
  strokeWidth?: number;
  /** GUI.Icon name drawn centred on the marker (or alone with shape="icon"). */
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  label?: React.ReactNode;
  /** Second, smaller line under the label. */
  meta?: React.ReactNode;
  labelPlacement?: OsmMarkerLabelPlacement;
  /** Gap in map pixels between the marker edge and its label. */
  labelOffset?: number;
  /** Outline the label text in the map's land colour so it stays legible on roads. Default true. */
  labelHalo?: boolean;
  /** Native tooltip. */
  title?: string;
  visible?: boolean;
  /**
   * Kernel paths for any bindable prop, read through the existing runtime
   * (MeRuntimeProvider / RuntimeAdapter). A bound value wins over the plain
   * prop. Updates follow the runtime's notifications only: adapter writes,
   * runtime.notify(), or an explicit subscribe bridge.
   */
  bind?: Partial<Record<OsmMarkerBindableProp, string>>;
  /**
   * Makes the marker a GUI node: renders `data-gui-node-id` and registers it
   * with useRegisterGuiNode (type "OpenStreetMap.Marker"), so the Semantic
   * Inspector can select it and Layout Grid outlines it. Registration is a
   * no-op outside a SelectionProvider (i.e. without mount()'s devtools).
   */
  nodeId?: string;
  /**
   * Opt-in kernel provenance for the node (`semanticPath` / `explainPath`),
   * the same contract any GUI node uses: it lights up the Inspector's Explain
   * for that path. Compared by content, so an inline object literal is fine.
   */
  provenance?: GuiNodeProvenance;
  /**
   * Node id put on the element WITHOUT registering it here: the spec renderer
   * (mount / renderNode) injects it and has already recorded the node with the
   * spec's provenance. `nodeId` wins when both are given.
   */
  'data-gui-node-id'?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGGElement>;
  'data-testid'?: string;
};

const BINDABLE: OsmMarkerBindableProp[] = ['lat', 'lon', 'label', 'meta', 'color', 'fill', 'shape', 'icon', 'size', 'visible', 'tone', 'state'];

function useBoundProps(props: OsmMarkerProps) {
  const out: Record<string, any> = {};
  // Fixed order, one hook per bindable prop (unbound paths do not subscribe).
  for (const key of BINDABLE) {
    const path = props.bind?.[key];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const bound = useBoundValue(path);
    out[key] = path ? bound : (props as any)[key];
  }
  return out as Pick<OsmMarkerProps, OsmMarkerBindableProp>;
}

function toNumber(value: any): number {
  return typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
}

export function markerExtent(shape: OsmMarkerShape, size: number, width?: number, height?: number) {
  if (shape === 'rect') {
    const w = width ?? size * 1.6;
    const h = height ?? size;
    return { halfW: w / 2, halfH: h / 2, w, h };
  }
  return { halfW: size / 2, halfH: size / 2, w: size, h: size };
}

function MarkerCore({ shape, size, width, height, color, fill, strokeWidth, glow }: {
  shape: OsmMarkerShape; size: number; width?: number; height?: number; color: string; fill: string; strokeWidth: number; glow?: string;
}) {
  const common = { className: 'gui-osm-marker__core', fill, stroke: color, strokeWidth, style: glow ? { filter: `drop-shadow(0 0 4px ${glow})` } : undefined } as const;
  if (shape === 'icon') return null;
  if (shape === 'circle') return <circle {...common} r={size / 2} />;
  if (shape === 'triangle') {
    const h = size;
    const half = h / Math.sqrt(3);
    return <polygon {...common} points={`0,${-(2 * h) / 3} ${half},${h / 3} ${-half},${h / 3}`} />;
  }
  const { w, h } = markerExtent(shape, size, width, height);
  return <rect {...common} x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(3, w / 6)} />;
}

function useStableProvenance(provenance: GuiNodeProvenance | undefined): GuiNodeProvenance | undefined {
  // useRegisterGuiNode re-registers whenever the provenance reference changes;
  // key it by content so a parent re-render does not churn the registry.
  const key = provenance ? JSON.stringify(provenance) : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => provenance, [key]);
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export default function OpenStreetMapMarker(props: OsmMarkerProps) {
  const { transform: map, palette, markerDefaults, selection, markerStore, pinLayout, setPinFocus, activatePin } = useOpenStreetMapContext();
  const v = useBoundProps(props);
  const provenance = useStableProvenance(props.provenance);
  useRegisterGuiNode(props.nodeId, 'OpenStreetMap.Marker', undefined, provenance);
  const lat = toNumber(v.lat);
  const lon = toNumber(v.lon);
  const markerId = props.id ?? props.nodeId;
  const [order] = React.useState(() => markerStore.nextOrder());
  const shown = v.visible !== false && Number.isFinite(lat) && Number.isFinite(lon);
  const regShape: OsmMarkerShape = (v.shape as OsmMarkerShape) || markerDefaults?.shape || 'circle';
  const regSize = Number.isFinite(toNumber(v.size)) ? toNumber(v.size) : markerDefaults?.size ?? 10;
  const regTone = (v.tone as OsmMarkerTone | undefined) || (v.color ? undefined : markerDefaults?.tone) || undefined;
  const regState = ((v.state as OsmMarkerState | undefined) || 'default') as OsmMarkerState;
  const regColor = regState === 'busy' ? palette.states.busy : regState === 'done' ? palette.states.done : (v.color as string) || osmToneColor(palette, regTone);
  const labelText = osmNodeText(v.label);
  const metaText = osmNodeText(v.meta);
  // tell the map about this marker (list, label layout, edge pins)
  useIsoLayoutEffect(() => {
    if (!markerId || !shown) return;
    markerStore.set({
      id: markerId, lat, lon, shape: regShape, size: regSize, width: props.width, height: props.height,
      icon: v.icon ? String(v.icon) : undefined, tone: regTone, state: regState, color: regColor,
      label: labelText || undefined, meta: metaText || undefined, labelPlacement: props.labelPlacement, labelOffset: props.labelOffset, order,
    });
  });
  useIsoLayoutEffect(() => {
    if (!markerId || !shown) return undefined;
    return () => markerStore.remove(markerId);
  }, [markerStore, markerId, shown]);
  if (!shown) return null;

  const shape: OsmMarkerShape = (v.shape as OsmMarkerShape) || markerDefaults?.shape || 'circle';
  const size = Number.isFinite(toNumber(v.size)) ? toNumber(v.size) : markerDefaults?.size ?? 10;
  // a default tone does not override an explicit colour (legacy look)
  const tone = (v.tone as OsmMarkerTone | undefined) || (v.color ? undefined : markerDefaults?.tone) || undefined;
  const state = ((v.state as OsmMarkerState | undefined) || 'default') as OsmMarkerState;
  const toneColor = osmToneColor(palette, tone);
  const explicitColor = (v.color as string) || undefined;
  const color =
    state === 'busy' ? palette.states.busy
    : state === 'done' ? palette.states.done
    : explicitColor ?? toneColor;
  // Legacy look when only `color` is given (filled shape, outline under an icon);
  // otherwise a tint of the tone on the land, like the port page's nodes.
  const legacy = Boolean(explicitColor) && !tone;
  const fill = (v.fill as string) || (legacy ? (v.icon && shape !== 'icon' ? 'none' : color) : tint(palette.land, explicitColor ?? toneColor));
  const highlight = state === 'highlight';
  const halo = props.labelHalo !== false;
  const haloProps = halo ? { stroke: palette.halo, strokeWidth: 3, strokeLinejoin: 'round' as const, paintOrder: 'stroke' } : {};
  const { x, y } = map.project(lat, lon);
  const { halfW, halfH } = markerExtent(shape, size, props.width, props.height);
  const iconSize = props.iconSize ?? Math.max(10, Math.round(Math.min(halfW, halfH) * 1.5));
  const placement = props.labelPlacement ?? 'right';
  const gap = props.labelOffset ?? 5;
  const hasMeta = v.meta !== undefined && v.meta !== null && v.meta !== '';
  const twoLines = hasMeta && (placement === 'right' || placement === 'left');
  const labelPos =
    placement === 'left' ? { x: -(halfW + gap), y: twoLines ? -3 : 3.5, anchor: 'end' as const }
    : placement === 'top' ? { x: 0, y: -(halfH + gap) - (hasMeta ? 11 : 0), anchor: 'middle' as const }
    : placement === 'bottom' ? { x: 0, y: halfH + gap + 8, anchor: 'middle' as const }
    : { x: halfW + gap, y: twoLines ? -3 : 3.5, anchor: 'start' as const };
  const metaPos = twoLines ? { ...labelPos, y: labelPos.y + 12 } : { ...labelPos, y: labelPos.y + 11 };

  // ── selection mode (S5b.2): unselected = small dot, selected = full pin ──
  const selectable = selection.enabled && Boolean(markerId);
  const isSelected = selectable && selection.has(markerId!);
  const entry = isSelected ? pinLayout?.get(markerId!) : undefined;
  const name = [labelText || props.title || markerId, metaText].filter(Boolean).join(', ');
  const pinHandlers = selectable
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-pressed': isSelected,
        'aria-label': entry?.clamped ? `${name}, ${entry.reason === 'occluded' ? 'under an overlay' : 'off view'}, press to show on the map` : name,
        'data-selected': isSelected ? 'true' : 'false',
        onClick: (e: React.MouseEvent<SVGGElement>) => {
          props.onClick?.(e);
          activatePin(markerId!, 'map');
        },
        onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activatePin(markerId!, 'keyboard');
          }
        },
        onFocus: () => setPinFocus(markerId!),
        onBlur: () => setPinFocus(null),
        onPointerEnter: () => setPinFocus(markerId!),
        onPointerLeave: () => setPinFocus(null),
      }
    : null;
  const classes = ['gui-osm-marker', tone ? `gui-osm-marker--${tone}` : null, state !== 'default' ? `gui-osm-marker--${state}` : null, props.className];

  if (selectable && !isSelected) {
    // constant CSS-px dot (1 unit = 1 CSS px), 24 px hit target
    const s = map.view.scale > 0 ? 1 / map.view.scale : map.view.markerScale ?? 1;
    return (
      <g
        id={props.id}
        className={[...classes, 'gui-osm-marker--dot'].filter(Boolean).join(' ')}
        transform={markerTransform(x, y, s)}
        style={state === 'dimmed' ? { opacity: 0.3, ...props.style } : props.style}
        data-gui-component="OpenStreetMap.Marker"
        data-gui-node-id={props.nodeId || props['data-gui-node-id'] || undefined}
        data-testid={props['data-testid']}
        data-tone={tone}
        data-state={state !== 'default' ? state : undefined}
        data-lat={lat}
        data-lon={lon}
        {...pinHandlers}
      >
        <title>{name}</title>
        <circle className="gui-osm-marker__hit" r={12} fill="transparent" />
        <circle className="gui-osm-marker__focus" r={7.5} fill="none" stroke="transparent" strokeWidth={2} />
        <circle className="gui-osm-marker__core gui-osm-marker__dot" r={OSM_DOT_RADIUS} fill={color} stroke={palette.halo} strokeWidth={1.5} />
      </g>
    );
  }

  // selected pin: drawn at its layout spot (edge / occluded pins move, with an arrow)
  let gx = x;
  let gy = y;
  let arrow: React.ReactNode = null;
  let labelEl: React.ReactNode | undefined;
  if (entry && map.view.scale > 0) {
    const k = entry.k;
    gx = (entry.x - map.view.offsetX) / map.view.scale;
    gy = (entry.y - map.view.offsetY) / map.view.scale;
    if (entry.clamped && entry.angle !== undefined) {
      // start the arrow at the pin's box edge in the arrow's direction (a wide rect's arrow
      // pointing up starts at halfH, not halfW), so it stays inside the layout's arrow allowance
      const ca = Math.abs(Math.cos(entry.angle));
      const sa = Math.abs(Math.sin(entry.angle));
      const r = Math.min(ca > 1e-6 ? halfW / ca : Infinity, sa > 1e-6 ? halfH / sa : Infinity) + 2;
      const deg = Math.round((entry.angle * 180) / Math.PI * 10) / 10;
      arrow = (
        <g className="gui-osm-marker__arrow" transform={`rotate(${deg})`} data-angle={deg}>
          <polygon points={`${round(r + OSM_PIN_ARROW)},0 ${round(r)},-4.5 ${round(r)},4.5`} fill={color} stroke={palette.halo} strokeWidth={1.5} strokeLinejoin="round" paintOrder="stroke" />
        </g>
      );
    }
    const pl = entry.label;
    if (pl && pl.kind !== 'collapsed') {
      const lx = round((pl.box.x - entry.x) / k + 1.5);
      const ly = (pl.box.y - entry.y) / k;
      labelEl = (
        <>
          {pl.kind === 'leader' ? (
            <line
              className="gui-osm-marker__leader"
              x1={round((pl.from.x - entry.x) / k)}
              y1={round((pl.from.y - entry.y) / k)}
              x2={round((pl.to.x - entry.x) / k)}
              y2={round((pl.to.y - entry.y) / k)}
              stroke={palette.meta}
              strokeWidth={1}
            />
          ) : null}
          {labelText ? (
            <text className="gui-osm-marker__label" x={lx} y={round(ly + 10)} textAnchor="start" fontSize={10} fontWeight={highlight ? 600 : undefined} fill={palette.label} {...haloProps}>
              {v.label as React.ReactNode}
            </text>
          ) : null}
          {hasMeta ? (
            <text className="gui-osm-marker__meta" x={lx} y={round(ly + OSM_LABEL_LINE + 8.5)} textAnchor="start" fontSize={9} fill={palette.meta} {...haloProps}>
              {v.meta as React.ReactNode}
            </text>
          ) : null}
        </>
      );
    } else if (pl && pl.kind === 'collapsed') {
      labelEl = null; // shown on hover / focus (it then gets priority), in the list and in the accessible name
    }
  }

  return (
    <g
      id={props.id}
      className={[...classes, isSelected ? 'gui-osm-marker--selected' : null, entry?.clamped ? 'gui-osm-marker--edge' : null, entry?.label?.kind === 'collapsed' ? 'gui-osm-marker--collapsed' : null].filter(Boolean).join(' ')}
      transform={markerTransform(gx, gy, map.view.markerScale)}
      style={state === 'dimmed' ? { opacity: 0.3, ...props.style } : props.style}
      onClick={props.onClick}
      data-gui-component="OpenStreetMap.Marker"
      data-gui-node-id={props.nodeId || props['data-gui-node-id'] || undefined}
      data-testid={props['data-testid']}
      data-tone={tone}
      data-state={state !== 'default' ? state : undefined}
      data-lat={lat}
      data-lon={lon}
      data-x={round(x)}
      data-y={round(y)}
      data-label-slot={entry?.label ? (entry.label.kind === 'collapsed' ? 'collapsed' : `${entry.label.kind === 'leader' ? 'leader:' : ''}${entry.label.slot}`) : undefined}
      {...pinHandlers}
    >
      {selectable ? <title>{name}</title> : props.title ? <title>{props.title}</title> : null}
      {selectable ? <circle className="gui-osm-marker__focus" r={Math.max(halfW, halfH) + 4} fill="none" stroke="transparent" strokeWidth={2} /> : null}
      {arrow}
      <MarkerCore
        shape={shape}
        size={size}
        width={props.width}
        height={props.height}
        color={color}
        fill={fill}
        strokeWidth={round((props.strokeWidth ?? 1.5) * (highlight ? 1.6 : 1))}
        glow={highlight ? palette.states.glow : undefined}
      />
      {v.icon ? (
        <foreignObject x={-iconSize / 2} y={-iconSize / 2} width={iconSize} height={iconSize} className="gui-osm-marker__icon" pointerEvents="none">
          <div
            // @ts-expect-error xmlns is valid inside foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          >
            <Icon name={String(v.icon)} fontSize={iconSize} iconColor={props.iconColor ?? color} />
          </div>
        </foreignObject>
      ) : null}
      {labelEl !== undefined ? labelEl : v.label !== undefined && v.label !== null && v.label !== '' ? (
        <text className="gui-osm-marker__label" x={labelPos.x} y={labelPos.y} textAnchor={labelPos.anchor} fontSize={10} fontWeight={highlight ? 600 : undefined} fill={palette.label} {...haloProps}>
          {v.label as React.ReactNode}
        </text>
      ) : null}
      {labelEl !== undefined ? null : hasMeta ? (
        <text className="gui-osm-marker__meta" x={metaPos.x} y={metaPos.y} textAnchor={metaPos.anchor} fontSize={9} fill={palette.meta} {...haloProps}>
          {v.meta as React.ReactNode}
        </text>
      ) : null}
    </g>
  );
}

/** A tint of `color` on the land; colours mix() cannot parse (var(), currentColor) pass through. */
function tint(land: string, color: string): string {
  try {
    return mix(land, color, 0.18);
  } catch {
    return color;
  }
}

/**
 * Marker group transform: its map position, plus the marker scale that keeps it
 * the same size on screen at any zoom (omitted when 1, e.g. at the fit).
 */
export function markerTransform(x: number, y: number, markerScale: number | undefined): string {
  const t = `translate(${round(x)},${round(y)})`;
  const k = markerScale ?? 1;
  if (!(k > 0) || Math.abs(k - 1) < 1e-4) return t;
  return `${t} scale(${Math.round(k * 10000) / 10000})`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
