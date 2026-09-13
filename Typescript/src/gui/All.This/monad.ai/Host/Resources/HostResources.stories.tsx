import type { Meta, StoryObj } from "@storybook/react";
import HostResources from "./HostResources";

const meta: Meta<typeof HostResources> = {
  title: "All.This/monad.ai/Host/Resources",
  component: HostResources,
};

export default meta;
type Story = StoryObj<typeof HostResources>;

const now = Date.now();

export const Default: Story = {
  args: {
    endpoint: "http://local.cleaker:8164",
    namespaceUrl: "http://local.cleaker",
    namespaceHandle: "local.cleaker",
    rootHostNamespace: "suis-macbook-air.local",
    resolverHostName: "suis-macbook-air.local",
    initialSurface: {
      monadName: "netget",
      hostId: "suis-macbook-air.local",
      type: "desktop",
      trust: "owner",
      resources: ["public_ingress", "keychain", "filesystem", "gpu", "local_lan"],
      capacity: { cpuCores: 10, ramGb: 32, storageGb: 512, bandwidthMbps: 940 },
      status: { availability: "online", latencyMs: 8, syncState: "current", lastSeen: now },
      namespace: "http://local.cleaker",
      endpoint: "http://local.cleaker:8164",
      rootName: "local.cleaker",
      usage: { cpu: 0.22, requestRatePer10s: 14 },
      pressure: { cpu: 0.22 },
    },
    initialRequestEvents: [
      { id: 5, timestamp: now, method: "GET", url: "/blockchain?limit=10", status: 200, durationMs: 12, host: "local.cleaker", namespace: "local.cleaker", operation: "read", nrp: "me://local.cleaker:read/blockchain", lens: "raw", forwardedHost: null },
      { id: 4, timestamp: now - 2100, method: "GET", url: "/apps/netget", status: 200, durationMs: 9, host: "local.netget", namespace: "local.cleaker", operation: "read", nrp: "me://local.cleaker:read/_", lens: "raw", forwardedHost: "local.netget" },
      { id: 3, timestamp: now - 4300, method: "POST", url: "/apps/report", status: 200, durationMs: 4, host: "local.netget", namespace: "local.cleaker", operation: "write", nrp: "me://local.cleaker:write/apps", lens: "raw", forwardedHost: null },
      { id: 2, timestamp: now - 6600, method: "GET", url: "/__surface", status: 200, durationMs: 3, host: "local.cleaker", namespace: "local.cleaker", operation: "read", nrp: "me://local.cleaker:read/surface", lens: "raw", forwardedHost: null },
      { id: 1, timestamp: now - 9100, method: "GET", url: "/blockchain?limit=10", status: 200, durationMs: 15, host: "local.cleaker", namespace: "local.cleaker", operation: "read", nrp: "me://local.cleaker:read/blockchain", lens: "raw", forwardedHost: null },
    ],
  },
};

export const Empty: Story = {
  args: {
    endpoint: "",
  },
};
