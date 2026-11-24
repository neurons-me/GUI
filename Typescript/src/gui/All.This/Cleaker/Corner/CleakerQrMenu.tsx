// The panel that opens from the person's QR: the home view (login status) and
// a separate view for the QR's position. Default props keep the QR's look and
// behaviour. The placement grid also shows where the brand sits (`otherCorner`).
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import { GUI_QR_ID, GUI_QR_POSITION_ID } from '@/runtime/guiIds';
import { useKeysRowMode } from '@/gui/Layout/Position/keysRowMode';

import { cornerOfSlot, placeMarks } from '@/gui/Layout/Position/placeMarks';
import PositionGrid from '@/gui/Layout/Position/PositionGrid';
import { useNarrowBars } from '@/gui/Layout/Position/Position';
import { type CleakerCorner } from './cleakerCorner';
import NodeTip from '../NodeTip';
import { CLEAKER_BAR_STATES, type CleakerBarId, type CleakerBarState } from './cleakerBars';
import {
  barModeFromCleaker,
  barModeToCleaker,
  CORNER_BAR,
  nextBarMode,
  type BarMode,
} from '@/gui/Layout/Position/barMode';
import { prefersReducedMotion } from '@/gui/Theme/motion';
import { ThemeSettingsSection } from '@/gui/Theme/Launcher/ThemeLauncher';
import { QrMenuMotionCtx } from './menuMotion';
import {
  MENU_SIDE_GUTTER,
  availableMenuWidth,
  hermiteToRest,
  measureMenuClone,
  MENU_READY_VEL,
  MENU_REVERSE_MS,
  placeMenuCard,
  fitMenuCard,
  clampRectToBounds,
  readMenuBounds,
  sameMenuBounds,
  MENU_BAR_SELECTORS,
  springSettled,
  stepCriticalSpring,
} from './menuSize';

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
  if (identitySlot === 'right.brand') return { top: 0, right: 72 };
  if (identitySlot === 'top.start') return { top: 52, left: 0 };
  if (identitySlot === 'top.end') return { top: 52, right: 0 };
  if (identitySlot === 'left.footer') return { bottom: 0, left: 72 };
  if (identitySlot === 'right.footer') return { bottom: 0, right: 72 };
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
  /** Move the brand mark independently of the QR. */
  onMoveBrand?: (corner: CleakerCorner) => void;
  bars?: { id: CleakerBarId; label: string }[];
  states?: Partial<Record<CleakerBarId, CleakerBarState>>;
  onChooseBar?: (id: CleakerBarId, state: CleakerBarState) => void;
  /** Each position square's bar: off, on (rail), or expanded. */
  barModes?: Partial<Record<CleakerBarId, BarMode>>;
  onChooseBarMode?: (id: CleakerBarId, mode: BarMode) => void;
  onClose?: () => void;
  layout?: LayoutPlan;
  children?: React.ReactNode;
  /**
   * The brand's corner, so the placement grid can show both. When omitted, the
   * brand is shown at its coupled default (opposite the QR).
   */
  otherCorner?: CleakerCorner | null;
  /** Settings-view title. Default `QR.Position`. */
  positionTitle?: string;
  /** Settings-button label. Default `QR settings`. */
  settingsLabel?: string;
  /** data-gui-node-id for the panel. Default is the QR's id. */
  nodeId?: string;
  positionNodeId?: string;
  /**
   * Optional cap on the panel width, in px. When omitted, the card sizes to its
   * content (QR, icon row, tree level, settings) with a min of the QR plus the
   * control column, up to the viewport. Prefer omitting this so the card can
   * follow the tree.
   */
  width?: number;
  /** More settings under the QR's position, after the Theme section (which is always shown). */
  settingsExtra?: React.ReactNode;
  /**
   * The open view, when the owner keeps it (controlled). Moving the QR to another corner re-mounts the card in the new
   * bar, so the owner holds the view and the card stays in its settings while the QR moves.
   */
  view?: 'home' | 'position';
  onViewChange?: (view: 'home' | 'position') => void;
  /** Sign out, as a small icon under the settings gear (instead of a button in the card's content). */
  onSignOut?: () => void;
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
  onMoveBrand,
  bars,
  states,
  onChooseBar,
  barModes,
  onChooseBarMode,
  onClose,
  layout,
  children,
  otherCorner,
  positionTitle,
  settingsLabel,
  nodeId,
  positionNodeId,
  width: widthCap,
  settingsExtra,
  view: viewProp,
  onViewChange,
  onSignOut,
}: CleakerQrMenuProps) {
  const brand = layout?.brand ?? null;
  const coupled = placeMarks({
    identity: corner,
    bars: { top: true, left: true },
    brand: true,
  });
  const identityAt: CleakerCorner = corner;
  const brandAt: CleakerCorner | null = otherCorner ?? (coupled.brand !== 'none' ? cornerOfSlot(coupled.brand, corner) : null);
  const narrow = useNarrowBars();
  const title = positionTitle ?? 'QR.Position';
  const settings = settingsLabel ?? 'QR settings';
  const [rowMode, setRowMode] = useKeysRowMode();
  const panelId = nodeId ?? GUI_QR_ID;
  const posId = positionNodeId ?? GUI_QR_POSITION_ID;
  const modeOf = (id: CleakerBarId): BarMode =>
    barModes?.[id] ?? (states?.[id] ? barModeFromCleaker(states[id]) : 'off');
  const canCycleBar = Boolean(onChooseBarMode || onChooseBar);
  const chooseMode = (id: CleakerBarId, mode: BarMode) => {
    if (onChooseBarMode) onChooseBarMode(id, mode);
    else if (onChooseBar) onChooseBar(id, barModeToCleaker(mode));
  };
  const hasForm = Boolean(showNamespaceForm && onUseNamespace && onDraftChange);
  const hasBars = Boolean(bars && bars.length > 0 && onChooseBar);
  const [ownView, setOwnView] = useState<'home' | 'position'>('home');
  const view = viewProp ?? ownView;
  const setView = (next: 'home' | 'position') => { setOwnView(next); onViewChange?.(next); };
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0, px: 0, py: 0, cx: 0, cy: 0, headerShift: 0 });
  const showAddress = !children;
  const paperRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [maxWidthPx, setMaxWidthPx] = useState<number | undefined>();
  const [box, setBox] = useState<{ w: number; h: number; left: number; top: number } | null>(null);
  const boxRef = useRef(box);
  boxRef.current = box;
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const anchorRef = useRef<{ qrX: number; top: number } | null>(null);
  const rafRef = useRef(0);
  const targetRef = useRef<{ w: number; h: number } | null>(null);
  const springWRef = useRef({ x: 0, v: 0 });
  const springHRef = useRef({ x: 0, v: 0 });
  const lastTRef = useRef(0);
  const tweenRef = useRef<{ t0: number; T: number; w0: number; h0: number; w1: number; h1: number } | null>(null);
  const [settled, setSettled] = useState(true);
  const settledRef = useRef(true);

  const applyMenuMax = (el: HTMLElement, max: number) => {
    el.style.setProperty('--qr-menu-max-width', `${max}px`);
    const inner = el.querySelector('[data-cleaker-panel-body]') as HTMLElement | null;
    const cs = inner ? getComputedStyle(inner) : null;
    const pad = cs ? (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) : 0;
    el.style.setProperty('--qr-menu-content-max', `${Math.max(0, max - pad)}px`);
  };

  const writeShift = (paper: HTMLElement, x: number, y: number, headerShift = 0) => {
    paper.setAttribute('data-qr-shift-x', String(Math.round(x)));
    paper.setAttribute('data-qr-shift-y', String(Math.round(y)));
    // Keeps the QR and the level-1 icon row on the resting axis when the
    // paper itself is pushed or viewport-clamped.
    paper.style.setProperty('--qr-header-shift', `${headerShift}px`);
  };

  const finishPlace = (
    placed: { left: number; top: number; w: number; h: number; qrShiftX?: number; qrShiftY?: number },
    C: number,
    commit: boolean,
  ) => {
    // Bounds already include the live bars, or the viewport when there are none.
    const mid = placed.left + placed.w / 2;
    const paper = paperRef.current;
    // Keep the header on C when C still falls inside the card; otherwise
    // park it as close as the card's own box allows (narrow windows).
    // Margin is half of the QR or the action row, plus air for dock scale
    // and focus rings, so hover/selected contours stay inside the paper.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const air = 0.5 * rem;
    const qrEl = paper?.querySelector<HTMLElement>('[data-qr-anchor]');
    const rowEl = paper?.querySelector<HTMLElement>('[data-identity-actions]');
    const qrHalf = qrEl ? qrEl.getBoundingClientRect().width / 2 : 0;
    const rowHalf = rowEl ? rowEl.getBoundingClientRect().width / 2 : 0;
    const margin = Math.min(placed.w / 2, Math.max(48, qrHalf, rowHalf) + air);
    const headerShift = Math.max(-placed.w / 2 + margin, Math.min(placed.w / 2 - margin, C - mid));
    if (commit && paper) {
      // Write geometry in the same turn as --qr-header-shift so the header
      // never lags a frame behind the paper (that slip moved Keys mid-open).
      paper.style.position = 'fixed';
      paper.style.left = `${placed.left + offsetRef.current.x}px`;
      paper.style.top = `${placed.top + offsetRef.current.y}px`;
      paper.style.width = `${placed.w}px`;
      paper.style.height = `${placed.h}px`;
      writeShift(paper, placed.qrShiftX ?? 0, placed.qrShiftY ?? 0, headerShift);
    }
    return { w: placed.w, h: placed.h, left: placed.left, top: placed.top };
  };

  const placeSize = (w: number, h: number, commit = true) => {
    const bounds = readMenuBounds();
    const availW = Math.max(0, bounds.right - bounds.left);
    const availH = Math.max(0, bounds.bottom - bounds.top);
    const cw = Math.min(w, availW);
    const ch = Math.min(h, availH);
    const a = anchorRef.current;
    const cur = boxRef.current;
    if (!a) {
      const paper = paperRef.current;
      const pr = paper?.getBoundingClientRect();
      const qr = paper?.querySelector<HTMLElement>('[data-gui-node-id$=".qr"], svg[aria-label="QR code"]');
      const qrR = qr?.getBoundingClientRect();
      const qrX = qrR ? qrR.left + qrR.width / 2 : (pr ? pr.left + pr.width / 2 : cw / 2);
      const top = pr?.top ?? 0;
      const placed0 = placeMenuCard({ w: cw, h: ch, qrCenterX: qrX, cardTop0: top, bounds });
      const view0 = finishPlace({ ...placed0, qrShiftX: 0, qrShiftY: 0 }, placed0.left + placed0.w / 2, commit);
      const dLeft = view0.left - placed0.left;
      anchorRef.current = { qrX: placed0.left + placed0.w / 2 + dLeft, top: view0.top };
      return view0;
    }
    const sizeChanged = !cur || Math.abs(cur.w - cw) > 0.5 || Math.abs(cur.h - ch) > 0.5;
    const placed = sizeChanged
      // Size change: expand/shrink around the QR, then fit to the live bars.
      ? placeMenuCard({ w: cw, h: ch, qrCenterX: a.qrX, cardTop0: a.top, bounds })
      // Bounds-only change: keep the current box, push only if it no longer fits.
      : fitMenuCard({ left: cur.left, top: cur.top, w: cw, h: ch, bounds, qrCenterX: a.qrX });
    return finishPlace(placed, a.qrX, commit);
  };

  const markMotion = (nextSettled: boolean) => {
    settledRef.current = nextSettled;
    setSettled((prev) => (prev === nextSettled ? prev : nextSettled));
    const paper = paperRef.current;
    if (paper) paper.setAttribute('data-menu-motion', nextSettled ? 'settled' : 'busy');
  };

  const applyBox = (w: number, h: number, commit = true) => {
    // A user drag moves the card as a rigid body; do not re-place around the
    // old QR axis (that is what left the header behind the paper).
    if (drag.current.active) {
      clampActiveDragRef.current();
      return boxRef.current;
    }
    const placed = placeSize(w, h, commit);
    boxRef.current = placed;
    setBox(placed);
    return placed;
  };

  const isReady = (w: { x: number; v: number }, h: { x: number; v: number }, tw: { w: number; h: number }) => (
    Math.abs(w.x - tw.w) < 0.5
    && Math.abs(h.x - tw.h) < 0.5
    && Math.hypot(w.v, h.v) < MENU_READY_VEL
  );

  const finishMotion = (tw: { w: number; h: number }) => {
    springWRef.current = { x: tw.w, v: 0 };
    springHRef.current = { x: tw.h, v: 0 };
    tweenRef.current = null;
    applyBox(tw.w, tw.h, true);
    rafRef.current = 0;
    markMotion(true);
  };

  const tickSpring = (now: number) => {
    const tw = targetRef.current;
    if (!tw) { rafRef.current = 0; return; }
    const tween = tweenRef.current;
    if (tween) {
      const T = tween.T / 1000;
      const tau = T > 0 ? (now - tween.t0) / tween.T : 1;
      const nextW = hermiteToRest(tween.w0, 0, tween.w1, tau, T);
      const nextH = hermiteToRest(tween.h0, 0, tween.h1, tau, T);
      springWRef.current = nextW;
      springHRef.current = nextH;
      applyBox(nextW.x, nextH.x, true);
      if (tau >= 1 || isReady(nextW, nextH, tw)) { finishMotion(tw); return; }
      rafRef.current = requestAnimationFrame(tickSpring);
      return;
    }
    const last = lastTRef.current || now;
    lastTRef.current = now;
    let dt = (now - last) / 1000;
    if (dt > 0.064) dt = 0.064;
    if (dt < 0) dt = 0;
    const nextW = stepCriticalSpring(springWRef.current, tw.w, dt);
    const nextH = stepCriticalSpring(springHRef.current, tw.h, dt);
    springWRef.current = nextW;
    springHRef.current = nextH;
    applyBox(nextW.x, nextH.x, true);
    if (isReady(nextW, nextH, tw) || (springSettled(nextW, tw.w) && springSettled(nextH, tw.h))) {
      finishMotion(tw);
      return;
    }
    rafRef.current = requestAnimationFrame(tickSpring);
  };

  const goTo = (target: { w: number; h: number }, instant: boolean) => {
    const bounds = readMenuBounds();
    const tw = {
      w: Math.min(target.w, Math.max(0, bounds.right - bounds.left)),
      h: Math.min(target.h, Math.max(0, bounds.bottom - bounds.top)),
    };
    targetRef.current = tw;
    const reduced = prefersReducedMotion();
    const from = boxRef.current;
    if (instant || reduced || !from) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
      tweenRef.current = null;
      finishMotion(tw);
      return;
    }
    if (Math.abs(springWRef.current.x - from.w) > 1) springWRef.current = { x: from.w, v: springWRef.current.v };
    if (Math.abs(springHRef.current.x - from.h) > 1) springHRef.current = { x: from.h, v: springHRef.current.v };
    if (isReady(springWRef.current, springHRef.current, tw)) {
      finishMotion(tw);
      return;
    }
    const awayW = springWRef.current.v * (tw.w - springWRef.current.x) < 0;
    const awayH = springHRef.current.v * (tw.h - springHRef.current.x) < 0;
    if (awayW || awayH) {
      // Mid-reversal: brake immediately (drop the departing velocity) and
      // run a short tween from the current size to the new target.
      if (awayW) springWRef.current = { x: springWRef.current.x, v: 0 };
      if (awayH) springHRef.current = { x: springHRef.current.x, v: 0 };
      tweenRef.current = {
        t0: performance.now(),
        T: MENU_REVERSE_MS,
        w0: springWRef.current.x,
        h0: springHRef.current.x,
        w1: tw.w,
        h1: tw.h,
      };
    } else {
      tweenRef.current = null;
    }
    markMotion(false);
    if (!rafRef.current) {
      lastTRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tickSpring);
    }
  };

  const requestMeasure = (instant = false) => {
    if (drag.current.active) return;
    const paper = paperRef.current;
    const body = bodyRef.current;
    if (!paper || !body) return;
    const max = availableMenuWidth(paper, widthCap);
    setMaxWidthPx((prev) => (prev === max ? prev : max));
    applyMenuMax(paper, max);
    const next = measureMenuClone(body, paper, max);
    const prev = targetRef.current;
    if (prev && Math.abs(prev.w - next.w) < 0.5 && Math.abs(prev.h - next.h) < 0.5 && (instant || rafRef.current || settledRef.current)) {
      if (instant && boxRef.current) goTo(next, true);
      return;
    }
    goTo(next, instant || !boxRef.current);
  };
  const requestMeasureRef = useRef(requestMeasure);
  requestMeasureRef.current = requestMeasure;
  const applyBoxRef = useRef(applyBox);
  applyBoxRef.current = applyBox;

  const motionApi = React.useMemo(
    () => ({ settled, requestMeasure: () => requestMeasureRef.current(false) }),
    [settled],
  );

  useLayoutEffect(() => {
    setOffset({ x: 0, y: 0 });
    anchorRef.current = null;
    targetRef.current = null;
  }, [corner]);

  useLayoutEffect(() => {
    requestMeasureRef.current(!boxRef.current);
  }, [widthCap, view, corner]);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const mo = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => requestMeasureRef.current(false))
      : null;
    mo?.observe(body, { childList: true, subtree: true });
    const onWin = () => {
      requestMeasureRef.current(true);
      const cur = boxRef.current;
      if (cur) applyBoxRef.current(cur.w, cur.h, true);
    };
    window.addEventListener('resize', onWin);
    window.addEventListener('orientationchange', onWin);
    visualViewport?.addEventListener('resize', onWin);

    // Follow the bars as they animate: observe their boxes and keep
    // re-fitting on rAF until the bound has settled, so the panel never
    // waits for the end and jumps.
    let boundsRaf = 0;
    let lastBounds = readMenuBounds();
    let quiet = 0;
    const fitToLiveBounds = () => {
      if (drag.current.active) {
        clampActiveDragRef.current();
        return;
      }
      const cur = boxRef.current;
      if (cur) applyBoxRef.current(cur.w, cur.h, true);
    };
    const tickBounds = () => {
      boundsRaf = 0;
      const next = readMenuBounds();
      if (!sameMenuBounds(next, lastBounds)) {
        lastBounds = next;
        quiet = 0;
        fitToLiveBounds();
      } else {
        quiet += 1;
      }
      if (quiet < 4) boundsRaf = requestAnimationFrame(tickBounds);
    };
    const kickBounds = () => {
      quiet = 0;
      // ResizeObserver runs after layout and before paint: fit now so the
      // panel moves with the bar in the same frame instead of trailing by one.
      const next = readMenuBounds();
      if (!sameMenuBounds(next, lastBounds)) {
        lastBounds = next;
        fitToLiveBounds();
      }
      if (!boundsRaf) boundsRaf = requestAnimationFrame(tickBounds);
    };
    const barRo = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(kickBounds) : null;
    const watchBars = () => {
      barRo?.disconnect();
      Object.values(MENU_BAR_SELECTORS).forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => barRo?.observe(el));
      });
      kickBounds();
    };
    watchBars();
    const barMo = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(watchBars)
      : null;
    barMo?.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo?.disconnect();
      barMo?.disconnect();
      barRo?.disconnect();
      if (boundsRaf) cancelAnimationFrame(boundsRaf);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('orientationchange', onWin);
      visualViewport?.removeEventListener('resize', onWin);
    };
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const clampActiveDrag = () => {
    if (!drag.current.active) return;
    const cur = boxRef.current;
    const paper = paperRef.current;
    if (!cur || !paper) return;
    const desired = {
      left: cur.left + drag.current.px,
      top: cur.top + drag.current.py,
      w: cur.w,
      h: cur.h,
    };
    const frozen = drag.current.headerShift;
    // Fit against the live bounds, then rebase C onto this dragged box so the
    // header is not pinned to the pre-drag axis (that lag is what Sui saw).
    const mid0 = desired.left + desired.w / 2;
    const placed = fitMenuCard({
      ...desired,
      bounds: readMenuBounds(),
      qrCenterX: mid0 + frozen,
    });
    const mid = placed.left + placed.w / 2;
    if (anchorRef.current) {
      anchorRef.current = { qrX: mid + frozen, top: placed.top };
    } else {
      anchorRef.current = { qrX: mid + frozen, top: placed.top };
    }
    const nextOff = { x: placed.left - cur.left, y: placed.top - cur.top };
    offsetRef.current = nextOff;
    setOffset(nextOff);
    paper.style.position = 'fixed';
    paper.style.left = `${placed.left}px`;
    paper.style.top = `${placed.top}px`;
    paper.style.width = `${placed.w}px`;
    paper.style.height = `${placed.h}px`;
    paper.style.transition = 'none';
    paper.setAttribute('data-cleaker-dragging', '');
    // Same turn as left/top: keep the in-card header offset constant (rigid body).
    writeShift(paper, 0, 0, frozen);
    // If the pointer went past a bound, rebase so a reverse moves the card
    // immediately (no invisible accumulated distance, no jump).
    if (Math.abs(placed.left - desired.left) > 0.5 || Math.abs(placed.top - desired.top) > 0.5) {
      drag.current.ox = placed.left - cur.left;
      drag.current.oy = placed.top - cur.top;
      drag.current.px = drag.current.ox;
      drag.current.py = drag.current.oy;
      drag.current.sx = drag.current.cx;
      drag.current.sy = drag.current.cy;
    }
    if (Math.abs(placed.w - cur.w) > 0.5 || Math.abs(placed.h - cur.h) > 0.5) {
      const nextBox = { left: cur.left, top: cur.top, w: placed.w, h: placed.h };
      boxRef.current = nextBox;
      setBox(nextBox);
    }
  };
  const clampActiveDragRef = useRef(clampActiveDrag);
  clampActiveDragRef.current = clampActiveDrag;

  const onDragStart = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, a, textarea, label, [data-no-drag], [data-cleaker-full], [role="button"], [data-dock-avatar], [data-dock-item], [contenteditable="true"]')) return;
    let node: HTMLElement | null = target;
    while (node && node !== event.currentTarget) {
      const us = getComputedStyle(node).userSelect;
      if (us === 'all' || us === 'text') return;
      node = node.parentElement;
    }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    const paper = paperRef.current;
    const hs = paper ? (parseFloat(getComputedStyle(paper).getPropertyValue('--qr-header-shift')) || 0) : 0;
    drag.current = {
      active: true,
      sx: event.clientX,
      sy: event.clientY,
      ox: offset.x,
      oy: offset.y,
      px: offset.x,
      py: offset.y,
      cx: event.clientX,
      cy: event.clientY,
      headerShift: hs,
    };
    setDragging(true);
    // Rebase C onto the current box immediately, before the first move.
    const cur = boxRef.current;
    if (cur && paper) {
      const mid = cur.left + offset.x + cur.w / 2;
      anchorRef.current = { qrX: mid + hs, top: cur.top + offset.y };
      paper.style.transition = 'none';
      paper.setAttribute('data-cleaker-dragging', '');
      writeShift(paper, 0, 0, hs);
    }
  };

  const onDragMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    drag.current.cx = event.clientX;
    drag.current.cy = event.clientY;
    drag.current.px = drag.current.ox + (event.clientX - drag.current.sx);
    drag.current.py = drag.current.oy + (event.clientY - drag.current.sy);
    clampActiveDrag();
  };

  const onDragEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* ignore */ }
    const dx = offsetRef.current.x;
    const dy = offsetRef.current.y;
    if (dx || dy) {
      const cur = boxRef.current;
      if (cur) {
        const parked = { ...cur, left: cur.left + dx, top: cur.top + dy };
        const next = clampRectToBounds(parked, readMenuBounds());
        const adx = next.left - cur.left;
        const ady = next.top - cur.top;
        boxRef.current = next;
        setBox(next);
        const paper = paperRef.current;
        if (paper) {
          paper.style.left = `${next.left}px`;
          paper.style.top = `${next.top}px`;
          paper.style.transition = 'none';
          writeShift(paper, 0, 0, drag.current.headerShift);
          paper.removeAttribute('data-cleaker-dragging');
        }
        const frozen = drag.current.headerShift;
        anchorRef.current = { qrX: next.left + next.w / 2 + frozen, top: next.top };
      } else if (anchorRef.current) {
        anchorRef.current = { qrX: anchorRef.current.qrX + dx, top: anchorRef.current.top + dy };
      }
      setOffset({ x: 0, y: 0 });
    }
    paperRef.current?.removeAttribute('data-cleaker-dragging');
  };

  return (
    <QrMenuMotionCtx.Provider value={motionApi}>
    <Paper
      ref={paperRef}
      elevation={0}
      role="dialog"
      aria-label=".me"
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      sx={{
        position: box ? 'fixed' : 'relative',
        p: 0,
        left: box ? box.left + offset.x : undefined,
        top: box ? box.top + offset.y : undefined,
        width: box?.w,
        height: box?.h,
        minWidth: box ? 0 : '17rem',
        maxWidth: box ? undefined : (maxWidthPx ?? 'calc(100vw - 1.5rem)'),
        maxHeight: box ? undefined : 'calc(100vh - 1.5rem)',
        overflow: 'hidden',
        overflowX: 'hidden',
        overflowY: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        bgcolor: 'background.default',
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        borderRadius: '12px',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: dragging ? 'none' : undefined,
        '& [data-qr-anchor], & [data-identity-row]': { transition: 'none' },
      }}
      data-cleaker-panel=""
      data-cleaker-drag=""
      data-menu-motion={settled ? 'settled' : 'busy'}
      data-gui-node-id={panelId}
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
            aria-label={settings}
            title={settings}
            onClick={() => setView('position')}
            data-corner-toggle=""
            data-no-drag=""
            sx={iconBtnSx()}
          >
            <Icon name="settings" fontSize="1.25rem" />
          </Box>
        ) : null}
        {view === 'home' && onSignOut ? (
          <NodeTip name="Sign out" placement="left">
            <Box
              component="button"
              type="button"
              aria-label="Sign out"
              onClick={onSignOut}
              data-cleaker-signout=""
              data-no-drag=""
              data-gui-node-id={`${panelId}.logout`}
              sx={iconBtnSx()}
            >
              <Icon name="logout" fontSize="1.25rem" />
            </Box>
          </NodeTip>
        ) : null}
      </Box>
      <Box
        ref={bodyRef}
        data-cleaker-panel-body=""
        sx={{
          p: 1.25,
          pt: view === 'home' ? 0.75 : 1.25,
          px: MENU_SIDE_GUTTER,
          // Same air under the last keys row as on the sides, in rem.
          pb: MENU_SIDE_GUTTER,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
          minWidth: box ? 0 : '17rem',
          maxWidth: '100%',
          boxSizing: 'border-box',
          // Fill the paper so only the tree (not the QR) scrolls when the
          // card is at its max height.
          flex: '1 1 auto',
          minHeight: 0,
          alignItems: 'center',
          overflow: 'hidden',
          ...(view === 'home' ? {
            // Collapsed: no reserved tree slot. Bottom air is a rem token
            // slightly larger than pt (0.75 spacing = 6px; 0.75rem = 12px).
            // Expanded keys keep MENU_SIDE_GUTTER via the default pb above.
            '&:not(:has([data-keys-phase="open"]))': {
              pb: '0.75rem',
            },
            '& > *': {
              flex: '1 1 auto',
              minHeight: 0,
              maxHeight: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible',
            },
          } : {}),
        }}
      >
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
            {title}
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
        <Box data-gui-node-id={posId} data-gui-value={corner}>
          <PositionGrid
            identity={identityAt}
            brand={brand ? brandAt : null}
            bars={{ top: modeOf('top') !== 'off', left: modeOf('left') !== 'off', right: modeOf('right') !== 'off' }}
            narrow={narrow}
            barModes={{ top: modeOf('top'), left: modeOf('left'), right: modeOf('right'), bottom: modeOf('bottom') }}
            brandLabel={brand?.label}
            brandIcon={brand?.icon}
            title={title}
            onMoveIdentity={onMoveTo}
            onMoveBrand={brand ? onMoveBrand : undefined}
            canCycleBar={canCycleBar}
            onCycleBar={(bar, mode) => chooseMode(bar, mode)}
            nextBarMode={nextBarMode}
          />
        </Box>
      )}
      {view === 'position' ? (
        <Box
          data-no-drag=""
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 1,
            pt: 0.75,
            width: '100%',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
        <Box
          role="group"
          aria-label="Tree levels"
          data-keys-row-mode-setting=""
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flex: '0 0 auto' }}
        >
          <NodeTip name="Tree levels" placement="top">
            <Box
              component="span"
              tabIndex={0}
              aria-label="Tree levels"
              sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.secondary', lineHeight: 0, flex: '0 0 auto' }}
            >
              <Icon name="account_tree" fontSize="1rem" />
            </Box>
          </NodeTip>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              p: '0.125rem',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '999px',
              bgcolor: 'action.hover',
            }}
          >
            {([
              ['rows', 'Levels wrap into rows', 'grid_view'],
              ['scroll', 'Each level in one scrolling line', 'view_column'],
            ] as const).map(([value, tip, icon]) => (
              <NodeTip key={value} name={tip} placement="top">
                <Box
                  component="button"
                  type="button"
                  aria-label={tip}
                  aria-pressed={rowMode === value}
                  data-keys-row-mode={value}
                  onClick={() => setRowMode(value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.5rem',
                    height: '1.5rem',
                    p: 0,
                    border: 'none',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    color: rowMode === value ? 'text.primary' : 'text.secondary',
                    bgcolor: rowMode === value ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: rowMode === value ? 'action.selected' : 'action.hover',
                      color: 'text.primary',
                    },
                  }}
                >
                  <Icon name={icon} fontSize="1rem" />
                </Box>
              </NodeTip>
            ))}
          </Box>
        </Box>
        </Box>
      ) : null}
      {view === 'position' ? (
        <>
          <ThemeSettingsSection />
          {settingsExtra}
        </>
      ) : null}
      </Box>
    </Paper>
    </QrMenuMotionCtx.Provider>
  );
}
