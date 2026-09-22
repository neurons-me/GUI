/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GuiSpecNode } from '@/types/gui.types';
import type { UnsubscribeFn } from './adapter';

export interface NamespaceProvider {
  resolve(path: string): Promise<any>;
  subscribe(path: string, callback: (data: any) => void): UnsubscribeFn;
  getSurface(namespace: string, route: string): Promise<GuiSpecNode | null>;
}

export type NamespaceProviderEndpoints = {
  resolve: string;
  surface: string;
  subscribe?: string | null;
};

export type NamespaceProviderBoot = {
  kind: 'namespace-provider';
  version: 1;
  namespace: string;
  /** The namespace every handle lives under -- `namespace` itself at the root, else its parent. */
  rootNamespace?: string;
  /** The handle when `namespace` is `<handle>.<rootNamespace>`, else null (the root itself). */
  handle?: string | null;
  route: string;
  origin?: string;
  apiOrigin?: string;
  resolverHostName?: string;
  resolverDisplayName?: string;
  surfaceEntry?: Record<string, any> | null;
  endpoints: NamespaceProviderEndpoints;
  /**
   * Where under `namespace` this page/interface is mounted -- '' means the namespace's own root, a
   * slash-form semantic path means an interior node acting as this interface's own root. Part of the
   * MOUNT REFERENCE (namespace + node path) that ties a self-contained page to `.me` -- see
   * GatewayAccessContract.md §7 and mountReference.ts. Names WHERE, never who or what may be done there.
   */
  nodePath?: string;
};

export type CreateHttpNamespaceProviderOptions = {
  pollIntervalMs?: number;
  fetchImpl?: typeof fetch;
};

const PROVIDER_STATUS_KEY = '__THIS_GUI_PROVIDER_STATUS__';

function setProviderStatus(step: string, detail?: string) {
  try {
    (globalThis as any)[PROVIDER_STATUS_KEY] = {
      step,
      detail: detail || '',
      at: Date.now(),
    };
  } catch {}
}

function normalizeSemanticPath(path: string): string {
  return String(path ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/{2,}/g, '/');
}

function normalizeSurfaceRoute(route: string): string {
  const raw = String(route ?? '').trim();
  if (!raw) return '/';
  const withoutQuery = raw.split('?')[0]?.split('#')[0] ?? '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  if (collapsed === '/') return '/';
  return collapsed.replace(/\/+$/, '') || '/';
}

function resolveFetchImpl(options: CreateHttpNamespaceProviderOptions): typeof fetch {
  if (typeof options.fetchImpl === 'function') return options.fetchImpl;
  if (typeof fetch === 'function') return fetch;
  throw new Error('[this.gui] createHttpNamespaceProvider requires fetch.');
}

function resolveBaseUrl(boot: NamespaceProviderBoot): string | undefined {
  const origin = String(boot.apiOrigin || boot.origin || '').trim();
  if (origin) return origin;
  if (typeof window !== 'undefined' && window.location?.href) return window.location.href;
  return undefined;
}

function toUrl(endpoint: string, boot: NamespaceProviderBoot): URL {
  const base = resolveBaseUrl(boot);
  if (base) return new URL(endpoint, base);
  return new URL(endpoint);
}

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function unwrapResolvedValue(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  if ('value' in payload) return payload.value;
  if ('surface' in payload) return payload.surface;
  if (payload.target && typeof payload.target === 'object' && 'value' in payload.target) {
    return payload.target.value;
  }
  return payload;
}

function unwrapSurfaceValue(payload: any): GuiSpecNode | null {
  if (!payload || typeof payload !== 'object') return payload ?? null;
  if ('surface' in payload) return (payload.surface as GuiSpecNode) ?? null;
  return (unwrapResolvedValue(payload) as GuiSpecNode) ?? null;
}

export function isNamespaceProvider(value: unknown): value is NamespaceProvider {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as NamespaceProvider;
  return (
    typeof candidate.resolve === 'function' &&
    typeof candidate.subscribe === 'function' &&
    typeof candidate.getSurface === 'function'
  );
}

export function createHttpNamespaceProvider(
  boot: NamespaceProviderBoot,
  options: CreateHttpNamespaceProviderOptions = {}
): NamespaceProvider {
  const fetchImpl = resolveFetchImpl(options);
  const pollIntervalMs = Math.max(250, Number(options.pollIntervalMs || 1500));

  async function resolve(path: string) {
    const url = toUrl(boot.endpoints.resolve, boot);
    const normalizedPath = normalizeSemanticPath(path);
    if (normalizedPath) {
      url.searchParams.set('path', normalizedPath);
    } else {
      url.searchParams.delete('path');
    }
    url.searchParams.set('namespace', String(boot.namespace || '').trim());
    url.searchParams.set('route', normalizeSurfaceRoute(boot.route));
    setProviderStatus('provider:resolve:start', `${boot.namespace}:${normalizedPath || '/'}`);

    const response = await fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      const detail =
        payload && typeof payload === 'object' && 'detail' in payload
          ? String((payload as any).detail)
          : response.statusText || `HTTP ${response.status}`;
      throw new Error(`[this.gui] NamespaceProvider.resolve failed: ${detail}`);
    }
    setProviderStatus('provider:resolve:done', `${boot.namespace}:${normalizedPath || '/'}`);
    return unwrapResolvedValue(payload);
  }

  async function getSurface(namespace: string, route: string) {
    const url = toUrl(boot.endpoints.surface, boot);
    const resolvedNamespace = String(namespace || boot.namespace || '').trim();
    const resolvedRoute = normalizeSurfaceRoute(route || boot.route);
    url.searchParams.set('namespace', resolvedNamespace);
    url.searchParams.set('route', resolvedRoute);
    setProviderStatus('provider:get-surface:start', `${resolvedNamespace}:${resolvedRoute}`);

    const response = await fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      const detail =
        payload && typeof payload === 'object' && 'detail' in payload
          ? String((payload as any).detail)
          : response.statusText || `HTTP ${response.status}`;
      throw new Error(`[this.gui] NamespaceProvider.getSurface failed: ${detail}`);
    }
    setProviderStatus('provider:get-surface:done', `${resolvedNamespace}:${resolvedRoute}`);
    return unwrapSurfaceValue(payload);
  }

  function subscribe(path: string, callback: (data: any) => void): UnsubscribeFn {
    const normalizedPath = normalizeSemanticPath(path);
    let active = true;
    let lastSerialized = '';
    let seeded = false;

    const pump = async () => {
      if (!active) return;
      try {
        const value = await resolve(normalizedPath);
        const serialized = JSON.stringify(value);
        if (!seeded || serialized !== lastSerialized) {
          seeded = true;
          lastSerialized = serialized;
          callback(value);
        }
      } catch {
        // Best effort polling; callers can still perform explicit resolve() for hard failures.
      }
    };

    void pump();
    const timer = setInterval(() => {
      void pump();
    }, pollIntervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }

  return {
    resolve,
    subscribe,
    getSurface,
  };
}
