// Cleaker.stories.tsx — the product's PRESENTATION: the public `<Cleaker>` entry point, and nothing else.
//
//   Default  the real thing, with no setup (reads the network it finds: here, Storybook's own origin).
//   Flow     the whole way in with no network: click the grey QR and walk every option, to "Hello, I am…".
//
// Everything else lives elsewhere on purpose, so this page is the one place to understand the product:
//   * the pieces and their states (Claim, Passphrase, Keychain, QR, Users, Blockchain, the loader…) — "Pieces/…"
//   * the checks that make it true (the destination contract and the whole identity journey, through <Cleaker>
//     itself, on a disposable monad) — "Verify/Cleaker"
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "./Cleaker";
import { ConnectionSeamsContext } from "./useQRConnect";
import { NOTHING_ANSWERS } from "./storyMocks";

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
// Only the network is replaced (ConnectionSeams, see storyMocks.ts). Open the console to read each step
// (`[qr] …`), or `globalThis['GUI-QR-TRACE'].entries()`.
export const Flow: Story = {
  render: () => (
    <ConnectionSeamsContext.Provider value={NOTHING_ANSWERS}>
      <Theme>
        <Cleaker cleakerEndpoint={typeof window !== "undefined" ? window.location.origin : "http://localhost"} />
      </Theme>
    </ConnectionSeamsContext.Provider>
  ),
};
