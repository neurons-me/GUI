import * as React from 'react';
import type { RegistryEntry } from '@/Registry/types';
import Namespace, { type NamespaceProps } from './namespace';

type NamespaceSpec = {
  type: 'Namespace';
  props?: NamespaceProps;
};

export const meta = {
  id: 'components.identity-noise.namespace',
  type: 'Namespace',
  label: 'Namespace',
  group: 'Components',
  path: ['Identity Noise', 'Namespace'],
  tags: ['namespace', 'identity', 'surface', 'cleaker'],
  demoSpec: {
    type: 'Namespace',
    props: {},
  },
} as const;

const NamespaceResolver: RegistryEntry = {
  type: 'Namespace',
  resolve(spec: NamespaceSpec) {
    const props = spec.props ?? {};
    return <Namespace {...props} />;
  },
};

export default NamespaceResolver;
