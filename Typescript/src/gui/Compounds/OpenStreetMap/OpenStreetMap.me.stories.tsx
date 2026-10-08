import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MeRuntimeProvider } from '@/react/MeRuntimeProvider';
import { SpecBoundary } from '@/runtime/SpecBoundary';
import OpenStreetMapResolver, {
  OpenStreetMapChipResolver,
  OpenStreetMapControlsResolver,
  OpenStreetMapLegendResolver,
  OpenStreetMapMarkerListResolver,
  OpenStreetMapMarkerResolver,
} from './OpenStreetMap.resolver';
import { createVeracruzKernel, tickVeracruz, veracruzMeSpec } from './OpenStreetMap.story.fixture';

// The .me-bound reference for the Veracruz page migration (S7).
//
// - One real this.me kernel per story. One runtime from createMeRuntime(me,
//   { subscribe: bridge }), with the same explicit bridge shape as the page.
// - The map is a plain-JSON spec: pins `bind` kernel paths; the root reads and
//   writes the selection and hidden layers with `{ read }` / `{ write }`;
//   legend rows, chips and pin metas are kernel paths, and the legend sums
//   are kernel rules.
// - A tick writes counts, one pin status and a truck's position through
//   runtime.action every second.
// - Rendered with SpecBoundary, the renderer mount() uses, inside the story's
//   own Theme and SelectionProvider, so the Mode and Inspector toolbars apply.
//   See QuickStart.stories.tsx for why mount() itself does not fit in
//   Storybook.

const SPEC_REGISTRY = {
  OpenStreetMap: OpenStreetMapResolver,
  OpenStreetMapMarker: OpenStreetMapMarkerResolver,
  OpenStreetMapMarkerList: OpenStreetMapMarkerListResolver,
  OpenStreetMapLegend: OpenStreetMapLegendResolver,
  OpenStreetMapChip: OpenStreetMapChipResolver,
  OpenStreetMapControls: OpenStreetMapControlsResolver,
};

type Args = { live: boolean; markerList: boolean; legendWidth: number };

const bar: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', font: '11px ui-monospace, SFMono-Regular, Menlo, monospace', marginTop: 8 };

function MeBoundMap({ live, markerList, legendWidth, height }: Args & { height: number }) {
  const [{ me, runtime, bridge }] = React.useState(createVeracruzKernel);
  const [running, setRunning] = React.useState(live);
  const [mounted, setMounted] = React.useState(true);
  const [ticks, setTicks] = React.useState(0);
  const tickRef = React.useRef(0);
  const [listeners, setListeners] = React.useState(0);
  React.useEffect(() => setRunning(live), [live]);
  React.useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      tickRef.current += 1;
      tickVeracruz(runtime, tickRef.current);
      setTicks(tickRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [running, runtime]);
  // listener count after each commit and tick (the bridge is not React state)
  React.useEffect(() => {
    const id = setInterval(() => setListeners((n) => (bridge.size() === n ? n : bridge.size())), 250);
    return () => clearInterval(id);
  }, [bridge]);
  const spec = React.useMemo(() => veracruzMeSpec({ markerList, legendWidth }), [markerList, legendWidth]);
  const btn = (label: string, onClick: () => void, testId: string) => (
    <button type="button" onClick={onClick} data-testid={testId} style={{ font: 'inherit', padding: '2px 8px', cursor: 'pointer' }}>{label}</button>
  );
  return (
    <MeRuntimeProvider me={me} runtime={runtime}>
      <div style={{ height }}>
        {mounted ? <SpecBoundary spec={spec} registry={SPEC_REGISTRY} runtime={runtime} /> : (
          <div data-testid="me-unmounted" style={{ height: '100%', display: 'grid', placeItems: 'center', border: '1px dashed currentColor', opacity: 0.6 }}>map unmounted</div>
        )}
      </div>
      <div style={bar} data-testid="me-bar">
        <span data-testid="me-ticks">tick {ticks}</span>
        <span>·</span>
        <span data-testid="me-listeners">bridge listeners {listeners}</span>
        {btn(running ? 'Pause tick' : 'Resume tick', () => setRunning((r) => !r), 'me-pause')}
        {btn(mounted ? 'Unmount map' : 'Mount map', () => setMounted((m) => !m), 'me-mount')}
        {btn('me.trucks.heavy.available(300): direct, no notify', () => me.trucks.heavy.available(300), 'me-direct')}
        {btn('announce trucks.heavy.available', () => bridge.announce(['trucks.heavy.available']), 'me-announce')}
      </div>
    </MeRuntimeProvider>
  );
}

const meta: Meta<Args> = {
  title: 'Compounds/OpenStreetMap/Me',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The Veracruz map as a plain-JSON spec bound to a real this.me kernel. Pins, legend, chips, selection and hidden layers are kernel paths; a tick writes through runtime.action every second. ' +
          'The simulation clock and the off-map count are adapter values, not kernel paths, so they keep the dashed adapter style. ' +
          'A bare me.x() write does not notify: pause the tick, use the direct-write button (the pool value stays), then announce the path on the bridge (it updates).',
      },
    },
  },
  args: { live: true, markerList: true, legendWidth: 214 },
};
export default meta;
type Story = StoryObj<Args>;

/** Port, active ships and yard selected (kernel `ui.map.selected`), list in the map, live values. */
export const MeBound: Story = { render: (args) => <MeBoundMap {...args} height={460} /> };

/** The same spec in a phone-sized map; the legend is narrower. */
export const Narrow: Story = {
  args: { legendWidth: 168 },
  render: (args) => (
    <div style={{ width: 360 }}>
      <MeBoundMap {...args} height={520} />
    </div>
  ),
};
