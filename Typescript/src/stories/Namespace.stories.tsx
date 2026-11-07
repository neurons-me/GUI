import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import Namespace from "@/react/session/Namespace";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";
import { mountCleakerGui } from '@/gui/All.This/Cleaker/Corner/CleakerCornerGui';
import type { CleakerCorner } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';
import { flattenGuiDocument, GUI_DOCUMENT } from '@/runtime/guiDocument';
import ME from 'this.me';
import { AppShell } from '@/runtime/AppShell';
import type { AppDeclaration } from '@/runtime/mountApp';
import { RunMe } from '@/runtime/run-me';
import { Typography } from '@/gui/Atoms';
import { Hero, Stack } from '@/gui/Molecules';
import { BarBrandCell, MARK_CORNERS, QrBadge, SiteBrand, type MarkCorner } from '@/gui/Layout/Position/Position';

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

// The same namespace in three places (the rule: on the namespace's own page its routes render in the content area; on any
// other page they open in the content area's place, over the page):
//   1 · the page IS the namespace           -> Default (the shell: routes in the content area)
//   2 · a site that uses .GUI (AppShell)     -> SiteWithGui (the app's views + the namespace's routes over them)
//   3 · a site without .GUI (any page)       -> CleakerOnAnyPage (Cleaker's bars + the namespace's routes over the page)
export const Default: StoryObj<typeof meta> = {
  name: '1 · Namespace only',
  render: () => <Root />,
};

// ── 2 · Namespace + a site with .GUI ─────────────────────────────────────────────────────────────────────────────────
// An app built with .GUI (AppShell): its own views (Home, Notes) and its brand; the person's QR.me in their corner; the
// namespace's routes (the same items as 3) after the app's in the left bar. The app's views render in the content area
// (they are the app's); a namespace route opens in the content area's place over the app's view, which is back as it was
// when it closes. The content follows the theme: the whole page is .GUI.
function SiteHome() {
  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }} contentMaxWidth={680}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h3">A site with .GUI</Typography>
        <Typography variant="body1">
          This app's views are its own: they render here, in the content area, and follow the theme. The namespace's
          routes (Users, Blockchain, Netget, Monad) open over this view, in its place, and close back to it.
        </Typography>
      </Stack>
    </Hero>
  );
}
function SiteNotes() {
  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }} contentMaxWidth={680}>
      <Typography variant="h3">Notes</Typography>
    </Hero>
  );
}
const SITE_APP: AppDeclaration = { id: 'site', namespace: 'apps.site', title: 'Neurons', theme: 'neurons.me', views: { home: SiteHome, notes: SiteNotes } };
const SITE_NAV = [{ route: 'home', label: 'Home', icon: 'home' }, { route: 'notes', label: 'Notes', icon: 'sticky_note_2' }];

type SiteArgs = { corner: MarkCorner; namespace: string; brand: string; username: string };

function SiteWithGuiPreview({ corner, namespace, brand, username }: SiteArgs) {
  const me = React.useMemo(() => new ME() as any, []);
  const runtime = React.useMemo(() => RunMe(me), [me]);
  const value = `https://${namespace || 'cleaker.me'}/?at=${encodeURIComponent(window.location.origin)}`;
  const routes = Object.values(SHELL_LEFT_ITEMS).map((it: any) => ({ route: it.route, label: it.label, icon: it.icon }));
  return (
    <AppShell
      app={SITE_APP}
      me={me}
      runtime={runtime}
      navItems={SITE_NAV}
      position={namespace ? `${namespace} @ ${window.location.host}` : window.location.host}
      brand={brand ? <SiteBrand label={brand} href="#" /> : undefined}
      identity={(
        <BarBrandCell component="button" type="button" title="your .me" data-gui-node-id="GUI.window.layout.marks.identity" sx={{ width: 48, height: 48, minWidth: 48, flex: 'none' }}>
          <QrBadge value={value} status="confirmed" clickFlip={false} hoverFlip={false} cursor="pointer" />
        </BarBrandCell>
      )}
      identityCorner={corner}
      identityUsername={username || undefined}
      namespace={namespace || undefined}
      namespaceRoutes={namespace ? routes : []}
    />
  );
}

export const SiteWithGui: StoryObj<any> = {
  name: '2 · Namespace + site with .GUI',
  args: { corner: 'top-left', namespace: 'cleaker.me', brand: 'Neurons', username: 'jabellae' } satisfies SiteArgs,
  argTypes: {
    corner: { control: 'inline-radio', options: [...MARK_CORNERS] },
    namespace: { control: 'text' },
    brand: { control: 'text', description: "the app's brand (the author's); empty: none" },
    username: { control: 'text' },
  },
  render: (args) => <SiteWithGuiPreview {...(args as SiteArgs)} />,
};

// ── Cleaker on any page ──────────────────────────────────────────────────────────────────────────────────────────────
// The same view as the playground (demo/cleaker.html): a plain page with no .GUI of its own, and Cleaker mounted on it
// (mountCleakerGui, in its Shadow DOM). The QR sits in the person's corner (top left, top right, bottom left, bottom
// right -- from its panel, or the `corner` control); the page's brand (the author's `bars.brand`) takes the other end
// (Roles-and-Territories.md §3). With the bars closed, the QR alone is the corner QR. The controls are the author's
// defaults; the person's choices in the panel last until the story is reloaded (nothing is stored here). The namespace
// probe is a stand-in that answers, so the story asks nothing of a real service.

// The left items netget's shell draws (localhost): the document's own (GUI.document.json) -- no Home (being at the
// namespace is being home), no URL (netget hides it), nothing a session or capability gates (Keychain) -- then netget's
// Monad, the monad.ai orb. As `route`s: they are the namespace's, so on this page (not the namespace's) they open over it.
const SHELL_LEFT_ITEMS = {
  ...Object.fromEntries(
    flattenGuiDocument(GUI_DOCUMENT)
      .filter((e) => e.parentId === 'GUI.window.layout.bars.left' && e.to && !e.requires && !/\.(home|url)$/.test(e.id))
      .map((e) => [e.id.split('.').pop()!, { label: e.label, route: e.to, icon: e.icon }]),
  ),
  monad: { label: 'Monad', route: '/monad', icon: 'orb:monad' },
};

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
      devtools: true,
      document: {
        bars: {
          ...(brand ? { brand: { label: brand, to: '#' } } : {}),
          // the shell's top bar carries no links of its own (only the position and the marks)
          top: { label: 'Top bar', state: top },
          // netget's left items: Users, Blockchain, Netget, Monad
          left: { label: 'Left bar', state: left, children: SHELL_LEFT_ITEMS },
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
  name: '3 · Namespace + site without .GUI',
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
