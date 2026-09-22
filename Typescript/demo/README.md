# Demo pilots — disposable infra only, never the real gateway

Each entry below is a real, working Vite demo, not a mock. All of them talk
to disposable monads/harnesses started separately (see each file's own
header comment for exact launch commands) — never `local.cleaker` or any
real ambient gateway.

- **`namespaceHome.main.tsx`** (+ `namespaceHome.html`, `shared/pageBuilder.tsx`)
  — the main, currently-active pilot. Mounts the real `CleakerLanding` at
  `/`, unmodified, plus a `Netget → Apps → app → page` route tree using the
  real `GatewaySetup`/`MainServerView`/`LogsView` components (previously
  Storybook-only) and a real signed-commit page editor. See the file's own
  top comment for the full route map and explicitly-known pending gaps
  (seeded `apps.json`, fixed page list, domains unwired). Launched via
  `dev-harness/gui-catalog-harness-server.mts` (content/identity monad) +
  `modules/netget/Typescript/.../dev-harness/netget-gateway-harness-server.mjs`
  (real Netget backend, no monad of its own).
- **`pageEditor.main.tsx`** — the page editor in isolation (own minimal
  sign-in form), sharing `shared/pageBuilder.tsx`'s `usePageView` core with
  `namespaceHome.main.tsx`. Useful for iterating on the editor without the
  rest of the Netget navigation.
- **`claimFlow.main.tsx`** (+ `claimFlow.html`) — the real, redirect-based
  cross-origin gateway-claim signing flow (`CleakerNetgetClaimView`),
  proven end-to-end against
  `modules/netget/Typescript/.../dev-harness/claim-harness-server.mjs`.
  Two-port (Cleaker role + netget role) by design, unlike `namespaceHome`'s
  single-origin setup.
- **`logsFlow.main.tsx`** (+ `logsFlow.html`) — the real `LogsView` +
  admin-session sign-in flow in isolation, against
  `.../dev-harness/logs-harness-server.mjs`.
- **`catalog.main.tsx`** (+ `catalog.html`) — the GUI component
  catalog/library browser, against `dev-harness/gui-catalog-harness-server.mts`.
- **`main.tsx`** (+ `index.html`) — the default/original demo entry
  (pre-dates the pilots above).

None of this is deployed anywhere; each is a Vite dev-server target
(`vite.config.js`'s `DEMO`/`DEMO_ROLE` env vars pick which one gets served)
against disposable, throwaway state.
