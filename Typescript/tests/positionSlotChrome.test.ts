import assert from 'node:assert/strict';
import type { Theme } from '@mui/material/styles';
import { contrastRatio, positionSlotChrome, SLOT_CONTRAST_MIN } from '../src/gui/Layout/Position/positionSlotChrome';
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

const packs: [string, 'light' | 'dark', any][] = [
  ['neurons.me', 'light', neuronsLight],
  ['neurons.me', 'dark', neuronsDark],
  ['ghost.shell', 'light', ghostLight],
  ['ghost.shell', 'dark', ghostDark],
  ['prince-of-darkness', 'light', princeLight],
  ['prince-of-darkness', 'dark', princeDark],
  ['mui', 'light', muiLight],
  ['mui', 'dark', muiDark],
  ['luna', 'light', lunaLight],
  ['luna', 'dark', lunaDark],
  ['cherrybyte', 'light', cherryLight],
  ['cherrybyte', 'dark', cherryDark],
  ['seafoam', 'light', seafoamLight],
  ['seafoam', 'dark', seafoamDark],
  ['mdrn.church', 'light', churchLight],
  ['mdrn.church', 'dark', churchDark],
];

function val(tokens: any, ...paths: string[][]): string | undefined {
  for (const path of paths) {
    let cur = tokens;
    for (const k of path) cur = cur?.[k];
    const v = cur?.$value ?? cur;
    if (typeof v === 'string' && v) return v;
  }
  return undefined;
}

function themeFromTokens(tokens: any, mode: 'light' | 'dark'): Theme {
  const paper = val(tokens, ['color', 'background', 'default'], ['color', 'default']) || (mode === 'dark' ? '#121212' : '#ffffff');
  const ink = val(tokens, ['color', 'textPrimary'], ['color', 'text', 'primary'], ['color', 'text']) || (mode === 'dark' ? '#ffffff' : '#111111');
  const primary = val(tokens, ['color', 'primary']) || '#1976d2';
  return {
    palette: {
      mode,
      background: { default: paper, paper },
      text: { primary: ink },
      primary: { main: primary },
    },
  } as Theme;
}

let failed = 0;
for (const [id, mode, tokens] of packs) {
  const theme = themeFromTokens(tokens, mode);
  const chrome = positionSlotChrome(theme);
  const ratio = contrastRatio(chrome.border, chrome.paper);
  const ok = ratio >= SLOT_CONTRAST_MIN;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${mode}: contrast=${ratio.toFixed(2)}  border=${chrome.border} paper=${chrome.paper}`);
  assert.equal(ok, true, `${id} ${mode} slot border contrast ${ratio} < ${SLOT_CONTRAST_MIN}`);
}
console.log(failed ? `${failed} failed` : 'positionSlotChrome: ok');
