// The 2×2 QR.Position arrange grid: the brand and the QR sit in two of the
// four cells and can be dragged (or clicked / moved with the keyboard)
// independently. Dropping a tile on the other tile swaps them. A cell that
// placeMarks would not honor is shown as not droppable.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import { prefersReducedMotion } from '@/gui/Theme/motion';
import { CORNER_BAR, type BarMode } from './barMode';
import {
  arrangeMove,
  MARK_CORNERS,
  type MarkBars,
  type MarkCorner,
} from './placeMarks';
import { positionSlotChrome } from './positionSlotChrome';

export type PositionGridProps = {
  identity: MarkCorner;
  brand: MarkCorner | null;
  bars: MarkBars;
  narrow?: boolean;
  barModes?: Partial<Record<'top' | 'left' | 'right' | 'bottom', BarMode>>;
  brandLabel?: string;
  brandIcon?: string;
  title?: string;
  onMoveIdentity: (corner: MarkCorner) => void;
  onMoveBrand?: (corner: MarkCorner) => void;
  canCycleBar?: boolean;
  onCycleBar?: (bar: 'top' | 'left' | 'right' | 'bottom', mode: BarMode) => void;
  nextBarMode?: (mode: BarMode) => BarMode;
};

const COLS: MarkCorner[][] = [
  ['top-left', 'top-right'],
  ['bottom-left', 'bottom-right'],
];

function modeOf(
  bar: 'top' | 'left' | 'right' | 'bottom',
  barModes?: PositionGridProps['barModes'],
): BarMode {
  return barModes?.[bar] ?? 'on';
}

export default function PositionGrid({
  identity,
  brand,
  bars,
  narrow = false,
  barModes,
  brandLabel,
  brandIcon,
  title = 'QR.Position',
  onMoveIdentity,
  onMoveBrand,
  canCycleBar,
  onCycleBar,
  nextBarMode,
}: PositionGridProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [picked, setPicked] = useState<'identity' | 'brand' | null>(null);
  const [focusAt, setFocusAt] = useState<MarkCorner>(identity);
  const [drag, setDrag] = useState<{
    who: 'identity' | 'brand';
    x: number;
    y: number;
    over: MarkCorner | null;
  } | null>(null);
  const dragRef = useRef<{
    who: 'identity' | 'brand';
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);
  const skipClick = useRef(false);

  const canPlace = (who: 'identity' | 'brand', at: MarkCorner): boolean => {
    if (who === 'brand' && (brand == null || !onMoveBrand)) return false;
    if (at === (who === 'identity' ? identity : brand)) return true; // home cell
    // A cell is not droppable only when the moving mark itself would not be
    // honored there. Landing on the other tile swaps when the vacated cell
    // is valid, otherwise evicts the other mark — it does not refuse the drop.
    return arrangeMove(who, at, { identity, brand }, { bars, narrow, brand: brand != null }) != null;
  };

  const place = (who: 'identity' | 'brand', at: MarkCorner) => {
    if (who === 'brand' && (!onMoveBrand || brand == null)) return;
    const next = arrangeMove(who, at, { identity, brand }, { bars, narrow, brand: brand != null });
    if (!next) return;
    // Move the other mark first when evicting/swapping, so parent pin logic
    // does not see a collision and rewrite the vacated cell incorrectly.
    if (onMoveBrand && next.brand && next.brand !== brand) onMoveBrand(next.brand);
    if (next.identity !== identity) onMoveIdentity(next.identity);
  };

  useEffect(() => {
    if (!drag) return undefined;
    const onMove = (event: PointerEvent) => {
      const sess = dragRef.current;
      if (!sess) return;
      const dx = event.clientX - sess.startX;
      const dy = event.clientY - sess.startY;
      if (!sess.moved && Math.hypot(dx, dy) < 5) return;
      sess.moved = true;
      let over: MarkCorner | null = null;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const cell = el?.closest?.('[data-corner-choice]') as HTMLElement | null;
      const at = cell?.getAttribute('data-corner-choice');
      if (at === 'top-left' || at === 'top-right' || at === 'bottom-left' || at === 'bottom-right') over = at;
      setDrag({ who: sess.who, x: event.clientX, y: event.clientY, over });
    };
    const onUp = (event: PointerEvent) => {
      const sess = dragRef.current;
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (sess?.moved) {
        // Swallow the click that may follow this pointerup, then clear so a
        // later click is not eaten when the browser (or Playwright) does not
        // dispatch one after a drag.
        skipClick.current = true;
        window.setTimeout(() => { skipClick.current = false; }, 0);
        let over: MarkCorner | null = null;
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const cell = el?.closest?.('[data-corner-choice]') as HTMLElement | null;
        const at = cell?.getAttribute('data-corner-choice');
        if (at === 'top-left' || at === 'top-right' || at === 'bottom-left' || at === 'bottom-right') over = at;
        if (over && over !== (sess.who === 'identity' ? identity : brand) && canPlace(sess.who, over)) {
          place(sess.who, over);
        }
      }
      setDrag(null);
      setPicked(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, identity, brand, bars, narrow, onMoveBrand, onMoveIdentity]);

  const onPointerDown = (who: 'identity' | 'brand', event: React.PointerEvent) => {
    if (event.button !== 0) return;
    dragRef.current = {
      who,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      pointerId: event.pointerId,
    };
    setPicked(who);
    setDrag({ who, x: event.clientX, y: event.clientY, over: who === 'identity' ? identity : brand });
  };

  const onCellClick = (at: MarkCorner) => {
    if (skipClick.current) { skipClick.current = false; return; }
    const who = picked ?? 'identity';
    if (at === (who === 'identity' ? identity : brand)) {
      if (canCycleBar && onCycleBar && nextBarMode) {
        const bar = CORNER_BAR[at];
        onCycleBar(bar, nextBarMode(modeOf(bar, barModes)));
      }
      return;
    }
    if (canPlace(who, at)) place(who, at);
    setPicked(who);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const i = MARK_CORNERS.indexOf(focusAt);
    const col = i % 2;
    const row = Math.floor(i / 2);
    if (event.key === 'ArrowRight' && col === 0) { event.preventDefault(); setFocusAt(MARK_CORNERS[i + 1]); return; }
    if (event.key === 'ArrowLeft' && col === 1) { event.preventDefault(); setFocusAt(MARK_CORNERS[i - 1]); return; }
    if (event.key === 'ArrowDown' && row === 0) { event.preventDefault(); setFocusAt(MARK_CORNERS[i + 2]); return; }
    if (event.key === 'ArrowUp' && row === 1) { event.preventDefault(); setFocusAt(MARK_CORNERS[i - 2]); return; }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const occupant = focusAt === identity ? 'identity' : focusAt === brand ? 'brand' : null;
      if (picked) {
        if (canPlace(picked, focusAt)) place(picked, focusAt);
        setPicked(null);
      } else if (occupant) {
        setPicked(occupant);
      } else {
        if (canPlace('identity', focusAt)) place('identity', focusAt);
      }
    }
    if (event.key === 'Escape') setPicked(null);
  };

  const activeWho = drag?.who ?? picked;
  const ghost = drag && dragRef.current?.moved;

  return (
    <Box data-gui-node-id="" data-position-grid="" sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
      <Box
        ref={rootRef}
        id="cleaker-corner-choices"
        role="grid"
        aria-label={title}
        tabIndex={0}
        onKeyDown={onKeyDown}
        sx={{
          display: 'grid',
          gridTemplateColumns: '36px 36px',
          gridTemplateRows: '36px 36px',
          gap: 0.5,
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3, borderRadius: 1 },
        }}
      >
        {COLS.flat().map((at) => {
          const isIdentity = at === identity;
          const isBrand = brand != null && at === brand;
          const who = isIdentity ? 'identity' as const : isBrand ? 'brand' as const : null;
          const bar = CORNER_BAR[at];
          const mode = modeOf(bar, barModes);
          const dragging = Boolean(activeWho);
          const droppable = !dragging || canPlace(activeWho!, at);
          const targeted = Boolean(drag?.over === at && drag.who && at !== (drag.who === 'identity' ? identity : brand));
          const labelParts = [
            at.replace('-', ' '),
            isIdentity ? 'QR' : isBrand ? (brandLabel || 'Brand') : 'empty',
            `${bar} ${mode}`,
          ];
          if (dragging && !droppable) labelParts.push('not droppable');
          return (
            <Box
              key={at}
              component="button"
              type="button"
              role="gridcell"
              tabIndex={-1}
              aria-label={labelParts.join(', ')}
              aria-pressed={isIdentity}
              aria-selected={focusAt === at || picked === who}
              aria-grabbed={picked === who || drag?.who === who}
              aria-disabled={dragging && !droppable ? true : undefined}
              title={isBrand ? `${brandLabel || 'Brand'} · ${bar} ${mode}` : labelParts.join(', ')}
              data-corner-choice={at}
              data-bar-id={bar}
              data-bar-mode={mode}
              data-layout-brand={isBrand ? '' : undefined}
              data-layout-identity={isIdentity ? '' : undefined}
              data-position-tile={who || undefined}
              data-droppable={droppable ? 'true' : 'false'}
              data-drop-target={targeted && droppable ? '' : undefined}
              onPointerDown={who ? (event) => onPointerDown(who, event) : undefined}
              onClick={() => onCellClick(at)}
              sx={(theme) => {
                const chrome = positionSlotChrome(theme);
                const empty = !isIdentity && !isBrand;
                return {
                  appearance: 'none',
                  width: 36,
                  height: 36,
                  p: 0,
                  flex: 'none',
                  border: mode === 'expanded' || isBrand ? '2px solid' : '1.5px solid',
                  borderStyle: empty || mode === 'off' ? 'dashed' : 'solid',
                  borderColor: isIdentity
                    ? 'primary.main'
                    : isBrand
                      ? chrome.brandBorder
                      : chrome.border,
                  borderRadius: 0.75,
                  bgcolor: isIdentity
                    ? 'primary.main'
                    : isBrand
                      ? chrome.brandFill
                      : chrome.fill,
                  color: isIdentity ? 'primary.contrastText' : isBrand ? chrome.brandInk : 'text.primary',
                  cursor: dragging ? (droppable ? 'copy' : 'not-allowed') : (who ? 'grab' : 'pointer'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: dragging && !droppable ? 0.45 : 1,
                  outline: targeted ? '2px solid' : focusAt === at && !drag ? '2px solid' : 'none',
                  outlineColor: targeted && droppable ? 'primary.main' : targeted ? 'text.disabled' : 'text.secondary',
                  outlineOffset: 1,
                  boxShadow: isIdentity ? 1 : 0,
                  '&:hover': empty && !dragging ? { bgcolor: 'action.hover', borderColor: chrome.border } : undefined,
                };
              }}
            >
              {isIdentity ? <Icon name="qr_code_2" fontSize="0.85rem" /> : isBrand ? (
                brandIcon ? <Icon name={brandIcon} fontSize="0.8rem" /> : (
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'primary.main' }} />
                )
              ) : null}
            </Box>
          );
        })}
      </Box>
      {ghost && typeof document !== 'undefined' ? createPortal(
        <Box
          data-position-ghost=""
          aria-hidden
          sx={(theme) => {
            const chrome = positionSlotChrome(theme);
            const isQr = drag!.who === 'identity';
            return {
              position: 'fixed',
              left: drag!.x - 18,
              top: drag!.y - 18,
              width: 36,
              height: 36,
              borderRadius: 0.75,
              border: '2px solid',
              borderColor: isQr ? 'primary.main' : chrome.brandBorder,
              bgcolor: isQr ? 'primary.main' : chrome.brandFill,
              color: isQr ? 'primary.contrastText' : chrome.brandInk,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 4000,
              boxShadow: 4,
              transition: prefersReducedMotion() ? 'none' : undefined,
            };
          }}
        >
          {drag!.who === 'identity' ? <Icon name="qr_code_2" fontSize="0.85rem" /> : (
            brandIcon ? <Icon name={brandIcon} fontSize="0.8rem" /> : (
              <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'primary.main' }} />
            )
          )}
        </Box>,
        document.body,
      ) : null}
    </Box>
  );
}
