// Verification artifact for the CleakerIdentityCard extraction
// (src/gui/All.This/Cleaker/CleakerIdentityCard.tsx, extracted from the
// inline `CleakerLandingHome` that used to live in
// src/react/session/Namespace.tsx). KEPT in the diff on purpose — a prior
// pass deleted this file after reporting results, which made the
// verification unreproducible; this file is the reproducible artifact.
//
// Mounts <Namespace> (the real production shell: GUI -> DOCUMENT_PAGES
// .Landing -> CleakerIdentityCard) the same way the real
// `RegisterWithRecoveryPhrase` story in Cleaker.stories.tsx does, but
// against a genuinely DISPOSABLE monad -- never local.cleaker/local.netget
// (those are real, persistent, already-running ambient infrastructure on
// this machine; the hard rule in this project is to never touch them, even
// for a "quick check"). Cleaker.stories.tsx's own reference test currently
// cannot run at all (its import of `@/react/session/CleakerLanding` has
// been dead since the 2026-09-25 rename to Namespace.tsx, commit
// `02937608` -- someone else is fixing that separately), so this file does
// not reuse it directly; it exercises the exact same component through the
// exact same shell, independently.
//
// Run it with (from Typescript/, after starting a disposable monad -- see
// this extraction's handoff report for the exact command):
//   npx vitest run --project=storybook \
//     src/gui/All.This/Cleaker/CleakerIdentityCard.verify.stories.tsx
import * as React from "react";
import type { Meta } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import Theme from "@/gui/Theme/Theme";
import { SeedSessionProvider } from "@/react/session/SeedSessionProvider";
import Namespace from "@/react/session/Namespace";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";

// Must match a disposable monad started locally, e.g.:
//   SEED=<random 32-byte hex> ME_STATE_DIR=<scratch dir> PORT=18322 \
//   MONAD_NETGET_DISABLED=1 npx tsx server.ts   (from modules/monad/Typescript)
// Never point this at local.cleaker/local.netget or any real gateway.
const DISPOSABLE_ORIGIN = "http://127.0.0.1:18322";
const DISPOSABLE_ROOT_LABEL = "disposable-test.local";

const meta: Meta = {
  title: "Verify/CleakerIdentityCard",
  parameters: { layout: "fullscreen" },
};

export default meta;

setActiveNamespaceRoot(DISPOSABLE_ROOT_LABEL);

export const Default = () => (
  <Theme>
    <SeedSessionProvider transportOrigin={DISPOSABLE_ORIGIN} sessionBackend="cleaker">
      <Namespace cleakerEndpoint={`http://${DISPOSABLE_ROOT_LABEL}`} netgetMonadOrigin={DISPOSABLE_ORIGIN} />
    </SeedSessionProvider>
  </Theme>
);

// Reads the 12 revealed words directly out of the Passphrase 'reveal' grid
// DOM (CSS blur doesn't hide textContent) -- scoped to the grid itself (the
// toggle button's sibling), not the whole canvas, so surrounding prose text
// can't be mistaken for phrase words. The words are kept only in this
// script's own in-memory variables -- never logged, never written anywhere
// persistent.
function readRevealedWords(canvasElement: HTMLElement): string[] {
  const toggle = canvasElement.querySelector('[data-gui-node-id="Passphrase.toggleReveal"]');
  if (!toggle || !toggle.parentElement) throw new Error('Passphrase reveal toggle not found');
  const grid = toggle.parentElement.firstElementChild;
  if (!grid) throw new Error('Passphrase reveal grid not found');
  return Array.from(grid.children).map((slot) => (slot.children[1]?.textContent || '').trim());
}

function fillRecoveryWords(canvasElement: HTMLElement, words: string[]) {
  words.forEach((word, i) => {
    const input = canvasElement.querySelector(`[data-gui-node-id="Passphrase.word.${i + 1}"] input`);
    if (!input) throw new Error(`Passphrase input slot ${i + 1} not found`);
    fireEvent.change(input, { target: { value: word } });
  });
}

// Once authenticated via the register/recover paths, `mode` stays
// 'register'/'recover' (it is only ever reset to 'signin' on the
// authenticated -> unauthenticated falling edge -- see CleakerIdentityCard's
// own wasAuthenticatedRef effect), which means its own QR bubble (and the
// full namespace that would otherwise be drawn around its perimeter) is
// suppressed the whole time -- confirmed live by inspecting the rendered
// DOM: this is real, pre-existing production behavior, not something this
// extraction changed. The authenticated view in that state renders only a
// short identityHash-derived `label` plus Sign out. That label is read here
// (both after register and after recover, and again after a fresh login) to
// confirm every one of those sessions is the SAME identity, not a new or
// different one silently created.
function readIdentityLabel(canvasElement: HTMLElement): string {
  const el = canvasElement.querySelector('[data-gui-node-id="GUI.content.landing"] .MuiTypography-caption');
  if (!el || !el.textContent) throw new Error('authenticated identity label not found');
  return el.textContent.trim();
}

function expectNotAuthenticatedYet(canvas: ReturnType<typeof within>, context: string) {
  // The actual regression this component's registrationComplete/
  // recoveryComplete guards exist for (see CleakerIdentityCard's own doc
  // comments): `authenticated` flips true the INSTANT claim()/open()
  // succeeds, before RegisterMe/RecoverAccount's own post-claim step has
  // run. If that guard ever regresses, the authenticated branch (Sign out
  // button) takes over immediately and the backup/recovery screen never
  // renders, or is torn down the instant it would have. Asserting its
  // absence right when the backup/recovery screen's own heading first
  // appears is the direct check for that -- not just reaching the
  // end-state later.
  expect(canvas.queryByRole('button', { name: /Sign out/i }), `${context}: must not already show the authenticated view`).toBeNull();
}

// Full-journey live verification against the extracted CleakerIdentityCard,
// mounted the same way production does (Namespace -> GUI -> DOCUMENT_PAGES
// .Landing -> CleakerIdentityCard), on a disposable monad: register a REAL
// throwaway namespace, confirm the backup step is actually reached (not
// skipped by the authenticated flip) and functional, reach the
// authenticated session, sign out; recover using the SAME captured phrase,
// confirm the recovery step's own follow-up ("Set a New Secret") is
// likewise actually reached (not skipped), reach the authenticated session
// again (same identity), sign out; then do a completely independent, FRESH
// login with the username + the new secret just set by recovery, through
// the ordinary sign-in form (not Recover), and confirm that reaches the
// same authenticated identity too -- proving the recovered credentials
// genuinely work for day-to-day sign-in, not just for reaching the recovery
// screen itself.
export const RegisterBackupThenRecoverThenLogin = () => (
  <Theme>
    <SeedSessionProvider transportOrigin={DISPOSABLE_ORIGIN} sessionBackend="cleaker">
      <Namespace cleakerEndpoint={`http://${DISPOSABLE_ROOT_LABEL}`} netgetMonadOrigin={DISPOSABLE_ORIGIN} />
    </SeedSessionProvider>
  </Theme>
);

RegisterBackupThenRecoverThenLogin.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const user = userEvent.setup();
  const username = `verify-${Date.now().toString(36)}`;
  const password = 'verify-throwaway-password';
  const fullNamespace = `${username}.${DISPOSABLE_ROOT_LABEL}`;

  // ---- Register ----
  await user.click(await canvas.findByRole('button', { name: 'New here? Register' }));

  // fireEvent.change, not userEvent.type: in this environment userEvent's
  // per-keystroke dispatch left the raw <input>.value updated but never
  // actually landed React's own onChange-driven state (confirmed live).
  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fireEvent.change(canvas.getByLabelText('Secret'), { target: { value: password } });
  fireEvent.change(canvas.getByLabelText('Confirm Secret'), { target: { value: password } });

  const submit = await waitFor(() => {
    const button = canvas.getByRole('button', { name: 'Claim Username' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(submit);

  // Regression check #1: the backup step must actually be reached, not
  // skipped straight to the authenticated view by the `authenticated` flip.
  await waitFor(() => expect(canvas.getByText('Back Up Your Identity')).toBeInTheDocument(), { timeout: 8000 });
  expectNotAuthenticatedYet(canvas, 'register: at Back Up Your Identity');
  await waitFor(() => expect(canvas.getByText(fullNamespace)).toBeInTheDocument(), { timeout: 8000 });

  // Capture the REAL generated phrase before confirming backup. In-memory
  // only -- never logged.
  const capturedWords = readRevealedWords(canvasElement);
  expect(capturedWords).toHaveLength(12);
  expect(capturedWords.every((w) => /^[a-z]+$/.test(w))).toBe(true);

  // Interacting with the backup screen's OWN controls (reading its words,
  // clicking ITS checkbox, clicking ITS Continue button) across these next
  // steps only succeeds if the screen stayed mounted and stable the whole
  // time -- a torn-down/remounted tree would fail these calls directly,
  // not just the end-state check below.
  await user.click(canvas.getByText("I've written down my 12 words in a safe place"));
  await user.click(canvas.getByRole('button', { name: 'Continue' }));

  await waitFor(() => expect(canvas.getByRole('button', { name: /Sign out/i })).toBeInTheDocument(), { timeout: 8000 });
  const identityLabelAfterRegister = readIdentityLabel(canvasElement);
  expect(identityLabelAfterRegister.length).toBeGreaterThan(0);

  await user.click(canvas.getByRole('button', { name: /Sign out/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );

  // ---- Recover, using the SAME captured phrase ----
  await user.click(canvas.getByRole('button', { name: 'Recover Account' }));
  await waitFor(() => expect(canvas.getByText('Recover Account')).toBeInTheDocument());

  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fillRecoveryWords(canvasElement, capturedWords);

  const recoverButton = await waitFor(() => {
    const button = canvas.getByRole('button', { name: 'Recover' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(recoverButton);

  // Regression check #2: same guard, recovery side -- the "Set a New
  // Secret" follow-up must actually be reached, not skipped/interrupted by
  // the `authenticated` flip that open() also triggers immediately.
  await waitFor(() => expect(canvas.getByText('Set a New Secret')).toBeInTheDocument(), { timeout: 8000 });
  expectNotAuthenticatedYet(canvas, 'recover: at Set a New Secret');
  // One real render-lag here (semanticNamespace reaches context slightly
  // after `step` flips) -- a genuine async condition, not a flake to paper
  // over, hence the retrying waitFor rather than a bare assertion.
  await waitFor(() => expect(canvas.getByText(fullNamespace)).toBeInTheDocument(), { timeout: 8000 });

  const newPassword = 'verify-recovered-password';
  fireEvent.change(canvas.getByLabelText('New Secret'), { target: { value: newPassword } });
  fireEvent.change(canvas.getByLabelText('Confirm New Secret'), { target: { value: newPassword } });

  const continueButton = await waitFor(() => {
    const button = canvas.getByRole('button', { name: 'Continue' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(continueButton);

  // Post-recovery: authenticated again, real signed-in view, and the SAME
  // identity as the one registered above (not a new or different one
  // silently created by recovery).
  await waitFor(() => expect(canvas.getByRole('button', { name: /Sign out/i })).toBeInTheDocument(), { timeout: 8000 });
  const identityLabelAfterRecover = readIdentityLabel(canvasElement);
  expect(identityLabelAfterRecover).toBe(identityLabelAfterRegister);

  await user.click(canvas.getByRole('button', { name: /Sign out/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );

  // ---- Fresh login, independent of Recover, using the credentials recovery just set ----
  // This is the actual point of the whole recovery flow: the LOCAL VAULT
  // recovery wrote (saveLocalIdentityVault, RecoverAccount.tsx) must unlock
  // with the new secret and let the ordinary sign-in form (loginWithCleaker,
  // SeedSessionProvider.tsx) reconstruct the SAME identity -- not just that
  // the recovery screen itself was reachable.
  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fireEvent.change(canvas.getByLabelText('Secret'), { target: { value: newPassword } });

  const loginSubmit = await waitFor(() => {
    const button = canvas.getByRole('button', { name: '.me' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(loginSubmit);

  await waitFor(() => expect(canvas.getByRole('button', { name: /Sign out/i })).toBeInTheDocument(), { timeout: 8000 });
  const identityLabelAfterFreshLogin = readIdentityLabel(canvasElement);
  expect(identityLabelAfterFreshLogin).toBe(identityLabelAfterRegister);

  await user.click(canvas.getByRole('button', { name: /Sign out/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );
};
