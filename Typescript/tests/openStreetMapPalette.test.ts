import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import { drawOsmCanvasFrame } from '../src/gui/Compounds/OpenStreetMap/OpenStreetMapCanvas';
import { createOsmProjection, createOsmTransform, fitOsmView } from '../src/gui/Compounds/OpenStreetMap/projection';
import {
  buildOsmPalette,
  contrast,
  deltaE,
  mix,
  OSM_WATER_MIN_CONTRAST,
  osmLayerKind,
  osmToneColor,
  type OsmPalette,
} from '../src/gui/Compounds/OpenStreetMap/mapPalette';
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

// GUI.OpenStreetMap palette: every colour is derived from the existing theme
// tokens (no map.* tokens). Token files are imported directly (the manifests
// pull in badge images that tsx cannot load) and compiled with makeMuiTheme,
// exactly as <Theme> does.
const h = React.createElement;
const CATALOG: Array<[string, any, any]> = [
  ['neurons.me', neuronsLight, neuronsDark],
  ['GhostShell', ghostLight, ghostDark],
  ['PrinceOfDarkness', princeLight, princeDark],
  ['MUI', muiLight, muiDark],
  ['LunaHex', lunaLight, lunaDark],
  ['CherryByte', cherryLight, cherryDark],
  ['Seafoam', seafoamLight, seafoamDark],
  ['MdrnChurch', churchLight, churchDark],
];
const themeOf = (tokens: any, mode: 'light' | 'dark') => makeMuiTheme(themeTokens, tokens, mode);
const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FRAME = { bbox: { south: 19.192, west: -96.142, north: 19.205, east: -96.122 }, width: 1200, height: 800, pad: 24 };

function everyThemeModeIsLegible() {
  for (const [name, light, dark] of CATALOG) {
    for (const [mode, tokens] of [['light', light], ['dark', dark]] as const) {
      const theme = themeOf(tokens, mode);
      const pal = buildOsmPalette(theme);
      const at = `${name}/${mode}`;
      assert.equal(pal.mode, mode, `${at}: palette mode`);
      assert.equal(contrast(pal.land, theme.palette.background.default), 1, `${at}: land = background.default`);
      assert.ok(contrast(pal.label, pal.land) >= 4.5, `${at}: label ≥ 4.5:1 on land`);
      assert.ok(contrast(pal.meta, pal.land) >= 4.5, `${at}: meta ≥ 4.5:1 on land`);
      for (const [k, c] of [...Object.entries(pal.tones), ...Object.entries(pal.domain)]) {
        assert.ok(contrast(c, pal.land) >= 3, `${at}: tone ${k} ≥ 3:1 on land (${contrast(c, pal.land).toFixed(2)})`);
      }
      // roads get stronger with rank, and the primary road stands off the land
      const r = pal.road;
      assert.ok(contrast(r.primary, pal.land) > contrast(r.secondary, pal.land), `${at}: primary > secondary`);
      assert.ok(contrast(r.secondary, pal.land) > contrast(r.tertiary, pal.land), `${at}: secondary > tertiary`);
      assert.ok(contrast(r.tertiary, pal.land) > contrast(r.minor, pal.land), `${at}: tertiary > minor`);
      assert.ok(contrast(r.primary, pal.land) >= 2, `${at}: primary road ≥ 2:1 on land`);
      // water lines read as water (≥ 2.25:1, light modes included); areas stay subtle, under the line
      assert.ok(contrast(pal.water, pal.land) >= OSM_WATER_MIN_CONTRAST, `${at}: water ≥ ${OSM_WATER_MIN_CONTRAST}:1 (${contrast(pal.water, pal.land).toFixed(2)})`);
      assert.ok(contrast(pal.waterArea, pal.land) > 1.1 && contrast(pal.waterArea, pal.land) < contrast(pal.water, pal.land), `${at}: water area subtle`);
      // the five domain tones stay apart (port / ship / train / yard / queue)
      const d = Object.values(pal.domain);
      for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
        assert.ok(deltaE(d[i], d[j]) >= 12, `${at}: domain tones distinct (ΔE ${deltaE(d[i], d[j]).toFixed(1)})`);
      }
    }
  }
}

function darkWaterUnchangedAndAccentRule() {
  // dark modes that already had visible water keep the S2 formula exactly
  for (const tokens of [neuronsDark, ghostDark, muiDark, seafoamDark]) {
    const theme = themeOf(tokens, 'dark');
    const pal = buildOsmPalette(theme);
    assert.equal(pal.water, mix(pal.land, theme.palette.info.main, 0.45), 'dark water line unchanged');
    assert.equal(pal.waterArea, mix(pal.land, theme.palette.info.main, 0.18), 'dark water area unchanged');
  }
  // CherryByte dark (was 1.87:1) is raised
  assert.ok(contrast(buildOsmPalette(themeOf(cherryDark, 'dark')).water, buildOsmPalette(themeOf(cherryDark, 'dark')).land) >= OSM_WATER_MIN_CONTRAST);
  // theme accent takes the primary / port / highlight roles only where primary is weak and accent is stronger
  for (const [name, tokens, accentHex] of [['Seafoam dark', seafoamDark, 'rgb(240, 183, 164)'], ['PrinceOfDarkness dark', princeDark, 'rgb(0, 209, 178)']] as const) {
    const pal = buildOsmPalette(themeOf(tokens, 'dark'));
    assert.equal(pal.accent, accentHex, `${name}: accent used`);
    assert.equal(pal.tones.primary, accentHex, `${name}: primary tone = accent`);
    assert.equal(pal.domain.port, accentHex, `${name}: port = accent`);
    assert.equal(pal.states.highlight, accentHex, `${name}: highlight = accent`);
    assert.ok(contrast(pal.states.highlight, pal.land) >= 9, `${name}: highlight is vivid`);
  }
  for (const [name, tokens, mode] of [['PrinceOfDarkness light', princeLight, 'light'], ['CherryByte light', cherryLight, 'light'], ['CherryByte dark', cherryDark, 'dark'], ['Seafoam light', seafoamLight, 'light'], ['neurons dark', neuronsDark, 'dark']] as const) {
    const theme = themeOf(tokens, mode);
    const pal = buildOsmPalette(theme);
    assert.equal(pal.accent, null, `${name}: primary kept (strong enough, or no accent)`);
  }
}

function layerKindsFromIds() {
  const kinds = ['water', 'water-polys', 'roads-residential', 'roads-tertiary', 'roads-secondary', 'roads-primary', 'places', 'edges']
    .map((id) => osmLayerKind({ id }));
  assert.deepEqual(kinds, ['water', 'water-area', 'road-minor', 'road-tertiary', 'road-secondary', 'road-primary', 'place', 'custom']);
  assert.equal(osmLayerKind({ id: 'whatever', kind: 'water' }), 'water', 'explicit kind wins');
}

function render(theme: any, children: React.ReactNode, props: Record<string, any> = {}) {
  return renderToString(h(ThemeProvider, { theme }, h(OpenStreetMap, { ...FRAME, ...props }, children)));
}

function markerTonesAndStatesFollowTheTheme() {
  for (const [mode, tokens] of [['light', neuronsLight], ['dark', neuronsDark]] as const) {
    const theme = themeOf(tokens, mode);
    const pal = buildOsmPalette(theme);
    const html = render(theme, [
      h(OpenStreetMap.Marker, { key: 'a', id: 'ship', lat: 19.2, lon: -96.13, tone: 'ship', label: 'SHIP' }),
      h(OpenStreetMap.Marker, { key: 'b', id: 'busy', lat: 19.2, lon: -96.13, tone: 'ship', state: 'busy' }),
      h(OpenStreetMap.Marker, { key: 'c', id: 'done', lat: 19.2, lon: -96.13, tone: 'train', state: 'done' }),
      h(OpenStreetMap.Marker, { key: 'd', id: 'hl', lat: 19.2, lon: -96.13, tone: 'port', state: 'highlight', label: 'PORT' }),
      h(OpenStreetMap.Marker, { key: 'e', id: 'dim', lat: 19.2, lon: -96.13, tone: 'yard', state: 'dimmed' }),
      h(OpenStreetMap.Marker, { key: 'f', id: 'own', lat: 19.2, lon: -96.13, tone: 'ship', color: '#123456' }),
    ], { basemap: { background: '#0b0d10', layers: [{ id: 'roads-primary', style: { stroke: '#505860', strokeWidth: 2.6 }, paths: ['M0,0 L10,10'] }] } });
    const core = (id: string) => html.match(new RegExp(`<g id="${id}"[^>]*>.*?class="gui-osm-marker__core"([^>]*)>`))![1];
    assert.match(core('ship'), new RegExp(`stroke="${esc(pal.domain.ship)}"`), `${mode}: tone=ship → palette.domain.ship`);
    assert.match(html, new RegExp(`<g id="ship" class="gui-osm-marker gui-osm-marker--ship"[^>]*data-tone="ship"`));
    assert.match(core('busy'), new RegExp(`stroke="${esc(pal.states.busy)}"`), `${mode}: state=busy → warning`);
    assert.match(core('done'), new RegExp(`stroke="${esc(pal.states.done)}"`), `${mode}: state=done → success`);
    assert.match(core('hl'), /stroke-width="2.4"/, `${mode}: highlight thickens the outline`);
    assert.match(core('hl'), /drop-shadow/, `${mode}: highlight glows`);
    assert.match(html, /<g id="dim"[^>]*style="opacity:0.3"/, `${mode}: dimmed fades`);
    assert.match(core('own'), /stroke="#123456"/, `${mode}: explicit color overrides tone`);
    assert.match(html, new RegExp(`class="gui-osm-marker__label"[^>]*fill="${esc(pal.label)}"[^>]*stroke="${esc(pal.halo)}"`), `${mode}: label + halo from palette`);
    // the basemap layer: theme colour, own stroke width kept, own opacity dropped
    assert.match(html, new RegExp(`<g id="roads-primary"[^>]*fill="none" stroke="${esc(pal.road.primary)}" stroke-width="2.6">`));
    assert.match(html, new RegExp(`<rect class="gui-osm__background"[^>]*fill="${esc(pal.land)}"`));
    assert.match(html, new RegExp(`gui-osm__attribution"[^>]*color:${esc(pal.attribution.text)}`));
  }
  // light and dark really differ
  const l = buildOsmPalette(themeOf(neuronsLight, 'light'));
  const d = buildOsmPalette(themeOf(neuronsDark, 'dark'));
  assert.notEqual(l.land, d.land);
  assert.notEqual(l.label, d.label);
  // neurons.me dark has primary = info (#90caf9): port and ship must not collide
  assert.ok(deltaE(d.domain.port, d.domain.ship) >= 15, 'neurons dark: port vs ship distinct');
  assert.equal(osmToneColor(d, 'bogus' as any), d.tones.neutral, 'unknown tone → neutral');
}

function canvasLayersReceiveThePalette() {
  const pal: OsmPalette = buildOsmPalette(themeOf(seafoamDark, 'dark'));
  const projection = createOsmProjection(FRAME);
  const transform = createOsmTransform(projection, fitOsmView(projection, 600, 400, 1));
  const canvas = { width: 0, height: 0 } as unknown as HTMLCanvasElement;
  const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
  let seen: OsmPalette | undefined;
  drawOsmCanvasFrame(canvas, ctx, transform, (info) => { seen = info.palette; }, { now: 0, dt: 0, frame: 1 }, true, pal);
  assert.equal(seen, pal, 'onFrame gets the palette');
}

everyThemeModeIsLegible();
darkWaterUnchangedAndAccentRule();
layerKindsFromIds();
markerTonesAndStatesFollowTheTheme();
canvasLayersReceiveThePalette();
console.log('openStreetMapPalette.test.ts: all assertions passed');
