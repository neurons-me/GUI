// The identity agent page (Identity-Custody-Contract.md, first cut). PROTOTYPE, served by the demo server for
// tests/integration/agent.browser.test.mjs -- not deployed anywhere.
//
// It runs in its OWN origin, as a visible window. Two things happen here (Agent-Protocol.md, first cut):
//   - opened directly with `?create=<resource origin>&ns=<namespace>`: the person creates a NEW identity; its agent
//     key is generated here and registered with the resource in one atomic operation (`agent-only` from the start);
//   - opened by a host page: it takes one request, from that window only, shows what the BROWSER says about who is
//     asking (MessageEvent.origin), lets the person pick one of the identities this agent holds and approve, and
//     answers with a v2 proof signed by that identity's agent key, to that exact origin and window. A read is shown
//     as is; an admitted WRITE (`call`, e.g. netget gateway bootstrap) is shown in the agent's own words with its
//     effects (approvalKernel.ts) and signed only if the request is still exactly the one approved (approval.ts).
// No secret is typed and no key leaves this page. No HTML, component or text from the host is rendered: everything
// shown is built from the validated operation with textContent.
// Also: the creation link (`?create=<transport>&ns=`) gives only the TRANSPORT; the AUDIENCE comes from this page's own
// trusted configuration (cleakerTrust.ts), never from the URL. `keys.list` answers with the NAMES of the person's keys,
// never a value (keysList.ts). Opened directly, the page shows the person's keys tree (values as dots).
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
  type ReadOperation,
} from '@/agent/protocol';
import { ApprovalInvalidated, approvalFor, approvedCallBytes, deepFreeze, validateCallRequest, type ValidatedCall } from '@/agent/approval';
import type { AdmittedOperation } from '@/agent/admittedOperations';
import { approvalView, effectsView, type ApprovalView } from '@/agent/approvalKernel';
import { KEYS_LIST_TEXT, approvalForKeys, assertKeysApproval, listKeysFor, validateKeysListRequest, type ValidatedKeysList } from '@/agent/keysList';
import { loadTrust, resolveCreateLink } from '@/agent/cleakerTrust';
import {
  AGENT_REGISTER_PATH, abandonPending, confirmRegistered, listHomeIdentities, listIdentities, newLocalTestIdentity, newPendingIdentity, pendingRegistration, registrationFor, signV2,
  type AgentIdentity,
} from '@/agent/agentKeys';
import {
  FACEBOOK_RETURN_CHANNEL, clearFacebookSession, finishFacebookConnect, isFacebookOAuthReturn, readFacebookReturn, readFacebookSession,
} from '@/gui/All.This/Cleaker/Keys/facebookConnect';

const root = document.getElementById('agent') as HTMLElement;

// The .GUI theme (palette variables, typography, light/dark) for the whole page; the screens below read it from CSS.
void import('./agentTheme').then((m) => m.mountAgentTheme()).catch(() => { /* the CSS fallbacks still apply */ });

/** A Material Symbol (GUI's self-hosted font); decorative, so hidden from screen readers. */
function icon(name: string, extra = ''): HTMLSpanElement {
  return el('span', { class: `material-symbols-rounded ${extra}`.trim(), 'aria-hidden': 'true' }, name);
}

/** A native <select> dressed as a .GUI field: a leading icon, the value in mono, a chevron. */
function selectField(select: HTMLSelectElement, lead = 'person'): HTMLDivElement {
  const field = el('div', { class: 'field' });
  field.append(icon(lead, 'lead-icon'), select, icon('expand_more', 'chevron'));
  return field;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  return node;
}

/** Labelled public values (a <dl>): each value keeps its own `data-agent` marker and holds only the value. */
function createdList(rows: Array<[label: string, marker: string, value: string]>): HTMLDListElement {
  const list = el('dl', { 'data-agent': 'created-list' });
  for (const [label, marker, value] of rows) list.append(el('dt', {}, label), el('dd', { 'data-agent': marker }, value));
  return list;
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
const opener = window.opener as Window | null;
if (params.has('create')) {
  // Transport from the link, audience from this agent's own configuration (same origin, never the URL).
  root.replaceChildren(el('p', { 'data-agent': 'create-loading' }, 'Reading the configuration…'));
  loadTrust().then((trust) => {
    const link = resolveCreateLink(params, trust);
    if (!link.ok) { stop(`This creation link is not valid: ${link.reason}.`, 'create-invalid'); return; }
    renderCreate(link.transport, link.audience, link.namespace);
  });
} else if (isFacebookOAuthReturn(params, readFacebookSession(), !!(opener && !opener.closed))) {
  void handleFacebookOAuthReturn(params);
} else if (!opener) {
  root.replaceChildren();
  renderKeysHome();
} else {
  // One request id per window. A READ is taken once. A CALL (an admitted write) may be REPLACED by the opener with the
  // same id -- and any replacement, valid or not, invalidates whatever was approved before: the person sees the new
  // request (marked as changed) and has to approve again.
  type Pending =
    | { kind: 'read'; request: AgentRequest; origin: string }
    | { kind: 'call'; request: AgentRequest; origin: string; validated: ValidatedCall; admitted: AdmittedOperation }
    | { kind: 'keys'; request: AgentRequest; origin: string; validated: ValidatedKeysList };
  let pending: Pending | null = null;
  let firstId: string | null = null;
  let answered = false;
  let version = 0;

  const answer = (result: AgentResult) => {
    if (!pending || answered) return;
    answered = true;
    opener.postMessage(result, pending.origin);   // that exact origin, never '*'
    setTimeout(() => window.close(), 50);
  };

  window.addEventListener('message', async (event) => {
    if (event.source !== opener || answered) return;   // only the window that opened this one
    const request = parseRequest(event.data);
    if (!request) return;
    if (firstId && request.id !== firstId) return;     // one request id per window
    const origin = event.origin;                       // the requesting origin, as the browser reports it
    if (request.operation.action === 'read') {
      if (pending) return;                             // a read is taken once
      firstId = request.id;
      // Frozen: the screen and the signature are built from this one object; later messages are ignored.
      pending = { kind: 'read', request: deepFreeze(request), origin };
      renderRead();
      return;
    }
    firstId = request.id;
    const mine = ++version;
    const changed = pending !== null;
    if (request.operation.action === 'keys.list') {
      // Like a call: may be replaced with the same id, and a replacement invalidates what was approved.
      const k = await validateKeysListRequest(request.id, request.operation, origin);
      if (mine !== version || answered) return;
      if (!k.ok) {
        pending = { kind: 'read', request, origin };
        stop(`Refused: ${k.reason}`, 'refused');
        answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: request.id, ok: false, reason: 'invalid' });
        return;
      }
      pending = { kind: 'keys', request, origin, validated: k.validated };
      renderKeysList(changed);
      return;
    }
    const v = await validateCallRequest(request.id, request.operation, origin);
    if (mine !== version || answered) return;          // a newer message arrived meanwhile
    if (!v.ok) {
      // Refused before anything is shown or signed: unknown operation, wrong body, path or bodyHash, ...
      pending = { kind: 'read', request, origin };     // only to address the answer
      stop(`Refused: ${v.reason}`, 'refused');
      answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: request.id, ok: false, reason: 'invalid' });
      return;
    }
    pending = { kind: 'call', request, origin, validated: v.validated, admitted: v.admitted };
    renderCall(changed);
  });

  // Tells the opener this window is listening. It carries nothing; who is asking is learned from the request event.
  opener.postMessage({ protocol: AGENT_PROTOCOL, type: 'agent.ready' }, '*');
  root.replaceChildren(el('p', { 'data-agent': 'waiting' }, 'Waiting for the request…'));

  /** The identity picker + Approve / Reject, shared by both screens. */
  function approvalForm(namespace: string, onApprove: (chosen: AgentIdentity, ui: { approve: HTMLButtonElement; reject: HTMLButtonElement; status: HTMLElement }) => void, holdMs = 0) {
    const form = el('form', { 'data-agent': 'form', autocomplete: 'off' });
    const pick = el('select', { name: 'identity', 'aria-label': 'Identity', 'data-agent': 'identity' });
    const approve = el('button', { type: 'submit', 'data-agent': 'approve' }, 'Approve');
    const reject = el('button', { type: 'button', 'data-agent': 'reject' }, 'Reject');
    const status = el('p', { 'data-agent': 'status' });
    const actions = el('div', { class: 'actions' });
    actions.append(reject, approve);
    form.append(selectField(pick), actions, status);
    let held: AgentIdentity[] = [];
    let holding = holdMs > 0;
    approve.disabled = true;
    const arm = () => { if (!holding && held.length) approve.disabled = false; };
    if (holding) setTimeout(() => { holding = false; arm(); }, holdMs);
    listIdentities(namespace).then((ids) => {
      held = ids;
      for (const id of ids) pick.append(el('option', { value: id.identityHash }, `${id.claimedNamespace ?? id.identityHash.slice(0, 12) + '…'}  (key ${id.keyId.slice(0, 8)})`));
      if (ids.length) arm();
      else status.textContent = `No .me for ${namespace} on this device yet. Create one first.`;
    }, () => { status.textContent = 'Your .me identities on this device could not be read.'; });
    reject.addEventListener('click', () => { if (pending) answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: pending.request.id, ok: false, reason: 'rejected' }); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const chosen = held.find((i) => i.identityHash === pick.value);
      if (!chosen) { status.textContent = 'Choose an identity to approve with.'; return; }
      onApprove(chosen, { approve, reject, status });
    });
    return form;
  }

  function renderRead() {
    if (!pending || pending.kind !== 'read') return;
    const { request, origin } = pending;
    const op = request.operation as ReadOperation;
    const shown = describeOperation(op);

    const asker = el('p', { 'data-agent': 'origin', class: 'origin' }, origin);
    const what = el('dl');
    for (const [k, v] of [['Action', shown.action], ['Resource', shown.resource], ['As', `<you>.${op.namespace}`], ['Valid for', shown.expires]]) {
      what.append(el('dt', {}, k), el('dd', { 'data-agent': `field-${k.toLowerCase().replace(/\s+/g, '-')}` }, v));
    }
    const form = approvalForm(op.namespace, async (chosen, ui) => {
      ui.approve.disabled = true;
      ui.reject.disabled = true;
      ui.status.textContent = 'Signing…';
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
    // "Which .me is yours": the open read with no query (connectMe.ts). Said in this page's own words.
    const connect = op.method === 'GET' && op.path === '/api/v1/agent/open' && op.query === '[]';
    if (connect) {
      root.replaceChildren(
        el('h1', { 'data-agent': 'connect-title' }, `${origin} wants to know which .me is yours`),
        el('p', { 'data-agent': 'connect-explain' }, `If you approve, this site receives the name of the .me you choose and a one-time proof, valid ${shown.expires}, usable only at ${op.audience}. It never receives your key.`),
        el('p', { class: 'label' }, 'Asked by'), asker, what, form,
      );
      return;
    }
    root.replaceChildren(el('h1', {}, 'Approve a request'), el('p', { class: 'label' }, 'Asked by'), asker, what, form);
  }

  // An admitted write. Everything on this screen comes from ONE validated, frozen request (`shown`), the agent's own
  // table (`admitted`) and the temporary kernel's effects. Nothing the app wrote as text is rendered.
  function renderCall(changed: boolean) {
    if (!pending || pending.kind !== 'call') return;
    const shown = pending.validated;
    const admitted = pending.admitted;
    const op = shown.operation;
    let view: ApprovalView;
    try {
      view = approvalView(shown, admitted);
    } catch {
      stop('Refused: this operation\'s effects could not be computed.', 'refused');
      answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: pending.request.id, ok: false, reason: 'invalid' });
      return;
    }

    const nodes: HTMLElement[] = [el('h1', {}, 'Approve an operation')];
    if (changed) nodes.push(el('p', { 'data-agent': 'changed', class: 'changed' }, 'The app changed the request after it was shown. Nothing was signed. Review it again.'));
    nodes.push(el('p', { class: 'label' }, 'Asked by'), el('p', { 'data-agent': 'origin', class: 'origin' }, shown.origin));
    const what = el('dl');
    const rows: [string, string, string][] = [
      ['Operation', admitted.title(op.body as Record<string, unknown>), 'field-operation'],
      ['App', admitted.app, 'field-app'],
      ['Verified by', op.audience, 'field-audience'],
      ['Request', `${op.method} ${op.path}`, 'field-request'],
      ['As', `<you>.${op.namespace}`, 'field-as'],
      ['Valid for', `${Math.round(op.ttlMs / 1000)} s, once`, 'field-valid-for'],
      ['Approval', shown.digest.slice(0, 16), 'digest'],
    ];
    for (const [k, v, marker] of rows) what.append(el('dt', {}, k), el('dd', { 'data-agent': marker }, v));
    nodes.push(what);

    const effects = el('ul', { 'data-agent': 'effects' });
    for (const e of view.effects) effects.append(el('li', { 'data-agent': `effect-${e.name}`, 'data-value': String(e.value) }, e.sentence));
    nodes.push(el('p', { class: 'label' }, 'What this does'), effects);

    const decides = el('ul', { 'data-agent': 'server-decides' });
    for (const d of admitted.serverDecides) decides.append(el('li', {}, d));
    nodes.push(el('p', { class: 'label' }, `${op.audience} decides, not this screen`), decides);

    // Traceability: which validated request fields each effect was computed from (me.explain). Shown here only:
    // never sent to the app or the server, and never a proof of authorization.
    const trace = el('details', { 'data-agent': 'trace' });
    trace.append(el('summary', {}, 'How this screen was computed (me.explain, traceability only)'));
    for (const e of view.effects) {
      const inputs = e.inputs.map((i) => `${i.path} = ${String(i.value)}`).join(', ');
      trace.append(el('p', { 'data-agent': `trace-${e.name}` }, `effect.${e.name} = ${String(e.value)}  ←  ${e.expr}  [${inputs}]`));
    }
    nodes.push(trace);

    const form = approvalForm(op.namespace, async (chosen, ui) => {
      // The approval is the digest of what is on THIS screen; signing checks it against the request pending NOW.
      const approval = approvalFor(shown);
      const invalidated = () => {
        root.querySelector('[data-agent="invalidated"]')?.remove();
        root.append(el('p', { 'data-agent': 'invalidated' }, 'Not signed: the request changed after you saw it. Review the current request and approve again.'));
      };
      const current = pending && pending.kind === 'call' ? pending.validated : null;
      if (!current || current !== shown) { invalidated(); return; }
      ui.approve.disabled = true;
      ui.reject.disabled = true;
      ui.status.textContent = 'Signing…';
      try {
        const { fields, bytes } = await approvedCallBytes(approval, current, {
          identityHash: chosen.identityHash, keyId: chosen.keyId, identityNamespace: chosen.claimedNamespace ?? chosen.namespace,
        }, newRequestId(), Date.now());
        const proof = await signV2(chosen, fields);
        if (proof.bytes !== bytes) throw new Error('SIGNED_BYTES_DIFFER');
        // A change that arrived while signing: drop the signature, ask again.
        if (!pending || pending.kind !== 'call' || pending.validated !== shown) { invalidated(); return; }
        answer({
          protocol: AGENT_PROTOCOL,
          type: 'agent.result',
          id: shown.requestId,
          ok: true,
          proof: base64url(JSON.stringify(proof)),
          identity: { namespace: chosen.claimedNamespace ?? chosen.namespace, identityHash: chosen.identityHash, keyId: chosen.keyId },
        });
      } catch (e) {
        if (e instanceof ApprovalInvalidated) { invalidated(); return; }
        answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: shown.requestId, ok: false, reason: 'error' });
      }
    }, changed ? 1500 : 0);
    nodes.push(form);
    root.replaceChildren(...nodes);
  }

  // keys.list: the agent's own words and rules; the app's request contributes only the namespace root. The answer
  // is built from the vault's public index for the identity picked, at the moment of approval -- never a value.
  function renderKeysList(changed: boolean) {
    if (!pending || pending.kind !== 'keys') return;
    const shown = pending.validated;
    const op = shown.operation;
    const resource = `<you>.${op.namespace}.keys`;
    let view: ApprovalView;
    try { view = effectsView(KEYS_LIST_TEXT.facts(resource), KEYS_LIST_TEXT.rules); } catch {
      stop('Refused: this operation\'s effects could not be computed.', 'refused');
      answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: pending.request.id, ok: false, reason: 'invalid' });
      return;
    }
    const nodes: HTMLElement[] = [el('h1', {}, 'Approve a request')];
    if (changed) nodes.push(el('p', { 'data-agent': 'changed', class: 'changed' }, 'The app changed the request after it was shown. Nothing was sent. Review it again.'));
    nodes.push(el('p', { class: 'label' }, 'Asked by'), el('p', { 'data-agent': 'origin', class: 'origin' }, shown.origin));
    const what = el('dl');
    for (const [k, v, marker] of [
      ['Operation', KEYS_LIST_TEXT.title, 'field-operation'],
      ['Resource', resource, 'field-resource'],
      ['Approval', shown.digest.slice(0, 16), 'digest'],
    ] as const) what.append(el('dt', {}, k), el('dd', { 'data-agent': marker }, v));
    nodes.push(what, el('p', { 'data-agent': 'description' }, KEYS_LIST_TEXT.description));
    const effects = el('ul', { 'data-agent': 'effects' });
    for (const e of view.effects) effects.append(el('li', { 'data-agent': `effect-${e.name}`, 'data-value': String(e.value) }, e.sentence));
    nodes.push(el('p', { class: 'label' }, 'What this does'), effects);
    const form = approvalForm(op.namespace, async (chosen, ui) => {
      const approval = approvalForKeys(shown);
      const invalidated = () => {
        root.querySelector('[data-agent="invalidated"]')?.remove();
        root.append(el('p', { 'data-agent': 'invalidated' }, 'Not sent: the request changed after you saw it. Review the current request and approve again.'));
      };
      const current = pending && pending.kind === 'keys' ? pending.validated : null;
      if (!current || current !== shown) { invalidated(); return; }
      try {
        await assertKeysApproval(approval, current);
        if (!pending || pending.kind !== 'keys' || pending.validated !== shown) { invalidated(); return; }
        const ns = chosen.claimedNamespace ?? chosen.namespace;
        answer({
          protocol: AGENT_PROTOCOL,
          type: 'agent.result',
          id: shown.requestId,
          ok: true,
          keys: listKeysFor(ns),
          identity: { namespace: ns, identityHash: chosen.identityHash, keyId: chosen.keyId },
        });
      } catch (e) {
        if (e instanceof ApprovalInvalidated) { invalidated(); return; }
        answer({ protocol: AGENT_PROTOCOL, type: 'agent.result', id: shown.requestId, ok: false, reason: 'error' });
      }
      void ui;
    }, changed ? 1500 : 0);
    nodes.push(form);
    root.replaceChildren(...nodes);
  }
}


function stripFacebookOAuthParams() {
  const u = new URL(window.location.href);
  for (const k of ['code', 'state', 'error', 'error_description', 'error_reason', 'oauth']) u.searchParams.delete(k);
  if (u.pathname === '/oauth/callback') u.pathname = '/';   // the window is this origin's root
  // Facebook appends `#_=_` to its redirects; it means nothing here.
  const hash = u.hash === '#_=_' || u.hash === '#' ? '' : u.hash;
  history.replaceState({}, '', `${u.pathname}${u.search}${hash}`);
}

type FacebookReturnMessage = { type: 'me.facebook.oauth-return'; code?: string; state?: string; error?: string; error_description?: string };

/**
 * The window that started the connect: takes the code back from its popup (same-origin BroadcastChannel, or
 * postMessage when the popup still has `window.opener`), answers with an ack so the popup can close, and finishes
 * here. Only a return whose `state` matches this tab's own pending connect is taken (and acked); installed once.
 */
let facebookPopupListening = false;
function listenForFacebookPopup() {
  if (facebookPopupListening) return;
  facebookPopupListening = true;
  const taken = new Set<string>();
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(FACEBOOK_RETURN_CHANNEL) : null;
  const take = (data: FacebookReturnMessage | null, ack: (state: string) => void) => {
    if (!data || data.type !== 'me.facebook.oauth-return') return;
    const session = readFacebookSession();
    if (!session || (data.state && data.state !== session.state)) return;   // not this tab's connect
    const key = data.state || data.error || '';
    ack(data.state ?? '');
    if (taken.has(key)) return;
    taken.add(key);
    const q = new URLSearchParams();
    if (data.code) q.set('code', data.code);
    if (data.state) q.set('state', data.state);
    if (data.error) q.set('error', data.error);
    if (data.error_description) q.set('error_description', data.error_description);
    void handleFacebookOAuthReturn(q, true);
  };
  channel?.addEventListener('message', (event: MessageEvent) => {
    take(event.data as FacebookReturnMessage | null, (state) => channel.postMessage({ type: 'me.facebook.oauth-ack', state }));
  });
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    take(event.data as FacebookReturnMessage | null, (state) => {
      try { (event.source as Window | null)?.postMessage({ type: 'me.facebook.oauth-ack', state }, window.location.origin); } catch { /* closed */ }
    });
  });
}

/** In the popup: hand the code back to the window that started the connect; true once that window took it. */
function relayFacebookReturn(incoming: URLSearchParams): Promise<boolean> {
  const state = incoming.get('state') ?? '';
  const msg: FacebookReturnMessage = {
    type: 'me.facebook.oauth-return',
    ...(incoming.get('code') ? { code: incoming.get('code')! } : {}),
    ...(state ? { state } : {}),
    ...(incoming.get('error') ? { error: incoming.get('error')! } : {}),
    ...(incoming.get('error_description') ? { error_description: incoming.get('error_description')! } : {}),
  };
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(FACEBOOK_RETURN_CHANNEL) : null;
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('message', onWindowAck);
      channel?.close();
      resolve(ok);
    };
    const isAck = (d: any) => d && d.type === 'me.facebook.oauth-ack' && (d.state ?? '') === state;
    const onWindowAck = (event: MessageEvent) => { if (event.origin === window.location.origin && isAck(event.data)) finish(true); };
    const timer = setTimeout(() => finish(false), 2500);
    channel?.addEventListener('message', (event: MessageEvent) => { if (isAck(event.data)) finish(true); });
    window.addEventListener('message', onWindowAck);
    channel?.postMessage(msg);
    if (opener && !opener.closed) { try { opener.postMessage(msg, window.location.origin); } catch { /* cut by COOP */ } }
  });
}

/** A short notice at the bottom of the window (snackbar style) that fades out by itself after ~4 s. */
function showNotice(text: string, marker: string, ms = 4000) {
  document.querySelectorAll('[data-agent-notice]').forEach((n) => n.remove());
  const note = el('div', { class: 'notice', role: 'status', 'aria-live': 'polite', 'data-agent-notice': '', 'data-agent': marker });
  note.append(icon('check_circle'), el('span', {}, text));
  document.body.append(note);
  setTimeout(() => note.classList.add('leaving'), ms);
  setTimeout(() => note.remove(), ms + 400);
}

/** The popup's last screen: the main window has the result. */
function finishPopup() {
  root.replaceChildren(
    el('h1', { 'data-agent': 'facebook-return' }, 'Done'),
    el('p', { class: 'lead' }, 'You can close this window.'),
  );
  try { window.close(); } catch { /* the person closes it */ }
}

async function handleFacebookOAuthReturn(incoming: URLSearchParams, relayed = false) {
  const session = readFacebookSession();
  const returned = incoming.has('code') || incoming.has('error');
  // In the popup (it carries a copy of the starting tab's session, marked `popup`; or it still has an opener):
  // hand the code back, and finish here only if nobody took it.
  if (!relayed && returned && (session?.popup || (!session && opener && !opener.closed))) {
    stripFacebookOAuthParams();
    root.replaceChildren(el('p', { 'data-agent': 'facebook-relay' }, 'Finishing…'));
    const taken = await relayFacebookReturn(incoming);
    if (taken) { clearFacebookSession(); finishPopup(); return; }
    if (!session) {
      root.replaceChildren(el('h1', {}, 'Connect with Facebook'), el('p', { 'data-agent': 'facebook-error' }, 'The window that started this was closed. Try again from there.'));
      return;
    }
    // Nobody answered (the starting tab is gone): finish in this window.
  }

  const result = readFacebookReturn(incoming, session);
  stripFacebookOAuthParams();
  if (!result.ok || !session) {
    clearFacebookSession();
    root.replaceChildren(el('h1', {}, 'Connect with Facebook'), el('p', { 'data-agent': 'facebook-error' }, result.ok ? 'This sign-in expired or did not match. Try again.' : result.message));
    if (session?.popup && !relayed) { root.append(el('p', { class: 'lead' }, 'You can close this window.')); return; }   // a popup: no keys page here
    renderKeysHome();
    return;
  }

  const status = el('p', { 'data-agent': 'facebook-status' });
  const form = el('form', { 'data-agent': 'facebook-finish', autocomplete: 'off' });
  const pass = el('input', { type: 'password', name: 'passphrase', 'aria-label': 'Passphrase', autocomplete: 'current-password' });
  const go = el('button', { type: 'submit' }, 'Save keys');
  form.append(el('p', {}, 'Enter your passphrase to encrypt and save the new keys.'), pass, go, status);
  root.replaceChildren(el('h1', {}, 'Connect with Facebook'), form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const passphrase = pass.value;
    pass.value = '';
    if (!passphrase) { status.textContent = 'Passphrase is required.'; return; }
    go.disabled = true;
    status.textContent = 'Connecting…';
    const done = await finishFacebookConnect({ code: result.code, session, passphrase });
    if (!done.ok) {
      status.textContent = done.message;
      go.disabled = false;
      return;
    }
    clearFacebookSession();
    if (session.popup && !relayed) { finishPopup(); return; }   // a popup that had to finish itself
    root.replaceChildren();
    renderKeysHome();
    showNotice('Connected. Your Pages are on the Meta branch.', 'facebook-done');
    if (opener && !opener.closed) {
      try { opener.postMessage({ type: 'me.facebook.connected' }, window.location.origin); } catch { /* ignore */ }
    }
  });
}

/**
 * The page's "i": a small button in the top-right corner that opens a compact panel with what this window is.
 * Plain DOM (this page is not React), styled with the page's theme tokens. Escape, a click outside or the
 * button again closes it; focus returns to the button.
 */
function infoButton(): HTMLDivElement {
  // Inside the function: the page renders at load, before module-level consts below it would exist.
  const INFO_LINES = [
    'Your keys stay on this device.',
    'Apps ask you here before using them. They get only the result, never your keys.',
    'Secrets show as dots; your passphrase unlocks them.',
  ];
  const wrap = el('div', { class: 'info', 'data-agent': 'info' });
  const btn = el('button', { type: 'button', class: 'info-btn', 'aria-label': 'About this page', 'aria-expanded': 'false', 'aria-controls': 'agent-info-panel', 'data-agent': 'info-button' });
  btn.append(icon('info'));
  const panel = el('div', { id: 'agent-info-panel', class: 'info-panel', role: 'dialog', 'aria-label': 'About this page', 'data-agent': 'info-panel' });
  for (const line of INFO_LINES) panel.append(el('p', {}, line));
  panel.hidden = true;
  const setOpen = (open: boolean, refocus = false) => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (!open && refocus) btn.focus();
  };
  btn.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setOpen(false, true); });
  document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !wrap.contains(e.target as Node)) setOpen(false); });
  wrap.append(btn, panel);
  return wrap;
}

// "Your keys": opened directly (no app asking). The person picks one of the identities this agent holds and sees
// that identity's keys tree; values are dots and are revealed only here, under the passphrase (secretReveal.ts).
function renderKeysHome() {
  const section = el('section', { 'data-agent': 'keys-home' });
  section.append(infoButton());
  const pick = el('select', { 'aria-label': 'Identity', 'data-agent': 'keys-identity' });
  const pickField = selectField(pick);
  pickField.hidden = true;   // shown only when there is more than one .me to choose from
  const status = el('div', { 'data-agent': 'keys-status' });
  const mount = el('div', { 'data-agent': 'keys-tree' });
  section.append(pickField, status, mount);
  root.append(section);
  let unmount: (() => void) | null = null;
  const showIdentities = async (ids: AgentIdentity[]) => {
    pick.replaceChildren();
    pickField.hidden = ids.length < 2;
    status.textContent = '';
    status.replaceChildren();
    for (const id of ids) {
      const label = id.claimedNamespace ?? id.identityHash.slice(0, 12) + '…';
      pick.append(el('option', { value: id.identityHash }, id.status === 'local-test' ? `${label} (local test)` : label));
    }
    const { mountKeysTree } = await import('./cleakerKeys');
    const show = () => {
      const chosen = ids.find((i) => i.identityHash === pick.value) ?? ids[0];
      unmount?.();
      unmount = mountKeysTree(mount, chosen.claimedNamespace ?? chosen.namespace);
    };
    pick.onchange = show;
    show();
    listenForFacebookPopup();
  };

  const offerLocalTest = () => {
    status.textContent = '';
    status.append(
      el('p', { 'data-agent': 'keys-empty' }, 'No .me on this page yet.'),
      el('p', {}, 'Identities belong to this origin. Storybook and localhost do not share them with http://127.0.0.1:5320/.'),
    );
    const create = el('button', { type: 'button', 'data-agent': 'local-test-create' }, 'Create a local test .me');
    const note = el('p', { 'data-agent': 'local-test-note' }, 'Only in this browser, disposable. Nothing is sent.');
    create.addEventListener('click', async () => {
      create.disabled = true;
      status.textContent = 'Creating a local test .me…';
      try {
        await newLocalTestIdentity();
        const ids = await listHomeIdentities();
        if (!ids.length) throw new Error('NOT_CREATED');
        await showIdentities(ids);
      } catch {
        status.textContent = 'The local test .me could not be created in this browser.';
        create.disabled = false;
        status.append(create, note);
      }
    });
    status.append(create, note);
  };

  listHomeIdentities().then(async (ids) => {
    if (!ids.length) { offerLocalTest(); return; }
    await showIdentities(ids);
  }, () => { status.textContent = 'Your .me identities on this page could not be read.'; });
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

function renderCreate(transport: string, audience: string, namespace: string) {
  if (!isOrigin(transport) || !isOrigin(audience) || !namespace) { stop('This creation link is not valid.', 'create-invalid'); return; }
  const status = el('p', { 'data-agent': 'status' });

  const send = async (identity: AgentIdentity, button: HTMLButtonElement) => {
    button.disabled = true;
    status.textContent = 'Registering…';
    let res: Response;
    let answer: any = null;
    try {
      const body = await registrationFor(identity, { origin: window.location.origin });
      res = await fetch(`${transport}${AGENT_REGISTER_PATH}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' });
      answer = await res.json().catch(() => null);
    } catch (e) {
      // No answer at all: the registration may or may not have happened. Kept pending; finishing it is safe.
      showPending(identity, `no answer from ${audience}; the registration is kept and can be finished`);
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
        el('h1', {}, 'Your .me is ready'),
        createdList([
          ['Namespace', 'created-namespace', registered.claimedNamespace ?? ''],
          ['Identity hash', 'created', registered.identityHash],
          ['Key id', 'created-key', registered.keyId],
          ['Status', 'created-how', answer?.alreadyRegistered ? 'confirmed (retry)' : 'registered'],
        ]),
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
        const identity = await newPendingIdentity({ namespace, resource: audience });   // stored pending BEFORE anything is sent; its audience is the configured one
        await send(identity, button);
      } catch (e) {
        status.textContent = `error: ${e instanceof Error ? e.message : String(e)}`;
        button.disabled = false;
      }
    });
    root.replaceChildren(el('h1', {}, 'New .me'), el('p', { 'data-agent': 'create-audience' }, `It will be registered at ${audience}. Its key stays on this device and only signs what you approve here.`), button, status);
  };

  // A registration this agent started with this audience and never saw confirmed comes first.
  pendingRegistration(audience, namespace).then(
    (pending) => (pending ? showPending(pending, 'A registration with this resource was not confirmed.') : showCreate()),
    () => showCreate(),
  );
}
