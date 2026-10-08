// HostResources.tsx — the live operational-resources view for a monad
// endpoint: identity, access, advertised resources, capacity, status, and a
// live request stream. Extracted from Namespace's "Surface" tab, which
// mixed this live/operational state together with namespace identity and
// budget-negotiation concerns (now NamespaceInfo's job).
//
// A top-level Cleaker/ sibling to Namespace/, not nested under it — this is
// meant to grow past a single namespace's surface into a real "system
// resources" console (hosts/apps/identities, historical windows), so it
// doesn't belong filed under one namespace's tabs.
//
// Deliberately does NOT own historical/windowed usage or per-identity
// breakdowns yet — that's the next layer (`<namespace>.netget.hosts|apps|
// identities.usage.windows[]`, still backend-only). This component is the
// "what's happening right now" tier; a future historical section reads
// from that ledger separately once it exists.
//
// Self-contained like Usernames.tsx/BlocksTable.tsx: fetches its own
// bootstrap info and subscribes to its own /__surface/events stream from
// `endpoint` rather than depending on Namespace's internal state tree.
// `initialSurface`/`initialRequestEvents` exist only to seed Storybook with
// realistic data — the real app never needs them, live telemetry overrides
// on the first event either way.
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@/gui/Atoms';
import Gauge from '@/gui/Molecules/Gauge/Gauge';
import { useGuiMediaQuery } from '@/gui-internals/Hooks';
import {
  type CleakerSurfaceEntry,
  type CleakerSurfaceRequestEvent,
  createSurfaceEntry,
} from '../../../Cleaker/surfaceModel';
import { readCleakerBootstrap } from '../../../Cleaker/runtimeUsername';

export interface HostResourcesProps {
  /** The monad endpoint to poll for this surface's resources/status. */
  endpoint: string;
  namespaceUrl?: string;
  namespaceHandle?: string;
  rootHostNamespace?: string;
  resolverHostName?: string;
  /** Storybook/demo only — seeds initial telemetry before any live event arrives. */
  initialSurface?: Partial<CleakerSurfaceEntry>;
  /** Storybook/demo only — seeds the initial Active Requests list. */
  initialRequestEvents?: CleakerSurfaceRequestEvent[];
  sx?: any;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
}

const SURFACE_DESCRIPTION =
  'This is the current host/surface entry resolved by the monad.ai surface that answered the request.';

function normalizeNodeSegment(value: string, fallback: string): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return normalized || fallback;
}

function mergeSurfaceEntry(
  base: CleakerSurfaceEntry,
  overlay: Partial<CleakerSurfaceEntry> | null,
  requestEvents: CleakerSurfaceRequestEvent[],
): CleakerSurfaceEntry {
  if (!overlay) {
    return { ...base, monitor: { recentRequests: requestEvents } };
  }

  return {
    ...base,
    ...overlay,
    capacity: { ...base.capacity, ...(overlay.capacity || {}) },
    status: { ...base.status, ...(overlay.status || {}) },
    monitor: {
      recentRequests:
        overlay.monitor?.recentRequests && overlay.monitor.recentRequests.length > 0
          ? overlay.monitor.recentRequests
          : requestEvents,
    },
  };
}

export default function HostResources({
  endpoint,
  namespaceUrl = '',
  namespaceHandle = '',
  rootHostNamespace = '',
  resolverHostName = '',
  initialSurface = undefined,
  initialRequestEvents = undefined,
  sx,
  'data-gui-node-id': dataGuiNodeId = 'HostResources',
  'data-gui-component': dataGuiComponent = 'HostResources',
}: HostResourcesProps) {
  const safeEndpoint = String(endpoint || '').trim().replace(/\/+$/, '');
  const isMobile = useGuiMediaQuery('(max-width: 599.95px)');

  const [connected, setConnected] = useState(false);
  const [bootstrapInfo, setBootstrapInfo] = useState<{ surfaceEntry: CleakerSurfaceEntry | null } | null>(null);
  const [surfaceTelemetry, setSurfaceTelemetry] = useState<Partial<CleakerSurfaceEntry> | null>(initialSurface ?? null);
  const [surfaceRequestEvents, setSurfaceRequestEvents] = useState<CleakerSurfaceRequestEvent[]>(initialRequestEvents ?? []);

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
      setConnected(false);
      return;
    }

    const source = new EventSource(`${safeEndpoint}/__surface/events`);

    const mergeTelemetry = (payload: any) => {
      const telemetry = payload && typeof payload === 'object' && payload.telemetry ? payload.telemetry : payload;
      if (!telemetry || typeof telemetry !== 'object') return;

      setSurfaceTelemetry((current) => ({ ...(current || {}), ...telemetry }));

      const recentRequests = Array.isArray((telemetry as any)?.monitor?.recentRequests)
        ? ((telemetry as any).monitor.recentRequests as CleakerSurfaceRequestEvent[])
        : null;
      if (recentRequests) setSurfaceRequestEvents(recentRequests);
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
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    return () => {
      source.removeEventListener('surface', onSurface as EventListener);
      source.removeEventListener('request', onRequest as EventListener);
      source.close();
    };
  }, [safeEndpoint]);

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

  const surfaceEntryBase = useMemo(() => {
    if (hostResolvedSurfaceEntry) return hostResolvedSurfaceEntry as CleakerSurfaceEntry;
    return createSurfaceEntry({
      namespaceUrl,
      endpoint: safeEndpoint,
      namespaceHandle,
      rootHostNamespace,
      resolverHostName,
      connected,
    });
  }, [connected, hostResolvedSurfaceEntry, namespaceHandle, namespaceUrl, resolverHostName, rootHostNamespace, safeEndpoint]);

  const surfaceEntry = useMemo(
    () => mergeSurfaceEntry(surfaceEntryBase, surfaceTelemetry, surfaceRequestEvents),
    [surfaceEntryBase, surfaceTelemetry, surfaceRequestEvents],
  );

  const surfaceRowSegment = (section: string, label: string, index: number) =>
    `${section}-row-${index + 1}-${normalizeNodeSegment(label, `${section}-item`)}`;
  const surfaceResourceSegment = (resource: string, index: number) =>
    `surface-resource-${index + 1}-${normalizeNodeSegment(resource, 'resource')}`;

  const surfaceMetaRows = [
    { label: 'Host ID', value: surfaceEntry.hostId },
    { label: 'Type', value: surfaceEntry.type },
    { label: 'Trust', value: surfaceEntry.trust },
    { label: 'Root Name', value: surfaceEntry.rootName },
  ];

  const surfaceAccessRows = [
    { label: 'Namespace', value: surfaceEntry.namespace },
    { label: 'Endpoint', value: surfaceEntry.endpoint },
  ];

  // Gauges show USAGE (what's being consumed), not just capacity (what
  // exists) — a flat "CPU Cores: 10" told you nothing about load. Ratios
  // come from live surface telemetry (surfaceEntry.usage.*); `null` renders
  // an empty/unknown ring rather than a misleading 0%.
  const capacityGauges = [
    {
      label: 'CPU',
      ratio: surfaceEntry.usage?.cpu ?? null,
      totalLabel: surfaceEntry.capacity.cpuCores == null ? '—' : `${surfaceEntry.capacity.cpuCores} cores`,
    },
    {
      label: 'RAM',
      ratio: surfaceEntry.usage?.memory ?? null,
      totalLabel: surfaceEntry.capacity.ramGb == null ? '—' : `${surfaceEntry.capacity.ramGb} GB`,
    },
    {
      label: 'Storage',
      ratio: surfaceEntry.usage?.storage ?? null,
      totalLabel: surfaceEntry.capacity.storageGb == null ? '—' : `${surfaceEntry.capacity.storageGb} GB`,
    },
  ];
  const bandwidthLabel =
    surfaceEntry.capacity.bandwidthMbps == null ? null : `${surfaceEntry.capacity.bandwidthMbps} Mbps available`;

  const surfaceStatusRows = [
    { label: 'Availability', value: surfaceEntry.status.availability },
    { label: 'Sync', value: surfaceEntry.status.syncState },
    { label: 'Latency (ms)', value: surfaceEntry.status.latencyMs },
    {
      label: 'Last Seen',
      value: surfaceEntry.status.lastSeen ? new Date(surfaceEntry.status.lastSeen).toLocaleString() : null,
    },
  ];

  const surfaceResourceItems = surfaceEntry.resources.map((resource, index) => ({
    key: normalizeNodeSegment(resource, `resource-${index + 1}`),
    resource,
  }));

  return (
    <Box
      data-gui-node-id={dataGuiNodeId}
      data-gui-component={dataGuiComponent}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.default',
        ...sx,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        Host Resources
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
        {SURFACE_DESCRIPTION}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
          gap: 1.5,
          minWidth: 0,
        }}
      >
        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Identity</Typography>
          {surfaceMetaRows.map((row, index) => (
            <Box
              key={row.label}
              data-gui-node-id={surfaceRowSegment('surface-identity', row.label, index)}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.35, minWidth: 0 }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>{row.label}</Typography>
              <Typography
                variant="body2"
                title={String(row.value || '—')}
                sx={{ textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {String(row.value || '—')}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Access</Typography>
          {surfaceAccessRows.map((row, index) => (
            <Box
              key={row.label}
              data-gui-node-id={surfaceRowSegment('surface-access', row.label, index)}
              sx={{ py: 0.35 }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.label}</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', mt: 0.25 }}>{String(row.value || '—')}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Resources</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {surfaceResourceItems.length ? (
              surfaceResourceItems.map((item, index) => (
                <Box
                  key={item.key}
                  data-gui-node-id={surfaceResourceSegment(item.resource, index)}
                  sx={{ px: 1, py: 0.45, borderRadius: 999, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}
                >
                  <Typography variant="caption">{item.resource}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>No resources advertised yet.</Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gridColumn: isMobile ? 'auto' : '1 / -1', minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Capacity</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {capacityGauges.map((gauge) => (
              <Gauge key={gauge.label} label={gauge.label} ratio={gauge.ratio} totalLabel={gauge.totalLabel} size={84} />
            ))}
          </Box>
          {bandwidthLabel ? (
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1.25 }}>
              {bandwidthLabel}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gridColumn: isMobile ? 'auto' : '1 / -1', minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
            {surfaceStatusRows.map((row, index) => (
              <Box
                key={row.label}
                data-gui-node-id={surfaceRowSegment('surface-status', row.label, index)}
                sx={{ py: 0.35, minWidth: 0 }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word' }}>{row.value == null || row.value === '' ? '—' : String(row.value)}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gridColumn: isMobile ? 'auto' : '1 / -1' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Requests</Typography>
          {surfaceRequestEvents.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Waiting for request traffic...</Typography>
          ) : (
            <Box
              sx={{
                mt: 0.25,
                p: 1,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                height: 220,
                minHeight: 140,
                resize: 'vertical',
                overflowY: 'auto',
                overflowX: 'hidden',
                fontFamily: 'monospace',
                fontSize: '0.76rem',
                lineHeight: 1.45,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {surfaceRequestEvents.slice(0, 40).map((event) => (
                <Typography
                  key={event.id}
                  variant="caption"
                  title={`${event.method} ${event.status} ${event.durationMs}ms ${event.url} ${new Date(event.timestamp).toLocaleTimeString()} · ${event.namespace || '—'} · ${event.operation || 'read'}`}
                  sx={{
                    display: 'block',
                    color: 'text.primary',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    '&:not(:last-child)': { mb: 0.45 },
                  }}
                >
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {event.method} {event.status}
                  </Box>{' '}
                  <Box component="span" sx={{ color: 'text.secondary' }}>{event.durationMs}ms</Box>{' '}
                  <Box component="span" sx={{ color: 'text.primary' }}>{event.url}</Box>{' '}
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {new Date(event.timestamp).toLocaleTimeString()} · {event.namespace || '—'} · {event.operation || 'read'}
                  </Box>
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
