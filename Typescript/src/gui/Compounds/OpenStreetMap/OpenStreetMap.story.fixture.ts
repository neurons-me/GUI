/*
 * Shared story fixtures for the OpenStreetMap stories (Overlays, Controls, …):
 * the Veracruz markers, a this.me kernel seeded with the port page's counts
 * (optionally written every second through runtime.action), and the legend
 * rows bound to it. Excluded from the type emit (*.fixture.ts).
 */
import * as React from 'react';
import ME from 'this.me';
import { createMeRuntime } from '@/runtime/run-me';
import OpenStreetMapMarker from './OpenStreetMapMarker';
import type { OsmLegendItem } from './OpenStreetMapLegend';
import { createOsmProjection } from './projection';
import { VERACRUZ_FRAME, VERACRUZ_NODES } from './OpenStreetMap.veracruz.fixture';

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

