// QRConnect -- the QR as the one control for "where am I connected": it shows an expression (a root namespace),
// executes it when clicked, and says what happened. A page only composes it and listens (`onStateChange`); the
// process lives here:
//
//   idle / off (grey) --click--> checking (loader) --> connected  (ink)
//                                                  \-> failed     (cross) --> "Unable to connect" + three ways forward
//
// Two doors, decided by the expression:
//   * this page's own root (or a loopback / local.* alias, or the root its monad confirmed): the page's own gateway
//     answers, and only while its door is up (`door`). The result is re-verified into the shared context
//     (`sharedRootStatus`, `onLocalResolved`).
//   * any other host: the browser's own runtime asks THAT host directly, `wss://<root>/nrp`, whether or not this
//     page's door is up (react/session/remoteRoot.ts). Nothing is signed or written here, and the shared context is
//     not moved to it.
// Every step is recorded in connectTrace. The channel hook is injectable (`useChannel`) so stories and tests can show
// every state without a network.
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import QRme from './QR.me';
import ConnectFailure from '@/gui/All.This/Cleaker/ConnectFailure';
import { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import { makeDefaultResolvers } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import type { ResolutionState } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import { remoteRootFor } from '@/react/session/remoteRoot';
import { connectTrace, layerEntries, doorIsUp } from '@/react/session/connectTrace';
import type { DoorLayers } from '@/react/session/doorLayers';
import type { CleakerRootStatus } from '@/react/session/verifiedCleakerRoot';

export type QRConnectStatus = 'idle' | 'checking' | 'confirmed' | 'error' | 'off';

export type QRConnectState = {
  status: QRConnectStatus;
  /** The expression when it is another host (asked directly), else null. */
  remoteRoot: string | null;
  /** The "Unable to connect" card is on screen. */
  failureShown: boolean;
};

/** What is known about this page's own door, and how to read it again. */
export type QRConnectDoor = {
  /** Nothing answers behind this page. */
  off: boolean;
  /** Still being read for the first time. */
  checking: boolean;
  layers?: DoorLayers | null;
  /** Reads the door now (clicking the QR runs it). */
  probe?: () => Promise<DoorLayers>;
};

export type QRConnectProps = {
  /** The root being looked at and executed. */
  expression: string;
  onExpressionChange?: (root: string) => void;
  /** Whether the person may type another root straight into the QR's label. */
  editable?: boolean;
  /** The root this page itself is served as (a root equal to it is never "another host"). */
  localRoot?: string | null;
  door?: QRConnectDoor;
  /** The shared context's own verification of the local root (the sidebar, /netget); only the local door waits on it. */
  sharedRootStatus?: CleakerRootStatus;
  /** A LOCAL channel resolved this namespace (the page may re-verify its shared context onto it). */
  onLocalResolved?: (namespace: string) => void;
  /** What the channel opens when it differs from what is shown (e.g. the whole identity once signed in). Default: the expression. */
  channelExpression?: string;
  /** False while nothing should connect (registering, recovering). Default true. */
  channelEnabled?: boolean;
  /** False once a session is open: the failure card is not offered then. Default true. */
  failureEnabled?: boolean;
  /** The channel hook. Default: Beatle's. Replace to drive every state in a story or a test. Must keep the same identity. */
  useChannel?: typeof useBeatle;
  /** What the QR encodes and the name previewed on it. */
  qrValue: string;
  username?: string;
  /** The text drawn around the QR when it is not simply the expression (a handle being typed, a signed-in identity). */
  perimeterLabel?: string;
  perimeterHandleHref?: string;
  /** Where the page was served from (shown in the diagnosis). */
  location?: string;
  onStateChange?: (state: QRConnectState) => void;
  'data-gui-node-id'?: string;
};

// Small by default (a badge, not something to scan across a room); click grows it to a size worth holding a camera up to.
const QR_DIAMETER_DEFAULT = 125;
const QR_DIAMETER_EXPANDED = 214;

const STATE_LABEL: Record<ResolutionState, string> = {
  idle: '',
  parsing: 'Parsing…',
  connecting: 'Connecting…',
  resolving: 'Resolving…',
  connected: 'Connected',
  streaming: 'Streaming',
  error: 'Could not connect',
  invalid: 'Invalid domain',
  disconnected: '',
};

const secureContext = () => typeof window !== 'undefined'
  && window.isSecureContext === true
  && typeof window.crypto?.subtle === 'object'
  && window.crypto.subtle !== null;

export default function QRConnect({
  expression,
  onExpressionChange,
  editable = true,
  localRoot = null,
  door = { off: false, checking: false },
  sharedRootStatus = 'confirmed',
  onLocalResolved,
  channelExpression,
  channelEnabled = true,
  failureEnabled = true,
  useChannel = useBeatle,
  qrValue,
  username,
  perimeterLabel,
  perimeterHandleHref,
  location,
  onStateChange,
  'data-gui-node-id': nodeId = 'QRConnect',
}: QRConnectProps) {
  const [expanded, setExpanded] = useState(false);
  const [attempting, setAttempting] = useState(false);
  const [failureShown, setFailureShown] = useState(false);
  const [probedLayers, setProbedLayers] = useState<DoorLayers | null>(null);

  // The root this page's monad CONFIRMED is a space that runtime declared for itself, so a one-label root (`localhost`)
  // is a valid namespace for the channel. Only a root that is this page's own can be it: another host's name never is.
  // Once confirmed it STAYS the declared context (a re-verification passes through 'checking' and must not drop it).
  const [confirmedRoot, setConfirmedRoot] = useState<string | null>(null);
  const expressionIsLocal = remoteRootFor(expression, { localRoot }) === null;
  useEffect(() => {
    if (sharedRootStatus === 'confirmed' && expression && expressionIsLocal) setConfirmedRoot(expression);
  }, [sharedRootStatus, expression, expressionIsLocal]);
  const declaredSpaces = useMemo(() => (confirmedRoot ? [confirmedRoot] : []), [confirmedRoot]);

  const remoteRoot = useMemo(() => remoteRootFor(expression, { localRoot, confirmedRoot }), [expression, localRoot, confirmedRoot]);

  // ── The channel ──────────────────────────────────────────────────────────────────────────────────────────────
  const resolverWs = useMemo(() => makeDefaultResolvers(remoteRoot ?? undefined)[0].ws, [remoteRoot]);
  const { channel, open } = useChannel(resolverWs, undefined, { declaredSpaces });
  const channelState: ResolutionState = channel.state;
  const toOpen = channelExpression ?? expression;
  const ready = channelEnabled && secureContext() && (!!remoteRoot || (!door.off && !door.checking));
  useEffect(() => {
    if (ready && toOpen) open(toOpen);
    // `open` changes only with the resolver, which changes together with `remoteRoot` (and so with `toOpen`).
    // declaredSpaces: the channel is opened again once the root is confirmed, since only then is a one-label root valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, toOpen, declaredSpaces]);

  // A LOCAL channel resolved: the page may move its shared context onto it. Another host answering says nothing about
  // the shared context (served by this page's own gateway), so it is not moved there.
  useEffect(() => {
    if (remoteRoot || channelState !== 'connected') return;
    const ast = channel.expression?.ast;
    if (ast?.kind === 'namespace' && ast.value) onLocalResolved?.(ast.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelState]);

  // A remote channel's own outcome is the result: recorded as it lands, and the way forward offered when it fails.
  useEffect(() => {
    if (!remoteRoot) return;
    if (channelState === 'connected' || channelState === 'streaming') {
      connectTrace.record({ expression: remoteRoot, step: 'channel', outcome: 'ok', detail: `wss://${remoteRoot}/nrp` });
      setFailureShown(false);
    } else if (channelState === 'error' || channelState === 'invalid') {
      connectTrace.record({ expression: remoteRoot, step: 'channel', outcome: 'error', detail: String(channel.error || channelState) });
      setFailureShown(true);
    } else if (channelState === 'disconnected') {
      connectTrace.record({ expression: remoteRoot, step: 'channel', outcome: 'off', detail: 'the connection closed' });
      setFailureShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteRoot, channelState]);

  // This page's own door came up (it is polled): there is nothing left to offer a way around.
  useEffect(() => {
    if (!remoteRoot && !door.off && !door.checking) setFailureShown(false);
  }, [remoteRoot, door.off, door.checking]);

  // ── The status the QR shows ───────────────────────────────────────────────────────────────────────────────────
  // The door's state and the shared context's re-verification are facts about THIS page's own gateway. Another host is
  // answered by that host alone, so neither applies to it: its channel decides.
  const status: QRConnectStatus =
    attempting ? 'checking'
    : !remoteRoot && door.off ? 'off'
    : !remoteRoot && door.checking ? 'checking'
    : channelState === 'error' || channelState === 'invalid' ? 'error'
    : channelState === 'parsing' || channelState === 'connecting' || channelState === 'resolving' ? 'checking'
    : channelState === 'connected' || channelState === 'streaming'
      ? (remoteRoot ? 'confirmed' : sharedRootStatus === 'error' ? 'error' : sharedRootStatus === 'checking' ? 'checking' : 'confirmed')
      : 'idle';
  const statusLabel = status === 'idle' ? ''
    : status === 'off' ? 'No .me here'
    : status === 'error' ? 'Could not connect'
    : status === 'confirmed' ? 'Connected'
    : (STATE_LABEL[channelState] || 'Checking…');

  const showFailure = failureShown && failureEnabled;
  useEffect(() => {
    onStateChange?.({ status, remoteRoot, failureShown: showFailure });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, remoteRoot, showFailure]);

  // ── Executing the expression ─────────────────────────────────────────────────────────────────────────────────
  const execute = useCallback(async () => {
    if (attempting) return;
    setFailureShown(false);
    if (remoteRoot) {
      connectTrace.record({ expression, step: 'execute', outcome: 'info', detail: `asking ${remoteRoot} directly` });
      open(toOpen);
      return;
    }
    setAttempting(true);
    connectTrace.record({ expression, step: 'execute', outcome: 'info', detail: "reading this page's own door" });
    try {
      if (!door.probe) {
        connectTrace.record({ expression, step: 'door', outcome: 'error', detail: 'this page cannot read its door' });
        setFailureShown(true);
        return;
      }
      const layers = await door.probe();
      setProbedLayers(layers);
      layerEntries(expression, layers).forEach((entry) => connectTrace.record(entry));
      if (!doorIsUp(layers)) setFailureShown(true);
    } catch (error) {
      connectTrace.record({ expression, step: 'door', outcome: 'error', detail: error instanceof Error ? error.message : String(error) });
      setFailureShown(true);
    } finally {
      setAttempting(false);
    }
  }, [attempting, expression, remoteRoot, open, toOpen, door]);

  // Not connected: clicking runs the expression. Connected (or still checking): it keeps toggling the size.
  const executes = status === 'off' || (!!remoteRoot && status === 'error');
  const activate = () => {
    if (executes) { void execute(); return; }
    setExpanded((value) => !value);
  };

  const changeExpression = (root: string) => {
    setFailureShown(false);
    onExpressionChange?.(root.trim().toLowerCase());
  };

  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component="QRConnect"
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, width: '100%' }}
    >
      <Box
        role="button"
        tabIndex={0}
        data-gui-node-id={`${nodeId}.qr`}
        aria-label={executes ? `Connect to ${expression}` : expanded ? 'Shrink .me QR' : 'Expand .me QR to scan'}
        onClick={activate}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        }}
        // A mouse click must not leave a rectangular focus box around the bubble and its label; keyboard focus keeps a ring.
        sx={{ cursor: 'pointer', display: 'inline-flex', '&:focus': { outline: 'none' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4, borderRadius: 2 } }}
      >
        <QRme
          value={qrValue}
          username={username || undefined}
          diameter={expanded ? QR_DIAMETER_EXPANDED : QR_DIAMETER_DEFAULT}
          hoverFlip={false}
          clickFlip={false}
          cursor="pointer"
          status={status}
          statusLabel={statusLabel}
          perimeterLabel={perimeterLabel ?? expression}
          perimeterRootLabel={expression}
          perimeterHandleHref={perimeterHandleHref}
          editableRoot={editable}
          editableRootValue={expression}
          onEditableRootChange={onExpressionChange}
          data-gui-node-id={`${nodeId}.qr.code`}
          style={{ transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </Box>

      {showFailure && (
        // One sentence and three ways forward. The layers, the trace and the way to start the environment are behind "Diagnosis".
        <ConnectFailure
          expression={expression}
          layers={remoteRoot ? null : (probedLayers ?? door.layers ?? null)}
          trace={connectTrace.entries().filter((entry) => entry.expression === expression)}
          location={location}
          onConnectPublic={() => changeExpression('cleaker.me')}
          onTryNamespace={changeExpression}
          onDismiss={() => setFailureShown(false)}
          data-gui-node-id={`${nodeId}.connect-failure`}
        />
      )}
    </Box>
  );
}
