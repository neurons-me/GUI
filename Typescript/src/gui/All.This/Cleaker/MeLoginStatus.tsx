// Card-mode login status: the username's root tree under the QR
// (keys, wallet, profile, contacts + Sign out), or a Sign in action
// when there is no session. Used on the landing and inside CleakerQrMenu.
import React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import QRme, { type QRmeProps } from '@/gui/All.This/me/QR/QR.me';
import IdentityIconRow from './IdentityIconRow';

/** Drawn size of the card QR, in rem (125px at a 16px root). Locked so /keys cannot change it. */
export const QR_CARD_DIAMETER_REM = 7.8125;

function cardQrDiameterPx(): number {
  if (typeof window === 'undefined') return 125;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return (Number.isFinite(rem) && rem > 0 ? rem : 16) * QR_CARD_DIAMETER_REM;
}


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
  /** When set, replaces the default icon row under the QR (IdentityTree already includes that row). */
  tree?: React.ReactNode;
  /** Sign out lives elsewhere (the card's icon under its gear): no Sign out button here. */
  hideSignOut?: boolean;
};

export default function MeLoginStatus({
  nodeId,
  authenticated,
  qr,
  identityHash,
  onNavigate,
  onLogout,
  onSignIn,
  tree,
  hideSignOut = false,
}: MeLoginStatusProps) {
  return (
    <Box data-me-login="" sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, pb: 0, flex: '1 1 auto', minHeight: 0, overflow: 'visible', '& [data-qr-anchor]': { flex: '0 0 auto' } }}>
      <Box
        data-qr-anchor=""
        sx={{
          position: 'relative',
          left: '50%',
          // --qr-header-shift keeps this axis on the resting QR centre when
          // the paper is pushed or viewport-clamped (see CleakerQrMenu).
          transform: 'translateX(calc(-50% + var(--qr-header-shift, 0px)))',
          width: 'max-content',
        }}
      >
      <QRme
        value={qr.value}
        username={qr.username}
        diameter={qr.diameter ?? cardQrDiameterPx()}
        fitDiameter
        lockSize
        hoverFlip={false}
        clickFlip={false}
        status={qr.status}
        statusLabel={qr.statusLabel}
        perimeterLabel={qr.perimeterLabel}
        perimeterRootLabel={qr.perimeterRootLabel}
        data-gui-node-id={`${nodeId}.qr`}
      />
      </Box>
      {authenticated ? (
        <>
          {tree ?? <IdentityIconRow nodeId={nodeId} onNavigate={onNavigate} />}
          <Typography hidden variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }} data-gui-node-id={`${nodeId}.identityHash`}>
            {identityHash || ''}
          </Typography>
          {!hideSignOut && <Box sx={{ display: 'flex', gap: 1, mt: '8px' }}>
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
          </Box>}
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
