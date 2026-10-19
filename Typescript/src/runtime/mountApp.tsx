import React from 'react';
import { createRoot } from 'react-dom/client';
import * as ReactDOM from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import Layout from '@/gui/Layout/Layout';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import { Me } from '@/react/Me';
import { writeMeValue } from './run-me';
import { mount } from './mount';
import type { MeLike } from '@/react/types';
import type { GuiSpecNode } from './renderer';

const SPEC_VIEW_TAG = '__guiSpecView' as const;

/**
 * Marks a `() => GuiSpecNode` factory so `mountApp()` can safely tell it
 * apart from a `React.ComponentType` at runtime. Plain `typeof` can't make
 * this distinction — both arms of `AppDeclaration.views`'s type are
 * ordinary functions — and calling an unknown function speculatively to
 * inspect its return shape isn't safe (a real component using hooks throws
 * "Invalid hook call" when invoked outside React's render pass). Wrap a
 * spec-factory view with this before assigning it to `AppDeclaration.views`
 * if you want the canonical `mountApp()` to render it through `mount()`.
 */
export function defineSpecView(
  factory: () => GuiSpecNode,
): (() => GuiSpecNode) & { [SPEC_VIEW_TAG]: true } {
  return Object.assign(factory, { [SPEC_VIEW_TAG]: true as const });
}

/**
 * Runtime companion to `defineSpecView()` — true for a factory tagged by it,
 * false for a plain `React.ComponentType` (or an untagged factory, which
 * isn't a safely-detectable case — see `defineSpecView()`'s own comment).
 * Exported so callers building their own app-shell (custom nav, routing,
 * etc. — see `mountApp()` below for the canonical shell) can branch on a
 * view the same way `mountApp()` does, instead of reimplementing this check.
 */
export function isSpecViewFactory(
  view: React.ComponentType | (() => GuiSpecNode),
): view is (() => GuiSpecNode) & { [SPEC_VIEW_TAG]: true } {
  return typeof view === 'function' && (view as any)[SPEC_VIEW_TAG] === true;
}

export interface AppDeclaration {
  id: string;
  namespace: string;
  title: string;
  theme?: string;
  /**
   * View resolvers. A `React.ComponentType` is rendered directly by
   * `mountApp()` below. A `() => GuiSpecNode` factory — wrapped with
   * `defineSpecView()` so `mountApp()` can recognize it at runtime — is
   * rendered through the declarative `mount()` runtime instead, so the view
   * participates in the Semantic Inspector graph (when devtools are
   * enabled — see `mount()`'s own `devtools` option).
   *
   * An UNTAGGED spec factory is not a supported input, but `mountApp()`
   * cannot detect and reject it safely: distinguishing "a real
   * `React.ComponentType`" from "a factory someone forgot to wrap" would
   * mean calling an unknown function to inspect its return value before
   * React's own render pass, which breaks the Rules of Hooks for any real
   * component that happens to be a hook. So an untagged factory falls
   * through to the `React.ComponentType` path and is rendered as `<View />`
   * — React itself throws (a generic "Objects are not valid as a React
   * child", not a `this.gui`-authored message) once it sees the returned
   * `GuiSpecNode` isn't a valid element. Always wrap spec-factory views with
   * `defineSpecView()`.
   */
  views: Record<string, React.ComponentType | (() => GuiSpecNode)>;
  /**
   * Component registry spec-factory views may reference by string `type`
   * (e.g. `{ type: 'Typography' }`). Only consulted when the resolved view
   * for the current path is a `defineSpecView()`-tagged factory. See
   * `mount()`'s own `gui` option for the exact shape.
   */
  gui?: Record<string, any>;
}

export interface MountAppOptions {
  me: MeLike;
  app: AppDeclaration;
  target?: string;
}

export function declareApp(me: MeLike, app: AppDeclaration): void {
  const manifest = { id: app.id, title: app.title, theme: app.theme };
  writeMeValue(me, `${app.namespace}.manifest`, manifest);
  // Also write each leaf field individually: the kernel indexes writes by
  // exact path, so a dotted read like `apps.<id>.manifest.title` does not
  // drill into the object written above — it needs its own index entry to
  // resolve as a live `{ read: ... }` binding.
  for (const [key, value] of Object.entries(manifest)) {
    writeMeValue(me, `${app.namespace}.manifest.${key}`, value);
  }
  writeMeValue(me, `${app.namespace}.views`, Object.keys(app.views));
}

export function mountApp({ me, app, target = '#root' }: MountAppOptions): void {
  declareApp(me, app);

  const el = document.querySelector(target);
  if (!el) throw new Error(`mountApp: target "${target}" not found`);

  const path = window.location.pathname.replace(/^\/+/, '') || 'home';
  const view = app.views[path] ?? app.views.home;

  if (isSpecViewFactory(view)) {
    // Tagged spec-factory view — render through mount() so it participates
    // in the Semantic Inspector graph, same shell (Theme/Layout/ThemeLauncher
    // footer) as the ComponentType path below, just built as a spec tree
    // instead of JSX since mount() needs a GuiSpecNode, not an element.
    const spec: GuiSpecNode = {
      type: Theme,
      props: { initialThemeId: app.theme, 'data-gui-component': 'Theme' },
      children: {
        type: Layout,
        props: {
          'data-gui-component': 'Layout',
          LeftBar: {
            initialView: 'expanded',
            footerElements: [
              { type: 'action', props: { element: <ThemeLauncher /> } },
            ],
          },
        },
        children: view(),
      },
    };
    mount(spec, target, { gui: app.gui ?? {}, me, React, ReactDOM });
    return;
  }

  if (typeof view !== 'function') {
    throw new Error(
      `mountApp: no view found for "${path}" (or "home") in app "${app.id}".`,
    );
  }

  const View = view as React.ComponentType;

  createRoot(el).render(
    <Theme initialThemeId={app.theme}>
      <Me me={me}>
        <Layout
          LeftBar={{
            initialView: 'expanded',
            footerElements: [
              { type: 'action', props: { element: <ThemeLauncher /> } },
            ],
          }}
        >
          <View />
        </Layout>
      </Me>
    </Theme>,
  );
}
