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
import {
  AGENT_REGISTER_PATH, abandonPending, confirmRegistered, listIdentities, newPendingIdentity, pendingRegistration, registrationFor, signV2,
  type AgentIdentity,
} from '@/agent/agentKeys';

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
      for (const id of ids) pick.append(el('option', { value: id.identityHash }, `${id.claimedNamespace ?? id.identityHash.slice(0, 12) + '…'}  (key ${id.keyId.slice(0, 8)})`));
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
          // Public: the namespace this identity holds (the one the server confirmed), its hash and key id.
          identity: { namespace: chosen.claimedNamespace ?? chosen.namespace, identityHash: chosen.identityHash, keyId: chosen.keyId },
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
//
// The identity is stored PENDING (with its seed) before the registration is sent, and confirmed only when the resource
// answers 201 -- or 200 for a retry of the same registration -- naming exactly this identity, key and namespace. An
// answer that never arrives, or a 5xx (the server could not confirm its save), keeps it pending: the person finishes
// it later, here, with the same identity and key. Only a definitive conflict (the name or identity is someone else's)
// forgets it.
const CONFLICTS = new Set(['NAMESPACE_TAKEN', 'IDENTITY_TAKEN', 'REGISTERED_WITH_ANOTHER_KEY']);

function renderCreate(resource: string, namespace: string) {
  if (!isOrigin(resource) || !namespace) { stop('This creation link is not valid.', 'create-invalid'); return; }
  const status = el('p', { 'data-agent': 'status' });

  const send = async (identity: AgentIdentity, button: HTMLButtonElement) => {
    button.disabled = true;
    status.textContent = 'Registering…';
    let res: Response;
    let answer: any = null;
    try {
      const body = await registrationFor(identity, { origin: window.location.origin });
      res = await fetch(`${resource}${AGENT_REGISTER_PATH}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' });
      answer = await res.json().catch(() => null);
    } catch (e) {
      // No answer at all: the registration may or may not have happened. Kept pending; finishing it is safe.
      showPending(identity, `no answer from ${resource}; the registration is kept and can be finished`);
      return;
    }
    if (res.ok) {
      // The server must have registered exactly the namespace the identity proof named, for this identity and key.
      if (answer?.namespace !== identity.claimedNamespace || answer?.identityHash !== identity.identityHash || answer?.keyId !== identity.keyId) {
        showPending(identity, 'refused: the server confirmed a different registration');
        return;
      }
      const registered = await confirmRegistered(identity);   // the seed is dropped here, never before
      root.replaceChildren(
        el('p', { 'data-agent': 'created' }, registered.identityHash),
        el('p', { 'data-agent': 'created-key' }, registered.keyId),
        el('p', { 'data-agent': 'created-namespace' }, registered.claimedNamespace ?? ''),
        el('p', { 'data-agent': 'created-how' }, answer?.alreadyRegistered ? 'confirmed (retry)' : 'registered'),
      );
      return;
    }
    if (res.status === 409 && CONFLICTS.has(String(answer?.error))) {
      await abandonPending(identity);
      status.textContent = `refused: ${res.status} ${answer?.error ?? ''}`.trim();
      return;
    }
    showPending(identity, `not confirmed: ${res.status} ${answer?.error ?? ''}; the registration is kept and can be finished`.trim());
  };

  const showPending = (identity: AgentIdentity, message: string) => {
    const finish = el('button', { type: 'button', 'data-agent': 'finish' }, `Finish registering ${identity.claimedNamespace ?? ''}`.trim());
    finish.addEventListener('click', () => send(identity, finish));
    status.textContent = message;
    root.replaceChildren(
      el('h1', {}, 'Registration not confirmed'),
      el('p', { 'data-agent': 'pending' }, identity.claimedNamespace ?? identity.identityHash),
      finish,
      status,
    );
  };

  const showCreate = () => {
    const button = el('button', { type: 'button', 'data-agent': 'create' }, `Create a new identity in ${namespace}`);
    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = 'Creating…';
      try {
        const identity = await newPendingIdentity({ namespace, resource });   // stored pending BEFORE anything is sent
        await send(identity, button);
      } catch (e) {
        status.textContent = `error: ${e instanceof Error ? e.message : String(e)}`;
        button.disabled = false;
      }
    });
    root.replaceChildren(el('h1', {}, 'New identity'), el('p', {}, `Registered with ${resource}, agent-only from the start.`), button, status);
  };

  // A registration this agent started with this resource and never saw confirmed comes first.
  pendingRegistration(resource, namespace).then(
    (pending) => (pending ? showPending(pending, 'A registration with this resource was not confirmed.') : showCreate()),
    () => showCreate(),
  );
}
