import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MeRuntimeProvider } from '@/react/MeRuntimeProvider';
import OpenStreetMap from './OpenStreetMap';
import type { OsmUserView } from './projection';
import { createOsmProjection } from './projection';
import { useOpenStreetMapLink } from './selection';
import { VERACRUZ_BASEMAP, VERACRUZ_FRAME, VERACRUZ_NODES, VERACRUZ_SOURCE } from './OpenStreetMap.veracruz.fixture';
import { LEGEND_ITEMS, VeracruzMarkers, useKernel } from './OpenStreetMap.story.fixture';

// Pin selection (plan §4a): selected pins render in full (icon, label, meta) at a
// constant on-screen size; unselected pins are small dots; a selected pin that
// leaves the view, or would sit under an overlay (legend, list, controls,
// chips, attribution), sticks to the free edge with an arrow toward its real
// spot, and clicking it pans there. Labels are placed greedily (focused /
// hovered first, then the most recent selection): 8 slots, then pushed out up
// to 24 px with a leader line, then collapsed (hover / focus / list / name).
// Toggle with a click, Enter / Space on a focused pin, or the list.

const PROJ = createOsmProjection(VERACRUZ_FRAME);
const DEFAULT_SELECTION = ['n-port', 'n-ship1', 'n-ship2', 'n-yard'];

type SelArgs = { live: boolean; listInMap: boolean };

function VeracruzSelection({
  live,
  listInMap = true,
  selected,
  onSelectionChange,
  view,
  onViewChange,
  defaultView,
  link,
  defaultSelected = DEFAULT_SELECTION,
  controls = true,
  chips = true,
}: SelArgs & {
  selected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  view?: Partial<OsmUserView>;
  onViewChange?: (v: OsmUserView) => void;
  defaultView?: Partial<OsmUserView>;
  link?: ReturnType<typeof useOpenStreetMapLink>;
  defaultSelected?: string[];
  controls?: boolean;
  chips?: boolean;
}) {
  const { me, runtime } = useKernel(live);
  return (
    <MeRuntimeProvider me={me} runtime={runtime}>
      <OpenStreetMap
        {...VERACRUZ_FRAME}
        basemap={VERACRUZ_BASEMAP}
        source={VERACRUZ_SOURCE}
        ariaLabel="Port of Veracruz (OpenStreetMap basemap)"
        markerScale="screen"
        {...(selected !== undefined ? { selected, onSelectionChange } : { defaultSelected })}
        view={view}
        onViewChange={onViewChange}
        defaultView={defaultView}
        link={link}
      >
        <VeracruzMarkers liveMeta />
        {listInMap ? <OpenStreetMap.MarkerList width={264} /> : null}
        <OpenStreetMap.Legend mono width={214} items={LEGEND_ITEMS} footer="kernel counts · 3 off-map (adapter)" />
        {controls ? <OpenStreetMap.Controls /> : null}
        {chips ? (
          <>
            <OpenStreetMap.Chip mono label="import left" bind="flows.importRemaining" unit=" t" tone="ship" minValueCh={9} fx />
            <OpenStreetMap.Chip mono label="trucks.working" bind={['trucks.working', 'trucks.fleet']} format={(v: any[]) => `${v[0] ?? '—'} / ${v[1] ?? '—'}`} minValueCh={9} fx />
            <OpenStreetMap.Chip mono label="simulation" value="06:42 · ×4" variant="adapter" />
          </>
        ) : null}
      </OpenStreetMap>
    </MeRuntimeProvider>
  );
}

const meta: Meta<SelArgs> = {
  title: 'Compounds/OpenStreetMap/Selection',
  tags: ['autodocs'],
  decorators: [
    (Story: any, ctx: any) =>
      ctx.parameters?.osmFrame === false ? <Story /> : (
        <div style={{ height: 460, width: '100%' }}>
          <Story />
        </div>
      ),
  ],
  args: { live: true, listInMap: true },
};
export default meta;
type Story = StoryObj<SelArgs>;

/**
 * Port, the two active ships and the yard selected (uncontrolled), the list in
 * the map (top-left), live kernel values in the pins' second line and in the
 * list. SHIP[2] sits under the legend: it moves out with an arrow.
 */
export const Veracruz: Story = { render: (args) => <VeracruzSelection {...args} /> };

/** Controlled: the story owns `selected`; the list lives outside the map (shared through `link`). */
export const Controlled: Story = {
  parameters: { osmFrame: false },
  render: (args) => {
    const link = useOpenStreetMapLink();
    const [selected, setSelected] = React.useState<string[]>(DEFAULT_SELECTION);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 240px', gap: 12, alignItems: 'start' }}>
        <div style={{ height: 460 }}>
          <VeracruzSelection {...args} listInMap={false} selected={selected} onSelectionChange={setSelected} link={link} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <OpenStreetMap.MarkerList link={link} width="100%" title="Pins (outside the map)" />
          <code data-testid="selection-readout" style={{ font: '11px ui-monospace, monospace', wordBreak: 'break-all' }}>
            selected = {JSON.stringify(selected)}
          </code>
        </div>
      </div>
    );
  },
};

/** Zoomed in on Q.IMPORT: the port (above), ships (right), train (left) and yard (below) stick to the edges with arrows. Click one to pan there. */
export const ZoomedEdgePins: Story = {
  render: (args) => {
    const [view, setView] = React.useState<Partial<OsmUserView>>(() => ({ zoom: 5, center: PROJ.unproject(640, 350) }));
    return (
      <VeracruzSelection
        {...args}
        view={view}
        onViewChange={setView}
        defaultSelected={['n-port', 'n-ship1', 'n-ship2', 'n-ship3', 'n-yard', 'n-qimp', 'n-train']}
        chips={false}
      />
    );
  },
};

// A tight cluster of long-labelled pins around the port: shows slot choice, leader lines and collapsed labels.
const CLUSTER = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const r = i % 2 ? 26 : 14;
  const { lat, lon } = PROJ.unproject(600 + Math.cos(a) * r, 255 + Math.sin(a) * r * 0.8);
  return { id: `c${i}`, lat, lon, label: `TRUCK[${100 + i}] heavy`, meta: i % 3 ? 'en route' : 'loading', tone: (['ship', 'train', 'yard', 'queue'] as const)[i % 4] };
});

/** 12 selected pins in a 50 px cluster: labels take free slots, then leader lines, then collapse (hover a pin to see its label). */
export const LabelCollisions: Story = {
  args: { live: false },
  render: () => (
    <OpenStreetMap
      {...VERACRUZ_FRAME}
      basemap={VERACRUZ_BASEMAP}
      source={VERACRUZ_SOURCE}
      markerScale="screen"
      defaultView={{ zoom: 2.5, center: PROJ.unproject(600, 255) }}
      defaultSelected={CLUSTER.map((c) => c.id)}
      ariaLabel="Label collisions"
    >
      {CLUSTER.map((c) => (
        <OpenStreetMap.Marker key={c.id} id={c.id} lat={c.lat} lon={c.lon} shape="circle" size={12} tone={c.tone} label={c.label} meta={c.meta} />
      ))}
      <OpenStreetMap.Controls />
    </OpenStreetMap>
  ),
};

/** Phone-sized map with the list under it (outside the map, through `link`). */
export const NarrowList: Story = {
  parameters: { osmFrame: false },
  render: (args) => {
    const link = useOpenStreetMapLink();
    return (
      <div style={{ width: 360, display: 'grid', gap: 8 }}>
        <div style={{ height: 420 }}>
          <VeracruzSelection {...args} listInMap={false} link={link} chips={false} defaultView={{ zoom: 1.4, center: PROJ.unproject(660, 300) }} />
        </div>
        <OpenStreetMap.MarkerList link={link} width="100%" />
      </div>
    );
  },
};

/** The same map without selection props: every pin full, exactly as before S5b.2 (for comparison). */
export const NoSelection: Story = {
  render: ({ live }) => {
    const { me, runtime } = useKernel(live);
    return (
      <MeRuntimeProvider me={me} runtime={runtime}>
        <OpenStreetMap {...VERACRUZ_FRAME} basemap={VERACRUZ_BASEMAP} source={VERACRUZ_SOURCE} markerScale="screen" ariaLabel="Port of Veracruz">
          <VeracruzMarkers liveMeta />
          <OpenStreetMap.Legend mono width={214} items={LEGEND_ITEMS} footer="kernel counts · 3 off-map (adapter)" />
          <OpenStreetMap.Controls />
        </OpenStreetMap>
      </MeRuntimeProvider>
    );
  },
};
