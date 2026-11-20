// ServiceKeysSection.tsx — "Service keys": third-party API credentials
// (Twitch, PayPal Sandbox, Meta) kept next to, but separate from, the
// keychain's signing keys. Each card writes through serviceKeyVault.ts
// (encrypted under the passphrase, per namespace). Once saved, a value is
// NEVER rendered back: inputs clear and the card only says "Saved".
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import Tooltip from '@/gui/Atoms/Tooltip/Tooltip';
import ServiceIcon from './ServiceIcons';
import SecretInput from './SecretInput';
import { capsOf, type KeyAccess } from './keyTree';
import {
  SERVICE_DEFINITIONS, getServiceKeys, hasServiceKeys, removeServiceKeys, saveServiceKeys,
  type ServiceDef, type ServiceId,
} from './serviceKeyVault';

export const SERVICE_KEYS_CHANGED_EVENT = 'cleaker:service-keys-changed';

export interface ServiceKeysSectionProps {
  /** The identity namespace the keys are stored under (e.g. "jabellae.local.cleaker"). */
  namespace: string;
  /** Scrolls to and highlights one card (from '/keychain#twitch'). */
  focusedService?: ServiceId | null;
  /** Scrolls the whole section into view (from '/keychain#services', the QR row's "+N" button). */
  focusSection?: boolean;
}

export function notifyServiceKeysChanged(namespace: string) {
  try { window.dispatchEvent(new CustomEvent(SERVICE_KEYS_CHANGED_EVENT, { detail: { namespace } })); } catch { /* non-browser */ }
}

export default function ServiceKeysSection({ namespace, focusedService = null, focusSection = false }: ServiceKeysSectionProps) {
  const sectionRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!focusSection) return;
    // After layout: the keychain list above loads asynchronously and would push the section down.
    const t = setTimeout(() => sectionRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 150);
    return () => clearTimeout(t);
  }, [focusSection]);
  return (
    <Box ref={sectionRef} id="services" data-gui-component="ServiceKeys" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Service keys</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          API credentials for other services. Encrypted on this device with your passphrase; never shown again after saving.
        </Typography>
      </Box>
      {SERVICE_DEFINITIONS.map((def) => (
        <ServiceKeyCard key={def.id} namespace={namespace} def={def} focused={focusedService === def.id} />
      ))}
    </Box>
  );
}

export const SAVED_PLACEHOLDER = '••••••';

/** Status line for a viewer without edit rights. */
export function accessNote(access: KeyAccess): string {
  return access === 'none' ? 'No access: the path is visible, the value is not.' : access === 'read' ? 'Read only' : '';
}

export const inputSx = {
  width: '100%', minWidth: 0, boxSizing: 'border-box', px: 1.25, py: 0.9, borderRadius: 1.5,
  border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', color: 'text.primary',
  font: 'inherit', typography: 'body2', lineHeight: 1.4, outline: 'none', '&:focus': { borderColor: 'primary.main' },
} as const;

/** How a key editor sits: a standalone card, or a flush branch of the keys tree. */
export type KeyCardTone = 'card' | 'branch';

/** Denser, square-cornered fields used when the editor is a tree branch (not a floating card). */
export const branchInputSx = {
  ...inputSx,
  px: 1, py: 0.4, borderRadius: 0.5, typography: 'body2', bgcolor: 'transparent',
} as const;

export function keyCardShellSx(tone: KeyCardTone = 'card', focused = false) {
  if (tone === 'branch') {
    return {
      display: 'flex', flexDirection: 'column', gap: 0.6, p: 0,
      border: 'none', borderRadius: 0, bgcolor: 'transparent',
      width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box',
    } as const;
  }
  return {
    display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, borderRadius: 2,
    border: '1px solid', borderColor: focused ? 'primary.main' : 'divider', bgcolor: 'background.paper',
  } as const;
}

export interface ServiceKeyCardProps {
  namespace: string; def: ServiceDef; focused?: boolean;
  /** Opt-in (keys tree): the .me path of each field, exposed on hover (title) only. */
  fieldPath?: (fieldId: string) => string;
  /** data-gui-node-id per field input; defaults to fieldPath. */
  fieldNodeId?: (fieldId: string) => string;
  /** Called after a successful save (the keys tree moves the new item to the front). */
  onSaved?: () => void;
  /** Optional row rendered at the top of the card (the new-key card's "Start from"). */
  header?: React.ReactNode;
  /** Shows a ✕ in the top-right corner (keys tree). Omit on the Keys page. */
  onClose?: () => void;
  /** After the keys were removed from this device. */
  onRemoved?: () => void;
  /** What the viewer may do: edit (default, the owner), read (show/copy with the passphrase), none (path only). */
  access?: KeyAccess;
  /** `branch`: flush with the keys tree (square, no paper fill). Default keeps the standalone card. */
  tone?: KeyCardTone;
  /** A NEW key ("+"): legacy fields are not asked. A saved key always shows every field it may hold. */
  hideLegacy?: boolean;
}

/** One service's form (also used inline as the leaf of the QR keys tree). */
export function ServiceKeyCard({ namespace, def, focused = false, fieldPath, fieldNodeId = fieldPath, onSaved, header, onClose, onRemoved, access = 'edit', tone = 'card', hideLegacy = false }: ServiceKeyCardProps) {
  const fields = hideLegacy ? def.fields.filter((f) => !f.legacy) : def.fields;
  const caps = capsOf(access);
  const branch = tone === 'branch';
  const fieldSx = branch ? branchInputSx : inputSx;
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [saved, setSaved] = React.useState(() => hasServiceKeys(namespace, def.id));
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [passphrase, setPassphrase] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const uid = React.useId();
  const ppRef = React.useRef<HTMLInputElement | null>(null);
  const askPassphrase = () => { setMessage('Enter your passphrase to show or copy a saved value.'); ppRef.current?.focus(); };

  React.useEffect(() => { setSaved(hasServiceKeys(namespace, def.id)); }, [namespace, def.id]);
  React.useEffect(() => {
    if (focused) ref.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [focused]);

  const anyValue = def.fields.some((f) => (values[f.id] ?? '').trim());
  const canSave = caps.edit && anyValue && passphrase.length > 0 && !busy;

  async function onSave() {
    if (!canSave) return;
    setBusy(true); setMessage(null);
    try {
      await saveServiceKeys(namespace, def.id, values, passphrase);
      setValues({}); setPassphrase(''); setSaved(true); setMessage('Saved');
      notifyServiceKeysChanged(namespace);
      onSaved?.();
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
    notifyServiceKeysChanged(namespace);
    onRemoved?.();
  }

  return (
    <Box
      ref={ref} id={`service-${def.id}`} data-service={def.id} data-key-access={access}
      sx={keyCardShellSx(tone, focused)}
    >
      {header}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: branch ? 0.75 : 1 }}>
        <Box sx={{ display: 'flex', color: saved ? 'text.primary' : 'text.disabled' }}>
          <ServiceIcon service={def.id} brand={saved} />
        </Box>
        <Typography variant={branch ? 'caption' : 'body2'} sx={{ fontWeight: 700, flex: 1 }}>{def.name}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: saved ? 'success.main' : 'text.disabled' }}>
          {saved ? 'Saved' : 'Not set'}
        </Typography>
        <CardCornerActions compact={branch} onRemove={saved && caps.edit ? () => setConfirmRemove(true) : undefined} removeArmed={confirmRemove} onClose={onClose} />
      </Box>

      {fields.map((f, i) => (
        <Box key={f.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {f.group && f.group !== fields[i - 1]?.group && (
            <Typography variant="caption" data-field-group={f.group} sx={{ fontWeight: 700, mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>{f.group}</Typography>
          )}
          <Typography component="label" htmlFor={`${uid}-${f.id}`} variant="caption" title={fieldPath?.(f.id)} sx={{ color: 'text.secondary' }}>{f.label}</Typography>
          {f.secret || !caps.edit ? (
            <SecretInput readOnly={!caps.edit} noReveal={!caps.reveal}
              id={`${uid}-${f.id}`} saved={saved} placeholder={saved ? SAVED_PLACEHOLDER : (f.defaultValue ?? '')}
              value={values[f.id] ?? ''} onChange={(v) => setValues((cur) => ({ ...cur, [f.id]: v }))}
              passphrase={passphrase} onNeedPassphrase={askPassphrase} onStatus={setMessage}
              unlock={async () => (await getServiceKeys(namespace, def.id, passphrase))?.[f.id] ?? null}
              inputProps={{ 'data-gui-node-id': fieldNodeId?.(f.id), title: fieldPath?.(f.id) }}
              sx={fieldSx}
            />
          ) : <Box
            data-gui-node-id={fieldNodeId?.(f.id)} title={fieldPath?.(f.id)}
            component="input" id={`${uid}-${f.id}`} type="text" autoComplete="off" spellCheck={false}
            placeholder={saved ? SAVED_PLACEHOLDER : (f.defaultValue ?? '')}
            value={values[f.id] ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
            sx={fieldSx}
          />}
        </Box>
      ))}
      {caps.reveal && <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography component="label" htmlFor={`${uid}-pp`} variant="caption" sx={{ color: 'text.secondary' }}>{caps.edit ? 'Passphrase (encrypts these keys)' : 'Passphrase (unlocks to read)'}</Typography>
        <Box
          component="input" id={`${uid}-pp`} type="password" autoComplete="current-password" ref={ppRef}
          value={passphrase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassphrase(e.target.value)}
          sx={fieldSx}
        />
      </Box>}

      {confirmRemove ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ flex: 1, color: 'error.main' }}>Remove {def.name} keys from this device?</Typography>
          <SmallButton compact={branch} onClick={() => setConfirmRemove(false)}>Cancel</SmallButton>
          <SmallButton compact={branch} tone="danger" onClick={onRemove}>Remove</SmallButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: branch ? 0.75 : 1 }}>
          <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }} role="status">{message ?? accessNote(access)}</Typography>
          {caps.edit && <SmallButton compact={branch} tone="primary" disabled={!canSave} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</SmallButton>}
        </Box>
      )}
    </Box>
  );
}

/** Small icon button for a card corner (trash / close), with a GUI tooltip. */
export function CardIconButton({ icon, label, onClick, tone = 'default', active = false, compact = false }: {
  icon: string; label: string; onClick: () => void; tone?: 'default' | 'danger'; active?: boolean; compact?: boolean;
}) {
  const size = compact ? 22 : 26;
  return (
    <Tooltip title={label} size="sm" arrow placement="top" enterDelay={250} disableInteractive>
      <Box
        component="button" type="button" aria-label={label} aria-pressed={tone === 'danger' ? active : undefined} onClick={onClick}
        data-card-action={icon}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, p: 0, flex: 'none',
          border: '1px solid', borderColor: active ? 'error.main' : 'transparent', borderRadius: compact ? 0.5 : 1, background: 'transparent',
          color: active ? 'error.main' : 'text.secondary', cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover', color: tone === 'danger' ? 'error.main' : 'text.primary' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
        }}
      >
        <Icon name={icon} fontSize="1.05rem" />
      </Box>
    </Tooltip>
  );
}

/** Top-right of a key card: trash (asks to confirm inline) and ✕ close. Each only when given. */
export function CardCornerActions({ onRemove, removeArmed = false, onClose, compact = false }: { onRemove?: () => void; removeArmed?: boolean; onClose?: () => void; compact?: boolean }) {
  if (!onRemove && !onClose) return null;
  return (
    <Box data-card-corner sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: compact ? 0 : 0.5, mr: compact ? 0 : -0.75, flex: 'none' }}>
      {onRemove && <CardIconButton compact={compact} icon="delete" label="Remove" tone="danger" active={removeArmed} onClick={onRemove} />}
      {onClose && <CardIconButton compact={compact} icon="close" label="Close" onClick={onClose} />}
    </Box>
  );
}

export function SmallButton({ children, onClick, disabled, tone = 'default', compact = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'default' | 'primary' | 'danger'; compact?: boolean;
}) {
  const primary = tone === 'primary';
  return (
    <Box
      component="button" type="button" onClick={onClick} disabled={disabled}
      sx={{
        px: compact ? 1 : 1.5, py: compact ? 0.35 : 0.6, borderRadius: compact ? 0.5 : 1.5, font: 'inherit', typography: 'body2', fontWeight: 600,
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
