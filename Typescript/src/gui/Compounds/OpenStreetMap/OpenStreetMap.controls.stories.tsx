import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MeRuntimeProvider } from '@/react/MeRuntimeProvider';
import OpenStreetMap from './OpenStreetMap';
import type { OsmMarkerScaleMode, OsmOverlayPosition } from './context';
import type { OsmUserView } from './projection';
import { createOsmProjection } from './projection';
import { VERACRUZ_BASEMAP, VERACRUZ_FRAME, VERACRUZ_NODES, VERACRUZ_SOURCE } from './OpenStreetMap.veracruz.fixture';
import { LEGEND_ITEMS, VeracruzMarkers, useKernel } from './OpenStreetMap.story.fixture';

// Map controls: zoom in / out, reset to the fit, and the basemap layer toggle,
// docked on the right edge between the legend (top-right) and the HUD chips /
// attribution (bottom), themed from the map palette. Native buttons: Tab to
// them, Enter / Space to press, Escape closes the layer panel. At a zoom limit
// a button stays focusable and reports aria-disabled.
//
// Zoom / pan (S5b.1): wheel or trackpad pinch zooms about the pointer, drag
// pans, two fingers pinch, double-click zooms in (shift: out), and the focused
// map takes arrows / + / − / 0. Only the geometry zooms: markers and labels
// keep their on-screen size (`markerScale`: 'fit' = their size at zoom 1,
// 'screen' = CSS px), basemap lines grow gently, the view stays on the map.

type ControlsArgs = {
  live: boolean;
  layers: boolean;
  defaultLayersOpen: boolean;
  position: OsmOverlayPosition;
  step: number;
  maxZoom: number;
  markerScale: OsmMarkerScaleMode;
  zoomPan: boolean;
};

function VeracruzControls({ live, layers, defaultLayersOpen, position, step, maxZoom, markerScale, zoomPan, view, onViewChange }: ControlsArgs & {
  view?: Partial<OsmUserView>;
  onViewChange?: (v: OsmUserView) => void;
}) {
  const { me, runtime } = useKernel(live);
  return (
    <MeRuntimeProvider me={me} runtime={runtime}>
      <OpenStreetMap
        {...VERACRUZ_FRAME}
        basemap={VERACRUZ_BASEMAP}
        source={VERACRUZ_SOURCE}
        ariaLabel="Port of Veracruz (OpenStreetMap basemap)"
        maxZoom={maxZoom}
        markerScale={markerScale}
        zoomPan={zoomPan}
        view={view}
        onViewChange={onViewChange}
      >
        <VeracruzMarkers />
        <OpenStreetMap.Legend mono width={214} items={LEGEND_ITEMS} footer="kernel counts · 3 off-map (adapter)" />
        <OpenStreetMap.Controls key={`${position}-${defaultLayersOpen}`} position={position} layers={layers} defaultLayersOpen={defaultLayersOpen} step={step} />
        <OpenStreetMap.Chip mono label="import left" bind="flows.importRemaining" unit=" t" tone="ship" minValueCh={9} fx />
        <OpenStreetMap.Chip mono label="trucks.working" bind={['trucks.working', 'trucks.fleet']} format={(v: any[]) => `${v[0] ?? '—'} / ${v[1] ?? '—'}`} minValueCh={9} fx />
        <OpenStreetMap.Chip mono label="avg km/h" bind="trucks.speed.avg" format={(v) => (typeof v === 'number' ? v.toFixed(1) : '—')} minValueCh={4} hideBelow={520} />
        <OpenStreetMap.Chip mono label="simulation" value="06:42 · ×4" variant="adapter" />
      </OpenStreetMap>
    </MeRuntimeProvider>
  );
}

const meta: Meta<ControlsArgs> = {
  title: 'Compounds/OpenStreetMap/Controls',
  tags: ['autodocs'],
  decorators: [
    (Story: any, ctx: any) =>
      ctx.parameters?.osmFrame === false ? <Story /> : (
        <div style={{ height: 460, width: '100%' }}>
          <Story />
        </div>
      ),
  ],
  args: { live: true, layers: true, defaultLayersOpen: false, position: 'right', step: 2, maxZoom: 16, markerScale: 'fit', zoomPan: true },
  argTypes: {
    position: { control: 'select', options: ['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'] },
    step: { control: { type: 'number', min: 1.1, max: 4, step: 0.1 } },
    maxZoom: { control: { type: 'number', min: 1, max: 32, step: 1 } },
    markerScale: { control: 'inline-radio', options: ['fit', 'screen'] },
  },
};
export default meta;
type Story = StoryObj<ControlsArgs>;

/** Controls (right edge) with the legend and HUD chips on the Veracruz fixture; follows the toolbar Mode. */
export const Veracruz: Story = { render: (args) => <VeracruzControls {...args} /> };

/** The layer panel open: uncheck a layer to hide it (roads, water, places). */
export const LayersOpen: Story = { args: { defaultLayersOpen: true }, render: (args) => <VeracruzControls {...args} /> };

const PROJ = createOsmProjection(VERACRUZ_FRAME);

/**
 * Controlled view: the story owns `view` and gets every change (buttons,
 * reset) through onViewChange; the buttons below the map set it from outside.
 */
export const Controlled: Story = {
  parameters: { osmFrame: false },
  render: (args) => {
    const [view, setView] = React.useState<Partial<OsmUserView>>({ zoom: 1 });
    const focus = (id: string) => {
      const n = VERACRUZ_NODES.find((x) => x.id === id)!;
      setView({ zoom: 3, center: PROJ.unproject(n.x, n.y) });
    };
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ height: 420 }}>
          <VeracruzControls {...args} view={view} onViewChange={setView} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', font: '12px system-ui, sans-serif', flexWrap: 'wrap' }}>
          {VERACRUZ_NODES.slice(0, 4).map((n) => (
            <button key={n.id} type="button" onClick={() => focus(n.id)}>{n.label ?? n.id}</button>
          ))}
          <button type="button" onClick={() => setView({ zoom: 1, center: PROJ.unproject(PROJ.width / 2, PROJ.height / 2) })}>fit</button>
          <code data-testid="view-readout">
            zoom {Number(view.zoom ?? 1).toFixed(2)}
            {view.center ? ` · ${view.center.lat.toFixed(4)}, ${view.center.lon.toFixed(4)}` : ''}
          </code>
        </div>
      </div>
    );
  },
};

/** Phone-sized frame: controls keep their dock on the right edge, chips wrap below. */
export const Narrow: Story = {
  parameters: { osmFrame: false },
  render: (args) => (
    <div style={{ width: 360, height: 560 }}>
      <VeracruzControls {...args} />
    </div>
  ),
};

/**
 * Zoom / pan with constant-size markers: scroll or pinch on the map, drag it,
 * or focus it and use the arrow keys / + / − / 0. Kernel values stay live.
 * Starts zoomed in on the terminal so the effect is visible right away.
 */
export const ZoomPan: Story = {
  render: (args) => {
    const [view, setView] = React.useState<Partial<OsmUserView>>(() => ({ zoom: 3, center: PROJ.unproject(700, 280) }));
    return <VeracruzControls {...args} view={view} onViewChange={setView} />;
  },
};

/** markerScale="screen": marker sizes are CSS px, so a phone-sized map keeps readable pins. */
export const ScreenSizedMarkers: Story = {
  parameters: { osmFrame: false },
  args: { markerScale: 'screen' },
  render: (args) => (
    <div style={{ width: 360, height: 560 }}>
      <VeracruzControls {...args} />
    </div>
  ),
};
