import type { RegistryEntry, RegistryMeta, GuiRegistry } from "./types";

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
export function withMeta(entry: RegistryEntry, meta?: RegistryMeta): RegistryEntry {
  if (entry.meta || !meta) return entry;
  return { ...entry, meta };
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