import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useRightSidebar } from '@/gui-internals/Hooks';

const SIDEBAR_RAIL_FLYOUT_Z_INDEX = 1705;

type RightSidebarLinkProps = {
  label?: string;
  icon?: string;
  iconColor?: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

const RightSidebarLink: React.FC<RightSidebarLinkProps> = ({
  label,
  icon,
  iconColor,
  active,
  onClick,
  children,
  ...rest
}) => {
  const { view } = useRightSidebar();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(children);

  const handleClick = () => {
    if (hasChildren) setExpanded((prev) => !prev);
    onClick?.();
  };

  // Expanded: label then icon, packed to the outer (right) edge.
  // Rail: the icon is centred in the column, aligned with the brand / QR in the head,
  // the same way the left bar centres its rail icons.
  const content = (
    <Box
      {...rest}
      sx={{
        display: 'flex',
        gap: 1.123,
        justifyContent: view === 'rail' ? 'center' : 'flex-end',
        alignItems: 'center',
        width: view === 'rail' ? 'auto' : '100%',
        textAlign: view === 'rail' ? 'center' : 'right',
        px: view === 'rail' ? 0 : 1.23,
        color: active ? 'primary.main' : 'text.primary',
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
      {hasChildren && view !== 'rail' && (
        <Icon name={expanded ? 'expand_less' : 'expand_more'} />
      )}
      {icon && <Icon name={icon} iconColor={iconColor || (active ? 'primary.main' : undefined)} />}
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: view === 'rail' ? 'center' : 'flex-end',
        p: view === 'rail' ? 0.875 : 1.123,
        boxSizing: 'border-box',
        backgroundColor: active ? 'action.selected' : 'transparent',
        borderRight: 2,
        borderRightStyle: 'solid',
        borderRightColor: active ? 'primary.main' : 'transparent',
        cursor: 'pointer',
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'action.hover',
          borderRightColor: 'primary.main',
        },
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
      }}
      onClick={handleClick}
    >
      {view === 'rail' ? (
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
      )}
      {hasChildren && expanded && view !== 'rail' && (
        <Box sx={{ pr: 2, pt: 0.5 }}>
          {React.Children.toArray(children).map((child) =>
            React.isValidElement(child) ? child : null
          )}
        </Box>
      )}
      {hasChildren && expanded && view === 'rail' && (
        <Box
          sx={{
            position: 'absolute',
            right: '100%',
            top: 0,
            backgroundColor: (theme) =>
              theme.palette.background.nav || theme.palette.background.paper,
            backgroundImage: 'none',
            boxShadow: 3,
            borderRadius: 1,
            mt: -1,
            zIndex: SIDEBAR_RAIL_FLYOUT_Z_INDEX,
            p: 1,
            minWidth: 180,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {React.Children.toArray(children).map((child) =>
            React.isValidElement(child) ? child : null
          )}
        </Box>
      )}
    </Box>
  );
};

export default RightSidebarLink;
