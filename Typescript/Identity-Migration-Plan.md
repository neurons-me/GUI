# Migrating `jabellae.cleaker.me` (gateway owner) to an agent-held identity: plan

Status: **plan only, nothing executed.** Written 2026-11-14. Companion to `Agent-Protocol.md` (R10–R21) and
`Identity-Access-Design.md` (§5 change-secret vs rotate-root). Production evidence is limited to public GETs and
earlier read-only VM checks; the VM was unreachable (443/22/ping) while this was written, so the 2026-11-09 server log
was not re-read.

## 0. Premises, corrected

- **v1 is the proof format, not the seed's origin.** A v1 proof is canonical JSON of
  `{identityHash, expression, namespace, rootNamespace, challenge, timestamp}` with no kdf or version tag
  (me `crypto.ts:1170`). The server claim (`ClaimRecord`, `PersistentClaimV1`) records no seed kind either. A public
  identityHash says nothing by itself about how guessable the seed is.
- **How `jabellae` was most likely created (evidence, no credentials used):**
  - Production state was wiped and reinstalled on 2026-11-09 (r20261108-2). The gateway was claimed at 01:55:20Z
    through the browser: setup-code → verify → keychain key → `/setup/claim`.
  - The interface then deployed was GUI `94e99b3b`. In that release, the only UI register path is `Claim.tsx`. It
    always generates a 12-word BIP-39 phrase (128 bits), derives the seed with HKDF from it
    (`recoveryPhrase.ts:28-29,81-97`), and passes it as `identityRootHex` to `registerWithCredentials`. The typed
    secret only wraps the local vault (`this.me.identity-vault:v1:<ns>`, PBKDF2 + AES-GCM). The compound
    name+secret seed is used only when `identityRootHex` is absent, and that release's UI never omits it.
  - `GatewaySetup.tsx` in that release signs nothing itself. It redirects to the Cleaker-origin claim view, which
    signs with the session already open there.
  - **Conclusion:** the historical flow is evidence, not certainty. The 2026-11-09 server log was not re-read.
    A local vault (`this.me.identity-vault:v1:jabellae.cleaker.me`) would not settle it either, because a vault can
    be written later by recovery or import (`RecoverAccount.tsx`, `linkExistingIdentity`).
- **Consequence for the threat model.** If phrase-derived, the public identityHash is not a practical offline target
  (128-bit phrase). The real exposures are custody exposures:
  - the seed has existed inside pages (the v1 model);
  - the vault in localStorage is offline-attackable if copied, and only as strong as the secret;
  - copies of the 12 words.
- **`identity-root.ts` is the kernel's at-rest encryption root.** It never produces a signing identity (only consumer:
  `deriveSecretMaterialV4`, me `crypto.ts:719-738`). The GUI reuses its *envelope* helpers around the identity seed;
  that is a naming collision only. This plan does not touch the kernel encryption root, and does not swap one
  material for the other.
- **Changing the secret that wraps a seed does not revoke a stolen copy of the seed.** Only moving authority to new
  material, and making every verifier refuse the old one, does.

## 1. What `jabellae` holds today

| Item | Where | Keyed by | Notes |
|---|---|---|---|
| Identity seed | client-side only (vault and/or 12 words) | — | identityHash = keccak("this.me/identity:v1::"+seed) |
| Claim | kernel `daemon.claims.jabellae__cleaker__me` (`records.ts:53-55`) + signed file `claims/<ns>.json` (`PersistentClaimV1`) | namespace | holds `identityHash`, `publicKey` (HKDF branch key for handle `jabellae`) |
| Claim-key authority | POST / (`commandHandler.ts:308-341`), `/api/v1/commit` (`syncHandler.ts:195-218`), keychain bootstrap/recover (`keychain.ts:289-300,519-539`), `/claims/open` (`records.ts:636`) | claim `publicKey` | read live from the kernel, no cache |
| Keychain keys | kernel `keychain.keys.<keyId>` | namespace | at least the one used for gateway setup; status read live |
| Gateway authority | kernel `daemon.gateways.<gatewayId>`: owner, admins, namespaces, pubkeys (`gatewayAuthority.ts:92-105`) | **identityHash** | owner can grant/revoke admin, transfer owner, set main server |
| netget cache | `~/.get/runtime/gateway-claims.json` + `.version` (`GatewayClaimsManager.ts:601-651`) | identityHash | read per call by isOwner/isAdmin/getScopes; Lua `me_sig.lua`/`auth.lua` trust its `pubkeys` |
| netget admin sessions | in-memory Map, 30 min TTL (`adminSession.ts:67-68`) | identityHash + namespace + keyId | re-checks isAdmin and keychain key on every use |
| App / group ownership | `apps.<id>` owner, `groups.<key>.owner` (`appAuthorization.ts:77-78`, `groupAuthorization.ts:44`) | identityHash | to inventory on the live state |
| Chain authorship | memory rows; author resolved at read time from the current claim (`Blockchain/blockchain.ts:33-45`) | — | past signatures are not re-verified (`memoryStore.ts:148` stores `signature: null`) |
| Monad session tokens | disabled (`http/session.ts:108-111`, 410) | — | none |

The monad's own SEED identity (kernel root, netget registration, gateway identity) is separate from `jabellae` and
**out of scope**: changing it would break hydration of the encrypted snapshot.

To complete on the live state (read-only, once the VM answers): list jabellae's keychain keys, every
`daemon.gateways.*` entry naming its identityHash, apps/groups it owns, and any other claim carrying the same
identityHash (see §6).

## 2. New material, custody, recovery

Generated **inside the agent**, never imported or rebuilt from the old seed or the 12 words (`Agent-Protocol.md` §5):

1. **Agent signing key:** WebCrypto Ed25519, non-extractable, in the agent's IndexedDB (exists: `agentKeys.ts`).
2. **New identity:** 32 random bytes → `new ME(seed)`, `'@'('jabellae')`. Its identityHash is new and unrelated to
   the old one. The seed is kept only until the registration is confirmed, then dropped (exists:
   `newPendingIdentity` / `confirmRegistered`).
3. **Independent recovery authority (to build, R18):** a separate Ed25519 key registered at migration time as the
   identity's recovery key. Proposal: generated in the agent, shown once as an offline backup (paper or a
   hardware-held copy), with only its public key kept by the agent and the server. Alternative or addition: a second
   linked agent device.

Recovery rules:

- Recovery registers a new agent key only with a signature from the recovery key, or from another active agent
  device.
- It never accepts a v1 proof, the HKDF branch key, the old seed, or the 12 words (R17, N21, N22). The old material
  stays dead after recovery.
- Losing every agent device *and* the recovery key means losing the identity. That is a stated trade-off, not a
  fallback to the old seed.

## 3. Authorizing the transition, keeping the name and access

**Requirement.** Someone holding a copy of the old seed must not be able to win the migration. The old authority is
therefore necessary but not sufficient.

**Proposed operation: `namespace-rebind`.** It is new; today a claim is immutable (`claimNamespace` returns
NAMESPACE_TAKEN, `daemon.*` is reserved against generic writes). One request, two signatures and one
authorization code:

1. **New agent key (me-proof/2)**, over `{namespace, oldIdentityHash, newIdentityHash, agentKey, recoveryKey,
   gatewayIds, nonce, audience, expiry}`.
2. **Old claim key (v1)**, over the hash of that same statement. This is the only time the old material is used.
   Preferably the agent loads the existing vault, signs, and wipes it; the seed should not travel into a new page.
3. **Operator authorization code** (not a signature), issued by the CLI on the VM (`netget setup-code`, or a new
   `monads rebind-code`). Machine access is the out-of-band factor a seed thief lacks; the gateway claim already
   relies on the same factor. The code must:
   - **expire** within minutes;
   - be **single use**, consumed durably together with the commit, so a retry after an uncertain save is
     recognised as the same rebind rather than as a second use;
   - be **bound to the exact content**: the operator sees, and the code covers, the statement hash, i.e.
     namespace, old and new identityHash, agent key, recovery key, and gateway ids. Any other statement is refused.

**Commit point and projections.** Kernel, claim file, netget cache, Lua and sessions cannot change in one atomic
step. The design therefore names a single commit point and treats everything else as a projection that is
recovered from it.

- **Commit point:** one kernel memory, `daemon.rebinds.<namespace>`, holding the full statement, the consumed code
  id and the resulting state. It is durable once the snapshot is renamed *and* the directory fsync is confirmed.
  - Before that point the old state is authoritative.
  - After it, the new state is authoritative.
  - If the save is uncertain, the result is 503 UNCONFIRMED, with the same semantics as agent registration. A
    retry of the identical statement is confirmed; any other statement is refused.
- **In-kernel effects, written in the same synchronous step as the commit memory:** the claim record, the
  tombstone, keychain revocations, gateway substitution, and apps/groups re-owning. They are not separate commits.
- **Projections, each idempotent and re-derivable from the commit memory:**

  | Projection | Recovered by |
  |---|---|
  | Persistent claim file | startup reconciliation re-issues it if it disagrees with the kernel record |
  | netget `gateway-claims.json` | materialize; the rebind is reported complete only after the file is re-read and matches |
  | Lua caches | `.version` bump |
  | netget admin sessions | flushed on materialize; they re-check per use anyway |

  While a projection is stale, the monad-side tombstone must still refuse the old identity. Each projection's
  staleness is a tested failure mode, not an assumption.

**Server effect** (all inside the commit step above):

- The claim record becomes `{identityHash: new, publicKey: agent-bound, authority: agent-only}`. The persistent
  claim file is re-issued.
- A tombstone `daemon.revokedIdentities.<oldIdentityHash> = {namespace, at, by: rebindHash}` is written.
- All keychain keys of the namespace are revoked.
- In each `daemon.gateways.*` where the old identity is owner or admin, the new identity is substituted directly:
  owner/admins/namespaces/pubkeys move, and the old pubkey is deleted. This is not done as grant + transfer, because
  those require v1 keychain keys, which an agent-only identity must refuse (R20).
- Apps and groups owned by the old identityHash are re-owned.
- One chain memory is written recording the rebind (old → new, statement hash).

The name stays `jabellae.cleaker.me`; gateway ownership is never vacant.

## 4. Revoking the old authority: verifiers, sessions, caches

| Surface | After rebind | Why |
|---|---|---|
| POST /, /commit, keychain bootstrap/recover, /claims/open | refuse old key | they read `getClaim().publicKey` live; the claim now holds the new key |
| v1 for this namespace (any endpoint) | refused | agent-only (R20). **Gap:** `resolveActingIdentity` checks agent-only only for the acting *namespace* |
| Keychain keys | revoked | revoked in the same step |
| Gateway authority (monad) | old identityHash absent | substituted in the same step, plus the tombstone check below |
| Any claim carrying the old identityHash | refused everywhere | tombstone checked in `isNamespaceWriteAuthorized`, `resolveActingIdentity`, keychain, claims |
| netget `gateway-claims.json` | rewritten | `materializeFromGatewayAuthority`. It **keeps the stale file when the monad cannot be read** (no retry), so the rebind is complete only after the file is re-read and checked |
| Lua `me_sig.lua` / `auth.lua` | old pubkey gone | `_claims_cache` is gated on `.version`. `legacy_hash_auth` (`auth.lua:505-547`) accepts an admin with no pubkey by hash alone; it must refuse tombstoned hashes and must never see an empty `pubkeys[owner]` |
| netget admin sessions | dead on next use | they re-check isAdmin per use; also flush on materialize |
| `/__gateway/claim` → `registerIdentity` (`claim_identity.lua`) | must not re-add the old key | believed closed in monad-mounted mode; to confirm, including the standalone backend |
| Chain authorship | decision needed | authors resolve from the current claim, so old memories would display the new identity. The rebind memory preserves history; display policy is open |
| Write freshness | check | genesis = hash(identityHash:createdAt) (`replay.ts:418-431`); a new identityHash changes the chain head. Test it |

## 5. Verification on a test gateway (disposable, local loop)

Rig: the local loop (`~/.get/dev/agent-local`, cleaker.me @ 127.0.0.1:8171) plus a disposable netget/OpenResty.

Setup:

- Create a test owner the same way production was created: GUI `Claim.tsx` phrase flow.
- Set up a keychain key, claim the gateway, grant one extra admin, own one app.
- Snapshot the state for repeat runs.

Happy path:

- Rebind with all three signatures.
- Then check that the new identity can act as owner (grant/revoke admin, main server) with v2.
- The name resolves; claim-status is unchanged; the gateway is never ownerless.

Negative tests (each must be refused):

1. Old claim key on POST /, /commit, keychain recover, /claims/open.
2. Old keychain key on gateway grant/transfer/main-server.
3. An old netget admin session, on its next use.
4. Lua `me_sig` with the old pubkey; `legacy_hash_auth` with the old hash.
5. Recovery with the 12 words or the old seed.
6. Rebind without the operator code, or with a code bound to another statement.
7. Rebind signed only by the old key (thief scenario), or only by the new key.
8. A new claim on another name declaring the old or the new identityHash (see §6).
9. Two concurrent rebinds: exactly one winner.

Failures midway (fault injection like `agentRegistrationDurability.process.test.ts`, flag files wrapping `fs.fsyncSync`):

- Kill before the snapshot rename: old state is intact, and a retry works.
- Directory fsync fails after the rename: 503 UNCONFIRMED. A retry of the same statement is confirmed; a different
  statement is refused.
- Kill after saving, before the claim file is re-issued: startup reconciles from the kernel record and the file is
  re-issued.
- Materialize fails: the gateway file is stale. Lua must not accept the old key; at minimum the tombstone is
  enforced at the monad. The operator re-runs materialize, and the file is verified.
- Restart between every step: nothing reverts to the old identity.

## 6. Blocker found while mapping: reproduced and fixed locally (2026-11-14)

**Status.**
- Reproduced on a disposable monad with a fictitious owner (`tests/Security/identityHashImpersonation.test.ts`). Every
  step succeeded on `main` 7488d31f. The impostor's re-bootstrap also re-anchored the owner's namespace onto the
  impostor.
- Fixed in monad commit `2bde6cef`: claim-side binding plus identity-link proof, and gateway-side anchored namespace.
  It is local, not pushed or deployed. 4 of 6 new tests fail on the old code.
- Review of `2bde6cef` (owner, 2026-11-14) found three gaps:
  1. the duplicate check enumerated the claim files, a projection;
  2. netget authorized by hash;
  3. any duplicate could sign an identity-link.
- Monad commit `9cefd6c2` (local) closes gaps 1 and 3:
  - **Anchor in kernel state.** `daemon.identities.<identityHash>` holds the first namespace, written in the same
    kernel step and snapshot as that claim. Claims from before the index are derived from the kernel's own memory log
    (earliest `createdAt`), never from files.
  - **Link only from the anchor.** An identity-link is accepted only when signed by the anchor's claim key. An older
    duplicate cannot sign one, a namespace that was itself linked cannot sign one, and neither can a holder whose
    claim records a non-v1 `authority` (agent-only), so the v1 key cannot get around agent-only.
  - **Tests.** Claim file removed plus a real process restart; old state with no index and no file; link from a
    duplicate; link from an agent-only holder. All 4 fail on `2bde6cef`.
  - **Suite.** 80/80 files, 755 green plus 1 todo. `signUpClaimFlow` was actually run, with temporary resolution
    links, and passes; reading it was not enough to claim it was unaffected.
- netget, local and uncommitted in `~/.get/worktrees/netget-main` on `cfbcb93`:
  - **Snapshot carries the binding.** The snapshot carries `namespaces`, copied from the monad's gateway-authority
    record.
  - **Session bound at issue and resolve.** An admin session is issued only for a key of the anchored namespace, and
    every resolve re-checks the anchor and the key's current claim identity.
  - **Missing binding refuses.** A snapshot without the binding refuses (`GATEWAY_BINDING_MISSING`). It is not
    refreshed from that path, because the path is reachable before authentication.
  - **Lua.** `/me/auth`'s proof-less hash path now refuses.
  - **Proof against the current code.** On the current netget code, a legitimately linked second namespace of the
    same identity minted an admin session; with the change it is refused.
- Client, done locally (2026-11-14):
  - **cleaker `54d571b`.** `node.claim({ namespace, link })` builds the proof first. It then asks for the link over
    exactly that proof's namespace as sent, identityHash and public key (the key the monad registers), and sends the
    unchanged proof with the link. That is one proof per attempt, so no provisional key.
  - **GUI `1f18cac5`.** `createCleakerSession` (identityFrom) signs the link with the key derived from the held root
    for the source handle. The source is the open link of that identity on the same root and transport; if there is
    none, no link is sent (a cross-ledger link needs none).
  - **Real client, on disposable monads (meshfix code).** `link-existing.live` passes 25/25:
    - the anchor's link works and writes;
    - an altered link request is refused and leaves no claim, no open link and no change to what is held;
    - a linked name cannot sign further links.

    Without the GUI change the same-ledger link fails with `IDENTITY_TAKEN`. `continuity` 20/20 and `combinations`
    252/252 still pass. `addressed-reads` and `audience-ledgers` were not run: they need a `me-export-audience`
    checkout that does not exist here.
- Precaution 1 (monad `c9955e7d`): the earliest claim is a compatibility rule, not proof.
  - A gateway record's anchor is the identity's anchor and is never displaced by an older duplicate.
  - These states resolve to "ambiguous", and every claim and link for that identity is refused and logged:
    - gateways disagree with each other;
    - a gateway anchor's claim no longer carries the identity;
    - the index disagrees with the gateway.
  - Choosing the earliest among several legacy claims is logged.
  - The 2 new tests fail on `9cefd6c2`. Suite 80 files, 757 green plus 1 todo.
- Precaution 2 (netget `5e20fbf`): `netget gateway-claims-refresh`.
  - **Origin.** Configured monad only: `NETGET_MONAD_ORIGIN`, or the running netget monad's record. Loopback only, and
    it never starts a monad.
  - **Refusals.** It writes nothing when the record is unconfirmed, has no owner, or leaves an admin without a
    namespace. It refuses an owner different from the cached one unless `--accept-owner-change`.
  - **Read back.** It reads the file back after writing.
  - **Test.** `gateway-claims-refresh.test.ts`, against a real bootstrap:
    - the pre-upgrade cache gives no session;
    - after the refresh the owner gets a session, and the same identity on a linked namespace is still refused;
    - every refusal leaves the file byte-identical.
- Kit steps this adds (rehearsal pending):
  1. Back up `gateway-claims.json` (and its `.version`).
  2. Deploy monad, then netget. The GUI and the UMD build are copied where netget serves them.
  3. Run `netget gateway-claims-refresh` on the VM and read its summary: owner, anchored namespace, admins all bound.
  4. Prove behavior, not just a working public endpoint:
     - the owner signs in to netget admin (real session);
     - a non-anchored namespace of the same identity is refused;
     - `/me/auth` without a proof is refused.
  5. Rollback: restore the previous release and the backed-up `gateway-claims.json`.
     - The old code ignores `namespaces` and `daemon.identities`, so neither needs undoing.
     - Claims linked under the new code remain valid claims for the old code.
- Coordinated kit rehearsed (2026-11-15): `deployment-kits/identity-20261114/identity-kit-20261115.tar.gz`
  (sha256 `4b92086e…88b0`).
  - **Contents.** 21 files from fixed commits (monad, netget, front end). The front end was rebuilt from the deployed
    sources plus the two client commits; the unpatched rebuild matches the deployed bundle byte for byte.
  - **Old hashes** are the EXPECTED VM state; `check` on the VM must confirm them.
  - **Rehearsal** (real monad, a fictitious owner bootstrapped with the old code):
    - **Old code:** a duplicate claim's admin session passes the gate.
    - **Injected failure:** a gateway admin without a namespace makes the refresh refuse; it rolls back automatically,
      with old code, old cache bytes and the history kept.
    - **New code:** after apply and refresh,
      - the owner's session is honored;
      - the duplicate and the linked namespace are refused (`NAMESPACE_NOT_ANCHORED`);
      - an impostor claim leaves nothing;
      - the GUI link passes 25/25 from the patched sources.
    - **Explicit rollback:** cache restored, history kept; re-apply works.
  - **Not covered:** the real VM, the built bundle in a browser, Lua `/me/auth`, and the agent.
- Not yet done:
  - VM back, then a read-only comparison with the expected state, then `kit.py check` there; activation only on the
    owner's go;
  - agent rebased (2026-11-15). `dev/agent-local` now has 4 agent commits on top of `c9955e7d`, plus `e31e56ce`
    (old tip `de5bf982`; local, not pushed).
    - The agent registration writes the identity anchor inside `commitAgentRegistration`. It shares the step and
      snapshot of the claim, the agent-only mark, the key and the index. A failed save undoes it with the claim; an
      unconfirmed save keeps it.
    - New tests with the real implementation:
      - a second name for an agent-only identity is refused, also when its own v1 key (from the same seed) signs the
        identity-link; no claim is left and nothing is written;
      - an agent registration cannot take an identity a v1 claim already anchors.
    - Results:
      - suite 82 files, 778 green plus 1 todo;
      - the agent browser test against the rebased monad passes all sections, including the lost answer and the
        uncertain save with kill and restart;
      - the local loop, rebuilt with the existing state kept: the walk works and the pre-existing identity is still
        claimed.
    - The agent is not in the identity kit.
  - comparison with the deployed code, which waits for the VM.

The original analysis follows.

**A v1 claim does not bind identityHash to its key.** `resolveClaimIdentity` (`records.ts:131-177`) takes
identityHash from the signed message, signed by whatever key the caller brings. `IDENTITY_TAKEN` is enforced only for
agent identities (`records.ts:345`).

`resolveActingIdentity` (`gatewayAuthority.ts:494-527`) then takes the acting identity from the acting namespace's
claim. It checks `record.admins[actingIdentity]` without checking `record.namespaces[actingIdentity] === namespace`
or the acting key against `record.pubkeys`.

**Read together:**

1. Claim any free name declaring the owner's public identityHash, with a fresh key.
2. Bootstrap a keychain key with that claim key.
3. Act as gateway owner: grant admin, transfer owner, set main server.

The public identityHash is the input, so this is the real reason that hash matters, not offline guessing. It would
also defeat the migration: the new identityHash becomes public too.

Proposed fix, before anything else:

- Gateway checks bind identity + namespace + anchored pubkey.
- A claim declaring an identityHash already held by another claim is refused, unless it is the explicit
  `linkExistingIdentity` path with proof from the existing holder.
- Failing-first test, rehearsed kit, deploy on the owner's go.

Production exposure is to be judged from deployed code and config only, with no attack writes.

## 7. Order of work

1. Reproduce §6 on a disposable monad; fix it; kit; deploy on go.
2. Gateway verifiers accept agent-key (v2) proofs, so an agent-only owner can operate the gateway.
3. Tombstone check in every verifier listed in §4; Lua `legacy_hash_auth` hardening; confirm `/__gateway/claim`.
4. Recovery authority (agent + server), R17–R18.
5. `namespace-rebind` + operator code + reconciliation on startup.
6. §5 suite green on the local rig, then a rehearsed kit.
7. Live inventory on the VM (read-only). Then the real rebind, with the owner present.
8. Retiring the old authority (wiping the vault, declaring the 12 words dead) happens only **after** the independent
   recovery is registered on the live identity *and* one recovery has been exercised end to end on the test rig and
   checked against the live registration. Until then the old material is not called irrevocably retired.

## 8. Open decisions

- Recovery authority: offline key, second device, or both.
- Operator factor: reuse `netget setup-code`, or a dedicated rebind code.
- Chain display of pre-rebind authorship.
- Whether `linkExistingIdentity` (same seed, new name) survives at all once identities are agent-held.
- Correlation and privacy of public identityHashes: a separate policy question, not part of this plan.
