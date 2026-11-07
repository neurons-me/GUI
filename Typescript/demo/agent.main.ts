// The identity agent page (Identity-Custody-Contract.md, first cut). PROTOTYPE, served by the demo server for
// tests/integration/agent.browser.test.mjs -- not deployed anywhere.
//
// It runs in its OWN origin, as a visible window a host page opened. It takes one request, from the window that
// opened it only, and shows what the BROWSER says about who is asking (MessageEvent.origin), never what the request
// says. The person unlocks and approves here; the secret is used here to derive the signing key and is not kept,
// sent or stored. The answer goes to that exact origin and window. No HTML, component or text from the host is
// rendered: everything shown is built from the validated operation with textContent.
import {
  AGENT_PROTOCOL,
  base64url,
  buildChallenge,
  describeOperation,
  newRequestId,
  parseRequest,
  type AgentRequest,
  type AgentResult,
} from '@/agent/protocol';
import { proveWithSecret } from '@/agent/prove';

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

const opener = window.opener as Window | null;
if (!opener) {
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
    const username = el('input', { name: 'username', placeholder: 'username', 'aria-label': 'Username', autocapitalize: 'off', spellcheck: 'false' });
    const secret = el('input', { name: 'secret', type: 'password', placeholder: 'secret', 'aria-label': 'Secret' });
    const approve = el('button', { type: 'submit', 'data-agent': 'approve' }, 'Approve');
    const reject = el('button', { type: 'button', 'data-agent': 'reject' }, 'Reject');
    const status = el('p', { 'data-agent': 'status' });
    form.append(username, secret, el('div', { class: 'actions' }, ''), status);
    form.querySelector('.actions')!.append(reject, approve);

    reject.addEventListener('click', () => answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: request.id, ok: false, reason: 'rejected' }));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = username.value.trim();
      const pass = secret.value;
      secret.value = '';
      if (!name || !pass) { status.textContent = 'Username and secret are needed to approve.'; return; }
      approve.disabled = true;
      reject.disabled = true;
      status.textContent = 'Signing…';
      try {
        // The key is derived here and used once; neither it nor the secret leaves this page or is kept.
        const challenge = buildChallenge({ operation: op, requestingOrigin: origin, nonce: newRequestId(), timestamp: Date.now() });
        const proof = await proveWithSecret({ username: name, secret: pass, rootNamespace: op.namespace, challenge });
        answer({
          protocol: AGENT_PROTOCOL,
          type: 'agent.result',
          id: request.id,
          ok: true,
          proof: base64url(JSON.stringify(proof)),
          identity: { namespace: String(proof.namespace ?? ''), identityHash: String(proof.identityHash ?? ''), publicKey: String(proof.publicKey ?? '') },
        });
      } catch {
        // No unsigned fallback: the host gets an error, and nothing is sent anywhere from here.
        answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: request.id, ok: false, reason: 'error' });
      }
    });

    root.replaceChildren(el('h1', {}, 'Approve a request'), el('p', { class: 'label' }, 'Asked by'), asker, what, form);
    username.focus();
  }
}
