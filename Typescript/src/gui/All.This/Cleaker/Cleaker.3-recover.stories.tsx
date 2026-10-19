import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Box from "@/gui/Atoms/Box/Box";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import RecoverAccount from "@/react/session/RecoverAccount";
import { setActiveNamespaceRoot } from "./signedRequest";
import { DISPOSABLE_ORIGIN, DISPOSABLE_ROOT_LABEL } from "./disposable";

// The recovery step of the way in: the 12 words, then a new secret. Against the DISPOSABLE monad (see ./disposable.ts),
// never a real gateway; to recover an identity there, register one first (the Register story) and keep its words.
setActiveNamespaceRoot(DISPOSABLE_ROOT_LABEL);

const meta: Meta<typeof RecoverAccount> = {
  title: "All.This/Cleaker",
  component: RecoverAccount,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof RecoverAccount>;

export const Recover: Story = {
  render: () => (
    <Theme>
      <SeedSessionProvider transportOrigin={DISPOSABLE_ORIGIN} sessionBackend="cleaker">
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
          <RecoverAccount namespace={DISPOSABLE_ROOT_LABEL} onSwitchToSignIn={() => alert("Would switch to the Sign In form.")} />
        </Box>
      </SeedSessionProvider>
    </Theme>
  ),
};
