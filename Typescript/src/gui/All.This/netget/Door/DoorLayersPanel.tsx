// What is and is not behind this door, layer by layer, and where "here" is. Shown wherever a page needs a layer that
// is not up, in place of each page's own error text: one message for "off", the same on every route, that says
// WHICH layer is missing instead of just "not available".
//
//   nginx    served this page: if you can read this, it is up.
//   backend  netget's gateway API.
//   monad    netget's own .me.
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import type { DoorLayers, LayerState } from '@/react/session/doorLayers';

export type DoorNeeds = 'backend' | 'monad' | 'both';

export type DoorLayersPanelProps = {
  layers: DoorLayers;
  /** The namespace being looked at (a name, never an address). */
  namespace?: string;
  /** The location this page was served from (read-only: a place, not a namespace). */
  location?: string;
  sx?: any;
  'data-gui-node-id'?: string;
};

const STATE_TEXT: Record<LayerState, string> = {
  checking: 'checking…',
  up: 'up',
  off: 'off',
  error: 'answered with an error',
};

const STATE_COLOR: Record<LayerState, string> = {
  checking: 'warning.main',
  up: 'success.main',
  off: 'text.disabled',
  error: 'error.main',
};

/** Does the layer a page needs fail the page? ('checking' does not: nothing is known yet.) */
export function doorBlocks(layers: DoorLayers, needs: DoorNeeds = 'monad'): boolean {
  const wanted: Array<'backend' | 'monad'> = needs === 'both' ? ['backend', 'monad'] : [needs];
  return wanted.some((layer) => layers[layer] === 'off' || layers[layer] === 'error');
}

function Row({ name, detail, state, reason }: { name: string; detail: string; state: LayerState; reason?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <Box sx={{ width: 10, height: 10, mt: 0.6, borderRadius: '50%', bgcolor: STATE_COLOR[state], flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {name}{' '}
          <Typography component="span" variant="body2" sx={{ color: STATE_COLOR[state], fontWeight: 600 }}>
            {STATE_TEXT[state]}
          </Typography>
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {detail}
          {reason && state !== 'up' && state !== 'checking' ? ` — ${reason}` : ''}
        </Typography>
      </Box>
    </Box>
  );
}

function Command({ text }: { text: string }) {
  return (
    <Box component="code" sx={{ fontFamily: 'monospace', fontSize: 13, px: 1, py: 0.25, borderRadius: 1, bgcolor: 'action.hover' }}>
      {text}
    </Box>
  );
}

export default function DoorLayersPanel({ layers, namespace, location, sx, 'data-gui-node-id': nodeId = 'GUI.content.off' }: DoorLayersPanelProps) {
  const backendDown = layers.backend === 'off';
  const monadDown = layers.monad === 'off';
  const title = backendDown
    ? "netget's gateway service is off"
    : monadDown
      ? 'No .me answers here'
      : layers.backend === 'error' || layers.monad === 'error'
        ? 'A layer answered with an error'
        : 'Checking what is behind this door…';

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component="DoorLayers"
      sx={{ width: '100%', maxWidth: 520, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2, p: { xs: 2, sm: 3 }, ...sx }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Row name="nginx" detail="serving this page" state={layers.nginx} />
        <Row name="backend" detail="netget's gateway API" state={layers.backend} reason={layers.backendReason} />
        <Row name="monad" detail="netget's own .me, through /apps/netget" state={layers.monad} reason={layers.monadReason} />
      </Box>

      {(namespace || location) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Where you are
          </Typography>
          {namespace && <Typography variant="body2">namespace: <strong>{namespace}</strong></Typography>}
          {location && <Typography variant="body2">location: <strong>{location}</strong></Typography>}
        </Box>
      )}

      {backendDown && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Start the gateway service with <Command text="netget backend-start" />; it brings its monad up too.
        </Typography>
      )}
      {!backendDown && monadDown && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          The gateway service is up but its monad is not. Start it with <Command text="monads on netget" />.
        </Typography>
      )}
    </Box>
  );
}
