// One local runtime, two links. <Me> above, TWO <Cleaker> under it, each to its own namespace, each against its own
// disposable monad. The sign-in forms are the real ones; the point is that using one link must not touch the other.
//
// Needs two disposable monads, each in its own process:
//   DM_ROOT=a-test.local DM_PORT=18331 node disposable-monad.mjs
//   DM_ROOT=b-test.local DM_PORT=18332 node disposable-monad.mjs
//
// Each shell sits in a transformed box, which is what makes its fixed-position bars belong to the box and not to the
// window: two full shells fit side by side.
import * as React from "react";
import type { Meta } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import Theme from "@/gui/Theme/Theme";
import { Box } from "@/gui/Atoms";
import { Me } from "@/react/Me";
import Cleaker from "./Cleaker";
import { ConnectionSeamsContext } from "./useQRConnect";
import { disposableDoorSeams } from "./disposableDoor";

const meta: Meta = { title: "All.This/Cleaker", parameters: { layout: "fullscreen" } };
export default meta;

const LINK_A = { origin: "http://127.0.0.1:18331", root: "a-test.local" };
const LINK_B = { origin: "http://127.0.0.1:18332", root: "b-test.local" };

function Link({ testId, link }: { testId: string; link: { origin: string; root: string } }) {
  return (
    <Box
      data-testid={testId}
      sx={{ position: "relative", transform: "translateZ(0)", height: 620, overflow: "hidden", border: "1px solid", borderColor: "divider", borderRadius: 1 }}
    >
      <ConnectionSeamsContext.Provider value={disposableDoorSeams(link.origin)}>
        <Cleaker namespace={link.root} transport={link.origin} />
      </ConnectionSeamsContext.Provider>
    </Box>
  );
}

export const TwoLinks = () => (
  <Theme>
    <Me>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, p: 1.5 }}>
        <Link testId="link-a" link={LINK_A} />
        <Link testId="link-b" link={LINK_B} />
      </Box>
    </Me>
  </Theme>
);

const text = (scope: HTMLElement) => (scope.innerText || "").replace(/\s+/g, " ");
// What a signed-in link shows of who is in: the first ten hex digits of the identity hash.
const identityOf = (scope: HTMLElement) => /\b[0-9a-f]{10}\b/.exec(text(scope))?.[0] ?? "";

// Register the actor in ONE link through its real form: claim, back the 12 words up, continue until it is signed in.
async function register(scope: HTMLElement, username: string, password: string) {
  const q = within(scope);
  const user = userEvent.setup();
  await user.click(await q.findByRole("button", { name: "New here? Register" }, { timeout: 20000 }));
  fireEvent.change(await q.findByLabelText("Username"), { target: { value: username } });
  fireEvent.change(q.getByLabelText("Secret"), { target: { value: password } });
  fireEvent.change(q.getByLabelText("Confirm Secret"), { target: { value: password } });
  const claim = await waitFor(() => {
    const button = q.getByRole("button", { name: "Claim Username" });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(claim);
  await waitFor(() => expect(q.getByText("Back Up Your Identity")).toBeInTheDocument(), { timeout: 15000 });
  await user.click(q.getByText("I've written down my 12 words in a safe place"));
  await user.click(q.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(q.getByRole("button", { name: /Sign out/i })).toBeInTheDocument(), { timeout: 15000 });
}

TwoLinks.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const a = (await waitFor(() => canvas.getByTestId("link-a"))) as HTMLElement;
  const b = (await waitFor(() => canvas.getByTestId("link-b"))) as HTMLElement;
  const qa = within(a);
  const qb = within(b);
  const tag = Math.random().toString(36).slice(2, 8);
  const username = `actor-${tag}`;
  const password = `pw-${tag}-correct-horse`;
  const open = (scope: ReturnType<typeof within>) => scope.queryByRole("button", { name: /Sign out/i });

  // the same actor enters A, then B
  await register(a, username, password);
  const inA = identityOf(a);
  expect(inA).not.toBe("");
  await register(b, username, password);
  const inB = identityOf(b);

  // 1+2. both are open at once
  expect(open(qa)).not.toBeNull();
  expect(open(qb)).not.toBeNull();
  // KNOWN GAP, recorded and not asserted: the same username and password, registered in two links, are TWO identities.
  // Register generates a fresh 12-word root each time, so the key is not the one in A. (The session layer can claim
  // with an existing root, `identityRootHex`; no form offers it.) See tests/continuity.live.test.ts for the session layer.
  (globalThis as any).__twoLinksIdentities = { a: inA, b: inB, sameActor: inA === inB };

  // 3. leaving A leaves B open, with the same identity
  const user = userEvent.setup();
  await user.click(qa.getByRole("button", { name: /Sign out/i }));
  await waitFor(() => expect(qa.getByRole("button", { name: "New here? Register" })).toBeInTheDocument(), { timeout: 15000 });
  expect(open(qb)).not.toBeNull();
  expect(identityOf(b)).toBe(inB);

  // coming back to A through its own sign-in form: it must be A's namespace that is opened, with the identity it had
  fireEvent.change(await qa.findByLabelText("Username"), { target: { value: username } });
  fireEvent.change(qa.getByLabelText("Secret"), { target: { value: password } });
  await user.click(qa.getByRole("button", { name: ".me" }));
  await waitFor(() => expect(open(qa)).not.toBeNull(), { timeout: 20000 }).catch(() => {
    throw new Error(`A did not open again (global active root: ${String((globalThis as any).__thisGui_activeNamespaceRoot__)}). It says: ${text(a).slice(0, 500)}`);
  });
  expect(identityOf(a)).toBe(inA);
  expect(open(qb)).not.toBeNull();
  expect(identityOf(b)).toBe(inB);
};
