// Card-mode login status: the username's root tree under the QR
// (keys, wallet, profile, contacts + Sign out), or a Sign in action
// when there is no session. Used on the landing and inside CleakerQrMenu.
import React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import QRme, { type QRmeProps } from '@/gui/All.This/me/QR/QR.me';
import IdentityIconRow from './IdentityIconRow';

export type MeLoginStatusProps = {
  nodeId: string;
  authenticated: boolean;
  qr: Pick<QRmeProps, 'value' | 'username' | 'status' | 'statusLabel' | 'perimeterLabel' | 'perimeterRootLabel'> & {
    diameter?: number;
  };
  identityHash?: string | null;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  onSignIn?: () => void;
};

export default function MeLoginStatus({
  nodeId,
  authenticated,
  qr,
  identityHash,
  onNavigate,
  onLogout,
  onSignIn,
}: MeLoginStatusProps) {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, pb: 0.5 }}>
      <QRme
        value={qr.value}
        username={qr.username}
        diameter={qr.diameter ?? 125}
        fitDiameter
        hoverFlip={false}
        clickFlip={false}
        status={qr.status}
        statusLabel={qr.statusLabel}
        perimeterLabel={qr.perimeterLabel}
        perimeterRootLabel={qr.perimeterRootLabel}
        data-gui-node-id={`${nodeId}.qr`}
      />
      {authenticated ? (
        <>
          <IdentityIconRow nodeId={nodeId} onNavigate={onNavigate} />
          <Typography hidden variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }} data-gui-node-id={`${nodeId}.identityHash`}>
            {identityHash || ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: '8px' }}>
            <Box
              component="button"
              type="button"
              onClick={onLogout}
              data-gui-node-id={`${nodeId}.logout`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                px: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Icon name="logout" fontSize="1rem" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign out</Typography>
            </Box>
          </Box>
        </>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, mt: '13px' }}>
          <Box
            component="button"
            type="button"
            onClick={onSignIn}
            data-gui-node-id={`${nodeId}.signin`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              px: 2,
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              background: 'transparent',
              color: 'primary.main',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign in</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
