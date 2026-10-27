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
// EDGE_HANDLE_WIDTH wide and a bit under the header's height, and a third of it (EDGE_OVERHANG, 34% of its width) hangs
// outside the bar, so the inside keeps clear of the brand. What is just outside the bar must make room for that third: the
// top bar's location label starts 4px past the border, so the app that draws it moves it over (Cleaker's `elementsLeftSx`).
// Its target is the tab plus a pixel and the header's full height. What leads the header must leave EDGE_TAB_SPACE px free
// on the right (the part of the tab inside the bar plus a gap).
export const EDGE_HANDLE_SCALE = 0.91;
const EDGE_HANDLE_WIDTH = 16 * EDGE_HANDLE_SCALE;
export const EDGE_OVERHANG = Math.round(EDGE_HANDLE_WIDTH * 0.34 * 100) / 100;
const EDGE_TARGET_WIDTH = EDGE_HANDLE_WIDTH + 1;
export const EDGE_TAB_SPACE = 15;
const EDGE_HANDLE_MAX_HEIGHT = 44 * EDGE_HANDLE_SCALE;
// A chevron's ink is not centred in its glyph box; this moves it so the arrow, not its box, is centred in the tab (px).
const CHEVRON_NUDGE = { chevron_right: 0, chevron_left: 0 } as const;

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
          // Centred on the 48px header the way the brand is: the header's 1px bottom border sits below its padding box, so the
          // box this is positioned in is 47px and its centre is half a pixel above the brand's.
          top: 0.5,
          bottom: -0.5,
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
            height: `calc((100% - 8px) * ${EDGE_HANDLE_SCALE})`,
            maxHeight: EDGE_HANDLE_MAX_HEIGHT,
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            // A raised surface: a faint light-to-shade gradient, a lit top edge, and a soft shadow that falls onto the page.
            backgroundImage: (t: any) => (t.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.10))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(0,0,0,0.04))'),
            boxShadow: (t: any) => (t.palette.mode === 'dark'
              ? '0 1px 2px rgba(0,0,0,0.55), 0 3px 9px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)'
              : '0 1px 2px rgba(0,0,0,0.18), 0 3px 9px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)'),
            transition: 'color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
          },
          '&:hover .gui-edge-handle': {
            color: 'text.primary',
            borderColor: 'text.secondary',
            boxShadow: (t: any) => (t.palette.mode === 'dark'
              ? '0 2px 4px rgba(0,0,0,0.60), 0 6px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.14)'
              : '0 2px 4px rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.95)'),
          },
          // Pressed: the surface sinks.
          '&:active .gui-edge-handle': {
            backgroundImage: (t: any) => (t.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(255,255,255,0.04))'
              : 'linear-gradient(180deg, rgba(0,0,0,0.06), rgba(255,255,255,0.35))'),
            boxShadow: (t: any) => (t.palette.mode === 'dark'
              ? 'inset 0 2px 4px rgba(0,0,0,0.60)'
              : 'inset 0 2px 4px rgba(0,0,0,0.22)'),
          },
          '&:focus-visible .gui-edge-handle': { color: 'text.primary', borderColor: 'text.secondary', outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
        }}
      >
        <span className="gui-edge-handle">
          <span style={{ display: 'flex', transform: `translateX(${CHEVRON_NUDGE[expanded ? 'chevron_left' : 'chevron_right']}px)` }}>
            <Icon name={expanded ? 'chevron_left' : 'chevron_right'} fontSize="0.9rem" />
          </span>
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
