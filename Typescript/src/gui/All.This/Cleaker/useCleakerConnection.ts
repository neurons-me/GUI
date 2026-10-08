// The process of connecting, as one hook of the Cleaker flow (CleakerIdentityCard is the only caller): what the QR
// shows, what clicking it does, and what the person is offered when it cannot be reached. There is no second
// component for it: the QR is drawn by QRme, the card is the flow.
//
//   idle / off (grey) --click--> checking (loader) --> connected  (ink)
//                                                  \-> failed     (cross) --> "Unable to connect" + three ways forward
//
// Two doors, decided by the expression:
//   * this page's own root (or a loopback / local.* alias, or the root its monad confirmed): the page's own gateway
//     answers, and only while its door is up. The result is re-verified into the shared context
//     (`sharedRootStatus`, `onLocalResolved`).
//   * any other host: the browser's own runtime asks THAT host directly, `wss://<root>/nrp`, whether or not this
//     page's door is up (react/session/remoteRoot.ts). Nothing is signed or written here, and the shared context is
//     not moved to it.
// Every step is recorded in connectTrace. The channel hook can be replaced through `ConnectionSeams` so a story or a
// test can show every state without a network.
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBeatle } from '@/gui/All.This/NRP/Beatle/useBeatle';
import { makeDefaultResolvers } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import type { ResolutionState } from '@/gui/All.This/NRP/Beatle/Beatle.types';
import { remoteRootFor } from '@/react/session/remoteRoot';
import { connectTrace, layerEntries, doorIsUp } from '@/react/session/connectTrace';
import type { DoorLayers } from '@/react/session/doorLayers';
import type { CleakerRootStatus } from '@/react/session/verifiedCleakerRoot';

export type ConnectionStatus = 'idle' | 'checking' | 'confirmed' | 'error' | 'off';

/** What is known about this page's own door, and how to read it again. */
export type CleakerDoor = {
  /** Nothing answers behind this page. */
  off: boolean;
  /** Still being read for the first time. */
  checking: boolean;
  layers?: DoorLayers | null;
  /** Reads the door now (clicking the QR runs it). */
  probe?: () => Promise<DoorLayers>;
};

/**
 * What a story or a test may replace so every state can be shown without a network. Production passes nothing:
 * the channel is Beatle's and the door is read with the page's own fetch.
 */
export type ConnectionSeams = {
  /** The channel hook (same signature as useBeatle, same identity for the life of the mount). */
  useChannel?: typeof useBeatle;
  /** The fetch the door's layers are read with. */
  fetchImpl?: typeof fetch;
};

export const ConnectionSeamsContext = React.createContext<ConnectionSeams>({});

export type CleakerConnectionInput = {
  /** The root being looked at and executed. */
  expression: string;
  onExpressionChange?: (root: string) => void;
  /** The root this page itself is served as (a root equal to it is never "another host"). */
  localRoot?: string | null;
  door: CleakerDoor;
  /** The shared context's own verification of the local root (the sidebar, /netget); only the local door waits on it. */
  sharedRootStatus: CleakerRootStatus;
  /** A LOCAL channel resolved this namespace (the page may re-verify its shared context onto it). */
  onLocalResolved?: (namespace: string) => void;
  /** What the channel opens when it differs from what is shown (e.g. the whole identity once signed in). */
  channelExpression?: string;
  /** False while nothing should connect (registering, recovering, no secure context). */
  channelEnabled: boolean;
  /** False once a session is open: the failure card is not offered then. */
  failureEnabled: boolean;
};

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

export function useCleakerConnection({
  expression,
  onExpressionChange,
  localRoot = null,
  door,
  sharedRootStatus,
  onLocalResolved,
  channelExpression,
  channelEnabled,
  failureEnabled,
}: CleakerConnectionInput) {
  const seams = React.useContext(ConnectionSeamsContext);
  const useChannel = seams.useChannel ?? useBeatle;

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
  const ready = channelEnabled && (!!remoteRoot || (!door.off && !door.checking));
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
  const status: ConnectionStatus =
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

  return {
    status,
    statusLabel,
    remoteRoot,
    /** The "Unable to connect" card is to be shown. */
    failureShown: failureShown && failureEnabled,
    /** Clicking the QR runs the expression (rather than toggling its size). */
    executes,
    expanded,
    activate,
    changeExpression,
    dismissFailure: () => setFailureShown(false),
    /** The layers read when the QR was clicked, else what the page already knew. */
    layers: remoteRoot ? null : (probedLayers ?? door.layers ?? null),
  };
}
