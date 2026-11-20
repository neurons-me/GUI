// keyOrder.ts — most-recently-used order of a namespace's keys collection.
// A key that is added or used (card opened, saved) moves to the front, so
// the row organizes itself by usage and "…" paging only hides the least
// used. Sorting reuses the Collections rule `recentFirst` (same rule the
// Theme Catalog uses for its theme history); this file only keeps the
// history. Stored as NON-SECRET metadata — ids only ('paypal',
// 'custom:myapi'), never values — at this.me.service-keys:v1:order:<ns>.
import { recentFirst } from '@/gui-internals/Collections/rules/recentFirst';
import { isServiceId, type CustomKeyId, type ServiceId } from './serviceKeyVault';

export type KeyOrderId = ServiceId | CustomKeyId;
export const KEY_ORDER_PREFIX = 'this.me.service-keys:v1:order:';
const MAX_HISTORY = 200;

const orderKey = (ns: string) => {
  const n = String(ns || '').trim().toLowerCase();
  if (!n) throw new Error('A namespace is required to address service keys.');
  return `${KEY_ORDER_PREFIX}${n}`;
};
function storage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
export function isKeyOrderId(id: unknown): id is KeyOrderId {
  return isServiceId(id) || (typeof id === 'string' && /^custom:[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(id));
}

/** Most recent first. Unknown/invalid entries are ignored. */
export function readKeyOrder(namespace: string): KeyOrderId[] {
  try {
    const raw = JSON.parse(storage()?.getItem(orderKey(namespace)) ?? '[]');
    return Array.isArray(raw) ? [...new Set(raw.filter(isKeyOrderId))] : [];
  } catch { return []; }
}
function writeKeyOrder(namespace: string, order: KeyOrderId[]): void {
  const store = storage(); if (!store) return;
  if (order.length === 0) store.removeItem(orderKey(namespace));
  else store.setItem(orderKey(namespace), JSON.stringify(order.slice(0, MAX_HISTORY)));
}

/** Added or used: move `id` to the front. */
export function touchKey(namespace: string, id: KeyOrderId): KeyOrderId[] {
  if (!isKeyOrderId(id)) return readKeyOrder(namespace);
  const next = [id, ...readKeyOrder(namespace).filter((x) => x !== id)];
  writeKeyOrder(namespace, next);
  return next;
}

/** Removed: drop it from the history. */
export function forgetKey(namespace: string, id: KeyOrderId): void {
  const cur = readKeyOrder(namespace);
  if (cur.includes(id)) writeKeyOrder(namespace, cur.filter((x) => x !== id));
}

export function clearKeyOrder(namespace: string): void {
  storage()?.removeItem(orderKey(namespace));
}

/** Orders `items` by the history (most recent first); items never used keep their given order after them. */
export function orderByUsage<T>(items: T[], order: readonly string[], idOf: (t: T) => string): T[] {
  const wrapped = items.map((item) => ({ item, id: idOf(item) }));
  return recentFirst<{ item: T; id: string }>([...order], 'id')(wrapped).map((w) => w.item);
}
