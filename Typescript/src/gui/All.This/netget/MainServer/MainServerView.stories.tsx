import type { Meta } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import MainServerView from './MainServerView';

// me.netget.mainserver — first of a set of sibling views under the same
// path (mainserver.ports, mainserver.logs, mainserver.domains follow as
// their own components/stories, not tabs bolted onto this one). Ported
// from frontend_local's WelcomeNetget.jsx, see that file's header comment
// for what was intentionally left out of this first pass.
const meta: Meta<typeof MainServerView> = {
  title: 'Pieces/netget/Main Server',
  component: MainServerView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Real, reachable local endpoint — netget's own backend (not a monad),
// same origin frontend_local itself is served from.
export const Default = () => (
  <Theme>
    <MainServerView endpoint="http://local.netget" namespaceRootUrl="http://local.cleaker" />
  </Theme>
);
