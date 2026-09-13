import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Box from "@/gui/Atoms/Box/Box";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import RegisterMe from "@/react/session/RegisterMe";
import { setActiveNamespaceRoot } from "./signedRequest";

// Same wiring as Cleaker.stories.tsx's Default (CleakerLanding) — real
// signed-proof claim path against local.cleaker's actual running monad, not
// mocked. See that file's comments for why sessionBackend="cleaker" +
// setActiveNamespaceRoot() are both required for this to submit for real
// instead of hitting "No credential resolver was provided".
setActiveNamespaceRoot('local.cleaker');

const meta: Meta<typeof RegisterMe> = {
  title: "All.This/Cleaker/Register",
  component: RegisterMe,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof RegisterMe>;

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

export const Default: Story = {
  render: () => (
    <Theme>
      <SeedSessionProvider transportOrigin="http://local.cleaker/apps/netget" sessionBackend="cleaker">
        <Centered>
          <RegisterMe namespace="local.cleaker" onSwitchToSignIn={() => alert('Would switch to the Sign In form.')} />
        </Centered>
      </SeedSessionProvider>
    </Theme>
  ),
};

export const NoSwitchLink: Story = {
  render: () => (
    <Theme>
      <SeedSessionProvider transportOrigin="http://local.cleaker/apps/netget" sessionBackend="cleaker">
        <Centered>
          <RegisterMe namespace="local.cleaker" />
        </Centered>
      </SeedSessionProvider>
    </Theme>
  ),
};
