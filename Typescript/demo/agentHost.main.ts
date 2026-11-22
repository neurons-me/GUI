// A host page for the identity agent prototype (tests/integration/agent*.browser.test.mjs). It never sees a secret, a
// key or a session: only the proof for the approved request.
//
// Read (default):
//   /agentHost.html?agent=<agent page URL>&resource=<resource origin>&ns=<namespace>&path=/domains&ttl=60000
// netget gateway bootstrap (an admitted write; tests/integration/agentBootstrap.browser.test.mjs):
//   /agentHost.html?mode=bootstrap&agent=<agent URL>&resource=<authority origin>&ns=<namespace>&gateway=<id>&code=<install code>
//     [&label=<the app's own text: ignored by the agent>] [&kind=<another kind: refused>] [&badHash=1]
//     [&alter=<another gateway id>&alterMs=2500  -- TEST ONLY: after the agent shows the request, send it again
//      with the same id and a different gateway, as a page trying to swap what was approved]
// netget gateway bootstrap against the REAL netget (Agent-Bootstrap-Server-Path.md; tests/integration/
// agentBootstrapReal.browser.test.mjs):
//   /agentHost.html?mode=netget&agent=<agent URL>&netget=<netget backend origin>&ns=<root namespace>&code=<install code>
//     [&ttl=<approval lifetime ms>] [&delayMs=<wait before sending>] [&tamper=1 -- TEST ONLY: corrupt the signature]
//     [&replay=1 -- TEST ONLY: send the same claim a second time] [&alter=1&alterMs=2500 -- TEST ONLY: swap the request
//      for one with another challenge after the agent shows it]
//   The page sends netget only {setupToken, state, proof}; netget rebuilds the body from its own session.
// keys.list (the NAMES of your keys; tests/integration/agent.browser.test.mjs):
//   /agentHost.html?mode=keys&agent=<agent URL>&ns=<namespace root>
//     [&alter=<another namespace>&alterMs=2500 -- TEST ONLY: swap the request after the agent shows it]
import { requestOperation, requestKeysList, parseKeysGrant, fetchWithGrant, fetchCallWithGrant, AgentRequestError, type AgentGrant, type KeysGrant } from '@/agent/requestOperation';
import { AGENT_PROTOCOL, canonicalBody, newRequestId, sha256Hex, type AgentRequest, type CallOperation, type KeysListOperation, type ReadOperation } from '@/agent/protocol';

const params = new URLSearchParams(window.location.search);
const agentUrl = params.get('agent') || '';
const button = document.querySelector('[data-host="ask"]') as HTMLButtonElement;
const status = document.querySelector('[data-host="status"]') as HTMLElement;
const result = document.querySelector('[data-host="result"]') as HTMLElement;
const who = document.querySelector('[data-host="identity"]') as HTMLElement;
const proofOut = document.querySelector('[data-host="proof-bytes"]') as HTMLElement;

if (params.get('mode') === 'keys') {
  button.textContent = 'Show my key names';
  button.addEventListener('click', () => { void listKeys(); });
} else if (params.get('mode') === 'netget') {
  button.textContent = 'Claim this gateway with my .me';
  button.addEventListener('click', () => { void bootstrapWithNetget(); });
} else if (params.get('mode') === 'bootstrap') {
  button.textContent = 'Claim this gateway with my .me';
  button.addEventListener('click', () => { void bootstrap(); });
} else {
  const operation: ReadOperation = {
    action: 'read',
    namespace: params.get('ns') || 'test.local',
    audience: params.get('resource') || '',
    method: 'GET',
    path: params.get('path') || '/domains',
    query: params.get('query') || '[]',
    ttlMs: Number(params.get('ttl') || 60_000),
  };
  button.addEventListener('click', async () => {
    status.textContent = 'Waiting for your approval in the .me window…';
    result.textContent = '';
    who.textContent = '';
    try {
      const grant = await requestOperation({ agentUrl, operation });
      who.textContent = grant.identity.namespace;
      status.textContent = 'Approved. Reading…';
      const res = await fetchWithGrant(operation, grant);
      const body = await res.json().catch(() => null);
      status.textContent = res.ok ? 'ok' : `refused: ${res.status} ${body?.error ?? ''}`.trim();
      result.textContent = JSON.stringify(body);
    } catch (error) {
      status.textContent = error instanceof AgentRequestError ? `agent: ${error.reason}` : `error: ${String(error)}`;
    }
  });
}

/** netget's step: the install code unlocks a setup session and netget issues the challenge to sign (here: the mock). */
async function claimChallenge(resource: string, gatewayId: string, code: string): Promise<string> {
  const res = await fetch(`${resource}/setup/challenge`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gatewayId, code }), credentials: 'omit',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.challenge !== 'string') throw new Error(`challenge refused: ${res.status} ${body?.error ?? ''}`);
  return body.challenge;
}

async function bootstrapOperation(resource: string, gatewayId: string, code: string): Promise<CallOperation> {
  const challenge = await claimChallenge(resource, gatewayId, code);
  const body = { gatewayId, challenge };
  const op: CallOperation = {
    action: 'call',
    kind: params.get('kind') || 'netget.gateway.bootstrap',
    namespace: params.get('ns') || 'test.local',
    audience: resource,
    method: 'POST',
    path: `/api/v1/gateway/${encodeURIComponent(gatewayId)}/bootstrap`,
    body,
    bodyHash: params.get('badHash') ? 'f'.repeat(64) : await sha256Hex(canonicalBody(body)),
    ttlMs: Number(params.get('ttl') || 120_000),
  };
  const label = params.get('label');
  if (label) op.appLabel = label;
  return op;
}

/** TEST ONLY: requestOperation, but the page sends a second, altered request with the same id after `ms`. */
function requestWithSwap<T extends CallOperation | KeysListOperation>(first: T, second: T, ms: number): Promise<any> {
  const agentOrigin = new URL(agentUrl).origin;
  const id = newRequestId();
  const win = window.open(agentUrl, `me-agent-${id}`, 'popup,width=460,height=680');
  if (!win) return Promise.reject(new AgentRequestError('popup-blocked'));
  const send = (operation: T) => win.postMessage({ protocol: AGENT_PROTOCOL, type: 'agent.request', id, operation } satisfies AgentRequest, agentOrigin);
  return new Promise((resolve, reject) => {
    let sent = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== win || event.origin !== agentOrigin) return;
      const msg = event.data as any;
      if (msg?.protocol !== AGENT_PROTOCOL) return;
      if (msg.type === 'agent.ready' && !sent) {
        sent = true;
        send(first);
        setTimeout(() => send(second), ms);
        return;
      }
      if (msg.type === 'agent.result' && msg.id === id) {
        window.removeEventListener('message', onMessage);
        if (msg.ok) resolve(msg); else reject(new AgentRequestError(msg.reason === 'rejected' || msg.reason === 'invalid' ? msg.reason : 'error'));
      }
    };
    window.addEventListener('message', onMessage);
  });
}

/** The signed bytes inside a proof (public: what was approved). */
function proofBytes(grant: AgentGrant): string {
  try {
    const raw = atob(grant.proof.replace(/-/g, '+').replace(/_/g, '/'));
    return String((JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)))) as { bytes?: unknown }).bytes ?? '');
  } catch {
    return '';
  }
}

async function bootstrap() {
  const resource = params.get('resource') || '';
  const gatewayId = params.get('gateway') || '';
  const code = params.get('code') || '';
  const alter = params.get('alter');
  status.textContent = 'Asking netget for a challenge…';
  result.textContent = '';
  who.textContent = '';
  proofOut.textContent = '';
  try {
    const first = await bootstrapOperation(resource, gatewayId, code);
    let operation = first;
    let grant: AgentGrant;
    status.textContent = 'Waiting for your approval in the .me window…';
    if (alter) {
      const second = await bootstrapOperation(resource, alter, code);
      grant = await requestWithSwap(first, second, Number(params.get('alterMs') || 2500));
      // Send what the proof is for: the proof's own path names the gateway that was finally approved.
      operation = proofBytes(grant).includes(`/gateway/${encodeURIComponent(alter)}/`) ? second : first;
    } else {
      grant = await requestOperation({ agentUrl, operation: first });
    }
    who.textContent = grant.identity.namespace;
    proofOut.textContent = proofBytes(grant);
    status.textContent = 'Approved. Sending to the authority…';
    const res = await fetchCallWithGrant(operation, grant);
    const body = await res.json().catch(() => null);
    status.textContent = res.ok ? 'ok' : `refused: ${res.status} ${body?.error ?? ''}`.trim();
    result.textContent = JSON.stringify(body);
  } catch (error) {
    status.textContent = error instanceof AgentRequestError ? `agent: ${error.reason}` : `error: ${String(error)}`;
  }
}

// ── the real netget (mode=netget) ─────────────────────────────────────────────────────────────────────────────────

async function postJson(url: string, body: unknown): Promise<{ status: number; body: any }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' });
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** The proof as netget takes it: exactly {bytes, signature} (the grant's X-Me-Proof value, decoded). */
function proofObject(grant: AgentGrant): { bytes: string; signature: string } {
  const raw = atob(grant.proof.replace(/-/g, '+').replace(/_/g, '/'));
  const parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)))) as { bytes?: unknown; signature?: unknown };
  return { bytes: String(parsed.bytes ?? ''), signature: String(parsed.signature ?? '') };
}

async function bootstrapWithNetget() {
  const netget = params.get('netget') || '';
  const code = params.get('code') || '';
  const replay = document.querySelector('[data-host="replay"]') as HTMLElement | null;
  status.textContent = 'Unlocking the setup session…';
  result.textContent = '';
  who.textContent = '';
  proofOut.textContent = '';
  try {
    // 1. The install code unlocks netget's setup session (unchanged route).
    const unlocked = await postJson(`${netget}/setup/verify-code`, { code });
    if (unlocked.status !== 200 || typeof unlocked.body?.setupToken !== 'string') throw new Error(`setup code refused: ${unlocked.body?.message ?? unlocked.status}`);
    const setupToken = unlocked.body.setupToken as string;
    // 2. netget issues the challenge, and names the audience (its own monad) and path -- netget's, not this page's.
    const issue = async () => {
      const r = await postJson(`${netget}/setup/agent/challenge`, { setupToken, returnOrigin: window.location.origin, returnPath: '/' });
      if (r.status !== 200) throw new Error(`challenge refused: ${r.body?.message ?? r.status}`);
      return r.body as { challenge: string; gatewayId: string; state: string; audience: string; path: string };
    };
    const issued = await issue();
    const operationFor = async (c: typeof issued): Promise<CallOperation> => {
      const body = { gatewayId: c.gatewayId, challenge: c.challenge };
      return {
        action: 'call', kind: 'netget.gateway.bootstrap', namespace: params.get('ns') || 'test.local', audience: c.audience,
        method: 'POST', path: c.path, body, bodyHash: await sha256Hex(canonicalBody(body)), ttlMs: Number(params.get('ttl') || 120_000),
        ...(params.get('label') ? { appLabel: params.get('label') as string } : {}),
      };
    };
    // 3. The person approves in the agent.
    status.textContent = 'Waiting for your approval in the .me window…';
    let grant: AgentGrant;
    let state = issued.state;
    if (params.get('alter')) {
      // TEST ONLY: a second challenge (netget keeps one per session: the newer one replaces it), swapped in after the
      // agent has shown the first request.
      const second = await issue();
      state = second.state;
      grant = await requestWithSwap(await operationFor(issued), await operationFor(second), Number(params.get('alterMs') || 2500));
    } else {
      grant = await requestOperation({ agentUrl, operation: await operationFor(issued) });
    }
    who.textContent = grant.identity.namespace;
    const proof = proofObject(grant);
    proofOut.textContent = proof.bytes;
    if (params.get('tamper')) proof.signature = (proof.signature[0] === 'A' ? 'B' : 'A') + proof.signature.slice(1);
    const delay = Number(params.get('delayMs') || 0);
    if (delay > 0) { status.textContent = 'Approved. Waiting…'; await new Promise((r) => setTimeout(r, delay)); }
    // 4. Only {setupToken, state, proof} goes to netget; never a body.
    status.textContent = 'Approved. Sending to netget…';
    const claim = await postJson(`${netget}/setup/agent/claim`, { setupToken, state, proof });
    // An uncertain outcome (netget could not get a definitive answer from its monad) is not a refusal: say so, the
    // same approval may be sent again to settle it.
    const outcome = (r: { status: number; body: any }) => r.status === 200 && r.body?.ok ? 'ok'
      : r.body?.uncertain === true ? `uncertain: ${r.status} ${r.body?.error ?? ''} (send the same approval again)`.trim()
      : `refused: ${r.status} ${r.body?.error ?? ''}`.trim();
    status.textContent = outcome(claim);
    result.textContent = JSON.stringify(claim.body);
    if (params.get('replay') && replay) {
      const again = await postJson(`${netget}/setup/agent/claim`, { setupToken, state, proof });
      replay.textContent = outcome(again);
    }
  } catch (error) {
    status.textContent = error instanceof AgentRequestError ? `agent: ${error.reason}` : `error: ${String(error)}`;
  }
}

// ── keys.list (mode=keys) ──────────────────────────────────────────────────────────────────────────────────────────
async function listKeys() {
  button.disabled = true;
  status.textContent = 'waiting for the agent…';
  const operation: KeysListOperation = { action: 'keys.list', namespace: params.get('ns') || 'test.local' };
  try {
    let grant: KeysGrant | null;
    const alter = params.get('alter');
    if (alter) {
      const raw = await requestWithSwap(operation, { action: 'keys.list', namespace: alter }, Number(params.get('alterMs') || 2500));
      grant = parseKeysGrant(raw);
      if (!grant) throw new AgentRequestError('error');
    } else {
      grant = await requestKeysList({ agentUrl, operation });
    }
    who.textContent = grant.identity.namespace;
    result.textContent = JSON.stringify(grant.keys);
    status.textContent = 'ok';
  } catch (e) {
    status.textContent = e instanceof AgentRequestError ? `refused: ${e.reason}` : `error: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    button.disabled = false;
  }
}
