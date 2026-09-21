//src/runtime/mount.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import type { GuiNode, RendererOptions, ResolvedNodeRecord } from './renderer';
import { renderWithGUI } from './renderer';
import { SelectionProvider, useSelection } from './selection';
import { RuntimeEnvironmentProvider } from './runtimeContext';
import {
  ensureRuntimeControlSurface,
  readAdminViewPreference,
  readInspectorPreference,
} from './controlSurface';

export type MountTarget = string | Element;
export type MountDevtoolsOptions = {
  /**
   * Enable the runtime devtools surface.
   * When true, initial inspector/admin states are read from persisted preferences.
   */
  enabled?: boolean;
  /**
   * Mount the inspector panel runtime.
   * Even when false initially, the inspector can still be mounted if `enabled` is true
   * so it can react to later control-surface toggles.
   */
  inspector?: boolean;
  /**
   * Mount the admin view runtime.
   * Even when false initially, the admin view can still be mounted if `enabled` is true
   * so it can react to later control-surface toggles.
   */
  adminView?: boolean;
  /**
   * Show the floating inspector toggle chip.
   */
  inspectorToggleVisible?: boolean;
};

export type MountOptions = Omit<RendererOptions, 'gui' | 'React'> & {
  gui?: any;
  React?: any;
  ReactDOM?: any;
  /** Optional .me instance; if provided, mount() will derive runtime via GUI.render(me). */
  me?: any;
  /**
   * Explicit devtools configuration.
   * When omitted, mount() renders only the runtime core.
   */
  devtools?: boolean | MountDevtoolsOptions;
  /** @deprecated Use `devtools.inspector`. */
  inspectorEnabled?: boolean;
  /** @deprecated Use `devtools.adminView`. */
  adminViewEnabled?: boolean;
  /** @deprecated Use `devtools.inspectorToggleVisible`. */
  inspectorToggleVisible?: boolean;
};

type NormalizedMountDevtools = {
  requested: boolean;
  inspectorRequested: boolean;
  adminViewRequested: boolean;
  inspectorEnabled: boolean;
  adminViewEnabled: boolean;
  inspectorToggleVisible: boolean;
};

// Cache React roots by host element so repeated `mount()` calls update instead of re-creating roots.
// Use a WeakMap to avoid memory leaks when elements are removed.
const ROOTS_KEY = '__THIS_GUI_RUNTIME_ROOTS__';

type ReactRoot = {
  render: (el: any) => void;
  unmount: () => void;
};

function getRootCache(): WeakMap<Element, ReactRoot> {
  const g = globalThis as any;
  if (!g[ROOTS_KEY]) g[ROOTS_KEY] = new WeakMap<Element, ReactRoot>();
  return g[ROOTS_KEY] as WeakMap<Element, ReactRoot>;
}

function resolveTarget(target: MountTarget): Element {
  if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (!el) throw new Error(`[this.GUI] mount target not found: ${target}`);
    return el;
  }
  return target;
}

function isTargetLike(value: any): value is MountTarget {
  return (
    typeof value === 'string' ||
    (typeof Element !== 'undefined' && value instanceof Element)
  );
}

function isPlainObject(value: any): value is Record<string, any> {
  return !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

const LEGACY_WARN_KEY = '__THIS_GUI_MOUNT_LEGACY_WARNED__';

function warnLegacySignature() {
  const g = globalThis as any;
  if (g[LEGACY_WARN_KEY]) return;
  g[LEGACY_WARN_KEY] = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[this.gui] DEPRECATED: mount(target, spec, ctx) will be removed in the next major version. ' +
      'Use mount(spec, target, { ctx, ...options }).'
  );
}

function getReactGlobals(opt?: any) {
  const g = globalThis as any;
  return {
    gui: opt?.gui ?? g.GUI,
    React: opt?.React ?? g.React,
    ReactDOM: opt?.ReactDOM ?? g.ReactDOM,
  };
}

function resolveMountedKernel(options: MountOptions | any): any {
  const explicit = options?.me;
  if (explicit) return explicit;

  const runtime = options?.runtime as any;
  if (runtime?.__me) return runtime.__me;
  if (runtime?.me) return runtime.me;

  const ctx = options?.ctx as any;
  if (ctx?.me) return ctx.me;
  if (ctx?.runtime?.__me) return ctx.runtime.__me;
  if (ctx?.runtime?.me) return ctx.runtime.me;

  return undefined;
}

const LazyRuntimeInspector = React.lazy(async () => {
  const mod = await import('./inspector');
  return { default: mod.RuntimeInspector };
});

const LazyRuntimeAdminView = React.lazy(async () => {
  const mod = await import('./adminView');
  return { default: mod.RuntimeAdminView };
});

// Exported for tests only (not part of the package entry): what a given `devtools` option mounts and starts ON.
export function normalizeMountDevtools(options: MountOptions): NormalizedMountDevtools {
  const legacyInspectorSet = typeof options.inspectorEnabled === 'boolean';
  const legacyAdminViewSet = typeof options.adminViewEnabled === 'boolean';
  const legacyToggleSet = typeof options.inspectorToggleVisible === 'boolean';

  const rawDevtools: MountDevtoolsOptions =
    typeof options.devtools === 'object' && options.devtools
      ? options.devtools
      : {};
  const devtoolsEnabled = options.devtools === true || rawDevtools.enabled === true;

  // "Requested" means the caller wants the inspector/admin-view
  // INFRASTRUCTURE mounted at all (SelectionProvider + RuntimeInspector),
  // distinct from "enabled" (whether it starts ON) -- so this must only be
  // true when an option was explicitly set to `true`, never merely "set to
  // some boolean". The previous `typeof x === 'boolean'` checks treated an
  // explicit `false` the same as `true`: a caller passing
  // `devtools: { inspector: false }` to mean "no inspector, don't mount
  // it" still got requested=true, mounting a hidden-but-live
  // SelectionProvider/RuntimeInspector anyway. Because selectionStore is a
  // page-wide singleton (globalThis[STORE_KEY], see selectionStore.ts),
  // that hidden instance shares inspectorEnabled/selectedNode state with
  // any OTHER inspector mounted elsewhere on the same page -- confirmed
  // live: frontend_local's main.jsx mounts the whole app with
  // devtools:{inspector:false, inspectorToggleVisible:false} expecting
  // none of this mounted, and toggling a SEPARATE, real inspector
  // elsewhere on the page turned this hidden one on too, both racing to
  // handle the same click with two different `me` values (one a real
  // kernel, one a browser-side stand-in) depending on DOM paint order.
  const inspectorRequested =
    devtoolsEnabled ||
    options.inspectorEnabled === true ||
    rawDevtools.inspector === true ||
    options.inspectorToggleVisible === true ||
    rawDevtools.inspectorToggleVisible === true;

  const adminViewRequested =
    devtoolsEnabled ||
    options.adminViewEnabled === true ||
    rawDevtools.adminView === true;

  const requested = inspectorRequested || adminViewRequested;
  if (!requested) {
    return {
      requested: false,
      inspectorRequested: false,
      adminViewRequested: false,
      inspectorEnabled: false,
      adminViewEnabled: false,
      inspectorToggleVisible: false,
    };
  }

  ensureRuntimeControlSurface();

  return {
    requested,
    inspectorRequested,
    adminViewRequested,
    inspectorEnabled: legacyInspectorSet
      ? Boolean(options.inspectorEnabled)
      : typeof rawDevtools.inspector === 'boolean'
        ? Boolean(rawDevtools.inspector)
        : devtoolsEnabled
          ? readInspectorPreference()
          : false,
    adminViewEnabled: legacyAdminViewSet
      ? Boolean(options.adminViewEnabled)
      : typeof rawDevtools.adminView === 'boolean'
        ? Boolean(rawDevtools.adminView)
        : devtoolsEnabled
          ? readAdminViewPreference()
          : false,
    inspectorToggleVisible: legacyToggleSet
      ? Boolean(options.inspectorToggleVisible)
      : Boolean(rawDevtools.inspectorToggleVisible),
  };
}

function RuntimeCoreRoot({
  spec,
  gui,
  options,
  ReactNS,
  onNodeResolved,
}: {
  spec: GuiNode;
  gui: any;
  options: MountOptions;
  ReactNS: any;
  onNodeResolved?: (record: ResolvedNodeRecord) => void;
}) {
  const renderOptions = React.useMemo(
    () => ({
      ...options,
      React: ReactNS,
      onNodeResolved,
    }),
    [options, ReactNS, onNodeResolved]
  );
  const rendered = React.useMemo(
    () => renderWithGUI(spec, gui, renderOptions),
    [spec, gui, renderOptions]
  );

  return React.createElement(React.Fragment, null, rendered);
}

function RuntimeDevtoolsLayer({
  devtools,
}: {
  devtools: NormalizedMountDevtools;
}) {
  if (!devtools.requested) return null;

  return React.createElement(
    React.Suspense,
    { fallback: null },
    devtools.inspectorRequested
      ? React.createElement(LazyRuntimeInspector, {
          toggleVisible: Boolean(devtools.inspectorToggleVisible),
        })
      : null,
    devtools.adminViewRequested
      ? React.createElement(LazyRuntimeAdminView, {
          enabled:
            typeof devtools.adminViewEnabled === 'boolean'
              ? Boolean(devtools.adminViewEnabled)
              : undefined,
        })
      : null
  );
}

function RuntimeSelectionRoot({
  spec,
  gui,
  options,
  ReactNS,
  devtools,
}: {
  spec: GuiNode;
  gui: any;
  options: MountOptions;
  ReactNS: any;
  devtools: NormalizedMountDevtools;
}) {
  const selection = useSelection();
  const registerNode = selection.registerNode;
  const unregisterNode = selection.unregisterNode;
  // renderWithGUI defers onNodeResolved via queueMicrotask (see
  // scheduleResolvedRecord in renderer.ts), which fires *after* React's
  // synchronous mount + layout-effect pass completes. A same-pass
  // useLayoutEffect keyed on [registerNode, unregisterNode] (both stable
  // references) would only ever run once, before any resolved record has
  // arrived, and never fire again to flush it — so nothing gets registered.
  // Registering directly inside the resolved callback avoids that: by the
  // time any microtask runs, we're already outside React's render/commit
  // phase, so calling registerNode there is safe.
  // ids registered as of the end of the PREVIOUS pass.
  const registeredIds = React.useRef<Set<string>>(new Set());
  // ids resolved so far in the pass currently in flight.
  const currentPassIds = React.useRef<Set<string>>(new Set());
  const collectResolved = React.useCallback(
    (record: ResolvedNodeRecord) => {
      currentPassIds.current.add(record.id);
      registerNode(record);
    },
    [registerNode]
  );

  // mount()'s own contract is that repeated calls on the same host *update*
  // the tree — a real, documented pattern (route changes, closing a modal,
  // a shrinking list, all within the same mount() root). Without this
  // effect, a node that stops resolving in a new pass keeps its record in
  // selectionStore forever: registeredIds only ever grew, and the sole
  // cleanup was full-unmount. This restores per-update pruning.
  //
  // Ordering this relies on: RuntimeCoreRoot's `rendered` walk (which
  // queues each node's onNodeResolved as a queueMicrotask — see
  // scheduleResolvedRecord in renderer.ts) runs synchronously during
  // render, inside the same commit that triggers this passive effect.
  // Passive effects (useEffect) are flushed on a LATER macrotask than the
  // microtask queue, so by the time this effect body runs, every
  // collectResolved call for the pass that just committed has already
  // executed and `currentPassIds.current` already holds that pass's
  // complete id set — no extra queueMicrotask hop is needed (or correct:
  // resetting currentPassIds here and deferring the diff to a *new*
  // microtask, as an earlier version of this effect did, discards the set
  // this same effect is about to read, unregistering every node that just
  // registered). Diff first, THEN roll the sets forward for the next pass.
  React.useEffect(() => {
    const thisPassIds = currentPassIds.current;
    registeredIds.current.forEach((id) => {
      if (!thisPassIds.has(id)) unregisterNode(id);
    });
    registeredIds.current = thisPassIds;
    currentPassIds.current = new Set();
  }, [spec, unregisterNode]);

  React.useEffect(() => {
    return () => {
      registeredIds.current.forEach((id) => unregisterNode(id));
      registeredIds.current = new Set();
    };
  }, [unregisterNode]);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(RuntimeCoreRoot, {
      spec,
      gui,
      options,
      ReactNS,
      onNodeResolved: collectResolved,
    }),
    React.createElement(RuntimeDevtoolsLayer, {
      devtools,
    })
  );
}

/**
 * Mount (or update) a GUI tree into a DOM host.
 * - Repeated calls with the same host element will *update* the existing React root.
 * - Returns a handle with `root` and `unmount()`.
 */
export function mount(
  arg1: GuiNode | MountTarget,
  arg2: MountTarget | GuiNode,
  arg3: MountOptions | any = {}
) {
  let finalSpec = arg1 as GuiNode;
  let finalTarget = arg2 as MountTarget;
  let finalOptions = (arg3 ?? {}) as MountOptions;

  // Backward compatibility:
  // mount(target, spec, ctx) -> mount(spec, target, { ctx })
  if (isTargetLike(arg1) && !isTargetLike(arg2)) {
    warnLegacySignature();
    finalSpec = arg2 as GuiNode;
    finalTarget = arg1 as MountTarget;

    if (isPlainObject(arg3)) {
      finalOptions = { ...arg3 } as MountOptions;
      if (!('ctx' in finalOptions)) {
        (finalOptions as any).ctx = arg3;
      }
    } else {
      finalOptions = { ctx: arg3 } as MountOptions;
    }
  }

  const { gui, React, ReactDOM } = getReactGlobals(finalOptions);
  const devtools = normalizeMountDevtools(finalOptions);
  const resolvedMe = resolveMountedKernel(finalOptions);
  if (!finalOptions.runtime && resolvedMe) {
    const runtimeFactory =
      typeof gui?.render === 'function'
        ? gui.render
        : typeof gui?.RunMe === 'function'
          ? gui.RunMe
          : null;
    if (runtimeFactory) {
      finalOptions = { ...finalOptions, runtime: runtimeFactory(resolvedMe) };
    }
  }

  if (!gui) throw new Error('[this.GUI] Missing window.GUI (UMD surface).');
  if (!React) throw new Error('[this.GUI] Missing window.React.');
  if (!ReactDOM?.createRoot) throw new Error('[this.GUI] Missing ReactDOM.createRoot.');

  const host = resolveTarget(finalTarget);
  const cache = getRootCache();

  let root = cache.get(host);
  if (!root) {
    root = ReactDOM.createRoot(host) as ReactRoot;
    cache.set(host, root);
  }

  let el = React.createElement(
    RuntimeEnvironmentProvider,
    {
      value: {
        gui,
        runtime: finalOptions.runtime,
        ctx: finalOptions.ctx,
        me: resolvedMe,
      },
    },
    devtools.requested
      ? React.createElement(
          SelectionProvider,
          { initialInspectorEnabled: Boolean(devtools.inspectorEnabled) },
          React.createElement(RuntimeSelectionRoot, {
            spec: finalSpec,
            gui,
            options: finalOptions,
            ReactNS: React,
            devtools,
          })
        )
      : React.createElement(RuntimeCoreRoot, {
          spec: finalSpec,
          gui,
          options: finalOptions,
          ReactNS: React,
        })
  );

  // Some components rely on `useInsetsContext`, which requires an `InsetsProvider` above.
  // In UMD mode we try to discover providers from the exposed `window.GUI` surface.
  const InsetsProvider =
    (gui && (gui.InsetsProvider || gui.insetsProvider)) ||
    (gui?.Contexts && (gui.Contexts.InsetsProvider || gui.Contexts.insetsProvider)) ||
    (gui?.contexts && (gui.contexts.InsetsProvider || gui.contexts.insetsProvider)) ||
    (gui?.Theme && (gui.Theme.InsetsProvider || gui.Theme.insetsProvider)) ||
    (gui?.theme && (gui.theme.InsetsProvider || gui.theme.insetsProvider));

  // If your GUI has a top-level theme/provider (common in this.GUI), wrap with it as well.
  const ThemeProvider =
    gui?.Theme ||
    gui?.theme?.Theme ||
    (gui?.Theme && gui.Theme.Theme);

  if (InsetsProvider) {
    el = React.createElement(InsetsProvider as any, null, el);
  }
  if (ThemeProvider) {
    el = React.createElement(ThemeProvider as any, null, el);
  }

  root.render(el);

  return {
    root,
    host,
    unmount: () => {
      try {
        root?.unmount?.();
      } finally {
        // Ensure future mounts recreate a fresh root.
        cache.delete(host);
      }
    },
  };
}
