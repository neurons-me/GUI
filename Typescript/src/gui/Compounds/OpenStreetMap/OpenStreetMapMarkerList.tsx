/*
 * GUI.OpenStreetMap.MarkerList — the map's pins as a list: a checkbox per pin
 * (selection), the pin's swatch / icon, label and live value (its bound
 * `meta`), a "show on map" button, and Select all / Clear. Native checkboxes
 * and buttons in a stable order, so it is fully keyboard accessible.
 *
 * Inside <OpenStreetMap> it docks like the other overlays (default top-left).
 * Outside the map, pass the same `link` as the map (useOpenStreetMapLink()).
 * Without selection mode on the map (no `selected` / `defaultSelected`) the
 * list is read-only: it lists the pins and can show them, nothing more.
 */
import * as React from 'react';
import Icon from '@/gui/Atoms/Icon/Icon';
import { OpenStreetMapContext, type OsmOverlayPosition } from './context';
import { OsmOverlayPlacement, osmDockItemStyle } from './OpenStreetMapOverlay';
import { OSM_MONO_FONT } from './OpenStreetMapLegend';
import { useOsmPalette, type OsmPalette } from './mapPalette';
import { useOsmLinkSnapshot, useOsmMarkerList, type OsmLink, type OsmMarkerInfo, type OsmMarkerStore, type OsmSelectionState } from './selection';

export type OsmMarkerListProps = {
  /** Dock when inside the map. Default 'top-left'. */
  position?: OsmOverlayPosition;
  align?: 'start' | 'center' | 'end';
  /** Outside the map: the link shared with <OpenStreetMap link>. */
  link?: OsmLink;
  title?: React.ReactNode;
  /** Only list some pins. */
  filter?: (marker: OsmMarkerInfo) => boolean;
  /** Value column; default the pin's (bound) meta. */
  renderValue?: (marker: OsmMarkerInfo) => React.ReactNode;
  /** Width (CSS px or any CSS length). Default 220. */
  width?: number | string;
  /** Max height of the rows before they scroll (CSS px). Default 260. */
  maxHeight?: number;
  mono?: boolean;
  hideBelow?: number;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'data-testid'?: string;
  'data-gui-node-id'?: string;
};

function Swatch({ m, palette }: { m: OsmMarkerInfo; palette: OsmPalette }) {
  if (m.icon) {
    return (
      <span aria-hidden="true" style={{ display: 'inline-flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={m.icon} fontSize={15} iconColor={m.color} />
      </span>
    );
  }
  const shape = m.shape === 'square' || m.shape === 'rect' ? <rect x={3} y={3} width={10} height={10} rx={2} /> : m.shape === 'triangle' ? <polygon points="8,2 14,13 2,13" /> : <circle cx={8} cy={8} r={5} />;
  return (
    <svg aria-hidden="true" width={16} height={16} viewBox="0 0 16 16" style={{ flexShrink: 0 }} fill={m.color} stroke={palette.halo} strokeWidth={1}>
      {shape}
    </svg>
  );
}

function ListBody({
  store,
  selection,
  palette,
  showPin,
  props,
}: {
  store: OsmMarkerStore;
  selection: OsmSelectionState;
  palette: OsmPalette;
  showPin: (id: string) => void;
  props: OsmMarkerListProps;
}) {
  const all = useOsmMarkerList(store);
  const markers = props.filter ? all.filter(props.filter) : all;
  const o = palette.overlay;
  const selectedCount = markers.filter((m) => selection.has(m.id)).length;
  const btn: React.CSSProperties = {
    font: 'inherit',
    fontSize: '0.92em',
    padding: '1px 6px',
    borderRadius: 3,
    border: `1px solid ${o.border}`,
    background: 'transparent',
    color: o.strong,
    cursor: 'pointer',
  };
  const ids = markers.map((m) => m.id);
  const allOn = ids.length > 0 && ids.every((id) => selection.has(id));
  const noneOn = ids.every((id) => !selection.has(id));
  const titleText = props.title ?? 'Pins';
  return (
    <>
      <div className="gui-osm-pins__head" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span className="gui-osm-pins__title" style={{ color: o.strong, fontWeight: 600, flex: '1 1 auto', minWidth: 0 }}>
          {titleText}
          {selection.enabled ? <span style={{ color: o.text, fontWeight: 400 }}>{` · ${selectedCount}/${markers.length}`}</span> : null}
        </span>
        {selection.enabled ? (
          <>
            <button
              type="button"
              className="gui-osm-control gui-osm-pins__all"
              style={{ ...btn, opacity: allOn ? 0.6 : 1 }}
              aria-disabled={allOn || undefined}
              onClick={() => {
                if (!allOn) selection.set([...selection.ids, ...ids.filter((id) => !selection.has(id))], 'list');
              }}
            >
              Select all
            </button>
            <button
              type="button"
              className="gui-osm-control gui-osm-pins__clear"
              style={{ ...btn, opacity: noneOn ? 0.6 : 1 }}
              aria-disabled={noneOn || undefined}
              onClick={() => {
                if (!noneOn) selection.set(selection.ids.filter((id) => !ids.includes(id)), 'list');
              }}
            >
              Clear
            </button>
          </>
        ) : null}
      </div>
      <ul className="gui-osm-pins__rows" style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: props.maxHeight ?? 260, overflowY: 'auto' }}>
        {markers.map((m) => {
          const on = selection.has(m.id);
          const value = props.renderValue ? props.renderValue(m) : m.meta;
          const label = m.label || m.id;
          return (
            <li key={m.id} className="gui-osm-pins__row" data-pin={m.id} data-selected={selection.enabled ? String(on) : undefined} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto', minWidth: 0, cursor: selection.enabled ? 'pointer' : 'default' }}>
                {selection.enabled ? (
                  <input
                    type="checkbox"
                    className="gui-osm-control gui-osm-pins__check"
                    checked={on}
                    onChange={() => selection.toggle(m.id, 'list')}
                    style={{ margin: 0, accentColor: o.accent, flexShrink: 0 }}
                  />
                ) : null}
                <Swatch m={m} palette={palette} />
                <span className="gui-osm-pins__label" style={{ color: on || !selection.enabled ? o.strong : o.text, fontWeight: on ? 600 : 400, minWidth: '8ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 auto' }} title={label}>
                  {label}
                </span>
                {value ? (
                  <span
                    className="gui-osm-pins__value"
                    title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
                    style={{ color: o.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {value}
                  </span>
                ) : null}
              </label>
              <button
                type="button"
                className="gui-osm-control gui-osm-pins__show"
                aria-label={`Show ${label} on the map`}
                title={`Show ${label} on the map`}
                onClick={() => showPin(m.id)}
                style={{ ...btn, padding: 0, width: 20, height: 20, display: 'grid', placeItems: 'center', flexShrink: 0, lineHeight: 0 }}
              >
                <svg width={12} height={12} viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <circle cx={8} cy={8} r={4.5} />
                  <path d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function OpenStreetMapMarkerList(props: OsmMarkerListProps) {
  const ctx = React.useContext(OpenStreetMapContext);
  const linked = useOsmLinkSnapshot(ctx ? undefined : props.link);
  const themePalette = useOsmPalette();
  const hidden = useOsmHiddenBelowSafe(props.hideBelow, Boolean(ctx));
  const position = props.position ?? 'top-left';
  const src = ctx
    ? { store: ctx.markerStore, selection: ctx.selection, palette: ctx.palette, showPin: ctx.showPin }
    : linked
      ? { store: linked.store, selection: linked.selection, palette: themePalette, showPin: linked.showPin }
      : null;
  if (hidden) return null;
  const palette = src?.palette ?? themePalette;
  const o = palette.overlay;
  const el = (
    <div
      id={props.id}
      className={['gui-osm-pins', props.className].filter(Boolean).join(' ')}
      data-gui-component="OpenStreetMapMarkerList"
      data-gui-node-id={props['data-gui-node-id'] || undefined}
      data-testid={props['data-testid']}
      data-osm-overlay={ctx ? position : undefined}
      role="group"
      aria-label={props['aria-label'] ?? (typeof props.title === 'string' ? props.title : 'Map pins')}
      style={{
        boxSizing: 'border-box',
        width: props.width ?? 220,
        maxWidth: '100%',
        padding: '5px 8px 6px',
        background: o.background,
        border: `1px solid ${o.border}`,
        borderRadius: 4,
        color: o.text,
        font: props.mono ? `10px/1.5 ${OSM_MONO_FONT}` : '11px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'auto',
        ...(ctx ? osmDockItemStyle(position, props.align) : {}),
        ...props.style,
      }}
    >
      {src ? <ListBody store={src.store} selection={src.selection} palette={palette} showPin={src.showPin} props={props} /> : <span style={{ color: o.muted }}>No map linked</span>}
    </div>
  );
  return ctx ? <OsmOverlayPlacement position={position}>{el}</OsmOverlayPlacement> : el;
}

/** hideBelow only means something inside a map. */
function useOsmHiddenBelowSafe(hideBelow: number | undefined, inMap: boolean): boolean {
  const ctx = React.useContext(OpenStreetMapContext);
  const w = ctx?.transform.view.width ?? 0;
  if (!inMap) return false;
  return Boolean(hideBelow && w > 0 && w < hideBelow);
}

OpenStreetMapMarkerList.osmSlot = 'overlay' as const;
OpenStreetMapMarkerList.osmDefaultPosition = 'top-left' as OsmOverlayPosition;

export default OpenStreetMapMarkerList;
