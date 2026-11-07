// A host page for the identity agent prototype (tests/integration/agent.browser.test.mjs). It asks for ONE read and
// shows what came back. It never sees a secret, a key or a session: only the proof for the approved request.
//
//   /agentHost.html?agent=<agent page URL>&resource=<resource origin>&ns=<namespace>&path=/domains&ttl=60000
import { requestOperation, fetchWithGrant, AgentRequestError } from '@/agent/requestOperation';
import type { ReadOperation } from '@/agent/protocol';

const params = new URLSearchParams(window.location.search);
const operation: ReadOperation = {
  action: 'read',
  namespace: params.get('ns') || 'test.local',
  audience: params.get('resource') || '',
  method: 'GET',
  path: params.get('path') || '/domains',
  query: params.get('query') || '[]',
  ttlMs: Number(params.get('ttl') || 60_000),
};
const agentUrl = params.get('agent') || '';

const button = document.querySelector('[data-host="ask"]') as HTMLButtonElement;
const status = document.querySelector('[data-host="status"]') as HTMLElement;
const result = document.querySelector('[data-host="result"]') as HTMLElement;
const who = document.querySelector('[data-host="identity"]') as HTMLElement;

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
