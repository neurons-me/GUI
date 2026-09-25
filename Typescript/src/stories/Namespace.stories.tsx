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
setActiveNamespaceRoot('local.cleaker');

const Root = () => (
  <Theme>
    <SeedSessionProvider transportOrigin="http://local.cleaker/apps/netget" sessionBackend="cleaker">
      <Namespace cleakerEndpoint="http://local.cleaker" netgetMonadOrigin="http://local.netget/apps/netget" />
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
