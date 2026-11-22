import React, { useState } from 'react';
import { Box, Typography } from '@/gui/Atoms';
import { Collapse } from '@/gui/Molecules';
import Icon from '@/gui/Atoms/Icon/Icon';

const VIEWPORT_MARGIN = 12;
const SIDEBAR_RAIL_FLYOUT_Z_INDEX = 1705;

type RightSidebarMenuItem = {
  label?: string;
  icon?: string;
  iconColor?: string;
  onClick?: () => void;
};

type RightSidebarMenuProps = {
  label?: string;
  icon?: string;
  iconColor?: string;
  items?: RightSidebarMenuItem[];
  view?: 'rail' | 'expanded' | 'mobile';
};

const RightSidebarMenu: React.FC<RightSidebarMenuProps> = ({
  label,
  icon,
  iconColor,
  items,
  view,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const [anchorTop, setAnchorTop] = useState<number | null>(null);
  const [tooltipTop, setTooltipTop] = useState<number>(VIEWPORT_MARGIN);
  const isRail = view === 'rail';
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);

  const updateTooltipPosition = React.useCallback(() => {
    if (!isRail || !open || typeof window === 'undefined') return;
    const tooltipHeight = tooltipRef.current?.getBoundingClientRect().height ?? 0;
    const desiredTop = anchorTop ?? VIEWPORT_MARGIN;
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - tooltipHeight - VIEWPORT_MARGIN);
    setTooltipTop(Math.min(Math.max(VIEWPORT_MARGIN, desiredTop), maxTop));
  }, [anchorTop, isRail, open]);

  React.useLayoutEffect(() => {
    updateTooltipPosition();
  }, [updateTooltipPosition]);

  React.useEffect(() => {
    if (!isRail || !open || typeof window === 'undefined') return;
    const handleViewportChange = () => updateTooltipPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isRail, open, updateTooltipPosition]);

  return (
    <Box
      {...rest}
      onMouseEnter={(e) => {
        if (isRail) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setAnchorTop(rect.top);
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (isRail) {
          setOpen(false);
          setAnchorTop(null);
        }
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isRail ? 'center' : 'flex-end',
        p: isRail ? 0.875 : 1.123,
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        borderRadius: 1,
        color: 'text.primary',
        '&:hover': { backgroundColor: 'action.hover' },
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
      }}
      onClick={() => !isRail && setOpen((prev) => !prev)}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          justifyContent: isRail ? 'center' : 'flex-end',
          alignItems: 'center',
          width: isRail ? 'auto' : '100%',
          textAlign: isRail ? 'center' : 'right',
          px: isRail ? 0 : 1.23,
        }}
      >
        {view !== 'rail' && (
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right', minWidth: 0 }}>
            {label}
          </Typography>
        )}
        {!isRail && <Icon name={open ? 'expand_less' : 'expand_more'} />}
        <Icon name={icon ?? ''} iconColor={iconColor} />
      </Box>

      {isRail ? (
        open && (
          <Box
            ref={tooltipRef}
            sx={{
              position: 'fixed',
              right: 'var(--gui-rail-width, 72px)',
              top: tooltipTop,
              backgroundColor: (theme) =>
                theme.palette.background.nav || theme.palette.background.paper || theme.palette.background.default,
              backgroundImage: 'none',
              color: 'text.primary',
              borderRadius: 1,
              boxShadow: 3,
              zIndex: SIDEBAR_RAIL_FLYOUT_Z_INDEX,
              border: '1px solid',
              borderColor: 'divider',
              minWidth: 180,
              maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
              overflowY: 'auto',
              py: 1,
            }}
          >
            {(items ?? []).map((item, idx) => (
              <Box
                key={item.label ?? idx}
                onClick={item.onClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  px: 2,
                  py: 0.75,
                  gap: 1.5,
                  cursor: 'pointer',
                  borderRadius: 1,
                  color: 'text.primary',
                  textAlign: 'right',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Typography variant="body2">{item.label}</Typography>
                <Icon name={item.icon ?? ''} iconColor={item.iconColor} />
              </Box>
            ))}
          </Box>
        )
      ) : (
        <Collapse in={open}>
          {(items ?? []).map((item, idx) => (
            <Box
              key={item.label ?? idx}
              onClick={item.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                px: 2,
                py: 0.75,
                gap: 1.123,
                cursor: 'pointer',
                borderRadius: 1,
                color: 'text.primary',
                textAlign: 'right',
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <Typography variant="body2">{item.label}</Typography>
              <Icon name={item.icon ?? ''} iconColor={item.iconColor} />
            </Box>
          ))}
        </Collapse>
      )}
    </Box>
  );
};

export default RightSidebarMenu;
