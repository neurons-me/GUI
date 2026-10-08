// MonadNamespaceCard — composes 2 pieces of a namespace surface: the
// monad.ai orb (the subtractive-synthesis identicon bubble, "is this
// physical surface healthy") and MonadMesh (which monads are live/sleeping
// under it, plus restart-all). Pure display: all data comes in via props.
//
// Used to also include MonadClaims (namespace claim/user rows) as a third
// section here — removed on purpose: claims belong to the NAMESPACE, not to
// a monad instance, and Cleaker/Users already shows them in full. Stacking
// a second, compact copy of the same data under an orb+mesh card mixed
// two unrelated concerns (identity vs. runtime/mesh health) into one
// component. This card is purely "is this physical monad host alive, and
// what's running on it" — namespace/user identity lives elsewhere.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import Monad from '../monad.ai';
import MonadMesh, { MonadMeshAppEntry, MonadMeshSleepingEntry, MonadMeshRestartStatus } from './MonadMesh';

export type MonadNamespaceAppEntry = MonadMeshAppEntry;
export type MonadNamespaceSleepingEntry = MonadMeshSleepingEntry;
export type MonadNamespaceRestartStatus = MonadMeshRestartStatus;

export interface MonadNamespaceCardProps {
  /** The hostname/namespace this card represents, e.g. "suis-macbook-air.local" */
  namespace: string;
  /** Drives the orb glow: true = green/online, false = red/offline, null/undefined = default blue. */
  healthy?: boolean | null;
  /** Currently live/registered monads. */
  apps: MonadNamespaceAppEntry[];
  /** Known-but-not-running monads (from the catalog) that can be woken. */
  sleepingEntries?: MonadNamespaceSleepingEntry[];
  /** Per-name "waking…" state, keyed by monad name. */
  waking?: Record<string, boolean>;
  /** Called when the user clicks "wake" on a sleeping monad. */
  onWake?: (name: string) => void;
  /** Restart-all-monads control, rendered at the bottom of the mesh section. */
  restartStatus?: MonadNamespaceRestartStatus;
  restartError?: string | null;
  onRestartAll?: () => void;
}

const cardSx = {
  position: 'relative' as const,
  width: '100%',
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  background: 'background.paper',
  overflow: 'hidden',
};

export default function MonadNamespaceCard({
  namespace,
  healthy = null,
  apps,
  sleepingEntries = [],
  waking = {},
  onWake,
  restartStatus = 'idle',
  restartError = null,
  onRestartAll,
}: MonadNamespaceCardProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="overline" sx={{ opacity: 0.4, letterSpacing: '0.1em' }}>
        {namespace}
      </Typography>

      <Box sx={cardSx}>
        {/* monad.ai orb */}
        <Box sx={{ height: 130 }}>
          <Monad mode="contained" kind="monad" label="monad.ai" healthy={healthy} />
        </Box>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2, py: 1.5 }}>
          <MonadMesh
            apps={apps}
            sleepingEntries={sleepingEntries}
            waking={waking}
            onWake={onWake}
            restartStatus={restartStatus}
            restartError={restartError}
            onRestartAll={onRestartAll}
          />
        </Box>
      </Box>
    </Box>
  );
}

MonadNamespaceCard.displayName = 'All.This.Monad.NamespaceCard';
