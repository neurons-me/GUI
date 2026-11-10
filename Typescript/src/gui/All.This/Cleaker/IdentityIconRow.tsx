// IdentityIconRow.tsx — personal entries under the signed-in QR card:
// keys, wallet, profile, contacts. This card is the username's root tree
// in card mode: it does not show sidebar/.GUI icons, and service icons
// (PayPal, Meta, Grok, …) belong on the keys screen, not here.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';

const PERSONAL_ENTRIES = [
  { id: 'keys', label: 'Keys', to: '/keychain', icon: 'key' },
  { id: 'wallet', label: 'Wallet', to: '/wallet', icon: 'account_balance_wallet' },
  { id: 'profile', label: 'Profile', to: '/profile', icon: 'person' },
  { id: 'contacts', label: 'Contacts', to: '/contacts', icon: 'contacts' },
] as const;

export interface IdentityIconRowProps {
  nodeId: string;
  onNavigate: (to: string) => void;
}

export default function IdentityIconRow({ nodeId, onNavigate: navigate }: IdentityIconRowProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: '13px' }}>
      {PERSONAL_ENTRIES.map((entry) => (
        <Box
          key={entry.id}
          component="button"
          type="button"
          aria-label={entry.label}
          title={entry.label}
          onClick={() => navigate(entry.to)}
          data-gui-node-id={`${nodeId}.${entry.id}`}
          sx={{ display: 'flex', p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, background: 'transparent', color: 'inherit', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Icon name={entry.icon} fontSize="1.25rem" />
        </Box>
      ))}
    </Box>
  );
}
