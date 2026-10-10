/*
 * GUI.OpenStreetMap.Chip — a small "label value" stat chip for map HUDs
 * (default dock: bottom edge, where chips wrap in a row above the
 * attribution). Values can be given or bound to kernel paths (`bind`).
 * Options match what map pages build by hand: an optional ƒ source marker,
 * a dashed `adapter` variant for values that do not come from the kernel,
 * an `active` state (e.g. its explanation popover is open) and a reserved
 * value width so live values never re-wrap the HUD.
 */
import * as React from 'react';
import { useOpenStreetMapPalette, type OsmOverlayPosition } from './context';
import { osmToneText, type OsmMarkerTone } from './mapPalette';
import { useBoundValues } from './bindings';
import { OsmOverlayPlacement, osmDockItemStyle, useOsmHiddenBelow } from './OpenStreetMapOverlay';
import { OSM_MONO_FONT, osmIsBound, osmShownValue } from './OpenStreetMapLegend';

export type OsmChipProps = {
  label: React.ReactNode;
  value?: React.ReactNode;
  /** Kernel path(s) for the value (an array joins with " · "). Wins over `value` once defined. */
  bind?: string | string[];
  format?: (value: any) => React.ReactNode;
  /** Text after a present value, e.g. " t". */
  unit?: React.ReactNode;
  /** Colour the value with a marker tone (kept ≥ 4.5:1 on the chip). Default: strong text. */
  tone?: OsmMarkerTone;
  /** 'adapter': dashed warning-tone border, for values the page computes outside the kernel. */
  variant?: 'default' | 'adapter';
  /** Show the small ƒ marker (the value has an inspectable source / expression). */
  fx?: boolean;
  /** Highlighted border (and ƒ): e.g. while this chip's explanation is open. Sets aria-expanded when clickable. */
  active?: boolean;
  /** Makes the chip a button (Enter / Space too). */
  onClick?: (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void;
  /** Reserve this many characters for the value, so a growing number does not re-wrap the HUD. */
  minValueCh?: number;
  /** Dock when the chip is a direct child of the map. Default 'bottom'. */
  position?: OsmOverlayPosition;
  align?: 'start' | 'center' | 'end';
  hideBelow?: number;
  mono?: boolean;
  title?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-controls'?: string;
  'data-testid'?: string;
  'data-gui-node-id'?: string;
  /** Extra content after the value (e.g. a breakdown shown only on wide maps). */
  children?: React.ReactNode;
};

function OpenStreetMapChip({
  label,
  value,
  bind,
  format,
  unit,
  tone,
  variant = 'default',
  fx = false,
  active,
  onClick,
  minValueCh,
  position = 'bottom',
  align,
  hideBelow,
  mono = false,
  title,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-controls': ariaControls,
  'data-testid': dataTestId,
  'data-gui-node-id': guiNodeId,
  children,
}: OsmChipProps) {
  const palette = useOpenStreetMapPalette();
  const bound = useBoundValues(bind);
  const [hover, setHover] = React.useState(false);
  const hidden = useOsmHiddenBelow(hideBelow);
  if (hidden) return null;
  const o = palette.overlay;
  const isBound = osmIsBound(bind, bound);
  const shown = osmShownValue(isBound ? bound : value, isBound, bind !== undefined, format);
  const present = shown !== null && shown !== undefined && shown !== '—';
  const adapter = variant === 'adapter';
  const interactive = typeof onClick === 'function';
  const borderColor = active || (interactive && hover) ? o.accent : adapter ? o.adapter : o.border;
  const paths = bind === undefined ? undefined : ([] as string[]).concat(bind).join(' ');
  const el = (
    <span
      id={id}
      className={['gui-osm-chip', adapter ? 'gui-osm-chip--adapter' : null, active ? 'gui-osm-chip--active' : null, className].filter(Boolean).join(' ')}
      data-gui-component="OpenStreetMapChip"
      data-gui-node-id={guiNodeId || undefined}
      data-testid={dataTestId}
      data-osm-overlay={position}
      data-variant={variant}
      title={title}
      {...(interactive
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': ariaLabel,
            'aria-controls': ariaControls,
            ...(active !== undefined ? { 'aria-expanded': active } : {}),
            onClick: (e: React.MouseEvent<HTMLElement>) => onClick!(e),
            onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!(e); }
            },
            onMouseEnter: () => setHover(true),
            onMouseLeave: () => setHover(false),
          }
        : { 'aria-label': ariaLabel })}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        boxSizing: 'border-box',
        height: 22,
        maxWidth: '100%',
        padding: '0 8px',
        background: o.background,
        border: `1px ${adapter ? 'dashed' : 'solid'} ${borderColor}`,
        borderRadius: 4,
        color: o.text,
        font: mono ? `10px/1 ${OSM_MONO_FONT}` : '11px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : undefined,
        pointerEvents: interactive ? 'auto' : 'none',
        ...osmDockItemStyle(position, align),
        ...style,
      }}
    >
      <span className="gui-osm-chip__label">{label}</span>
      {shown === null || shown === undefined ? null : (
        <strong
          className="gui-osm-chip__value"
          data-me-path={paths}
          style={{
            color: tone ? osmToneText(palette, tone) : o.strong,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            ...(minValueCh ? { display: 'inline-block', minWidth: `${minValueCh}ch`, textAlign: 'right' } : {}),
          }}
        >
          {shown}
          {present && unit ? unit : null}
        </strong>
      )}
      {children}
      {fx ? (
        <span
          className="gui-osm-chip__fx"
          aria-hidden="true"
          style={{ marginLeft: 2, padding: '0 3px', border: `1px solid ${active ? o.accent : o.border}`, borderRadius: 2, color: active ? o.accent : o.muted, fontSize: '0.9em', lineHeight: '11px', fontStyle: 'italic' }}
        >
          ƒ
        </span>
      ) : null}
    </span>
  );
  return <OsmOverlayPlacement position={position}>{el}</OsmOverlayPlacement>;
}

OpenStreetMapChip.osmSlot = 'overlay' as const;
OpenStreetMapChip.osmDefaultPosition = 'bottom' as OsmOverlayPosition;

export default OpenStreetMapChip;
