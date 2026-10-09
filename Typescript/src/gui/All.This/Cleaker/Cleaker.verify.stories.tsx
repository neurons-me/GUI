// Verification artifact for the new, public Cleaker
// (src/gui/All.This/Cleaker/Cleaker.tsx) -- the one-prop identity entry
// point: <Cleaker me={me} />, internally composing SeedSessionProvider +
// Namespace.tsx (the real, production identity shell), no second context,
// no children-composition API (that direction was tried and abandoned --
// see Cleaker.tsx's own header comment). KEPT in the diff on purpose, same
// reasoning as every other verification artifact in this package: a
// reproducible check, not a one-off reported then discarded.
//
// Four things this file actually proves, live, against a genuinely
// DISPOSABLE monad (never local.cleaker/local.netget):
//
// 1. DEFAULT DESTINATION (DefaultsToCleakerMeWhenOmitted): `<Cleaker />`
//    with ZERO props resolves to the real default ('cleaker.me'), read off
//    the actual rendered perimeter label, not just "didn't crash".
// 2. DESTINATION DERIVED FROM `me` (DerivesDestinationFromMeNamespace): a
//    `.me` kernel constructed WITH a namespace option (`new ME(who, secret,
//    { namespace: root })`, the exact shape `createCleakerSession.ts`
//    already uses) writes `profile.rootNamespace` at construction time
//    (confirmed directly in `me/Typescript/src/me.ts` before building
//    Cleaker.tsx around this) -- `<Cleaker me={that} />` must read it back
//    out and use it as the destination, not the literal default.
// 3. THE WHOLE IDENTITY JOURNEY (IdentityJourney): register, back up the 12 words, sign out, recover with the same
//    words, set a new secret, sign in again with it -- all the SAME identity -- entered through `<Cleaker
//    cleakerEndpoint=... netgetMonadOrigin=... transportOrigin=... />`
//    (the explicit-override shape netget's own App.jsx migration uses,
//    since it has no live `.me` kernel to pass as `me`) reaches a real
//    authenticated session against the disposable monad -- proving the
//    SeedSessionProvider+Namespace wiring Cleaker assembles internally is
//    real and functional, not just that something renders.
// 4. NO SILENT FALLBACK ON A MALFORMED `me`-DERIVED NAMESPACE
//    (MalformedMeNamespaceErrors, 2026-10-02 regression check): a `me`
//    whose own `profile.rootNamespace` is a non-empty but malformed string
//    must throw a real error, not silently resolve to the default
//    ('cleaker.me') as if nothing were wrong -- a bug that was previously
//    fixed for an explicit, malformed `namespace` PROP (now retired along
//    with the old Cleaker.tsx), then re-introduced when the destination
//    source moved to `me`'s own namespace: the first version of this file
//    wrapped both the "no namespace given" and "a namespace was given but
//    is invalid" cases in the same try/catch, silently collapsing both into
//    the default. Confirmed via a real error boundary (this is a
//    render-phase throw), not by reading the parser function in isolation.
//
// Run it with (from Typescript/, after starting a disposable monad):
//   SEED=<random 32-byte hex> ME_STATE_DIR=<scratch dir> PORT=18322 \
//   MONAD_NETGET_DISABLED=1 MONAD_SELF_IDENTITY=disposable-test.local \
//   npx tsx server.ts   (from modules/monad/Typescript)
//   npx vitest run --project=storybook \
//     src/gui/All.This/Cleaker/Cleaker.verify.stories.tsx
// `MONAD_SELF_IDENTITY` MUST equal DISPOSABLE_ROOT_LABEL below, or the
// register flow's claim fails with CLAIM_PERSIST_FAILED -- see
// the root-cause trace in this repo's history (the former QRConnect.verify story, merged into this file). Claim persistence itself already respects
// ME_STATE_DIR automatically (modules/monad/Typescript/src/claim/
// manager.ts's getClaimStorePaths()).
import * as React from "react";
import type { Meta } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import ME from "this.me";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "@/gui/All.This/Cleaker/Cleaker";
import { ConnectionSeamsContext } from "./useQRConnect";
import { disposableDoorSeams } from "./disposableDoor";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";
import { writeMeValue } from "@/runtime/run-me";

const DISPOSABLE_ORIGIN = "http://127.0.0.1:18322";
const DISPOSABLE_ROOT_LABEL = "disposable-test.local";

const meta: Meta = {
  title: "Verify",
  parameters: { layout: "fullscreen" },
};

export default meta;

setActiveNamespaceRoot(DISPOSABLE_ROOT_LABEL);

// Check 1: zero props -> default destination.
export const DefaultsToCleakerMeWhenOmitted = () => (
  <Theme>
    <Cleaker />
  </Theme>
);

DefaultsToCleakerMeWhenOmitted.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvas.getByText('cleaker.me')).toBeInTheDocument());
};

// Check 2: `me` constructed WITH a namespace -> destination derives from
// its own `profile.rootNamespace`, not the default.
export const DerivesDestinationFromMeNamespace = () => {
  const meRef = React.useRef<unknown>(null);
  if (!meRef.current) {
    meRef.current = new (ME as any)('verify-user', 'verify-throwaway-secret', {
      namespace: DISPOSABLE_ROOT_LABEL,
    });
  }
  return (
    <Theme>
      <Cleaker me={meRef.current as any} />
    </Theme>
  );
};

DerivesDestinationFromMeNamespace.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvas.getByText(DISPOSABLE_ROOT_LABEL)).toBeInTheDocument());
};

// Check 4 (regression, 2026-10-02): a `me` whose own `profile.rootNamespace`
// is malformed must error for real, not fall back to the default. Rendered
// inside a local error boundary (this is a render-phase throw from
// `parseCleakerNamespaceExpression`, surfaced by Cleaker's own `useMemo`).
class CaptureBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <div data-testid="cleaker-error-boundary">{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export const MalformedMeNamespaceErrors = () => {
  const meRef = React.useRef<unknown>(null);
  if (!meRef.current) {
    const kernel = new (ME as any)();
    // Written directly, bypassing the kernel's own normalizing
    // constructor path -- simulates a `me` whose `profile.rootNamespace`
    // somehow ended up malformed, which is exactly the case the fix under
    // test (Cleaker.tsx's `namespaceConfig` useMemo) must not silently
    // swallow into the default.
    writeMeValue(kernel, 'profile.rootNamespace', 'bad[unclosed', { allowBarePath: true });
    meRef.current = kernel;
  }
  return (
    <Theme>
      <CaptureBoundary>
        <Cleaker me={meRef.current as any} />
      </CaptureBoundary>
    </Theme>
  );
};

MalformedMeNamespaceErrors.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const boundary = await waitFor(() => canvas.getByTestId('cleaker-error-boundary'));
  // The real parser error, not a generic/opaque failure, and NOT the
  // default destination rendering as if nothing were wrong.
  expect(boundary.textContent || '').toMatch(/unclosed context bracket/i);
};

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
// authenticated -> unauthenticated falling edge -- see QRConnect's
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
  // recoveryComplete guards exist for (see QRConnect's own doc
  // comments): `authenticated` flips true the INSTANT claim()/open()
  // succeeds, before Claim/RecoverAccount's own post-claim step has
  // run. If that guard ever regresses, the authenticated branch (Sign out
  // button) takes over immediately and the backup/recovery screen never
  // renders, or is torn down the instant it would have. Asserting its
  // absence right when the backup/recovery screen's own heading first
  // appears is the direct check for that -- not just reaching the
  // end-state later.
  expect(canvas.queryByRole('button', { name: /Sign out/i }), `${context}: must not already show the authenticated view`).toBeNull();
}

// Full-journey live verification against the extracted QRConnect,
// mounted the same way production does (Namespace -> GUI -> DOCUMENT_PAGES
// .Landing -> QRConnect), on a disposable monad: register a REAL
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
// The whole identity journey, entered through the PUBLIC component (this is the composition a consumer receives):
// <Cleaker> -> SeedSessionProvider -> Namespace -> Landing (QRConnect) -> a real disposable monad. Same script the
// internal mount used to run (the old Verify/QRConnect), now through <Cleaker> itself: there is ONE identity flow.
export const IdentityJourney = () => (
  <ConnectionSeamsContext.Provider value={disposableDoorSeams(DISPOSABLE_ORIGIN)}>
    <Theme>
      <Cleaker
        cleakerEndpoint={`http://${DISPOSABLE_ROOT_LABEL}`}
        netgetMonadOrigin={DISPOSABLE_ORIGIN}
        transportOrigin={DISPOSABLE_ORIGIN}
      />
    </Theme>
  </ConnectionSeamsContext.Provider>
);

IdentityJourney.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
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
