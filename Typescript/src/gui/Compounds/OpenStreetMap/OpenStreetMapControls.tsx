/*
 * GUI.OpenStreetMap.Controls — zoom in / out, reset to the fit, and an
 * optional basemap layer toggle, docked on the map (default: the right edge,
 * between the legend corner and the bottom HUD). Native buttons, so Tab /
 * Enter / Space work; at a zoom limit a button stays focusable but reports
 * aria-disabled. Colours are the overlay palette (theme tokens): glyphs use
 * overlay.strong on overlay.background (>= 4.5:1), focus / hover rings use
 * overlay.accent.
 */
import * as React from 'react';
import { useOpenStreetMapContext, type OsmOverlayPosition } from './context';
import { OsmOverlayPlacement, osmDockItemStyle, useOsmHiddenBelow } from './OpenStreetMapOverlay';

export type OsmControlsProps = {
  /** Dock. Default 'right'. */
  position?: OsmOverlayPosition;
  align?: 'start' | 'center' | 'end';
  /** Show zoom in / out. Default true. */
  zoom?: boolean;
  /** Show reset (fit the whole map). Default true. */
  reset?: boolean;
  /** Show the basemap layer toggle (only when the map has basemap layers). Default false. */
  layers?: boolean;
  /** Zoom factor per click. Default 2. */
  step?: number;
  /** Button size (CSS px). Default 30. */
  size?: number;
  /** Start with the layer panel open. */
  defaultLayersOpen?: boolean;
  hideBelow?: number;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'data-testid'?: string;
  'data-gui-node-id'?: string;
};

const svgIcon = (d: string, size: number) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICON_PLUS = 'M8 3v10M3 8h10';
const ICON_MINUS = 'M3 8h10';
const ICON_FIT = 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10';
const ICON_LAYERS = 'M8 2 14 5.5 8 9 2 5.5Z M2 8.5 8 12 14 8.5 M2 11 8 14.5 14 11';

function OpenStreetMapControls({
  position = 'right',
  align,
  zoom = true,
  reset = true,
  layers: showLayers = false,
  step = 2,
  size = 30,
  defaultLayersOpen = false,
  hideBelow,
  id,
  className,
  style,
  'aria-label': ariaLabel = 'Map controls',
  'data-testid': dataTestId,
  'data-gui-node-id': guiNodeId,
}: OsmControlsProps) {
  const { palette, viewport, layers } = useOpenStreetMapContext();
  const hidden = useOsmHiddenBelow(hideBelow);
  const [open, setOpen] = React.useState(defaultLayersOpen);
  const panelId = `gui-osm-layers-${React.useId().replace(/:/g, '')}`;
  const layersBtn = React.useRef<HTMLButtonElement | null>(null);
  if (hidden) return null;
  const o = palette.overlay;
  const hasLayers = showLayers && layers.list.length > 0;
  const eps = 1e-6;
  const atMax = viewport.zoom >= viewport.maxZoom - eps;
  const atMin = viewport.zoom <= viewport.minZoom + eps;
  const onRight = position === 'top-right' || position === 'right' || position === 'bottom-right';

  const button = (
    key: string,
    label: string,
    icon: React.ReactNode,
    disabled: boolean,
    onClick: () => void,
    extra: Record<string, unknown> = {},
    first = false,
    last = false,
  ) => (
    <button
      key={key}
      type="button"
      className={`gui-osm-control gui-osm-control--${key}`}
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      style={{
        boxSizing: 'border-box',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        padding: 0,
        margin: 0,
        background: o.background,
        color: disabled ? o.muted : o.strong,
        border: `1px solid ${o.border}`,
        borderTopWidth: first ? 1 : 0,
        borderRadius: first && last ? 4 : first ? '4px 4px 0 0' : last ? '0 0 4px 4px' : 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        font: 'inherit',
        lineHeight: 0,
      }}
      {...extra}
    >
      {icon}
    </button>
  );

  const iconSize = Math.round(size * 0.53);
  const zoomGroup: React.ReactNode[] = [];
  if (zoom) {
    zoomGroup.push(button('zoom-in', 'Zoom in', svgIcon(ICON_PLUS, iconSize), atMax, () => viewport.zoomBy(step, 'button'), {}, true, !reset));
    zoomGroup.push(button('zoom-out', 'Zoom out', svgIcon(ICON_MINUS, iconSize), atMin, () => viewport.zoomBy(1 / step, 'button'), {}, false, !reset));
  }
  if (reset) zoomGroup.push(button('reset', 'Reset view', svgIcon(ICON_FIT, iconSize), viewport.isFit, () => viewport.reset('button'), {}, !zoom, true));

  const el = (
    <div
      id={id}
      className={['gui-osm-controls', className].filter(Boolean).join(' ')}
      data-gui-component="OpenStreetMapControls"
      data-gui-node-id={guiNodeId || undefined}
      data-testid={dataTestId}
      data-osm-overlay={position}
      role="group"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: onRight ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 6,
        pointerEvents: 'auto',
        font: '11px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        ...osmDockItemStyle(position, align),
        ...style,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          layersBtn.current?.focus();
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {zoomGroup.length ? <div className="gui-osm-controls__zoom" style={{ display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,.12)', borderRadius: 4 }}>{zoomGroup}</div> : null}
        {hasLayers
          ? button('layers', 'Map layers', svgIcon(ICON_LAYERS, iconSize), false, () => setOpen((v) => !v), {
              ref: layersBtn,
              'aria-expanded': open,
              'aria-controls': panelId,
            }, true, true)
          : null}
      </div>
      {hasLayers && open ? (
        <fieldset
          id={panelId}
          className="gui-osm-controls__layers"
          style={{
            margin: 0,
            padding: '5px 8px 6px',
            minWidth: 0,
            background: o.background,
            border: `1px solid ${o.border}`,
            borderRadius: 4,
            color: o.text,
          }}
        >
          <legend style={{ float: 'left', width: '100%', padding: 0, marginBottom: 2, color: o.strong, fontWeight: 600 }}>Layers</legend>
          {layers.list.map((l) => (
            <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer', clear: 'both' }}>
              <input
                type="checkbox"
                className="gui-osm-control gui-osm-control--layer"
                checked={!layers.hidden.has(l.id)}
                onChange={() => layers.toggle(l.id)}
                style={{ margin: 0, accentColor: o.accent }}
              />
              {l.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      <span
        className="gui-osm-controls__status"
        aria-live="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {`Zoom ${Math.round(viewport.zoom * 100)}%`}
      </span>
    </div>
  );
  return <OsmOverlayPlacement position={position}>{el}</OsmOverlayPlacement>;
}

OpenStreetMapControls.osmSlot = 'overlay' as const;
OpenStreetMapControls.osmDefaultPosition = 'right' as OsmOverlayPosition;

export default OpenStreetMapControls;
