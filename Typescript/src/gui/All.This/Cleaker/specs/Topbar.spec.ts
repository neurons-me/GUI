import type { GuiSpecNode } from '@/types/gui.types';

export type TopbarSpecOptions = {
  rootNodeId?: string;
  usernamePath?: string;
  avatarPath?: string;
  namespacePath?: string;
  claimPath?: string;
  viewModePath?: string;
  profileAction?: string | null;
  settingsAction?: string | null;
  logoutAction?: string | null;
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

export function createTopbarSpec(options: TopbarSpecOptions = {}): GuiSpecNode {
  const rootNodeId = options.rootNodeId ?? 'Cleaker.Topbar';
  const usernamePath = normalizeMePath(options.usernamePath ?? 'username');
  const avatarPath = normalizeMePath(options.avatarPath ?? 'avatar');
  const namespacePath = normalizeMePath(options.namespacePath ?? 'identity.session.namespace');
  const claimPath = normalizeMePath(options.claimPath ?? 'auth.claimed_at');
  const viewModePath = options.viewModePath ?? 'ui.cleaker.viewMode';
  const profileAction = options.profileAction ?? stringAssignment(viewModePath, 'profile');
  const settingsAction = options.settingsAction ?? stringAssignment(viewModePath, 'settings');
  const actions: GuiSpecNode[] = [];

  if (profileAction) {
    actions.push({
      type: 'Button',
      props: {
        variant: 'text',
        size: 'small',
        sx: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          minWidth: 'unset',
          px: 1.1,
          py: 0.45,
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
          minWidth: 'unset',
          px: 1.1,
          py: 0.45,
        },
        onClick: { write: settingsAction },
      },
      children: 'Settings',
    });
  }

  if (options.logoutAction) {
    actions.push({
      type: 'Button',
      props: {
        variant: 'outlined',
        size: 'small',
        color: 'inherit',
        sx: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          minWidth: 'unset',
          px: 1.1,
          py: 0.45,
        },
        onClick: { write: options.logoutAction },
      },
      children: 'Logout',
    });
  }

  return {
    type: 'Paper',
    props: {
      variant: 'outlined',
      'data-gui-node-id': rootNodeId,
      'data-gui-component': 'Cleaker.TopbarSpec',
      sx: (theme: any) => ({
        px: 1.1,
        py: 0.95,
        borderRadius: 2.5,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        backgroundImage: `linear-gradient(180deg, ${theme.palette.section?.subtle || theme.palette.background.paper} 0%, ${theme.palette.background.paper} 100%)`,
      }),
    },
    provenance: {
      source: 'Cleaker.Topbar.spec',
      semanticPath: claimPath,
      note: 'Compact theme-aware identity topbar bound to canonical profile data and active session namespace.',
    },
    children: {
      type: 'Stack',
      props: {
        spacing: 0.9,
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
                'data-gui-node-id': `${rootNodeId}:face`,
                'data-gui-component': 'QR.me',
              },
            },
            {
              type: 'Stack',
              props: {
                spacing: 0.1,
                sx: {
                  minWidth: 0,
                  flex: 1,
                },
                'data-gui-node-id': `${rootNodeId}:identity`,
                'data-gui-component': 'Cleaker.TopbarSpec.Identity',
              },
              children: [
                {
                  type: 'Typography',
                  props: {
                    variant: 'body2',
                    sx: {
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      overflowWrap: 'anywhere',
                    },
                    children: ['@', { read: usernamePath }],
                  },
                },
                {
                  type: 'Typography',
                  props: {
                    variant: 'caption',
                    color: 'text.secondary',
                    sx: {
                      overflowWrap: 'anywhere',
                      lineHeight: 1.35,
                    },
                    children: { read: namespacePath },
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
                  px: 1,
                  py: 0.42,
                  borderRadius: 999,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  bgcolor: theme.palette.success.main,
                  color: theme.palette.getContrastText(theme.palette.success.main),
                }),
                children: 'Verified',
              },
            },
          ],
        },
        ...(actions.length > 0
          ? [
              {
                type: 'Stack',
                props: {
                  direction: 'row',
                  spacing: 0.75,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  'data-gui-node-id': `${rootNodeId}:actions`,
                  'data-gui-component': 'Cleaker.TopbarSpec.Actions',
                },
                children: actions,
              } satisfies GuiSpecNode,
            ]
          : []),
      ],
    },
  };
}

export default createTopbarSpec;
