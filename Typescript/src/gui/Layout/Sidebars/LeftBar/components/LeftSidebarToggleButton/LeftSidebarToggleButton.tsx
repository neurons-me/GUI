//@/gui/Layouts/ResponsiveUI/Sidebars/LeftSidebar/components/LeftSidebarToggleButton/LeftSidebarToggleButton.tsx
import React from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';

type LeftSidebarToggleButtonProps = {
  expanded: boolean;
  onToggle: () => void;
  /**
   * `inline` (default): a button in the header's flow. `edge`: a small handle on the bar's right border, centred on the
   * header, for a header whose leading cell belongs to the app's brand (the whole rail is only 72px wide, so the brand
   * keeps the cell and the arrow sits on the line between the bar and the page). The header must be `position: relative`.
   */
  placement?: 'inline' | 'edge';
  ['data-gui-node-id']?: string;
  ['data-gui-component']?: string;
};

// The visible handle is 24px; the button around it is 40px so the target is comfortable and a miss lands on it, not
// on the page behind.
const EDGE_TARGET = 40;
const EDGE_HANDLE = 24;

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
          top: '50%',
          right: -EDGE_TARGET / 2,
          transform: 'translateY(-50%)',
          width: EDGE_TARGET,
          height: EDGE_TARGET,
          p: 0,
          zIndex: 2,
          // Only the glyph's disc is drawn; the rest of the target is invisible.
          '& .gui-edge-handle': {
            width: EDGE_HANDLE,
            height: EDGE_HANDLE,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            transition: 'color 120ms ease, border-color 120ms ease',
          },
          '&:hover .gui-edge-handle, &:focus-visible .gui-edge-handle': { color: 'text.primary', borderColor: 'text.secondary' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -4 },
        }}
      >
        <span className="gui-edge-handle">
          <Icon name={expanded ? 'chevron_left' : 'chevron_right'} fontSize="1rem" />
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
