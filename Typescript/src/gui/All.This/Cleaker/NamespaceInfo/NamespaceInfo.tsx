// NamespaceInfo.tsx — namespace identity + effective budget/contract.
// Extracted from namespace.tsx's "Details" tab. Deliberately does NOT
// include live status/requests (that's HostResources's job) or the
// "Monad Ledger Monitor" that used to duplicate HostResources's own
// "Active Requests" stream verbatim.
//
// Effective Budget stays here, not in HostResources, on purpose: it's
// the namespace's declared contract (`.me` limit, surface policy, assigned
// budget) — CPU pressure feeds into it as one input, but the result is
// governance, not a live metric. Callers own resolving identity (QR value,
// monad/namespace labels, root hash) and the surface fields the budget
// calc needs — same responsibility split BlocksTable/UsersTable already
// have (they take resolved props, they don't re-derive the namespace
// expression themselves).
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@/gui/Atoms';
import { useGuiTheme } from '@/gui-internals/Hooks';
import QR from '../../me/QR';
import { computeBlockchainLimit, type CleakerSurfaceEntry } from '../surfaceModel';

export interface NamespaceInfoProps {
  /** Endpoint the Stress Test burst is fired against. */
  endpoint?: string;
  /** QR payload — the resolved namespace URL/hash to encode. */
  qrValue?: string | null;
  /** Formatted "name@host:port" label. */
  monadLabel?: string | null;
  /** Compact root namespace name for display. */
  namespaceLabel?: string | null;
  /** Full root namespace hash — masked for display. */
  rootNamespaceHash?: string | null;
  /** `.me` render limit before policy/budget/pressure negotiation. Default 120. */
  meLimit?: number;
  /** Surface fields the budget calc reads (type, status, policy, budget, pressure). */
  surface?: Pick<CleakerSurfaceEntry, 'type' | 'status' | 'policy' | 'budget' | 'pressure'> | null;
  sx?: any;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
}

function maskHash(hash: string): string {
  const value = String(hash || '').trim();
  if (!value) return '';
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export default function NamespaceInfo({
  endpoint = '',
  qrValue = '',
  monadLabel = '',
  namespaceLabel = '',
  rootNamespaceHash = '',
  meLimit = 120,
  surface = null,
  sx,
  'data-gui-node-id': dataGuiNodeId = 'NamespaceInfo',
  'data-gui-component': dataGuiComponent = 'NamespaceInfo',
}: NamespaceInfoProps) {
  const theme = useGuiTheme();
  const safeEndpoint = String(endpoint || '').trim().replace(/\/+$/, '');

  const [stressMode, setStressMode] = useState(false);
  const stressTimerRef = useRef<number | null>(null);

  const blockchainLimit = computeBlockchainLimit({ meLimit, surface });
  const [appliedRowsLimit, setAppliedRowsLimit] = useState(blockchainLimit.effectiveLimit);

  useEffect(() => {
    setAppliedRowsLimit((current) => {
      if (!Number.isFinite(current) || current <= 0) return blockchainLimit.effectiveLimit;
      return current;
    });
  }, [blockchainLimit.effectiveLimit]);

  useEffect(() => {
    if (appliedRowsLimit === blockchainLimit.effectiveLimit) return;

    const timeoutId = window.setTimeout(() => {
      setAppliedRowsLimit((current) => {
        const target = blockchainLimit.effectiveLimit;
        if (current === target) return current;
        const delta = target - current;
        const step = Math.max(1, Math.ceil(Math.abs(delta) / 3));
        return delta > 0 ? Math.min(target, current + step) : Math.max(target, current - step);
      });
    }, 140);

    return () => window.clearTimeout(timeoutId);
  }, [appliedRowsLimit, blockchainLimit.effectiveLimit]);

  useEffect(() => {
    if (stressTimerRef.current) {
      window.clearInterval(stressTimerRef.current);
      stressTimerRef.current = null;
    }

    if (!stressMode || !safeEndpoint || typeof window === 'undefined' || typeof fetch !== 'function') return;

    const fireBurst = () => {
      const base = `${safeEndpoint}/__surface`;
      for (let index = 0; index < 3; index += 1) {
        const marker = `${Date.now()}-${index}`;
        void fetch(`${base}?stress=${encodeURIComponent(marker)}`, { method: 'GET', cache: 'no-store' }).catch(() => {
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

  useEffect(() => {
    return () => {
      if (stressTimerRef.current) window.clearInterval(stressTimerRef.current);
    };
  }, []);

  const budgetRows: Array<[string, string | number]> = [
    ['.me limit', blockchainLimit.meLimit],
    ['Surface policy', blockchainLimit.policyLimit],
    ['Surface budget', blockchainLimit.budgetRows],
    ['CPU pressure', blockchainLimit.pressureCpu.toFixed(2)],
    ['Base', blockchainLimit.baseLimit],
    ['Target', blockchainLimit.effectiveLimit],
    ['Applied', appliedRowsLimit],
  ];

  const hasPreview = Boolean(qrValue || monadLabel || namespaceLabel || rootNamespaceHash);

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
      {hasPreview ? (
        <Box
          sx={{
            mb: 2,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'grid',
            gridTemplateColumns: '96px minmax(0, 1fr)',
            gap: 1.25,
            alignItems: 'start',
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrValue ? (
              <QR value={qrValue} size={96} fg={theme.palette.primary.main} ecc="H" embedMode="positive-overlay" embedScale={0.32} />
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, minWidth: 0 }}>
            <Typography variant="h6">Namespace</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Monad: <Box component="span" sx={{ color: 'text.primary', fontFamily: 'monospace', wordBreak: 'break-all' }}>{monadLabel || '—'}</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Namespace: <Box component="span" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>{namespaceLabel || '—'}</Box>
            </Typography>
            {rootNamespaceHash ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Root Hash: <Box component="span" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>{maskHash(rootNamespaceHash)}</Box>
              </Typography>
            ) : null}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Effective Budget</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.25 }}>
          Namespace render is negotiated from `.me` intent, `surface` policy, assigned budget, and current CPU pressure.
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 1.25, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant={stressMode ? 'outlined' : 'text'}
            color={stressMode ? 'warning' : 'primary'}
            onClick={() => setStressMode((value) => !value)}
            sx={{ minHeight: 30, px: 1.1, fontSize: '0.78rem' }}
          >
            {stressMode ? 'Stop Stress' : 'Stress Test'}
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
            {stressMode ? 'Injecting request bursts into monad.ai' : 'Run a burst loop to watch budget collapse'}
          </Typography>
        </Box>
        {budgetRows.map(([label, value]) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.35 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: label === 'CPU pressure' ? 'monospace' : 'inherit' }}>
              {String(value)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
