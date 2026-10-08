import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import ME from 'this.me';
import { createMeRuntime } from '../src/runtime/run-me';
import { MeRuntimeProvider } from '../src/react/MeRuntimeProvider';
import { renderNode } from '../src/runtime/renderer';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import OpenStreetMapResolver, {
  OpenStreetMapChipResolver,
  OpenStreetMapLegendResolver,
  OpenStreetMapMarkerResolver,
  OpenStreetMapOverlayResolver,
} from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap.resolver';
import { buildOsmPalette, contrast, osmToneColor, osmToneText } from '../src/gui/Compounds/OpenStreetMap/mapPalette';
import { createBoundListSource, formatOsmValue } from '../src/gui/Compounds/OpenStreetMap/bindings';
import neuronsLight from '../src/gui/Theme/Catalog/themes/neurons/light.tokens';
import neuronsDark from '../src/gui/Theme/Catalog/themes/neurons/dark.tokens';
import seafoamDark from '../src/gui/Theme/Catalog/themes/Seafoam/dark.tokens';
import ghostLight from '../src/gui/Theme/Catalog/themes/GhostShell/light.tokens';
import cherryDark from '../src/gui/Theme/Catalog/themes/CherryByte/dark.tokens';
import churchLight from '../src/gui/Theme/Catalog/themes/MdrnChurch/light.tokens';

// GUI.OpenStreetMap HTML overlays: Overlay / Legend / Chip dock in 8 places on
// a grid above the map, the attribution keeps its own row, colours come from
// the map palette, and values bind to kernel paths through the runtime.
const h = React.createElement;
const FRAME = { bbox: { south: 19.192, west: -96.142, north: 19.205, east: -96.122 }, width: 1200, height: 800, pad: 24 };
const themeOf = (tokens: any, mode: 'light' | 'dark') => makeMuiTheme(themeTokens, tokens, mode);
const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function render(theme: any, children: React.ReactNode, props: Record<string, any> = {}) {
  return renderToString(h(ThemeProvider, { theme }, h(OpenStreetMap, { ...FRAME, ...props }, children)));
}
/** inner HTML of one dock */
function dock(html: string, position: string): string {
  const m = html.match(new RegExp(`data-osm-dock="${position}"[^>]*>(.*?)</div><div class="gui-osm__dock|data-osm-dock="${position}"[^>]*>(.*?)</div></div><div class="gui-osm__attribution`));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function docksAndAttribution() {
  const theme = themeOf(neuronsDark, 'dark');
  const html = render(theme, [
    h(OpenStreetMap.Marker, { key: 'm', id: 'm1', lat: 19.2, lon: -96.13 }),
    h(OpenStreetMap.Legend, { key: 'l', items: [{ label: 'ships', tone: 'ship', value: 3 }] }),
    h(OpenStreetMap.Overlay, { key: 'o', position: 'bottom-left' }, h('span', { id: 'card' }, 'card')),
    h(React.Fragment, { key: 'f' }, h(OpenStreetMap.Chip, { label: 'import left', value: 128000, unit: ' t' })),
  ]);
  const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
  assert.ok(svg.includes('id="m1"'), 'markers stay in the svg');
  assert.ok(!svg.includes('gui-osm-legend') && !svg.includes('gui-osm-chip') && !svg.includes('id="card"'), 'no HTML overlay inside the svg');
  // 8 docks, in a grid, before the attribution row
  assert.equal((html.match(/data-osm-dock="/g) || []).length, 8, '8 docks rendered');
  assert.match(html, /class="gui-osm__overlays"[^>]*>.*class="gui-osm__docks".*class="gui-osm__attribution"/, 'attribution is its own row after the docks');
  assert.match(dock(html, 'top-right'), /gui-osm-legend/, 'Legend defaults to top-right');
  assert.doesNotMatch(dock(html, 'top-left'), /gui-osm-legend|gui-osm-chip|id="card"/, 'other docks stay empty');
  assert.doesNotMatch(dock(html, 'bottom'), /gui-osm-legend|id="card"/, 'docks hold only their own overlays');
  assert.match(dock(html, 'bottom-left'), /id="card"/, 'Overlay goes to its position');
  assert.match(dock(html, 'bottom'), /gui-osm-chip/, 'Chip defaults to the bottom edge (also through a Fragment)');
  assert.match(html, /\.gui-osm__dock:empty\{display:none\}/, 'empty docks take no space');
  // attribution on top: rows reversed, aligned left
  const top = render(theme, null, { attribution: { position: 'top-left' } });
  assert.match(top, /class="gui-osm__overlays"[^>]*flex-direction:column-reverse/);
  assert.match(top, /class="gui-osm__attribution"[^>]*align-self:flex-start/);
  // unknown position → the component's default dock
  const bad = render(theme, h(OpenStreetMap.Chip, { label: 'x', value: 1, position: 'middle' as any }));
  assert.match(dock(bad, 'bottom'), /gui-osm-chip/);
}

function legendAndChipFollowThePalette() {
  for (const [name, tokens, mode] of [['neurons light', neuronsLight, 'light'], ['neurons dark', neuronsDark, 'dark'], ['Seafoam dark', seafoamDark, 'dark']] as const) {
    const theme = themeOf(tokens, mode);
    const pal = buildOsmPalette(theme);
    const html = render(theme, [
      h(OpenStreetMap.Legend, { key: 'l', title: 'Trucks', items: [{ heading: 'heavy' }, { label: 'import', tone: 'ship', value: 38 }, { label: 'pool', swatch: 'ring', value: 284 }], footer: 'kernel counts' }),
      h(OpenStreetMap.Chip, { key: 'a', label: 'import left', value: 96400, unit: ' t', tone: 'ship', fx: true, minValueCh: 9 }),
      h(OpenStreetMap.Chip, { key: 'b', label: 'simulation', value: '06:42', variant: 'adapter' }),
    ]);
    const legend = html.match(/<div[^>]*class="gui-osm-legend"[^>]*>/)![0];
    assert.match(legend, /role="group"/);
    assert.match(legend, /aria-label="Trucks"/);
    assert.match(legend, new RegExp(`background:${esc(pal.overlay.background)}`), `${name}: legend surface from palette`);
    assert.match(legend, new RegExp(`border:1px solid ${esc(pal.overlay.border)}`), `${name}: legend border from palette`);
    assert.match(legend, /pointer-events:none/, 'legend lets clicks through by default');
    assert.match(html, new RegExp(`class="gui-osm-legend__swatch".*?background:${esc(pal.domain.ship)}`), `${name}: swatch = tone colour`);
    assert.match(html, new RegExp(`border:1.5px solid ${esc(pal.tones.neutral)}`), `${name}: ring swatch`);
    assert.match(html, /class="gui-osm-legend__value"[^>]*>38</, 'given value');
    assert.match(html, /class="gui-osm-legend__heading"[^>]*>heavy</);
    assert.match(html, /class="gui-osm-legend__footer"[^>]*>kernel counts</);
    // chip: value grouped + unit, tone text ≥ 4.5:1 on the chip surface, ƒ marker, reserved width
    assert.match(html, new RegExp(`class="gui-osm-chip__value"[^>]*color:${esc(osmToneText(pal, 'ship'))}[^>]*min-width:9ch[^>]*>96,400<!-- --> t<`), `${name}: chip value`);
    assert.ok(contrast(osmToneText(pal, 'ship'), pal.overlay.surface) >= 4.5, `${name}: tone text legible on chip`);
    assert.match(html, /class="gui-osm-chip__fx" aria-hidden="true"[^>]*>ƒ</);
    const adapter = html.match(/<span[^>]*class="gui-osm-chip gui-osm-chip--adapter"[^>]*>/)![0];
    assert.match(adapter, new RegExp(`border:1px dashed ${esc(pal.overlay.adapter)}`), `${name}: adapter chip dashed, warning tone`);
    assert.doesNotMatch(adapter, /role="button"/, 'chip without onClick is not a button');
    // overlay text legible on its surface in this theme
    for (const k of ['text', 'strong', 'muted'] as const) assert.ok(contrast(pal.overlay[k], pal.overlay.surface) >= 4.5, `${name}: overlay ${k} ≥ 4.5:1`);
    for (const k of ['accent', 'adapter'] as const) assert.ok(contrast(pal.overlay[k], pal.overlay.surface) >= 3, `${name}: overlay ${k} ≥ 3:1`);
  }
  // overlay colours legible in other themes too (spot checks)
  for (const [tokens, mode] of [[ghostLight, 'light'], [cherryDark, 'dark'], [churchLight, 'light']] as const) {
    const pal = buildOsmPalette(themeOf(tokens, mode));
    for (const k of ['text', 'strong', 'muted'] as const) assert.ok(contrast(pal.overlay[k], pal.overlay.surface) >= 4.5);
    assert.ok(osmToneColor(pal, 'ship'));
  }
}

function interactiveChip() {
  const theme = themeOf(neuronsDark, 'dark');
  const pal = buildOsmPalette(theme);
  const html = render(theme, h(OpenStreetMap.Chip, { label: 'import left', value: 1, fx: true, active: true, onClick: () => {}, 'aria-controls': 'expr' }));
  const chip = html.match(/<span[^>]*class="gui-osm-chip gui-osm-chip--active"[^>]*>/)![0];
  assert.match(chip, /role="button"/);
  assert.match(chip, /tabindex="0"/);
  assert.match(chip, /aria-expanded="true"/);
  assert.match(chip, /aria-controls="expr"/);
  assert.match(chip, /pointer-events:auto/);
  assert.match(chip, new RegExp(`border:1px solid ${esc(pal.overlay.accent)}`), 'active chip uses the accent border');
}

function hideBelowAndPortalFallback() {
  const theme = themeOf(neuronsDark, 'dark');
  // server: width unknown → shown
  const html = render(theme, h(OpenStreetMap.Overlay, { position: 'top-left', hideBelow: 640 }, h('i', { id: 'hint' })));
  assert.ok(html.includes('id="hint"'), 'hideBelow does not hide while the width is unknown');
  // a Legend wrapped in an unknown component lands in the svg subtree: it portals on the client,
  // renders nothing on the server, and never puts HTML inside <svg>
  const Wrapper = (p: { children?: React.ReactNode }) => h(React.Fragment, null, p.children);
  const wrapped = render(theme, h(Wrapper, null, h(OpenStreetMap.Legend, { items: [{ label: 'x', value: 1 }] })));
  const svg = wrapped.slice(wrapped.indexOf('<svg'), wrapped.indexOf('</svg>'));
  assert.ok(!svg.includes('gui-osm-legend'), 'no legend HTML inside the svg');
}

function valuesFormat() {
  assert.equal(formatOsmValue(128000), '128,000');
  assert.equal(formatOsmValue(31.456), '31.46');
  assert.equal(formatOsmValue(undefined), '—');
  assert.equal(formatOsmValue(NaN), '—');
  assert.equal(formatOsmValue([3, undefined, 'x']), '3 · — · x');
  assert.equal(formatOsmValue(true), 'true');
}

function makeBridge() {
  const listeners = new Map<string, Set<() => void>>();
  const subscribe = (path: string, cb: () => void) => {
    if (!listeners.has(path)) listeners.set(path, new Set());
    listeners.get(path)!.add(cb);
    return () => listeners.get(path)!.delete(cb);
  };
  const count = () => [...listeners.values()].reduce((n, s) => n + s.size, 0);
  return { subscribe, count };
}

function boundValuesFollowTheRuntime() {
  const me: any = new (ME as any)();
  me.trucks.inQueue(14);
  me.trucks.fleet(500);
  me.trucks.working(102);
  const before = JSON.stringify(me.exportSnapshot());
  const bridge = makeBridge();
  const runtime = createMeRuntime(me, { subscribe: bridge.subscribe });
  const theme = themeOf(neuronsDark, 'dark');
  const html = () => renderToString(
    h(MeRuntimeProvider, { me, runtime },
      h(ThemeProvider, { theme },
        h(OpenStreetMap, FRAME,
          h(OpenStreetMap.Legend, { items: [{ label: 'queued', bind: 'trucks.inQueue' }, { label: 'missing', bind: 'trucks.nothing' }] }),
          h(OpenStreetMap.Chip, { label: 'working', bind: ['trucks.working', 'trucks.fleet'], format: (v: any[]) => `${v[0]} / ${v[1]}` }),
          h(OpenStreetMap.Chip, { label: 'given', value: 7, bind: 'trucks.nothing' })))));
  let out = html();
  assert.match(out, /data-me-path="trucks.inQueue"[^>]*>14</, 'legend row reads the kernel');
  assert.match(out, /data-me-path="trucks.nothing"[^>]*>—</, 'unbound path shows —');
  assert.match(out, /data-me-path="trucks.working trucks.fleet"[^>]*>102 \/ 500</, 'chip reads several paths');
  assert.match(out, /data-me-path="trucks.nothing"[^>]*>7</, 'given value until the binding has one');
  assert.equal(JSON.stringify(me.exportSnapshot()), before, 'mount writes nothing to the kernel');
  // the exact source a multi-path chip subscribes with
  const src = createBoundListSource(runtime, me, ['trucks.working', 'trucks.fleet']);
  let hits = 0;
  const unsub = src.subscribe(() => { hits += 1; });
  assert.equal(bridge.count(), 2, 'one subscription per path on the runtime bridge');
  const first = src.getSnapshot();
  assert.deepEqual(first, [102, 500]);
  assert.equal(src.getSnapshot(), first, 'snapshot stable while values are equal');
  runtime.action!('me/trucks.working', undefined)(110);
  assert.ok(hits >= 1, 'runtime.action write notifies');
  assert.deepEqual(src.getSnapshot(), [110, 500]);
  unsub();
  assert.equal(bridge.count(), 0, 'unsubscribe releases every path');
  runtime.action!('me/trucks.inQueue', undefined)(9);
  out = html();
  assert.match(out, /data-me-path="trucks.inQueue"[^>]*>9</, 'legend shows the new value');
}

function specOverlaysDock() {
  const registry = {
    OpenStreetMap: OpenStreetMapResolver,
    OpenStreetMapMarker: OpenStreetMapMarkerResolver,
    OpenStreetMapOverlay: OpenStreetMapOverlayResolver,
    OpenStreetMapLegend: OpenStreetMapLegendResolver,
    OpenStreetMapChip: OpenStreetMapChipResolver,
  };
  const html = renderToString(h(ThemeProvider, { theme: themeOf(neuronsDark, 'dark') }, h(() => renderNode({
    type: 'OpenStreetMap',
    props: { id: 'map', ...FRAME },
    children: [
      { type: 'OpenStreetMapMarker', props: { id: 'm1', lat: 19.2, lon: -96.132 } },
      { type: 'OpenStreetMapLegend', props: { id: 'legend', 'data-gui-node-id': 'map.legend', items: [{ label: 'ships', tone: 'ship', value: 3 }] } },
      { type: 'OpenStreetMapChip', props: { id: 'chip', label: 'import', value: 5, variant: 'adapter' } },
      { type: 'OpenStreetMapOverlay', props: { id: 'ov', position: 'left' }, children: ['left text'] },
    ],
  } as any, { React, registry } as any))));
  const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
  assert.ok(svg.includes('id="m1"') && !svg.includes('id="legend"'), 'spec markers in svg, spec legend not');
  assert.match(dock(html, 'top-right'), /id="legend"[^>]*data-gui-node-id="map.legend"/, 'spec legend docked, node id kept');
  assert.match(dock(html, 'bottom'), /id="chip"/, 'spec chip docked');
  assert.match(dock(html, 'left'), /id="ov".*left text/, 'spec overlay docked with its children');
}

docksAndAttribution();
legendAndChipFollowThePalette();
interactiveChip();
hideBelowAndPortalFallback();
valuesFormat();
boundValuesFollowTheRuntime();
specOverlaysDock();
console.log('openStreetMapOverlays.test.ts: all assertions passed');
