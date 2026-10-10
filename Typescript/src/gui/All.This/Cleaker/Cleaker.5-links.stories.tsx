// One local runtime, two links. <Me> above, TWO <Cleaker> under it, each to its own namespace, each against its own
// disposable monad. The forms are the real ones; the point is that using one link must not touch the other, and that
// what B does with the identity A holds is something the person asks for, never something that happens to them.
//
//   TwoLinks            the same actor in both: A registers, B uses the identity A holds ("Use my identity here").
//   IndependentLinks    each link with its own credentials: Register in both, two identities, neither replaces the other.
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
      // overflow: clip (not hidden): a hidden box can still be scrolled by focus, which shifted one shell against the other
      sx={{ position: "relative", transform: "translateZ(0)", height: 620, overflow: "clip", border: "1px solid", borderColor: "divider", borderRadius: 1 }}
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

export const IndependentLinks = TwoLinks.bind({});

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

// Use, in this link, the identity another open link of the same context holds: its own form, nothing is created.
async function useExisting(scope: HTMLElement, password: string) {
  const q = within(scope);
  const user = userEvent.setup();
  await user.click(await q.findByRole("button", { name: "Use my identity from another link" }, { timeout: 20000 }));
  await waitFor(() => expect(q.getByRole("button", { name: "Use this identity" })).toBeEnabled(), { timeout: 10000 });
  fireEvent.change(q.getByLabelText(/Secret for this browser/), { target: { value: password } });
  await user.click(q.getByRole("button", { name: "Use this identity" }));
  await waitFor(() => expect(q.getByRole("button", { name: /Sign out/i })).toBeInTheDocument(), { timeout: 20000 });
}

const open = (scope: ReturnType<typeof within>) => scope.queryByRole("button", { name: /Sign out/i });

async function reopenByPassword(scope: HTMLElement, username: string, password: string) {
  const q = within(scope);
  const user = userEvent.setup();
  fireEvent.change(await q.findByLabelText("Username"), { target: { value: username } });
  fireEvent.change(q.getByLabelText("Secret"), { target: { value: password } });
  await user.click(q.getByRole("button", { name: ".me" }));
  await waitFor(() => expect(open(q)).not.toBeNull(), { timeout: 20000 }).catch(() => {
    throw new Error(`The link did not open again. It says: ${text(scope).slice(0, 500)}`);
  });
}

const linksOf = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const a = (await waitFor(() => canvas.getByTestId("link-a"))) as HTMLElement;
  const b = (await waitFor(() => canvas.getByTestId("link-b"))) as HTMLElement;
  return { a, b, qa: within(a), qb: within(b) };
};

TwoLinks.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const { a, b, qa, qb } = await linksOf(canvasElement);
  const tag = Math.random().toString(36).slice(2, 8);
  const username = `actor-${tag}`;
  const password = `pw-${tag}-correct-horse`;
  const user = userEvent.setup();

  // A registers; B has nothing open yet, so it offers no way to use an identity
  await register(a, username, password);
  const inA = identityOf(a);
  expect(inA).not.toBe("");
  expect(qb.queryByRole("button", { name: "Use my identity from another link" })).not.toBeNull();
  // A itself offers it for nothing: the only identity held is already linked here
  await user.click(qa.getByRole("button", { name: /Sign out/i }));
  await waitFor(() => expect(qa.getByRole("button", { name: "New here? Register" })).toBeInTheDocument(), { timeout: 15000 });
  // with A closed there is nothing held, so B has nothing to use
  await waitFor(() => expect(qb.queryByRole("button", { name: "Use my identity from another link" })).toBeNull(), { timeout: 5000 });

  // open A again by password, then B asks for A's identity explicitly
  await reopenByPassword(a, username, password);
  expect(identityOf(a)).toBe(inA);
  await useExisting(b, password);

  // the same actor in both, each with its own kernel and its own link
  expect(identityOf(b)).toBe(inA);
  expect(open(qa)).not.toBeNull();
  expect(open(qb)).not.toBeNull();

  // leaving A leaves B open with the same identity
  await user.click(qa.getByRole("button", { name: /Sign out/i }));
  await waitFor(() => expect(qa.getByRole("button", { name: "New here? Register" })).toBeInTheDocument(), { timeout: 15000 });
  expect(open(qb)).not.toBeNull();
  expect(identityOf(b)).toBe(inA);

  // B signs out and comes back through its own form, by name and secret, as the same identity
  await user.click(qb.getByRole("button", { name: /Sign out/i }));
  await waitFor(() => expect(qb.getByRole("button", { name: "New here? Register" })).toBeInTheDocument(), { timeout: 15000 });
  await reopenByPassword(b, username, password);
  expect(identityOf(b)).toBe(inA);
};

IndependentLinks.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const { a, b, qa, qb } = await linksOf(canvasElement);
  const tag = Math.random().toString(36).slice(2, 8);
  const username = `actor-${tag}`;
  const password = `pw-${tag}-correct-horse`;
  const user = userEvent.setup();

  // the same username and password registered in two links are two identities: Register creates, it does not link
  await register(a, username, password);
  const inA = identityOf(a);
  await register(b, username, password);
  const inB = identityOf(b);
  expect(inA).not.toBe("");
  expect(inB).not.toBe("");
  expect(inA).not.toBe(inB);
  expect(open(qa)).not.toBeNull();
  expect(open(qb)).not.toBeNull();

  // leaving A leaves B open, with its identity
  await user.click(qa.getByRole("button", { name: /Sign out/i }));
  await waitFor(() => expect(qa.getByRole("button", { name: "New here? Register" })).toBeInTheDocument(), { timeout: 15000 });
  expect(open(qb)).not.toBeNull();
  expect(identityOf(b)).toBe(inB);

  // coming back to A by its own sign-in form opens A's namespace, with the identity it had
  await reopenByPassword(a, username, password);
  expect(identityOf(a)).toBe(inA);
  expect(open(qb)).not.toBeNull();
  expect(identityOf(b)).toBe(inB);
};
