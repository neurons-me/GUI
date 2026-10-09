// A state of <Cleaker> that is too brief to chase during a click, kept apart from the presentation (Cleaker.stories.tsx)
// so it can be inspected for as long as needed.
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "./Cleaker";
import { ConnectionSeamsContext } from "./useQRConnect";
import { NEVER_ANSWERS } from "./storyMocks";

const meta: Meta<typeof Cleaker> = {
  title: "Pieces/Cleaker",
  component: Cleaker,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Cleaker>;

/** Another host that never finishes answering: the loader instead of a dot, for as long as it takes. */
export const Trying: Story = {
  render: () => (
    <ConnectionSeamsContext.Provider value={NEVER_ANSWERS}>
      <Theme>
        <Cleaker cleakerEndpoint={typeof window !== "undefined" ? window.location.origin : "http://localhost"} />
      </Theme>
    </ConnectionSeamsContext.Provider>
  ),
};
