// Harness for tests/integration/qrMeCard.browser.test.mjs: the shared QR.me
// panel (close, gear, logout icon under the gear) with IdentityTree paging.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import Box from '@/gui/Atoms/Box/Box';
import IdentityTree from '@/gui/All.This/Cleaker/IdentityTree';
import MeLoginStatus from '@/gui/All.This/Cleaker/MeLoginStatus';
import CleakerQrMenu from '@/gui/All.This/Cleaker/Corner/CleakerQrMenu';
import { DEMO_CUSTOM_GROUPS, DEMO_NS, META_KEY_GROUPS, Seeded } from '@/gui/All.This/Cleaker/Keys/serviceKeys.storyFixtures';
import type { ServiceId } from '@/gui/All.This/Cleaker/Keys/serviceKeyVault';
import { isLoginExcluded } from '@/gui/All.This/Cleaker/Keys/keyVisibility';

const SAVED: ServiceId[] = ['twitch', 'paypal', 'paypalLive', 'meta', 'whatsapp', 'google', 'openai', 'linkedin', 'grok', 'github', 'npm', 'sms'];

function Card() {
  const [path, setPath] = React.useState<string[]>([]);
  const perimeter = ['jabellae.cleaker.me', ...path].join('/');
  return (
    <CleakerQrMenu
      fullPosition={`${perimeter} @ ${window.location.host}`}
      statusText="Connected"
      showNamespaceForm={false}
      corner="top-left"
      onMoveTo={() => {}}
      onClose={() => {}}
      onSignOut={() => {}}
      layout={{ address: perimeter, search: true }}
    >
      <MeLoginStatus
        nodeId="harness.qrme"
        authenticated
        qr={{
          value: `https://${perimeter}`,
          username: 'jabellae',
          status: 'confirmed',
          statusLabel: 'Connected',
          perimeterLabel: perimeter,
          perimeterRootLabel: 'cleaker.me',
        }}
        onNavigate={() => {}}
        onLogout={() => {}}
        tree={(
          <IdentityTree
            nodeId="harness.qrme"
            username="jabellae"
            namespace={DEMO_NS}
            onNavigate={() => {}}
            onPathChange={setPath}
            access="edit"
            hide={isLoginExcluded}
            initialOpen
            // Fixed page so the harness can assert "…" regardless of card width.
            pageSize={4}
          />
        )}
      />
    </CleakerQrMenu>
  );
}

createRoot(document.getElementById('root')!).render(
  <Theme>
    <Box sx={{ minHeight: '100vh', p: 2, bgcolor: 'background.default' }}>
      <Seeded saved={SAVED} custom={[...META_KEY_GROUPS, ...DEMO_CUSTOM_GROUPS]}>{() => <Card />}</Seeded>
    </Box>
  </Theme>,
);
