import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { renderNode } from '../src/runtime/renderer';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import neuronsDark from '../src/gui/Theme/Catalog/themes/neurons/dark.tokens';
import { MeRuntimeProvider } from '../src/react/MeRuntimeProvider';
import OpenStreetMapResolver, {
  OpenStreetMapChipResolver,
  OpenStreetMapControlsResolver,
  OpenStreetMapLegendResolver,
  OpenStreetMapMarkerListResolver,
  OpenStreetMapMarkerResolver,
} from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap.resolver';
import { readMeValue } from '../src/runtime/run-me';
import {
  DEFAULT_SELECTION,
  ME_LAYERS_PATH,
  ME_RULES,
  ME_SELECTION_PATH,
  ME_TRUCK,
  createKernelBridge,
  createVeracruzKernel,
  tickVeracruz,
  truckAt,
  veracruzMeSpec,
} from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap.story.fixture';

// S6: the Veracruz map as a JSON spec on a real this.me kernel. Mounting reads
// but never writes; {read}/{write}/bind resolve through the runtime; a bare
// me.x() does not notify; unsubscribing releases the bridge; the tick moves
// the truck and the counts.
const h = React.createElement;
const theme = makeMuiTheme(themeTokens, neuronsDark, 'dark');
const REGISTRY = {
  OpenStreetMap: OpenStreetMapResolver,
  OpenStreetMapMarker: OpenStreetMapMarkerResolver,
  OpenStreetMapMarkerList: OpenStreetMapMarkerListResolver,
  OpenStreetMapLegend: OpenStreetMapLegendResolver,
  OpenStreetMapChip: OpenStreetMapChipResolver,
  OpenStreetMapControls: OpenStreetMapControlsResolver,
};
const WATCHED = [
  'flows.importRemaining', 'trucks.import.enRoute', 'trucks.working', 'trucks.loadUnload', 'trucks.returningAll',
  'pins.port', 'pins.ship1', 'pins.qimp', 'pins.qimpState', 'pins.yard', ME_SELECTION_PATH, ME_LAYERS_PATH,
  ME_TRUCK.lat, ME_TRUCK.lon, ME_TRUCK.meta,
];

function renderSpec() {
  const kernel = createVeracruzKernel();
  const html = renderToString(h(ThemeProvider, { theme }, h(MeRuntimeProvider, { me: kernel.me, runtime: kernel.runtime },
    renderNode(veracruzMeSpec(), { React, registry: REGISTRY, runtime: kernel.runtime }))));
  return { ...kernel, html };
}

function specIsPlainJson() {
  const spec = veracruzMeSpec();
  const json = JSON.stringify(spec);
  assert.equal(typeof json, 'string');
  const back = JSON.parse(json);
  assert.deepEqual(back.props.selected, { read: `me/${ME_SELECTION_PATH}` }, 'selection is a {read}');
  assert.deepEqual(back.props.onSelectionChange, { write: `me/${ME_SELECTION_PATH}` }, 'selection is a {write}');
  assert.deepEqual(back.props.hiddenLayers, { read: `me/${ME_LAYERS_PATH}` });
  assert.deepEqual(back.props.onLayersChange, { write: `me/${ME_LAYERS_PATH}` });
  assert.equal(back.props.markerScale, 'screen');
  const byType = (type: string) => back.children.filter((c: any) => c.type === type);
  const truck = back.children.find((c: any) => c.props?.id === 'n-truck');
  assert.deepEqual(truck.props.bind, { lat: ME_TRUCK.lat, lon: ME_TRUCK.lon, meta: ME_TRUCK.meta }, 'the truck position is bound');
  const port = back.children.find((c: any) => c.props?.id === 'n-port');
  assert.deepEqual(port.props.bind, { meta: 'pins.port' });
  assert.equal(port.provenance.semanticPath, 'me/pins.port');
  const qimp = back.children.find((c: any) => c.props?.id === 'n-qimp');
  assert.deepEqual(qimp.props.bind, { meta: 'pins.qimp', state: 'pins.qimpState' }, 'a pin status is bound');
  assert.equal(byType('OpenStreetMapMarkerList').length, 1, 'the marker list is in the spec');
  assert.equal(byType('OpenStreetMapControls').length, 1);
  assert.equal(byType('OpenStreetMapLegend').length, 1);
  const legend = byType('OpenStreetMapLegend')[0];
  assert.ok(legend.props.items.some((item: any) => item.bind === 'trucks.loadUnload'), 'a legend row binds a kernel rule');
  assert.equal(legend.props.footer, 'kernel counts · 3 off-map (adapter)', 'the off-map count stays adapter text');
  const chips = byType('OpenStreetMapChip');
  assert.deepEqual(chips[0].props.value, { read: 'me/flows.importRemaining' }, 'a chip value is a {read}');
  assert.deepEqual(chips[1].props.bind, ['trucks.working', 'trucks.fleet']);
  const clock = chips.find((c: any) => c.props.label === 'simulation');
  assert.equal(clock.props.variant, 'adapter');
  assert.equal(clock.props.bind, undefined, 'the simulation clock is not a kernel path');
  assert.equal(clock.props.value, '06:42 · ×4');
  JSON.stringify(spec, (_, v) => { if (typeof v === 'function') throw new Error('spec contains a function'); return v; });
}

function kernelRules() {
  const { me } = createVeracruzKernel();
  assert.equal(readMeValue(me, 'trucks.loadUnload', { allowBarePath: true }), 15, '9 + 6, derived in the kernel');
  assert.equal(readMeValue(me, 'trucks.returningAll', { allowBarePath: true }), 28, '17 + 11');
  assert.deepEqual(readMeValue(me, ME_SELECTION_PATH, { allowBarePath: true }), DEFAULT_SELECTION);
  assert.equal(ME_RULES.length, 2);
}

function mountingDoesNotWrite() {
  const { me, html } = renderSpec();
  const before = WATCHED.map((path) => JSON.stringify(readMeValue(me, path, { allowBarePath: true })));
  renderSpec();
  const after = WATCHED.map((path) => JSON.stringify(readMeValue(me, path, { allowBarePath: true })));
  assert.deepEqual(after, before, 'rendering reads the kernel and does not write it');
  assert.match(html, /<g id="n-port"[^>]*aria-pressed="true"/, 'the port starts selected, from the kernel');
  assert.match(html, /<g id="n-ship3"[^>]*aria-pressed="false"/);
  assert.match(html, /<g id="n-truck"[^>]*aria-pressed="false"/, 'the truck starts unselected');
  assert.match(html, /queue 14 · busy/, 'bound pin meta');
  assert.match(html, />15</, 'legend shows the derived load / unload sum');
  assert.match(html, /96,400/, 'chip shows the {read} value, formatted');
  assert.match(html, /102 · 500/, 'a multi-path chip joins with " · "');
  assert.match(html, /gui-osm-chip--adapter[^"]*"[^>]*>.*?simulation/, 'the clock keeps the dashed adapter variant');
  assert.match(html, /3 off-map \(adapter\)/);
  assert.match(html, /data-osm-dock="top-left"/, 'the marker list is docked');
  assert.match(html, /TRUCK\[7\]/);
}

function writesAndNotifications() {
  const { me, runtime } = createVeracruzKernel();
  // {write} on onSelectionChange arrives as (ids, info); only the ids are stored
  runtime.action!('me/ui.map.selected')(['n-yard'], { id: 'n-port', selected: false, source: 'map' });
  assert.deepEqual(me('ui.map.selected'), ['n-yard'], 'the info argument is not stored');
  runtime.action!('me/ui.map.hiddenLayers')(['water']);
  assert.deepEqual(me('ui.map.hiddenLayers'), ['water'], 'one-argument writes pass through');
  const again = renderToString(h(ThemeProvider, { theme }, h(MeRuntimeProvider, { me, runtime },
    renderNode(veracruzMeSpec(), { React, registry: REGISTRY, runtime }))));
  assert.match(again, /<g id="n-yard"[^>]*aria-pressed="true"/);
  assert.match(again, /<g id="n-port"[^>]*aria-pressed="false"/, 'the {read} selection follows the write');
  assert.match(again, /<g id="water" class="gui-osm__layer"[^>]*display="none"/, 'the {read} hidden layer is hidden');
  assert.match(again, /<g id="roads-residential" class="gui-osm__layer"(?![^>]*display="none")/, 'other layers stay visible');

  let notices = 0;
  const unsub = runtime.subscribe!('pins.port', () => { notices += 1; });
  me.pins.port('written directly');
  assert.equal(notices, 0, 'a bare me.x() write does not notify');
  assert.equal(me('pins.port'), 'written directly', 'the write itself did land');
  runtime.action!('me/pins.port')('via action');
  assert.equal(notices, 1, 'runtime.action notifies');
  unsub();
  runtime.action!('me/pins.port')('after unmount');
  assert.equal(notices, 1, 'unsubscribing releases the subscription');
}

function bridgeAnnounceAndRelease() {
  const bridge = createKernelBridge();
  let n = 0;
  const unsub = bridge.subscribe('me/trucks.heavy.available', () => { n += 1; });
  assert.equal(bridge.size(), 1);
  assert.equal(bridge.announce(['trucks.heavy.available']), 1, 'me/ and bare paths share a key');
  assert.equal(n, 1);
  unsub();
  assert.equal(bridge.size(), 0, 'unmount drops the listener');
  assert.equal(bridge.announce(['trucks.heavy.available']), 0);
  assert.equal(n, 1);
  // through the runtime: announcing on the bridge moves the snapshot too
  const { runtime, bridge: live } = createVeracruzKernel();
  let notices = 0;
  const stop = runtime.subscribe!('trucks.heavy.available', () => { notices += 1; });
  assert.ok(live.size() >= 1, 'the runtime subscribed the bridge');
  live.announce(['trucks.heavy.available']);
  assert.equal(notices, 1, 'an announce reaches the runtime subscriber');
  const held = live.size();
  stop();
  assert.equal(live.size(), held - 1, 'unsubscribing releases the bridge listener');
  live.announce(['trucks.heavy.available']);
  assert.equal(notices, 1);
}

function tickMovesTheTruckAndTheCounts() {
  const { me, runtime } = createVeracruzKernel();
  const start = truckAt(0);
  assert.equal(me('traffic.truck7.lat'), start.lat);
  tickVeracruz(runtime, 5);
  const mid = truckAt(5);
  assert.equal(me('traffic.truck7.lat'), mid.lat);
  assert.notEqual(mid.lat, start.lat, 'the truck moved');
  assert.equal(me('traffic.truck7.status'), 'to the port');
  assert.equal(me('flows.importRemaining'), 96400 - 5 * 350);
  assert.equal(me('pins.port'), 'queue 13 · busy');
  assert.equal(me('trucks.loadUnload'), 9 + (5 % 3) + 6, 'the rule recomputed from the tick write');
  tickVeracruz(runtime, 15);
  assert.equal(me('traffic.truck7.status'), 'back to the yard');
  assert.equal(me('pins.qimpState'), 'default', 'queue 14, 13, 12, 11 → not busy at t = 15 (14 - 3)');
}

specIsPlainJson();
kernelRules();
mountingDoesNotWrite();
writesAndNotifications();
bridgeAnnounceAndRelease();
tickMovesTheTruckAndTheCounts();
console.log('openStreetMapMe.test.ts: all assertions passed');
