import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { renderNode } from '../src/runtime/renderer';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import OpenStreetMapMarkerList from '../src/gui/Compounds/OpenStreetMap/OpenStreetMapMarkerList';
import OpenStreetMapResolver, { OpenStreetMapMarkerListResolver, OpenStreetMapMarkerResolver } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap.resolver';
import { useOpenStreetMapContext, type OpenStreetMapContextValue } from '../src/gui/Compounds/OpenStreetMap/context';
import { createOsmProjection, createOsmTransform, fitOsmView, osmMarkerScale, zoomOsmView } from '../src/gui/Compounds/OpenStreetMap/projection';
import {
  OSM_LABEL_SLOTS,
  osmEdgePin,
  osmLabelPriority,
  osmPinActivation,
  osmSlotBox,
  osmSlotOrder,
  placeOsmLabels,
  rectsOverlap,
  type OsmLabelItem,
  type OsmRect,
} from '../src/gui/Compounds/OpenStreetMap/pinLayout';
import { computeOsmPinLayout } from '../src/gui/Compounds/OpenStreetMap/usePinLayout';
import { createOsmLink, createOsmMarkerStore, toggleOsmSelection, type OsmMarkerInfo, type OsmSelectionState } from '../src/gui/Compounds/OpenStreetMap/selection';
import { buildOsmPalette, contrast, osmToneColor, OSM_DOMAIN_TONES } from '../src/gui/Compounds/OpenStreetMap/mapPalette';
import { renderNoSelectionSamples } from './osmNoSelectionSamples';
import neuronsLight from '../src/gui/Theme/Catalog/themes/neurons/light.tokens';
import neuronsDark from '../src/gui/Theme/Catalog/themes/neurons/dark.tokens';
import ghostLight from '../src/gui/Theme/Catalog/themes/GhostShell/light.tokens';
import ghostDark from '../src/gui/Theme/Catalog/themes/GhostShell/dark.tokens';
import princeLight from '../src/gui/Theme/Catalog/themes/PrinceOfDarkness/light.tokens';
import princeDark from '../src/gui/Theme/Catalog/themes/PrinceOfDarkness/dark.tokens';
import muiLight from '../src/gui/Theme/Catalog/themes/MUI/light.tokens';
import muiDark from '../src/gui/Theme/Catalog/themes/MUI/dark.tokens';
import lunaLight from '../src/gui/Theme/Catalog/themes/LunaHex/light.tokens';
import lunaDark from '../src/gui/Theme/Catalog/themes/LunaHex/dark.tokens';
import cherryLight from '../src/gui/Theme/Catalog/themes/CherryByte/light.tokens';
import cherryDark from '../src/gui/Theme/Catalog/themes/CherryByte/dark.tokens';
import seafoamLight from '../src/gui/Theme/Catalog/themes/Seafoam/light.tokens';
import seafoamDark from '../src/gui/Theme/Catalog/themes/Seafoam/dark.tokens';
import churchLight from '../src/gui/Theme/Catalog/themes/MdrnChurch/light.tokens';
import churchDark from '../src/gui/Theme/Catalog/themes/MdrnChurch/dark.tokens';

// GUI.OpenStreetMap S5b.2: pin selection (plan §4a). Controlled / uncontrolled
// multiple selection; selected = full pin, unselected = dot; no selection props =
// byte-identical SVG to before; edge pins clamp along the ray with an arrow and
// avoid overlays; greedy labels (8 slots → leader ≤ 24 px → collapsed); edge
// activation pans; MarkerList; contrast in all 16 theme modes.
const h = React.createElement;
const FRAME = { bbox: { south: 19.192, west: -96.142, north: 19.205, east: -96.122 }, width: 1200, height: 800, pad: 24 };
const themeOf = (tokens: any, mode: 'light' | 'dark') => makeMuiTheme(themeTokens, tokens, mode);
const dark = themeOf(neuronsDark, 'dark');
const near = (a: number, b: number, msg: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);
const render = (children: React.ReactNode, props: Record<string, any> = {}) =>
  renderToString(h(ThemeProvider, { theme: dark }, h(OpenStreetMap, { ...FRAME, ...props }, children)));
const gOf = (html: string, id: string) => (html.match(new RegExp(`<g id="${id}"[^>]*>.*?</g>(?=<g id=|</g></svg>)`)) || [''])[0];
const MARKERS = [
  h(OpenStreetMap.Marker, { key: 'a', id: 'a', lat: 19.2, lon: -96.13, size: 20, icon: 'anchor', tone: 'port', label: 'PORT', meta: 'busy' }),
  h(OpenStreetMap.Marker, { key: 'b', id: 'b', lat: 19.197, lon: -96.127, shape: 'rect', width: 30, height: 16, tone: 'ship', label: 'SHIP', meta: 'waiting' }),
  h(OpenStreetMap.Marker, { key: 'c', id: 'c', lat: 19.195, lon: -96.135, tone: 'yard', label: 'YARD' }),
];

function noSelectionPropsIsUnchanged() {
  const golden = JSON.parse(readFileSync(new URL('./fixtures/openStreetMap.noSelection.golden.json', import.meta.url), 'utf8'));
  const now = renderNoSelectionSamples();
  for (const k of Object.keys(golden)) assert.equal(now[k], golden[k], `no selection props: SVG identical to map/s5b1 (${k})`);
  const html = render(MARKERS);
  assert.doesNotMatch(html, /aria-pressed|gui-osm-marker--dot|gui-osm__announce/, 'no selection UI without selection props');
}

function selectionModes() {
  const ctl = render(MARKERS, { selected: ['a'] });
  assert.match(gOf(ctl, 'a'), /class="[^"]*gui-osm-marker--selected[^"]*"[^>]*role="button" tabindex="0" aria-pressed="true" aria-label="PORT, busy"/, 'selected = full pin, a toggle button');
  assert.match(gOf(ctl, 'a'), />PORT<.*>busy</, 'selected pin keeps label + meta');
  assert.match(gOf(ctl, 'b'), /gui-osm-marker--dot[^"]*"[^>]*role="button" tabindex="0" aria-pressed="false" aria-label="SHIP, waiting"/, 'unselected = dot button');
  assert.match(gOf(ctl, 'b'), /<title>SHIP, waiting<\/title>/, 'dot keeps its name as a tooltip');
  assert.doesNotMatch(gOf(ctl, 'b'), /gui-osm-marker__label|>SHIP</, 'dot has no label');
  assert.match(gOf(ctl, 'b'), /<circle class="gui-osm-marker__hit" r="12"/, '24 px hit target');
  assert.match(gOf(ctl, 'b'), /class="gui-osm-marker__core gui-osm-marker__dot" r="3.5"/, 'small dot');
  assert.match(ctl, /<svg[^>]*role="group"[^>]*aria-roledescription="map"/, 'map is a group of pins');
  assert.match(ctl, /class="gui-osm__announce" role="status" aria-live="polite"/, 'selection changes are announced');
  const unc = render(MARKERS, { defaultSelected: ['b', 'c'] });
  assert.match(gOf(unc, 'b'), /aria-pressed="true"/);
  assert.match(gOf(unc, 'c'), /aria-pressed="true"/);
  assert.match(gOf(unc, 'a'), /aria-pressed="false"/, 'uncontrolled defaultSelected');
  const none = render(MARKERS, { defaultSelected: [] });
  assert.equal((none.match(/gui-osm-marker--dot/g) || []).length, 3, 'empty selection = every pin a dot');
  // focus order = declaration order, whatever is selected
  const order = (html: string) => [...html.matchAll(/<g id="([abc])"[^>]*tabindex="0"/g)].map((m) => m[1]).join('');
  assert.equal(order(ctl), 'abc');
  assert.equal(order(render(MARKERS, { selected: ['c', 'a'] })), 'abc', 'stable focus order');
  // dots are constant CSS px; at zoom the dot group is counter-scaled (SSR: marker scale)
  assert.match(gOf(render(MARKERS, { selected: [], defaultView: { zoom: 4 } }), 'a'), /scale\(0.25\)/);
}

function selectionActions() {
  let ctx: OpenStreetMapContextValue | null = null;
  const Probe = () => { ctx = useOpenStreetMapContext(); return null; };
  const calls: Array<[string[], any]> = [];
  render([...MARKERS, h(Probe, { key: 'p' })], { selected: ['a'], onSelectionChange: (ids: string[], info: any) => calls.push([ids, info]) });
  const sel = ctx!.selection;
  assert.equal(sel.enabled, true);
  sel.toggle('b', 'map');
  assert.deepEqual(calls[0], [['a', 'b'], { id: 'b', selected: true, source: 'map' }], 'click a dot: appended (most recent last)');
  sel.toggle('a', 'keyboard');
  assert.deepEqual(calls[1], [['b'], { id: 'a', selected: false, source: 'keyboard' }], 'toggle off');
  sel.set([], 'list');
  assert.deepEqual(calls[2], [[], { id: null, selected: false, source: 'list' }], 'clear from the list');
  assert.deepEqual(toggleOsmSelection(['a', 'b'], 'c'), ['a', 'b', 'c']);
  assert.deepEqual(toggleOsmSelection(['a', 'b'], 'a'), ['b']);
  // activatePin without a layout entry toggles
  ctx!.activatePin('c', 'map');
  assert.deepEqual(calls[3][0], ['c'], 'activating an in-view pin toggles it');
}

function edgePins() {
  const bounds: OsmRect = { x: 0, y: 0, w: 1000, h: 500 };
  const half = { w: 10, h: 10 };
  assert.deepEqual(osmEdgePin({ x: 300, y: 200 }, bounds, half), { x: 300, y: 200, clamped: false }, 'in view: stays anchored');
  const r = osmEdgePin({ x: 2000, y: 200 }, bounds, half);
  assert.equal(r.clamped, true);
  assert.equal(r.reason, 'off-view');
  near(r.x, 1000 - 10 - 4, 'clamped to the inset right edge');
  near(r.y, 250 + (-50 * (r.x - 500)) / 1500, 'on the ray from the view centre');
  assert.ok(Math.abs(r.angle!) < 0.05, 'arrow points right');
  const ul = osmEdgePin({ x: -500, y: -500 }, bounds, half);
  near(ul.y, 14, 'up-left: clamped to the inset top edge');
  near((ul.angle! * 180) / Math.PI, (Math.atan2(-500 - ul.y, -500 - ul.x) * 180) / Math.PI, 'arrow toward the true spot');
  assert.ok(ul.angle! < -Math.PI / 2 && ul.angle! > -Math.PI, 'arrow points up-left');
  const down = osmEdgePin({ x: 500, y: 5000 }, bounds, half);
  near(down.x, 500, 'straight down');
  near(down.y, 486, 'bottom edge');
  near(down.angle!, Math.PI / 2, 'arrow points down');
  // avoids an overlay (legend top-right): walks inward along the same ray
  const legend: OsmRect = { x: 780, y: 0, w: 220, h: 200 };
  const p = { x: 1600, y: 60 };
  const e = osmEdgePin(p, bounds, half, [legend]);
  assert.ok(!rectsOverlap({ x: e.x - 10, y: e.y - 10, w: 20, h: 20 }, legend), 'edge pin clear of the legend');
  const c = { x: 500, y: 250 };
  near((p.x - c.x) * (e.y - c.y) - (p.y - c.y) * (e.x - c.x), 0, 'still on the centre → pin ray', 1e-6 * 1600 * 500);
  // a pin whose box would sit under an overlay moves out (with an arrow back)
  const occ = osmEdgePin({ x: 850, y: 100 }, bounds, half, [legend]);
  assert.equal(occ.reason, 'occluded');
  assert.ok(!rectsOverlap({ x: occ.x - 10, y: occ.y - 10, w: 20, h: 20 }, legend), 'out from under the legend');
  near(occ.angle!, Math.atan2(100 - occ.y, 850 - occ.x), 'arrow toward the hidden spot');
  assert.equal(osmPinActivation(occ), 'pan');
  // the whole ray is under overlays (narrow map): nearest clear spot instead
  const narrow: OsmRect = { x: 0, y: 0, w: 360, h: 420 };
  const wide: OsmRect = { x: 140, y: 0, w: 220, h: 230 };
  const under = osmEdgePin({ x: 900, y: -300 }, narrow, half, [wide, { x: 0, y: 380, w: 360, h: 40 }]);
  assert.ok(under.clamped && !rectsOverlap({ x: under.x - 10, y: under.y - 10, w: 20, h: 20 }, wide), 'fallback: clear of the legend');
  assert.ok(under.x >= 14 && under.x <= 346 && under.y >= 14 && under.y <= 406, 'fallback: inside the view');
  assert.ok(Math.cos(under.angle!) > 0 && Math.sin(under.angle!) < 0, 'fallback: arrow still toward the pin (up-right)');
  assert.equal(osmPinActivation(r), 'pan', 'activating an edge pin pans');
  assert.equal(osmPinActivation({ clamped: false }), 'toggle');
  assert.equal(osmPinActivation(undefined), 'toggle');
}

function labelFallbackOrder() {
  const bounds: OsmRect = { x: 0, y: 0, w: 800, h: 600 };
  const item: OsmLabelItem = { id: 'a', pin: { x: 400, y: 300 }, half: { w: 8, h: 8 }, w: 60, h: 20, gap: 5 };
  const slotOf = (obst: OsmRect[], it = item) => {
    const p = placeOsmLabels([it], bounds, obst).get(it.id)!;
    return p.kind === 'collapsed' ? 'collapsed' : `${p.kind}:${p.slot}`;
  };
  assert.deepEqual(osmSlotOrder({}), [...OSM_LABEL_SLOTS], 'fixed order');
  assert.deepEqual([...OSM_LABEL_SLOTS], ['right', 'left', 'top', 'bottom', 'top-right', 'top-left', 'bottom-right', 'bottom-left']);
  // block slots one by one: the next one in the order wins
  // (a 2×2 obstacle at a slot's centre blocks only that slot)
  const dotAt = (b: OsmRect): OsmRect => ({ x: b.x + b.w / 2 - 1, y: b.y + b.h / 2 - 1, w: 2, h: 2 });
  const dots: OsmRect[] = [];
  for (const slot of OSM_LABEL_SLOTS) {
    assert.equal(slotOf(dots), `slot:${slot}`, `next free slot: ${slot}`);
    dots.push(dotAt(osmSlotBox(item, slot)));
  }
  const blocked = OSM_LABEL_SLOTS.map((s) => osmSlotBox(item, s));
  // every slot blocked, but room 6–24 px further out → leader line
  const lead = placeOsmLabels([item], bounds, blocked).get('a')!;
  assert.equal(lead.kind, 'leader');
  if (lead.kind === 'leader') {
    assert.ok(Math.hypot(lead.to.x - lead.from.x, lead.to.y - lead.from.y) <= 24 + 8 + 5, 'leader short (≤ 24 px push)');
    // smallest push first, then slot order: the 60 px-wide side slots stay blocked; top (20 px tall) clears at +24
    assert.equal(lead.slot, 'top', 'first slot (in order) that frees up at the smallest push');
    assert.deepEqual(lead.box, osmSlotBox(item, 'top', 24));
  }
  // nothing within reach → collapsed
  const wall: OsmRect[] = [{ x: 0, y: 0, w: 800, h: 285 }, { x: 0, y: 315, w: 800, h: 285 }, { x: 0, y: 0, w: 385, h: 600 }, { x: 415, y: 0, w: 385, h: 600 }];
  assert.equal(slotOf(wall), 'collapsed', 'collapses when nothing fits');
  // the viewport edge blocks too: a pin at the right edge labels to the left
  assert.equal(slotOf([], { ...item, pin: { x: 790, y: 300 } }), 'slot:left');
  // preferred slot (labelPlacement) first; edge pins face inward
  assert.equal(slotOf([], { ...item, prefer: 'bottom' }), 'slot:bottom');
  assert.equal(osmSlotOrder({ inward: { x: -1, y: 0 } })[0], 'left', 'edge pin on the right edge: label inward (left)');
  assert.equal(osmSlotOrder({ inward: { x: 0, y: 1 } })[0], 'bottom', 'edge pin on the top edge: label below');
  // priority: focused / hovered, then most recent, then the rest
  assert.deepEqual(osmLabelPriority(['a', 'b', 'c'], null), ['c', 'b', 'a']);
  assert.deepEqual(osmLabelPriority(['a', 'b', 'c'], 'a'), ['a', 'c', 'b']);
  assert.deepEqual(osmLabelPriority(['a', 'b'], 'zzz'), ['b', 'a'], 'unknown focus ignored');
  // contested spot: the higher-priority label gets it, the other moves; labels never overlap
  const x: OsmLabelItem = { id: 'x', pin: { x: 300, y: 300 }, half: { w: 8, h: 8 }, w: 60, h: 20, gap: 5 };
  const y: OsmLabelItem = { id: 'y', pin: { x: 300, y: 318 }, half: { w: 8, h: 8 }, w: 60, h: 20, gap: 5 };
  const pl = placeOsmLabels([x, y], bounds);
  const px = pl.get('x')!;
  const py = pl.get('y')!;
  assert.equal(px.kind === 'slot' && px.slot, 'right', 'first in priority keeps its first choice');
  assert.ok(py.kind !== 'collapsed' && px.kind !== 'collapsed' && !rectsOverlap(px.box, py.box), 'no overlapping labels');
  assert.ok(py.kind !== 'collapsed' && !rectsOverlap(py.box, { x: 292, y: 292, w: 16, h: 16 }), 'labels avoid other pins');
  const pl2 = placeOsmLabels([y, x], bounds);
  assert.equal(pl2.get('y')!.kind === 'slot' && (pl2.get('y') as any).slot, 'right', 'priority decides who gets the contested slot');
}

function layoutWithTransform() {
  const p = createOsmProjection(FRAME);
  const fit = fitOsmView(p, 1000, 500, 1);
  const state = { zoom: 4, cx: 300, cy: 600 };
  const v = zoomOsmView(fit, state);
  const t = createOsmTransform(p, { ...v, zoom: 4, markerScale: osmMarkerScale('screen', v, 4) });
  const mk = (id: string, x: number, y: number, extra: Partial<OsmMarkerInfo> = {}): OsmMarkerInfo => {
    const g = p.unproject(x, y);
    return { id, lat: g.lat, lon: g.lon, shape: 'circle', size: 20, state: 'default', color: '#fff', label: id.toUpperCase(), order: 0, ...extra };
  };
  const markers = [mk('in', 300, 600), mk('east', 1100, 600), mk('north', 300, 50), mk('legend', 340, 560)];
  const legendBox = t.mapToScreen(340, 560);
  const obstacles = [{ x: legendBox.x - 40, y: legendBox.y - 30, w: 80, h: 60 }];
  const lay = computeOsmPinLayout({ markers, selected: ['in', 'east', 'north', 'legend'], transform: t, obstacles, focusId: null });
  const at = t.toScreen(markers[0].lat, markers[0].lon);
  assert.equal(lay.get('in')!.clamped, false);
  near(lay.get('in')!.x, at.x, 'in-view pin anchored', 1e-9);
  assert.equal(lay.get('in')!.k, 1, "markerScale 'screen': 1 marker unit = 1 CSS px");
  const east = lay.get('east')!;
  assert.equal(east.clamped, true);
  assert.ok(Math.abs(east.angle!) < 0.3 && east.x > 900, 'east pin on the right edge, arrow pointing right');
  assert.ok(east.label && east.label.kind !== 'collapsed' && east.label.box.x + east.label.box.w <= east.x, 'edge pin label on the inward side (left of a right-edge pin)');
  const north = lay.get('north')!;
  assert.ok(north.clamped && north.y < 40 && Math.abs(north.angle! + Math.PI / 2) < 0.3, 'north pin on the top edge, arrow up');
  const occ = lay.get('legend')!;
  assert.equal(occ.reason, 'occluded', 'pin under an overlay moves out');
  for (const [id, e] of lay) {
    if (e.label && e.label.kind !== 'collapsed') assert.ok(!obstacles.some((o) => rectsOverlap(e.label!.kind === 'collapsed' ? o : (e.label as any).box, o)), `${id}: label clear of overlays`);
  }
  // an unselected dot right where the first-choice label would go pushes that label to another slot
  const withDot = [...markers, mk('dot', 300 + 18 / v.scale, 600)];
  const ld = computeOsmPinLayout({ markers: withDot, selected: ['in'], transform: t, obstacles: [], focusId: null });
  const lin = ld.get('in')!.label!;
  assert.ok(lin.kind !== 'collapsed' && !(lin.kind === 'slot' && lin.slot === 'right'), 'labels avoid unselected dots');
  // hovering / focusing a pin re-prioritises labels but never moves pins (they would jump from under the pointer)
  for (const f of ['east', 'north', 'legend']) {
    const lf = computeOsmPinLayout({ markers, selected: ['in', 'east', 'north', 'legend'], transform: t, obstacles, focusId: f });
    for (const [id, e] of lay) assert.deepEqual([lf.get(id)!.x, lf.get(id)!.y], [e.x, e.y], `focus ${f}: ${id} does not move`);
  }
  assert.equal(computeOsmPinLayout({ markers, selected: [], transform: createOsmTransform(p, fitOsmView(p, 0, 0, 1)), obstacles: [], focusId: null }).size, 0, 'no size (SSR): no layout');
}

function showPinPans() {
  let ctx: OpenStreetMapContextValue | null = null;
  const Probe = () => { ctx = useOpenStreetMapContext(); return null; };
  const views: any[] = [];
  const p = createOsmProjection(FRAME);
  render([h(Probe, { key: 'p' })], { defaultSelected: [], view: { zoom: 4, center: p.unproject(300, 200) }, onViewChange: (v: any, info: any) => views.push([v, info.source]) });
  const g = p.unproject(800, 500);
  // (markers register in layout effects, which do not run on the server: register by hand)
  ctx!.markerStore.set({ id: 'far', lat: g.lat, lon: g.lon, shape: 'circle', size: 10, state: 'default', color: '#fff', label: 'FAR', order: 0 });
  ctx!.showPin('far');
  assert.equal(views.length, 1, 'edge click pans (instantly without requestAnimationFrame / under reduced motion)');
  assert.equal(views[0][1], 'pin', "view source 'pin'");
  const c = p.project(views[0][0].center.lat, views[0][0].center.lon);
  near(c.x, 800, 'centred on the pin x', 1e-6);
  near(c.y, 500, 'centred on the pin y', 1e-6);
}

function markerList() {
  const html = render([...MARKERS, h(OpenStreetMap.MarkerList, { key: 'l', id: 'pins' })], { defaultSelected: ['a'] });
  assert.match(html, /data-osm-dock="top-left"[^>]*><div id="pins" class="gui-osm-pins"/, 'MarkerList docks top-left in the map');
  // linked list outside the map, with a populated store
  const store = createOsmMarkerStore();
  store.set({ id: 'a', lat: 0, lon: 0, shape: 'circle', size: 10, state: 'default', color: '#0af', label: 'PORT', meta: 'queue 14', order: 0 });
  store.set({ id: 'b', lat: 0, lon: 0, shape: 'rect', size: 10, state: 'default', color: '#fa0', label: 'SHIP', order: 1 });
  const ids = ['a'];
  const selection: OsmSelectionState = { enabled: true, ids, has: (id) => ids.includes(id), toggle: () => {}, set: () => {} };
  const link = createOsmLink();
  link.publish({ store, selection, palette: buildOsmPalette(dark), showPin: () => {} });
  const list = renderToString(h(ThemeProvider, { theme: dark }, h(OpenStreetMapMarkerList, { link })));
  assert.match(list, /role="group" aria-label="Map pins"/);
  assert.match(list, /Pins<span[^>]*> · 1\/2<\/span>/, 'count');
  assert.match(list, /data-pin="a" data-selected="true".*?<input type="checkbox"[^>]*checked=""/, 'selected row checked');
  assert.match(list, /data-pin="b" data-selected="false".*?<input type="checkbox"(?![^>]*checked)/, 'unselected row unchecked');
  assert.match(list, /class="gui-osm-pins__value"[^>]*>queue 14</, 'live value (bound meta)');
  assert.match(list, /aria-label="Show PORT on the map"/, 'show-on-map button');
  assert.match(list, /class="gui-osm-control gui-osm-pins__all"[^>]*>Select all</);
  assert.match(list, /class="gui-osm-control gui-osm-pins__clear"(?![^>]*aria-disabled)[^>]*>Clear</, 'Clear enabled with a selection');
  const ro = createOsmLink();
  ro.publish({ store, selection: { ...selection, enabled: false }, palette: buildOsmPalette(dark), showPin: () => {} });
  const roHtml = renderToString(h(ThemeProvider, { theme: dark }, h(OpenStreetMapMarkerList, { link: ro })));
  assert.doesNotMatch(roHtml, /type="checkbox"|Select all/, 'no selection mode: read-only list');
  assert.match(roHtml, /Show SHIP on the map/);
  assert.match(renderToString(h(ThemeProvider, { theme: dark }, h(OpenStreetMapMarkerList, {}))), /No map linked/);
  // spec rendering
  const registry = { OpenStreetMap: OpenStreetMapResolver, OpenStreetMapMarker: OpenStreetMapMarkerResolver, OpenStreetMapMarkerList: OpenStreetMapMarkerListResolver };
  const spec = renderToString(h(ThemeProvider, { theme: dark }, h(() => renderNode({
    type: 'OpenStreetMap',
    props: { ...FRAME, defaultSelected: ['m'] },
    children: [{ type: 'OpenStreetMapMarker', props: { id: 'm', lat: 19.2, lon: -96.13, label: 'M' } }, { type: 'OpenStreetMapMarkerList', props: { id: 'speclist' } }],
  } as any, { React, registry } as any))));
  assert.match(spec, /data-osm-dock="top-left"[^>]*><div id="speclist"/, 'spec MarkerList docks');
  assert.match(spec, /<g id="m"[^>]*aria-pressed="true"/, 'spec marker selected');
}

function selectionContrast() {
  const CATALOG: Array<[string, any, any]> = [
    ['neurons.me', neuronsLight, neuronsDark], ['GhostShell', ghostLight, ghostDark], ['PrinceOfDarkness', princeLight, princeDark],
    ['MUI', muiLight, muiDark], ['LunaHex', lunaLight, lunaDark], ['CherryByte', cherryLight, cherryDark],
    ['Seafoam', seafoamLight, seafoamDark], ['MdrnChurch', churchLight, churchDark],
  ];
  const tones = ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral', ...Object.keys(OSM_DOMAIN_TONES)];
  for (const [name, light, darkT] of CATALOG) {
    for (const [mode, tokens] of [['light', light], ['dark', darkT]] as const) {
      const pal = buildOsmPalette(themeOf(tokens, mode));
      const tag = `${name} ${mode}`;
      for (const tone of tones) {
        const c = contrast(osmToneColor(pal, tone as any), pal.land);
        assert.ok(c >= 3, `${tag}: ${tone} dot / arrow ${c.toFixed(2)} < 3 on land`);
      }
      for (const st of ['busy', 'done'] as const) assert.ok(contrast(pal.states[st], pal.land) >= 3, `${tag}: ${st} dot`);
      assert.ok(contrast(pal.label, pal.land) >= 4.5, `${tag}: selected label`);
      assert.ok(contrast(pal.meta, pal.land) >= 3, `${tag}: leader line ${contrast(pal.meta, pal.land).toFixed(2)}`);
      assert.ok(contrast(pal.overlay.accent, pal.land) >= 3, `${tag}: pin focus ring`);
      assert.ok(contrast(pal.overlay.strong, pal.overlay.background) >= 4.5 && contrast(pal.overlay.text, pal.overlay.background) >= 4.5, `${tag}: list text`);
    }
  }
}

noSelectionPropsIsUnchanged();
selectionModes();
selectionActions();
edgePins();
labelFallbackOrder();
layoutWithTransform();
showPinPans();
markerList();
selectionContrast();
console.log('openStreetMapSelection.test.ts: all assertions passed');
