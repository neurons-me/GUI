//@/gui/Layouts/ResponsiveUI/Sidebars/LeftSidebar/components/LeftSidebarToggleButton/LeftSidebarToggleButton.tsx
import React from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';

type LeftSidebarToggleButtonProps = {
  expanded: boolean;
  onToggle: () => void;
  /**
   * `inline` (default): a button in the header's flow. `edge`: a tall tab inside the bar's right border, centred on the
   * header, for a header whose leading cell belongs to the app's brand (the whole rail is only 72px wide, so the brand
   * keeps the cell and the arrow sits against the border, inside the bar, so it never covers anything outside it). The header must
   * be `position: relative`, and what leads it leaves `EDGE_TAB_SPACE` px free on the right.
   */
  placement?: 'inline' | 'edge';
  ['data-gui-node-id']?: string;
  ['data-gui-component']?: string;
};

// The handle is a tall tab, not a disc: a control used this often is easier to hit by height than by width. It is 19px wide
// (the 24px disc it replaced, 21% narrower) and nearly as tall as the header. It sits entirely INSIDE the bar, flush with
// the border and rounded on the side that faces the bar: whatever is outside the bar (the top bar's location label starts a
// few pixels past the border) is never covered, and its target, the tab plus 1px and the header's full height, takes no
// clicks from anything outside either. Whatever leads the header must leave this much room on the right (`EDGE_TAB_SPACE`).
export const EDGE_TAB_SPACE = 24;
const EDGE_TARGET_WIDTH = 20;
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
          right: 0,
          width: EDGE_TARGET_WIDTH,
          p: 0,
          zIndex: 2,
          borderRadius: 0,
          justifyContent: 'flex-end',
          '&:focus-visible': { outline: 'none' },
          // Only the tab is drawn; the rest of the target is invisible.
          '& .gui-edge-handle': {
            width: EDGE_HANDLE_WIDTH,
            height: 'calc(100% - 8px)',
            maxHeight: EDGE_HANDLE_MAX_HEIGHT,
            borderRadius: '6px 0 0 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderRight: 'none',
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
