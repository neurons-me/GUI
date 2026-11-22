import React from 'react';
import clsx from 'clsx';
import { Box, Typography, Tooltip } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import type { RightBarView } from '../../RightBar.types';

const SIDEBAR_RAIL_FLYOUT_Z_INDEX = 1705;

export type RightSidebarActionProps = {
  label?: string;
  icon?: string;
  iconColor?: string;
  onClick?: () => void;
  element?: React.ReactNode;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
  view: RightBarView;
};

const RightSidebarAction: React.FC<RightSidebarActionProps> = ({
  label,
  icon,
  iconColor,
  onClick,
  element,
  active = false,
  className,
  style,
  view,
  ...rest
}) => {
  const hasCustomElement = Boolean(element);
  const content = hasCustomElement ? (
    <Box
      sx={{
        display: 'flex',
        justifyContent: view === 'rail' ? 'center' : 'flex-end',
        alignItems: 'center',
        width: view === 'rail' ? 'auto' : '100%',
        px: view === 'rail' ? 0 : 1.23,
      }}
    >
      {element}
    </Box>
  ) : (
    <Box
      sx={{
        display: 'flex',
        gap: 1.123,
        justifyContent: view === 'rail' ? 'center' : 'flex-end',
        alignItems: 'center',
        width: view === 'rail' ? 'auto' : '100%',
        textAlign: view === 'rail' ? 'center' : 'right',
        px: view === 'rail' ? 0 : 1.23,
      }}
    >
      {view !== 'rail' && (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'right',
            minWidth: 0,
            color: active ? 'primary.main' : 'text.primary',
          }}
        >
          {label}
        </Typography>
      )}
      <Icon name={icon ?? ''} iconColor={iconColor || (active ? 'primary.main' : undefined)} />
    </Box>
  );

  const maybeWrappedContent =
    view === 'rail' && label ? (
      <Tooltip
        title={label}
        placement="left"
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
    );

  return (
    <Box
      component={hasCustomElement ? 'div' : 'button'}
      onClick={onClick}
      {...rest}
      className={clsx('RightSidebarAction', className)}
      style={style}
      sx={{
        p: view === 'rail' ? 0.875 : 1.123,
        display: 'flex',
        flexDirection: 'column',
        alignItems: view === 'rail' ? 'center' : 'flex-end',
        boxSizing: 'border-box',
        borderRight: 2,
        borderRightColor: active ? 'primary.main' : 'transparent',
        borderRightStyle: 'solid',
        backgroundColor: active ? 'action.selected' : 'transparent',
        '&:hover': {
          backgroundColor: 'action.hover',
          borderRightColor: 'primary.main',
        },
        color: active ? 'primary.main' : 'text.primary',
        cursor: hasCustomElement && !onClick ? 'default' : 'pointer',
        width: '100%',
        maxWidth: '100%',
        textAlign: view === 'rail' ? 'center' : 'right',
        outline: 'none',
        border: 'none',
      }}
      aria-pressed={hasCustomElement ? undefined : active}
      type={hasCustomElement ? undefined : 'button'}
    >
      {maybeWrappedContent}
    </Box>
  );
};

export default RightSidebarAction;
