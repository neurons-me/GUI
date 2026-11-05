import type { Meta } from '@storybook/react';
import { Me } from '@/react/Me';
import DoorLayersPanel from './DoorLayersPanel';
import type { DoorLayers } from '@/react/session/doorLayers';

// The panel a door shows when netget is not all there. It does not say where you are (namespace, path): the top
// bar does, once, in the same syntax on every page.
const meta: Meta<typeof DoorLayersPanel> = {
  title: 'Pieces/netget/Door',
  component: DoorLayersPanel,
  parameters: { layout: 'padded' },
};
export default meta;

const off: DoorLayers = {
  nginx: 'up', backend: 'off', monad: 'off',
  backendReason: 'nginx answered 502: nothing is listening behind it',
  monadReason: 'no monad is registered under that name',
  checkedAt: 0,
};

export const NetgetOff = () => (
  <Me username="sui">
    <DoorLayersPanel layers={off} location="http://localhost" />
  </Me>
);

