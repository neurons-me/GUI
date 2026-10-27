import type { RegistryEntry } from '@/Registry/types';
import NamespaceInspector, { type NamespaceInspectorProps } from './namespace';

/**
 * NamespaceUsers — standalone users view of a namespace.
 * Renders only the users tab (claims registered on this namespace).
 */
const NamespaceUsersResolver: RegistryEntry = {
  type: 'NamespaceUsers',
  resolve(spec: { type: 'NamespaceUsers'; props?: NamespaceInspectorProps }) {
    const props = spec.props ?? {};
    return <NamespaceInspector {...props} defaultTab="users" tabs={['users']} />;
  },
};

export default NamespaceUsersResolver;
