// keyMeta.ts — a keys-tree node's icon and label, read from the .me tree.
//
// Any node may declare two PUBLIC values at its own path, the same way the
// neurons-me `me.whatever(what)` examples store GUI.Icon tokens:
//
//   me.keys.meta.instagram.icon("photo_camera");   me("keys.meta.instagram.icon")
//   me.keys.meta.label("Meta · plataformas");      me("keys.meta.label")
//
// `.icon` is a GUI.Icon token (`photo_camera`), one glyph (🚚 𓃒 ★ — same
// grapheme rules and cap as custom marks), or `brand:<serviceId>` for a
// built-in brand mark. `.label` is the human name. Resolution per node:
//   declared in the tree (a this.me instance, then this device's public
//   branch below) → built-in fallback (ServiceIcons / GROUP_INFO / an old
//   custom mark) → the generic key icon / the humanized segment.
//
// These are public metadata: they live beside the values, never inside the
// encrypted envelope, and nothing here ever reads a value.
import { cleanCustomKeyMark, isServiceId, type CustomKeyMark, type ServiceId } from './serviceKeyVault';

/** Anything that reads a .me path — a this.me instance (`me("a.b")`) is one. */
export type MeReader = (path: string) => unknown;

export type NodeIcon = CustomKeyMark | { kind: 'brand'; service: ServiceId };
export type MetaSource = 'tree' | 'builtin' | 'default';
export interface ResolvedMeta { icon: NodeIcon; label: string; iconSource: MetaSource; labelSource: MetaSource }

/** GUI.Icon tokens: `photo_camera`, or a prefixed set like `lucide:Truck` / `mui:Favorite` (see Atoms/Icon). */
const TOKEN_RE = /^(?:(?:lucide|mui):[A-Za-z][A-Za-z0-9_]{0,39}|[a-z][a-z0-9_]{0,39})$/;
export const LABEL_MAX = 48;

/** A declared `.icon` value → an icon, or undefined if unusable (non-string, empty, objects, …). */
export function parseIcon(raw: unknown): NodeIcon | undefined {
  if (typeof raw !== 'string') return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (v.startsWith('brand:')) { const s = v.slice(6); return isServiceId(s) ? { kind: 'brand', service: s } : undefined; }
  if (TOKEN_RE.test(v)) return { kind: 'icon', name: v };
  return cleanCustomKeyMark({ kind: 'glyph', value: v }); // first grapheme, capped (16 code points)
}

/** An icon → the string stored at `.icon`. */
export function iconToValue(icon: NodeIcon | null | undefined): string | undefined {
  if (!icon) return undefined;
  return icon.kind === 'icon' ? icon.name : icon.kind === 'glyph' ? icon.value : `brand:${icon.service}`;
}

/** A declared `.label` → trimmed single-line text (≤ 48 chars), or undefined. */
export function cleanLabel(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  const v = raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!v) return undefined;
  const chars = Array.from(v);
  return chars.length > LABEL_MAX ? `${chars.slice(0, LABEL_MAX - 1).join('')}…` : v;
}

/** `stripe-test` → `Stripe test`. */
export function humanize(seg: string): string {
  const s = String(seg ?? '').replace(/[-_]+/g, ' ').trim();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

function safeRead(reader: MeReader, path: string): unknown {
  try { return reader(path); } catch { return undefined; }
}

/** The node's icon and label: declared in the tree → built-in → default. */
export function resolveNodeMeta(path: string, readers: ReadonlyArray<MeReader | null | undefined>, builtin: { icon?: NodeIcon; label?: string } = {}): ResolvedMeta {
  let icon: NodeIcon | undefined; let label: string | undefined;
  for (const r of readers) {
    if (!r) continue;
    icon = icon ?? parseIcon(safeRead(r, `${path}.icon`));
    label = label ?? cleanLabel(safeRead(r, `${path}.label`));
    if (icon && label) break;
  }
  const seg = path.slice(path.lastIndexOf('.') + 1);
  return {
    icon: icon ?? builtin.icon ?? { kind: 'icon', name: 'key' },
    label: label ?? builtin.label ?? humanize(seg),
    iconSource: icon ? 'tree' : builtin.icon ? 'builtin' : 'default',
    labelSource: label ? 'tree' : builtin.label ? 'builtin' : 'default',
  };
}

// ── This device's public branch ────────────────────────────────────────
// Until the keys tree lives in a persisted this.me runtime, declared .icon /
// .label values made here (e.g. a custom key's chosen icon) are kept in a
// small PUBLIC map: path → { icon, label }. Never values, never secrets.
export const KEY_META_PREFIX = 'this.me.keys-meta:v1:';
type MetaMap = Record<string, { icon?: string; label?: string }>;

function storage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
const metaKey = (ns: string) => `${KEY_META_PREFIX}${String(ns || '').trim().toLowerCase()}`;

export function readPublicMeta(namespace: string): MetaMap {
  try {
    const raw = JSON.parse(storage()?.getItem(metaKey(namespace)) ?? '{}');
    const out: MetaMap = {};
    if (raw && typeof raw === 'object') {
      for (const [p, v] of Object.entries(raw as Record<string, any>)) {
        const icon = iconToValue(parseIcon(v?.icon)); const label = cleanLabel(v?.label);
        if (icon || label) out[p] = { ...(icon ? { icon } : {}), ...(label ? { label } : {}) };
      }
    }
    return out;
  } catch { return {}; }
}

/** A reader over this device's public branch: `keys.x.icon` → its declared icon. */
export function publicMetaReader(map: MetaMap): MeReader {
  return (path) => {
    const m = /^(.*)\.(icon|label)$/.exec(path);
    return m ? map[m[1]]?.[m[2] as 'icon' | 'label'] : undefined;
  };
}

/** Walks `me.a.b.c` for a this.me instance (each step is a property; the last is called). */
function meAt(me: any, path: string): ((v: unknown) => unknown) | null {
  let node = me;
  for (const seg of path.split('.')) { if (node == null) return null; node = node[seg]; }
  return typeof node === 'function' ? node : null;
}

/**
 * Declares a node's `.icon` / `.label` (public). `null` clears one, `undefined` leaves it.
 * Writes this device's public branch, and the given this.me instance when there is one.
 */
export function declareNodeMeta(namespace: string, path: string, meta: { icon?: NodeIcon | string | null; label?: string | null }, me?: unknown): void {
  const map = readPublicMeta(namespace);
  const cur = { ...(map[path] ?? {}) };
  if (meta.icon !== undefined) {
    const v = meta.icon === null ? undefined : iconToValue(typeof meta.icon === 'string' ? parseIcon(meta.icon) : meta.icon);
    if (v) cur.icon = v; else delete cur.icon;
    if (v && me) meAt(me, `${path}.icon`)?.(v);
  }
  if (meta.label !== undefined) {
    const v = meta.label === null ? undefined : cleanLabel(meta.label);
    if (v) cur.label = v; else delete cur.label;
    if (v && me) meAt(me, `${path}.label`)?.(v);
  }
  if (cur.icon || cur.label) map[path] = cur; else delete map[path];
  const store = storage(); if (!store) return;
  if (Object.keys(map).length) store.setItem(metaKey(namespace), JSON.stringify(map)); else store.removeItem(metaKey(namespace));
}

export function forgetNodeMeta(namespace: string, path: string): void {
  declareNodeMeta(namespace, path, { icon: null, label: null });
}
