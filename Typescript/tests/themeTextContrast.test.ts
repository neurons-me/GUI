// Every catalog theme, both modes: the colors used for TEXT (primary -- labels, the me:// prefix, card kinds -- and
// link) read on the theme's own backgrounds (paper and default) at WCAG AA, 4.5:1. Found 2026-11-27: Seafoam dark's
// primary was 2.7:1 (labels nearly invisible on the docs pages); PrinceOfDarkness dark 2.25, GhostShell light 2.07,
// three light links below 4.5. Secondary is reported, not asserted (it is a fill color in most places).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('src/gui/Theme/Catalog/themes');
const hex = (h: string) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (c: number[]) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a: string, b: string) => { const x = lum(hex(a)), y = lum(hex(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const value = (x: any): string | null => (typeof x?.$value === 'string' && /^#[0-9a-f]{3,6}$/i.test(x.$value) ? x.$value : null);

const failures: string[] = [];
let checked = 0;
for (const theme of fs.readdirSync(dir)) {
  for (const mode of ['dark', 'light']) {
    const file = path.join(dir, theme, `${mode}.tokens.ts`);
    if (!fs.existsSync(file)) continue;
    const color = (await import(file)).default.color;
    // the builder (fromTokens.ts) reads color.background.* and a flat color.default/paper (GhostShell, LunaHex light)
    const backgrounds = [value(color.background?.paper ?? color.paper), value(color.background?.default ?? color.default)].filter(Boolean) as string[];
    assert.ok(backgrounds.length, `${theme} ${mode}: no hex background`);
    for (const role of ['primary', 'link']) {
      const fg = value(color[role]);
      if (!fg) continue;
      for (const bg of backgrounds) {
        checked += 1;
        const r = ratio(fg, bg);
        if (r < 4.5) failures.push(`${theme} ${mode} ${role} ${fg} on ${bg}: ${r.toFixed(2)}:1`);
      }
    }
  }
}
assert.ok(checked >= 40, `checked only ${checked} pairs`);
assert.deepEqual(failures, [], `text colors below 4.5:1:\n${failures.join('\n')}`);
console.log(`themeTextContrast: ok (${checked} pairs)`);
