import * as React from 'react';
import type { RegistryEntry } from '@/Registry/types';
import QR, { type QREmbedMode } from './QR';

type SessionQRSpec = {
  type: 'SessionQR';
  props?: {
    value: string;
    size?: number;
    bg?: string;
    fg?: string;
    moduleRadius?: number;
    quietZone?: number;
    ecc?: 'L' | 'M' | 'Q' | 'H';
    caption?: string;
    asciiHeader?: string;
    embedMode?: QREmbedMode;
    embedScale?: number;
    embedAscii?: string;
    embedBitmap?: string[];
    className?: string;
    style?: React.CSSProperties;
  };
};

export const meta = {
  id: 'components.identity-noise.session-qr',
  type: 'SessionQR',
  label: 'Session QR',
  group: 'Components',
  path: ['Identity Noise', 'Session'],
  tags: ['qr', '.me', 'identity', 'session', 'session'],
  demoSpec: {
    type: 'SessionQR',
    props: {
      value: '0xabc123',
      size: 136,
      embedMode: 'positive-overlay',
    },
  },
} as const;

const SessionQRResolver: RegistryEntry = {
  type: 'SessionQR',
  resolve(spec: SessionQRSpec) {
    const p: Partial<NonNullable<SessionQRSpec['props']>> = spec.props ?? {};
    if (!p.value) return null;

    return (
      <QR
        value={String(p.value)}
        size={p.size ?? 136}
        bg={p.bg ?? 'var(--qr-bg, transparent)'}
        fg={p.fg ?? 'var(--qr-fg, currentColor)'}
        moduleRadius={p.moduleRadius ?? 0}
        quietZone={p.quietZone ?? 4}
        ecc={p.ecc ?? 'H'}
        caption={p.caption}
        asciiHeader={p.asciiHeader}
        embedMode={p.embedMode ?? 'positive-overlay'}
        embedScale={p.embedScale ?? 0.36}
        embedAscii={p.embedAscii}
        embedBitmap={p.embedBitmap}
        className={p.className}
        style={p.style}
      />
    );
  },
};

export default SessionQRResolver;
