# Monad as the first real verifier: domain projection and agent-only inventory (2026-11-12)

**Kind:** dated evidence before implementation (Agent-Protocol.md, option A: the monad first, disposable environment).
Code read at monad `30d96d24` (= origin/main) and netget `main` `dc34f45`. Nothing changed.

## 1. Is the monad's domain projection adequate? Not as it stands

**The gateway's policy for `GET /domains`** (netget backend `routes/localNetget.js`, `mayReadGatewayConfig`):
- anyone gets the allow-listed projection `publicDomainView` (`gateway/domainsProjection.mjs`): `domain`, `type`,
  `subdomain`, plus `tlsConfigured`;
- the full configuration (target, certificate and key paths, contact, …) only to an admin session with a verified
  bearer and scope `gateway:read`.

**Where the records live:** in the monad's kernel, at `users.<owner>.domains.<key>.*`, with an index at
`users.netget.domainIndex` (netget `kernel/domainStore.ts`). The monad applies **no read policy** to these paths:
`isNetgetReservedPath` (`claim/netget.ts`) only guards writes to unclaimed namespaces.

**Observed on production (2026-11-11 root inventory, `/blocks` of `cleaker.me`):** domain record fields published
anonymously include `target`, `sslCertificate`, `sslCertificateKey`, `sslMode`, `type`, `owner`, `identity`,
`registered`. That is more than the gateway's anonymous projection, and the fields the gateway gives only to
`gateway:read` admins. (`sslCertificate` / `sslCertificateKey` are expected to hold **file paths**, not certificate or
private-key contents; that the values are paths has not been verified here, and no exposure of key material is
claimed.) **The monad's chain already bypasses the gateway's policy** for domains (the same finding as
[Root-Endpoint-Publication-Review.md](../Root-Endpoint-Publication-Review.md)).

Consequence for the cut: a new protected read in the monad that mirrors the gateway (projection for everyone, full
configuration only with real authority) is consistent with the gateway; but it **guarantees nothing** while `/`,
`/blocks`, `/blockchain` and `/@*` publish the same records unfiltered. Either the publication of
`users.*.domains.*` (and `domainIndex`) is restricted in those outputs as part of this cut, or the read is built with
this bypass stated as an open limit.

**Decision (owner, 2026-11-12):** no new domain authorization in the monad (netget already has the policy; duplicating
it could produce different decisions). Order: (1) close the alternative outputs of domain data in the monad, as a
separate earlier fix, without modifying the stored chain; (2) investigate `POST /users`; (3) v2 and `agent-only` in a
disposable monad, refusing formats not yet adapted for those identities; (4) the domain read integrated in netget,
which verifies the proof and applies its existing policy, with the monad providing key state.

## 2. Every monad path that registers keys, recovers authority or accepts an identity's old authority

`agent-only` must hold on all of them, not only on the new endpoint (Agent-Protocol.md R20). Today none knows
`agent-only`.

| # | Path | What it does | How it authenticates the identity today | What `agent-only` must do | Test to write |
|---|---|---|---|---|---|
| P1 | `POST /claims` | claim (register) a namespace | `prove()` proof (v1), `resolveClaimIdentity` | refuse a re-claim/overwrite of an `agent-only` identity; new agent identities register only through the atomic v2 registration | v1 claim for an agent-only identity -> refused |
| P2 | `POST /claims/signIn`, `POST /claims/open` | open a namespace (sign-in), returns its memories | `prove()` proof (v1), `openNamespace` | refuse v1 for `agent-only` (sign-in through the agent: v2) | v1 open -> refused |
| P3 | `POST /me/kernel:claim/<ns>`, `POST /me/kernel:open/<ns>` (`meCommandHandler`) | same claim / open through the kernel command surface | v1 proof | same as P1 / P2 | both refused |
| P4 | `POST /` with `op: claim` / `op: open` (`rootCompatHandler`) | same, compatibility surface | v1 proof | same as P1 / P2 | both refused |
| P5 | `POST /` (`rootCommandHandler`) | write a memory to a namespace | signature by the claim key (`isNamespaceWriteAuthorized`, chain head) | refuse claim-key writes for `agent-only` (v2 writes later, with idempotency) | claim-key write -> refused |
| P6 | `POST /api/v1/commit` (`commitHandler`) | signed batch of events | claim-key signature, group/app authorization | same as P5 | claim-key commit -> refused |
| P7 | `POST /api/v1/keychain/keys` | register a keychain key (first one bootstraps as admin) | claim key at bootstrap, else an active admin keychain key | for `agent-only`: no claim-key bootstrap; only the agent key (v2) may add keys (R12) | bootstrap with the claim key -> refused |
| P8 | `POST /api/v1/keychain/keys/:id/revoke`, `/sign` | revoke a key; sign an operation with a key | keychain key signature (`{op,…}` JSON) | allow only operations signed by the agent key in v2 form, or refuse until mapped | old-format keychain op -> refused |
| P9 | `POST /api/v1/keychain/recover` | root recovery | claim-key signature (`root-recovery` scope) | refuse: recovery cannot use the old authority (R17); recovery is out of the cut | recover with the claim key -> refused |
| P10 | `POST /api/v1/gateway/:id/{bootstrap,admins,…/revoke,transfer,main-server}` | gateway authority operations | active keychain key signature | if the actor is `agent-only`, only agent-key (v2) signatures | old-format op by an agent-only actor -> refused |
| P11 | `POST /users` (legacy router) | adds a user row (username, identityHash, publicKey) | **no proof at all** | must not create or alter anything for an `agent-only` identity; **separately: an unauthenticated directory write** | POST /users for an agent-only identityHash -> refused |
| P12 | `/api/v1/session/*`, `/api/v1/hosts/revoke` | host session flows | disabled (`sessionHostFlowDisabled`) | stay disabled | (assert disabled) |
| — | `/__monads/*`, mesh announce/resolve | process control; monad-to-monad | local control guard; monad keys | not identity authority; out of scope | — |

**Open, found while inventorying:**
- **P11:** `POST /users` writes a directory row with no proof. Whether it can affect claims or sign-in is to be
  checked; it is listed here because it accepts identity data with no authority at all.
- The keychain's operation format (`{op, namespace, …, nonce, timestamp}` signed by a keychain key) is a third proof
  format (not `prove()`, not v2). Mapping it onto v2, or refusing it for `agent-only`, is part of this cut (P7, P8, P10).

## 3. Proposed shape of the change (monad, disposable environment)

1. **v2 verification** in the monad (the same strict parse and field rules as `src/agent/protocol.ts`).
2. **Atomic agent registration**: a new endpoint (or a v2 branch of `POST /claims`) that creates claim + agent key in the
   keychain + `agent-only` on the claim record in one step, only for an identity the monad does not know.
3. **`agent-only` enforced at P1–P11**, each with its negative test (vitest against a disposable monad).
4. **Security state**: nonce reservation after validation, fail-closed, issued-before-start refusal, live key status
   from the keychain.
5. **The protected domain read**, with the gateway's projection rule and real gateway authority — **only meaningful
   once the bypass in section 1 is closed or stated**.
6. The browser run of `agent.browser.test.mjs` against a disposable monad instead of the test verifier.

## 4. Results, local only (2026-11-12, later the same day)

### 4.1 Domain records reserved to the internal service (step 1)

**Policy, as implemented:** no monad output hands the gateway's domain records to anyone but the monad's internal
service (the holder of its internal token; on a gateway machine, netget). That includes signed-in callers and the
namespace's owner, also in the memories its own sign-in returns. netget reads the records and delivers the projection
each caller is entitled to (its `GET /domains`: public projection for anyone, full configuration for `gateway:read`).
It is not "no anonymous read": it is "internal service only, then netget's projection".

Measured first on unchanged code (monad `30d96d24`, disposable in-process monad, unique marker values in every
record field, check = "no marker anywhere in the bytes of the answer"): the records left anonymously through `/`,
`/blocks`, `/blockchain`, `/@*`, direct paths (`/domains/...`, `/domainIndex`), `/__provider/resolve`,
`/api/v1/sync`, `POST /inspect`, `POST /explain`, NRP `read`/`subscribe`, and the owner's sign-in
(`/claims/signIn`, `/claims/open`, `/me/kernel:open`).

Change (monad worktree, uncommitted): one filter, `src/http/gatewayRecordDisclosure.ts`, applied at every one of those
outputs. A row at a record path is dropped; a parent's value is pruned (copy, kernel data untouched); a read OF a record
path is answered `closed` whether or not a record exists (no existence oracle); `explain` refuses any path, wildcard or
aggregate that could reach one, before evaluating it. Only the monad's internal caller (the internal token netget
already shows for writes) skips it. The stored chain is not modified. netget's `readFromMonad` now sends the same token
(netget worktree, uncommitted): without it netget's own domain reads fail against the fixed monad
(`domain-store-dotted-domains`, `gateway-add-domain-flow` red), so **netget must ship first or together**.

Tests: `tests/Security/gatewayRecordReadExposure.test.ts` (11; 6 fail on the old code), monad suite 723 passed (run with
temporary links for the `all.this` relative imports), netget domain files 10/10 against the fixed monad. Not done: the
netget admin inspector forwards `/explain` anonymously, so it now sees domain paths as closed. It is **not** to be fixed
by adding the token to whatever `/explain` netget forwards (that would be another privileged way out): first check the
requester's permission and bound what it may explain.

**Boundaries checked (second pass, same day):**
- *Where the token goes (netget).* `readFromMonad`/`writeToMonad` get their origin from configuration
  (`NETGET_MONAD_ORIGIN`, or the local process record), never from a request. Made explicit: the token is sent only to a
  loopback `http(s)` origin (no userinfo), and both requests refuse redirects (`redirect: 'error'`; fetch keeps custom
  headers across a cross-origin redirect). `tests/monad-http-client-token-boundary.test.ts` (real local servers):
  loopback gets it on read and write; an IPv4-mapped address of the same machine gets the request without it; a 307 is
  refused and its target receives nothing.
- *Fail-closed bypass (monad).* Only `mayReadGatewayRecords(req)` opens it (exact token, constant-time). Tested: no
  header, empty, spaces, wrong same length, prefix, token + extra, upper case, padded, the token as `Authorization` or
  under another header name, the header duplicated, the token in the query string; and a monad with an empty or absent
  configured token never treats a request as internal. All leave the filter on. On the VM, the door's `location /`
  already blanks `X-Monad-Internal-Token` before proxying (the file has 56 such lines for 58 `proxy_pass`; each pairing was not checked).
- *Coverage is evidence, not proof.* The sweep now also covers encoded and doubled separators, leading/trailing dots,
  single-quoted and chained brackets, `@`-forms, NRP expressions with paths, and more wildcard/aggregate explains. It
  protects records by where they live, not secrets by field name. A representation not listed (a new route, a new
  read helper) is only covered if it goes through `gatewayRecordDisclosure.ts`.

### 4.2 `POST /users` (step 2)

`http/legacy.ts` -> `claimUser`: no proof; five memories in the ROOT namespace at
`users.<username>{,.identityHash,.publicKey,.createdAt,.updatedAt}` (the first one a `__` pointer). `username` is only
trimmed and lowercased: **dots pass**. No caller found in GUI, cleaker or netget. Measured on a disposable monad
(`tests/Security/legacyUsersPost.investigation.test.ts`, uncommitted):

| Case | Result |
|---|---|
| Unclaimed name | 200: the name appears in the directory (`GET /`, `GET /users/<name>`), with an empty identityHash (the given values are not shown) |
| The claimed name itself, any case/spaces | 409 `USERNAME_TAKEN` |
| Squat before the real claim | the real claim still succeeds; afterwards the directory shows the claim's identityHash |
| **Dotted name into a claimed namespace** (`quinn.profile`) | 200 with no signature (the same write through `POST /` is 403 `NAMESPACE_WRITE_FORBIDDEN`): quinn's `profile` now holds the injected `identityHash`/`publicKey`/pointer; quinn's write head **moved** (the owner must re-read it before the next signed write) |
| **Dotted name onto an active keychain key** (`quinn.keychain.keys.<keyId>`, attacker publicKey) | the record is replaced by the pointer: `authorization` gone, the owner's key answers `ACTING_KEY_REVOKED`; the attacker's key is refused too. **Not a takeover; an anonymous revocation** of any keychain key (and so of what depends on it, such as gateway authority operations) |
| Dotted name into the gateway's records (`netget.domains.<key>`) | 200: bypasses the internal-caller write guard; lowercasing keeps `domainIndex` and `__DOT__` keys out of reach, so only dot-free domain keys and new keys are writable |
| Claims and sign-in | unchanged: they decide on the claim record (`getClaim`); quinn's own sign-in 200, an attacker key 403 `CLAIM_VERIFICATION_FAILED` |

So: it does not let anyone sign in or claim as someone else, and it does not install a key; it does let anyone write
fixed fields into any namespace's storage (claimed ones included) and disable keychain records and other records by
replacing them with a pointer.

**Production exposure (configuration and code only, no write sent):** the live release `r20261108-3` still mounts it
(`dist/src/http/legacy.js:16`, `app.js:180`), and the VM's OpenResty sends `cleaker.me` / `*.cleaker.me` `location /`,
any method, through `surface_proxy.lua` to a monad: **reachable from the internet**. The retained access logs (1 Jun
to 12 Nov 2026, with gaps; `.6` missing) contain no `POST /users`; only scanner requests for other software's
`.../users` paths. That does not prove it was never used.

**Fix (monad `89ccfede`, local, not pushed):** the route answers 410 `LEGACY_USERS_WRITE_DISABLED`; `claimUser` removed;
`GET /users/:username` unchanged. `tests/Security/legacyUsersWriteDisabled.test.ts`: every shape refused (plain,
dotted, reserved paths, case, trailing slash, any host), no memory appended, write head unchanged, key record
unchanged (owner's key still signs, an attacker's does not), and claiming a namespace still registers the name and
signs in. Fails on the previous code. Full monad suite on that commit alone: 711 passed; 2 files red for environment
reasons only (`js-sha3` missing in this worktree; a `gatewayAuthority` setup flake under parallel load, 3/3 alone).
Investigation test and its output kept at `~/.get/evidence/monad-legacy-users-2026-11/`.
