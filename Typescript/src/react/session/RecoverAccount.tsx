// RecoverAccount.tsx — the "forgot password" flow: username + 12-word
// phrase, no old password, gets back BOTH identity and data access. Real
// as of this file — recoverWithPhrase() (SeedSessionProvider.tsx)
// re-derives the exact root the original registration used, which
// reproduces the exact wire secret the server already scrypt's `noise`
// against, so this hits the ordinary, already-existing open() endpoint —
// no new server capability, and the phrase/root never leave the client.
// See RegisterMe.tsx for the mirror-image flow (claim, not recover).
import React, { useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import Passphrase from '@/gui/All.This/Cleaker/Passphrase/Passphrase';
import { deriveIdentityRootBytesFromPhrase } from '@/core/identity/recoveryPhrase';
import { saveLocalIdentityVault } from '@/core/identity/localIdentityVault';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';

export interface RecoverAccountProps {
  /** Root namespace to recover into, e.g. "local.cleaker". */
  namespace?: string;
  /** Shown as a link back to the sign-in form. Omit to hide the link. */
  onSwitchToSignIn?: () => void;
  /**
   * Fires once recovery AND the new local vault are both done — not just
   * once open() succeeds. Same reasoning as RegisterMe's onRegistered: a
   * host page that also renders its own authenticated view needs to wait
   * for the whole flow, not just the moment `authenticated` flips true.
   */
  onRecovered?: () => void;
  sx?: any;
}

const WORD_COUNT = 12;

type RecoverStep = 'form' | 'set-password' | 'done';

export default function RecoverAccount({ namespace, onSwitchToSignIn, onRecovered, sx }: RecoverAccountProps) {
  const session = useOptionalSeedSessionContext();
  const [username, setUsername] = useState('');
  const [words, setWords] = useState<string[]>(Array.from({ length: WORD_COUNT }, () => ''));
  const [step, setStep] = useState<RecoverStep>('form');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [vaultPending, setVaultPending] = useState(false);
  const [vaultError, setVaultError] = useState<Error | null>(null);

  if (!session) return null;

  const { pending, error, recoverWithPhrase, semanticNamespace } = session;

  const phraseComplete = words.every((w) => w.trim().length > 0);
  const canSubmit = Boolean(username.trim()) && phraseComplete;

  const handleRecover = async () => {
    if (!canSubmit) return;
    // Left unguarded (matches RegisterMe's claim-attempt convention): the
    // session provider records the failure as session.error — including
    // INVALID_RECOVERY_PHRASE for a malformed phrase, or the generic
    // INVALID_CLAIM a wrong username/phrase pairing produces — before
    // throwing, so it renders below without a local catch.
    await recoverWithPhrase({ username: username.trim(), words, namespace });
    setStep('set-password');
  };

  const newPasswordsMismatch = confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;
  const canSetPassword = Boolean(newPassword) && newPassword === confirmNewPassword;

  const handleSetPassword = async () => {
    if (!canSetPassword || !semanticNamespace || vaultPending) return;
    setVaultPending(true);
    setVaultError(null);
    try {
      // Re-derived rather than carried over from handleRecover — same
      // reasoning as RegisterMe's own vault step: raw root bytes live in
      // memory only as long as this one call needs them.
      const rootBytes = await deriveIdentityRootBytesFromPhrase(words);
      await saveLocalIdentityVault(semanticNamespace, rootBytes, newPassword);
      setStep('done');
      setWords(Array.from({ length: WORD_COUNT }, () => ''));
      setUsername('');
      setNewPassword('');
      setConfirmNewPassword('');
      onRecovered?.();
    } catch (cause) {
      setVaultError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      setVaultPending(false);
    }
  };

  if (step === 'set-password') {
    return (
      <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
        <Box sx={{ textAlign: 'center', mb: -1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            Set a New Password
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Recovered <strong>{semanticNamespace}</strong>. This password stays on this device only — it unlocks a
            local copy of your identity so you don&apos;t need the phrase every time.
          </Typography>
        </Box>

        <TextField
          label="New Secret"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={vaultPending}
          autoFocus
          fullWidth
        />
        <TextField
          label="Confirm New Secret"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          disabled={vaultPending}
          error={newPasswordsMismatch}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSetPassword(); }}
          fullWidth
        />

        {(newPasswordsMismatch || vaultError) && (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            {newPasswordsMismatch ? 'Secrets do not match.' : vaultError!.message}
          </Typography>
        )}

        <Box
          component="button"
          type="button"
          onClick={handleSetPassword}
          disabled={!canSetPassword || vaultPending}
          data-gui-node-id="RecoverAccount.setPassword"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 1.25,
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            background: 'transparent',
            color: 'primary.main',
            cursor: !canSetPassword || vaultPending ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {vaultPending ? '…' : 'Continue'}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (step === 'done') {
    return (
      <Box sx={{ width: '100%', maxWidth: 360, textAlign: 'center', ...sx }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Recovered <strong>{semanticNamespace}</strong>.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      <Box sx={{ textAlign: 'center', mb: -1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          Recover Account
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {namespace ? (
            <>Recovers an identity at <strong>{namespace}</strong> from its 12-word phrase. No password needed.</>
          ) : (
            <>Recovers an identity from its 12-word phrase. No password needed.</>
          )}
        </Typography>
      </Box>

      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={pending}
        autoFocus
        fullWidth
      />

      <Passphrase mode="input" value={words} onChange={setWords} disabled={pending} />

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          {error.message}
        </Typography>
      )}

      <Box
        component="button"
        type="button"
        onClick={handleRecover}
        disabled={pending || !canSubmit}
        data-gui-node-id="RecoverAccount.submit"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 1.25,
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 1,
          background: 'transparent',
          color: 'primary.main',
          cursor: pending || !canSubmit ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {pending ? '…' : 'Recover'}
        </Typography>
      </Box>

      {onSwitchToSignIn && (
        <Box
          component="button"
          type="button"
          onClick={onSwitchToSignIn}
          data-gui-node-id="RecoverAccount.switchToSignIn"
          sx={{
            background: 'transparent',
            border: 0,
            color: 'text.secondary',
            cursor: 'pointer',
            fontSize: '0.8rem',
            textDecoration: 'underline',
            p: 0,
          }}
        >
          Remember your secret? Sign in
        </Box>
      )}
    </Box>
  );
}
