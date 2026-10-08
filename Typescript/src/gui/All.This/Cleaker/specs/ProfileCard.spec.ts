import type { GuiSpecNode } from '@/types/gui.types';

export type ProfileCardSpecOptions = {
  rootNodeId?: string;
  usernamePath?: string;
  namePath?: string;
  emailPath?: string;
  phonePath?: string;
  avatarPath?: string;
  bioPath?: string;
  claimPath?: string;
  namespacePath?: string;
  viewModePath?: string;
  profileAction?: string | null;
  settingsAction?: string | null;
  showIdentityFace?: boolean;
  showActions?: boolean;
};

function normalizeMePath(path: string): string {
  const trimmed = String(path ?? '').trim();
  if (!trimmed) return 'me/';
  if (trimmed.startsWith('me/')) return trimmed;
  return `me/${trimmed.replace(/^\/+|\/+$/g, '').replace(/\./g, '/')}`;
}

function stringAssignment(path: string, value: string): string {
  return `${normalizeMePath(path)} = ${JSON.stringify(value)}`;
}

export function createProfileCardSpec(options: ProfileCardSpecOptions = {}): GuiSpecNode {
  const rootNodeId = options.rootNodeId ?? 'Cleaker.ProfileCard';
  const usernamePath = normalizeMePath(options.usernamePath ?? 'username');
  const namePath = normalizeMePath(options.namePath ?? 'name');
  const emailPath = normalizeMePath(options.emailPath ?? 'email');
  const phonePath = normalizeMePath(options.phonePath ?? 'phone');
  const avatarPath = normalizeMePath(options.avatarPath ?? 'avatar');
  const claimPath = normalizeMePath(options.claimPath ?? 'auth.claimed_at');
  // Show the host seed (e.g. "suis-macbook-air.local") rather than the full
  // namespace ("jabellae.suis-macbook-air.local") which redundantly repeats the username.
  const namespacePath = normalizeMePath(options.namespacePath ?? 'identity.session.namespaceSeed');
  const viewModePath = options.viewModePath ?? 'ui.cleaker.viewMode';
  const profileAction = options.profileAction ?? stringAssignment(viewModePath, 'profile');
  const settingsAction = options.settingsAction ?? stringAssignment(viewModePath, 'settings');
  const showIdentityFace = options.showIdentityFace !== false;
  const showActions = options.showActions !== false;

  const actions: GuiSpecNode[] = [];
  if (profileAction) {
    actions.push({
      type: 'Button',
      props: {
        variant: 'contained',
        size: 'small',
        sx: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          px: 1.35,
          py: 0.55,
          boxShadow: 'none',
        },
        onClick: { write: profileAction },
      },
      children: 'Profile',
    });
  }
  if (settingsAction) {
    actions.push({
      type: 'Button',
      props: {
        variant: 'outlined',
        size: 'small',
        sx: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          px: 1.25,
          py: 0.55,
        },
        onClick: { write: settingsAction },
      },
      children: 'Settings',
    });
  }

  return {
    type: 'Card',
    props: {
      variant: 'outlined',
      'data-gui-node-id': rootNodeId,
      'data-gui-component': 'Cleaker.ProfileCardSpec',
      sx: (theme: any) => ({
        width: '100%',
        borderRadius: 3,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        backgroundImage: `linear-gradient(180deg, ${theme.palette.section?.subtle || theme.palette.background.paper} 0%, ${theme.palette.background.paper} 100%)`,
        boxShadow: theme.shadows[4],
      }),
    },
    provenance: {
      source: 'Cleaker.ProfileCard.spec',
      semanticPath: claimPath,
      note: 'Compact theme-aware identity card bound to canonical profile data and active session namespace.',
    },
    children: [
      {
        type: 'CardContent',
        props: {
          sx: {
            p: 1.5,
          },
        },
        children: {
          type: 'Stack',
          props: {
            spacing: 1.2,
          },
          children: [
            {
              type: 'Stack',
              props: {
                direction: 'row',
                spacing: 1,
                alignItems: 'center',
                minWidth: 0,
              },
              children: [
                ...(showIdentityFace
                  ? [
                      {
                        type: 'QR.me',
                        props: {
                          value: { read: namespacePath },
                          username: { read: usernamePath },
                          avatarSrc: { read: avatarPath },
                          variant: 'topbar',
                          defaultFace: 'avatar',
                          hoverFlip: true,
                          clickFlip: true,
                          'data-gui-node-id': `${rootNodeId}:identity-face`,
                          'data-gui-component': 'QR.me',
                        },
                      } satisfies GuiSpecNode,
                    ]
                  : []),
                {
                  type: 'Stack',
                  props: {
                    spacing: 0.25,
                    sx: {
                      minWidth: 0,
                      flex: 1,
                    },
                    'data-gui-node-id': `${rootNodeId}:summary`,
                    'data-gui-component': 'Cleaker.ProfileCardSpec.Summary',
                  },
                  children: [
                    {
                      type: 'Typography',
                      props: {
                        variant: 'subtitle2',
                        color: 'text.secondary',
                        sx: {
                          fontWeight: 700,
                          lineHeight: 1.1,
                          overflowWrap: 'anywhere',
                        },
                        children: { read: namePath },
                      },
                    },
                    {
                      type: 'Typography',
                      props: {
                        variant: 'h5',
                        sx: {
                          fontWeight: 900,
                          letterSpacing: '-0.04em',
                          lineHeight: 1,
                          overflowWrap: 'anywhere',
                        },
                        children: ['@', { read: usernamePath }],
                      },
                    },
                  ],
                },
                {
                  type: 'Typography',
                  props: {
                    variant: 'caption',
                    sx: (theme: any) => ({
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      px: 0.9,
                      py: 0.38,
                      borderRadius: 999,
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      bgcolor: theme.palette.success.main,
                      color: theme.palette.getContrastText(theme.palette.success.main),
                    }),
                    children: 'Verified',
                  },
                },
              ],
            },
            {
              type: 'Stack',
              props: {
                spacing: 0.2,
                sx: {
                  minWidth: 0,
                },
                'data-gui-node-id': `${rootNodeId}:contact`,
                'data-gui-component': 'Cleaker.ProfileCardSpec.Contact',
              },
              children: [
                {
                  type: 'Typography',
                  props: {
                    variant: 'caption',
                    color: 'text.secondary',
                    sx: {
                      overflowWrap: 'anywhere',
                    },
                    children: { read: emailPath },
                  },
                },
                {
                  type: 'Typography',
                  props: {
                    variant: 'caption',
                    color: 'text.secondary',
                    sx: {
                      overflowWrap: 'anywhere',
                    },
                    children: { read: phonePath },
                  },
                },
              ],
            },
            ...(showActions && actions.length > 0
              ? [
                  {
                    type: 'Stack',
                    props: {
                      direction: 'row',
                      spacing: 1,
                      flexWrap: 'wrap',
                      'data-gui-node-id': `${rootNodeId}:actions`,
                      'data-gui-component': 'Cleaker.ProfileCardSpec.Actions',
                    },
                    children: actions,
                  } satisfies GuiSpecNode,
                ]
              : []),
          ],
        },
      },
    ],
  };
}

export default createProfileCardSpec;
