/*
 * GUI.OpenStreetMap — kernel bindings for map props.
 *
 * Reuses the existing runtime: values are read with readMeValue and change
 * notifications come only from RuntimeAdapter.subscribe (the same channel
 * useMeValue uses). That means a bound prop re-reads after
 *   - a write through the adapter (runtime.action(...)), or runtime.notify(), or
 *   - an explicit `subscribe` bridge passed to MeRuntimeProvider / createMeRuntime.
 * A write made directly on the kernel (me.x(...)) does NOT notify by itself:
 * this.me@4.1.0 exposes no per-instance change listener.
 */
import * as React from 'react';
import type { RuntimeAdapter, UnsubscribeFn } from '@/runtime/adapter';
import { readMeValue } from '@/runtime/run-me';
import { useOptionalMeRuntimeContext } from '@/react/MeRuntimeProvider';
import { useRuntimeEnvironment } from '@/runtime/runtimeContext';
import type { MeLike } from '@/react/types';

export type BoundValueSource = {
  subscribe(callback: () => void): UnsubscribeFn;
  getSnapshot(): any;
};

function sameValue(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is(a[k], b[k]));
}

const NOOP_SOURCE: BoundValueSource = {
  subscribe: () => () => {},
  getSnapshot: () => undefined,
};

/**
 * A useSyncExternalStore source for one kernel path. Snapshots of flat
 * arrays/objects are kept referentially stable while their contents are equal.
 */
export function createBoundValueSource(
  runtime: RuntimeAdapter | null | undefined,
  me: MeLike | null | undefined,
  path: string | null | undefined,
): BoundValueSource {
  if (!path || !me) return NOOP_SOURCE;
  let last: { value: any } | null = null;
  return {
    subscribe(callback) {
      if (!runtime?.subscribe) return () => {};
      const unsub = runtime.subscribe(path, () => callback(), undefined, { propKey: path });
      return typeof unsub === 'function' ? unsub : () => {};
    },
    getSnapshot() {
      let value: any;
      try {
        value = readMeValue(me, path, { allowBarePath: true });
      } catch {
        value = undefined;
      }
      if (last && sameValue(last.value, value)) return last.value;
      last = { value };
      return value;
    },
  };
}

/** The runtime/me in scope, without throwing when there is none. */
export function useOptionalMeScope(): { me: MeLike | null; runtime: RuntimeAdapter | null } {
  const local = useOptionalMeRuntimeContext();
  const env = useRuntimeEnvironment();
  const runtime = (local?.runtime ?? env.runtime ?? null) as RuntimeAdapter | null;
  const runtimeMe = (runtime as any)?.__me ?? (runtime as any)?.me;
  const me = (local?.me ?? env.me ?? runtimeMe ?? null) as MeLike | null;
  return { me, runtime };
}

/** Read one kernel path through the runtime; undefined path = unbound. */
export function useBoundValue(path: string | null | undefined): any {
  const { me, runtime } = useOptionalMeScope();
  const source = React.useMemo(() => createBoundValueSource(runtime, me, path), [runtime, me, path]);
  return React.useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
}

/** One store over several kernel paths; the snapshot (array) stays stable while every value is equal. */
export function createBoundListSource(
  runtime: RuntimeAdapter | null | undefined,
  me: MeLike | null | undefined,
  paths: string[],
): BoundValueSource {
  const sources = paths.map((path) => createBoundValueSource(runtime, me, path));
  let last: any[] | null = null;
  return {
    subscribe(callback) {
      const unsubs = sources.map((s) => s.subscribe(callback));
      return () => unsubs.forEach((u) => u());
    },
    getSnapshot() {
      const values = sources.map((s) => s.getSnapshot());
      if (last && last.length === values.length && values.every((v, i) => Object.is(v, last![i]))) return last;
      last = values;
      return values;
    },
  };
}

/**
 * Read one kernel path (string) or several (array) through the runtime.
 * Returns the value, or an array of values for an array of paths; undefined when unbound.
 */
export function useBoundValues(bind: string | readonly string[] | null | undefined): any {
  const { me, runtime } = useOptionalMeScope();
  const many = Array.isArray(bind);
  const key = many ? (bind as readonly string[]).join('\u0000') : (bind as string | null | undefined) ?? '';
  const source = React.useMemo(
    () => createBoundListSource(runtime, me, key ? key.split('\u0000') : []),
    [runtime, me, key],
  );
  const values = React.useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  return many ? values : values[0];
}

const NUMBER_FORMAT = typeof Intl !== 'undefined' ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }) : null;

/** Default text for a bound or given overlay value: numbers grouped, lists joined with " · ", missing = "—". */
export function formatOsmValue(value: any): string {
  if (value === undefined || value === null || (typeof value === 'number' && !Number.isFinite(value))) return '—';
  if (Array.isArray(value)) return value.map(formatOsmValue).join(' · ');
  if (typeof value === 'number') return NUMBER_FORMAT ? NUMBER_FORMAT.format(value) : String(value);
  return String(value);
}
