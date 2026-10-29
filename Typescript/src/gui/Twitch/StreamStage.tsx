import React, { useEffect, useRef, useState } from 'react';
import OverlaySwatch from '@/gui/Theme/OverlaySwatch/OverlaySwatch';
import type { StreamStageProps } from './Twitch.types';

const FAKE_CAMERA =
  'radial-gradient(ellipse at 35% 40%, #8a8a8a 0%, #4a4a4a 45%, #1c1c1c 100%)';

/**
 * StreamStage — layered stream canvas (bottom → top):
 * camera (video / placeholder) → tint overlay (hue/opacity) → .GUI children.
 * Renders at a logical resolution (default 1920x1080) scaled to fit its container.
 */
const StreamStage: React.FC<StreamStageProps> = ({
  videoSrc,
  cameraBackground = FAKE_CAMERA,
  placeholderLabel = 'PLACEHOLDER CAMERA',
  hue = 210,
  saturation = 70,
  lightness = 45,
  opacity = 50,
  controls = false,
  storageKey = 'twitch:stage-overlay',
  transparent = false,
  baseWidth = 1920,
  baseHeight = 1080,
  children,
  className,
  style,
  'data-testid': dataTestId,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / baseWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth]);
  useEffect(() => { setOverlayEl(overlayRef.current); }, []);

  const a = Math.max(0, Math.min(100, opacity)) / 100;
  const argColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${a})`;

  return (
    <div
      ref={wrapRef}
      className={['gui-stream-stage', className].filter(Boolean).join(' ')}
      data-testid={dataTestId}
      style={{ position: 'relative', width: '100%', aspectRatio: `${baseWidth} / ${baseHeight}`, overflow: 'hidden', ...style }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: baseWidth, height: baseHeight, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        {!transparent && (
          <div data-layer="camera" style={{ position: 'absolute', inset: 0, background: cameraBackground }}>
            {videoSrc && (
              <video src={videoSrc} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {placeholderLabel && (
              <div style={{ position: 'absolute', left: 32, bottom: 28, padding: '6px 14px', border: '2px dashed rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.8)', font: '600 22px/1.2 monospace', letterSpacing: 2 }}>
                {placeholderLabel}
              </div>
            )}
          </div>
        )}
        <div
          ref={overlayRef}
          data-layer="overlay"
          aria-hidden
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: controls ? undefined : argColor }}
        />
        <div data-layer="gui" style={{ position: 'absolute', inset: 0 }}>{children}</div>
      </div>
      {controls && overlayEl && (
        <OverlaySwatch overlay={false} target={overlayEl} storageKey={storageKey} defaultOpacity={opacity} size={44} style={{ position: 'absolute' }} />
      )}
    </div>
  );
};

export default StreamStage;
