// "Connect my .me" -- host side. PROTOTYPE.
//
// A site does not know whose .me is active in this browser: the browser keeps each origin's data apart. The identity
// agent's page (its own origin) knows. So the site asks it, in a visible window, for ONE v2 READ proof of
// `GET /api/v1/agent/open` with no query -- "which .me is yours". The person approves there; the site gets back only
// the public identity (namespace, identityHash, keyId) and that proof, never a key or a seed. It then opens the
// namespace on the person's monad with the proof (the monad's agentRoutes.ts: method, path, query, empty body,
// audience, requesting origin, expiry and a one-time nonce are all checked before anything is answered).
//
// The connection lives in memory only: nothing is written to storage. The proof is one-time; to connect again, ask
// again.
import { AgentRequestError, fetchWithGrant, requestOperation, type AgentGrant } from './requestOperation';
import type { ReadOperation } from './protocol';

export const AGENT_OPEN_PATH = '/api/v1/agent/open';

export type MeConnection = Readonly<{
  /** The .me this browser's agent holds, as the monad confirmed it (e.g. `ana.cleaker.me`). Public. */
  namespace: string;
  identityHash: string;
  keyId: string;
  /** Where the namespace was opened (the monad's address). */
  monad: string;
  openedAt: number | null;
}>;

export type ConnectStep = 'asking' | 'opening';

export class ConnectRefused extends Error {
  constructor(public readonly reason: string, public readonly status?: number) { super(`connect: ${reason}`); }
}

/** The read that "which .me is yours" is: exactly GET /api/v1/agent/open, no query, at the monad's audience. */
export function connectOperation(input: { root: string; audience: string; ttlMs?: number }): ReadOperation {
  return { action: 'read', namespace: input.root, audience: input.audience, method: 'GET', path: AGENT_OPEN_PATH, query: '[]', ttlMs: input.ttlMs ?? 60_000 };
}

/**
 * Asks the agent which .me is active, then opens it on the monad. Call it from a click (it opens a window).
 * `monad` is where the request is sent; it defaults to the audience (they differ when the monad is reached at an
 * internal address). Resolves only when the monad confirmed exactly the identity the agent answered with.
 */
export function connectMe(input: {
  agentUrl: string;
  root: string;
  audience: string;
  monad?: string;
  ttlMs?: number;
  onStep?: (step: ConnectStep) => void;
  /** Test hook: wait before sending the proof (to show expiry). */
  delayMs?: number;
}): Promise<MeConnection> {
  const operation = connectOperation(input);
  input.onStep?.('asking');
  const asked = requestOperation({ agentUrl: input.agentUrl, operation });   // synchronous window.open, inside the click
  return asked.then(async (grant: AgentGrant) => {
    input.onStep?.('opening');
    if (input.delayMs) await new Promise((r) => setTimeout(r, input.delayMs));
    const monad = input.monad ?? input.audience;
    const res = await fetchWithGrant({ ...operation, audience: monad }, grant).catch(() => { throw new ConnectRefused('unreachable'); });
    const body = await res.json().catch(() => null) as Record<string, any> | null;
    if (!res.ok) throw new ConnectRefused(String(body?.error ?? body?.target?.error ?? `HTTP_${res.status}`), res.status);
    // The monad's envelope may nest answer fields under `target` (envelope.ts); `namespace` may be {me: ...} there.
    const field = (k: string) => body?.[k] ?? body?.target?.[k];
    const nsField = field('namespace');
    const namespace = String((nsField && typeof nsField === 'object' ? nsField.me : nsField) ?? '');
    const identityHash = String(field('identityHash') ?? '');
    const verified = field('verified');
    const openedAt = field('openedAt');
    // The monad must have opened exactly the identity the agent answered with.
    if (verified !== true || !namespace || namespace !== grant.identity.namespace || identityHash !== grant.identity.identityHash) {
      throw new ConnectRefused('MISMATCH');
    }
    return Object.freeze({
      namespace, identityHash, keyId: grant.identity.keyId, monad,
      openedAt: typeof openedAt === 'number' ? openedAt : null,
    });
  }, (e: unknown) => {
    throw e instanceof AgentRequestError ? new ConnectRefused(e.reason) : e;
  });
}
