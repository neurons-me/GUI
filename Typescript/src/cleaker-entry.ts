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

// Cleaker in a corner of any page (level 1): the QR, `me @ where`, its four corners and the namespace panel, in a
// Shadow DOM. React-free like the rest of this subpath. The standalone script is dist/cleaker.js.
export { mountCleaker, cornerLabel, isNamespaceName, namespaceEndpoint, CLEAKER_CORNERS, DEFAULT_CLEAKER_NAMESPACE, positionQrValue } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';
export type { CleakerCorner, CleakerHandle, CleakerMountOptions } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';
