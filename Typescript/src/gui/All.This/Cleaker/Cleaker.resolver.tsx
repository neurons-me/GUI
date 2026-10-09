import * as React from 'react';
import type { RegistryEntry } from '@/Registry/types';
import Cleaker, { type CleakerProps } from './Cleaker';

type CleakerSpec = {
  type: 'Cleaker';
  props?: CleakerProps;
};

export const meta = {
  id: 'components.identity-noise.cleaker',
  type: 'Cleaker',
  label: 'Cleaker',
  group: 'Components',
  path: ['Identity Noise', 'Cleaker'],
  tags: ['cleaker', 'identity', 'session', 'namespace', 'qr'],
  demoSpec: {
    type: 'Cleaker',
    // Zero props: Cleaker takes its destination from the `.me` above it (<Me namespace="...">); with none it renders a
    // plain message saying so, so this never crashes the registry catalog.
    props: {},
  },
} as const;

const CleakerResolver: RegistryEntry = {
  type: 'Cleaker',
  resolve(spec: CleakerSpec) {
    const props = spec.props ?? {};
    return <Cleaker {...props} />;
  },
};

export default CleakerResolver;
