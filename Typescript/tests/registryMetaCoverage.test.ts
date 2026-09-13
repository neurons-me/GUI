// registryMetaCoverage.test.ts — regression test for the exact bug class
// found while building the GUI catalog pilot: a resolver file can export
// `meta` as a plain named export (its own `export const meta = {...}`),
// but if GuiRegistry.ts's array entry never references it (directly
// inline, or via `withMeta()`), the aggregated GuiRegistry silently drops
// it — the entry renders with a name and no example, no error anywhere.
//
// Deliberately a STATIC source check, not a dynamic import of
// GuiRegistry.ts: importing it for real pulls in every real MUI
// component (CSS side-effect imports included), which neither plain
// `tsx` (no CSS-loader) nor this package's own vitest setup (broken
// independently of this change — its Storybook browser-provider config
// predates this test and fails before any test file even runs) can load
// outside a real bundler. A static check needs neither, and directly
// verifies the actual bug: for every `import Default, { meta as XMeta }
// from "PATH"` line in GuiRegistry.ts, XMeta must actually be referenced
// somewhere in the createRegistry([...]) array below it — imported and
// silently unused is exactly how this bug hid.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const registrySourcePath = path.resolve(here, '../src/Registry/GuiRegistry.ts');
const source = fs.readFileSync(registrySourcePath, 'utf8');

const [importSection, arraySection] = (() => {
  const marker = 'export const GuiRegistry = createRegistry([';
  const idx = source.indexOf(marker);
  assert.ok(idx > 0, 'sanity check: GuiRegistry.ts must still contain the createRegistry([...]) array this test scans');
  return [source.slice(0, idx), source.slice(idx)];
})();

// Matches `import Default, { meta as XMeta } from "..."` -- captures XMeta.
const namedMetaImportRe = /import\s+\w+\s*,\s*\{\s*meta\s+as\s+(\w+)\s*\}\s+from\s+["'][^"']+["']/g;

const declaredMetaBindings = Array.from(importSection.matchAll(namedMetaImportRe), (m) => m[1]!);
assert.ok(declaredMetaBindings.length > 20, 'sanity check: the import parser must find GuiRegistry.ts\'s real `meta as X` imports, not silently match zero');

const failures = declaredMetaBindings.filter((binding) => {
  // Must appear in the array section either bare (rare) or as
  // withMeta(SomeResolver, XMeta) -- a simple word-boundary search on the
  // array text is enough; the import parser above already guarantees
  // this binding name is unique to this one resolver.
  const usedRe = new RegExp(`\\b${binding}\\b`);
  return !usedRe.test(arraySection);
});

assert.equal(
  failures.length,
  0,
  `${failures.length} imported meta binding(s) are never referenced in GuiRegistry's createRegistry([...]) array -- wire them with withMeta(): ${failures.join(', ')}`,
);
console.log(`registryMetaCoverage ok (${declaredMetaBindings.length} resolver "meta" imports all wired through to the registry array)`);
