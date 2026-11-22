import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import IdentityTree from '@/gui/All.This/Cleaker/IdentityTree';
import { DEMO_CUSTOM_GROUPS, DEMO_NS, META_KEY_GROUPS, META_MANY_PAGES, Seeded, type DemoCustomGroup } from '@/gui/All.This/Cleaker/Keys/serviceKeys.storyFixtures';
import type { KeyAccess } from '@/gui/All.This/Cleaker/Keys/keyTree';
import type { ServiceId } from '@/gui/All.This/Cleaker/Keys/serviceKeyVault';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import CleakerQrMenu from '@/gui/All.This/Cleaker/Corner/CleakerQrMenu';
import { QrBadge } from '@/gui/Layout/Position/Position';
import QRme from './QR.me';
import AppChallengeDemo from '@/gui/All.This/Cleaker/Keys/AppChallengeDemo';
import { linkTo } from '@storybook/addon-links';

// In Storybook the personal icons that don't unfold jump to their own stories
// (the app routes them). Keys unfolds in place (IdentityTree); /keychain stays
// as the fallback target if a consumer doesn't opt in.
const storyNavigate = (to: string) => {
  if (to === '/keychain') linkTo('Pieces/Keys', 'Key List')();
};

const meta: Meta<typeof QRme> = {
  title: 'Pieces/QR.me',
  component: QRme,
  args: {
    value: 'https://jabellae.cleaker.me',
    username: 'jabellae',
    avatarSrc: 'https://neurons.me/media/neurons-grey.png',
    diameter: 124,
    variant: 'md',
    defaultFace: 'qr',
    hoverFlip: true,
    clickFlip: true,
    showAvatarLabel: false,
  },
};

export default meta;

type Story = StoryObj<typeof QRme>;

export const Default: Story = {};

/** `https://jabellae.cleaker.me` + ['keys','paypal','sandbox'] → `https://jabellae.cleaker.me/keys/paypal/sandbox`. Public path only. */
const withQrPath = (base: string, segments: string[]) =>
  `${base.replace(/\/+$/, '')}${segments.length ? `/${segments.map(encodeURIComponent).join('/')}` : ''}`;

/** The signed-in card: the QR follows the open branch of the keys tree (path only — never values). */
function SignedInCard({ args, access, pending }: { args: React.ComponentProps<typeof QRme>; access?: KeyAccess; pending?: string[] }) {
  const [path, setPath] = React.useState<string[]>([]);
  return (
    <>
      <QRme
        {...args}
        value={withQrPath(String(args.value), path)}
        perimeterLabel={args.perimeterLabel ? withQrPath(args.perimeterLabel, path) : undefined}
      />
      <IdentityTree nodeId="story.signedin" username={args.username ?? 'jabellae'} namespace={DEMO_NS} onNavigate={storyNavigate} onPathChange={setPath} access={access} pending={pending} />
    </>
  );
}

const signedInRender = (saved: ServiceId[], custom: DemoCustomGroup[] = [], access?: KeyAccess) => (args: React.ComponentProps<typeof QRme>) => (
    <Seeded saved={saved} custom={custom}>{() => (
    <Box sx={{ width: '100%', maxWidth: 360, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, py: 6 }}>
      <SignedInCard args={args} access={access} />
      <Typography hidden variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }} data-gui-node-id="story.signedin.identityHash">
        7f3a…c91e
      </Typography>
      <Box
        component="button"
        type="button"
        data-gui-node-id="story.signedin.logout"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: '8px',
          p: 1,
          px: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Icon name="logout" fontSize="1rem" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign out</Typography>
      </Box>
    </Box>
    )}</Seeded>
  );

/** Signed-in QR card: the username's root tree in card mode.
 *  Personal entries only (keys, wallet, profile, contacts). The key icon
 *  unfolds the keys tree in place (.keys → .paypal → .sandbox → its card, relative to the namespace on the QR, which follows the open path); demo
 *  keys are fakes seeded under `storybook.demo`. */
export const SignedIn: Story = {
  args: {
    value: 'https://jabellae.cleaker.me',
    username: 'jabellae',
    diameter: 125,
    hoverFlip: false,
    clickFlip: false,
    status: 'confirmed',
    statusLabel: 'Connected',
    perimeterLabel: 'jabellae.cleaker.me',
  },
  render: signedInRender(['paypal', 'meta', 'twitch']),
};

/** Signed in with a long keys collection (services + Meta tree + custom groups):
 *  "+" first always adds; "…" at the end loads the next block. Facebook/Instagram/Threads
 *  are account groups under .keys.meta (pages unfold; they are no longer flat leaves). */
const LONG_SAVED: ServiceId[] = ['twitch', 'paypal', 'paypalLive', 'meta', 'whatsapp', 'google', 'openai', 'linkedin', 'grok', 'github', 'npm', 'sms'];
const LONG_CUSTOM: DemoCustomGroup[] = [...META_KEY_GROUPS, ...DEMO_CUSTOM_GROUPS];
export const SignedInLongCollection: Story = {
  args: SignedIn.args,
  render: signedInRender(LONG_SAVED, LONG_CUSTOM),
};

/** Same Meta tree with ~29 Facebook pages, to prove wrap + collapse on the facebook branch. */
export const SignedInMetaManyPages: Story = {
  name: 'Signed in · Meta many Pages',
  args: SignedIn.args,
  render: signedInRender(LONG_SAVED, [...META_MANY_PAGES, ...DEMO_CUSTOM_GROUPS]),
};

/** Viewer with READ rights on every leaf: the path tree is the same; values can be shown or copied with the passphrase, never typed; no "+", no trash. */
export const SignedInKeysReadOnly: Story = {
  name: 'Signed in · Keys read-only',
  args: SignedIn.args,
  render: signedInRender(LONG_SAVED, LONG_CUSTOM, 'read'),
};

/** Viewer with NO rights: the semantic paths stay visible (that is the public directory); values stay hidden, no eye/copy, no passphrase. */
export const SignedInKeysNoAccess: Story = {
  name: 'Signed in · Keys no access',
  args: SignedIn.args,
  render: signedInRender(LONG_SAVED, LONG_CUSTOM, 'none'),
};

/** Full-interface rail menu: login status inside the Cleaker corner panel. */
export const RailMenu: Story = {
  args: {
    value: 'https://jabellae.cleaker.me',
    username: 'jabellae',
    diameter: 125,
    hoverFlip: false,
    clickFlip: false,
    status: 'confirmed',
    statusLabel: 'Connected',
    perimeterLabel: 'jabellae.cleaker.me',
  },
  render: (args) => (
    <Box sx={{ minHeight: 560, position: 'relative', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'absolute', top: 8, left: 11, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QrBadge value={String(args.value)} username={args.username} status="confirmed" clickFlip={false} hoverFlip={false} cursor="pointer" />
      </Box>
      <Box sx={{ position: 'absolute', top: 8, left: 72 }}>
        <CleakerQrMenu
          fullPosition="jabellae.cleaker.me @ http://127.0.0.1:6006"
          statusText="Connected"
          showNamespaceForm={false}
          corner="top-left"
          onMoveTo={() => {}}
          onClose={() => {}}
          onSignOut={() => {}}
          layout={{ address: 'jabellae.cleaker.me', search: true }}
        >
          <MeLoginStatus
            nodeId="story.railmenu"
            authenticated
            qr={{
              value: String(args.value),
              username: args.username,
              status: args.status,
              statusLabel: args.statusLabel,
              perimeterLabel: args.perimeterLabel,
              perimeterRootLabel: 'cleaker.me',
              diameter: 125,
            }}
            identityHash="7f3a…c91e"
            onNavigate={() => {}}
            onLogout={() => {}}
            hideSignOut
          />
        </CleakerQrMenu>
      </Box>
    </Box>
  ),
};

export const AvatarFirst: Story = {
  args: {
    defaultFace: 'avatar',
  },
};

export const FallbackOnly: Story = {
  args: {
    avatarSrc: '',
    avatarFallback: 'JB',
    showAvatarLabel: true,
  },
};

// The connection-status ring, with its label now also surfaced as a hover
// tooltip (previously only reachable via the accessible aria-label) -- see
// QR.me.tsx's own `statusLabel` doc comment.
export const ConnectionStatus: Story = {
  args: { variant: 'topbar', diameter: 40 },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <QRme {...args} status="checking" statusLabel="Checking…" />
      <QRme {...args} status="confirmed" statusLabel="Connected" />
      <QRme {...args} status="error" statusLabel="Could not connect" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <QRme {...args} variant="xs" diameter={72} />
      <QRme {...args} variant="sm" diameter={96} />
      <QRme {...args} variant="md" diameter={112} />
      <QRme {...args} variant="lg" diameter={148} />
      <QRme {...args} variant="xl" diameter={184} />
    </div>
  ),
};

/** Where each app's key lives in the tree: `.keys.netget`, `.keys.polls` (demo groups; the value is a fake). */
const APP_KEY_GROUPS: DemoCustomGroup[] = [
  { name: 'netget', fields: ['key-id'], mark: { kind: 'icon', name: 'router' } },
  { name: 'polls', fields: ['key-id'], mark: { kind: 'icon', name: 'how_to_vote' } },
];

/** Any app ⇄ your .me (netget first; "Polls" is an invented second app). The app sends a challenge sealed to
 *  your .me asking for `.keys.<app>`; the .me decrypts it locally and answers with a signature only — asking each
 *  time, by a scoped standing permission, or through a wire (your output → its input). Transfer/delete always ask.
 *  The app and its authority are SIMULATED in the browser; no network calls; the key lives in memory only. */
export const SignedInAppChallenge: Story = {
  name: 'Signed in · App challenge',
  args: SignedIn.args,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Seeded saved={['paypal', 'meta', 'twitch']} custom={APP_KEY_GROUPS}>{() => (
      <AppChallengeDemo namespace={DEMO_NS}>
        {(pending) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <SignedInCard args={args} pending={pending} />
          </Box>
        )}
      </AppChallengeDemo>
    )}</Seeded>
  ),
};
