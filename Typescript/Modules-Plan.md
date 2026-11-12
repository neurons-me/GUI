# Modules plan: a common shell, apps that register their parts, publication through a namespace

Status: **plan, nothing built yet** (2026-11-05). Decisions marked **Open** are not taken.

**First cut: steps 1–3 only** (local module contract, independent shell, netget registered as a module). Steps 1–3 do
not introduce remote code loading or personal overlays; steps 4 and 5 are documented here as later stages.

## What this is about

The interface served at `http://localhost` today is the whole stack in one page — `.me` (the kernel, in the browser),
cleaker (namespaces, the way in, sessions), GUI (the shell, its pages and themes) and netget (Domains, Logs, Monad,
gateway permissions). It lives in netget's repository by history (it began as netget's panel). That is why developing
it needs a GUI build or an npm publish before a change shows there.

The direction: a **common shell**, **apps that register their parts**, and later **publication and import through a
namespace**, with **personal overlays** on top.

## Terms

Kept apart throughout (they were mixed while this was discussed):

| Term | Example | What it is |
|---|---|---|
| Domain | `fulltrailer.com.mx` | a door: the name requests arrive by. Never signs, never owns a GUI. |
| App | `fulltrailer`, `netget` | what serves those requests; it registers its parts. netget routes a domain to an app. |
| Namespace | `cleaker.me`, `jabellae.cleaker.me` | a `.me`: a tree with an owner and an identity. An app lives under one (`cleaker.me/apps.fullTrailer`). |
| Shell | GUI's | the reusable frame: layout, `<Me>` + `<Cleaker>`, document rendering, the GUI's own pages. |
| Bootstrap | per installation | the small entry point that hands the shell its configuration (below). Not GUI's. |

## Principles

1. **Representing the whole stack is not living inside GUI.** GUI provides the shell and its contracts. Which
   installation is running (its modules, initial document, transports, context) is decided by a bootstrap outside GUI;
   netget's permissions and logic do not move into GUI.
2. **The shell starts with no app installed.** Starting without netget is not the same as working without services: a
   page that needs a transport or a session (Users, Blockchain) says so clearly when it is missing.
3. **Data and code are different things, and data needs limits too.** A part is executable code. A declarative
   document is data, but interpreting it loads components, navigates, resolves resources and sends requests; a
   document from outside is constrained (components, props, actions and destinations it may name).
4. **Showing a control is not authorizing it.** A module may tell the shell which controls to show for a session; the
   server authorizes every operation, every time.
5. **Provenance is not permission.** A signature says where something comes from; running it needs a separate grant.
6. **Something must persist and serve what is published.** "It lives in a `.me`" means nothing until it is said who
   keeps it and who answers for it when the app is off.

How declared parts bind to `.me` data and operations (proposed, not built):
[Interface-Binding-Principle.md](Interface-Binding-Principle.md).

## Order

### 0. Before step 1 (isolated): live GUI source in netget's dev server

Alias `this.gui` to GUI's source in netget's Vite config (as it already does for `netget.gui`), so the real app shows
GUI changes live with no build or publish. An isolated change; it decides nothing below. Before relying on it: React
and MUI resolve to one copy, and the dev server's backend (its `:3000` proxy) is checked not to be the real one before
anything writes.

### 1. Module contract (local)

What an app hands the shell:

- **id** — a stable module id (does not change across versions).
- **document** — its parts of the GUI tree (pages, routes, content parts with `component` + `props`), merged into the
  shell's document (`mergeGuiDocument`, today additive only). Node ids are stable paths.
- **parts** — the components its document names, each under a stable component id.
- **visibility resolvers** — what the module tells the shell about which of its controls to show for the current
  session (today's `requires` / capability resolvers). Named as UI visibility, not authorization. Defined here: what is
  shown while a resolver is pending, and when it fails or cannot be reached (the control is not offered; nothing is
  assumed granted).
- **lifecycle** — register, unregister (routes, subscriptions, resources cleaned up), and what happens when the module
  throws (its parts are replaced by an error state; the shell and other modules keep working).

Rules decided here, because they are hard to change later:
- **Stable ids** for modules, nodes and components. Overlays (step 5) depend on them: without stable ids a
  personalization cannot find its element after an update.
- **Duplicate registration** (same module id, same component id from two modules): rejected, with the conflict named.
- **Missing dependency** (a document names a component no module registered): that part renders a named "missing"
  state, the rest of the page renders.
- **What an app may override** in the shell's document: add only (today); it cannot replace the base's
  `component`/`route`.
- **Contract version** a module declares it was written for.

**Who discovers modules:** the browser cannot see what is installed on a machine. To start, the bootstrap hands the
shell an **explicit list** (or the host serves a **manifest** the bootstrap reads). Discovery and dynamic installation
wait.

Done when: the contract is written, and the current netget front end can be described by it without loss.

### 2. Independent shell

GUI gets the reusable shell. The decisions in netget's `App.jsx` (door → entry → namespace, which document, which
modules, which transports) stay outside it, in a bootstrap that hands them to the shell. The shell's dev mode is GUI's
Vite (with a dev bootstrap); its build is a dist.

Done when: the shell boots from a bootstrap with **no modules**, shows `? @ <where>`, the way to a `.me` and the GUI's
own pages (`/GUI`), and pages that need a transport or session (Users, Blockchain) show a clear state when it is
missing.

### 3. netget as the first module

netget's pages (Domains, Logs, Monad), its document extension, its visibility resolvers and its door rules become one
module, listed by the bootstrap. The shell does not import netget.

Done when: shell + netget module behaves as today's localhost, checked by behavior, not by a screenshot:
- direct routes (typing `/domains`, `/GUI/themes`, a door's `/`), and reload on each;
- sign in, sign out, switching links;
- what each page shows with and without the permissions it needs;
- navigation and Back;
- error states (backend off, monad off, nothing registered).

And removing the module from the bootstrap leaves a working shell.

**Switching what nginx serves** to the new dist happens only after that equivalence holds, with a simple way back to
the current front end (the release kit's rollback, or the previous root kept as is).

### 4. Later: publication and import through a namespace

A part goes up levels: **dev** (the app's Vite) → **app** (the running app's registry) → **published** (under the
namespace of the app's owner, signed) → **imported** by another environment from that namespace.

Open, to be decided before building:
- **What is published:** a declarative document, executable code, assets, or a manifest that references them.
- **Who persists and serves it:** the owner's monad, a gateway, a static host; what happens when that is off.
- **Versions and pinning:** an import names an exact version (a hash), not "latest"; dependencies between modules.
- **Permission to run code:** which namespaces' code an environment runs (its own; ones it approves; others isolated,
  e.g. a sandboxed iframe talking by messages; or only documents from outside, parts from a trusted registry).
- **Limits on external documents:** the components, props, actions and destinations a document from outside may name.

### 5. Later: personal overlays

What a user sees is `base @ overlay(user)`: the owner's document with that user's changes, kept in the user's own
`.me` (locally in the browser first; shared through a namespace later).

Open, to be decided before building:
- **What an overlay may change:** visual only (order, text, hide, another part); never `requires`, routes, or anything
  that grants access. The server still authorizes every request.
- **What it keeps from the original**, and how removal and reordering are written (tombstones, order lists), keyed by
  the stable ids of step 1.
- **When the author updates the base:** an overlay records which base version it was made on; a change whose target
  is gone is shown as a conflict, not applied blindly.
- **Operations:** diff against the base, diff between two users' overlays (only what each one discloses), reset all or
  one part to the owner's version.

## Not decided here

The `.me` the local monad carries (today named `localhost`, a *where*, not a *me*), and the localhost single-runtime
change (nginx + one monad). Neither is needed for steps 1–3: the shell resolves a `.me` in the browser and can reach
any public namespace over `https`.
