# App session after agent approval (design contract, proposal)

**Status:** proposal, 2026-11-15. Not normative and not implemented. It authorizes no code change or deployment. It
extends [Agent-Protocol.md](Agent-Protocol.md) (the agent–app–server protocol) and does not change the approval screen
being built for §3a. Requirements are **S1…**, negative tests **SN1…**, open decisions **D1…**.

## 0. What exists today, and the gap

- **Sign-in.** An app on another origin opens the agent (`cleaker.me`). The person approves, and the agent returns a
  single-use v2 `read` proof. The app sends it to `GET /api/v1/agent/open`. The server verifies it (audience, origin,
  time, agent key active, agent-only, nonce; R13–R16) and answers the namespace's open: claim record and readable data.
  Verified locally, same browser.
- **No credential afterwards.** The server issues nothing that lasts. Every later operation needs a new approval in
  the agent, or a v1 key, which agent-only refuses (R20). So "signed in" today means one verified open, not a session.
- **A side effect.** Each open appends `session.opened_at` to the namespace's own chain (`respondOpened`). That fact
  is public with the namespace.
- **The only session mechanism today** is netget's admin session. The token is random and held in memory, lasts 30
  minutes, and is re-checked on every use: key active, admin, anchored namespace. It is a different credential for a
  different authority, and this contract does not merge them.

**One sentence changes (D0).** Agent-Protocol §1 says *the app never holds the seed, an unlock secret or a reusable
session*. Recommended by the owner (2026-11-15): allow a **resource session**, limited and revocable, and say what it
is not, in the protocol itself:

| The app may hold | The app never holds |
|---|---|
| a **resource session**: issued by one resource server (the audience), for one app origin, with listed scopes and limits, revocable, checked by that server on every use | the **agent's own session or state** (its unlocked identity, approvals, pending registrations) |
| | the seed, an unlock secret, the agent key, or any v1/HKDF key |
| | any key or token that signs **as the identity**, or that a server accepts as the identity's own signature |

A resource session is the server's statement "this app may do these reads for this identity, here, until then". It is
not a delegation of the identity's signing authority.

## 1. Who: the subject the server verified

| | Requirement | Negative tests |
|---|---|---|
| S1 | The subject is fixed at issuance from what the **server** verified: `identityHash`, the namespace, and the `keyId` of the agent key that approved. The session never carries a subject taken from a later app request, header or body. | SN1 |
| S2 | The namespace is the identity's **anchored** namespace here (records.ts `resolveIdentityAnchor`). An ambiguous anchor issues no session, and a linked namespace is not a back door to the anchor's sessions. | SN2 |
| S3 | First cut: sessions only for **agent-only** identities, approved in the agent (R20). A v1 identity gets no app session through this flow. Legacy identities follow the migration plan. | SN3 |

## 2. Where: one app origin, one audience, one resource set

| | Requirement | Negative tests |
|---|---|---|
| S4 | **Audience.** The session is valid only at its audience: the server that verified the approval and issued it. Another server, or another monad behind the same gateway, does not accept it. | SN4 |
| S5 | **App origin.** The session is bound to the app origin the browser reported to the agent (`MessageEvent.origin`, signed as `origin` in the approval). Not a URL the app names. | SN5 |
| S6 | **Not by the Origin header alone.** Outside a browser anyone can set `Origin`. The session is therefore also **sender-bound** (section 5): a request must be signed by the session key that only that app instance holds. | SN6, SN7 |
| S7 | **Resources.** The resources (the namespace's own paths) are listed in the session and checked on every request; nothing is implied by being signed in. | SN8 |

## 3. What it allows: scopes, and what it never allows

| | Requirement | Negative tests |
|---|---|---|
| S8 | **Scopes are explicit.** They are chosen from a server-defined list, shown by the agent at approval (R5: drawn by the agent, the app's text never shown as the operation) and fixed at issuance. No scope can be added later without a new approval. | SN9 |
| S9 | **Signing in grants no administration.** A session is never accepted for: gateway authority (bootstrap, grant, revoke, transfer, main server), netget admin sessions or the admin gate, keychain operations, claims and identity-links, agent-key registration or revocation, agent-only changes, recovery, or rebind. Each of these keeps its own per-operation authorization. | SN10 |
| S10 | **A bootstrap approval stays separate.** An admitted `call`, such as `netget.gateway.bootstrap` (§3a), authorizes that one change, signed for that body. It does not create, extend or widen a session. A session does not stand in for that approval. | SN11 |
| S11 | **First-cut scope: one concrete read** (section 3a). Writes are a separate decision (D2), because they change who authors a chain entry: today a claim-key signature, with sessions the server's word. | SN12 |

## 3a. The first session's read, exactly

- **Scope** `namespace.read`: one endpoint, `GET /api/v1/agent/session/read?path=<path>`, under the session's own
  namespace only. No path, query or field names another namespace.
- **Permission.** The subject reads its own namespace: the server needs no grant, but it checks on every request that
  the session's namespace is still the identity's anchored, agent-only claim (S2, S14).
- **Disclosure: what the server already holds in the clear, no more.** It is the projection the namespace's own open
  gives today:
  - public values are returned;
  - gateway records (`domains`, `domainIndex`) are excluded, as `respondOpened` does;
  - secret scopes (`_`) answer `closed` (or `***` below the scope root), per the NRP disclosure contract.
- **No keys, no decryption.** A session hands out no key and decrypts nothing. Whatever protects a secret branch stays
  where it is; the session adds no way in.
- **No change to the namespace.** A read modifies no state of the namespace and creates no incidental memory (no
  `session.*` or `opened_at` fact). The server may still count it in aggregate operational telemetry (the request
  counters it already keeps), which is not namespace state (S18).
- **What it returns is already public.** With this disclosure, `namespace.read` returns what an anonymous reader of
  the namespace's public paths could already read. So in the first cut the session adds **identity and continuity**:
  the server knows who is reading, and the app does not ask the agent every time. It adds **no access to content**
  that was not already readable. A scope that returns more than the public projection is a separate, later decision
  with its own permission.

| | Requirement | Negative tests |
|---|---|---|
| S11a | `namespace.read` answers only the session namespace's paths, with the open's disclosure; secret scopes stay closed, gateway records excluded. | SN12a, SN12b |

## 4. How long: expiry, closing, revocation

| | Requirement | Negative tests |
|---|---|---|
| S12 | **Two limits, the earlier wins.** An absolute lifetime set at issuance (proposal: 12 h) and an idle timeout (proposal: 30 min, as netget's admin session). Activity extends the idle limit, never the absolute one (D3). | SN13 |
| S13 | **Closing.** The app can end its own session. The server deletes it, and a later use is refused. | SN14 |
| S14 | **Revocation is live** (as R16), checked on every use and never from a cache that could accept. The session ends when: (a) the approving agent key is revoked; (b) the person revokes this session, or all sessions for that app, from the agent (a signed `op:"session-revoke"`, D7); (c) the identity's anchor or agent-only state changes (rebind, migration); (d) the scope's resource no longer belongs to that identity. If the state cannot be checked, refuse. | SN15, SN16 |
| S15 | **Restart rule, stated.** First cut: sessions live in the server's memory, and a restart ends them all (fail-safe, like R15 and netget's admin sessions). Persisting them is a later decision (D4). | SN17 |

## 5. How it is kept: what the server issues, and where the app holds it

**D1 stays open.** Below is the shape a sender-bound session would take. If it is chosen, it must be **OAuth DPoP as
specified in RFC 9449**, implemented as the RFC says, not a home-made signature scheme under that name:
- the `DPoP` header carries a JWT (`typ: dpop+jwt`, the public JWK in its header) with `htm`, `htu`, `iat`, `jti`, plus
  `ath` when an access token is presented;
- the server binds the token to the key's JWK thumbprint (`cnf.jkt`, RFC 7638);
- the server may require a `DPoP-Nonce`;
- replays are refused by `jti`.

If an RFC-conformant implementation is not taken on, the honest alternative is a bearer session with shorter limits,
named as such. The steps below describe the flow, with the RFC's fields where it applies.

1. **The app makes a session key.** The app generates a key pair in WebCrypto, `extractable: false`, and keeps it in
   IndexedDB for its origin. It is a key for this session only. It is not the seed, not the agent key, and not derived
   from either.
2. **The agent approves.** The app asks the agent for `op:"session"`. The request carries the session key's
   thumbprint, the requested scopes and the audience. The agent shows the app origin, the identity, the scopes and the
   duration, then signs the v2 bytes, which bind the thumbprint, scopes, audience, origin and expiry.
3. **The server issues.** The app sends that proof to the audience (e.g. `POST /api/v1/agent/session`). The server
   verifies it as an open (R13–R16, S1–S3) and issues `{sessionId, expiresAt, idleTimeout, scopes, audience,
   appOrigin}`. `sessionId` is 256 random bits. The server stores only its hash, with the subject, the thumbprint and
   the limits.
4. **Each request carries a DPoP proof (RFC 9449)** signed by the session key: `htm`, `htu`, `iat`, `jti`, and `ath`
   for the session token. The server checks:
   - that the signature matches the bound thumbprint;
   - the time window;
   - the `jti` replay cache, atomic and fail-closed (R13–R14);
   - the scope;
   - the live state (S14).

| | Requirement | Negative tests |
|---|---|---|
| S16 | **Nothing in the app signs as the identity.** The app holds no seed, no agent key, no v1/HKDF key and no unlock secret. The session key can sign only requests that this session's scopes allow at its audience; anywhere else it is worthless. | SN18 |
| S17 | **A stolen `sessionId` alone does nothing** (no session-key signature). A request signed for one request cannot be replayed or used for another. | SN6, SN7 |
| S18 | **The server keeps session state private.** It keeps the session-id hash, subject, thumbprint, scopes and limits. They are not written to the namespace's public chain, and issuing a session appends nothing public. | SN19 |

**Limits, stated rather than solved:**
- **Script in the app's origin.** A script running in the app's origin (XSS, a third-party script) can *use* the
  session while it runs. A non-extractable key stops it from being copied out, not from being used. Scope, idle timeout
  and revocation bound the damage.
- **A compromised audience server** can mint sessions. The design does not protect against that.
- **The app cannot be attested.** The server cannot tell the app's own code from other code running in that origin.

## 6. Negative tests (each must fail before its S is called met)

| | Attempt | Expected |
|---|---|---|
| SN1 | A request names another identityHash or namespace in a header or body | ignored; the subject is the issued one |
| SN2 | Session approval for a non-anchored (linked) namespace, or under an ambiguous anchor | no session |
| SN3 | Session approval with a v1 proof, or for a v1 identity | refused |
| SN4 | The session used at another audience (another monad, netget) | refused |
| SN5 | Approval relayed for another app origin | the issued session is bound to the reported origin; refused elsewhere |
| SN6 | `sessionId` sent without a session-key proof, or with a proof by another key | refused |
| SN7 | A request proof replayed, or reused for another method, path, query or body | refused (`jti`, binding) |
| SN8 | A resource outside the session's list | refused |
| SN9 | A scope not approved, or added later | refused |
| SN10 | The session presented to gateway authority, the netget admin gate, keychain, claims or agent-key operations | refused, each one |
| SN11 | The session used instead of a bootstrap approval; a bootstrap approval used as a session | refused both ways |
| SN12 | A write with a first-cut session | refused |
| SN12a | `namespace.read` for a path of another namespace, or with a query naming one | refused |
| SN12b | `namespace.read` of a secret scope, or of gateway records | `closed` / excluded; never plaintext |
| SN13 | Use after the idle timeout, or after the absolute lifetime despite activity | refused |
| SN14 | Use after the app ended the session | refused |
| SN15 | Agent key revoked; the person revokes the session or all sessions of the app; the anchor changes | the next use is refused |
| SN16 | The live state cannot be read | refused (fail-closed) |
| SN17 | Use after a server restart (first cut) | refused |
| SN18 | Inspection of the app's storage after sign-in | no seed, agent key, v1 key or unlock secret; the session key is non-extractable |
| SN19 | Issuing and using a session | nothing appended to the namespace's public chain |

## 6a. Before the agent is deployed (not optional)

- **Framing.** The agent page is protected against framing by **HTTP headers**, not only by its script check:
  `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` (R1). They are sent by whatever serves
  the agent's origin, and a test asserts them on the served response.
- **Today.** Only the script check (`window.top !== window.self` in `demo/agent.main.ts`) exists. The agent's own
  browser test marks the headers as pending (N1). That pending item is a deploy gate for the agent, sessions or not.

## 7. Decisions to take

- **D0** Admit a **resource session** in Agent-Protocol §1, with the "never holds" list (section 0). The owner
  recommends it; to be confirmed in the protocol.
- **D1** Open. Either DPoP **as RFC 9449 specifies** (section 5), or a bearer session named as such, with shorter
  limits. No home-made "DPoP".
- **D2** First-cut scopes: reads only (proposal). If writes are admitted, who authors the chain entry: the server
  attesting the session, or still an identity signature per write.
- **D3** Lifetimes: absolute 12 h, idle 30 min (proposal); whether a session can be renewed without the agent.
- **D4** Where session state lives (memory first, so a restart logs out), and later persistence or several servers.
- **D5** One session per (identity, app origin, audience), or several (tabs, devices).
- **D6** Whether the existing open keeps appending `session.opened_at` to the public chain (section 0), or moves to
  private server state with sessions (S18).
- **D7** How the person sees and revokes sessions in the agent: list per app, revoke one or all, signed
  `op:"session-revoke"`.

## References

- [Agent-Protocol.md](Agent-Protocol.md): R1–R21; §3a admitted writes; §4 proof vs result; §6 server security state.
- [Identity-Access-Design.md](Identity-Access-Design.md): `cleaker.me` as the agent; the app on `neurons.me`.
- [Identity-Custody-Contract.md](Identity-Custody-Contract.md): isolation rules for the agent origin.
- [Identity-Migration-Plan.md](Identity-Migration-Plan.md): anchors, rebind, and why a public identityHash is never
  authority.
- netget `adminSession.ts`: the existing admin session, a different authority.
- [Agent-Bootstrap-Server-Path.md](Agent-Bootstrap-Server-Path.md): the server path for the bootstrap `call` (separate from sessions, in both directions).
