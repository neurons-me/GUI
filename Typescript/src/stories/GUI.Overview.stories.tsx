import { useMemo, useState } from 'react';
import ME from 'this.me';

import Theme from '@/gui/Theme/Theme';
import ThemesCatalog from '@/gui/Theme/Catalog/Catalog';
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';
import QRme from '@/gui/All.This/me/QR/QR.me';
import {
  SESSION_CREDENTIALS_EVENT,
  SESSION_SECRET_STORAGE_KEY,
  SESSION_USERNAME_STORAGE_KEY,
} from '@/gui/All.This/Cleaker/runtimeUsername';
import { Me } from '@/react/Me';
import { useMe } from '@/react/useMe';
import { useMeAction } from '@/react/useMeAction';
import { useMeValue } from '@/react/useMeValue';
import { writeMeValue } from '@/runtime/run-me';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Typography,
} from '@/gui/Atoms';
import { Stack } from '@/gui/Molecules';
import { useTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react';

type AccentKey = 'aurora' | 'ember' | 'monolith' | 'neutral';

const TopbarIdentity = () => {
  const { me, runtime } = useMe();
  const profileUsername = useMeValue<string>('username') || '';
  const profileAvatar = useMeValue<string>('avatar') || '';
  const claimedAt = useMeValue<number | null>('auth.claimed_at');
  const authenticated = Boolean(useMeValue<boolean>('identity.session.authenticated'));
  const activeIdentityNamespace = useMeValue<string>('identity.session.namespace') || '';
  const namespaceUrl = useMeValue<string>('runtime.cleaker.namespace.activeUrl') || '';
  const previewQrValue = useMeValue<string>('runtime.cleaker.namespace.previewQrValue') || '';
  const hasProfile = Boolean(profileUsername && claimedAt && authenticated && activeIdentityNamespace);
  const displayName = hasProfile ? profileUsername : '';
  const qrValue = hasProfile
    ? previewQrValue || namespaceUrl || activeIdentityNamespace || profileUsername
    : 'login.me';
  const label = hasProfile ? profileUsername : 'login.me';

  const handleLogout = () => {
    const clearKernel = (path: string, value: any) => {
      writeMeValue(me, path, value);
      runtime?.notify?.(path);
    };

    clearKernel('username', null);
    clearKernel('name',     null);
    clearKernel('avatar',   null);
    clearKernel('bio',      null);
    clearKernel('email',    null);
    clearKernel('phone',    null);
    clearKernel('auth.claimed_at', null);
    clearKernel('auth.keys', null);
    clearKernel('identity.session.username', '');
    clearKernel('identity.session.draftUsername', '');
    clearKernel('identity.session.authenticated', false);
    clearKernel('identity.session.identityHash', '');
    clearKernel('identity.session.hasSecret', false);
    clearKernel('identity.session.namespace', '');
    clearKernel('identity.session.openedAt', null);
    clearKernel('identity.session.note', '');
    clearKernel('runtime.cleaker.auth.status', 'idle');
    clearKernel('runtime.cleaker.auth.error', null);
    clearKernel('runtime.cleaker.auth.successMessage', null);
    clearKernel('runtime.cleaker.auth.progressMessage', null);
    clearKernel('runtime.cleaker.auth.claimed', false);
    clearKernel('runtime.cleaker.auth.claimResolution', 'idle');
    clearKernel('ui.cleaker.settingsOpen', false);
    clearKernel('ui.cleaker.registerOpen', false);
    clearKernel('ui.cleaker.avatarExpanded', false);
    clearKernel('ui.cleaker.showSecret', false);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_USERNAME_STORAGE_KEY);
        localStorage.removeItem(SESSION_SECRET_STORAGE_KEY);
        window.dispatchEvent(
          new CustomEvent(SESSION_CREDENTIALS_EVENT, {
            detail: {
              username: '',
              secret: '',
            },
          })
        );
      } catch {
        // Ignore restricted storage environments.
      }
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <QRme
        value={qrValue}
        username={displayName}
        avatarSrc={profileAvatar || undefined}
        variant="topbar"
        defaultFace={hasProfile ? 'avatar' : 'qr'}
        hoverFlip={hasProfile}
        clickFlip={hasProfile}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, opacity: hasProfile ? 0.92 : 0.72 }}>
        {label}
      </Typography>
      {hasProfile ? (
        <Button size="small" variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      ) : null}
    </Stack>
  );
};

const DemoBody = () => {
  const [headline, setHeadline] = useState('React-first UI scaffolding with design primitives ready on day one.');
  const [count, setCount] = useState(3);
  const [accent, setAccent] = useState<AccentKey>('aurora');
  const [showTelemetry, setShowTelemetry] = useState(true);
  const theme = useTheme() as any;
  const setStatus = useMeAction('profile.status', { allowCanonicalWrite: true });

  const themeAccents = theme.visuals?.accents;
  const accentTheme = themeAccents?.[accent] ?? themeAccents?.aurora ?? {
    soft: 'linear-gradient(135deg, rgba(31,81,255,0.16), rgba(43,208,169,0.12))',
    strong: 'linear-gradient(135deg, #1f51ff 0%, #2bd0a9 100%)',
    chip: 'primary',
  };

  const applyPreset = (next: AccentKey) => {
    setAccent(next);
    if (next === 'aurora') {
      setStatus('online');
      setHeadline('React-first UI scaffolding with design primitives ready on day one.');
    } else if (next === 'ember') {
      setStatus('reviewing');
      setHeadline('A warmer landing surface for demos, product pages, and operational dashboards.');
    } else if (next === 'monolith') {
      setStatus('offline');
      setHeadline('A heavier systems aesthetic for internal control rooms and focused workspaces.');
    } else {
      setStatus('idle');
      setHeadline('A flat, shade-free surface — pure structure with no gradient or tint.');
    }
  };

  const themesCatalogPanel = useMemo(
    () => (
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          borderRadius: 2,
          minWidth: 0,
        }}
      >
        <ThemesCatalog compact minimal />
      </Paper>
    ),
    [
      theme.palette.mode,
      theme.palette.primary.main,
      theme.palette.background.default,
      theme.palette.background.paper,
    ]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          minHeight: '100vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.nav',
            flexWrap: 'wrap',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src="/GUI.png" alt=".GUI" sx={{ width: 55, height: 55, fontSize: 14 }} />
            <Box>
              <Typography variant="subtitle2">.GUI</Typography>
              <Typography variant="caption" sx={{ opacity: 0.66 }}>
                App Name
              </Typography>
            </Box>
          </Stack>

          <TopbarIdentity />
        </Box>

        <Box
          component="section"
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 3, md: 4 },
            background: accentTheme.soft,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
                gap: 3,
                alignItems: 'stretch',
              }}
            >
              <Card
                variant="outlined"
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: 'transparent',
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(14px)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: accentTheme.strong,
                    opacity: 0.12,
                    pointerEvents: 'none',
                  }}
                />
                <CardContent sx={{ position: 'relative', p: { xs: 2.5, md: 4 } }}>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography
                        variant="h2"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: '-0.05em',
                          maxWidth: 680,
                          lineHeight: 0.98,
                        }}
                      >
                        Build polished interfaces fast, then shape them into your own visual language.
                      </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ maxWidth: 700, opacity: 0.82 }}>
                      {headline}
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
                      <Button variant="outlined" onClick={() => setCount((current) => current + 1)}>
                        Add Module
                      </Button>
                      <Button variant="text" onClick={() => setShowTelemetry((current) => !current)}>
                        {showTelemetry ? 'Hide Telemetry' : 'Show Telemetry'}
                      </Button>
                    </Stack>

                    <Typography variant="caption" sx={{ opacity: 0.68 }}>
                      Modules queued: {count} · Telemetry {showTelemetry ? 'enabled' : 'muted'}
                    </Typography>

                    <Box sx={{ pt: 0.5 }}>
                      <Me>
                        <Cleaker namespace="cleaker.me" />
                      </Me>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader title="Themes and Styles" subheader="Mood." />
                <CardContent sx={{ p: { xs: 1.5, md: 1.75 } }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '116px minmax(0, 1fr)' },
                      gap: 1.25,
                      alignItems: 'start',
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        minWidth: 0,
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Stack spacing={0.75} sx={{ pt: 0.25 }}>
                          <Button
                            size="small"
                            fullWidth
                            variant={accent === 'aurora' ? 'contained' : 'outlined'}
                            onClick={() => applyPreset('aurora')}
                          >
                            Aurora
                          </Button>
                          <Button
                            size="small"
                            fullWidth
                            variant={accent === 'ember' ? 'contained' : 'outlined'}
                            onClick={() => applyPreset('ember')}
                          >
                            Ember
                          </Button>
                          <Button
                            size="small"
                            fullWidth
                            variant={accent === 'monolith' ? 'contained' : 'outlined'}
                            onClick={() => applyPreset('monolith')}
                          >
                            Monolith
                          </Button>
                          <Button
                            size="small"
                            fullWidth
                            variant={accent === 'neutral' ? 'contained' : 'outlined'}
                            onClick={() => applyPreset('neutral')}
                          >
                            Neutral
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>

                    <Box sx={{ minWidth: 0 }}>{themesCatalogPanel}</Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />
      </Paper>
    </Box>
  );
};

const Demo = () => {
  const me = useMemo(() => {
    const kernel = new ME() as any;
    writeMeValue(kernel, 'profile.status', 'online');
    writeMeValue(kernel, 'username', null);
    writeMeValue(kernel, 'auth.claimed_at', null);
    writeMeValue(kernel, 'identity.session.username', '');
    writeMeValue(kernel, 'identity.session.draftUsername', '');
    writeMeValue(kernel, 'identity.session.namespace', '');
    writeMeValue(kernel, 'identity.session.authenticated', false);
    writeMeValue(kernel, 'identity.session.identityHash', '');
    writeMeValue(kernel, 'identity.session.openedAt', null);
    return kernel;
  }, []);

  return (
    <Theme>
      <Me me={me}>
        <DemoBody />
      </Me>
    </Theme>
  );
};

const Home = () => {
  return <Demo />;
};

const meta = {
  title: 'Getting Started/GUI Overview',
  component: Home,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Home>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => <Home />,
};
