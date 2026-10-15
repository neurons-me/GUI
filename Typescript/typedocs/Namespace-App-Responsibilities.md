# Namespace / App — responsibility inventory

Status: inventory only, 2026-10-14. No code moved, no component names fixed. Line numbers are `feat/rail-beetle-icon` @ `f85468a0`.

## Vocabulary used here (agreed with the owner)

- **Namespace**: the space you point at (`wildcard.wildcard`). Not the session and not the identity.
- **Link (vínculo)**: connects a namespace to a transport and, when it applies, to an identity and its credentials. An app can hold several at once; selecting one must not replace the others.
- **App / shell**: decides the experience (pages, navigation, where the identity card is shown, `/.me`).
- **Surface / content**: the URL being shown. It is a separate channel from the namespace and may use nothing of `.me`. `ns/path @ surface` keeps the two paths independent; neither is projected onto the other automatically.

## The four groups

| Group | What it is | Where it lives today |
|---|---|---|
| **P** Presentation + navigation | pages, rail, topbar, routes, card placement, `/.me`, Welcome | `Namespace.tsx` `GUI` (1354–1822), `CleakerRoutes` (1913), `GUI.document.json`, `AppShell.tsx`, `positionExpression.ts` (label only) |
| **L** Link management | namespace + transport, which link is selected, is the transport answering for it, what layer is down | `Cleaker.tsx` (parse namespace, `namespaceAddress`), `Namespace.tsx` `rootSeed` / `verifiedRoot` / `selectedNamespace` / `doorLayers`, `verifiedCleakerRoot.ts`, `doorLayers.ts`, `doorKernel.ts`, `remoteRoot.ts` |
| **I** Identity + credentials | session, seed from credentials, login, register, recover, link existing identity, keychain, claim | `SeedSessionProvider.tsx` (1200 lines), `RecoverAccount.tsx`, `Claim/*`, `QRConnect.tsx` (ops), `CleakerKeychainView` (502), `MeLauncher.tsx` |
| **R** NRP resolution | expressions and what they mean: namespace grammar, overlay, answered namespace, sidebar read from the namespace tree | `positionExpression.ts` (grammar/binding), `cleakerNavigationComposition.ts` `useCleakerRootSidebar`, `verifiedCleakerRoot.ts` (answered namespace), `cleakerNamespaceExpression` parsing in `Cleaker.tsx` |

## Per file

### `Cleaker.tsx` (133)
- L: parses `namespace` prop, derives `cleakerEndpoint` from `transport` + page origin.
- I: mounts exactly ONE `SeedSessionProvider`.
- P: renders `<Namespace …>`.
- It builds one link and one session in the same breath.

### `Namespace.tsx` (1958) — mixed
| Lines | What | Group |
|---|---|---|
| 131, 178 | `getNetgetMonadOrigin`, `cleakerEndpointForNamespace` | L |
| 227 | `ThemeKernelMirror` — theme mirrored into the session kernel | P↔I coupling |
| 282 | `CleakerTopSearch` | P |
| 349, 381, 421 | Users / Blockchain / Url views | P (read via L) |
| 502 | Keychain view | I |
| 662–1350 | netget Claim, AdminSign, Netget views (~700 lines) | **belongs to the netget app, not to Namespace or generic shell** |
| 1354–~1470 | `rootSeed` (one-time seed from `window.location`), `verifiedRoot`, `doorLayers`, `selectedNamespace`, `shownNamespace`, `positionComposed` | L + R |
| ~1555 | `useCleakerRootSidebar` | R → P |
| ~1590–1640 | route table from `GUI.document.json`, door gating | P (+L) |
| ~1650–1740 | position badge, topbar-left Home + label, `/.me` | P |
| 1913–1956 | `CleakerRoutes`, `WithMe` | P |

### `QRConnect.tsx` (942)
- P: the card (QR, label, forms).
- L: `namespaceOverride`, `cardNamespace()` (selected → answered → declared/address).
- I: Claim / Link / Recover / sign-in operations, gated by `namespaceReady`.
- Presentation and the operations of one link are in the same component.

### `AppShell.tsx` (165)
- P: `Theme`, `Layout`, rail nav, launchers, `RuntimeInspector`.
- Navigation state is the `.me` value `${app.namespace}.route`; `window.location.pathname` is read only once at mount. Cleaker navigates with react-router (URL). **Two navigation mechanisms.**
- Mounts `MeLauncher`, which uses the session context, so AppShell already depends on I; it just does not create the session.
- Holds no link of its own.

## Findings

1. **One link per page is structural.** `Cleaker` → one `SeedSessionProvider`; `rootSeed` is "a one-time seed, not a live binding"; one `useVerifiedCleakerRoot`. `selectedNamespace` only retargets the card label. The two-links live test (16/16) passes at the session-client level (two monads), not through the component tree: an app holding two links at once is not expressible in these components today.
2. **The surface is read from `window.location` in three places** (`rootSeed`, `doorLayers`, `positionComposed`). That is fine when the app is its own content; for "namespace environment around external content" the surface must be an input, not a global.
3. **`semanticPath` is already explicit** (`props.semanticPath`, never the pathname; comment at ~1445). Consistent with "no pathname becomes a semantic path automatically".
4. **`/.me` and Welcome are defined in the generic shell** (`GUI.document.json` + `Namespace.tsx`). They are presentation. Whether the shell offers them is the app's decision, not a Namespace property.
5. **Netget-specific pages sit in the generic file** (662–1350). They are neither Namespace nor shell.
6. **Theme is mirrored into the session kernel** (`ThemeKernelMirror`): a presentation concern writing through the identity layer.

## Proposed order (no names fixed)

1. **Done 2026-10-14** (`src/react/link.ts`, `tests/link.test.ts`, values only, no component uses it yet): Link (target + verification for that target), Session (per link), Context (links + selection + sessions), Location and Surface (two independent paths). Verification distinguishes `answered` (capability) from `authorized` (evidence held independently); today's probes produce at most `answered`. A reading carries the target it was made for, so a late answer for an old target does not confirm a new one. Selection belongs to the context, not to a link.
2. (not yet) Make the surface an input instead of `window.location`.
3. Move the netget pages out of `Namespace.tsx` into netget's own document/pages (props `pages` already supports it).
4. Only then decide how `Cleaker` and `AppShell` compose.

Not in scope: renaming components, moving `/.me`, URL reflection of the selection (pending owner decision).

## Status 2026-10-14 (step 3, partial)

- `tests/integration/links.browser.test.mjs` runs the conditions against the real `<Cleaker>` in Chromium with fake
  monads at the network layer (23 checks). It was red first (10/20): the card could not select another link while a
  session was open because `SeedSessionProvider` held ONE snapshot and `QRConnect` set `editableRoot={!authenticated}`.
- `SeedSessionProvider` now keeps a snapshot, status and error PER LINK (`targetKey`), exposes `openLinks`,
  `selectedLinkId`, `selectLink`; an operation commits to the link it was started for (a late reply lands on its own
  link). With nothing selected the view follows the link that most recently opened (what a single link always did).
- Still true: ONE provider and one shell per `<Cleaker>`; the shell's `verifiedRoot` and `doorLayers` are still those of
  the page's own link. Not done: the surface as an input, netget pages out of `Namespace.tsx`, Cleaker/AppShell
  composition, URL reflection of the selection.
