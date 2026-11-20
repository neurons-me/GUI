import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Box from '@/gui/Atoms/Box/Box';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { getGuiThemes } from '@/gui/Theme/utils/catalog';
import { LeftSidebarContext } from '@/gui-internals/Contexts/LeftSidebarContext';
import { useOptionalSelection, useRegisterGuiNode } from '@/runtime/selection';
import { alphabetical, applyCollectionRules } from '@/gui-internals/Collections/rules';
import type { ThemeManifest } from '@/types/theme';
import { useGuiNodeId } from '@/runtime/guiNodeId';
import { useOpenGuiPage } from '@/runtime/themeSettings';
import { GUI_HOME_ROUTE } from '@/gui/All.This/GUI/GuiPages';
import { LEAD_COL, leadColSx } from '@/gui/Layout/Sidebars/LeftBar/leadColumn';
import { TreeLevel, TreeNode, rowCapacity } from '@/gui/All.This/Cleaker/IdentityTree';
import { availableMenuContentWidth } from '@/gui/All.This/Cleaker/Corner/menuSize';
import NodeTip from '@/gui/All.This/Cleaker/NodeTip';
import { useDockRow } from '@/gui/All.This/Cleaker/useDockRow';
import { NODE_ICON, NODE_SIZE, nodePx } from '@/gui/All.This/Cleaker/treeMetrics';
import { DOCK_LEAVE_MS, DOCK_TRACK_MS, useDockMagnify } from '@/gui/Theme/dockMagnify';

export interface ThemeLauncherProps {
  sx?: any;
}


/** Sun/moon, inspector (`code`) and layout grid (`grid_on`) — the same compact
 *  controls as the hover strip, shared with the expanded catalog's top. */
function ThemeToolButtons({
  mode,
  toggleMode,
  selection,
  base,
  onInspectorOn,
  onOpenSettings,
  direction = 'row',
}: {
  mode: string;
  toggleMode: () => void;
  selection: ReturnType<typeof useOptionalSelection>;
  base: string;
  onInspectorOn?: () => void;
  onOpenSettings?: () => void;
  direction?: 'row' | 'column';
}) {
  const stacked = direction === 'column';
  const iconSize = '1.125rem';
  const btnSx = (on?: boolean) => ({
    p: stacked ? 0.375 : 0.5,
    borderRadius: 1,
    ...(stacked ? {
      width: 30,
      height: 30,
      minWidth: 30,
      transition: 'transform 150ms ease-out',
      '&:hover': { transform: 'scale(1.08)' },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
        '&:hover': { transform: 'none' },
      },
    } : {}),
    ...(on ? { bgcolor: 'action.selected' } : {}),
  });
  const buttons = (
    <>
      <IconButton
        type="button"
        size="small"
        aria-label={mode === 'light' ? 'Light mode' : 'Dark mode'}
        title={mode === 'light' ? 'Light mode' : 'Dark mode'}
        data-gui-node-id={`${base}.mode`}
        data-gui-component="toggle"
        onClick={() => toggleMode()}
        sx={btnSx()}
      >
        <Icon name={mode === 'light' ? 'light_mode' : 'dark_mode'} fontSize={iconSize} iconColor="primary" />
      </IconButton>
      {selection && (
        <>
          <IconButton
            type="button"
            size="small"
            color={selection.inspectorEnabled ? 'primary' : 'inherit'}
            aria-label={selection.inspectorEnabled ? 'Inspector on' : 'Inspector off'}
            aria-pressed={selection.inspectorEnabled}
            title={selection.inspectorEnabled ? 'Inspector on' : 'Inspector off'}
            data-gui-node-id={`${base}.inspector`}
            data-gui-component="toggle"
            onClick={() => {
              const next = !selection.inspectorEnabled;
              selection.setInspectorEnabled(next);
              if (next) onInspectorOn?.();
            }}
            sx={btnSx(selection.inspectorEnabled)}
          >
            <Icon name="code" fontSize={iconSize} />
          </IconButton>
          <IconButton
            type="button"
            size="small"
            color={selection.gridEnabled ? 'primary' : 'inherit'}
            aria-label={selection.gridEnabled ? 'Grid on' : 'Grid off'}
            aria-pressed={selection.gridEnabled}
            title={selection.gridEnabled ? 'Grid on' : 'Grid off'}
            data-gui-node-id={`${base}.grid`}
            data-gui-component="toggle"
            onClick={() => selection.setGridEnabled(!selection.gridEnabled)}
            sx={btnSx(selection.gridEnabled)}
          >
            <Icon name="grid_on" fontSize={iconSize} />
          </IconButton>
        </>
      )}
      <IconButton
        type="button"
        size="small"
        aria-label="Settings"
        title="Settings"
        data-gui-node-id={`${base}.settings`}
        data-gui-component="settings"
        onClick={() => onOpenSettings?.()}
        sx={btnSx()}
      >
        <Icon name="settings" fontSize={iconSize} />
      </IconButton>
    </>
  );
  // A row keeps a fragment so the parent strip's own gap applies.
  if (!stacked) return buttons;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        width: '100%',
        boxSizing: 'border-box',
        // leave a sliver under the absolute corner chevron so it
        // never covers the sun/moon, without taking a full row
        pt: 0.75,
      }}
    >
      {buttons}
    </Box>
  );
}

/** Rail only: two controls (sun/moon, settings). Settings opens a small menu with Inspector, Grid, Settings and a
 *  link to the GUI's own page. The menu is fixed to the viewport (the rail clips), clamped inside it, and closes on
 *  Escape, an outside press, or after an action. */
function RailTools({
  layout = 'rail',
  mode,
  toggleMode,
  selection,
  base,
  onOpenSettings,
  onOpenGui,
}: {
  mode: string;
  toggleMode: () => void;
  selection: ReturnType<typeof useOptionalSelection>;
  base: string;
  onOpenSettings?: () => void;
  onOpenGui?: (e: React.MouseEvent) => void;
  /** 'rail': stacked, the menu opens to the side. 'line': the calm collapsed line, a row of two quiet icons; the
   *  menu opens downward (flips up when there is no room below). */
  layout?: 'rail' | 'line';
}) {
  const line = layout === 'line';
  const [menu, setMenu] = useState<{ left: number; top: number; aTop: number; aRight: number; placed?: boolean } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const iconSize = '1.125rem';
  const btnSx = (on?: boolean) => (line ? {
    // Quiet at rest (always visible, lower weight); full strength on hover / focus / while its menu is open.
    p: 0.5, borderRadius: 1, color: 'text.secondary', opacity: on ? 1 : 0.72,
    transition: 'opacity 150ms ease-out, color 150ms ease-out',
    '&:hover, &:focus-visible': { opacity: 1, color: 'text.primary' },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    ...(on ? { bgcolor: 'action.selected', color: 'text.primary' } : {}),
  } : {
    p: 0.375, borderRadius: 1, width: 30, height: 30, minWidth: 30,
    transition: 'transform 150ms ease-out',
    '&:hover': { transform: 'scale(1.08)' },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
    ...(on ? { bgcolor: 'action.selected' } : {}),
  });
  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setMenu(line
      ? { left: r.left, top: r.bottom + 4, aTop: r.top, aRight: r.right }
      : { left: r.right + 6, top: r.top, aTop: r.top, aRight: r.right });
  };
  // Keep it inside the viewport once it has a size.
  React.useLayoutEffect(() => {
    const el = menuRef.current;
    if (!menu || !el || menu.placed) return;
    const m = el.getBoundingClientRect();
    const pad = 8;
    let left = menu.left;
    let top = menu.top;
    if (line) {
      left = menu.aRight - m.width; // right edges aligned with the gear
      if (top + m.height > window.innerHeight - pad) top = menu.aTop - m.height - 4; // no room below: flip up
    }
    left = Math.max(pad, Math.min(left, window.innerWidth - m.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - m.height - pad));
    setMenu({ ...menu, left, top, placed: true });
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      const path = e.composedPath();
      if (!path.includes(menuRef.current as EventTarget) && !path.includes(btnRef.current as EventTarget)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setMenu(null); btnRef.current?.focus(); } };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); };
  }, [menu]);
  const itemSx = (on?: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 1, width: '100%', px: 1, py: 0.5, border: 'none', borderRadius: 1,
    background: 'transparent', color: on ? 'primary.main' : 'inherit', cursor: 'pointer', textAlign: 'left',
    typography: 'body2', textDecoration: 'none', boxSizing: 'border-box', whiteSpace: 'nowrap',
    ...(on ? { bgcolor: 'action.selected' } : {}),
    '&:hover': { bgcolor: 'action.hover' },
    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
  });
  return (
    <Box
      data-theme-tools={line ? '' : undefined}
      // In the line, a tool or the menu runs its own action; the rest of the line opens / closes the list.
      onClick={line ? (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('button, a, [data-theme-rail-menu]')) e.stopPropagation(); } : undefined}
      onKeyDown={line ? (e: React.KeyboardEvent) => e.stopPropagation() : undefined}
      sx={line
        ? { display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }
        : { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%', boxSizing: 'border-box', pt: 0.75 }}
    >
      <IconButton
        type="button"
        size="small"
        aria-label={mode === 'light' ? 'Light mode' : 'Dark mode'}
        title={mode === 'light' ? 'Light mode' : 'Dark mode'}
        data-gui-node-id={`${base}.mode`}
        data-gui-component="toggle"
        onClick={() => toggleMode()}
        sx={btnSx()}
      >
        <Icon name={mode === 'light' ? 'light_mode' : 'dark_mode'} fontSize={iconSize} iconColor={line ? undefined : 'primary'} />
      </IconButton>
      <IconButton
        ref={btnRef}
        type="button"
        size="small"
        aria-label="Settings"
        title="Settings"
        aria-haspopup="menu"
        aria-expanded={!!menu}
        data-gui-node-id={`${base}.settings`}
        data-gui-component="settings"
        onClick={() => (menu ? setMenu(null) : openMenu())}
        sx={btnSx(!!menu)}
      >
        <Icon name="settings" fontSize={iconSize} />
      </IconButton>
      {menu && (
        <Box
          ref={menuRef}
          role="menu"
          aria-label="Theme tools"
          data-theme-rail-menu=""
          sx={{
            position: 'fixed', left: menu.left, top: menu.top, zIndex: (t: any) => t.zIndex.tooltip, visibility: menu.placed ? 'visible' : 'hidden',
            minWidth: '10rem', maxWidth: 'calc(100vw - 1rem)', p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25,
            bgcolor: 'background.paper', color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: 1,
            boxShadow: 3, boxSizing: 'border-box',
          }}
        >
          {selection && (
            <>
              <Box
                component="button" type="button" role="menuitemcheckbox" aria-checked={selection.inspectorEnabled}
                data-gui-node-id={`${base}.inspector`} data-gui-component="toggle"
                onClick={() => { selection.setInspectorEnabled(!selection.inspectorEnabled); setMenu(null); }}
                sx={itemSx(selection.inspectorEnabled)}
              >
                <Icon name="code" fontSize={iconSize} /> Inspector
              </Box>
              <Box
                component="button" type="button" role="menuitemcheckbox" aria-checked={selection.gridEnabled}
                data-gui-node-id={`${base}.grid`} data-gui-component="toggle"
                onClick={() => { selection.setGridEnabled(!selection.gridEnabled); setMenu(null); }}
                sx={itemSx(selection.gridEnabled)}
              >
                <Icon name="grid_on" fontSize={iconSize} /> Grid
              </Box>
            </>
          )}
          <Box
            component="button" type="button" role="menuitem" data-gui-component="settings"
            onClick={() => { setMenu(null); onOpenSettings?.(); }}
            sx={itemSx()}
          >
            <Icon name="settings" fontSize={iconSize} /> Settings
          </Box>
          <Box
            component="a" href={GUI_HOME_ROUTE} role="menuitem" data-gui-component="link"
            onClick={(e: React.MouseEvent) => { setMenu(null); onOpenGui?.(e); }}
            sx={itemSx()}
          >
            <Icon name="open_in_new" fontSize={iconSize} /> .GUI
          </Box>
        </Box>
      )}
    </Box>
  );
}


/**
 * The themes switcher is ONE element that grows: its line (avatar + name + tools) is the header and never moves or
 * resizes; ALL the themes grow out of it upward (it sits at the bottom of the bar) in one FIXED order (by name),
 * one row each with the header's own geometry (same ring, avatar and name). Picking one only marks it (accent ring)
 * and applies it: nothing moves, so trying themes one after another never reshuffles the list. While open, the
 * line folds away and the selected row carries the tools (the name is never shown twice). Height and opacity follow
 * the theme's transitions (entering/leaving durations, standard easing); prefers-reduced-motion: no motion.
 */
// One scale with the rest of the bar: the ring is the bar's leading size (the QR's), the avatar inside it leaves the
// accent ring visible.
const RING = LEAD_COL;
const AVATAR = '1.75rem';
// The rail keeps its own, larger marks (the approved rail: a 44px ring, a 34px avatar), centred on the rail's axis.
const RAIL_RING = '2.75rem';
const RAIL_AVATAR = '2.125rem';

/**
 * The hover feel of the theme avatars (rail, list and card): the mark under the pointer lifts and grows with a soft
 * spring and an accent glow; its neighbours swell a little (a dock-like falloff). prefers-reduced-motion: no motion.
 * Put on the list (the parent of the options).
 */
const themeHoverSx = {
  '& [role=option] [data-theme-ring]': { transition: 'border-color 160ms ease-out, outline-color 160ms ease-out', outline: '1.5px solid transparent', outlineOffset: '1.5px' },
  '& [role=option]:hover [data-theme-ring], & [role=option]:focus-visible [data-theme-ring]': { borderColor: 'primary.main', outlineColor: 'primary.main' },
};

/**
 * The theme collection's Dock (the same magnification as the catalog and the keys rows: useDockMagnify, cosine falloff,
 * DOCK_TRACK_MS / DOCK_LEAVE_MS), down a column: the avatar under the pointer grows, its neighbours less, transform-only
 * on `[data-theme-mark]` so rows and lines never move. `max` caps the growth to what the column has room for.
 * prefers-reduced-motion: the hook does not scale.
 */
function useThemeDock(itemPx: number, max = 1.3, origin = 'center') {
  const apply = useCallback((items: Array<HTMLElement | null>, scales: number[], leaving: boolean) => {
    const ms = leaving ? DOCK_LEAVE_MS : DOCK_TRACK_MS;
    items.forEach((el, i) => {
      const mark = el?.querySelector('[data-theme-mark]') as HTMLElement | null;
      if (!el || !mark) return;
      const raw = scales[i] ?? 1;
      const s = 1 + (raw - 1) * ((max - 1) / 0.48);
      el.style.zIndex = s > 1.001 ? String(Math.round(s * 100)) : '';
      mark.style.transition = `transform ${ms}ms ease-out`;
      mark.style.transformOrigin = origin;
      mark.style.transform = s > 1.001 ? `scale(${s.toFixed(3)})` : '';
    });
  }, [max, origin]);
  const { listRef, itemRefs, onPointerMove, onPointerLeave } = useDockMagnify({ axis: 'y', itemSize: itemPx, centers: 'measured', apply });
  const collect = useCallback(() => {
    const root = listRef.current;
    itemRefs.current = root ? Array.from(root.querySelectorAll<HTMLElement>(':scope > [role=option]')) : [];
  }, [listRef, itemRefs]);
  return {
    listRef,
    onPointerMove: (e: React.PointerEvent) => { collect(); onPointerMove(e); },
    onPointerLeave: () => { collect(); onPointerLeave(); },
  };
}

function ThemeMark({ theme, label, mode, selected = false, closing, rail = false }: { theme?: ThemeManifest; label: string; mode?: string; selected?: boolean; closing?: boolean; rail?: boolean }) {
  const ring = rail ? RAIL_RING : RING;
  const avatar = rail ? RAIL_AVATAR : AVATAR;
  return (
    <Box data-theme-mark="" sx={{ position: 'relative', width: ring, height: ring, flexShrink: 0 }}>
      <Box
        data-theme-ring=""
        sx={{
          width: ring, height: ring, border: '1px solid', borderColor: selected ? 'primary.main' : 'divider', borderRadius: '999px',
          boxShadow: (t: any) => (selected ? `inset 0 0 0 1px ${t.palette.primary.main}` : 'none'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {closing !== undefined && (
          <Box aria-hidden sx={(t: any) => ({
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default', color: 'text.secondary', opacity: closing ? 1 : 0, zIndex: 1,
            transition: `opacity ${t.transitions.duration.shorter}ms ${t.transitions.easing.easeInOut}`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          })}>
            <Icon name="expand_more" fontSize="1.25rem" />
          </Box>
        )}
        {theme?.badgeUrl ? (
          <Avatar src={theme.badgeUrl} alt={label} sx={{ width: avatar, height: avatar }} />
        ) : (
          <Avatar sx={{ width: avatar, height: avatar, typography: 'body2' }}>{label[0] ?? 'T'}</Avatar>
        )}
      </Box>
      {mode && !closing && (
        <Box
          sx={{
            position: 'absolute', bottom: '-0.125rem', right: '-0.125rem', width: '1rem', height: '1rem', borderRadius: '999px',
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}
        >
          <Icon name={mode === 'light' ? 'light_mode' : 'dark_mode'} fontSize="0.75rem" iconColor="primary" />
        </Box>
      )}
    </Box>
  );
}

/**
 * The theme choice, shared by the bar's launcher and the namespace card's Theme section: ALL the themes in one fixed
 * order (by name), the one shown (optimistic while the provider catches up) and picking one -- applied, and kept in
 * .me (selected, mode, history) exactly as before.
 */
export function useThemeChoice(optimisticThemeId: string | null, setOptimisticThemeId: (id: string | null) => void) {
  const { themeId, mode, setThemeId, setMode } = useThemeContext() as any;
  const themes = getGuiThemes();
  const displayThemeId = optimisticThemeId || themeId;
  const activeTheme = themes.find((t) => t.themeId === displayThemeId);
  const activeLabel = activeTheme?.themeName ?? 'Theme';
  useEffect(() => { setOptimisticThemeId(null); }, [themeId]); // eslint-disable-line react-hooks/exhaustive-deps
  const meRef: any = typeof window !== 'undefined' ? (window as any).me : undefined;
  const readHistory = (): string[] => {
    try { const h = typeof meRef === 'function' ? meRef('public.ui.theme.history') : null; return Array.isArray(h) ? h.filter(Boolean) : []; } catch { return []; }
  };
  const [history, setHistory] = useState<string[]>(readHistory);
  const ordered = useMemo(() => applyCollectionRules(themes, [alphabetical('themeName')]), [themes]);
  const selectTheme = (id: string) => {
    if (!id) return;
    setOptimisticThemeId(id);
    setThemeId?.(id);
    const nextMode: 'light' | 'dark' = mode === 'dark' ? 'dark' : 'light';
    setMode?.(nextMode);
    const nextHistory = [id, ...history.filter((h) => h !== id)].slice(0, 12);
    setHistory(nextHistory);
    if (meRef) {
      try { meRef.public.ui.theme.selected(id); meRef.public.ui.theme.mode(nextMode); meRef.public.ui.theme.history(nextHistory); } catch { /* no .me */ }
    }
  };
  return { themes, ordered, displayThemeId, activeTheme, activeLabel, selectTheme };
}

/**
 * The Theme section of the namespace card's settings (beside the QR's position): the themes (fixed order, the chosen
 * one ringed), light / dark, and the sets -- Inspector, Grid, and the GUI's own page. Compact, in the card's style.
 */
export function ThemeSettingsSection({ nodeId = 'GUI.window.layout.marks.identity.menu.theme' }: { nodeId?: string }) {
  const { mode, toggleMode } = useThemeContext() as any;
  const [optimisticThemeId, setOptimisticThemeId] = useState<string | null>(null);
  const { ordered, displayThemeId, selectTheme } = useThemeChoice(optimisticThemeId, setOptimisticThemeId);
  const selection = useOptionalSelection();
  const openGuiPage = useOpenGuiPage();
  const dock = useDockRow(nodePx());
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = rootRef.current; if (!el) return undefined;
    const read = () => {
      const panel = el.closest('[data-cleaker-panel]') as HTMLElement | null;
      const max = availableMenuContentWidth(panel, undefined, el);
      setWidth(max || el.getBoundingClientRect().width || 0);
    };
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    const panel = el.closest('[data-cleaker-panel]') as HTMLElement | null;
    if (panel) ro?.observe(panel);
    ro?.observe(el);
    window.addEventListener('resize', read);
    return () => { ro?.disconnect(); window.removeEventListener('resize', read); };
  }, []);
  const cap = width ? rowCapacity(width) : 6;
  const selectedNode = `${nodeId}.catalog.${displayThemeId ?? ''}`;
  const anchor = useCallback(() => anchorRef.current ?? undefined, []);

  // A tile of the top row: the keys row's tile (node size, hairline border, Dock-scaled inner button, NodeTip above).
  const tile = (key: string, name: string, icon: string, opts: { on?: boolean; onClick?: (e: React.MouseEvent) => void; href?: string; anchor?: boolean; inspector?: boolean; pressed?: boolean } = {}) => (
    <NodeTip key={key} name={name} off={!!opts.anchor}>
      <Box data-dock-item ref={opts.anchor ? anchorRef : undefined} sx={{ display: 'flex', position: 'relative' }}>
        <Box
          data-dock-avatar
          component={opts.href ? 'a' : 'button'}
          {...(opts.href ? { href: opts.href } : { type: 'button' })}
          aria-label={name}
          aria-pressed={opts.pressed}
          aria-expanded={opts.anchor ? true : undefined}
          data-gui-node-id={`${nodeId}.${key}`}
          data-gui-component={opts.anchor ? 'branch' : 'toggle'}
          {...(opts.inspector ? { 'data-gui-inspector-control': 'true' } : {})}
          onClick={opts.onClick}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE, boxSizing: 'border-box', p: 0,
            border: '1px solid', borderColor: opts.on ? 'primary.main' : 'divider', borderRadius: 1, textDecoration: 'none',
            bgcolor: 'background.default', color: opts.on ? 'primary.main' : 'inherit', cursor: opts.anchor ? 'default' : 'pointer',
            '&:hover': { bgcolor: 'action.hover' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
          }}
        >
          <Icon name={icon} fontSize={NODE_ICON} />
        </Box>
      </Box>
    </NodeTip>
  );

  return (
    <Box ref={rootRef} data-gui-node-id={nodeId} data-theme-settings="" data-no-drag="" sx={{ pt: 1, borderTop: 1, borderColor: 'divider', cursor: 'default', minWidth: 0 }}>
      {/* The top row, like the card's keys / wallet / profile row: the themes branch (open), the mode, the sets. */}
      <Box ref={dock.ref} onPointerMove={dock.onPointerMove} onPointerLeave={dock.onPointerLeave} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'center', mt: '13px' }}>
        {tile('themes', 'Themes', 'palette', { on: true, anchor: true })}
        {tile('mode', mode === 'light' ? 'Light mode' : 'Dark mode', mode === 'light' ? 'light_mode' : 'dark_mode', { onClick: () => toggleMode() })}
        {selection && tile('inspector', 'Inspector', 'code', { on: selection.inspectorEnabled, pressed: selection.inspectorEnabled, inspector: true, onClick: () => selection.setInspectorEnabled(!selection.inspectorEnabled) })}
        {selection && tile('grid', 'Grid', 'grid_on', { on: selection.gridEnabled, pressed: selection.gridEnabled, inspector: true, onClick: () => selection.setGridEnabled(!selection.gridEnabled) })}
        {tile('gui', '.GUI', 'open_in_new', {
          href: GUI_HOME_ROUTE,
          onClick: (e: React.MouseEvent) => {
            if (!openGuiPage || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as any).button === 1) return;
            e.preventDefault(); openGuiPage(GUI_HOME_ROUTE);
          },
        })}
      </Box>
      {/* The themes hang from it like a keys level: avatars only, the name in the node's tooltip; the chosen one is the
          selected node (accent tile and accent path). */}
      <Box role="listbox" aria-label="Themes" data-theme-scroll="">
        <TreeLevel anchor={anchor} arm=".themes" nodeId={`${nodeId}.catalog`} activeNodeId={selectedNode} cap={cap}>
          {ordered.map((t: ThemeManifest) => {
            const id = t.themeId ?? '';
            const label = t.themeName ?? 'Theme';
            const selected = id === displayThemeId;
            return (
              <TreeNode key={id || label} nodeId={`${nodeId}.catalog.${id || label}`} name={label} expanded={selected} onClick={() => { if (!selected) selectTheme(id); }}>
                {t.badgeUrl ? (
                  <Avatar src={t.badgeUrl} alt={label} sx={{ width: '1.625rem', height: '1.625rem', pointerEvents: 'none' }} />
                ) : (
                  <Avatar sx={{ width: '1.625rem', height: '1.625rem', typography: 'caption', pointerEvents: 'none' }}>{label[0] ?? 'T'}</Avatar>
                )}
              </TreeNode>
            );
          })}
        </TreeLevel>
      </Box>
    </Box>
  );
}

const ThemeLauncher: React.FC<ThemeLauncherProps> = ({ sx }) => {
  const { themeId, mode, toggleMode, setThemeId, setMode } = useThemeContext() as any;
  const leftSidebarContext = React.useContext(LeftSidebarContext);
  const isRailView = leftSidebarContext?.view === 'rail';
  const [open, setOpen] = useState(false);
  const [optimisticThemeId, setOptimisticThemeId] = useState<string | null>(null);

  // Optional: only present when a SelectionProvider is mounted (dev tooling). When the inspector selects a node,
  // the switcher closes so the two panels never overlap.
  const optionalSelection = useOptionalSelection();
  const inspectorSelectedNodeId = optionalSelection?.selectedNodeId;
  const base = useGuiNodeId('ThemeLauncher');
  const toolsShown = !isRailView || open;
  useRegisterGuiNode(`${base}.avatar`, 'avatar');
  useRegisterGuiNode(!isRailView && `${base}.label`, 'label');
  useRegisterGuiNode(toolsShown && `${base}.mode`, 'toggle');
  useRegisterGuiNode(toolsShown && !!optionalSelection && `${base}.inspector`, 'toggle');
  useRegisterGuiNode(toolsShown && !!optionalSelection && `${base}.grid`, 'toggle');
  useRegisterGuiNode(toolsShown && `${base}.settings`, 'settings');
  useEffect(() => { if (inspectorSelectedNodeId) setOpen(false); }, [inspectorSelectedNodeId]);

  const { themes, ordered, displayThemeId, activeTheme, activeLabel, selectTheme } = useThemeChoice(optimisticThemeId, setOptimisticThemeId);

  const openGuiPage = useOpenGuiPage();
  const openGeneralSettings = useCallback(() => { setOpen(false); openGuiPage?.(GUI_HOME_ROUTE); }, [openGuiPage]);
  // The menu's .GUI link: a plain click stays in the shell; modifier / middle clicks open it as a link.
  const openGuiLink = (e: React.MouseEvent) => {
    if (!openGuiPage || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as any).button === 1) return;
    e.preventDefault(); setOpen(false); openGuiPage(GUI_HOME_ROUTE);
  };
  const toggle = () => {
    if (!open && inspectorSelectedNodeId) optionalSelection?.clearSelection();
    setOpen((o) => !o);
  };

  // One motion for opening and closing: the list's row track goes 0fr → 1fr (no measuring, no jump), with opacity.
  const motion = (t: any) => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return 'none';
    const ms = open ? t.transitions.duration.enteringScreen : t.transitions.duration.leavingScreen;
    const ease = t.transitions.easing.easeInOut;
    return `grid-template-rows ${ms}ms ${ease}, opacity ${ms}ms ${ease}`;
  };

  const tools = (direction: 'row' | 'column') => (
    <ThemeToolButtons
      mode={mode}
      toggleMode={toggleMode}
      selection={optionalSelection}
      base={base}
      direction={direction}
      onOpenSettings={openGeneralSettings}
    />
  );

  // The tools pill: in the collapsed line, and in the expanded list on the SELECTED row (it moves with the selection).
  const pill = (direction: 'row' | 'column') => (
    <Box
      data-theme-tools=""
      // A tool runs its own action; the pill's gaps belong to the row / line (they open / close it).
      onClick={(e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('button')) e.stopPropagation(); }}
      onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
      sx={direction === 'row' ? {
        display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, px: 0.25,
        border: '1px solid', borderColor: 'divider', borderRadius: '999px',
      } : {
        display: 'flex', justifyContent: 'center', width: '100%', pb: 0.5,
      }}
    >
      {tools(direction)}
    </Box>
  );

  // Open: show the selected row (scroll it into the list's view, never the page's) and close on an outside press.
  const switcherRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  // The collection's Dock: the rail's 44px marks grow to ~57px (the room the rail column gives); the open list's grow
  // from their leading edge so the column stays put.
  const railDock = useThemeDock(44 + 4, 1.3);
  const listDock = useThemeDock(38 + 4, 1.3, 'left center');
  const dockRef = (dock: { listRef: React.MutableRefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement> }) => (el: HTMLDivElement | null) => {
    scrollRef.current = el; (dock.listRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };
  useEffect(() => {
    if (!open) return;
    const sc = scrollRef.current;
    const row = sc?.querySelector<HTMLElement>('[data-selected="true"]');
    if (sc && row && sc.scrollHeight > sc.clientHeight) sc.scrollTop = Math.max(0, row.offsetTop - (sc.clientHeight - row.offsetHeight) / 2);
    const onDown = (e: PointerEvent) => {
      const el = switcherRef.current;
      if (el && !e.composedPath().includes(el)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  // Icon-only rail: its own layout (tools on top, the line's avatar fades to a close mark while open).
  if (isRailView) return (
    <Box data-gui-inspector-control="true" sx={{ width: '100%', minWidth: 0, ...sx }}>
      <Box
        ref={switcherRef}
        data-theme-switcher={open ? 'open' : 'closed'}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}
        sx={(t: any) => ({
          display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
          width: '100%', minWidth: 0, maxWidth: '100%',
          border: '1px solid', borderColor: open ? 'divider' : 'transparent', borderRadius: 2,
          transition: (motion(t) === 'none') ? 'none' : `border-color ${open ? t.transitions.duration.enteringScreen : t.transitions.duration.leavingScreen}ms ${t.transitions.easing.easeInOut}`,
        })}
      >
        {/* The other themes: grow upward out of the header. */}
        <Box
          data-theme-list={open ? 'open' : 'closed'}
          aria-hidden={!open}
          sx={(t: any) => ({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, transition: motion(t) })}
        >
          {/* Clipped for the fold, a little wider than the column so a hovered avatar grows without being cut (overflow, not
              clip-path: the tools' fixed menu must never be clipped). */}
          <Box sx={{ minHeight: 0, minWidth: 0, overflow: 'hidden', mx: '-0.75rem', px: '0.75rem', ...(open ? {} : { visibility: 'hidden' }) }}>
            {isRailView && open && (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                <RailTools
                  mode={mode}
                  toggleMode={toggleMode}
                  selection={optionalSelection}
                  base={base}
                  onOpenSettings={openGeneralSettings}
                  onOpenGui={openGuiLink}
                />
              </Box>
            )}
            {/* Bounded: never past the viewport; scrolls inside when there are many themes. */}
            <Box
              role="listbox"
              aria-label="Themes"
              ref={dockRef(railDock)}
              onPointerMove={railDock.onPointerMove}
              onPointerLeave={railDock.onPointerLeave}
              data-theme-scroll=""
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: isRailView ? 'center' : 'stretch', gap: 0.5, pt: 0.75, pb: 0.5, mx: '-0.5rem', px: '0.5rem',
                // Leave room for the header, the stacked tools (rail) and the bar's top items.
                maxHeight: isRailView ? 'min(60vh, 32rem, calc(100dvh - 18rem))' : 'min(60vh, 32rem, calc(100dvh - 12rem))', overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
                scrollbarWidth: 'thin',
                ...themeHoverSx,
              }}
            >
              {ordered.map((t: ThemeManifest) => {
                const id = t.themeId ?? '';
                const label = t.themeName ?? 'Theme';
                const selected = id === displayThemeId;
                return (
                  <Box
                    key={id || label}
                    component="button"
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={open ? 0 : -1}
                    aria-label={`Select ${label} theme`}
                    title={isRailView ? label : undefined}
                    data-gui-node-id={`${base}.catalog.${id || label}`}
                    data-gui-component="theme"
                    data-selected={selected || undefined}
                    onClick={() => { if (selected) setOpen(false); else selectTheme(id); }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, width: isRailView ? RAIL_RING : '100%', minWidth: 0, flexShrink: 0,
                      overflow: 'visible', p: 0, pr: isRailView ? 0 : 1, border: 'none',
                      borderRadius: '999px', background: 'transparent', color: 'inherit', cursor: 'pointer',
                      textAlign: 'left', boxSizing: 'border-box',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                    }}
                  >
                    <ThemeMark rail theme={t} label={label} selected={selected} />
                    {!isRailView && (
                      <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 600, color: selected ? 'primary.main' : 'inherit', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* The header: the same line open or closed. A click on it (not on a tool) opens / closes the list. */}
        <Box
          data-theme-line=""
          role="button"
          tabIndex={0}
          aria-label={open ? 'Close theme options' : 'Open theme options'}
          aria-expanded={open}
          onClick={toggle}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
          }}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: isRailView ? 'center' : 'flex-start', gap: 1,
            minHeight: RAIL_RING, width: isRailView ? RAIL_RING : '100%', mx: isRailView ? 'auto' : 0, minWidth: 0,
            boxSizing: 'border-box', cursor: 'pointer', borderRadius: '999px',
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <Box data-gui-node-id={`${base}.avatar`} data-gui-component="avatar" sx={{ flexShrink: 0 }}>
            <ThemeMark rail theme={activeTheme} label={activeLabel} mode={mode} closing={open} />
          </Box>
          {/* Always one line: the name truncates with an ellipsis, the icons never wrap (never shrunk). */}
          {!isRailView && (
            <Box data-theme-line-text="" sx={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1, rowGap: 0.25 }}>
              <Box data-gui-node-id={`${base}.label`} data-gui-component="label" sx={{ flex: '1 0 auto', maxWidth: '100%', minWidth: 0, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeLabel}
                </Typography>
              </Box>
              <Box
                data-theme-tools=""
                // A tool runs its own action; the pill's gaps belong to the line (they open / close it).
                onClick={(e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('button')) e.stopPropagation(); }}
                onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, px: 0.25,
                  border: '1px solid', borderColor: 'divider', borderRadius: '999px',
                }}
              >
                {tools('row')}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box data-gui-inspector-control="true" sx={{ width: '100%', minWidth: 0, ...sx }}>
      <Box
        ref={switcherRef}
        data-theme-switcher={open ? 'open' : 'closed'}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}
        sx={(t: any) => ({
          display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
          width: '100%', minWidth: 0, maxWidth: '100%',
          border: '1px solid', borderColor: open ? 'divider' : 'transparent', borderRadius: 2,
          transition: (motion(t) === 'none') ? 'none' : `border-color ${open ? t.transitions.duration.enteringScreen : t.transitions.duration.leavingScreen}ms ${t.transitions.easing.easeInOut}`,
        })}
      >
        {/* Expanded: ALL the themes in a fixed order; the selected row carries the tools. Grows upward out of the line. */}
        <Box
          data-theme-list={open ? 'open' : 'closed'}
          aria-hidden={!open}
          sx={(t: any) => ({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, transition: motion(t) })}
        >
          <Box sx={{ minHeight: 0, minWidth: 0, overflow: 'hidden', ...(open ? {} : { visibility: 'hidden' }) }}>
            {/* Bounded: never past the viewport; scrolls inside when there are many themes. */}
            <Box
              ref={dockRef(listDock)}
              onPointerMove={listDock.onPointerMove}
              onPointerLeave={listDock.onPointerLeave}
              role="listbox"
              aria-label="Themes"
              data-theme-scroll=""
              sx={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: isRailView ? 'center' : 'stretch', gap: 0.5, py: 0.5,
                maxHeight: 'min(70vh, 36rem, calc(100dvh - 8rem))', overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
                ...themeHoverSx,
                scrollbarWidth: 'thin',
              }}
            >
              {ordered.map((t: ThemeManifest) => {
                const id = t.themeId ?? '';
                const label = t.themeName ?? 'Theme';
                const selected = id === displayThemeId;
                const act = () => { if (selected) setOpen(false); else selectTheme(id); };
                return (
                  <Box
                    key={id || label}
                    role="option"
                    aria-selected={selected}
                    tabIndex={open ? 0 : -1}
                    aria-label={`Select ${label} theme`}
                    title={isRailView ? label : undefined}
                    data-gui-node-id={`${base}.catalog.${id || label}`}
                    data-gui-component="theme"
                    data-selected={selected || undefined}
                    onClick={act}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
                    }}
                    sx={{
                      display: 'flex', flexDirection: isRailView ? 'column' : 'row', alignItems: 'center', gap: isRailView ? 0.5 : 1,
                      width: isRailView ? RING : '100%', minWidth: 0, flexShrink: 0, minHeight: RING,
                      overflow: 'visible', p: 0, pr: isRailView ? 0 : 0.5,
                      borderRadius: isRailView ? `calc(${RING} / 2)` : '999px', color: 'inherit', cursor: 'pointer',
                      textAlign: 'left', boxSizing: 'border-box',
                      bgcolor: selected && isRailView ? 'action.hover' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                    }}
                  >
                    {/* A little air around each avatar in the list (≈2.7px). */}
                    <Box sx={{ m: isRailView ? 0 : '0.17rem', flexShrink: 0, display: 'flex' }}>
                      <ThemeMark theme={t} label={label} mode={selected ? mode : undefined} selected={selected} />
                    </Box>
                    {!isRailView && (
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'nowrap', alignItems: 'center', columnGap: 1 }}>
                        <Typography variant="body2" sx={{ flex: '1 1 0', fontWeight: selected ? 700 : 600, color: selected ? 'primary.main' : 'inherit', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </Typography>
                        {/* The same two calm controls as the line (mode + gear menu): four never fit one line beside a name. */}
                        {selected && open && (
                          <RailTools
                            layout="line"
                            mode={mode}
                            toggleMode={toggleMode}
                            selection={optionalSelection}
                            base={base}
                            onOpenSettings={openGeneralSettings}
                            onOpenGui={openGuiLink}
                          />
                        )}
                      </Box>
                    )}
                    {isRailView && selected && open && pill('column')}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Collapsed: the one line (avatar + name + tools). It folds away while the list is open (no repeated name). */}
        <Box
          data-theme-line-wrap={open ? 'hidden' : 'shown'}
          sx={(t: any) => ({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: open ? '0fr' : '1fr', opacity: open ? 0 : 1, transition: motion(t) })}
        >
          <Box sx={{ minHeight: 0, minWidth: 0, overflow: 'hidden', ...(open ? { visibility: 'hidden' } : {}) }}>
            <Box
              data-theme-line=""
              role="button"
              tabIndex={open ? -1 : 0}
              aria-hidden={open}
              aria-label="Open theme options"
              aria-expanded={open}
              onClick={toggle}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
              }}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: isRailView ? 'center' : 'flex-start', gap: 1,
                minHeight: RING, width: isRailView ? RING : '100%', mx: isRailView ? 'auto' : 0, minWidth: 0,
                boxSizing: 'border-box', cursor: 'pointer', borderRadius: '999px',
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              {/* In the bar's shared leading column (the switcher's own 1px border taken back so it lines up). */}
              <Box data-gui-node-id={`${base}.avatar`} data-gui-component="avatar" data-lead-col="" sx={{ ...leadColSx, ml: '-1px' }}>
                {/* No mode badge here: the mode icon is right beside it. */}
                <ThemeMark theme={activeTheme} label={activeLabel} />
              </Box>
              {/* Always one line: the name truncates with an ellipsis, the icons never wrap (never shrunk). */}
              {!isRailView && (
                <Box data-theme-line-text="" sx={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'nowrap', alignItems: 'center', columnGap: 1 }}>
                  <Box data-gui-node-id={`${base}.label`} data-gui-component="label" sx={{ flex: '1 1 0', overflow: 'hidden', minWidth: 0, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeLabel}
                    </Typography>
                  </Box>
                  {!open && (
                    <RailTools
                      layout="line"
                      mode={mode}
                      toggleMode={toggleMode}
                      selection={optionalSelection}
                      base={base}
                      onOpenSettings={openGeneralSettings}
                      onOpenGui={openGuiLink}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ThemeLauncher;
