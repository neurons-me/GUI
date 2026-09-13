// RegisterMe.tsx — the explicit, deliberate counterpart to CleakerLanding's
// "Hello, I am…" sign-in form. Claiming a namespace is a decision a person
// makes on purpose, not a side effect of a mistyped or unrecognized
// username in the sign-in box (see SeedSessionProvider.tsx's
// openExistingNamespace — the auto-claim-on-CLAIM_NOT_FOUND fallback was
// removed for exactly this reason). This form is the only place that calls
// registerWithCredentials(), which always claims.
import React, { useMemo, useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import QRme from '@/gui/All.This/me/QR/QR.me';
import Passphrase from '@/gui/All.This/Cleaker/Passphrase/Passphrase';
import { buildCleakerNamespaceUrl } from '@/gui/All.This/Cleaker/namespaceExpression';
import {
  deriveIdentityRootBytesFromPhrase,
  deriveIdentityRootHexFromPhrase,
  generateRecoveryPhrase,
} from '@/core/identity/recoveryPhrase';
import { saveLocalIdentityVault } from '@/core/identity/localIdentityVault';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';

// Same bubble CleakerLanding's sign-in form shows — kept here too (not just
// on the parent page) so RegisterMe reads as a complete page on its own
// (its own Storybook story has no CleakerLanding chrome around it), and so
// CleakerLanding can skip rendering a second one when it swaps in this
// component for its "register" mode. Unlike the sign-in bubble (which
// reflects whatever's typed in the OTHER form), this one previews the
// identity actually being created here: <username-so-far>.<namespace>.
const QR_DIAMETER_DEFAULT = 125;
const QR_DIAMETER_EXPANDED = 214;

export interface RegisterMeProps {
  /** Root namespace to register into, e.g. "local.cleaker". Omit to let
   *  the session provider resolve one (active root switch, then gateway). */
  namespace?: string;
  /** Shown as a link back to the sign-in form. Omit to hide the link (e.g.
   *  when this is the only form on the page). */
  onSwitchToSignIn?: () => void;
  /**
   * Fires once the ENTIRE flow is done — claim accepted, backup confirmed,
   * local vault written — not just when the claim itself succeeds. A host
   * page (e.g. CleakerLanding) that also renders its own authenticated view
   * needs this distinction: `session.authenticated` flips true as soon as
   * the claim is accepted, well before backup/vault are done, and switching
   * away at that point would unmount this component mid-flow and skip both.
   */
  onRegistered?: () => void;
  sx?: any;
}

type RegisterStep = 'form' | 'backup' | 'done';

export default function RegisterMe({ namespace, onSwitchToSignIn, onRegistered, sx }: RegisterMeProps) {
  const session = useOptionalSeedSessionContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Generated ONCE per mount, not per submit — a rejected claim (namespace
  // taken, network error) must be retryable with the SAME phrase rather
  // than silently minting a new one on every click, and a phrase must
  // never be regenerated once its claim has actually been accepted (see
  // step below: the phrase only stops being "the" phrase for this identity
  // once backup is confirmed and it's wrapped into the local vault).
  const [words, setWords] = useState<string[]>(() => generateRecoveryPhrase());
  const [step, setStep] = useState<RegisterStep>('form');
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [derivationError, setDerivationError] = useState<Error | null>(null);
  const [vaultPending, setVaultPending] = useState(false);
  const [vaultError, setVaultError] = useState<Error | null>(null);

  const qrValue = useMemo(() => {
    if (!namespace) return '';
    try {
      return buildCleakerNamespaceUrl(namespace, username.trim() || undefined);
    } catch {
      return namespace;
    }
  }, [namespace, username]);

  if (!session) return null;

  const { pending, error, registerWithCredentials, semanticNamespace } = session;

  const secretsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = Boolean(username.trim()) && Boolean(password) && password === confirmPassword;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setDerivationError(null);
    // Keys exist BEFORE the claim is requested, and the claim is bound to
    // their public half via a real signed proof (createCleakerSession's
    // identityRootHex -> prove()) — never a self-asserted identityHash.
    // Derivation failing here (should only ever happen on a genuine
    // WebCrypto failure) is reported locally: registerWithCredentials()
    // hasn't been called yet, so there's nothing for the session's own
    // error state to have caught.
    let identityRootHex: string;
    try {
      identityRootHex = await deriveIdentityRootHexFromPhrase(words);
    } catch (cause) {
      setDerivationError(cause instanceof Error ? cause : new Error(String(cause)));
      return;
    }
    // A rejected claim (NAMESPACE_TAKEN, network error, ...) throws here —
    // deliberately left unguarded, matching this form's existing
    // convention: the session provider already records the failure as
    // session.error before throwing, so it renders below without a local
    // catch. Nothing has been accepted yet, so nothing to lose or overwrite
    // — the same `words` above are still there for a retry.
    await registerWithCredentials({ username: username.trim(), password, namespace, identityRootHex });
    setStep('backup');
  };

  const handleConfirmBackup = async () => {
    if (!backupConfirmed || !semanticNamespace || vaultPending) return;
    setVaultPending(true);
    setVaultError(null);
    try {
      // Re-derives from the phrase rather than reusing a value stashed
      // during handleRegister — one extra (cheap) HKDF pass, in exchange
      // for never having raw root bytes sitting in state any longer than
      // this one call needs them.
      const rootBytes = await deriveIdentityRootBytesFromPhrase(words);
      await saveLocalIdentityVault(semanticNamespace, rootBytes, password);
      setStep('done');
      // The phrase has done its job (claim proven, root wrapped into the
      // local vault) — nothing downstream needs the plaintext words in
      // memory any longer, and this component staying mounted a while
      // longer (MeRuntimeProvider no longer forces a remount here) is no
      // longer a reason for them to keep sitting in state.
      setWords([]);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      onRegistered?.();
    } catch (cause) {
      setVaultError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      setVaultPending(false);
    }
  };

  if (step === 'backup') {
    return (
      <Box sx={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
        <Box sx={{ textAlign: 'center', mb: -1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            Back Up Your Identity
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Claimed <strong>{semanticNamespace}</strong>. This phrase is the only way to recover it — it is never sent anywhere.
          </Typography>
        </Box>

        <Passphrase mode="reveal" words={words} confirmed={backupConfirmed} onConfirmedChange={setBackupConfirmed} />

        {vaultError && (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            {vaultError.message}
          </Typography>
        )}

        <Box
          component="button"
          type="button"
          onClick={handleConfirmBackup}
          disabled={!backupConfirmed || vaultPending}
          data-gui-node-id="RegisterMe.confirmBackup"
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
            cursor: !backupConfirmed || vaultPending ? 'not-allowed' : 'pointer',
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
          Registered as <strong>{semanticNamespace}</strong>.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      <Box
        role="button"
        tabIndex={0}
        aria-label={expanded ? 'Shrink .me QR' : 'Expand .me QR to scan'}
        onClick={() => setExpanded((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
        sx={{ cursor: 'pointer', display: 'inline-flex', alignSelf: 'center' }}
      >
        <QRme
          value={qrValue}
          username={username.trim() || undefined}
          diameter={expanded ? QR_DIAMETER_EXPANDED : QR_DIAMETER_DEFAULT}
          hoverFlip={false}
          clickFlip={false}
          data-gui-node-id="RegisterMe.bubble"
          style={{ transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </Box>

      <Box sx={{ textAlign: 'center', mb: -1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          Register
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {namespace ? (
            <>Claims a new username at <strong>{namespace}</strong>.</>
          ) : (
            <>Claims a new username at the resolved root namespace.</>
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
      <TextField
        label="Secret"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={pending}
        fullWidth
      />
      <TextField
        label="Confirm Secret"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={pending}
        error={secretsMismatch}
        onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
        fullWidth
      />

      {(secretsMismatch || error || derivationError) && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          {secretsMismatch ? 'Secrets do not match.' : (error || derivationError)!.message}
        </Typography>
      )}

      <Box
        component="button"
        type="button"
        onClick={handleRegister}
        disabled={pending || !canSubmit}
        data-gui-node-id="RegisterMe.submit"
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
          cursor: pending ? 'wait' : 'pointer',
          fontWeight: 600,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {pending ? '…' : 'Claim Username'}
        </Typography>
      </Box>

      {onSwitchToSignIn && (
        <Box
          component="button"
          type="button"
          onClick={onSwitchToSignIn}
          data-gui-node-id="RegisterMe.switchToSignIn"
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
          Already have an identity? Sign in
        </Box>
      )}
    </Box>
  );
}
