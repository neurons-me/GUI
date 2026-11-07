// `cleaker.js`: one line puts Cleaker in a corner of any page (level 1), and its bars unfold from it (level 2).
// No React, no runtime, no theme.
//
//   <script src="…/cleaker.js" data-corner="bottom-right"></script>
//   <script src="…/cleaker.js" data-corner="top-left" data-namespace="neurons-me.github.io"></script>
//   <script src="…/cleaker.js" data-document="/gui.document.json"></script>
//   <script type="application/json" data-cleaker-document>{ "bars": { "left": { "children": { … } } } }</script>
//
// data-corner: the author's default corner (the person's own choice, once made, wins). data-namespace: the namespace
// shown until the person chooses one (default cleaker.me, so nothing needs setting up; data-namespace="" starts with
// none). The bars: an inline `<script type="application/json" data-cleaker-document>` on the page, or a document at
// data-document (fetched without credentials). `data-cleaker-manual` skips the automatic mount;
// `window.Cleaker.mount(options)` mounts by hand.
import { mountCleaker, type CleakerCorner, type CleakerHandle } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';

const script = document.currentScript as HTMLScriptElement | null;
let mounted: CleakerHandle | null = null;

function inlineDocument(): unknown {
  const node = document.querySelector('script[type="application/json"][data-cleaker-document]');
  if (!node?.textContent) return undefined;
  try { return JSON.parse(node.textContent); } catch { return undefined; }
}

function mountFromScript() {
  if (mounted || !script || script.hasAttribute('data-cleaker-manual')) return;
  mounted = mountCleaker({
    corner: (script.dataset.corner as CleakerCorner) || undefined,
    namespace: script.hasAttribute('data-namespace') ? script.dataset.namespace || null : undefined,
    document: inlineDocument(),
  });
  const url = script.dataset.document;
  if (url) {
    const handle = mounted;
    fetch(new URL(url, document.baseURI).href, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => { if (doc) handle.setDocument(doc); })
      .catch(() => { /* no bars: the corner works the same */ });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountFromScript);
else mountFromScript();

(window as unknown as { Cleaker: unknown }).Cleaker = { mount: mountCleaker, current: () => mounted };
