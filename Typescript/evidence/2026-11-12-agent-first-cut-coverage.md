# Agent first cut: requirement coverage (2026-11-12)

**Kind:** dated evidence (what commit `8d07d94a` does and what its tests show), not a requirement or a decision.
Measured against [Agent-Protocol.md](../Agent-Protocol.md) R1–R21. Everything ran in a disposable environment: three
browser origins, the test verifier `tests/integration/agentResource.mjs`, new identities generated in the agent, a
fixture domain list. **No real verifier is involved**: `me_sig.lua` and the monad do not apply v2 or `agent-only` yet,
the production login is unchanged, existing identities are not migrated.

Legend: **met (test env)** = implemented and shown by a test, on the test verifier only; **partial** = part shown,
the rest stated; **pending** = not in this commit.

| R | Requirement (short) | Status | Evidence / what is missing |
|---|---|---|---|
| R1 | Fixed origin, visible window, no framing | partial | own window and origin (1.1); framing refused **by script only** (11.1); CSP `frame-ancestors` headers missing (N1) |
| R2 | One request per id, opener only, browser-reported origin | partial | request claiming another origin ignored (11.3); navigated opener gets nothing (12.1); a copied id used from another window not tested (N3) |
| R3 | Versioned, exact parameters, bounded expiry, strict validation | met (unit) for the read | `tests/agentProtocol.test.ts` (N5); only the read operation exists, payload hash fixed to the empty body |
| R4 | Cancel/close/navigate/timeout/sign failure end the request | partial | reject and close (10.1, 10.2); navigation, timeout, signing failure not exercised |
| R5 | Approval drawn by the agent only, exact origin, identity, resource, action, expiry | partial | origin and resource/action shown (1.2, 1.3); host cannot supply components (by construction, not tested: N2) |
| R6 | Signed = shown | met (test env) | display and signed fields both come from the same validated operation; an altered request is refused (2.2) |
| R7 | v2 tag + canonical fields | met | `me-proof/2\n` + canonical JSON, strict parse (unit; 1.5). **Deviation to record:** the read fields add `op` and `identityHash` to the list in R7 |
| R8 | Signed by the registered agent key, not a page-derived key | partial | v2 verified only against the registered agent key; a v2 proof signed by another key not tested (N10) |
| R9 | Answer to the exact origin, once; only proof + public identity | met (test env) | 12.1; 14.1–14.2 (host received only `{bytes, signature}` and public identity fields) |
| R10 | Agent key generated in the agent, registered by it | met (test env) | random Ed25519, non-extractable, IndexedDB; survives reload, still non-exportable (13.1–13.3) |
| R11 | Claim + agent key + `agent-only` atomically | met (test env) | 0.1 (test verifier, single process); a registration from a non-agent page refused (9.1, Origin hurdle only) |
| R12 | New agent key only via an existing agent key or recovery | pending | no add-key operation exists in this cut; not tested (N14) |
| R13 | Validate -> reserve nonce -> execute | met (test env) | invalid signature does not burn the nonce (4.1–4.2) |
| R14 | Atomic, fail-closed | met (test env) | concurrent copies: exactly one execution (3.1); store unavailable -> 503 (5.1); single-threaded process only |
| R15 | Restart rule | met (test env) | proofs issued before the verifier's start refused (5.2); in-memory store + start time |
| R16 | Live revocation / `agent-only`, cache only stricter | partial | revocation read live (6.2); no cache exists to test (N20) |
| R17 | Recovery cannot turn `agent-only` off or register a key with old authority | pending | no recovery path in this cut (by design); not tested (N21) |
| R18 | Recovery in the agent with an independent factor | pending | out of the cut (N22) |
| R19 | Declared per-endpoint policy; unknown tag refused; no fallback | partial | the test verifier's endpoint declares `v2` / `v1+v2`; v1 refused on v2-only (8.2); unknown/wrong tag refused (`NOT_A_V2_PROOF`); policy not declared in the generator or the monad |
| R20 | `agent-only` refuses v1 everywhere | partial | refused on the test verifier's endpoint, even with a valid v1 signature (8.1, 8.4); keychain, recovery and real endpoints not covered |
| R21 | In-page signing entry points retired | pending | `SeedSessionProvider` sign-in, `signedRequest`, `signPayload`, `signAndWrite`, `deriveCleakerNode*`, seed exposure, UMD/scaffold exports all still sign (N24) |

Also shown: the agent page loads no third-party script (15.1); nothing was requested outside the test origins.

## Limits that hold regardless of coverage

- "Non-exportable" does not stop compromised code **inside the agent** from using the key.
- There is no unlock secret over the stored key; it is protected by the origin and the device only.
- The new identity's seed is dropped after registration: no recovery for it (out of the cut, by design).

## What a real verifier needs next (in tests first)

From the rows above, before any production change:
1. **A real verifier that speaks v2** for one resource, with its own security state: key registration with `agent-only`
   (R10–R12), atomic nonce reservation after validation, fail-closed, restart rule (R13–R15), live revocation (R16).
2. **Its endpoint policy declared** (R19), and **`agent-only` enforced on every endpoint of that verifier**, including
   keychain registration and anything recovery-like (R20).
3. **The negative tests rerun against it** (the same browser run with the verifier swapped), plus N10 and N14.
4. **CSP headers for the agent page** (R1 / N1).
Production login, existing identities and the in-page signing paths (R21) stay untouched in that step.
