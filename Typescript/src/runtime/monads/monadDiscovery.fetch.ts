import {
  endpointIdentity,
  endpointToPath,
  normalizeMonadEndpointInput,
} from './monadDiscovery.normalize';
import type {
  DiscoveredMonad,
  EndpointCandidate,
  EndpointHealth,
  MonadControlAction,
  MonadControlEndpoint,
  MonadControlRecord,
  MonadDiscoveryError,
  MonadDiscoveryFetch,
  MonadDiscoverySource,
  MonadSurfaceInfo,
} from './monadDiscovery.types';

type ProbeBase = {
  endpoint: string;
  sources: MonadDiscoverySource[];
  timeoutMs: number;
  fetchImpl?: MonadDiscoveryFetch;
};

export type SurfaceProbeResult = {
  endpoint: EndpointHealth;
  monad: DiscoveredMonad | null;
  error?: MonadDiscoveryError;
};

export type ControlProbeResult = {
  control: MonadControlEndpoint | null;
  monads: DiscoveredMonad[];
  error?: MonadDiscoveryError;
};

export type MeshProbeResult = {
  monads: DiscoveredMonad[];
  error?: MonadDiscoveryError;
};

export type NetGetAppsProbeResult = {
  endpoint: string;
  available: boolean;
  monads: DiscoveredMonad[];
  error?: MonadDiscoveryError;
};

function now() {
  return Date.now();
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function readArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
    : [];
}

function resolveFetch(fetchImpl?: MonadDiscoveryFetch): MonadDiscoveryFetch {
  if (typeof fetchImpl === 'function') return fetchImpl;
  if (typeof fetch === 'function') return fetch.bind(globalThis);
  throw new Error('[this.gui] Monad discovery requires fetch.');
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  fetchImpl?: MonadDiscoveryFetch,
): Promise<{ response: Response; payload: any }> {
  const fetcher = resolveFetch(fetchImpl);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), Math.max(1, timeoutMs))
    : null;

  try {
    const response = await fetcher(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller?.signal,
      cache: 'no-store',
    });
    const payload = await readJson(response);
    return { response, payload };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// readJson() above falls back to `{ text }` when a response body isn't
// valid JSON -- a real Monad's /__surface contract is always JSON, so that
// fallback shape is proof this ISN'T one, not a lenient variant of a real
// surface payload. Without this check, a non-Monad server that 200s some
// unrelated HTML at this path (an SPA's own catch-all index.html for any
// unmatched route, which frontend_local's own server does) reads as
// `alive` below purely because response.ok was true -- confirmed live as a
// real gap, not a hypothetical one.
function isGenuineSurfacePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  return !('text' in (payload as Record<string, unknown>));
}

function discoveryError(
  stage: MonadDiscoveryError['stage'],
  error: unknown,
  endpoint?: string,
): MonadDiscoveryError {
  return {
    endpoint,
    stage,
    message: error instanceof Error ? error.message : String(error || 'Unknown error'),
    at: now(),
  };
}

function endpointHealth(
  candidate: EndpointCandidate,
  status: EndpointHealth['status'],
  input: Partial<EndpointHealth> = {},
): EndpointHealth {
  const url = normalizeMonadEndpointInput(candidate.url);
  return {
    url,
    identity: endpointIdentity(url).key,
    status,
    sources: Array.from(new Set(candidate.sources)).sort(),
    lastCheckedAt: now(),
    lastSeenAt: status === 'alive' ? now() : null,
    ...input,
  };
}

function namespaceFromPayload(payload: any): string {
  const targetNamespace = payload?.target?.namespace;
  return readString(
    payload?.namespace?.me,
    payload?.namespace,
    targetNamespace?.me,
    targetNamespace,
    payload?.surfaceEntry?.namespace,
    payload?.raw?.namespace,
  );
}

export function normalizeSurfacePayload(payload: any, endpoint: string, latencyMs?: number): MonadSurfaceInfo {
  const surfaceEntry = payload?.surfaceEntry || payload?.surface || payload?.provider?.surfaceEntry || {};
  const monad = payload?.monad || surfaceEntry?.monad || {};
  const resolvedEndpoint = normalizeMonadEndpointInput(
    readString(surfaceEntry?.endpoint, payload?.endpoint, payload?.transport?.endpoint, endpoint),
  ) || endpoint;
  const status = readString(
    surfaceEntry?.status?.availability,
    payload?.status?.availability,
    payload?.status,
  );
  const capabilities = Array.from(new Set([
    ...readArray(surfaceEntry?.resources),
    ...readArray(payload?.resources),
    ...readArray(surfaceEntry?.capabilities),
    ...readArray(payload?.capabilities),
  ])).sort();

  return {
    endpoint: resolvedEndpoint,
    monadId: readString(
      payload?.monadId,
      payload?.monad_id,
      monad?.id,
      surfaceEntry?.monadId,
      surfaceEntry?.monad_id,
      resolvedEndpoint,
    ),
    monadName: readString(
      payload?.monadName,
      payload?.name,
      monad?.name,
      surfaceEntry?.monadName,
      surfaceEntry?.name,
    ),
    namespace: namespaceFromPayload(payload),
    status,
    capabilities,
    latencyMs,
    raw: payload,
  };
}

function monadFromSurface(surface: MonadSurfaceInfo, sources: MonadDiscoverySource[]): DiscoveredMonad {
  const endpoint = normalizeMonadEndpointInput(surface.endpoint);
  const id = readString(surface.monadId, endpoint);
  const name = readString(surface.monadName, surface.namespace, endpoint);
  const healthy = !surface.status || surface.status === 'online' || surface.status === 'current';
  return {
    id,
    name,
    namespace: surface.namespace,
    endpoint,
    endpoints: endpoint ? [endpoint] : [],
    sources: Array.from(new Set([...sources, 'surface'])).sort() as MonadDiscoverySource[],
    healthy,
    status: surface.status || (healthy ? 'online' : 'unknown'),
    capabilities: surface.capabilities,
    metadata: { surface },
  };
}

function normalizeControlRecord(value: any): MonadControlRecord {
  return {
    name: readString(value?.name, value?.id, value?.monadId, value?.monad_id),
    port: Number.isFinite(Number(value?.port)) ? Number(value.port) : undefined,
    status: readString(value?.status, value?.healthy ? 'online' : '') || 'unknown',
    namespace: readString(value?.namespace, value?.identity),
    endpoint: normalizeMonadEndpointInput(readString(value?.endpoint)),
    healthy: typeof value?.healthy === 'boolean' ? value.healthy : undefined,
    error: readString(value?.error),
    raw: value,
  };
}

function normalizeControlAction(value: any): MonadControlAction | null {
  const name = readString(value?.name, value);
  if (!name) return null;
  return {
    name,
    label: readString(value?.label),
    command: readString(value?.command),
    method: readString(value?.method),
    path: readString(value?.path),
    scope: readString(value?.scope),
  };
}

function monadFromControlRecord(
  record: MonadControlRecord,
  controlEndpoint: string,
): DiscoveredMonad | null {
  const endpoint = normalizeMonadEndpointInput(record.endpoint);
  if (!endpoint && !record.name) return null;
  const healthy = record.healthy === true || record.status === 'online' || record.status === 'running';
  const id = readString(record.raw && (record.raw as any).monad_id, record.raw && (record.raw as any).monadId, record.name, endpoint);
  return {
    id,
    name: readString(record.name, endpoint),
    namespace: record.namespace,
    endpoint,
    endpoints: endpoint ? [endpoint] : [],
    controlEndpoint,
    sources: ['registry'],
    healthy,
    status: record.status,
    capabilities: [],
    metadata: { record },
  };
}

function monadFromMeshEntry(entry: any): DiscoveredMonad | null {
  const endpoint = normalizeMonadEndpointInput(readString(entry?.endpoint));
  const id = readString(entry?.monad_id, entry?.monadId, entry?.id, endpoint);
  if (!id && !endpoint) return null;
  const name = readString(entry?.name, entry?.monadName, id, endpoint);
  return {
    id,
    name,
    namespace: readString(entry?.namespace),
    endpoint,
    endpoints: endpoint ? [endpoint] : [],
    sources: ['mesh'],
    healthy: false,
    status: 'unknown',
    capabilities: readArray(entry?.capabilities),
    metadata: { mesh: entry },
  };
}

function isMonadApp(app: any): boolean {
  const tags = readArray(app?.tags).map((tag) => tag.toLowerCase());
  const name = readString(app?.name).toLowerCase();
  return app?.kind === 'monad' || tags.includes('monad') || name.startsWith('monad:');
}

function appEndpoint(app: any): string {
  const direct = normalizeMonadEndpointInput(readString(
    app?.metadata?.controlEndpoint,
    app?.metadata?.endpoint,
    app?.url,
  ));
  if (direct) return direct;
  const host = readString(app?.host, '127.0.0.1') || '127.0.0.1';
  const port = Number(app?.port);
  if (!Number.isFinite(port) || port <= 0) return '';
  const protocol = readString(app?.protocol, 'http') || 'http';
  return normalizeMonadEndpointInput(`${protocol}://${host}:${port}`);
}

function monadFromNetGetApp(app: any, registryEndpoint: string): DiscoveredMonad | null {
  if (!isMonadApp(app)) return null;
  const endpoint = appEndpoint(app);
  const rawName = readString(app?.metadata?.monadName, app?.name).replace(/^monad:/i, '');
  const name = readString(rawName, endpoint, app?.id);
  const namespace = readString(app?.metadata?.namespace, app?.metadata?.identity);
  const id = readString(app?.metadata?.monadId, namespace && name ? `monad:${namespace}:${name}` : '', name, endpoint, app?.id);
  if (!id && !endpoint) return null;
  const healthState = readString(app?.health?.state).toLowerCase();
  const status = readString(app?.status, healthState, app?.portStatus, 'unknown');
  const capabilities = readArray(app?.metadata?.capabilities);
  const healthy = Boolean(app?.alive) ||
    status === 'running' ||
    status === 'online' ||
    healthState === 'healthy' ||
    app?.portStatus === 'active';

  return {
    id,
    name,
    namespace,
    endpoint,
    endpoints: endpoint ? [endpoint] : [],
    controlEndpoint: endpoint,
    sources: ['registry'],
    healthy,
    status,
    capabilities,
    metadata: {
      netget: app,
      registryEndpoint,
      exposure: app?.exposure,
    },
  };
}

export async function probeMonadSurface(input: ProbeBase): Promise<SurfaceProbeResult> {
  const endpoint = normalizeMonadEndpointInput(input.endpoint);
  const candidate: EndpointCandidate = { url: endpoint, sources: input.sources };
  const startedAt = now();

  try {
    const { response, payload } = await fetchJsonWithTimeout(
      endpointToPath(endpoint, '/__surface'),
      input.timeoutMs,
      input.fetchImpl,
    );
    const latencyMs = now() - startedAt;
    if (!response.ok) {
      const error = `HTTP ${response.status}`;
      return {
        endpoint: endpointHealth(candidate, 'dead', { latencyMs, error }),
        monad: null,
        error: { endpoint, stage: 'surface', message: error, at: now() },
      };
    }

    if (!isGenuineSurfacePayload(payload)) {
      const error = 'Non-JSON response from /__surface';
      return {
        endpoint: endpointHealth(candidate, 'dead', { latencyMs, error }),
        monad: null,
        error: { endpoint, stage: 'surface', message: error, at: now() },
      };
    }

    const surface = normalizeSurfacePayload(payload, endpoint, latencyMs);
    return {
      endpoint: endpointHealth(candidate, 'alive', { latencyMs, surface }),
      monad: monadFromSurface(surface, input.sources),
    };
  } catch (error) {
    return {
      endpoint: endpointHealth(candidate, 'dead', { error: error instanceof Error ? error.message : String(error) }),
      monad: null,
      error: discoveryError('surface', error, endpoint),
    };
  }
}

export async function probeMonadControl(input: ProbeBase): Promise<ControlProbeResult> {
  const endpoint = normalizeMonadEndpointInput(input.endpoint);
  try {
    const { response, payload } = await fetchJsonWithTimeout(
      endpointToPath(endpoint, '/__monads'),
      input.timeoutMs,
      input.fetchImpl,
    );
    if (!response.ok) {
      return {
        control: null,
        monads: [],
        error: { endpoint, stage: 'control', message: `HTTP ${response.status}`, at: now() },
      };
    }

    const records = (Array.isArray(payload?.monads) ? payload.monads : [])
      .map(normalizeControlRecord)
      .filter((record: MonadControlRecord) => record.name || record.endpoint);
    const control: MonadControlEndpoint = {
      endpoint,
      available: true,
      command: {
        name: readString(payload?.command?.name),
        install: readString(payload?.command?.install),
        start: readString(payload?.command?.start),
        actions: Array.isArray(payload?.command?.actions)
          ? payload.command.actions.map(normalizeControlAction).filter(Boolean) as MonadControlAction[]
          : undefined,
      },
      records,
    };
    return {
      control,
      monads: records
        .map((record: MonadControlRecord) => monadFromControlRecord(record, endpoint))
        .filter(Boolean) as DiscoveredMonad[],
    };
  } catch (error) {
    return {
      control: null,
      monads: [],
      error: discoveryError('control', error, endpoint),
    };
  }
}

export async function probeMonadMesh(input: ProbeBase): Promise<MeshProbeResult> {
  const endpoint = normalizeMonadEndpointInput(input.endpoint);
  try {
    const { response, payload } = await fetchJsonWithTimeout(
      endpointToPath(endpoint, '/.mesh/monads'),
      input.timeoutMs,
      input.fetchImpl,
    );
    if (!response.ok) {
      return {
        monads: [],
        error: { endpoint, stage: 'mesh', message: `HTTP ${response.status}`, at: now() },
      };
    }

    return {
      monads: (Array.isArray(payload?.monads) ? payload.monads : [])
        .map(monadFromMeshEntry)
        .filter(Boolean) as DiscoveredMonad[],
    };
  } catch (error) {
    return {
      monads: [],
      error: discoveryError('mesh', error, endpoint),
    };
  }
}

export async function probeNetGetApps(input: ProbeBase): Promise<NetGetAppsProbeResult> {
  const endpoint = normalizeMonadEndpointInput(input.endpoint);
  try {
    const { response, payload } = await fetchJsonWithTimeout(
      endpointToPath(endpoint, '/apps'),
      input.timeoutMs,
      input.fetchImpl,
    );
    if (!response.ok) {
      return {
        endpoint,
        available: false,
        monads: [],
        error: { endpoint, stage: 'registry', message: `HTTP ${response.status}`, at: now() },
      };
    }

    const apps = Array.isArray(payload?.apps) ? payload.apps : [];
    return {
      endpoint,
      available: true,
      monads: apps
        .map((app: any) => monadFromNetGetApp(app, endpoint))
        .filter(Boolean) as DiscoveredMonad[],
    };
  } catch (error) {
    return {
      endpoint,
      available: false,
      monads: [],
      error: discoveryError('registry', error, endpoint),
    };
  }
}
