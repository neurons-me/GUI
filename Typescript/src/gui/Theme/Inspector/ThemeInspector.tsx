// src/gui/Theme/Inspector/ThemeInspector.tsx
// A real, in-app view of the active theme's palette + typography scale —
// opened from ThemeLauncher's settings icon, not a Storybook-only debug dump. Inside a namespace's shell it is the
// page `/GUI/themes` (GuiPages.tsx); the dialog is for hosts with no router.
import React, { useState, useCallback, useEffect } from 'react';
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
import { DOCK_LEAVE_MS, DOCK_TRACK_MS, useDockMagnify } from '@/gui/Theme/dockMagnify';
import QRme from '@/gui/All.This/me/QR/QR.me';
import { resolveQrMeColors } from '@/gui/All.This/me/QR/qrContrast';
import { linkQrValue } from '@/react/linkQr';
import { getActiveNamespaceRoot } from '@/gui/All.This/Cleaker/signedRequest';
import { useOptionalSeedSession } from '@/react/session/useSeedSession';

export interface ThemeInspectorProps {
  open: boolean;
  onClose: () => void;
}

// Horizontal theme strip — switch themes right here and watch the
// Palette/Typography preview below update live, instead of having to
// close the inspector, go open the full catalog, pick, then reopen it.
// Avatars use the same Dock magnification as the rail catalog, but only
// the image scales (transform, origin at the bottom) so labels stay put.
const STRIP_AVATAR_RING = 40;
const STRIP_AVATAR = 32;
const STRIP_AVATAR_FONT = 12;

function ThemeStrip({ nodeId }: { nodeId?: string }) {
  const themes = getGuiThemes();
  const { themeId, setThemeId } = useThemeContext();

  const apply = useCallback((
    items: Array<HTMLElement | null>,
    scales: number[],
    leaving: boolean,
  ) => {
    const ms = leaving ? DOCK_LEAVE_MS : DOCK_TRACK_MS;
    const transition = `transform ${ms}ms ease-out`;
    items.forEach((el, i) => {
      if (!el) return;
      const s = scales[i] ?? 1;
      el.style.zIndex = String(Math.round(s * 100));
      const avatar = el.querySelector('[data-dock-avatar]') as HTMLElement | null;
      if (!avatar) return;
      avatar.style.transition = transition;
      avatar.style.transform = s === 1 ? '' : `scale(${s})`;
    });
  }, []);

  const { listRef, itemRefs, onPointerMove, onPointerLeave, syncItemCount } = useDockMagnify({
    axis: 'x',
    itemSize: STRIP_AVATAR_RING,
    centers: 'measured',
    apply,
  });

  useEffect(() => {
    syncItemCount(themes.length);
  }, [themes, syncItemCount]);

  return (
    <Box
      ref={listRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      data-gui-node-id={nodeId ? `${nodeId}.strip` : undefined}
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
      {themes.map((theme, index) => {
        const isActive = theme.themeId === themeId;
        const selectedId = theme.themeId ?? theme.themeName ?? 'theme';
        return (
          <Box
            key={theme.themeId}
            ref={(el: HTMLElement | null) => { itemRefs.current[index] = el; }}
            component="button"
            type="button"
            aria-label={`Switch to ${theme.themeName} theme`}
            aria-pressed={isActive}
            data-gui-node-id={nodeId ? `${nodeId}.strip.${selectedId}` : undefined}
            data-gui-component="theme"
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
              overflow: 'visible',
              position: 'relative',
            }}
          >
            <Box
              data-dock-avatar=""
              sx={{
                width: STRIP_AVATAR_RING,
                height: STRIP_AVATAR_RING,
                borderRadius: '999px',
                border: '2px solid',
                borderColor: isActive ? 'primary.main' : 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxSizing: 'border-box',
                transformOrigin: 'bottom center',
                position: 'relative',
              }}
            >
              {theme.badgeUrl ? (
                <Avatar src={theme.badgeUrl} alt={theme.themeName} sx={{ width: STRIP_AVATAR, height: STRIP_AVATAR }} />
              ) : (
                <Avatar sx={{ width: STRIP_AVATAR, height: STRIP_AVATAR, fontSize: STRIP_AVATAR_FONT }}>{theme.themeName?.[0] ?? 'T'}</Avatar>
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

const ROW_BORDER = {
  py: 1,
  borderBottom: '1px solid',
  borderColor: 'divider',
  minWidth: 0,
} as const;

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
        ...ROW_BORDER,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          width: 88,
          flexShrink: 0,
          color: 'text.secondary',
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {preview}
      </Box>
      <ShadeSwatches group={shadeGroup} />
      {hex ? (
        <Typography
          variant="caption"
          sx={{
            flexShrink: 0,
            color: 'text.secondary',
            fontFamily: 'monospace',
          }}
        >
          {hex}
        </Typography>
      ) : null}
    </Box>
  );
}

const ICON_SAMPLE_NAMES = ['favorite', 'home', 'settings', 'notifications', 'bolt'];

const ICON_COLOR_ROLES = [
  { label: 'Icon', key: 'icon' },
  { label: 'Primary', key: 'primary' },
  { label: 'Secondary', key: 'secondary' },
  { label: 'Success', key: 'success' },
  { label: 'Warning', key: 'warning' },
  { label: 'Error', key: 'error' },
  { label: 'Info', key: 'info' },
  { label: 'Text', key: 'text' },
] as const;

// Compact card used by the lower Palette grid: a small label, the live
// sample, and the hex when there is one.
function PaletteCell({
  label,
  hex,
  nodeId,
  children,
}: {
  label?: string;
  hex?: string;
  nodeId?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      data-gui-node-id={nodeId}
      sx={{
        minWidth: 0,
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      {label || hex ? (
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
          {label ? (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              {label}
            </Typography>
          ) : <span />}
          {hex ? (
            <Typography
              variant="caption"
              title={hex}
              sx={{ color: 'text.secondary', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {hex}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function PaletteTab({ nodeId }: { nodeId?: string }) {
  const theme = useGuiTheme();
  const palette: Record<string, any> = theme.palette as any;
  const qrId = nodeId ? `${nodeId}.qr` : 'theme.inspector.qr';

  return (
    <Box
      sx={{
        // flow-root contains the float. Rows stay siblings (not inside
        // their own column BFC) so they wrap beside the QR and then go
        // full width once they clear its bottom.
        display: { xs: 'flex', sm: 'flow-root' },
        flexDirection: { xs: 'column' },
      }}
    >
      <Box
        sx={{
          float: { xs: 'none', sm: 'left' },
          mr: { sm: 2 },
          mb: { xs: 1.5, sm: 1 },
          pt: 1,
        }}
      >
        <ThemeQrPreview nodeId={qrId} />
      </Box>
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
      <Box
        sx={{
          // Start the compact grid below the float so it is not indented
          // beside the QR.
          clear: { xs: 'none', sm: 'left' },
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 2,
          pt: 1.5,
          minWidth: 0,
        }}
      >
        <PaletteCell label="Text" nodeId={nodeId ? `${nodeId}.text` : undefined}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box
              data-gui-node-id={nodeId ? `${nodeId}.text.primary` : undefined}
              sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, minWidth: 0 }}
            >
              <Typography variant="body2" sx={{ minWidth: 0 }}>The quick brown fox</Typography>
              {palette.text?.primary ? (
                <Typography
                  variant="caption"
                  title={palette.text.primary}
                  sx={{ color: 'text.secondary', fontFamily: 'monospace', flexShrink: 0 }}
                >
                  {palette.text.primary}
                </Typography>
              ) : null}
            </Box>
            <Box
              data-gui-node-id={nodeId ? `${nodeId}.text.muted` : undefined}
              sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, minWidth: 0 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">The quick brown fox</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>(muted)</Typography>
              </Box>
              {palette.text?.secondary ? (
                <Typography
                  variant="caption"
                  title={palette.text.secondary}
                  sx={{ color: 'text.secondary', fontFamily: 'monospace', flexShrink: 0 }}
                >
                  {palette.text.secondary}
                </Typography>
              ) : null}
            </Box>
            <Box
              data-gui-node-id={nodeId ? `${nodeId}.link` : undefined}
              sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, minWidth: 0 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', minWidth: 0 }}>
                <Link href="#" onClick={(e: any) => e.preventDefault()}>Link</Link>
                {palette.link?.visited && (
                  <Link
                    href="#"
                    onClick={(e: any) => e.preventDefault()}
                    sx={{ color: palette.link.visited }}
                  >
                    Visited link
                  </Link>
                )}
              </Box>
              {(palette.link?.main ?? palette.primary?.main) ? (
                <Typography
                  variant="caption"
                  title={palette.link?.main ?? palette.primary?.main}
                  sx={{ color: 'text.secondary', fontFamily: 'monospace', flexShrink: 0 }}
                >
                  {palette.link?.main ?? palette.primary?.main}
                </Typography>
              ) : null}
            </Box>
          </Box>
        </PaletteCell>
        <PaletteCell label="Icons" nodeId={nodeId ? `${nodeId}.icons` : undefined}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {ICON_COLOR_ROLES.map(({ label, key }) => {
              const value = key === 'text' ? palette.text?.primary : palette[key]?.main;
              return (
                <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: 48 }}>
                  <Icon name="favorite" fontSize="1.3rem" style={{ color: value }} />
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.secondary', textAlign: 'center' }}>
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mt: 0.5 }}>
            Outlined vs. filled
          </Typography>
          <Box
            data-gui-node-id={nodeId ? `${nodeId}.icons.outlined` : undefined}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}
          >
            {ICON_SAMPLE_NAMES.map((name) => (
              <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon name={name} fontSize="1.3rem" fill={0} style={{ color: palette.icon?.main }} />
                <Icon name={name} fontSize="1.3rem" fill={1} style={{ color: palette.icon?.main }} />
              </Box>
            ))}
          </Box>
        </PaletteCell>
        <PaletteCell nodeId={nodeId ? `${nodeId}.surfaces` : undefined}>
          <Box data-gui-node-id={nodeId ? `${nodeId}.divider` : undefined} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Divider
            </Typography>
            <Divider sx={{ width: '100%' }} />
          </Box>
          <Box data-gui-node-id={nodeId ? `${nodeId}.background` : undefined} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Background</Typography>
              {palette.background?.default ? (
                <Typography
                  variant="caption"
                  title={palette.background.default}
                  sx={{ color: 'text.secondary', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {palette.background.default}
                </Typography>
              ) : null}
            </Box>
            <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 0.75, width: '100%' }}>
              <Typography variant="caption">Page background</Typography>
            </Box>
          </Box>
          <Box data-gui-node-id={nodeId ? `${nodeId}.surface` : undefined} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Surface</Typography>
              {palette.background?.paper ? (
                <Typography
                  variant="caption"
                  title={palette.background.paper}
                  sx={{ color: 'text.secondary', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {palette.background.paper}
                </Typography>
              ) : null}
            </Box>
            <Paper elevation={1} sx={{ px: 1.5, py: 0.75, width: '100%' }}>
              <Typography variant="caption">Card / paper surface</Typography>
            </Paper>
          </Box>
        </PaletteCell>
      </Box>
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


/** The same value the shell's .me QR encodes: the current namespace on its
 *  door, via `linkQrValue`. No namespace (launcher dialog, no shell) falls
 *  back to this page's origin — a real address, not a decorative URL. */
function useCurrentLinkQrValue(): { value: string; namespace: string } {
  const session = useOptionalSeedSession();
  const page = typeof window !== 'undefined' ? window.location.origin : '';
  const namespace = (
    session?.semanticNamespace
    || getActiveNamespaceRoot()
    || ''
  ).trim();
  const handle = session?.authenticated && session.semanticNamespace
    ? String(session.semanticNamespace).split('.')[0]
    : undefined;
  const endpoint = (session?.transportOrigin || page).trim();
  if (namespace && endpoint) {
    try {
      return { value: linkQrValue({ endpoint, namespace, handle }), namespace };
    } catch {
      return { value: endpoint, namespace };
    }
  }
  return { value: page, namespace };
}

function QrTokenCaption({ label, hex, nodeId }: { label: string; hex: string; nodeId: string }) {
  return (
    <Box
      data-gui-node-id={nodeId}
      sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: 0.25,
          bgcolor: hex,
          border: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        title={hex}
        sx={{ color: 'text.secondary', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {hex}
      </Typography>
    </Box>
  );
}

/** A compact .me QR painted with the active theme's QR ink and paper
 *  (the same `resolveQrMeColors` the corner QR uses). On the Palette
 *  tab it floats top-left, like an image in a document: rows wrap
 *  beside it, then go full width once they clear its bottom. */
function ThemeQrPreview({ nodeId }: { nodeId: string }) {
  const theme = useGuiTheme();
  const { value } = useCurrentLinkQrValue();
  const { qrFg, qrBg } = resolveQrMeColors(theme.palette, {});
  if (!value) return null;
  return (
    <Box
      data-gui-node-id={nodeId}
      data-gui-component="ThemeQrPreview"
      sx={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        maxWidth: { xs: 200, sm: 136 },
      }}
    >
      <QRme
        value={value}
        variant="xs"
        diameter={88}
        fitDiameter
        defaultFace="qr"
        hoverFlip={false}
        clickFlip={false}
        data-gui-node-id={`${nodeId}.code`}
        data-gui-component="QRme"
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, width: '100%', minWidth: 0 }}>
        <QrTokenCaption label="QR ink" hex={qrFg} nodeId={`${nodeId}.ink`} />
        <QrTokenCaption label="QR paper" hex={qrBg} nodeId={`${nodeId}.paper`} />
      </Box>
    </Box>
  );
}

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
      <ThemeStrip nodeId={nodeId} />
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
        {tab === 'palette' ? <PaletteTab nodeId={nodeId} /> : <TypographyTab />}
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
