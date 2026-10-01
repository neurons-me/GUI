---
title: this.gui v5.0.0 — Cleaker becomes the one public identity entry point
published: false
tags: react, opensource, javascript, identity
---

`this.gui` — the **Generative User Interface** library behind the `.me`/Cleaker/Netget stack — is shipping a breaking change to its public `Cleaker` export, plus the removal of one other published component. This is a proposed major version bump (`4.0.0` → `5.0.0`); the version number in `package.json` has not been changed as part of this work — that's a maintainer decision at publish time, not something decided here.

## What changed

### `Cleaker`'s prop shape is completely different — this is the breaking change

Before:
```tsx
<Cleaker username? namespace? namespaceOrigin? me? maxWidth? />
```
Now:
```tsx
<Cleaker me={me} />
```
`Cleaker` is now a thin, ~100-line wrapper: it derives a destination (`cleakerEndpoint`) from `me`'s own `profile.rootNamespace` (falling back to the literal default `'cleaker.me'`), wires up a real `SeedSessionProvider`, and renders the real production identity shell (`Namespace.tsx`, already used elsewhere) inside it. `me` is read exactly once, synchronously, at render time — it is never "logged in", never kept live, never read again after that one derivation. The old component's own register modal, mesh-pairing UI, and direct kernel-path reactivity are gone (see below). New optional pass-through props: `transportOrigin`, `resolveSeedFromCredentials`, `document`, `pages`, `footerExtras`, `sx`.

**Migration**: if you were calling `<Cleaker username={...} namespace={...} namespaceOrigin={...} />`, construct a `.me` kernel with that namespace instead (`new ME(username, secret, { namespace: root })`, the same shape `createCleakerSession.ts` already uses) and pass it as `<Cleaker me={that} />`. If you were relying on the old component's own self-contained register/profile UI, that UI now lives inside `Namespace.tsx`'s `Landing` page (`CleakerIdentityCard`), reached automatically through the new `Cleaker`.

### `CleakerComposer` is removed entirely — no replacement, no deprecation period

`CleakerComposer` (and its registry resolver) is deleted outright, not deprecated. It was already flagged legacy in this codebase's own history, had zero real external consumers (confirmed by grep across the whole monorepo — its only consumers were this package's own dev entry point and one internal component it existed solely to keep alive), and its one real job — being *a* app-shell entry point — is now `Cleaker`'s own job.

**Migration**: replace `<CleakerComposer endpoint={...} />` with `<Cleaker me={...} transportOrigin={...} />`.

### Two capabilities that existed only inside the old `Cleaker.tsx` are gone, not ported

1. **Mesh-pairing QR claim flow** (`GeneratePairingQR`, the `useCleakerMeshPairing` hook, `ClaimSurface`, `meshPairing.ts`) — deleted outright. None of these were ever exported from this package's published root or any other public entry point, so this is **not** a break to the published surface, just an internal implementation detail going away. Investigated before deleting: it had no real network transport (no server call anywhere in it — "scanning" a QR was simulated via a browser event or URL param, never an actual camera), and its claim token was an unsigned, client-only string checked only against local state. Zero consumers anywhere in the monorepo besides the old component itself.
2. **PIN-based access-grant mount** (`<AccessRequestHandler/>`) — no longer mounted by the new `Cleaker`. The four session-primitive functions it sat alongside (`claimCleakerNamespace`, `openCleakerSession`, `logoutCleakerSession`, `resolveSession`, exported as `resolveCleakerSession`), plus `requestAccess`/`PinVerificationModal`/`AccessConfirmationModal`/`AccessRequestHandler` themselves, are **kept, still exported, marked `@deprecated`** in their own doc comments — not removed, since they are part of the published root and "no internal consumer" doesn't rule out an external one. Investigation found the PIN-verification step was already unreachable before this change (nothing ever registered a PIN handler with its UI bridge), and the whole `requestAccess()` orchestrator has zero callers anywhere in this monorepo today. Removing the mount does not change `requestAccess()`'s own fail-closed behavior — verified directly against its source: with no UI registered at all, it now fails even earlier (at its confirmation step) than it did before, never later, and never by silently granting access.

### `CleakerQR` — unchanged in this release

Still exported, still works exactly as before. A separate, later piece of this same effort migrates its one real production consumer (`MeLauncher.tsx`'s sidebar session bubble) to the shared `QR.me` primitive — that migration is tracked separately and is not part of this release's breaking changes.

## Why this is a major version, not a patch

`Cleaker`'s entire public prop contract changed, and `CleakerComposer` disappeared. Both are real breaks for anyone importing either by name from `this.gui`'s published root — this could not ship as a minor or patch release.

## Migrating

```bash
npm install this.gui@5
```

If you're not ready to move, pin `this.gui@^4.0.0` — it still has the old `Cleaker`/`CleakerComposer` shapes, mesh-pairing UI, and the PIN-access mount, unchanged.
