// CustomKeyCard.tsx — your own key/value pairs, sealed in the same
// encrypted service-keys vault (envelope `custom:<name>`). The group name
// and each field name become path segments: <user>.keys.<name>.<field>.
// Secret values are password inputs (dots) and never rendered back; public
// fields (id, redirect, expires, page, …) may show in the clear.
// Re-saving an existing group keeps any value left empty (after a correct
// passphrase), so you can change one row without retyping the others.
import { NODE_SIZE } from '../treeMetrics';
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import SecretInput from './SecretInput';
import ProfilePhoto, { profilePhotoSrc } from './ProfilePhoto';
import ServiceIcon from './ServiceIcons';
import { capsOf, type KeyAccess } from './keyTree';
import { declareNodeMeta, forgetNodeMeta } from './keyMeta';
import { KEYS_ROOT } from './keyPaths';
import { CardCornerActions, SAVED_PLACEHOLDER, SmallButton, accessNote, branchInputSx, inputSx, keyCardShellSx, notifyServiceKeysChanged, type KeyCardTone } from './ServiceKeysSection';
import {
  firstGlyph, lastGlyph, getCustomKeys, hasCustomKeys, isPublicKeyField, removeCustomKeys, sanitizeKeyPath, saveCustomKeys,
  type CustomKeyGroup, type CustomKeyMark, type ServiceFields,
} from './serviceKeyVault';

export interface CustomKeyCardProps {
  namespace: string;
  /** An existing group (name + field names), or null to create one. */
  group?: CustomKeyGroup | null;
  /** Path of a field for title / data-gui-node-id (receives sanitized group + field). */
  fieldPath?: (name: string, field: string) => string;
  fieldNodeId?: (name: string, field: string) => string;
  onSaved?: (name: string) => void;
  onRemoved?: (name: string) => void;
  /** Optional row rendered at the top of the card (the new-key card's "Start from"). */
  header?: React.ReactNode;
  /** Shows a ✕ in the top-right corner. */
  onClose?: () => void;
  /** New group only: the tree level it is created under (e.g. "meta."); the name typed goes after it. */
  namePrefix?: string;
  /** edit (default) | read (show/copy with the passphrase) | none (path only). */
  access?: KeyAccess;
  /** `branch`: flush with the keys tree (square, no paper fill). Default keeps the standalone card. */
  tone?: KeyCardTone;
  /** Open a referenced branch (Instagram `page` → facebook.<page>). */
  onOpenPath?: (path: string) => void;
  /** meta.user only: the Facebook connection's status line and a Reconnect action, inside the card. */
  connection?: { notice?: 'expiring' | 'dead'; enabled: boolean; onReconnect: () => void };
}

/** Icon tokens offered for a custom group (GUI.Icon / material symbols). */
export const CUSTOM_MARK_ICONS = [
  'key', 'lock', 'fingerprint', 'bolt', 'code', 'terminal', 'api', 'database',
  'cloud', 'link', 'mail', 'chat', 'payments', 'credit_card', 'shopping_cart', 'home',
  'work', 'star', 'favorite', 'rocket_launch', 'public', 'science', 'music_note', 'build',
] as const;

/** Fonts for glyph marks: UI text first, then historic scripts (hieroglyphs) and color emoji. */
export const GLYPH_FONT_STACK = [
  'system-ui', '"Noto Sans Egyptian Hieroglyphs"', '"Segoe UI Historic"', '"Noto Sans Symbols 2"',
  '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Noto Color Emoji"', 'sans-serif',
].join(', ');

/** A custom group's mark: its icon, its glyph, or the generic key. Follows the theme's text color. */
export function CustomMark({ mark, size = '1.25rem' }: { mark?: CustomKeyMark | null; size?: string }) {
  if (mark?.kind === 'glyph') {
    return (
      <Box component="span" aria-hidden sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, fontSize: `calc(${size} * 0.95)`, lineHeight: 1, color: 'inherit', fontWeight: 600, fontFamily: GLYPH_FONT_STACK, whiteSpace: 'nowrap' }}>
        {mark.value}
      </Box>
    );
  }
  return <Icon name={mark?.kind === 'icon' ? mark.name : 'key'} fontSize={size} />;
}

/**
 * Keys the Facebook connect writes itself (meta.user, and each Page / Instagram / Threads account): their field
 * names are fixed and their values come from Facebook, so the card shows them as labels and read-only values.
 */
export function isAutoMetaKey(name?: string | null): boolean {
  return !!name && (name === 'meta.user' || /^meta\.(facebook|instagram|threads)\./.test(name));
}
/** Brand of an automatic Meta account key (meta.facebook.* / meta.instagram.* / meta.threads.*), for its fallback icon. */
export function autoKeyBrand(name?: string): 'facebook' | 'instagram' | 'threads' | undefined {
  const m = /^meta\.(facebook|instagram|threads)\./.exec(name ?? '');
  return m ? m[1] as 'facebook' | 'instagram' | 'threads' : undefined;
}

/** Profile fields shown in the card's header (photo + name / @username) instead of as rows. */
const HEADER_FIELDS = new Set(['name', 'picture', 'username']);
/** Short fixed labels for long automatic field ids (the stored id is unchanged). */
const AUTO_FIELD_LABELS: Record<string, string> = { 'instagram-business-account': 'instagram' };

type Row = { key: number; name: string; value: string; saved: boolean };
let rowSeq = 0;
const newRow = (name = '', saved = false): Row => ({ key: ++rowSeq, name, value: '', saved });

export default function CustomKeyCard({ namespace, group = null, fieldPath, fieldNodeId = fieldPath, onSaved, onRemoved, header, onClose, namePrefix = '', access = 'edit', tone = 'card', onOpenPath, connection }: CustomKeyCardProps) {
  const caps = capsOf(access);
  const branch = tone === 'branch';
  const fieldSx = branch ? branchInputSx : inputSx;
  const existing = !!group && hasCustomKeys(namespace, group.name);
  const auto = existing && isAutoMetaKey(group?.name);
  const photo = auto ? profilePhotoSrc(group?.publicValues?.picture) : undefined;
  // meta.user: the person; meta.facebook.*: the Page's original name ('neurons.me'); meta.instagram.*: @username.
  const brand = auto ? autoKeyBrand(group?.name) : undefined;
  // User-made groups with public display info beside their fields (meta.app: the App's name + icon from Facebook).
  const displayPhoto = !auto && existing ? profilePhotoSrc(group?.display?.picture) : undefined;
  const displayName = !auto && existing ? group?.display?.name?.trim() || undefined : undefined;
  const builtinMark: CustomKeyMark | undefined = group?.name === 'meta.app' ? { kind: 'icon', name: 'apps' } : undefined;
  const igUser = auto && group?.name.startsWith('meta.instagram.') ? group?.publicValues?.username?.trim() : undefined;
  const personName = auto ? (igUser ? `@${igUser.replace(/^@/, '')}` : group?.publicValues?.name?.trim() || undefined) : undefined;
  const [name, setName] = React.useState(group?.name ?? '');
  const [rows, setRows] = React.useState<Row[]>(() => {
    if (!group?.fields.length) return [newRow(), newRow()];
    return group.fields.map((f) => {
      const r = newRow(f, true);
      const id = sanitizeKeyPath(f);
      const pub = group.publicValues?.[id] ?? group.publicValues?.[f];
      if (pub) r.value = pub;
      return r;
    });
  });
  const [passphrase, setPassphrase] = React.useState('');
  const [mark, setMark] = React.useState<CustomKeyMark | null>(group?.mark ?? null);
  const [choosing, setChoosing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const uid = React.useId();
  const ppRef = React.useRef<HTMLInputElement | null>(null);
  const askPassphrase = () => { setMessage('Enter your passphrase to show or copy a saved value.'); ppRef.current?.focus(); };

  const groupName = sanitizeKeyPath(existing ? name : `${namePrefix}${name}`);
  const named = rows.map((r) => ({ ...r, id: sanitizeKeyPath(r.name) })).filter((r) => r.id);
  const anyValue = named.some((r) => r.value.trim() || r.saved);
  const canSave = caps.edit && !!groupName && anyValue && passphrase.length > 0 && !busy;
  const setRow = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function onSave() {
    if (!canSave) return;
    setBusy(true); setMessage(null);
    try {
      const old: ServiceFields = existing ? ((await getCustomKeys(namespace, groupName, passphrase)) ?? {}) : {};
      const fields: ServiceFields = {};
      for (const r of named) { const v = r.value.trim() || old[r.id] || ''; if (v) fields[r.id] = v; }
      await saveCustomKeys(namespace, groupName, fields, passphrase, mark);
      // The chosen icon/glyph is that node's public .icon in the tree (the index mark stays as the old fallback).
      declareNodeMeta(namespace, `${KEYS_ROOT}.${groupName}`, { icon: mark ?? null });
      setChoosing(false);
      setRows(Object.keys(fields).map((f) => newRow(f, true)));
      setPassphrase(''); setName(existing ? groupName : groupName.slice(sanitizeKeyPath(namePrefix).length).replace(/^\./, '')); setMessage('Saved');
      notifyServiceKeysChanged(namespace);
      onSaved?.(groupName);
    } catch (e: any) {
      // Never echo values: only the error code.
      const code = String(e?.message ?? '');
      setMessage(code === 'WRONG_PASSPHRASE' ? 'Wrong passphrase.' : code === 'NO_FIELDS' ? 'Add at least one value.'
        : code === 'RESERVED_KEY_NAME' ? 'That name is taken by a service.' : code === 'INVALID_KEY_NAME' ? 'Use letters, numbers, - and dots.' : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  function onRemove() {
    removeCustomKeys(namespace, groupName);
    forgetNodeMeta(namespace, `${KEYS_ROOT}.${groupName}`);
    setConfirmRemove(false); setMessage('Removed');
    notifyServiceKeysChanged(namespace);
    onRemoved?.(groupName);
  }

  return (
    <Box data-custom-key-group={existing || name ? groupName || undefined : undefined} data-key-access={access} sx={keyCardShellSx(tone)}>
      {header}
      {auto ? (
      <Box data-auto-key-header sx={{ display: 'flex', alignItems: 'center', gap: branch ? 0.75 : 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE, flex: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 1, color: 'text.primary', overflow: 'hidden' }}>
          {group?.name === 'meta.user'
            ? <ProfilePhoto src={photo} size={28} label={personName} fallback="account_circle" />
            : <ProfilePhoto src={photo} size={28} label={personName} fallbackNode={brand && !mark ? <ServiceIcon service={brand} /> : <CustomMark mark={mark} />} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography variant={branch ? 'caption' : 'body2'} sx={{ fontWeight: 700, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{personName || groupName}</Typography>
          {personName && <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', lineHeight: 1.2 }}>.{groupName}</Typography>}
        </Box>
        <CardCornerActions compact={branch} onRemove={caps.edit ? () => setConfirmRemove(true) : undefined} removeArmed={confirmRemove} onClose={onClose} />
      </Box>
      ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: branch ? 0.75 : 1, minWidth: 0, width: '100%' }}>
        <Box
          component="button" type="button" aria-label="Choose icon or glyph" title="Choose icon or glyph" aria-expanded={choosing}
          onClick={() => caps.edit && setChoosing((v) => !v)} disabled={!caps.edit}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE, p: 0, flex: 'none', border: '1px', borderStyle: mark || displayPhoto || builtinMark ? 'solid' : 'dashed', overflow: 'hidden', borderColor: choosing ? 'primary.main' : 'divider', borderRadius: 1, background: 'transparent', color: choosing ? 'primary.main' : 'text.primary', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
          {displayPhoto
            ? <ProfilePhoto src={displayPhoto} size={28} label={displayName} fallbackNode={<CustomMark mark={mark ?? builtinMark} />} />
            : <CustomMark mark={mark ?? builtinMark} />}
        </Box>
        {existing ? (
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Typography variant={branch ? 'caption' : 'body2'} sx={{ fontWeight: 700, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName || groupName}</Typography>
            {displayName && <Typography variant="caption" data-display-path sx={{ fontFamily: 'monospace', color: 'text.secondary', lineHeight: 1.2 }}>.{groupName}</Typography>}
          </Box>
        ) : (<>
          {namePrefix && <Typography variant="body2" data-name-prefix sx={{ fontFamily: 'monospace', color: 'text.secondary', mr: -0.75 }}>.{namePrefix}</Typography>}
          <Box
            component="input" aria-label="Key name" placeholder="Key name (e.g. myapi)" autoComplete="off" spellCheck={false}
            value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onBlur={() => setName(sanitizeKeyPath(name))}
            sx={{ ...fieldSx, flex: 1, minWidth: 0, py: branch ? 0.35 : 0.6, fontWeight: 700 }}
          />
        </>)}
        <Typography variant="caption" sx={{ fontWeight: 700, color: existing ? 'success.main' : 'text.disabled' }}>{existing ? 'Saved' : 'New'}</Typography>
        <CardCornerActions compact={branch} onRemove={existing && caps.edit ? () => setConfirmRemove(true) : undefined} removeArmed={confirmRemove} onClose={onClose} />
      </Box>
      )}

      {auto && connection && <ConnectionStatus {...connection} />}

      {choosing && !auto && <MarkChooser mark={mark} onChange={setMark} />}

      {rows.map((r) => {
        const id = sanitizeKeyPath(r.name);
        const path = groupName && id ? fieldPath?.(groupName, id) : undefined;
        if (auto) {
          if (HEADER_FIELDS.has(id)) return null;
          const pub = isPublicKeyField(id);
          const page = id === 'page' && r.value.trim();
          return (
            <Box key={r.key} data-auto-field={id} data-gui-node-id={groupName && id ? fieldNodeId?.(groupName, id) : undefined} title={path}
              sx={{ display: 'grid', gridTemplateColumns: '4.5rem 1fr', gap: 0.75, alignItems: 'center', minHeight: '1.75rem' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{AUTO_FIELD_LABELS[id] ?? id}</Typography>
              {pub ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                  <Typography variant="caption" data-auto-value sx={{ flex: 1, minWidth: 0, fontFamily: 'monospace', color: 'text.primary', wordBreak: 'break-word', lineHeight: 1.45 }}>
                    {id === 'scopes' ? r.value.split(',').map((x) => x.trim()).filter(Boolean).join(' · ') : (r.value || '—')}
                  </Typography>
                  {page && onOpenPath && (
                    <Box component="button" type="button" aria-label={`Open ${page}`} title={page} onClick={() => onOpenPath(page)}
                      sx={{ display: 'flex', p: 0.5, border: 'none', background: 'transparent', color: 'primary.main', cursor: 'pointer', borderRadius: 1, flex: 'none', '&:hover': { bgcolor: 'action.hover' } }}>
                      <Icon name="link" fontSize="1rem" />
                    </Box>
                  )}
                </Box>
              ) : (
                <SecretInput readOnly noReveal={!caps.reveal}
                  aria-label={`${id} value`} saved={r.saved}
                  placeholder={SAVED_PLACEHOLDER} value=""
                  onChange={() => { /* read-only: written by the connect */ }}
                  passphrase={passphrase} onNeedPassphrase={askPassphrase} onStatus={setMessage}
                  unlock={async () => (await getCustomKeys(namespace, groupName, passphrase))?.[id] ?? null}
                  sx={{ ...fieldSx, flex: 1 }}
                />
              )}
            </Box>
          );
        }
        return (
          <Box key={r.key} data-gui-node-id={groupName && id ? fieldNodeId?.(groupName, id) : undefined} title={path} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', minWidth: 0, width: '100%', flexWrap: 'wrap' }}>
            <Box
              component="input" aria-label="Field name" placeholder="field" autoComplete="off" spellCheck={false}
              value={r.name} readOnly={r.saved || !caps.edit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRow(r.key, { name: e.target.value })}
              onBlur={() => setRow(r.key, { name: id })}
              sx={{ ...fieldSx, width: '40%', flex: '1 1 6rem', minWidth: 0, ...(r.saved ? { color: 'text.secondary' } : {}) }}
            />
            {id && isPublicKeyField(id) ? (
              id === 'page' && (r.value || r.saved) ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                  <Box
                    component="input" aria-label={`${id} value`} placeholder="facebook.<page>"
                    autoComplete="off" spellCheck={false}
                    value={r.value} readOnly={!caps.edit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRow(r.key, { value: e.target.value })}
                    sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
                  />
                  {onOpenPath && r.value.trim() && (
                    <Box
                      component="button" type="button"
                      aria-label={`Open ${r.value.trim()}`}
                      title={r.value.trim()}
                      onClick={() => onOpenPath(r.value.trim())}
                      sx={{ display: 'flex', p: 0.5, border: 'none', background: 'transparent', color: 'primary.main', cursor: 'pointer', borderRadius: 1, flex: 'none', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <Icon name="link" fontSize="1rem" />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  component="input" aria-label={`${id || 'field'} value`} placeholder="value"
                  autoComplete="off" spellCheck={false}
                  value={r.value} readOnly={!caps.edit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRow(r.key, { value: e.target.value })}
                  sx={{ ...fieldSx, flex: 1 }}
                />
              )
            ) : (
              <SecretInput readOnly={!caps.edit} noReveal={!caps.reveal}
                aria-label={`${id || 'field'} value`} saved={r.saved && existing && !r.value}
                placeholder={r.saved ? SAVED_PLACEHOLDER : 'value'} value={r.value}
                onChange={(v) => setRow(r.key, { value: v })}
                passphrase={passphrase} onNeedPassphrase={askPassphrase} onStatus={setMessage}
                unlock={async () => (await getCustomKeys(namespace, groupName, passphrase))?.[id] ?? null}
                sx={{ ...fieldSx, flex: 1 }}
              />
            )}
            {caps.edit && <Box
              component="button" type="button" aria-label="Remove row" title="Remove row"
              onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [newRow()]))}
              sx={{ display: 'flex', p: 0.5, border: 'none', background: 'transparent', color: 'text.secondary', cursor: 'pointer', borderRadius: 1, flex: 'none', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Icon name="close" fontSize="1rem" />
            </Box>}
          </Box>
        );
      })}
      {caps.edit && !auto && <Box
        component="button" type="button" onClick={() => setRows((rs) => [...rs, newRow()])}
        sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, border: '1px dashed', borderColor: 'divider', borderRadius: branch ? 0.5 : 1.5, background: 'transparent', color: 'text.secondary', font: 'inherit', typography: 'body2', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Icon name="add" fontSize="1rem" /> Add field
      </Box>}

      {caps.reveal && (!auto || rows.some((r) => !isPublicKeyField(sanitizeKeyPath(r.name)))) && <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography component="label" htmlFor={`${uid}-pp`} variant="caption" sx={{ color: 'text.secondary' }}>{auto ? 'Passphrase (to show or copy)' : caps.edit ? 'Passphrase (encrypts these keys)' : 'Passphrase (unlocks to read)'}</Typography>
        <Box
          component="input" id={`${uid}-pp`} type="password" autoComplete="current-password" ref={ppRef}
          value={passphrase} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassphrase(e.target.value)}
          sx={fieldSx}
        />
      </Box>}

      {confirmRemove ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ flex: 1, color: 'error.main' }}>Remove {groupName} from this device?</Typography>
          <SmallButton compact={branch} onClick={() => setConfirmRemove(false)}>Cancel</SmallButton>
          <SmallButton compact={branch} tone="danger" onClick={onRemove}>Remove</SmallButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%', flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ flex: 1, minWidth: 0, color: 'text.secondary' }} role="status">{message ?? accessNote(access)}</Typography>
          {caps.edit && !auto && <SmallButton compact={branch} tone="primary" disabled={!canSave} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</SmallButton>}
        </Box>
      )}
    </Box>
  );
}

/** meta.user's connection line: Connected (muted) / Expiring (warning) / Disconnected (error), and Reconnect. */
function ConnectionStatus({ notice, enabled, onReconnect }: { notice?: 'expiring' | 'dead'; enabled: boolean; onReconnect: () => void }) {
  const tone = notice === 'dead' ? 'error.main' : notice === 'expiring' ? 'warning.main' : 'text.secondary';
  const text = notice === 'dead' ? 'Disconnected' : notice === 'expiring' ? 'Expiring soon' : 'Connected';
  return (
    <Box data-facebook-connected={notice ?? 'ok'} role="status" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 26, color: tone }}>
      <Icon name={notice === 'dead' ? 'error' : notice === 'expiring' ? 'schedule' : 'check_circle'} fontSize="1rem" />
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>{text}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>· Facebook</Typography>
      <Box sx={{ flex: 1 }} />
      <Box
        component="button" type="button" data-reconnect aria-label="Reconnect with Facebook" title={enabled ? 'Reconnect with Facebook' : 'Add your App ID and App Secret under .keys.meta.app first.'}
        disabled={!enabled} onClick={onReconnect}
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.25, px: 0.75, py: 0.25, font: 'inherit', typography: 'body2', fontWeight: 600,
          borderRadius: 0.5, cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.45,
          ...(notice
            ? { border: '1px solid', borderColor: tone, bgcolor: 'transparent', color: tone }
            : { border: '1px solid transparent', bgcolor: 'transparent', color: 'text.secondary' }),
          '&:hover': enabled ? { bgcolor: 'action.hover', color: notice ? tone : 'text.primary' } : undefined,
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
        }}
      >
        <Icon name="refresh" fontSize="0.95rem" />Reconnect
      </Box>
    </Box>
  );
}

/** Compact chooser: a grid of GUI icons, or one typed glyph (★ ∆, emoji 🔑, hieroglyphs 𓂀…). */
function MarkChooser({ mark, onChange }: { mark: CustomKeyMark | null; onChange: (m: CustomKeyMark | null) => void }) {
  const glyph = mark?.kind === 'glyph' ? mark.value : '';
  return (
    <Box data-mark-chooser sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
      <Box role="listbox" aria-label="Icon" sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}>
        {CUSTOM_MARK_ICONS.map((name) => {
          const selected = mark?.kind === 'icon' && mark.name === name;
          return (
            <Box
              key={name} component="button" type="button" role="option" aria-selected={selected} aria-label={name} title={name}
              onClick={() => onChange(selected ? null : { kind: 'icon', name })}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', p: 0, border: '1px solid', borderColor: selected ? 'primary.main' : 'transparent', borderRadius: 1, background: 'transparent', color: selected ? 'primary.main' : 'text.secondary', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
            >
              <Icon name={name} fontSize="1.1rem" />
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>or type a glyph</Typography>
        <Box
          component="input" aria-label="Glyph" placeholder="★ 🔑 𓂀" autoComplete="off" spellCheck={false}
          value={glyph}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const g = lastGlyph(e.target.value); onChange(g ? { kind: 'glyph', value: g } : null); }}
          sx={{ ...inputSx, width: '6rem', flex: 'none', textAlign: 'center', fontSize: '1.1rem', fontFamily: GLYPH_FONT_STACK, py: 0.4, ...(mark?.kind === 'glyph' ? { borderColor: 'primary.main' } : {}) }}
        />
      </Box>
    </Box>
  );
}
