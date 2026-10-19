// The three layers behind a netget door, and what each one answers.
//
//   nginx    serves this page and answers /apps and /apps/<name> itself (Lua). If the page loaded, it is up.
//   backend  netget's gateway API (:3000): /gateway-identity, setup, install. nginx proxies to it.
//   monad    netget's own .me (:8161), reached through nginx at /apps/<name>.
//
// A layer is OFF when nothing is behind it, and in ERROR when something answered and refused. The two look the
// same to a caller that only asks "did it work", and mean different things to a person: off is "start it",
// error is "look at what it said". What tells them apart is WHO produced the response:
//   - nginx's own HTML page (502/503/504): the upstream is not there            -> off
//   - a page of HTML where JSON was expected (the SPA fallback, 200 text/html)   -> off
//   - nothing at all (network error, timeout)                                    -> off
//   - nginx's Lua answering JSON `monad_not_found`: no monad is registered       -> off (monad)
//   - JSON from the layer itself that is not the success shape                   -> error
import * as React from 'react';

export type LayerState = 'checking' | 'up' | 'off' | 'error';
export type LayerKind = 'backend' | 'monad';

export type ProbeOutcome = {
  /** HTTP status, or null when no response came back at all. */
  status: number | null;
  contentType: string;
  /** Parsed JSON body, or null when the body was not JSON. */
  json: any | null;
  /** The failure of the request itself (refused, timed out), when there was no response. */
  networkError?: string;
};

export type LayerReading = { state: Exclude<LayerState, 'checking'>; reason: string };

const NOTHING_BEHIND = new Set([502, 503, 504]);

export function classifyLayerOutcome(kind: LayerKind, outcome: ProbeOutcome): LayerReading {
  if (outcome.status === null) return { state: 'off', reason: outcome.networkError ? `no response (${outcome.networkError})` : 'no response' };
  if (NOTHING_BEHIND.has(outcome.status)) return { state: 'off', reason: `nginx answered ${outcome.status}: nothing behind it` };
  const json = outcome.json;
  if (json === null || typeof json !== 'object') {
    return { state: 'off', reason: `answered a page (${outcome.status}, ${outcome.contentType || 'no content type'}), not JSON` };
  }
  if (kind === 'backend') {
    if (outcome.status === 200 && typeof json.gatewayId === 'string' && json.gatewayId) return { state: 'up', reason: 'answers /gateway-identity' };
    return { state: 'error', reason: `unexpected answer (${outcome.status})${json.error ? `: ${String(json.error)}` : ''}` };
  }
  const monadId = String(json.monadId || json.monad?.id || json.surfaceEntry?.monadId || '').trim();
  if (outcome.status === 200 && monadId) return { state: 'up', reason: 'answers /__surface' };
  if (outcome.status === 404 && String(json.error || '') === 'monad_not_found') return { state: 'off', reason: 'no monad is registered under that name' };
  return { state: 'error', reason: `unexpected answer (${outcome.status})${json.error ? `: ${String(json.error)}` : ''}` };
}

async function readOutcome(url: string, fetchImpl: typeof fetch, timeoutMs: number): Promise<ProbeOutcome> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchImpl(url, { cache: 'no-store', credentials: 'same-origin', signal: controller?.signal });
    const contentType = response.headers.get('content-type') || '';
    let json: any = null;
    if (contentType.includes('json')) {
      try { json = await response.json(); } catch { json = null; }
    }
    return { status: response.status, contentType, json };
  } catch (error) {
    return { status: null, contentType: '', json: null, networkError: error instanceof Error ? error.message : String(error) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type DoorLayers = {
  /** If this page loaded, the layer that served it is up. */
  nginx: 'up';
  backend: LayerState;
  monad: LayerState;
  backendReason: string;
  monadReason: string;
  checkedAt: number | null;
};

export const DOOR_LAYERS_CHECKING: DoorLayers = {
  nginx: 'up', backend: 'checking', monad: 'checking', backendReason: '', monadReason: '', checkedAt: null,
};

export async function probeDoorLayers(input: {
  /** The origin the page was served from, e.g. https://localhost */
  origin: string;
  /** Where the monad is reached, e.g. https://localhost/apps/netget */
  monadTransport: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<DoorLayers> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? 4000;
  const origin = input.origin.replace(/\/+$/, '');
  const transport = input.monadTransport.replace(/\/+$/, '');
  const [backendOutcome, monadOutcome] = await Promise.all([
    readOutcome(`${origin}/gateway-identity`, fetchImpl, timeoutMs),
    readOutcome(`${transport}/__surface`, fetchImpl, timeoutMs),
  ]);
  const backend = classifyLayerOutcome('backend', backendOutcome);
  const monad = classifyLayerOutcome('monad', monadOutcome);
  return { nginx: 'up', backend: backend.state, monad: monad.state, backendReason: backend.reason, monadReason: monad.reason, checkedAt: Date.now() };
}

/**
 * Probes the layers now and every `intervalMs`, so a door that comes up (or goes down) changes on screen without a
 * reload. `enabled: false` stops probing and keeps the last reading.
 */
export function useDoorLayers(input: { origin: string; monadTransport: string; intervalMs?: number; enabled?: boolean; fetchImpl?: typeof fetch }): DoorLayers {
  const { origin, monadTransport, intervalMs = 5000, enabled = true, fetchImpl } = input;
  const [layers, setLayers] = React.useState<DoorLayers>(DOOR_LAYERS_CHECKING);
  React.useEffect(() => {
    if (!enabled || !origin || !monadTransport) return undefined;
    let alive = true;
    const run = () => {
      probeDoorLayers({ origin, monadTransport, fetchImpl }).then((next) => { if (alive) setLayers(next); });
    };
    run();
    const timer = setInterval(run, intervalMs);
    return () => { alive = false; clearInterval(timer); };
  }, [origin, monadTransport, intervalMs, enabled, fetchImpl]);
  return layers;
}
