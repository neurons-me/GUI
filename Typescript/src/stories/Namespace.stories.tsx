import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import Namespace from "@/react/session/Namespace";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";
import { ConnectionSeamsContext } from "@/gui/All.This/Cleaker/useQRConnect";
import { DEMO_NAMESPACE, demoNamespaceFetch, demoNamespaceSeams } from "./demoNamespaceDoor";
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
import { barModeFromCleaker } from '@/gui/Layout/Position/barMode';
import IdentityTree from '@/gui/All.This/Cleaker/IdentityTree';
import { DEMO_CUSTOM_GROUPS, DEMO_NS, META_KEY_GROUPS, Seeded } from '@/gui/All.This/Cleaker/Keys/serviceKeys.storyFixtures';
import type { ServiceId } from '@/gui/All.This/Cleaker/Keys/serviceKeyVault';
import { isLoginExcluded } from '@/gui/All.This/Cleaker/Keys/keyVisibility';

// PUBLIC, reproducible test seed for this story only: not an identity, grants no authority.
// Passing it explicitly keeps the kernel from generating + persisting an anonymous seed (this.me.seed:v1).
const DEMO_SEED = 'storybook-demo:namespace';

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
// SIMULATION of case 1 (the page IS the namespace). Storybook is always localhost:6006 and serves no namespace, so a
// demo door (demoNamespaceDoor.ts) stands in for a real one: at this page's own origin it answers /__surface as the
// namespace `namespace`, /gateway-identity, claim/sign-in, and the /nrp channel. By the rule, a page IS a namespace when
// its own origin answers for it (not when the name matches the host), so the shell collapses to `namespace` -- the real
// rule, with a fake door. The real thing is a page served by the namespace's own door (cleaker.me/, or localhost/ with
// a local monad); what such a door must answer, and how to verify it, is in packages/GUI/docs/Namespace.md.
//
// namespaceSource="address": the host (localhost) is NOT declared as the namespace; until the door answers, the shell
// says it is resolving instead of naming the host.
const PAGE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
setActiveNamespaceRoot(DEMO_NAMESPACE);

const Root = () => (
  <Theme>
    <ConnectionSeamsContext.Provider value={demoNamespaceSeams}>
      <SeedSessionProvider transportOrigin={PAGE_ORIGIN} sessionBackend="cleaker" fetchImpl={demoNamespaceFetch}>
        <Namespace namespaceSource="address" cleakerEndpoint={PAGE_ORIGIN} netgetMonadOrigin={PAGE_ORIGIN} />
      </SeedSessionProvider>
    </ConnectionSeamsContext.Provider>
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
  name: '1 · Namespace only (simulated door)',
  render: () => <Root />,
  parameters: {
    docs: {
      description: {
        story: 'Simulated: a demo door at this page\'s own origin answers as the namespace `namespace`. The real case is a page served by the namespace\'s own door; see packages/GUI/docs/Namespace.md.',
      },
    },
  },
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
          routes (Users, Blockchain, Netget, Monad) open over this view, in its place, and close back to it. Keys
          lives in the identity card (the QR.me in the corner) once you are signed in.
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
// Keys belongs in the identity QR.me card (not the content-area overlay). Once signed in, that card shows the
// signed-in view and the same IdentityTree as Pieces/QR.me → Signed In Long Collection (wrapping rows, … / Show
// less; demo values as dots; keys.netget hidden). The QR follows the open public path. The left-bar Keys item
// opens the same card with the tree already unfolded. With `connect` off, the card still opens (the menu as
// before) so the tree can be tried without the helper.
const KEYS_ROUTE = { route: '/keychain', label: 'Keys', icon: 'key' };
// A few saved services (brand-colored nodes); the rest of the long list stays unsaved so the root "+" shows them as
// presets (PayPal Live, WhatsApp, OpenAI, LinkedIn, Grok, npm, Twilio). `meta` is the old Graph API key, still readable.
// The full long collection (everything saved) is Pieces/QR.me → "Signed In Long Collection".
const LONG_SAVED: ServiceId[] = ['twitch', 'paypal', 'meta', 'google', 'github'];
const LONG_CUSTOM = [...META_KEY_GROUPS, ...DEMO_CUSTOM_GROUPS];
// "Connect your .me" on the identity QR itself (AppShell `identityConnect`): while not connected, tapping the corner QR
// asks the identity agent (another origin, in a window it opens) which .me is yours; once you approve, the QR carries
// that .me and the text beside it shows it; its menu signs it out. Real flow, local only:
// `node scripts/connect-me-local.mjs` starts the agent page at :5320 and a disposable monad at :5321 (the defaults
// below). The story defaults `connect` off so tapping the identity opens the card with the disposable demo
// identity and test keys (no approval window). Turn the control on only when that local helper is running.
const CONNECT_AGENT = 'http://127.0.0.1:5320/';
const CONNECT_MONAD = 'http://127.0.0.1:5321';

const BAR_STATES = ['open', 'icons', 'closed'] as const;
type BarState = (typeof BAR_STATES)[number];

type SiteArgs = { connect: boolean; corner: MarkCorner; brandCorner: MarkCorner | 'auto/opposite'; namespace: string; brand: string; username: string; top: BarState; left: BarState; right: BarState; bottom: BarState };

function SiteWithGuiPreview({ connect, corner, brandCorner, namespace, brand, username, top, left, right, bottom }: SiteArgs) {
  const me = React.useMemo(() => new ME(DEMO_SEED) as any, []);
  const runtime = React.useMemo(() => RunMe(me), [me]);
  const [keysOpen, setKeysOpen] = React.useState(false);
  const [keysPath, setKeysPath] = React.useState<string[]>([]);
  const value = `https://${namespace || 'cleaker.me'}/?at=${encodeURIComponent(window.location.origin)}`;
  const routes = [...Object.values(SHELL_LEFT_ITEMS).map((it: any) => ({ route: it.route, label: it.label, icon: it.icon })), KEYS_ROUTE];
  const identityTree = (
    <Seeded saved={LONG_SAVED} custom={LONG_CUSTOM}>{() => (
      <IdentityTree
        nodeId="story.keys"
        username={username || 'jabellae'}
        namespace={DEMO_NS}
        onNavigate={() => {}}
        onPathChange={setKeysPath}
        access="edit"
        hide={isLoginExcluded}
        initialOpen={keysOpen}
      />
    )}</Seeded>
  );
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
      identityConnect={connect ? { agentUrl: CONNECT_AGENT, root: namespace || 'cleaker.me', audience: CONNECT_MONAD } : undefined}
      identityCorner={corner}
      brandCorner={brandCorner === 'auto/opposite' ? undefined : brandCorner}
      identityUsername={username || undefined}
      namespace={namespace || undefined}
      namespaceRoutes={namespace ? routes : []}
      identityTree={identityTree}
      identityQrPath={keysPath}
      namespaceCardRoutes={[KEYS_ROUTE.route]}
      onNamespaceCardRoute={() => setKeysOpen(true)}
      onIdentityCardOpenChange={(open) => { if (!open) { setKeysOpen(false); setKeysPath([]); } }}
      // The theme is the person's (.me), not the site's: chosen in the namespace card's settings, not the bar.
      themeIn="card"
      initialBarModes={{
        top: barModeFromCleaker(top),
        left: barModeFromCleaker(left),
        right: barModeFromCleaker(right),
        bottom: barModeFromCleaker(bottom),
      }}
    />
  );
}

export const SiteWithGui: StoryObj<any> = {
  name: '2 · Namespace + site with .GUI',
  args: { connect: false, corner: 'top-left', brandCorner: 'auto/opposite', namespace: 'cleaker.me', brand: 'Neurons', username: 'jabellae', top: 'closed', left: 'open', right: 'closed', bottom: 'closed' } satisfies SiteArgs,
  argTypes: {
    connect: { control: 'boolean', description: "off (default): tapping the identity QR opens the card with the disposable demo identity and test keys. on: tapping the QR while not connected asks which .me is yours (local: run `node scripts/connect-me-local.mjs` first)." },
    corner: { control: 'inline-radio', options: [...MARK_CORNERS], description: "the person's QR corner" },
    brandCorner: { control: 'inline-radio', options: ['auto/opposite', ...MARK_CORNERS], description: "The brand has no settings panel: place it with this control (or the AppShell `brandCorner` prop). auto/opposite: the brand takes the other end of the QR (default). A corner: independent of the QR. They never share a place: if this control or the QR's position panel would put them on the same corner, the other jumps by the QR's opposition rule (mirror, else diagonal, else first free). The QR's grid still shows where the brand sits. Choices last until the story is reloaded (nothing is stored)." },
    namespace: { control: 'text' },
    brand: { control: 'text', description: "the app's brand (the author's); empty: none" },
    username: { control: 'text' },
    top: { control: 'inline-radio', options: BAR_STATES, description: 'top bar starts closed in this story; open it from the QR position grid or this control' },
    left: { control: 'inline-radio', options: BAR_STATES },
    right: { control: 'inline-radio', options: BAR_STATES },
    bottom: { control: 'inline-radio', options: BAR_STATES },
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
// namespace is being home), no URL (netget hides it), nothing a session or capability gates (Keychain). Monad is not
// listed (like Netget, Users, Blockchain): /monad stays a route, reached by its address. As `route`s: they are the
// namespace's, so on this page (not the namespace's) they open over it.
const SHELL_LEFT_ITEMS = Object.fromEntries(
  flattenGuiDocument(GUI_DOCUMENT)
    .filter((e) => e.parentId === 'GUI.window.layout.bars.left' && e.to && !e.requires && !/\.(home|url|monad)$/.test(e.id))
    .map((e) => [e.id.split('.').pop()!, { label: e.label, route: e.to, icon: e.icon }]),
);

type OnAPageArgs = {
  corner: CleakerCorner;
  namespace: string;
  brand: string;
  username: string;
  top: 'open' | 'icons' | 'closed';
  left: 'open' | 'icons' | 'closed';
};

function CleakerOnAPage({ corner, namespace, brand, username, top, left }: OnAPageArgs) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return undefined;
    const handle = mountCleakerGui({
      corner,
      namespace: namespace || null,
      username: username || undefined,
      qrStatus: 'confirmed',
      container: ref.current,
      storage: null,
      probe: async () => true,
      devtools: true,
      document: {
        bars: {
          ...(brand ? { brand: { label: brand, to: '#' } } : {}),
          // the shell's top bar carries no links of its own (only the position and the marks)
          top: { label: 'Top bar', state: top },
          // netget's left items (the document's listed ones; Monad, Netget, Users, Blockchain are routes, not listed)
          left: { label: 'Left bar', state: left, children: SHELL_LEFT_ITEMS },
        },
      },
    });
    return () => handle.unmount();
  }, [corner, namespace, brand, username, top, left]);
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


export const CleakerOnAnyPage: StoryObj<any> = {
  name: '3 · Namespace + site without .GUI',
  args: { corner: 'top-left', namespace: 'cleaker.me', brand: 'Neurons', username: 'jabellae', top: 'open', left: 'icons' } satisfies OnAPageArgs,
  argTypes: {
    corner: { control: 'inline-radio', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] },
    namespace: { control: 'text' },
    brand: { control: 'text', description: "the page's brand (the author's); empty: none" },
    username: { control: 'text' },
    top: { control: 'inline-radio', options: BAR_STATES },
    left: { control: 'inline-radio', options: BAR_STATES },
  },
  render: (args) => <CleakerOnAPage {...(args as OnAPageArgs)} />,
};
