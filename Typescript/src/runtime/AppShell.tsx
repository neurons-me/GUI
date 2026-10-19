import { Suspense, useEffect } from 'react';
import Theme from '@/gui/Theme/Theme';
import Layout from '@/gui/Layout/Layout';
import ThemeLauncher from '@/gui/Theme/Launcher/ThemeLauncher';
import DevToolsLauncher from './DevToolsLauncher';
import MeLauncher from '@/react/session/MeLauncher';
import { Me, useOptionalMeRuntimeContext } from '@/react/Me';
import { useMeAction } from '@/react/useMeAction';
import { useMeValue } from '@/react/useMeValue';
import type { MeLike } from '@/react/types';
import { SelectionProvider } from './selection';
import { LauncherPopoverProvider } from './launcherPopover';
import { RuntimeEnvironmentProvider } from './runtimeContext';
import { RuntimeInspector } from './inspector';
import { declareApp, isSpecViewFactory } from './mountApp';
import type { AppDeclaration } from './mountApp';
import { SpecBoundary } from './SpecBoundary';
import type { RuntimeAdapter } from './adapter';
import { writeMeValue } from './run-me';

export interface AppShellNavItem {
  route: string;
  label: string;
  icon?: string;
}

export interface AppShellProps {
  app: AppDeclaration;
  me: MeLike;
  runtime?: RuntimeAdapter;
  /** LeftBar nav items — every app declares its own; nothing here is app-specific. */
  navItems: AppShellNavItem[];
  /**
   * Mounts SelectionProvider/RuntimeInspector (grid overlay + click-to-Explain
   * side panel) alongside the default ThemeLauncher footer bubble. On by
   * default — same "devtools available unless you opt out" stance as
   * mount()'s own `devtools` option, so an app gets this for free instead of
   * every app hand-wiring SelectionProvider+RuntimeEnvironmentProvider+
   * RuntimeInspector itself (the exact gap FullTrailer had before this was
   * extracted here).
   */
  devtools?: boolean;
  /** Extra LeftBar footer actions rendered after Theme/DevTools defaults. */
  footerElements?: React.ReactNode[];
}

/**
 * Reads the current route from `.me` (`${app.namespace}.route`) and renders
 * the matching view. Route changes (a nav item calling useMeAction's setter)
 * re-render this automatically since useMeValue subscribes to that path —
 * this is what gives the shell live routing instead of mountApp()'s
 * one-shot `window.location.pathname` read at boot.
 *
 * Branches on isSpecViewFactory() the same way mountApp() does: a
 * defineSpecView()-tagged factory renders through SpecBoundary (so it
 * participates in the Semantic Inspector graph); anything else is treated
 * as a plain React.ComponentType. SpecBoundary's `runtime` prop is explicit,
 * not context-aware — passing nothing here silently falls back to the
 * renderer's identity-passthrough defaultAdapter, so a spec view's
 * {read: ...} tokens would just echo the raw path string back instead of
 * resolving. Pull the real adapter out of Me's own context
 * and hand it down explicitly.
 *
 * Suspense wraps the ComponentType branch for apps whose views are
 * React.lazy()-wrapped (a common pattern for splitting infrequently-visited
 * views out of the main bundle) — a plain component doesn't need it (lazy()'s
 * own promise resolves before render either way), but a lazy one throws a
 * promise on first render, and only a Suspense ancestor can catch that.
 */
function ActiveView({ app }: { app: AppDeclaration }) {
  const route = useMeValue<string>(`${app.namespace}.route`);
  const runtimeContext = useOptionalMeRuntimeContext();
  const view = app.views[route ?? ''] ?? app.views.home;
  if (isSpecViewFactory(view)) {
    return <SpecBoundary spec={view()} runtime={runtimeContext?.runtime ?? undefined} />;
  }
  const View = view as React.ComponentType;
  return (
    <Suspense fallback={null}>
      <View />
    </Suspense>
  );
}

function AppShellNav({ app, navItems, footerElements }: Pick<AppShellProps, 'app' | 'navItems' | 'footerElements'>) {
  const route = useMeValue<string>(`${app.namespace}.route`) ?? 'home';
  const setRoute = useMeAction(`${app.namespace}.route`);

  const elements = navItems.map(({ route: r, label, icon }) => ({
    type: 'link' as const,
    props: {
      label,
      icon,
      active: route === r,
      onClick: () => setRoute(r),
    },
  }));

  return (
    <Layout
      LeftBar={{
        initialView: 'expanded',
        elements,
        footerElements: [
          // tooltip: false — each of these already opens its own hover
          // popper (see LeftSidebarAction's `tooltip` prop doc).
          { type: 'action', props: { element: <ThemeLauncher />, tooltip: false } },
          { type: 'action', props: { element: <MeLauncher />, tooltip: false } },
          { type: 'action', props: { element: <DevToolsLauncher />, tooltip: false } },
          ...(footerElements ?? []).map((element) => ({ type: 'action' as const, props: { element } })),
        ],
      }}
    >
      <ActiveView app={app} />
    </Layout>
  );
}

/**
 * The generic app shell: declares the app in `.me`, seeds the initial route
 * from the URL once, then renders Theme -> (devtools providers) ->
 * Me -> nav + Layout -> the active view. This is the reactive,
 * mixed-view (spec-tree AND plain React), devtools-enabled counterpart to
 * mountApp() — mountApp() targets the UMD/global-`window.GUI` distribution
 * (one view resolved once at boot, no live route, devtools only on its
 * spec-factory branch); this targets a real Vite/ESM app that wants routing
 * driven by `.me` itself and a working DevTools bubble regardless of which
 * view type is active. Extracted from FullTrailer's own runtime.tsx, which
 * had reimplemented this exact composition — nothing below is
 * FullTrailer-specific; `navItems` is the one thing every app supplies.
 */
export function AppShell({ app, me, runtime, navItems, devtools = true, footerElements }: AppShellProps) {
  useEffect(() => {
    declareApp(me, app);
    const initialPath = window.location.pathname.replace(/^\/+/, '') || 'home';
    writeMeValue(me, `${app.namespace}.route`, app.views[initialPath] ? initialPath : 'home');
    // Runs once per mount (i.e. once per session) — me/app/runtime are
    // stable for the lifetime of an authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const body = (
    <Me me={me} runtime={runtime}>
      <AppShellNav app={app} navItems={navItems} footerElements={footerElements} />
    </Me>
  );

  return (
    <Theme initialThemeId={app.theme}>
      <LauncherPopoverProvider>
        {devtools ? (
          <SelectionProvider>
            <RuntimeEnvironmentProvider value={{ me, runtime }}>
              {body}
              <RuntimeInspector />
            </RuntimeEnvironmentProvider>
          </SelectionProvider>
        ) : (
          body
        )}
      </LauncherPopoverProvider>
    </Theme>
  );
}

