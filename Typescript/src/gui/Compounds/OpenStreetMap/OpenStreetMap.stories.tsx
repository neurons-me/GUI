import type { Meta, StoryObj } from '@storybook/react';
import OpenStreetMap from './OpenStreetMap';
import type { OsmBasemap } from './OpenStreetMap';
import { createOsmProjection } from './projection';
import { VERACRUZ_BASEMAP, VERACRUZ_FRAME, VERACRUZ_SOURCE } from './OpenStreetMap.veracruz.fixture';

// Demo frame only: two hand-written strokes stand in for a project's
// pre-projected basemap (a real page passes the layers its own generator made).
const BBOX = { south: 19.192, west: -96.142, north: 19.205, east: -96.122 };
const DEMO_BASEMAP: OsmBasemap = {
  background: '#0b0d10',
  layers: [
    { id: 'roads', style: { stroke: '#505860', strokeWidth: 2, opacity: 0.8, strokeLinecap: 'round' }, paths: ['M24,700 L600,400 L1176,120', 'M300,24 L420,776'] },
    { id: 'places', style: { fill: '#2a3038' }, circles: [{ cx: 600, cy: 400, r: 3 }] },
  ],
};

const meta: Meta<typeof OpenStreetMap> = {
  title: 'Compounds/OpenStreetMap',
  component: OpenStreetMap,
  tags: ['autodocs'],
  // No <Theme> here: the global preview decorator already provides it, so the
  // toolbar's Mode (light/dark) reaches these stories. (The map's own colours
  // are still fixed at this stage; see the Veracruz story.)
  decorators: [
    (Story: any) => (
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
      <OpenStreetMap.Marker lat={19.1985} lon={-96.132} shape="circle" size={20} color="#7eb8c9" label="circle" meta="fixed lat/lon" />
      <OpenStreetMap.Marker lat={19.202} lon={-96.137} shape="square" size={16} color="#7a9a7a" label="square" />
      <OpenStreetMap.Marker lat={19.195} lon={-96.126} shape="triangle" size={18} color="#c9b87e" label="triangle" labelPlacement="left" />
      <OpenStreetMap.Marker lat={19.2} lon={-96.127} shape="icon" icon="directions_boat" size={22} color="#7eb8c9" label="GUI.Icon" />
    </OpenStreetMap>
  ),
};

export const CanvasLayer: Story = {
  render: (args) => (
    <OpenStreetMap {...args}>
      <OpenStreetMap.Canvas
        onFrame={({ ctx, now, project }) => {
          const p = project(19.1985 + 0.004 * Math.sin(now / 900), -96.132 + 0.006 * Math.cos(now / 900));
          ctx.fillStyle = '#e58fc0';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }}
      />
    </OpenStreetMap>
  ),
};

// Real data: a trimmed copy of the Veracruz port basemap (build_basemap.py
// output, © OpenStreetMap contributors, ODbL) with the port page's main nodes.
// Node positions are the page's map pixels, unprojected with the map's own
// projection, exactly as port-gui.js does.
const VERACRUZ_PROJ = createOsmProjection(VERACRUZ_FRAME);
const VERACRUZ_NODES = [
  { id: 'n-port', x: 600.0, y: 255.4, shape: 'circle', size: 28, gap: 7, icon: 'anchor', color: '#7eb8c9', label: 'VERACRUZ', meta: 'port' },
  { id: 'n-ship1', x: 801.6, y: 168.6, shape: 'rect', width: 32, height: 18, gap: 5, icon: 'directions_boat', color: '#6a9bb0', label: 'SHIP[1] coffee', meta: 'unloading' },
  { id: 'n-ship2', x: 888.0, y: 284.3, shape: 'rect', width: 32, height: 18, gap: 5, icon: 'directions_boat', color: '#6a9bb0', label: 'SHIP[2] sugar', meta: 'unloading' },
  { id: 'n-ship3', x: 945.6, y: 382.6, shape: 'rect', width: 32, height: 18, gap: 5, icon: 'directions_boat', color: '#6a9bb0', label: 'SHIP[3] TEU', meta: 'unloading' },
  { id: 'n-train', x: 340.8, y: 342.2, shape: 'rect', width: 36, height: 16, gap: 5, place: 'left', icon: 'train', color: '#b0a06a', label: 'TRAIN[1]', meta: 'loading' },
  { id: 'n-yard', x: 513.6, y: 457.8, shape: 'square', size: 28, gap: 7, icon: 'warehouse', color: '#7a9a7a', label: 'CARGO YARD · CEDIS A', meta: 'pool' },
] as const;

/**
 * The real Veracruz port basemap with a few of the port page's markers.
 *
 * Expected at this stage: the map keeps the generator's dark colours in both
 * Mode settings (light/dark). Only the page around it follows the theme. Theme
 * tokens for the basemap, markers and attribution are the next step.
 */
export const Veracruz: Story = {
  args: {
    ...VERACRUZ_FRAME,
    basemap: VERACRUZ_BASEMAP,
    source: VERACRUZ_SOURCE,
    ariaLabel: 'Port of Veracruz (OpenStreetMap basemap)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Real data: a trimmed copy of the Veracruz port basemap (build_basemap.py output, © OpenStreetMap contributors, ODbL), about 12 KB, story-only. ' +
          'Markers are placed at the port page\'s node positions. The map colours do not follow the theme yet, so it stays dark in light mode. That is expected for now.',
      },
    },
  },
  render: (args) => (
    <OpenStreetMap {...args}>
      {VERACRUZ_NODES.map((n) => {
        const { lat, lon } = VERACRUZ_PROJ.unproject(n.x, n.y);
        return (
          <OpenStreetMap.Marker
            key={n.id}
            id={n.id}
            lat={lat}
            lon={lon}
            shape={n.shape}
            size={'size' in n ? n.size : undefined}
            width={'width' in n ? n.width : undefined}
            height={'height' in n ? n.height : undefined}
            color={n.color}
            icon={n.icon}
            iconColor={n.color}
            label={n.label}
            meta={n.meta}
            labelPlacement={'place' in n ? n.place : 'right'}
            labelOffset={n.gap}
          />
        );
      })}
    </OpenStreetMap>
  ),
};
