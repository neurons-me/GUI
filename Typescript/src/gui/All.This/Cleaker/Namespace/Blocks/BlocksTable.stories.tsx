import type { Meta } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import BlocksTable from './BlocksTable';

// The namespace's own append-only, hash-chained memory log — every claim,
// content write, and host self-report that landed under a namespace,
// rendered in order. Sibling to Cleaker/Users (the claims directory), not
// nested inside the full Namespace shell — this is its own view, same
// reasoning as Usernames.stories.tsx: this table is useful standalone, for
// iterating on how the ledger reads before wiring it back into the tabbed
// namespace.tsx surface.
const meta: Meta<typeof BlocksTable> = {
  title: 'All.This/Cleaker/Blockchain',
  component: BlocksTable,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Same real, reachable local example as Usernames.stories.tsx: endpoint is
// the monad serving the data (routed through netget's app-mesh proxy by
// name, not a raw port), namespaceRootUrl/namespaceLabel is the identity
// root rows resolve their QR/link against (local.cleaker) — kept identical
// on purpose so the two stories describe the same real namespace from two
// angles: who claimed it (Users) vs. everything that was ever written to it
// (Blockchain).
export const Default = () => (
  <Theme>
    <BlocksTable
      endpoint="http://127.0.0.1:8164"
      namespaceRootUrl="http://local.cleaker"
      namespaceLabel="local.cleaker"
    />
  </Theme>
);
