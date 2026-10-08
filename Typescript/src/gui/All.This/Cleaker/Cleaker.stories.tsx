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
// `QRConnect` (the identity-flow UI `<Cleaker>` composes
// internally via `Namespace.tsx`) has its own, separate verification file
// ("Verify/QRConnect") but no showcase of its own here on
// purpose -- it is an internal implementation piece, not a second public
// entry point. If you're looking for "how do I use the identity surface",
// the answer is always `<Cleaker>`, never `QRConnect` directly.
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "./Cleaker";
import { ConnectionSeamsContext, type ConnectionSeams } from "./useQRConnect";
import type { useBeatle } from "@/gui/All.This/NRP/Beatle/useBeatle";

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

// ── The whole way in, with no network ──────────────────────────────────────────────────────────────────────────
// A grey QR is the starting point when nothing answers. Clicking it runs its expression; if it cannot be reached the
// card says so and offers three ways forward:
//
//   grey QR --click--> loader --> "Unable to connect"
//     Connect to cleaker.me      --> loader --> connected --> "Hello, I am…" (sign in / register / recover)
//     Try another namespace      --> type one that does not exist --> the cross, and the same card again
//     Diagnosis                  --> the layers, where you are, the start command and the trace
//
// Only the network is replaced (ConnectionSeams): this page's own door answers "nothing" to every reading, and the
// channel answers for cleaker.me and for no one else. Everything else is the real <Cleaker>. Open the console to read
// each step (`[qr] …`), or `globalThis['GUI-QR-TRACE'].entries()`.

type Channel = ReturnType<typeof useBeatle>;

/** A stand-in for Beatle's channel hook: `answers(host)` says what each host does; "hang" never finishes. */
function mockChannel(answers: (host: string) => "connect" | "error" | "hang", delayMs = 900): typeof useBeatle {
  return ((endpoint: string) => {
    const [channel, setChannel] = React.useState<Channel["channel"]>({ expression: null, resolved: [], state: "idle" });
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const open = React.useCallback((raw: string) => {
      if (timer.current) clearTimeout(timer.current);
      const host = endpoint.replace(/^wss?:\/\//, "").replace(/\/.*$/, "");
      const outcome = answers(host);
      setChannel({ expression: null, resolved: [], state: "connecting" });
      if (outcome === "hang") return;
      timer.current = setTimeout(() => {
        setChannel(outcome === "connect"
          ? ({ expression: { raw, ast: { kind: "namespace", value: raw } }, resolved: [`https://${host}/${raw}`], state: "connected" } as unknown as Channel["channel"])
          : { expression: null, resolved: [], state: "error", error: "WebSocket error" });
      }, delayMs);
    }, [endpoint]);
    React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    return { channel, open, send: () => undefined, disconnect: () => undefined };
  }) as unknown as typeof useBeatle;
}

// Every reading of this page's own door gets a page back (what a server with nothing behind it does): backend off, monad off.
const nothingBehind: typeof fetch = async () => new Response("<!doctype html><title>no</title>", { status: 200, headers: { "content-type": "text/html" } });

const NOTHING_ANSWERS: ConnectionSeams = {
  fetchImpl: nothingBehind,
  useChannel: mockChannel((host) => (host === "cleaker.me" ? "connect" : "error")),
};
const NEVER_ANSWERS: ConnectionSeams = {
  fetchImpl: nothingBehind,
  useChannel: mockChannel(() => "hang"),
};

/** Nothing answers behind this page. Click the grey QR and walk every option. */
export const NothingAnswers: Story = {
  render: () => (
    <ConnectionSeamsContext.Provider value={NOTHING_ANSWERS}>
      <Theme>
        <Cleaker cleakerEndpoint={typeof window !== "undefined" ? window.location.origin : "http://localhost"} />
      </Theme>
    </ConnectionSeamsContext.Provider>
  ),
};

/** Another host that never finishes answering: the loader, for as long as it takes. */
export const Trying: Story = {
  render: () => (
    <ConnectionSeamsContext.Provider value={NEVER_ANSWERS}>
      <Theme>
        <Cleaker cleakerEndpoint={typeof window !== "undefined" ? window.location.origin : "http://localhost"} />
      </Theme>
    </ConnectionSeamsContext.Provider>
  ),
};
