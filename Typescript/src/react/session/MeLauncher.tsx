// MeLauncher.tsx — sidebar bubble for the current .me session. Mirrors
// ThemeLauncher/DevToolsLauncher's bubble+popper shape so all three sit
// consistently in a LeftBar footer. This is the visible face of the app's
// identity session: entering/leaving here is the single action that changes
// what the rest of the app can see and write — every view reading
// useSeedSession()/useMeValue() reacts to it, nothing else needs wiring.
//
// Supports two shapes of "how do I get a seed", auto-detected from which
// provider wraps the app (never both at once, so no explicit mode prop):
//   - SessionSurface (useOptionalSessionSurface()) — one-click anonymous
//     entry, seed generated client-side. FullTrailer-style apps use this.
//   - Bare SeedSessionProvider with resolveSeedFromCredentials
//     (useOptionalSeedSessionContext()) — username/secret form, seed
//     derived from credentials server-side-equivalent (deriveCompoundSeed).
//     netget-style gateway apps use this; this branch absorbs what used to
//     be Domains.jsx's own UnlockDialog.
// If neither provider is present, renders nothing — same
// graceful-degradation DevToolsLauncher already established for
// useOptionalSelection().
import React, { useRef, useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import TextField from '@mui/material/TextField';
import { LeftSidebarContext } from '@/gui-internals/Contexts/LeftSidebarContext';
import { useOptionalSessionSurface } from './SessionSurface';
import { useOptionalSeedSessionContext } from './SeedSessionProvider';
import { useLauncherPopover } from '@/runtime/launcherPopover';
import { useRegisterGuiNode } from '@/runtime/selection';
import { useGuiNodeId } from '@/runtime/guiNodeId';
import CleakerQR from '@/gui/All.This/Cleaker/QR/CleakerQR';

export interface MeLauncherProps {
  sx?: any;
  /**
   * Cleaker endpoint the credentials-branch QR resolves against (e.g.
   * "http://local.cleaker" for a netget-hosted gateway). Defaults to
   * CleakerQR's own default (https://cleaker.me) when omitted — only
   * meaningful for the credentials branch; the SessionSurface branch has
   * no username concept and never renders a QR.
   */
  cleakerEndpoint?: string;
}

// Adapts either provider's shape into what the bubble/popper below render —
// keeps the JSX single-sourced instead of duplicating the whole component
// per branch.
export interface MeLauncherView {
  authenticated: boolean;
  label: string;
  pending: boolean;
  error: Error | null;
  onEnter: () => Promise<void>;
  onLogout: () => void;
  // Credentials-branch only — null for SessionSurface's one-click shape.
  credentialsForm: { username: string; setUsername: (v: string) => void; password: string; setPassword: (v: string) => void } | null;
  // The full claimed namespace (e.g. "jabellae.local.cleaker") once
  // authenticated — unlike credentialsForm.username, this survives
  // SeedSessionProvider's remount (it comes straight from context state,
  // same reasoning as `label`'s own identityHash). null before auth, and
  // for SessionSurface's one-click shape (no separate username/root split
  // there — `label`/`handle` already is the whole identity).
  semanticNamespace: string | null;
}

// Exported so CleakerLanding.tsx (the full-page "Hello, I am .me" landing,
// same session, different chrome) can share this exact adapter instead of
// re-deriving it — one source of truth for "how do I get a seed" across
// both the compact sidebar bubble and the landing page.
export function useMeLauncherView(): MeLauncherView | null {
  const surface = useOptionalSessionSurface();
  const seedSession = useOptionalSeedSessionContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (surface) {
    const { authenticated, handle, pending, error, enter, logout } = surface;
    return {
      authenticated,
      label: authenticated ? (handle || '') : 'Entrar con .me',
      pending,
      error,
      onEnter: enter,
      onLogout: logout,
      credentialsForm: null,
      semanticNamespace: null,
    };
  }

  if (seedSession) {
    const { authenticated, identityHash, semanticNamespace, pending, error, loginWithCredentials, logout } = seedSession;
    return {
      authenticated,
      // The username itself doesn't survive SeedSessionProvider's remount
      // on first-login (see SessionSurface.tsx's comment on the same
      // issue) — identityHash comes from context state, so it does.
      label: authenticated ? (identityHash ? identityHash.slice(0, 10) : 'Conectado') : 'Entrar con .me',
      pending,
      error,
      onEnter: async () => {
        await loginWithCredentials({ username: username.trim(), password });
        setUsername('');
        setPassword('');
      },
      onLogout: logout,
      credentialsForm: { username, setUsername, password, setPassword },
      semanticNamespace: authenticated ? semanticNamespace : null,
    };
  }

  return null;
}

const MeLauncher: React.FC<MeLauncherProps> = ({ sx, cleakerEndpoint }) => {
  const view = useMeLauncherView();
  const leftSidebarContext = React.useContext(LeftSidebarContext);
  const isRailView = leftSidebarContext?.view === 'rail';
  const [open, setOpen] = useLauncherPopover('me');
  const bubbleRef = useRef<HTMLDivElement>(null);
  // Its parts hang under the id it is given (`GUI.bars.left.footer.me`) and are
  // on the tree only while they are on the page: nothing without a session
  // view, the label unless the bar is a rail. (The QR registers itself.)
  const base = useGuiNodeId('MeLauncher');
  useRegisterGuiNode(!!view && `${base}.icon`, 'icon');
  useRegisterGuiNode(!!view && !isRailView && `${base}.label`, 'label');

  if (!view) return null;
  const { authenticated, label: handle, pending, error, onEnter: enter, onLogout: logout, credentialsForm } = view;

  const openMenu = () => setOpen((v) => !v);

  const handleEnter = async () => {
    if (credentialsForm && (!credentialsForm.username.trim() || !credentialsForm.password)) return;
    await enter();
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <Box data-gui-inspector-control="true" sx={{ width: '100%', minWidth: 0, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isRailView ? 'center' : 'flex-start',
          gap: 1,
          width: isRailView ? 44 : '100%',
          minWidth: 0,
          height: 44,
          mx: isRailView ? 'auto' : 0,
          boxSizing: 'border-box',
        }}
      >
        <Box
          ref={bubbleRef}
          data-gui-node-id={`${base}.icon`}
          data-gui-component="icon"
          role={isRailView ? 'button' : undefined}
          tabIndex={isRailView ? 0 : undefined}
          aria-label={isRailView ? 'Open .me session' : undefined}
          onMouseEnter={openMenu}
          onClick={isRailView ? openMenu : undefined}
          sx={{
            position: 'relative',
            width: 44,
            height: 44,
            flexShrink: 0,
            cursor: isRailView ? 'pointer' : 'default',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              border: '1px solid',
              borderColor: authenticated ? 'primary.main' : 'divider',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              transition: 'border-color 120ms ease, transform 120ms ease',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            <Icon
              name="account_circle"
              fontSize="1.3rem"
              iconColor={authenticated ? 'primary' : undefined}
            />
          </Box>
          {authenticated && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: '999px',
                bgcolor: 'primary.main',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
          )}
        </Box>
        {!isRailView && (
          <Box
            component="button"
            type="button"
            data-gui-node-id={`${base}.label`}
            data-gui-component="label"
            aria-label="Open .me session"
            aria-expanded={open}
            onClick={openMenu}
            sx={{
              flex: 1,
              minWidth: 0,
              p: 0,
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {authenticated ? handle : 'Entrar con .me'}
            </Typography>
          </Box>
        )}
      </Box>

      <Popper
        open={open}
        anchorEl={bubbleRef.current}
        placement="right-start"
        sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 3 }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box
            data-gui-inspector-control="true"
            sx={{
              ml: 1,
              p: 1.5,
              minWidth: 220,
              maxWidth: 280,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: 4,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>
              .me
            </Typography>
            {authenticated ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {handle}
                </Typography>
                <Box
                  component="button"
                  type="button"
                  onClick={handleLogout}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    p: 0.75,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon name="logout" fontSize="1rem" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Salir</Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Sin sesión — datos públicos visibles, escritura deshabilitada.
                </Typography>
                {credentialsForm && (
                  <>
                    {credentialsForm.username.trim() && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <CleakerQR
                          username={credentialsForm.username.trim()}
                          endpoint={cleakerEndpoint}
                          variant="icon"
                          data-gui-node-id={`${base}.qr`}
                        />
                      </Box>
                    )}
                    <TextField
                      size="small"
                      label="Username"
                      value={credentialsForm.username}
                      onChange={(e) => credentialsForm.setUsername(e.target.value)}
                      disabled={pending}
                      autoFocus
                      fullWidth
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Secret"
                      type="password"
                      value={credentialsForm.password}
                      onChange={(e) => credentialsForm.setPassword(e.target.value)}
                      disabled={pending}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEnter(); }}
                      fullWidth
                      sx={{ mb: 1 }}
                    />
                  </>
                )}
                {error && (
                  <Typography variant="body2" sx={{ color: 'error.main', mb: 1 }}>
                    {error.message}
                  </Typography>
                )}
                <Box
                  component="button"
                  type="button"
                  onClick={handleEnter}
                  disabled={pending || (!!credentialsForm && (!credentialsForm.username.trim() || !credentialsForm.password))}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    p: 0.75,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    background: 'transparent',
                    color: 'primary.main',
                    cursor: pending ? 'wait' : 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {pending ? 'Entrando…' : 'Entrar con .me'}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default MeLauncher;
