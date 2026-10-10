/*
 * Shared story fixtures for the OpenStreetMap stories (Overlays, Controls, …):
 * the Veracruz markers, a this.me kernel seeded with the port page's counts
 * (optionally written every second through runtime.action), and the legend
 * rows bound to it. S6 adds the .me-bound spec (kernel + bridge + tick +
 * JSON spec) used by OpenStreetMap.me.stories.tsx and its test. Excluded from
 * the type emit (*.fixture.ts).
 */
import * as React from 'react';
import ME from 'this.me';
import { createMeRuntime } from '@/runtime/run-me';
import type { RuntimeAdapter } from '@/runtime/adapter';
import OpenStreetMapMarker from './OpenStreetMapMarker';
import type { OsmLegendItem } from './OpenStreetMapLegend';
import { createOsmProjection } from './projection';
import { VERACRUZ_BASEMAP, VERACRUZ_FRAME, VERACRUZ_NODES, VERACRUZ_SOURCE } from './OpenStreetMap.veracruz.fixture';

const PROJ = createOsmProjection(VERACRUZ_FRAME);

/** Kernel paths for the live second line (meta) of some Veracruz pins. */
export const PIN_META_BIND: Record<string, string> = {
  'n-port': 'pins.port',
  'n-ship1': 'pins.ship1',
  'n-ship2': 'pins.ship2',
  'n-qimp': 'pins.qimp',
  'n-yard': 'pins.yard',
};

/** The seven Veracruz nodes as markers (geo from the fixture's map px); `liveMeta` binds some metas to the kernel. */
export function VeracruzMarkers({ liveMeta = false }: { liveMeta?: boolean } = {}): React.ReactElement {
  return React.createElement(
    React.Fragment,
    null,
    VERACRUZ_NODES.map((n) => {
      const { lat, lon } = PROJ.unproject(n.x, n.y);
      return React.createElement(OpenStreetMapMarker, {
        key: n.id, id: n.id, lat, lon, shape: n.shape, size: n.size, width: n.width, height: n.height,
        tone: n.tone, state: n.state, icon: n.icon, label: n.label, meta: n.meta, labelPlacement: n.place ?? 'right', labelOffset: n.gap,
        bind: liveMeta && PIN_META_BIND[n.id] ? { meta: PIN_META_BIND[n.id] } : undefined,
      });
    }),
  );
}

export const SEED: Record<string, number | string> = {
  'trucks.import.enRoute': 38, 'trucks.export.enRoute': 21, 'trucks.import.loading': 9, 'trucks.export.loading': 6,
  'trucks.inQueue': 14, 'trucks.import.returning': 17, 'trucks.export.returning': 11, 'trucks.heavy.available': 284,
  'trucks.lastMile.enRoute': 12, 'trucks.lastMile.returning': 7, 'trucks.lastMile.loading': 3, 'trucks.lastMile.available': 78,
  'trips.pending': 40, 'trips.done': 126, 'trips.unscheduled': 2,
  'flows.importRemaining': 96400, 'flows.exportRemaining': 31250, 'trucks.working': 102, 'trucks.fleet': 500,
  'trucks.balanced': 'yes', 'trucks.speed.avg': 31.4,
  'pins.port': 'queue 14 · busy', 'pins.ship1': 'unloading · 96,400 t', 'pins.ship2': 'waiting · berth 4',
  'pins.qimp': '14 queued', 'pins.yard': '102 trucks working',
};

export function useKernel(live: boolean) {
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
      write('pins.port', `queue ${14 - (t % 4)} · busy`);
      write('pins.ship1', `unloading · ${Math.max(0, 96400 - t * 350).toLocaleString('en-US')} t`);
      write('pins.qimp', `${14 - (t % 4)} queued`);
      write('pins.yard', `${102 + (t % 7)} trucks working`);
    }, 1000);
    return () => clearInterval(id);
  }, [live, runtime]);
  return { me, runtime };
}

export const join = (v: any[]) => v.map((x) => (x === undefined ? '—' : Number(x).toLocaleString('en-US'))).join(' · ');
export const sum = (v: any[]) => v.reduce((a, b) => a + (Number(b) || 0), 0).toLocaleString('en-US');

export const LEGEND_ITEMS: OsmLegendItem[] = [
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


// --- S6: the .me-bound Veracruz spec (OpenStreetMap.me.stories.tsx) ---
//
// A real this.me kernel seeded with the same counts as the other Veracruz
// stories, plus two kernel rules, the selection, the hidden layers and one
// truck's position. createMeRuntime gets an explicit subscribe bridge, shaped
// like the Veracruz page's. The story's tick writes through runtime.action,
// which notifies every subscriber by itself. A bare me.x() write does not
// notify (this.me@4.1.0 has no per-instance change events): something must
// announce the paths on the bridge, as the page's adapter does.

export const ME_SELECTION_PATH = 'ui.map.selected';
export const ME_LAYERS_PATH = 'ui.map.hiddenLayers';
export const ME_TRUCK = { lat: 'traffic.truck7.lat', lon: 'traffic.truck7.lon', meta: 'traffic.truck7.status' } as const;
export const DEFAULT_SELECTION = ['n-port', 'n-ship1', 'n-ship2', 'n-yard'];

/** Kernel rules: the legend's sums are derived in the kernel, not formatted in React. */
export const ME_RULES: Array<[scope: string, name: string, expression: string]> = [
  ['trucks', 'loadUnload', 'import.loading + export.loading'],
  ['trucks', 'returningAll', 'import.returning + export.returning'],
];

const YARD_PX = { x: 513.6, y: 457.8 };
const PORT_PX = { x: 600, y: 255.4 };

/** Where the tick puts TRUCK[7] at step t: yard → port → yard, 20 steps per round trip. */
export function truckAt(t: number): { lat: number; lon: number; status: string } {
  const p = (((t % 20) + 20) % 20) / 20;
  const f = p < 0.5 ? p * 2 : (1 - p) * 2;
  const { lat, lon } = PROJ.unproject(YARD_PX.x + (PORT_PX.x - YARD_PX.x) * f, YARD_PX.y + (PORT_PX.y - YARD_PX.y) * f);
  return { lat, lon, status: f === 0 ? 'at the yard' : p < 0.5 ? 'to the port' : 'back to the yard' };
}

export type KernelBridge = {
  subscribe: (path: string, cb: () => void) => () => void;
  /** Tell the subscribers of these kernel paths that they changed (the page's adapter does this). */
  announce: (paths: string[]) => number;
  /** Live listener count: every bound prop, read expression and hook holds one. */
  size: () => number;
};

/** The page's bridge shape: listeners keyed by dotted kernel path, `me/` prefix or not. */
export function createKernelBridge(): KernelBridge {
  const listeners = new Map<string, Set<() => void>>();
  const keyOf = (path: string) => (String(path).startsWith('me/') ? String(path).slice(3).replace(/\//g, '.') : String(path));
  return {
    subscribe(path, cb) {
      const key = keyOf(path);
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(cb);
      return () => {
        set!.delete(cb);
        if (!set!.size) listeners.delete(key);
      };
    },
    announce(paths) {
      let n = 0;
      for (const path of paths) listeners.get(keyOf(path))?.forEach((cb) => { n += 1; cb(); });
      return n;
    },
    size() {
      let n = 0;
      for (const set of listeners.values()) n += set.size;
      return n;
    },
  };
}

export function createVeracruzKernel() {
  const me: any = new (ME as any)();
  const t0 = truckAt(0);
  const seed: Record<string, any> = {
    ...SEED,
    [ME_SELECTION_PATH]: [...DEFAULT_SELECTION],
    [ME_LAYERS_PATH]: [],
    [ME_TRUCK.lat]: t0.lat,
    [ME_TRUCK.lon]: t0.lon,
    [ME_TRUCK.meta]: t0.status,
    'pins.qimpState': 'busy',
  };
  for (const [path, v] of Object.entries(seed)) {
    let node = me;
    for (const part of path.split('.')) node = node[part];
    node(v);
  }
  for (const [scope, name, expression] of ME_RULES) me[scope]['='](name, expression);
  const bridge = createKernelBridge();
  const runtime = createMeRuntime(me, { subscribe: bridge.subscribe });
  return { me, runtime, bridge };
}

/** One simulation step: every value goes through runtime.action, never a bare me.x(). */
export function tickVeracruz(runtime: RuntimeAdapter, t: number): void {
  const write = (path: string, v: unknown) => runtime.action!(`me/${path}`, undefined)(v);
  const remaining = Math.max(0, 96400 - t * 350);
  write('flows.importRemaining', remaining);
  write('trucks.import.enRoute', 38 + (t % 5));
  write('trucks.import.loading', 9 + (t % 3));
  write('trucks.inQueue', 14 - (t % 4));
  write('trucks.working', 102 + (t % 7));
  write('trucks.speed.avg', Math.round((31.4 + Math.sin(t / 3) * 2) * 10) / 10);
  write('pins.port', `queue ${14 - (t % 4)} · busy`);
  write('pins.ship1', `unloading · ${remaining.toLocaleString('en-US')} t`);
  write('pins.qimp', `${14 - (t % 4)} queued`);
  write('pins.qimpState', 14 - (t % 4) >= 13 ? 'busy' : 'default');
  write('pins.yard', `${102 + (t % 7)} trucks working`);
  const truck = truckAt(t);
  write(ME_TRUCK.lat, truck.lat);
  write(ME_TRUCK.lon, truck.lon);
  write(ME_TRUCK.meta, truck.status);
}

/** Legend rows as data: single paths, path lists (shown "a · b · c") and kernel rules for the sums. */
export const ME_LEGEND_ITEMS: OsmLegendItem[] = [
  { heading: 'heavy · 400' },
  { label: 'import, laden', tone: 'ship', bind: 'trucks.import.enRoute' },
  { label: 'export, laden', tone: 'train', bind: 'trucks.export.enRoute' },
  { label: 'load / unload', tone: 'yard', bind: 'trucks.loadUnload' },
  { label: 'queued', tone: 'secondary', bind: 'trucks.inQueue' },
  { label: 'returning', tone: 'neutral', bind: 'trucks.returningAll' },
  { label: 'pool', tone: 'neutral', swatch: 'ring', bind: 'trucks.heavy.available' },
  { heading: 'last-mile · 100' },
  { label: 'out · back', tone: 'error', swatch: { size: 5 }, bind: ['trucks.lastMile.enRoute', 'trucks.lastMile.returning'] },
  { label: 'load · idle', tone: 'error', swatch: { shape: 'ring', size: 6 }, bind: ['trucks.lastMile.loading', 'trucks.lastMile.available'] },
  { label: 'trips ○ · ✓ · ✗', tone: 'warning', swatch: { shape: 'square', size: 5 }, bind: ['trips.pending', 'trips.done', 'trips.unscheduled'] },
];

const SRC = 'OpenStreetMap.me.stories.tsx';

/**
 * The declarative spec the Veracruz page migration (S7) copies: plain JSON.
 * Reads are `{ read }` tokens and `bind` paths; writes are `{ write }` tokens.
 * The simulation clock and the off-map count are not kernel paths, so they
 * stay adapter values (dashed chip, legend footer text) with fixed text.
 */
export function veracruzMeSpec(options: { markerList?: boolean; legendWidth?: number } = {}): any {
  const { markerList = true, legendWidth = 214 } = options;
  const t0 = truckAt(0);
  return {
    type: 'OpenStreetMap',
    props: {
      ...VERACRUZ_FRAME,
      basemap: VERACRUZ_BASEMAP,
      source: VERACRUZ_SOURCE,
      ariaLabel: 'Port of Veracruz (OpenStreetMap basemap)',
      markerScale: 'screen',
      selected: { read: `me/${ME_SELECTION_PATH}` },
      onSelectionChange: { write: `me/${ME_SELECTION_PATH}` },
      hiddenLayers: { read: `me/${ME_LAYERS_PATH}` },
      onLayersChange: { write: `me/${ME_LAYERS_PATH}` },
    },
    provenance: { source: SRC, semanticPath: `me/${ME_SELECTION_PATH}`, note: 'The selection and the hidden layers are kernel facts, read and written through the runtime.' },
    children: [
      ...VERACRUZ_NODES.map((n) => {
        const { lat, lon } = PROJ.unproject(n.x, n.y);
        const meta = PIN_META_BIND[n.id];
        const bind: Record<string, string> = meta ? { meta } : {};
        if (n.id === 'n-qimp') bind.state = 'pins.qimpState';
        return {
          type: 'OpenStreetMapMarker',
          props: {
            id: n.id, lat, lon, shape: n.shape, size: n.size, width: n.width, height: n.height,
            tone: n.tone, state: n.state, icon: n.icon, label: n.label, meta: n.meta,
            labelPlacement: n.place ?? 'right', labelOffset: n.gap,
            ...(meta ? { bind } : {}),
          },
          provenance: meta
            ? { source: SRC, semanticPath: `me/${meta}`, note: 'Pin meta read from the kernel.' }
            : { source: SRC, note: 'Static pin (no kernel path).' },
        };
      }),
      {
        type: 'OpenStreetMapMarker',
        props: {
          id: 'n-truck', lat: t0.lat, lon: t0.lon, shape: 'circle', size: 18, icon: 'local_shipping',
          tone: 'warning', label: 'TRUCK[7]', meta: t0.status, labelPlacement: 'top',
          bind: { lat: ME_TRUCK.lat, lon: ME_TRUCK.lon, meta: ME_TRUCK.meta },
        },
        provenance: { source: SRC, semanticPath: `me/${ME_TRUCK.lat}`, note: 'Position facts written by the story tick.' },
      },
      ...(markerList ? [{ type: 'OpenStreetMapMarkerList', props: { width: 264 } }] : []),
      {
        type: 'OpenStreetMapLegend',
        props: { mono: true, width: legendWidth, items: ME_LEGEND_ITEMS, footer: 'kernel counts · 3 off-map (adapter)' },
        provenance: { source: SRC, semanticPath: 'me/trucks.import.enRoute', note: 'Rows are kernel paths and rules. The off-map count in the footer is adapter text.' },
      },
      { type: 'OpenStreetMapControls', props: { layers: true } },
      {
        type: 'OpenStreetMapChip',
        props: { mono: true, label: 'import left', value: { read: 'me/flows.importRemaining' }, unit: ' t', tone: 'ship', minValueCh: 9, fx: true },
        provenance: { source: SRC, semanticPath: 'me/flows.importRemaining' },
      },
      {
        type: 'OpenStreetMapChip',
        props: { mono: true, label: 'trucks.working · fleet', bind: ['trucks.working', 'trucks.fleet'], minValueCh: 9, fx: true },
        provenance: { source: SRC, semanticPath: 'me/trucks.working' },
      },
      {
        type: 'OpenStreetMapChip',
        props: { mono: true, label: 'simulation', value: '06:42 · ×4', variant: 'adapter' },
        provenance: { source: SRC, note: 'Simulation clock: an adapter value, not a kernel path (dashed).' },
      },
    ],
  };
}
