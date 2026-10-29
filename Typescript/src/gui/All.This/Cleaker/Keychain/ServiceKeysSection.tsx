// ServiceKeysSection.tsx — "Service keys": third-party API credentials
// (Twitch, PayPal Sandbox, Meta) kept next to, but separate from, the
// keychain's signing keys. Each card writes through serviceKeyVault.ts
// (encrypted under the passphrase, per namespace). Once saved, a value is
// NEVER rendered back: inputs clear and the card only says "Saved".
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import ServiceIcon from './ServiceIcons';
import {
  SERVICE_DEFINITIONS, hasServiceKeys, removeServiceKeys, saveServiceKeys,
  type ServiceDef, type ServiceId,
} from './serviceKeyVault';

export const SERVICE_KEYS_CHANGED_EVENT = 'cleaker:service-keys-changed';

export interface ServiceKeysSectionProps {
  /** The identity namespace the keys are stored under (e.g. "jabellae.local.cleaker"). */
  namespace: string;
  /** Scrolls to and highlights one card (from '/keychain#twitch'). */
  focusedService?: ServiceId | null;
}

function notifyChanged(namespace: string) {
  try { window.dispatchEvent(new CustomEvent(SERVICE_KEYS_CHANGED_EVENT, { detail: { namespace } })); } catch { /* non-browser */ }
}

export default function ServiceKeysSection({ namespace, focusedService = null }: ServiceKeysSectionProps) {
  return (
    <Box id="services" data-gui-component="ServiceKeys" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Service keys</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          API credentials for other services. Encrypted on this device with your passphrase; never shown again after saving.
        </Typography>
      </Box>
      {SERVICE_DEFINITIONS.map((def) => (
        <ServiceCard key={def.id} namespace={namespace} def={def} focused={focusedService === def.id} />
      ))}
    </Box>
  );
}

const inputSx = {
  width: '100%', boxSizing: 'border-box', px: 1.25, py: 0.9, borderRadius: 1.5,
  border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', color: 'text.primary',
  font: 'inherit', fontSize: '0.85rem', outline: 'none', '&:focus': { borderColor: 'primary.main' },
} as const;

function ServiceCard({ namespace, def, focused }: { namespace: string; def: ServiceDef; focused: boolean }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [saved, setSaved] = React.useState(() => hasServiceKeys(namespace, def.id));
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [passphrase, setPassphrase] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const uid = React.useId();

  React.useEffect(() => { setSaved(hasServiceKeys(namespace, def.id)); }, [namespace, def.id]);
  React.useEffect(() => {
    if (focused) ref.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [focused]);

  const anyValue = def.fields.some((f) => (values[f.id] ?? '').trim());
  const canSave = anyValue && passphrase.length > 0 && !busy;

  async function onSave() {
    if (!canSave) return;
    setBusy(true); setMessage(null);
    try {
      await saveServiceKeys(namespace, def.id, values, passphrase);
      setValues({}); setPassphrase(''); setSaved(true); setMessage('Saved');
      notifyChanged(namespace);
    } catch (e: any) {
      // Never echo values: only the error code.
      setMessage(e?.message === 'NO_FIELDS' ? 'Fill in at least one field.' : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  function onRemove() {
    removeServiceKeys(namespace, def.id);
    setSaved(false); setConfirmRemove(false); setMessage('Removed');
    notifyChanged(namespace);
  }

  return (
    <Box
      ref={ref} id={`service-${def.id}`} data-service={def.id}
      sx={{
        display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, borderRadius: 2,
        border: '1px solid', borderColor: focused ? 'primary.main' : 'divider', bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', color: saved ? 'text.primary' : 'text.disabled' }}>
          <ServiceIcon service={def.id} />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{def.name}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: saved ? 'success.main' : 'text.disabled' }}>
          {saved ? 'Saved' : 'Not set'}
        </Typography>
      </Box>

      {def.fields.map((f) => (
        <Box key={f.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography component="label" htmlFor={`${uid}-${f.id}`} variant="caption" sx={{ color: 'text.secondary' }}>{f.label}</Typography>
          <Box
            component="input" id={`${uid}-${f.id}`} type={f.secret ? 'password' : 'text'} autoComplete="off" spellCheck={false}
            placeholder={saved ? 'Saved — type to replace' : ''}
            value={values[f.id] ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
            sx={inputSx}
          />
        </Box>
      ))}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography component="label" htmlFor={`${uid}-pp`} variant="caption" sx={{ color: 'text.secondary' }}>Passphrase (encrypts these keys)</Typography>
        <Box
          component="input" id={`${uid}-pp`} type="password" autoComplete="current-password"
          value={passphrase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassphrase(e.target.value)}
          sx={inputSx}
        />
      </Box>

      {confirmRemove ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ flex: 1, color: 'error.main' }}>Remove {def.name} keys from this device?</Typography>
          <SmallButton onClick={() => setConfirmRemove(false)}>Cancel</SmallButton>
          <SmallButton tone="danger" onClick={onRemove}>Remove</SmallButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }} role="status">{message ?? ''}</Typography>
          {saved && <SmallButton tone="danger" onClick={() => setConfirmRemove(true)}>Remove</SmallButton>}
          <SmallButton tone="primary" disabled={!canSave} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</SmallButton>
        </Box>
      )}
    </Box>
  );
}

function SmallButton({ children, onClick, disabled, tone = 'default' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'default' | 'primary' | 'danger';
}) {
  const primary = tone === 'primary';
  return (
    <Box
      component="button" type="button" onClick={onClick} disabled={disabled}
      sx={{
        px: 1.5, py: 0.6, borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem', font: 'inherit',
        border: primary ? 'none' : '1px solid',
        borderColor: tone === 'danger' ? 'error.main' : 'divider',
        bgcolor: primary ? (disabled ? 'action.disabledBackground' : 'primary.main') : 'transparent',
        color: primary ? (disabled ? 'text.disabled' : 'primary.contrastText') : tone === 'danger' ? 'error.main' : 'text.primary',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </Box>
  );
}
