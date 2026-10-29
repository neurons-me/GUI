// IdentityIconRow.tsx — the icon row under the QR once signed in: Keychain, Wallet (off), then one icon per
// third-party service whose keys the keychain can hold (Twitch, PayPal, Meta). Extracted from QRConnect so it
// can be shown on its own in Storybook.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import ServiceIcon from '@/gui/All.This/Cleaker/Keychain/ServiceIcons';
import { SERVICE_DEFINITIONS, type ServiceId } from '@/gui/All.This/Cleaker/Keychain/serviceKeyVault';

export interface IdentityIconRowProps {
  nodeId: string;
  /** Services with keys saved for this identity: their icon shows in normal color, others muted. */
  savedServices: readonly ServiceId[];
  onNavigate: (to: string) => void;
}

export default function IdentityIconRow({ nodeId, savedServices, onNavigate: navigate }: IdentityIconRowProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: -1.25, mb: 0.5 }}>
      <Box
        component="button"
        type="button"
        aria-label="Keychain"
        title="Keychain"
        onClick={() => navigate('/keychain')}
        data-gui-node-id={`${nodeId}.keys`}
        sx={{ display: 'flex', p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, background: 'transparent', color: 'inherit', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Icon name="key" fontSize="1.25rem" />
      </Box>
      <Box
        component="button"
        type="button"
        disabled
        aria-label="Wallet (not available yet)"
        title="Wallet — not available yet"
        data-gui-node-id={`${nodeId}.wallet`}
        sx={{ display: 'flex', p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, background: 'transparent', color: 'text.disabled', cursor: 'not-allowed', opacity: 0.6 }}
      >
        <Icon name="account_balance_wallet" fontSize="1.25rem" />
      </Box>
      {/* Third-party service keys held in the keychain (Twitch, PayPal, Meta): normal color when saved here,
          muted when not; each opens the keychain focused on that service. */}
      {SERVICE_DEFINITIONS.map((svc) => {
        const saved = savedServices.includes(svc.id);
        return (
          <Box
            key={svc.id}
            component="button"
            type="button"
            aria-label={`${svc.name} keys (${saved ? 'saved' : 'not set'})`}
            title={`${svc.name} — ${saved ? 'keys saved' : 'not set'}`}
            onClick={() => navigate(`/keychain#${svc.id}`)}
            data-gui-node-id={`${nodeId}.service.${svc.id}`}
            data-saved={saved ? 'true' : 'false'}
            sx={{ display: 'flex', p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, background: 'transparent', color: saved ? 'inherit' : 'text.disabled', opacity: saved ? 1 : 0.6, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', opacity: 1 } }}
          >
            <ServiceIcon service={svc.id} />
          </Box>
        );
      })}
    </Box>
  );
}
