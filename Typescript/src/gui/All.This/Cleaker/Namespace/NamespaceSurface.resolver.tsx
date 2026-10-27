import type { RegistryEntry } from '@/Registry/types';
import NamespaceInspector, { type NamespaceInspectorProps } from './namespace';

/**
 * NamespaceSurface — standalone surface/telemetry view of a namespace.
 * Renders only the surface tab (monad surface entry, request events, resources).
 */
const NamespaceSurfaceResolver: RegistryEntry = {
  type: 'NamespaceSurface',
  resolve(spec: { type: 'NamespaceSurface'; props?: NamespaceInspectorProps }) {
    const props = spec.props ?? {};
    return <NamespaceInspector {...props} defaultTab="surface" tabs={['surface']} />;
  },
};

export default NamespaceSurfaceResolver;
