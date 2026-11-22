// neurons.me/this/GUI/npm/src/gui/Theme/Catalog/Catalog.tsx
import React, { useEffect, useMemo, useState, useId, useCallback } from 'react';
import type { ThemesCatalogProps } from './Catalog.types';
import { getGuiThemes } from '@/gui/Theme/utils/catalog';
import type { ThemeManifest } from '@/types/theme';
import Grid from '@/gui/Molecules/Grid/Grid';
import Card from '@/gui/Atoms/Card/Card';
import CardHeader from '@/gui/Atoms/Card/CardHeader/CardHeader';
import CardContent from '@/gui/Atoms/Card/CardContent/CardContent';
import CardActions from '@/gui/Atoms/Card/CardActions/CardActions';
import Typography from '@/gui/Atoms/Typography/Typography';
import Box from '@/gui/Atoms/Box/Box';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import Checkbox from '@/gui/Atoms/Checkbox/Checkbox';
import Tooltip from '@/gui/Atoms/Tooltip/Tooltip';
import Switch from '@/gui/Atoms/Switch/Switch';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { LeftSidebarContext } from '@/gui-internals/Contexts/LeftSidebarContext';
import {
  alphabetical,
  applyCollectionRules,
  recentFirst,
  selectedFirst,
} from '@/gui-internals/Collections/rules';
import { renderWithGUI } from '@/runtime/renderer';
import {
  DOCK_LEAVE_MS,
  DOCK_TRACK_MS,
  prefersReducedMotion,
  useDockMagnify,
} from '@/gui/Theme/dockMagnify';
function getPreviewSwatches(item: ThemeManifest) {
  const swatches = [];
  const lightMode = item.mode?.light;
  if (typeof lightMode === 'object' && lightMode?.palette) {
    if (lightMode.palette.primary?.main) {
      swatches.push({ label: 'Primary', value: lightMode.palette.primary.main });
    }
    if (lightMode.palette.secondary?.main) {
      swatches.push({ label: 'Secondary', value: lightMode.palette.secondary.main });
    }
    if (lightMode.palette.background?.default) {
      swatches.push({ label: 'Background', value: lightMode.palette.background.default });
    }
  }
  return swatches;
}

/** Rail avatar resting sizes. Dock falloff / timing live in dockMagnify.ts.
 *  Scales are applied directly to the DOM from a rAF-throttled
 *  pointermove (no React state in the hot path). Layout size grows
 *  with the scale so neighbors are pushed apart instead of overlapping. */
const DOCK_BASE = 44;
const DOCK_AVATAR = 34;
const DOCK_AVATAR_FONT = 13;
// Enter/exit of the catalog panel — motion lives on a WRAPPER around
// each avatar so it never shares a transform with Dock magnification.
const REVEAL_OPEN_MS = 300;
const REVEAL_CLOSE_MS = 220;
const REVEAL_OPEN_EASE = 'cubic-bezier(0.2, 0, 0, 1)';
const REVEAL_CLOSE_EASE = 'cubic-bezier(0.4, 0, 1, 1)';
const REVEAL_STAGGER_MS = 25;
const REVEAL_REDUCED_MS = 120;

function applyDockSizes(
  items: Array<HTMLElement | null>,
  scales: number[],
  leaving: boolean,
) {
  const ms = leaving ? DOCK_LEAVE_MS : DOCK_TRACK_MS;
  const transition = `width ${ms}ms ease-out, height ${ms}ms ease-out, font-size ${ms}ms ease-out`;
  items.forEach((el, i) => {
    if (!el) return;
    const s = scales[i] ?? 1;
    el.style.transition = transition;
    el.style.width = `${DOCK_BASE * s}px`;
    el.style.height = `${DOCK_BASE * s}px`;
    el.style.zIndex = String(Math.round(s * 100));
    const avatar = el.querySelector('.MuiAvatar-root') as HTMLElement | null;
    if (avatar) {
      avatar.style.transition = transition;
      avatar.style.width = `${DOCK_AVATAR * s}px`;
      avatar.style.height = `${DOCK_AVATAR * s}px`;
      avatar.style.fontSize = `${DOCK_AVATAR_FONT * s}px`;
    }
  });
}

type RailThemesDockProps = {
  themes: ThemeManifest[];
  themeId?: string | null;
  activeMode: string;
  sx?: any;
  onSelect: (selectedId: string, theme: ThemeManifest) => void;
  /** When set, avatars fade/scale with the parent panel. Omitted = always shown. */
  reveal?: boolean;
};

function RailThemesDock({ themes, themeId, activeMode, sx, onSelect, reveal }: RailThemesDockProps) {
  const apply = useCallback((
    items: Array<HTMLElement | null>,
    scales: number[],
    leaving: boolean,
  ) => {
    applyDockSizes(items, scales, leaving);
  }, []);

  const { listRef, itemRefs, onPointerMove, onPointerLeave, syncItemCount } = useDockMagnify({
    axis: 'y',
    itemSize: DOCK_BASE,
    centers: 'layout',
    apply,
  });

  // If the catalog reorders (selected-first) while the pointer is away, drop
  // any leftover inline sizes. While hovering, the next move frame corrects.
  useEffect(() => {
    syncItemCount(themes.length);
  }, [themes, syncItemCount]);

  return (
    <Box
      ref={listRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      sx={{
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        overflow: 'visible',
        // room so a 1.48 scale on the first/last avatar is not clipped
        py: 0.75,
        ...sx,
      }}
    >
      {themes.map((theme: ThemeManifest, index: number) => {
        const selected = theme.themeId === themeId;
        const isDarkSelected = activeMode === 'dark';
        const activePalette = (theme.mode as any)?.[isDarkSelected ? 'dark' : 'light']?.palette;
        const activePrimary = activePalette?.primary?.main;
        const selectedColor = activePrimary || 'primary.main';
        const selectedId = theme.themeId ?? '';
        const label = theme.themeName ?? 'Theme';
        const animate = reveal !== undefined;
        const shown = reveal !== false;
        const reduced = prefersReducedMotion();
        const origin = Math.max(0, themes.findIndex((t) => t.themeId === themeId));
        const delay = Math.abs(index - origin) * REVEAL_STAGGER_MS;

        return (
          <Box
            key={selectedId || label}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              // Enter/exit only. Dock magnification sets width/height on
              // the inner button, so the two transforms never fight.
              ...(animate ? {
                opacity: shown ? 1 : 0,
                transform: reduced ? 'none' : (shown ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(8px)'),
                transformOrigin: 'center center',
                transition: reduced
                  ? `opacity ${REVEAL_REDUCED_MS}ms ease`
                  : shown
                    ? `opacity ${REVEAL_OPEN_MS}ms ${REVEAL_OPEN_EASE} ${delay}ms, transform ${REVEAL_OPEN_MS}ms ${REVEAL_OPEN_EASE} ${delay}ms`
                    : `opacity ${REVEAL_CLOSE_MS}ms ${REVEAL_CLOSE_EASE}, transform ${REVEAL_CLOSE_MS}ms ${REVEAL_CLOSE_EASE}`,
              } : {}),
            }}
          >
          <Tooltip title={label} placement="right" arrow>
            <Box
              ref={(el: HTMLElement | null) => { itemRefs.current[index] = el; }}
              component="button"
              type="button"
              aria-label={`Select ${label} theme`}
              aria-pressed={selected}
              data-gui-node-id={`GUI.window.layout.bars.footer.theme.catalog.${selectedId || label}`}
              data-gui-component="theme"
              onClick={() => onSelect(selectedId, theme)}
              sx={{
                width: DOCK_BASE,
                height: DOCK_BASE,
                flexShrink: 0,
                p: 0,
                border: selected ? '2px solid' : '1px solid',
                borderColor: selected ? selectedColor : 'divider',
                borderRadius: '999px',
                background: 'transparent',
                color: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                boxSizing: 'border-box',
                position: 'relative',
                '&:hover': {
                  borderColor: selectedColor,
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: selectedColor,
                  outlineOffset: 2,
                },
              }}
            >
              {theme.badgeUrl ? (
                <Avatar
                  src={theme.badgeUrl}
                  alt={label}
                  sx={{ width: DOCK_AVATAR, height: DOCK_AVATAR, display: 'block' }}
                />
              ) : (
                <Avatar sx={{ width: DOCK_AVATAR, height: DOCK_AVATAR, fontSize: DOCK_AVATAR_FONT }}>
                  {label[0] ?? 'T'}
                </Avatar>
              )}
            </Box>
          </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
}

export default function ThemesCatalog({
  sx,
  variant = 'grid',
  hideDescription = false,
  hideAuthor = false,
  minimal = false,
  compact = false,
  hideTitle = false,
  hideModeToggle = false,
  sidebarView,
  onThemeSelect,
  reveal,
}: ThemesCatalogProps = {}) {
  const themes = getGuiThemes();
  const { setMode, mode: activeMode, themeId, setThemeId } = useThemeContext();
  const leftSidebarContext = React.useContext(LeftSidebarContext);
  const isCompact = Boolean(compact);
  const isMinimal = Boolean(minimal || isCompact);
  const effectiveVariant = isCompact ? 'grid' : variant;
  const effectiveHideDescription = isMinimal ? true : hideDescription;
  const effectiveHideAuthor = isMinimal ? true : hideAuthor;
  const effectiveHideTitle = Boolean(hideTitle);
  const effectiveSidebarView =
    sidebarView === 'auto' ? leftSidebarContext?.view : sidebarView;
  const isRailView = effectiveSidebarView === 'rail';
  const isExpandedSidebarView = effectiveSidebarView === 'expanded';
  const isBrowser = typeof window !== 'undefined';
  const meRef: any = isBrowser ? (window as any).me : undefined;
  const instanceId = useId();
  const gui: any = isBrowser ? (window as any).GUI : undefined;
  const nodeRegister =
    (globalThis as any)?.['GUI-NODES-STORE']?.actions?.registerNode;
  const [history, setHistory] = useState<string[]>(() => {
    if (!meRef || typeof meRef !== 'function') return [];
    try {
      const h = meRef('public.ui.theme.history');
      return Array.isArray(h) ? h.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!meRef || typeof meRef !== 'function') return;
    try {
      const h = meRef('public.ui.theme.history');
      if (Array.isArray(h)) setHistory(h.filter(Boolean));
    } catch {}
  }, [meRef]);
  const orderedThemes = useMemo(() => {
    return applyCollectionRules(themes, [
      selectedFirst(themeId, 'themeId'),
      recentFirst(history, 'themeId'),
      alphabetical('themeName'),
    ]);
  }, [themes, themeId, history]);
  if (!themes || themes.length === 0) {
    return <Typography>No themes available.</Typography>;
  }

  const normalizedInstance = String(instanceId || 'catalog').replace(/[^a-zA-Z0-9_-]/g, '');
  const catalogPrefix = `themes-catalog-${normalizedInstance}`;

  const selectThemeById = (selectedId: string, theme?: ThemeManifest) => {
    if (typeof setThemeId === 'function') {
      setThemeId(selectedId);
    }
    if (typeof setMode === 'function') {
      const nextMode: 'light' | 'dark' = activeMode === 'dark' ? 'dark' : 'light';
      setMode(nextMode);
      if (meRef && selectedId) {
        try {
          meRef.public.ui.theme.selected(selectedId);
          meRef.public.ui.theme.mode(nextMode);
        } catch {}
      }
    }
    if (selectedId) {
      const nextHistory = [selectedId, ...history.filter((id) => id !== selectedId)].slice(0, 12);
      setHistory(nextHistory);
      if (meRef) {
        try {
          meRef.public.ui.theme.history(nextHistory);
        } catch {}
      }
    }
    if (theme) onThemeSelect?.(theme, selectedId);
  };

  if (isExpandedSidebarView) {
    return (
      <Box sx={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, ...sx }}>
        {orderedThemes.map((theme: ThemeManifest) => {
          const selected = theme.themeId === themeId;
          const isDarkSelected = activeMode === 'dark';
          const activePalette = (theme.mode as any)?.[isDarkSelected ? 'dark' : 'light']?.palette;
          const activePrimary = activePalette?.primary?.main;
          const selectedId = theme.themeId ?? '';
          const label = theme.themeName ?? 'Theme';
          return (
            <Box
              key={selectedId || label}
              component="button"
              type="button"
              aria-label={`Select ${label} theme`}
              aria-pressed={selected}
              data-gui-node-id={`GUI.window.layout.bars.footer.theme.catalog.${selectedId || label}`}
              data-gui-component="theme"
              onClick={() => selectThemeById(selectedId, theme)}
              sx={{
                width: '100%',
                p: '6px 8px',
                border: '1px solid',
                borderColor: selected ? (activePrimary || 'primary.main') : 'transparent',
                borderRadius: 1.5,
                bgcolor: selected ? 'action.selected' : 'transparent',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                boxSizing: 'border-box',
                textAlign: 'left',
                transition: 'background 120ms ease, border-color 120ms ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {theme.badgeUrl ? (
                <Avatar src={theme.badgeUrl} alt={label} sx={{ width: 28, height: 28, flexShrink: 0 }} />
              ) : (
                <Avatar sx={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>{label[0] ?? 'T'}</Avatar>
              )}
              <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 400, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }

  if (isRailView) {
    return (
      <RailThemesDock
        themes={orderedThemes}
        themeId={themeId}
        activeMode={activeMode}
        sx={sx}
        onSelect={selectThemeById}
        reveal={reveal}
      />
    );
  }

  const renderDeclarative = (spec: any, prefix: string) => {
    if (!gui || typeof renderWithGUI !== 'function') return null;
    try {
      return renderWithGUI(spec, gui, {
        React,
        idPrefix: prefix,
        onNodeResolved: typeof nodeRegister === 'function' ? nodeRegister : undefined,
      });
    } catch {
      return null;
    }
  };

  const buildThemeCardSpec = (theme: ThemeManifest, index: number) => {
    const light = Boolean(theme.mode?.light);
    const dark = Boolean(theme.mode?.dark);
    const isDarkSelected = activeMode === 'dark';
    const activePalette = (theme.mode as any)?.[isDarkSelected ? 'dark' : 'light']?.palette;
    const activePrimary = activePalette?.primary?.main;
    const fallbackBorder = isDarkSelected ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';
    const selectedId = theme.themeId ?? '';

    const selectTheme = () => selectThemeById(selectedId, theme);

    const handleCardKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTheme();
      }
    };

    const avatarSpec = theme.badgeUrl
      ? {
          type: Avatar,
          props: {
            'data-gui-component': 'Avatar',
            src: theme.badgeUrl,
            alt: theme.themeName,
            sx: isCompact ? { width: 28, height: 28, mt: 0.45 } : { mt: 0.45 },
          },
        }
      : {
          type: Avatar,
          props: {
            'data-gui-component': 'Avatar',
            sx: isCompact ? { width: 28, height: 28, fontSize: 13, mt: 0.45 } : { mt: 0.45 },
          },
          children: [theme.themeName?.[0] ?? 'T'],
        };

    const headerChildren = effectiveHideTitle
      ? [avatarSpec]
      : [
          avatarSpec,
          {
            type: Box,
            props: {
              'data-gui-component': 'Box',
              sx: { display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0, overflow: 'hidden' },
            },
            children: [
              {
                type: Typography,
                props: {
                  'data-gui-component': 'Typography',
                  variant: 'body2',
                  sx: {
                    fontSize: isCompact ? 12 : (isMinimal ? 14 : undefined),
                    lineHeight: isCompact ? 1.05 : (isMinimal ? 1.15 : undefined),
                    fontWeight: 700,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                  },
                },
                children: [theme.themeName ?? 'Theme'],
              },
              effectiveHideAuthor
                ? null
                : {
                    type: Typography,
                    props: {
                      'data-gui-component': 'Typography',
                      variant: 'caption',
                      sx: {
                        fontSize: isCompact ? 9 : (isMinimal ? 11 : undefined),
                        lineHeight: isCompact ? 1.05 : (isMinimal ? 1.1 : undefined),
                        color: 'text.secondary',
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                      },
                    },
                    children: [theme.author ?? ''],
                  },
            ],
          },
        ];

    const swatchSpecs = getPreviewSwatches(theme).map((sw, i) => ({
      type: Tooltip,
      props: { title: sw.label },
      children: [
        {
          type: Box,
          props: {
            key: `${theme.themeId}-swatch-${i}`,
            'data-gui-component': 'Swatch',
            sx: {
              width: isCompact ? 10 : (isMinimal ? 12 : 14),
              height: isCompact ? 10 : (isMinimal ? 12 : 14),
              borderRadius: 1,
              ...(String(sw.value).includes('gradient')
                ? { background: sw.value }
                : { bgcolor: sw.value }),
              border: '1px solid rgba(0,0,0,0.2)',
            },
          },
        },
      ],
    }));

    const modeToggleSpec =
      theme.themeId === themeId && !hideModeToggle
        ? {
            type: Box,
            props: {
              'data-gui-component': 'Box',
              sx: {
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: isCompact ? 0.25 : (isMinimal ? 0.35 : 0.5),
                mb: isCompact ? 0.1 : (isMinimal ? 0.15 : 0.25),
              },
            },
            children: [
              { type: Icon, props: { 'data-gui-component': 'Icon', name: 'light_mode', style: { opacity: light ? 1 : 0.4 } } },
              {
                type: Switch,
                props: {
                  'data-gui-component': 'Switch',
                  size: 'small',
                  checked: isDarkSelected,
                  disabled: !light || !dark,
                  onChange: (e: any) => {
                    const checked = e?.target?.checked;
                    const nextMode = checked ? 'dark' : 'light';
                    if (typeof setMode === 'function') {
                      try { setMode(nextMode); } catch {}
                    }
                  },
                  inputProps: { 'aria-label': 'Toggle light/dark mode' },
                },
              },
              { type: Icon, props: { 'data-gui-component': 'Icon', name: 'dark_mode', style: { opacity: dark ? 1 : 0.4 } } },
            ],
          }
        : null;

    return {
      type: Box,
      props: {
        sx: { position: 'relative' },
        key: theme.themeId || `theme-${index}`,
        'data-gui-component': 'ThemeCard',
        'data-gui-id': theme.themeId ? `theme-card-${theme.themeId}` : undefined,
      },
      children: [
        {
          type: Card,
          props: {
            'data-gui-component': 'Card',
            sx: {
              p: isCompact ? 0.25 : (isMinimal ? 0.5 : 0.75),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: 'transparent',
              backgroundImage: 'none',
              border: activePrimary
                ? `1px solid color-mix(in srgb, ${activePrimary} 70%, transparent)`
                : `1px solid ${fallbackBorder}`,
              borderRadius: isCompact ? 1 : (isMinimal ? 1.25 : 1.5),
              boxShadow: 'none',
              height: '100%',
              gap: isCompact ? 0.05 : (isMinimal ? 0.08 : 0.12),
              minWidth: 0,
              cursor: 'pointer',
              transition: 'transform 120ms ease, box-shadow 120ms ease',
              '&:hover': { transform: 'translateY(-1px)' },
              '&:active': { transform: 'translateY(0px)' },
            },
            onClick: selectTheme,
            role: 'button',
            tabIndex: 0,
            onKeyDown: handleCardKeyDown,
          },
          children: [
            {
              type: Box,
              props: {
                'data-gui-component': 'CardHeader',
                sx: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompact ? 0.6 : (isMinimal ? 0.75 : 1),
                  mb: 0,
                  py: isCompact ? 0.05 : (isMinimal ? 0.12 : 0.16),
                  ...(effectiveHideTitle ? { justifyContent: 'center' } : null),
                },
              },
              children: headerChildren,
            },
            {
              type: Box,
              props: {
                'data-gui-component': 'SwatchRow',
                sx: {
                  display: 'flex',
                  gap: isCompact ? 0.35 : (isMinimal ? 0.5 : 0.75),
                  flexWrap: 'wrap',
                  mt: isCompact ? 0.2 : (isMinimal ? 0.45 : 0.6),
                },
              },
              children: swatchSpecs,
            },
            effectiveHideDescription
              ? null
              : {
                  type: Typography,
                  props: { 'data-gui-component': 'Description', variant: 'body2', color: 'text.secondary', sx: { mt: 0.25 } },
                  children: [theme.description ?? ''],
                },
            modeToggleSpec,
            {
              type: Box,
              props: {
                'data-gui-component': 'CheckboxSlot',
                sx: {
                  position: 'absolute',
                  top: isCompact ? 4 : (isMinimal ? 6 : 8),
                  right: isCompact ? 4 : (isMinimal ? 6 : 8),
                },
              },
              children: [
                {
                  type: Checkbox,
                  props: {
                    'data-gui-component': 'Checkbox',
                    'data-gui-id': theme.themeId ? `theme-checkbox-${theme.themeId}` : undefined,
                    size: 'small',
                    color: 'primary',
                    checked: theme.themeId === themeId,
                    onChange: selectTheme,
                    onClick: (e: any) => {
                      if (e?.stopPropagation) e.stopPropagation();
                      selectTheme();
                    },
                    sx: {
                      p: isCompact ? 0.25 : (isMinimal ? 0.35 : 0.5),
                      backgroundColor: 'background.paper',
                      borderRadius: 1,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  };

  const declarativeListSpec = {
    type: Box,
    props: {
      sx: {
        display: 'flex',
        flexDirection: 'column',
        gap: isCompact ? 1 : 2,
        containerType: 'inline-size',
        minWidth: 0,
        ...sx,
      },
    },
    children: orderedThemes.map((theme: ThemeManifest, idx: number) => buildThemeCardSpec(theme, idx)),
  };

  const declarativeGridSpec = isCompact
    ? {
        type: Box,
        props: {
          sx: {
            display: 'grid',
            gridTemplateColumns: effectiveHideTitle
              ? 'repeat(auto-fit, minmax(40px, 1fr))'
              : 'repeat(auto-fit, minmax(132px, 1fr))',
            gap: 1,
            alignItems: 'stretch',
            containerType: 'inline-size',
            minWidth: 0,
            ...sx,
          },
        },
        children: orderedThemes.map((theme: ThemeManifest, idx: number) => ({
          type: Box,
          props: {
            'data-gui-component': 'GridItem',
            key: theme.themeId || `theme-${idx}`,
            sx: {
              minWidth: 0,
            },
          },
          children: [buildThemeCardSpec(theme, idx)],
        })),
      }
    : {
        type: Grid,
        props: {
          container: true,
          spacing: isMinimal ? 1.5 : 2,
          sx: {
            containerType: 'inline-size',
            minWidth: 0,
            ...sx,
          },
        },
        children: orderedThemes.map((theme: ThemeManifest, idx: number) => ({
          type: Grid,
          props: {
            'data-gui-component': 'GridItem',
            item: true,
            xs: 6,
            md: 4,
            lg: 3,
            xl: 3,
            sx: {
              minWidth: 0,
              '@media (max-width: 360px)': {
                flexBasis: '100%',
                maxWidth: '100%',
              },
            },
            key: theme.themeId || `theme-${idx}`,
          },
          children: [buildThemeCardSpec(theme, idx)],
        })),
      };

  const declarativeSpec =
    effectiveVariant === 'list' ? declarativeListSpec : declarativeGridSpec;

  const declarativeRender = renderDeclarative(declarativeSpec, catalogPrefix);
  if (declarativeRender) {
    return declarativeRender;
  }

  // Shared card rendering logic as a helper
  const ThemeCard = ({ theme }: { theme: ThemeManifest }) => {
    const light = Boolean(theme.mode?.light);
    const dark = Boolean(theme.mode?.dark);
    const isDarkSelected = activeMode === 'dark';
    const activePalette = (theme.mode as any)?.[isDarkSelected ? 'dark' : 'light']?.palette;
    const activePrimary = activePalette?.primary?.main;
    const fallbackBorder = isDarkSelected ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';
    // Helper: selectTheme logic (same as Checkbox onChange)
    function selectTheme() {
      selectThemeById(theme.themeId ?? '', theme);
    }
    // Keyboard handler for card
    function handleCardKeyDown(e: React.KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTheme();
      }
    }
    return (
      <Box sx={{ position: 'relative' }}>
        <Card
          sx={{
            p: isCompact ? 0.25 : (isMinimal ? 0.5 : 0.75),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            border: activePrimary
              ? `1px solid color-mix(in srgb, ${activePrimary} 70%, transparent)`
              : `1px solid ${fallbackBorder}`,
            borderRadius: isCompact ? 1 : (isMinimal ? 1.25 : 1.5),
            boxShadow: 'none',
            height: '100%',
            gap: isCompact ? 0.05 : (isMinimal ? 0.08 : 0.12),
            minWidth: 0,
            cursor: 'pointer',
            transition: 'transform 120ms ease, box-shadow 120ms ease',
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0px)' },
            '& .MuiCardHeader-root, & .MuiCardContent-root, & .MuiCardActions-root': {
              backgroundColor: 'transparent',
              backgroundImage: 'none',
            },
          }}
          onClick={selectTheme}
          role="button"
          tabIndex={0}
          onKeyDown={handleCardKeyDown}
        >
          <CardHeader
            sx={{
              mb: 0,
              py: isCompact ? 0.05 : (isMinimal ? 0.12 : 0.16),
              ...(effectiveHideTitle
                ? { display: 'flex', justifyContent: 'center' }
                : null),
              '& .MuiCardHeader-content': {
                minWidth: 0,
                overflow: 'hidden',
                ...(effectiveHideTitle ? { display: 'none' } : null),
              },
              '& .MuiCardHeader-avatar': {
                ...(effectiveHideTitle ? { marginRight: 0 } : null),
              },
              '& .MuiCardHeader-title': {
                fontSize: isCompact ? 12 : (isMinimal ? 14 : undefined),
                lineHeight: isCompact ? 1.05 : (isMinimal ? 1.15 : undefined),
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
              },
              '& .MuiCardHeader-subheader': {
                fontSize: isCompact ? 9 : (isMinimal ? 11 : undefined),
                lineHeight: isCompact ? 1.05 : (isMinimal ? 1.1 : undefined),
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
              },
            }}
            avatar={
              theme.badgeUrl ? (
                <Avatar
                  src={theme.badgeUrl}
                  alt={theme.themeName}
                  sx={isCompact ? { width: 28, height: 28, mt: 0.45 } : { mt: 0.45 }}
                />
              ) : (
                <Avatar sx={isCompact ? { width: 28, height: 28, fontSize: 13, mt: 0.45 } : { mt: 0.45 }}>
                  {theme.themeName?.[0] ?? 'T'}
                </Avatar>
              )
            }
            title={effectiveHideTitle ? undefined : theme.themeName}
            subheader={effectiveHideTitle || effectiveHideAuthor ? undefined : theme.author}
          />
          <Box
            sx={{
              display: effectiveHideTitle ? 'none' : 'flex',
              gap: isCompact ? 0.35 : (isMinimal ? 0.5 : 0.75),
              flexWrap: 'wrap',
              mt: isCompact ? 0.2 : (isMinimal ? 0.45 : 0.6),
            }}
          >
            {getPreviewSwatches(theme).map((sw, i) => (
              <Tooltip key={`${theme.themeId}-swatch-${i}`} title={sw.label}>
                <Box
                  sx={{
                    width: isCompact ? 10 : (isMinimal ? 12 : 14),
                    height: isCompact ? 10 : (isMinimal ? 12 : 14),
                    borderRadius: 1,
                    ...(String(sw.value).includes('gradient')
                      ? { background: sw.value }
                      : { bgcolor: sw.value }),
                    border: '1px solid rgba(0,0,0,0.2)',
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <Box sx={{ display: effectiveHideTitle ? 'none' : 'block', position: 'absolute', top: isCompact ? 4 : (isMinimal ? 6 : 8), right: isCompact ? 4 : (isMinimal ? 6 : 8) }}>
            <Checkbox
              size="small"
              color="primary"
              checked={theme.themeId === themeId}
              onChange={selectTheme}
              onClick={(e) => {
                e.stopPropagation();
                selectTheme();
              }}
              sx={{
                p: isCompact ? 0.25 : (isMinimal ? 0.35 : 0.5),
                backgroundColor: 'background.paper',
                borderRadius: 1,
              }}
            />
          </Box>
          <CardContent sx={{ p: isCompact ? 0.35 : (isMinimal ? 0.45 : 0.55), pt: isCompact ? 0.1 : (isMinimal ? 0.15 : 0.2), backgroundColor: 'transparent' }}>
            {!effectiveHideDescription && (
              <Typography variant="body2" color="text.secondary">
                {theme.description}
              </Typography>
            )}
            {theme.themeId === themeId && !hideModeToggle && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  mt: isCompact ? 0.25 : (isMinimal ? 0.35 : 0.5),
                  mb: isCompact ? 0.1 : (isMinimal ? 0.15 : 0.25),
                }}
              >
                <Icon name="light_mode" style={{ opacity: light ? 1 : 0.4 }} />
                <Switch
                  size="small"
                  checked={isDarkSelected}
                  disabled={!light || !dark}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextMode = checked ? 'dark' : 'light';
                    if (typeof setMode === 'function') {
                      try { setMode(nextMode); } catch {}
                    }
                  }}
                  inputProps={{ 'aria-label': 'Toggle light/dark mode' }}
                />
                <Icon name="dark_mode" style={{ opacity: dark ? 1 : 0.4 }} />
              </Box>
            )}
          </CardContent>
          <CardActions>
          </CardActions>
        </Card>
      </Box>
    );
  };

  if (effectiveVariant === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: isCompact ? 1 : 2, containerType: 'inline-size', minWidth: 0, ...sx }}>
        {orderedThemes.map((theme: ThemeManifest) => (
          <Box key={theme.themeId}>
            <ThemeCard theme={theme} />
          </Box>
        ))}
      </Box>
    );
  }

  if (isCompact) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
          gap: 1,
          alignItems: 'stretch',
          containerType: 'inline-size',
          minWidth: 0,
          ...sx,
        }}
      >
        {orderedThemes.map((theme: ThemeManifest) => (
          <Box key={theme.themeId} sx={{ minWidth: 0 }}>
            <ThemeCard theme={theme} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={isMinimal ? 1.5 : 2} sx={{ containerType: 'inline-size', minWidth: 0, ...sx }}>
      {orderedThemes.map((theme: ThemeManifest) => (
        <Grid
          item
          key={theme.themeId}
          xs={6}
          md={4}
          lg={3}
          xl={3}
          sx={{
            minWidth: 0,
            '@media (max-width: 360px)': {
              flexBasis: '100%',
              maxWidth: '100%',
            },
          }}
        >
          <ThemeCard theme={theme} />
        </Grid>
      ))}
    </Grid>
  );
}
