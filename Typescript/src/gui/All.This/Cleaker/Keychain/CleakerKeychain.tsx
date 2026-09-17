// CleakerKeychain.tsx — the UI for an identity's registered signing keys.
// keychainClient.ts (sibling file) is now a real, working protocol client
// — this component itself stays presentation-only: every callback prop is
// still optional with a no-op default so Storybook can keep using pure
// mock state, but a real mount is expected to wire all of them to
// keychainClient.ts, not to fake success locally.
//
// Where this writes: `users.<handle>.keychain.keys.<keyId>` server-side —
// but the client (keychainClient.ts) only ever sends the RELATIVE path;
// see modules/monad/Typescript/src/kernel/manager.ts's
// namespaceToKernelPrefix()/kernelPathFor() for why the server prepends
// `users.<handle>` itself.
//
// The contract every screen below has to hold to:
//   1. The claim keeps one stable identity; the keychain lists which
//      PUBLIC keys are authorized to act for it. Private keys never
//      appear here — they stay encrypted on whichever device generated
//      them (localKeychainKeyVault.ts).
//   2. "Authorized" and "available on this device" are different facts,
//      shown separately, never collapsed into one status pill.
//   3. Every key shows name and status. Registering or revoking a key
//      requires an already-authorized ADMIN key to sign the request —
//      being unlocked is necessary but never sufficient by itself; the
//      server re-checks this independently regardless of what this UI
//      disables. Registration is atomic (the admin key signs in the
//      same request), not a two-step "request, then someone approves
//      it later" flow — there is no pending-request state to show.
//   4. Revoking a SIGNING key stops it from signing new claims. It does
//      NOT re-encrypt data, and does not undo access someone already
//      obtained through a separate ENCRYPTION key — the UI must never
//      imply revocation "undoes" a prior disclosure.
//   5. A key is not intrinsically "a device's key" — it's generic
//      Ed25519 material; "add a key," never "add a device." The
//      keychain itself only has an opinion about ONE thing beyond
//      active/revoked: can this key administer the keychain (`admin`).
//      Whether some OTHER system trusts a signature from an active key
//      for anything specific is that system's own decision — this UI
//      never presents a permission picker for operations the keychain
//      doesn't itself process.
//   6. Recovering with the identity's recovery phrase is a separate,
//      explicit, destructive action from adding a key — it revokes every
//      currently-active key, it never just adds one alongside the rest.
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import type { KeyLocalAvailability, KeychainKey, KeychainView } from './keychainState';

export interface PendingLocalRegistration {
  publicKeyRaw: string;
  label: string;
  requestedAdmin: boolean;
}

export interface CleakerKeychainProps {
  /** Whose keychain this is — display only. */
  handle: string;
  keys: KeychainKey[];
  /** Locally generated keys whose registration hasn't been confirmed by
   *  the server yet — a prior attempt failed, retryable without losing
   *  the generated key. */
  pendingLocalRegistrations?: PendingLocalRegistration[];
  view?: KeychainView;
  /** Which key this screen is about — the local device's own key for
   *  'local-key-detail', the candidate for 'confirm-revoke'. */
  focusedKeyId?: string | null;
  onNavigate?: (view: KeychainView, targetId?: string | null) => void;
  onRequestUnlock?: (keyId: string, passphrase: string) => void;
  // May return a Promise -- AddKeyView awaits it to show a real "working"
  // state instead of leaving the button looking clickable (and inert)
  // for however long the real request takes, flagged live as reading
  // exactly like a hang even when the request was still genuinely
  // in flight.
  onSubmitAddKey?: (label: string, admin: boolean, passphrase: string) => void | Promise<void>;
  onRetryRegistration?: (publicKeyRaw: string) => void;
  onConfirmRevoke?: (keyId: string) => void;
  onRecoverKeychain?: (label: string, passphrase: string) => void;
  sx?: any;
}

// ─── Small shared pieces ────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 1.25,
        p: 1.75, borderRadius: 2,
        border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
      }}
    >
      {children}
    </Box>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <Box
      component="button" type="button" onClick={onClick} disabled={disabled}
      sx={{
        width: '100%', py: 1.1, borderRadius: 1.5, border: 'none',
        bgcolor: disabled ? 'action.disabledBackground' : 'primary.main',
        color: disabled ? 'text.disabled' : 'primary.contrastText',
        fontWeight: 700, fontSize: '0.9rem', cursor: disabled ? 'default' : 'pointer',
        boxSizing: 'border-box',
        '&:hover': disabled ? {} : { filter: 'brightness(1.08)' },
      }}
    >
      {children}
    </Box>
  );
}

function SecondaryButton({ children, onClick, tone = 'default' }: { children: React.ReactNode; onClick?: () => void; tone?: 'default' | 'danger' }) {
  return (
    <Box
      component="button" type="button" onClick={onClick}
      sx={{
        width: '100%', py: 1, borderRadius: 1.5,
        border: '1px solid', borderColor: tone === 'danger' ? 'error.main' : 'divider',
        bgcolor: 'transparent', color: tone === 'danger' ? 'error.main' : 'text.primary',
        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxSizing: 'border-box',
      }}
    >
      {children}
    </Box>
  );
}

function TextField({ label, value, onChange, type = 'text', autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
  const inputId = React.useId();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography component="label" htmlFor={inputId} variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Box
        component="input" id={inputId} type={type} value={value} autoFocus={autoFocus}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        sx={{
          width: '100%', boxSizing: 'border-box', px: 1.25, py: 1, borderRadius: 1.25,
          border: '1px solid', borderColor: 'divider', bgcolor: 'background.default',
          color: 'text.primary', fontSize: '0.9rem', outline: 'none',
          '&:focus': { borderColor: 'primary.main' },
        }}
      />
    </Box>
  );
}

function AdminBadge({ admin }: { admin: boolean }) {
  if (!admin) return null;
  return (
    <Box sx={{ display: 'inline-flex', alignSelf: 'flex-start', px: 0.9, py: 0.25, borderRadius: 999, bgcolor: 'action.selected' }}>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
        keychain:admin
      </Typography>
    </Box>
  );
}

function AdminToggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box
        component="button" type="button" onClick={onToggle}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderRadius: 1.25,
          border: '1px solid', borderColor: checked ? 'primary.main' : 'divider',
          bgcolor: checked ? 'action.selected' : 'transparent', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Box sx={{
          width: 14, height: 14, borderRadius: 0.5, border: '1px solid',
          borderColor: checked ? 'primary.main' : 'divider',
          bgcolor: checked ? 'primary.main' : 'transparent', flexShrink: 0,
        }} />
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Make this key an admin of this keychain</Typography>
      </Box>
      {checked && (
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          Admin keys can register and revoke other keys — grant this deliberately.
        </Typography>
      )}
    </Box>
  );
}

// "Authorized" (top) and "available here" (bottom) are always two
// separate lines — the one rule this whole component exists to enforce
// visually, so it can't quietly collapse back into one status word.
function AuthorizationBadge({ authorization }: { authorization: KeychainKey['authorization'] }) {
  const active = authorization === 'active';
  return (
    <Typography variant="caption" sx={{ fontWeight: 700, color: active ? 'success.main' : 'text.disabled' }}>
      {active ? 'Authorized' : 'Revoked'}
    </Typography>
  );
}

function AvailabilityBadge({ availability }: { availability: KeyLocalAvailability }) {
  const label =
    availability === 'available-unlocked' ? 'Available here — unlocked' :
    availability === 'available-locked' ? 'Available here — locked' :
    'Not available on this device';
  const color =
    availability === 'available-unlocked' ? 'success.main' :
    availability === 'available-locked' ? 'warning.main' :
    'text.disabled';
  return <Typography variant="caption" sx={{ color }}>{label}</Typography>;
}

// ─── Main component ────────────────────────────────────────────────────

export default function CleakerKeychain({
  handle,
  keys,
  pendingLocalRegistrations = [],
  view = 'list',
  focusedKeyId = null,
  onNavigate = () => {},
  onRequestUnlock = () => {},
  onSubmitAddKey = () => {},
  onRetryRegistration = () => {},
  onConfirmRevoke = () => {},
  onRecoverKeychain = () => {},
  sx,
}: CleakerKeychainProps) {
  // Necessary, not sufficient by itself: the server independently
  // re-checks authorization + vigencia + admin standing on every admin
  // mutation, regardless of what this disables.
  const hasAdminKey = keys.some(
    (k) => k.authorization === 'active' && k.localAvailability === 'available-unlocked' && k.admin,
  );

  return (
    <Box data-gui-component="CleakerKeychain" sx={{ maxWidth: 440, mx: 'auto', p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h6">Keychain</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>@{handle}</Typography>
      </Box>

      {view === 'list' && (
        <KeyListView
          keys={keys}
          pendingLocalRegistrations={pendingLocalRegistrations}
          onNavigate={onNavigate}
          onRetryRegistration={onRetryRegistration}
        />
      )}

      {view === 'local-key-detail' && (
        <LocalKeyDetailView
          keyItem={keys.find((k) => k.keyId === focusedKeyId) ?? null}
          onRequestUnlock={onRequestUnlock}
          onBack={() => onNavigate('list')}
        />
      )}

      {view === 'add-key' && (
        <AddKeyView onSubmit={onSubmitAddKey} onBack={() => onNavigate('list')} />
      )}

      {view === 'confirm-revoke' && (
        <ConfirmRevokeView
          keyItem={keys.find((k) => k.keyId === focusedKeyId) ?? null}
          hasAdminKey={hasAdminKey}
          onConfirm={onConfirmRevoke}
          onCancel={() => onNavigate('list')}
        />
      )}

      {view === 'recover' && (
        <RecoverView onRecover={onRecoverKeychain} onCancel={() => onNavigate('list')} />
      )}

      {view === 'no-local-key' && <NoLocalKeyView onNavigate={onNavigate} />}
    </Box>
  );
}

// ─── Screens ────────────────────────────────────────────────────────────

function KeyListView({
  keys, pendingLocalRegistrations, onNavigate, onRetryRegistration,
}: {
  keys: KeychainKey[];
  pendingLocalRegistrations: PendingLocalRegistration[];
  onNavigate: (view: KeychainView, targetId?: string | null) => void;
  onRetryRegistration: (publicKeyRaw: string) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {pendingLocalRegistrations.map((pending) => (
        <Box
          key={pending.publicKeyRaw}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
            px: 1.5, py: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'error.main',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{pending.label || 'Unnamed key'}</Typography>
            <Typography variant="caption" sx={{ color: 'error.main' }}>Generated here, but registration didn't complete</Typography>
          </Box>
          <Typography
            component="button" type="button" onClick={() => onRetryRegistration(pending.publicKeyRaw)}
            variant="caption" sx={{ border: 'none', bgcolor: 'transparent', color: 'primary.main', cursor: 'pointer', fontWeight: 700 }}
          >
            Retry
          </Typography>
        </Box>
      ))}

      {keys.map((k) => (
        <Panel key={k.keyId}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{k.label}</Typography>
              <AuthorizationBadge authorization={k.authorization} />
              {k.authorization === 'active' && <AvailabilityBadge availability={k.localAvailability} />}
              {k.authorization === 'revoked' && k.revokedAt && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Revoked {new Date(k.revokedAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            {k.authorization === 'active' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                {k.localAvailability !== 'not-available' && (
                  <Typography
                    component="button" type="button"
                    onClick={() => onNavigate('local-key-detail', k.keyId)}
                    variant="caption"
                    sx={{ border: 'none', bgcolor: 'transparent', p: 0, color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {k.localAvailability === 'available-locked' ? 'Unlock' : 'Details'}
                  </Typography>
                )}
                <Typography
                  component="button" type="button"
                  onClick={() => onNavigate('confirm-revoke', k.keyId)}
                  variant="caption"
                  sx={{ border: 'none', bgcolor: 'transparent', p: 0, color: 'error.main', cursor: 'pointer', fontWeight: 600 }}
                >
                  Revoke
                </Typography>
              </Box>
            )}
          </Box>
          <AdminBadge admin={k.admin} />
        </Panel>
      ))}

      <PrimaryButton onClick={() => onNavigate('add-key')}>+ Add key</PrimaryButton>
      <Typography
        component="button" type="button" onClick={() => onNavigate('recover')}
        variant="caption"
        sx={{ border: 'none', bgcolor: 'transparent', color: 'text.secondary', cursor: 'pointer', textAlign: 'center' }}
      >
        Lost every key on every device? Recover with your recovery phrase
      </Typography>
    </Box>
  );
}

function LocalKeyDetailView({
  keyItem, onRequestUnlock, onBack,
}: {
  keyItem: KeychainKey | null;
  onRequestUnlock: (keyId: string, passphrase: string) => void;
  onBack: () => void;
}) {
  const [passphrase, setPassphrase] = React.useState('');
  if (!keyItem) return <Typography variant="body2" sx={{ color: 'text.secondary' }}>Key not found.</Typography>;

  const unlocked = keyItem.localAvailability === 'available-unlocked';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Panel>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{keyItem.label}</Typography>
        <AvailabilityBadge availability={keyItem.localAvailability} />
        <AdminBadge admin={keyItem.admin} />
      </Panel>

      {unlocked ? (
        <Typography variant="body2" sx={{ color: 'success.main', textAlign: 'center' }}>
          Ready to sign with this key on this device.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This key's private half is on this device but locked. Unlock it to sign with it here —
            unlocking never sends anything off this device.
          </Typography>
          <TextField label="Unlock passphrase" value={passphrase} onChange={setPassphrase} type="password" autoFocus />
          <PrimaryButton onClick={() => onRequestUnlock(keyItem.keyId, passphrase)} disabled={!passphrase}>
            Unlock
          </PrimaryButton>
        </Box>
      )}
      <SecondaryButton onClick={onBack}>Back</SecondaryButton>
    </Box>
  );
}

function AddKeyView({ onSubmit, onBack }: {
  onSubmit: (label: string, admin: boolean, passphrase: string) => void | Promise<void>;
  onBack: () => void;
}) {
  const [label, setLabel] = React.useState('');
  const [admin, setAdmin] = React.useState(false);
  const [passphrase, setPassphrase] = React.useState('');
  // The one piece of visible feedback this screen was missing entirely --
  // the button had no state of its own between "idle" and "gone" (the
  // parent navigates away on completion), so however long the real
  // request took, it just sat there looking clickable and doing nothing
  // visible. Flagged live as reading exactly like a hang, request still
  // in flight or not. A mounted-ref guard, not just a bare setState,
  // because the parent's own onSubmit already calls setView('list') on
  // completion -- this component can unmount before its own `finally`
  // runs, and setting state on it after that would just be a harmless
  // no-op React would otherwise warn about.
  const [submitting, setSubmitting] = React.useState(false);
  const mountedRef = React.useRef(true);
  React.useEffect(() => () => { mountedRef.current = false; }, []);

  const canSubmit = label.trim().length > 0 && passphrase.length > 0 && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(label, admin, passphrase);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        This generates a new key on THIS device, then asks an already-authorized admin key to sign
        off on it. The new key can't sign anything until that happens.
      </Typography>
      <TextField label="Name this key" value={label} onChange={setLabel} autoFocus />
      <AdminToggle checked={admin} onToggle={() => setAdmin((prev) => !prev)} />
      <TextField label="Encrypt this key locally with" value={passphrase} onChange={setPassphrase} type="password" />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        This passphrase only protects the copy stored on this device — it never leaves it.
      </Typography>
      <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? 'Working…' : 'Generate & request authorization'}
      </PrimaryButton>
      <SecondaryButton onClick={onBack}>Back</SecondaryButton>
    </Box>
  );
}

function ConfirmRevokeView({
  keyItem, hasAdminKey, onConfirm, onCancel,
}: {
  keyItem: KeychainKey | null;
  hasAdminKey: boolean;
  onConfirm: (keyId: string) => void;
  onCancel: () => void;
}) {
  if (!keyItem) return <Typography variant="body2" sx={{ color: 'text.secondary' }}>Key not found.</Typography>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Panel>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Revoke "{keyItem.label}"?</Typography>
        <AdminBadge admin={keyItem.admin} />
      </Panel>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        This stops "{keyItem.label}" from signing anything new. It does <strong>not</strong>{' '}
        re-encrypt any data, and it does not undo access anyone already obtained through a
        separate encryption key — revoking a signing key is not the same as protecting past data.
      </Typography>
      {!hasAdminKey && (
        <Typography variant="body2" sx={{ color: 'warning.main' }}>
          Unlock an admin key on this device before you can revoke — this itself has to be signed
          by a specifically authorized admin key, not just confirmed by being unlocked.
        </Typography>
      )}
      <SecondaryButton tone="danger" onClick={() => onConfirm(keyItem.keyId)}>
        {hasAdminKey ? 'Revoke this key' : 'Unlock an admin key first'}
      </SecondaryButton>
      <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
    </Box>
  );
}

function RecoverView({ onRecover, onCancel }: {
  onRecover: (label: string, passphrase: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = React.useState('');
  const [passphrase, setPassphrase] = React.useState('');
  const canSubmit = label.trim().length > 0 && passphrase.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Panel>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
          Recover this keychain with your recovery phrase
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This revokes <strong>every currently active key</strong> — on this device and any other
          — and creates exactly one new admin key here. Use this when every key you had is lost,
          not to add a key alongside ones that still work.
        </Typography>
      </Panel>
      <TextField label="Name the new key this creates" value={label} onChange={setLabel} autoFocus />
      <TextField label="Encrypt this key locally with" value={passphrase} onChange={setPassphrase} type="password" />
      <SecondaryButton tone="danger" onClick={() => onRecover(label, passphrase)}>
        Revoke every key and recover
      </SecondaryButton>
      <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
    </Box>
  );
}

function NoLocalKeyView({ onNavigate }: { onNavigate: (view: KeychainView) => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700, textAlign: 'center' }}>
        No key from this identity is available on this device.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        You can still see what's in the keychain, but this device can't sign, register, or revoke
        anything until it has one of your keys.
      </Typography>
      <Panel>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Two ways to fix that</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          • On a device that already has an admin key, register this device's public key for it.
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          • Recover your identity here with your recovery phrase — this revokes every other key.
        </Typography>
      </Panel>
      <SecondaryButton tone="danger" onClick={() => onNavigate('recover')}>
        Recover with recovery phrase
      </SecondaryButton>
    </Box>
  );
}
