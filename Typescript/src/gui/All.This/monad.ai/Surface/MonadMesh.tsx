// MonadMesh — collapsible list of registered/sleeping monads + restart-all.
// Pure display: all data comes in via props.

import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';

export interface MonadMeshAppEntry {
  name: string;
  port: number;
  healthy: boolean;
}

export interface MonadMeshSleepingEntry {
  name: string;
}

export type MonadMeshRestartStatus = 'idle' | 'restarting' | 'ok' | 'error';

export interface MonadMeshProps {
  /** Currently live/registered monads. */
  apps: MonadMeshAppEntry[];
  /** Known-but-not-running monads (from the catalog) that can be woken. */
  sleepingEntries?: MonadMeshSleepingEntry[];
  /** Per-name "waking…" state, keyed by monad name. */
  waking?: Record<string, boolean>;
  /** Called when the user clicks "wake" on a sleeping monad. */
  onWake?: (name: string) => void;
  /** Restart-all-monads control, rendered at the bottom of the mesh section. */
  restartStatus?: MonadMeshRestartStatus;
  restartError?: string | null;
  onRestartAll?: () => void;
  /** Starts expanded or collapsed. Defaults to collapsed. */
  defaultOpen?: boolean;
}

export default function MonadMesh({
  apps,
  sleepingEntries = [],
  waking = {},
  onWake,
  restartStatus = 'idle',
  restartError = null,
  onRestartAll,
  defaultOpen = false,
}: MonadMeshProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Box>
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', mb: open ? 0.75 : 0, userSelect: 'none' }}
      >
        <Typography variant="overline" sx={{ opacity: 0.3, fontSize: '9px', letterSpacing: '0.12em', flex: 1 }}>
          monad mesh
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.3, fontSize: '10px' }}>
          {apps.length + sleepingEntries.length > 0 ? `${apps.length + sleepingEntries.length}` : '0'} {open ? '▲' : '▼'}
        </Typography>
      </Box>

      {open && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {apps.length === 0 && sleepingEntries.length === 0 ? (
            <Typography variant="caption" sx={{ opacity: 0.25, fontFamily: 'monospace', display: 'block', mb: 1 }}>
              no monads registered
            </Typography>
          ) : (
            <>
              {apps.map(app => (
                <Box key={app.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: app.healthy ? '#22c55e' : 'rgba(255,255,255,0.18)' }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.7, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.name}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.35, flexShrink: 0 }}>
                    :{app.port}
                  </Typography>
                </Box>
              ))}
              {sleepingEntries.map(entry => (
                <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)' }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.35, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </Typography>
                  <Box
                    component="button"
                    onClick={() => onWake?.(entry.name)}
                    disabled={waking[entry.name]}
                    sx={{
                      cursor: waking[entry.name] ? 'default' : 'pointer',
                      background: 'none', border: '1px solid', borderColor: 'divider',
                      borderRadius: 1, px: 0.75, py: 0.1,
                      fontSize: '9px', fontFamily: 'monospace', color: 'text.secondary',
                      opacity: waking[entry.name] ? 0.35 : 0.55, lineHeight: 1.6,
                      '&:hover': { opacity: waking[entry.name] ? 0.35 : 0.9, borderColor: 'text.secondary' },
                    }}
                  >
                    {waking[entry.name] ? 'waking…' : 'wake'}
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* Restart all — inside mesh section */}
          <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="button"
              onClick={() => (restartStatus === 'idle' || restartStatus === 'error') ? onRestartAll?.() : undefined}
              disabled={restartStatus === 'restarting'}
              sx={{
                cursor: restartStatus === 'restarting' ? 'default' : 'pointer',
                background: 'none', border: '1px solid',
                borderColor: restartStatus === 'error' ? 'error.main' : 'divider',
                borderRadius: 1, px: 1, py: 0.3,
                fontSize: '10px', fontFamily: 'monospace',
                color: restartStatus === 'error' ? 'error.main' : 'text.secondary',
                opacity: restartStatus === 'restarting' ? 0.45 : 0.6,
                lineHeight: 1.6,
                '&:hover': { opacity: restartStatus === 'restarting' ? 0.45 : 1, borderColor: 'text.secondary' },
              }}
            >
              {restartStatus === 'restarting' ? 'restarting…' : restartStatus === 'ok' ? 'restarted ✓' : 'restart all'}
            </Box>
            {restartStatus === 'error' && restartError ? (
              <Typography variant="caption" sx={{ color: 'error.main', opacity: 0.8, fontSize: '10px' }}>{restartError}</Typography>
            ) : null}
          </Box>
        </Box>
      )}
    </Box>
  );
}

MonadMesh.displayName = 'All.This.Monad.Mesh';
