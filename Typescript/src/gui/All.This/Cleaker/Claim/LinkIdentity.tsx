// "Use my identity here": claims a name in THIS namespace with an identity another open link of the same local context
// already holds. It is its own form on purpose, next to Register and never inside it: Register creates a new identity
// (and shows its phrase); this one generates nothing, it presents an identity that already exists and asks for the claim.
// Which identity is chosen by the person, by what it is (its fingerprint and where it is open), never by which link
// opened last. It is offered only when the context holds at least one identity not yet linked under this root.
import React, { useEffect, useMemo, useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import { useOptionalSeedSessionContext } from '@/react/session/SeedSessionProvider';
import type { HeldIdentity } from '@/core/session/heldIdentities';

/** Identities held under the context that have no link under `root` yet (the only ones that can be used here). */
export function linkableIdentities(held: readonly HeldIdentity[], root?: string | null): HeldIdentity[] {
  const r = String(root || '').trim().toLowerCase();
  if (!r) return [...held];
  return held.filter((h) => !h.links.some((l) => {
    const ns = l.namespace.toLowerCase();
    return ns === r || ns.endsWith(`.${r}`);
  }));
}

export interface LinkIdentityProps {
  /** Root namespace to claim into. Omit to let the session provider resolve one. */
  namespace?: string;
  onSwitchToSignIn?: () => void;
  /** Fires once the claim was accepted. */
  onLinked?: () => void;
  sx?: any;
}

export default function LinkIdentity({ namespace, onSwitchToSignIn, onLinked, sx }: LinkIdentityProps) {
  const session = useOptionalSeedSessionContext();
  const options = useMemo(() => linkableIdentities(session?.heldIdentities ?? [], namespace), [session?.heldIdentities, namespace]);
  const [chosen, setChosen] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  // The selection follows what is held: if the chosen identity is no longer open, nothing is silently picked in its
  // place unless there is exactly one candidate.
  useEffect(() => {
    if (options.some((o) => o.identityHash === chosen)) return;
    setChosen(options.length === 1 ? options[0].identityHash : '');
  }, [options, chosen]);
  const selected = options.find((o) => o.identityHash === chosen) || null;
  // The handle it has elsewhere is a suggestion, never imposed.
  useEffect(() => {
    if (!touched) setUsername(selected?.handles[0]?.split('.')[0] || '');
  }, [selected, touched]);

  if (!session) return null;
  const { pending, error, linkExistingIdentity } = session;
  const canSubmit = Boolean(selected) && Boolean(username.trim());

  const submit = async () => {
    if (!canSubmit || !selected) return;
    try {
      await linkExistingIdentity({ identityHash: selected.identityHash, username: username.trim(), namespace, password: password || undefined });
    } catch {
      return; // already recorded as session.error, which is what renders below
    }
    setPassword('');
    onLinked?.();
  };

  return (
    <Box data-gui-node-id="LinkIdentity" sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" data-gui-node-id="LinkIdentity.heading" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          Use my identity here
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {namespace ? <>Claims a name at <strong>{namespace}</strong> with an identity you already have open.</> : <>Claims a name here with an identity you already have open.</>}
          {' '}No new identity is created.
        </Typography>
      </Box>

      {options.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          There is no open identity here that is not already linked to this namespace.
        </Typography>
      ) : (
        <Box role="radiogroup" aria-label="Identity to use" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {options.map((o) => {
            const active = o.identityHash === chosen;
            return (
              <Box
                key={o.identityHash}
                component="button"
                type="button"
                role="radio"
                aria-checked={active}
                data-gui-node-id={`LinkIdentity.identity.${o.identityHash.slice(0, 8)}`}
                onClick={() => { setChosen(o.identityHash); setTouched(false); }}
                disabled={pending}
                sx={{
                  textAlign: 'left', p: 1.25, borderRadius: 1, border: '1px solid', cursor: pending ? 'wait' : 'pointer',
                  borderColor: active ? 'primary.main' : 'divider', background: 'transparent', color: 'inherit',
                  display: 'flex', flexDirection: 'column', gap: 0.25,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                  {o.links.map((l) => l.namespace).join(' · ')}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {o.identityHash.slice(0, 10)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      <TextField
        label="Username here"
        data-gui-node-id="LinkIdentity.username"
        value={username}
        onChange={(e) => { setTouched(true); setUsername(e.target.value); }}
        disabled={pending || !selected}
        fullWidth
      />
      <TextField
        label="Secret for this browser (optional)"
        data-gui-node-id="LinkIdentity.secret"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={pending || !selected}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        helperText="With one, this identity can be opened here later by name and secret."
        fullWidth
      />

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>{error.message}</Typography>
      )}

      <Box
        component="button"
        type="button"
        onClick={submit}
        disabled={pending || !canSubmit}
        data-gui-node-id="LinkIdentity.submit"
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, p: 1.25, border: '1px solid',
          borderColor: 'primary.main', borderRadius: 1, background: 'transparent', color: 'primary.main',
          cursor: pending ? 'wait' : canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : 0.6, fontWeight: 600,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{pending ? '…' : 'Use this identity'}</Typography>
      </Box>

      {onSwitchToSignIn && (
        <Box
          component="button"
          type="button"
          onClick={onSwitchToSignIn}
          data-gui-node-id="LinkIdentity.switchToSignIn"
          sx={{ background: 'transparent', border: 0, color: 'text.secondary', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', p: 0 }}
        >
          Back to sign in
        </Box>
      )}
    </Box>
  );
}
