// The two marks in the bars (Roles-and-Territories.md §3): an app's brand (the author's) and the person's QR.me (theirs),
// on a page that uses .GUI. The person picks the corner (the `identityCorner` control); the brand takes the other end.
import React, { useMemo } from 'react';
import ME from 'this.me';
import type { Meta, StoryObj } from '@storybook/react';
import { AppShell } from '@/runtime/AppShell';
import type { AppDeclaration } from '@/runtime/mountApp';
import { RunMe } from '@/runtime/run-me';
import { Typography } from '@/gui/Atoms';
import { Hero, Stack } from '@/gui/Molecules';
import { BarBrandCell, MARK_CORNERS, QrBadge, SiteBrand, type MarkCorner } from './Position';

function Home() {
  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }} contentMaxWidth={680}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h3">Two marks</Typography>
        <Typography variant="body1">
          The app's brand says whose page this is. The QR says who you are. Move your QR with the identityCorner control: the
          brand takes the other end of the same edge, else the diagonal, else the first free place.
        </Typography>
      </Stack>
    </Hero>
  );
}

const app: AppDeclaration = { id: 'marks', namespace: 'apps.marks', title: 'Neurons', theme: 'neurons.me', views: { home: Home } };
const NAV = [{ route: 'home', label: 'Home', icon: 'home' }];

function MarksPreview({ identityCorner, username }: { identityCorner: MarkCorner; username?: string }) {
  const me = useMemo(() => new ME() as any, []);
  const runtime = useMemo(() => RunMe(me), [me]);
  const value = `https://cleaker.me/?at=${encodeURIComponent(window.location.origin)}`;
  return (
    <AppShell
      app={app}
      me={me}
      runtime={runtime}
      navItems={NAV}
      position={`cleaker.me @ ${window.location.host}`}
      brand={<SiteBrand label="Neurons" href="#" />}
      identity={(
        <BarBrandCell component="button" type="button" title="your .me" data-gui-node-id="GUI.window.layout.marks.identity" sx={{ width: 48, height: 48, minWidth: 48, flex: 'none' }}>
          <QrBadge value={value} status="confirmed" clickFlip={false} hoverFlip={false} cursor="pointer" />
        </BarBrandCell>
      )}
      identityCorner={identityCorner}
      identityUsername={username || undefined}
    />
  );
}

const meta = {
  title: 'Layout/Marks (brand + QR.me)',
  component: MarksPreview,
  parameters: { layout: 'fullscreen' },
  argTypes: { identityCorner: { control: 'inline-radio', options: [...MARK_CORNERS] }, username: { control: 'text' } },
  args: { identityCorner: 'top-left', username: 'jabellae' },
} satisfies Meta<typeof MarksPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PersonTopLeft: Story = { args: { identityCorner: 'top-left' } };
export const PersonTopRight: Story = { args: { identityCorner: 'top-right' } };
export const PersonBottomLeft: Story = { args: { identityCorner: 'bottom-left' } };
export const NoUsername: Story = { args: { identityCorner: 'top-left', username: '' } };
