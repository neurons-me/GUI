# Namespace

How a page shows a namespace: the three cases, when a page **is** the namespace, and what a real door must answer for
that to be true. The operator `namespace @ surface` itself is the protocol's
([NRP · Surface and Overlay](https://neurons-me.github.io/NRP/Surface-and-Overlay.html)); the namespace grammar is
cleaker's. This document is the GUI's side of it: `Namespace.tsx`, `AppShell`, and Cleaker on any page.

---

## Two channels

A page has two independent facts:

| Channel | What it is | Where it comes from |
| --- | --- | --- |
| **surface** | where the page was loaded from (scheme, host, port) | `window.location` — a physical fact |
| **namespace** | which `.me` the page is reading | what a monad **answered** — never guessed from the address |

They are written together as `namespace/path @ surface`. The surface is dropped (`namespace` alone) only when the page
is **bound** to the namespace (below).

## The three cases

| Case | The page | What renders | Implementation |
| --- | --- | --- | --- |
| 1 · namespace only | the namespace's own door (`cleaker.me/`) | the shell; `/` is the QR (Landing); the namespace's routes render in the content area | `Namespace.tsx` (`GUI.document.json`: `content.landing`, `route: "/"`) |
| 2 · site with .GUI | an app built with .GUI (`netget.site`) | the app's own views and brand; the person's QR in their corner; the namespace's routes open over the app's view | `AppShell` |
| 3 · site without .GUI | any page (`fulltrailer.com.mx`, a gateway page) | the page as written; Cleaker's bars and QR on top; the namespace's routes open over the page | `mountCleakerGui` (`CleakerCornerGui.tsx`); the published `cleaker.js` is still the older vanilla `mountCleaker` |

The brand of an app (case 2) appears only on that app's door, never on the namespace's own page.

## When a page *is* the namespace (bound)

The page is bound to namespace `N` when **all** of these hold (`isBoundToPage` in `src/react/positionExpression.ts`):

1. a transport was **confirmed** — its `/__surface` answered and passed the check (`probeCleakerRoot`), and the
   **latest** attempt did not fail;
2. that transport's origin **is the page's origin**, exactly (scheme, host and port);
3. what it answered for (`target.namespace.me`) is `N`, or `N` is a handle under it (`ana.N`).

What the door answered decides the name, not the host. A page at `localhost:6006` whose own door answers `namespace` is
the namespace `namespace`; a page at `fulltrailer.com.mx` whose monad answers `fulltrailer.suis-macbook-air.local` is that
namespace. Two hosts that look alike, another port, `www.`, a handle under a host: none is bound until checked. The
check is what the origin says about itself, not proof of authority over the namespace.

What is drawn:

| State | Drawn |
| --- | --- |
| nothing has answered yet | the surface only (`localhost:6006`), or "resolving…" — a namespace is not guessed from the address (`namespaceSource="address"`) |
| answered, bound | `namespace` |
| answered, not bound (read through another origin) | `namespace @ surface` |
| the latest attempt failed | `namespace @ surface` (an older confirmation is kept for the rest of the app, but it does not abbreviate) |

## The load sequence

1. **Seed.** `pickRootTransport` chooses where to ask: the page's own origin when the page is a door of the namespace,
   otherwise the resolved endpoint. A story or test may give its own fetch (`ConnectionSeams.fetchImpl`); production
   passes none.
2. **Check.** `GET <origin>/__surface` (direct), falling back to `<origin>/apps/netget/__surface`; in parallel
   `GET <origin>/gateway-identity`.
3. **Confirm.** On success, what is recorded as confirmed is the namespace the transport **answered**, not the label
   the request was addressed with (`bindingFactsAfter`).
4. **Channel.** The QR opens the NRP channel (`wss://<host>/nrp`). When it resolves the namespace locally, the root is
   re-checked **at the transport that already answered for it** — never at `https://<name>` built from the name
   (`handleBeatleNamespaceResolved`).
5. **Re-check.** Re-asking the same transport about a namespace it already confirmed keeps the binding while the
   answer comes (`keepsBindingDuringRecheck`); only a failed answer drops it. No `namespace @ surface` flicker.

## What a real door must answer

For case 1 at origin `O` (e.g. `https://cleaker.me`), with nothing simulated:

| Request at `O` | Expected | Served by |
| --- | --- | --- |
| `GET /` with `Accept: text/html` | the GUI interface (HTML), not a monad page | nginx (the release's interface `dist`) |
| `GET /` without it | the namespace root as JSON (`target.namespace.me`) | the monad (same URL, content negotiation) |
| `GET /__surface` (or `/apps/netget/__surface`) | JSON with a monad id (`monadId`), at least one resource (`surfaceEntry.resources`), and `target.namespace.me` = the namespace | the monad, through the gateway |
| `GET /gateway-identity` | JSON with `gatewayId` | netget |
| `wss://<host>/nrp` | the NRP channel opens and resolves the namespace | the monad |

The monad must answer at `O` itself. If it is only reachable at another origin, the page is not bound and shows
`namespace @ surface` — correct, but not case 1.

## Verifying a door

Against the real door (never the Storybook simulation):

```bash
curl -s -H 'Accept: text/html' https://cleaker.me/ | head -c 200   # HTML of the interface (as a browser asks)
curl -s https://cleaker.me/__surface | jq '{monadId, ns: .target.namespace.me, resources: .surfaceEntry.resources}'
curl -s https://cleaker.me/gateway-identity | jq '{gatewayId}'
```

Then open `https://cleaker.me/` in a browser:

- the top bar and the label under the QR say `cleaker.me`, with no `@`;
- the QR is connected (not grey, not red);
- the full form (`data-position-expression` on the label) is `cleaker.me @ "https://cleaker.me"`;
- reloading never shows `cleaker.me @ cleaker.me` in between.

**Status (2026-11-09).** The three `curl` checks pass at `https://cleaker.me` (interface HTML, `/__surface` answering
`cleaker.me` with a monad id and resources, `/gateway-identity` with a `gatewayId`). The interface deployed there
(release r20261108-3) predates the binding fixes described in *The load sequence* (steps 3–5); the browser checks are
expected to hold once a release carries them.

## The Storybook story is a simulation

`Getting Started / Namespace / 1 · Namespace only (simulated door)` runs at `localhost:6006`, which serves no
namespace. `src/stories/demoNamespaceDoor.ts` stands in for a door at the page's own origin: it answers `/__surface` as
the namespace `namespace`, `/gateway-identity`, claim and sign-in, and the `/nrp` channel. The rule is the real one;
the door is not. It shows what case 1 looks like. It proves nothing about any deployed door: that is what the
verification above is for.

## Code

| Piece | File |
| --- | --- |
| the position rule (`bound`, compact/full forms, which namespace is named) | `src/react/positionExpression.ts` |
| root verification, binding facts, same-door re-check | `src/react/session/verifiedCleakerRoot.ts` |
| case 1 shell, local resolution | `src/react/session/Namespace.tsx` |
| case 2 | `src/runtime/AppShell.tsx` |
| case 3 | `src/gui/All.This/Cleaker/Corner/CleakerCornerGui.tsx` |
| tests | `tests/positionExpression.test.ts`, `tests/rootTransport.test.ts` |
