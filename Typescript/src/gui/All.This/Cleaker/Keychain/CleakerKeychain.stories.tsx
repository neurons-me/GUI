import * as React from 'react';
import type { Meta } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import CleakerKeychain, { type PendingLocalRegistration } from './CleakerKeychain';
import type { KeychainKey, KeychainView } from './keychainState';

// me.cleaker.keychain — a navigable prototype of what each keychain
// screen REPRESENTS. keychainClient.ts is now a real, working client
// (see the demo/ app for a real end-to-end mount) — but every callback
// here stays a hand-built local-state mock on purpose: Storybook is
// deliberately never wired to the real client, so nothing in this file
// signs anything, generates a real key, or talks to a backend.
//
// No "pending approval" screen here on purpose: the real protocol
// registers a key atomically (an admin key signs the whole request in
// one call) -- there's no server-side two-step "request, then someone
// approves it later" state for a screen to represent.
const meta: Meta<typeof CleakerKeychain> = {
  title: 'All.This/Cleaker/Keychain',
  component: CleakerKeychain,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

const HANDLE = 'jabellae';
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const THIS_LAPTOP_UNLOCKED: KeychainKey = {
  keyId: 'key-laptop',
  label: 'This laptop',
  admin: true,
  authorization: 'active',
  localAvailability: 'available-unlocked',
  addedAt: now - 40 * DAY,
};

const THIS_LAPTOP_LOCKED: KeychainKey = { ...THIS_LAPTOP_UNLOCKED, localAvailability: 'available-locked' };

// Active and unlocked, but deliberately NOT admin — this key alone must
// never be enough to register or revoke anything.
const SCOPED_UNLOCKED_KEY: KeychainKey = {
  keyId: 'key-scoped',
  label: 'Reporting integration',
  admin: false,
  authorization: 'active',
  localAvailability: 'available-unlocked',
  addedAt: now - 10 * DAY,
};

const PHONE_KEY: KeychainKey = {
  keyId: 'key-phone',
  label: "Sui's iPhone",
  admin: false,
  authorization: 'active',
  localAvailability: 'not-available',
  addedAt: now - 20 * DAY,
};

const OLD_DESKTOP_REVOKED: KeychainKey = {
  keyId: 'key-old-desktop',
  label: 'Old office desktop',
  admin: false,
  authorization: 'revoked',
  localAvailability: 'not-available',
  addedAt: now - 200 * DAY,
  revokedAt: now - 5 * DAY,
};

const PENDING_LOCAL_REGISTRATION: PendingLocalRegistration = {
  publicKeyRaw: 'mock-public-key-raw',
  label: "This laptop's backup key",
  requestedAdmin: false,
};

// A thin stateful wrapper so a story is actually clickable in Storybook
// (navigate between views) instead of a frozen screenshot — still no
// real backend, just local React state standing in for one.
function Interactive({
  initialView, initialFocusedKeyId, keys: initialKeys, pendingLocalRegistrations: initialLocalPending,
}: {
  initialView: KeychainView;
  initialFocusedKeyId?: string | null;
  keys: KeychainKey[];
  pendingLocalRegistrations?: PendingLocalRegistration[];
}) {
  const [view, setView] = React.useState<KeychainView>(initialView);
  const [focusedKeyId, setFocusedKeyId] = React.useState<string | null>(initialFocusedKeyId ?? null);
  const [keys, setKeys] = React.useState<KeychainKey[]>(initialKeys);
  const [pendingLocalRegistrations, setPendingLocalRegistrations] = React.useState<PendingLocalRegistration[]>(initialLocalPending ?? []);

  return (
    <Theme>
      <CleakerKeychain
        handle={HANDLE}
        keys={keys}
        pendingLocalRegistrations={pendingLocalRegistrations}
        view={view}
        focusedKeyId={focusedKeyId}
        onNavigate={(next, targetId) => {
          setView(next);
          if (next === 'local-key-detail' || next === 'confirm-revoke') setFocusedKeyId(targetId ?? null);
        }}
        onRequestUnlock={(keyId) => {
          setKeys((prev) => prev.map((k) => (k.keyId === keyId ? { ...k, localAvailability: 'available-unlocked' } : k)));
        }}
        onSubmitAddKey={(label, admin) => {
          setPendingLocalRegistrations((prev) => [...prev, { publicKeyRaw: `mock-${label}-${Date.now()}`, label, requestedAdmin: admin }]);
          setView('list');
        }}
        onRetryRegistration={(publicKeyRaw) => {
          setPendingLocalRegistrations((prev) => prev.filter((p) => p.publicKeyRaw !== publicKeyRaw));
        }}
        onConfirmRevoke={(keyId) => {
          setKeys((prev) => prev.map((k) => (k.keyId === keyId ? { ...k, authorization: 'revoked', revokedAt: Date.now() } : k)));
          setView('list');
        }}
        onRecoverKeychain={() => {
          setKeys((prev) => prev.map((k) => ({ ...k, authorization: 'revoked', revokedAt: Date.now() })));
          setView('list');
        }}
      />
    </Theme>
  );
}

// 1) List — the default, everyday view: one admin key ready to sign on
// this device, one scoped-but-unlocked key, one authorized-but-elsewhere,
// one revoked. Deliberately the "kitchen sink" story so every status
// combination is visible somewhere without hunting for it.
export const KeyList = () => (
  <Interactive
    initialView="list"
    keys={[THIS_LAPTOP_UNLOCKED, SCOPED_UNLOCKED_KEY, PHONE_KEY, OLD_DESKTOP_REVOKED]}
  />
);

// 2) Local key — locked. Authorized AND on this device, but not usable
// until unlocked — the middle ground between "available" and "not here."
export const LocalKeyLocked = () => (
  <Interactive initialView="local-key-detail" initialFocusedKeyId="key-laptop" keys={[THIS_LAPTOP_LOCKED, PHONE_KEY]} />
);

// 3) Local key — unlocked. Ready to sign, right now, on this device.
export const LocalKeyUnlocked = () => (
  <Interactive initialView="local-key-detail" initialFocusedKeyId="key-laptop" keys={[THIS_LAPTOP_UNLOCKED, PHONE_KEY]} />
);

// 4) Add key — choosing a name and whether it should be an admin key,
// before asking an already-authorized admin key to sign off.
export const AddKey = () => (
  <Interactive initialView="add-key" keys={[THIS_LAPTOP_UNLOCKED, PHONE_KEY]} />
);

// 5) Confirm revocation — the warning copy is the point of this screen:
// revoking a signing key doesn't re-encrypt anything or undo past access.
export const ConfirmRevocation = () => (
  <Interactive initialView="confirm-revoke" initialFocusedKeyId="key-phone" keys={[THIS_LAPTOP_UNLOCKED, PHONE_KEY]} />
);

// 6) Revoked key — shown in place, in the list, dimmed with a Revoked
// badge and timestamp — not a separate full-screen state, because
// revocation is a per-key status, not a different kind of screen.
export const KeyRevoked = () => (
  <Interactive initialView="list" keys={[THIS_LAPTOP_UNLOCKED, { ...PHONE_KEY, authorization: 'revoked', revokedAt: now - 60 * 1000 }]} />
);

// 7) A key generated on this device whose registration didn't complete —
// retryable without regenerating it.
export const RegistrationPendingRetry = () => (
  <Interactive initialView="list" keys={[THIS_LAPTOP_UNLOCKED]} pendingLocalRegistrations={[PENDING_LOCAL_REGISTRATION]} />
);

// 8) No key available locally — this device has none of this identity's
// keys at all. The keychain is still readable; nothing on it is usable
// from here, but recovery is one explicit, clearly-labeled step away.
export const NoLocalKeyAvailable = () => (
  <Interactive initialView="no-local-key" keys={[PHONE_KEY, OLD_DESKTOP_REVOKED]} />
);

// 9) Recovery — deliberately its own screen, reachable from
// NoLocalKeyAvailable, spelling out that it revokes every other key.
export const RecoverKeychain = () => (
  <Interactive initialView="recover" keys={[PHONE_KEY, OLD_DESKTOP_REVOKED]} />
);
