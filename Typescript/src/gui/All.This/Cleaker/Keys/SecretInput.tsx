// SecretInput.tsx — a password input (uncontrolled: no value attribute) with an eye (show/hide) and a copy
// button inside its right edge. Typed values toggle/copy in place. Saved
// values are decrypted only on click (via `unlock`), shown for REVEAL_MS in
// a text node over the input (never an attribute, storage, console or URL),
// then dropped from state. Copy never shows the saved value at all.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Tooltip from '@/gui/Atoms/Tooltip/Tooltip';
import { COPIED_MS, REVEAL_MS, revealErrorMessage, secretAction } from './secretReveal';

export interface SecretInputProps {
  id?: string;
  'aria-label'?: string;
  value: string;
  onChange: (value: string) => void;
  saved: boolean;
  placeholder?: string;
  /** The card's passphrase (only its emptiness is read here). */
  passphrase: string;
  /** Decrypts this field's saved value; returns null when not set. Throws on a bad passphrase. */
  unlock: () => Promise<string | null>;
  /** Passphrase missing: the card asks for it inline (focus + message). */
  onNeedPassphrase: () => void;
  /** Error / status text for the card's status line (never contains a value). */
  onStatus: (message: string) => void;
  sx?: object;
  inputProps?: Record<string, unknown>;
  /** Read access: the value can be shown/copied (with the passphrase) but not typed. */
  readOnly?: boolean;
  /** No access: the path is visible, the value is not — no eye, no copy. */
  noReveal?: boolean;
}

async function writeClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export default function SecretInput({ id, value, onChange, saved, placeholder, passphrase, unlock, onNeedPassphrase, onStatus, sx, inputProps, readOnly = false, noReveal = false, ...rest }: SecretInputProps) {
  const [showTyped, setShowTyped] = React.useState(false);
  const [revealed, setRevealed] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = React.useRef(true);
  // Uncontrolled on purpose: a controlled React input mirrors its value into the
  // `value` ATTRIBUTE (visible in the DOM / outerHTML). We only set the property.
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useLayoutEffect(() => { const el = inputRef.current; if (el && el.value !== value) el.value = value; }, [value]);

  const hide = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    setRevealed(null);
  }, []);
  React.useEffect(() => () => {
    alive.current = false;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);
  // Typing replaces the saved value: drop any revealed plaintext at once.
  React.useEffect(() => { if (value) hide(); else setShowTyped(false); }, [value, hide]);
  // Removed / re-saved elsewhere: nothing saved to show.
  React.useEffect(() => { if (!saved) hide(); }, [saved, hide]);

  const action = secretAction({ typed: value, saved, passphrase });
  const visible = action === 'typed' ? showTyped : revealed !== null;

  async function decrypt(): Promise<string | null> {
    setBusy(true);
    try {
      const v = await unlock();
      if (v == null || v === '') { onStatus('No value saved for this field.'); return null; }
      return v;
    } catch (e: any) {
      onStatus(revealErrorMessage(e?.message));
      return null;
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  async function onEye() {
    if (action === 'typed') { setShowTyped((s) => !s); return; }
    if (revealed !== null) { hide(); return; }
    if (action === 'need-passphrase') { onNeedPassphrase(); return; }
    if (action !== 'decrypt') return;
    let v = await decrypt();
    if (v === null || !alive.current) { v = null; return; }
    setRevealed(v); v = null;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, REVEAL_MS);
  }

  async function onCopy() {
    let text: string | null = null;
    if (action === 'typed') text = value;
    else if (revealed !== null) text = revealed;
    else if (action === 'need-passphrase') { onNeedPassphrase(); return; }
    else if (action === 'decrypt') text = await decrypt();
    if (text === null || !alive.current) return;
    const ok = await writeClipboard(text);
    text = null;
    if (!alive.current) return;
    if (!ok) { onStatus('Could not copy.'); return; }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => { if (alive.current) setCopied(false); }, COPIED_MS);
  }

  const canAct = action !== 'none';
  const eyeLabel = visible ? 'Hide' : 'Show';
  const copyLabel = copied ? 'Copied' : 'Copy';
  return (
    <Box data-secret-input sx={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
      <Box
        component="input" id={id} aria-label={rest['aria-label']}
        type={action === 'typed' && showTyped ? 'text' : 'password'} autoComplete="off" spellCheck={false}
        placeholder={revealed !== null ? '' : placeholder}
        ref={inputRef} readOnly={readOnly || noReveal} disabled={noReveal}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        {...inputProps}
        sx={{ ...(sx ?? {}), ...(noReveal ? { opacity: 0.7, cursor: 'not-allowed' } : { pr: '64px' }), ...(readOnly && !noReveal ? { cursor: 'default' } : {}) }}
      />
      {revealed !== null && (
        // Text node only (no value/title/data attribute); gone when hidden.
        <Box
          data-secret-revealed aria-live="off"
          sx={{ position: 'absolute', left: 0, right: '64px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', px: 1.25, typography: 'body2', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'text.primary', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', pointerEvents: 'none', userSelect: 'none' }}
        >
          {revealed}
        </Box>
      )}
      {!noReveal && <Box sx={{ position: 'absolute', right: 4, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <SecretButton icon={visible ? 'visibility_off' : 'visibility'} label={eyeLabel} disabled={!canAct || busy} pressed={visible} onClick={onEye} />
        <SecretButton icon={copied ? 'check' : 'content_copy'} label={copyLabel} disabled={!canAct || busy} onClick={onCopy} />
      </Box>}
      <Box component="span" role="status" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        {copied ? 'Copied' : ''}
      </Box>
    </Box>
  );
}

function SecretButton({ icon, label, onClick, disabled, pressed }: { icon: string; label: string; onClick: () => void; disabled?: boolean; pressed?: boolean }) {
  return (
    <Tooltip title={label} size="sm" arrow placement="top" enterDelay={250} disableInteractive>
      <Box
        component="button" type="button" aria-label={label} aria-pressed={pressed} aria-disabled={disabled || undefined}
        onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
        onClick={() => { if (!disabled) onClick(); }}
        sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, p: 0,
          border: 'none', borderRadius: 1, background: 'transparent', color: 'text.secondary', cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          '&:hover:not([aria-disabled])': { bgcolor: 'action.hover', color: 'text.primary' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
        }}
      >
        <Icon name={icon} fontSize="1.05rem" />
      </Box>
    </Tooltip>
  );
}
