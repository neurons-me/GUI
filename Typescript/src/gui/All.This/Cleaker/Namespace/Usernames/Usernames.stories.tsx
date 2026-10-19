import type { Meta } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import UsersTable from './Usernames';

// The public claims directory — who has claimed a handle on a root
// namespace, not what their data holds. identityHash/publicKey are public
// fingerprints (documented as such at the repo root), so listing them here
// leaks nothing a claim doesn't already advertise. Sibling to Cleaker/Cleaker
// (the login/card widget), not nested inside it — this is its own view.
const meta: Meta<typeof UsersTable> = {
  title: 'Pieces/Users',
  component: UsersTable,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// endpoint is a monad's own base URL, not netget's gateway root —
// local.netget/ serves netget's own admin SPA shell, a different service.
// Routed by name through netget's app-mesh proxy (/apps/<name>) rather than
// a raw port — ports are ephemeral/reassigned per run, the name isn't.
// Points at netget's own monad here purely as a real, reachable example.
//
// namespaceRootUrl is a SEPARATE thing from endpoint, on purpose: endpoint
// is where the row data is fetched FROM (the API), namespaceRootUrl is what
// each row's own identity is displayed/QR'd AS (local.cleaker — the real
// identity root claims made through this gateway resolve under). Omitting
// this previously left getUserHostUrl() fall back to `endpoint` itself,
// which put "local.netget" (the API host) in front of people as if it were
// their namespace root — confusing, and wrong: local.netget never issues
// or resolves identity claims, it only proxies to the monad that does.
export const Default = () => (
  <Theme>
    <UsersTable
      endpoint="http://local.netget/apps/netget"
      namespaceRootUrl="http://local.cleaker"
      namespaceLabel="local.cleaker"
    />
  </Theme>
);
