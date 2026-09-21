// netgetSetupClient.ts — the REAL implementation of GatewaySetup's action
// props, against gatewaySetupSession.ts's actual /setup/* routes
// (modules/netget/Typescript's backend). This is the one place
// GatewaySetup.tsx's mocks (Storybook-only, see its own header comment)
// have a non-mock counterpart — a real page mount uses THIS, never a
// built-in default, because there isn't one.
//
// No identity is derived here anymore, from a password or otherwise.
// Signing happens on the Cleaker origin that actually holds the
// claimant's keychain (see CleakerNetgetClaimView in CleakerLanding.tsx)
// — this client's job is only: verify the setup code + issue the
// challenge, resolve where to send the browser to sign, and submit
// whatever signed proof comes back. It never sees a private key or an
// unlock passphrase.
import type { SetupCodeResult, ActionResult } from './GatewaySetup';
import type { ClaimReturnProof } from './setupState';

export interface NetgetSetupClient {
  onSubmitSetupCode: (code: string) => Promise<SetupCodeResult>;
  onVerifySetupCode: (code: string) => Promise<{ ok: boolean; setupToken?: string; message?: string }>;
  resolveCleakerClaimUrl: (input: { gatewayId: string; challenge: string; state: string; returnTo: string }) => Promise<string>;
  onCommitClaim: (proof: ClaimReturnProof, setupToken: string) => Promise<ActionResult & { ownerUsername?: string }>;
}

async function fetchJson(base: string, path: string): Promise<any> {
  try {
    const res = await fetch(`${base}${path}`, { cache: 'no-store', credentials: 'same-origin' });
    return await res.json();
  } catch {
    return null;
  }
}

async function postJson(base: string, path: string, body: unknown): Promise<any> {
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return { ok: false, message: 'Could not reach this gateway.' };
  }
}

// Same rule MainServerView.tsx / netget.cli.ts's own resolveSetupAddress()
// already use: a local.* value means "no public root configured", so the
// Cleaker origin falls back to the local default rather than being built
// from that value directly.
function isLocalMeshValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'localhost' || v === '127.0.0.1' || v === 'local' || v.startsWith('local.');
}

// Scheme comes from THIS page's own window.location.protocol, not a fixed
// literal -- confirmed live as a real, separate bug from the one this
// session already fixed in CleakerNetgetClaimView's own mirror-image
// computation (allowedReturnOrigin): a hardcoded 'http://' here mismatches
// the moment this page is loaded over https (already true once netget's
// own redirect applies in production), which made UnclaimedPanel's own
// same-origin check for onNavigateSameOrigin compare "http://local.cleaker"
// against the real https-loaded window.location.origin and ALWAYS fail --
// silently defeating that fix by falling through to the old full-reload
// path every time, exactly the bug it was meant to close.
function localCleakerOrigin(): string {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  return `${protocol}//local.cleaker`;
}

/**
 * Resolves the Cleaker origin -- where the claimant's identity lives and signs --
 * from this gateway's OWN configuration: `GET /main-server-namespace`, already
 * served by the same backend GatewaySetup polls. Never a hardcoded
 * "local.cleaker" literal beyond the last-resort fallback every other resolver
 * in this codebase already uses for the same reason.
 *
 * The identity lives in the namespace the gateway's monad serves (`namespace`),
 * because the gateway's first claim is only accepted for an identity rooted in
 * that very namespace. `mainServerName` is a different thing -- the public NAME
 * OF THE HOST that shows the admin screens (netget.site) -- and is only the
 * answer on a gateway configured before `namespace` was reported.
 */
async function resolveCleakerOrigin(base: string): Promise<string> {
  const result = await fetchJson(base, '/main-server-namespace');
  const candidates = [result?.namespace, result?.mainServerName];
  for (const raw of candidates) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value || isLocalMeshValue(value)) continue;
    // A real configured value is always a bare hostname ("cleaker.example.com")
    // and always gets https. The one exception is a value that already
    // spells out a scheme ("http://127.0.0.1:5174") -- never produced by a
    // real deployment, but the one way to point this at a genuinely separate
    // localhost origin for disposable, port-based testing, so it's passed
    // through as-is rather than double-prefixed.
    if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, '');
    return `https://${value}`;
  }
  return localCleakerOrigin();
}

/**
 * One client per setup attempt — call this once (e.g. a module-level
 * const in the page that mounts GatewaySetup, NOT inside a render).
 *
 * `options.returnPath` overrides what gets sent as the claim challenge's
 * returnPath instead of reading `window.location.pathname` at click time.
 * The real netget App.jsx always mounts GatewaySetup at its own root ("/"),
 * where the default already matches — this only exists for a consumer
 * that legitimately mounts GatewaySetup somewhere else (e.g. a demo pilot
 * that reserves "/" for a different real component and puts GatewaySetup
 * at "/netget" instead); gatewaySetupSession.ts's own
 * ALLOWED_CLAIM_RETURN_PATHS must list that path too, or the challenge is
 * refused regardless of what's sent here.
 */
export function createNetgetSetupClient(
  endpoint: string,
  options?: {
    returnPath?: string;
    /**
     * Sign the claim in THIS app, at THIS origin. The identity's session and its local
     * vault live in the browser at the origin the person is on (cleaker.me and
     * www.cleaker.me do not share them, whatever namespace they both point at), so a
     * claim that jumps to another origin to be signed arrives with nobody signed in.
     * True when the page embedding GatewaySetup is itself the Cleaker app (its own
     * /keychain/claim route signs); false for a screen that is only the gateway's
     * (netget.site), which sends the person to the Cleaker origin.
     */
    signHere?: boolean;
  },
): NetgetSetupClient {
  const base = String(endpoint || '').replace(/\/+$/, '');

  return {
    async onSubmitSetupCode(code) {
      const verifyResult = await postJson(base, '/setup/verify-code', { code });
      if (!verifyResult?.ok) return verifyResult ?? { ok: false, message: 'Could not reach this gateway.' };

      const setupToken = verifyResult.setupToken as string;
      // The gateway's own current page -- this exact URL, at this exact
      // moment -- is the callback this attempt will actually return to.
      // Declared here, at challenge-issue time, so gatewaySetupSession.ts
      // can validate and record it (see issueClaimChallenge's own
      // ALLOWED_CLAIM_RETURN_PATHS check) rather than trusting whatever
      // shows up later with no prior record of what was expected.
      const challengeResult = await postJson(base, '/setup/challenge', {
        setupToken,
        returnOrigin: window.location.origin,
        returnPath: options?.returnPath ?? window.location.pathname,
      });
      if (!challengeResult?.ok) return challengeResult;

      return {
        ok: true,
        setupToken,
        challenge: challengeResult.challenge as string,
        gatewayId: challengeResult.gatewayId as string | undefined,
        state: challengeResult.state as string | undefined,
      };
    },

    // Lighter than onSubmitSetupCode: verifies access ONLY, no claim
    // challenge issued — used to unlock the dependencies-required screen's
    // "Install OpenResty" action before the gateway is even claimable, so
    // it must not carry the side effects (returnOrigin/returnPath
    // validation, challenge/state minting) that step is specifically for.
    async onVerifySetupCode(code) {
      const result = await postJson(base, '/setup/verify-code', { code });
      return result ?? { ok: false, message: 'Could not reach this gateway.' };
    },

    async resolveCleakerClaimUrl({ gatewayId, challenge, state, returnTo }) {
      const cleakerOrigin = options?.signHere && typeof window !== 'undefined'
        ? window.location.origin
        : await resolveCleakerOrigin(base);
      const url = new URL('/keychain/claim', cleakerOrigin);
      url.searchParams.set('gatewayId', gatewayId);
      url.searchParams.set('challenge', challenge);
      url.searchParams.set('state', state);
      url.searchParams.set('returnTo', returnTo);
      return url.toString();
    },

    async onCommitClaim(proof, setupToken) {
      return postJson(base, '/setup/claim', { setupToken, proof });
    },
  };
}
