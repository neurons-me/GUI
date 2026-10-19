# Agent context — this.gui

Agent context for the monorepo as a whole lives in `all.this/AGENTS.md` — read
that one first for the mesh/NRP argument and cross-package state. This file is
the GUI-specific counterpart: what this package *is*, how it's put together
internally, and the landmines specific to it. `CLAUDE.md` (repo root) has the
authoritative build/dev commands — this file does not repeat them.

If you only have this repo checked out standalone (not nested inside
`all.this`), find the parent at the `all.this` repo under the `neurons-me`
GitHub org.

## What this.gui is

`this.gui` ("Generative User Interfaces") is a React component library with
**two authoring paths that share one component surface**:

1. **React-first (JSX)** — import components and compose them directly, like
   any component library. This is the path most app code should use.
2. **Declarative (spec tree)** — build a `GuiSpecNode` (`{ type, props,
   children, provenance }`, plain data, not a React element) and hand it to
   `renderNode()` / `mount()` / `SpecBoundary`. This is the path for
   LLM-generated UI, data-driven admin panels, and anything that needs the
   Semantic Inspector to see every node. `type` can be a string (resolved
   against a registry) or a real component reference.

Both paths render the *same* underlying components — a spec node with
`type: 'Button'` and a `<Button>` JSX element end up rendering the same
`Button.tsx`. What differs is who builds the tree and whether nodes get
registered for inspection.

Composition contract (see `README.md` for the full walkthrough):

```
Theme → Layout → view
```

`Theme` is the visual environment (tokens, mode). `Layout` is the chrome —
`TopBar` / `LeftBar` / `RightBar` / `Footer`. Your view fills the content
area. Components are organized **atoms → molecules → compounds**: primitives
compose into patterns, patterns compose into features.

## Package surface (subpath exports)

Each subpath is a separate Vite lib entry (see `vite.config.js`, `entry: {...}`)
with its own ES + CJS output — importing one does not pull in the others.

| Entry | Source | What it gives you |
|---|---|---|
| `this.gui` | `index.ts` | `Theme`, `Layout`, `ThemeLauncher`, and most top-level components (explicit exports only — see rule below) |
| `this.gui/atoms` | `src/gui/Atoms/atoms.ts` | Primitives — `Box`, `Button`, `Typography`, `Icon`, … |
| `this.gui/molecules` | `src/gui/Molecules/molecules.ts` | Compositions — `Hero`, `Stack`, `Page`, … |
| `this.gui/compounds` (alias `/components`) | `src/gui/Compounds/compounds.ts` | Feature panels built from molecules |
| `this.gui/react` | `src/react-entry.ts` | `.me` bridge — `Me`, `useMeValue`, `useMeAction` |
| `this.gui/runtime` | `src/runtime-entry.ts` | `mount`, `mountApp`, `declareApp`, `createMeRuntime`, `writeMeValue`/`readMeValue`, `renderNode` |
| `this.gui/devtools` | `src/devtools-entry.ts` | Semantic Inspector / admin view, opt-in only |
| `this.gui/cleaker` | `src/cleaker-entry.ts` | Framework-free X-Me-Proof signing (`signedRequest`, `deriveCleakerNode`, `fetchGatewayHostname`) |
| `this.gui/legacy` | `src/legacy/index.tsx` | UMD/global compatibility facade |
| `this.gui/style.css` | `dist/styles.css` | Compiled stylesheet |

**`<Me>` and `<Cleaker>`** (`src/react/Me.tsx`, `gui/All.This/Cleaker/Cleaker.tsx`): `<Me>` is a local runtime, the one provider of the page's `.me`: `<Me username="sui">` makes a local kernel carrying only the declared handle (no secret, no session; `username` is context, not proof of who is here), `<Me me={kernel}>` provides an existing one, `<Me me={null}>` provides nothing (what sits above passes through), and `me` together with `username` throws. It draws nothing and knows no namespace. `<Cleaker namespace="cleaker.me" transport="…">` is a LINK from that `.me` to one namespace (the same `.me` can be linked to several): it finds the `.me` with `useOptionalMe()`, reads its handle (`readMeUsername`; `src/react/meIdentity.ts` is the only code that knows that profile path) and pre-fills the sign-in form with it, naming `ana.<namespace>`. No `.me` above it, or no `namespace`, renders a plain message; an unparsable namespace throws. `transport` is where the namespace is reached when that is not where its name or this page's host says (netget's gateway page); see `src/react/namespaceAddress.ts`. Each link opens its own session kernel (`SeedSessionProvider`) with its own credentials; a runtime shared across links is not built. Links under one `<Me>` list the identities they hold (`core/session/heldIdentities.ts`, keyed by the `.me`; by identity, no order, nothing is "the latest"; the root stays module-private). `linkExistingIdentity` (form: `Claim/LinkIdentity.tsx`, "Use my identity from another link") claims a name in THIS namespace with an identity another open link holds: the same identity signs a proof for this claim and this namespace (a proof issued for another link is never reused), no new identity, no phrase, `IDENTITY_NOT_HELD` otherwise. The identity can then sit in several local vaults, each sealed under its own unlock secret. The same public key is visible in every ledger it is linked to, so those links are correlatable by it; separate identities do not share a key, which does not by itself make them uncorrelatable by other data. The root is kept out of the public API of the registry (module-private); that is not isolation against code running in the same process. It is separate from Register, which always creates. Tests: `tests/link-existing.live.test.ts`, stories `TwoLinks` / `IndependentLinks`. Reading by address: `readAddress(context, "me://ana.a-test.local:read/battery")` (`core/session/addressRead.ts`, also `useSeedSession().readAddress`) parses the expression with cleaker's `parseTarget` and reads through the open link of THAT context whose root serves the namespace (exact name, else a single candidate, else candidates on one transport, else `ambiguous` and `via` decides; never "the last one", never another context's links). The answer keeps `public | sealed | closed | absent | no_link | ambiguous | invalid_expression | error` apart. The read is anonymous (no proof); what readers can open differs only by keys (envelopes). No discovery of who serves a root: `no_link`. A value under a secret scope reads as the literal `***` with disclosure public; only the scope root is `closed`. Test: `tests/addressed-reads.live.test.ts`. `me://self:read/<path>` (or `local`) reads the context's own `.me` in place through its restricted handle `kernel.as(null)` (a read with no scope: a secret scope reads as nothing, derived values are answered by the kernel itself; no copy, no snapshot; `withScope` is deprecated and does not restrict; a kernel without `as` is not read at all); local facts are not authenticated. Reactivity: `subscribeAddress` / `useAddress(expression)` follow a `self` address through the local runtime; the kernel has no change event, so only writes made through the runtime (`useMeAction`, `runtime.action`) or announced with `runtime.notify()` are noticed, a direct `kernel.x(v)` is not; ledger addresses are not pushed (`live: false`). `createMeRuntime` uses only an explicit `subscribe` bridge, never `me.subscribe` (a path-builder that writes a memory): that is GUI PR #2, taken as is, with its regression `tests/runMeSubscribe.test.ts`. Tests: `tests/localFacts.test.ts`, story `LocalFacts`. Known gaps, recorded (not asserted) by `tests/continuity.live.test.ts`: (1b/1c) each link builds its own kernel, so the `<Me>`'s local facts are not visible inside a link and nothing is shared between runtimes — to be designed as reading/resolving the local context, never as copying it into every ledger; (5) a link is opened by handing it username+password each time, there is no reference to a credential held locally (`credential` prop is only a proposal); (8b) a `=` derivation written through a link is accepted but nothing resolves at its path. Per-namespace key derivation and a kernel reseed are deliberately not part of this. The editable field that used to be called `Me` is `MeField` (registry type `MeField`).

**Root barrel rule** (`index.ts`, stated at the top of the file): no
`export *`. Every root export is explicit, and pulled from a concrete module
path (`@/gui/Atoms/Button/Button`), never re-exported through a barrel. This
keeps the root entry tree-shakeable and its public surface intentional. When
adding a new root export, follow the existing pattern — explicit named
export, concrete import path, not a wildcard.

## Two build outputs, one source

This package ships **both** an ESM/CJS npm package (multi-entry, tree-shaken,
for bundler consumers) **and** a single-file UMD/IIFE bundle (for `<script>`
tag consumption with global `window.React`/`window.GUI`, used by
`netget`'s static `namespace-surface` HTML shell and by `monad`'s HTML
bootstrap). Same `index.ts` root, two build passes (`UMD_TARGET=core` vs the
multi-entry pass) — see `vite.config.js`. React/ReactDOM stay external peer
deps in both modes; the UMD build additionally bundles router + JSX runtime
so it works standalone without extra global shims.

**This dual consumption is a real constraint on how you write root-barrel
code**, not just a build detail — see the react-reconciler landmine below.

## Declarative runtime — the pieces, bottom to top

- **`GuiSpecNode`** (`src/types/gui.types.ts`) — the data shape:
  `{ type, props?, children?, parts?, provenance? }`. `provenance` carries
  `semanticPath` / `explainPath` / `source` / `note` — what the Semantic
  Inspector's "Explain" panel shows for a node. A node with no `provenance`
  shows as "Not declared", which is fine for structural chrome but should be
  filled in for anything that reads/writes `.me`.
- **`renderNode()`** (`src/runtime/renderer.ts`) — the low-level spec → React
  element function. Resolves `type` (string via registry lookup, or a direct
  component/element/Fragment-like symbol), resolves `props` through a
  `RuntimeAdapter` (below), and — if `onNodeResolved` is passed — schedules a
  `ResolvedNodeRecord` callback via `queueMicrotask` for **every** node in the
  tree. That microtask deferral is deliberate: it fires after React's
  synchronous render/commit pass, so registration can't be done from a
  same-pass `useLayoutEffect` (see `SpecBoundary`/`mount.ts` below).
- **`resolveType()`** — string `type` → component. Checks, in order: an
  explicit `registry` option, dotted paths (`Atoms.Button`), then a direct
  lookup on `gui` (the UMD global surface). `Registry/GuiRegistry.ts` is the
  canonical registry: every registrable component ships a sibling
  `Component.resolver.tsx` exporting a `RegistryEntry`
  (`{ type, meta, resolve(spec, ctx) }`) that maps a JSON-friendly spec into
  real props — see `Button.resolver.tsx` for the pattern (destructure known
  spec fields, decide polymorphic `component`, spread the rest). New
  registrable components need both the component file *and* a resolver
  wired into `GuiRegistry.ts`'s import list.
- **Read/write tokens** — dynamic props are `{ read: 'me/profile/name' }` or
  `{ write: 'me/profile/status = ...' }` (legacy aliases `$expr`/`$action`
  still work), resolved through the `RuntimeAdapter` passed as `runtime`.
  Interpolation (`{{params.id}}`) reads from `ctx`. See `Runtime-Contract.md`
  for the full token/router contract — that file is the up-to-date spec, this
  file doesn't restate it.
- **`RuntimeAdapter`** (`src/runtime/adapter.ts`) — the pluggable interface
  (`resolve`, `action`, `subscribe`, `batchResolve`, …) that makes read/write
  tokens live. `createMeRuntime(me)` (`src/runtime/run-me.ts`) is the
  concrete `.me`-backed implementation; `defaultAdapter` is an identity
  passthrough for static/no-runtime rendering.
- **Security allowlist** — expression roots are deny-by-default
  (`me/views/`, `me/public/`, `me/`, `me://`, `self:`, `kernel:`), widened via
  `allowedExprRoots` or disabled via `unsafeAllowAllExpressions` for trusted
  environments only.
- **`SpecBoundary`** (`src/runtime/SpecBoundary.tsx`) — the canonical
  "render one spec subtree and bridge every resolved node into the ambient
  `SelectionProvider`" component. Use this, don't reimplement it — a story
  reimplemented this logic locally (`SpecViewport` in
  `QuickStart.stories.tsx`) and drifted from a correctness fix landed here
  until it was deduplicated. Note its `registry` default is a **module-level
  constant**, not `{}` inline in the destructure — an inline default is a
  fresh object every render and silently defeats the `useMemo` that depends
  on it.
- **`mount()`** (`src/runtime/mount.ts`) — imperative `createRoot().render()`
  wrapper. Owns `RuntimeSelectionRoot`, which does the same resolve +
  register/unregister dance as `SpecBoundary` at the top level, including a
  `queueMicrotask`-deferred sweep that unregisters any node id from the
  previous render pass that didn't reappear in the new one (stale-node
  pruning — easy to get wrong by reaching for a same-pass
  `useLayoutEffect`, see the file's comments before touching it).
- **`mountApp()`** (`src/runtime/mountApp.tsx`) — highest-level app-shell
  bootstrap. Writes the app manifest into `.me` (`declareApp`), resolves
  `app.views[path]`, and branches: a plain `React.ComponentType` renders via
  `createRoot().render(<Theme><Layout><View/></Layout></Theme>)`; a
  `() => GuiSpecNode` factory must be tagged with `defineSpecView()` first —
  an *untagged* factory is not safely distinguishable from a component at
  runtime (calling an unknown function speculatively to inspect its return
  shape breaks Rules of Hooks for real components), so `mountApp()` throws a
  clear error rather than guessing.

## Semantic Inspector / devtools

- **`SelectionProvider` / `useSelection()` / `useOptionalSelection()`**
  (`src/runtime/selection.tsx`) — React context wrapping `selectionStore.ts`
  (the actual state: registered nodes, selection, inspector/grid toggles).
  `useSelection()` throws outside a provider; `useOptionalSelection()`
  returns `undefined` — **use the optional variant in any component that
  might render both inside devtools and in a plain consumer app that never
  mounts `SelectionProvider`** (footer launchers, anything in a default
  `mountApp()` shell). Getting this wrong crashes the whole surrounding
  layout, not just the inspector.
- **`registerNode`/`unregisterNode`** bail out on reference-equality of
  `spec.props`/`spec.provenance` (`isSameRecord` in `selectionStore.ts`) to
  avoid redundant store mutations. Hand-registered nodes (not spec-rendered —
  see `useRegisterGuiNode`) must pass **stable** object references for those
  fields — module-level constants, not fresh `{}` / `{...}` literals per
  render — or every render re-triggers a full re-registration.
- **`ThemeLauncher`** / **`DevToolsLauncher`** — sidebar footer bubbles,
  same bubble+popper shape, both must tolerate no `SelectionProvider`
  (`useOptionalSelection`). `ThemeLauncher` is the first instance of the
  **CollectionLauncher** pattern (`Projection(Space, Selection, Interaction,
  Surface)`, see project memory) — check for a second concrete instance
  before extracting a generic molecule for it.
- **Devtools are opt-in at the runtime level** — `mount(spec, target, { ...,
  devtools: { inspector: false, inspectorToggleVisible: true, adminView:
  false } })`. Runtime core should render fine with devtools entirely absent.

## Known landmines

- **`@react-three/fiber` → `react-reconciler@0.27.0` crashes any static
  importer under React 19.** `react-reconciler@0.27.0`'s peer deps only
  cover React 18; it touches
  `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` (renamed in
  React 19) **at module-evaluation time**, not render time — so merely
  importing the chain crashes before anything renders. `RubiksCube` is the
  current widget on this chain. It's isolated behind
  `src/gui/widgets/RubiksCube/RubiksCubeLazy.tsx` (`lazy()` + `Suspense`) —
  **import that wrapper, not `RubiksCube.tsx` directly, from any barrel**
  (`index.ts`, `widgets.ts`, or a future one). If you add another
  `@react-three/fiber`-based widget, give it the same lazy-wrapper treatment
  before wiring it into a root-level export — a plain static import will
  reintroduce this exact crash for every React-19 consumer of `this.gui`
  (this has already broken FullTrailer once).
- **UMD output needs a manual sync step.** `dist/this.gui.umd.js` is not
  automatically picked up by `netget`'s static `namespace-surface` HTML — it
  must be copied to two locations by hand after a build. Command is in
  `CLAUDE.md`, not repeated here; don't forget it after a UMD-affecting
  change or the deployed surface silently keeps running the old bundle.
- **Two consumption modes exist side by side in `netget`** —
  `namespace-surface/index.html` loads the vendored UMD bundle with global
  React 18 `<script>` tags (`window.__THIS_GUI_DISABLE_AUTOBOOT__` controls
  autoboot); `frontend_local` consumes the npm package via Vite +
  `file:` dependency (`react: ^18.3.1`). Don't assume a fix that works in one
  mode is visible in the other — they load genuinely different build
  artifacts.
- **`peerDependencies` claims React 18 or 19** (`^18.0.0 || ^19.0.0`), but
  the react-reconciler landmine above means that claim is only true for code
  paths that don't touch `RubiksCube`/`widgets.ts` eagerly. Keep that gap in
  mind before widening the peer range further or promising React 19 support
  in docs.

## CLI scaffold

`npx this.gui my-app` (`bin/cli.ts`, template in `npx/template/`) scaffolds a
minimal app: `app.ts` (an `AppDeclaration`), `main.tsx` (calls `mountApp`),
`views/Home.ts`. `README.md`'s "Scaffold a new app" section is the canonical
example — if you change the template, keep the README (and
`QuickStart.stories.tsx`, which mirrors the template's shape 1:1 on purpose)
in sync.

## Key files to read first

| Task | Files |
|---|---|
| Composition contract, quickstart | `README.md` |
| Declarative runtime, tokens, router, security, devtools contract | `Runtime-Contract.md` |
| Spec node shape | `src/types/gui.types.ts` |
| Renderer internals | `src/runtime/renderer.ts` |
| Registry/resolver pattern | `src/Registry/GuiRegistry.ts`, `src/Registry/factory.ts`, any `*.resolver.tsx` |
| Mount pipeline (low → high level) | `src/runtime/renderer.ts` → `src/runtime/SpecBoundary.tsx` / `src/runtime/mount.ts` → `src/runtime/mountApp.tsx` |
| Semantic Inspector state | `src/runtime/selectionStore.ts`, `src/runtime/selection.tsx` |
| `.me` React bridge | `src/react/Me.tsx`, `src/react/useMeValue.ts`, `src/react/useMeAction.ts` |
| Build entries (multi-entry + UMD) | `vite.config.js` |
| Public API surface | `index.ts` (read the header comment — it states the export rules) |

## When you finish something

Update this file if you changed the architecture it describes (a new entry
point, a new landmine, a pattern that got extracted or deduplicated). This
file is only useful if it stays accurate to what's actually true here, not to
what was true when it was written.
