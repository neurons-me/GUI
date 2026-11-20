// useMeConnect — the identity QR on a site that does not know whose .me is active: tapping it asks the identity agent
// (its own origin, in a window it opens) and, once the person approves, the site is connected to that .me
// (src/agent/connectMe.ts). Used by AppShell's corner QR through its `identityConnect` prop.
// The QR only ever encodes a public address: the root before connecting (`https://cleaker.me`), the connected
// namespace after (`https://ana.cleaker.me`). The connection is kept in memory only; nothing is stored.
import * as React from 'react';
import { ConnectRefused, connectMe, type MeConnection } from '@/agent/connectMe';

export type MeConnectConfig = {
  /** The identity window: its origin's root, e.g. `https://<root>/` (`/agent.html` still works locally). */
  agentUrl: string;
  /** The namespace root the person's .me lives under (`cleaker.me`). */
  root: string;
  /** The monad's public audience. */
  audience: string;
  /** Where the monad is reached, if not at its audience. */
  monad?: string;
  ttlMs?: number;
  /** Test hook: wait before sending the proof. */
  delayMs?: number;
  onConnected?: (c: MeConnection | null) => void;
};

export type MeConnectState =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'opening' }
  | { kind: 'connected'; c: MeConnection }
  | { kind: 'refused'; reason: string };

const REASON_TEXT: Record<string, string> = {
  rejected: 'You did not approve.',
  closed: 'The approval window was closed.',
  timeout: 'No answer in time.',
  'popup-blocked': 'The browser blocked the approval window.',
  MISMATCH: 'The server confirmed a different .me.',
  unreachable: 'The server could not be reached.',
};

/** One line for the state, shown beside the QR while it is not simply idle or connected. */
export function meConnectText(state: MeConnectState): string | null {
  if (state.kind === 'asking') return 'Approve in the window that opened…';
  if (state.kind === 'opening') return 'Connecting…';
  if (state.kind === 'refused') return `Not connected: ${REASON_TEXT[state.reason] ?? state.reason}`;
  return null;
}

/** Short words for each refusal (the line beside the QR); the full sentence stays in REASON_TEXT (its tooltip). */
const REASON_SHORT: Record<string, string> = {
  rejected: 'Not approved',
  closed: 'Not connected',
  timeout: 'Timed out',
  'popup-blocked': 'Window blocked',
  MISMATCH: 'Different .me',
  unreachable: 'Server unreachable',
};

/** The connect state as a calm status: a short line, the full sentence and its code for the tooltip. */
export type MeConnectStatus = { text: string; detail?: string; code?: string; tone: 'busy' | 'warning' };
export function meConnectStatus(state: MeConnectState): MeConnectStatus | null {
  if (state.kind === 'asking') return { text: 'Waiting for approval…', detail: 'Approve in the window that opened.', tone: 'busy' };
  if (state.kind === 'opening') return { text: 'Connecting…', tone: 'busy' };
  if (state.kind === 'refused') {
    const known = Object.prototype.hasOwnProperty.call(REASON_SHORT, state.reason);
    return {
      text: known ? REASON_SHORT[state.reason] : "Couldn't connect",
      detail: REASON_TEXT[state.reason] ?? 'Something went wrong while connecting.',
      code: state.reason,
      tone: 'warning',
    };
  }
  return null;
}

export function useMeConnect(config: MeConnectConfig | undefined) {
  const [state, setState] = React.useState<MeConnectState>({ kind: 'idle' });
  const cfg = React.useRef(config);
  cfg.current = config;
  const busy = state.kind === 'asking' || state.kind === 'opening';
  const connection = state.kind === 'connected' ? state.c : null;

  /** Must run inside the click: the agent's window is opened synchronously by it. */
  const connect = React.useCallback(() => {
    const c = cfg.current;
    if (!c || busy) return;
    connectMe({ agentUrl: c.agentUrl, root: c.root, audience: c.audience, monad: c.monad, ttlMs: c.ttlMs, delayMs: c.delayMs, onStep: (s) => setState({ kind: s }) }).then(
      (conn) => { setState({ kind: 'connected', c: conn }); cfg.current?.onConnected?.(conn); },
      (e) => setState({ kind: 'refused', reason: e instanceof ConnectRefused ? e.reason : 'error' }),
    );
  }, [busy]);
  const forget = React.useCallback(() => { setState({ kind: 'idle' }); cfg.current?.onConnected?.(null); }, []);

  return {
    enabled: Boolean(config),
    state,
    busy,
    connection,
    /** The public address the QR carries. */
    value: config ? `https://${connection ? connection.namespace : config.root}` : undefined,
    connect,
    forget,
  };
}
