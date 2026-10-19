import type { RegistryEntry } from '@/Registry/types';
import MeField, { type MeFieldProps } from './MeField';

type MeFieldSpec = {
  type: 'MeField';
  props?: MeFieldProps;
};

export const meta = {
  id: 'components.identity-noise.me-field',
  type: 'MeField',
  label: '.me field',
  group: 'Components',
  path: ['Identity Noise', '.me field'],
  tags: ['me', 'binding', 'field', 'identity', 'react'],
  demoSpec: {
    type: 'MeField',
    props: {
      path: 'name',
      label: '.me Name',
      mode: 'commit',
    },
  },
} as const;

const MeFieldResolver: RegistryEntry = {
  type: 'MeField',
  resolve(spec: MeFieldSpec) {
    const props = spec.props ?? {};
    return <MeField {...props} />;
  },
};

export default MeFieldResolver;
