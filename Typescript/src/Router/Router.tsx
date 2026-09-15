import React, { ReactNode } from "react";
import { BrowserRouter, useInRouterContext } from "react-router-dom";
import { mount as mountGUI } from "@/runtime/mount";
import type { MountOptions, MountTarget } from "@/runtime/mount";

export type RouteSpec = any;
export type RouterRuntime = {
  resolve?: (value: any, context?: RouterResolveContext) => any | Promise<any>;
  action?: (expression: string, context?: RouterResolveContext) => (...args: any[]) => any;
};

export type RouteHandler =
  | string
  | RouteSpec
  | ((context: RouterResolveContext) => RouteSpec | Promise<RouteSpec>);

export type RouterResolveContext = {
  path: string;
  router: Router;
  runtime: RouterRuntime | null;
  ctx: Record<string, any>;
};

export type RouterNavigateOptions = {
  push?: boolean;
  ctx?: Record<string, any>;
};

type RouterChangeListener = (spec: RouteSpec, meta: { path: string; ctx: Record<string, any> }) => void;
type NotFoundHandler = (context: RouterResolveContext, error?: unknown) => RouteSpec;
type RouterMountOptions = Omit<MountOptions, "runtime" | "ctx">;

const defaultNotFound: NotFoundHandler = () => ({ type: "Page", children: ["404 Not Found"] });

const ROUTER_STATUS_KEY = '__THIS_GUI_ROUTER_STATUS__';

function setRouterStatus(step: string, detail?: string) {
  try {
    (globalThis as any)[ROUTER_STATUS_KEY] = {
      step,
      detail: detail || '',
      at: Date.now(),
    };
  } catch {}
}

type CompiledRoute = {
  path: string;
  handler: RouteHandler;
  regex?: RegExp;
  keys?: string[];
  score: number;
};

/**
 * SPA navigation kernel for declarative specs.
 * - Runtime is optional (semantic pointers only resolve when runtime.resolve exists).
 * - Supports sync/async route factories.
 * - Emits `onChange` notifications to decoupled renderers.
 */
export class Router {
  private routes = new Map<string, CompiledRoute>();
  private listeners = new Set<RouterChangeListener>();
  private popstateHandler?: () => void;
  private mountTarget: MountTarget | null = null;
  private mountOptions: RouterMountOptions = {};
  public runtime: RouterRuntime | null;
  public notFound: NotFoundHandler;
  public currentPath: string | null = null;
  public basePath: string;

  constructor({
    runtime = null,
    notFound = defaultNotFound,
    useHistory = true,
    basePath = "/",
  }: {
    runtime?: RouterRuntime | null;
    notFound?: NotFoundHandler;
    useHistory?: boolean;
    basePath?: string;
  } = {}) {
    this.runtime = runtime;
    this.notFound = notFound;
    this.basePath = this.normalizeBasePath(basePath);

    if (useHistory && typeof window !== "undefined") {
      this.popstateHandler = () => {
        void this.navigate(this.stripBasePath(window.location.pathname), { push: false });
      };
      window.addEventListener("popstate", this.popstateHandler);
    }
  }

  destroy(): void {
    if (this.popstateHandler && typeof window !== "undefined") {
      window.removeEventListener("popstate", this.popstateHandler);
    }
    this.listeners.clear();
  }

  mount(target: MountTarget, options: RouterMountOptions = {}): this {
    this.mountTarget = target;
    this.mountOptions = { ...options };
    return this;
  }

  get(path: string, handler: RouteHandler): this {
    return this.set(path, handler);
  }

  start(path = "/", ctx: Record<string, any> = {}): Promise<RouteSpec> {
    return this.navigate(path, { push: false, ctx });
  }

  go(path: string, ctx: Record<string, any> = {}): Promise<RouteSpec> {
    return this.navigate(path, { push: true, ctx });
  }

  private renderMounted(spec: RouteSpec, ctx: Record<string, any>): void {
    if (!this.mountTarget) return;
    setRouterStatus('router:mount:start', this.currentPath || '/');
    mountGUI(spec, this.mountTarget, {
      ...this.mountOptions,
      runtime: this.runtime ?? undefined,
      ctx,
    });
    setRouterStatus('router:mount:done', this.currentPath || '/');
  }

  private normalize(path: string): string {
    const input = String(path ?? "").trim();
    if (!input || input === "/") return "/";
    const first = input.startsWith("/") ? input : `/${input}`;
    const noQuery = first.split("?")[0]?.split("#")[0] ?? "/";
    const collapsed = noQuery.replace(/\/{2,}/g, "/");
    if (collapsed !== "/" && collapsed.endsWith("/")) return collapsed.replace(/\/+$/, "");
    return collapsed;
  }

  private normalizeBasePath(basePath: string): string {
    const input = String(basePath ?? "").trim();
    if (!input || input === "/") return "";
    const first = input.startsWith("/") ? input : `/${input}`;
    const collapsed = first.replace(/\/{2,}/g, "/");
    return collapsed !== "/" && collapsed.endsWith("/") ? collapsed.replace(/\/+$/, "") : collapsed;
  }

  private stripBasePath(path: string): string {
    const normalized = this.normalize(path);
    if (!this.basePath) return normalized;
    if (normalized === this.basePath) return "/";
    if (normalized.startsWith(`${this.basePath}/`)) {
      const stripped = normalized.slice(this.basePath.length);
      return stripped || "/";
    }
    return normalized;
  }

  href(path: string): string {
    const normalized = this.stripBasePath(path);
    if (!this.basePath) return normalized;
    return normalized === "/" ? `${this.basePath}/` : `${this.basePath}${normalized}`;
  }

  private hasDynamicSegments(path: string): boolean {
    return path.includes(":") || path.includes("*");
  }

  private escapeRegex(input: string): string {
    return input.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }

  private buildPattern(path: string): { regex: RegExp; keys: string[]; score: number } {
    const keys: string[] = [];
    const segments = path.split("/").filter(Boolean);
    const parts: string[] = [];
    let staticCount = 0;

    for (const seg of segments) {
      if (seg === "*") {
        const wKey = `wildcard_${keys.filter((k) => k.startsWith("wildcard_")).length + 1}`;
        keys.push(wKey);
        parts.push("(.*)");
        continue;
      }
      if (seg.startsWith(":") && seg.length > 1) {
        keys.push(seg.slice(1));
        parts.push("([^/]+)");
        continue;
      }
      staticCount += 1;
      parts.push(this.escapeRegex(seg));
    }

    const pattern = `^/${parts.join("/")}$`;
    return { regex: new RegExp(pattern), keys, score: staticCount };
  }

  private safeDecode(value: string, key: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      // eslint-disable-next-line no-console
      console.warn(`[Router] Failed to decode param "${key}": ${value}`);
      return value;
    }
  }

  private findRoute(path: string): { route: CompiledRoute; params: Record<string, string> } | null {
    const exact = this.routes.get(path);
    if (exact && !exact.regex) return { route: exact, params: {} };

    let best: { route: CompiledRoute; params: Record<string, string> } | null = null;
    for (const [, route] of this.routes) {
      if (!route.regex) continue;
      const match = path.match(route.regex);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.keys?.forEach((key, i) => {
        const raw = match[i + 1] ?? "";
        params[key] = this.safeDecode(raw, key);
      });

      if (!best) {
        best = { route, params };
        continue;
      }

      // Higher score = more specific static segments.
      if (route.score > best.route.score) {
        best = { route, params };
      }
    }
    return best;
  }

  set(path: string, handler: RouteHandler): this {
    const normalized = this.normalize(path);
    const kind = typeof handler;
    const valid = kind === "function" || kind === "string" || kind === "object";
    if (!valid || handler == null) {
      throw new Error(`[Router] Invalid handler for ${path}. Expected function, string pointer, or spec object.`);
    }
    if (!this.hasDynamicSegments(normalized)) {
      this.routes.set(normalized, { path: normalized, handler, score: Number.MAX_SAFE_INTEGER });
      return this;
    }

    const { regex, keys, score } = this.buildPattern(normalized);
    this.routes.set(normalized, { path: normalized, handler, regex, keys, score });
    return this;
  }

  async resolve(path: string, ctx: Record<string, any> = {}): Promise<RouteSpec> {
    const normalized = this.stripBasePath(path);
    setRouterStatus('router:resolve:start', normalized);
    const found = this.findRoute(normalized);
    const handler = found?.route?.handler ?? this.notFound;
    const params = found?.params ?? {};
    const enrichedCtx = {
      ...ctx,
      params,
      wildcard: params.wildcard_1,
    };
    const context: RouterResolveContext = { path: normalized, router: this, runtime: this.runtime, ctx: enrichedCtx };

    try {
      if (typeof handler === "string") {
        // Semantic pointer mode (optional)
        if (handler.startsWith("me/") && this.runtime?.resolve) {
          const out = await this.runtime.resolve(handler, context);
          setRouterStatus('router:resolve:done', normalized);
          return out;
        }
        setRouterStatus('router:resolve:done', normalized);
        return { type: "Text", children: [handler] };
      }

      if (typeof handler === "function") {
        const out = await handler(context);
        setRouterStatus('router:resolve:done', normalized);
        return out;
      }

      setRouterStatus('router:resolve:done', normalized);
      return handler;
    } catch (error) {
      // Keep the SPA alive on route failures.
      // eslint-disable-next-line no-console
      console.error(`[Router] Error resolving ${normalized}:`, error);
      setRouterStatus('router:resolve:error', normalized);
      return this.notFound(context, error);
    }
  }

  async navigate(path: string, { push = true, ctx = {} }: RouterNavigateOptions = {}): Promise<RouteSpec> {
    const normalized = this.stripBasePath(path);
    setRouterStatus('router:navigate:start', normalized);
    this.currentPath = normalized;
    const spec = await this.resolve(normalized, ctx);

    if (push && typeof window !== "undefined") {
      const href = this.href(normalized);
      if (window.location.pathname !== href) {
        window.history.pushState(null, "", href);
      }
    }

    const found = this.findRoute(normalized);
    const params = found?.params ?? {};
    const enrichedCtx = {
      ...ctx,
      params,
      wildcard: params.wildcard_1,
    };
    for (const listener of this.listeners) listener(spec, { path: normalized, ctx: enrichedCtx });
    this.renderMounted(spec, enrichedCtx);
    setRouterStatus('router:navigate:done', normalized);
    return spec;
  }

  onChange(listener: RouterChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function router(
  target: MountTarget,
  {
    runtime = null,
    notFound = defaultNotFound,
    useHistory = true,
    basePath = "/",
    ...mountOptions
  }: {
    runtime?: RouterRuntime | null;
    notFound?: NotFoundHandler;
    useHistory?: boolean;
    basePath?: string;
  } & RouterMountOptions = {}
): Router {
  return new Router({ runtime, notFound, useHistory, basePath }).mount(target, mountOptions);
}

/**
 * React wrapper to ensure Link components can work with router context.
 * This is intentionally separate from the navigation kernel class above.
 */
export const RouterProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const inRouter = useInRouterContext();
  // react-router-dom v7: the v6-era future flags (v7_startTransition,
  // v7_relativeSplatPath) opted into behavior that's just the default now
  // -- BrowserRouterProps no longer has a `future` prop for them at all.
  return inRouter ? <>{children}</> : <BrowserRouter>{children}</BrowserRouter>;
};

export default RouterProvider;
