// Cleaker.stories.tsx — the product's PRESENTATION: the public `<Cleaker>` entry point, and nothing else.
//
//   Default  the real thing, with no setup (reads the network it finds: here, Storybook's own origin).
//   Flow     the whole way in with no network: click the grey QR and walk every option, to "Hello, I am…".
//
// Everything else lives elsewhere on purpose, so this page is the one place to understand the product:
//   * the steps of the way in, in the order a person walks them, in this same group: Register, the 12 words
//     (Passphrase), Recover; then the checks that make it true (the destination contract and the whole identity journey,
//     through <Cleaker> itself, on a disposable monad). One file per step: Storybook keeps a component's stories in
//     the order of their files.
//   * the other pieces (Keychain, QR, Users, Blockchain…) — "Pieces/…"
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "./Cleaker";
import { ConnectionSeamsContext } from "./useQRConnect";
import { NOTHING_ANSWERS, NEVER_ANSWERS } from "./storyMocks";

const meta: Meta<typeof Cleaker> = {
  title: "All.This/Cleaker",
  component: Cleaker,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Cleaker>;

// The one-prop, zero-setup shape. No `me` given: resolves to the literal default destination ('cleaker.me').
export const Default: Story = {
  render: () => (
    <Theme>
      <Cleaker />
    </Theme>
  ),
};

// The whole way in, with no network. A grey QR is the starting point when nothing answers. Clicking it runs its
// expression; if it cannot be reached the card says so and offers three ways forward:
//
//   grey QR --click--> loader --> "Unable to connect"
//     Connect to cleaker.me      --> loader --> connected --> "Hello, I am…" (sign in)
//     Try another namespace      --> type one that does not exist --> the cross, and the same card again
//     Diagnosis                  --> the layers, where you are, the start command and the trace
//
// The control "otherHost" decides what the other host does: it answers (the path above), or it never finishes, which
// holds the loader for as long as you want to look at it. Only the network is replaced (ConnectionSeams, see
// storyMocks.ts). Open the console to read each step (`[qr] …`), or `globalThis['GUI-QR-TRACE'].entries()`.
type FlowArgs = { otherHost: "answers" | "never finishes" };

export const Flow: StoryObj<FlowArgs> = {
  args: { otherHost: "answers" },
  argTypes: { otherHost: { control: "inline-radio", options: ["answers", "never finishes"] } },
  render: ({ otherHost }) => (
    // keyed: changing the control starts the flow over, with the other channel
    <ConnectionSeamsContext.Provider key={otherHost} value={otherHost === "answers" ? NOTHING_ANSWERS : NEVER_ANSWERS}>
      <Theme>
        <Cleaker cleakerEndpoint={typeof window !== "undefined" ? window.location.origin : "http://localhost"} />
      </Theme>
    </ConnectionSeamsContext.Provider>
  ),
};
