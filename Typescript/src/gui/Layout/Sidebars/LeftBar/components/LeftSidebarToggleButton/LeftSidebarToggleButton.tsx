//@/gui/Layouts/ResponsiveUI/Sidebars/LeftSidebar/components/LeftSidebarToggleButton/LeftSidebarToggleButton.tsx
import React from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';

type LeftSidebarToggleButtonProps = {
  expanded: boolean;
  onToggle: () => void;
  /**
   * `inline` (default): a button in the header's flow. `edge`: a tall tab on the bar's right border, centred on the
   * header, for a header whose leading cell belongs to the app's brand (the whole rail is only 72px wide, so the brand
   * keeps the cell and the arrow sits on the line between the bar and the page). The header must be `position: relative`.
   */
  placement?: 'inline' | 'edge';
  ['data-gui-node-id']?: string;
  ['data-gui-component']?: string;
};

// The handle is a tall tab, not a disc: a control used this often is easier to hit by height than by width, and the bar's
// border is a vertical line. It is 19px wide (the 24px disc it replaces, 21% narrower) and nearly as tall as the header,
// inside a target 36px wide and the header's full height, so a miss lands on it and not on the page behind.
const EDGE_TARGET_WIDTH = 36;
const EDGE_HANDLE_WIDTH = 19;
const EDGE_HANDLE_MAX_HEIGHT = 44;

const LeftSidebarToggleButton: React.FC<LeftSidebarToggleButtonProps> = ({
  expanded,
  onToggle,
  placement = 'inline',
  ['data-gui-node-id']: dataGuiNodeId,
  ['data-gui-component']: dataGuiComponent,
}) => {
  if (placement === 'edge') {
    return (
      <IconButton
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={expanded}
        onClick={onToggle}
        data-gui-node-id={dataGuiNodeId}
        data-gui-component={dataGuiComponent}
        disableRipple
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: -EDGE_TARGET_WIDTH / 2,
          width: EDGE_TARGET_WIDTH,
          p: 0,
          zIndex: 2,
          borderRadius: 0,
          '&:focus-visible': { outline: 'none' },
          // Only the tab is drawn; the rest of the target is invisible.
          '& .gui-edge-handle': {
            width: EDGE_HANDLE_WIDTH,
            height: 'calc(100% - 8px)',
            maxHeight: EDGE_HANDLE_MAX_HEIGHT,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            transition: 'color 120ms ease, border-color 120ms ease, background-color 120ms ease',
          },
          '&:hover .gui-edge-handle, &:focus-visible .gui-edge-handle': { color: 'text.primary', borderColor: 'text.secondary' },
          '&:hover .gui-edge-handle': { bgcolor: 'action.hover' },
          '&:focus-visible .gui-edge-handle': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
        }}
      >
        <span className="gui-edge-handle">
          <Icon name={expanded ? 'chevron_left' : 'chevron_right'} fontSize="0.95rem" />
        </span>
      </IconButton>
    );
  }
  return (
    <IconButton
      aria-label="Toggle Sidebar"
      onClick={onToggle}
      data-gui-node-id={dataGuiNodeId}
      data-gui-component={dataGuiComponent}
      sx={{ margin: 1 }}
    >
      <Icon name={expanded ? 'chevron_left' : 'chevron_right'} />
    </IconButton>
  );
};

export default LeftSidebarToggleButton;
