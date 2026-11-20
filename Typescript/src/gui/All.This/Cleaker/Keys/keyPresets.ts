// keyPresets.ts — what the keys "+" offers: ready-made keys (a brand mark + its name) and "Custom".
// Pure data, built from SERVICE_DEFINITIONS (fields, paths) — the marks and brand colors are in ServiceIcons.tsx.
// Legacy forms (the old per-service Facebook / Instagram / Threads / Graph API ones) are never offered; Meta is
// one preset that starts "Connect with Facebook" instead of a form. Field NAMES only: values start empty.
import { SERVICE_DEFINITIONS, type ServiceId } from './serviceKeyVault';
import { templatesAt } from './keyTree';

export type KeyPreset =
  | { kind: 'service'; id: ServiceId; label: string; path: string }
  | { kind: 'connect'; id: 'meta.connect'; service: 'meta'; label: string; path: string }
  | { kind: 'soon'; id: 'meta.threads'; service: 'threads'; label: string; path: string };

export const META_CONNECT_PRESET: KeyPreset = { kind: 'connect', id: 'meta.connect', service: 'meta', label: 'Meta · Connect with Facebook', path: 'meta' };

/**
 * Threads has its own OAuth (graph.threads.com) and its own app secret, so it will be a "Connect with Threads"
 * flow (Phase 3), not a form. Until then .meta's "+" shows it disabled, with a one-line "coming soon" tip.
 */
export const THREADS_SOON_PRESET: KeyPreset = { kind: 'soon', id: 'meta.threads', service: 'threads', label: 'Threads · Connect with Threads (coming soon)', path: 'meta.threads' };

/** Presets for "+" at `prefix`: Meta's connect (at the root / .meta, while not connected) + the services not saved yet. */
export function presetsAt(prefix: string, saved: readonly ServiceId[], opts: { metaConnect?: boolean } = {}): KeyPreset[] {
  const out: KeyPreset[] = [];
  if (opts.metaConnect && (prefix === '' || prefix === 'meta')) out.push(META_CONNECT_PRESET);
  const services = templatesAt(prefix, saved);
  for (const id of services) {
    const d = SERVICE_DEFINITIONS.find((x) => x.id === id)!;
    out.push({ kind: 'service', id, label: d.name, path: d.path });
  }
  if (prefix === 'meta' && !saved.includes('threads')) out.push(THREADS_SOON_PRESET);
  return out;
}

/** The field ids a NEW key of this service asks for (legacy fields of old saves excluded). */
export function presetFields(id: ServiceId): string[] {
  return (SERVICE_DEFINITIONS.find((d) => d.id === id)?.fields ?? []).filter((f) => !f.legacy).map((f) => f.id);
}
