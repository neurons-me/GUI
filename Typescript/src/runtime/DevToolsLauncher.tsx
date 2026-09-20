// DevToolsLauncher.tsx — sidebar bubble for runtime dev tools (Semantic
// Inspector today; a natural place for Admin View or future dev toggles
// later). Mirrors ThemeLauncher's bubble+popper shape exactly so the two
// sit consistently in a LeftBar footer, one above the other.
//
// Uses useOptionalSelection() (not useSelection()), matching ThemeLauncher's
// fix in the same diff — a footer that includes this launcher but has no
// SelectionProvider ancestor (e.g. mountApp()'s default shell, which never
// renders one) must not crash the whole LeftBar. Unlike ThemeLauncher,
// there is nothing useful this component can do without a SelectionProvider
// (it exists to toggle inspector/grid state that only that context holds),
// so it renders nothing rather than a broken partial UI.
import React, { useRef } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { LeftSidebarContext } from '@/gui-internals/Contexts/LeftSidebarContext';
import { useOptionalSelection, useRegisterGuiNode } from './selection';
import { useLauncherPopover } from './launcherPopover';
import { useGuiNodeId } from './guiNodeId';

export interface DevToolsLauncherProps {
  sx?: any;
}

const DevToolsLauncher: React.FC<DevToolsLauncherProps> = ({ sx }) => {
  const selection = useOptionalSelection();
  const leftSidebarContext = React.useContext(LeftSidebarContext);
  const isRailView = leftSidebarContext?.view === 'rail';
  const [open, setOpen] = useLauncherPopover('devtools');
  // Its parts hang under the id it is given (`GUI.bars.left.footer.devtools`)
  // and are on the tree only while they are on the page: nothing without a
  // selection provider, the label unless the bar is a rail, the two toggles
  // while the menu is open.
  const base = useGuiNodeId('DevToolsLauncher');
  useRegisterGuiNode(!!selection && `${base}.icon`, 'icon');
  useRegisterGuiNode(!!selection && !isRailView && `${base}.label`, 'label');
  useRegisterGuiNode(!!selection && open && `${base}.inspector`, 'toggle');
  useRegisterGuiNode(!!selection && open && `${base}.grid`, 'toggle');
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Only one floating dev-tools surface may be open at a time — see the
  // comment on openMenu below for why. Reacts both ways: a new inspector
  // selection closes this popper (effect below), and opening this popper
  // clears any existing inspector selection (openMenu). Every hook above
  // and below this line runs unconditionally regardless of whether
  // `selection` exists — the early return for the no-provider case comes
  // after all hooks, never before, so hook order stays stable.
  React.useEffect(() => {
    if (selection?.selectedNodeId) setOpen(false);
  }, [selection?.selectedNodeId]);

  if (!selection) return null;
  const { inspectorEnabled, setInspectorEnabled, gridEnabled, setGridEnabled, selectedNodeId, clearSelection } =
    selection;

  const openMenu = () => {
    setOpen((v) => {
      const next = !v;
      // A node can already be selected on mount (e.g. restored from a
      // previous session in this origin's localStorage) — without this,
      // opening this popper while the inspector's own panel is already
      // showing recreates the exact two-floating-panels condition that
      // caused the tab to hang under rapid clicks.
      if (next && selectedNodeId) clearSelection();
      return next;
    });
  };

  return (
    <Box data-gui-inspector-control="true" sx={{ width: '100%', minWidth: 0, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isRailView ? 'center' : 'flex-start',
          gap: 1,
          width: isRailView ? 44 : '100%',
          minWidth: 0,
          height: 44,
          mx: isRailView ? 'auto' : 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Icon: hover opens the menu (mouse-only preview affordance). In
            rail view it's also the only clickable target, since there's no
            label to click there. */}
        <Box
          ref={bubbleRef}
          data-gui-node-id={`${base}.icon`}
          data-gui-component="icon"
          role={isRailView ? 'button' : undefined}
          tabIndex={isRailView ? 0 : undefined}
          aria-label={isRailView ? 'Open dev tools' : undefined}
          onMouseEnter={openMenu}
          onClick={isRailView ? openMenu : undefined}
          sx={{
            position: 'relative',
            width: 44,
            height: 44,
            flexShrink: 0,
            cursor: isRailView ? 'pointer' : 'default',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              border: '1px solid',
              borderColor: inspectorEnabled ? 'primary.main' : 'divider',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              transition: 'border-color 120ms ease, transform 120ms ease',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            <Icon name="build" fontSize="1.3rem" iconColor={inspectorEnabled ? 'primary' : undefined} />
          </Box>
          {inspectorEnabled && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: '999px',
                bgcolor: 'primary.main',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
          )}
        </Box>
        {/* Label: click opens the menu. Hidden in rail view — the icon
            above covers both hover and click there instead. */}
        {!isRailView && (
          <Box
            component="button"
            type="button"
            data-gui-node-id={`${base}.label`}
            data-gui-component="label"
            aria-label="Open dev tools"
            aria-expanded={open}
            onClick={openMenu}
            sx={{
              flex: 1,
              minWidth: 0,
              p: 0,
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              Dev Tools
            </Typography>
          </Box>
        )}
      </Box>

      <Popper
        open={open}
        anchorEl={bubbleRef.current}
        placement="right-start"
        sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 3 }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box
            data-gui-inspector-control="true"
            sx={{
              ml: 1,
              p: 1.5,
              minWidth: 220,
              maxWidth: 280,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: 4,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>
              Dev Tools
            </Typography>
            <Box
              component="button"
              type="button"
              data-gui-node-id={`${base}.inspector`}
              data-gui-component="toggle"
              onClick={() => setInspectorEnabled(!inspectorEnabled)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                p: 0.75,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon name="build" fontSize="1rem" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Inspector</Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: inspectorEnabled ? 'primary.main' : 'text.secondary', fontWeight: 700 }}
              >
                {inspectorEnabled ? 'On' : 'Off'}
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              data-gui-node-id={`${base}.grid`}
              data-gui-component="toggle"
              onClick={() => setGridEnabled(!gridEnabled)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                p: 0.75,
                mt: 0.75,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon name="grid_view" fontSize="1rem" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Layout Grid</Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: gridEnabled ? 'primary.main' : 'text.secondary', fontWeight: 700 }}
              >
                {gridEnabled ? 'On' : 'Off'}
              </Typography>
            </Box>
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default DevToolsLauncher;
