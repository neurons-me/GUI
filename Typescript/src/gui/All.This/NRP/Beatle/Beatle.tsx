import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { GlobalStyles } from '@mui/system';
import Typography from '@/gui/Atoms/Typography/Typography';
import { useBeatle } from './useBeatle';
import { useLauncherPopover } from '@/runtime/launcherPopover';
import type { BeatleProps, NRPResolver, ResolutionState } from './Beatle.types';
import { makeDefaultResolvers } from './Beatle.types';

// ── constants ──────────────────────────────────────────────────────────────

const LS_KEY = 'beatle:resolver-history';
const MAX_HISTORY = 8;

// Previously hardcoded hex (#555e66/#ffb74d/#66bb6a/...), independent of
// whatever theme was active -- confirmed live to disagree with QR.me's own
// status dot, which reads real theme tokens (warning/error/success.main,
// see QR.me.tsx) and recolors correctly per-theme (e.g. Seafoam). Rebuilt
// here as a hook so both read the same live theme instead of two unrelated
// color systems that only coincidentally looked similar under the default
// MUI palette. Bucketing matches Namespace.tsx's own qrStatus derivation
// (the one already shipped/verified live) where it overlaps: error+invalid
// both map to the theme's error tone (the original split them into grey
// vs red, which was never intentional -- QR.me's real bucketing was
// already error for both). connected/streaming keep their own distinct
// tones (success vs info) since Beatle shows both as live substates that
// QR.me's coarser 4-bucket status collapses into one "confirmed".
function useStateColor(): Record<ResolutionState, string> {
  const theme = useTheme();
  return useMemo(() => ({
    idle:         theme.palette.text.disabled,
    parsing:      theme.palette.warning.main,
    connecting:   theme.palette.warning.main,
    resolving:    theme.palette.warning.light,
    connected:    theme.palette.success.main,
    streaming:    theme.palette.info.main,
    error:        theme.palette.error.main,
    invalid:      theme.palette.error.main,
    disconnected: theme.palette.text.disabled,
  }), [theme]);
}

const STATE_LABEL: Record<ResolutionState, string> = {
  idle:         'no channel',
  parsing:      'parsing…',
  connecting:   'connecting…',
  resolving:    'resolving…',
  connected:    'connected',
  streaming:    'streaming',
  error:        'no server',
  invalid:      'invalid domain',
  disconnected: 'disconnected',
};

const KIND_COLOR: Record<NRPResolver['kind'], string> = {
  local:  '#81c784',
  public: '#ce93d8',
};

const PULSING: ResolutionState[] = ['parsing', 'connecting', 'resolving'];

// ── helpers ────────────────────────────────────────────────────────────────

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}

function saveHistory(items: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); } catch {}
}

// Always wss:// — see makeDefaultResolvers' own comment in Beatle.types.ts
// for why "looks local, so ws:// is fine" was never actually a safe guess.
function namespaceToWs(ns: string): string {
  return `wss://${ns}/nrp`;
}

// ── component ──────────────────────────────────────────────────────────────

export default function Beatle({
  defaultExpression = '',
  resolvers,
  nrpEndpoint,
  showResolver = true,
  onConnect,
  onMessage,
  onDisconnect,
  onStateChange,
  variant = 'bar',
  launcherId = 'beatle',
  sx,
}: BeatleProps) {
  const [input, setInput] = useState(defaultExpression);
  const [focused, setFocused] = useState(false);
  const expressionRef = useRef<HTMLInputElement>(null);
  // `variant="bubble"` only: anchor + open state for the popover that
  // reveals the full bar. Shares ThemeLauncher/DevToolsLauncher's own
  // mutual-exclusion context (see launcherPopover.tsx) rather than a
  // private useState, so a Beatle bubble sitting next to those launchers
  // in the same rail doesn't leave two poppers open at once.
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useLauncherPopover(launcherId);

  // Default resolvers derived from window.location.hostname once on mount
  const defaults = useMemo(() => resolvers ?? makeDefaultResolvers(), []);

  // History from localStorage, merged with defaults (deduped)
  const [history, setHistory] = useState<string[]>(loadHistory);
  const options = useMemo(() => {
    const all = [...history, ...defaults.map(r => r.label)];
    return [...new Set(all)];
  }, [history, defaults]);

  // Active resolver label
  const [resolverLabel, setResolverLabel] = useState<string>(
    () => defaults.find(r => r.ws === nrpEndpoint)?.label ?? defaults[0].label,
  );
  // Input is empty until the user focuses — the dot color signals the active resolver
  const [resolverInput, setResolverInput] = useState('');

  const resolverWs = useMemo(() => {
    const matched = defaults.find(r => r.label === resolverLabel);
    return matched?.ws ?? namespaceToWs(resolverLabel);
  }, [resolverLabel, defaults]);

  const resolverKind = useMemo<NRPResolver['kind']>(() => {
    return defaults.find(r => r.label === resolverLabel)?.kind ?? 'public';
  }, [resolverLabel, defaults]);

  const { channel, open, send, disconnect } = useBeatle(resolverWs, onMessage);
  const STATE_COLOR = useStateColor();
  const color = STATE_COLOR[channel.state];
  const pulsing = PULSING.includes(channel.state);

  useEffect(() => { if (channel.state === 'connected') onConnect?.(channel); }, [channel.state]); // eslint-disable-line
  useEffect(() => { if (channel.state === 'disconnected') onDisconnect?.(); }, [channel.state]); // eslint-disable-line
  useEffect(() => { onStateChange?.(channel.state); }, [channel.state]); // eslint-disable-line

  const commitResolver = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setResolverLabel(trimmed);
    disconnect();
    // Save to history (prepend, dedupe)
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(h => h !== trimmed)];
      saveHistory(next);
      return next;
    });
  }, [disconnect]);

  const handleSubmit = useCallback(() => { open(input.trim()); }, [input, open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { disconnect(); setInput(''); expressionRef.current?.blur(); }
  };

  const expressionLabel = channel.expression?.canonical ?? channel.expression?.raw ?? '';

  // The full bar's contents -- extracted so `variant="bubble"` can open the
  // exact same UI (same handlers, same single `useBeatle()` channel) inside
  // a Popper instead of duplicating it. There is never a second `useBeatle`
  // call for the expanded state, unlike two separately-mounted <Beatle>
  // instances would produce (each opens its own independent WebSocket).
  const barContent = (
    <Box
      // Array form, not `{...defaults, ...sx}` — that plain object spread
      // silently dropped a function-form sx (MUI's normal way to read
      // the live theme, e.g. `sx={(theme) => ({...})}`): spreading a
      // function's own enumerable properties copies nothing, so the
      // caller's override never applied and this fell back to its own
      // defaults underneath. MUI's Box already merges an array of
      // (object | function | falsy) correctly, in order — this is that,
      // not a new mechanism.
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          width: '100%',
          height: 44,
          px: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: focused ? color : 'divider',
          bgcolor: 'background.paper',
          transition: 'border-color 0.2s ease',
        },
        ...(variant === 'bar' ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      {/* Scarab */}
      <Box
        sx={{
          fontSize: 18, lineHeight: 1, color, flexShrink: 0,
          transition: 'color 0.3s ease',
          animation: pulsing ? 'beatle-pulse 1s ease-in-out infinite' : 'none',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() =>
          channel.state === 'connected' || channel.state === 'streaming'
            ? disconnect() : handleSubmit()
        }
        title={channel.state === 'connected' || channel.state === 'streaming' ? 'Disconnect' : 'Open channel'}
      >
        𓆣
      </Box>

      {/* Expression input */}
      <Box
        ref={expressionRef}
        component="input"
        value={input}
        onChange={e => setInput((e.target as HTMLInputElement).value)}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="username @ namespace [surface] / path"
        spellCheck={false}
        autoComplete="off"
        sx={{
          flex: 1, border: 'none', outline: 'none',
          background: 'transparent', color: 'text.primary',
          fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 500, minWidth: 0,
          '&::placeholder': { color: 'text.disabled', fontStyle: 'italic' },
        }}
      />

      {showResolver && (
        <>
          {/* Divider */}
          <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', flexShrink: 0 }} />

          {/* Resolver combobox */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: KIND_COLOR[resolverKind], flexShrink: 0 }} />
            <Box
              component="input"
              list="beatle-resolvers"
              value={resolverInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResolverInput(e.target.value)}
              onBlur={() => { if (resolverInput.trim()) commitResolver(resolverInput); }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') { commitResolver(resolverInput); e.currentTarget.blur(); }
              }}
              placeholder="namespace"
              spellCheck={false}
              autoComplete="off"
              sx={{
                border: 'none', outline: 'none', background: 'transparent',
                color: 'text.secondary', fontFamily: 'monospace',
                fontSize: '0.68rem', fontWeight: 500, width: 120,
                '&::placeholder': { color: 'text.disabled', fontStyle: 'italic' },
              }}
            />
            <datalist id="beatle-resolvers">
              {options.map(o => <option key={o} value={o} />)}
            </datalist>
          </Box>
        </>
      )}

      {/* State — nothing shown at rest ('idle'): there's genuinely
          nothing to report before anyone's tried to open a channel, and
          a fixed word there ("no channel") read as noise, not insight,
          confirmed live (2026-09-16). Every other state IS something
          that actually happened (an attempt, a result), worth showing. */}
      {channel.state !== 'idle' && (
        <Typography
          variant="caption"
          sx={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 600, color, transition: 'color 0.3s ease', whiteSpace: 'nowrap' }}
        >
          {STATE_LABEL[channel.state]}
        </Typography>
      )}

      {/* Endpoints badge */}
      {(channel.state === 'connected' || channel.state === 'streaming') && channel.resolved.length > 0 && (
        <Box sx={{
          flexShrink: 0, px: 0.75, py: 0.25, borderRadius: 1,
          bgcolor: channel.state === 'streaming' ? 'rgba(79,195,247,0.12)' : 'rgba(102,187,106,0.12)',
          border: `1px solid ${channel.state === 'streaming' ? 'rgba(79,195,247,0.3)' : 'rgba(102,187,106,0.3)'}`,
        }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color, fontFamily: 'monospace' }}>
            {channel.resolved.length} endpoint{channel.resolved.length > 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (variant === 'bubble') {
    return (
      <>
      {/* Own copy, not shared with the bar variant's below -- a bubble
          can be the ONLY Beatle instance mounted on a page, and MUI's
          GlobalStyles only injects the keyframes an actually-rendered
          instance asks for. */}
      <GlobalStyles styles={{ '@keyframes beatle-pulse': { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } } }} />
      <Box
        ref={bubbleRef}
        title={expressionLabel ? `me://${expressionLabel} — ${STATE_LABEL[channel.state]}` : 'Beatle — NRP channel'}
        // Opens/closes the popover holding the full bar, rather than
        // directly toggling connect/disconnect on click as this used to.
        // That older behavior meant a bubble mounted somewhere space-
        // constrained (a mobile TopBar, a LeftBar rail) could only ever
        // open/close a fixed `defaultExpression` -- there was no way to
        // type a different one without a roomy `variant="bar"` mounted
        // elsewhere. Now the bubble is purely a collapsed trigger for the
        // exact same bar (barContent above), the way ThemeLauncher's own
        // avatar bubble expands into its full catalog -- see
        // useLauncherPopover for the shared "only one open at a time"
        // mechanism this borrows.
        onClick={() => setPopoverOpen((p) => !p)}
        // Array form — see barContent's own Box above for why (a
        // function-form sx silently dropped by a plain object spread).
        sx={[
          { display: 'inline-flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <span
          style={{
            fontSize: 22, color, filter: `drop-shadow(0 0 4px ${color})`, lineHeight: 1,
            animation: pulsing ? 'beatle-pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          𓆣
        </span>
      </Box>
      <Popper
        open={popoverOpen}
        anchorEl={bubbleRef.current}
        placement="bottom-end"
        sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 3 }}
      >
        <ClickAwayListener onClickAway={() => setPopoverOpen(false)}>
          <Box
            sx={{
              mt: 1,
              p: 1,
              width: 340,
              maxWidth: '90vw',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: 4,
            }}
          >
            {barContent}
          </Box>
        </ClickAwayListener>
      </Popper>
      </>
    );
  }

  return (
    <>
      <GlobalStyles styles={{ '@keyframes beatle-pulse': { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } } }} />
      {barContent}
    </>
  );
}
