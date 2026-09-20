import React, { useEffect, useRef, useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ThemeModeToggle from '@/gui/Theme/ToggleMode/ToggleMode';
import ThemesCatalog from '@/gui/Theme/Catalog/Catalog';
import ThemeInspector from '@/gui/Theme/Inspector/ThemeInspector';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { getGuiThemes } from '@/gui/Theme/utils/catalog';
import { LeftSidebarContext } from '@/gui-internals/Contexts/LeftSidebarContext';
import { useOptionalSelection, useRegisterGuiNode } from '@/runtime/selection';
import { useLauncherPopover } from '@/runtime/launcherPopover';
import { useGuiNodeId } from '@/runtime/guiNodeId';

export interface ThemeLauncherProps {
  sx?: any;
}

const ThemeLauncher: React.FC<ThemeLauncherProps> = ({ sx }) => {
  const { themeId, mode } = useThemeContext();
  const leftSidebarContext = React.useContext(LeftSidebarContext);
  const isRailView = leftSidebarContext?.view === 'rail';
  // `expanded` = the full catalog (all themes) is open — only after a click.
  const [expanded, setExpanded] = useState(false);
  // Shared with ThemeLauncher's sibling launchers (MeLauncher,
  // DevToolsLauncher) — opening this popper closes theirs, and vice versa,
  // instead of each floating panel tracking visibility independently and
  // potentially all being open (and overlapping) at once. `expanded`
  // (the full catalog) stays local: it grows this row inline rather than
  // floating over siblings, so it doesn't need the same coordination.
  const [hoverOpen, setHoverOpen] = useLauncherPopover('theme');
  const [optimisticThemeId, setOptimisticThemeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  // Popper anchors to the avatar bubble itself, not the full-width row —
  // otherwise, with the sidebar expanded, the tooltip pops out far to the
  // right of the avatar+name instead of right next to it.
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Optional: only present when a SelectionProvider is mounted (dev-tooling
  // contexts, e.g. Storybook with the Semantic Inspector wired in) — most
  // real consumer apps render ThemeLauncher without one, so this must never
  // throw. When the Runtime Inspector's own (heavier) side panel opens for a
  // selected node, collapse this catalog too: having both floating panels
  // open and recalculating position under rapid clicks was enough forced
  // layout/reflow work to make the tab appear to hang for several seconds.
  const optionalSelection = useOptionalSelection();
  const inspectorSelectedNodeId = optionalSelection?.selectedNodeId;
  // Its parts hang under the id it is given (`GUI.bars.left.footer.theme`),
  // and are on the tree only while they are on the page: the avatar and label
  // unless the full catalog is open, the label unless the bar is a rail, the
  // two preview buttons while the preview is open.
  const base = useGuiNodeId('ThemeLauncher');
  const previewOpen = hoverOpen && !expanded;
  useRegisterGuiNode(!expanded && `${base}.avatar`, 'avatar');
  useRegisterGuiNode(!expanded && !isRailView && `${base}.label`, 'label');
  useRegisterGuiNode(previewOpen && `${base}.settings`, 'settings');
  useRegisterGuiNode(previewOpen && `${base}.showall`, 'showall');
  useEffect(() => {
    if (inspectorSelectedNodeId) {
      setExpanded(false);
      setHoverOpen(false);
    }
  }, [inspectorSelectedNodeId]);

  const themes = getGuiThemes();
  const displayThemeId = optimisticThemeId || themeId;
  const activeTheme = themes.find((t) => t.themeId === displayThemeId);
  const activeLabel = activeTheme?.themeName ?? 'Theme';

  useEffect(() => {
    setOptimisticThemeId(null);
  }, [themeId]);

  // Mirrors DevToolsLauncher's openMenu: opens on hover and stays open until
  // a click-away, rather than closing the instant the mouse leaves the
  // avatar — that made the preview impossible to actually interact with,
  // since moving toward the popper itself closed it first.
  const handleMouseEnter = () => {
    if (!expanded) {
      if (inspectorSelectedNodeId) optionalSelection?.clearSelection();
      setHoverOpen(true);
    }
  };

  // Mirrors DevToolsLauncher's onClick: a node can already be selected on
  // mount (restored from this origin's localStorage) — clear it before
  // opening this catalog so it never overlaps the inspector's own panel.
  const openCatalog = () => {
    if (inspectorSelectedNodeId) optionalSelection?.clearSelection();
    setExpanded(true);
  };

  return (
    <Box
      ref={anchorRef}
      data-gui-inspector-control="true"
      sx={{ width: '100%', minWidth: 0, ...sx }}
    >
      {!expanded ? (
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
          {/* Avatar: hover shows the theme preview popper (mouse-only). In
              rail view it's also the only clickable target, since there's
              no label to click there. */}
          <Box
            ref={bubbleRef}
            data-gui-node-id={`${base}.avatar`}
            data-gui-component="avatar"
            role={isRailView ? 'button' : undefined}
            tabIndex={isRailView ? 0 : undefined}
            aria-label={isRailView ? 'Open theme options' : undefined}
            onMouseEnter={handleMouseEnter}
            onClick={isRailView ? openCatalog : undefined}
            sx={{ position: 'relative', width: 44, height: 44, flexShrink: 0, cursor: isRailView ? 'pointer' : 'default' }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxSizing: 'border-box',
                transition: 'border-color 120ms ease, transform 120ms ease',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
            >
              {activeTheme?.badgeUrl ? (
                <Avatar src={activeTheme.badgeUrl} alt={activeLabel} sx={{ width: 34, height: 34 }} />
              ) : (
                <Avatar sx={{ width: 34, height: 34, fontSize: 13 }}>{activeLabel[0] ?? 'T'}</Avatar>
              )}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderRadius: '999px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Icon name={mode === 'light' ? 'light_mode' : 'dark_mode'} fontSize="0.9rem" iconColor="primary" />
            </Box>
          </Box>
          {/* Label: click opens the full catalog directly (skips the hover
              preview). Hidden in rail view — the avatar above covers both
              hover and click there instead. */}
          {!isRailView && (
            <Box
              component="button"
              type="button"
              data-gui-node-id={`${base}.label`}
              data-gui-component="label"
              aria-label="Open theme options"
              aria-expanded={false}
              onClick={openCatalog}
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
                {activeLabel}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: isRailView ? 0.5 : 2.5,
            pt: isRailView ? 1.25 : 3,
            // in rail view: expand just enough to give avatars a small breathing room
            mx: isRailView ? -0.75 : 0,
            width: isRailView ? 'calc(100% + 12px)' : '100%',
            boxSizing: 'border-box',
          }}
        >
          <IconButton
            size="small"
            aria-label="Collapse theme options"
            onClick={() => setExpanded(false)}
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 20,
              height: 20,
              p: 0,
              color: 'text.secondary',
            }}
          >
            <Icon name="unfold_less" fontSize="0.85rem" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <ThemeModeToggle variant="minimal" />
          </Box>
          <ThemesCatalog
            variant="grid"
            sidebarView={isRailView ? 'rail' : 'expanded'}
            minimal
            hideTitle
            sx={{ maxWidth: '100%', width: '100%' }}
            onThemeSelect={(theme, selectedId) => {
              setOptimisticThemeId(selectedId || theme.themeId || null);
              setHoverOpen(false);
            }}
          />
        </Box>
      )}

      <Popper
        open={hoverOpen && !expanded}
        anchorEl={bubbleRef.current}
        placement="right-start"
        sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 3 }}
      >
        <ClickAwayListener onClickAway={() => setHoverOpen(false)}>
          <Box
            sx={{
              ml: 1,
              p: 1.5,
              minWidth: 200,
              maxWidth: 260,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>
                  Theme
                </Typography>
                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeLabel}
                </Typography>
              </Box>
              <ThemeModeToggle variant="minimal" iconSize="small" />
              <IconButton
                size="small"
                data-gui-node-id={`${base}.settings`}
                data-gui-component="settings"
                aria-label="Open theme settings"
                onClick={() => {
                  setHoverOpen(false);
                  setInspectorOpen(true);
                }}
              >
                <Icon name="settings" fontSize="1rem" />
              </IconButton>
            </Box>
            <Box
              component="button"
              type="button"
              data-gui-node-id={`${base}.showall`}
              data-gui-component="showall"
              onClick={() => {
                setHoverOpen(false);
                openCatalog();
              }}
              sx={{
                width: '100%',
                p: 0.75,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Show All
            </Box>
          </Box>
        </ClickAwayListener>
      </Popper>

      <ThemeInspector open={inspectorOpen} onClose={() => setInspectorOpen(false)} />
    </Box>
  );
};

export default ThemeLauncher;
