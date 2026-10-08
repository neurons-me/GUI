import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ME from 'this.me';
import { createMeRuntime } from '@/runtime/run-me';
import { MeRuntimeProvider } from '@/react/MeRuntimeProvider';
import OpenStreetMap from './OpenStreetMap';
import type { OsmAttributionPosition } from './OpenStreetMap';
import type { OsmLegendItem } from './OpenStreetMapLegend';
import type { OsmOverlayPosition } from './context';
import { createOsmProjection } from './projection';
import { VERACRUZ_BASEMAP, VERACRUZ_FRAME, VERACRUZ_NODES, VERACRUZ_SOURCE } from './OpenStreetMap.veracruz.fixture';

// HTML overlays on the map: Legend (top-right), HUD chips (bottom edge) and a
// free Overlay (top-left), as the Veracruz port page builds them by hand today
// (port-gui.js legend() / hud()), but themed from the map palette and docked by
// the map, so they never overlap each other or the OSM attribution.
// Values are bound to a real this.me kernel (`bind`, read through the runtime);
// a timer writes through runtime.action, which notifies the bound rows/chips.

const PROJ = createOsmProjection(VERACRUZ_FRAME);

function VeracruzMarkers() {
  return (
    <>
      {VERACRUZ_NODES.map((n) => {
        const { lat, lon } = PROJ.unproject(n.x, n.y);
        return (
          <OpenStreetMap.Marker key={n.id} id={n.id} lat={lat} lon={lon} shape={n.shape} size={n.size} width={n.width} height={n.height}
            tone={n.tone} state={n.state} icon={n.icon} label={n.label} meta={n.meta} labelPlacement={n.place ?? 'right'} labelOffset={n.gap} />
        );
      })}
    </>
  );
}

const SEED: Record<string, number | string> = {
  'trucks.import.enRoute': 38, 'trucks.export.enRoute': 21, 'trucks.import.loading': 9, 'trucks.export.loading': 6,
  'trucks.inQueue': 14, 'trucks.import.returning': 17, 'trucks.export.returning': 11, 'trucks.heavy.available': 284,
  'trucks.lastMile.enRoute': 12, 'trucks.lastMile.returning': 7, 'trucks.lastMile.loading': 3, 'trucks.lastMile.available': 78,
  'trips.pending': 40, 'trips.done': 126, 'trips.unscheduled': 2,
  'flows.importRemaining': 96400, 'flows.exportRemaining': 31250, 'trucks.working': 102, 'trucks.fleet': 500,
  'trucks.balanced': 'yes', 'trucks.speed.avg': 31.4,
};

function useKernel(live: boolean) {
  const [{ me, runtime }] = React.useState(() => {
    const k: any = new (ME as any)();
    for (const [path, v] of Object.entries(SEED)) {
      const parts = path.split('.');
      let node = k;
      for (const p of parts) node = node[p];
      node(v);
    }
    return { me: k, runtime: createMeRuntime(k) };
  });
  React.useEffect(() => {
    if (!live) return undefined;
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      const write = (path: string, v: any) => runtime.action!(`me/${path}`, undefined)(v);
      write('flows.importRemaining', Math.max(0, 96400 - t * 350));
      write('trucks.import.enRoute', 38 + (t % 5));
      write('trucks.inQueue', 14 - (t % 4));
      write('trucks.working', 102 + (t % 7));
      write('trucks.speed.avg', Math.round((31.4 + Math.sin(t / 3) * 2) * 10) / 10);
    }, 1000);
    return () => clearInterval(id);
  }, [live, runtime]);
  return { me, runtime };
}

const join = (v: any[]) => v.map((x) => (x === undefined ? '—' : Number(x).toLocaleString('en-US'))).join(' · ');
const sum = (v: any[]) => v.reduce((a, b) => a + (Number(b) || 0), 0).toLocaleString('en-US');

const LEGEND_ITEMS: OsmLegendItem[] = [
  { heading: 'heavy · 400' },
  { label: 'import, laden', tone: 'ship', bind: 'trucks.import.enRoute' },
  { label: 'export, laden', tone: 'train', bind: 'trucks.export.enRoute' },
  { label: 'load / unload', tone: 'yard', bind: ['trucks.import.loading', 'trucks.export.loading'], format: sum },
  { label: 'queued', tone: 'secondary', bind: 'trucks.inQueue' },
  { label: 'returning', tone: 'neutral', bind: ['trucks.import.returning', 'trucks.export.returning'], format: sum },
  { label: 'pool', tone: 'neutral', swatch: 'ring', bind: 'trucks.heavy.available' },
  { heading: 'last-mile · 100' },
  { label: 'out · back', tone: 'error', swatch: { size: 5 }, bind: ['trucks.lastMile.enRoute', 'trucks.lastMile.returning'], format: join },
  { label: 'load · idle', tone: 'error', swatch: { shape: 'ring', size: 6 }, bind: ['trucks.lastMile.loading', 'trucks.lastMile.available'], format: join },
  { label: 'trips ○ · ✓ · ✗', tone: 'warning', swatch: { shape: 'square', size: 5 }, bind: ['trips.pending', 'trips.done', 'trips.unscheduled'], format: join },
];

type OverlayArgs = { live: boolean; attribution: OsmAttributionPosition; mono: boolean };

function VeracruzOverlays({ live, attribution, mono }: OverlayArgs) {
  const { me, runtime } = useKernel(live);
  const [open, setOpen] = React.useState<string | null>(null);
  const toggle = (key: string) => () => setOpen((k) => (k === key ? null : key));
  return (
    <MeRuntimeProvider me={me} runtime={runtime}>
      <OpenStreetMap {...VERACRUZ_FRAME} basemap={VERACRUZ_BASEMAP} source={VERACRUZ_SOURCE} attribution={{ position: attribution }} ariaLabel="Port of Veracruz (OpenStreetMap basemap)">
        <VeracruzMarkers />
        <OpenStreetMap.Legend mono={mono} width={214} items={LEGEND_ITEMS} footer="kernel counts · 3 off-map (adapter)" />
        <OpenStreetMap.Overlay position="top-left" hideBelow={640} interactive={false}>
          <span style={{ font: '10px/20px ui-monospace, monospace', padding: '0 7px', borderRadius: 4, background: 'var(--gui-osm-overlay-bg)', border: '1px solid var(--gui-osm-overlay-border)', color: 'var(--gui-osm-overlay-text)' }}>
            click a truck dot → me.trucks.unit[n]
          </span>
        </OpenStreetMap.Overlay>
        {open ? (
          <OpenStreetMap.Overlay position="bottom" style={{ flexBasis: '100%' }} role="region" aria-label={`${open}: .me expression`}>
            <div id="osm-expr" style={{ font: '10px/1.5 ui-monospace, monospace', padding: '6px 8px', maxWidth: 480, borderRadius: 4, background: 'var(--gui-osm-overlay-bg)', border: '1px solid var(--gui-osm-highlight)', color: 'var(--gui-osm-overlay-text)' }}>
              <b style={{ color: 'var(--gui-osm-overlay-strong)' }}>{open}</b> = Σ ships[i].remainingTons · kernel rule (story text)
            </div>
          </OpenStreetMap.Overlay>
        ) : null}
        <OpenStreetMap.Chip mono={mono} label="import left" bind="flows.importRemaining" unit=" t" tone="ship" minValueCh={9} fx active={open === 'import'} onClick={toggle('import')} aria-controls="osm-expr" />
        <OpenStreetMap.Chip mono={mono} label="export left" bind="flows.exportRemaining" unit=" t" tone="train" minValueCh={8} fx active={open === 'export'} onClick={toggle('export')} aria-controls="osm-expr" />
        <OpenStreetMap.Chip mono={mono} label="trucks.working" bind={['trucks.working', 'trucks.fleet']} format={(v: any[]) => `${v[0] ?? '—'} / ${v[1] ?? '—'}`} minValueCh={9} fx active={open === 'working'} onClick={toggle('working')} />
        <OpenStreetMap.Chip mono={mono} label="trucks.balanced" bind="trucks.balanced" fx />
        <OpenStreetMap.Chip mono={mono} label="avg km/h" bind="trucks.speed.avg" format={(v) => (typeof v === 'number' ? v.toFixed(1) : '—')} minValueCh={4} hideBelow={520} />
        <OpenStreetMap.Chip mono={mono} label="simulation" value="06:42 · ×4" variant="adapter" title="simulator clock: adapter, not a kernel path" />
      </OpenStreetMap>
    </MeRuntimeProvider>
  );
}

const meta: Meta<OverlayArgs> = {
  title: 'Compounds/OpenStreetMap/Overlays',
  tags: ['autodocs'],
  decorators: [
    (Story: any, ctx: any) =>
      ctx.parameters?.osmFrame === false ? <Story /> : (
        <div style={{ height: 460, width: '100%' }}>
          <Story />
        </div>
      ),
  ],
  args: { live: true, attribution: 'bottom-right', mono: true },
  argTypes: {
    attribution: { control: 'select', options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
  },
};
export default meta;
type Story = StoryObj<OverlayArgs>;

/**
 * Legend (top-right), HUD chips (bottom edge, wrapping above the attribution)
 * and a hint overlay (top-left, hidden below 640 px), on the Veracruz fixture.
 * Follows the toolbar Mode. Click a chip with ƒ: its explanation opens as a
 * full-width row above the chips, still inside the bottom dock.
 */
export const Veracruz: Story = { render: (args) => <VeracruzOverlays {...args} /> };

/** The same map in a phone-sized frame: the hint and the km/h chip hide, chips wrap, the legend fits. */
export const Narrow: Story = {
  parameters: { osmFrame: false },
  render: (args) => (
    <div style={{ width: 360, height: 560 }}>
      <VeracruzOverlays {...args} />
    </div>
  ),
};

const POSITIONS: OsmOverlayPosition[] = ['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'];

/** Every dock filled; pick the attribution corner in Controls. Nothing overlaps at any size. */
export const Positions: Story = {
  args: { live: false },
  render: ({ attribution }) => (
    <OpenStreetMap {...VERACRUZ_FRAME} basemap={VERACRUZ_BASEMAP} source={VERACRUZ_SOURCE} attribution={{ position: attribution }}>
      {POSITIONS.map((p) => (
        <OpenStreetMap.Chip key={p} position={p} label="position" value={p} />
      ))}
      <OpenStreetMap.Legend position="top-right" title="Legend" items={[{ label: 'ship', tone: 'ship', value: 3 }, { label: 'train', tone: 'train', value: 1 }, { label: 'yard', tone: 'yard', swatch: 'square', value: 2 }]} />
      <OpenStreetMap.Chip position="bottom" label="adapter" value="dashed" variant="adapter" />
    </OpenStreetMap>
  ),
};
