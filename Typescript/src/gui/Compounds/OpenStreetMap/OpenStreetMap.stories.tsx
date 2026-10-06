import type { Meta, StoryObj } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import OpenStreetMap from './OpenStreetMap';
import type { OsmBasemap } from './OpenStreetMap';

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
  decorators: [
    (Story: any) => (
      <Theme>
        <div style={{ height: 420, width: '100%' }}>
          <Story />
        </div>
      </Theme>
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
