// Host side of the identity agent (Identity-Custody-Contract.md, first cut). PROTOTYPE.
//
// A page asks the agent for ONE operation. The agent opens as its own visible window (its own origin, its address in
// the window's bar), the person unlocks and approves there, and the page receives only the proof for that operation
// and the approver's public identity -- never a secret, a key or a session. The page then sends the request with that
// proof itself; the resource server verifies it.
//
// Messages are accepted only from the window this call opened AND from the agent's origin; the request is sent with
// that exact origin as targetOrigin. Closing the window, a timeout or a rejection ends the call: nothing continues
// unsigned.
import {
  AGENT_PROTOCOL,
  isRequestId,
  newRequestId,
  validateOperation,
  canonicalBody,
  type AgentOperation,
  type AgentRequest,
  type AgentResult,
  type CallOperation,
  type KeyListing,
  type KeysListOperation,
  type ReadOperation,
} from './protocol';

/** A signed answer (read / call): a proof for exactly the approved request. */
export type AgentGrant = Extract<AgentResult, { ok: true; proof: string }>;
/** A keys.list answer: names/paths/status only, and the approver's public identity. Nothing signed. */
export type KeysGrant = { keys: KeyListing; identity: { namespace: string; identityHash: string; keyId: string } };

export class AgentRequestError extends Error {
  constructor(public readonly reason: 'popup-blocked' | 'closed' | 'timeout' | 'rejected' | 'invalid' | 'error') {
    super(`identity agent: ${reason}`);
  }
}

export function requestOperation(input: {
  /** The agent's page, e.g. `https://cleaker.me/cleaker.html`. Its origin is the only one answers are taken from. */
  agentUrl: string;
  operation: ReadOperation | CallOperation;
  timeoutMs?: number;
}): Promise<AgentGrant> {
  if ((input.operation as { action?: unknown })?.action === 'keys.list') return Promise.reject(new AgentRequestError('invalid'));
  return openRequest(input.agentUrl, input.operation, input.timeoutMs, (msg) =>
    (typeof msg.proof === 'string' && msg.identity && typeof msg.identity === 'object' ? (msg as unknown as AgentGrant) : null));
}

const KEY_PATH_RE = /^keys(?:\.[A-Za-z0-9_-]{1,64}){1,12}$/;
const MAX_ENTRIES = 500;

/** The public identity of an answer, exactly three strings, or null. */
function publicIdentity(raw: unknown): KeysGrant['identity'] | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (Object.keys(r).sort().join(',') !== 'identityHash,keyId,namespace') return null;
  if (typeof r.namespace !== 'string' || typeof r.identityHash !== 'string' || typeof r.keyId !== 'string') return null;
  return { namespace: r.namespace, identityHash: r.identityHash, keyId: r.keyId };
}

/**
 * Checks a keys.list answer strictly and REBUILDS it from its allowed parts: {resource, entries[{path, status}]} and
 * the public identity. Any other field anywhere -- a value, a secret, a field list -- makes the whole answer invalid.
 */
export function parseKeysGrant(msg: Record<string, unknown>): KeysGrant | null {
  if (Object.keys(msg).sort().join(',') !== 'id,identity,keys,ok,protocol,type') return null;
  const identity = publicIdentity(msg.identity);
  const k = msg.keys as Record<string, unknown> | null;
  if (!identity || !k || typeof k !== 'object' || Array.isArray(k)) return null;
  if (Object.keys(k).sort().join(',') !== 'entries,resource' || typeof k.resource !== 'string' || !Array.isArray(k.entries)) return null;
  if (k.entries.length > MAX_ENTRIES) return null;
  const entries: KeyListing['entries'] = [];
  for (const e of k.entries) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
    const r = e as Record<string, unknown>;
    if (Object.keys(r).sort().join(',') !== 'path,status' || typeof r.path !== 'string' || !KEY_PATH_RE.test(r.path) || r.status !== 'set') return null;
    entries.push({ path: r.path, status: 'set' });
  }
  return { keys: { resource: k.resource, entries }, identity };
}

/** Asks the agent for the names of your keys. The person approves in the agent window; values never leave it. */
export function requestKeysList(input: { agentUrl: string; operation: KeysListOperation; timeoutMs?: number }): Promise<KeysGrant> {
  if (input.operation?.action !== 'keys.list') return Promise.reject(new AgentRequestError('invalid'));
  return openRequest(input.agentUrl, input.operation, input.timeoutMs, (msg) => parseKeysGrant(msg));
}

function openRequest<T>(agentUrl: string, operation: AgentOperation, timeoutMs: number | undefined, accept: (msg: Record<string, unknown>) => T | null): Promise<T> {
  const problem = validateOperation(operation);
  if (problem) return Promise.reject(new AgentRequestError('invalid'));
  const agentOrigin = new URL(agentUrl).origin;
  const id = newRequestId();
  // Must be called from a user gesture (a click), or the browser blocks the window.
  const win = window.open(agentUrl, `me-agent-${id}`, 'popup,width=460,height=680');
  if (!win) return Promise.reject(new AgentRequestError('popup-blocked'));

  return new Promise<T>((resolve, reject) => {
    let sent = false;
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      clearInterval(closedPoll);
      clearTimeout(timer);
      fn();
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== win || event.origin !== agentOrigin) return;
      const msg = event.data as Record<string, unknown> | null;
      if (!msg || msg.protocol !== AGENT_PROTOCOL) return;
      if (msg.type === 'agent.ready' && !sent) {
        sent = true;
        const request: AgentRequest = { protocol: AGENT_PROTOCOL, type: 'agent.request', id, operation };
        win.postMessage(request, agentOrigin);
        return;
      }
      if (msg.type === 'agent.result' && isRequestId(msg.id) && msg.id === id) {
        if (msg.ok === true) {
          const value = accept(msg);
          // A malformed success is not a success: same as before, an 'error'.
          finish(() => (value ? resolve(value) : reject(new AgentRequestError('error'))));
        } else {
          const reason = msg.reason === 'rejected' || msg.reason === 'invalid' ? msg.reason : 'error';
          finish(() => reject(new AgentRequestError(reason)));
        }
      }
    };
    window.addEventListener('message', onMessage);
    const closedPoll = setInterval(() => { if (win.closed) finish(() => reject(new AgentRequestError('closed'))); }, 400);
    const timer = setTimeout(() => finish(() => { try { win.close(); } catch { /* gone */ } reject(new AgentRequestError('timeout')); }), timeoutMs ?? 5 * 60_000);
  });
}

/** Sends the approved request with its proof. The page cannot change it: the proof is bound to exactly this. */
export function fetchWithGrant(operation: ReadOperation, grant: AgentGrant): Promise<Response> {
  const pairs: [string, string][] = JSON.parse(operation.query);
  const qs = pairs.length ? `?${new URLSearchParams(pairs).toString()}` : '';
  return fetch(`${operation.audience}${operation.path}${qs}`, {
    method: operation.method,
    headers: { 'X-Me-Proof': grant.proof },
    credentials: 'omit',
  });
}

/**
 * Sends an approved WRITE with its proof: POST to exactly the approved audience and path, with exactly the canonical
 * body the proof's bodyHash covers. The authority verifies the proof and authorizes on its own state.
 */
export function fetchCallWithGrant(operation: CallOperation, grant: AgentGrant): Promise<Response> {
  return fetch(`${operation.audience}${operation.path}`, {
    method: 'POST',
    headers: { 'X-Me-Proof': grant.proof, 'Content-Type': 'application/json' },
    body: canonicalBody(operation.body),
    credentials: 'omit',
  });
}
