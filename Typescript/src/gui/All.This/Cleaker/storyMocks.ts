// What the Cleaker stories replace so every state can be shown with no network: ONLY the network. The channel hook
// answers per host, and every reading of this page's own door gets a page back (what a server with nothing behind it
// does). Everything else in the stories is the real <Cleaker>.
import * as React from 'react';
import type { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import type { ConnectionSeams } from './useQRConnect';

type Channel = ReturnType<typeof useBeatle>;

/** A stand-in for Beatle's channel hook: `answers(host)` says what each host does; "hang" never finishes. */
export function mockChannel(answers: (host: string) => 'connect' | 'error' | 'hang', delayMs = 900): typeof useBeatle {
  return ((endpoint: string) => {
    const [channel, setChannel] = React.useState<Channel['channel']>({ expression: null, resolved: [], state: 'idle' });
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const open = React.useCallback((raw: string) => {
      if (timer.current) clearTimeout(timer.current);
      const host = endpoint.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
      const outcome = answers(host);
      setChannel({ expression: null, resolved: [], state: 'connecting' });
      if (outcome === 'hang') return;
      timer.current = setTimeout(() => {
        setChannel(outcome === 'connect'
          ? ({ expression: { raw, ast: { kind: 'namespace', value: raw } }, resolved: [`https://${host}/${raw}`], state: 'connected' } as unknown as Channel['channel'])
          : { expression: null, resolved: [], state: 'error', error: 'WebSocket error' });
      }, delayMs);
    }, [endpoint]);
    React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    return { channel, open, send: () => undefined, disconnect: () => undefined };
  }) as unknown as typeof useBeatle;
}

/** Every reading of this page's own door gets a page back: backend off, monad off. */
export const nothingBehind: typeof fetch = async () => new Response('<!doctype html><title>no</title>', { status: 200, headers: { 'content-type': 'text/html' } });

/** Nothing answers locally; cleaker.me answers; any other host does not exist. */
export const NOTHING_ANSWERS: ConnectionSeams = {
  fetchImpl: nothingBehind,
  useChannel: mockChannel((host) => (host === 'cleaker.me' ? 'connect' : 'error')),
};

/** Another host that never finishes answering: the loader, for as long as it takes. */
export const NEVER_ANSWERS: ConnectionSeams = {
  fetchImpl: nothingBehind,
  useChannel: mockChannel(() => 'hang'),
};
