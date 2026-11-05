import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import Namespace from "@/react/session/Namespace";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";

// This is the literal mount root: GUI.document.json's own root route
// (content.landing, route: "/") declares component: "Landing", which this
// IS (Namespace.tsx's default export). Surfaced here, under Getting
// Started, because that's what it actually is — not a Cleaker-specific
// example. The full regression-test group for it (recovery-phrase
// registration, the cleaker-backend smoke test, the compact card view)
// stays at All.This/Cleaker/.me — same component, same setup, this story
// duplicates none of that logic, it just gives the root document a front
// door in the nav that matches its real role.
//
// Resolved as the real page does it, nothing written in by hand: the address is only a draft
// (namespaceSource "address"), and the `.me` is named only once a monad answers for it. It is asked through this
// machine's own door (http://localhost, nginx). Until something answers, the top bar says `? @ localhost:6006`.
// (local.cleaker / local.netget were retired on 2026-10-07.)
const PAGE_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
setActiveNamespaceRoot(PAGE_HOST);

const Root = () => (
  <Theme>
    <SeedSessionProvider transportOrigin="http://localhost/apps/netget" sessionBackend="cleaker">
      <Namespace namespaceSource="address" cleakerEndpoint="http://localhost" netgetMonadOrigin="http://localhost/apps/netget" />
    </SeedSessionProvider>
  </Theme>
);

const meta = {
  title: 'Getting Started/Namespace',
  component: Root,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Root>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => <Root />,
};
