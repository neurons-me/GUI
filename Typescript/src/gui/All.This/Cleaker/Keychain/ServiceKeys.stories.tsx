import * as React from 'react';
import type { Meta } from '@storybook/react';
import ServiceKeysSection from './ServiceKeysSection';
import CleakerKeychain from './CleakerKeychain';
import IdentityIconRow from '../IdentityIconRow';
import { removeServiceKeys, saveServiceKeys, SERVICE_IDS, type ServiceId } from './serviceKeyVault';

// me.cleaker.keychain › Service keys — third-party API keys (Twitch, PayPal Sandbox, Meta).
// These stories use the REAL serviceKeyVault against this browser's localStorage under a demo
// namespace (`storybook.demo`) — encrypted like the real thing; the seeded values are fakes.
const meta: Meta<typeof ServiceKeysSection> = {
  title: 'Pieces/Keychain/Service keys',
  component: ServiceKeysSection,
  parameters: { layout: 'fullscreen' },
};
export default meta;

const NS = 'storybook.demo';
const DEMO_PASS = 'storybook-demo-passphrase';

function Seeded({ saved, children }: { saved: ServiceId[]; children: () => React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    (async () => {
      for (const s of SERVICE_IDS) removeServiceKeys(NS, s);
      for (const s of saved) {
        await saveServiceKeys(NS, s, s === 'meta' || s === 'openai' ? { apiKey: 'demo-not-a-real-key' } : s === 'google' ? { clientId: 'demo-id.apps.example', clientSecret: 'demo-secret' } : { clientId: 'demo-id', clientSecret: 'demo-secret', channel: 'demo' }, DEMO_PASS);
      }
      if (live) setReady(true);
    })();
    return () => { live = false; };
  }, [saved.join(',')]);
  return ready ? <>{children()}</> : null;
}

export const NoneSaved = () => (
  <Seeded saved={[]}>{() => <Box440><ServiceKeysSection namespace={NS} /></Box440>}</Seeded>
);

export const TwitchSaved = () => (
  <Seeded saved={['twitch']}>{() => <Box440><ServiceKeysSection namespace={NS} /></Box440>}</Seeded>
);

export const FocusedFromQrIcon = () => (
  <Seeded saved={['paypal']}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="paypal" /></Box440>}</Seeded>
);

export const GoogleFocused = () => (
  <Seeded saved={['google']}>{() => <Box440><ServiceKeysSection namespace={NS} focusedService="google" /></Box440>}</Seeded>
);

export const InKeychainList = () => (
  <Seeded saved={['twitch', 'meta', 'google', 'openai', 'linkedin']}>
    {() => (
      <CleakerKeychain
        handle="jabellae"
        keys={[{ keyId: 'key-laptop', label: 'This laptop', admin: true, authorization: 'active', localAvailability: 'available-unlocked', addedAt: Date.now() - 864e5 }]}
        serviceKeysNamespace={NS}
      />
    )}
  </Seeded>
);

export const QrIconRow = () => (
  <Box440>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', paddingTop: 16 }}>
      <IdentityIconRow nodeId="story.qr" savedServices={[]} onNavigate={() => {}} />
      <IdentityIconRow nodeId="story.qr" savedServices={['twitch']} onNavigate={() => {}} />
      <IdentityIconRow nodeId="story.qr" savedServices={['openai', 'linkedin']} onNavigate={() => {}} />
      <IdentityIconRow nodeId="story.qr" savedServices={['twitch', 'paypal', 'meta', 'google', 'openai', 'linkedin']} onNavigate={() => {}} />
    </div>
  </Box440>
);

export const QrIconRowAllVisible = () => (
  <Box440>
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16 }}>
      <IdentityIconRow nodeId="story.qr" savedServices={['twitch', 'google', 'linkedin']} maxServiceIcons={99} onNavigate={() => {}} />
    </div>
  </Box440>
);

function Box440({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 440, margin: '0 auto', padding: 24 }}>{children}</div>;
}
