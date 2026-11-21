import React, { useEffect, useMemo, useState } from 'react';
import QR, { type QREmbedMode } from '@/gui/All.This/me/QR';
import { selectionStore } from '@/runtime/selectionStore';
import { buildCleakerNamespaceUrl } from '../namespaceExpression';
import {
  readUsernameFromBootstrap,
  readUsernameFromLocation,
  readUsernameFromStorage,
  readUsernameFromWindow,
  sanitizeCleakerUsername,
  SESSION_CREDENTIALS_EVENT,
  SESSION_USERNAME_STORAGE_KEY,
} from '../runtimeUsername';

// No built-in endpoint: without one, the QR points at the page's own origin (an address; the port is kept), read when
// called, never at import; with no page (no browser, a file) it has nothing to point at and says nothing.
function pageOriginFallback(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, origin } = window.location;
  return protocol === 'http:' || protocol === 'https:' ? origin : '';
}
function isNetworkOrigin(origin: string): boolean {
  return /^https?:\/\//i.test(String(origin || '').trim());
}

const TRIAD_QR_EMBED_BITMAP = [
  '000000000000000000000000000111111000',
  '000000000000000000000000000111111000',
  '111000111111111110000000111111111111',
  '111000111111111110000000111000000111',
  '111000111111111110000000111000000111',
  '000000111001111001110000111111111111',
  '000000111001111001110000111111111111',
  '000000111001111001110000111111111111',
  '000000111001111001110000111000000000',
  '000000111001111001110000111000000000',
  '000000000000000000000000000000000000',
  '000000111000000001110000111000000000',
  '000000111000000001110000111000000000',
  '000000111000000001110000111111111111',
  '000000111000000001110000000111111111',
  '000000111000000001110000000111111111',
] as const;

export type CleakerQRProps = {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
  /** Visual preset for compact reusable icon use. */
  variant?: 'default' | 'icon';
  /** Optional direct value override. If provided, it wins. */
  value?: string;
  /** Optional username to build https://<username>.cleaker.me */
  username?: string;
  /** Optional endpoint. Omitted: the page's own origin (an address), or nothing without a page. */
  endpoint?: string;
  /** Overall rendered size in px */
  size?: number;
  /** Background color */
  bg?: string;
  /** Foreground color */
  fg?: string;
  /** Rounded corner radius (px) for modules (0 = square) */
  moduleRadius?: number;
  /** Quiet zone in modules */
  quietZone?: number;
  /** Error correction level */
  ecc?: 'L' | 'M' | 'Q' | 'H';
  /** Optional ASCII art label to show above the QR (not inside the QR) */
  asciiHeader?: string;
  /** Optional small caption to show under the QR */
  caption?: string;
  /** Embed mode */
  embedMode?: QREmbedMode;
  /** Embed scale */
  embedScale?: number;
  /** Embedded ASCII */
  embedAscii?: string;
  /** Embedded bitmap */
  embedBitmap?: string[];
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
};

function buildCleakerUrl(username: string, endpoint: string): string {
  const base = String(endpoint || pageOriginFallback()).trim().replace(/\/+$/, '');
  if (!base) return '';
  try {
    return buildCleakerNamespaceUrl(base, username || undefined);
  } catch {
    if (!username) return base;
    let host = base.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/\/+$/, '');
    if (!host) return '';
    const scheme = /^https:\/\//i.test(base) ? 'https://' : 'http://';
    return `${scheme}${username}.${host}`;
  }
}

export default function CleakerQR({
  'data-gui-node-id': dataGuiNodeId,
  'data-gui-component': dataGuiComponent,
  variant = 'default',
  value,
  username,
  endpoint = '',
  size,
  bg,
  fg,
  moduleRadius = 0,
  quietZone = 4,
  ecc = 'H',
  asciiHeader,
  caption,
  embedMode,
  embedScale,
  embedAscii,
  embedBitmap,
  className,
  style,
}: CleakerQRProps) {
  const isIcon = variant === 'icon';
  const rootNodeId = String(dataGuiNodeId || (isIcon ? 'CleakerQRIcon' : 'CleakerQR'));
  const rootNodeType = String(dataGuiComponent || (isIcon ? 'Cleaker.QR.Icon' : 'CleakerQR'));
  const qrSize = size ?? (isIcon ? 58 : 136);
  const qrBg = bg ?? 'var(--qr-bg, transparent)';
  const qrFg = fg ?? 'var(--qr-fg, currentColor)';
  const qrEmbedMode = embedMode ?? 'positive-overlay';
  const qrEmbedScale = embedScale ?? 0.36;
  const qrEmbedBitmap = embedBitmap?.length ? embedBitmap : isIcon ? [...TRIAD_QR_EMBED_BITMAP] : undefined;

  const [resolvedUsername, setResolvedUsername] = useState<string>(() => {
    const direct = sanitizeCleakerUsername(username || '');
    if (direct) return direct;
    const fromWindow = readUsernameFromWindow();
    if (fromWindow) return fromWindow;
    const fromLocation = readUsernameFromLocation();
    if (fromLocation) return fromLocation;
    return readUsernameFromStorage();
  });

  useEffect(() => {
    const next = sanitizeCleakerUsername(username || '');
    if (next) {
      setResolvedUsername(next);
      return;
    }

    const fallback =
      readUsernameFromWindow() ||
      readUsernameFromLocation() ||
      readUsernameFromStorage();

    setResolvedUsername(fallback || '');
  }, [username]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      const fromWindow = readUsernameFromWindow();
      const fromLocation = readUsernameFromLocation();
      const fromStorage = readUsernameFromStorage();
      const next = fromWindow || fromLocation || fromStorage || '';
      if (next && next !== resolvedUsername) setResolvedUsername(next);
      if (!next && resolvedUsername) setResolvedUsername('');
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_USERNAME_STORAGE_KEY) sync();
    };
    const onSession = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener(SESSION_CREDENTIALS_EVENT, onSession as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SESSION_CREDENTIALS_EVENT, onSession as any);
    };
  }, [resolvedUsername]);

  useEffect(() => {
    if (typeof window === 'undefined' || value || resolvedUsername) return;

    let cancelled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const origins = Array.from(new Set([
      window.location.origin,
      endpoint,
    ]
      .map((origin) => String(origin || '').trim().replace(/\/+$/, ''))
      .filter((origin) => Boolean(origin) && isNetworkOrigin(origin))));

    if (origins.length === 0) return;

    (async () => {
      for (const origin of origins) {
        const next = await readUsernameFromBootstrap(origin, controller?.signal);
        if (cancelled) return;
        if (!next) continue;
        setResolvedUsername(next);
        return;
      }
    })();

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [endpoint, resolvedUsername, value]);

  const qrValue = useMemo(() => {
    if (value) return String(value);
    return buildCleakerUrl(resolvedUsername, endpoint);
  }, [value, resolvedUsername, endpoint]);

  const resolvedProps = useMemo(
    () => ({
      value: qrValue,
      username: resolvedUsername || undefined,
      endpoint,
      variant,
      size: qrSize,
      bg: qrBg,
      fg: qrFg,
      embed: qrEmbedBitmap?.length ? (isIcon ? 'triad' : 'custom') : 'none',
      'data-gui-node-id': rootNodeId,
      'data-gui-component': rootNodeType,
    }),
    [
      endpoint,
      isIcon,
      qrBg,
      qrEmbedBitmap,
      qrFg,
      qrSize,
      qrValue,
      resolvedUsername,
      rootNodeId,
      rootNodeType,
      variant,
    ]
  );

  useEffect(() => {
    selectionStore.actions.registerNode({
      id: rootNodeId,
      path: rootNodeId,
      type: rootNodeType,
      spec: {
        type: rootNodeType,
        props: resolvedProps,
      },
      resolvedProps,
    });

    return () => {
      selectionStore.actions.unregisterNode(rootNodeId);
    };
  }, [resolvedProps, rootNodeId, rootNodeType]);

  return (
    <div
      data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      className={className}
      style={{
        display: 'inline-flex',
        lineHeight: 0,
        ...style,
      }}
    >
      <QR
        value={qrValue}
        size={qrSize}
        bg={qrBg}
        fg={qrFg}
        moduleRadius={moduleRadius}
        quietZone={quietZone}
        ecc={ecc}
        caption={caption}
        asciiHeader={asciiHeader}
        embedMode={qrEmbedMode}
        embedScale={qrEmbedScale}
        embedAscii={embedAscii}
        embedBitmap={qrEmbedBitmap}
      />
    </div>
  );
}
