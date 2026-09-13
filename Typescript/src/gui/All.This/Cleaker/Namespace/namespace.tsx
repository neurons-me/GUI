// this.GUI — Namespace Container (Clean Version)
// This component ONLY manages:
//  ✔ Endpoint URL
//  ✔ Connection state
//  ✔ Tabs (Users / Blocks)
//  ✔ Passing endpoint prop downward
// No fetching, no table markup.
//@/gui/Session/Session.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, IconButton, Typography, Tooltip } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useGuiTheme, useGuiMediaQuery } from '@/gui-internals/Hooks';
import { useGuiParts } from '@/runtime/parts';
import { useRuntimeEnvironment } from '@/runtime/runtimeContext';
import type { GuiPartsSpec } from '@/types/gui.types';
import UsersTable from './Usernames/Usernames';
import { BlocksTable as BlockchainTable } from './Blocks/BlocksTable';
import HostResources from '../../monad.ai/Host/Resources/HostResources';
import NamespaceInfo from '../NamespaceInfo/NamespaceInfo';
import { buildCleakerNamespaceUrl, parseCleakerNamespaceExpression } from '../namespaceExpression';
import { deriveChildIdentityHash, deriveIdentityRootHash } from '../../me/identity';
import { type CleakerBootstrapInfo, readCleakerBootstrap } from '../runtimeUsername';
import {
  type CleakerSurfaceEntry,
  type CleakerSurfaceRequestEvent,
  computeBlockchainLimit,
  createSurfaceEntry,
  isLoopbackishHost,
  resolveSemanticRootName,
} from '../surfaceModel';

export interface NamespaceProps {
  endpoint?: string;
  defaultTab?: 'users' | 'blocks' | 'details' | 'surface';
  /** Restrict which tabs are visible. Omit to show all. */
  tabs?: Array<'users' | 'blocks' | 'details' | 'surface'>;
  /** NRP path to use as blockchain data source (e.g. /@fatima/name).
   *  Overrides the default /blockchain fetch. Parsed from URL if not provided. */
  blockPath?: string;
  blockRowsLimit?: number;
  namespaceExpression?: string;
  namespaceHandle?: string;
  rootHostNamespace?: string;
  surfaceNamespace?: string;
  subjectSurfaceNamespace?: string;
  subjectHandleNamespace?: string;
  rootNamespaceHash?: string;
  surfaceNamespaceHash?: string;
  subjectNamespaceHash?: string;
  resolverHostName?: string;
  resolverDisplayName?: string;
  resolverSurfaceNamespace?: string;
  resolverSubjectSurfaceNamespace?: string;
  namespaceUrl?: string;
  /** Set false when the caller already renders its own frame/card around
   * this component (border + background + padding) — e.g. a stage/tab
   * container that already has rounded corners. Defaults to true so every
   * existing standalone usage (Storybook, a bare page) is unaffected.
   * When false, this root renders without its own border/background/
   * padding/maxWidth, so it doesn't nest a second frame inside the
   * caller's. */
  framed?: boolean;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
}

function compactNamespaceName(raw: string): string {
  return String(raw || '').trim().toLowerCase().replace(/\.local$/, '');
}

function compactSurfaceLabel(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function formatMonadInstanceLabel(input: {
  monadName?: string;
  endpoint?: string;
  fallbackHost?: string;
}): string {
  const name = String(input.monadName || 'monad').trim() || 'monad';
  const rawEndpoint = String(input.endpoint || '').trim();
  let hostPort = '';

  if (rawEndpoint) {
    try {
      const url = new URL(/^https?:\/\//i.test(rawEndpoint) ? rawEndpoint : `http://${rawEndpoint}`);
      hostPort = url.host || '';
    } catch {
      hostPort = compactSurfaceLabel(rawEndpoint);
    }
  }

  const fallbackHost = compactSurfaceLabel(input.fallbackHost || '');
  return `${name}@${hostPort || fallbackHost || 'unknown'}`;
}

function formatSurfaceNamespace(host: string, port: number | null): string {
  const normalizedHost = String(host || '').trim().toLowerCase();
  if (!normalizedHost) return '';
  return port == null ? normalizedHost : `${normalizedHost}:${port}`;
}

function stripPort(raw: string): string {
  return String(raw || '').trim().toLowerCase().replace(/:\d+$/, '');
}

function normalizeNodeSegment(value: string, fallback: string): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return normalized || fallback;
}

const NAMESPACE_TIP_TEXT =
  'Tip: localhost is only a local access alias. The real namespace comes from the node identity that answered the request.';
const NAMESPACE_SURFACE_DESCRIPTION =
  'This is the current host/surface entry resolved by the monad.ai surface that answered the request.';

const KERNEL_NAMESPACE_CONTROLS_PATH = 'ui.namespace.controls';
const KERNEL_NAMESPACE_TIP_PATH = 'ui.namespace.tip';
const KERNEL_NETWORK_ENDPOINT_PATH = 'network.endpoint';
const KERNEL_NAMESPACE_ROOT_PATH = 'identity.namespace.root';
const KERNEL_NETWORK_STATUS_PATH = 'sys.network.status';
const KERNEL_NAMESPACE_TABS_PATH = 'ui.namespace.tabs';
const KERNEL_NAMESPACE_USERS_PATH = 'ui.namespace.users';
const KERNEL_NAMESPACE_BLOCKS_PATH = 'ui.namespace.blocks';
const KERNEL_NAMESPACE_SURFACE_UI_PATH = 'ui.namespace.surface';
const KERNEL_SURFACE_PATH = 'surface.current';
const KERNEL_NAMESPACE_DETAILS_PATH = 'ui.namespace.details';
const KERNEL_NAMESPACE_PREVIEW_PATH = 'ui.namespace.details.preview';
const KERNEL_RUNTIME_BUDGET_PATH = 'runtime.namespace.budget';
const KERNEL_RUNTIME_INPUTS_PATH = 'runtime.namespace.inputs';
const KERNEL_RUNTIME_LEDGER_PATH = 'runtime.namespace.ledger';

function toKernelWriteTarget(path: string): string {
  return String(path || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\./g, '/');
}

function getKernelTargetProxy(me: any, path: string): any {
  const targetPath = String(path || '').trim();
  if (!targetPath) return me;
  return targetPath
    .split('.')
    .filter(Boolean)
    .reduce((acc: any, key: string) => (acc ? acc[key] : undefined), me);
}

function safeWriteKernelPath(me: any, path: string, value: any): boolean {
  if (!me) return false;
  const targetPath = String(path || '').trim();
  if (!targetPath) return false;

  try {
    if (typeof me.execute === 'function') {
      me.execute(`me://self:write/${toKernelWriteTarget(targetPath)}`, value);
      return true;
    }
  } catch {
    // Fall through to proxy-style write.
  }

  try {
    const target = getKernelTargetProxy(me, targetPath);
    if (typeof target === 'function') {
      target(value);
      return true;
    }
  } catch {
    // Ignore runtime write failures from the UI bridge.
  }

  return false;
}

function normalizeSemanticValue(value: any): any {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => normalizeSemanticValue(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, normalizeSemanticValue(entryValue)])
  );
}

function collectSemanticWrites(path: string, rawValue: any): Array<{ path: string; value: any }> {
  const targetPath = String(path || '').trim();
  if (!targetPath) return [];

  const value = normalizeSemanticValue(rawValue);
  const writes = [{ path: targetPath, value }];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return writes;

  for (const [key, childValue] of Object.entries(value)) {
    writes.push(...collectSemanticWrites(`${targetPath}.${key}`, childValue));
  }

  return writes;
}

function semanticProvenance(
  path: string,
  extras: Record<string, any> = {},
): Record<string, any> {
  const targetPath = String(path || '').trim();
  return {
    source: 'kernel-ui-bridge',
    binding: targetPath,
    semanticPath: targetPath,
    explainPath: targetPath,
    ...extras,
  };
}

function mergeSurfaceEntry(
  base: CleakerSurfaceEntry,
  overlay: Partial<CleakerSurfaceEntry> | null,
  requestEvents: CleakerSurfaceRequestEvent[],
): CleakerSurfaceEntry {
  if (!overlay) {
    return {
      ...base,
      monitor: {
        recentRequests: requestEvents,
      },
    };
  }

  return {
    ...base,
    ...overlay,
    capacity: {
      ...base.capacity,
      ...(overlay.capacity || {}),
    },
    status: {
      ...base.status,
      ...(overlay.status || {}),
    },
    usage: {
      cpu: overlay.usage?.cpu ?? base.usage?.cpu ?? 0,
      requestRatePer10s:
        overlay.usage?.requestRatePer10s ??
        base.usage?.requestRatePer10s ??
        0,
    },
    pressure: {
      cpu: overlay.pressure?.cpu ?? base.pressure?.cpu ?? 0,
    },
    policy: {
      ...(base.policy || {}),
      ...(overlay.policy || {}),
      gui: {
        ...(base.policy?.gui || {}),
        ...(overlay.policy?.gui || {}),
        blockchain: {
          ...(base.policy?.gui?.blockchain || {}),
          ...(overlay.policy?.gui?.blockchain || {}),
        },
      },
    },
    budget: {
      ...(base.budget || {}),
      ...(overlay.budget || {}),
      gui: {
        ...(base.budget?.gui || {}),
        ...(overlay.budget?.gui || {}),
        blockchain: {
          ...(base.budget?.gui?.blockchain || {}),
          ...(overlay.budget?.gui?.blockchain || {}),
        },
      },
    },
    monitor: {
      recentRequests:
        overlay.monitor?.recentRequests && overlay.monitor.recentRequests.length > 0
          ? overlay.monitor.recentRequests
          : requestEvents,
    },
  };
}

export default function Namespace({
  endpoint: endpointProp = 'http://localhost:8161',
  defaultTab = 'users',
  tabs: allowedTabs,
  blockPath: blockPathProp,
  blockRowsLimit = 120,
  namespaceExpression = '',
  namespaceHandle = '',
  rootHostNamespace = '',
  surfaceNamespace = '',
  subjectSurfaceNamespace = '',
  subjectHandleNamespace = '',
  rootNamespaceHash = '',
  surfaceNamespaceHash = '',
  subjectNamespaceHash = '',
  resolverHostName: resolverHostNameProp = '',
  resolverDisplayName: resolverDisplayNameProp = '',
  resolverSurfaceNamespace: resolverSurfaceNamespaceProp = '',
  resolverSubjectSurfaceNamespace: resolverSubjectSurfaceNamespaceProp = '',
  namespaceUrl: namespaceUrlProp = '',
  framed = true,
  'data-gui-node-id': dataGuiNodeId = 'Namespace',
  'data-gui-component': dataGuiComponent = 'Namespace',
}: NamespaceProps) {
  const { me } = useRuntimeEnvironment();
  const [endpoint, setEndpoint] = useState(endpointProp || 'http://localhost:8161');
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'blocks' | 'details' | 'surface'>(defaultTab);
  const [showEndpointInput, setShowEndpointInput] = useState(false);
  const [showNamespaceTip, setShowNamespaceTip] = useState(false);
  const [namespaceHistory, setNamespaceHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ns:history') || '[]'); } catch { return []; }
  });
  const [bootstrapInfo, setBootstrapInfo] = useState<CleakerBootstrapInfo | null>(null);
  const [surfaceTelemetry, setSurfaceTelemetry] = useState<Partial<CleakerSurfaceEntry> | null>(null);
  const [surfaceRequestEvents, setSurfaceRequestEvents] = useState<CleakerSurfaceRequestEvent[]>([]);
  const [stressMode, setStressMode] = useState(false);
  const theme = useGuiTheme();
  const rootNodeId = String(dataGuiNodeId || 'Namespace');
  const rootNodeType = String(dataGuiComponent || 'Namespace');
  const surfaceRowSegment = useCallback(
    (section: string, label: string, index: number) =>
      `${section}-row-${index + 1}-${normalizeNodeSegment(label, `${section}-item`)}`,
    []
  );
  const surfaceResourceSegment = useCallback(
    (resource: string, index: number) =>
      `surface-resource-${index + 1}-${normalizeNodeSegment(resource, 'resource')}`,
    []
  );
  const isMobile = useGuiMediaQuery(theme.breakpoints.down('sm'));
  const debounceRef = useRef<number | null>(null);
  const stressTimerRef = useRef<number | null>(null);
  const semanticWriteCacheRef = useRef<Map<string, string>>(new Map());
  const semanticWriteTargetRef = useRef<any>(null);
  function normalizeEndpoint(raw: string) {
    const v = (raw ?? '').trim();
    if (!v) return null;
    // If user types a token like "Namespace", don't treat as an endpoint.
    if (!v.includes('.') && !v.includes(':') && !v.startsWith('/')) return null;

    // Add protocol if missing.
    const withProto = /^https?:\/\//i.test(v) ? v : `http://${v}`;
    // Strip trailing slash for consistent concatenation.
    return withProto.replace(/\/+$/, '');
  }
  const safeEndpoint = normalizeEndpoint(endpoint) ?? '';
  const previewNamespace = useMemo(() => {
    const candidate = String(endpoint || namespaceExpression || endpointProp || '').trim();
    if (!candidate) return null;
    try {
      return parseCleakerNamespaceExpression(candidate);
    } catch {
      return null;
    }
  }, [endpoint, endpointProp, namespaceExpression]);

  const previewUsername = useMemo(() => {
    const fromPreview = String(previewNamespace?.prefix || '').trim().toLowerCase();
    if (fromPreview) return fromPreview;
    const handle = String(subjectHandleNamespace || '').trim().toLowerCase();
    if (handle.includes('.')) return handle.split('.')[0] || '';
    return '';
  }, [previewNamespace?.prefix, subjectHandleNamespace]);

  const resolvedRootHostNamespace = useMemo(() => {
    return String(previewNamespace?.transport.host || rootHostNamespace || '').trim().toLowerCase();
  }, [previewNamespace?.transport.host, rootHostNamespace]);

  const resolvedSurfaceNamespace = useMemo(() => {
    if (previewNamespace) {
      return formatSurfaceNamespace(previewNamespace.transport.host, previewNamespace.transport.port);
    }
    return String(surfaceNamespace || '').trim().toLowerCase();
  }, [previewNamespace, surfaceNamespace]);

  const resolvedNamespaceHandle = useMemo(() => {
    if (previewNamespace) return String(previewNamespace.constant || '').trim().toLowerCase();
    return String(namespaceHandle || '').trim().toLowerCase();
  }, [namespaceHandle, previewNamespace]);

  const resolvedSubjectHandleNamespace = useMemo(() => {
    if (!previewUsername) return String(subjectHandleNamespace || '').trim().toLowerCase();
    if (!resolvedNamespaceHandle) return '';
    return `${previewUsername}.${resolvedNamespaceHandle}`;
  }, [previewUsername, resolvedNamespaceHandle, subjectHandleNamespace]);

  const resolvedResolverHostName = useMemo(() => {
    return String(bootstrapInfo?.resolverHostName || resolverHostNameProp || '').trim().toLowerCase();
  }, [bootstrapInfo?.resolverHostName, resolverHostNameProp]);

  const resolvedResolverDisplayName = useMemo(() => {
    return String(bootstrapInfo?.resolverDisplayName || resolverDisplayNameProp || '').trim();
  }, [bootstrapInfo?.resolverDisplayName, resolverDisplayNameProp]);

  const resolvedResolverSurfaceNamespace = useMemo(() => {
    if (resolvedResolverHostName) {
      return formatSurfaceNamespace(resolvedResolverHostName, previewNamespace?.transport.port ?? null);
    }
    return String(resolverSurfaceNamespaceProp || '').trim().toLowerCase();
  }, [previewNamespace?.transport.port, resolvedResolverHostName, resolverSurfaceNamespaceProp]);

  const hostResolvedSurfaceEntry = useMemo(() => {
    const entry = bootstrapInfo?.surfaceEntry;
    if (!entry) return null;

    return {
      ...entry,
      status: {
        ...entry.status,
        availability: connected ? 'online' : entry.status.availability,
        syncState: connected ? 'current' : entry.status.syncState,
        lastSeen: connected ? Date.now() : entry.status.lastSeen,
      },
    };
  }, [bootstrapInfo?.surfaceEntry, connected]);

  const semanticRootName = useMemo(() => {
    const resolvedRoot = String(hostResolvedSurfaceEntry?.rootName || '').trim().toLowerCase();
    if (resolvedRoot) return resolvedRoot;
    return resolveSemanticRootName({
      namespaceHandle: resolvedNamespaceHandle,
      resolverHostName: resolvedResolverHostName,
      rootHostNamespace: resolvedRootHostNamespace,
    });
  }, [
    hostResolvedSurfaceEntry?.rootName,
    resolvedNamespaceHandle,
    resolvedResolverHostName,
    resolvedRootHostNamespace,
  ]);

  const semanticNamespaceHandle = useMemo(() => {
    return String(semanticRootName || stripPort(resolvedNamespaceHandle) || '').trim().toLowerCase();
  }, [resolvedNamespaceHandle, semanticRootName]);

  const resolvedRootNamespaceHash = useMemo(() => {
    if (!semanticNamespaceHandle) return String(rootNamespaceHash || '').trim();
    return deriveIdentityRootHash('', semanticNamespaceHandle);
  }, [rootNamespaceHash, semanticNamespaceHandle]);

  const resolvedSurfaceNamespaceHash = useMemo(() => {
    return resolvedRootNamespaceHash || String(surfaceNamespaceHash || '').trim();
  }, [resolvedRootNamespaceHash, surfaceNamespaceHash]);

  const resolvedSubjectNamespaceHash = useMemo(() => {
    if (!previewUsername) return String(subjectNamespaceHash || resolvedRootNamespaceHash || '').trim();
    return deriveChildIdentityHash(resolvedRootNamespaceHash, previewUsername);
  }, [previewUsername, resolvedRootNamespaceHash, subjectNamespaceHash]);

  const localNamespaceUrl = useMemo(() => {
    if (!resolvedSurfaceNamespace || !previewNamespace) return '';
    const label = previewUsername ? `${previewUsername}.` : '';
    return `${previewNamespace.transport.protocol}://${label}${resolvedSurfaceNamespace}`;
  }, [previewNamespace, previewUsername, resolvedSurfaceNamespace]);

  const localRootNamespaceUrl = useMemo(() => {
    if (!resolvedSurfaceNamespace || !previewNamespace) return '';
    return `${previewNamespace.transport.protocol}://${resolvedSurfaceNamespace}`;
  }, [previewNamespace, resolvedSurfaceNamespace]);

  const networkNamespaceUrl = useMemo(() => {
    if (!resolvedResolverSurfaceNamespace || !previewNamespace) return '';
    const label = previewUsername ? `${previewUsername}.` : '';
    return `${previewNamespace.transport.protocol}://${label}${resolvedResolverSurfaceNamespace}`;
  }, [previewNamespace, previewUsername, resolvedResolverSurfaceNamespace]);

  const networkRootNamespaceUrl = useMemo(() => {
    if (!resolvedResolverSurfaceNamespace || !previewNamespace) return '';
    return `${previewNamespace.transport.protocol}://${resolvedResolverSurfaceNamespace}`;
  }, [previewNamespace, resolvedResolverSurfaceNamespace]);

  const surfaceEntryBase = useMemo(() => {
    if (hostResolvedSurfaceEntry) return hostResolvedSurfaceEntry as CleakerSurfaceEntry;
    return createSurfaceEntry({
      namespaceUrl: networkNamespaceUrl || localNamespaceUrl || namespaceUrlProp || '',
      endpoint: safeEndpoint || endpointProp || '',
      namespaceHandle: resolvedNamespaceHandle,
      rootHostNamespace: resolvedRootHostNamespace,
      resolverHostName: resolvedResolverHostName,
      connected,
    });
  }, [
    connected,
    endpointProp,
    hostResolvedSurfaceEntry,
    localNamespaceUrl,
    networkNamespaceUrl,
    namespaceUrlProp,
    resolvedNamespaceHandle,
    resolvedResolverHostName,
    resolvedRootHostNamespace,
    safeEndpoint,
  ]);

  const surfaceEntry = useMemo(() => {
    return mergeSurfaceEntry(surfaceEntryBase, surfaceTelemetry, surfaceRequestEvents);
  }, [surfaceEntryBase, surfaceTelemetry, surfaceRequestEvents]);

  const previewQrValue = useMemo(() => {
    if (previewNamespace && isLoopbackishHost(previewNamespace.transport.host) && networkNamespaceUrl) {
      return networkNamespaceUrl;
    }
    if (localNamespaceUrl) return localNamespaceUrl;

    if (namespaceUrlProp) return String(namespaceUrlProp).trim();

    if (previewNamespace) {
      try {
        return buildCleakerNamespaceUrl(previewNamespace, previewUsername || undefined);
      } catch {
        // Fall through to the hash fallback below.
      }
    }

    return (
      String(resolvedSubjectNamespaceHash || '').trim() ||
      String(resolvedSurfaceNamespaceHash || '').trim() ||
      String(resolvedRootNamespaceHash || '').trim()
    );
  }, [
    namespaceUrlProp,
    localNamespaceUrl,
    networkNamespaceUrl,
    previewNamespace,
    previewUsername,
    resolvedRootNamespaceHash,
    resolvedSubjectNamespaceHash,
    resolvedSurfaceNamespaceHash,
  ]);

  const compactMonadLabel = useMemo(() => {
    return formatMonadInstanceLabel({
      monadName: surfaceEntry.monadName,
      endpoint: surfaceEntry.endpoint || safeEndpoint || endpointProp,
      fallbackHost: resolvedSurfaceNamespace,
    });
  }, [endpointProp, resolvedSurfaceNamespace, safeEndpoint, surfaceEntry.endpoint, surfaceEntry.monadName]);

  const compactRootLabel = useMemo(() => {
    return compactNamespaceName(semanticNamespaceHandle || resolvedRootHostNamespace || '—') || '—';
  }, [resolvedRootHostNamespace, semanticNamespaceHandle]);

  const namespaceDisplayTitle = useMemo(() => {
    return compactRootLabel || semanticNamespaceHandle || '—';
  }, [compactRootLabel, semanticNamespaceHandle]);

  const namespaceRootSemanticValue = useMemo(() => {
    return networkRootNamespaceUrl || localRootNamespaceUrl || namespaceUrlProp || '';
  }, [localRootNamespaceUrl, namespaceUrlProp, networkRootNamespaceUrl]);

  const networkStatusSemanticValue = useMemo(() => {
    if (!safeEndpoint) return 'idle';
    return connected ? 'online' : 'offline';
  }, [connected, safeEndpoint]);

  const blockchainLimit = useMemo(() => {
    return computeBlockchainLimit({
      meLimit: blockRowsLimit,
      surface: surfaceEntry as any,
    });
  }, [blockRowsLimit, surfaceEntry]);

  const [appliedBlockchainRowsLimit, setAppliedBlockchainRowsLimit] = useState(blockchainLimit.effectiveLimit);

  useEffect(() => {
    setAppliedBlockchainRowsLimit((current) => {
      if (!Number.isFinite(current) || current <= 0) return blockchainLimit.effectiveLimit;
      return current;
    });
  }, [blockchainLimit.effectiveLimit]);

  useEffect(() => {
    if (appliedBlockchainRowsLimit === blockchainLimit.effectiveLimit) return;

    const timeoutId = window.setTimeout(() => {
      setAppliedBlockchainRowsLimit((current) => {
        const target = blockchainLimit.effectiveLimit;
        if (current === target) return current;
        const delta = target - current;
        const step = Math.max(1, Math.ceil(Math.abs(delta) / 3));
        if (delta > 0) return Math.min(target, current + step);
        return Math.max(target, current - step);
      });
    }, 140);

    return () => window.clearTimeout(timeoutId);
  }, [appliedBlockchainRowsLimit, blockchainLimit.effectiveLimit]);

  const controlsSemanticState = useMemo(
    () => ({
      showEndpointInput,
      showNamespaceTip,
      connected,
      hasEndpoint: Boolean(safeEndpoint),
      endpointToggle: {
        open: showEndpointInput,
        connected,
        hasEndpoint: Boolean(safeEndpoint),
      },
      infoToggle: {
        open: showNamespaceTip,
      },
    }),
    [connected, safeEndpoint, showEndpointInput, showNamespaceTip]
  );

  const tipSemanticState = useMemo(
    () => ({
      visible: showNamespaceTip,
      text: NAMESPACE_TIP_TEXT,
    }),
    [showNamespaceTip]
  );

  const tabsSemanticState = useMemo(
    () => ({
      active: activeTab,
      users: {
        label: 'Users',
        active: activeTab === 'users',
      },
      blocks: {
        label: 'Blockchain',
        active: activeTab === 'blocks',
      },
      details: {
        label: 'Details',
        active: activeTab === 'details',
      },
      surface: {
        label: 'Surface',
        active: activeTab === 'surface',
      },
    }),
    [activeTab]
  );

  const usersSemanticState = useMemo(
    () => ({
      visible: activeTab === 'users',
      endpoint: safeEndpoint,
      namespaceRootUrl: namespaceRootSemanticValue,
    }),
    [activeTab, namespaceRootSemanticValue, safeEndpoint]
  );

  const blocksSemanticState = useMemo(
    () => ({
      visible: activeTab === 'blocks',
      endpoint: safeEndpoint,
      rowsLimit: appliedBlockchainRowsLimit,
    }),
    [activeTab, appliedBlockchainRowsLimit, safeEndpoint]
  );

  const surfaceIdentitySemanticState = useMemo(
    () => ({
      hostId: surfaceEntry.hostId || null,
      type: surfaceEntry.type || null,
      trust: surfaceEntry.trust || null,
      rootName: surfaceEntry.rootName || null,
    }),
    [surfaceEntry.hostId, surfaceEntry.rootName, surfaceEntry.trust, surfaceEntry.type]
  );

  const surfaceAccessSemanticState = useMemo(
    () => ({
      namespace: surfaceEntry.namespace || null,
      endpoint: surfaceEntry.endpoint || null,
    }),
    [surfaceEntry.endpoint, surfaceEntry.namespace]
  );

  const surfaceCapacitySemanticState = useMemo(
    () => ({
      cpuCores: surfaceEntry.capacity.cpuCores ?? null,
      ramGb: surfaceEntry.capacity.ramGb ?? null,
      storageGb: surfaceEntry.capacity.storageGb ?? null,
      bandwidthMbps: surfaceEntry.capacity.bandwidthMbps ?? null,
    }),
    [
      surfaceEntry.capacity.bandwidthMbps,
      surfaceEntry.capacity.cpuCores,
      surfaceEntry.capacity.ramGb,
      surfaceEntry.capacity.storageGb,
    ]
  );

  const surfaceStatusSemanticState = useMemo(
    () => ({
      availability: surfaceEntry.status.availability || null,
      syncState: surfaceEntry.status.syncState || null,
      latencyMs: surfaceEntry.status.latencyMs ?? null,
      lastSeen: surfaceEntry.status.lastSeen ?? null,
      lastSeenLabel: surfaceEntry.status.lastSeen
        ? new Date(surfaceEntry.status.lastSeen).toLocaleString()
        : null,
    }),
    [
      surfaceEntry.status.availability,
      surfaceEntry.status.lastSeen,
      surfaceEntry.status.latencyMs,
      surfaceEntry.status.syncState,
    ]
  );

  const surfaceResourceItems = useMemo(
    () =>
      surfaceEntry.resources.map((resource, index) => {
        const key = normalizeNodeSegment(resource, `resource-${index + 1}`);
        return {
          key,
          resource,
          path: `${KERNEL_SURFACE_PATH}.resources.items.${key}`,
        };
      }),
    [surfaceEntry.resources]
  );

  const surfaceResourcesSemanticState = useMemo(
    () => ({
      count: surfaceResourceItems.length,
      empty: surfaceResourceItems.length === 0,
      items: Object.fromEntries(surfaceResourceItems.map((item) => [item.key, item.resource])),
    }),
    [surfaceResourceItems]
  );

  const surfaceSemanticState = useMemo(
    () => ({
      hostId: surfaceEntry.hostId || null,
      type: surfaceEntry.type || null,
      resourceCount: surfaceResourceItems.length,
      identity: surfaceIdentitySemanticState,
      access: surfaceAccessSemanticState,
      resources: surfaceResourcesSemanticState,
      capacity: surfaceCapacitySemanticState,
      status: surfaceStatusSemanticState,
    }),
    [
      surfaceAccessSemanticState,
      surfaceCapacitySemanticState,
      surfaceEntry.hostId,
      surfaceEntry.type,
      surfaceIdentitySemanticState,
      surfaceResourceItems.length,
      surfaceResourcesSemanticState,
      surfaceStatusSemanticState,
    ]
  );

  const surfaceUiSemanticState = useMemo(
    () => ({
      visible: activeTab === 'surface',
      title: 'Surface',
      description: NAMESPACE_SURFACE_DESCRIPTION,
      grid: {
        columns: isMobile ? 1 : 2,
        cards: 5,
      },
      identity: {
        title: 'Identity',
      },
      access: {
        title: 'Access',
      },
      resources: {
        title: 'Resources',
      },
      capacity: {
        title: 'Capacity',
      },
      status: {
        title: 'Status',
        grid: {
          columns: isMobile ? 1 : 2,
          rows: 4,
        },
      },
    }),
    [activeTab, isMobile]
  );

  const previewSemanticState = useMemo(
    () => ({
      visible: Boolean(
        endpoint ||
          namespaceExpression ||
          resolvedRootHostNamespace ||
          resolvedSurfaceNamespace ||
          resolvedSubjectHandleNamespace ||
          previewQrValue
      ),
      qrValue: previewQrValue || null,
      monad: compactMonadLabel || null,
      namespace: compactRootLabel || null,
      rootHash: resolvedRootNamespaceHash || null,
      expression: String(endpoint || namespaceExpression || '').trim() || null,
      local: localNamespaceUrl || null,
      network: networkNamespaceUrl || null,
      node: resolvedResolverDisplayName || null,
    }),
    [
      compactMonadLabel,
      compactRootLabel,
      endpoint,
      localNamespaceUrl,
      namespaceExpression,
      networkNamespaceUrl,
      previewQrValue,
      resolvedResolverDisplayName,
      resolvedRootHostNamespace,
      resolvedRootNamespaceHash,
      resolvedSubjectHandleNamespace,
      resolvedSurfaceNamespace,
    ]
  );

  const budgetSemanticState = useMemo(
    () => ({
      stressMode,
      meLimit: blockchainLimit.meLimit,
      surfacePolicy: blockchainLimit.policyLimit,
      surfaceBudget: blockchainLimit.budgetRows,
      cpuPressure: Number(blockchainLimit.pressureCpu.toFixed(2)),
      base: blockchainLimit.baseLimit,
      target: blockchainLimit.effectiveLimit,
      applied: appliedBlockchainRowsLimit,
    }),
    [appliedBlockchainRowsLimit, blockchainLimit, stressMode]
  );

  const runtimeInputsSemanticState = useMemo(
    () => ({
      surfaceType: surfaceEntry.type || null,
      availability: surfaceEntry.status.availability || null,
      syncState: surfaceEntry.status.syncState || null,
      monad: compactMonadLabel || null,
      namespace: namespaceDisplayTitle || null,
    }),
    [
      compactMonadLabel,
      namespaceDisplayTitle,
      surfaceEntry.status.availability,
      surfaceEntry.status.syncState,
      surfaceEntry.type,
    ]
  );

  const ledgerMonitorSemanticState = useMemo(
    () => ({
      events: surfaceRequestEvents.length,
      latestEventId: surfaceRequestEvents[0]?.id ?? null,
      state: surfaceRequestEvents.length === 0 ? 'waiting' : 'active',
    }),
    [surfaceRequestEvents]
  );

  const detailsSemanticState = useMemo(
    () => ({
      visible: activeTab === 'details',
      rootNamespaceHash: resolvedRootNamespaceHash || null,
      requestEvents: surfaceRequestEvents.length,
    }),
    [activeTab, resolvedRootNamespaceHash, surfaceRequestEvents.length]
  );

  const surfaceMetaRows = useMemo(
    () => [
      {
        label: 'Host ID',
        value: surfaceIdentitySemanticState.hostId,
        path: `${KERNEL_SURFACE_PATH}.identity.hostId`,
      },
      {
        label: 'Type',
        value: surfaceIdentitySemanticState.type,
        path: `${KERNEL_SURFACE_PATH}.identity.type`,
      },
      {
        label: 'Trust',
        value: surfaceIdentitySemanticState.trust,
        path: `${KERNEL_SURFACE_PATH}.identity.trust`,
      },
      {
        label: 'Root Name',
        value: surfaceIdentitySemanticState.rootName,
        path: `${KERNEL_SURFACE_PATH}.identity.rootName`,
      },
    ],
    [surfaceIdentitySemanticState]
  );

  const surfaceAccessRows = useMemo(
    () => [
      {
        label: 'Namespace',
        value: surfaceAccessSemanticState.namespace,
        path: `${KERNEL_SURFACE_PATH}.access.namespace`,
      },
      {
        label: 'Endpoint',
        value: surfaceAccessSemanticState.endpoint,
        path: `${KERNEL_SURFACE_PATH}.access.endpoint`,
      },
    ],
    [surfaceAccessSemanticState]
  );

  const surfaceCapacityRows = useMemo(
    () => [
      {
        label: 'CPU Cores',
        value: surfaceCapacitySemanticState.cpuCores,
        path: `${KERNEL_SURFACE_PATH}.capacity.cpuCores`,
      },
      {
        label: 'RAM (GB)',
        value: surfaceCapacitySemanticState.ramGb,
        path: `${KERNEL_SURFACE_PATH}.capacity.ramGb`,
      },
      {
        label: 'Storage (GB)',
        value: surfaceCapacitySemanticState.storageGb,
        path: `${KERNEL_SURFACE_PATH}.capacity.storageGb`,
      },
      {
        label: 'Bandwidth (Mbps)',
        value: surfaceCapacitySemanticState.bandwidthMbps,
        path: `${KERNEL_SURFACE_PATH}.capacity.bandwidthMbps`,
      },
    ],
    [surfaceCapacitySemanticState]
  );

  const surfaceStatusRows = useMemo(
    () => [
      {
        label: 'Availability',
        value: surfaceStatusSemanticState.availability,
        path: `${KERNEL_SURFACE_PATH}.status.availability`,
      },
      {
        label: 'Sync',
        value: surfaceStatusSemanticState.syncState,
        path: `${KERNEL_SURFACE_PATH}.status.syncState`,
      },
      {
        label: 'Latency (ms)',
        value: surfaceStatusSemanticState.latencyMs,
        path: `${KERNEL_SURFACE_PATH}.status.latencyMs`,
      },
      {
        label: 'Last Seen',
        value: surfaceStatusSemanticState.lastSeenLabel,
        path: `${KERNEL_SURFACE_PATH}.status.lastSeenLabel`,
      },
    ],
    [surfaceStatusSemanticState]
  );

  const semanticWrites = useMemo(() => {
    const writes = [
      ...collectSemanticWrites(KERNEL_NETWORK_ENDPOINT_PATH, endpoint),
      ...collectSemanticWrites(KERNEL_NAMESPACE_ROOT_PATH, namespaceRootSemanticValue),
      ...collectSemanticWrites(KERNEL_NETWORK_STATUS_PATH, networkStatusSemanticValue),
      ...collectSemanticWrites(KERNEL_NAMESPACE_CONTROLS_PATH, controlsSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_TIP_PATH, tipSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_TABS_PATH, tabsSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_USERS_PATH, usersSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_BLOCKS_PATH, blocksSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_SURFACE_UI_PATH, surfaceUiSemanticState),
      ...collectSemanticWrites(KERNEL_SURFACE_PATH, surfaceSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_DETAILS_PATH, detailsSemanticState),
      ...collectSemanticWrites(KERNEL_NAMESPACE_PREVIEW_PATH, previewSemanticState),
      ...collectSemanticWrites(KERNEL_RUNTIME_BUDGET_PATH, budgetSemanticState),
      ...collectSemanticWrites(KERNEL_RUNTIME_INPUTS_PATH, runtimeInputsSemanticState),
      ...collectSemanticWrites(KERNEL_RUNTIME_LEDGER_PATH, ledgerMonitorSemanticState),
    ];

    const deduped = new Map<string, any>();
    for (const entry of writes) deduped.set(entry.path, entry.value);
    return Array.from(deduped, ([path, value]) => ({ path, value }));
  }, [
    blocksSemanticState,
    controlsSemanticState,
    detailsSemanticState,
    endpoint,
    budgetSemanticState,
    ledgerMonitorSemanticState,
    namespaceRootSemanticValue,
    networkStatusSemanticValue,
    previewSemanticState,
    runtimeInputsSemanticState,
    surfaceSemanticState,
    surfaceUiSemanticState,
    tabsSemanticState,
    tipSemanticState,
    usersSemanticState,
  ]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!me) return;
    if (semanticWriteTargetRef.current !== me) {
      semanticWriteTargetRef.current = me;
      semanticWriteCacheRef.current = new Map();
    }

    const nextCache = new Map<string, string>();
    for (const entry of semanticWrites) {
      const snapshot = JSON.stringify(normalizeSemanticValue(entry.value));
      nextCache.set(entry.path, snapshot);
      if (semanticWriteCacheRef.current.get(entry.path) === snapshot) continue;
      safeWriteKernelPath(me, entry.path, entry.value);
    }

    semanticWriteCacheRef.current = nextCache;
  }, [me, semanticWrites]);

  async function handleConnect() {
    const base = safeEndpoint;
    if (!base) {
      setConnected(false);
      return;
    }
    try {
      const res = await fetch(`${base}/`, { method: 'GET' });
      if (!res.ok) throw new Error('Failed');
      setConnected(true);
      // Save to history
      setNamespaceHistory(prev => {
        const next = [base, ...prev.filter(h => h !== base)].slice(0, 8);
        try { localStorage.setItem('ns:history', JSON.stringify(next)); } catch {}
        return next;
      });
    } catch {
      setConnected(false);
    }
  }

  function scheduleConnect(nextEndpoint: string) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const nextBase = normalizeEndpoint(nextEndpoint) ?? '';
    if (!nextBase) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      setConnected(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      // noop: the [safeEndpoint] effect will connect using the latest endpoint value
    }, 450);
  }

  function onEndpointKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      handleConnect();
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (stressTimerRef.current) window.clearInterval(stressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Auto-connect when we have a valid endpoint (on mount and whenever it changes)
    if (!safeEndpoint) return;
    handleConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeEndpoint]);

  useEffect(() => {
    if (!safeEndpoint) {
      setBootstrapInfo(null);
      return;
    }

    let cancelled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    (async () => {
      const payload = await readCleakerBootstrap(safeEndpoint, controller?.signal);
      if (cancelled) return;
      setBootstrapInfo(payload);
    })();

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [safeEndpoint]);

  useEffect(() => {
    if (!safeEndpoint || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setSurfaceTelemetry(null);
      setSurfaceRequestEvents([]);
      return;
    }

    const source = new EventSource(`${safeEndpoint}/__surface/events`);

    const mergeTelemetry = (payload: any) => {
      const telemetry = payload && typeof payload === 'object' && payload.telemetry ? payload.telemetry : payload;
      if (!telemetry || typeof telemetry !== 'object') return;

      setSurfaceTelemetry((current) => ({
        ...(current || {}),
        ...telemetry,
      }));

      const recentRequests = Array.isArray((telemetry as any)?.monitor?.recentRequests)
        ? ((telemetry as any).monitor.recentRequests as CleakerSurfaceRequestEvent[])
        : null;
      if (recentRequests) {
        setSurfaceRequestEvents(recentRequests);
      }
    };

    const onSurface = (event: MessageEvent) => {
      try {
        mergeTelemetry(JSON.parse(String(event.data || 'null')));
      } catch {
        // Ignore malformed surface payloads.
      }
    };

    const onRequest = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(String(event.data || 'null'));
        mergeTelemetry(payload);
        const request = payload?.request;
        if (request && typeof request === 'object') {
          setSurfaceRequestEvents((current) => {
            const next = [request as CleakerSurfaceRequestEvent, ...current.filter((item) => item.id !== request.id)];
            return next.slice(0, 24);
          });
        }
      } catch {
        // Ignore malformed request payloads.
      }
    };

    source.addEventListener('surface', onSurface as EventListener);
    source.addEventListener('request', onRequest as EventListener);
    source.onerror = () => {
      // Let EventSource handle its own reconnect cycle.
    };

    return () => {
      source.removeEventListener('surface', onSurface as EventListener);
      source.removeEventListener('request', onRequest as EventListener);
      source.close();
    };
  }, [safeEndpoint]);

  useEffect(() => {
    if (stressTimerRef.current) {
      window.clearInterval(stressTimerRef.current);
      stressTimerRef.current = null;
    }

    if (!stressMode || !safeEndpoint || typeof window === 'undefined' || typeof fetch !== 'function') {
      return;
    }

    const fireBurst = () => {
      const base = `${safeEndpoint.replace(/\/+$/, '')}/__surface`;
      for (let index = 0; index < 3; index += 1) {
        const marker = `${Date.now()}-${index}`;
        void fetch(`${base}?stress=${encodeURIComponent(marker)}`, {
          method: 'GET',
          cache: 'no-store',
        }).catch(() => {
          // Ignore stress burst transport failures.
        });
      }
    };

    fireBurst();
    stressTimerRef.current = window.setInterval(fireBurst, 650);

    return () => {
      if (stressTimerRef.current) {
        window.clearInterval(stressTimerRef.current);
        stressTimerRef.current = null;
      }
    };
  }, [safeEndpoint, stressMode]);

  const namespaceParts = useMemo<GuiPartsSpec>(
    () => ({
      root: {
        id: rootNodeId,
        type: rootNodeType,
        props: {
          endpoint: safeEndpoint,
          namespaceDisplayTitle,
          activeTab,
          connected,
          surfaceType: surfaceEntry.type,
          requestEvents: surfaceRequestEvents.length,
        },
        provenance: {
          ...semanticProvenance(KERNEL_NAMESPACE_ROOT_PATH),
          note: 'Composite Namespace root anchored to the canonical namespace identity path.',
        },
      },
      parts: [
        {
          part: 'controls',
          type: 'Namespace.Controls',
          props: {
            showEndpointInput,
            showNamespaceTip,
            connected,
            hasEndpoint: Boolean(safeEndpoint),
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_CONTROLS_PATH, {
            source: 'component-state',
            note: 'Namespace control toggles are mirrored into the UI semantic state tree.',
          }),
          children: [
            {
              part: 'endpoint-toggle',
              type: 'Namespace.EndpointToggle',
              props: {
                open: showEndpointInput,
                connected,
                  hasEndpoint: Boolean(safeEndpoint),
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_CONTROLS_PATH}.endpointToggle`, {
                source: 'component-state',
              }),
            },
            {
              part: 'info-toggle',
              type: 'Namespace.InfoToggle',
              props: {
                open: showNamespaceTip,
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_CONTROLS_PATH}.infoToggle`, {
                source: 'component-state',
              }),
            },
          ],
        },
        {
          part: 'tip',
          type: 'Namespace.InfoTip',
          props: {
            visible: showNamespaceTip,
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_TIP_PATH, {
            source: 'component-state',
            note: 'Inspector tip copy is now mounted as explicit UI truth.',
          }),
        },
        {
          part: 'endpoint-panel',
          type: 'Namespace.EndpointPanel',
          props: {
            visible: showEndpointInput,
            endpoint,
            connected,
          },
          provenance: semanticProvenance(KERNEL_NETWORK_ENDPOINT_PATH, {
            source: 'component-state',
          }),
          children: [
            {
              part: 'endpoint-input',
              type: 'Namespace.EndpointInput',
              props: {
                value: endpoint,
                normalizedValue: safeEndpoint,
                connected,
              },
              provenance: semanticProvenance(KERNEL_NETWORK_ENDPOINT_PATH, {
                source: 'component-state',
                note: 'Reflects the current Namespace endpoint input stored in the kernel bridge.',
              }),
            },
            {
              part: 'connect-action',
              type: 'Namespace.ConnectAction',
              props: {
                connected,
                disabled: !safeEndpoint,
                endpoint: safeEndpoint,
              },
              provenance: semanticProvenance(KERNEL_NETWORK_STATUS_PATH, {
                note: 'Connection action derives from the kernel network health path, not just local button state.',
              }),
            },
          ],
        },
        {
          part: 'summary',
          type: 'Namespace.Summary',
          props: {
            namespaceDisplayTitle,
            compactMonadLabel,
            compactRootLabel,
            rootNamespaceHash: resolvedRootNamespaceHash,
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_ROOT_PATH, {
            note: 'Namespace summary is anchored to the sovereign root identity path.',
          }),
        },
        {
          part: 'tabs',
          type: 'Namespace.Tabs',
          props: {
            activeTab,
            tabs: ['users', 'blocks', 'details', 'surface'],
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_TABS_PATH, {
            source: 'component-state',
            note: 'Active Namespace navigation is mirrored into the kernel UI state.',
          }),
          children: [
            {
              part: 'tab-users',
              type: 'Namespace.TabUsers',
              props: {
                active: activeTab === 'users',
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_TABS_PATH}.users`, {
                source: 'component-state',
              }),
            },
            {
              part: 'tab-blocks',
              type: 'Namespace.TabBlocks',
              props: {
                active: activeTab === 'blocks',
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_TABS_PATH}.blocks`, {
                source: 'component-state',
              }),
            },
            {
              part: 'tab-details',
              type: 'Namespace.TabDetails',
              props: {
                active: activeTab === 'details',
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_TABS_PATH}.details`, {
                source: 'component-state',
              }),
            },
            {
              part: 'tab-surface',
              type: 'Namespace.TabSurface',
              props: {
                active: activeTab === 'surface',
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_TABS_PATH}.surface`, {
                source: 'component-state',
              }),
            },
          ],
        },
        {
          part: 'users-view',
          type: 'Namespace.UsersView',
          props: {
            visible: activeTab === 'users',
            endpoint: safeEndpoint,
            namespaceRootUrl: namespaceRootSemanticValue,
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_USERS_PATH, {
            note: 'Users view resolves against the live Namespace UI contract mirrored into the kernel.',
          }),
        },
        {
          part: 'blocks-view',
          type: 'Namespace.BlocksView',
          props: {
            visible: activeTab === 'blocks',
            endpoint: safeEndpoint,
            rowsLimit: appliedBlockchainRowsLimit,
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_BLOCKS_PATH, {
            source: 'runtime-derivation',
            note: 'Blockchain panel provenance reflects the negotiated rows limit and visibility state.',
          }),
        },
        {
          part: 'surface-view',
          type: 'Namespace.SurfaceView',
          props: {
            visible: activeTab === 'surface',
            hostId: surfaceEntry.hostId,
            surfaceType: surfaceEntry.type,
            resourceCount: surfaceEntry.resources.length,
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_SURFACE_UI_PATH, {
            source: 'component-state',
            note: 'Surface view provenance distinguishes UI visibility from the surface telemetry payload itself.',
          }),
          children: [
            {
              part: 'surface-title',
              type: 'Namespace.SurfaceTitle',
              props: {
                text: 'Surface',
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.title`, {
                source: 'component-state',
              }),
            },
            {
              part: 'surface-description',
              type: 'Namespace.SurfaceDescription',
              props: {
                hostId: surfaceEntry.hostId,
                namespace: surfaceEntry.namespace,
                endpoint: surfaceEntry.endpoint,
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.description`, {
                source: 'component-state',
              }),
            },
            {
              part: 'surface-grid',
              type: 'Namespace.SurfaceGrid',
              props: {
                columns: isMobile ? 1 : 2,
                cards: 5,
              },
              provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.grid`, {
                source: 'component-state',
              }),
            },
            {
              part: 'surface-identity',
              type: 'Namespace.SurfaceIdentity',
              props: {
                rows: surfaceMetaRows.length,
                rootName: surfaceEntry.rootName,
                hostId: surfaceEntry.hostId,
              },
              provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.identity`, {
                source: 'surface-telemetry',
              }),
              children: [
                {
                  part: 'surface-identity-title',
                  type: 'Namespace.SurfaceIdentityTitle',
                  props: {
                    text: 'Identity',
                  },
                  provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.identity.title`, {
                    source: 'component-state',
                  }),
                },
                ...surfaceMetaRows.map((row, index) => ({
                  part: surfaceRowSegment('surface-identity', row.label, index),
                  type: 'Namespace.SurfaceIdentityRow',
                  props: {
                    label: row.label,
                    value: row.value == null || row.value === '' ? '—' : String(row.value),
                  },
                  provenance: semanticProvenance(row.path, {
                    source: 'surface-telemetry',
                  }),
                })),
              ],
            },
            {
              part: 'surface-access',
              type: 'Namespace.SurfaceAccess',
              props: {
                rows: surfaceAccessRows.length,
                namespace: surfaceEntry.namespace,
                endpoint: surfaceEntry.endpoint,
              },
              provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.access`, {
                source: 'surface-telemetry',
              }),
              children: [
                {
                  part: 'surface-access-title',
                  type: 'Namespace.SurfaceAccessTitle',
                  props: {
                    text: 'Access',
                  },
                  provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.access.title`, {
                    source: 'component-state',
                  }),
                },
                ...surfaceAccessRows.map((row, index) => ({
                  part: surfaceRowSegment('surface-access', row.label, index),
                  type: 'Namespace.SurfaceAccessRow',
                  props: {
                    label: row.label,
                    value: row.value == null || row.value === '' ? '—' : String(row.value),
                  },
                  provenance: semanticProvenance(row.path, {
                    source: 'surface-telemetry',
                  }),
                })),
              ],
            },
            {
              part: 'surface-resources',
              type: 'Namespace.SurfaceResources',
              props: {
                resources: surfaceEntry.resources,
              },
              provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.resources`, {
                source: 'surface-telemetry',
              }),
              children: [
                {
                  part: 'surface-resources-title',
                  type: 'Namespace.SurfaceResourcesTitle',
                  props: {
                    text: 'Resources',
                  },
                  provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.resources.title`, {
                    source: 'component-state',
                  }),
                },
                {
                  part: 'surface-resources-list',
                  type: 'Namespace.SurfaceResourcesList',
                  props: {
                    count: surfaceEntry.resources.length,
                  },
                  provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.resources.count`, {
                    source: 'surface-telemetry',
                  }),
                },
                ...(surfaceEntry.resources.length > 0
                  ? surfaceResourceItems.map((resourceItem, index) => ({
                      part: surfaceResourceSegment(resourceItem.resource, index),
                      type: 'Namespace.SurfaceResource',
                      props: {
                        resource: resourceItem.resource,
                      },
                      provenance: semanticProvenance(resourceItem.path, {
                        source: 'surface-telemetry',
                      }),
                    }))
                  : [
                      {
                        part: 'surface-resources-empty',
                        type: 'Namespace.SurfaceResourcesEmpty',
                        props: {
                          visible: true,
                        },
                        provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.resources.empty`, {
                          source: 'surface-telemetry',
                        }),
                      },
                    ]),
              ],
            },
            {
              part: 'surface-capacity',
              type: 'Namespace.SurfaceCapacity',
              props: {
                rows: surfaceCapacityRows.length,
                capacity: surfaceEntry.capacity,
              },
              provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.capacity`, {
                source: 'surface-telemetry',
              }),
              children: [
                {
                  part: 'surface-capacity-title',
                  type: 'Namespace.SurfaceCapacityTitle',
                  props: {
                    text: 'Capacity',
                  },
                  provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.capacity.title`, {
                    source: 'component-state',
                  }),
                },
                ...surfaceCapacityRows.map((row, index) => ({
                  part: surfaceRowSegment('surface-capacity', row.label, index),
                  type: 'Namespace.SurfaceCapacityRow',
                  props: {
                    label: row.label,
                    value: row.value == null ? '—' : String(row.value),
                  },
                  provenance: semanticProvenance(row.path, {
                    source: 'surface-telemetry',
                  }),
                })),
              ],
            },
            {
              part: 'surface-status',
              type: 'Namespace.SurfaceStatus',
              props: {
                rows: surfaceStatusRows.length,
                status: surfaceEntry.status,
              },
              provenance: semanticProvenance(`${KERNEL_SURFACE_PATH}.status`, {
                source: 'surface-telemetry',
              }),
              children: [
                {
                  part: 'surface-status-title',
                  type: 'Namespace.SurfaceStatusTitle',
                  props: {
                    text: 'Status',
                  },
                  provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.status.title`, {
                    source: 'component-state',
                  }),
                },
                {
                  part: 'surface-status-grid',
                  type: 'Namespace.SurfaceStatusGrid',
                  props: {
                    columns: isMobile ? 1 : 2,
                    rows: surfaceStatusRows.length,
                  },
                  provenance: semanticProvenance(`${KERNEL_NAMESPACE_SURFACE_UI_PATH}.status.grid`, {
                    source: 'component-state',
                  }),
                },
                ...surfaceStatusRows.map((row, index) => ({
                  part: surfaceRowSegment('surface-status', row.label, index),
                  type: 'Namespace.SurfaceStatusRow',
                  props: {
                    label: row.label,
                    value: row.value == null || row.value === '' ? '—' : String(row.value),
                  },
                  provenance: semanticProvenance(row.path, {
                    source: 'surface-telemetry',
                  }),
                })),
              ],
            },
          ],
        },
        {
          part: 'details-view',
          type: 'Namespace.DetailsView',
          props: {
            visible: activeTab === 'details',
            rootNamespaceHash: resolvedRootNamespaceHash,
            requestEvents: surfaceRequestEvents.length,
          },
          provenance: semanticProvenance(KERNEL_NAMESPACE_DETAILS_PATH, {
            source: 'component-state',
            note: 'Details view state is mirrored independently from its runtime payloads.',
          }),
          children: [
            {
              part: 'preview',
              type: 'Namespace.Preview',
              props: {
                previewQrValue,
                compactMonadLabel,
                compactRootLabel,
                rootNamespaceHash: resolvedRootNamespaceHash,
              },
              provenance: semanticProvenance(KERNEL_NAMESPACE_PREVIEW_PATH, {
                source: 'runtime-derivation',
              }),
            },
            {
              part: 'budget',
              type: 'Namespace.Budget',
              props: {
                stressMode,
                blockchainLimit,
                appliedBlockchainRowsLimit,
              },
              provenance: semanticProvenance(KERNEL_RUNTIME_BUDGET_PATH, {
                source: 'runtime-derivation',
                note: 'Effective Budget is derived from .me intent, surface policy, budget, and pressure.',
              }),
            },
            {
              part: 'runtime-inputs',
              type: 'Namespace.RuntimeInputs',
              props: {
                surfaceType: surfaceEntry.type,
                availability: surfaceEntry.status.availability,
                syncState: surfaceEntry.status.syncState,
                monad: compactMonadLabel,
                namespace: namespaceDisplayTitle,
              },
              provenance: semanticProvenance(KERNEL_RUNTIME_INPUTS_PATH, {
                source: 'runtime-derivation',
              }),
            },
            {
              part: 'ledger-monitor',
              type: 'Namespace.LedgerMonitor',
              props: {
                events: surfaceRequestEvents.length,
                latestEventId: surfaceRequestEvents[0]?.id ?? null,
              },
              provenance: semanticProvenance(KERNEL_RUNTIME_LEDGER_PATH, {
                source: 'surface-telemetry',
              }),
            },
          ],
        },
      ],
    }),
    [
      activeTab,
      appliedBlockchainRowsLimit,
      blockchainLimit,
      compactMonadLabel,
      compactRootLabel,
      connected,
      endpoint,
      isMobile,
      localRootNamespaceUrl,
      namespaceDisplayTitle,
      namespaceRootSemanticValue,
      namespaceUrlProp,
      networkStatusSemanticValue,
      networkRootNamespaceUrl,
      previewQrValue,
      resolvedRootNamespaceHash,
      rootNodeId,
      rootNodeType,
      safeEndpoint,
      showEndpointInput,
            showNamespaceTip,
            stressMode,
            surfaceAccessRows,
            surfaceCapacityRows,
            surfaceEntry,
            surfaceMetaRows,
            surfaceResourceItems,
            surfaceRequestEvents,
            surfaceResourceSegment,
            surfaceRowSegment,
            surfaceSemanticState,
            surfaceStatusRows,
            surfaceUiSemanticState,
            tabsSemanticState,
            tipSemanticState,
            usersSemanticState,
            blocksSemanticState,
            controlsSemanticState,
            detailsSemanticState,
            previewSemanticState,
            budgetSemanticState,
            runtimeInputsSemanticState,
            ledgerMonitorSemanticState,
    ]
  );

  const { nodeId, nodeAttrs } = useGuiParts(namespaceParts);

  return (
    <Box
      data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      sx={{
        ...(framed
          ? {
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              padding: '1.5rem',
              maxWidth: '900px',
              margin: '0 auto',
              background: 'background.paper',
            }
          : {}),
        position: 'relative',
      }}
    >
      <Box
        {...nodeAttrs('controls', 'Namespace.Controls')}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Tooltip title={showNamespaceTip ? 'Hide namespace tip' : 'Show namespace tip'} placement="bottom" arrow>
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <IconButton
              {...nodeAttrs('info-toggle', 'Namespace.InfoToggle')}
              aria-label="Namespace info"
              size="small"
              onClick={() => setShowNamespaceTip((value) => !value)}
              sx={{
                border: '1px solid',
                borderColor: showNamespaceTip ? 'primary.main' : 'divider',
                bgcolor: showNamespaceTip ? 'background.nav' : 'background.paper',
                color: showNamespaceTip ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  bgcolor: 'background.nav',
                  borderColor: showNamespaceTip ? 'primary.main' : 'divider',
                  color: showNamespaceTip ? 'primary.main' : 'text.primary',
                },
              }}
            >
              <Icon name="info" />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>
      {showNamespaceTip ? (
        <Box
          {...nodeAttrs('tip', 'Namespace.InfoTip')}
          sx={{
            mt: 0.25,
            mb: 1.25,
            mr: isMobile ? 0 : 7.5,
            p: 1.25,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.default',
            boxShadow: () => `0 0 0 1px ${theme?.palette?.primary?.main ?? 'currentColor'}22`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              lineHeight: 1.5,
            }}
          >
            Tip: <strong>localhost</strong> is only a local access alias. The real namespace comes from
            the node identity that answered the request.
          </Typography>
        </Box>
      ) : null}
      {/* Connection Input */}
      {showEndpointInput && (
        <Box
          {...nodeAttrs('endpoint-panel', 'Namespace.EndpointPanel')}
          sx={{
            marginTop: '1rem',
            display: 'flex',
            gap: 0.75,
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <Box
            sx={{
              flex: '0 0 auto',
              width: isMobile ? '100%' : '25%',
              minWidth: 240,
            }}
          >
            <Box
              component="fieldset"
              sx={{
                m: 0,
                p: 0,
                border: '1px solid',
                borderColor: connected ? 'success.main' : 'divider',
                borderRadius: 2,
                minHeight: 36,
                bgcolor: 'background.default',
                transition: 'border-color 120ms ease, box-shadow 120ms ease',
                '&:focus-within': {
                  borderColor: connected ? 'success.main' : 'primary.main',
                  boxShadow: (theme: any) =>
                    connected
                      ? `0 0 0 3px ${theme?.palette?.success?.main}22`
                      : `0 0 0 3px ${theme?.palette?.primary?.main}22`,
                },
              }}
            >
              <Box
                component="legend"
                sx={{
                  px: 0.75,
                  mx: 1,
                  fontSize: '0.75rem',
                  color: connected ? 'success.main' : 'text.secondary',
                lineHeight: 1,
                cursor: 'help',
              }}
              onClick={() => setActiveTab('details')}
              title="What is a namespace?"
            >
                Namespace
              </Box>

              <Box
                component="input"
                {...nodeAttrs('endpoint-input', 'Namespace.EndpointInput')}
                type="text"
                name="namespace"
                aria-label="Namespace"
                placeholder="localhost:8161"
                title="Example: localhost:8161 or cleaker.me"
                value={endpoint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = e.target.value;
                  setEndpoint(next);
                  scheduleConnect(next);
                }}
                onKeyDown={onEndpointKeyDown}
                sx={{
                  width: '100%',
                  px: 1.25,
                  py: 0.75,
                  border: 0,
                  outline: 'none',
                  bgcolor: 'transparent',
                  color: 'text.primary',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <IconButton
              {...nodeAttrs('connect-action', 'Namespace.ConnectAction')}
              aria-label={connected ? 'Connected' : 'Connect'}
              onClick={() => handleConnect()}
              size="small"
              disabled={!safeEndpoint}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: connected ? 'success.main' : 'text.secondary',
                '&:hover': {
                  bgcolor: 'background.nav',
                  color: connected ? 'success.main' : 'text.primary',
                },
              }}
            >
              <Icon name={connected ? 'check' : 'sync'} />
            </IconButton>
          </Box>
          {namespaceHistory.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', width: '100%' }}>
              <Typography variant="caption" sx={{ color: 'text.disabled', mr: 0.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                History
              </Typography>
              {namespaceHistory.map((h) => (
                <Box
                  key={h}
                  component="button"
                  onClick={() => { setEndpoint(h); scheduleConnect(h); }}
                  sx={{
                    px: 0.9, py: 0.3,
                    border: '1px solid',
                    borderColor: h === safeEndpoint ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: h === safeEndpoint ? 'background.nav' : 'transparent',
                    color: h === safeEndpoint ? 'primary.main' : 'text.secondary',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                  }}
                >
                  {h.replace(/^https?:\/\//, '')}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      <Box
        {...nodeAttrs('summary', 'Namespace.Summary')}
        sx={{ mt: 1.5, mb: 1.25, display: 'flex', flexDirection: 'column', gap: 0.25 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          Namespace:
        </Typography>
        {/* Namespace name + inline edit trigger */}
        <Box
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
          onClick={() => setShowEndpointInput((v) => !v)}
          title="Edit namespace"
        >
          <Typography
            variant="body2"
            sx={{
              color: showEndpointInput ? 'primary.main' : 'text.secondary',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              transition: 'color 120ms ease',
            }}
          >
            {namespaceDisplayTitle}
          </Typography>
          <Icon
            name={showEndpointInput ? 'edit_off' : 'edit'}
            fontSize={14}
            iconColor={showEndpointInput ? 'primary' : undefined}
          />
        </Box>
      </Box>
      {/* Tabs */}
      <Box
        {...nodeAttrs('tabs', 'Namespace.Tabs')}
        sx={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '0.5rem',
        }}
      >
        {(!allowedTabs || allowedTabs.includes('users')) && (
          <Button
            {...nodeAttrs('tab-users', 'Namespace.TabUsers')}
            variant={activeTab === 'users' ? 'outlined' : 'text'}
            size="small"
            sx={{ minHeight: 32, px: 1.25, fontSize: '0.8rem' }}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
        )}
        {(!allowedTabs || allowedTabs.includes('blocks')) && (
          <Button
            {...nodeAttrs('tab-blocks', 'Namespace.TabBlocks')}
            variant={activeTab === 'blocks' ? 'outlined' : 'text'}
            size="small"
            sx={{ minHeight: 32, px: 1.25, fontSize: '0.8rem' }}
            onClick={() => setActiveTab('blocks')}
          >
            Blockchain
          </Button>
        )}
        {(!allowedTabs || allowedTabs.includes('details')) && (
          <Button
            {...nodeAttrs('tab-details', 'Namespace.TabDetails')}
            variant={activeTab === 'details' ? 'outlined' : 'text'}
            size="small"
            sx={{ minHeight: 32, px: 1.25, fontSize: '0.8rem' }}
            onClick={() => setActiveTab('details')}
          >
            Details
          </Button>
        )}
        {(!allowedTabs || allowedTabs.includes('surface')) && (
          <Button
            {...nodeAttrs('tab-surface', 'Namespace.TabSurface')}
            variant={activeTab === 'surface' ? 'outlined' : 'text'}
            size="small"
            sx={{ minHeight: 32, px: 1.25, fontSize: '0.8rem' }}
            onClick={() => setActiveTab('surface')}
          >
            Surface
          </Button>
        )}
      </Box>
      {/* Render Only Child Components */}
      {activeTab === 'users' && safeEndpoint && (
        <Box {...nodeAttrs('users-view', 'Namespace.UsersView')}>
          <UsersTable
            endpoint={safeEndpoint}
            namespaceLabel={namespaceDisplayTitle}
            namespaceRootUrl={
              networkRootNamespaceUrl ||
              localRootNamespaceUrl ||
              namespaceUrlProp ||
              ''
            }
            data-gui-node-id={nodeId('users-view')}
            data-gui-component="Namespace.UsersView"
          />
        </Box>
      )}
      {activeTab === 'blocks' && safeEndpoint && (
        <Box {...nodeAttrs('blocks-view', 'Namespace.BlocksView')}>
          <BlockchainTable
            endpoint={safeEndpoint}
            blockPath={blockPathProp}
            namespaceLabel={namespaceDisplayTitle}
            rowsLimit={appliedBlockchainRowsLimit}
            namespaceRootUrl={
              networkRootNamespaceUrl ||
              localRootNamespaceUrl ||
              namespaceUrlProp ||
              ''
            }
            data-gui-node-id={nodeId('blocks-view')}
            data-gui-component="Namespace.BlocksView"
          />
        </Box>
      )}
      {activeTab === 'surface' && (
        <HostResources
          {...nodeAttrs('surface-view', 'Namespace.SurfaceView')}
          endpoint={safeEndpoint}
          namespaceUrl={namespaceRootSemanticValue}
          namespaceHandle={resolvedNamespaceHandle}
          rootHostNamespace={resolvedRootHostNamespace}
          resolverHostName={resolvedResolverHostName}
        />
      )}

      {activeTab === 'details' && (
        <NamespaceInfo
          {...nodeAttrs('details-view', 'Namespace.DetailsView')}
          endpoint={safeEndpoint}
          qrValue={previewQrValue}
          monadLabel={compactMonadLabel}
          namespaceLabel={compactRootLabel}
          rootNamespaceHash={resolvedRootNamespaceHash}
          meLimit={blockRowsLimit}
          surface={surfaceEntry}
        />
      )}
    </Box>
  );
}
