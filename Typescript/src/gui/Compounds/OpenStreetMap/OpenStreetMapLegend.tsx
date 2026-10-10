/*
 * GUI.OpenStreetMap.Legend — a themed legend box docked on the map (default
 * top-right): rows of swatch · label · value, optional headings and footer.
 * Values can be given, or bound to kernel paths like marker props (`bind`,
 * read through the runtime in scope; several paths join with " · ").
 * Colours come from the map palette (theme tokens, both modes).
 */
import * as React from 'react';
import { useOpenStreetMapPalette, type OsmOverlayPosition } from './context';
import { osmToneColor, type OsmMarkerTone, type OsmPalette } from './mapPalette';
import { formatOsmValue, useBoundValues } from './bindings';
import { OsmOverlayPlacement, osmDockItemStyle, useOsmHiddenBelow } from './OpenStreetMapOverlay';

export const OSM_MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export type OsmSwatchShape = 'dot' | 'square' | 'ring' | 'line' | 'dash';
export type OsmSwatch = {
  shape?: OsmSwatchShape;
  /** Size in CSS px (dot / square / ring diameter, line length). Default 7 (line 14). */
  size?: number;
  tone?: OsmMarkerTone;
  color?: string;
};

export type OsmLegendRowProps = {
  id?: string;
  label: React.ReactNode;
  /** Swatch tone (marker tones: primary…neutral, port, ship, train, yard, queue). Default neutral. */
  tone?: OsmMarkerTone;
  /** Explicit swatch colour; wins over `tone`. */
  color?: string;
  /** Swatch shape / size, or just a shape name. Default a 7 px dot. */
  swatch?: OsmSwatch | OsmSwatchShape;
  value?: React.ReactNode;
  /** Kernel path(s) for the value (string, or an array joined with " · "). Wins over `value` once defined. */
  bind?: string | string[];
  /** Turn the (bound) value into what is shown. Default: grouped numbers, "—" for missing. */
  format?: (value: any) => React.ReactNode;
  title?: string;
  'data-gui-node-id'?: string;
};

export type OsmLegendItem = OsmLegendRowProps | { heading: React.ReactNode; id?: string };

export type OsmLegendProps = {
  /** Dock. Default 'top-right'. */
  position?: OsmOverlayPosition;
  align?: 'start' | 'center' | 'end';
  /** Optional caption above the rows; also the accessible name when it is a string. */
  title?: React.ReactNode;
  items?: OsmLegendItem[];
  footer?: React.ReactNode;
  /** Box width in CSS px (never wider than the map). Default 200. */
  width?: number | string;
  /** Monospace, slightly smaller text (data-heavy legends). */
  mono?: boolean;
  /** Receive pointer events. Default false: clicks pass through to the map. */
  interactive?: boolean;
  /** Hide while the map is narrower than this many CSS px. */
  hideBelow?: number;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'data-testid'?: string;
  'data-gui-node-id'?: string;
  /** Extra rows (<OpenStreetMap.LegendRow>) or any content, after `items`. */
  children?: React.ReactNode;
};

function swatchStyle(palette: OsmPalette, row: Pick<OsmLegendRowProps, 'tone' | 'color' | 'swatch'>): React.CSSProperties {
  const sw: OsmSwatch = typeof row.swatch === 'string' ? { shape: row.swatch } : row.swatch ?? {};
  const color = sw.color ?? row.color ?? osmToneColor(palette, sw.tone ?? row.tone ?? 'neutral');
  const shape = sw.shape ?? 'dot';
  if (shape === 'line' || shape === 'dash') {
    const len = sw.size ?? 14;
    return { width: len, height: 0, borderTop: `2px ${shape === 'dash' ? 'dashed' : 'solid'} ${color}` };
  }
  const size = sw.size ?? 7;
  return {
    width: size,
    height: size,
    borderRadius: shape === 'square' ? 1 : '50%',
    boxSizing: 'border-box',
    ...(shape === 'ring' ? { border: `1.5px solid ${color}`, background: 'transparent' } : { background: color }),
  };
}

/** What a legend row / chip shows: formatted bound values, given nodes as is, "—" while a binding is empty. */
export function osmShownValue(raw: any, isBound: boolean, hasBind: boolean, format?: (value: any) => React.ReactNode): React.ReactNode {
  if (format) return format(raw);
  if (isBound) return formatOsmValue(raw);
  if (raw !== undefined && raw !== null) return typeof raw === 'number' || Array.isArray(raw) ? formatOsmValue(raw) : raw;
  return hasBind ? '—' : null;
}

/** True when at least one bound path has a value. */
export function osmIsBound(bind: string | string[] | undefined, bound: any): boolean {
  if (bind === undefined) return false;
  return Array.isArray(bound) ? bound.some((v) => v !== undefined) : bound !== undefined;
}

/** One legend row: swatch · label · value (value optional, bindable). */
export function OpenStreetMapLegendRow(props: OsmLegendRowProps) {
  const palette = useOpenStreetMapPalette();
  const bound = useBoundValues(props.bind);
  const isBound = osmIsBound(props.bind, bound);
  const raw = isBound ? bound : props.value;
  const shown = osmShownValue(raw, isBound, props.bind !== undefined, props.format);
  const paths = props.bind === undefined ? undefined : ([] as string[]).concat(props.bind).join(' ');
  return (
    <li
      id={props.id}
      className="gui-osm-legend__row"
      data-gui-node-id={props['data-gui-node-id'] || undefined}
      title={props.title}
      style={{ display: 'grid', gridTemplateColumns: '14px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 4, minHeight: '1.5em' }}
    >
      <span className="gui-osm-legend__swatch" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <i style={{ display: 'inline-block', flexShrink: 0, ...swatchStyle(palette, props) }} />
      </span>
      <span className="gui-osm-legend__label" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.label}</span>
      {shown === null || shown === undefined ? <span /> : (
        <b
          className="gui-osm-legend__value"
          data-me-path={paths}
          style={{ color: palette.overlay.strong, fontWeight: 500, fontVariantNumeric: 'tabular-nums', textAlign: 'right', paddingLeft: 6, whiteSpace: 'nowrap' }}
        >
          {shown}
        </b>
      )}
    </li>
  );
}

function OpenStreetMapLegend({
  position = 'top-right',
  align,
  title,
  items = [],
  footer,
  width = 200,
  mono = false,
  interactive = false,
  hideBelow,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  'data-gui-node-id': guiNodeId,
  children,
}: OsmLegendProps) {
  const palette = useOpenStreetMapPalette();
  const hidden = useOsmHiddenBelow(hideBelow);
  if (hidden) return null;
  const o = palette.overlay;
  const heading: React.CSSProperties = { fontSize: '0.86em', letterSpacing: '0.1em', textTransform: 'uppercase', color: o.muted, lineHeight: 1.6 };
  const el = (
    <div
      id={id}
      className={['gui-osm-legend', className].filter(Boolean).join(' ')}
      data-gui-component="OpenStreetMapLegend"
      data-gui-node-id={guiNodeId || undefined}
      data-testid={dataTestId}
      data-osm-overlay={position}
      role="group"
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : 'Map legend')}
      style={{
        boxSizing: 'border-box',
        width,
        maxWidth: '100%',
        padding: '5px 8px',
        background: o.background,
        border: `1px solid ${o.border}`,
        borderRadius: 4,
        color: o.text,
        font: mono ? `10px/1.5 ${OSM_MONO_FONT}` : '11px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        pointerEvents: interactive ? 'auto' : 'none',
        ...osmDockItemStyle(position, align),
        ...style,
      }}
    >
      {title ? <div className="gui-osm-legend__title" style={{ color: o.strong, fontWeight: 600, marginBottom: 2 }}>{title}</div> : null}
      <ul className="gui-osm-legend__rows" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, i) =>
          'heading' in item ? (
            <li key={item.id ?? `h${i}`} className="gui-osm-legend__heading" style={{ ...heading, marginTop: i ? 4 : 0 }}>{item.heading}</li>
          ) : (
            <OpenStreetMapLegendRow key={item.id ?? `r${i}`} {...item} />
          ),
        )}
        {children}
      </ul>
      {footer ? (
        <div className="gui-osm-legend__footer" style={{ borderTop: `1px solid ${o.border}`, marginTop: 4, paddingTop: 3, fontSize: '0.92em', color: o.muted }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
  return <OsmOverlayPlacement position={position}>{el}</OsmOverlayPlacement>;
}

OpenStreetMapLegend.osmSlot = 'overlay' as const;
OpenStreetMapLegend.osmDefaultPosition = 'top-right' as OsmOverlayPosition;
OpenStreetMapLegend.Row = OpenStreetMapLegendRow;

export default OpenStreetMapLegend;
