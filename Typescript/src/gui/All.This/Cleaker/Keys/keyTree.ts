// keyTree.ts — the keys collection as a semantic tree (pure, no React).
// Every saved key is a LEAF at a dotted path under `keys` (built-ins from
// SERVICE_DEFINITIONS[].path, custom groups by their own dotted name); each
// intermediate segment is a GROUP level. The tree UI opens one level per
// segment and shows the value card only at a leaf. Plus per-leaf access:
// what the viewer may do with a value.
import { SERVICE_DEFINITIONS, type ServiceId } from './serviceKeyVault';

export type KeyLeaf = { path: string; kind: 'service'; id: ServiceId } | { path: string; kind: 'custom'; name: string };
/** One node on a level: a group (has children) and/or a leaf. A group wins the click when a path is both. */
export type KeyChild = { seg: string; path: string; group: boolean; leaf?: KeyLeaf };

const join = (prefix: string, seg: string) => (prefix ? `${prefix}.${seg}` : seg);

/** Nodes directly under `prefix` ('' = the keys level), in the order their first leaf appears in `leaves`. */
export function childrenAt(leaves: readonly KeyLeaf[], prefix: string): KeyChild[] {
  const out = new Map<string, KeyChild>();
  const head = prefix ? `${prefix}.` : '';
  for (const l of leaves) {
    if (!l.path.startsWith(head) || l.path === prefix) continue;
    const rest = l.path.slice(head.length).split('.');
    const seg = rest[0]; const path = join(prefix, seg);
    const c = out.get(path) ?? { seg, path, group: false };
    if (rest.length === 1) c.leaf = c.leaf ?? l; else c.group = true;
    out.set(path, c);
  }
  return [...out.values()];
}

/** The longest prefix of `segs` that still exists (after a remove, the open trail shrinks to it). */
export function trimToExisting(leaves: readonly KeyLeaf[], segs: readonly string[]): string[] {
  const out: string[] = [];
  for (const seg of segs) {
    if (!childrenAt(leaves, out.join('.')).some((c) => c.seg === seg)) break;
    out.push(seg);
  }
  return out;
}

/** Built-ins under `prefix` not saved yet (the presets of "+" at that level). Legacy forms are never offered. */
export function templatesAt(prefix: string, saved: readonly ServiceId[]): ServiceId[] {
  const head = prefix ? `${prefix}.` : '';
  // Meta's products (WhatsApp, Threads…) live under .meta and are offered only from .meta's "+":
  // at the root, Meta is the single entry (its connect preset / its own branch).
  const underMeta = (path: string) => !prefix && path.startsWith('meta.');
  return SERVICE_DEFINITIONS.filter((d) => !d.legacy && d.path.startsWith(head) && !underMeta(d.path) && !saved.includes(d.id)).map((d) => d.id);
}

/** Human names and icons for built-in group levels. Unknown (custom) groups use their segment. */
export const GROUP_INFO: Record<string, { name: string; service?: ServiceId; icon?: string }> = {
  meta: { name: 'Meta', service: 'meta' },
  paypal: { name: 'PayPal', service: 'paypal' },
  dev: { name: 'Developer APIs', icon: 'code' },
  google: { name: 'Google', service: 'google' },
  sms: { name: 'SMS', service: 'sms' },
  'meta.facebook': { name: 'Facebook', service: 'facebook' },
  'meta.instagram': { name: 'Instagram', service: 'instagram' },
  'meta.threads': { name: 'Threads', service: 'threads' },
};

// ── Access ──────────────────────────────────────────────────────────────
/** What the viewer may do with a leaf's value. The path itself is always visible. */
export type KeyAccess = 'none' | 'read' | 'edit';
export type KeyAccessProp = KeyAccess | ((path: string) => KeyAccess);

export interface KeyCaps {
  /** Eye / copy (decrypt on demand with the passphrase). */
  reveal: boolean;
  /** Type new values, save, add fields, remove. */
  edit: boolean;
}
export function capsOf(access: KeyAccess): KeyCaps {
  return { reveal: access !== 'none', edit: access === 'edit' };
}
/** Resolve the access for a full path (`keys.meta.instagram`). No prop: edit (the signed-in owner). Anything unrecognised: none (fail closed). */
export function accessFor(access: KeyAccessProp | undefined, path: string): KeyAccess {
  if (access === undefined) return 'edit';
  const a = typeof access === 'function' ? access(path) : access;
  return a === 'edit' || a === 'read' ? a : 'none';
}
