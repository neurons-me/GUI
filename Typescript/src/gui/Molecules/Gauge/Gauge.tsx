// Gauge.tsx — a circular "percentage used" ring with a total caption below.
// Same visual pattern already proven in Host/HostSurface.tsx's local
// HardwareGauge (CPU/RAM/storage usage rings) — extracted here so any
// "how much of X is in use" surface (HostResources, HostSurface, future
// per-app/per-host consoles) reads as one consistent visual system instead
// of each screen inventing its own gauge.
import * as React from 'react';
import { Box, Typography, Progress } from '@/gui/Atoms';

export interface GaugeProps {
  label: string;
  /** 0-1 fraction used. `null` renders an empty/unknown ring. */
  ratio: number | null;
  /** Caption under the ring, e.g. "10 cores" or "32 GB". */
  totalLabel: string;
  size?: number;
  thickness?: number;
  onClick?: () => void;
  active?: boolean;
  sx?: any;
}

function formatPercent(ratio: number | null): string {
  if (ratio == null) return '—';
  return `${Math.round(ratio * 100)}%`;
}

function gaugeColor(ratio: number | null): 'success' | 'warning' | 'error' | 'inherit' {
  if (ratio == null) return 'inherit';
  if (ratio >= 0.9) return 'error';
  if (ratio >= 0.7) return 'warning';
  return 'success';
}

export default function Gauge({
  label,
  ratio,
  totalLabel,
  size = 96,
  thickness = 4,
  onClick,
  active,
  sx,
}: GaugeProps) {
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
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: 'background.paper',
        flex: '1 1 0',
        minWidth: 140,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 120ms ease',
        ...sx,
      }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 0.6 }}>
        {label}
        {onClick ? ' ⌄' : ''}
      </Typography>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <Progress
          kind="circular"
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{ position: 'absolute', color: 'divider' }}
        />
        <Progress
          kind="circular"
          variant="determinate"
          value={ratio == null ? 0 : Math.round(ratio * 100)}
          size={size}
          thickness={thickness}
          color={gaugeColor(ratio)}
          sx={{ position: 'absolute' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
