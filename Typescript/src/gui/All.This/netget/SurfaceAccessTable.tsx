import { Box } from '@mui/material';
import Typography from '@/gui/Atoms/Typography/Typography';

// Mirrors netget's own `Surface` type (modules/netget/Typescript/src/types/Surface.ts) --
// not re-imported across the package boundary (GUI has no dependency on netget today),
// but kept structurally identical on purpose. "The thing that answers/is reachable at a
// namespace" -- the shape apps.json entries, this table's old hardcoded rows, and
// WelcomeNetget.jsx's domainRows/portsWithStatus each converged on independently.
export type SurfaceKind = 'netget' | 'monad' | 'direct' | 'public';
export type SurfaceTrust = 'owner' | 'admin' | 'peer' | 'guest';

export interface Surface {
  namespace: string;
  kind: SurfaceKind;
  endpoint?: string;
  identity?: string;
  trust?: SurfaceTrust;
  online: boolean;
  lastSeenMs?: number;
}

export interface SurfaceAccessTableProps {
  /** Pure display: caller fetches (e.g. via netget's createMeNetgetClient) and passes rows in. */
  rows: Surface[];
}

const KIND_COLOR: Record<SurfaceKind, string> = {
  netget: '#4fc3f7',
  monad:  '#81c784',
  direct: '#ffb74d',
  public: '#ce93d8',
};

const KIND_LABEL: Record<SurfaceKind, string> = {
  netget: 'NetGet',
  monad:  'Monad',
  direct: 'Direct',
  public: 'Public',
};

export default function SurfaceAccessTable({ rows }: SurfaceAccessTableProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="caption"
        sx={{ display: 'block', mb: 1.5, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.7rem' }}
      >
        Surface Access Points
      </Typography>

      <Box
        sx={{
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr 1fr 28px',
            px: 2, py: 1,
            bgcolor: 'action.hover',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {['Address', 'Endpoint', 'Kind', ''].map(h => (
            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Rows */}
        {rows.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              No surfaces resolved.
            </Typography>
          </Box>
        ) : rows.map((row, i) => (
          <Box
            key={row.namespace}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.4fr 1fr 28px',
              px: 2, py: 1.25,
              borderBottom: i < rows.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              transition: 'background 120ms ease',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {/* Address */}
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: KIND_COLOR[row.kind] }}
            >
              {row.namespace}
            </Typography>

            {/* Endpoint */}
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
              {row.endpoint || '—'}
            </Typography>

            {/* Kind */}
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: KIND_COLOR[row.kind] }}>
              {KIND_LABEL[row.kind]}
            </Typography>

            {/* Status */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Box
                title={row.online ? 'online' : 'offline'}
                sx={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  bgcolor: row.online ? '#4caf50' : 'rgba(255,255,255,0.18)',
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2.5, mt: 1.5, flexWrap: 'wrap' }}>
        {(Object.keys(KIND_LABEL) as SurfaceKind[]).map(kind => (
          <Box key={kind} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: KIND_COLOR[kind], flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              {KIND_LABEL[kind]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
