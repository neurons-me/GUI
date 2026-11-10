// The panel that opens from the QR: the QR view (login status in the full
// interface, or namespace + bars on a foreign page) and a separate view for
// `GUI.window.layout.qr.position`. Shared by CleakerCornerGui and Namespace.
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import { GUI_QR_ID, GUI_QR_POSITION_ID } from '@/runtime/guiIds';
import { placeMarks } from '@/gui/Layout/Position/placeMarks';
import { type CleakerCorner } from './cleakerCorner';
import { CLEAKER_BAR_STATES, type CleakerBarId, type CleakerBarState } from './cleakerBars';
import {
  barModeFromCleaker,
  barModeToCleaker,
  CORNER_BAR,
  nextBarMode,
  type BarMode,
} from '@/gui/Layout/Position/barMode';

export type LayoutPlanIcon = { icon: string; label?: string };
export type LayoutPlanBrand = { label?: string; icon?: string };
export type LayoutPlan = {
  left?: LayoutPlanIcon[];
  top?: LayoutPlanIcon[];
  right?: LayoutPlanIcon[];
  bottom?: LayoutPlanIcon[];
  search?: boolean;
  brand?: LayoutPlanBrand | null;
  address?: string;
  footer?: LayoutPlanIcon[];
};

export function panelPositionFor(identitySlot: string, corner: string): Record<string, string | number> {
  // Sit flush against the QR's bar: no inset, so the panel reads as attached
  // to the mark instead of a floating window over the page.
  if (identitySlot === 'left.brand') return { top: 0, left: 72 };
  if (identitySlot === 'top.start') return { top: 52, left: 0 };
  if (identitySlot === 'top.end') return { top: 52, right: 0 };
  if (identitySlot === 'left.footer') return { bottom: 0, left: 72 };
  return { [corner.startsWith('top') ? 'top' : 'bottom']: 52, [corner.endsWith('right') ? 'right' : 'left']: 0 };
}

const iconBtnSx = (active?: boolean) => ({
  display: 'flex',
  p: 0.5,
  border: 'none',
  borderRadius: 1,
  background: 'transparent',
  color: active ? 'primary.main' : 'text.secondary',
  cursor: 'pointer',
  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
});

export type CleakerQrMenuProps = {
  fullPosition: string;
  statusText?: string;
  draft?: string;
  onDraftChange?: (value: string) => void;
  onUseNamespace?: (draft: string) => void;
  showNamespaceForm?: boolean;
  corner: CleakerCorner;
  onMoveTo: (corner: CleakerCorner) => void;
  bars?: { id: CleakerBarId; label: string }[];
  states?: Partial<Record<CleakerBarId, CleakerBarState>>;
  onChooseBar?: (id: CleakerBarId, state: CleakerBarState) => void;
  /** Each position square's bar: off, on (rail), or expanded. */
  barModes?: Partial<Record<CleakerBarId, BarMode>>;
  onChooseBarMode?: (id: CleakerBarId, mode: BarMode) => void;
  onClose?: () => void;
  layout?: LayoutPlan;
  children?: React.ReactNode;
};

export default function CleakerQrMenu({
  fullPosition,
  statusText,
  draft = '',
  onDraftChange,
  onUseNamespace,
  showNamespaceForm = true,
  corner,
  onMoveTo,
  bars,
  states,
  onChooseBar,
  barModes,
  onChooseBarMode,
  onClose,
  layout,
  children,
}: CleakerQrMenuProps) {
  const brand = layout?.brand ?? null;
  const marks = placeMarks({ identity: corner, bars: { top: true, left: true }, brand: true });
  const modeOf = (id: CleakerBarId): BarMode =>
    barModes?.[id] ?? (states?.[id] ? barModeFromCleaker(states[id]) : 'off');
  const canCycleBar = Boolean(onChooseBarMode || onChooseBar);
  const chooseMode = (id: CleakerBarId, mode: BarMode) => {
    if (onChooseBarMode) onChooseBarMode(id, mode);
    else if (onChooseBar) onChooseBar(id, barModeToCleaker(mode));
  };
  const chipSx = (active: boolean, holdsBrand = false, mode: BarMode = 'on') => ({
    appearance: 'none' as const,
    width: 36,
    height: 36,
    p: 0,
    flex: 'none',
    border: mode === 'expanded' ? '2px solid' : '1px solid',
    borderStyle: mode === 'off' ? 'dashed' : 'solid',
    borderColor: active ? 'primary.main' : 'divider',
    borderRadius: 0.75,
    bgcolor: active ? 'primary.main' : holdsBrand ? 'action.hover' : mode === 'expanded' ? 'action.selected' : 'background.paper',
    color: active ? 'primary.contrastText' : 'text.secondary',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: active ? 1 : 0,
    opacity: mode === 'off' && !active ? 0.4 : 1,
    '&:hover': {
      borderColor: 'primary.main',
      bgcolor: active ? 'primary.dark' : 'action.hover',
    },
  });
  const markChip = (at: CleakerCorner, slot: 'left.brand' | 'top.start' | 'top.end' | 'left.footer' | null) => {
    const active = at === corner;
    const holdsBrand = Boolean(slot && marks.brand === slot && !active);
    const bar = CORNER_BAR[at];
    const mode = modeOf(bar);
    const label = `${at.replace('-', ' ')}, ${bar} ${mode}`;
    return (
      <Box
        component="button"
        type="button"
        aria-label={label}
        aria-pressed={active}
        title={holdsBrand ? `${brand?.label || 'Brand'} · ${bar} ${mode}` : label}
        onClick={() => {
          if (at !== corner) {
            onMoveTo(at);
            return;
          }
          if (canCycleBar) chooseMode(bar, nextBarMode(mode));
        }}
        data-corner-choice={at}
        data-bar-id={bar}
        data-bar-mode={mode}
        data-layout-brand={holdsBrand ? '' : undefined}
        sx={chipSx(active, holdsBrand, mode)}
      >
        {active ? <Icon name="qr_code_2" fontSize="0.85rem" /> : holdsBrand ? (
          brand?.icon ? <Icon name={brand.icon} fontSize="0.8rem" /> : <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: 'text.secondary' }} />
        ) : null}
      </Box>
    );
  };
  const hasForm = Boolean(showNamespaceForm && onUseNamespace && onDraftChange);
  const hasBars = Boolean(bars && bars.length > 0 && onChooseBar);
  const [view, setView] = useState<'home' | 'position'>('home');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const showAddress = !children;

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [corner]);

  const onDragStart = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, a, textarea, [data-no-drag]')) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    drag.current = { active: true, sx: event.clientX, sy: event.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onDragMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    setOffset({
      x: drag.current.ox + (event.clientX - drag.current.sx),
      y: drag.current.oy + (event.clientY - drag.current.sy),
    });
  };

  const onDragEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
  };

  return (
    <Paper
      elevation={0}
      role="dialog"
      aria-label=".me"
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      sx={{
        position: 'relative',
        p: 1.25,
        pt: view === 'home' ? 0.75 : 1.25,
        width: 272,
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'background.default',
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        borderRadius: '12px',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      data-cleaker-panel=""
      data-cleaker-drag=""
      data-gui-node-id={GUI_QR_ID}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.25,
          zIndex: 1,
        }}
      >
        {onClose ? (
          <Box
            component="button"
            type="button"
            aria-label="Close"
            title="Close"
            onClick={onClose}
            data-cleaker-close=""
            data-no-drag=""
            sx={iconBtnSx()}
          >
            <Icon name="close" fontSize="1.25rem" />
          </Box>
        ) : null}
        {view === 'home' ? (
          <Box
            component="button"
            type="button"
            aria-label="QR settings"
            title="QR settings"
            onClick={() => setView('position')}
            data-corner-toggle=""
            data-no-drag=""
            sx={iconBtnSx()}
          >
            <Icon name="settings" fontSize="1.25rem" />
          </Box>
        ) : null}
      </Box>
      {view === 'position' ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 4, minHeight: 28 }}>
          <Box
            component="button"
            type="button"
            aria-label="Back"
            title="Back"
            onClick={() => setView('home')}
            data-cleaker-back=""
            data-no-drag=""
            sx={iconBtnSx()}
          >
            <Icon name="arrow_back" fontSize="1.25rem" />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1, userSelect: 'none' }}>
            QR.Position
          </Typography>
        </Box>
      ) : null}
      {view === 'home' ? (
        <>
          {children}
          {showAddress && fullPosition ? (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, userSelect: 'all', wordBreak: 'break-all' }} data-cleaker-full="">
              {fullPosition}
            </Typography>
          ) : null}
          {hasForm && (
            <Box
              component="form"
              sx={{ display: 'flex', gap: 1 }}
              onSubmit={(e: React.FormEvent) => { e.preventDefault(); onUseNamespace!(draft); }}
            >
              <TextField
                size="small"
                fullWidth
                value={draft}
                onChange={(e) => onDraftChange!(e.target.value)}
                placeholder="namespace (e.g. cleaker.me)"
                inputProps={{ 'aria-label': 'Namespace', spellCheck: false, autoCapitalize: 'off' }}
              />
              <Button type="submit" variant="contained" size="small">Use</Button>
            </Box>
          )}
          {showAddress && statusText ? (
            <Typography variant="caption" color="text.secondary" data-cleaker-status="">{statusText}</Typography>
          ) : null}
          {hasBars && (
            <Box role="group" aria-label="Bars" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              {bars!.map((bar) => (
                <Box key={bar.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} data-bar-choice={bar.id}>
                  <Typography variant="caption" sx={{ flex: 1 }}>{bar.label}</Typography>
                  {CLEAKER_BAR_STATES.map((st) => (
                    <Button
                      key={st}
                      size="small"
                      sx={{ minWidth: 0, px: 1 }}
                      variant={states?.[bar.id] === st ? 'contained' : 'text'}
                      onClick={() => onChooseBar!(bar.id, st)}
                      data-bar-state={st}
                    >
                      {st}
                    </Button>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </>
      ) : (
        <Box data-gui-node-id={GUI_QR_POSITION_ID} data-gui-value={corner} sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
          <Box
            id="cleaker-corner-choices"
            role="group"
            aria-label="QR.Position"
            sx={{
              display: 'grid',
              gridTemplateColumns: '36px 36px',
              gridTemplateRows: '36px 36px',
              gap: 0.5,
            }}
          >
            {markChip('top-left', 'left.brand')}
            {markChip('top-right', 'top.end')}
            {markChip('bottom-left', 'left.footer')}
            {markChip('bottom-right', null)}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
