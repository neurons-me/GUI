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
  /** The path that was asked for, when this panel stands where that path would have been (an entry point). */
  asked?: string;
  /**
   * `compact`: a title, the three layers on one line and the action (the Home when nothing answers: the grey QR is
   * the way in and this is all that sits under it). `full` (default): each layer with why it is in that state, and
   * where you are (the page that stands in for a route).
   */
  variant?: 'compact' | 'full';
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

/** Does the layer a page needs fail the page? ('checking' does not: nothing is known yet; see doorPending.) */
export function doorBlocks(layers: DoorLayers, needs: DoorNeeds = 'monad'): boolean {
  const wanted: Array<'backend' | 'monad'> = needs === 'both' ? ['backend', 'monad'] : [needs];
  return wanted.some((layer) => layers[layer] === 'off' || layers[layer] === 'error');
}


/** The one command that starts the next missing layer, or null when nothing is missing that a command can start. */
export function nextCommand(layers: DoorLayers): string | null {
  if (layers.backend === 'off') return 'netget backend-start';
  if (layers.monad === 'off') return 'monads on netget';
  return null;
}

/** Is a layer a page needs still being read? Until it is, the page must not render: it would print its own error for a moment. */
export function doorPending(layers: DoorLayers, needs: DoorNeeds = 'monad'): boolean {
  const wanted: Array<'backend' | 'monad'> = needs === 'both' ? ['backend', 'monad'] : [needs];
  return wanted.some((layer) => layers[layer] === 'checking');
}

// A page that nginx serves cannot start a process on the machine, and no route does it: the honest action is to put the
// exact command in the clipboard and show it. (Starting it for real needs the service the environment installs, not a button.)
function BootstrapAction({ command }: { command: string; origin?: string }) {
  const [note, setNote] = React.useState<string | null>(null);
  const copy = async () => {
    try { await navigator.clipboard?.writeText(command); } catch { /* the command is on screen either way */ }
    setNote(`Run this in a terminal (copied): ${command}`);
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
      <Box
        component="button"
        type="button"
        data-gui-node-id="GUI.content.off.start-command"
        onClick={copy}
        sx={{
          px: 2.5, py: 0.75, borderRadius: 1.5, border: '1px solid', borderColor: 'primary.main', bgcolor: 'transparent',
          color: 'primary.main', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        Copy start command
      </Box>
      {note && <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 360 }}>{note}</Typography>}
    </Box>
  );
}


function Dot({ name, state }: { name: string; state: LayerState }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATE_COLOR[state], flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: state === 'up' ? 'text.primary' : 'text.secondary' }}>{name}</Typography>
    </Box>
  );
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

export default function DoorLayersPanel({ layers, namespace, location, asked, variant = 'full', sx, 'data-gui-node-id': nodeId = 'GUI.content.off' }: DoorLayersPanelProps) {
  const backendDown = layers.backend === 'off';
  const monadDown = layers.monad === 'off';
  const title = backendDown
    ? "netget's gateway service is off"
    : monadDown
      ? 'No .me answers here'
      : layers.backend === 'error' || layers.monad === 'error'
        ? 'A layer answered with an error'
        : 'Checking what is behind this door…';

  const command = nextCommand(layers);
  const shortTitle = backendDown ? "netget's gateway service is off" : monadDown ? 'No .me answers here' : title;

  if (variant === 'compact') {
    return (
      <Box
        data-gui-node-id={nodeId}
        data-gui-component="DoorLayers"
        sx={{ width: '100%', maxWidth: 360, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, mt: 1.5, ...sx }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: 'center' }}>{shortTitle}</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Dot name="nginx" state={layers.nginx} />
          <Dot name="backend" state={layers.backend} />
          <Dot name="monad" state={layers.monad} />
        </Box>
        {command && <BootstrapAction command={command} origin={location} />}
      </Box>
    );
  }

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component="DoorLayers"
      sx={{ width: '100%', maxWidth: 440, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.75, p: { xs: 2, sm: 2.5 }, ...sx }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Row name="nginx" detail="serving this page" state={layers.nginx} />
        <Row name="backend" detail="netget's gateway API" state={layers.backend} reason={layers.backendReason} />
        <Row name="monad" detail="netget's own .me, through /apps/netget" state={layers.monad} reason={layers.monadReason} />
      </Box>

      {(namespace || location || asked) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Where you are
          </Typography>
          {namespace && <Typography variant="body2">namespace: <strong>{namespace}</strong></Typography>}
          {location && <Typography variant="body2">location: <strong>{location}</strong></Typography>}
          {asked && asked !== '/' && <Typography variant="body2">you asked for: <strong>{asked}</strong></Typography>}
        </Box>
      )}

      {command && <BootstrapAction command={command} origin={location} />}
    </Box>
  );
}
