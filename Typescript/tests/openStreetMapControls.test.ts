import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { renderNode } from '../src/runtime/renderer';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import OpenStreetMapResolver, { OpenStreetMapControlsResolver } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap.resolver';
import { useOpenStreetMapContext, type OpenStreetMapContextValue } from '../src/gui/Compounds/OpenStreetMap/context';
import {
  clampOsmViewState,
  createOsmProjection,
  fitOsmView,
  isOsmFitViewState,
  osmFitViewState,
  osmViewBox,
  panOsmViewState,
  zoomOsmView,
  zoomOsmViewStateAt,
} from '../src/gui/Compounds/OpenStreetMap/projection';
import { buildOsmPalette, contrast } from '../src/gui/Compounds/OpenStreetMap/mapPalette';
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

// GUI.OpenStreetMap S5: view state (zoom over the fit + centre, controlled or
// not, clamped), Controls (zoom in / out, reset, layer toggle) docked like the
// other overlays, hidden basemap layers, marker defaults, the svg role switch,
// and contrast of the control colours in every catalogue theme.
const h = React.createElement;
const FRAME = { bbox: { south: 19.192, west: -96.142, north: 19.205, east: -96.122 }, width: 1200, height: 800, pad: 24 };
const BASEMAP = {
  layers: [
    { id: 'water', paths: ['M0 0h100v100z'] },
    { id: 'roads-primary', paths: ['M0 0L50 50'] },
    { id: 'places', label: 'Terminals', circles: [{ cx: 10, cy: 10, r: 2 }] },
  ],
};
const themeOf = (tokens: any, mode: 'light' | 'dark') => makeMuiTheme(themeTokens, tokens, mode);
const dark = themeOf(neuronsDark, 'dark');
const near = (a: number, b: number, msg: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);

function render(children: React.ReactNode, props: Record<string, any> = {}, theme: any = dark) {
  return renderToString(h(ThemeProvider, { theme }, h(OpenStreetMap, { ...FRAME, ...props }, children)));
}
function dock(html: string, position: string): string {
  const m = html.match(new RegExp(`data-osm-dock="${position}"[^>]*>(.*?)</div><div class="gui-osm__dock|data-osm-dock="${position}"[^>]*>(.*?)</div></div><div class="gui-osm__attribution`));
  return m ? (m[1] ?? m[2] ?? '') : '';
}
const viewBoxOf = (html: string) => (html.match(/<svg[^>]*viewBox="([^"]+)"/) || [])[1];

function viewMath() {
  const p = createOsmProjection(FRAME);
  const fit = fitOsmView(p, 900, 500, 1);
  const s0 = osmFitViewState(p);
  assert.ok(isOsmFitViewState(p, s0), 'fit state is the fit');
  const z1 = zoomOsmView(fit, s0);
  near(z1.scale, fit.scale, 'zoom 1 = fit scale');
  near(z1.offsetX, fit.offsetX, 'zoom 1 = fit offsetX');
  near(z1.offsetY, fit.offsetY, 'zoom 1 = fit offsetY');

  // zooming about a point keeps the map point under it
  const at = { x: 200, y: 120 };
  const before = { x: (at.x - z1.offsetX) / z1.scale, y: (at.y - z1.offsetY) / z1.scale };
  const s2 = zoomOsmViewStateAt(fit, s0, 3, at);
  const v2 = zoomOsmView(fit, s2);
  near(s2.zoom, 3, 'zoom multiplied');
  near((at.x - v2.offsetX) / v2.scale, before.x, 'anchor x stays', 1e-6);
  near((at.y - v2.offsetY) / v2.scale, before.y, 'anchor y stays', 1e-6);

  // panning by screen px moves the centre by px / scale
  const s3 = panOsmViewState(fit, s2, 30, -12);
  near(s3.cx, s2.cx - 30 / v2.scale, 'pan x');
  near(s3.cy, s2.cy + 12 / v2.scale, 'pan y');

  // clamping: zoom range and centre inside the frame
  const c = clampOsmViewState(p, { zoom: 99, cx: -50, cy: 5000 }, 1, 8);
  assert.deepEqual(c, { zoom: 8, cx: 0, cy: 800 }, 'clamped to max zoom and frame');
  assert.equal(clampOsmViewState(p, { zoom: 0.2, cx: 600, cy: 400 }).zoom, 1, 'never below the fit by default');

  // viewBox: the visible map rectangle
  assert.equal(osmViewBox(p, fitOsmView(p, 0, 0, 1), { zoom: 2, cx: 600, cy: 400 }), '300 200 600 400', 'SSR: frame aspect');
  const fit2 = fitOsmView(p, 600, 400, 1);
  assert.equal(osmViewBox(p, fit2, { zoom: 4, cx: 300, cy: 200 }), '150 100 300 200', 'measured: container rect / scale');
}

function rootView() {
  const marker = h(OpenStreetMap.Marker, { key: 'm', id: 'm1', lat: 19.2, lon: -96.13 });
  const fitHtml = render(marker);
  assert.equal(viewBoxOf(fitHtml), '0 0 1200 800', 'no view props: the frame viewBox, as before');
  assert.doesNotMatch(fitHtml, /data-osm-zoom/, 'no zoom attribute at the fit');
  const zoomed = render(marker, { defaultView: { zoom: 2 } });
  assert.equal(viewBoxOf(zoomed), '300 200 600 400', 'defaultView zoom 2 about the frame centre');
  assert.match(zoomed, /data-osm-zoom="2"/, 'zoom exposed on the root');
  const tr = (html: string) => (html.match(/id="m1"[^>]*transform="([^"]+)"|transform="([^"]+)"[^>]*id="m1"/) || []).slice(1).find(Boolean);
  assert.equal(tr(zoomed), tr(fitHtml), 'markers stay in map px; the viewBox does the zoom');

  const p = createOsmProjection(FRAME);
  const geo = p.unproject(900, 200);
  const controlled = render(marker, { view: { zoom: 4, center: geo } });
  const vb = viewBoxOf(controlled)!.split(' ').map(Number);
  near(vb[0], 900 - 150, 'controlled centre x', 1e-2);
  near(vb[1], 200 - 100, 'controlled centre y', 1e-2);
  near(vb[2], 300, 'controlled width', 1e-6);
  const clamped = render(marker, { view: { zoom: 64 }, maxZoom: 8 });
  assert.match(clamped, /data-osm-zoom="8"/, 'controlled view clamped to maxZoom');
}

function viewportActions() {
  // A controlled map: actions report through onViewChange; the parent owns the state.
  let ctx: OpenStreetMapContextValue | null = null;
  const Probe = () => {
    ctx = useOpenStreetMapContext();
    return null;
  };
  const calls: Array<{ view: any; source: string }> = [];
  const p = createOsmProjection(FRAME);
  render(h(Probe), { view: { zoom: 2 }, maxZoom: 8, onViewChange: (view: any, info: any) => calls.push({ view, source: info.source }) });
  const vp = ctx!.viewport;
  assert.equal(vp.zoom, 2);
  assert.equal(vp.isFit, false);
  vp.zoomBy(2, 'button');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].source, 'button');
  near(calls[0].view.zoom, 4, 'zoom in doubles');
  vp.zoomBy(100, 'button');
  near(calls[1].view.zoom, 8, 'zoom in stops at maxZoom');
  vp.zoomBy(8, 'button');
  assert.equal(calls.length, 2, 'no change at the limit, no event');
  vp.reset();
  near(calls[2].view.zoom, 1, 'reset to the fit');
  assert.equal(calls[2].source, 'reset');
  const c = p.unproject(600, 400);
  near(calls[2].view.center.lat, c.lat, 'reset centre lat', 1e-9);
  vp.panTo(19.2, -96.13, 'api');
  const target = p.project(19.2, -96.13);
  const got = p.project(calls[3].view.center.lat, calls[3].view.center.lon);
  near(got.x, target.x, 'panTo x', 1e-6);
  near(got.y, target.y, 'panTo y', 1e-6);
  vp.setView({ zoom: 3 }, 'api');
  near(calls[4].view.zoom, 3, 'setView zoom');
  vp.setView({ zoom: 0.1 }, 'api');
  near(calls[5].view.zoom, 1, 'setView clamped to minZoom');
}

function controls() {
  const html = render(h(OpenStreetMap.Controls, { key: 'c', id: 'ctl', layers: true }), { basemap: BASEMAP });
  const right = dock(html, 'right');
  assert.match(right, /id="ctl"/, 'Controls dock on the right edge by default');
  assert.doesNotMatch(dock(html, 'top-right') + dock(html, 'bottom') + dock(html, 'bottom-right'), /gui-osm-controls/, 'not in the legend / chip / attribution docks');
  assert.match(right, /role="group" aria-label="Map controls"/);
  for (const label of ['Zoom in', 'Zoom out', 'Reset view', 'Map layers']) {
    assert.match(right, new RegExp(`<button type="button"[^>]*aria-label="${label}"`), `${label} is a native button`);
  }
  assert.doesNotMatch(right, /<button[^>]*aria-label="Zoom in"[^>]*aria-disabled/, 'zoom in enabled at the fit');
  assert.match(right, /<button[^>]*aria-label="Zoom out"[^>]*aria-disabled="true"/, 'zoom out disabled at the fit (still focusable)');
  assert.match(right, /<button[^>]*aria-label="Reset view"[^>]*aria-disabled="true"/, 'reset disabled at the fit');
  assert.doesNotMatch(right, /disabled=""/, 'never the disabled attribute (keeps focus)');
  assert.match(right, /aria-label="Map layers"[^>]*aria-expanded="false" aria-controls="gui-osm-layers-[^"]+"/, 'layer toggle is a disclosure');
  assert.match(right, /aria-live="polite"[^>]*>Zoom 100%</, 'zoom announced politely');

  const atMax = dock(render(h(OpenStreetMap.Controls, { key: 'c' }), { defaultView: { zoom: 16 } }), 'right');
  assert.match(atMax, /aria-label="Zoom in"[^>]*aria-disabled="true"/, 'zoom in disabled at maxZoom');
  assert.doesNotMatch(atMax, /aria-label="Zoom out"[^>]*aria-disabled/, 'zoom out enabled when zoomed');
  assert.doesNotMatch(atMax, /aria-label="Map layers"/, 'no layer toggle unless asked');

  const noBasemap = dock(render(h(OpenStreetMap.Controls, { key: 'c', layers: true })), 'right');
  assert.doesNotMatch(noBasemap, /Map layers/, 'no layer toggle without basemap layers');

  const placed = render(h(OpenStreetMap.Controls, { key: 'c', position: 'top-left', zoom: false }));
  assert.match(dock(placed, 'top-left'), /aria-label="Reset view"/, 'position prop');
  assert.doesNotMatch(dock(placed, 'top-left'), /Zoom in/, 'zoom buttons optional');

  // focus / hover styling comes from the injected style, in the accent colour
  assert.match(html, /\.gui-osm-control:focus-visible\{outline:2px solid var\(--gui-osm-overlay-accent\)/);
  assert.match(html, /--gui-osm-overlay-accent:/, 'accent var on the root');
}

function layers() {
  const open = render(h(OpenStreetMap.Controls, { key: 'c', layers: true, defaultLayersOpen: true }), { basemap: BASEMAP, defaultHiddenLayers: ['roads-primary'] });
  const right = dock(open, 'right');
  assert.match(right, /aria-expanded="true"/);
  assert.match(right, /<fieldset[^>]*class="gui-osm-controls__layers"/);
  assert.match(right, /<legend[^>]*>Layers<\/legend>/);
  assert.match(right, /<input type="checkbox"[^>]*checked=""[^>]*\/>Water/, 'labels by kind, visible = checked');
  assert.match(right, /<input type="checkbox"(?![^>]*checked)[^>]*\/>Primary roads/, 'hidden layer unchecked');
  assert.match(right, /\/>Terminals/, 'explicit layer label wins');
  const svg = open.slice(open.indexOf('<svg'), open.indexOf('</svg>'));
  assert.match(svg, /id="roads-primary"[^>]*display="none"/, 'hidden layer not painted');
  assert.doesNotMatch(svg, /id="water"[^>]*display="none"/, 'others painted');
  const controlled = render(null, { basemap: BASEMAP, hiddenLayers: ['water'] });
  assert.match(controlled, /id="water"[^>]*display="none"/, 'controlled hiddenLayers');
}

function markerDefaultsAndRole() {
  const html = render([
    h(OpenStreetMap.Marker, { key: 'a', id: 'a', lat: 19.2, lon: -96.13 }),
    h(OpenStreetMap.Marker, { key: 'b', id: 'b', lat: 19.2, lon: -96.13, shape: 'circle', tone: 'ship' }),
    h(OpenStreetMap.Marker, { key: 'c', id: 'c', lat: 19.2, lon: -96.13, color: '#ff0000' }),
  ], { markerDefaults: { shape: 'square', tone: 'port', size: 14 } });
  const g = (id: string) => (html.match(new RegExp(`<g[^>]*id="${id}"[^>]*>.*?</g>`)) || [''])[0];
  assert.match(g('a'), /data-tone="port"/, 'default tone');
  assert.match(g('a'), /<rect[^>]*width="14"/, 'default shape + size');
  assert.match(g('b'), /data-tone="ship"/, 'own tone wins');
  assert.match(g('b'), /<circle/, 'own shape wins');
  assert.doesNotMatch(g('c'), /data-tone=/, 'explicit colour keeps the legacy look');
  assert.match(html, /<svg[^>]*role="img"/, 'static map is an image');
  const clickable = render(h(OpenStreetMap.Marker, { key: 'a', lat: 19.2, lon: -96.13, onClick: () => {} }));
  assert.match(clickable, /<svg[^>]*role="group"[^>]*aria-roledescription="map"/, 'clickable markers make it a group');
}

function controlColoursContrast() {
  const CATALOG: Array<[string, any, any]> = [
    ['neurons.me', neuronsLight, neuronsDark], ['GhostShell', ghostLight, ghostDark], ['PrinceOfDarkness', princeLight, princeDark],
    ['MUI', muiLight, muiDark], ['LunaHex', lunaLight, lunaDark], ['CherryByte', cherryLight, cherryDark],
    ['Seafoam', seafoamLight, seafoamDark], ['MdrnChurch', churchLight, churchDark],
  ];
  for (const [name, light, darkTokens] of CATALOG) {
    for (const [mode, tokens] of [['light', light], ['dark', darkTokens]] as const) {
      const pal = buildOsmPalette(themeOf(tokens, mode));
      const o = pal.overlay;
      const tag = `${name} ${mode}`;
      assert.ok(contrast(o.strong, o.background) >= 4.5, `${tag}: control glyph ${contrast(o.strong, o.background).toFixed(2)} < 4.5`);
      assert.ok(contrast(o.accent, o.background) >= 3, `${tag}: focus ring on the control ${contrast(o.accent, o.background).toFixed(2)} < 3`);
      // the ring sits 2 px outside the button, over the map land
      assert.ok(contrast(o.accent, pal.land) >= 3, `${tag}: focus ring on the map ${contrast(o.accent, pal.land).toFixed(2)} < 3`);
    }
  }
}

function specControls() {
  const registry = { OpenStreetMap: OpenStreetMapResolver, OpenStreetMapControls: OpenStreetMapControlsResolver };
  const html = renderToString(h(ThemeProvider, { theme: dark }, h(() => renderNode({
    type: 'OpenStreetMap',
    props: { id: 'map', ...FRAME },
    children: [{ type: 'OpenStreetMapControls', props: { id: 'ctl' } }],
  } as any, { React, registry } as any))));
  assert.match(dock(html, 'right'), /id="ctl"/, 'spec Controls dock');
}

viewMath();
rootView();
viewportActions();
controls();
layers();
markerDefaultsAndRole();
controlColoursContrast();
specControls();
console.log('openStreetMapControls.test.ts: all assertions passed');
