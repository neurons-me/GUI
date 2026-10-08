// What the person sees when the QR's expression could not be reached: one plain sentence and three ways forward.
// Nothing here asks them to know what nginx, a backend or a monad is; that is behind "Namespace diagnosis", which is
// where the layers, the trace and the way to start the environment live.
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
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

function ActionButton({ label, onClick, nodeId, primary }: { label: string; onClick: () => void; nodeId: string; primary?: boolean }) {
  return (
    <Box
      component="button"
      type="button"
      data-gui-node-id={nodeId}
      onClick={onClick}
      sx={{
        width: '100%', px: 2, py: 0.9, borderRadius: 1.5, border: '1px solid', borderColor: primary ? 'primary.main' : 'divider',
        bgcolor: 'transparent', color: primary ? 'primary.main' : 'text.primary', fontWeight: 600, fontSize: '0.875rem',
        textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
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
      sx={{ width: '100%', maxWidth: view === 'diagnosis' ? 460 : 320, mx: 'auto', mt: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1 }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: 'center' }}>
        Unable to connect to {expression}
      </Typography>

      {view === 'menu' && (
        <>
          {!publicIsThis && <ActionButton primary label={`Connect to ${PUBLIC_NAMESPACE}`} nodeId={`${nodeId}.public`} onClick={onConnectPublic} />}
          <ActionButton label="Try another namespace" nodeId={`${nodeId}.another`} onClick={() => setView('another')} />
          <ActionButton label="Namespace diagnosis" nodeId={`${nodeId}.diagnosis`} onClick={() => setView('diagnosis')} />
        </>
      )}

      {view === 'another' && (
        <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 0.75 }}>
          <Box
            component="input"
            autoFocus
            value={draft}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
            placeholder="namespace"
            spellCheck={false}
            autoComplete="off"
            data-gui-node-id={`${nodeId}.another.input`}
            sx={{ flex: 1, minWidth: 0, px: 1.25, py: 0.75, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'transparent', color: 'text.primary', fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <ActionButton primary label="Connect" nodeId={`${nodeId}.another.go`} onClick={() => submit()} />
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

      {view !== 'menu' && (
        <Box component="button" type="button" onClick={() => setView('menu')} sx={{ alignSelf: 'center', border: 0, bgcolor: 'transparent', color: 'text.secondary', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Back
        </Box>
      )}
      {view === 'menu' && onDismiss && (
        <Box component="button" type="button" onClick={onDismiss} sx={{ alignSelf: 'center', border: 0, bgcolor: 'transparent', color: 'text.secondary', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Close
        </Box>
      )}
    </Box>
  );
}
