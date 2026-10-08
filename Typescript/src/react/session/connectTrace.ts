/**
 * What happened when the QR's expression was executed (clicked): one entry per step, in a small in-memory buffer
 * that is also written to the console and reachable as `globalThis['GUI-QR-TRACE']`. It is the raw material for
 * fall catches: each failure seen for real gets its own handling later; until then it is only recorded.
 * Nothing here decides or authorizes anything.
 */
import type { DoorLayers } from './doorLayers';

export type TraceOutcome = 'ok' | 'off' | 'error' | 'info';
export type TraceEntry = { at: number; expression: string; step: string; outcome: TraceOutcome; detail: string };
export type TraceInput = { expression: string; step: string; outcome: TraceOutcome; detail?: string; at?: number };

export type Trace = {
  record(entry: TraceInput): TraceEntry;
  entries(): TraceEntry[];
  clear(): void;
};

export function createTrace(options: { max?: number; sink?: (entry: TraceEntry) => void } = {}): Trace {
  const max = Math.max(1, options.max ?? 200);
  let log: TraceEntry[] = [];
  return {
    record(input) {
      const entry: TraceEntry = { at: input.at ?? Date.now(), expression: input.expression, step: input.step, outcome: input.outcome, detail: input.detail ?? '' };
      log = [...log, entry].slice(-max);
      try { options.sink?.(entry); } catch { /* a broken sink must not break the attempt */ }
      return entry;
    },
    entries: () => log.slice(),
    clear() { log = []; },
  };
}

const KEY = 'GUI-QR-TRACE';

export const connectTrace: Trace = createTrace({
  sink: (entry) => {
    // eslint-disable-next-line no-console
    console.info('[qr]', entry.expression, entry.step, entry.outcome, entry.detail);
  },
});
if (typeof globalThis !== 'undefined') {
  try { (globalThis as Record<string, unknown>)[KEY] = connectTrace; } catch { /* read-only global: the trace still works */ }
}

/** The three layers behind a door as trace steps, as read. */
export function layerEntries(expression: string, layers: DoorLayers): TraceInput[] {
  const outcome = (state: DoorLayers['backend']): TraceOutcome => (state === 'up' ? 'ok' : state === 'off' ? 'off' : state === 'error' ? 'error' : 'info');
  return [
    { expression, step: 'nginx', outcome: 'ok', detail: 'served this page' },
    { expression, step: 'backend', outcome: outcome(layers.backend), detail: layers.backendReason },
    { expression, step: 'monad', outcome: outcome(layers.monad), detail: layers.monadReason },
  ];
}

/** Did the door answer completely? */
export function doorIsUp(layers: DoorLayers): boolean {
  return layers.backend === 'up' && layers.monad === 'up';
}
