export {
  canonicalJson,
  genNonce,
  sha256Hex,
  fetchGatewayHostname,
  deriveCleakerNode,
  deriveCleakerNodeFromMe,
  deriveCompoundSeed,
  signedRequest,
  getActiveNamespaceRoot,
  setActiveNamespaceRoot,
} from '@/gui/All.This/Cleaker/signedRequest';

// React-free reachability check -- a static document's own bootstrap needs
// to know whether a monad answers for this namespace BEFORE deciding to
// load React/the document's route tree at all. Import from here, never
// from '@/runtime/monads' (the barrel) or 'this.gui/runtime' -- both pull
// in useMonadDiscovery.ts, which imports React at module scope.
export { probeMonadSurface, isGenuineSurfacePayload } from '@/runtime/monads/monadDiscovery.fetch';
