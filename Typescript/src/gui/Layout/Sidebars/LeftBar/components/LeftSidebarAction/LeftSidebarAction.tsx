import React from 'react';
import clsx from 'clsx';
import { Box, Typography, Tooltip } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import type { LeftSidebarMode } from '../../LeftBar.types';
import { useLeftSidebar } from '@/gui-internals/Hooks';
import resolveLeftSidebarAction from './LeftSidebarAction.resolver';

const SIDEBAR_RAIL_FLYOUT_Z_INDEX = 1705;

export type LeftSidebarActionProps = {
  label?: string;
  icon?: string;
  iconColor?: string;
  onClick?: () => void;
  action?: string | (() => any);
  element?: React.ReactNode;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
  resolver?: string; // legacy global action name; inline JS execution is disabled for CSP safety
  view: LeftSidebarMode; // added line
  /** Set false for a custom `element` that already opens its own floating
   * panel on hover (ThemeLauncher/MeLauncher/DevToolsLauncher-shaped
   * launchers) — otherwise this rail's own label Tooltip anchors to the
   * same icon and collides with the element's own popper. Defaults to
   * true, matching the plain icon+label rail button's existing tooltip. */
  tooltip?: boolean;
};

const LeftSidebarAction: React.FC<LeftSidebarActionProps> = ({
  label,
  icon,
  iconColor,
  onClick,
  action,
  element,
  active = false,
  className,
  style,
  resolver,
  view,
  tooltip = true,
  ...rest
}) => {
  const legacyResolver = typeof resolver === 'string' ? resolver.trim() : '';
  const handleClick =
    onClick ||
    (typeof action !== 'undefined'
      ? () => {
          resolveLeftSidebarAction({ action });
        }
      : legacyResolver
        ? () => {
            console.warn(
              '[LeftSidebarAction] `resolver` string execution is disabled. Use `action` with a global function name or pass `onClick`.'
            );
            resolveLeftSidebarAction({ action: legacyResolver });
          }
        : undefined);

  const content = (
    <Box
      sx={{
        display: 'flex',
        gap: 1.123,
        justifyContent: view === 'rail' ? 'center' : 'flex-start',
        alignItems: 'center',
        width: view === 'rail' ? 'auto' : '100%',
        textAlign: view === 'rail' ? 'center' : 'left',
        px: view === 'rail' ? 0 : 1.23,
      }}
    >
      <Icon name={icon || ''} iconColor={iconColor || (active ? 'primary.main' : 'text.secondary')} />
      {view !== 'rail' && (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: active ? 'primary.main' : 'text.primary',
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );

  if (element) {
    const elementContent = (
      <Box
        sx={{
          display: 'flex',
          gap: 1.123,
          justifyContent: view === 'rail' ? 'center' : 'flex-start',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: view === 'rail' ? 'center' : 'left',
          px: view === 'rail' ? 0 : 0,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minWidth: 0,
            flex: view === 'rail' ? '0 0 auto' : '1 1 auto',
          }}
        >
          {element}
        </Box>
        {/* No `label` next to a custom element: the element names itself (the theme launcher says the theme, the dev
            tools launcher says "Dev Tools"); printing the label too squeezed a second, truncated name beside it
            ("neurons.me  Th…"). The label stays the item's name for the Inspector (data-gui-label, LeftBar.tsx). */}
      </Box>
    );

    // `tooltip={false}` is required for a custom `element` that already
    // opens its own floating panel on hover (ThemeLauncher/MeLauncher/
    // DevToolsLauncher-shaped launchers) — wrapping it in a second,
    // independent Tooltip anchored to the same icon produces two floating
    // panels racing for the same hover, each positioned without knowledge
    // of the other (visibly colliding/overlapping once the element's own
    // popper opens). Those launchers' own poppers already name themselves
    // (see each one's panel header), so opting out loses nothing there.
    const wrappedContent =
      view === 'rail' && label && tooltip ? (
        <Tooltip title={label} placement="right" arrow>
          {elementContent}
        </Tooltip>
      ) : (
        elementContent
      );

    return (
      <Box
        {...rest}
        className={clsx('LeftSidebarAction', className)}
        style={style}
        sx={{
          p: view === 'rail' ? 0.5 : 1.123,
          display: 'flex',
          justifyContent: view === 'rail' ? 'center' : 'flex-start',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'visible',
          textAlign: view === 'rail' ? 'center' : 'left',
        }}
      >
        {wrappedContent}
      </Box>
    );
  }

  return (
    <Box
      component="button"
      onClick={handleClick}
      {...rest}
      className={clsx('LeftSidebarAction', className)}
      style={style}
      sx={{
        p: 1.123,
        display: 'flex',
        flexDirection: 'column',
        alignItems: view === 'rail' ? 'center' : 'flex-start',
        borderLeft: 2,
        borderLeftColor: active ? 'primary.main' : 'transparent',
        borderLeftStyle: 'solid',
        cursor: 'pointer',
        backgroundColor: active ? 'action.selected' : 'transparent',
        '&:hover': {
          backgroundColor: 'action.hover',
          borderLeftColor: 'primary.main',
        },
        color: active ? 'primary.main' : 'text.primary',
        width: '100%',
        textAlign: view === 'rail' ? 'center' : 'left',
        outline: 'none',
        border: 'none',
      }}
      aria-pressed={active}
      type="button"
    >
      {view === 'rail' ? (
        <Tooltip
          title={label}
          placement="right"
          arrow
          slotProps={{
            popper: {
              sx: {
                zIndex: SIDEBAR_RAIL_FLYOUT_Z_INDEX,
                '& .MuiTooltip-tooltip': {
                  backgroundColor: 'var(--gui-bg-nav) !important',
                  backgroundImage: 'none !important',
                  color: 'var(--gui-text-primary) !important',
                  border: '1px solid var(--gui-border)',
                  boxShadow: 3,
                },
                '& .MuiTooltip-arrow': {
                  color: 'var(--gui-bg-nav) !important',
                },
              },
            },
            tooltip: {
              sx: {
                fontSize: '0.9rem',
                py: 0.5,
                px: 1,
                bgcolor: 'var(--gui-bg-nav)',
                color: 'var(--gui-text-primary)',
                border: '1px solid',
                borderColor: 'var(--gui-border)',
                backgroundImage: 'none',
              },
            },
            arrow: { sx: { color: 'var(--gui-bg-nav)' } },
          }}
        >
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </Box>
  );
};

export default LeftSidebarAction;
