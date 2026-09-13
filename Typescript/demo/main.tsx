// demo/main.tsx — a REAL mount of CleakerKeychain against a REAL,
// disposable monad instance. Storybook (CleakerKeychain.stories.tsx)
// stays mock-only on purpose; this is the separate surface where
// keychainClient.ts actually signs things and talks to a backend.
//
// Run it: `DEMO=true npm run dev` in packages/GUI/Typescript, against a
// disposable monad started separately (see the console log on load for
// the exact expected endpoint/namespace, both overridable via
// ?endpoint=...&namespace=... query params).
//
// The identity below is a HARDCODED, throwaway BIP-39 phrase -- not a
// real secret, committed on purpose. It exists only so this demo
// reconnects to the SAME identity + namespace across a page reload: a
// real recoverable identity is re-entered by the person each session;
// hardcoding a fixed phrase here stands in for that re-entry without
// building a whole RecoverAccount.tsx flow into a throwaway harness.
// NEVER point DEMO_ENDPOINT at a real, non-disposable monad.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import { createCleakerSession } from '@/core/session/createCleakerSession';
import { deriveIdentityRootHexFromPhrase } from '@/core/identity/recoveryPhrase';
import CleakerKeychain from '@/gui/All.This/Cleaker/Keychain/CleakerKeychain';
import { createKeychainClient, type KeychainClient } from '@/gui/All.This/Cleaker/Keychain/keychainClient';
import type { KeychainKey, KeychainView } from '@/gui/All.This/Cleaker/Keychain/keychainState';

const DEMO_PHRASE = 'giant pigeon ridge powder allow gasp disease turn bean legend track nasty'.split(' ');

const params = new URLSearchParams(window.location.search);
const DEMO_ENDPOINT = params.get('endpoint') || 'http://127.0.0.1:4610';
// The username MUST equal the namespace's own prefix segment -- prove()
// derives the claimed namespace from the currently bound username
// expression (`${username}.${root}`), and a mismatch here throws
// PROOF_NAMESPACE_MISMATCH before any request even goes out.
const DEMO_USERNAME = params.get('username') || 'keychain-demo';
const DEMO_ROOT_NAMESPACE = params.get('root') || 'cleaker.me';
const DEMO_NAMESPACE = `${DEMO_USERNAME}.${DEMO_ROOT_NAMESPACE}`;

type SeedSessionLike = {
  identityHash: string;
  signPayload(message: string): Promise<string>;
};

function pickUnlockedAdminKeyId(keys: KeychainKey[], excludeKeyId?: string): string | null {
  const candidate = keys.find(
    (k) => k.keyId !== excludeKeyId && k.authorization === 'active' && k.localAvailability === 'available-unlocked' && k.admin,
  );
  return candidate?.keyId ?? null;
}

function App() {
  const [session, setSession] = React.useState<SeedSessionLike | null>(null);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const [client, setClient] = React.useState<KeychainClient | null>(null);
  const [keys, setKeys] = React.useState<KeychainKey[]>([]);
  const [pendingLocalRegistrations, setPendingLocalRegistrations] = React.useState<ReturnType<KeychainClient['listPendingLocalRegistrations']>>([]);
  const [view, setView] = React.useState<KeychainView>('list');
  const [focusedKeyId, setFocusedKeyId] = React.useState<string | null>(null);
  const [log, setLog] = React.useState<string[]>([]);

  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-30), `${new Date().toLocaleTimeString()}  ${line}`]);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identityRootHex = await deriveIdentityRootHexFromPhrase(DEMO_PHRASE);
        const s = createCleakerSession({
          username: DEMO_USERNAME,
          namespace: DEMO_NAMESPACE,
          identityRootHex,
          transportOrigin: DEMO_ENDPOINT,
        });
        try {
          await s.claim(DEMO_NAMESPACE);
          pushLog(`Claimed ${DEMO_NAMESPACE} for the first time on ${DEMO_ENDPOINT}.`);
        } catch (claimErr) {
          // eslint-disable-next-line no-console
          console.error('[demo] claim() failed', claimErr);
          pushLog(`claim() failed (${claimErr instanceof Error ? claimErr.message : String(claimErr)}) — trying open() instead.`);
          await s.open(DEMO_NAMESPACE);
          pushLog(`${DEMO_NAMESPACE} was already claimed (expected after a reload) — opened instead.`);
        }
        if (cancelled) return;
        setSession(s);
        setClient(createKeychainClient({ endpoint: DEMO_ENDPOINT, namespace: DEMO_NAMESPACE, rootSigner: s }));
      } catch (err) {
        if (!cancelled) setConnectError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = React.useCallback(async () => {
    if (!client) return;
    setKeys(await client.listKeys());
    setPendingLocalRegistrations(client.listPendingLocalRegistrations());
  }, [client]);

  React.useEffect(() => { refresh(); }, [refresh]);

  if (connectError) {
    return <ErrorScreen message={`Failed to connect: ${connectError}`} endpoint={DEMO_ENDPOINT} />;
  }
  if (!client || !session) {
    return <ConnectingScreen endpoint={DEMO_ENDPOINT} namespace={DEMO_NAMESPACE} />;
  }

  return (
    <Theme>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 12, background: '#111', color: '#0f0' }}>
          endpoint={DEMO_ENDPOINT} namespace={DEMO_NAMESPACE} identityHash={session.identityHash.slice(0, 12)}…
        </div>
        <div style={{ flex: 1 }}>
          <CleakerKeychain
            handle={DEMO_USERNAME}
            keys={keys}
            pendingLocalRegistrations={pendingLocalRegistrations}
            view={view}
            focusedKeyId={focusedKeyId}
            onNavigate={(next, targetId) => { setView(next); if (targetId !== undefined) setFocusedKeyId(targetId ?? null); }}
            onRequestUnlock={async (keyId, passphrase) => {
              const ok = await client.unlockKey(keyId, passphrase);
              pushLog(ok ? `Unlocked ${keyId.slice(0, 8)}… on this device.` : `Wrong passphrase for ${keyId.slice(0, 8)}….`);
              await refresh();
            }}
            onSubmitAddKey={async (label, admin, passphrase) => {
              const actingKeyId = keys.length === 0 ? undefined : pickUnlockedAdminKeyId(keys) ?? undefined;
              if (keys.length > 0 && !actingKeyId) {
                pushLog('No unlocked admin key on this device — unlock one before adding a key.');
                setView('list');
                return;
              }
              const outcome = await client.generateAndRegisterKey({ label, admin, passphrase, actingKeyId });
              pushLog(outcome.ok
                ? `Registered "${label}" as ${outcome.key?.keyId?.slice(0, 8)}….`
                : `Registration failed (${outcome.status} ${outcome.error}) — key kept locally, retry from the list.`);
              setView('list');
              await refresh();
            }}
            onRetryRegistration={async (publicKeyRaw) => {
              const outcome = await client.retryRegistration(publicKeyRaw);
              pushLog(outcome.ok ? `Retry succeeded: ${outcome.key?.keyId?.slice(0, 8)}….` : `Retry failed again (${outcome.status} ${outcome.error}).`);
              await refresh();
            }}
            onConfirmRevoke={async (targetKeyId) => {
              const actingKeyId = pickUnlockedAdminKeyId(keys, targetKeyId) ?? pickUnlockedAdminKeyId(keys);
              if (!actingKeyId) {
                pushLog('No unlocked keychain:admin key available to sign this revocation.');
                setView('list');
                return;
              }
              const outcome = await client.revokeKey(actingKeyId, targetKeyId);
              pushLog(outcome.ok ? `Revoked ${targetKeyId.slice(0, 8)}….` : `Revoke failed (${outcome.status} ${outcome.error}).`);
              setView('list');
              await refresh();
            }}
            onRecoverKeychain={async (label, passphrase) => {
              const outcome = await client.recoverKeychain({ label, passphrase });
              pushLog(outcome.ok
                ? `Recovered — every prior key revoked, new key ${outcome.key?.keyId?.slice(0, 8)}… active.`
                : `Recovery failed (${outcome.status} ${outcome.error}).`);
              setView('list');
              await refresh();
            }}
          />
        </div>
        <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, background: '#f5f5f5', maxHeight: 160, overflowY: 'auto' }}>
          {log.length === 0 ? <div>—</div> : log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>
    </Theme>
  );
}

function ConnectingScreen({ endpoint, namespace }: { endpoint: string; namespace: string }) {
  return (
    <div style={{ fontFamily: 'monospace', padding: 24 }}>
      Connecting to {endpoint} (namespace {namespace})…
    </div>
  );
}

function ErrorScreen({ message, endpoint }: { message: string; endpoint: string }) {
  return (
    <div style={{ fontFamily: 'monospace', padding: 24, color: 'crimson' }}>
      <div>{message}</div>
      <div>Is a disposable monad running at {endpoint}?</div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
