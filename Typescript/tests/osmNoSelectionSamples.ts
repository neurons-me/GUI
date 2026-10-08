import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import OpenStreetMap from '../src/gui/Compounds/OpenStreetMap/OpenStreetMap';
import neuronsDark from '../src/gui/Theme/Catalog/themes/neurons/dark.tokens';
import neuronsLight from '../src/gui/Theme/Catalog/themes/neurons/light.tokens';

// Shared by tests/openStreetMapSelection.test.ts and the golden snapshot in
// tests/fixtures/openStreetMap.noSelection.golden.json (written on map/s5b1,
// before selection existed): maps WITHOUT selection props must render their
// SVG exactly as before.
const h = React.createElement;
const FRAME = { bbox: { south: 19.192, west: -96.142, north: 19.205, east: -96.122 }, width: 1200, height: 800, pad: 24 };

function markers() {
  return [
    h(OpenStreetMap.Marker, { key: 'a', id: 'a', lat: 19.2, lon: -96.13, size: 28, icon: 'anchor', tone: 'port', state: 'highlight', label: 'VERACRUZ', meta: 'port.busy = true' }),
    h(OpenStreetMap.Marker, { key: 'b', id: 'b', lat: 19.198, lon: -96.127, shape: 'rect', width: 32, height: 18, icon: 'directions_boat', tone: 'ship', state: 'busy', label: 'SHIP[1]', meta: 'unloading', labelPlacement: 'left' }),
    h(OpenStreetMap.Marker, { key: 'c', id: 'c', lat: 19.195, lon: -96.135, shape: 'triangle', size: 14, tone: 'warning', label: 'tri', labelPlacement: 'top', onClick: () => {} }),
    h(OpenStreetMap.Marker, { key: 'd', id: 'd', lat: 19.201, lon: -96.124, shape: 'square', size: 12, color: '#c9b87e', label: 'legacy', labelPlacement: 'bottom', title: 'tooltip' }),
    h(OpenStreetMap.Marker, { key: 'e', lat: 19.197, lon: -96.139, tone: 'yard', state: 'dimmed' }),
  ];
}

export function renderNoSelectionSamples(): Record<string, string> {
  const out: Record<string, string> = {};
  const cases: Array<[string, any, Record<string, any>]> = [
    ['dark-fit', makeMuiTheme(themeTokens, neuronsDark, 'dark'), {}],
    ['light-fit', makeMuiTheme(themeTokens, neuronsLight, 'light'), {}],
    ['dark-zoom4', makeMuiTheme(themeTokens, neuronsDark, 'dark'), { defaultView: { zoom: 4 } }],
    ['dark-defaults', makeMuiTheme(themeTokens, neuronsDark, 'dark'), { markerDefaults: { shape: 'square', tone: 'info' } }],
  ];
  for (const [name, theme, props] of cases) {
    const html = renderToString(h(ThemeProvider, { theme }, h(OpenStreetMap, { ...FRAME, ...props }, markers())));
    out[name] = html.slice(html.indexOf('<svg'), html.indexOf('</svg>') + 6);
  }
  return out;
}
