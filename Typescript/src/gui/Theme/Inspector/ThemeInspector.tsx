// src/gui/Theme/Inspector/ThemeInspector.tsx
// A real, in-app view of the active theme's palette + typography scale —
// opened from ThemeLauncher's settings icon, not a Storybook-only debug dump. Inside a namespace's shell it is the
// page `/GUI/themes` (GuiPages.tsx); the dialog is for hosts with no router.
import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@/gui/Atoms/Box/Box';
import Typography from '@/gui/Atoms/Typography/Typography';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';
import Button from '@/gui/Atoms/Button/Button';
import Chip from '@/gui/Atoms/Chip/Chip';
import Link from '@/gui/Atoms/Link/Link';
import Divider from '@/gui/Atoms/Divider/Divider';
import Paper from '@/gui/Atoms/Paper/Paper';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import ThemeModeToggle from '@/gui/Theme/ToggleMode/ToggleMode';
import { useGuiTheme } from '@/gui-internals/Hooks';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import { getGuiThemes } from '@/gui/Theme/utils/catalog';

export interface ThemeInspectorProps {
  open: boolean;
  onClose: () => void;
}

// Horizontal theme strip — switch themes right here and watch the
// Palette/Typography preview below update live, instead of having to
// close the inspector, go open the full catalog, pick, then reopen it.
function ThemeStrip() {
  const themes = getGuiThemes();
  const { themeId, setThemeId } = useThemeContext();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {themes.map((theme) => {
        const isActive = theme.themeId === themeId;
        return (
          <Box
            key={theme.themeId}
            component="button"
            type="button"
            aria-label={`Switch to ${theme.themeName} theme`}
            aria-pressed={isActive}
            onClick={() => setThemeId?.(theme.themeId!)}
            sx={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              p: 0.5,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              width: 56,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '999px',
                border: '2px solid',
                borderColor: isActive ? 'primary.main' : 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {theme.badgeUrl ? (
                <Avatar src={theme.badgeUrl} alt={theme.themeName} sx={{ width: 28, height: 28 }} />
              ) : (
                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>{theme.themeName?.[0] ?? 'T'}</Avatar>
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'text.primary' : 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {theme.themeName}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

const TYPOGRAPHY_VARIANTS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline',
] as const;

// One row per *semantic role* (not every raw palette key/shade) — each
// shown via the real component that actually uses that color in the app,
// so "what is primary" or "what is a link" is answered by example instead
// of an abstract swatch + hex you have to mentally map back to usage.
const SHADE_KEYS = ['light', 'main', 'dark', 'contrastText'] as const;

// Small swatch squares for a color group's shades (light/main/dark/
// contrastText) — kept alongside the "real usage" preview so you get
// both: what it looks like in context, and the actual shade ramp.
function ShadeSwatches({ group }: { group: Record<string, any> | undefined }) {
  if (!group) return null;
  const shades = SHADE_KEYS.filter((k) => typeof group[k] === 'string');
  if (!shades.length) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
      {shades.map((shadeKey) => (
        <Box key={shadeKey} sx={{ textAlign: 'center' }} title={`${shadeKey}: ${group[shadeKey]}`}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 0.75,
              bgcolor: group[shadeKey],
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1.4 }}>
            {shadeKey === 'contrastText' ? 'text' : shadeKey[0]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function PaletteRow({
  label,
  hex,
  preview,
  shadeGroup,
}: {
  label: string;
  hex?: string;
  preview: React.ReactNode;
  shadeGroup?: Record<string, any>;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" sx={{ width: 88, flexShrink: 0, color: 'text.secondary', fontWeight: 700 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>{preview}</Box>
      <ShadeSwatches group={shadeGroup} />
      {hex && (
        <Typography variant="caption" sx={{ flexShrink: 0, color: 'text.secondary', fontFamily: 'monospace' }}>
          {hex}
        </Typography>
      )}
    </Box>
  );
}

const ICON_SAMPLE_NAMES = ['favorite', 'home', 'settings', 'notifications', 'bolt'];

// A handful of icons rendered once per semantic palette role (so you can
// see "an icon in error vs warning vs neutral" side by side, not just one
// hardcoded heart), plus the same icon compared outlined vs filled (the
// Material Symbols "FILL" axis — two visual modes, same icon).
function IconShowcase({ palette }: { palette: Record<string, any> }) {
  const colorRoles: { label: string; value?: string }[] = [
    { label: 'Icon', value: palette.icon?.main },
    { label: 'Primary', value: palette.primary?.main },
    { label: 'Secondary', value: palette.secondary?.main },
    { label: 'Success', value: palette.success?.main },
    { label: 'Warning', value: palette.warning?.main },
    { label: 'Error', value: palette.error?.main },
    { label: 'Info', value: palette.info?.main },
    { label: 'Text', value: palette.text?.primary },
  ];

  return (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1 }}>
        Icons
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
        {colorRoles.map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: 56 }}>
            <Icon name="favorite" fontSize="1.3rem" style={{ color: value }} />
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.secondary', textAlign: 'center' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1 }}>
        Outlined vs. filled
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {ICON_SAMPLE_NAMES.map((name) => (
          <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon name={name} fontSize="1.3rem" fill={0} style={{ color: palette.icon?.main }} />
            <Icon name={name} fontSize="1.3rem" fill={1} style={{ color: palette.icon?.main }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function PaletteTab() {
  const theme = useGuiTheme();
  const palette: Record<string, any> = theme.palette as any;

  return (
    <Box>
      <PaletteRow
        label="Primary"
        hex={palette.primary?.main}
        shadeGroup={palette.primary}
        preview={<Button variant="contained" color="primary" size="small">Primary action</Button>}
      />
      <PaletteRow
        label="Secondary"
        hex={palette.secondary?.main}
        shadeGroup={palette.secondary}
        preview={<Button variant="contained" color="secondary" size="small">Secondary action</Button>}
      />
      <PaletteRow
        label="Success"
        hex={palette.success?.main}
        shadeGroup={palette.success}
        preview={<Chip label="Success" color="success" size="small" />}
      />
      <PaletteRow
        label="Warning"
        hex={palette.warning?.main}
        shadeGroup={palette.warning}
        preview={<Chip label="Warning" color="warning" size="small" />}
      />
      <PaletteRow
        label="Error"
        hex={palette.error?.main}
        shadeGroup={palette.error}
        preview={<Chip label="Error" color="error" size="small" />}
      />
      <PaletteRow
        label="Info"
        hex={palette.info?.main}
        shadeGroup={palette.info}
        preview={<Chip label="Info" color="info" size="small" />}
      />
      <PaletteRow
        label="Text"
        hex={palette.text?.primary}
        preview={<Typography variant="body2">The quick brown fox</Typography>}
      />
      <PaletteRow
        label="Text (muted)"
        hex={palette.text?.secondary}
        preview={<Typography variant="body2" color="text.secondary">The quick brown fox</Typography>}
      />
      <PaletteRow
        label="Link"
        hex={palette.link?.main ?? palette.primary?.main}
        preview={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Link href="#" onClick={(e: any) => e.preventDefault()}>Visit neurons.me</Link>
            {palette.link?.visited && (
              <Link
                href="#"
                onClick={(e: any) => e.preventDefault()}
                sx={{ color: palette.link.visited }}
              >
                Already visited
              </Link>
            )}
          </Box>
        }
      />
      <IconShowcase palette={palette} />
      <PaletteRow
        label="Divider"
        preview={<Divider sx={{ width: '100%' }} />}
      />
      <PaletteRow
        label="Background"
        hex={palette.background?.default}
        preview={
          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 0.75, width: '100%' }}>
            <Typography variant="caption">Page background</Typography>
          </Box>
        }
      />
      <PaletteRow
        label="Surface"
        hex={palette.background?.paper}
        preview={
          <Paper elevation={1} sx={{ px: 1.5, py: 0.75, width: '100%' }}>
            <Typography variant="caption">Card / paper surface</Typography>
          </Paper>
        }
      />
    </Box>
  );
}

function TypographyTab() {
  const theme = useGuiTheme();
  const typography: Record<string, any> = theme.typography as any;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {TYPOGRAPHY_VARIANTS.map((variant) => {
        const style = typography[variant];
        if (!style) return null;
        return (
          <Box key={variant} sx={{ display: 'flex', alignItems: 'baseline', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
            <Typography variant="caption" sx={{ width: 80, flexShrink: 0, color: 'text.secondary', fontWeight: 700 }}>
              {variant}
            </Typography>
            <Typography variant={variant as any} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              The quick brown fox
            </Typography>
            <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary', flexShrink: 0 }}>
              {style.fontSize}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export type ThemeInspectorTab = 'palette' | 'typography';

/**
 * What the inspector shows, without the frame: the theme strip, the two tabs and the open tab. The page `/GUI/themes`
 * draws it in the content area (where the tab is part of the address: `/GUI/themes`, `/GUI/themes/typography`); the
 * dialog below draws it where there is no router to give it an address.
 */
export function ThemeInspectorBody({
  tab,
  onTab,
  contentSx,
  nodeId,
}: {
  tab: ThemeInspectorTab;
  onTab: (tab: ThemeInspectorTab) => void;
  contentSx?: any;
  nodeId?: string;
}) {
  return (
    <>
      <Box data-gui-node-id={nodeId ? `${nodeId}.strip` : undefined}>
        <ThemeStrip />
      </Box>
      <Tabs
        value={tab}
        onChange={(_, v) => onTab(v)}
        sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        data-gui-node-id={nodeId ? `${nodeId}.tabs` : undefined}
      >
        <Tab value="palette" label="Palette" data-gui-node-id={nodeId ? `${nodeId}.tabs.palette` : undefined} />
        <Tab value="typography" label="Typography" data-gui-node-id={nodeId ? `${nodeId}.tabs.typography` : undefined} />
      </Tabs>
      <Box sx={{ px: 3, py: 2, ...contentSx }} data-gui-node-id={nodeId ? `${nodeId}.${tab}` : undefined}>
        {tab === 'palette' ? <PaletteTab /> : <TypographyTab />}
      </Box>
    </>
  );
}

/** The same view in a dialog: for a host with no router (an app that mounts the launcher on its own). */
const ThemeInspector: React.FC<ThemeInspectorProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState<ThemeInspectorTab>('palette');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name="palette" fontSize={20} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
          Theme
        </Typography>
        <ThemeModeToggle variant="minimal" iconSize="small" />
        <IconButton size="small" aria-label="Close theme inspector" onClick={onClose}>
          <Icon name="close" fontSize="1rem" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers={false} sx={{ maxHeight: '70vh', p: 0 }}>
        <ThemeInspectorBody tab={tab} onTab={setTab} contentSx={{ px: 3 }} />
      </DialogContent>
    </Dialog>
  );
};

export default ThemeInspector;
