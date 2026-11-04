import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MonadNamespaceCard from './MonadNamespaceCard';
import { readMonad0 } from '@/react/session/monad0';
import { useMonadDiscovery, type DiscoveredMonad, type MonadDiscoveryState } from '@/runtime/monads';

const meta: Meta<typeof MonadNamespaceCard> = {
  title: 'Pieces/Monad',
  component: MonadNamespaceCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MonadNamespaceCard>;

const apps = [
  { name: 'Haiku', port: 4101, healthy: true },
  { name: 'Lisa', port: 4102, healthy: true },
];

export const Default: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [{ name: 'Freddie' }],
    waking: {},
    restartStatus: 'idle',
  },
};

export const NoMonadsRegistered: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: false,
    apps: [],
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle',
  },
};

export const RestartingMesh: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [{ name: 'Freddie' }],
    waking: { 'Freddie': true },
    restartStatus: 'restarting',
  },
};

// The card is the whole of "monad" on screen: the orb as its header (its glow is `healthy`) and the mesh below. The
// states of each part are shown through the card, so there is no story per part:
//   orb glow     healthy true (green) / false (red) / null (default blue)    -> Default, NoMonadsRegistered, Checking
//   mesh         collapsed until opened (click it), empty, restarting, restart failed
export const Checking: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: null,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'idle',
  },
};

export const RestartFailed: Story = {
  args: {
    namespace: 'suis-macbook-air.local',
    healthy: true,
    apps,
    sleepingEntries: [],
    waking: {},
    restartStatus: 'error',
    restartError: 'apps/restart-all failed: 502',
  },
};

// The card says whether the monad answering here is the one the signed-in session runs on. The reading is computed
// from what the transport answered and what the session is (readMonad0), never from a name.
const T = 'http://localhost/apps/netget';
const answered = { monadId: 'monad:abc', monadName: 'Haiku', namespace: 'netget.local', signature: 'valid' as const };

export const YourMonad0: Story = {
  args: {
    namespace: 'netget.local',
    healthy: true,
    apps,
    detection: readMonad0({ transport: T, answered, session: { transportOrigin: T, namespace: 'ana.netget.local' } }),
  },
};

export const AMonadNotKnownToBeYours: Story = {
  args: {
    namespace: 'netget.local',
    healthy: true,
    apps,
    detection: readMonad0({ transport: T, answered, session: null }),
  },
};

// Live: the card reads THIS machine. useMonadDiscovery probes the monad ports on localhost (8161-8165, /__surface) and
// netget's registry (GET /apps); reads only. The orb is blue until the first scan lands, then green when a monad
// answers and red when none does. Nothing is remembered between visits (storage: null), so a monad that went away
// is not shown from an old scan.
function portOf(endpoint: string): number {
  try {
    const url = new URL(endpoint);
    return Number(url.port) || (url.protocol === 'https:' ? 443 : 80);
  } catch {
    return 0;
  }
}

function localhostHealth(state: MonadDiscoveryState): boolean | null {
  if (state.lastUpdatedAt === null) return null;
  return state.monads.some((monad) => monad.healthy);
}

function toMeshEntry(monad: DiscoveredMonad) {
  return { name: monad.name || monad.id, port: portOf(monad.endpoint), healthy: monad.healthy };
}

function LocalhostMonads() {
  const discovery = useMonadDiscovery({ storage: null });
  // the store starts with a fast scan (8161 only); ask for the full one (8161-8165) right away
  const { rescan } = discovery;
  useEffect(() => rescan({ mode: 'normal', reason: 'story:open' }), [rescan]);
  return (
    <MonadNamespaceCard
      namespace="localhost"
      healthy={localhostHealth(discovery)}
      apps={discovery.monads.map(toMeshEntry)}
      sleepingEntries={[]}
      waking={{}}
      restartStatus="idle"
      meshDefaultOpen
    />
  );
}

export const Localhost: Story = {
  render: () => <LocalhostMonads />,
};
