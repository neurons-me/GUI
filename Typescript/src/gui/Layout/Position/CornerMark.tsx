// The person's QR in a corner: the trigger (the QR badge) and the menu that
// unfolds from it (CleakerQrMenu). The trigger is what the bars hold; the menu
// portals out so a bar's overflow cannot clip it. Shared by AppShell. The
// brand is not this menu: it unfolds its icons in the bar it sits on.
import React, { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@/gui/Atoms/Box/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { isMenuBoundsChrome } from '@/gui/All.This/Cleaker/Corner/menuSize';
import CleakerQrMenu, {
  panelPositionFor,
  type CleakerQrMenuProps,
} from '@/gui/All.This/Cleaker/Corner/CleakerQrMenu';
import type { MarkCorner, MarkSlot } from './placeMarks';

/** Portal target inside the theme, so a bar's overflow cannot clip the menu and the menu keeps the theme. */
export const CornerMarkHostContext = React.createContext<HTMLElement | null>(null);

export function CornerMarkHost({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => { setNode(ref.current); }, []);
  return (
    <CornerMarkHostContext.Provider value={node}>
      {children}
      <div ref={ref} data-corner-mark-host="" />
    </CornerMarkHostContext.Provider>
  );
}


export type CornerMarkProps = {
  /** The QR's corner. */
  corner: MarkCorner;
  onMoveTo: (corner: MarkCorner) => void;
  onMoveBrand?: (corner: MarkCorner) => void;
  /** The brand's corner, shown in the placement grid. */
  otherCorner?: MarkCorner | null;
  /** The bar slot this trigger sits in, so the menu attaches flush to it. */
  slot: MarkSlot | string;
  /** The visible mark (the QR badge). */
  trigger: React.ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Home-view content (the QR's login status). */
  children?: React.ReactNode;
  fullPosition?: string;
  label?: string;
} & Pick<
  CleakerQrMenuProps,
  | 'statusText'
  | 'draft'
  | 'onDraftChange'
  | 'onUseNamespace'
  | 'showNamespaceForm'
  | 'bars'
  | 'states'
  | 'onChooseBar'
  | 'barModes'
  | 'onChooseBarMode'
  | 'layout'
  | 'nodeId'
  | 'positionNodeId'
  | 'width'

  | 'settingsExtra'
  | 'view'
  | 'onViewChange'
  | 'onSignOut'>;

export default function CornerMark({
  corner,
  onMoveTo,
  onMoveBrand,
  otherCorner,
  slot,
  trigger,
  open,
  onOpenChange,
  children,
  fullPosition,
  label,
  ...menuProps
}: CornerMarkProps) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const prev = trigger as React.ReactElement<Record<string, unknown>>;
  const setRefs = (node: HTMLElement | null) => {
    triggerRef.current = node;
    const inherited = (prev as { ref?: unknown }).ref ?? prev.props.ref;
    if (typeof inherited === 'function') inherited(node);
    else if (inherited && typeof inherited === 'object' && 'current' in (inherited as object)) {
      (inherited as { current: HTMLElement | null }).current = node;
    }
  };
  const boundTrigger = React.cloneElement(prev, {
    ref: setRefs,
    'aria-expanded': open,
    'aria-haspopup': 'dialog',
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      const inherited = prev.props.onClick as ((e: React.MouseEvent<HTMLElement>) => void) | undefined;
      inherited?.(event);
      onOpenChange(!open);
    },
  } as Partial<typeof prev.props>);

  const host = useContext(CornerMarkHostContext);
  const mount = host ?? (typeof document !== 'undefined' ? document.body : null);
  const menu = open && mount ? createPortal(
    <ClickAwayListener
      onClickAway={(event) => {
        const target = event.target;
        if (triggerRef.current && target instanceof Node && triggerRef.current.contains(target)) return;
        if (isMenuBoundsChrome(target)) return;
        onOpenChange(false);
      }}
    >
      <Box sx={{ position: 'fixed', zIndex: (theme: any) => (theme.zIndex?.modal ?? 1300) + 1, ...panelPositionFor(String(slot), corner) }}>
        <CleakerQrMenu
          fullPosition={fullPosition ?? ''}
          showNamespaceForm={menuProps.showNamespaceForm ?? true}
          corner={corner}
          onMoveTo={onMoveTo}
          onMoveBrand={onMoveBrand}
          onClose={() => onOpenChange(false)}
          otherCorner={otherCorner}
          layout={menuProps.layout ?? (label ? { brand: { label } } : undefined)}
          statusText={menuProps.statusText}
          draft={menuProps.draft}
          onDraftChange={menuProps.onDraftChange}
          onUseNamespace={menuProps.onUseNamespace}
          bars={menuProps.bars}
          states={menuProps.states}
          onChooseBar={menuProps.onChooseBar}
          barModes={menuProps.barModes}
          onChooseBarMode={menuProps.onChooseBarMode}
          nodeId={menuProps.nodeId}
          positionNodeId={menuProps.positionNodeId}
          width={menuProps.width}
          settingsExtra={menuProps.settingsExtra}
          view={menuProps.view}
          onViewChange={menuProps.onViewChange}
          onSignOut={menuProps.onSignOut}
        >
          {children}
        </CleakerQrMenu>
      </Box>
    </ClickAwayListener>,
    mount,
  ) : null;

  return (
    <>
      {boundTrigger}
      {menu}
    </>
  );
}
