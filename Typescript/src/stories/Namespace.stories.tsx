import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import Namespace from "@/react/session/Namespace";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";
import { mountCleakerGui } from '@/gui/All.This/Cleaker/Corner/CleakerCornerGui';
import type { CleakerCorner } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';

// This is the literal mount root: GUI.document.json's own root route
// (content.landing, route: "/") declares component: "Landing", which this
// IS (Namespace.tsx's default export). Surfaced here, under Getting
// Started, because that's what it actually is — not a Cleaker-specific
// example. The full regression-test group for it (recovery-phrase
// registration, the cleaker-backend smoke test, the compact card view)
// stays at All.This/Cleaker/.me — same component, same setup, this story
// duplicates none of that logic, it just gives the root document a front
// door in the nav that matches its real role.
//
// Resolved as the real page does it, nothing written in by hand: the address is only a draft
// (namespaceSource "address"), and the `.me` is named only once a monad answers for it. It is asked through this
// machine's own door (http://localhost, nginx). Until something answers, the top bar says `? @ localhost:6006`.
// (local.cleaker / local.netget were retired on 2026-10-07.)
const PAGE_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
setActiveNamespaceRoot(PAGE_HOST);

const Root = () => (
  <Theme>
    <SeedSessionProvider transportOrigin="http://localhost/apps/netget" sessionBackend="cleaker">
      <Namespace namespaceSource="address" cleakerEndpoint="http://localhost" netgetMonadOrigin="http://localhost/apps/netget" />
    </SeedSessionProvider>
  </Theme>
);

const meta = {
  title: 'Getting Started/Namespace',
  component: Root,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Root>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => <Root />,
};

// ── Cleaker on any page ──────────────────────────────────────────────────────────────────────────────────────────────
// The same view as the playground (demo/cleaker.html): a plain page with no .GUI of its own, and Cleaker mounted on it
// (mountCleakerGui, in its Shadow DOM). The QR sits in the person's corner (top left, top right, bottom left, bottom
// right -- from its panel, or the `corner` control); the page's brand (the author's `bars.brand`) takes the other end
// (Roles-and-Territories.md §3). With the bars closed, the QR alone is the corner QR. The controls are the author's
// defaults; the person's choices in the panel last until the story is reloaded (nothing is stored here). The namespace
// probe is a stand-in that answers, so the story asks nothing of a real service.

type OnAPageArgs = {
  corner: CleakerCorner;
  namespace: string;
  brand: string;
  top: 'open' | 'icons' | 'closed';
  left: 'open' | 'icons' | 'closed';
};

function CleakerOnAPage({ corner, namespace, brand, top, left }: OnAPageArgs) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return undefined;
    const handle = mountCleakerGui({
      corner,
      namespace: namespace || null,
      container: ref.current,
      storage: null,
      probe: async () => true,
      document: {
        bars: {
          ...(brand ? { brand: { label: brand, to: '#' } } : {}),
          top: { label: 'Top bar', state: top, children: {
            docs: { label: 'Docs', to: '#docs', icon: 'menu_book' },
            nrp: { label: 'NRP', to: 'https://neurons-me.github.io/NRP/' },
          } },
          left: { label: 'Left bar', state: left, children: {
            home: { label: 'Home', to: '#', icon: 'home' },
            users: { label: 'Users', to: '#users', icon: 'group' },
            blockchain: { label: 'Blockchain', to: '#blockchain', icon: 'link' },
            url: { label: 'URL', to: '#url', icon: 'language' },
            netget: { label: 'Netget', to: '#netget', icon: 'cable' },
          } },
        },
      },
    });
    return () => handle.unmount();
  }, [corner, namespace, brand, top, left]);
  return (
    <div ref={ref} style={{ minHeight: '100vh', background: '#fbfaf7', color: '#222', font: '17px/1.6 Georgia, serif' }}>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '96px 20px' }}>
        <h1>A page, any page</h1>
        <p>A plain page, as any author's, with no .GUI of its own. Cleaker sits in the person's corner; the bars this page
          declares unfold from its QR, and the page's brand takes the other end.</p>
        <p>Click the QR: the panel moves it (top left, top right, bottom left, bottom right) and opens or closes each bar.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere
          velit aliquet. Donec ullamcorper nulla non metus auctor fringilla. Maecenas faucibus mollis interdum.</p>
      </main>
    </div>
  );
}

const BAR_STATES = ['open', 'icons', 'closed'];

export const CleakerOnAnyPage: StoryObj<any> = {
  name: 'Cleaker on any page',
  args: { corner: 'top-left', namespace: 'cleaker.me', brand: 'Neurons', top: 'open', left: 'icons' } satisfies OnAPageArgs,
  argTypes: {
    corner: { control: 'inline-radio', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] },
    namespace: { control: 'text' },
    brand: { control: 'text', description: "the page's brand (the author's); empty: none" },
    top: { control: 'inline-radio', options: BAR_STATES },
    left: { control: 'inline-radio', options: BAR_STATES },
  },
  render: (args) => <CleakerOnAPage {...(args as OnAPageArgs)} />,
};
