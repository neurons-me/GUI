# Gateway bootstrap through the agent: the server path (design contract, proposal)

**Status:** proposal, 2026-11-15. **Implemented locally** on disposable infrastructure only (not pushed or deployed):
- monad `53ab050f` (branch `dev/agent-local`; v2 branch `f6a17926`, `definitive` in `639d7234` and `1fb61fef`, owner on disk in `53ab050f`): the v2 branch and its tests;
- netget `f6227ed` (local `main`): `POST /setup/claim-agent` and its test;
- browser journey: `tests/integration/agentBootstrapReal.browser.test.mjs` (GUI, uncommitted; it needs the GUI's
  uncommitted §3a agent code), 11/11.

It authorizes no deployment. It defines what netget
and the monad must verify so that the agent's admitted `call` `netget.gateway.bootstrap` ([Agent-Protocol.md](Agent-Protocol.md)
§3a, built in the GUI) can claim a real **test** gateway, with no seed in the app. Requirements are **B1…**, negative
tests **BN1…**.

**The one rule that does not move.** The v1 refusal for agent-only identities (`V1_REFUSED_AGENT_ONLY`, at the top of
`bootstrapGatewayAuthority` and every gateway action) stays as it is.

- **The v2 path is a separate branch, chosen by its signed, versioned format.** A request is v2 when it carries a
  `proof` whose signed bytes start with the version tag `me-proof/2\n`. The shape of the body does not decide it.
- **Once v2, a failure is final.** A v2 request that fails any check is refused. It is never retried as v1, and no v1
  field is read from it.
- **A v1 request is one with no `proof` at all**; it keeps the existing checks, including the refusal.
- **Ambiguity is refused.** A `proof` together with v1 fields, or a `proof` with another tag, is refused.

## 1. Who does what

| Party | Holds | Decides |
|---|---|---|
| Agent (`cleaker.me`) | the seed and the agent key | what the person approved: signs `me-proof/2` `call` over `{gatewayId, challenge}` |
| App (netget's setup page) | the setup token, the netget `state`, then the proof | nothing; carries the proof |
| netget | the setup session: code unlocked, `challenge`, `state`, `callbackOrigin`, expiry | that this proof answers **its** challenge in **its** session, from the expected page; writes the installation authorization; forwards |
| Monad (the authority) | gateway authority, claims, agent keys, nonces | that the signature, key, identity, anchor, authorization and challenge all hold **on its own state**, then bootstraps |

## 2. The flow

1. The operator unlocks the setup session with the install code (unchanged).
2. The page asks netget for a challenge (`issueClaimChallenge`) and receives `{challenge, gatewayId, state}`.
3. The page asks the agent for `call` `netget.gateway.bootstrap`, with body `{gatewayId, challenge}`. The audience is
   the origin the page talks to. The person approves in the agent, and the page receives `{bytes, signature}` plus the
   public identity.
4. The page sends `{setupToken, state, proof}` to netget (a new commit route next to the v1 one; the v1 route
   unchanged). The body is not sent: netget rebuilds it from its own session.
5. netget checks (B1–B4), issues the installation authorization, and forwards `{proof, body}` to the monad's bootstrap
   route.
6. The monad checks (B5–B12) and bootstraps.
7. netget refreshes the cache (the checked refresh) and consumes the session.

## 3. netget

| | Requirement | Negative tests |
|---|---|---|
| B1 | **The session is netget's own.** It is unlocked and unconsumed, and `state` matches (timing-safe). The proof is parsed as v2 `call` with kind `netget.gateway.bootstrap`. | BN1, BN2 |
| B2 | **netget produces exactly the approved body; it changes nothing that was signed.** The body is `{gatewayId: record.gatewayId, challenge: record.challenge}`, taken from netget's own session rather than from the app, and `sha256(canonicalBody(body))` must equal the signed `bodyHash`. The signed `path` must be `/api/v1/gateway/<record.gatewayId>/bootstrap`. Any difference is a refusal: netget never adjusts a field to make it match, and a different body needs a new approval in the agent. | BN3, BN4 |
| B3 | **The origin is the expected page.** The signed `origin` equals both the browser `Origin` of this request and the session's `callbackOrigin`. | BN5 |
| B4 | **The target is netget's own monad.** It is resolved for the signed `namespace` and confirmed as netget's locally managed monad (`verifyOwnMonadSurface`), as the v1 path does, before anything is written. The installation authorization is written for `(gatewayId, namespace, identityHash)` from the signed fields, until the session expires. | BN6 |

## 4. Monad: the v2 branch of `POST /api/v1/gateway/:gatewayId/bootstrap`

| | Requirement | Negative tests |
|---|---|---|
| B5 | **Branch by shape.** A request with `proof.bytes` is v2 and goes only through B6–B12. Anything else is v1 and goes through the existing path, including `V1_REFUSED_AGENT_ONLY`. No field makes v1 skip that check. | BN7, BN8 |
| B6 | **Only from its own netget.** It carries the internal token over loopback. netget also passes the browser origin it verified (B3). A direct call from a page, or from anything else, is refused. | BN9 |
| B7 | **The exact operation.** `op: call`, `kind: netget.gateway.bootstrap`, `method: POST`. `path` equals this route for `:gatewayId`. The body has exactly `{challenge, gatewayId}` with `gatewayId` equal to the route's. `bodyHash` is recomputed. `audience` is one of this monad's agent audiences. The time window holds. `origin` equals the origin netget verified. | BN3, BN4, BN10, BN11 |
| B8 | **The identity, as the monad itself holds it.** The claim at the signed `namespace` is agent-only, carries the signed `identityHash`, and is that identity's **anchor** (`resolveIdentityAnchor`; ambiguous → refuse). The agent key `keyId` is active, read live, and the signature verifies with it. | BN12, BN13, BN14 |
| B9 | **The setup was done.** An unconsumed installation authorization exists for exactly `(gatewayId, namespace, identityHash)`. | BN15 |
| B10 | **Single use.** The agent nonce is reserved atomically after validation, fail-closed (R13–R14), and the netget challenge is refused if seen before for this gateway. | BN16 |
| B10a | **One persistent confirmation point**, the owner record on disk. The installation authorization goes to *in-flight*. The owner record is written and saved with `saveSnapshotOrThrow`, then read back from disk: **that** is the commit. Only after it is the authorization marked *consumed*. Before the commit, any failure puts the authorization back to *pending*: no owner, nothing spent that a new approval cannot redo (a new challenge from netget, a new nonce from the agent). After the commit, a failure in the bookkeeping is reported as success (the existing v1 rule). The record keeps the digest of the proof that bootstrapped it. | BN19, BN20 |
| B10c | **Definitive or uncertain, said in the answer.** Every refusal carries `definitive`, including the early ones (`NOT_A_V2_CALL`, `AMBIGUOUS_PROOF`, `NOT_FROM_GATEWAY`), which are answered before any state is read and are definitive. Two errors are not definitive. With `BOOTSTRAP_UNCONFIRMED`, the save failed and the disk could not be read back: nothing is undone, and the same proof settles it. With `STATE_UNREADABLE`, the disk could not be read before deciding, so nothing was written. A caller (netget) closes what it opened for an attempt **only** on `definitive: true`. No answer, or a timeout, is also not definitive. | BN19, BN19b |
| B10d | **Whether the owner is on disk, said by the monad.** `GET .../authority?ownerOnDisk=1`, internal token only (it reads the whole snapshot), adds `ownerOnDisk`: `yes` (the disk holds the owner memory shows), `no` (the disk holds no owner), `unknown` (unreadable, or a different owner). A caller decides on it rather than on the installation-authorization file: `in-flight` does not prove the owner is missing (BN20). For netget: `unknown` → uncertain, `yes` → `ALREADY_BOOTSTRAPPED`, `no` → go on. | BN19b, BN20 |
| B10b | **A lost answer is confirmed, not executed twice.** The same proof again (same digest), for a gateway whose durable owner is that identity at that namespace, is answered `200 alreadyBootstrapped` with no new write. Its nonce does not matter. Any other proof, by the same identity or another, finds `ALREADY_BOOTSTRAPPED` (there is no v2 re-bootstrap in this cut). The netget session is consumed only after netget has read the durable owner back. | BN21 |
| B11 | **No other owner.** If the gateway is already bootstrapped, the answer is `ALREADY_BOOTSTRAPPED`, as today. | BN17 |
| B12 | **The same record as v1, plus what v2 means.** Owner, admin, and `namespaces[identity] = namespace`. The agent-only owner has no v1 key, so no v1 pubkey is anchored for the Lua `me_sig` path: Lua-protected admin routes stay closed to it until they accept v2 (stated limit, section 6). | BN18 |

## 5. Negative tests (each must fail before its B is called met)

| | Attempt | Expected |
|---|---|---|
| BN1 | No setup session, a consumed one, or an expired one | refused, nothing written |
| BN2 | A wrong or missing `state` | refused |
| BN3 | A proof whose `bodyHash` covers another challenge or gatewayId (the app replaces the body) | refused at netget and at the monad |
| BN4 | A proof whose `path` names another gateway | refused |
| BN5 | Signed origin ≠ browser Origin, or ≠ the session's callback origin | refused |
| BN6 | The namespace resolves to a surface that is not netget's own monad | refused before any write |
| BN7 | A v1 body for an agent-only namespace, at the same route | `V1_REFUSED_AGENT_ONLY`, unchanged |
| BN8 | A v1 body that also carries `proof.bytes`, or a v2 body with v1 fields | refused (one shape only) |
| BN9 | The v2 bootstrap posted directly to the monad, with no internal token | refused |
| BN10 | Another `kind`, `op`, method or audience | refused |
| BN11 | Outside the time window | refused |
| BN12 | The namespace is not agent-only, or is held by another identityHash | refused |
| BN13 | The namespace is the identity's linked (non-anchor) namespace, or the anchor is ambiguous | refused |
| BN14 | The agent key is revoked, unknown, or a different one; or the signature is bad | refused |
| BN15 | No installation authorization, one for another namespace or identity, or a consumed one | refused |
| BN16 | The same proof or challenge again | refused (replay) |
| BN17 | Another identity after a successful bootstrap | `ALREADY_BOOTSTRAPPED` |
| BN18 | After success | the record anchors the namespace; the netget cache refresh binds it; the owner is the identity, nobody else |
| BN19 | The snapshot save fails during the bootstrap, the disk still reads | `definitive: true`; no owner; authorization back to *pending*; a new approval succeeds |
| BN19b | The save fails and the disk cannot be read back | `BOOTSTRAP_UNCONFIRMED`, `definitive: false`; nothing undone; the same proof later saves again and confirms once; a caller must not close its authorization |
| BN20 | The bookkeeping fails after the save | reported as success; the authorization stays *in-flight*; `ownerOnDisk` is `yes`; another approval gets a definitive `ALREADY_BOOTSTRAPPED` |
| BN21 | The answer is lost after the commit and the same proof is sent again (directly, and through netget) | `200 alreadyBootstrapped`, exactly one owner write; netget then consumes its session |
| BN22 | A v2 request that fails, sent with v1 fields alongside | refused; never verified as v1 |

## 6. What this does not give yet (stated)

- **Administration afterwards.** An agent-only owner has no keychain device key, so neither netget's admin session
  (`verifyAdminSessionChallenge`) nor Lua `me_sig` works for it.
  - The owner of a gateway bootstrapped this way can't use the admin panel yet. Each later gateway action needs either
    its own admitted `call`, or the resource session of [App-Session-Contract.md](App-Session-Contract.md) at netget,
    which grants no administration by itself.
  - This is the next piece after the bootstrap, not part of it.
- **A real gateway.** The scope is disposable infrastructure: a test gateway, test identities, and a fixture install
  code. Nothing on the VM.
- **The `call` itself.** It is the GUI's (§3a, in progress). This path verifies what it signs and does not change it.

## 7. Done means (disposable rig)

1. A real compiled monad with in-process netget, a real setup session and install code, and the agent page from the
   GUI working tree.
2. A browser drives it: create a new identity in the agent, then from the setup page request, approve and claim.
3. Bootstrap succeeds, and the app never saw the seed (as `agentMonad.browser` checks).
4. The authority record and the refreshed cache name that identity and its anchored namespace.
5. BN1–BN18 pass as negative tests on the real server code.
