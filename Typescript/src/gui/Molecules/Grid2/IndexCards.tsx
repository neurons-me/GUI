/**
 * Visual reproductions of the card designs on neurons-me.github.io
 * (published origin/main `docs/assets/index-gui.js`). Used only by the
 * Molecules/Grid2/Index Cards stories so each section can declare its own
 * Grid2 layout. Demo titles wrap with overflowWrap: 'anywhere' (the live
 * page still uses wordBreak: 'keep-all', which was cutting them off).
 */
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Card from '@/gui/Atoms/Card/Card';
import Chip from '@/gui/Atoms/Chip/Chip';
import Typography from '@/gui/Atoms/Typography/Typography';
import Link from '@/gui/Atoms/Link/Link';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import ThemeModeToggle from '@/gui/Theme/ToggleMode/ToggleMode';
import { GuiThemes } from '@/gui/Theme/utils/catalog';
import { useOptionalSelection } from '@/runtime/selection';
import QRme from '@/gui/All.This/me/QR/QR.me';
import Monad from '@/gui/All.This/monad.ai/monad.ai';
import Grid2 from './Grid2';
import type { Grid2Props } from './Grid2.types';
import walletSvg from './assets/wallet.svg?raw';
import allthisSvg from './assets/allthis.svg?raw';
import netgetLettersUrl from './assets/netget-letters.svg?url';

const CL = 'https://res.cloudinary.com/dkwnxf6gm/image/upload/';
const MEDIA = 'https://neurons-me.github.io/neurons-me/media/';
const GUI_DOCS = 'https://neurons-me.github.io/GUI/';
const MOBILE = '@media (max-width:480px)';

const HOLE = {
  bgcolor: 'background.default',
  boxShadow: (t: { palette: { mode: string } }) =>
    t.palette.mode === 'dark'
      ? 'inset 0 1px 3px rgba(0,0,0,0.45)'
      : 'inset 0 1px 3px rgba(15,23,32,0.10)',
} as const;

const ICON = { tile: 109, img: 91, small: { tile: 73, img: 58 } };

export const cardSx = {
  textDecoration: 'none',
  color: 'inherit',
  height: '100%',
  borderRadius: '12px',
  minWidth: 0,
  overflowWrap: 'anywhere' as const,
  transition: 'box-shadow 130ms ease, border-color 130ms ease, transform 130ms ease',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: 3,
    transform: 'translateY(-1px)',
    textDecoration: 'none',
  },
};

const TWO_LINES = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

const PALETTE_KEYS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

function ThemedImg({
  light,
  dark,
  src,
  alt,
  sx,
}: {
  light?: string;
  dark?: string;
  src?: string;
  alt?: string;
  sx?: object;
}) {
  const { mode } = useThemeContext();
  return (
    <Box
      component="img"
      src={src || (mode === 'dark' && dark ? dark : light)}
      alt={alt || ''}
      sx={sx}
    />
  );
}

function AudienceMark({ width = 38, height = 30 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 40 32" aria-hidden="true">
      <circle cx={15} cy={16} r={13} fill="#83d6ec" fillOpacity={0.82} />
      <circle cx={25} cy={16} r={13} fill="#f19b9b" fillOpacity={0.82} />
    </svg>
  );
}

function NetgetMark({ sx }: { sx?: object }) {
  const mask = `url(${netgetLettersUrl})`;
  return (
    <Box
      role="img"
      aria-hidden
      sx={{
        width: '100%',
        height: 'auto',
        display: 'block',
        flexShrink: 0,
        aspectRatio: '631 / 237',
        color: 'primary.main',
        bgcolor: 'currentColor',
        WebkitMaskImage: mask,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: mask,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        ...sx,
      }}
    />
  );
}

function WalletTile() {
  return (
    <Box
      aria-hidden
      sx={{
        width: '100%',
        height: ICON.tile,
        borderRadius: '18px',
        ...HOLE,
        flexShrink: 0,
        p: '6px',
        boxSizing: 'border-box',
        '& svg': { width: '100%', height: '100%', display: 'block' },
        '& .wl-pp': { fill: (t: any) => (t.palette.mode === 'dark' ? '#002991' : '#ffffff') },
        '& .wl-pp-edge': { fill: (t: any) => (t.palette.mode === 'dark' ? '#00124a' : '#9aa6b2') },
        '& .pp1': { fill: (t: any) => (t.palette.mode === 'dark' ? '#ffffff' : '#002991') },
        '& .pp2': { fill: (t: any) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.55)' : '#60CDFF') },
        '& .pp3': { fill: (t: any) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#008CFF') },
        '& .wl-coin': { fill: (t: any) => t.palette.primary.main },
        '& .wl-edge': { fill: (t: any) => t.palette.primary.main, filter: 'brightness(0.6)' },
        '& .wl-ring': { stroke: (t: any) => t.palette.background.default, strokeOpacity: 0.35 },
        '& .wl-sym': { fill: (t: any) => t.palette.background.default },
        '& .wl-line': { stroke: (t: any) => t.palette.text.secondary, strokeOpacity: 0.55, strokeWidth: 1.3 },
        '& .wl-root, & .wl-root-plus': { stroke: (t: any) => t.palette.primary.main },
        [MOBILE]: { width: ICON.small.tile, height: ICON.small.tile, borderRadius: '14px' },
      }}
      dangerouslySetInnerHTML={{ __html: walletSvg }}
    />
  );
}

function AllThisTile() {
  const cubeFills = Object.fromEntries(
    PALETTE_KEYS.map((key, i) => [
      `& .at-ncube${i} path`,
      { fill: (t: any) => (t.palette[key] && t.palette[key].main) || t.palette.primary.main },
    ]),
  );
  const strokes = Object.fromEntries(
    PALETTE_KEYS.map((key, i) => [
      `& .at-c${i}`,
      { stroke: (t: any) => (t.palette[key] && t.palette[key].main) || t.palette.primary.main },
    ]),
  );
  const nodes = Object.fromEntries(
    PALETTE_KEYS.map((key, i) => [
      `& .at-n${i}`,
      { fill: (t: any) => (t.palette[key] && t.palette[key].main) || t.palette.primary.main },
    ]),
  );
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: ICON.tile,
        borderRadius: '18px',
        ...HOLE,
        flexShrink: 0,
        overflow: 'hidden',
        '& svg': { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
        '& .at-star': { fill: (t: any) => (t.palette.mode === 'dark' ? '#dfe9f3' : t.palette.primary.dark || t.palette.primary.main) },
        '& .at-cube-t': { fill: (t: any) => t.palette.primary.main },
        '& .at-cube-l': { fill: (t: any) => t.palette.primary.main, filter: 'brightness(0.72)' },
        '& .at-cube-r': { fill: (t: any) => t.palette.primary.main, filter: 'brightness(0.5)' },
        '& .at-beam': { stroke: (t: any) => (t.palette.mode === 'dark' ? '#ffffff' : t.palette.primary.main), strokeOpacity: 0.9 },
        ...cubeFills,
        ...strokes,
        ...nodes,
        '& .at-glow0': { stopColor: (t: any) => (t.palette.mode === 'dark' ? '#ffffff' : t.palette.primary.main), stopOpacity: 0.95 },
        '& .at-glow1': { stopColor: (t: any) => t.palette.primary.main, stopOpacity: 0.55 },
        '& .at-glow2': { stopColor: (t: any) => t.palette.primary.main, stopOpacity: 0 },
        '& .at-rays': { stroke: (t: any) => (t.palette.mode === 'dark' ? '#ffffff' : t.palette.primary.main), strokeOpacity: 0.85 },
        '& .at-core': { fill: (t: any) => (t.palette.mode === 'dark' ? '#ffffff' : t.palette.background.paper) },
        [MOBILE]: {
          width: ICON.small.tile,
          height: ICON.small.tile,
          minHeight: ICON.small.tile,
          flex: 'none',
          borderRadius: '14px',
        },
      }}
      dangerouslySetInnerHTML={{ __html: allthisSvg }}
    />
  );
}

const BADGE = { max: 44, min: 16, gap: 6, grow: 0.15 };

function badgeSizeFor(inner: number) {
  const { max, min, gap, grow } = BADGE;
  const available = Math.max(0, inner);
  let s = Math.floor((available - 3 * gap) / (4 + grow));
  if (s > max) s = max;
  if (s < min) s = min;
  while (s > 1 && 4 * s + 3 * gap + s * grow > available) s -= 1;
  if (s < 1) s = 1;
  return Math.max(1, s - 1);
}

function ThemeBadge({ themeId, name, badgeUrl }: { themeId: string; name: string; badgeUrl?: string }) {
  const theme = useThemeContext();
  const on = !!(theme && theme.themeId === themeId);
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      <IconButton
        size="small"
        role="option"
        aria-selected={on}
        type="button"
        aria-label={`Theme ${name}`}
        title={name}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (theme && typeof theme.setThemeId === 'function' && themeId !== theme.themeId) {
            theme.setThemeId(themeId);
          }
        }}
        sx={{
          p: 0,
          width: '100%',
          height: '100%',
          minWidth: 0,
          borderRadius: '50%',
          overflow: 'visible',
          position: 'relative',
          zIndex: on ? 2 : 1,
          boxSizing: 'border-box',
          flexShrink: 0,
          outline: on ? '2px solid' : '2px solid transparent',
          outlineColor: on ? 'primary.main' : 'transparent',
          outlineOffset: 1,
          '&:hover': { bgcolor: 'transparent' },
        }}
      >
        {badgeUrl ? <Avatar src={badgeUrl} alt="" sx={{ width: '100%', height: '100%' }} /> : (name && name[0])}
      </IconButton>
    </Box>
  );
}

function ThemeBadgeGrid() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState(42);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const next = badgeSizeFor(el.getBoundingClientRect().width);
      setSize((prev) => (prev === next ? prev : next));
    };
    fit();
    if (typeof ResizeObserver !== 'function') return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const themes = GuiThemes.filter((t) => t && t.themeId);
  return (
    <Box
      ref={ref}
      role="listbox"
      aria-label="Themes"
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(4, ${size}px)`,
        gridAutoRows: `${size}px`,
        gap: `${BADGE.gap}px`,
        justifyContent: 'center',
        justifyItems: 'center',
        alignItems: 'center',
        alignContent: 'center',
        overflow: 'visible',
        position: 'relative',
        py: 0.15,
      }}
    >
      {themes.map((t) => {
        const id = t.themeId ?? '';
        if (!id) return null;
        return (
          <ThemeBadge
            key={id}
            themeId={id}
            name={t.themeName || id}
            badgeUrl={t.badgeUrl}
          />
        );
      })}
    </Box>
  );
}

function toolButton({
  label,
  icon,
  on,
  onClick,
}: {
  label: string;
  icon: string;
  on?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <IconButton
      type="button"
      size="small"
      color={on ? 'primary' : 'inherit'}
      aria-label={label}
      aria-pressed={!!on}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      sx={{ p: 0.5, borderRadius: 1, ...(on ? { bgcolor: 'action.selected' } : {}) }}
    >
      <Icon name={icon} fontSize={18} />
    </IconButton>
  );
}

function GuiPlayCard() {
  const sel = useOptionalSelection();
  const gridOn = Boolean(sel?.gridEnabled);
  const [insp, setInsp] = React.useState(() => Boolean(sel?.inspectorEnabled));
  return (
    <Card
      variant="outlined"
      data-gui-card="gui-play"
      sx={{
        ...cardSx,
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 0.75,
        px: 1.5,
        pt: 1.25,
        pb: 1,
        overflow: 'hidden',
        '&:hover': { borderColor: 'primary.main', boxShadow: 3, transform: 'none', textDecoration: 'none' },
        [MOBILE]: { px: 0.75, py: 1, gap: 0.5 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75, minWidth: 0 }}>
        <Link
          href={GUI_DOCS}
          underline="hover"
          color="inherit"
          aria-label=".GUI docs"
          sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, minWidth: 0, [MOBILE]: { fontSize: '0.8rem' } }}
        >
          .GUI
        </Link>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Link href={GUI_DOCS} underline="hover" color="primary" aria-label=".GUI docs" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
            Docs
          </Link>
          <Link
            href={GUI_DOCS}
            aria-label=".GUI docs"
            title=".GUI docs"
            sx={{ display: 'inline-flex', alignItems: 'center', color: 'primary.main', lineHeight: 0, '&:hover': { opacity: 0.85 } }}
          >
            <Icon name="settings" fontSize={18} />
          </Link>
        </Box>
      </Box>
      <ThemeBadgeGrid />
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.25, mt: 0.25 }}
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <ThemeModeToggle variant="switchMinimal" iconSize="small" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {toolButton({
            label: insp ? 'Inspector on' : 'Inspector off',
            icon: 'code',
            on: insp,
            onClick: () => {
              if (sel && typeof sel.setInspectorEnabled === 'function') sel.setInspectorEnabled(!insp);
              setInsp((v) => !v);
            },
          })}
          {sel
            ? toolButton({
                label: gridOn ? 'Grid on' : 'Grid off',
                icon: 'grid_on',
                on: gridOn,
                onClick: () => {
                  if (typeof sel.setGridEnabled === 'function') sel.setGridEnabled(!gridOn);
                },
              })
            : null}
        </Box>
      </Box>
    </Card>
  );
}


/** Same default the live index uses for the orb's visual pattern — not a secret. */
const ME_ORB_SEED = 'jabellae';

/**
 * The .me card's mark: GUI.Widgets.Monad, variant "identity", kind "me",
 * as on neurons-me.github.io (index-gui.js MeMonad). Follows theme primary.
 * Hover QR tooltip is hidden (the title is already a link).
 */
function MeMonad({ alt }: { alt: string }) {
  const q = '(max-width:480px)';
  const [small, setSmall] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(q).matches,
  );
  React.useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setSmall(m.matches);
    if (m.addEventListener) m.addEventListener('change', on);
    else m.addListener(on);
    return () => {
      if (m.removeEventListener) m.removeEventListener('change', on);
      else m.removeListener(on);
    };
  }, []);
  const box = small ? ICON.small.tile : ICON.tile;
  const orb = small ? ICON.small.img + 3 : ICON.img;
  const blob: Record<string, string> = {
    '0%,100%': '50%',
    '25%': '55% 45% 60% 40% / 60% 55% 45% 40%',
    '50%': '50% 60% 40% 55% / 55% 40% 60% 45%',
    '75%': '45% 55% 40% 60% / 40% 60% 55% 50%',
  };
  const lift: Record<string, [number, number]> = {
    '0%,100%': [0, 1],
    '25%': [-2, 1.02],
    '50%': [-3, 1.04],
    '75%': [-2, 1.02],
  };
  return (
    <Box
      role="img"
      aria-label={alt}
      sx={(t) => {
        const dark = t.palette.mode === 'dark';
        const halo = dark ? '255,255,255' : '0,90,122';
        return {
          position: 'relative',
          zIndex: 0,
          isolation: 'isolate',
          width: box,
          height: box,
          display: 'flex',
          '@keyframes meOrbFloat': Object.fromEntries(
            Object.keys(blob).map((k) => [
              k,
              { transform: `translateY(${lift[k][0]}px) scale(${lift[k][1]})`, borderRadius: blob[k] },
            ]),
          ),
          '@keyframes meOrbHalo': {
            '0%,100%': { boxShadow: `0 0 2px rgba(${halo},0.10)` },
            '50%': { boxShadow: `0 0 4px rgba(${halo},0.16)` },
          },
          '& .monad-tooltip': { display: 'none' },
          '& div': { opacity: '1 !important' },
          '& div:has(> div[aria-hidden=true])': {
            animation: 'meOrbFloat 6s ease-in-out infinite, meOrbHalo 4.5s ease-in-out infinite !important',
            '&:hover': { transform: 'none' },
          },
          '& div[aria-hidden=true]': { width: '80% !important', height: '80% !important', borderRadius: 'inherit' },
          '& div[aria-hidden=true] > div:first-of-type': {
            borderRadius: 'inherit !important',
            borderWidth: `${small ? 2 : 2.5}px !important`,
            boxShadow: dark
              ? '0 0 3px rgba(180,230,230,0.22) !important'
              : '0 0 3px rgba(0,90,122,0.18) !important',
          },
          '& div[aria-hidden=true] > div:last-of-type': {
            width: '22% !important',
            height: '22% !important',
            boxShadow: dark
              ? '0 0 3px rgba(234,252,250,0.35) !important'
              : '0 0 3px rgba(0,90,122,0.3) !important',
          },
        };
      }}
    >
      <Monad
        variant="identity"
        kind="me"
        seed={ME_ORB_SEED}
        mode="contained"
        size={Math.round((orb * 34) / 60)}
        tooltip={false}
      />
    </Box>
  );
}

/**
 * The .me card's field, as on the live index (MeIdentityField): placeholder
 * "username", dashed underline. Focusing it (or typing a name) reveals a
 * secret field as type="password" — dots only, never clear text. The secret
 * stays in component state, is not persisted, and is never logged or sent.
 * This story does not open a real .me from the secret.
 */
function MeIdentityField() {
  const [username, setUsername] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [secret, setSecret] = React.useState('');
  const secretRef = React.useRef<HTMLInputElement | null>(null);
  const field = (t: { palette: { text: { primary: string; secondary: string }; divider: string; primary: { main: string } } }) => ({
    font: 'inherit',
    fontSize: '0.825rem',
    lineHeight: 1.4,
    color: t.palette.text.primary,
    background: 'transparent',
    border: 0,
    borderBottom: `1px dashed ${t.palette.divider}`,
    outline: 'none',
    width: '100%',
    padding: 0,
    height: '1.5em',
    boxSizing: 'border-box',
    '&::placeholder': { color: t.palette.text.secondary, opacity: 1 },
    '&:focus': { borderBottomColor: t.palette.primary.main },
  });
  const showSecret = focused || !!username || !!secret;
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      <Box
        component="input"
        type="text"
        value={username}
        placeholder="username"
        aria-label="username"
        autoComplete="username"
        spellCheck={false}
        autoCapitalize="none"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' && secretRef.current) secretRef.current.focus();
        }}
        sx={field}
      />
      {showSecret ? (
        <Box
          component="input"
          type="password"
          ref={secretRef}
          value={secret}
          placeholder="secret"
          aria-label="secret"
          autoComplete="off"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecret(e.target.value)}
          sx={field}
        />
      ) : null}
    </Box>
  );
}

type StackIcon = {
  monad?: boolean;
  qr?: string;
  bubble?: boolean;
  gui?: boolean;
  netget?: boolean;
  wallet?: boolean;
  graph?: boolean;
  light?: string;
  dark?: string;
};

function StackCard({
  title,
  desc,
  href,
  img,
  allThis,
}: {
  title: string;
  desc: string;
  href: string;
  img: StackIcon;
  allThis?: boolean;
}) {
  if (img.gui) return <GuiPlayCard />;
  if (img.netget) {
    return (
      <Card
        component="a"
        href={href}
        title="netget"
        aria-label={`netget — ${desc}`}
        variant="outlined"
        sx={{
          ...cardSx,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          px: 1.25,
          borderWidth: '3px',
          borderColor: 'primary.main',
          bgcolor: 'transparent',
          backgroundImage: 'none',
          [MOBILE]: { px: 0.5, py: 1.5 },
        }}
      >
        <NetgetMark sx={{ display: 'block', width: '78% !important', alignSelf: 'center', maxHeight: '100%', minHeight: 0, flexShrink: 1 }} />
      </Card>
    );
  }
  const meCard = !!img.monad;
  return (
    <Card
      component={meCard ? 'div' : 'a'}
      href={meCard ? undefined : href}
      aria-label={img.qr ? `${title} — ${desc}` : undefined}
      title={img.qr ? title : undefined}
      variant="outlined"
      sx={{
        ...cardSx,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        px: 2,
        pt: 1.5,
        pb: 1,
        ...(meCard ? { cursor: 'default', '&:hover': { transform: 'none' } } : {}),
        ...(img.qr ? { alignItems: 'center', justifyContent: 'center', p: '3px' } : {}),
        ...(allThis
          ? { borderColor: 'text.disabled', background: 'linear-gradient(180deg, rgba(127,127,127,0.02), rgba(127,127,127,0.06))' }
          : {}),
        [MOBILE]: {
          alignItems: 'center',
          textAlign: 'center',
          gap: 0.75,
          px: 0.75,
          py: 1.5,
          ...(img.qr ? { gap: 0.25, py: 1, justifyContent: 'center' } : {}),
        },
      }}
    >
      {img.wallet ? (
        <WalletTile />
      ) : img.graph ? (
        <AllThisTile />
      ) : (
        <Box
          sx={{
            width: ICON.tile,
            height: ICON.tile,
            borderRadius: '18px',
            ...HOLE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            ...(img.qr ? { width: '100%', height: 'auto', flex: 1, alignSelf: 'stretch', borderRadius: '10px' } : {}),
            [MOBILE]: img.qr
              ? { width: 'auto', height: 'auto', p: '4px', borderRadius: '14px' }
              : { width: ICON.small.tile, height: ICON.small.tile, borderRadius: '14px' },
          }}
        >
          {img.qr ? (
            <QRme value={img.qr} diameter={125} fitDiameter />
          ) : img.monad ? (
            <MeMonad alt={title} />
          ) : (
            <ThemedImg
              light={img.light}
              dark={img.dark}
              alt={title}
              sx={{
                width: ICON.img,
                height: ICON.img,
                objectFit: 'contain',
                [MOBILE]: { width: ICON.small.img, height: ICON.small.img },
              }}
            />
          )}
        </Box>
      )}
      {img.qr ? null : (
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: allThis ? 800 : 700,
            fontSize: '0.95rem',
            lineHeight: 1.25,
            mt: 0.25,
            minWidth: 0,
            overflowWrap: 'anywhere',
            ...(allThis ? { textAlign: 'center' } : {}),
            [MOBILE]:
              title.length > 12
                ? { mt: 0, fontSize: '0.8rem', overflowWrap: 'anywhere', whiteSpace: 'normal' }
                : { mt: 0, fontSize: '0.8rem', overflowWrap: 'anywhere' },
          }}
        >
          {meCard ? (
            <Link href={href} underline="hover" color="inherit">
              {title}
            </Link>
          ) : (
            title
          )}
        </Typography>
      )}
      {img.graph || img.qr ? null : meCard ? (
        <Box sx={{ minWidth: 0, [MOBILE]: { display: 'none' } }}>
          <MeIdentityField />
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ ...TWO_LINES, fontSize: '0.825rem', lineHeight: 1.5, [MOBILE]: { display: 'none' } }}
        >
          {desc}
        </Typography>
      )}
    </Card>
  );
}

export function DemoCard({ title, href, img }: { title: string; href: string; img: string }) {
  return (
    <Card
      component="a"
      href={href}
      variant="outlined"
      sx={{
        ...cardSx,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 140,
        overflow: 'hidden',
        p: 0,
      }}
    >
      <Box
        component="img"
        src={img}
        alt=""
        sx={{
          width: 'clamp(140px, 45%, 240px)',
          height: 'auto',
          aspectRatio: '2 / 3',
          minHeight: 140,
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          p: 'clamp(14px, 2vw, 20px) clamp(20px, 3vw, 40px) clamp(14px, 2vw, 20px) clamp(14px, 2vw, 24px)',
        }}
      >
        <Typography
          component="span"
          sx={{
            fontWeight: 900,
            fontSize: 'clamp(0.95rem, 1vw + 0.75rem, 1.2rem)',
            lineHeight: 1.15,
            // Fix vs the live page (overflowWrap: normal, wordBreak: keep-all),
            // which cut titles like "Robots that understand .me" on mid widths.
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            hyphens: 'auto',
            minWidth: 0,
          }}
        >
          {title}
        </Typography>
      </Box>
    </Card>
  );
}

type ResourceIcon =
  | { img: { light?: string; dark?: string } | { light: string }; plate?: string }
  | { glyph: string; size?: string }
  | { mark: true; small?: boolean };

function IconBox({ icon }: { icon: ResourceIcon }) {
  let inner: React.ReactNode;
  if ('img' in icon && icon.img) {
    const img = icon.img as { light?: string; dark?: string };
    inner = <ThemedImg light={img.light} dark={img.dark} sx={{ width: 38, height: 38, objectFit: 'contain' }} />;
  } else if ('mark' in icon && icon.mark) {
    inner = <AudienceMark width={'small' in icon && icon.small ? 34 : 38} height={'small' in icon && icon.small ? 27 : 30} />;
  } else if ('glyph' in icon) {
    inner = (
      <Typography component="span" sx={{ fontSize: icon.size || '1.6rem', lineHeight: 1 }}>
        {icon.glyph}
      </Typography>
    );
  }
  const plate = 'plate' in icon ? icon.plate : undefined;
  return (
    <Box
      sx={{
        width: 50,
        height: 50,
        borderRadius: '10px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...(plate ? { bgcolor: plate } : HOLE),
      }}
    >
      {inner}
    </Box>
  );
}

function descNode(d: string | Array<string | { code: string }>) {
  const parts = Array.isArray(d) ? d : [d];
  return (
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.4, minWidth: 0, overflowWrap: 'anywhere' }}>
      {parts.map((x, i) =>
        typeof x === 'string' ? (
          <React.Fragment key={i}>{x}</React.Fragment>
        ) : (
          <Box
            key={i}
            component="code"
            sx={{ fontFamily: 'monospace', fontSize: '0.95em', px: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}
          >
            {x.code}
          </Box>
        ),
      )}
    </Typography>
  );
}

export function ResourceCard({
  title,
  desc,
  href,
  icon,
  chips,
}: {
  title: string;
  desc: string | Array<string | { code: string }>;
  href: string;
  icon: ResourceIcon;
  chips?: [string, string][];
}) {
  const card = (
    <Card
      component="a"
      href={href}
      variant="outlined"
      sx={{ ...cardSx, display: 'flex', alignItems: 'center', gap: 1.75, px: 2, py: 1.75, minHeight: 78 }}
    >
      <IconBox icon={icon} />
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: 0.25, ...(chips ? { pr: 8 } : {}) }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, minWidth: 0, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {descNode(desc)}
      </Box>
    </Card>
  );
  if (!chips) return card;
  return (
    <Box sx={{ position: 'relative', height: '100%', minWidth: 0 }}>
      {card}
      <Box sx={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '42%' }}>
        {chips.map(([t, u]) => (
          <Box key={t} component="a" href={u} sx={{ textDecoration: 'none' }}>
            <Chip
              label={t}
              clickable
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export const STACK: Array<{ title: string; desc: string; href: string; img: StackIcon; allThis?: boolean }> = [
  { title: '.me', desc: 'Who am I.', href: 'https://neurons-me.github.io/.me/', img: { monad: true, light: CL + 'v1761149332/this.me-removebg-preview_2_j1eoiy.png', dark: CL + 'v1760758662/this.me-removebg-preview_fvyeda.png' } },
  { title: 'cleaker', desc: 'Here.', href: 'https://neurons-me.github.io/Cleaker/', img: { qr: 'https://cleaker.me', light: CL + 'v1765054949/cleaker.me_gusn1q.png' } },
  { title: 'monad', desc: 'Daemons.', href: 'https://neurons-me.github.io/monad/', img: { bubble: true, light: CL + 'v1778090977/monad.ai.profile-removebg-preview_np26yp.png' } },
  { title: '.GUI', desc: 'Generative UI.', href: GUI_DOCS, img: { gui: true } },
  { title: 'netget', desc: 'The Gateway.', href: 'https://neurons-me.github.io/netget/', img: { netget: true } },
  { title: 'mlearning.studio', desc: 'Training data.', href: 'https://neurons-me.github.io/mlearning.studio/', img: { light: 'https://neurons-me.github.io/assets/mlearning-studio-icon.webp' } },
  { title: '.wallet', desc: 'for .me', href: 'https://neurons-me.github.io/.wallet/', img: { wallet: true, light: CL + 'v1765902981/this.wallet_giyxtt.webp' } },
  { title: 'All.This', desc: 'Learn more...', href: 'https://github.com/neurons-me', img: { graph: true, light: CL + 'v1765903003/all.this_sr55ml.webp' }, allThis: true },
];

export const DEMOS: Array<[string, string, string]> = [
  ['Robots that understand .me', 'https://neurons-me.github.io/robots/', 'https://neurons-me.github.io/.me/Demos/Robots/Space/assets/space-robots-og-4.2.png'],
  ['Smart Cities', 'https://neurons-me.github.io/smart-cities/', MEDIA + 'smart_cities.gif'],
  ['Social Graphs', 'https://neurons-me.github.io/social-graphs/', MEDIA + 'SocialGraph.jpg'],
  ['Digital Space Algebra', 'https://neurons-me.github.io/digital-space-algebra/', MEDIA + 'Encrypted_Audience_Algebra.gif'],
  ['Wallet Split', 'https://neurons-me.github.io/.me/Typescript/typedocs/examples/WalletSplit.html', MEDIA + 'split_bill_wallet.gif'],
  ['Affinity Model', 'https://neurons-me.github.io/.me/Typescript/typedocs/examples/Affinity-Model.html', MEDIA + 'affinity_model.gif'],
];

const SI = (slug: string, light: string, dark?: string) => ({
  light: `https://cdn.simpleicons.org/${slug}/${light}`,
  dark: `https://cdn.simpleicons.org/${slug}/${dark || 'ffffff'}`,
});

const code = (t: string) => ({ code: t });

export const ARCH = [
  { title: 'Identity-Bound Secrets', desc: 'Proposed design for private roots, secret scopes, noise, and persistence — with package responsibilities and 11 acceptance criteria.', href: 'https://neurons-me.github.io/architecture/identity-bound-secrets/', icon: { glyph: '🔐', size: '1.6rem' } as ResourceIcon },
  { title: 'Benchmarks', desc: 'The .me benchmark hub: kernel benchmarks, GTFS / Madrid on real transit data, the performance phases (disk, write pressure, vector search) and secret-scope cost, each with its script and kernel version.', href: 'https://neurons-me.github.io/.me/docs/Benchmarks/', icon: { img: SI('speedtest', '0f1720') } as ResourceIcon },
];

export const NRP = [
  { title: 'NRP · Namespace Resolution Protocol', desc: ['Mesh-aware resolution for ', code('me://'), ' paths — discover, score, forward, learn. A living network of monads, not a static DNS table.'] as Array<string | { code: string }>, href: 'https://neurons-me.github.io/NRP/', icon: { glyph: '○', size: '2.3rem' } as ResourceIcon },
  { title: "Axioms · The Kernel's Invariants", desc: ['The non-negotiable guarantees ', code('.me'), ' is built on — stealth disclosure, hash-chain integrity, deterministic conflict resolution.'] as Array<string | { code: string }>, href: 'https://neurons-me.github.io/.me/docs/Axioms.html', icon: { glyph: '𓊽', size: '1.8rem' } as ResourceIcon },
];

export const ESSAYS: Array<{
  title: string;
  desc: string;
  href: string;
  icon: ResourceIcon;
  chips?: [string, string][];
}> = [
  { title: 'The Algebra of Encrypted Audiences III', desc: 'Two islands, one shared space — the connection between identities emerges from a verifiable intersection between their contexts, not from a central authority.', href: 'https://neurons-me.github.io/encrypted-audiences/', icon: { mark: true }, chips: [['ES', 'https://neurons-me.github.io/algebra_audiencias_cifradas.html'], ['JA', 'https://neurons-me.github.io/algebra_of_encrypted_audiences_ja.html']] },
  { title: 'The Equations — Visual Infographics Edition', desc: 'Every original formula on sui.gn, one glossary — context algebra, SpaceStructure, audience algebra, O(k) — imported results clearly marked, not claimed.', href: 'https://neurons-me.github.io/Equations-Visual-Infographics-Edition.html', icon: { glyph: 'Σ', size: '1.8rem' }, chips: [['ES', 'https://neurons-me.github.io/Equations-Visual-Infographics-Edition_es.html'], ['JA', 'https://neurons-me.github.io/Equations-Visual-Infographics-Edition_ja.html']] },
  { title: 'Inverted Dependency Indexing — Visualized', desc: "Why changing 1 node in 1,000,000 touches only 6, not 1,000,000 — the .me kernel's reverse index and O(k) mutation cost, in a hand-drawn precision visualization.", href: 'https://neurons-me.github.io/Inverted-Dependency-Indexing-Beautiful-Viz.html', icon: { glyph: '◉', size: '1.6rem' } },
  { title: 'Robots × Encrypted Audiences — Infographic', desc: 'One canister, four robots, one context graph — how .me paths let robots share meaning through pointers, mapped onto the algebra of encrypted audiences.', href: 'https://neurons-me.github.io/Robots-%C3%97-Encrypted-Audiences-Infographic.html', icon: { mark: true, small: true } },
  { title: 'Smart Cities — A City That Behaves Like a Living System', desc: 'Syntax, Madrid GTFS, and human fares — city data as live .me dependencies. Start at the Smart Cities hub.', href: 'https://neurons-me.github.io/smart-cities/', icon: { glyph: '🏙️', size: '1.6rem' } },
  { title: 'me.explain() — Why Did You Say That?', desc: 'AI chain-of-thought is generated narration, not a record of computation. me.explain() is a verifiable lookup into the actual dependency graph — story vs. ledger.', href: 'https://neurons-me.github.io/me.explain.why.did.you.say.that.html', icon: { glyph: '🔍', size: '1.6rem' } },
  { title: 'me.explain(path)', desc: 'The minimal version: the call, the return shape, one line on what it means — for when you just need the syntax.', href: 'https://neurons-me.github.io/me.explain.html', icon: { glyph: '🔍', size: '1.6rem' } },
  { title: 'me.whatever(what)', desc: 'The calling syntax of .me — Subject-Verb-Object path calls and the operator table (@, _, ~, ->, =, ?, -), minimal.', href: 'https://neurons-me.github.io/me.whatever.what.html', icon: { glyph: '🔤', size: '1.6rem' } },
  { title: 'Namespace', desc: "Which tree of meaning you're addressing — <handle>.<root>, resolved from identity, never guessed from the URL.", href: 'https://neurons-me.github.io/Namespace.html', icon: { glyph: '🧭', size: '1.6rem' } },
  { title: 'Get .me started', desc: 'Install .me and build your first kernel — TypeScript, Rust, or Python (not yet available), one clone away.', href: 'https://neurons-me.github.io/Get.me.started.html', icon: { glyph: '🚀', size: '1.6rem' } },
  { title: 'SEED → Monad — Minimal, Pure, Sovereign', desc: 'What a seed actually is, what grows from it — identityHash, the monad bubble — and what it does not protect.', href: 'https://neurons-me.github.io/SEED-Monad-Minimal.html', icon: { glyph: '◎', size: '1.6rem' } },
  { title: 'README-—-Zero-Marketing.html', desc: 'me.users.ana.age(22) me.people["[i]"]["="]("isAdult","age>=18") me("people[age>=18].name")', href: 'https://neurons-me.github.io/README-—-Zero-Marketing.html', icon: { glyph: '∴', size: '1.6rem' } },
];

export const NETWORK = [
  { title: 'neurons.me', desc: 'The live network. Run a monad. Claim your namespace.', href: 'https://neurons.me', icon: { img: { light: CL + 'v1760629040/media.neurons.me_copy_tgilfg.png' }, plate: '#e8edf2' } as ResourceIcon },
];

const SOURCES: Array<[string, string, { light: string; dark?: string }]> = [
  ['npm: @neurons.me', 'https://www.npmjs.com/org/neurons.me', { light: 'https://cdn.simpleicons.org/npm/CB3837' }],
  ['GitHub: neurons-me', 'https://github.com/neurons-me', SI('github', '0f1720')],
  ['PyPI: neurons.me', 'https://pypi.org/user/neurons.me/', { light: 'https://cdn.simpleicons.org/pypi/3775A9' }],
  ['crates.io: neurons-me', 'https://crates.io/users/neurons-me', SI('rust', '0f1720')],
];

export function SectionLabel({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Typography
      variant="overline"
      component="h2"
      color="text.secondary"
      sx={{ display: 'block', letterSpacing: '0.14em', fontWeight: 700, lineHeight: 1.6, fontSize: '0.7rem', ...sx }}
    >
      {children}
    </Typography>
  );
}

function SourceNav() {
  return (
    <Box
      component="nav"
      aria-label="Source code"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}
    >
      <SectionLabel sx={{ mb: 0, mr: 0.5 }}>Source Code</SectionLabel>
      {SOURCES.map(([aria, href, img]) => (
        <Link
          key={aria}
          href={href}
          title={aria}
          aria-label={aria}
          underline="none"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            ...HOLE,
            opacity: 0.9,
            '&:hover': { opacity: 1, bgcolor: 'action.selected' },
          }}
        >
          <ThemedImg {...img} sx={{ width: 18, height: 18, objectFit: 'contain', display: 'block' }} />
        </Link>
      ))}
    </Box>
  );
}

const itemSx = { minWidth: 0, maxWidth: '100%' } as const;

/** Docs: 4 / row at md, 3 at sm, 2 at xs. */
export const DOCS_SIZE: Grid2Props['size'] = { xs: 6, sm: 4, md: 3 };
/** Demos: 3 / row at md, 2 at sm, 1 at xs. */
export const DEMOS_SIZE: Grid2Props['size'] = { xs: 12, sm: 6, md: 4 };
/** Architecture, NRP, Essays: 2 / row from sm up, 1 at xs. */
export const TWO_COL_SIZE: Grid2Props['size'] = { xs: 12, sm: 6 };
/** Network: a single column. */
export const NETWORK_SIZE: Grid2Props['size'] = { xs: 12 };

export function IndexCardsPage() {
  return (
    <Box
      sx={{
        maxWidth: 960,
        mx: 'auto',
        px: { xs: 1.5, sm: 2 },
        py: 3,
        bgcolor: 'background.default',
        color: 'text.primary',
        boxSizing: 'border-box',
        width: '100%',
        overflowWrap: 'anywhere',
      }}
    >
      <Box component="section">
        <Link
          href="https://neurons-me.github.io/docs/"
          underline="hover"
          color="inherit"
          sx={{ display: 'inline-block', mb: 1.75, color: 'text.secondary' }}
        >
          <SectionLabel sx={{ mb: 0 }}>Docs</SectionLabel>
        </Link>
        <Grid2 container spacing={2} columns={12}>
          {STACK.map((c) => (
            <Grid2 key={c.title} size={DOCS_SIZE} sx={itemSx}>
              <StackCard {...c} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Box component="section" sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.75 }}>
          <SectionLabel sx={{ mb: 0 }}>Demos</SectionLabel>
          <SourceNav />
        </Box>
        <Grid2 container spacing={2} columns={12}>
          {DEMOS.map(([title, href, img]) => (
            <Grid2 key={title} size={DEMOS_SIZE} sx={itemSx}>
              <DemoCard title={title} href={href} img={img} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Box component="section" sx={{ mt: 5 }}>
        <SectionLabel sx={{ mb: 1.75 }}>Architecture & Benchmarks</SectionLabel>
        <Grid2 container spacing={2} columns={12}>
          {ARCH.map((c) => (
            <Grid2 key={c.title} size={TWO_COL_SIZE} sx={itemSx}>
              <ResourceCard {...c} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Box component="section" sx={{ mt: 5 }}>
        <SectionLabel sx={{ mb: 1.75 }}>NRP & Axioms</SectionLabel>
        <Grid2 container spacing={2} columns={12}>
          {NRP.map((c) => (
            <Grid2 key={c.title} size={TWO_COL_SIZE} sx={itemSx}>
              <ResourceCard {...c} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Box component="section" sx={{ mt: 5 }}>
        <SectionLabel sx={{ mb: 1.75 }}>Essays & Notation</SectionLabel>
        <Grid2 container spacing={2} columns={12}>
          {ESSAYS.map((c) => (
            <Grid2 key={c.title} size={TWO_COL_SIZE} sx={itemSx}>
              <ResourceCard {...c} />
            </Grid2>
          ))}
        </Grid2>
      </Box>

      <Box component="section" sx={{ mt: 5 }}>
        <SectionLabel sx={{ mb: 1.75 }}>Network</SectionLabel>
        <Grid2 container spacing={2} columns={12}>
          {NETWORK.map((c) => (
            <Grid2 key={c.title} size={NETWORK_SIZE} sx={itemSx}>
              <ResourceCard {...c} />
            </Grid2>
          ))}
        </Grid2>
      </Box>
    </Box>
  );
}

export { StackCard };
