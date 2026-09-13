// claimFlow.main.tsx — REAL browser verification harness for the netget
// <-> Cleaker keychain claim flow (the actual reconnection this session
// implements), against a REAL disposable monad + REAL netget setup-session
// backend (see backend/dev-harness/claim-harness-server.mjs). Never a
// mock: this mounts GatewaySetup/netgetSetupClient.ts and
// CleakerLanding/keychainClient.ts exactly as they ship, just without
// netget's own App.jsx/proxy.js in the loop (that app manages real
// OpenResty on `netget init` — never wanted here).
//
// Run two instances of this file's dev server on two DIFFERENT ports —
// that's what makes ?role=netget and ?role=cleaker genuinely separate
// browser origins (distinct localStorage, distinct in-memory unlock
// cache), the exact real-world constraint this flow exists to cross.
// The harness server (dev-harness/claim-harness-server.mjs) is a THIRD
// process, holding the one disposable monad both origins talk to.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import GatewaySetup from '@/gui/All.This/netget/Setup/GatewaySetup';
import { createNetgetSetupClient } from '@/gui/All.This/netget/Setup/netgetSetupClient';
import { SeedSessionProvider } from '@/react/session/SeedSessionProvider';
import CleakerLanding from '@/react/session/CleakerLanding';

const params = new URLSearchParams(window.location.search);
// The real deployment infers role from HOST (local.cleaker vs local.netget),
// not a query param -- this demo has no such distinct hostnames, so it
// infers the same thing from the shape of the URL netgetSetupClient.ts's
// resolveCleakerClaimUrl actually builds (gatewayId+challenge+returnTo),
// exactly what a real redirect to the Cleaker-origin view carries. The
// admin-sign redirect (LogsView.tsx's handleSignIn) carries a different
// shape (returnTo+state, no gatewayId/challenge -- that challenge is
// fetched BY the Cleaker-role page itself, cross-origin, once it knows
// who's signing in) -- but the actual browser path is always
// "/keychain/admin-sign" for that flow, same as "/keychain/claim" for
// the claim flow, and the dev-server SPA fallback preserves that real
// pathname even though it serves claimFlow.html's content for it (see
// vite.config.js's demo-claim-flow-spa-fallback plugin) -- so checking
// the actual path is a strictly more reliable signal than guessing from
// query shape, and covers both flows with one check.
const looksLikeClaimRedirect = window.location.pathname.startsWith('/keychain/');
const role = params.get('role') || (looksLikeClaimRedirect ? 'cleaker' : 'netget');

function NetgetRole() {
  const endpoint = params.get('endpoint') || 'http://127.0.0.1:4601';
  const client = React.useMemo(() => createNetgetSetupClient(endpoint), [endpoint]);
  return (
    <GatewaySetup
      endpoint={endpoint}
      onSubmitSetupCode={client.onSubmitSetupCode}
      resolveCleakerClaimUrl={client.resolveCleakerClaimUrl}
      onCommitClaim={client.onCommitClaim}
    />
  );
}

function CleakerRole() {
  // No ?monad= param on the FIRST landing at /keychain/claim -- that
  // redirect URL is built by netgetSetupClient.ts's resolveCleakerClaimUrl
  // (real production code, unaware of this demo's two-role split), which
  // only ever appends gatewayId/challenge/returnTo. Rather than guessing
  // that origin (a hardcoded default silently goes stale the moment the
  // harness lands on a different port -- and after 2026-09-10's finding
  // that a "disposable" monad can silently resolve to the real ambient
  // one, guessing is actively unsafe, not just inconvenient), ask the
  // harness itself -- the one process that actually knows, because it
  // just isolation-checked its own origin before serving anything.
  // `VITE_HARNESS_ORIGIN` (Vite exposes any VITE_-prefixed env var to
  // client code natively) lets a different harness -- e.g.
  // logs-harness-server.mjs on a different port -- be the default
  // without a `?harness=` param on every redirect URL the OTHER role's
  // page constructs (LogsView.tsx's handleSignIn has no reason to know
  // this demo-only concept exists, so it never adds one).
  const harnessOrigin = params.get('harness') || import.meta.env.VITE_HARNESS_ORIGIN || 'http://127.0.0.1:4601';
  const [netgetMonadOrigin, setNetgetMonadOrigin] = React.useState<string | null>(params.get('monad'));
  const [resolveError, setResolveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (netgetMonadOrigin) return;
    let cancelled = false;
    fetch(`${harnessOrigin}/harness/monad-origin`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.origin) throw new Error('harness returned no origin');
        setNetgetMonadOrigin(data.origin);
      })
      .catch((e) => {
        if (!cancelled) setResolveError(e instanceof Error ? e.message : String(e));
      });
    return () => { cancelled = true; };
  }, [harnessOrigin, netgetMonadOrigin]);

  if (resolveError) {
    return <div>Could not resolve the disposable monad origin from the harness at {harnessOrigin}: {resolveError}. Is claim-harness-server.mjs running?</div>;
  }
  if (!netgetMonadOrigin) {
    return <div>Resolving disposable monad origin from the harness at {harnessOrigin}…</div>;
  }

  // Pinned explicitly, and MUST equal the disposable monad's own
  // configured root namespace (claim-harness-server.mjs never sets
  // NETGET_MONAD_NAMESPACE, so that root is 'local.cleaker' -- see
  // netgetMonadProcess.ts's UNCONFIGURED_DEFAULT_NAMESPACE). Pinning
  // this to anything else silently breaks storage: monad.ai's
  // namespaceToKernelPrefix() only derives a per-user "users.<handle>"
  // prefix when a claim's root matches the monad's OWN root -- a
  // mismatched root (e.g. the default "cleaker.me") falls through to
  // NO prefix at all, so every such claim collides on the same
  // unprefixed kernel path instead of getting its own storage. Also
  // fixes the namespace root staying IDENTICAL across every page load
  // of this demo, independent of that bug -- CleakerLandingHome's root
  // toggle otherwise has its own state, and a page freshly loaded after
  // navigating away and back must resolve the exact same root a prior
  // page load in this same session claimed under.
  return (
    <SeedSessionProvider transportOrigin={netgetMonadOrigin} sessionBackend="cleaker">
      <CleakerLanding netgetMonadOrigin={netgetMonadOrigin} cleakerEndpoint="http://local.cleaker" />
    </SeedSessionProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <Theme>
    {role === 'cleaker' ? <CleakerRole /> : <NetgetRole />}
  </Theme>,
);
