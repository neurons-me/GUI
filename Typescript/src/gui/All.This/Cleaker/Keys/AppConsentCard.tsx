// AppConsentCard.tsx — the .me's consent prompt for ANY app's challenge (generic: the adapter supplies the words).
// Shows what was asked AFTER local decryption: app, operation, resource, path, expiry, and why it is asking
// (no permission, op always asks, …). Never shows the nonce, the signature material or any key.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import type { AppAdapter } from './appAdapters';
import { GRANT_REASON_TEXT, type GrantReason } from './appGrants';

export interface AppConsentRequest {
  adapter: AppAdapter;
  op: string;
  resource: string;
  path: string;
  target?: string;
  expiresAt: number;
  /** Why the .me is asking instead of answering on its own. */
  reason: GrantReason | 'ASK';
}

export function ActionButton({ children, onClick, tone = 'default', action, disabled }: {
  children: React.ReactNode; onClick?: () => void; tone?: 'default' | 'primary' | 'danger'; action?: string; disabled?: boolean;
}) {
  const primary = tone === 'primary';
  return (
    <Box
      component="button" type="button" onClick={onClick} data-action={action} aria-disabled={disabled || undefined}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.6, borderRadius: 1.5, font: 'inherit', fontWeight: 600, fontSize: '0.8rem',
        border: primary ? '1px solid transparent' : '1px solid', borderColor: tone === 'danger' ? 'error.main' : primary ? 'transparent' : 'divider',
        bgcolor: primary ? 'primary.main' : 'transparent', color: primary ? 'primary.contrastText' : tone === 'danger' ? 'error.main' : 'text.primary',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : undefined,
        '&:hover': { filter: 'brightness(1.08)' },
      }}
    >
      {children}
    </Box>
  );
}

export default function AppConsentCard({ request, onApprove, onDeny, approveLabel = 'Sign once', extra, now = Date.now() }: {
  request: AppConsentRequest;
  onApprove: () => void;
  onDeny: () => void;
  approveLabel?: string;
  /** Extra action (e.g. "Connect output → input"). */
  extra?: React.ReactNode;
  now?: number;
}) {
  const { adapter, op, resource, path, target, expiresAt, reason } = request;
  const def = adapter.ops[op];
  const secs = Math.max(0, Math.round((expiresAt - now) / 1000));
  const always = def?.neverAuto;
  return (
    <Box
      role="alertdialog" aria-label={`${adapter.label} asks to sign ${op}`}
      data-gui-component="AppConsentCard" data-consent-app={adapter.id} data-consent-op={op} data-consent-reason={reason}
      sx={{ width: '100%', border: '1px solid', borderColor: always ? 'warning.main' : 'divider', borderRadius: 2, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name={adapter.icon} fontSize="1.1rem" />
        <Typography variant="body2" sx={{ fontWeight: 700 }} data-consent-title>
          {adapter.label} asks to sign <Box component="span" sx={{ color: always ? 'warning.main' : 'primary.main' }}>{def?.label ?? op}</Box> of {adapter.resourceKind} {resource}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
        at .{path} · op {op}{target ? ` · to ${target}` : ''} · expires in {secs}s
      </Typography>
      <Typography variant="caption" sx={{ color: always ? 'warning.main' : 'text.secondary' }} data-consent-why>
        {reason === 'ASK' ? 'Asking every time (no automatic mode).' : GRANT_REASON_TEXT[reason]}
        {' '}Only a signature and your public key go back; never a key, seed or secret.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ActionButton tone="primary" onClick={onApprove} action="consent-approve"><Icon name="draw" fontSize="1rem" />{approveLabel}</ActionButton>
        {extra}
        <ActionButton onClick={onDeny} action="consent-deny">Deny</ActionButton>
      </Box>
    </Box>
  );
}
