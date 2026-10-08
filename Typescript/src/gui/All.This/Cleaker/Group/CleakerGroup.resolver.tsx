import * as React from 'react';
import type { RegistryEntry } from '@/Registry/types';
import CleakerGroup, { type CleakerGroupProps } from './CleakerGroup';

type CleakerGroupSpec = {
  type: 'CleakerGroup';
  props?: CleakerGroupProps;
};

export const meta = {
  id: 'components.identity-noise.cleaker-group',
  type: 'CleakerGroup',
  label: 'Cleaker Group',
  group: 'Components',
  path: ['Identity Noise', 'Cleaker', 'Group'],
  tags: ['cleaker', 'group', 'schema', 'me'],
  demoSpec: {
    type: 'CleakerGroup',
    props: {},
  },
} as const;

const CleakerGroupResolver: RegistryEntry = {
  type: 'CleakerGroup',
  resolve(spec: CleakerGroupSpec) {
    const props = spec.props ?? {};
    return <CleakerGroup {...props} />;
  },
};

export default CleakerGroupResolver;
