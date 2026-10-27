# Changelog

## Unreleased

Additive; nothing existing changes (`requires: 'session'` works as before).

- **Declarative requirements on document parts.** `requires` now also takes `{ capability, whenMissing?: 'hide' | 'disable' }`. The
  app supplies one resolver per capability name (`capabilities` on `<Cleaker>`/`<Namespace>`); each is called with the **selected
  link**, the **session through it**, an opaque app `capabilityScope` and an `AbortSignal`. The same declaration gates the link in
  the bar and the page behind its route; pages read the result with `useGuiCapability(name)`. Fail closed; results belong to
  (link, identity, scope) and a late answer for another key is dropped. The GUI never interprets a capability name. See
  `typedocs/Declarative-Requirements.md`.
- A left-bar link that is `off` (a disabled part, or a page whose layer is off) now carries `aria-disabled` and `data-gui-off`.

## 4.2.1

Package metadata (`description`, `keywords`, `homepage`, `repository`, `bugs`, `author`). No API change.

## 4.2.0

Additive; nothing existing changes.

- **SearchBar: `icon.monad` renders the live .GUI orb as an entry's icon.** An index entry's object icon
  (`{ light, dark }`) may add `monad: { variant, kind, seed, texture }`; the SearchBar then draws the real
  `GUI.Widgets.Monad` instead of the image (in the quick-access grid and in the results list):
  - `variant: "identity"` (default) — the .me ring + dot orb (`kind: "me"`, e.g. `seed: "jabellae"`), tuned:
    full opacity, a faint halo instead of the glow pulse, a gentle float that stays inside the slot, the ring
    at 80% of the orb (near its edge, dot at 22% of the ring) and morphing with the outer circle.
  - `variant: "bubble"` — the monad.ai pixel bubble (`kind: "monad"`, no seed → the monad.ai pattern), scaled
    into the slot with the same full opacity / faint halo / gentle float; `texture: "matte"` (default) replaces
    its inner light with a flat matte and a faint grain (no inner disc), `texture: "widget"` keeps the widget's
    own blob, glass and inkblot layers.
  - The `light` / `dark` images stay in the entry, so this.gui ≤ 4.1.0 (which ignores `monad`) still shows them.
  - New: `src/gui/All.This/SearchBar/SearchBarMonadIcon.tsx`; type `JsonSearchMonadIcon` in `SearchBar.types.ts`.
- `package-lock.json` root version brought up to date (it still said 3.0.0).
