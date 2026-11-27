// Each connect state as its own story, already settled, with no network.
//
//   Idle       a live door, nothing started yet
//   Off        nothing answers here (grey QR, "No .me here")
//   Checking   the loader, for as long as it takes
//   Connected  another host answered: the sign-in form
//   Failed     the "Unable to connect" card (useQRConnect's failed state)
//   Diagnosis  that same card, opened on Diagnosis
//
// Flow (Cleaker.0-presentation) is the walk through these states by clicking.
// These pin each one so it can be looked at on its own. Only the network is
// replaced (ConnectionSeams, see storyMocks.ts). The QR is the real connect QR
// (avatarSrc and hoverFlip stay as QRConnect already passes them).
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import { Me } from '@/react/Me';
import { SeedSessionProvider } from '@/react/session/SeedSessionProvider';
import { PUBLIC_NAMESPACE } from './ConnectFailure';
import { connectTrace } from '@/react/session/connectTrace';
import QRConnect from './QRConnect';
import { ConnectionSeamsContext, type ConnectionSeams } from './useQRConnect';
import {
  CHECKING_SEAMS,
  CONNECTED_SEAMS,
  DOOR_OFF_LAYERS,
  IDLE_SEAMS,
  OFF_SEAMS,
} from './storyMocks';

const meta: Meta = {
  title: 'All.This/Cleaker/States',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

function pageOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:6006';
}

/** A fixture for the position label: this origin's root, never the Storybook iframe path. */
function storyPage() {
  const origin = pageOrigin();
  const url = new URL(origin);
  return {
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    origin: url.origin,
    pathname: '/',
    search: '',
    hash: '',
    href: `${url.origin}/`,
  };
}

/** Clicks the QR (to show the failure card) and, when asked, opens Diagnosis, once the controls are on the page. */
function AutoAdvance({
  execute,
  diagnosis,
  children,
}: {
  execute?: boolean;
  diagnosis?: boolean;
  children: React.ReactNode;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    connectTrace.clear();
    const root = rootRef.current;
    if (!root) return undefined;
    let cancelled = false;
    const click = (selector: string) => {
      const el = root.querySelector(selector) as HTMLElement | null;
      if (!el) return false;
      el.click();
      return true;
    };
    if (execute) click('[data-gui-node-id$=".qr"]');
    if (!diagnosis) return undefined;
    const openDiagnosis = () => (cancelled ? true : click('[data-gui-node-id$=".diagnosis"]'));
    if (openDiagnosis()) return undefined;
    const observer = new MutationObserver(() => {
      if (openDiagnosis()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [execute, diagnosis]);
  return <div ref={rootRef}>{children}</div>;
}

function ConnectState({
  seams,
  namespace,
  doorOff = false,
  doorChecking = false,
  doorLayers,
  sharedRootStatus = 'confirmed',
  execute,
  diagnosis,
}: {
  seams: ConnectionSeams;
  /** When set, the card acts on this namespace (another host, e.g. cleaker.me). Otherwise it is this page's own. */
  namespace?: string;
  doorOff?: boolean;
  doorChecking?: boolean;
  doorLayers?: typeof DOOR_OFF_LAYERS;
  sharedRootStatus?: 'checking' | 'confirmed' | 'error';
  execute?: boolean;
  diagnosis?: boolean;
}) {
  const origin = pageOrigin();
  const page = storyPage();
  const localRoot = page.hostname;
  const selected = namespace ?? localRoot;
  return (
    <ConnectionSeamsContext.Provider value={seams}>
      <Theme>
        <Me>
          <SeedSessionProvider transportOrigin={origin} sessionBackend="cleaker">
            <AutoAdvance execute={execute} diagnosis={diagnosis}>
              <QRConnect
                cleakerEndpoint={origin}
                netgetMonadOrigin={origin}
                doorOff={doorOff}
                doorChecking={doorChecking}
                doorLayers={doorLayers}
                probeDoor={doorLayers ? async () => doorLayers : undefined}
                sharedRootStatus={sharedRootStatus}
                sharedRootBinding={{
                  cleakerEndpoint: origin,
                  answeredNamespace: selected,
                  confirmedLabel: selected,
                }}
                pageLocation={page}
              />
            </AutoAdvance>
          </SeedSessionProvider>
        </Me>
      </Theme>
    </ConnectionSeamsContext.Provider>
  );
}

/** A live local door; the channel has not been asked yet. */
export const Idle: Story = {
  render: () => <ConnectState seams={IDLE_SEAMS} />,
};

/** Nothing answers behind this page: the grey QR. */
export const Off: Story = {
  render: () => (
    <ConnectState
      seams={OFF_SEAMS}
      doorOff
      doorLayers={DOOR_OFF_LAYERS}
    />
  ),
};

/** The channel is in flight (the public namespace, which never finishes). */
export const Checking: Story = {
  render: () => (
    <ConnectState
      seams={CHECKING_SEAMS}
      namespace={PUBLIC_NAMESPACE}
      doorOff
      doorLayers={DOOR_OFF_LAYERS}
    />
  ),
};

/** The public namespace answered: the ink QR and the sign-in form. */
export const Connected: Story = {
  render: () => (
    <ConnectState
      seams={CONNECTED_SEAMS}
      namespace={PUBLIC_NAMESPACE}
    />
  ),
};

/** Clicking the grey QR offers the "Unable to connect" card. */
export const Failed: Story = {
  render: () => (
    <ConnectState
      seams={OFF_SEAMS}
      doorOff
      doorLayers={DOOR_OFF_LAYERS}
      execute
    />
  ),
};

/** The same card, opened on Diagnosis: the layers, where you are, and the trace. */
export const Diagnosis: Story = {
  render: () => (
    <ConnectState
      seams={OFF_SEAMS}
      doorOff
      doorLayers={DOOR_OFF_LAYERS}
      execute
      diagnosis
    />
  ),
};
