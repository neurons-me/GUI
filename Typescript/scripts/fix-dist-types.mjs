// Makes dist/'s type declarations usable from outside this repository (run after `tsc -p tsconfig.build.json`).
//
// 1. tsc writes declarations with this repository's own path aliases left as they are (`@/gui/Atoms/Box/Box`):
//    resolvable here through tsconfig.json's `paths`, by no one who installs the package. Every `@/...` specifier in
//    dist/**/*.d.ts is rewritten to the relative path it means, by the same `paths` rules tsc used.
// 2. The subpath entries' types (dist/atoms|molecules|compounds|components/index.d.ts) used to be COPIES of the barrels
//    under dist/src/, whose relative imports (`./AppBar/AppBar`) then pointed at nothing. They are now re-exports of
//    the barrels where they are.
//
// It fails (exit 1) if an alias resolves to no declaration, so a broken specifier is never shipped silently.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const { config } = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
const paths = Object.entries(config.compilerOptions.paths).filter(([key]) => key.startsWith('@/'));

// tsc's own matching: an exact key wins; otherwise the wildcard key with the longest prefix.
function sourceFor(specifier) {
  const exact = paths.find(([key]) => key === specifier);
  if (exact) return exact[1][0];
  const wild = paths
    .filter(([key]) => key.endsWith('/*') && specifier.startsWith(key.slice(0, -1)))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return wild ? wild[1][0].replace('*', specifier.slice(wild[0].length - 1)) : null;
}

// ./src/gui/Atoms/Box/Box(.ts|.tsx) -> <dist>/src/gui/Atoms/Box/Box, if its declaration was emitted.
function declarationFor(source) {
  const base = path.join(dist, source.replace(/^\.\//, '').replace(/\.(tsx?|d\.ts)$/, ''));
  if (fs.existsSync(`${base}.d.ts`)) return base;
  if (fs.existsSync(path.join(base, 'index.d.ts'))) return base;
  return null;
}

const relative = (fromFile, target) => {
  const rel = path.relative(path.dirname(fromFile), target).split(path.sep).join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
};

// 0. Hand-written declarations under src/ (src/types/theme.d.ts, ...) are inputs to tsc, not outputs: it never copies
//    them, so the emitted declarations that import them pointed at nothing. They are copied next to the rest.
let copied = 0;
(function copyHandWritten(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'stories') copyHandWritten(full); continue; }
    if (!entry.name.endsWith('.d.ts')) continue;
    const target = path.join(dist, path.relative(root, full));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(full, target);
    copied += 1;
  }
})(path.join(root, 'src'));

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.d.ts')) files.push(full);
  }
})(dist);

// The subpath entries, as re-exports of the barrels (default too, when the barrel has one of its own).
const BARRELS = {
  atoms: 'src/gui/Atoms/atoms',
  molecules: 'src/gui/Molecules/molecules',
  compounds: 'src/gui/Compounds/compounds',
  components: 'src/gui/Compounds/compounds',
};
for (const [entry, barrel] of Object.entries(BARRELS)) {
  const barrelFile = path.join(dist, `${barrel}.d.ts`);
  if (!fs.existsSync(barrelFile)) throw new Error(`[fix-dist-types] missing ${path.relative(root, barrelFile)}`);
  const text = fs.readFileSync(barrelFile, 'utf8');
  const hasDefault = /^export default\b/m.test(text) || /export \{[^}]*\bdefault\b(?!\s+as\b)[^}]*\}/.test(text);
  const target = path.join(dist, entry, 'index.d.ts');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const spec = relative(target, path.join(dist, barrel));
  fs.writeFileSync(target, `export * from '${spec}';\n${hasDefault ? `export { default } from '${spec}';\n` : ''}`);
}

let rewritten = 0;
const unresolved = [];
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])(@\/[^'"]+)\2/g;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('@/')) continue;
  const next = text.replace(SPECIFIER, (whole, lead, quote, specifier) => {
    const source = sourceFor(specifier);
    const target = source && declarationFor(source);
    if (!target) { unresolved.push(`${path.relative(root, file)}: ${specifier}`); return whole; }
    rewritten += 1;
    return `${lead}${quote}${relative(file, target)}${quote}`;
  });
  if (next !== text) fs.writeFileSync(file, next);
}

console.log(`[fix-dist-types] ${copied} hand-written declarations copied; ${rewritten} alias specifiers rewritten in ${files.length} declaration files; subpath entries re-export their barrels.`);
if (unresolved.length) {
  console.error(`[fix-dist-types] ${unresolved.length} alias specifiers resolve to no emitted declaration:\n  ${unresolved.slice(0, 20).join('\n  ')}`);
  process.exit(1);
}
