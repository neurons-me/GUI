// Verification artifact for the public Cleaker (src/gui/All.This/Cleaker/Cleaker.tsx): a LINK from the page's `.me` to one
// namespace, <Me><Cleaker namespace="..." /></Me>, composing SeedSessionProvider + Namespace.tsx (the real, production
// identity shell). KEPT in the diff on purpose, same reasoning as every other verification artifact in this package: a
// reproducible check, not a one-off reported then discarded.
//
// What this file proves, live, against a genuinely DISPOSABLE monad (never local.cleaker/local.netget):
//
// 1. THE WHOLE IDENTITY JOURNEY (IdentityJourney): register, back up the 12 words, sign out, recover with the same
//    words, set a new secret, sign in again with it -- all the SAME identity -- entered through
//    `<Me><Cleaker namespace=... transport=... /></Me>` (the shape netget's own App.jsx uses: the namespace is the host
//    the page was served from, the transport is its monad) reaches a real authenticated session against the disposable
//    monad.
// 2. A DECLARED HANDLE (PrefillsDeclaredUsername): `<Me username=...>` pre-fills the form and names ana.<root>; nothing is
//    signed in.
// 3. NO .ME ABOVE (NoMeAbove) / NO NAMESPACE GIVEN (NoNamespaceGiven): a plain message each, no guessed destination.
// 4. NO SILENT FALLBACK ON A MALFORMED NAMESPACE (MalformedNamespaceErrors, 2026-10-02 regression check): a non-empty but
//    malformed namespace must throw a real error, not silently resolve to a default ('cleaker.me') as if nothing were
//    wrong. Confirmed via a real error boundary (this is a render-phase throw), not by reading the parser in isolation.
// 5. THE SAME JOURNEY THROUGH A GATEWAY (IdentityJourneyThroughGateway, formerly RegisterThroughLocalCleakerGateway, 2026-10-05):
//    register, back up the 12 words, sign out, sign in again -- all the SAME identity -- with the transport going through a
//    real OpenResty's `/apps/netget` mesh-proxy prefix (netget's generator, unmodified) instead of a direct monad connection.
//    A gateway alias is not a monad origin: handing `cleakerEndpoint` to the session as its transport 405s on the first signed
//    call, so the transport must be the mesh prefix (modules/netget/Typescript/tests/cleaker-signin-gateway-routing.test.ts
//    proves the same at library level). Needs a disposable monad AND a disposable gateway in front of it (see below).
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
//
// Check 5 also needs a disposable gateway in front of a disposable monad (OpenResty from netget's own generator, temp prefix,
// free high ports, an apps.json entry registering the monad as `netget` under the same root); pass its origin in:
//   VITE_DISPOSABLE_GATEWAY_ORIGIN=http://127.0.0.1:<port> npx vitest run --project=storybook \
//     src/gui/All.This/Cleaker/Cleaker.4-verify.stories.tsx -t IdentityJourneyThroughGateway
// The setup shape is modules/netget/Typescript/tests/cleaker-signin-gateway-routing.test.ts. It is import.meta.env, not
// process.env: this file runs in the browser through Vite's module graph, which only exposes VITE_-prefixed variables.
import * as React from "react";
import type { Meta } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "@/gui/All.This/Cleaker/Cleaker";
import { ConnectionSeamsContext } from "./useQRConnect";
import { disposableDoorSeams } from "./disposableDoor";
import { DISPOSABLE_ORIGIN, DISPOSABLE_ROOT_LABEL } from "./disposable";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";


import { Me } from "@/react/Me";
const meta: Meta = {
  title: "All.This/Cleaker",
  parameters: { layout: "fullscreen" },
};

export default meta;

setActiveNamespaceRoot(DISPOSABLE_ROOT_LABEL);

// Check (regression, 2026-10-02): a malformed namespace must error for real, not fall back to a default. Rendered inside
// a local error boundary (this is a render-phase throw from `parseCleakerNamespaceExpression`, surfaced by Cleaker's own
// `useMemo`).
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

export const MalformedNamespaceErrors = () => (
  <Theme>
    <CaptureBoundary>
      <Me>
        <Cleaker namespace="bad[unclosed" />
      </Me>
    </CaptureBoundary>
  </Theme>
);

// Check: a `.me` that declares a handle -> <Cleaker> presents it, it does not drop it to the root. The sign-in form is
// pre-filled with it and the page names `ana.<root>`; nothing is signed in. Needs the disposable monad up.
export const PrefillsDeclaredUsername = () => (
  <ConnectionSeamsContext.Provider value={disposableDoorSeams(DISPOSABLE_ORIGIN)}>
    <Theme>
      <Me username="ana">
        <Cleaker namespace={DISPOSABLE_ROOT_LABEL} transport={DISPOSABLE_ORIGIN} />
      </Me>
    </Theme>
  </ConnectionSeamsContext.Provider>
);

PrefillsDeclaredUsername.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const field = await waitFor(() => {
    const el = canvasElement.querySelector('[data-gui-node-id$=".username"] input, input[data-gui-node-id$=".username"]') as HTMLInputElement | null;
    if (!el) throw new Error('sign-in username field not shown yet');
    return el;
  }, { timeout: 15000 });
  expect(field.value).toBe('ana');
  // the label is drawn in pieces, so read the page's text rather than one element's
  await waitFor(() => expect(canvasElement.textContent || '').toContain(`ana.${DISPOSABLE_ROOT_LABEL}`));
  // declared, not signed in: the form is still the form
  expect(canvas.queryByText(/Sign out|Logout/i)).toBeNull();
};

// Check: no `.me` above -> a plain message saying so; no guessed destination.
export const NoMeAbove = () => (
  <Theme>
    <Cleaker namespace="cleaker.me" />
  </Theme>
);

// Check: a `.me` above but no namespace given -> a plain message, nothing guessed.
export const NoNamespaceGiven = () => (
  <Theme>
    <Me>
      <Cleaker />
    </Me>
  </Theme>
);

NoNamespaceGiven.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvas.getByText(/This Cleaker has no namespace/)).toBeInTheDocument());
  expect(canvas.queryByText('cleaker.me')).toBeNull();
};

NoMeAbove.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvas.getByText(/There is no \.me above this Cleaker/)).toBeInTheDocument());
  expect(canvas.queryByText('cleaker.me')).toBeNull();
};

MalformedNamespaceErrors.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
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
  const el = canvasElement.querySelector('[data-gui-node-id="GUI.window.layout.content.landing"] .MuiTypography-caption');
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
      <Me>
        <Cleaker namespace={DISPOSABLE_ROOT_LABEL} transport={DISPOSABLE_ORIGIN} />
      </Me>
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

// Check 5 (first written 2026-10-05 as RegisterThroughLocalCleakerGateway, for the `Cleaker.stories.tsx` story that passed
// no explicit transport): the register / back up / sign out / sign in journey with the transport going through a REAL gateway's
// `/apps/netget` mesh-proxy prefix rather than a direct monad connection. A gateway is not a monad origin -- the session's
// transport must be the mesh prefix (`<Cleaker transport=...>`), never the address of the gateway's own door -- and a real
// signed call is what proves it (the first one, the claim, is the one that failed when the transport was the bare alias).
//
// What stays stubbed is the same thing `disposableDoorSeams` always stubs: the gateway's `/gateway-identity` ("bootstrapped"),
// because this verifies the identity flow, not netget's own setup. `/__surface` is read through the gateway's mesh prefix
// (that is where the monad answers it; the door's root `/__surface` is the admin SPA). Everything else -- the claim, the
// sign-in -- is a real signed request through the gateway.
//
// import.meta.env, not process.env: this runs in the browser through Vite's module graph, where only VITE_ variables exist.
const DISPOSABLE_GATEWAY_ORIGIN = ((import.meta as any).env?.VITE_DISPOSABLE_GATEWAY_ORIGIN || '').replace(/\/+$/, '');
const GATEWAY_TRANSPORT = `${DISPOSABLE_GATEWAY_ORIGIN}/apps/netget`;

export const IdentityJourneyThroughGateway = () => (
  <ConnectionSeamsContext.Provider value={disposableDoorSeams(GATEWAY_TRANSPORT)}>
    <Theme>
      <Me>
        <Cleaker namespace={DISPOSABLE_ROOT_LABEL} transport={GATEWAY_TRANSPORT} />
      </Me>
    </Theme>
  </ConnectionSeamsContext.Provider>
);

IdentityJourneyThroughGateway.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  if (!DISPOSABLE_GATEWAY_ORIGIN) {
    throw new Error(
      'VITE_DISPOSABLE_GATEWAY_ORIGIN is not set -- start the disposable monad and the disposable gateway in front of it ' +
      "first (see this file's header) and pass its origin, e.g. VITE_DISPOSABLE_GATEWAY_ORIGIN=http://127.0.0.1:PORT.",
    );
  }
  const canvas = within(canvasElement);
  const user = userEvent.setup();
  const username = `verify-gw-${Date.now().toString(36)}`;
  const password = 'verify-throwaway-password';
  const fullNamespace = `${username}.${DISPOSABLE_ROOT_LABEL}`;

  // ---- Register, through the gateway ----
  // The shell lands on the welcome page ("/"); the identity card, with its register / sign-in form, is the page at /.me
  // (6a5cf8b3: "identity is a page, not a dialog"). The way in is the mark leading the left bar: the app's brand, a link to
  // /.me, and not the bar's expand control -- that is the arrow beside it. The explicit timeouts are for the real round trips
  // to the gateway (findBy*'s default is 1 s); the whole story must still fit the 15 s test limit.
  const brand = await canvas.findByRole('link', { name: 'Open .me' }, { timeout: 8000 });
  expect(brand).toHaveAttribute('href', '/.me');
  const arrow = await canvas.findByRole('button', { name: 'Expand sidebar' });
  expect(brand.contains(arrow)).toBe(false);
  // The arrow expands the bar and goes nowhere: the welcome page is still the page.
  await user.click(arrow);
  await waitFor(() => expect(canvas.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true'));
  expect(canvas.queryByRole('button', { name: 'New here? Register' })).toBeNull();
  await user.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
  await waitFor(() => expect(canvas.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument());
  // The brand goes to the identity page and does not expand the bar.
  await user.click(canvas.getByRole('link', { name: 'Open .me' }));
  expect(canvas.queryByRole('button', { name: 'Collapse sidebar' })).toBeNull();
  await user.click(await canvas.findByRole('button', { name: 'New here? Register' }, { timeout: 8000 }));
  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fireEvent.change(canvas.getByLabelText('Secret'), { target: { value: password } });
  fireEvent.change(canvas.getByLabelText('Confirm Secret'), { target: { value: password } });
  const submit = await waitFor(() => {
    const button = canvas.getByRole('button', { name: 'Claim Username' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(submit);

  // The backup step is reached (not skipped by the `authenticated` flip), names the real namespace, and shows 12 real words.
  await waitFor(() => expect(canvas.getByText('Back Up Your Identity')).toBeInTheDocument(), { timeout: 8000 });
  expectNotAuthenticatedYet(canvas, 'gateway register: at Back Up Your Identity');
  await waitFor(() => expect(canvas.getByText(fullNamespace)).toBeInTheDocument(), { timeout: 8000 });
  const capturedWords = readRevealedWords(canvasElement);
  expect(capturedWords).toHaveLength(12);
  expect(capturedWords.every((w) => /^[a-z]+$/.test(w))).toBe(true);

  await user.click(canvas.getByText("I've written down my 12 words in a safe place"));
  await user.click(canvas.getByRole('button', { name: 'Continue' }));

  await waitFor(() => expect(canvas.getByRole('button', { name: /Sign out/i })).toBeInTheDocument(), { timeout: 8000 });
  const identityLabelAfterRegister = readIdentityLabel(canvasElement);
  expect(identityLabelAfterRegister.length).toBeGreaterThan(0);

  // ---- Sign out ----
  await user.click(canvas.getByRole('button', { name: /Sign out/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );

  // ---- Sign in again with the same credentials, through the gateway: the SAME identity ----
  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fireEvent.change(canvas.getByLabelText('Secret'), { target: { value: password } });
  const loginSubmit = await waitFor(() => {
    const button = canvas.getByRole('button', { name: '.me' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(loginSubmit);

  await waitFor(() => expect(canvas.getByRole('button', { name: /Sign out/i })).toBeInTheDocument(), { timeout: 8000 });
  expect(readIdentityLabel(canvasElement)).toBe(identityLabelAfterRegister);

  await user.click(canvas.getByRole('button', { name: /Sign out/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );
};
