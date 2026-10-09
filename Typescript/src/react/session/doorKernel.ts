// What netget consists of, asked of a `.me` instead of written by hand.
//
// A small kernel of its own holds the three layers' readings and ONE derived value:
//
//   door.nginx.{up,state,reason}      up is 1 or 0
//   door.backend.{up,state,reason}
//   door.monad.{up,state,reason}
//   door.netget = nginx.up * backend.up * monad.up      1 only when every layer is up
//
// and `explain("door.netget")` says what that value depends on, in the order a request meets the layers. The panel's
// breakdown IS that answer.
//
// The kernel is the diagnosis's own, never the page's `<Me>`: every write to a kernel stays in its chain of memories,
// and probes of a gateway have no business in the `.me` a person declared.
import ME from 'this.me';
import type { DoorLayers, LayerState } from './doorLayers';

export type NetgetLayer = 'nginx' | 'backend' | 'monad';
const LAYERS: NetgetLayer[] = ['nginx', 'backend', 'monad'];

export type NetgetReading = {
  /** The state of netget as a whole. */
  state: LayerState;
  /** The layer that decides it when it is not up: the first one, in request order, that is off or in error. */
  cause: NetgetLayer | null;
  /** `door.netget`, as the kernel derived it. */
  up: boolean;
  /** The layers `door.netget` depends on, as `explain` lists them, each with what was read. */
  layers: Array<{ layer: NetgetLayer; state: LayerState; reason: string }>;
};

type Kernel = any;

export function createDoorKernel(): Kernel {
  const kernel: Kernel = new (ME as any)();
  kernel.door['=']('netget', 'nginx.up * backend.up * monad.up');
  return kernel;
}

function layerReading(layers: DoorLayers, layer: NetgetLayer): { state: LayerState; reason: string } {
  if (layer === 'nginx') return { state: layers.nginx, reason: 'serving this page' };
  if (layer === 'backend') return { state: layers.backend, reason: layers.backendReason };
  return { state: layers.monad, reason: layers.monadReason };
}

/** Writes what was read into the kernel, then asks it. Safe to call again with a newer reading. */
export function explainNetget(kernel: Kernel, layers: DoorLayers): NetgetReading {
  for (const layer of LAYERS) {
    const { state, reason } = layerReading(layers, layer);
    kernel.door[layer].up(state === 'up' ? 1 : 0);
    kernel.door[layer].state(state);
    kernel.door[layer].reason(reason || '');
  }

  const explained = kernel.explain('door.netget');
  const depends: string[] = Array.isArray(explained?.meta?.dependsOn) ? explained.meta.dependsOn : [];
  const listed = depends
    .map((path) => /^door\.(nginx|backend|monad)\.up$/.exec(path)?.[1] as NetgetLayer | undefined)
    .filter((layer): layer is NetgetLayer => Boolean(layer))
    .map((layer) => ({
      layer,
      state: String(kernel(`door.${layer}.state`)) as LayerState,
      reason: String(kernel(`door.${layer}.reason`) ?? ''),
    }));

  const failing = listed.find((entry) => entry.state === 'off' || entry.state === 'error');
  const state: LayerState = failing ? failing.state : listed.some((entry) => entry.state === 'checking') ? 'checking' : 'up';
  return { state, cause: failing ? failing.layer : null, up: Number(kernel('door.netget')) === 1, layers: listed };
}
