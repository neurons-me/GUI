# Changelog

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
