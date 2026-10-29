import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import {
  DEFAULT_OPACITY, DEFAULT_STORAGE_KEY, dragTo, hslString, readSaved, resolveState, writeSaved,
  type OverlayState,
} from './overlaySwatchCore';
import type { OverlaySwatchProps } from './OverlaySwatch.types';

const OFFSET = 20;
const posStyle = (p: NonNullable<OverlaySwatchProps['position']>): React.CSSProperties => ({
  [p.startsWith('top') ? 'top' : 'bottom']: OFFSET,
  [p.endsWith('right') ? 'right' : 'left']: OFFSET,
});

/**
 * OverlaySwatch — one circle that tints a full-screen overlay.
 * Drag ↔ shifts hue, ↕ shifts opacity, in a single pointer gesture.
 * Starts bound to the active GUI theme (palette.primary.main); follows theme
 * changes until the user drags; double-click returns to the theme color.
 */
const OverlaySwatch: React.FC<OverlaySwatchProps> = ({
  storageKey = DEFAULT_STORAGE_KEY,
  position = 'top-right',
  size = 40,
  defaultOpacity = DEFAULT_OPACITY,
  color,
  overlay = true,
  target,
  resetOnDoubleClick = true,
  onChange,
  zIndex = 10,
  overlayZIndex = 0,
  title = 'Drag: ↔ color · ↕ opacity · double-click: theme color',
  className,
  style,
  id,
  'data-testid': dataTestId,
}) => {
  const muiTheme = useTheme();
  const gui = useContext(ThemeContext); // optional: works outside <Theme> too
  const themeColor = color ?? muiTheme.palette.primary.main;
  const themeKey = `${gui?.themeId || 'mui'}:${gui?.mode || muiTheme.palette.mode}`;

  const [custom, setCustom] = useState(() => readSaved(storageKey, themeKey));
  const [drag, setDrag] = useState<{ h: number; a: number } | null>(null);
  // theme switch → load what (if anything) the user saved for that theme
  useEffect(() => { setCustom(readSaved(storageKey, themeKey)); }, [storageKey, themeKey]);

  const state: OverlayState = useMemo(
    () => resolveState(themeColor, defaultOpacity, drag ?? custom),
    [themeColor, defaultOpacity, drag, custom],
  );
  const overlayColor = hslString(state, state.a);
  const isThemeDefault = !drag && !custom;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current?.({ ...state, color: overlayColor, isThemeDefault, themeKey });
  }, [overlayColor, isThemeDefault, themeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!target) return;
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    const prev = el.style.background;
    el.style.background = overlayColor;
    return () => { el.style.background = prev; };
  }, [target, overlayColor]);

  const origin = useRef<{ x: number; y: number; h: number; a: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    origin.current = { x: e.clientX, y: e.clientY, h: state.h, a: state.a };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const o = origin.current;
    if (!o) return;
    setDrag(dragTo(o, e.clientX - o.x, e.clientY - o.y));
  };
  const endDrag = useCallback(() => {
    if (!origin.current) return;
    origin.current = null;
    setDrag((d) => {
      if (d) { writeSaved(storageKey, themeKey, d); setCustom(d); }
      return null;
    });
  }, [storageKey, themeKey]);
  const onDoubleClick = () => {
    if (!resetOnDoubleClick) return;
    writeSaved(storageKey, themeKey, null);
    setCustom(null);
  };

  return (
    <>
      {overlay && (
        <div
          data-gui-overlay=""
          aria-hidden
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: overlayColor, zIndex: overlayZIndex, pointerEvents: 'none' }}
        />
      )}
      <div
        id={id}
        className={['gui-overlay-swatch', className].filter(Boolean).join(' ')}
        data-testid={dataTestId}
        data-theme-default={isThemeDefault ? 'true' : 'false'}
        role="slider"
        aria-label="Overlay color and opacity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(state.a)}
        aria-valuetext={overlayColor}
        title={title}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={onDoubleClick}
        style={{
          position: 'fixed',
          ...posStyle(position),
          width: size,
          height: size,
          borderRadius: '50%',
          // swatch stays opaque so its hue reads at any opacity
          backgroundColor: hslString(state),
          boxShadow: `0 4px 8px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,${drag ? 0.35 : 0.15})`,
          cursor: drag ? 'grabbing' : 'grab',
          zIndex,
          touchAction: 'none',
          userSelect: 'none',
          ...style,
        }}
      />
    </>
  );
};

export default OverlaySwatch;
