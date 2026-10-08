// What the person sees when the QR's expression could not be reached: one plain sentence and three ways forward.
// Nothing here asks them to know what nginx, a backend or a monad is; that is behind "Namespace diagnosis", which is
// where the layers, the trace and the way to start the environment live.
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import DoorLayersPanel from '../netget/Door/DoorLayersPanel';
import type { DoorLayers } from '@/react/session/doorLayers';
import type { TraceEntry } from '@/react/session/connectTrace';

export const PUBLIC_NAMESPACE = 'cleaker.me';

export type ConnectFailureProps = {
  /** The expression that was executed (a root such as `localhost`). */
  expression: string;
  /** What was read behind this page's own door, when the expression was local. */
  layers?: DoorLayers | null;
  trace?: readonly TraceEntry[];
  /** Where the page was served from, for the diagnosis. */
  location?: string;
  onConnectPublic: () => void;
  onTryNamespace: (root: string) => void;
  onDismiss?: () => void;
  'data-gui-node-id'?: string;
};

type View = 'menu' | 'another' | 'diagnosis';

// The shape and weight of cleaker.me's own `.me` button: 10px corners, a 1px line, 600 weight, ink on paper. The first
// option carries the ink; the others stay quiet until pointed at. The icon sits at the edge so the label stays centred.
const OPTION_HEIGHT = 40;
const OPTION_RADIUS = '10px';

function ActionButton({ label, onClick, nodeId, primary, icon }: { label: string; onClick: () => void; nodeId: string; primary?: boolean; icon?: string }) {
  return (
    <Box
      component="button"
      type="button"
      data-gui-node-id={nodeId}
      onClick={onClick}
      sx={{
        position: 'relative', width: '100%', height: OPTION_HEIGHT, px: 4, borderRadius: OPTION_RADIUS, border: '1px solid',
        borderColor: primary ? 'primary.main' : 'divider', bgcolor: 'transparent',
        color: primary ? 'primary.main' : 'text.secondary', fontFamily: 'inherit', fontWeight: primary ? 600 : 500, fontSize: '0.8125rem',
        letterSpacing: '0.01em', textAlign: 'center', cursor: 'pointer',
        transition: 'border-color 140ms ease, color 140ms ease, background-color 140ms ease',
        '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'action.hover' },
        '&:focus': { outline: 'none' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {icon && (
        <Box component="span" aria-hidden="true" sx={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', opacity: 0.8 }}>
          <Icon name={icon} fontSize="1.05rem" weight={300} />
        </Box>
      )}
      {label}
    </Box>
  );
}

function QuietLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        alignSelf: 'center', mt: 0.5, p: 0, border: 0, bgcolor: 'transparent', color: 'text.secondary', fontFamily: 'inherit',
        fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px',
        '&:hover': { color: 'text.primary' }, '&:focus': { outline: 'none' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {label}
    </Box>
  );
}

export default function ConnectFailure({ expression, layers, trace = [], location, onConnectPublic, onTryNamespace, onDismiss, 'data-gui-node-id': nodeId = 'GUI.content.connect-failure' }: ConnectFailureProps) {
  const [view, setView] = React.useState<View>('menu');
  const [draft, setDraft] = React.useState('');
  const publicIsThis = expression.trim().toLowerCase() === PUBLIC_NAMESPACE;

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const next = draft.trim();
    if (next) onTryNamespace(next);
  };

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component="ConnectFailure"
      role="group"
      aria-label={`Unable to connect to ${expression}`}
      sx={{ width: '100%', maxWidth: view === 'diagnosis' ? 460 : 236, mx: 'auto', mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1 }}
    >
      {/* The namespace is already drawn around the QR (in red); this only says what happened. */}
      <Typography
        component="div"
        sx={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, textAlign: 'center', width: '100%', color: 'text.primary', mb: 0.75 }}
      >
        Unable to connect
      </Typography>

      {view === 'menu' && (
        <>
          {!publicIsThis && <ActionButton primary icon="language" label={`Connect to ${PUBLIC_NAMESPACE}`} nodeId={`${nodeId}.public`} onClick={onConnectPublic} />}
          <ActionButton icon="edit" label="Try another namespace" nodeId={`${nodeId}.another`} onClick={() => setView('another')} />
          <ActionButton icon="monitor_heart" label="Diagnosis" nodeId={`${nodeId}.diagnosis`} onClick={() => setView('diagnosis')} />
        </>
      )}

      {view === 'another' && (
        <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            component="input"
            autoFocus
            value={draft}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
            placeholder="namespace"
            spellCheck={false}
            autoComplete="off"
            data-gui-node-id={`${nodeId}.another.input`}
            sx={{
              width: '100%', height: OPTION_HEIGHT, px: 1.75, boxSizing: 'border-box', borderRadius: OPTION_RADIUS, border: '1px solid', borderColor: 'divider',
              bgcolor: 'transparent', color: 'text.primary', fontFamily: 'monospace', fontSize: '0.85rem', textAlign: 'center',
              transition: 'border-color 140ms ease', '&:focus': { outline: 'none', borderColor: 'primary.main' },
            }}
          />
          <ActionButton primary icon="arrow_forward" label="Connect" nodeId={`${nodeId}.another.go`} onClick={() => submit()} />
        </Box>
      )}

      {view === 'diagnosis' && (
        <Box data-gui-node-id={`${nodeId}.diagnosis.body`} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {layers ? (
            <DoorLayersPanel layers={layers} namespace={expression} location={location} sx={{ p: 0, maxWidth: 'none' }} />
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {expression} was asked directly; there is no local environment to inspect for it.
            </Typography>
          )}
          {trace.length > 0 && (
            <Box component="pre" sx={{ m: 0, p: 1, borderRadius: 1, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 11.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 160, overflow: 'auto' }}>
              {trace.map((entry) => `${new Date(entry.at).toLocaleTimeString()} ${entry.step} ${entry.outcome}${entry.detail ? ` — ${entry.detail}` : ''}`).join('\n')}
            </Box>
          )}
        </Box>
      )}

      {view !== 'menu' && <QuietLink label="Back" onClick={() => setView('menu')} />}
      {view === 'menu' && onDismiss && <QuietLink label="Close" onClick={onDismiss} />}
    </Box>
  );
}
