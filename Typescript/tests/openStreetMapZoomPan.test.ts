import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import { markerTransform } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMapMarker';
import { drawOsmCanvasFrame } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMapCanvas';
import { osmKeyAction, osmWheelZoomFactor } from '../src/gui/Compounds/OpenStreetMap/gestures';
import {
  OSM_STROKE_ZOOM_EXPONENT,
  clampOsmViewState,
  createOsmProjection,
  createOsmTransform,
  fitOsmView,
  osmMarkerScale,
  zoomOsmView,
  zoomOsmViewStateAt,
} from '../src/gui/Compounds/OpenStreetMap/projection';
import neuronsDark from '../src/gui/Theme/Catalog/themes/neurons/dark.tokens';

// GUI.OpenStreetMap S5b.1: zoom / pan with constant-size markers. Only the
// geometry zooms: markers (shape, icon, label, meta) keep their on-screen size,
// basemap strokes grow gently, the view stays on the map, and gestures map to
// the viewport actions. Selection is NOT part of this step: without selection
// props every marker renders in full, as before.
const h = React.createElement;
const FRAME = { bbox: { south: 19.192, west: -96.142, north: 19.205, east: -96.122 }, width: 1200, height: 800, pad: 24 };
const dark = makeMuiTheme(themeTokens, neuronsDark, 'dark');
const near = (a: number, b: number, msg: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);
const render = (children: React.ReactNode, props: Record<string, any> = {}) =>
  renderToString(h(ThemeProvider, { theme: dark }, h(OpenStreetMap, { ...FRAME, ...props }, children)));
const BASEMAP = {
  layers: [
    { id: 'roads-primary', style: { strokeWidth: 4 }, paths: ['M0 0L50 50'] },
    { id: 'places', circles: [{ cx: 10, cy: 10, r: 4 }] },
  ],
};

function markerSizeIsConstantOnScreen() {
  const p = createOsmProjection(FRAME);
  const size = 28;
  for (const [w, hgt] of [[1100, 460], [360, 560], [1600, 1000]]) {
    const fit = fitOsmView(p, w, hgt, 1);
    for (const zoom of [1, 1.5, 2, 4, 8, 16]) {
      const v = zoomOsmView(fit, { zoom, cx: 600, cy: 400 });
      const onScreenFit = size * osmMarkerScale('fit', v, zoom) * v.scale;
      const onScreenCss = size * osmMarkerScale('screen', v, zoom) * v.scale;
      near(onScreenFit, size * fit.scale, `'fit' size at ${w}x${hgt} zoom ${zoom}`);
      near(onScreenCss, size, `'screen' size at ${w}x${hgt} zoom ${zoom}`);
    }
  }
  assert.equal(markerTransform(10.004, 20, 1), 'translate(10,20)', 'no scale at 1 (fit view output unchanged)');
  assert.equal(markerTransform(10, 20, undefined), 'translate(10,20)');
  assert.equal(markerTransform(10, 20, 0.25), 'translate(10,20) scale(0.25)');
  assert.equal(markerTransform(10.123, 20.456, 1 / 3), 'translate(10.12,20.46) scale(0.3333)', 'sub-pixel positions kept while zoomed');
}

function markersRenderFullAtAnyZoom() {
  const m = h(OpenStreetMap.Marker, { key: 'p', id: 'port', lat: 19.2, lon: -96.13, size: 28, icon: 'anchor', label: 'VERACRUZ', meta: 'port.busy' });
  for (const zoom of [1, 4, 16]) {
    const html = render(m, { defaultView: { zoom } });
    const g = (html.match(/<g id="port"[^>]*>.*?<\/g>/) || [''])[0];
    assert.match(g, />VERACRUZ</, `label at zoom ${zoom}`);
    assert.match(g, />port\.busy</, `meta at zoom ${zoom}`);
    assert.match(g, /gui-osm-marker__icon/, `icon at zoom ${zoom}`);
    assert.match(g, /r="14"/, `same marker geometry at zoom ${zoom}`);
    if (zoom === 1) assert.match(g, /transform="translate\([\d.]+,[\d.]+\)"/, 'fit: plain translate');
    else assert.match(g, new RegExp(`scale\\(${Math.round((1 / zoom) * 10000) / 10000}\\)"`), `zoom ${zoom}: counter-scaled`);
  }
  // 'screen' needs a measured size; on the server (no size) it falls back to 1
  assert.doesNotMatch(render(m, { markerScale: 'screen' }), /scale\(/, 'screen mode without a size: unscaled');
}

function basemapStrokesGrowGently() {
  const z = 16;
  const html = render(null, { basemap: BASEMAP, defaultView: { zoom: z } });
  const k = 1 / Math.pow(z, OSM_STROKE_ZOOM_EXPONENT);
  const sw = Number((html.match(/id="roads-primary"[^>]*stroke-width="([\d.]+)"/) || [])[1]);
  near(sw, Math.round(4 * k * 1000) / 1000, 'stroke width / zoom^0.75', 1e-9);
  near(sw * z, 4 * Math.pow(z, 1 - OSM_STROKE_ZOOM_EXPONENT), 'on screen: zoom^0.25 × the fit width (2× at zoom 16)', 1e-2);
  const r = Number((html.match(/<circle cx="10" cy="10" r="([\d.]+)"/) || [])[1]);
  near(r, Math.round(4 * k * 1000) / 1000, 'place dots shrink like strokes', 1e-9);
  const fit = render(null, { basemap: BASEMAP });
  assert.match(fit, /id="roads-primary"[^>]*stroke-width="4"/, 'fit: style width untouched');
  assert.match(fit, /<circle cx="10" cy="10" r="4"/, 'fit: circle untouched');
}

function boundsKeepTheMapInView() {
  const p = createOsmProjection(FRAME);
  const fit = fitOsmView(p, 900, 450, 1); // wider than the frame: x has slack at the fit
  // zoom 1: the whole frame is visible → centred on both axes
  assert.deepEqual(clampOsmViewState(p, { zoom: 1, cx: 0, cy: 0 }, 1, 16, fit), { zoom: 1, cx: 600, cy: 400 });
  // zoom 4: visible rect = (900, 450) / (scale*4) map px; centre stays half a rect from the edges
  const s = 4 * fit.scale;
  const hw = 900 / (2 * s);
  const hh = 450 / (2 * s);
  const c = clampOsmViewState(p, { zoom: 4, cx: -1000, cy: 99999 }, 1, 16, fit);
  near(c.cx, hw, 'left edge');
  near(c.cy, 800 - hh, 'bottom edge');
  // zooming at a corner keeps the anchor until the bounds push back
  const z = zoomOsmViewStateAt(fit, { zoom: 1, cx: 600, cy: 400 }, 2, { x: 450, y: 225 });
  near(z.cx, 600, 'zoom about the centre keeps the centre');
}

function gestureMapping() {
  assert.ok(osmWheelZoomFactor(100) < 1 && osmWheelZoomFactor(-100) > 1, 'wheel down zooms out, up zooms in');
  near(osmWheelZoomFactor(100) * osmWheelZoomFactor(-100), 1, 'symmetric');
  near(osmWheelZoomFactor(3, 1), osmWheelZoomFactor(48, 0), 'line mode = 16 px per line');
  assert.ok(osmWheelZoomFactor(10, 0, true) < osmWheelZoomFactor(10, 0, false), 'trackpad pinch (ctrl+wheel) zooms faster per px');
  assert.ok(osmWheelZoomFactor(1e6) > 0.2, 'one huge wheel event is bounded');
  assert.deepEqual(osmKeyAction('ArrowLeft'), { pan: [64, 0] }, 'left arrow shows what is left (content moves right)');
  assert.deepEqual(osmKeyAction('ArrowDown', true), { pan: [0, -192] }, 'shift pans 3×');
  assert.deepEqual(osmKeyAction('+'), { zoom: 2 });
  assert.deepEqual(osmKeyAction('='), { zoom: 2 });
  assert.deepEqual(osmKeyAction('-'), { zoom: 0.5 });
  assert.deepEqual(osmKeyAction('0'), { reset: true });
  assert.equal(osmKeyAction('a'), null);
}

function rootIsFocusableAndTouchReady() {
  const on = render(null);
  assert.match(on, /<div class="gui-osm"[^>]*tabindex="0" role="region" aria-label="OpenStreetMap" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown \+ - 0"/);
  assert.match(on, /<div class="gui-osm"[^>]*style="[^"]*touch-action:none;cursor:grab/, 'drag / pinch own touch input');
  assert.match(on, /\.gui-osm:focus-visible\{outline:2px solid var\(--gui-osm-overlay-accent\)/, 'focus ring on the map');
  const off = render(null, { zoomPan: false });
  assert.doesNotMatch(off, /<div class="gui-osm"[^>]*(tabindex|touch-action|data-osm-gestures)/, 'zoomPan={false}: a static map again');
  const noKeys = render(null, { zoomPan: { keyboard: false } });
  assert.doesNotMatch(noKeys, /<div class="gui-osm"[^>]*tabindex/, 'keyboard off: not a tab stop');
  assert.match(noKeys, /touch-action:none/, 'drag still on');
}

function canvasGetsZoomAndMarkerScale() {
  const p = createOsmProjection(FRAME);
  const fit = fitOsmView(p, 600, 400, 1);
  const v = zoomOsmView(fit, { zoom: 4, cx: 600, cy: 400 });
  const t = createOsmTransform(p, { ...v, zoom: 4, markerScale: osmMarkerScale('fit', v, 4) });
  const ctx: any = new Proxy({}, { get: (_t, k) => (k === 'canvas' ? undefined : () => {}), set: () => true });
  let seen: any = null;
  drawOsmCanvasFrame({ width: 0, height: 0 } as any, ctx, t, (info) => { seen = info; }, { now: 0, dt: 0, frame: 1 });
  assert.equal(seen.zoom, 4);
  near(seen.markerScale, 0.25, 'canvas symbols can keep marker size');
  const t1 = createOsmTransform(p, fit);
  drawOsmCanvasFrame({ width: 0, height: 0 } as any, ctx, t1, (info) => { seen = info; }, { now: 0, dt: 0, frame: 1 });
  assert.equal(seen.zoom, 1, 'a plain fit view reads as zoom 1');
  assert.equal(seen.markerScale, 1);
}

markerSizeIsConstantOnScreen();
markersRenderFullAtAnyZoom();
basemapStrokesGrowGently();
boundsKeepTheMapInView();
gestureMapping();
rootIsFocusableAndTouchReady();
canvasGetsZoomAndMarkerScale();
console.log('openStreetMapZoomPan.test.ts: all assertions passed');
