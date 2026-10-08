import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@mui/material/styles';
import { makeMuiTheme } from '@/gui/Theme/fromTokens';
import { themeTokens } from '@/gui/Theme/styles/theme.tokens';
import { GuiThemes } from '@/gui/Theme/utils/catalog';
import OpenStreetMap from './OpenStreetMap';
import type { OsmBasemap } from './OpenStreetMap';
import { createOsmProjection } from './projection';
import { buildOsmPalette, contrast } from './mapPalette';
import { VERACRUZ_BASEMAP, VERACRUZ_FRAME, VERACRUZ_NODES, VERACRUZ_SOURCE } from './OpenStreetMap.veracruz.fixture';

// Demo frame only: two hand-written strokes stand in for a project's
// pre-projected basemap (a real page passes the layers its own generator made).
// Their colours come from the theme (layer ids → kinds); the styles below only
// carry stroke widths and caps.
const BBOX = { south: 19.192, west: -96.142, north: 19.205, east: -96.122 };
const DEMO_BASEMAP: OsmBasemap = {
  layers: [
    { id: 'roads-primary', style: { strokeWidth: 2, strokeLinecap: 'round' }, paths: ['M24,700 L600,400 L1176,120', 'M300,24 L420,776'] },
    { id: 'places', circles: [{ cx: 600, cy: 400, r: 3 }] },
  ],
};

const meta: Meta<typeof OpenStreetMap> = {
  title: 'Compounds/OpenStreetMap',
  component: OpenStreetMap,
  tags: ['autodocs'],
  // No <Theme> here: the global preview decorator already provides it, so the
  // toolbar's Mode (light/dark) drives these stories. Stories that set
  // `parameters.osmFrame: false` size themselves.
  decorators: [
    (Story: any, ctx: any) =>
      ctx.parameters?.osmFrame === false ? (
        <Story />
      ) : (
        <div style={{ height: 420, width: '100%' }}>
          <Story />
        </div>
      ),
  ],
  args: {
    bbox: BBOX,
    width: 1200,
    height: 800,
    pad: 24,
    basemap: DEMO_BASEMAP,
    source: { dataSource: 'demo strokes (not real OSM data)', license: 'ODbL' },
  },
};

export default meta;
type Story = StoryObj<typeof OpenStreetMap>;

export const Markers: Story = {
  render: (args) => (
    <OpenStreetMap {...args}>
      <OpenStreetMap.Marker lat={19.1985} lon={-96.132} shape="circle" size={20} tone="primary" label="circle" meta="tone=primary" />
      <OpenStreetMap.Marker lat={19.202} lon={-96.137} shape="square" size={16} tone="success" label="square" meta="tone=success" />
      <OpenStreetMap.Marker lat={19.195} lon={-96.126} shape="triangle" size={18} tone="warning" label="triangle" meta="tone=warning" labelPlacement="left" />
      <OpenStreetMap.Marker lat={19.2} lon={-96.127} shape="icon" icon="directions_boat" size={22} tone="info" label="GUI.Icon" meta="tone=info" />
      <OpenStreetMap.Marker lat={19.1955} lon={-96.137} shape="circle" size={14} color="#c9b87e" label="color=#c9b87e" meta="explicit colour (legacy)" />
    </OpenStreetMap>
  ),
};

export const CanvasLayer: Story = {
  render: (args) => (
    <OpenStreetMap {...args}>
      <OpenStreetMap.Canvas
        onFrame={({ ctx, now, project, palette, markerScale }) => {
          const p = project(19.1985 + 0.004 * Math.sin(now / 900), -96.132 + 0.006 * Math.cos(now / 900));
          ctx.fillStyle = palette.tones.secondary;
          ctx.beginPath();
          // markerScale keeps the dot the same on-screen size as markers at any zoom
          ctx.arc(p.x, p.y, 6 * markerScale, 0, Math.PI * 2);
          ctx.fill();
        }}
      />
    </OpenStreetMap>
  ),
};

// Real data: a trimmed copy of the Veracruz port basemap (build_basemap.py
// output, © OpenStreetMap contributors, ODbL) with the port page's main nodes.
// Node positions are the page's map pixels, unprojected with the map's own
// projection, exactly as port-gui.js does. Tones replace the page's
// `.node.ship / .train / .port / .yard / .queue` CSS, states its `.busy / .done / .hl`.
const VERACRUZ_PROJ = createOsmProjection(VERACRUZ_FRAME);
function VeracruzMarkers() {
  return (
    <>
      {VERACRUZ_NODES.map((n) => {
        const { lat, lon } = VERACRUZ_PROJ.unproject(n.x, n.y);
        return (
          <OpenStreetMap.Marker
            key={n.id}
            id={n.id}
            lat={lat}
            lon={lon}
            shape={n.shape}
            size={n.size}
            width={n.width}
            height={n.height}
            tone={n.tone}
            state={n.state}
            icon={n.icon}
            label={n.label}
            meta={n.meta}
            labelPlacement={n.place ?? 'right'}
            labelOffset={n.gap}
          />
        );
      })}
    </>
  );
}

const VERACRUZ_ARGS = {
  ...VERACRUZ_FRAME,
  basemap: VERACRUZ_BASEMAP,
  source: VERACRUZ_SOURCE,
  ariaLabel: 'Port of Veracruz (OpenStreetMap basemap)',
};

/**
 * The real Veracruz port basemap with the port page's main nodes, in the
 * colours of the theme in scope: switch the toolbar Mode to see light / dark.
 * Tones: port, ship, train, queue, yard. States: highlight (port), busy (SHIP[1]), done (SHIP[3]).
 */
export const Veracruz: Story = {
  args: VERACRUZ_ARGS,
  parameters: {
    docs: {
      description: {
        story:
          'Real data: a trimmed copy of the Veracruz port basemap (build_basemap.py output, © OpenStreetMap contributors, ODbL), about 12 KB, story-only. ' +
          'Basemap, markers and attribution take their colours from the theme (derived from existing tokens) and follow the toolbar Mode.',
      },
    },
  },
  render: (args) => (
    <OpenStreetMap {...args}>
      <VeracruzMarkers />
    </OpenStreetMap>
  ),
};

// ── one theme, picked by args (independent of the toolbar / persisted theme) ──
const THEME_IDS = GuiThemes.map((t) => t.themeId ?? '').filter(Boolean);
const muiThemeFor = (themeId: string, mode: 'light' | 'dark') => {
  const manifest = GuiThemes.find((t) => t.themeId === themeId) ?? GuiThemes[0];
  return makeMuiTheme(themeTokens, (manifest.mode as any)?.[mode] ?? {}, mode);
};

type ThemedArgs = React.ComponentProps<typeof OpenStreetMap> & { themeId: string; mode: 'light' | 'dark' };

/** The Veracruz map in one catalog theme and mode, chosen with the controls below. */
export const ThemePicker: StoryObj<ThemedArgs> = {
  args: { ...VERACRUZ_ARGS, themeId: 'neurons.me', mode: 'light' } as ThemedArgs,
  argTypes: {
    themeId: { control: 'select', options: THEME_IDS },
    mode: { control: 'inline-radio', options: ['light', 'dark'] },
  },
  render: ({ themeId, mode, ...args }) => (
    <ThemeProvider theme={muiThemeFor(themeId, mode)}>
      <OpenStreetMap {...(args as any)}>
        <VeracruzMarkers />
      </OpenStreetMap>
    </ThemeProvider>
  ),
};

function ThemeCell({ themeId, themeName, mode }: { themeId: string; themeName: string; mode: 'light' | 'dark' }) {
  const theme = React.useMemo(() => muiThemeFor(themeId, mode), [themeId, mode]);
  const pal = React.useMemo(() => buildOsmPalette(theme), [theme]);
  const minTone = Math.min(...Object.values(pal.domain).map((c) => contrast(c, pal.land)));
  return (
    <ThemeProvider theme={theme}>
      <figure
        data-theme-cell={`${themeId}/${mode}`}
        style={{ margin: 0, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, overflow: 'hidden' }}
      >
        <div style={{ height: 190 }}>
          <OpenStreetMap {...VERACRUZ_ARGS} ariaLabel={`Veracruz in ${themeName} ${mode}`}>
            <VeracruzMarkers />
          </OpenStreetMap>
        </div>
        <figcaption style={{ font: '11px/1.4 system-ui, sans-serif', padding: '4px 8px', color: theme.palette.text.primary }}>
          <b>{themeName}</b> · {mode}
          <span style={{ color: theme.palette.text.secondary }}>
            {' '}· label {contrast(pal.label, pal.land).toFixed(1)}:1 · tones ≥ {minTone.toFixed(1)}:1 · water {contrast(pal.water, pal.land).toFixed(1)}:1{pal.accent ? ' · accent' : ''}
          </span>
        </figcaption>
      </figure>
    </ThemeProvider>
  );
}

/**
 * All 8 catalog themes × light / dark, each map under its own theme (MUI
 * ThemeProvider built with the same makeMuiTheme as <Theme>). Captions show
 * label, marker-tone and water-line contrast against the land colour ("accent" = the
 * theme's color.accent took the primary/port/highlight role).
 */
export const ThemesGrid: Story = {
  parameters: { osmFrame: false, layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, padding: 10 }}>
      {GuiThemes.flatMap((t) =>
        (['light', 'dark'] as const).map((mode) => (
          <ThemeCell key={`${t.themeId}/${mode}`} themeId={t.themeId ?? ''} themeName={t.themeName ?? ''} mode={mode} />
        )),
      )}
    </div>
  ),
};
