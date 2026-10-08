import * as React from 'react';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useOpenStreetMapContext } from './context';
import { osmToneColor, mix, type OsmMarkerState, type OsmMarkerTone } from './mapPalette';
import { useBoundValue } from './bindings';
import { useRegisterGuiNode } from '@/runtime/selection';
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

export default function OpenStreetMapMarker(props: OsmMarkerProps) {
  const { transform: map, palette, markerDefaults } = useOpenStreetMapContext();
  const v = useBoundProps(props);
  const provenance = useStableProvenance(props.provenance);
  useRegisterGuiNode(props.nodeId, 'OpenStreetMap.Marker', undefined, provenance);
  const lat = toNumber(v.lat);
  const lon = toNumber(v.lon);
  if (v.visible === false || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

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

  return (
    <g
      id={props.id}
      className={['gui-osm-marker', tone ? `gui-osm-marker--${tone}` : null, state !== 'default' ? `gui-osm-marker--${state}` : null, props.className].filter(Boolean).join(' ')}
      transform={`translate(${round(x)},${round(y)})`}
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
    >
      {props.title ? <title>{props.title}</title> : null}
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
      {v.label !== undefined && v.label !== null && v.label !== '' ? (
        <text className="gui-osm-marker__label" x={labelPos.x} y={labelPos.y} textAnchor={labelPos.anchor} fontSize={10} fontWeight={highlight ? 600 : undefined} fill={palette.label} {...haloProps}>
          {v.label as React.ReactNode}
        </text>
      ) : null}
      {hasMeta ? (
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

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
