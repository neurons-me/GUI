import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import QRConnect, { type QRConnectProps, type QRConnectState } from './QRConnect';
import type { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import type { DoorLayers } from '@/react/session/doorLayers';

// The whole process of the QR, with no network: a mock channel stands in for the WebSocket and a canned reading for
// this page's own door, so every state can be walked through by clicking.
//
//   grey (nothing answers) --click--> loader --> "Unable to connect" + [Connect to cleaker.me | Try another namespace | Diagnosis]
//   Connect to cleaker.me --> loader --> connected (ink)      Try another namespace (one that does not exist) --> cross
//
// The channel hook is the only thing replaced: QRConnect itself, its card and the trace are the real ones. Open the
// browser console to see each step (`[qr] …`), or read `globalThis['GUI-QR-TRACE'].entries()`.

type Outcome = 'connect' | 'error' | 'hang';
type Channel = ReturnType<typeof useBeatle>;

/** A stand-in for Beatle's channel hook: what each host answers is decided by `answers`. */
function mockChannel(answers: (host: string) => Outcome, delayMs = 900): typeof useBeatle {
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

const OFF: DoorLayers = {
  nginx: 'up', backend: 'off', monad: 'off',
  backendReason: 'answered a page (200, text/html), not JSON', monadReason: 'answered a page (200, text/html), not JSON', checkedAt: 0,
};
const UP: DoorLayers = { nginx: 'up', backend: 'up', monad: 'up', backendReason: '', monadReason: '', checkedAt: 0 };

// cleaker.me answers; the page's own host answers only when the story says so; anything else does not exist.
const everyoneKnown = (own: Outcome) => mockChannel((host) => (host === 'cleaker.me' ? 'connect' : host === 'localhost' ? own : 'error'));
const nothingLocal = everyoneKnown('error');
const localUp = everyoneKnown('connect');
const slow = mockChannel(() => 'hang');

type Args = Pick<QRConnectProps, 'expression' | 'door' | 'useChannel' | 'sharedRootStatus'>;

function Stage(args: Args) {
  const [expression, setExpression] = React.useState(args.expression);
  const [state, setState] = React.useState<QRConnectState | null>(null);
  return (
    <div style={{ width: 340, margin: '0 auto', paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <QRConnect
        {...args}
        expression={expression}
        onExpressionChange={setExpression}
        localRoot="localhost"
        qrValue={`https://${expression}`}
        location="http://localhost:6006"
        onStateChange={setState}
      />
      <code style={{ fontSize: 11, opacity: 0.6 }}>{state ? `${state.status}${state.remoteRoot ? ` · remote ${state.remoteRoot}` : ''}${state.failureShown ? ' · card' : ''}` : ''}</code>
    </div>
  );
}

const meta: Meta<typeof Stage> = {
  title: 'All.This/.me/QRConnect',
  component: Stage,
  parameters: { layout: 'centered' },
  args: { expression: 'localhost' },
};
export default meta;

type Story = StoryObj<typeof Stage>;

/** Nothing answers behind this page: a grey QR and nothing else. Click it. */
export const Flow: Story = {
  args: {
    door: { off: true, checking: false, layers: OFF, probe: async () => OFF },
    useChannel: nothingLocal,
  },
};

/** This page's own door is up and its root confirmed: the ink ring, "Connected". */
export const Connected: Story = {
  args: {
    door: { off: false, checking: false, layers: UP, probe: async () => UP },
    useChannel: localUp,
    sharedRootStatus: 'confirmed',
  },
};

/** Trying: the loader instead of a dot, for as long as the channel takes. */
export const Trying: Story = {
  args: {
    door: { off: false, checking: false, layers: UP },
    useChannel: slow,
    sharedRootStatus: 'confirmed',
  },
};

/** Another host that does not exist: the cross, and the same three ways forward. */
export const CannotConnect: Story = {
  args: {
    expression: 'nothing-here.invalid',
    door: { off: true, checking: false, layers: OFF },
    useChannel: nothingLocal,
  },
};

/** Another host that answers, with this page's own door off: connected anyway. */
export const ToCleaker: Story = {
  args: {
    expression: 'cleaker.me',
    door: { off: true, checking: false, layers: OFF },
    useChannel: nothingLocal,
  },
};
