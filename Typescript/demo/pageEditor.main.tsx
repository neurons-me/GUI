// pageEditor.main.tsx — Phase 3 pilot: real identity, real ownership, real
// prop editing. Composition lives as a spec in `.me`
// (apps.<appId>.pages.<pageId>), rendered inside GUI's own canonical
// Theme -> Layout -> Page composition. All the actual rendering/editing
// logic now lives in demo/shared/pageBuilder.tsx (shared with
// namespaceHome.main.tsx) — this file only supplies this demo's own minimal
// sign-in form and mounts it.
//
// Real Cleaker identity (SeedSessionProvider, sessionBackend:'cleaker')
// replaces the fixed test signer entirely. Disposable infra only — never
// the user's real account or the real gateway.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as guiFacade from '../../../../browser.ts';
import { usePageView, renderNode, selectionStore } from './shared/pageBuilder.tsx';

const { gui, guiDevtools } = guiFacade;
const { Theme, Layout, Box, Typography, RouterProvider, SeedSessionProvider, useSeedSession } = gui;
const { SelectionProvider, RuntimeInspector } = guiDevtools;

const params = new URLSearchParams(window.location.search);
const endpoint = params.get('endpoint') || 'http://127.0.0.1:8162';
const ROOT_NAMESPACE = params.get('rootNamespace') || 'gui-catalog-harness.local';
const APP_ID = 'gui';
const PAGE_ID = 'home';

function SignInPanel() {
  const seed = useSeedSession();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<'login' | 'register'>('register');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const fn = mode === 'register' ? (seed as any).registerWithCredentials : (seed as any).loginWithCredentials;
      // Explicit namespace required: this demo is a standalone Vite dev
      // server, not served behind a real netget gateway, so the provider's
      // fetchGatewayHostname() fallback (GET /me/gateway relative to THIS
      // origin) has nothing to resolve and throws "Gateway did not return
      // a hostname."
      await fn({ username, password, namespace: ROOT_NAMESPACE, transportOrigin: endpoint });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 360 }}>
      <Typography variant="subtitle2">Sign in with your real .me identity</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Disposable monad only ({endpoint}) — never your real account.
      </Typography>
      <Box component="input" placeholder="Username" value={username} onChange={(e: any) => setUsername(e.target.value)}
        sx={{ px: 1, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
      <Box component="input" type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)}
        sx={{ px: 1, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box component="button" type="button" onClick={() => setMode('register')}
          sx={{ px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: mode === 'register' ? 'primary.main' : 'divider', bgcolor: 'transparent', cursor: 'pointer' }}>
          Register
        </Box>
        <Box component="button" type="button" onClick={() => setMode('login')}
          sx={{ px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: mode === 'login' ? 'primary.main' : 'divider', bgcolor: 'transparent', cursor: 'pointer' }}>
          Sign in
        </Box>
      </Box>
      <Box component="button" type="button" disabled={busy || !username || !password} onClick={submit}
        sx={{ px: 1.5, py: 0.75, borderRadius: 1, border: 'none', bgcolor: 'primary.main', color: 'primary.contrastText', cursor: 'pointer' }}>
        {busy ? 'Working…' : mode === 'register' ? 'Register & sign in' : 'Sign in'}
      </Box>
      {error && <Typography variant="caption" sx={{ color: 'error.main' }}>{error}</Typography>}
    </Box>
  );
}

function EditorApp() {
  const seed = useSeedSession();
  const authenticated = (seed as any).authenticated as boolean;
  const { canEdit, leftBarElements, content, registry, status, dirty } = usePageView({
    endpoint,
    rootNamespace: ROOT_NAMESPACE,
    appId: APP_ID,
    pageId: PAGE_ID,
    signedOutHeader: <SignInPanel />,
  });

  return (
    <Layout
      TopBar={{ title: `Page Editor — apps.${APP_ID} (${canEdit ? 'editor' : authenticated ? 'signed in, no edit access' : 'visitor'})` }}
      LeftBar={
        canEdit
          ? {
              // Defaults to the 72px icon-only "rail" view (LeftBar.tsx) --
              // right for simple link/menu items, but CatalogPanel and
              // NodeEditorPanel are full custom panels (buttons with text,
              // a textarea), not icon links, so the rail clipped them
              // illegibly. This editor always needs the full-width view.
              initialView: 'expanded',
              elements: leftBarElements,
            }
          : false
      }
      Footer={{ brandLabel: `${status}${dirty ? ' · unsaved changes' : ''}` }}
    >
      {renderNode(content, {
        registry,
        React,
        showUnknown: true,
        // Registers every rendered node into the SAME selectionStore
        // singleton the Semantic Inspector reads (mount.ts's own pipeline
        // wires this identically — renderNode() itself never does this on
        // its own, it only tags nodes with data-gui-node-id). Without this,
        // RuntimeInspector would show nothing for this page's tree at all.
        onNodeResolved: selectionStore.actions.registerNode,
      })}
      {canEdit && <RuntimeInspector toggleVisible />}
    </Layout>
  );
}

function App() {
  return (
    <SeedSessionProvider transportOrigin={endpoint} sessionBackend="cleaker">
      <EditorApp />
    </SeedSessionProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <RouterProvider>
    <Theme>
      <SelectionProvider>
        <App />
      </SelectionProvider>
    </Theme>
  </RouterProvider>,
);
