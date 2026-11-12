# Evidence · server verifier map · 2026-11-10

**Kind:** dated evidence, not a requirement. It records what the verifiers check on this date. The
requirements are in [Identity-Custody-Contract.md](../Identity-Custody-Contract.md) (gate 2). The proposal
is in [Identity-Proof-Migration.md](../Identity-Proof-Migration.md).

**Method:** read-only. No tests were run: the coverage below comes from reading test names and assertions.
The live gateway files on the VM (`gateway-claims.json`, the installed nginx) were not read.

## Revisions

| Repo | Local | Production (r20261108-3) | Difference in the verifiers |
| --- | --- | --- | --- |
| monad | `1d174752` (fix/monads-control-null-origin-bypass; 3 dirty files). Local `main` `5d3d91c9` has diverged. | `8c253db3` = `origin/main` | Production is ahead: `records.ts` adds `reRootNamespaceClaims`; `keychain.ts`/`gatewayAuthority.ts` sign `signedNamespaceSpelling(...)`. The rest is identical. |
| netget | `e683571` (ancestor of main; the dirty `setNginxConfigRoutes.ts` touches no verifier) | `dc34f45` | `me_sig.lua`, `query_canon.lua`, `auth.lua`, `claim_identity.lua`, `adminSession.ts`, `gatewaySetupSession.ts` are identical. `localNetget.js` (`/domains`) differs. |
| me | `1831c65` | `fed754b` | `prove()`/`crypto.ts` are the same |

Lines are from the working tree unless they say "production".

## Verifiers

### netget `me_sig.lua` — `X-Me-Proof` (identical in production)

**Protects:**
- `/check-auth`;
- the control actions (`/openresty-*`, `/dev-server-*`, `/apps/catalog/*`);
- `/domains/metadata`;
- in the handlers: `/logs` (`logs.lua:28`), writes to `/networks`, `/apps/restart-all`.

| Property | Today |
| --- | --- |
| Algorithm / key | Ed25519. The key is `claims.pubkeys[proof.identityHash]` from `gateway-claims.json`, and the client key must equal it (:348-358). The outer `identityHash` is not compared with the signed one. |
| Key revoked | **Not checked live.** `pubkeys` is a cache refreshed from the monad; revocation lands only when that cache is refreshed. |
| method / path / query / bodyHash | yes (:247, :255 exact `ngx.var.uri`, :275-291 byte-exact canonical query, :297-304) |
| host / origin / audience / version / rootNamespace | **no** |
| Window | ±60 s on the signed timestamp (:306-313). No expiry field. |
| Nonce | `ngx.shared.gateway_nonces`, TTL 120 s, at least 16 characters (:316-329). **In memory** (lost when nginx restarts). **Not atomic** (`get` then `set`). **Consumed before the signature is checked** (:328 vs :356), and with `set` (LRU eviction), so forged proofs can push out real nonces. **Fail-open if the dict does not exist** (`if dict then`, :322). (Verified on the production copy.) |
| Authorization | Separate: me_sig only exposes the scopes. `operator_access.has_capability()` decides by the exact scope (`operator_access.lua:59-66`), and so does `localNetget.js` for `/domains/metadata`. |
| No header | Closed: 401 `ME_PROOF_REQUIRED`. With no claims file: 503. |

**Tests:**
- `tests/gateway-capability-model.test.ts`: BODY/METHOD/PATH mismatch, EXPIRED, REPLAY, REQUIRED.
- `tests/gateway-logs-capability.test.ts`: query mismatch/added/removed/cross-resource; valid proof without capability → 403; admin without capability → 403.
- `tests/gateway-query-canonicalization.test.ts`: TS/Lua parity.

**No test:**
- PUBKEY_MISMATCH, NOT_ANCHORED, SIGNATURE_INVALID;
- a missing dict;
- replay after a restart, a concurrent replay, eviction, a nonce burned by an invalid signature;
- revocation lag;
- replay against another gateway.

### netget `auth.lua` — `POST /me/auth`

- Key from `pubkeys`; canonical message; outer fields must match the signed ones.
- The challenge is a 64-hex server nonce (TTL 120 s; consumed with `get`+`delete`, not atomic).
- Window ±5 min.
- Not checked: origin, audience, revocation.
- It only returns identity and scopes; it grants nothing.
- No tests found.

### netget `claim_identity.lua` — `POST /me/claim`

- Verifies against the key the proof brings itself (first claim).
- The challenge is bound to POST `/me/claim`, ±60 s, same nonce pattern.
- The Node backend authorizes.

### netget `adminSession.ts` — bearer for `/logs` and the full `GET /domains` (production)

- Random server challenge, in memory, 2 min.
- The keychain key signs the raw challenge.
- **Key looked up live** at the monad (`active`, `claimIdentityHash`).
- Opaque token in memory, 30 min. Every use re-checks status and scopes.
- Not bound to the request content.
- Lost on restart (fails closed).
- Tests: `admin-session-live-keychain`, `gateway-admin-session-gate`, `gateway-admin-session-revocation`.

### netget `gatewaySetupSession.commitSignedClaim` — gateway claim

- The message is rebuilt by the server.
- The challenge is bound to the session and its state token.
- Live keychain key.
- The audience is `gatewayId`; the origin is not signed.
- The monad re-verifies on its own (`gatewayAuthority.ts:334-412`: 120 s, in-memory replay).
- Inherited gap: `resolveSurface` trusts unsigned heartbeats (CLAUDE.md, gap 2).

### netget endpoints with no signature verifier

- **`GET /domains`:**
  - Local HEAD has no auth at all.
  - Production returns a public projection to anyone and the full records only with an admin-session bearer (`gateway:read`).
- **`/add-domain`, `/update-domain`, `/delete-domain`:**
  - The only check is the nginx peer IP (`operatorOnly`). The backend checks no identity.
  - CORS uses `origin.includes('localhost')` (`proxy.js` production :49-61).

### monad

| Verifier | Endpoint | Key | Coverage | Time / replay | Authorization |
| --- | --- | --- | --- | --- | --- |
| `isNamespaceWriteAuthorized` (`replay.ts:415-451`) + head (`commandHandler.ts:297-327`) | `POST /`, `/api/v1/commit` | `claim.publicKey` (= the `prove()` key at claim time) | stable JSON of the body; requires `namespace`, `expectedHeadHash` | the chain head makes each write single-use (persistent) | holder only. **An unclaimed namespace accepts unsigned writes**, except `netget.*`, `keychain.*`, `daemon.gateways.*` and foreign namespaces |
| `openNamespace` (`records.ts`) | `/claims/open`, `/claims/signIn` | the proof's key must equal the claim's | `prove()` message; `rootNamespace` = the monad's root (audience); challenge `open:` | ±60 s, **but see F1**. Nonce map in memory, 60 s, consumed before the signature check. | holder |
| `resolveClaimIdentity` (`records.ts:134-173`) | `POST /claims` | the key the proof brings | `prove()`; challenge not checked; `rootNamespace` not checked | ±5 min, **see F1**; no nonce | 409 if already claimed |
| keychain (`keychain.ts:253-533`) | `/api/v1/keychain/*` | the claim key at bootstrap, then the active admin key (**revocation live**) | `{op, namespace, …, nonce, timestamp}` | ±120 s, in-memory nonce | `admin` on the acting key |
| gateway authority (`gatewayAuthority.ts`) | `/api/v1/gateway/:id/*` | active keychain key | `{op, gatewayId, namespace, target…, nonce, timestamp}` | ±120 s, in memory | `owner`/`admins` of the record |
| mesh announce (`meshAnnounce.ts`) | `/.mesh/announce` | the key the message brings; first key wins; allow-list fail-open if unconfigured | announce fields | ±2 min, no nonce | `identity_hash` not bound to the key (documented) |

Node/page grants exist only on `origin/feat/node-grants` and `origin/design/page-grants`. They are neither
local nor in production.

## F1 — freshness reads an unsigned field (production)

`records.ts:109-113` (production source, verified):
```ts
function normalizeProofTimestamp(proof, payload) {
  const direct = Number(proof.timestamp ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;   // outer, NOT signed
  return payload.timestamp;                                     // signed
}
```

- **`/claims/open`:** the open nonce is remembered for 60 s (`claimOpenNonce`, `OPEN_CHALLENGE_MAX_AGE_MS = 60 s`, :399/:427).
  - Once that has passed, a captured open proof can be resent with an outer `timestamp = now`.
  - It passes the window and the nonce check, and the response returns the namespace's memories.
  - A captured proof therefore works **indefinitely**.
- **`POST /claims`:** has the same bypass of its 5-min window.
- **Tests:** none. `persistentClaim.test.ts` and `signUpClaimFlow.test.ts:215` cover only immediate reuse.
- **Capture:** the proof travels in the request body. Code on the page, logs or an intermediary that sees it can reuse it.
- **This does not depend on the agent.** It is a defect in the current path, and it should be fixed as its own change.

**Update, same day — fixed locally, not in production.**
- **Where:** commit `b710c5ed` in worktree `~/.get/worktrees/monad-main` , pushed to `origin/main` (fast-forward of `8c253db3`). **Deployed to the VM 2026-11-10 22:10 UTC** (only records.js/.ts in live r20261108-3; probe on the live monad: before CLAIM_VERIFICATION_FAILED, after PROOF_TIMESTAMP_INVALID; backup /mnt/neuroverse/backups/f1-hotfix-20261110-221001).
- **The change:** `normalizeProofTimestamp` was removed. `resolveClaimIdentity` and `openNamespace` now use only `payload.timestamp`, the timestamp inside the signed message.
- **Test:** `tests/claimProofFreshness.test.ts`, 11 cases. It passes with the fix and fails 9/11 without it (reverted and re-run to confirm).
- **Other checks:**
  - `tsc` clean.
  - `persistentClaim` and `reRootClaims` green.
  - `claimSemanticSeeds` and `claimsOpenProfile` fail with or without the fix (pre-existing).
  - `signUpClaimFlow` does not load in that worktree: `js-sha3` is missing.
- **Not covered by this fix:** the nonce issues (here and in `me_sig.lua`) and v2.

## Answers

1. **Can today's verifiers accept an agent proof as an old one?** **Yes, at `me_sig.lua`.**
   - **Why:** the agent signs the same `prove()` message. Its challenge contains method, path, query, bodyHash, nonce and timestamp with the same names and encoding, and me_sig ignores `v`, `origin`, `audience` and `expiresAt`. The bytes are identical; nothing has to be re-encoded.
   - **Conditions:**
     - `pubkeys[identityHash]` on that gateway equals the agent's `prove()` key. That key does not depend on the gateway, so it is the same everywhere. Not verified on the real gateway: bootstrap stores the *keychain* key there.
     - The nonce is at least 16 characters.
     - The proof arrives within ±60 s.
     - The path is protected by me_sig.
   - **Result:** an approval the person saw as "audience A" works at gateway B and from any origin, and `expiresAt` does not shorten anything.
   - **The other verifiers reject it:**
     - `/claims/open`: no `open:`;
     - `/me/auth`: no server nonce;
     - `/me/claim`: POST + path required;
     - writes and keychain operations: require `expectedHeadHash`/`op`.
   - **Exception: monad `POST /claims` accepts any `prove()` as a first claim.** A host holding an agent proof could claim an *unclaimed* `<user>.<root>` with the person's key (within 5 min; indefinitely with F1).
   - **Today's resource:** production `GET /domains` does not use `X-Me-Proof`; it uses the bearer. Only the prototype (`agentResource.mjs`) checks `v`, `audience`, `origin` and `expiresAt`, and its nonce lives in memory and it does not check revocation.
2. **Can an old signature be replayed against another origin, host or audience?**
   - **me_sig:** yes. Origin, Host and rootNamespace are not bound. Within one nginx the nonce dict is shared by every door. Against another gateway that anchors the same key, it works within ±60 s. It also works after a restart, through eviction or through a race.
   - **monad open:** bound to the monad's root, but F1 makes it reusable.
   - **keychain / gateway operations:** bound to namespace and `gatewayId`, not to host or origin. Replayable within 120 s after a restart.
   - **Admin session:** a single challenge, but the bearer is reusable for 30 min from anywhere.
3. **Formats accepted today:**
   1. `X-Me-Proof` = base64url(`prove()`) with challenge `{method,path,query?,bodyHash,nonce,timestamp}` (me_sig).
   2. `prove()` with a hex server nonce (`/me/auth`).
   3. `prove()` with challenge `{POST,/me/claim,nonce,timestamp}` (`/me/claim`).
   4. `prove()` with any challenge, or none (monad `POST /claims`).
   5. `prove()` with `open:<nonce>` (`/claims/open`, `/claims/signIn`).
   6. Raw Ed25519 (or RSA/ECDSA, `replay.ts:88-91`) over stable JSON: writes `{…, namespace, expectedHeadHash}` and `op:` operations (keychain, gateway).
   7. Keychain key over a random server challenge → bearer (admin session).
   8. Keychain key over `netget-claim-gateway` rebuilt by the server.
   9. Mesh announce, signed by its own key.
   10. Hash-only `/me/auth` for admins with no anchored key.

   Formats 1–6 share a key, and **nothing separates them by an explicit context**: only the coincidence of required fields (`expectedHeadHash`, `op`, `open:`) keeps one from being accepted as another.

## Verified by re-reading

- F1 (production source).
- In `me_sig.lua`: nonce before the signature check, `get`/`set`, fail-open `if dict then` (production copy).
- `claimOpenNonce` before `verifyEd25519Signature`.
- The 5 min / 60 s constants.

## Not examined

- Which key is actually in `pubkeys` on the VM.
- Whether the installed nginx declares `lua_shared_dict gateway_nonces`.
- `monadsControl.ts`, `session.ts`, `internalToken.ts`, `appAuthorization.ts`, `groupAuthorization.ts`, `installationAuthorization.ts` in detail.
- Header stripping in `surface_proxy.lua`/`monad_proxy.lua`.
- Lua/Node parity on non-ASCII bytes.
- The cleaker repo has no server verifier.
