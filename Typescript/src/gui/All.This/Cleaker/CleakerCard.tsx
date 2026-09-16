

import React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@/gui/Atoms/Box/Box';
import Button from '@/gui/Atoms/Button/Button';
import Icon from '@/gui/Atoms/Icon/Icon';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import TextField from '@/gui/Atoms/TextField/TextField';
import Stack from '@/gui/Molecules/Stack/Stack';
import QR from '../me/QR';
import PixelWordmark from '../me/QR/PixelWordmark';
import { ME_WORDMARK_EMBED_BITMAP } from '../me/QR/meMark';
import ClaimSurface from './ClaimSurface';
import GeneratePairingQR from './GeneratePairingQR';

export type CleakerCardNodeAttrs = (
  segment: string,
  component: string,
) => Record<string, unknown>;

export type CleakerCardThemedUi = {
  shellBorder: string;
  shellBackground: string;
  shellShadow: string;
  panelBackground: string;
  panelBorder: string;
  qrBorder: string;
  qrBackground: string;
  qrExpandedShadow: string;
  qrCollapsedShadow: string;
  inputUnderline: string;
  subtleSurface: string;
  ghostHover: string;
  activeIcon: string;
};

export type CleakerCardProps = {
  nodeAttrs: CleakerCardNodeAttrs;
  themedUi: CleakerCardThemedUi;
  theme: any;
  maxWidth?: string;
  showProfileView: boolean;
  showClaimSurfaceView: boolean;
  showLoginView: boolean;
  settingsOpen: boolean;
  avatarExpanded: boolean;
  setAvatarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  activeNamespaceUrl: string;
  identityRoot: string;
  username: string;
  setUsername: (value: string) => void;
  usernameError: string | null;
  secret: string;
  namespaceSeedHandle: string;
  liveUsernameState: 'idle' | 'invalid' | 'valid' | string;
  liveUsernameNote: string;
  setKernelViewMode: (mode: string) => void;
  claimResolutionNote: string;
  namespaceInput: string;
  setNamespaceInput: (value: string) => void;
  defaultNamespaceExpression: string;
  namespaceConfigExpression: string;
  localNamespaceUrl: string;
  networkNamespaceUrl: string;
  resolverDisplayName: string;
  compactMonadLabel: string;
  compactRootLabel: string;
  globalNamespaceRootHash: string;
  maskHash: (hash: string) => string;
  previewQrValue: string;
  runtimeAuthenticated: boolean;
  activeIdentityNamespace: string;
  identityNamespace: string;
  namespaceOrigin: string;
  hostSurfaceId: string;
  effectiveSemanticRootName: string;
  pairingExpression: string;
  clearPairingState: () => void;
  pairingLinkError: string | null;
  registerOpen: boolean;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  handleRegisterSubmit: () => void | Promise<void>;
  registerFullName: string;
  setRegisterFullName: React.Dispatch<React.SetStateAction<string>>;
  registerUsername: string;
  setRegisterUsername: React.Dispatch<React.SetStateAction<string>>;
  registerEmail: string;
  setRegisterEmail: React.Dispatch<React.SetStateAction<string>>;
  registerPhone: string;
  setRegisterPhone: React.Dispatch<React.SetStateAction<string>>;
  registerPassword: string;
  setRegisterPassword: React.Dispatch<React.SetStateAction<string>>;
  registerConfirmPassword: string;
  setRegisterConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
  registerError: string | null;
  handleLogout: () => void;
  renderProfileCard: () => React.ReactNode;
  showSecret: boolean;
  setShowSecret: React.Dispatch<React.SetStateAction<boolean>>;
  setSecret: (value: string) => void;
  handleOpenLogin: () => void;
  authStatus: 'idle' | 'checking' | 'ok' | 'error' | string;
  authProgressMessage: string;
  authError: string | null;
  authSuccessMessage: string;
  isActionDisabled: boolean;
};

export default function CleakerCard(props: CleakerCardProps) {
  const {
    nodeAttrs,
    themedUi,
    theme,
    maxWidth = '320px',
    showProfileView,
    showClaimSurfaceView,
    showLoginView,
    settingsOpen,
    avatarExpanded,
    setAvatarExpanded,
    activeNamespaceUrl,
    identityRoot,
    username,
    setUsername,
    usernameError,
    secret,
    namespaceSeedHandle,
    liveUsernameState,
    liveUsernameNote,
    setKernelViewMode,
    claimResolutionNote,
    namespaceInput,
    setNamespaceInput,
    defaultNamespaceExpression,
    namespaceConfigExpression,
    localNamespaceUrl,
    networkNamespaceUrl,
    resolverDisplayName,
    compactMonadLabel,
    compactRootLabel,
    globalNamespaceRootHash,
    maskHash,
    previewQrValue,
    runtimeAuthenticated,
    activeIdentityNamespace,
    identityNamespace,
    namespaceOrigin,
    hostSurfaceId,
    effectiveSemanticRootName,
    pairingExpression,
    clearPairingState,
    pairingLinkError,
    registerOpen,
    openRegisterModal,
    closeRegisterModal,
    handleRegisterSubmit,
    registerFullName,
    setRegisterFullName,
    registerUsername,
    setRegisterUsername,
    registerEmail,
    setRegisterEmail,
    registerPhone,
    setRegisterPhone,
    registerPassword,
    setRegisterPassword,
    registerConfirmPassword,
    setRegisterConfirmPassword,
    registerError,
    handleLogout,
    renderProfileCard,
    showSecret,
    setShowSecret,
    setSecret,
    handleOpenLogin,
    authStatus,
    authProgressMessage,
    authError,
    authSuccessMessage,
    isActionDisabled,
  } = props;

  return (
    <>
      <Box
      {...nodeAttrs('card', 'Cleaker.Card')}
      sx={{
        border: `1px solid ${themedUi.shellBorder}`,
        borderRadius: '12px',
        p: 1.5,
        width: '100%',
        maxWidth,
        background: themedUi.shellBackground,
        boxShadow: themedUi.shellShadow,
        position: 'relative',
      }}
    >
      {!showProfileView && !showClaimSurfaceView && !registerOpen ? (
        <Box
          {...nodeAttrs('header', 'Cleaker.Header')}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            mb: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0, flex: 1 }}>
            {/* QR avatar — click to expand/collapse */}
            <Box
              {...nodeAttrs('avatar', 'Cleaker.AvatarQR')}
              onClick={() => setAvatarExpanded((value) => !value)}
              sx={{
                width: avatarExpanded ? 146 : 64,
                height: avatarExpanded ? 146 : 64,
                // Square, not circular — same real, confirmed bug as
                // QR.me.tsx's own QR face (see its doc comment): a circular
                // frame this close to the QR's own side length clips the
                // corner finder patterns a camera needs intact.
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid ${themedUi.qrBorder}`,
                // Monad.tsx's own ring: a thicker solid ring plus a real
                // colored glow, not just a soft dark drop shadow — same
                // touch as QR.me.tsx's QR face.
                // Static, not animated — this is a real scannable QR
                // (Cleaker.AvatarQR), same reasoning as QR.me.tsx's own
                // matching comment: continuous motion puts the finder
                // patterns a camera needs to lock onto in motion too.
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}, 0 0 14px 3px ${theme.palette.primary.main}40, ${avatarExpanded ? '0 12px 22px rgba(0,0,0,0.18)' : '0 8px 18px rgba(0,0,0,0.14)'}`,
                background: themedUi.qrBackground,
                cursor: 'pointer',
                transition: 'width 180ms ease, height 180ms ease, box-shadow 180ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
              aria-label={avatarExpanded ? 'Collapse avatar QR' : 'Expand avatar QR'}
              title={avatarExpanded ? 'Click to collapse' : 'Click to expand'}
            >
              <QR
                value={activeNamespaceUrl || identityRoot}
                size={avatarExpanded ? 146 : 64}
                fg={theme.palette.primary.main}
                ecc="H"
                // No embed props — see QR.me.tsx's comment: QR.tsx's
                // embedMode="negative-space" still draws the bitmap back as
                // a filled shape, so it can't produce a genuinely blank
                // patch on its own. A full, undisturbed QR underneath, with
                // PixelWordmark sitting directly on top (no backing patch —
                // see QR.me.tsx's comment on why that's fine for scannability).
              />
              <PixelWordmark
                bitmap={ME_WORDMARK_EMBED_BITMAP}
                pixelSize={Math.max(1.4, (avatarExpanded ? 146 : 64) / 100)}
                pixelAspect={1.8}
                fg={theme.palette.primary.main}
                // Stacked drop-shadows (see QR.me.tsx's comment) — follows
                // the letters' own silhouette rather than a geometric
                // patch, layered up to a properly opaque halo instead of
                // one faint pass. Radii capped at 0.5x-2x the base pixel
                // size (not 1x-4x) — see QR.me.tsx's comment on why the
                // wider ceiling blurred well past the actual glyphs at
                // compact sizes.
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  filter: Array.from(
                    { length: 4 },
                    (_, i) => `drop-shadow(0 0 ${Math.max(1.4, (avatarExpanded ? 146 : 64) / 100) * (i + 1) * 0.5}px ${theme.palette.background.paper})`,
                  ).join(' '),
                }}
                data-gui-node-id="Cleaker.AvatarQR.wordmark"
              />
            </Box>

            {/* Right column: ASCII art + username field */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.35 }}>
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  lineHeight: '12px',
                  fontSize: '12px',
                  color: theme.palette.text.primary,
                }}
              >{`
    ┓   ┏┓
 ┓┏┏┣┓┏┓┏┛
•┗┻┛┛┗┗┛•
             `}</pre>
              <TextField
                {...nodeAttrs('identity-input', 'Cleaker.IdentityInput')}
                label="Username"
                variant="outlined"
                size="small"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                error={Boolean(usernameError)}
                fullWidth
                slotProps={{
                  htmlInput: {
                    autoCapitalize: 'none',
                    autoCorrect: 'off',
                    spellCheck: false,
                    inputMode: 'text',
                  },
                }}
                sx={{
                  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                    WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                    WebkitTextFillColor: theme.palette.text.primary,
                    caretColor: theme.palette.text.primary,
                    transition: 'background-color 9999s ease-out 0s',
                  },
                }}
              />

              {liveUsernameState === 'invalid' && liveUsernameNote ? (
                <Box
                  {...nodeAttrs('identity-note', 'Cleaker.IdentityNote')}
                  sx={{ fontSize: '10px', lineHeight: 1.1, color: theme.palette.error.main, userSelect: 'none', px: 0.25 }}
                >
                  {liveUsernameNote}
                </Box>
              ) : null}

              {showLoginView && !registerOpen ? (
                <TextField
                  {...nodeAttrs('password', 'Cleaker.PasswordField')}
                  label="Password"
                  type={showSecret ? 'text' : 'password'}
                  variant="outlined"
                  size="small"
                  autoComplete="current-password"
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  fullWidth
                  slotProps={{
                    htmlInput: { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false },
                    input: {
                      endAdornment: (
                        <Button
                          {...nodeAttrs('password-visibility-toggle', 'Cleaker.PasswordVisibilityToggle')}
                          variant="text"
                          size="small"
                          onClick={() => setShowSecret((v) => !v)}
                          sx={{
                            minWidth: '32px',
                            p: 0,
                            mr: '-6px',
                            color: secret ? theme.palette.text.secondary : theme.palette.divider,
                            '&:hover': { backgroundColor: themedUi.ghostHover },
                          }}
                          aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                        >
                          <Icon name={showSecret ? 'visibility_off' : 'visibility'} fontSize={18} fill={showSecret ? 1 : 0} />
                        </Button>
                      ),
                    },
                  }}
                  sx={{
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                      WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset`,
                      WebkitTextFillColor: theme.palette.text.primary,
                      caretColor: theme.palette.text.primary,
                      transition: 'background-color 9999s ease-out 0s',
                    },
                  }}
                />
              ) : null}
            </Box>
          </Box>

          <IconButton
            {...nodeAttrs('settings-toggle', 'Cleaker.SettingsToggle')}
            size="small"
            onClick={() => setKernelViewMode(settingsOpen ? 'login' : 'settings')}
            aria-label={settingsOpen ? 'Close Cleaker settings' : 'Open Cleaker settings'}
            sx={{
              mt: -0.25,
              mr: -0.5,
              color: settingsOpen ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: settingsOpen ? themedUi.activeIcon : 'transparent',
              alignSelf: 'flex-start',
              '&:hover': { backgroundColor: themedUi.ghostHover },
            }}
          >
            <Icon name="settings" fontSize={18 as any} />
          </IconButton>
        </Box>
      ) : null}

      {claimResolutionNote ? (
        <Box
          {...nodeAttrs('claim-note', 'Cleaker.ClaimState')}
          sx={{ fontSize: '11px', lineHeight: 1.4, color: theme.palette.text.secondary, px: 0.75, mt: 1 }}
        >
          {claimResolutionNote}
        </Box>
      ) : null}

      {settingsOpen ? (
        <Box
          {...nodeAttrs('settings-panel', 'Cleaker.SettingsPanel')}
          sx={{
            mt: 1,
            mb: 1,
            px: 0.75,
            py: 1,
            borderRadius: '10px',
            border: `1px solid ${themedUi.panelBorder}`,
            background: themedUi.panelBackground,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <TextField
            {...nodeAttrs('settings-namespace', 'Cleaker.SettingsNamespace')}
            label="Namespace"
            size="small"
            value={namespaceInput}
            onChange={(event) => setNamespaceInput(event.target.value)}
            onBlur={() => {
              const next = String(namespaceInput || '').trim() || defaultNamespaceExpression;
              setNamespaceInput(next);
            }}
            fullWidth
          />

          <Box
            {...nodeAttrs('settings-preview', 'Cleaker.NamespacePreview')}
            sx={{
              mt: 0.25,
              pt: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.25,
              alignItems: 'start',
            }}
          >
            <Box
              {...nodeAttrs('settings-preview-qr', 'Cleaker.NamespacePreviewQR')}
              sx={{
                width: 88,
                height: 88,
                borderRadius: '10px',
                overflow: 'hidden',
                border: `1px solid ${themedUi.qrBorder}`,
                background: themedUi.qrBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <QR
                value={previewQrValue}
                size={88}
                fg={theme.palette.primary.main}
                ecc="H"
                embedMode="positive-overlay"
                embedScale={0.32}
              />
            </Box>

            <Box
              {...nodeAttrs('settings-preview-meta', 'Cleaker.NamespacePreviewMeta')}
              sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: '1 1 190px', minWidth: 0 }}
            >
              <Box
                title={`Expression: ${namespaceConfigExpression} · local=${localNamespaceUrl || '—'} · network=${networkNamespaceUrl || '—'} · node=${resolverDisplayName || '—'}`}
                sx={{ fontSize: '11px', lineHeight: 1.4, color: theme.palette.text.secondary }}
              >
                monad.ai:{' '}
                <Box component="span" sx={{ color: theme.palette.text.primary, fontFamily: 'monospace', minWidth: 0, overflowWrap: 'anywhere' }}>
                  {compactMonadLabel}
                </Box>
              </Box>

              <Box sx={{ fontSize: '11px', lineHeight: 1.35, color: theme.palette.text.secondary }}>
                Namespace:{' '}
                <Box component="span" sx={{ color: theme.palette.text.primary, fontFamily: 'monospace', minWidth: 0, overflowWrap: 'anywhere' }}>
                  {compactRootLabel}
                </Box>
              </Box>

              <Box sx={{ fontSize: '11px', lineHeight: 1.35, color: theme.palette.text.secondary }}>
                Root Hash:{' '}
                <Box component="span" sx={{ color: theme.palette.text.primary, fontFamily: 'monospace', minWidth: 0, overflowWrap: 'anywhere' }}>
                  {maskHash(globalNamespaceRootHash)}
                </Box>
              </Box>
            </Box>
          </Box>

          <GeneratePairingQR
            namespace={runtimeAuthenticated ? (activeIdentityNamespace || identityNamespace) : ''}
            origin={activeNamespaceUrl || namespaceOrigin}
            hostSurface={hostSurfaceId}
            rootName={effectiveSemanticRootName}
          />
        </Box>
      ) : null}

      <Box
        {...nodeAttrs('controls', 'Cleaker.Controls')}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1.25, width: '100%', px: 0.5 }}
      >
        {showProfileView ? (
          <Stack spacing={1}>
            <Box {...nodeAttrs('profile-card', 'Cleaker.ProfileCard')} sx={{ minWidth: 0, width: '100%' }}>
              {renderProfileCard()}
            </Box>
            <Box
              {...nodeAttrs('profile-actions', 'Cleaker.ProfileActions')}
              sx={{ display: 'flex', width: '100%', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', pt: 0.1 }}
            >
              <Button
                variant="text"
                size="small"
                onClick={handleLogout}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 'unset',
                  fontSize: '0.78rem',
                  letterSpacing: 0.1,
                  px: 0.75,
                  py: 0.25,
                  color: theme.palette.text.secondary,
                  '&:hover': { backgroundColor: themedUi.ghostHover, color: theme.palette.text.primary },
                }}
              >
                Logout
              </Button>
            </Box>
          </Stack>
        ) : showClaimSurfaceView ? (
          <ClaimSurface
            expression={pairingExpression}
            onCancel={() => {
              clearPairingState();
              setKernelViewMode(runtimeAuthenticated ? 'profile' : 'login');
            }}
            onClaimed={() => {
              clearPairingState();
              setKernelViewMode(runtimeAuthenticated ? 'profile' : 'login');
            }}
          />
        ) : showLoginView ? (
          registerOpen ? (
            /* ── Inline sign-up form ── */
            <Box
              {...nodeAttrs('register-form', 'Cleaker.RegisterForm')}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}
            >
              <TextField
                {...nodeAttrs('register-username', 'Cleaker.RegisterUsername')}
                label="Username"
                helperText={namespaceSeedHandle
                  ? `Handle only. Example: jabellae, not jabellae.${namespaceSeedHandle}`
                  : 'Handle only. Example: jabellae'}
                placeholder="jabellae"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                size="small"
                fullWidth
              />
              <TextField
                {...nodeAttrs('register-full-name', 'Cleaker.RegisterFullName')}
                label="Full Name"
                placeholder="Sui Abella"
                helperText="Your full name as it will appear in the profile."
                value={registerFullName}
                onChange={(e) => setRegisterFullName(e.target.value)}
                autoComplete="name"
                size="small"
                fullWidth
              />
              <TextField
                {...nodeAttrs('register-email', 'Cleaker.RegisterEmail')}
                label="Email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                autoComplete="email"
                size="small"
                fullWidth
              />
              <TextField
                {...nodeAttrs('register-phone', 'Cleaker.RegisterPhone')}
                label="Phone"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                autoComplete="tel"
                size="small"
                fullWidth
              />
              <TextField
                {...nodeAttrs('register-password', 'Cleaker.RegisterPassword')}
                label="Password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                autoComplete="new-password"
                size="small"
                fullWidth
              />
              <TextField
                {...nodeAttrs('register-confirm-password', 'Cleaker.RegisterConfirmPassword')}
                label="Confirm Password"
                type="password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                autoComplete="new-password"
                size="small"
                fullWidth
              />
              {registerError ? (
                <Box
                  {...nodeAttrs('register-error', 'Cleaker.RegisterError')}
                  sx={{ fontSize: '11px', lineHeight: 1.35, color: theme.palette.error.main }}
                >
                  {registerError}
                </Box>
              ) : null}
              <Box
                {...nodeAttrs('register-actions', 'Cleaker.RegisterActions')}
                sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75, pt: 0.25 }}
              >
                <Button
                  variant="text"
                  size="small"
                  onClick={closeRegisterModal}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.78rem',
                    color: theme.palette.text.secondary,
                    '&:hover': { backgroundColor: themedUi.ghostHover },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => void handleRegisterSubmit()}
                  disabled={authStatus === 'checking'}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderWidth: 2,
                    background: themedUi.subtleSurface,
                    borderColor: themedUi.panelBorder,
                    color: theme.palette.text.primary,
                    '&:hover': { background: themedUi.ghostHover, borderColor: theme.palette.primary.main },
                  }}
                >
                  {authStatus === 'checking' ? 'Claiming…' : 'Sign Up'}
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Box
                {...nodeAttrs('actions', 'Cleaker.Actions')}
                sx={{ display: 'flex', width: '100%', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end' }}
              >
                <Button
                  {...nodeAttrs('action-register', 'Cleaker.RegisterAction')}
                  variant="text"
                  size="small"
                  onClick={openRegisterModal}
                  aria-label="Sign Up"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: 'unset',
                    fontSize: '0.78rem',
                    letterSpacing: 0.1,
                    px: 0.75,
                    py: 0.25,
                    color: theme.palette.text.secondary,
                    opacity: 0.8,
                    '&:hover': { background: 'transparent', color: theme.palette.text.primary, opacity: 1 },
                  }}
                >
                  Sign Up
                </Button>

                <Button
                  {...nodeAttrs('action-login', 'Cleaker.PrimaryAction')}
                  variant="outlined"
                  size="small"
                  onClick={handleOpenLogin}
                  aria-label="Login"
                  disabled={isActionDisabled}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: '96px',
                    fontSize: '0.9rem',
                    letterSpacing: 0.3,
                    padding: '6px 14px',
                    borderWidth: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    background: themedUi.subtleSurface,
                    color: theme.palette.text.primary,
                    borderColor: themedUi.panelBorder,
                    '&:hover': { background: themedUi.ghostHover, borderColor: theme.palette.primary.main },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6 }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1.4L10.5 9.2H1.5L6 1.4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                    <span>.me</span>
                  </Box>
                </Button>
              </Box>

              {authStatus === 'checking' ? (
                <span {...nodeAttrs('feedback', 'Cleaker.Feedback')} style={{ fontSize: '11px', color: theme.palette.text.secondary, paddingLeft: 2 }}>
                  {authProgressMessage}
                </span>
              ) : null}
              {authStatus === 'error' && authError ? (
                <span {...nodeAttrs('feedback', 'Cleaker.Feedback')} style={{ fontSize: '11px', color: theme.palette.error.main, paddingLeft: 2 }}>
                  {authError}
                </span>
              ) : null}
              {authStatus === 'ok' ? (
                <span {...nodeAttrs('feedback', 'Cleaker.Feedback')} style={{ fontSize: '11px', color: theme.palette.success.main, paddingLeft: 2 }}>
                  {authSuccessMessage}
                </span>
              ) : null}
            </>
          )
        ) : null}
      </Box>

      {pairingLinkError && !showClaimSurfaceView ? (
        <Box
          sx={{
            mt: 1,
            px: 0.9,
            py: 0.75,
            borderRadius: '10px',
            fontSize: '11px',
            lineHeight: 1.45,
            color: theme.palette.error.main,
            backgroundColor: alpha(theme.palette.error.main, 0.08),
            border: `1px solid ${alpha(theme.palette.error.main, 0.16)}`,
          }}
        >
          {pairingLinkError}
        </Box>
      ) : null}
      </Box>
    </>
  );
}
