import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import ME from 'this.me';
import { createMeRuntime } from '../src/runtime/run-me';
import { MeRuntimeProvider } from '../src/react/MeRuntimeProvider';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import {
  OSM_ATTRIBUTION,
  createOsmProjection,
  createOsmTransform,
  fitOsmView,
  osmCanvasMatrix,
} from '../src/gui/Compounds/OpenStreetMap/projection';
import { createBoundValueSource } from '../src/gui/Compounds/OpenStreetMap/bindings';
import { drawOsmCanvasFrame } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMapCanvas';
import OpenStreetMapResolver, { OpenStreetMapMarkerResolver } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap.resolver';
import { renderNode } from '../src/runtime/renderer';

// GUI.OpenStreetMap: one transform contract (projection + view) shared by the
// basemap, markers and canvas layers; markers bound to kernel paths update
// only through the runtime's notifications. No DOM test environment exists in
// this package, so React trees are rendered with react-dom/server and the
// subscription lifecycle is exercised on the exact source the marker hands to
// useSyncExternalStore (React calls its unsubscribe on unmount).

// Same frame as veracruz-port/build_basemap.py (and port-routes.js PROJ).
const BBOX = { south: 19.192, west: -96.142, north: 19.205, east: -96.122 };
const FRAME = { bbox: BBOX, width: 1200, height: 800, pad: 24 };
const h = React.createElement;

const near = (a: number, b: number, eps = 1e-9, msg?: string) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg ?? ''} expected ${b}, got ${a}`);

function translateOf(html: string, id: string): [number, number] {
  const m = html.match(new RegExp(`<g[^>]*id="${id}"[^>]*transform="translate\\(([-\\d.]+),([-\\d.]+)\\)"`))
    || html.match(new RegExp(`<g[^>]*transform="translate\\(([-\\d.]+),([-\\d.]+)\\)"[^>]*id="${id}"`));
  assert.ok(m, `marker ${id} rendered with a translate()`);
  return [Number(m![1]), Number(m![2])];
}

function newKernel(): any {
  return new (ME as any)();
}

function projectionMapsKnownPoints() {
  const p = createOsmProjection(FRAME);
  const nw = p.project(BBOX.north, BBOX.west);
  near(nw.x, 24); near(nw.y, 24);
  const se = p.project(BBOX.south, BBOX.east);
  near(se.x, 1176); near(se.y, 776);
  const c = p.project((BBOX.north + BBOX.south) / 2, (BBOX.west + BBOX.east) / 2);
  near(c.x, 600); near(c.y, 400);
  // build_basemap.py's formula, independently: lon -96.132, lat 19.2
  near(p.project(19.2, -96.132).x, 24 + ((-96.132 - -96.142) / 0.02) * 1152, 1e-9);
  near(p.project(19.2, -96.132).y, 24 + ((19.205 - 19.2) / 0.013) * 752, 1e-9);
  // round trip (the Veracruz page converts its node pixels with unproject)
  const ll = p.unproject(801.6, 168.6);
  const back = p.project(ll.lat, ll.lon);
  near(back.x, 801.6, 1e-9); near(back.y, 168.6, 1e-9);
  assert.equal(p.viewBox, '0 0 1200 800');
  assert.throws(() => createOsmProjection({ ...FRAME, bbox: { ...BBOX, east: BBOX.west } }), /east > west/);

  // view fit = SVG xMidYMid meet
  const v1 = fitOsmView(p, 600, 400, 2);
  assert.deepEqual([v1.scale, v1.offsetX, v1.offsetY, v1.dpr], [0.5, 0, 0, 2]);
  const v2 = fitOsmView(p, 1200, 400);
  assert.deepEqual([v2.scale, v2.offsetX, v2.offsetY], [0.5, 300, 0]);
  const t = createOsmTransform(p, v2);
  const s = t.toScreen(BBOX.north, BBOX.west);
  near(s.x, 300 + 24 * 0.5); near(s.y, 24 * 0.5);
  assert.deepEqual(osmCanvasMatrix(v1), [1, 0, 0, 1, 0, 0]);
  assert.deepEqual(osmCanvasMatrix({ ...v2, dpr: 2 }), [1, 0, 0, 1, 600, 0]);
}

function fixedMarkersAndAttribution() {
  const p = createOsmProjection(FRAME);
  const html = renderToString(
    h(OpenStreetMap, {
      ...FRAME,
      basemap: { background: '#0b0d10', layers: [{ id: 'roads-primary', style: { stroke: '#505860' }, paths: ['M24,24 L1176,776'] }] },
      source: { generator: 'veracruz-port/build_basemap.py', dataSource: 'OpenStreetMap via Overpass API', query: 'overpass_query.txt' },
    },
    h(OpenStreetMap.Marker, { id: 'm-nw', lat: BBOX.north, lon: BBOX.west, shape: 'square', size: 10, label: 'NW' }),
    h(OpenStreetMap.Marker, { id: 'm-mid', lat: 19.2, lon: -96.132, shape: 'triangle', color: '#c9b87e' }),
    h(OpenStreetMap.Marker, { id: 'm-icon', lat: 19.196, lon: -96.128, shape: 'icon', icon: 'directions_boat' }),
    h(OpenStreetMap.Marker, { id: 'm-hidden', lat: 19.196, lon: -96.128, visible: false }),
    h(OpenStreetMap.Marker, { id: 'm-nocoords' })),
  );
  assert.deepEqual(translateOf(html, 'm-nw'), [24, 24]);
  const mid = p.project(19.2, -96.132);
  const [mx, my] = translateOf(html, 'm-mid');
  near(mx, mid.x, 0.005); near(my, mid.y, 0.005);
  assert.match(html, /<polygon class="gui-osm-marker__core"/);
  assert.match(html, /material-symbols-rounded[^>]*>directions_boat</, 'icon marker renders a GUI.Icon');
  assert.ok(!html.includes('id="m-hidden"') && !html.includes('id="m-nocoords"'));
  // Default basemapStyle 'theme': the layer is painted by kind (roads-primary) from
  // the theme palette, so the generator's baked-in stroke does not win...
  assert.match(html, /<g id="roads-primary"[^>]*data-osm-layer-kind="road-primary"[^>]*><path d="M24,24 L1176,776"/);
  assert.ok(!html.includes('stroke="#505860"'), 'theme colours win over the layer style');
  assert.ok(!html.includes('fill="#0b0d10"'), 'theme land wins over basemap.background');
  // ...while basemapStyle 'source' keeps the layer's own style, as before.
  const sourceHtml = renderToString(
    h(OpenStreetMap, {
      ...FRAME,
      basemapStyle: 'source',
      basemap: { background: '#0b0d10', layers: [{ id: 'roads-primary', style: { stroke: '#505860' }, paths: ['M24,24 L1176,776'] }] },
    }),
  );
  assert.match(sourceHtml, /<g id="roads-primary"[^>]*stroke="#505860"[^>]*><path d="M24,24 L1176,776"/);
  assert.match(sourceHtml, /<rect class="gui-osm__background"[^>]*fill="#0b0d10"/);
  // A marker given only `color` keeps its legacy look (filled with that colour).
  assert.match(html, /<polygon class="gui-osm-marker__core" fill="#c9b87e" stroke="#c9b87e"/);
  assert.ok(html.includes(OSM_ATTRIBUTION.text), 'OSM attribution is rendered');
  assert.ok(html.includes(OSM_ATTRIBUTION.href));
  assert.ok(html.includes('>ODbL<'), 'licence is rendered');
  assert.ok(html.includes('data-osm-bbox="-96.142,19.192,-96.122,19.205"'));
  assert.ok(html.includes('data-osm-frame="1200x800+24"'));
  assert.match(html, /<metadata>[^<]*build_basemap\.py[^<]*<\/metadata>/, 'source metadata is embedded');
  assert.match(html, /viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet"/);
}

function canvasLayerUsesTheSameTransform() {
  const p = createOsmProjection(FRAME);
  const view = fitOsmView(p, 600, 400, 2);
  const t = createOsmTransform(p, view);
  const calls: any[] = [];
  const ctx: any = new Proxy({}, {
    get: (_t, k) => (k === 'canvas' ? undefined : (...args: any[]) => calls.push([String(k), ...args])),
    set: () => true,
  });
  const canvas: any = { width: 0, height: 0 };
  let seen: any = null;
  drawOsmCanvasFrame(canvas, ctx, t, (info) => {
    seen = info;
    const q = info.project(BBOX.north, BBOX.west);
    info.ctx.fillRect(q.x, q.y, 1, 1);
  }, { now: 16, dt: 0.016, frame: 1 });
  assert.deepEqual([canvas.width, canvas.height], [1200, 800], 'backing store = css size × dpr');
  const setT = calls.filter((c) => c[0] === 'setTransform');
  assert.deepEqual(setT[1].slice(1), osmCanvasMatrix(view), 'draws in map pixels');
  assert.deepEqual(calls.find((c) => c[0] === 'rect')!.slice(1), [0, 0, 1200, 800], 'clipped to the map frame');
  assert.equal(seen.transform, t);
  assert.deepEqual(calls.find((c) => c[0] === 'fillRect')!.slice(1), [24, 24, 1, 1], 'project() in the callback = marker projection');
}

function makeBridge() {
  const listeners = new Map<string, Set<() => void>>();
  const subscribe = (path: string, cb: () => void) => {
    if (!listeners.has(path)) listeners.set(path, new Set());
    listeners.get(path)!.add(cb);
    return () => listeners.get(path)!.delete(cb);
  };
  const emit = (path: string) => listeners.get(path)?.forEach((cb) => cb());
  const count = () => [...listeners.values()].reduce((n, s) => n + s.size, 0);
  return { subscribe, emit, count };
}

function snapshotJson(me: any) {
  return JSON.stringify(me.exportSnapshot());
}

function boundMarkerFollowsTheRuntime() {
  const p = createOsmProjection(FRAME);
  const me = newKernel();
  me.vehicle.lat(19.2);
  me.vehicle.lon(-96.132);
  const before = { snapshot: snapshotJson(me), memories: me.memories.length };

  // The page's pattern: an explicit subscribe bridge on the existing runtime.
  const bridge = makeBridge();
  const runtime = createMeRuntime(me, { subscribe: bridge.subscribe });
  const render = () => renderToString(
    h(MeRuntimeProvider, { me, runtime },
      h(OpenStreetMap, FRAME,
        h(OpenStreetMap.Marker, { id: 'veh', bind: { lat: 'vehicle.lat', lon: 'vehicle.lon' }, label: 'fixed label' }))),
  );
  const at = (lat: number, lon: number) => {
    const q = p.project(lat, lon);
    return [Math.round(q.x * 100) / 100, Math.round(q.y * 100) / 100];
  };

  // mount (server render) reads the kernel through the runtime, writes nothing
  assert.deepEqual(translateOf(render(), 'veh'), at(19.2, -96.132));
  assert.equal(snapshotJson(me), before.snapshot, 'mount: exportSnapshot byte-identical');
  assert.equal(me.memories.length, before.memories, 'mount: memories count unchanged');
  assert.equal(me('subscribe'), undefined);

  // the exact store source the bound marker passes to useSyncExternalStore
  const latSource = createBoundValueSource(runtime, me, 'vehicle.lat');
  let notified = 0;
  const unsubscribe = latSource.subscribe(() => { notified += 1; });
  assert.equal(bridge.count(), 1, 'subscription registered on the explicit bridge');
  assert.equal(snapshotJson(me), before.snapshot, 'subscribe: exportSnapshot byte-identical');
  assert.equal(me.memories.length, before.memories, 'subscribe: memories count unchanged');
  assert.equal(me('subscribe'), undefined, "subscribe: me('subscribe') stays undefined");
  const first = latSource.getSnapshot();
  assert.equal(first, 19.2);

  // (i) write through the runtime adapter -> notified, marker moves
  runtime.action!('me/vehicle.lat', undefined)(19.201);
  assert.equal(notified, 1, 'runtime.action write notifies the bound marker');
  assert.equal(latSource.getSnapshot(), 19.201);
  assert.deepEqual(translateOf(render(), 'veh'), at(19.201, -96.132));

  // (ii) direct kernel write -> NOT notified (this.me@4.1.0 has no change listener)
  me.vehicle.lat(19.202);
  assert.equal(notified, 1, 'direct kernel write does not notify automatically');
  // ...until someone announces it: runtime.notify() or the explicit bridge
  runtime.notify!();
  assert.equal(notified, 2, 'runtime.notify() reaches the bound marker');
  assert.equal(latSource.getSnapshot(), 19.202);
  me.vehicle.lat(19.203);
  bridge.emit('vehicle.lat');
  assert.equal(notified, 3, 'explicit bridge event reaches the bound marker');
  assert.deepEqual(translateOf(render(), 'veh'), at(19.203, -96.132));

  // unmount: React calls the returned unsubscribe; it removes both registrations
  unsubscribe();
  assert.equal(bridge.count(), 0, 'bridge registration removed');
  runtime.action!('me/vehicle.lat', undefined)(19.204);
  runtime.notify!();
  assert.equal(notified, 3, 'no callbacks after unsubscribe');

  // the kernel stays exportable after mount + subscribe + writes
  let snap: any;
  assert.doesNotThrow(() => { snap = me.exportSnapshot(); });
  assert.ok(snap);
  assert.equal(me('subscribe'), undefined);
  assert.ok(!me.memories.some((m: any) => m.path === 'subscribe'), 'no subscribe memory in the log');
  // stable snapshots for flat objects (no useSyncExternalStore loop)
  me.vehicle.pos({ lat: 1, lon: 2 });
  const posSource = createBoundValueSource(runtime, me, 'vehicle.pos');
  assert.equal(posSource.getSnapshot(), posSource.getSnapshot());
  // unbound / no kernel -> inert source
  assert.equal(createBoundValueSource(runtime, me, undefined).getSnapshot(), undefined);
}

// nodeId makes a marker a GUI node (data-gui-node-id, for the Semantic
// Inspector / Layout Grid); without it the markup is unchanged. Registration
// itself (useRegisterGuiNode, an effect) needs a browser; the Veracruz page's
// headless check covers it.
function markerAsGuiNode() {
  const html = renderToString(
    h(OpenStreetMap, { ...FRAME },
      h(OpenStreetMap.Marker, { id: 'm-node', nodeId: 'map.node.port', provenance: { semanticPath: 'port.busy' }, lat: 19.2, lon: -96.132 }),
      h(OpenStreetMap.Marker, { id: 'm-plain', lat: 19.2, lon: -96.13 })),
  );
  assert.match(html, /<g id="m-node"[^>]*data-gui-component="OpenStreetMap.Marker"[^>]*data-gui-node-id="map.node.port"/);
  const plain = html.match(/<g id="m-plain"[^>]*>/);
  assert.ok(plain && !plain[0].includes('data-gui-node-id'), 'no nodeId -> no data-gui-node-id');
}

// From a spec (mount / renderNode) every child arrives wrapped in a keyed
// React.Fragment (renderer.ts renderResolvedSpecNode). The map must still put
// a Canvas layer next to the <svg>, not inside it (a <canvas> inside <svg> is
// an SVG element with no getContext), and keep markers inside the overlay.
const SPEC_REGISTRY = { OpenStreetMap: OpenStreetMapResolver, OpenStreetMapMarker: OpenStreetMapMarkerResolver };

function renderSpec(spec: any, extra: Record<string, any> = {}) {
  return renderToString(h(() => renderNode(spec, { React, registry: SPEC_REGISTRY, ...extra } as any)));
}

function specCanvasStaysOutsideSvg() {
  const html = renderSpec({
    type: 'OpenStreetMap',
    props: { id: 'map', ...FRAME },
    children: [
      { type: 'OpenStreetMapMarker', props: { id: 'm1', lat: 19.2, lon: -96.132 } },
      { type: OpenStreetMap.Canvas, props: { id: 'trucks', onFrame: () => {} } },
      // a Fragment the page wraps itself: nested layers are found too
      h(React.Fragment, null, h(OpenStreetMap.Canvas, { id: 'trucks2', onFrame: () => {} }), h('g', { id: 'edges' })),
    ],
  });
  const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>') + 6);
  assert.ok(svg.length > 10, 'svg rendered');
  assert.ok(!svg.includes('<canvas'), 'no <canvas> inside <svg>');
  assert.equal((html.match(/<canvas/g) || []).length, 2, 'both canvas layers rendered');
  assert.match(html, /<\/svg><canvas[^>]*id="trucks"/, 'canvas layer is the svg\'s sibling');
  assert.match(svg, /<g class="gui-osm__overlay">.*id="m1".*id="edges"/, 'markers and svg overlays stay in the overlay');
}

// The renderer injects data-gui-node-id into every spec node's props and
// records the node (with its spec provenance) for the Semantic Inspector;
// the map root, markers and canvas must put that id on their element so the
// inspector can select them and Layout Grid can outline them. Spec bindings
// (marker `bind`) pass through the resolver unchanged.
function specNodeIdsAndProvenance() {
  const me = newKernel();
  me.ships[1].lat(19.2);
  const runtime = createMeRuntime(me, { subscribe: makeBridge().subscribe });
  const records: any[] = [];
  const spec = {
    type: 'OpenStreetMap',
    props: { id: 'port-map', ...FRAME },
    children: [
      {
        type: 'OpenStreetMapMarker',
        props: { id: 'n-ship1', 'data-gui-node-id': 'map.n-ship1', bind: { lat: 'ships.1.lat' }, lon: -96.132 },
        provenance: { semanticPath: 'ships.1.hasWork' },
      },
      { type: OpenStreetMap.Canvas, props: { 'data-gui-node-id': 'map.trucks', onFrame: () => {} } },
    ],
  };
  const html = renderToString(
    h(MeRuntimeProvider, { me, runtime },
      h(() => renderNode(spec as any, { React, registry: SPEC_REGISTRY, onNodeResolved: (r: any) => records.push(r) } as any))),
  );
  assert.match(html, /<div[^>]*class="gui-osm"[^>]*data-gui-node-id="port-map"/, 'map root carries its node id');
  assert.match(html, /<g id="n-ship1"[^>]*data-gui-node-id="map.n-ship1"/, 'marker carries its spec node id');
  assert.match(html, /<canvas[^>]*data-gui-node-id="map.trucks"/, 'canvas layer carries its node id');
  assert.deepEqual(translateOf(html, 'n-ship1'), (() => {
    const q = createOsmProjection(FRAME).project(19.2, -96.132);
    return [Math.round(q.x * 100) / 100, Math.round(q.y * 100) / 100];
  })(), 'bind passes through the resolver');
  return Promise.resolve().then(() => {
    const byId = Object.fromEntries(records.map((r) => [r.id, r]));
    assert.equal(byId['port-map']?.type, 'OpenStreetMap');
    assert.equal(byId['map.n-ship1']?.type, 'OpenStreetMapMarker');
    assert.deepEqual(byId['map.n-ship1']?.provenance, { semanticPath: 'ships.1.hasWork' }, 'spec provenance recorded');
    assert.ok(byId['map.trucks'], 'canvas recorded');
  });
}

async function main() {
  projectionMapsKnownPoints();
  fixedMarkersAndAttribution();
  markerAsGuiNode();
  canvasLayerUsesTheSameTransform();
  boundMarkerFollowsTheRuntime();
  specCanvasStaysOutsideSvg();
  await specNodeIdsAndProvenance();
  console.log('openStreetMap.test.ts: all assertions passed');
}

main();
