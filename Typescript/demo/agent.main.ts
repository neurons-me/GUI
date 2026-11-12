// The identity agent page (Identity-Custody-Contract.md, first cut). PROTOTYPE, served by the demo server for
// tests/integration/agent.browser.test.mjs -- not deployed anywhere.
//
// It runs in its OWN origin, as a visible window. Two things happen here (Agent-Protocol.md, first cut):
//   - opened directly with `?create=<resource origin>&ns=<namespace>`: the person creates a NEW identity; its agent
//     key is generated here and registered with the resource in one atomic operation (`agent-only` from the start);
//   - opened by a host page: it takes one request, from that window only, shows what the BROWSER says about who is
//     asking (MessageEvent.origin), lets the person pick one of the identities this agent holds and approve, and
//     answers with a v2 proof signed by that identity's agent key, to that exact origin and window.
// No secret is typed and no key leaves this page. No HTML, component or text from the host is rendered: everything
// shown is built from the validated operation with textContent.
import {
  AGENT_PROTOCOL,
  base64url,
  buildReadFields,
  describeOperation,
  isOrigin,
  newRequestId,
  parseRequest,
  type AgentRequest,
  type AgentResult,
} from '@/agent/protocol';
import { createIdentity, listIdentities, signV2, storeIdentity, type AgentIdentity } from '@/agent/agentKeys';

const root = document.getElementById('agent') as HTMLElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  return node;
}

function stop(message: string, marker: string) {
  root.replaceChildren(el('p', { 'data-agent': marker }, message));
}

// Never inside another page: an embedded approval could be covered, faked or clicked into.
if (window.top !== window.self) {
  stop('This page cannot be embedded. Open it in its own window.', 'framed');
  throw new Error('identity agent: refused to run embedded');
}

const params = new URLSearchParams(window.location.search);
const createAt = params.get('create');
const opener = window.opener as Window | null;
if (createAt) {
  renderCreate(createAt, params.get('ns') || '');
} else if (!opener) {
  stop('Nothing is asking for anything. A page opens this window when it needs your approval.', 'no-opener');
} else {
  let pending: { request: AgentRequest; origin: string } | null = null;
  let answered = false;

  const answer = (result: AgentResult) => {
    if (!pending || answered) return;
    answered = true;
    opener.postMessage(result, pending.origin);   // that exact origin, never '*'
    setTimeout(() => window.close(), 50);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== opener) return;          // only the window that opened this one
    if (pending) return;                          // one request per window
    const request = parseRequest(event.data);
    if (!request) return;
    pending = { request, origin: event.origin };  // the requesting origin, as the browser reports it
    render();
  });

  // Tells the opener this window is listening. It carries nothing; who is asking is learned from the request event.
  opener.postMessage({ protocol: AGENT_PROTOCOL, type: 'agent.ready' }, '*');
  root.replaceChildren(el('p', { 'data-agent': 'waiting' }, 'Waiting for the request…'));

  function render() {
    if (!pending) return;
    const { request, origin } = pending;
    const op = request.operation;
    const shown = describeOperation(op);

    const asker = el('p', { 'data-agent': 'origin', class: 'origin' }, origin);
    const what = el('dl');
    for (const [k, v] of [['Action', shown.action], ['Resource', shown.resource], ['As', `<you>.${op.namespace}`], ['Valid for', shown.expires]]) {
      what.append(el('dt', {}, k), el('dd', { 'data-agent': `field-${k.toLowerCase().replace(/\s+/g, '-')}` }, v));
    }

    const form = el('form', { 'data-agent': 'form', autocomplete: 'off' });
    const pick = el('select', { name: 'identity', 'aria-label': 'Identity', 'data-agent': 'identity' });
    const approve = el('button', { type: 'submit', 'data-agent': 'approve' }, 'Approve');
    const reject = el('button', { type: 'button', 'data-agent': 'reject' }, 'Reject');
    const status = el('p', { 'data-agent': 'status' });
    form.append(pick, el('div', { class: 'actions' }, ''), status);
    form.querySelector('.actions')!.append(reject, approve);
    let held: AgentIdentity[] = [];
    approve.disabled = true;
    listIdentities(op.namespace).then((ids) => {
      held = ids;
      for (const id of ids) pick.append(el('option', { value: id.identityHash }, `${id.identityHash.slice(0, 12)}…  (key ${id.keyId.slice(0, 8)})`));
      if (ids.length) approve.disabled = false;
      else status.textContent = `This agent holds no identity for ${op.namespace}.`;
    }, () => { status.textContent = 'This agent cannot read its identities.'; });

    reject.addEventListener('click', () => answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: request.id, ok: false, reason: 'rejected' }));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const chosen = held.find((i) => i.identityHash === pick.value);
      if (!chosen) { status.textContent = 'Choose an identity to approve with.'; return; }
      approve.disabled = true;
      reject.disabled = true;
      status.textContent = 'Signing…';
      try {
        const fields = buildReadFields({ operation: op, requestingOrigin: origin, identityHash: chosen.identityHash, keyId: chosen.keyId, nonce: newRequestId(), issuedAt: Date.now() });
        const proof = await signV2(chosen, fields);
        answer({
          protocol: AGENT_PROTOCOL,
          type: 'agent.result',
          id: request.id,
          ok: true,
          proof: base64url(JSON.stringify(proof)),
          identity: { namespace: chosen.namespace, identityHash: chosen.identityHash, keyId: chosen.keyId },
        });
      } catch {
        // No unsigned fallback: the host gets an error, and nothing is sent anywhere from here.
        answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: request.id, ok: false, reason: 'error' });
      }
    });

    root.replaceChildren(el('h1', {}, 'Approve a request'), el('p', { class: 'label' }, 'Asked by'), asker, what, form);
  }
}

// Creating a NEW identity, at the person's request, in this window. The resource origin comes from this window's own
// address (the person opened it), never from a message.
function renderCreate(resource: string, namespace: string) {
  if (!isOrigin(resource) || !namespace) { stop('This creation link is not valid.', 'create-invalid'); return; }
  const button = el('button', { type: 'button', 'data-agent': 'create' }, `Create a new identity in ${namespace}`);
  const status = el('p', { 'data-agent': 'status' });
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = 'Creating…';
    try {
      const { identity, body } = await createIdentity({ namespace, audience: resource, origin: window.location.origin });
      const res = await fetch(`${resource}/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' });
      const answer = await res.json().catch(() => null);
      if (!res.ok) { status.textContent = `refused: ${res.status} ${answer?.error ?? ''}`.trim(); button.disabled = false; return; }
      await storeIdentity(identity);   // kept only once the registration was accepted
      root.replaceChildren(el('p', { 'data-agent': 'created' }, identity.identityHash), el('p', { 'data-agent': 'created-key' }, identity.keyId));
    } catch (e) {
      status.textContent = `error: ${e instanceof Error ? e.message : String(e)}`;
      button.disabled = false;
    }
  });
  root.replaceChildren(el('h1', {}, 'New identity'), el('p', {}, `Registered with ${resource}, agent-only from the start.`), button, status);
}
