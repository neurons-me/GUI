import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import IdentityIconRow from '@/gui/All.This/Cleaker/IdentityIconRow';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import CleakerQrMenu from '@/gui/All.This/Cleaker/Corner/CleakerQrMenu';
import { QrBadge } from '@/gui/Layout/Position/Position';
import QRme from './QR.me';

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

/** Signed-in QR card: the username's root tree in card mode.
 *  Personal entries only (keys, wallet, profile, contacts). Service icons
 *  belong on the keys screen; expanded .GUI puts more icons in the sidebars. */
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
  render: (args) => (
    <Box sx={{ width: '100%', maxWidth: 360, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, py: 6 }}>
      <QRme {...args} />
      <IdentityIconRow nodeId="story.signedin" onNavigate={() => {}} />
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
  ),
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
