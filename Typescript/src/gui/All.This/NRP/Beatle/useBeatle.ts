import { useCallback, useEffect, useRef, useState } from 'react';
import { parseNRPExpression } from './NRPExpression';
import type {
  BeatleMessage,
  MsgNrpOpen,
  MsgData,
  NamespaceChannel,
  ResolutionState,
} from './Beatle.types';

// wss, not ws — see Beatle.types.ts's makeDefaultResolvers() for why a
// plain-ws fallback is never correct here.
const DEFAULT_ENDPOINT = 'wss://local.netget/nrp';

const IDLE_CHANNEL: NamespaceChannel = {
  expression: null,
  resolved: [],
  state: 'idle',
};

export function useBeatle(
  nrpEndpoint = DEFAULT_ENDPOINT,
  onMessage?: (msg: BeatleMessage) => void,
) {
  const [channel, setChannel] = useState<NamespaceChannel>(IDLE_CHANNEL);
  const ws = useRef<WebSocket | null>(null);

  const patch = (state: ResolutionState, extra?: Partial<NamespaceChannel>) =>
    setChannel(prev => ({ ...prev, state, ...extra }));

  const close = useCallback(() => {
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    close();
    setChannel(prev => ({ ...prev, state: 'disconnected' }));
  }, [close]);

  /**
   * open(rawExpression) — the single entry point into the NRP channel.
   *
   * Parsing and connecting are the same act: opening the channel IS resolving.
   * Sequence: parsing → connecting → resolving → connected | streaming | error
   *
   * Client sends { raw, canonical, ast, client } as intent/hint.
   * Server has semantic authority — it re-parses and resolves against .me kernel.
   */
  const open = useCallback((raw: string) => {
    if (!raw.trim()) { disconnect(); return; }

    close();

    // me:// only opens over secure transport, or it doesn't open — never a
    // silent downgrade. A plain http:// page can't open a wss:// socket to
    // itself either way (the browser will refuse), but failing here with a
    // clear, specific reason beats letting the WebSocket constructor throw
    // whatever generic error the browser happens to produce for it.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      patch('error', { expression: null, error: 'Secure connection required — open this page over https to use me://.' });
      return;
    }

    patch('parsing', { expression: null, resolved: [], error: undefined });
    const expr = parseNRPExpression(raw);

    if (!expr.valid) {
      patch('error', { expression: expr, error: expr.error ?? 'Invalid expression' });
      return;
    }

    // Parses fine, but doesn't have real FQDN shape — this will never derive
    // through NRP (see ResolutionState's 'invalid' doc comment). Distinct
    // from a parse error: the namespace can still be claimed/written to
    // `.me`, it just never opens a channel here.
    if (!expr.domainShapeValid) {
      patch('invalid', { expression: expr, error: 'invalid NRP - domain name' });
      return;
    }

    patch('connecting', { expression: expr });

    try {
      const socket = new WebSocket(nrpEndpoint);
      ws.current = socket;

      socket.onopen = () => {
        patch('resolving');
        const msg: MsgNrpOpen = {
          type: 'nrp.open',
          expression: expr.raw,
          canonical: expr.canonical,
          ast: expr.ast,
          client: {
            surface:   typeof window    !== 'undefined' ? window.location.href  : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent   : undefined,
            gui: 'Beatle',
          },
          timestamp: Date.now(),
        };
        socket.send(JSON.stringify(msg));
      };

      socket.onmessage = (event) => {
        let msg: BeatleMessage;
        try { msg = JSON.parse(event.data as string) as BeatleMessage; }
        catch { return; }

        onMessage?.(msg);

        switch (msg.type) {
          case 'resolved': {
            const rp = msg.payload;
            patch('connected', {
              resolved:     rp.endpoints,
              channelId:    msg.channelId,
              audience:     rp.audience,
              capabilities: rp.capabilities,
              disclosure:   rp.disclosure,
              surface:      rp.surface ?? (expr.ast.kind === 'overlay' ? expr.ast.surface : undefined),
            });
            break;
          }
          case 'stream':
            patch('streaming');
            break;
          case 'error':
            // Server is the authority — if it flags a namespace as
            // shape-invalid (the client should already have caught this
            // itself above, but a stale bundle or a bypass shouldn't just
            // look like a generic connection failure), land on 'invalid'
            // rather than 'error' too.
            patch(msg.code === 'invalid_namespace_shape' ? 'invalid' : 'error', { error: msg.payload });
            break;
          // ping/pong/data: no state change
        }
      };

      socket.onerror = () => patch('error', { error: 'WebSocket error' });

      socket.onclose = () => {
        setChannel(prev =>
          prev.state !== 'idle' && prev.state !== 'error'
            ? { ...prev, state: 'disconnected' }
            : prev,
        );
      };
    } catch (err) {
      patch('error', { error: String(err) });
    }
  }, [nrpEndpoint, close, disconnect, onMessage]);

  /** Send data payload on the open channel (only when connected or streaming) */
  const send = useCallback((payload: unknown) => {
    const state = channel.state;
    if (state !== 'connected' && state !== 'streaming') return;
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    const msg: MsgData = { type: 'data', payload, timestamp: Date.now() };
    ws.current.send(JSON.stringify(msg));
  }, [channel.state]);

  useEffect(() => () => close(), [close]);

  return { channel, open, send, disconnect };
}
