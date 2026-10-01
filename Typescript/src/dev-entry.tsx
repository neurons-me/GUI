// dev-entry.tsx — Vite dev server entry point.
// Reads the monad providerBoot injected by the server and mounts the GUI.
// This file is ONLY used in dev mode (never bundled into the UMD).

import { mount } from './runtime/mount';
import type { NamespaceProviderBoot } from './runtime/provider';

declare global {
  interface Window {
    __MONAD_NAMESPACE_PROVIDER_BOOT__?: NamespaceProviderBoot;
    __MONAD_CREATE_NAMESPACE_PROVIDER__?: (gui: any) => any;
    Me?: any;
    GUI?: any;
  }
}

async function boot() {
  const root = document.getElementById('root');
  if (!root) throw new Error('[dev-entry] #root not found');

  // Wait for providerBoot to be injected by the monad shell
  const boot = window.__MONAD_NAMESPACE_PROVIDER_BOOT__;

  let me = null;
  if (window.Me) {
    me = new window.Me();
  }

  // Dynamically import the full GUI (tree-shakeable, not UMD)
  const { default: GUI } = await import('./GUI');

  (window as any).GUI = GUI;
  (window as any).ThisGUI = GUI;

  if (boot && window.__MONAD_CREATE_NAMESPACE_PROVIDER__) {
    window.__MONAD_CREATE_NAMESPACE_PROVIDER__(GUI);
  }

  await mount(
    { type: 'Cleaker', props: { me, transportOrigin: boot?.apiOrigin || undefined } },
    root,
    { gui: GUI, me, showUnknown: true },
  );
}

boot().catch(err => {
  console.error('[dev-entry] boot failed:', err);
});
