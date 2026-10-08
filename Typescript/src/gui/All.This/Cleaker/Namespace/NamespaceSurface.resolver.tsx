import type { RegistryEntry } from '@/Registry/types';
import Namespace, { type NamespaceProps } from './namespace';

/**
 * NamespaceSurface — standalone surface/telemetry view of a namespace.
 * Renders only the surface tab (monad surface entry, request events, resources).
 */
const NamespaceSurfaceResolver: RegistryEntry = {
  type: 'NamespaceSurface',
  resolve(spec: { type: 'NamespaceSurface'; props?: NamespaceProps }) {
    const props = spec.props ?? {};
    return <Namespace {...props} defaultTab="surface" tabs={['surface']} />;
  },
};

export default NamespaceSurfaceResolver;
