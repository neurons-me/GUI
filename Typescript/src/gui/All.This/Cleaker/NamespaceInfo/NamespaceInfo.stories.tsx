import type { Meta, StoryObj } from "@storybook/react";
import NamespaceInfo from "./NamespaceInfo";

const meta: Meta<typeof NamespaceInfo> = {
  title: "All.This/Cleaker/NamespaceInfo",
  component: NamespaceInfo,
};

export default meta;
type Story = StoryObj<typeof NamespaceInfo>;

export const Default: Story = {
  args: {
    endpoint: "http://localhost:8161",
    qrValue: "http://local.cleaker",
    monadLabel: "netget@local.cleaker:8161",
    namespaceLabel: "local.cleaker",
    rootNamespaceHash: "0x6eec7ce78931b3df05679ae1566a1441b257005675c5d535cf27e8a0ae11e068",
    meLimit: 120,
    surface: {
      type: "desktop",
      status: { availability: "online", syncState: "current", latencyMs: 12, lastSeen: Date.now() },
      policy: { gui: { blockchain: { limit: 80 } } },
      budget: { gui: { blockchain: { rows: 50 } } },
      pressure: { cpu: 0.18 },
    },
  },
};

export const Empty: Story = {
  args: {
    endpoint: "",
    qrValue: "",
    monadLabel: "",
    namespaceLabel: "",
    rootNamespaceHash: "",
    meLimit: 120,
    surface: null,
  },
};
