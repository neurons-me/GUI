import * as React from 'react';
import type { Meta } from '@storybook/react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import Theme from '@/gui/Theme/Theme';
import GatewaySetup from './GatewaySetup';

// me.netget.setup — the six states of the one setup process described in
// setupState.ts's SetupPhase, each its own story so the contract itself
// is what's being reviewed here, not just one screen's look. See
// GatewaySetup.tsx's header comment for why claiming from a browser is
// safe now (the setup-code gate) when it deliberately wasn't before.
const meta: Meta<typeof GatewaySetup> = {
  title: 'All.This/netget/Setup',
  component: GatewaySetup,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Installs a fetch stub for the lifetime of one story, then restores
// whatever fetch was there before. Installed during RENDER, not inside a
// useEffect: GatewaySetup (the child) fires its own first poll() from ITS
// OWN effect, and React runs child effects before parent effects — an
// effect here would install the stub one tick too late for the very
// first poll. Guarded with a ref so a re-render doesn't reinstall over
// its own stub and lose the reference to the ORIGINAL real fetch.
function withFetchStub(responses: Record<string, any | null>) {
  return function FetchStub({ children }: { children: React.ReactNode }) {
    const originalFetchRef = React.useRef<typeof window.fetch | null>(null);
    if (originalFetchRef.current === null) {
      originalFetchRef.current = window.fetch;
      window.fetch = (async (input: RequestInfo | URL) => {
        const url = String(input);
        const hit = Object.keys(responses).find((path) => url.endsWith(path));
        if (!hit) return new Response('', { status: 404 });
        const body = responses[hit];
        if (body === null) throw new Error('simulated network failure');
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }) as typeof window.fetch;
    }
    React.useEffect(() => () => {
      if (originalFetchRef.current) window.fetch = originalFetchRef.current;
    }, []);
    return <>{children}</>;
  };
}

// Same install/cleanup shape as withFetchStub, but for the one state that
// stub can't actually produce: 'checking'. fetchJson() treats a resolved
// non-ok response (e.g. a 404, what an empty withFetchStub({}) map
// returns for every path) exactly like a thrown network error — both
// become null, and poll() reacts to null immediately by setting
// 'unreachable'. Since poll() runs synchronously-ish on mount, a stub
// that resolves right away — even with "nothing matched" — never leaves
// a visible 'checking' moment; it only ever flickers through it.
// Genuinely reproducing 'checking' means the fetch must never settle at
// all, so poll()'s first await just hangs and setPhase() is never called
// — the phase stays at its React.useState initial value.
function withHangingFetchStub() {
  return function HangingFetchStub({ children }: { children: React.ReactNode }) {
    const originalFetchRef = React.useRef<typeof window.fetch | null>(null);
    if (originalFetchRef.current === null) {
      originalFetchRef.current = window.fetch;
      window.fetch = (() => new Promise<Response>(() => {})) as typeof window.fetch;
    }
    React.useEffect(() => () => {
      if (originalFetchRef.current) window.fetch = originalFetchRef.current;
    }, []);
    return <>{children}</>;
  };
}

const READY_IDENTITY = {
  gatewayId: 'fresh-install.local',
  owner: null,
  bootstrapped: false,
  adminCount: 0,
  scopes: [],
  version: null,
  updatedAt: null,
};

const OPENRESTY_UP = {
  platform: 'darwin', ok: true, serviceInstalled: true, serviceActive: true,
  httpListening: true, httpsListening: true, mode: 'service',
};

const OPENRESTY_DOWN = {
  platform: 'darwin', ok: false, serviceInstalled: true, serviceActive: false,
  httpListening: false, httpsListening: false, mode: 'service',
};

// The permissive, local-only mocks GatewaySetup itself used to default to
// — moved here deliberately (see GatewaySetup.tsx's header comment): the
// shipped component can no longer fake success on its own, but a story
// still needs SOME implementation to click through, so every story below
// supplies this explicit trio instead of relying on a built-in fallback.
// netgetSetupClient.ts is the real, non-mock implementation of this same
// shape, against gatewaySetupSession.ts's actual /setup/* routes.
// The real trio actually redirects the browser to a Cleaker-origin view
// to sign (CleakerNetgetClaimView) — a story can't follow a browser out
// of its own iframe, so these mocks stop at "here's the URL we'd have
// redirected to" rather than actually navigating.
const MOCK_ACTIONS = {
  onSubmitSetupCode: async (code: string) => {
    const trimmed = code.trim();
    return trimmed
      ? { ok: true, gatewayId: 'fresh-install.local', challenge: 'mock-challenge', state: 'mock-state', setupToken: 'mock-setup-token' }
      : { ok: false, message: 'Enter the setup code shown by netget init or netget claim.' };
  },
  onVerifySetupCode: async (code: string) => {
    const trimmed = code.trim();
    return trimmed
      ? { ok: true, setupToken: 'mock-setup-token' }
      : { ok: false, message: 'Enter the setup code shown by netget init or netget claim.' };
  },
  resolveCleakerClaimUrl: async ({ gatewayId, challenge, state, returnTo }: { gatewayId: string; challenge: string; state: string; returnTo: string }) => {
    return `http://mock-cleaker.local/keychain/claim?gatewayId=${gatewayId}&challenge=${challenge}&state=${state}&returnTo=${encodeURIComponent(returnTo)}`;
  },
  onCommitClaim: async (proof: { namespace: string }) => {
    return { ok: true, ownerUsername: proof.namespace.split('.')[0] };
  },
};

// 1) Checking installation — the transient first-render state, before the
// first poll has resolved either way. Needs a fetch that never settles
// (see withHangingFetchStub's own comment) — an immediately-resolving
// 404, which is what an empty withFetchStub({}) map produces, reaches
// 'unreachable' almost instantly instead. That's a genuinely different
// state, covered separately by the Unreachable story below.
const NeverRespondingStub = withHangingFetchStub();
export const CheckingInstallation = () => (
  <Theme>
    <NeverRespondingStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </NeverRespondingStub>
  </Theme>
);

// 2) Dependencies required — backend is up, but OpenResty (a required
// dependency) isn't — see setupState.ts's blockingDependency(). Also
// demonstrates OpenRestyInstallControl's real happy path: enter the code,
// see "Install" become available (Homebrew present and writable in this
// mock), click it, watch fake progress, land on success — every network
// call here is the SAME endpoint the real backend serves, just stubbed.
const DependenciesRequiredStub = withFetchStub({
  '/gateway-identity': READY_IDENTITY,
  '/openresty-status': OPENRESTY_DOWN,
  '/openresty/install/availability': { ok: true, available: true, reason: 'Homebrew is installed and writable by this user.' },
  '/openresty/install': { ok: true, job: { id: 'mock-job-1', status: 'success', log: ['==> Installing openresty/brew/openresty', '🍺  openresty/brew/openresty was successfully installed.'], startedAt: Date.now(), finishedAt: Date.now(), message: 'OpenResty installed via Homebrew.' } },
  '/openresty/install/progress': { ok: true, job: { id: 'mock-job-1', status: 'success', log: ['==> Installing openresty/brew/openresty', '🍺  openresty/brew/openresty was successfully installed.'], startedAt: Date.now(), finishedAt: Date.now(), message: 'OpenResty installed via Homebrew.' } },
});
export const DependenciesRequired = () => (
  <Theme>
    <DependenciesRequiredStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </DependenciesRequiredStub>
  </Theme>
);

// 2b) Dependencies required, but no unattended install path exists (e.g.
// Linux, or Homebrew missing/not writable) — the terminal-instructions
// fallback, not a button that would just fail. Real text, not
// paraphrased: this is exactly what canInstallOpenRestyViaHomebrew()'s
// `reason` and getInstallInstructions() (platformDetect.ts) produce.
const DependenciesRequiredNoAutoInstallStub = withFetchStub({
  '/gateway-identity': READY_IDENTITY,
  '/openresty-status': OPENRESTY_DOWN,
  '/openresty/install/availability': {
    ok: true,
    available: false,
    reason: 'No unattended install path for linux yet — apt and source builds both require sudo.',
    terminalInstructions: 'Install via apt (Debian/Ubuntu):\n  sudo apt-key adv --fetch-keys https://openresty.org/package/pubkey.gpg\n  sudo apt update\n  sudo apt install -y openresty',
  },
});
export const DependenciesRequiredNoAutoInstall = () => (
  <Theme>
    <DependenciesRequiredNoAutoInstallStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </DependenciesRequiredNoAutoInstallStub>
  </Theme>
);

// 3) Ready / Unclaimed — everything checkable is ready, nobody owns it.
const UnclaimedStub = withFetchStub({
  '/gateway-identity': READY_IDENTITY,
  '/openresty-status': OPENRESTY_UP,
});
export const ReadyUnclaimed = () => (
  <Theme>
    <UnclaimedStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </UnclaimedStub>
  </Theme>
);

// 4) Redirecting to sign — the instant before the browser leaves for the
// Cleaker-origin view. Reached only by user action (entering an accepted
// setup code), so this story seeds it directly via initialPhase rather
// than mocking a backend signal that doesn't exist for it (see
// GatewaySetup.tsx's own doc comment on that prop).
const RedirectingToSignStub = withFetchStub({
  '/gateway-identity': READY_IDENTITY,
  '/openresty-status': OPENRESTY_UP,
});
export const RedirectingToSign = () => (
  <Theme>
    <RedirectingToSignStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" initialPhase="redirecting-to-sign" />
    </RedirectingToSignStub>
  </Theme>
);

// 5) Finishing the claim — the browser is back with a signed proof and
// this screen is submitting it. Same seeding reasoning as above.
const FinishingClaimStub = withFetchStub({
  '/gateway-identity': READY_IDENTITY,
  '/openresty-status': OPENRESTY_UP,
});
export const FinishingClaim = () => (
  <Theme>
    <FinishingClaimStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" initialPhase="finishing-claim" />
    </FinishingClaimStub>
  </Theme>
);

// 6) Claimed / continue configuration.
const ClaimedStub = withFetchStub({
  '/gateway-identity': { ...READY_IDENTITY, owner: 'deadbeef'.repeat(8), bootstrapped: true, ownerUsername: 'jabellae' },
  '/openresty-status': OPENRESTY_UP,
});
export const ClaimedContinueConfiguration = () => (
  <Theme>
    <ClaimedStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </ClaimedStub>
  </Theme>
);

// Unreachable — nothing answers at all.
const UnreachableStub = withFetchStub({ '/gateway-identity': null, '/openresty-status': null });
export const Unreachable = () => (
  <Theme>
    <UnreachableStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </UnreachableStub>
  </Theme>
);

// Real, reachable local endpoint — this machine's own gateway, already
// claimed. Same "prefer real network where it's genuinely reachable"
// convention as MainServerView.stories.tsx's Default story.
export const Live = () => (
  <Theme>
    <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://local.netget" />
  </Theme>
);

// The click-through from Ready/Unclaimed up to the point this component
// hands off to another origin — proves entering a code actually resolves
// a redirect target and starts navigating there. It can't continue
// through the redirect itself: that's a real cross-origin browser
// navigation (see CleakerNetgetClaimView), which is exactly what a single
// Storybook iframe structurally can't follow and come back from. The
// FinishingClaim/Claimed stories above cover what this screen looks like
// on either side of that hop; see this package's browser-level
// cross-origin test for the real, followed-through round trip.
const FullFlowStub = withFetchStub({
  '/gateway-identity': READY_IDENTITY,
  '/openresty-status': OPENRESTY_UP,
});
export const FullFlow = () => (
  <Theme>
    <FullFlowStub>
      <GatewaySetup
        {...MOCK_ACTIONS} endpoint="http://stubbed.local" />
    </FullFlowStub>
  </Theme>
);

FullFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const user = userEvent.setup();

  // 'Unclaimed', not 'UNCLAIMED': the label's actual text content is
  // title-case — CSS textTransform:'uppercase' only changes how it's
  // PAINTED, never the underlying DOM text getByText matches against.
  await waitFor(() => expect(canvas.getByText('Unclaimed')).toBeInTheDocument(), { timeout: 8000 });

  fireEvent.change(await canvas.findByLabelText('Setup code'), { target: { value: 'test-setup-code' } });
  await user.click(canvas.getByRole('button', { name: 'Continue' }));

  await waitFor(() => expect(canvas.getByText('Redirecting to Sign')).toBeInTheDocument(), { timeout: 8000 });
};
