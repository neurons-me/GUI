# Identity agent — first-cut prototype

Implements section 6 of [Identity-Custody-Contract.md](../../Identity-Custody-Contract.md) as a **local prototype**:
one visible, read-only operation (the domain list on one server), approved in the agent's own window. Not
deployed, not exported from the package, not wired into the shell. Test identities only.

| Piece | File | Runs in |
|---|---|---|
| Protocol: shapes, strict validation, canonical encoding, challenge | `protocol.ts` | host and agent |
| Host side: open the agent window, send one request, receive the result | `requestOperation.ts` | host page |
| Signing: secret → kernel → `prove()` (no cleaker binding, no network) | `prove.ts` | **agent only** |
| Agent page | `demo/agent.html`, `demo/agent.main.ts` | agent origin |
| Host demo page | `demo/agentHost.html`, `demo/agentHost.main.ts` | host origin |
| Resource server that verifies every request | `tests/integration/agentResource.mjs` | test server |

**What the flow guarantees (tested in `tests/integration/agent.browser.test.mjs`, three origins plus a resource):**
- The agent opens in its own window and origin; it refuses to run embedded.
- It takes one request, only from the window that opened it, and shows the requesting origin the browser reported
  (`MessageEvent.origin`). A request that names its own origin is ignored.
- The secret is typed and used only in the agent; the host cannot read the agent's window and never receives the
  secret, a key or a session -- only the proof for the approved request and the approver's public identity.
- The answer is posted to that exact origin: if the asking page navigated away, the new page gets nothing.
- The proof binds method, path, canonical query, empty body, nonce, time, **origin**, **audience**, expiry and
  protocol version. The server checks all of them itself, its Origin header against the signed origin, the key
  registered for that identity, the Ed25519 signature, and single use -- then authorization separately.
- Rejecting, closing the window, a timeout or a signing failure ends the request; nothing is sent unsigned.

**Not done (contract section 10 gates):** the agent's real origin and how a person selects and verifies it; key
storage, unlock across requests, lock, recovery, revocation and devices; the mapping onto the gateway's own
verifier (`me_sig.lua` checks the old fields and does not yet enforce `v`, `origin`, `audience`, `expiresAt`);
a server-side nonce store that survives restarts; CSP/`frame-ancestors` headers (the prototype refuses framing in
script only); popup blocking UX; migration of the existing in-page signing (`SeedSessionProvider`,
`signedRequest`, `signPayload`, `signAndWrite`).
