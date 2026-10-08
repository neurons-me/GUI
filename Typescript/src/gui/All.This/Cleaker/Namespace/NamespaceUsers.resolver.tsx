import type { RegistryEntry } from '@/Registry/types';
import Namespace, { type NamespaceProps } from './namespace';

/**
 * NamespaceUsers — standalone users view of a namespace.
 * Renders only the users tab (claims registered on this namespace).
 */
const NamespaceUsersResolver: RegistryEntry = {
  type: 'NamespaceUsers',
  resolve(spec: { type: 'NamespaceUsers'; props?: NamespaceProps }) {
    const props = spec.props ?? {};
    return <Namespace {...props} defaultTab="users" tabs={['users']} />;
  },
};

export default NamespaceUsersResolver;
