import assert from 'node:assert/strict';
import { getContrastRatio } from '@mui/material/styles';
import { makeMuiTheme } from '../src/gui/Theme/fromTokens';
import { themeTokens } from '../src/gui/Theme/styles/theme.tokens';
import {
  contrastOn,
  QR_INK_MIN_CONTRAST,
  QR_RING_MIN_CONTRAST,
  resolveQrMeColors,
  tintsOf,
  withHexAlpha,
  type QrMeStatus,
} from '../src/gui/All.This/me/QR/qrContrast';
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

// QR.me's ink and ring (qrContrast.ts), against every theme of the catalog compiled exactly as <Theme> does. Token files
// are imported directly: the manifests pull in badge images that tsx cannot load.
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
const STATUSES: QrMeStatus[] = ['idle', 'confirmed', 'checking', 'error', 'off'];
const palettes = CATALOG.flatMap(([name, light, dark]) =>
  (['light', 'dark'] as const).map((mode) => ({ name, mode, palette: makeMuiTheme(themeTokens, mode === 'light' ? light : dark, mode).palette })),
);

function everyThemeAndStatusIsLegible() {
  for (const { name, mode, palette } of palettes) {
    const page = palette.background.default;
    for (const status of STATUSES) {
      const c = resolveQrMeColors(palette, { status });
      assert.equal(c.qrBg, palette.background.paper, `${name} ${mode}: default QR background is the paper`);
      const ink = contrastOn(c.qrFg, c.qrBg);
      const ring = contrastOn(c.ringAccent, page);
      assert.ok(ink >= QR_INK_MIN_CONTRAST, `${name} ${mode} ${status}: ink ${c.qrFg} on ${c.qrBg} is ${ink.toFixed(2)}:1`);
      assert.ok(ring >= QR_RING_MIN_CONTRAST, `${name} ${mode} ${status}: ring ${c.ringAccent} on ${page} is ${ring.toFixed(2)}:1`);
    }
  }
}

function aContrastingPrimaryIsKeptExactly() {
  for (const { name, mode, palette } of palettes) {
    const c = resolveQrMeColors(palette, {});
    if (getContrastRatio(palette.primary.main, palette.background.paper) >= QR_INK_MIN_CONTRAST) {
      assert.equal(c.qrFg, palette.primary.main, `${name} ${mode}: ink stays primary.main`);
    }
    if (getContrastRatio(palette.primary.main, palette.background.default) >= QR_RING_MIN_CONTRAST) {
      assert.equal(c.ringAccent, palette.primary.main, `${name} ${mode}: ring stays primary.main`);
    }
  }
}

function seafoamDarkNoLongerDrawsInkItCannotSee() {
  const { palette } = palettes.find((p) => p.name === 'Seafoam' && p.mode === 'dark')!;
  assert.ok(getContrastRatio(palette.primary.main, palette.background.paper) < 2, 'the bug: #244C4E on #182423');
  const c = resolveQrMeColors(palette, {});
  assert.notEqual(c.qrFg, palette.primary.main);
  assert.ok(contrastOn(c.qrFg, c.qrBg) >= QR_INK_MIN_CONTRAST);
  // Keeps the teal: the first 10% step toward white of #244C4E that reaches 4.5:1 (40%), not near-white text.
  assert.equal(c.qrFg, 'rgb(123, 147, 148)');
  assert.notEqual(c.qrFg, palette.text.primary);
}

function tintsKeepTheHueBeforeTextColour() {
  for (const { name, mode, palette } of palettes) {
    const c = resolveQrMeColors(palette, {});
    const tints = tintsOf(palette.primary.main, mode);
    assert.equal(tints.length, 9);
    if (contrastOn(palette.primary.main, c.qrBg) < QR_INK_MIN_CONTRAST && tints.some((t) => contrastOn(t, c.qrBg) >= QR_INK_MIN_CONTRAST)) {
      assert.notEqual(c.qrFg, palette.text.primary, `${name} ${mode}: a tinted primary passes, so the ink keeps colour`);
    }
  }
  assert.equal(tintsOf('#000000', 'dark')[0], 'rgb(25, 25, 25)', '10% toward white');
  assert.equal(tintsOf('#ffffff', 'light')[0], 'rgb(229, 229, 229)', '10% toward black');
}

function callerColorsAreUntouched() {
  const { palette } = palettes.find((p) => p.name === 'Seafoam' && p.mode === 'dark')!;
  const c = resolveQrMeColors(palette, { fg: '#244C4E', bg: '#182423', status: 'error' });
  assert.equal(c.qrFg, '#244C4E', 'explicit fg kept even when it is low contrast');
  assert.equal(c.qrBg, '#182423', 'explicit bg kept');
  const onlyBg = resolveQrMeColors(palette, { bg: '#ffffff' });
  assert.equal(onlyBg.qrBg, '#ffffff');
  assert.ok(contrastOn(onlyBg.qrFg, '#ffffff') >= QR_INK_MIN_CONTRAST, 'the ink is chosen against the caller bg');
}

function hexAlphaSuffix() {
  assert.equal(withHexAlpha('#244C4E', '55'), '#244C4E55', 'a #rrggbb colour gets the same string as before');
  assert.equal(withHexAlpha('rgb(79, 111, 113)', '40'), 'rgba(79, 111, 113, 0.25098039215686274)');
  assert.match(withHexAlpha('rgba(255, 255, 255, 0.5)', '55'), /^rgba\(255, 255, 255, 0\.16/);
  assert.match(withHexAlpha('#fff', '8c'), /^rgba\(255, 255, 255, 0\.54/);
}

function alphaIsLaidOverTheBackground() {
  // rgba(0,0,0,0.38) on white renders as #9e9e9e (~2.7:1), not as solid black (21:1).
  const r = contrastOn('rgba(0, 0, 0, 0.38)', '#ffffff');
  assert.ok(r > 2.5 && r < 2.9, `got ${r}`);
  assert.equal(contrastOn('rgba(0, 0, 0, 0.38)', '#ffffff', false), 21);
}

everyThemeAndStatusIsLegible();
aContrastingPrimaryIsKeptExactly();
seafoamDarkNoLongerDrawsInkItCannotSee();
callerColorsAreUntouched();
tintsKeepTheHueBeforeTextColour();
hexAlphaSuffix();
alphaIsLaidOverTheBackground();

if (process.env.QR_CONTRAST_TABLE) {
  for (const { name, mode, palette } of palettes) {
    const c = resolveQrMeColors(palette, {});
    const before = getContrastRatio(palette.primary.main, palette.background.paper).toFixed(2);
    console.log(
      [name, mode, `paper ${palette.background.paper}`, `before ${palette.primary.main} ${before}:1`,
        `ink ${c.qrFg} ${contrastOn(c.qrFg, c.qrBg).toFixed(2)}:1`,
        `ring ${c.ringAccent} ${contrastOn(c.ringAccent, palette.background.default).toFixed(2)}:1 on ${palette.background.default}`].join(' | '),
    );
  }
}
console.log('qrMeContrast.test.ts: all assertions passed');
