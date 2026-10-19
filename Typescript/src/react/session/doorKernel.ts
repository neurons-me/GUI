// What netget consists of, asked of the page's `.me` instead of written by hand.
//
// There is one `.me` on the page (`<Me>`), and the tab's own facts already live in it under `GUI.*` as plain instance
// facts, not synced or signed (GUI.window.location, GUI.theme.*; see writeKernelWindowLocation). What the door answered
// is one more such fact:
//
//   GUI.door.nginx.{up,state,reason}      up is 1 or 0
//   GUI.door.backend.{up,state,reason}
//   GUI.door.monad.{up,state,reason}
//   GUI.door.netget = nginx.up * backend.up * monad.up      1 only when every layer is up
//
// and `explain("GUI.door.netget")` says what that value depends on, in the order a request meets the layers. The panel's
// breakdown IS that answer. No kernel is made here.
import type { DoorLayers, LayerState } from './doorLayers';
export type NetgetLayer = 'nginx' | 'backend' | 'monad';
const LAYERS: NetgetLayer[] = ['nginx', 'backend', 'monad'];

export type NetgetReading = {
  /** The state of netget as a whole. */
  state: LayerState;
  /** The layer that decides it when it is not up: the first one, in request order, that is off or in error. */
  cause: NetgetLayer | null;
  /** `GUI.door.netget`, as the `.me` derived it. */
  up: boolean;
  /** The layers `door.netget` depends on, as `explain` lists them, each with what was read. */
  layers: Array<{ layer: NetgetLayer; state: LayerState; reason: string }>;
};

// The `.me` is a proxy kernel; the paths below are written and read through it as everywhere else in the GUI.
type Kernel = any;

// The formula is declared once per kernel, not on every reading.
const declared = new WeakSet<object>();

function layerReading(layers: DoorLayers, layer: NetgetLayer): { state: LayerState; reason: string } {
  if (layer === 'nginx') return { state: layers.nginx, reason: 'serving this page' };
  if (layer === 'backend') return { state: layers.backend, reason: layers.backendReason };
  return { state: layers.monad, reason: layers.monadReason };
}

/** Writes what was read into the kernel, then asks it. Safe to call again with a newer reading. */
export function explainNetget(kernel: Kernel, layers: DoorLayers): NetgetReading {
  if (!declared.has(kernel)) {
    kernel.GUI.door['=']('netget', 'nginx.up * backend.up * monad.up');
    declared.add(kernel);
  }
  for (const layer of LAYERS) {
    const { state, reason } = layerReading(layers, layer);
    kernel.GUI.door[layer].up(state === 'up' ? 1 : 0);
    kernel.GUI.door[layer].state(state);
    kernel.GUI.door[layer].reason(reason || '');
  }

  const explained = kernel.explain('GUI.door.netget');
  const depends: string[] = Array.isArray(explained?.meta?.dependsOn) ? explained.meta.dependsOn : [];
  const listed = depends
    .map((path) => /^GUI\.door\.(nginx|backend|monad)\.up$/.exec(path)?.[1] as NetgetLayer | undefined)
    .filter((layer): layer is NetgetLayer => Boolean(layer))
    .map((layer) => ({
      layer,
      state: String(kernel(`GUI.door.${layer}.state`)) as LayerState,
      reason: String(kernel(`GUI.door.${layer}.reason`) ?? ''),
    }));

  const failing = listed.find((entry) => entry.state === 'off' || entry.state === 'error');
  const state: LayerState = failing ? failing.state : listed.some((entry) => entry.state === 'checking') ? 'checking' : 'up';
  return { state, cause: failing ? failing.layer : null, up: Number(kernel('GUI.door.netget')) === 1, layers: listed };
}
