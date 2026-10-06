/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RuntimeAdapter, UnsubscribeFn } from './adapter';
import type { MeLike, MeSubscribeBridge, MeTargetLike } from '../react/types';

export type RenderMeOptions = {
  pathPrefix?: string;
  subscribe?: MeSubscribeBridge | null;
  allowBarePath?: boolean;
};

function isEventLike(value: any): boolean {
  return !!value && typeof value === 'object' && (
    'nativeEvent' in value ||
    'preventDefault' in value ||
    'currentTarget' in value ||
    'target' in value
  );
}

export function normalizeActionPayload(args: any[]): any {
  if (args.length === 0) return undefined;
  if (args.length === 1) {
    return isEventLike(args[0]) ? undefined : args[0];
  }
  return args;
}

function normalizeDottedPath(value: string): string {
  return String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\//g, '.');
}

export function normalizeWriteTarget(value: string, prefix: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('me://')) return trimmed;
  const withoutPrefix = trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;
  if (isExplicitMeTarget(withoutPrefix)) return withoutPrefix;
  return normalizeDottedPath(withoutPrefix);
}

export function normalizeReadTarget(value: string, prefix: string, allowBarePath = false): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('me://')) return trimmed;
  if (isExplicitMeTarget(trimmed)) return trimmed;
  if (trimmed.startsWith(prefix)) return normalizeDottedPath(trimmed.slice(prefix.length));
  if (allowBarePath) return normalizeDottedPath(trimmed);
  return '';
}

function isExplicitMeTarget(value: string): boolean {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('me://')) return true;
  return /^[a-z][a-z0-9_-]*(?:\[[^\]]+\])?:[a-z]+(?:\/.*)?$/i.test(trimmed);
}

function parseLegacyAssignment(value: string, prefix: string): { path: string; body: any } | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed.includes('=')) return null;
  const [lhs, ...rhsParts] = trimmed.split('=');
  const rhsRaw = rhsParts.join('=').trim();
  const path = normalizeWriteTarget(lhs.trim(), prefix);
  if (!path || isExplicitMeTarget(path)) return null;
  return {
    path,
    body: parseLiteralValue(rhsRaw),
  };
}

function parseLiteralValue(raw: string): any {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  const num = Number(trimmed);
  if (Number.isFinite(num) && trimmed !== '') return num;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function combineUnsubscribers(unsubs: UnsubscribeFn[]): UnsubscribeFn {
  return () => {
    unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}

export function createInternalStore() {
  let version = 0;
  const listeners = new Set<() => void>();

  return {
    subscribe(_path: string, callback: () => void): UnsubscribeFn {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    notify() {
      version += 1;
      listeners.forEach((listener) => listener());
    },
    /** Move the snapshot without calling every listener (one path changed). */
    bump() {
      version += 1;
    },
    getSnapshot() {
      return version;
    },
  };
}

function resolveNativeSubscribe(me: MeLike, opts: RenderMeOptions): MeSubscribeBridge | null {
  if (typeof opts.subscribe === 'function') return opts.subscribe;
  if (typeof (me as any)?.subscribe === 'function') {
    return (path: string, callback: () => void) => (me as any).subscribe(path, callback);
  }
  return null;
}

function writeViaProxy(me: MeLike, path: string, value: any) {
  if (typeof me !== 'function') {
    throw new Error('[this.GUI] .me write fallback requires a callable kernel or execute(...).');
  }

  const parts = path.split('.').filter(Boolean);
  let cursor: any = me;
  for (const part of parts) {
    cursor = cursor?.[part];
  }

  if (typeof cursor !== 'function') {
    throw new Error(`[this.GUI] Could not resolve writable .me path "${path}".`);
  }

  return cursor(value);
}

function executeMeTarget(me: MeLike, target: MeTargetLike, body?: any) {
  if (typeof (me as any)?.execute === 'function') {
    return (me as any).execute(target as any, body);
  }
  if (typeof target === 'string' && !isExplicitMeTarget(target)) {
    return writeViaProxy(me, normalizeDottedPath(target), body);
  }
  throw new Error('[this.GUI] .me execute(...) is required for explicit targets.');
}

export function readMeValue(me: MeLike, target: string, opts: RenderMeOptions = {}): any {
  const prefix = opts.pathPrefix ?? 'me/';
  const normalized = normalizeReadTarget(target, prefix, opts.allowBarePath === true);
  if (!normalized) return target;

  if (isExplicitMeTarget(normalized)) {
    return executeMeTarget(me, normalized);
  }

  if (typeof me === 'function') {
    return me(normalized);
  }

  return executeMeTarget(me, `self:read/${normalized}`);
}

export function writeMeValue(me: MeLike, target: string, body: any, opts: RenderMeOptions = {}): any {
  const prefix = opts.pathPrefix ?? 'me/';
  const assignment = parseLegacyAssignment(target, prefix);
  if (assignment) {
    return executeMeTarget(me, `self:write/${assignment.path}`, assignment.body);
  }

  const normalized = normalizeWriteTarget(target, prefix);
  if (!normalized) return undefined;

  if (isExplicitMeTarget(normalized)) {
    return executeMeTarget(me, normalized, body);
  }

  if (typeof (me as any)?.execute === 'function') {
    return executeMeTarget(me, `self:write/${normalized}`, body);
  }

  return writeViaProxy(me, normalized, body);
}

export function createMeRuntime(me: MeLike, opts: RenderMeOptions = {}): RuntimeAdapter & { __me?: MeLike; me?: MeLike } {
  const prefix = opts.pathPrefix ?? 'me/';
  const store = createInternalStore();
  const nativeSubscribe = resolveNativeSubscribe(me, opts);

  const adapter: RuntimeAdapter & { __me?: MeLike; me?: MeLike } = {
    me,
    resolve: (value: any) => {
      if (typeof value !== 'string') return value;
      const normalized = normalizeReadTarget(value, prefix, false);
      if (!normalized) return value;
      return readMeValue(me, value, { pathPrefix: prefix });
    },
    action: (expression: string) => {
      return (...args: any[]) => {
        const payload = normalizeActionPayload(args);
        const result = writeMeValue(me, expression, payload, { pathPrefix: prefix });
        store.notify();
        return result;
      };
    },
    subscribe: (path: string, callback: (nextValue: any) => void) => {
      const notify = () => callback(undefined);
      const unsubs: UnsubscribeFn[] = [store.subscribe(path, notify)];
      if (nativeSubscribe) {
        // The kernel changed outside action(): the snapshot must move too, or
        // useSyncExternalStore (RuntimeResolvedNode) sees the same version and
        // keeps the stale value.
        const nativeUnsub = nativeSubscribe(path, () => {
          store.bump();
          notify();
        });
        if (typeof nativeUnsub === 'function') unsubs.push(nativeUnsub);
      }
      return combineUnsubscribers(unsubs);
    },
    getSnapshot: () => store.getSnapshot(),
    notify: () => store.notify(),
    inspectPath: (path?: string) => {
      if (!path) return (me as any)?.inspect?.();
      if (typeof (me as any)?.execute === 'function') {
        return (me as any).execute(`self:inspect/${normalizeDottedPath(path)}`);
      }
      return (me as any)?.inspect?.();
    },
    explainPath: (path: string) => {
      if (typeof (me as any)?.explain === 'function') {
        return (me as any).explain(normalizeDottedPath(path));
      }
      if (typeof (me as any)?.execute === 'function') {
        return (me as any).execute(`self:explain/${normalizeDottedPath(path)}`);
      }
      return undefined;
    },
  };

  Object.defineProperty(adapter, '__me', {
    configurable: false,
    enumerable: false,
    value: me,
    writable: false,
  });

  return adapter;
}

export const render = createMeRuntime;
export const RunMe = createMeRuntime;

export default createMeRuntime;
