// `cleaker.js`: one line puts Cleaker in a corner of any page (level 1). No React, no runtime, no theme.
//
//   <script src="…/cleaker.js" data-corner="bottom-right"></script>
//   <script src="…/cleaker.js" data-corner="top-left" data-namespace="neurons-me.github.io"></script>
//
// data-corner: the author's default corner (the person's own choice, once made, wins). data-namespace: a suggested
// namespace, shown until the person chooses one (default: none). `data-cleaker-manual` skips the automatic mount;
// `window.Cleaker.mount(options)` mounts by hand.
import { mountCleaker, type CleakerCorner, type CleakerHandle } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';

const script = document.currentScript as HTMLScriptElement | null;
let mounted: CleakerHandle | null = null;

function mountFromScript() {
  if (mounted || !script || script.hasAttribute('data-cleaker-manual')) return;
  mounted = mountCleaker({
    corner: (script.dataset.corner as CleakerCorner) || undefined,
    namespace: script.dataset.namespace || null,
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountFromScript);
else mountFromScript();

(window as unknown as { Cleaker: unknown }).Cleaker = { mount: mountCleaker, current: () => mounted };
