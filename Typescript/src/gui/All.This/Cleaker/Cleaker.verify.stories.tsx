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
// 3. A REAL END-TO-END FLOW (RegisterThroughCleaker): `<Cleaker
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
// CleakerIdentityCard.verify.stories.tsx's own header comment for the full
// root-cause trace. Claim persistence itself already respects
// ME_STATE_DIR automatically (modules/monad/Typescript/src/claim/
// manager.ts's getClaimStorePaths()).
import * as React from "react";
import type { Meta } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import ME from "this.me";
import Theme from "@/gui/Theme/Theme";
import Cleaker from "@/gui/All.This/Cleaker/Cleaker";
import { setActiveNamespaceRoot } from "@/gui/All.This/Cleaker/signedRequest";
import { writeMeValue } from "@/runtime/run-me";

const DISPOSABLE_ORIGIN = "http://127.0.0.1:18322";
const DISPOSABLE_ROOT_LABEL = "disposable-test.local";

const meta: Meta = {
  title: "Verify/Cleaker",
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

// Check 3: real register flow through Cleaker's own explicit-override
// props (the shape a caller with no live `.me` kernel uses, e.g. netget's
// App.jsx) -- proves the internal SeedSessionProvider+Namespace wiring is
// real, not just that it renders.
export const RegisterThroughCleaker = () => (
  <Theme>
    <Cleaker
      cleakerEndpoint={`http://${DISPOSABLE_ROOT_LABEL}`}
      netgetMonadOrigin={DISPOSABLE_ORIGIN}
      transportOrigin={DISPOSABLE_ORIGIN}
    />
  </Theme>
);

RegisterThroughCleaker.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const user = userEvent.setup();
  const username = `cleaker-verify-${Date.now().toString(36)}`;
  const password = 'verify-throwaway-password';
  const fullNamespace = `${username}.${DISPOSABLE_ROOT_LABEL}`;

  await user.click(await canvas.findByRole('button', { name: 'New here? Register' }));

  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fireEvent.change(canvas.getByLabelText('Secret'), { target: { value: password } });
  fireEvent.change(canvas.getByLabelText('Confirm Secret'), { target: { value: password } });

  const submit = await waitFor(() => {
    const button = canvas.getByRole('button', { name: 'Claim Username' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(submit);

  await waitFor(() => expect(canvas.getByText('Back Up Your Identity')).toBeInTheDocument(), { timeout: 8000 });
  await waitFor(() => expect(canvas.getByText(fullNamespace)).toBeInTheDocument(), { timeout: 8000 });

  await user.click(canvas.getByText("I've written down my 12 words in a safe place"));
  await user.click(canvas.getByRole('button', { name: 'Continue' }));

  // Real signed-in view, reached entirely through Cleaker's own internal
  // wiring -- confirms the whole chain (Cleaker -> SeedSessionProvider ->
  // Namespace -> CleakerIdentityCard's own claim/backup flow -> real monad)
  // is live end-to-end.
  await waitFor(() => expect(canvas.getByRole('button', { name: /Sign out/i })).toBeInTheDocument(), { timeout: 8000 });

  await user.click(canvas.getByRole('button', { name: /Sign out/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );
};
