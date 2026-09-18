// claimFlowEmbedded.main.tsx — REAL browser verification of the EMBEDDED
// claim flow specifically: GatewaySetup mounted the way CleakerNetgetView
// actually mounts it (nested inside CleakerLanding's own <Routes>, same
// origin), not the deliberately-split two-origin flow claimFlow.main.tsx
// already covers. That harness proves the cross-origin path still works;
// this one proves the SAME-origin path (this repo's real deployment
// shape) doesn't lose the signed-in session mid-claim — the exact bug
// flagged live ("escribes el código... y las siguientes pantallas te
// vuelve a sacar para hacer sign in") and fixed via UnclaimedPanel's new
// onNavigateSameOrigin (GatewaySetup.tsx) + CleakerNetgetView's own
// useNavigate() wiring (CleakerLanding.tsx).
//
// "Same origin" here means: this page (wherever Vite serves it, e.g.
// 127.0.0.1:5177) IS the origin GatewaySetup's own endpoint resolves to.
// The dev-only proxy in vite.config.js (DEMO_ROLE=claimFlowEmbedded)
// forwards /gateway-identity, /main-server-namespace, /setup/*,
// /openresty-status, /harness/* to claim-harness-server.mjs's real port
// so this page's own origin genuinely serves them, from the browser's
// point of view — the same trick nginx's admin block plays for real, just
// done by Vite instead. The disposable monad claim-harness-server.mjs
// also starts (a GENUINELY different port, reachable cross-origin with
// real CORS, same as the harness already sets up) backs
// SeedSessionProvider's own register/sign-in/keychain calls — that part
// was never same-origin in the real deployment either, and doesn't need
// to be for this fix.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import { SeedSessionProvider } from '@/react/session/SeedSessionProvider';
import CleakerLanding from '@/react/session/CleakerLanding';

const params = new URLSearchParams(window.location.search);
const harnessOrigin = params.get('harness') || window.location.origin;

function Root() {
  const [monadOrigin, setMonadOrigin] = React.useState<string | null>(params.get('monad'));
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (monadOrigin) return;
    let cancelled = false;
    fetch(`${harnessOrigin}/harness/monad-origin`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.origin) throw new Error('harness returned no origin');
        setMonadOrigin(data.origin);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [monadOrigin]);

  if (error) return <div>Could not resolve the disposable monad origin from {harnessOrigin}: {error}. Is claim-harness-server.mjs running?</div>;
  if (!monadOrigin) return <div>Resolving disposable monad origin from {harnessOrigin}…</div>;

  // cleakerEndpoint = window.location.origin (this same page) -- this is
  // what makes CleakerNetgetView's verifiedRoot.cleakerEndpoint, and
  // therefore GatewaySetup's own `endpoint`, resolve to THIS origin, the
  // one thing that actually puts the fix under test.
  return (
    <SeedSessionProvider
      transportOrigin={monadOrigin}
      sessionBackend="cleaker"
      live
    >
      <CleakerLanding netgetMonadOrigin={monadOrigin} cleakerEndpoint={window.location.origin} />
    </SeedSessionProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Theme><Root /></Theme>);
