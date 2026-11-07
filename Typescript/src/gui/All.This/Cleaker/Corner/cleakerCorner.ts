// Cleaker in a corner: level 1 of bringing .GUI into any page (`cleaker.js`, `this.gui/cleaker`'s mountCleaker).
//
// Level 0 is a page with nothing of .GUI. Level 1 is one line that adds ONLY this: a QR floating in a corner of the
// page, showing `me @ where` -- `where` is the page's own address, `me` the namespace the person chose (none until they
// do; nothing is assumed, cleaker.me included). The person can move it to any of the four corners and choose a
// namespace from its panel; both are remembered in this browser, for this site (their local layer, `base @ overlay`):
// the page's author only sets the default corner.
//
// It is drawn inside a Shadow DOM: the page's styles do not reach it and its styles do not leak out, so it looks the
// same on any page and changes nothing of it. That isolates APPEARANCE, not security: the page's script can read it.
// So it shows only public things. Choosing a namespace only reads that namespace's public `/__surface`; signing in
// is not here (that is the identity agent's, in its own origin -- Identity-Custody-Contract.md).
//
// React-free on purpose: `this.gui/cleaker` is the subpath a static page loads before deciding to load React at all.
import qrcodegen from 'qrcode-generator';
import { linkQrValue } from '@/react/linkQr';
import { unresolvedPosition } from '@/react/positionExpression';
import { probeMonadSurface } from '@/runtime/monads/monadDiscovery.fetch';

export type CleakerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export const CLEAKER_CORNERS: readonly CleakerCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export type CleakerMountOptions = {
  /** The author's default corner. The person's own choice, once made, wins. Default `bottom-right`. */
  corner?: CleakerCorner;
  /** The author's suggested namespace, shown until the person chooses one. Default: none. */
  namespace?: string | null;
  /** Where the host element is appended. Default `document.body`. */
  container?: HTMLElement;
  /** Where the person's choices are kept. Default `localStorage`; `null` keeps them for this page view only. */
  storage?: Storage | null;
  /** Whether a namespace answers. Default: its public `/__surface`. */
  probe?: (namespace: string) => Promise<boolean>;
};

export type CleakerHandle = {
  host: HTMLElement;
  corner(): CleakerCorner;
  setCorner(corner: CleakerCorner): void;
  namespace(): string | null;
  setNamespace(namespace: string | null): Promise<void>;
  unmount(): void;
};

const STORE_CORNER = 'cleaker:corner';
const STORE_NAMESPACE = 'cleaker:namespace';
const NAMESPACE_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const LOCAL_RE = /^(localhost|127\.0\.0\.1|\[::1\])$|\.(localhost|local|test)$/;

export function isNamespaceName(value: string): boolean {
  return NAMESPACE_RE.test(value);
}

const isCorner = (value: unknown): value is CleakerCorner => typeof value === 'string' && (CLEAKER_CORNERS as readonly string[]).includes(value);

function read(storage: Storage | null | undefined, key: string): string | null {
  try { return storage ? storage.getItem(key) : null; } catch { return null; }
}
function write(storage: Storage | null | undefined, key: string, value: string | null): void {
  try {
    if (!storage) return;
    if (value === null) storage.removeItem(key); else storage.setItem(key, value);
  } catch { /* private mode, blocked storage: the choice lasts this page view */ }
}

/** The namespace's own address: https, or http for a local name. */
export function namespaceEndpoint(namespace: string): string {
  return `${LOCAL_RE.test(namespace) ? 'http' : 'https'}://${namespace}`;
}

/** `me @ where`, or `where` alone while no namespace is chosen, or the namespace alone when the page IS it. */
export function cornerLabel(namespace: string | null, page: { host: string; protocol: string; hostname: string; pathname?: string }): string {
  const where = unresolvedPosition(page);
  if (!namespace) return where;
  return namespace === page.hostname ? namespace : `${namespace} @ ${where}`;
}

export function qrSvg(value: string): string {
  const qr = qrcodegen(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let path = '';
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${path}" fill="#11181c"/></svg>`;
}

async function defaultProbe(namespace: string): Promise<boolean> {
  const result = await probeMonadSurface({ endpoint: namespaceEndpoint(namespace), sources: ['manual'], timeoutMs: 4000 });
  return Boolean(result.monad);
}

const STYLE = `
:host { all: initial; position: fixed; z-index: 2147483000; font: 13px/1.35 -apple-system, system-ui, sans-serif; color: #11181c; }
:host([data-corner^="top"]) { top: 16px; } :host([data-corner^="bottom"]) { bottom: 16px; }
:host([data-corner$="left"]) { left: 16px; } :host([data-corner$="right"]) { right: 16px; }
.wrap { display: flex; flex-direction: column; gap: 6px; }
:host([data-corner$="right"]) .wrap { align-items: flex-end; } :host([data-corner$="left"]) .wrap { align-items: flex-start; }
:host([data-corner^="top"]) .wrap { flex-direction: column; } :host([data-corner^="bottom"]) .wrap { flex-direction: column-reverse; }
.qr { display: block; width: 64px; height: 64px; padding: 0; border: 1px solid #c9d1d6; border-radius: 12px; overflow: hidden; background: #fff; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
.qr svg { display: block; width: 100%; height: 100%; }
.label { display: flex; align-items: center; gap: 6px; max-width: 280px; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.92); font: 12px ui-monospace, Menlo, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
.dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: #9aa5ad; }
.dot[data-state="ok"] { background: #2e9d6a; } .dot[data-state="off"] { background: #c0392b; } .dot[data-state="checking"] { background: #d4a72c; }
.panel { width: 260px; padding: 12px; border: 1px solid #c9d1d6; border-radius: 12px; background: #fff; box-shadow: 0 6px 24px rgba(0,0,0,.16); }
.panel[hidden] { display: none; }
.row { display: flex; gap: 6px; margin: 0 0 8px; }
input { flex: 1; min-width: 0; padding: 6px 8px; font: 12px ui-monospace, Menlo, monospace; border: 1px solid #c9d1d6; border-radius: 8px; }
button.small { padding: 6px 10px; font: inherit; border: 1px solid #11181c; border-radius: 8px; background: #11181c; color: #fff; cursor: pointer; }
.status { min-height: 1.35em; margin: 0 0 8px; color: #5b6770; }
.corners { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.corners button { padding: 5px; font: inherit; border: 1px solid #c9d1d6; border-radius: 6px; background: #fff; cursor: pointer; }
.corners button[aria-pressed="true"] { border-color: #11181c; font-weight: 600; }
`;

export function mountCleaker(options: CleakerMountOptions = {}): CleakerHandle {
  const storage = options.storage === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : options.storage;
  const probe = options.probe ?? defaultProbe;
  const page = window.location;

  // The page's own address: its origin, or for a page opened as a file the file itself (`file:///…/page.html`) -- a
  // file's origin is just `file://`, which names no place. Only this device can open it; it is still where you are.
  const pageAddress = () => (page.protocol === 'file:' ? `file://${page.pathname}` : page.origin);

  const stored = read(storage, STORE_CORNER);
  let corner: CleakerCorner = isCorner(stored) ? stored : isCorner(options.corner) ? options.corner : 'bottom-right';
  const storedNs = read(storage, STORE_NAMESPACE);
  let namespace: string | null = storedNs && isNamespaceName(storedNs) ? storedNs
    : options.namespace && isNamespaceName(options.namespace) ? options.namespace : null;
  let state: 'none' | 'checking' | 'ok' | 'off' = 'none';
  let probeRun = 0;

  const host = document.createElement('div');
  host.setAttribute('data-cleaker', '');
  host.setAttribute('data-corner', corner);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${STYLE}</style>
<div class="wrap">
  <button class="qr" type="button" part="qr" aria-haspopup="dialog" aria-expanded="false" aria-label=".me"></button>
  <div class="label" part="label"><span class="dot"></span><span class="text"></span></div>
  <div class="panel" role="dialog" aria-label=".me" hidden>
    <form class="row"><input name="namespace" placeholder="namespace (e.g. cleaker.me)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Namespace"><button class="small" type="submit">Use</button></form>
    <p class="status" role="status"></p>
    <div class="corners" role="group" aria-label="Corner">
      ${CLEAKER_CORNERS.map((c) => `<button type="button" data-corner-choice="${c}">${c.replace('-', ' ')}</button>`).join('')}
    </div>
  </div>
</div>`;
  const $ = <T extends Element>(sel: string) => shadow.querySelector(sel) as T;
  const qrButton = $<HTMLButtonElement>('.qr');
  const labelText = $<HTMLElement>('.label .text');
  const dot = $<HTMLElement>('.dot');
  const panel = $<HTMLElement>('.panel');
  const form = $<HTMLFormElement>('form');
  const input = $<HTMLInputElement>('input');
  const status = $<HTMLElement>('.status');

  function render() {
    host.setAttribute('data-corner', corner);
    const label = cornerLabel(namespace, page);
    labelText.textContent = label;
    // a file's label is its name; the whole place is in the tooltip
    labelText.parentElement!.title = page.protocol === 'file:' ? `${label}\n${decodeURI(pageAddress())}` : label;
    dot.setAttribute('data-state', state);
    const value = namespace ? linkQrValue({ endpoint: namespaceEndpoint(namespace), namespace }) : pageAddress();
    qrButton.innerHTML = qrSvg(value);
    qrButton.setAttribute('data-value', value);
    shadow.querySelectorAll<HTMLButtonElement>('[data-corner-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cornerChoice === corner)));
  }

  async function check(ns: string) {
    const run = ++probeRun;
    state = 'checking';
    status.textContent = `Asking ${ns}…`;
    render();
    let answered = false;
    try { answered = await probe(ns); } catch { answered = false; }
    if (run !== probeRun) return;   // a newer choice took over
    state = answered ? 'ok' : 'off';
    status.textContent = answered ? `${ns} answered.` : `${ns} did not answer.`;
    render();
    if (answered) host.dispatchEvent(new CustomEvent('cleaker:namespace', { detail: { namespace: ns }, bubbles: true, composed: true }));
  }

  async function setNamespace(next: string | null) {
    const ns = next === null ? null : String(next).trim().toLowerCase();
    if (ns !== null && !isNamespaceName(ns)) {
      status.textContent = `"${String(next)}" is not a namespace name.`;
      state = namespace ? state : 'none';
      render();
      return;
    }
    namespace = ns;
    write(storage, STORE_NAMESPACE, ns);
    if (!ns) { probeRun += 1; state = 'none'; status.textContent = ''; render(); return; }
    await check(ns);
  }

  function setCorner(next: CleakerCorner) {
    if (!isCorner(next)) return;
    corner = next;
    write(storage, STORE_CORNER, next);
    render();
  }

  const open = (on: boolean) => {
    panel.hidden = !on;
    qrButton.setAttribute('aria-expanded', String(on));
    if (on) { input.value = namespace ?? ''; input.focus(); }
  };
  qrButton.addEventListener('click', () => open(panel.hidden));
  form.addEventListener('submit', (e) => { e.preventDefault(); void setNamespace(input.value.trim() || null); });
  shadow.querySelectorAll<HTMLButtonElement>('[data-corner-choice]').forEach((b) => b.addEventListener('click', () => setCorner(b.dataset.cornerChoice as CleakerCorner)));
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !panel.hidden) open(false); };
  const onOutside = (e: Event) => { if (!panel.hidden && !e.composedPath().includes(host)) open(false); };
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onOutside);

  (options.container ?? document.body).append(host);
  render();
  if (namespace) void check(namespace);

  return {
    host,
    corner: () => corner,
    setCorner,
    namespace: () => namespace,
    setNamespace,
    unmount() {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      host.remove();
    },
  };
}
