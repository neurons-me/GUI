import type { RegistryEntry, RegistryMeta, RegistryKind, GuiRegistry } from "./types";

// group (the resolver files' own free-text label, used for Storybook/demo
// grouping) -> kind (the registry's own closed classification). None of
// the ~50 *.resolver.tsx meta exports actually set `kind` -- it was added
// to RegistryMeta after those files were written and nothing ever went
// back to fill it in, so every withMeta() call site failed `tsc -p
// tsconfig.build.json` with "Property 'kind' is missing". Deriving it
// here, from the one field every meta object already has, fixes every
// call site at once instead of hand-annotating ~50 files individually.
const GROUP_TO_KIND: Record<string, RegistryKind> = {
  Atoms: "atom",
  Molecules: "molecule",
  Layout: "layout",
  Components: "pattern",
};

/**
 * Merges a resolver module's separately-exported `meta` (its file's own
 * `export const meta = {...}`) into the entry, WITHOUT overriding a
 * `meta` the resolver's default export already attaches inline (that
 * pattern -- e.g. Hero.resolver.tsx, LineChart.resolver.tsx -- is already
 * correct and must win). Fixes the real gap this covers: a resolver can
 * export `meta` as a plain named export, forget to also reference it
 * inside the default-exported object literal, and the aggregated
 * GuiRegistry silently drops it -- confirmed live for the majority of
 * Atoms + several All.This components (meta.kind/label/demoSpec all
 * present in source, `undefined` at runtime). Never invents or duplicates
 * an example -- only reattaches metadata the resolver file already wrote.
 */
type InputMeta = {
  id: string;
  label: string;
  kind?: RegistryKind;
  group?: string;
  path?: readonly string[];
  tags?: readonly string[];
  demoSpec?: RegistryMeta["demoSpec"];
  [key: string]: any;
};

export function withMeta(entry: RegistryEntry, meta?: InputMeta): RegistryEntry {
  if (entry.meta || !meta) return entry;
  const kind: RegistryKind = meta.kind ?? GROUP_TO_KIND[String(meta.group)] ?? "pattern";
  const merged: RegistryMeta = { ...meta, kind };
  return { ...entry, meta: merged };
}

export function createRegistry(entries: RegistryEntry[]): GuiRegistry {
  return entries.reduce<GuiRegistry>((acc, e) => {
    acc[e.type] = e;
    return acc;
  }, {} as GuiRegistry);
}

export function extendRegistry(
  base: GuiRegistry,
  entries: RegistryEntry[]
): GuiRegistry {
  return { ...base, ...createRegistry(entries) };
}

/**
 * @deprecated Typo kept for backwards compatibility. Use `extendRegistry`.
 */
export const extexndRegistry = extendRegistry;