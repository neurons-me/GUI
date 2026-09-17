// verify-scheme-fix.mjs — reproducible regression test for the
// http/https scheme bug in netgetSetupClient.ts's localCleakerOrigin().
//
// The bug: resolveCleakerOrigin()'s local-mesh fallback used to return a
// hardcoded `'http://local.cleaker'` literal. That literal is the ORIGIN
// COMPUTATION behind claimUrl itself, so on an https-loaded page,
// claimUrl's origin (http://local.cleaker) could never equal
// window.location.origin (https://...), silently defeating
// UnclaimedPanel's onNavigateSameOrigin fix (GatewaySetup.tsx) in any real
// https deployment while still looking correct in a plain-http localhost
// test. The fix makes localCleakerOrigin() read window.location.protocol
// instead of hardcoding a scheme.
//
// Why this is an isolated call rather than a full https browser round
// trip: localCleakerOrigin() always assumes the STANDARD port for its
// scheme (80/443), matching real deployments where Cleaker and netget
// share one origin. A faithful end-to-end https test of THAT EXACT
// fallback would need this disposable demo to bind local.cleaker:443 —
// the exact port the real ambient netget/OpenResty gateway already owns
// on this machine — which this project's own convention (see
// demo/README.md) forbids for exactly the reason it protects: never risk
// colliding with, or depending on, the real ambient gateway. This test
// instead calls the real, unmodified exported createNetgetSetupClient()
// directly, toggling only the one environmental fact that differs
// between an http and an https page load: window.location.protocol.
//
// Run: npx tsx demo/verify-scheme-fix.mjs   (from packages/GUI/Typescript)
//
// This is deliberately paired with a SEPARATE, real full-browser https
// round trip (register -> /netget -> setup code -> keychain create+
// unlock -> back to /keychain/claim preserving session -> sign -> owner
// confirmed) on an ISOLATED port, reusing the real, already-trusted
// mkcert cert this machine's own ambient gateway uses (its SAN already
// covers "localhost") -- never local.cleaker itself, and never :443, so
// there is no way for onNavigateSameOrigin's fallback branch
// (`window.location.href = claimUrl` when origins don't match) to ever
// reach the real ambient gateway even if the origin check failed. That
// round trip exercises resolveCleakerOrigin()'s EXPLICIT-scheme branch
// (mainServerName already spelling out "https://localhost:<port>"), not
// this file's local-mesh fallback branch -- the two together cover both
// the literal fixed line (here, isolated) and the full click-path under
// a real https connection (there, live). To reproduce that round trip:
//
//   HARNESS_CLEAKER_ORIGIN=https://localhost:5178 \
//     npx tsx dev-harness/claim-harness-server.mjs   (from modules/netget's backend dir)
//
//   DEMO=true DEMO_ROLE=claimFlowEmbedded DEMO_MONAD_ORIGIN=http://127.0.0.1:<monad port> \
//   DEMO_HTTPS_CERT="$HOME/.netget/certs/local.netget.pem" \
//   DEMO_HTTPS_KEY="$HOME/.netget/certs/local.netget-key.pem" \
//     npx vite --port 5178                            (from packages/GUI/Typescript)
//
// then drive the same steps as the plain-http flow against
// https://localhost:5178/ instead of http://localhost:<port>/.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const modPath = path.join(dirname, '../src/gui/All.This/netget/Setup/netgetSetupClient.ts');

async function resolveClaimOriginUnder(protocol) {
  globalThis.window = {
    location: { protocol, origin: `${protocol}//irrelevant-for-this-check`, pathname: '/netget' },
  };
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/main-server-namespace')) {
      // A "local mesh" value (no public root configured) is exactly the
      // condition that makes resolveCleakerOrigin() fall through to
      // localCleakerOrigin() instead of a directly-configured origin.
      return { json: async () => ({ mainServerName: 'local.cleaker' }) };
    }
    return { json: async () => ({}) };
  };

  // Cache-bust the query string so each call re-evaluates the module
  // fresh against the just-set global window/fetch above.
  const mod = await import(`${modPath}?scheme=${encodeURIComponent(protocol)}`);
  const client = mod.createNetgetSetupClient('http://127.0.0.1:4601');
  const url = await client.resolveCleakerClaimUrl({
    gatewayId: 'g', challenge: 'c', state: 's', returnTo: 'http://x/',
  });
  return new URL(url).origin;
}

const httpOrigin = await resolveClaimOriginUnder('http:');
const httpsOrigin = await resolveClaimOriginUnder('https:');

console.log('window.location.protocol=http:  -> claim URL origin =', httpOrigin);
console.log('window.location.protocol=https: -> claim URL origin =', httpsOrigin);

const httpOk = httpOrigin === 'http://local.cleaker';
const httpsOk = httpsOrigin === 'https://local.cleaker';

console.log(httpOk ? 'PASS: http passthrough correct' : `FAIL: expected http://local.cleaker, got ${httpOrigin}`);
console.log(httpsOk ? 'PASS: https case correct (this is the fix)' : `FAIL: expected https://local.cleaker, got ${httpsOrigin}`);

process.exit(httpOk && httpsOk ? 0 : 1);
