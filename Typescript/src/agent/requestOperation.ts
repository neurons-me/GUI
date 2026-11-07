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
  type AgentRequest,
  type AgentResult,
  type ReadOperation,
} from './protocol';

export type AgentGrant = Extract<AgentResult, { ok: true }>;

export class AgentRequestError extends Error {
  constructor(public readonly reason: 'popup-blocked' | 'closed' | 'timeout' | 'rejected' | 'invalid' | 'error') {
    super(`identity agent: ${reason}`);
  }
}

export function requestOperation(input: {
  /** The agent's page, e.g. `https://id.example/agent.html`. Its origin is the only one answers are taken from. */
  agentUrl: string;
  operation: ReadOperation;
  timeoutMs?: number;
}): Promise<AgentGrant> {
  const problem = validateOperation(input.operation);
  if (problem) return Promise.reject(new AgentRequestError('invalid'));
  const agentOrigin = new URL(input.agentUrl).origin;
  const id = newRequestId();
  // Must be called from a user gesture (a click), or the browser blocks the window.
  const win = window.open(input.agentUrl, `me-agent-${id}`, 'popup,width=460,height=680');
  if (!win) return Promise.reject(new AgentRequestError('popup-blocked'));

  return new Promise<AgentGrant>((resolve, reject) => {
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
        const request: AgentRequest = { protocol: AGENT_PROTOCOL, type: 'agent.request', id, operation: input.operation };
        win.postMessage(request, agentOrigin);
        return;
      }
      if (msg.type === 'agent.result' && isRequestId(msg.id) && msg.id === id) {
        if (msg.ok === true && typeof msg.proof === 'string' && msg.identity && typeof msg.identity === 'object') {
          finish(() => resolve(msg as unknown as AgentGrant));
        } else {
          const reason = msg.reason === 'rejected' || msg.reason === 'invalid' ? msg.reason : 'error';
          finish(() => reject(new AgentRequestError(reason)));
        }
      }
    };
    window.addEventListener('message', onMessage);
    const closedPoll = setInterval(() => { if (win.closed) finish(() => reject(new AgentRequestError('closed'))); }, 400);
    const timer = setTimeout(() => finish(() => { try { win.close(); } catch { /* gone */ } reject(new AgentRequestError('timeout')); }), input.timeoutMs ?? 5 * 60_000);
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
