import type { NRPExpression, NRPNode } from './NRPExpression';

/**
 * NRP disclosure levels (mirrors monad pathResolver/disclosure.ts contract).
 *   public    — value is readable by anyone
 *   opened    — secret scope, caller presented valid key material
 *   closed    — namespace exists but this caller has no access. Also covers
 *               "stealth" (namespace that would not reveal its own existence,
 *               A0/A2 axioms) — the wire never distinguishes the two, so the
 *               UI must not either.
 *   contested — Total Monad Synthesis found multiple conflicting monads;
 *               channel is open but resolution authority is ambiguous
 */
export type NRPDisclosure = 'public' | 'opened' | 'closed' | 'contested';

/** Typed payload from the server's 'resolved' message */
export type ResolvedPayload = {
  endpoints: string[];
  audience?: string[];
  capabilities?: string[];
  /**
   * Projection/overlay surface the channel is overlaid on (from @ operator).
   * This is distinct from an NRP [monad] selector.
   */
  surface?: string;
  disclosure: NRPDisclosure;
};

export type ResolutionState =
  | 'idle'
  | 'parsing'
  | 'connecting'
  | 'resolving'
  | 'connected'
  | 'streaming'
  | 'error'
  /**
   * The expression parsed fine, but a namespace leaf doesn't have real FQDN
   * shape (2+ DNS-label-shaped segments — see cleaker's isValidDomainShape).
   * Distinct from 'error': this isn't a connection failure that a retry or a
   * live server could fix, it's a structural "this will never resolve
   * through NRP" answer. The namespace can still exist as a claim/branch in
   * `.me` — it just never derives, so it never joins NRP resolution.
   */
  | 'invalid'
  | 'disconnected';

export type NamespaceChannel = {
  expression: NRPExpression | null;
  resolved: string[];
  state: ResolutionState;
  channelId?: string;
  audience?: string[];
  /** Overlay/projection surface, not the NRP technical monad selector. */
  surface?: string;
  capabilities?: string[];
  /** Disclosure level reported by the NRP server for this channel */
  disclosure?: NRPDisclosure;
  error?: string;
};

// ── Discriminated union wire messages ──────────────────────────────────────

type ClientContext = {
  /** Current browser/projection surface, not the NRP [monad] selector. */
  surface?: string;
  userAgent?: string;
  gui?: string;
};

/** Client → server: open a channel */
export type MsgNrpOpen = {
  type: 'nrp.open';
  expression: string;
  canonical: string;
  ast: NRPNode;
  client: ClientContext;
  timestamp: number;
};

/** Server → client: channel confirmed */
export type MsgResolved = {
  type: 'resolved';
  channelId: string;
  payload: ResolvedPayload;
  timestamp: number;
};

/** Bidirectional: application data on open channel */
export type MsgData = {
  type: 'data';
  channelId?: string;
  payload: unknown;
  timestamp: number;
};

/** Server → client: live update stream started */
export type MsgStream = {
  type: 'stream';
  channelId?: string;
  payload?: unknown;
  timestamp: number;
};

/**
 * Client → server: request the current value at a semantic path, on an
 * already-open channel (after 'nrp.open'/'resolved'). Server replies with a
 * MsgData whose payload is { path, value, disclosure: NRPDisclosure }.
 */
export type MsgRead = {
  type: 'read';
  channelId?: string;
  namespace: string;
  path: string;
  timestamp: number;
};

/**
 * Client → server: subscribe to live updates for a semantic path. Server
 * replies once with a MsgData (current value), then a MsgStream — same
 * payload shape as MsgRead's reply — every time that path (or an
 * ancestor/descendant of it) changes, until 'unsubscribe' or disconnect.
 */
export type MsgSubscribe = {
  type: 'subscribe';
  channelId?: string;
  namespace: string;
  path: string;
  timestamp: number;
};

/** Client → server: stop receiving MsgStream updates for a subscribed path */
export type MsgUnsubscribe = {
  type: 'unsubscribe';
  channelId?: string;
  namespace: string;
  path: string;
  timestamp: number;
};

/** Server → client: resolution or channel error */
export type MsgError = {
  type: 'error';
  channelId?: string;
  payload: string;
  /**
   * Present only for a small set of errors the client needs to react to
   * differently than a generic connection failure — currently just the
   * domain-shape gate (see ResolutionState's 'invalid' doc comment). Server
   * is the authority: the client already gates this itself before opening a
   * channel, but if that check is ever bypassed or stale, this code is what
   * lets the client still land on 'invalid' instead of 'error'.
   */
  code?: 'invalid_namespace_shape';
  timestamp: number;
};

export type MsgPing = { type: 'ping'; timestamp: number };
export type MsgPong = { type: 'pong'; timestamp: number };

export type BeatleMessage =
  | MsgNrpOpen
  | MsgResolved
  | MsgData
  | MsgStream
  | MsgRead
  | MsgSubscribe
  | MsgUnsubscribe
  | MsgError
  | MsgPing
  | MsgPong;

// ── NRP resolver endpoints (the "via" dropdown) ────────────────────────────

export type NRPResolver = {
  /** Display label — the namespace identity of the resolver, e.g. "mymac.local" or "cleaker.me" */
  label: string;
  /** WebSocket URL for nrp.open */
  ws: string;
  kind: 'local' | 'public';
};

/**
 * Build the default resolver list.
 * The local entry uses the actual browser hostname so the user sees
 * their real machine name rather than a generic alias.
 *
 * Always wss:// — never a plain ws:// fallback. The NRP contract this
 * session settled on is "me:// only opens over secure transport, or it
 * doesn't open" (matching why the page itself now redirects http to https
 * server-side — see setNginxConfigRoutes.ts's forceHttpsRedirect). Guessing
 * ws:// for anything that "looks local" was the actual bug: a page loaded
 * over https can't open a plain ws:// socket at all (mixed content), so
 * that guess would silently fail exactly when it mattered, and there was
 * never a case where downgrading to ws:// was the CORRECT fallback rather
 * than a failure the user should see.
 */
export function makeDefaultResolvers(localHostname?: string): NRPResolver[] {
  const host = localHostname ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  return [
    { label: host,        ws: `wss://${host}/nrp`,    kind: 'local'  },
    { label: 'cleaker.me', ws: 'wss://cleaker.me/nrp', kind: 'public' },
  ];
}

// ── Component props ────────────────────────────────────────────────────────

export type BeatleProps = {
  defaultExpression?: string;
  /** Override the list of NRP resolver endpoints shown in the dropdown */
  resolvers?: NRPResolver[];
  /** Pre-select a resolver by ws URL */
  nrpEndpoint?: string;
  /**
   * Show the resolver combobox (which server the channel connects to).
   * Default true — Beatle's own Storybook/standalone usage still wants it.
   * A host that already shows this elsewhere (e.g. CleakerLanding's own
   * "here" badge, which answers exactly the same question — which server
   * you're actually on) should pass false: showing the same thing twice,
   * under two different labels ("here" vs. a bare "namespace" placeholder
   * here), reads as two different concepts when it's one. When false, the
   * channel still connects — to `nrpEndpoint` if given, else the first
   * (local) entry from the resolver list — just without a second control
   * for picking it.
   */
  showResolver?: boolean;
  onConnect?: (channel: NamespaceChannel) => void;
  onMessage?: (msg: BeatleMessage) => void;
  onDisconnect?: () => void;
  /**
   * Fired on every channel.state transition (idle/parsing/connecting/
   * resolving/connected/streaming/error/invalid/disconnected) -- not just
   * the connected/disconnected edges onConnect/onDisconnect already cover.
   * For a host that wants to mirror Beatle's own connection state
   * elsewhere (e.g. recoloring a QR code by it) without opening a second,
   * independent channel to get it.
   */
  onStateChange?: (state: ResolutionState) => void;
  variant?: 'bar' | 'bubble';
  sx?: any;
};
