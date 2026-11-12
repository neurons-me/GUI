# Agent – app – server protocol (proposal)

**Status:** proposal, 2026-11-12. Not normative, not implemented, and it authorizes no code change or deployment. It
does not replace [Identity-Custody-Contract.md](Identity-Custody-Contract.md); it is the protocol that contract's
section 10 asks for (decisions 2–5), assembled from pieces that already exist:

| Piece | What it gives this protocol |
|---|---|
| [Custody contract](Identity-Custody-Contract.md) §6–§9 | the first cut (one visible read), message requirements, isolation rules, the negative-test table |
| [Identity-Proof-Migration.md](Identity-Proof-Migration.md) | the v2 proof idea (`me-proof/2` in the signed bytes, agent key, per-endpoint policy, `agent-only`) |
| [Verifier map, 2026-11-10](evidence/2026-11-10-server-verifier-map.md) | what each server checks today and what it lacks |
| [Identity-Access-Design.md](Identity-Access-Design.md) | where the agent lives (`cleaker.me`), Sync/Scan/Recover ending in it |
| Prototype `src/agent` (`me-agent/1`, [README](src/agent/README.md)) | a working local flow: window, origin check, approval, proof, verifying resource server |

Each requirement below (**R**) names the negative test(s) (**N**, section 7) that must fail before it can be called
met. **Open** marks what is not decided.

## 1. Parties and the one sentence

`cleaker.me` (the agent) custodies and asks for approval; the app (on `neurons.me` or any host) asks and receives a
result or proof; each server verifies and authorizes. The app never holds the seed, an unlock secret or a reusable
session.

## 2. App → agent

| | Requirement | Negative tests |
|---|---|---|
| R1 | The app opens the agent at its fixed origin in a visible top-level window; no embedded or invisible signing. The agent refuses framing (CSP `frame-ancestors 'none'`, not only script). | N1, N2 |
| R2 | One request per pending identifier (unpredictable), accepted only from the opener window; the requesting origin is the one the browser reports (`MessageEvent.origin`), never one named in the message, query or referrer. | N3, N4 |
| R3 | The request carries the protocol version, the operation type and its exact parameters (resource, method, path, canonical query, payload hash, audience) and a bounded expiry (prototype: 5 s – 10 min). Strict validation; anything unknown is rejected. | N5 |
| R4 | Cancellation, window close, navigation, timeout or a signing failure ends the request; nothing continues unsigned. | N6 |

## 3. What is approved, and what is signed

| | Requirement | Negative tests |
|---|---|---|
| R5 | The approval screen is drawn by the agent only (no host HTML or components) and shows the exact requesting origin (scheme, host, port), the identity, the resource/audience, the action, any limits and the expiry. | N7 |
| R6 | What is signed is exactly what was shown: one canonical encoding built from the approved operation; the host cannot change destination, namespace, method, query, payload or audience after approval. | N8 |
| R7 | The signed bytes start with the v2 tag (`me-proof/2\n` + canonical JSON) and include: `v, op, method, path, query, bodyHash, nonce, issuedAt, expiresAt, origin, audience, keyId` (fields per [Identity-Proof-Migration.md](Identity-Proof-Migration.md) §1). A v2 message can never parse as v1. | N9 |
| R8 | The signing key is the **agent key** registered in the keychain (section 5), not the HKDF branch key a page can derive from a typed secret. | N10 |

## 4. Agent → app: proof or result

**Decision 1 (open, one mechanism for the first cut):**

| Option | The app receives | The server sees | Consequence |
|---|---|---|---|
| **A. Proof** | a v2 proof for exactly one request; the app sends it | the app's request with the proof | the app makes the call; the proof is single-use and audience-bound; the app learns the data it asked for |
| **B. Result** | the result of the operation, fetched by the agent | the agent's request (same-origin to `cleaker.me` or the resource) | the agent becomes a fetch proxy and needs a strict destination policy (custody contract §8) |

Proposal: **A for the first cut** (the prototype already does it, and the server keeps one verification path); B
only for resources that must never reach the app. Whichever is chosen, the other is not offered in the same cut.

| | Requirement | Negative tests |
|---|---|---|
| R9 | The response goes to the exact origin of the pending request (`targetOrigin`), once; a navigated or other window gets nothing. It contains only the proof (or result) and the approver's public identity. | N3, N11 |

## 5. Initial registration of the agent key, and `agent-only`

**Decision 2 (open): who authorizes the agent key and switches the identity to `agent-only`.**
The risk: an app that still holds old credentials (a typed secret it can derive the branch key from) races the person
and registers *its* key as the "agent key", or switches `agent-only` on with its own key, capturing the identity.

Requirements:

| | Requirement | Negative tests |
|---|---|---|
| R10 | The agent key is generated inside the agent (random, non-exportable where the platform allows) and registered by the agent itself, in a ceremony the person sees in the agent window. | N12 |
| R11 | Registration of the first agent key and the switch to `agent-only` are **one operation**, atomic on the server: after it, every verifier refuses v1 for that identity (including `keychain-register` and recovery, R17). | N13, N14 |
| R12 | An identity already `agent-only` accepts a new agent key only through an operation signed by an existing active agent key, or through recovery under R17–R18. | N14 |

**Why it cannot be closed by cryptography alone.** For an identity whose only authority today is the seed, anyone
holding the seed (the person's agent, or an app that kept it) produces exactly the same proofs. A browser-verified
origin protects the channel between pages; a non-browser client can claim any `Origin`. With only the old authority,
the server cannot tell the agent from a copy.

**Proposed resolution (first cut):** separate the two kinds of identity.

| Identity | First cut | Race |
|---|---|---|
| **New, generated in the agent**: fresh material generated inside the agent; **not** an imported or rebuilt older seed (importing the 12 words of an existing identity does not remove copies that may exist) | The registration that creates the claim also registers the agent key and sets `agent-only`, in one atomic operation (R11). | No earlier v1 authority exists to race with |
| **Existing (legacy)**: every identity that exists today, its seed typed into pages | **Not offered in the first cut.** Its first agent registration is a future migration. | Documented risk of that migration: an app that kept the seed can register first. Showing registered keys in the agent helps detect an attacker's key; it does not prevent the lock-out. |

**The exact guarantee for a new identity:** it is registered from the start with its agent key and without
accepting v1 proofs. Atomicity prevents partial states; it does **not** attest the software that created the identity:
the server can guarantee that the claim is born bound to a key with `agent-only` on, not, from that signature alone,
that the key was generated in the official agent. **Exclusive custody depends on the security of the agent and the
device.**

Options to close the legacy race in a future migration: a confirmation on a channel the app does not control (a
second, previously registered device or authority); or moving the name to a new identity generated in the agent,
accepting that the move is authorized by the old seed and needs the same out-of-band step.

### Permission for the first-cut read (test only)

The read has to be authorized without making the test identity a gateway owner and without real credentials:
- **The resource is a test resource**, not the real gateway: a disposable verifier that serves a **fixture domain list**
  (as `tests/integration/agentResource.mjs` does today).
- **Its policy is test configuration**, set by the harness that starts it (operator-side), not granted by any
  identity: `registered` (identityHash -> agent public key, from the atomic registration) and `allowed` (the
  identityHashes that may read the list). A valid proof from an identity not in `allowed` is 403, not data.
- Nothing touches the real gateway's authority (`daemon.gateways`, owner/admins/grants), its keychain or its domains.
- **Later, on a real gateway (possible future integration, not a decided contract):** one option is an owner-signed
  grant in the gateway authority, scoped to the read and to listed domains. Outside the first cut.

## 6. Security state on the server

**Decision 3 (open): where nonces, revocations and `agent-only` live**, and how they behave under concurrency,
restarts and several servers.

| | Requirement | Negative tests |
|---|---|---|
| R13 | **Order:** validate the proof (format, signature, key active and not revoked, audience, origin, expiry) → **atomically reserve the nonce** → execute. A proof that fails validation reserves nothing (it cannot burn someone else's nonce). | N15, N16 |
| R14 | The reservation is atomic (one winner among concurrent identical proofs) and **fail-closed**: if the store is missing or unreachable, the protected operation is refused. | N16, N17 |
| R15 | Restarts: a proof whose `issuedAt` predates the store's start is refused (no persistence of nonces needed), or the store persists; one of the two, stated. | N18 |
| R16 | Revocation and `agent-only` are read **live** from the authoritative state for every protected operation; a cache may only make an answer stricter, never accept a revoked key or a v1 proof for an `agent-only` identity. If the state cannot be checked, refuse. | N19, N20 |

**Writes, later:** replay and retry are different. A lost response must not cause a second execution. Proposal: the
operation carries a client idempotency key inside the signed bytes; the server records `(identity, key) -> outcome`
atomically with the execution and returns the recorded outcome to a retry with the same key and same signed bytes; a
second proof with the same key and **different** bytes is refused. **Open:** how long outcomes are kept, and where.

**Open:** with several servers (gateways, monads) the store must be shared or the operation must be pinned to one
authority; which, per resource. Today nonces live in memory per process (`me_sig.lua` dict, monad maps; verifier map).

## 7. Recovery does not open a back door

**Decision 4 (open):** how recovery works for an `agent-only` identity without becoming a shortcut.

| | Requirement | Negative tests |
|---|---|---|
| R17 | Recovery cannot switch `agent-only` off, and cannot register a key, using only the old authority (a v1 proof, or the HKDF branch key). | N21 |
| R18 | Recovery that registers a new agent key runs **in the agent**, and is authorized by something the old authority alone does not give: an independent recovery authority registered beforehand, or a linked agent device. Rebuilding the seed from the 12 words alone is **not** an independent factor (Identity-Access-Design §5). | N21, N22 |

**Open:** whether an independent recovery authority exists, and where it is registered.

## 8. Closing the old path

| | Requirement | Negative tests |
|---|---|---|
| R19 | Per endpoint, a declared policy `v1` → `v1+v2` → `v2` (in the generator and the monad, not inferred); an unknown tag is refused, v2 never falls back to v1, a v1 message carrying `v` is refused. | N9, N23 |
| R20 | For an `agent-only` identity, every verifier refuses v1 — including keychain registration, recovery, sign-in and writes — regardless of the endpoint's general policy. | N13 |
| R21 | Each in-page signing entry point (`SeedSessionProvider` sign-in, `signedRequest`, `signPayload`, `signAndWrite`, `deriveCleakerNode*`, the kernel's seed exposure, UMD and scaffold exports) is retired in the order of Identity-Proof-Migration §4; the boundary is not called isolated while any of them can still sign for an `agent-only` identity. | N24 |

## 9. Negative tests

Rows N1–N11, N15–N17 refine the custody contract's §9 table; the rest are new. Each must be written to fail against the
current code and pass only when its requirement holds.

| N | Attempt | Required outcome |
|---|---|---|
| N1 | Load the agent in an iframe | Refused by headers (CSP), not only by script |
| N2 | Approval drawn or overlaid by the host | Impossible: the agent window renders only agent code |
| N3 | Another window/origin sends or receives with a copied pending id | Ignored / receives nothing |
| N4 | Request names its own origin in the body, query or referrer | The browser-reported origin is the one used and shown |
| N5 | Unknown field, oversize payload, expiry outside bounds | Rejected before display |
| N6 | Close, cancel, navigate, timeout, signing failure | No request is sent, signed or unsigned |
| N7 | Host-supplied label tries to disguise the origin or the action | The agent shows the exact origin and action |
| N8 | Host changes any parameter after approval | The server refuses (signed bytes ≠ request) |
| N9 | A v2 proof presented to a v1 verifier; a v1 proof with `v` to a v2 verifier; an unknown tag | Refused in every case |
| N10 | A proof signed with the HKDF branch key derived in a page | Refused for v2 (not the registered agent key) |
| N11 | The response reaches a page that navigated after asking | It does not |
| N12 | An app registers its own key as the agent key | Refused (R10–R11; see the open point in section 5) |
| N13 | Any v1 proof for an `agent-only` identity, on every endpoint incl. keychain and recovery | Refused |
| N14 | Switch `agent-only` on, or add an agent key, with the old authority only | Refused |
| N15 | A proof with an invalid signature reuses someone's nonce | Rejected without reserving the nonce |
| N16 | The same valid proof sent twice concurrently | Exactly one execution |
| N17 | The nonce store is unavailable | The protected operation is refused |
| N18 | A valid proof replayed after a server restart | Refused (R15) |
| N19 | A key revoked while a proof is in flight | Refused at the server on use |
| N20 | A stale cache says the key is active / the identity is not `agent-only` | Still refused |
| N21 | Recovery used to switch `agent-only` off, or to register a key, with the old authority | Refused |
| N22 | 12 words alone presented as the second factor for registering a new agent key | Not sufficient (R18) |
| N23 | An endpoint with no declared policy | Treated as v2-only or refused, never as v1 |
| N24 | Each retired in-page signing entry point, for an `agent-only` identity | Its output is refused by the servers |
| N25 (writes, later) | A retry with the same idempotency key and same bytes after a lost response | One execution, recorded outcome returned |
| N26 (writes, later) | Same idempotency key, different signed bytes | Refused |

## 10. First cut (scope)

- **Proof return** (section 4, option A), limited to **reading the domain list** (custody contract §6).
- **One verifier** for that resource, with its security state (nonce store, key status, `agent-only`) under its own
  control and fail-closed (R13–R16); no multi-server state in this cut.
- **Explicit first registration from the agent** only for **new identities generated in the agent** (no imported or
  rebuilt seeds); legacy registration not offered (section 5).
- **Permission for the read** comes from the test verifier's own configuration over a fixture domain list; no gateway
  ownership, no real credentials (section 5, last part).
- **Recovery out of the cut**, and no alternative path enabled in its place: an `agent-only` identity in this cut has
  no recovery (test identities only), rather than a recovery that bypasses R17–R18.
- **Implementation starts separately** from these documents: each requirement becomes an executable test (the N
  rows), then the prototype moves to v2.

## 11. Decisions to take (summary)

1. **Proof or result** for the first cut (section 4; proposal: proof).
2. **First registration** of the agent key and `agent-only`: proposed in section 5 (first cut: new identities generated in
   the agent only; legacy registration not offered, its race a documented risk of a future migration).
3. **Where the security state lives** (nonces, revocation, `agent-only`), its behaviour under concurrency, restarts and
   several servers; refuse when unverifiable (section 6).
4. **Recovery** for `agent-only` identities without a back door; whether an independent recovery authority exists
   (section 7).
Plus, carried from the custody contract: transport details (popup handshake, return channel, browser support) and the
exact first resource (the domain list) with its server-side projection.
