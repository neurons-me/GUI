//@/gui/Layouts/ResponsiveUI/Sidebars/LeftSidebar/components/LeftSidebarToggleButton/LeftSidebarToggleButton.tsx
import React from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';

type LeftSidebarToggleButtonProps = {
  expanded: boolean;
  onToggle: () => void;
  /**
   * `inline` (default): a button in the header's flow. `edge`: a tall, thin tab on the bar's right border (a hair outside it), centred on the
   * header, for a header whose leading cell belongs to the app's brand (the whole rail is only 72px wide, so the brand
   * keeps the cell and the arrow sits on the border, clear of the brand and of whatever is just outside the bar). The header must
   * be `position: relative`, and what leads it leaves `EDGE_TAB_SPACE` px free on the right.
   */
  placement?: 'inline' | 'edge';
  ['data-gui-node-id']?: string;
  ['data-gui-component']?: string;
};

// The handle is a tall, thin tab, not a disc: a control used this often is easier to hit by height than by width. It is
// EDGE_HANDLE_WIDTH wide and nearly as tall as the header, and it straddles the bar's border by EDGE_OVERHANG (9% of its own
// width): enough that it does not crowd the brand beside it on the inside, little enough that it stays clear of what is just
// outside the bar (the top bar's location label starts 4px past the border). Its target is the tab plus a pixel on the inside
// and the header's full height, so it takes clicks from neither neighbour. What leads the header must leave EDGE_TAB_SPACE px
// free on the right.
const EDGE_HANDLE_WIDTH = 16;
export const EDGE_OVERHANG = 1.5;
const EDGE_TARGET_WIDTH = EDGE_HANDLE_WIDTH + 1;
export const EDGE_TAB_SPACE = 19;
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
          // The bar's own border is 1px and the header sits inside it, so the overhang is counted past that border.
          right: -(EDGE_OVERHANG + 1),
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
            borderRadius: '5px',
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
          <Icon name={expanded ? 'chevron_left' : 'chevron_right'} fontSize="0.9rem" />
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
