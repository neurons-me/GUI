import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import type { LeftSidebarItemProps } from './LeftSidebarLink.types';
import { useLeftSidebar } from '@/gui-internals/Hooks';
import { Link as RouterLink } from 'react-router-dom';

const SIDEBAR_RAIL_FLYOUT_Z_INDEX = 1705;

const LeftSidebarLink: React.FC<LeftSidebarItemProps> = ({
  label,
  icon,
  iconColor,
  href,
  to,
  active,
  off,
  onClick,
  children,
  view: viewProp,
  ...rest
}) => {
  const { view: contextView } = useLeftSidebar();
  const view = viewProp ?? contextView;
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(children);
  // An icon that is drawn art (the monad orb) rather than a glyph in a line box needs more air above and below it inside
  // the selected outline than a line icon does.
  const roomy = typeof icon === 'string' && /^orb:/i.test(icon);

  const handleClick = () => {
    if (hasChildren) setExpanded((prev) => !prev);
    if (onClick) onClick();
  };

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
      {icon && (
        <Icon name={icon} iconColor={iconColor}/>
      )}
      {view !== 'rail' && <Typography variant="body2">{label}</Typography>}
      {hasChildren && (
        <Icon
          name={expanded ? 'expand_less' : 'expand_more'}
          iconColor={iconColor}
        />
      )}
    </Box>
  );

  return (
    <Box
      component={to ? (RouterLink as any) : href ? 'a' : 'div'}
      {...(to ? ({ to } as any) : {})}
      {...(!to && href ? ({ href } as any) : {})}
      {...rest}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: view === 'rail' ? 'center' : 'flex-start',
        p: 1.123,
        ...(roomy ? { py: 1.75 } : {}),
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: active ? 'primary.main' : 'transparent',
        color: active ? 'primary.main' : 'text.primary',
        // `off`: what this link leads to has nothing behind it right now. Dimmed, still a link: the page it
        // opens says what is missing.
        opacity: off ? 0.45 : 1,
        cursor: 'pointer',
        borderRadius: 1,
        textDecoration: 'none',
        width: '100%',
        '&:hover': {
          backgroundColor: 'action.hover',
          textDecoration: 'none',
        },
        position: 'relative',
      }}
      onClick={(e: any) => {
        if (hasChildren) {
          e.preventDefault();
        }
        handleClick();
      }}
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
      {hasChildren && (
        <>
          {expanded && view !== 'rail' && (
            <Box sx={{ pl: 2, pt: 0.5 }}>
              {React.Children.toArray(children).map((child) =>
                React.isValidElement(child) ? child : null
              )}
            </Box>
          )}
          {expanded && view === 'rail' && (
            <Box
              sx={{
                position: 'absolute',
                left: '100%',
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
        </>
      )}
    </Box>
  );
};

export default LeftSidebarLink;
