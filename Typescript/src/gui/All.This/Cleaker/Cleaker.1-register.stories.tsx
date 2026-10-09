import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Box from "@/gui/Atoms/Box/Box";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import Claim from "./Claim/Claim";
import { setActiveNamespaceRoot } from "./signedRequest";
import { DISPOSABLE_ORIGIN, DISPOSABLE_ROOT_LABEL } from "./disposable";

// The registration step of the way in: the real signed-proof claim path against the DISPOSABLE monad (see
// ./disposable.ts), never a real gateway. sessionBackend="cleaker" and setActiveNamespaceRoot() are both required for
// this to submit for real instead of failing with "No credential resolver was provided".
setActiveNamespaceRoot(DISPOSABLE_ROOT_LABEL);

const meta: Meta<typeof Claim> = {
  title: "All.This/Cleaker",
  component: Claim,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Claim>;

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      {children}
    </Box>
  );
}

export const Register: Story = {
  render: () => (
    <Theme>
      <SeedSessionProvider transportOrigin={DISPOSABLE_ORIGIN} sessionBackend="cleaker">
        <Centered>
          <Claim namespace={DISPOSABLE_ROOT_LABEL} onSwitchToSignIn={() => alert('Would switch to the Sign In form.')} />
        </Centered>
      </SeedSessionProvider>
    </Theme>
  ),
};

export const RegisterWithoutSwitchLink: Story = {
  render: () => (
    <Theme>
      <SeedSessionProvider transportOrigin={DISPOSABLE_ORIGIN} sessionBackend="cleaker">
        <Centered>
          <Claim namespace={DISPOSABLE_ROOT_LABEL} />
        </Centered>
      </SeedSessionProvider>
    </Theme>
  ),
};
