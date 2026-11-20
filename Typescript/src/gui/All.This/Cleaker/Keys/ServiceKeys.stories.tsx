import * as React from 'react';
import type { Meta } from '@storybook/react';
import ServiceKeysSection from './ServiceKeysSection';
import Keys from './Keys';
import IdentityIconRow from '../IdentityIconRow';
import { DEMO_NS, Seeded } from './serviceKeys.storyFixtures';

// me.cleaker.keychain › Service keys — third-party API keys (Twitch, PayPal Sandbox, Meta).
// These stories use the REAL serviceKeyVault against this browser's localStorage under a demo
// namespace (`storybook.demo`) — encrypted like the real thing; the seeded values are fakes.
const meta: Meta<typeof ServiceKeysSection> = {
  title: 'Pieces/Keys/Service keys',
  component: ServiceKeysSection,
  parameters: { layout: 'fullscreen' },
};
export default meta;

const NS = DEMO_NS;

export const NoneSaved = () => (
  <Seeded saved={[]}>{() => <Box440><ServiceKeysSection namespace={NS} /></Box440>}</Seeded>
);

export const TwitchSaved = () => (
  <Seeded saved={['twitch']}>{() => <Box440><ServiceKeysSection namespace={NS} /></Box440>}</Seeded>
);

/** Twitch card with the optional OBS WebSocket subsection focused (#twitch). */
export const TwitchObsWebSocket = () => (
  <Seeded saved={[]}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="twitch" /></Box440>}</Seeded>
);

export const FocusedFromQrIcon = () => (
  <Seeded saved={['paypal']}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="paypal" /></Box440>}</Seeded>
);

export const GoogleFocused = () => (
  <Seeded saved={['google']}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="google" /></Box440>}</Seeded>
);

export const ScrolledToSection = () => (
  <Seeded saved={['github']}>
    {() => (
      <div style={{ height: 600, overflow: 'auto' }}>
        <Keys
          handle="jabellae"
          keys={[{ keyId: 'key-laptop', label: 'This laptop', admin: true, authorization: 'active', localAvailability: 'available-unlocked', addedAt: Date.now() - 864e5 }]}
          serviceKeysNamespace={NS}
          focusServiceKeys
        />
      </div>
    )}
  </Seeded>
);

export const InKeychainList = () => (
  <Seeded saved={['twitch', 'meta', 'google', 'openai', 'linkedin', 'grok', 'github', 'facebook', 'whatsapp', 'sms']}>
    {() => (
      <Keys
        handle="jabellae"
        keys={[{ keyId: 'key-laptop', label: 'This laptop', admin: true, authorization: 'active', localAvailability: 'available-unlocked', addedAt: Date.now() - 864e5 }]}
        serviceKeysNamespace={NS}
      />
    )}
  </Seeded>
);

export const QrIconRow = () => (
  <Box440>
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16 }}>
      <IdentityIconRow nodeId="story.qr" onNavigate={() => {}} />
    </div>
  </Box440>
);

function Box440({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 440, margin: '0 auto', padding: 24 }}>{children}</div>;
}
