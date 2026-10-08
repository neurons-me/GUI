import type { RegistryEntry } from '@/Registry/types';
import CleakerQR, { type CleakerQRProps } from './CleakerQR';

type CleakerQRSpec = {
  type: 'CleakerQR';
  props?: CleakerQRProps;
};

export const meta = {
  id: 'components.identity-noise.cleaker-qr',
  type: 'CleakerQR',
  label: 'Cleaker QR',
  group: 'Components',
  path: ['Identity Noise', 'Cleaker'],
  tags: ['qr', 'cleaker', 'identity', 'session'],
  demoSpec: {
    type: 'CleakerQR',
    props: {
      size: 136,
    },
  },
} as const;

const CleakerQRResolver: RegistryEntry = {
  type: 'CleakerQR',
  resolve(spec: CleakerQRSpec) {
    const p: Partial<NonNullable<CleakerQRSpec['props']>> = spec.props ?? {};
    return <CleakerQR {...p} />;
  },
};

export default CleakerQRResolver;
