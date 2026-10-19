// generate-registry-docs.mjs — statically reads GuiRegistry.ts (never executes it: importing
// it transitively pulls in MUI/react-router/emotion, which throw when run raw outside a real
// bundle — MUI's CJS barrel redefines getters on double-require, react-router-dom's ESM/CJS
// interop breaks under Vite's SSR module runner; tried both, see git history of this file).
// Every `meta` object is a plain literal (id/type/label/group/path/tags/demoSpec, no function
// calls, no external refs — confirmed by inspection), so it's extracted from source text and
// evaluated in isolation, never by importing the real module graph.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registrySrc = fs.readFileSync(path.join(root, 'src/Registry/GuiRegistry.ts'), 'utf8');

// `root` here is this package's Typescript/ dir (see above), but the repo (neurons-me/GUI,
// confirmed via `git remote -v` / `git remote show origin`) has Typescript/ as a real
// subfolder of its own root -- so a GitHub blob link needs that prefix put back. Update this
// if the repo's origin or default branch ever changes.
const GITHUB_BLOB_BASE = 'https://github.com/neurons-me/GUI/blob/main/Typescript';

// 1. Import map: identifier -> resolved file path. Two shapes seen in this file:
//    import Default, { meta as XMeta } from "..."   (withMeta() pattern)
//    import Default, { NamedResolver } from "..."   (a second resolver in the same file,
//      e.g. StickyOptionsTop.resolver.tsx exporting both StickyOptionsTopResolver (default)
//      and StickyOptionsResolver (named, a deliberate legacy alias) -- both need to resolve
//      to the SAME file so each can be read on its own, scoped to its own declaration below.
const importMap = new Map(); // identifier -> absolute file path
const importRe = /import\s+([A-Za-z0-9_]+)(?:,\s*\{\s*([^}]+)\s*\})?\s+from\s+["']([^"']+)["'];?/g;
let m;
while ((m = importRe.exec(registrySrc))) {
  const [, defaultName, namedClause, specifier] = m;
  const resolved = specifier.startsWith('@/')
    ? path.join(root, 'src', specifier.slice(2))
    : path.join(root, 'src/Registry', specifier);
  const file = ['.tsx', '.ts'].map((ext) => resolved + ext).find((f) => fs.existsSync(f));
  if (!file) continue;
  importMap.set(defaultName, file);
  if (namedClause) {
    for (const raw of namedClause.split(',')) {
      const metaAs = raw.match(/meta\s+as\s+([A-Za-z0-9_]+)/);
      const plain = raw.trim().match(/^([A-Za-z0-9_]+)$/);
      if (metaAs) importMap.set(metaAs[1], file);
      else if (plain) importMap.set(plain[1], file);
    }
  }
}

// 2. The createRegistry([ ... ]) array body -> ordered list of entries, each either a bare
//    identifier (no authored meta) or withMeta(XResolver, XMeta).
const arrayMatch = registrySrc.match(/createRegistry\(\[([\s\S]*)\]\);\s*$/m);
if (!arrayMatch) throw new Error('Could not find createRegistry([...]) in GuiRegistry.ts');
const body = arrayMatch[1];
const entryRe = /withMeta\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)|(?<![\w.])([A-Za-z0-9_]+Resolver)\b/g;
const seen = new Set();
const entries = [];
let e;
while ((e = entryRe.exec(body))) {
  const resolverName = e[1] || e[3];
  const metaName = e[2] || null;
  if (!resolverName || seen.has(resolverName)) continue;
  seen.add(resolverName);
  entries.push({ resolverName, metaName });
}

function extractBalancedObject(src, startIdx) {
  // startIdx points at the opening '{' of an object literal; returns the matching '}' index.
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function readMeta(file) {
  const src = fs.readFileSync(file, 'utf8');
  const idx = src.indexOf('export const meta');
  if (idx === -1) return null;
  const braceStart = src.indexOf('{', idx);
  const braceEnd = extractBalancedObject(src, braceStart);
  if (braceEnd === -1) return null;
  const literal = src.slice(braceStart, braceEnd + 1);
  try {
    // Plain object literal (strings/arrays/nested objects only, no imports/calls) -- safe to
    // evaluate in isolation; this is this repo's own trusted source, not external input.
    return new Function(`return (${literal});`)();
  } catch (err) {
    return { __parseError: err.message };
  }
}

// Finds `(export )?const <name>[: Type] = {` and returns [start, end] of ITS OWN balanced
// object literal -- scoped to that one declaration, never "the first `{...}` in the file".
// Needed because a single file can export more than one resolver (StickyOptionsTop.resolver.tsx
// exports both StickyOptionsTopResolver, the default, and StickyOptionsResolver, a named legacy
// alias spreading the first and overriding `type`/`meta`) -- an unscoped search would silently
// read the WRONG resolver's own type/meta for the second one.
function findDeclarationSpan(src, name) {
  const declIdx = src.search(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*(?::[^=]+)?=\\s*\\{`));
  if (declIdx === -1) return null;
  const braceStart = src.indexOf('{', declIdx);
  const braceEnd = extractBalancedObject(src, braceStart);
  if (braceEnd === -1) return null;
  return [braceStart, braceEnd];
}

function readBareType(file, resolverName) {
  const src = fs.readFileSync(file, 'utf8');
  const span = findDeclarationSpan(src, resolverName);
  const scope = span ? src.slice(span[0], span[1] + 1) : src;
  const m2 = scope.match(/type:\s*['"]([^'"]+)['"]/);
  return m2 ? m2[1] : null;
}

// Two more real patterns in this codebase, beyond withMeta() (readMeta above), both scoped to
// THIS resolver's own declaration (see findDeclarationSpan's own comment for why scoping matters):
//   1. Hero.resolver.tsx -- `meta: HERO_META`, a separate const defined elsewhere in the file.
//   2. StickyOptionsTop.resolver.tsx -- `meta: { ...inline object literal... }` directly on the
//      resolver object itself, no separate const at all.
function readInlineMeta(file, resolverName) {
  const src = fs.readFileSync(file, 'utf8');
  const span = findDeclarationSpan(src, resolverName);
  const scope = span ? src.slice(span[0], span[1] + 1) : src;

  const inlineObj = scope.match(/\bmeta:\s*\{/);
  if (inlineObj) {
    const braceStart = span[0] + inlineObj.index + inlineObj[0].length - 1;
    const braceEnd = extractBalancedObject(src, braceStart);
    if (braceEnd !== -1) {
      try {
        return new Function(`return (${src.slice(braceStart, braceEnd + 1)});`)();
      } catch (err) {
        return { __parseError: err.message };
      }
    }
  }

  const ref = scope.match(/\bmeta:\s*([A-Za-z0-9_]+)\s*,/);
  if (!ref) return null;
  const constSpan = findDeclarationSpan(src, ref[1]);
  if (!constSpan) return null;
  try {
    return new Function(`return (${src.slice(constSpan[0], constSpan[1] + 1)});`)();
  } catch (err) {
    return { __parseError: err.message };
  }
}

const withMetaEntries = [];
const bareEntries = [];
for (const { resolverName, metaName } of entries) {
  if (metaName) {
    const file = importMap.get(metaName) || importMap.get(resolverName);
    const meta = file ? readMeta(file) : null;
    const type = file ? readBareType(file, resolverName) : null;
    // meta.type is the usual case (withMeta() entries always carry it); fall back to the
    // resolver's own `type:` field for the inline-meta pattern (Hero.resolver.tsx), whose
    // meta object never repeats it since it already lives on the RegistryEntry itself.
    if (meta && !meta.__parseError && !meta.type) meta.type = type;
    withMetaEntries.push({ resolverName, file, meta });
  } else {
    const file = importMap.get(resolverName);
    const type = file ? readBareType(file, resolverName) : null;
    const inlineMeta = file ? readInlineMeta(file, resolverName) : null;
    if (inlineMeta && !inlineMeta.__parseError) {
      if (!inlineMeta.type) inlineMeta.type = type;
      withMetaEntries.push({ resolverName, file, meta: inlineMeta });
    } else {
      bareEntries.push({ resolverName, file, type });
    }
  }
}

const documented = withMetaEntries
  .filter((e) => e.meta && !e.meta.__parseError)
  .map((e) => ({ ...e.meta, __file: e.file }))
  .sort((a, b) => String(a.type).localeCompare(String(b.type)));

const lines = [];
// Kept to one line + one count line on purpose (trimmed live, 2026-09-29):
// the table's own headers (sortable, click to cluster) and the Resolver
// column's real links already explain themselves -- restating what Tags/
// Resolver/Name/Type mean here was redundant with just looking at the
// table. Longer rationale for any of this lives in this script's own
// header comment and in git history, not in the generated doc.
lines.push('# GUI Registry');
lines.push('');
lines.push('Every `type` registered in `GuiRegistry` — the declarative surface every GUI spec resolves through.');
lines.push('');
lines.push(`**${entries.length} registered types** — ${documented.length} documented, ${bareEntries.length} not yet authored.`);
lines.push('');

// One flat table, every documented type -- no pre-baked grouping (Atoms/Components/... was
// removed on purpose). doc.html's own script makes every table's headers clickable (see its
// "sortable tables" block), so clustering by Type/Tags is something the reader decides by
// clicking a column, not something the file's own order forces on them.
//
// Column naming (fixed after a real mix-up -- see git history): `type` (the RegistryEntry
// key, e.g. 'Button') is what a JSON spec uses to ADDRESS a resolver -- that's an identifier,
// so it's shown as Name. `group` (Atoms/Molecules/Layout/Components) is what factory.ts's
// withMeta() actually maps to `kind` (the real RegistryKind classification) -- that's the
// true "type" of the thing, so it's shown as Type. `path` (a free-text per-resolver array,
// e.g. ['Actions']) has zero runtime consumers anywhere and already disagrees with the one
// thing it superficially resembles (each component's own real, Storybook-read `title:` in
// its .stories.tsx) -- dropped entirely rather than shown as a second, competing "path".
// `label` dropped too: checked all 44 entries, 43 are `Name` with spaces inserted before
// capitals (mechanically derivable, e.g. AdminViewToggle -> "Admin View Toggle") and the one
// real exception (Me -> ".me") already showed up in that entry's own tags. No runtime consumer
// reads RegistryEntry.meta.label either (GUISettings.tsx's `meta.label` is an unrelated,
// same-named sidebar-action type, not this one).
//
// `Resolver` is new: the file that produced this row, always real by construction, linked
// straight to GitHub (GITHUB_BLOB_BASE above) so this doc is actually click-through browsable
// instead of just naming a local path the reader can't follow. It's the honest stand-in for a
// props column: the real prop shape is declared four different ways across resolvers (inline
// object literal, `SomeProps & {...}`, a bare external type alias, or imported from a sibling
// `.types.ts`), so a regex-based prop list would silently be wrong or incomplete for a good
// chunk of entries -- the same failure mode already fixed once for Path/Label. Getting props
// right needs actual type resolution (ts-morph / the TS checker), not text-scanning; worth
// doing as its own follow-up, not worth faking here -- the Resolver link gets a reader to the
// real answer in one click either way.
//
// `Tags` is back, on different footing than before: not claimed as something the runtime
// reads (nothing does, checked), kept as hand-curated browsing labels -- the same category of
// thing the sortable-table feature exists for, just author-supplied instead of derived from
// `group`/`type`. Said explicitly in the doc's own intro so it's never mistaken for a live API.
lines.push('| Name | Type | Resolver | Tags |');
lines.push('|---|---|---|---|');
for (const it of documented) {
  const relPath = it.__file ? path.relative(root, it.__file).replace(/\\/g, '/') : null;
  // Link text is just the filename (e.g. `AppBar.resolver.tsx`), not the full relative path --
  // the full path blew the table out to 832px inside a 780px page (confirmed in-browser). The
  // href still carries the exact file; hovering/status-bar shows the full path same as any link.
  const resolverStr = relPath ? `[${path.basename(relPath)}](${GITHUB_BLOB_BASE}/${relPath})` : '—';
  const tagsStr = it.tags ? it.tags.join(', ') : '—';
  lines.push(`| \`${it.type}\` | ${it.group || '—'} | ${resolverStr} | ${tagsStr} |`);
}
lines.push('');

if (bareEntries.length) {
  lines.push('## Not yet documented (no `meta`)');
  lines.push('');
  lines.push('These resolve correctly but have no `group` authored yet.');
  lines.push('');
  for (const it of bareEntries.sort((a, b) => String(a.type).localeCompare(String(b.type)))) {
    lines.push(`- \`${it.type || it.resolverName}\``);
  }
  lines.push('');
}

const parseErrors = withMetaEntries.filter((e) => e.meta && e.meta.__parseError);
if (parseErrors.length) {
  lines.push('## Could not parse (script limitation, not a code problem)');
  lines.push('');
  for (const it of parseErrors) lines.push(`- \`${it.resolverName}\` (${it.file}): ${it.meta.__parseError}`);
  lines.push('');
}

// 4. Orphaned .resolver.tsx files on disk: never imported by GuiRegistry.ts at all -- not
// broken (the component still works via plain JSX, the React-first path AGENTS.md describes),
// just invisible to the declarative spec-tree path and the Semantic Inspector.
function listResolverFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listResolverFiles(full, out);
    else if (/\.resolver\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}
const registeredBasenames = new Set([...importMap.values()].map((f) => path.basename(f)));
const allResolverFiles = listResolverFiles(path.join(root, 'src'));
const orphanFiles = allResolverFiles.filter((f) => !registeredBasenames.has(path.basename(f)));

if (orphanFiles.length) {
  lines.push(`## Written, never wired in (${orphanFiles.length} files)`);
  lines.push('');
  lines.push('These `.resolver.tsx` files exist on disk but `GuiRegistry.ts` never imports them --');
  lines.push('the component itself still works fine via plain JSX (the React-first path); it just has');
  lines.push('no `type` string usable from a JSON spec, and the Semantic Inspector can\'t resolve it.');
  lines.push('');
  for (const f of orphanFiles.sort()) {
    lines.push(`- \`${path.relative(root, f)}\``);
  }
  lines.push('');
}

const outPath = path.join(root, '..', 'docs', 'GUI-Registry.md');
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${outPath}`);
console.log(`${entries.length} entries total: ${documented.length} with meta, ${bareEntries.length} bare, ${parseErrors.length} parse errors`);
