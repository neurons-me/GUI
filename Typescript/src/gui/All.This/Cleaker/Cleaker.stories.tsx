import * as React from "react";
import type { Meta } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import Theme from "@/gui/Theme/Theme";
import { SeedSessionProvider, useOptionalSeedSessionContext } from "@/react/session/SeedSessionProvider";
import CleakerLanding from "@/react/session/CleakerLanding";
import Cleaker from "./Cleaker";
import { setActiveNamespaceRoot } from "./signedRequest";

// One title group, two real components: CleakerLanding (the full-page
// identity landing netget's App.jsx renders at local.cleaker) and Cleaker
// (the compact card widget used elsewhere). Kept in one file — rather than
// split across CleakerLanding's own directory — specifically so Storybook's
// within-file declaration order can guarantee Default (CleakerLanding)
// sorts before Card View (Cleaker): the array form of .storybook/preview.tsx's
// storySort only documents group-level ordering, not story-level ordering
// within a merged group across files (confirmed against Storybook's own
// docs) — declaration order in one file is the reliable mechanism instead.
const meta: Meta = {
  title: "All.This/Cleaker/.me",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// Without sessionBackend="cleaker", the "Hello, I am…" form's onEnter calls
// loginWithCredentials() with no resolveSeedFromCredentials wired (this
// story never passed one) → "No credential resolver was provided to
// SeedSessionProvider." sessionBackend="cleaker" takes the real
// signed-proof path instead (see CleakerBackendSmokeTest below, which
// proves that path works standalone) — but it still needs a root namespace,
// and MeLauncher's onEnter never passes one (see loginWithCredentials'
// own fallback chain in SeedSessionProvider.tsx). setActiveNamespaceRoot()
// is the same global a real CleakerLanding root-switcher sets before
// submit; setting it here up front makes the story's form behave exactly
// like the real page pointed at local.cleaker, submitting a REAL
// claim/open against local.cleaker's actual running monad — not mocked.
setActiveNamespaceRoot('local.cleaker');

export const Default = () => (
  <Theme>
    <SeedSessionProvider transportOrigin="http://local.cleaker/apps/netget" sessionBackend="cleaker">
      {/* netgetMonadOrigin: CleakerLanding's default (window.location.origin +
          "/apps/netget") only holds when this page is actually SERVED by
          netget — here it's served by Storybook's own dev server, which has
          no such path, so the in-app search/#/users/#/blockchain routes
          would 404 without this override. Same real, reachable target
          Usernames.stories.tsx/BlocksTable.stories.tsx already use. */}
      <CleakerLanding cleakerEndpoint="http://local.cleaker" netgetMonadOrigin="http://local.netget/apps/netget" />
    </SeedSessionProvider>
  </Theme>
);

export const CardView = () => <Cleaker />;

// Exercises SeedSessionProvider's sessionBackend="cleaker" opt-in directly
// (loginWithCredentials(), given an explicit root namespace) rather than
// through CleakerLanding/MeLauncher's UI — those don't pass a namespace to
// loginWithCredentials() today (they rely on resolveSeedFromCredentials to
// supply one, which the cleaker backend deliberately bypasses — see
// SeedSessionProviderProps.sessionBackend's own doc comment). Wiring
// CleakerLanding itself onto this backend is the real login flow's
// eventual cutover, not this story's job — this proves the backend itself
// works, in isolation, against the real running monad.
function CleakerBackendSmokeTestInner() {
  const session = useOptionalSeedSessionContext();
  const [username] = React.useState(() => `storysmoke_${Date.now().toString(36)}`);
  const [log, setLog] = React.useState<string[]>([]);

  if (!session) return null;

  const append = (line: string) => setLog((prev) => [...prev, line]);

  const runClaim = async () => {
    append(`claiming ${username}.local.cleaker via cleaker backend…`);
    try {
      await session.loginWithCredentials({
        username,
        password: 'story-smoke-test-throwaway-password',
        namespace: 'local.cleaker',
      });
      append('ok — see authenticated/semanticNamespace/identityHash below');
    } catch (err) {
      append(`failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e6e6e6', background: '#111', minHeight: '100vh' }}>
      <p>sessionBackend=&quot;cleaker&quot; — claims/opens a real THROWAWAY namespace against local.cleaker&apos;s real monad, through cleaker&apos;s own signed-proof path, not monadClient.ts&apos;s REST-only one.</p>
      <button type="button" onClick={runClaim}>Claim &amp; open {username}.local.cleaker</button>
      <p>authenticated: {String(session.authenticated)}</p>
      <p>semanticNamespace: {session.semanticNamespace ?? '(none)'}</p>
      <p>identityHash: {session.identityHash ?? '(none)'}</p>
      <pre>{log.join('\n')}</pre>
    </div>
  );
}

export const CleakerBackendSmokeTest = () => (
  <Theme>
    <SeedSessionProvider transportOrigin="http://local.cleaker/apps/netget" sessionBackend="cleaker">
      <CleakerBackendSmokeTestInner />
    </SeedSessionProvider>
  </Theme>
);

// Full-journey interaction test for the BIP-39 recovery-phrase registration
// flow: claims a REAL throwaway namespace against local.cleaker's real
// monad (same "real network, not mocked" convention as
// CleakerBackendSmokeTest above), through the actual UI a person uses —
// Username/Secret/Confirm Secret -> Claim -> phrase backup -> Continue.
//
// The specific regression this guards: SeedSessionProvider used to wrap
// its children in a NEW MeRuntimeProvider only once a session existed,
// which meant the exact moment a claim succeeded, React saw the tree shape
// change and remounted everything underneath — silently destroying
// RegisterMe's post-claim backup-phrase step before a person ever saw it.
// Fixed by always mounting MeRuntimeProvider at a stable position (see its
// own doc comment) — this test's central assertion is that the backup
// screen is actually reached and stays reachable, not skipped straight
// through to the authenticated view.
export const RegisterWithRecoveryPhrase = () => (
  <Theme>
    <SeedSessionProvider transportOrigin="http://local.cleaker/apps/netget" sessionBackend="cleaker">
      <CleakerLanding cleakerEndpoint="http://local.cleaker" netgetMonadOrigin="http://local.netget/apps/netget" />
    </SeedSessionProvider>
  </Theme>
);

RegisterWithRecoveryPhrase.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const user = userEvent.setup();
  // Hyphen, not underscore: this.me's canonical handle format
  // (me-uri.ts's HANDLE_RE) is DNS-label-shaped — [a-z0-9-] only. The
  // registration path this test exercises calls me['@'](username)
  // explicitly (see createCleakerSession's identityRootHex branch), which
  // validates that; the OLDER password-only path (2-arg `new ME(who,
  // secret)`, e.g. CleakerBackendSmokeTest above) never did, so an
  // underscore there went uncaught. Genuinely fixed here, not worked
  // around — an underscore was never a valid handle either way.
  const username = `storyphrase-${Date.now().toString(36)}`;
  const password = 'story-phrase-test-throwaway-password';

  await user.click(await canvas.findByRole('button', { name: 'New here? Register' }));

  // fireEvent.change, not userEvent.type: in this environment userEvent's
  // per-keystroke dispatch left the raw <input>.value updated but never
  // actually landed React's own onChange-driven state (confirmed live —
  // DOM value and Claim Username's disabled state disagreed indefinitely).
  // fireEvent.change goes through the tracked native value setter React
  // itself expects, which is what actually reaches setUsername/setPassword
  // here.
  fireEvent.change(await canvas.findByLabelText('Username'), { target: { value: username } });
  fireEvent.change(canvas.getByLabelText('Secret'), { target: { value: password } });
  fireEvent.change(canvas.getByLabelText('Confirm Secret'), { target: { value: password } });

  // Waited for explicitly (rather than clicking immediately): canSubmit
  // only flips true once React has committed all three onChange updates
  // above, and the submit control is a plain `component="button"` Box, not
  // an MUI Button — role="button" resolution + the `disabled` HTML
  // attribute both still apply, but there's no built-in "wait until
  // enabled" behavior the way a real form submit might get for free.
  const submit = await waitFor(() => {
    const button = canvas.getByRole('button', { name: 'Claim Username' });
    expect(button).toBeEnabled();
    return button;
  });
  await user.click(submit);

  // The regression this test exists for: if MeRuntimeProvider's stable
  // position fix regresses, this step never renders — the claim's own
  // `authenticated` flip remounts straight past it to the signed-in view.
  await waitFor(() => expect(canvas.getByText('Back Up Your Identity')).toBeInTheDocument(), { timeout: 8000 });

  // getByText, not getByRole+name: the confirm control's accessible name
  // also includes its sibling icon's ligature-font glyph name
  // ("check_box_outline_blank" — Material Symbols renders the icon NAME as
  // real DOM text, confirmed live), so an exact role name never matches.
  // getByText targets the label <p> specifically, which has no icon inside
  // it — clicking it still fires the enclosing button's onClick normally
  // (click events bubble).
  await user.click(canvas.getByText("I've written down my 12 words in a safe place"));
  await user.click(canvas.getByRole('button', { name: 'Continue' }));

  // Real signed-in view (not RegisterMe's own static fallback) — proves
  // CleakerLanding's registrationComplete handoff also survived intact.
  await waitFor(() => expect(canvas.getByRole('button', { name: /Salir/i })).toBeInTheDocument(), { timeout: 8000 });
  await expect(canvas.getByText(`${username}.local.cleaker`)).toBeInTheDocument();

  // Logout must cleanly return to the sign-in surface, not re-show
  // Register — see CleakerLanding's wasAuthenticatedRef reset effect.
  await user.click(canvas.getByRole('button', { name: /Salir/i }));
  await waitFor(
    () => expect(canvas.getByRole('button', { name: 'New here? Register' })).toBeInTheDocument(),
    { timeout: 8000 },
  );
};
