export type CleakerSurfaceType = 'desktop' | 'mobile' | 'server' | 'browser-tab' | 'node';
export type CleakerSurfaceTrust = 'owner' | 'trusted-peer' | 'guest';
export type CleakerSurfaceAvailability = 'online' | 'offline' | 'sleep' | 'unknown';

export type CleakerSurfaceRequestEvent = {
  id: number;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  host: string;
  namespace: string;
  operation: string;
  nrp: string;
  lens: string;
  forwardedHost: string | null;
};

export type CleakerSurfaceEntry = {
  monadName?: string;
  hostId: string;
  type: CleakerSurfaceType;
  trust: CleakerSurfaceTrust;
  resources: string[];
  capacity: {
    cpuCores: number | null;
    ramGb: number | null;
    storageGb: number | null;
    bandwidthMbps: number | null;
  };
  status: {
    availability: CleakerSurfaceAvailability;
    latencyMs: number | null;
    syncState: 'current' | 'stale' | 'unknown';
    lastSeen: number | null;
  };
  namespace: string;
  endpoint: string;
  rootName: string;
  usage?: {
    cpu: number;
    /** 0-1 fraction of total RAM currently in use, when reported. */
    memory?: number;
    /** 0-1 fraction of the root filesystem currently in use, when reported. */
    storage?: number;
    requestRatePer10s?: number;
  };
  pressure?: {
    cpu: number;
  };
  policy?: {
    gui?: {
      blockchain?: {
        limit?: number;
      };
    };
  };
  budget?: {
    gui?: {
      blockchain?: {
        rows?: number;
      };
    };
  };
  monitor?: {
    recentRequests?: CleakerSurfaceRequestEvent[];
  };
};

function normalizeToken(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

export function stripPortFromName(raw: string): string {
  const normalized = normalizeToken(raw);
  if (!normalized) return '';
  return normalized.replace(/:\d+$/, '');
}

export function isLoopbackishHost(host: string): boolean {
  const normalized = stripPortFromName(host);
  return /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/.test(normalized);
}

function isLikelyLocalHost(host: string): boolean {
  const normalized = stripPortFromName(host);
  return Boolean(normalized) && (isLoopbackishHost(normalized) || normalized.endsWith('.local'));
}

function inferSurfaceType(host: string): CleakerSurfaceType {
  const normalized = stripPortFromName(host);
  if (!normalized) return 'node';
  if (/(iphone|ipad|android|pixel|mobile)/.test(normalized)) return 'mobile';
  if (/(tab|browser)/.test(normalized)) return 'browser-tab';
  if (/(macbook|imac|desktop|laptop|notebook|pc|workstation|\.local$)/.test(normalized)) return 'desktop';
  if (isLoopbackishHost(normalized)) return 'desktop';
  return 'server';
}

function inferTrust(host: string): CleakerSurfaceTrust {
  return isLikelyLocalHost(host) ? 'owner' : 'trusted-peer';
}

function inferResources(type: CleakerSurfaceType, host: string): string[] {
  const resources = new Set<string>(['public_ingress', 'keychain']);

  if (type === 'desktop') {
    resources.add('filesystem');
    resources.add('gpu');
    resources.add('camera');
  } else if (type === 'mobile') {
    resources.add('camera');
  } else if (type === 'server') {
    resources.add('filesystem');
  }

  if (isLikelyLocalHost(host)) {
    resources.add('local_lan');
  }

  return Array.from(resources);
}

export function resolveSemanticRootName(input: {
  namespaceHandle?: string;
  resolverHostName?: string;
  rootHostNamespace?: string;
}): string {
  const handle = stripPortFromName(input.namespaceHandle || '');
  if (handle && !isLoopbackishHost(handle)) return handle;

  const resolver = stripPortFromName(input.resolverHostName || '');
  if (resolver && !isLoopbackishHost(resolver)) return resolver;

  const rootHost = stripPortFromName(input.rootHostNamespace || '');
  if (rootHost) return rootHost;

  return handle || resolver || rootHost;
}

// ── Effective budget — namespace contract, not live telemetry ────────────────
// How many blockchain rows a namespace's render is entitled to, negotiated
// from `.me` intent, surface policy, assigned budget, and current CPU
// pressure. Lives here (not in HostResources) because it's the
// namespace's declared contract/policy — pressure feeds it as an input,
// but the result is a governance number, not a live metric itself.

export type BlockchainLimitSnapshot = {
  meLimit: number;
  policyLimit: number;
  budgetRows: number;
  pressureCpu: number;
  baseLimit: number;
  effectiveLimit: number;
};

export function normalizePositiveNumber(raw: unknown, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function normalizePressure(raw: unknown, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function getSurfaceBlockchainDefaults(surface: {
  type?: string | null;
  status?: { availability?: string | null; syncState?: string | null } | null;
}) {
  const type = String(surface?.type || '').trim().toLowerCase();
  const availability = String(surface?.status?.availability || '').trim().toLowerCase();
  const syncState = String(surface?.status?.syncState || '').trim().toLowerCase();
  const online = availability === 'online' || syncState === 'current';

  if (type === 'mobile' || type === 'browser-tab') {
    return { policyLimit: 48, budgetRows: 24, pressureCpu: online ? 0.4 : 0.65 };
  }

  if (type === 'server' || type === 'node') {
    return { policyLimit: 100, budgetRows: 60, pressureCpu: online ? 0.2 : 0.45 };
  }

  return { policyLimit: 80, budgetRows: 50, pressureCpu: online ? 0.3 : 0.55 };
}

export function computeBlockchainLimit(input: {
  meLimit?: number | null;
  surface?: {
    type?: string | null;
    status?: { availability?: string | null; syncState?: string | null } | null;
    policy?: { gui?: { blockchain?: { limit?: number | null } | null } | null } | null;
    budget?: { gui?: { blockchain?: { rows?: number | null } | null } | null } | null;
    pressure?: { cpu?: number | null } | null;
  } | null;
}): BlockchainLimitSnapshot {
  const surface = input.surface || null;
  const defaults = getSurfaceBlockchainDefaults(surface || {});
  const meLimit = normalizePositiveNumber(input.meLimit, 120);
  const policyLimit = normalizePositiveNumber(surface?.policy?.gui?.blockchain?.limit, defaults.policyLimit);
  const budgetRows = normalizePositiveNumber(surface?.budget?.gui?.blockchain?.rows, defaults.budgetRows);
  const pressureCpu = normalizePressure(surface?.pressure?.cpu, defaults.pressureCpu);
  const baseLimit = Math.min(meLimit, policyLimit, budgetRows);
  const effectiveLimit = Math.max(5, Math.floor(baseLimit * (1 - pressureCpu)));

  return { meLimit, policyLimit, budgetRows, pressureCpu, baseLimit, effectiveLimit };
}

export function createSurfaceEntry(input: {
  namespaceUrl: string;
  endpoint: string;
  namespaceHandle?: string;
  rootHostNamespace?: string;
  resolverHostName?: string;
  connected?: boolean;
}): CleakerSurfaceEntry {
  const hostId =
    stripPortFromName(input.resolverHostName || '') ||
    stripPortFromName(input.rootHostNamespace || '') ||
    stripPortFromName(input.namespaceHandle || '') ||
    'unknown-host';
  const type = inferSurfaceType(hostId);
  const trust = inferTrust(hostId);
  const availability: CleakerSurfaceAvailability = input.connected ? 'online' : 'offline';

  return {
    monadName: '',
    hostId,
    type,
    trust,
    resources: inferResources(type, hostId),
    capacity: {
      cpuCores: null,
      ramGb: null,
      storageGb: null,
      bandwidthMbps: null,
    },
    status: {
      availability,
      latencyMs: null,
      syncState: input.connected ? 'current' : 'unknown',
      lastSeen: input.connected ? Date.now() : null,
    },
    namespace: String(input.namespaceUrl || '').trim(),
    endpoint: String(input.endpoint || '').trim(),
    rootName: resolveSemanticRootName(input),
    usage: {
      cpu: 0,
      requestRatePer10s: 0,
    },
    pressure: {
      cpu: 0,
    },
    policy: {
      gui: {
        blockchain: {
          limit: 80,
        },
      },
    },
    budget: {
      gui: {
        blockchain: {
          rows: 50,
        },
      },
    },
    monitor: {
      recentRequests: [],
    },
  };
}
