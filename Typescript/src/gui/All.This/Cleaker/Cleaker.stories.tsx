// Cleaker.stories.tsx — the DISCOVERABLE showcase for the public `<Cleaker>`
// entry point itself, living where someone browsing "All.This/Cleaker"
// would actually look for it. NOT the same file as
// Cleaker.verify.stories.tsx ("Verify/Cleaker") -- that one is a
// reproducible regression-test artifact (exact checks, real disposable
// monad, kept for CI-style re-verification), not a showcase. This file
// exists specifically because, without it, "All.This/Cleaker" in Storybook
// held only Cleaker's own internal sub-pages (Keychain/Blockchain/Users/
// NamespaceInfo/Passphrase/Claim) and nothing demonstrating `<Cleaker>`
// itself -- confusing to browse, flagged live (2026-10-02): the folder
// named after the public component didn't show the public component.
//
// `CleakerIdentityCard` (the identity-flow UI `<Cleaker>` composes
// internally via `Namespace.tsx`) has its own, separate verification file
// ("Verify/CleakerIdentityCard") but no showcase of its own here on
// purpose -- it is an internal implementation piece, not a second public
// entry point. If you're looking for "how do I use the identity surface",
// the answer is always `<Cleaker>`, never `CleakerIdentityCard` directly.
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "./Cleaker";

const meta: Meta<typeof Cleaker> = {
  title: "All.This/Cleaker",
  component: Cleaker,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Cleaker>;

// The one-prop, zero-setup shape -- the whole point of this consolidation.
// No `me` given: resolves to the literal default destination ('cleaker.me').
export const Default: Story = {
  render: () => (
    <Theme>
      <Cleaker />
    </Theme>
  ),
};

// The explicit-override shape a caller with its own already-resolved
// destination uses instead of `me` (e.g. netget's App.jsx -- see
// Cleaker.tsx's own `cleakerEndpoint` prop doc comment for when this is
// the right shape instead of passing a `.me` kernel).
export const WithExplicitDestination: Story = {
  render: () => (
    <Theme>
      <Cleaker cleakerEndpoint="http://local.cleaker" netgetMonadOrigin="http://local.netget/apps/netget" />
    </Theme>
  ),
};
