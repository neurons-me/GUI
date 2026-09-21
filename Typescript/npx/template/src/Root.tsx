import { AppShell } from 'this.gui/runtime';
import type { AppDeclaration } from 'this.gui/runtime';
import type { RuntimeAdapter } from 'this.gui/runtime';
import type { MeLike } from 'this.gui/react';

export interface RootProps {
  app: AppDeclaration;
  me: MeLike;
  runtime: RuntimeAdapter;
}

// "Home" is the published surface (public, read-first). "Admin" is the
// authoring surface (the Spaces explorer) — visible to everyone in the nav
// for discoverability, but its own view gates its content on having a
// session (see Spaces.tsx). Kept as one flat nav, not a real /admin URL
// prefix: AppShell's routing is a `.me`-path lookup (app.views[route]), not
// URL-based, so there's no nested-route/param system to hang a literal
// "/admin/:space" on — Spaces.tsx's own selected-space state already gives
// that same effect without inventing one.
const NAV_ITEMS = [
  { route: 'home', label: 'Home', icon: 'home' },
  { route: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
];

/**
 * The whole app, always rendered — there is no login wall here. `me`/
 * `runtime` are the public connection from main.tsx, so every view (Home,
 * Spaces) works with or without a session; SessionSurface (already wrapping
 * this in main.tsx) is what adds a claimed identity's write access on top,
 * via useSessionSurface() wherever a view needs it.
 */
export default function Root({ app, me, runtime }: RootProps) {
  return <AppShell app={app} me={me} runtime={runtime} navItems={NAV_ITEMS} />;
}
