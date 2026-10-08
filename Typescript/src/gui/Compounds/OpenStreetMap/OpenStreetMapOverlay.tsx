/*
 * GUI.OpenStreetMap.Overlay — HTML content docked on the map (legend, HUD,
 * cards). Overlays sit in one of 8 docks (4 corners, 4 edges) laid out by the
 * map root on a grid, so overlays in different docks never overlap each
 * other, and the OSM attribution has its own row, so nothing covers it.
 * Several overlays in one dock stack (corners, left/right: column; top/bottom
 * edges: a wrapping row).
 *
 * An overlay that is a direct child of <OpenStreetMap> (also through
 * Fragments) is placed by the root during render, server included. One that
 * ends up inside the SVG subtree instead (e.g. wrapped by a spec renderer
 * component) portals into its dock on the client after mount.
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import { OsmSvgScopeContext, useOpenStreetMapContext, type OsmOverlayPosition } from './context';

export type { OsmOverlayPosition } from './context';

export type OsmOverlayProps = {
  /** Dock: a corner or an edge. Default 'top-right'. */
  position?: OsmOverlayPosition;
  /** Layout of the overlay's own children. Default: 'row' on the top/bottom edges, else 'column'. */
  direction?: 'row' | 'column';
  /** Where the overlay sits along its dock: on an edge, 'center' / 'end' push it along the row. Default 'start'. */
  align?: 'start' | 'center' | 'end';
  /** Gap between the overlay's children (px). Default 6. */
  gap?: number;
  /** Receive pointer events (default true). Passive overlays (legends) let clicks reach the map. */
  interactive?: boolean;
  /** Hide while the map is narrower than this many CSS px (responsive). */
  hideBelow?: number;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
  'aria-label'?: string;
  'data-testid'?: string;
  'data-gui-node-id'?: string;
  children?: React.ReactNode;
};

const isRight = (p: OsmOverlayPosition) => p === 'top-right' || p === 'right' || p === 'bottom-right';
const isLeft = (p: OsmOverlayPosition) => p === 'top-left' || p === 'left' || p === 'bottom-left';
export const isOsmEdgeRow = (p: OsmOverlayPosition) => p === 'top' || p === 'bottom';

/** Hidden by `hideBelow` at the current map width (unknown width = shown, e.g. on the server). */
export function useOsmHiddenBelow(hideBelow: number | undefined): boolean {
  const { transform } = useOpenStreetMapContext();
  const w = transform.view.width;
  return Boolean(hideBelow && w > 0 && w < hideBelow);
}

/**
 * Render `children` where the overlay belongs: in place when the root already
 * docked it, or portalled into the dock when it was rendered inside the SVG.
 */
export function OsmOverlayPlacement({ position, children }: { position: OsmOverlayPosition; children: React.ReactNode }) {
  const inSvg = React.useContext(OsmSvgScopeContext);
  const ctx = useOpenStreetMapContext();
  if (!inSvg) return <>{children}</>;
  const host = ctx.docksReady ? ctx.getDock(position) : null;
  if (!host) return null;
  return createPortal(<OsmSvgScopeContext.Provider value={false}>{children}</OsmSvgScopeContext.Provider>, host);
}

/** Alignment of a dock item along its dock (edge rows push with auto margins). */
export function osmDockItemStyle(position: OsmOverlayPosition, align: 'start' | 'center' | 'end' | undefined): React.CSSProperties {
  if (!align || align === 'start') return {};
  if (isOsmEdgeRow(position)) return align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : { marginLeft: 'auto' };
  return { alignSelf: align === 'center' ? 'center' : isRight(position) ? 'flex-start' : 'flex-end' };
}

function OpenStreetMapOverlay({
  position = 'top-right',
  direction,
  align,
  gap = 6,
  interactive = true,
  hideBelow,
  id,
  className,
  style,
  role,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  'data-gui-node-id': guiNodeId,
  children,
}: OsmOverlayProps) {
  const hidden = useOsmHiddenBelow(hideBelow);
  if (hidden) return null;
  const dir = direction ?? (isOsmEdgeRow(position) ? 'row' : 'column');
  const el = (
    <div
      id={id}
      className={['gui-osm-overlay', `gui-osm-overlay--${position}`, className].filter(Boolean).join(' ')}
      data-gui-component="OpenStreetMapOverlay"
      data-gui-node-id={guiNodeId || undefined}
      data-testid={dataTestId}
      data-osm-overlay={position}
      role={role}
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        flexDirection: dir,
        flexWrap: dir === 'row' ? 'wrap' : 'nowrap',
        gap,
        alignItems: dir === 'row' ? 'center' : isRight(position) ? 'flex-end' : isLeft(position) ? 'flex-start' : 'center',
        justifyContent: dir === 'row' && isRight(position) ? 'flex-end' : 'flex-start',
        minWidth: 0,
        maxWidth: '100%',
        pointerEvents: interactive ? 'auto' : 'none',
        ...osmDockItemStyle(position, align),
        ...style,
      }}
    >
      {children}
    </div>
  );
  return <OsmOverlayPlacement position={position}>{el}</OsmOverlayPlacement>;
}

/** Slot marker read by the map root's partition: render in an HTML dock, not in the SVG. */
OpenStreetMapOverlay.osmSlot = 'overlay' as const;
OpenStreetMapOverlay.osmDefaultPosition = 'top-right' as OsmOverlayPosition;

export default OpenStreetMapOverlay;
