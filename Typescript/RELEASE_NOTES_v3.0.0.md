---
title: this.gui v3.0.0 — from 33MB to 2.4MB, and why it's a major version
published: false
tags: react, opensource, webperf, javascript
---

`this.gui` — the **Generative User Interface** library behind the `.me`/Cleaker/Netget stack — just shipped **v3.0.0** on npm. It's a major version, and it's worth explaining why, because the fix underneath it is a good cautionary tale about how "small" dependency choices silently balloon a bundle.

## The numbers first

While rebuilding the admin UI that consumes `this.gui`, its production JS bundle was **16.65 MB**, and its CSS was **16.2 MB**. For a landing page. After this release:

| | Before | After |
|---|---|---|
| Bundled CSS | 16,213 KB | **0.87 KB** |
| this.gui's own shared chunk (`start-app`) | 14.7 MB | **590 KB** |
| `this.gui.umd.js` (script-tag build) | 17.5 MB | **3.26 MB** |
| Consuming app's main JS bundle | 16.65 MB | **2.39 MB** |

Same features. Same components. Nothing removed. Just two bloat sources found and cut.

## What was actually bloating it

**1. The icon font was tripled and inlined.**
A single `import 'material-symbols'` pulled in **all three** icon families the npm package ships (outlined, rounded, sharp) — even though this codebase only ever uses `material-symbols-rounded`. Worse, whatever asset pipeline processed that import inlined all three as base64 **directly into the CSS**, regardless of file size (each is a multi-MB font covering thousands of glyphs). Net result: ~12MB of font data, most of it for two icon families nothing renders, shipped as un-cacheable text inside a CSS file that changes hash on every rebuild.

Fix: dropped the bare import. Consumers now `<link>` the already-correct `material-symbols.css` (+ real `.woff2` file) directly — a proper, cacheable static asset, the same pattern this library's own demos and Storybook config already used.

**2. Theme preview images were full-resolution screenshots.**
The theme catalog ships 6 preview "badges." They're rendered as **28–34px avatars.** The source files were 1024–1600px PNGs, 1–4MB each — full screenshots, never resized for their actual use. Imported directly in code, they got base64-inlined into the bundle the same way the font did.

Fix: resized each to their real display size (~128px, generous headroom for retina). File sizes dropped 95–99% (3.09MB → 20.8KB, for example) with zero visible difference at a 34px avatar size.

## Why this is a major version, not a patch

Fixing the icon font surfaced a related, unrelated-on-the-surface issue: `react-router-dom` was pinned as a peer dependency at `^6.0.0`. That's now `^7.18.3`.

**This is the actual breaking change in this release.** If your app still provides `react-router-dom` v6, upgrading blind will break at the peer-resolution level (or worse, silently resolve an old v6 copy that no longer gets this library's routing fixes). That's exactly why this shipped as `3.0.0` and not `2.5.3` — a "patch" that quietly requires a major dependency bump is worse than an honest major version.

### Migrating

```bash
npm install this.gui@3 react-router-dom@7
```

If you're not ready to move to React Router v7 yet, pin `this.gui@^2.4.0` — it still works, just carries the old bloat this release fixes.

## The unglamorous part: a build that had been silently broken

While preparing this release, `npm run build`'s full chain (the one `npm publish` actually runs via `prepublishOnly`) turned out to have been failing at the type-check step for a while — unrelated to any of the above, and apparently never noticed because nobody had run the *complete* chain in one sitting recently. Two real gaps:

- A `RegistryMeta.kind` field became required at some point, but none of the ~50 component registrations that construct one ever set it. Fixed by deriving `kind` from the `group` field every one of them already has, in one place, instead of hand-editing 50 files.
- `Router.tsx` was still passing React Router v6's `future={{ v7_startTransition, v7_relativeSplatPath }}` migration flags to `<BrowserRouter>` — flags that no longer exist in v7, because their behavior is just the default now.

Neither is visible to consumers, but both had to be fixed before `3.0.0` could actually publish at all.

## tl;dr

- **Upgrade** if you can move to `react-router-dom@7` — you get a ~85% smaller bundle for free.
- **Hold at `^2.4.0`** if you're not ready for the React Router migration yet.
- If you maintain a UI library: audit what your bundler does with imported images and fonts. "It's just an import" is exactly how a 34px avatar ships 3MB.

---
`this.gui` on npm: https://www.npmjs.com/package/this.gui
