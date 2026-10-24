// capabilities.main.tsx — the harness for tests/integration/capabilities.browser.test.mjs.
//
// Mounts the REAL <Cleaker> as an app mounts it, with a document that declares parts with requirements and resolvers that
// ask the SELECTED link's own transport (the test controls those transports at the network layer, like links.main.tsx).
// The names ('demo:admin', 'demo:audit') are this harness's words; the shell never interprets them.
//
//   ?ns=<namespace>&transport=<origin>     the link the page opens with
//
// `window.__harness.setScope(s)` is the app changing what it has selected (what netget's gateway selector does).
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import { Me } from '@/react/Me';
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';
import type { GuiDocument } from '@/runtime/guiDocument';
import type { CapabilityResolvers } from '@/runtime/capabilities';
import { useGuiCapability } from '@/react/session/useCapabilities';

const params = new URLSearchParams(window.location.search);
if (window.location.pathname !== '/.me') window.history.replaceState(null, '', `/.me${window.location.search}`);

const DOCUMENT: GuiDocument = {
  GUI: {
    children: {
      bars: {
        children: {
          left: {
            children: {
              open: { label: 'Open', to: '/open', icon: 'folder', placement: 'end' },
              signed: { label: 'Signed', to: '/signed', icon: 'badge', requires: 'session', placement: 'end' },
              admin: { label: 'Admin', to: '/admin', icon: 'shield', requires: { capability: 'demo:admin' }, placement: 'end' },
              audit: { label: 'Audit', to: '/audit', icon: 'article', requires: { capability: 'demo:audit', whenMissing: 'disable' }, placement: 'end' },
            },
          },
        },
      },
      content: {
        children: {
          open: { label: 'Open', component: 'OpenPage', route: '/open' },
          signed: { label: 'Signed', component: 'SignedPage', route: '/signed', requires: 'session' },
          admin: { label: 'Admin', component: 'AdminPage', route: '/admin', requires: { capability: 'demo:admin' } },
          audit: { label: 'Audit', component: 'AuditPage', route: '/audit', requires: { capability: 'demo:audit', whenMissing: 'disable' } },
        },
      },
    },
  },
};

// A page may read what the shell resolved for the selected link (useGuiCapability); it still would not be authorizing anything.
const Page = ({ id, capability }: { id: string; capability?: string }) => {
  const state = useGuiCapability(capability || 'none');
  return <div data-page={id} data-capability-state={capability ? state : undefined} style={{ padding: 24 }}>{id} page</div>;
};
const PAGES = {
  OpenPage: () => <Page id="open" />,
  SignedPage: () => <Page id="signed" />,
  AdminPage: () => <Page id="admin" capability="demo:admin" />,
  AuditPage: () => <Page id="audit" capability="demo:audit" />,
};

// What an app does: ask a service. Here, the transport of the SELECTED link, with the identity signed in through it.
const ask = (name: string) => async ({ link, session, scope, signal }: { link: { transport: string } | null; session: { authenticated: boolean; identityHash: string | null }; scope: string; signal: AbortSignal }) => {
  if (!session.authenticated || !link) return false;
  const res = await fetch(`${link.transport}/__capability/${encodeURIComponent(name)}?scope=${encodeURIComponent(scope)}`, {
    headers: { 'x-identity': String(session.identityHash) }, signal,
  });
  return ((await res.json()) as { granted?: boolean }).granted === true;
};
const RESOLVERS: CapabilityResolvers = { 'demo:admin': ask('demo:admin'), 'demo:audit': ask('demo:audit') };

function App() {
  const [scope, setScope] = React.useState('one');
  (window as any).__harness = { setScope, scope };
  return (
    <Theme>
      <Me>
        <Cleaker
          namespace={params.get('ns') || 'a.test'}
          transport={params.get('transport') || 'http://a.test'}
          namespaceSource="declared"
          document={DOCUMENT}
          pages={PAGES}
          capabilities={RESOLVERS}
          capabilityScope={scope}
        />
      </Me>
    </Theme>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
