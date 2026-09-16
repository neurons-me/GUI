// HostSurface.tsx — the physical/topological dashboard for a host (e.g.
// local.host's own root). Deliberately NOT Cleaker: no claim, no identity,
// no namespace jargon — just what this machine reports about its own
// hardware and activity. See CleakerLanding.tsx for the identity/claim
// landing (local.cleaker) — the two are separate surfaces on purpose (see
// the naming-migration decision: local.host is the floor, local.cleaker is
// a room in it).
//
// Numbers here are self-reported by the monad answering the request
// (os.cpus()/os.totalmem()/os.freemem()/fs.statfsSync("/") — see
// monad.ai's selfMapping.ts/surfaceTelemetry.ts), not attested or verified
// by the mesh. Labeled "Reported by this host" rather than presented as a
// certified fact — a later "measured"/"verified" tier (e.g. for a
// marketplace/revenue-share use case) would be a different, stronger claim
// than this.
import * as React from 'react';
import { Box, Typography, Progress } from '@/gui/Atoms';

export interface HostSurfaceProps {
  /** The monad endpoint to poll for this host's own surface entry. */
  endpoint: string;
  /** Poll interval in ms. Defaults to 5000. */
  pollIntervalMs?: number;
  sx?: any;
}

type RequestEvent = {
  id: number;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  durationMs: number;
};

type MemoryBreakdownData = {
  source: 'vm_stat' | 'proc_meminfo' | 'naive';
  usedGb: number;
  reclaimableGb: number;
  breakdown?: {
    wired: number;
    active: number;
    compressed: number;
    inactive: number;
    speculative: number;
    free: number;
  };
};

type HostSurfaceState = {
  rootName: string;
  hostId: string;
  availability: string;
  cpuCores: number | null;
  cpuUsage: number | null;
  ramGb: number | null;
  ramUsage: number | null;
  ramDetail: MemoryBreakdownData | null;
  storageGb: number | null;
  storageUsage: number | null;
  bandwidthMbps: number | null;
  recentRequests: RequestEvent[];
};

const EMPTY_STATE: HostSurfaceState = {
  rootName: '',
  hostId: '',
  availability: 'unknown',
  cpuCores: null,
  cpuUsage: null,
  ramGb: null,
  ramUsage: null,
  ramDetail: null,
  storageGb: null,
  storageUsage: null,
  bandwidthMbps: null,
  recentRequests: [],
};

function parseBootstrapResponse(data: any): HostSurfaceState {
  // The top-level `surfaceEntry` (not `provider.surfaceEntry`, a separate,
  // static-only copy of the same identity fields) is the one merged with
  // live telemetry server-side (usage/pressure/monitor) — confirmed live:
  // provider.surfaceEntry has capacity but no usage/monitor keys at all.
  const entry = data?.surfaceEntry ?? {};
  const capacity = entry.capacity ?? {};
  const usage = entry.usage ?? {};
  const memoryDetail = entry.memoryDetail ?? null;
  return {
    rootName: String(entry.rootName || entry.hostId || '').trim(),
    hostId: String(entry.hostId || '').trim(),
    availability: String(entry.status?.availability || 'unknown'),
    cpuCores: typeof capacity.cpuCores === 'number' ? capacity.cpuCores : null,
    cpuUsage: typeof usage.cpu === 'number' ? usage.cpu : null,
    ramGb: typeof capacity.ramGb === 'number' ? capacity.ramGb : null,
    ramUsage: typeof usage.memory === 'number' ? usage.memory : null,
    ramDetail: memoryDetail && typeof memoryDetail.usedGb === 'number' ? memoryDetail : null,
    storageGb: typeof capacity.storageGb === 'number' ? capacity.storageGb : null,
    storageUsage: typeof usage.storage === 'number' ? usage.storage : null,
    bandwidthMbps: typeof capacity.bandwidthMbps === 'number' ? capacity.bandwidthMbps : null,
    recentRequests: Array.isArray(entry.monitor?.recentRequests) ? entry.monitor.recentRequests : [],
  };
}

function formatGb(value: number | null): string {
  if (value == null) return '—';
  return value >= 100 ? `${Math.round(value)} GB` : `${value} GB`;
}

function formatPercent(ratio: number | null): string {
  if (ratio == null) return '—';
  return `${Math.round(ratio * 100)}%`;
}

const GAUGE_SIZE = 96;
const GAUGE_THICKNESS = 4;

function gaugeColor(ratio: number | null): 'success' | 'warning' | 'error' | 'inherit' {
  if (ratio == null) return 'inherit';
  if (ratio >= 0.9) return 'error';
  if (ratio >= 0.7) return 'warning';
  return 'success';
}

function HardwareGauge({
  label,
  ratio,
  totalLabel,
  onClick,
  expanded,
}: {
  label: string;
  ratio: number | null;
  totalLabel: string;
  onClick?: () => void;
  expanded?: boolean;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: expanded ? 'primary.main' : 'divider',
        bgcolor: 'background.paper',
        flex: '1 1 0',
        minWidth: 140,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 120ms ease',
      }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 0.6 }}>
        {label}
        {onClick ? ' ⌄' : ''}
      </Typography>
      <Box sx={{ position: 'relative', width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <Progress
          kind="circular"
          variant="determinate"
          value={100}
          size={GAUGE_SIZE}
          thickness={GAUGE_THICKNESS}
          sx={{ position: 'absolute', color: 'divider' }}
        />
        <Progress
          kind="circular"
          variant="determinate"
          value={ratio == null ? 0 : Math.round(ratio * 100)}
          size={GAUGE_SIZE}
          thickness={GAUGE_THICKNESS}
          color={gaugeColor(ratio)}
          sx={{ position: 'absolute' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatPercent(ratio)}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {totalLabel}
      </Typography>
    </Box>
  );
}

const MEMORY_SEGMENT_COLORS: Record<string, string> = {
  wired: 'error.main',
  compressed: 'warning.main',
  active: 'warning.light',
  inactive: 'success.light',
  speculative: 'success.light',
  free: 'success.main',
};

const MEMORY_SEGMENT_LABELS: Record<string, string> = {
  wired: 'Wired',
  compressed: 'Compressed',
  active: 'Active',
  inactive: 'Inactive',
  speculative: 'Speculative',
  free: 'Free',
};

// What's actually pinned in RAM right now (wired/compressed/active — can't
// be reclaimed without swapping or killing something) vs what the OS is
// just holding onto because nothing else needs it yet (inactive/speculative/
// free — handed to a new process instantly, no real cost). This is the
// same split macOS's own Activity Monitor "Memory Pressure" gauge is built
// from — it's the answer to "what's actually entering and leaving RAM."
function MemoryBreakdown({ detail }: { detail: MemoryBreakdownData }) {
  const segments = detail.breakdown
    ? (Object.keys(detail.breakdown) as Array<keyof NonNullable<MemoryBreakdownData['breakdown']>>).map((key) => ({
        key,
        gb: detail.breakdown![key],
      }))
    : [
        { key: 'wired' as const, gb: detail.usedGb },
        { key: 'free' as const, gb: detail.reclaimableGb },
      ];
  const total = segments.reduce((sum, s) => sum + s.gb, 0) || 1;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        What's using RAM right now
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {detail.source === 'vm_stat'
          ? 'macOS vm_stat — pinned (wired/compressed/active) vs reclaimable (inactive/speculative/free).'
          : detail.source === 'proc_meminfo'
            ? 'Linux /proc/meminfo — MemAvailable vs the rest.'
            : 'Approximate — total minus reported-free.'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: 14,
          borderRadius: 1,
          overflow: 'hidden',
          mt: 1.25,
          mb: 1,
        }}
      >
        {segments.map((s) => (
          <Box
            key={s.key}
            title={`${MEMORY_SEGMENT_LABELS[s.key] ?? s.key}: ${s.gb.toFixed(2)} GB`}
            sx={{
              width: `${(s.gb / total) * 100}%`,
              bgcolor: MEMORY_SEGMENT_COLORS[s.key] ?? 'divider',
              minWidth: s.gb > 0 ? 2 : 0,
            }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
        {segments.map((s) => (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: MEMORY_SEGMENT_COLORS[s.key] ?? 'divider',
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {MEMORY_SEGMENT_LABELS[s.key] ?? s.key} {s.gb.toFixed(1)} GB
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function HostSurface({ endpoint, pollIntervalMs = 5000, sx }: HostSurfaceProps) {
  const [state, setState] = React.useState<HostSurfaceState>(EMPTY_STATE);
  const [connected, setConnected] = React.useState(false);
  const [ramExpanded, setRamExpanded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const url = `${String(endpoint || '').replace(/\/+$/, '')}/__bootstrap`;

    async function poll() {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setState(parseBootstrapResponse(data));
        setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    poll();
    const timer = setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [endpoint, pollIntervalMs]);

  return (
    <Box
      data-gui-component="HostSurface"
      sx={{
        maxWidth: 720,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        {/* This label answers "where is this interface" — a physical fact
            about the current page, not this monad's own configured
            identity. window.location.hostname always wins when available:
            state.rootName comes from the bootstrap response's surfaceEntry,
            which is keyed off the monad's self-identity (defaults to
            "local.cleaker" when unconfigured — see
            netgetMonadProcess.ts's UNCONFIGURED_DEFAULT_NAMESPACE), so
            every hostname alias proxying to the same netget monad
            (local.host, local.netget, ...) got back the same wrong label
            regardless of which one the browser actually used. Falls back
            to the server value only off-window (SSR) or before it's
            reachable at all. */}
        <Typography variant="h5">
          {(typeof window !== 'undefined' && window.location.hostname) || state.rootName || 'This host'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: connected && state.availability === 'online' ? 'success.main' : 'text.secondary',
          }}
        >
          {connected ? state.availability : 'connecting…'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <HardwareGauge label="CPU" ratio={state.cpuUsage} totalLabel={state.cpuCores == null ? '—' : `${state.cpuCores} cores`} />
        <HardwareGauge
          label="RAM"
          ratio={state.ramUsage}
          totalLabel={formatGb(state.ramGb)}
          onClick={state.ramDetail ? () => setRamExpanded((v) => !v) : undefined}
          expanded={ramExpanded}
        />
        <HardwareGauge label="Storage" ratio={state.storageUsage} totalLabel={formatGb(state.storageGb)} />
      </Box>

      {ramExpanded && state.ramDetail && <MemoryBreakdown detail={state.ramDetail} />}

      <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
        Reported by this host — not verified by the mesh.
        {state.bandwidthMbps == null ? ' Bandwidth: not measured.' : ` Bandwidth: ${state.bandwidthMbps} Mbps.`}
      </Typography>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Active Requests
        </Typography>
        {state.recentRequests.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Waiting for request traffic…
          </Typography>
        ) : (
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              height: 200,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.76rem',
              lineHeight: 1.5,
            }}
          >
            {state.recentRequests.slice(0, 40).map((event) => (
              <Typography
                key={event.id}
                variant="caption"
                sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {event.method} {event.status}
                </Box>{' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {event.durationMs}ms
                </Box>{' '}
                {event.url}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
