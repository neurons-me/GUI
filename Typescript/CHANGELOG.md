# Changelog

## Unreleased

Additive, except the items marked **Changed** below (`requires: 'session'` works as before).

- **Changed: the GUI's own ids moved under `GUI.window.layout`.** `GUI.bars.*` is now `GUI.window.layout.bars.*` and `GUI.content.*` is
  `GUI.window.layout.content.*`; the bottom bar is `bars.bottom` (a side, like `left`/`right`/`top`; `footer` stays the name of a
  bar's own footer section, `bars.left.footer`). `window` is the surface the GUI is presented on, `layout` its structure. This is
  what `data-gui-node-id`, the Inspector and `me.GUI...` paths show, so anything that selects by those ids must follow. A document
  an app declares in the previous shape (`GUI: { children: { bars, content } }`, with `bars.footer`) is read as the current one
  (`migrateLegacyGuiDocument`), so apps that extend the GUI document keep working unchanged. Component names (`LeftBar`, `RightBar`,
  `TopBar`, `Footer`) and the `.me` path of persisted sidebar state (`layout.sidebar.scopes...`) do not change. The shape and the
  migration live in `runtime/guiIds.ts`; a test fails if the previous ids are written anywhere else in the source.
- **LeftBar `brand` is rendered, and the arrow is its own control.** `brand` was typed on `LeftBar` but never drawn; it now leads
  the header in the rail, the expanded bar and the mobile drawer, in a cell as wide as the rail. With a `brand` and no `toggle`,
  the standard arrow is drawn as a tall, thin tab on the bar's right border (14.5px wide, 35px tall in a 48px header, with a third
  of its width, about 5px, hanging outside the bar; inline in the drawer), a raised surface (light-to-shade gradient, lit top
  edge, soft shadow, deeper on hover, sunk when pressed, in light and dark) with a target 15.5px wide and as tall as the header,
  `aria-expanded` and a state-aware label. The tab and its arrow are centred on the header like the brand. It keeps clear of the
  brand on the inside, the header's text stops before it, and the app moves whatever sits just outside the bar to make room
  (Cleaker moves the top bar's location label: `elementsLeftSx.pl`). On a narrow window the temporary drawer starts at the top of the window and covers the top bar's left end, so it is the one header (its row is the top bar's) and the top bar's location label is not repeated under it. A `header` object's `icon` is not drawn when there is a `brand` (the brand is the mark; only the
  title shows). Without `brand` nothing changes, and `toggle` still replaces the arrow. **Changed:** an app that already passed
  `brand` to `LeftBar` will now see it.
- **Changed in `<Cleaker>`:** the position QR in the left bar is now the `brand`, a link to `/.me`, and no longer the control that
  expands the bar; on a narrow screen the corner control is the standard "Open navigation" button and the QR leads the drawer.
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
