// Passphrase.tsx — pure display component for a 12-word BIP-39 recovery
// phrase. Two modes, one shell: 'reveal' shows words generated elsewhere
// (blurred until the person asks to look, with a backed-up confirmation),
// 'input' collects 12 words being typed or pasted back in during recovery.
// Never touches key material itself — generation, validation, and
// derivation are the caller's job; this component only ever sees the
// plain word strings it's handed via props, exactly like every other
// component in this library (all data via props, no internal fetching).
import React, { useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import TextField from '@mui/material/TextField';
import Icon from '@/gui/Atoms/Icon/Icon';
import IconButton from '@/gui/Atoms/IconButton/IconButton';

export type PassphraseMode = 'reveal' | 'input';

export interface PassphraseProps {
  /** 'reveal' (default) shows `words`, blurred until toggled visible.
   *  'input' renders 12 editable slots for typing/pasting a phrase back in. */
  mode?: PassphraseMode;
  /** reveal mode: the 12 words to display, in order. */
  words?: string[];
  /** input mode: controlled 12-slot array. Omit to let the component hold
   *  its own state (uncontrolled) — same pattern as onChange below. */
  value?: string[];
  onChange?: (words: string[]) => void;
  /** reveal mode: controlled "I've written this down" state. */
  confirmed?: boolean;
  onConfirmedChange?: (confirmed: boolean) => void;
  error?: string;
  disabled?: boolean;
  sx?: any;
}

const WORD_COUNT = 12;
const EMPTY_SLOTS = Array.from({ length: WORD_COUNT }, () => '');

export default function Passphrase({
  mode = 'reveal',
  words = EMPTY_SLOTS,
  value,
  onChange,
  confirmed,
  onConfirmedChange,
  error,
  disabled,
  sx,
}: PassphraseProps) {
  const [hidden, setHidden] = useState(true);
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const [localValue, setLocalValue] = useState<string[]>(EMPTY_SLOTS);

  const inputSlots = value ?? localValue;
  const slots = mode === 'input' ? inputSlots : words;
  const isConfirmed = confirmed ?? localConfirmed;

  const commit = (next: string[]) => {
    if (onChange) onChange(next);
    else setLocalValue(next);
  };

  const setSlot = (i: number, word: string) => {
    const next = [...inputSlots];
    next[i] = word;
    commit(next);
  };

  // Pasting all 12 words into any single slot fans them out from that
  // slot onward — the common case of pasting a whole phrase copied
  // elsewhere, rather than forcing 12 separate pastes.
  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLDivElement>) => {
    const parts = e.clipboardData.getData('text').trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return;
    e.preventDefault();
    const next = [...inputSlots];
    for (let k = 0; k < parts.length && i + k < WORD_COUNT; k++) {
      next[i + k] = parts[k].toLowerCase();
    }
    commit(next);
  };

  const toggleConfirmed = () => {
    const next = !isConfirmed;
    if (onConfirmedChange) onConfirmedChange(next);
    else setLocalConfirmed(next);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          {mode === 'reveal' ? 'Your recovery phrase' : 'Enter your recovery phrase'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {mode === 'reveal'
            ? '12 words, in order. Write them down and keep them somewhere safe — this is the only way to recover this identity.'
            : 'Type or paste the 12 words in order, separated by spaces.'}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            filter: mode === 'reveal' && hidden ? 'blur(6px)' : 'none',
            userSelect: mode === 'reveal' && hidden ? 'none' : 'auto',
            transition: 'filter 160ms ease',
          }}
        >
          {Array.from({ length: WORD_COUNT }, (_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: mode === 'input' ? 0 : 0.75,
                border: mode === 'input' ? '1px solid' : 'none',
                borderColor: 'divider',
                borderRadius: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', width: 16, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
              >
                {i + 1}
              </Typography>
              {mode === 'input' ? (
                <TextField
                  variant="standard"
                  value={slots[i] ?? ''}
                  onChange={(e) => setSlot(i, e.target.value.trim().toLowerCase())}
                  onPaste={(e) => handlePaste(i, e)}
                  disabled={disabled}
                  data-gui-node-id={`Passphrase.word.${i + 1}`}
                  InputProps={{ disableUnderline: true }}
                  sx={{ '& input': { fontFamily: 'monospace', fontSize: '0.85rem', p: '2px 0' } }}
                />
              ) : (
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {slots[i] || '·····'}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {mode === 'reveal' && (
          <IconButton
            size="small"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? 'Reveal phrase' : 'Hide phrase'}
            data-gui-node-id="Passphrase.toggleReveal"
            sx={{ position: 'absolute', top: 4, right: 4 }}
          >
            <Icon name={hidden ? 'visibility' : 'visibility_off'} fontSize={18 as any} />
          </IconButton>
        )}
      </Box>

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
      )}

      {mode === 'reveal' && (
        <Box
          component="button"
          type="button"
          onClick={toggleConfirmed}
          disabled={disabled}
          data-gui-node-id="Passphrase.confirmBackup"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            border: '1px solid',
            borderColor: isConfirmed ? 'primary.main' : 'divider',
            borderRadius: 1,
            background: 'transparent',
            color: isConfirmed ? 'primary.main' : 'text.secondary',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Icon name={isConfirmed ? 'check_box' : 'check_box_outline_blank'} fontSize={18 as any} />
          <Typography variant="body2">I've written down my 12 words in a safe place</Typography>
        </Box>
      )}
    </Box>
  );
}
