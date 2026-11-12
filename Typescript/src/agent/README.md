# Identity agent — first-cut prototype (v2)

Implements the first cut of [Agent-Protocol.md](../../Agent-Protocol.md) (section 10) as a **local prototype**: new
identities generated in the agent, `agent-only` from registration, one visible read (a fixture domain list) approved
in the agent's own window, v2 proofs, a disposable test verifier. Not deployed, not exported from the package, not
wired into the shell. No real credentials, no real gateway.

| Piece | File | Runs in |
|---|---|---|
| Protocol: shapes, strict validation, canonical encoding, v2 bytes (`me-proof/2\n` + canonical JSON) | `protocol.ts` | host and agent |
| Host side: open the agent window, send one request, receive the proof | `requestOperation.ts` | host page |
| Agent keys: new identity, agent key (Ed25519, non-extractable, IndexedDB), registration, signing | `agentKeys.ts` | **agent only** |
| Agent page: create an identity; approve a request | `demo/agent.html`, `demo/agent.main.ts` | agent origin |
| Host demo page | `demo/agentHost.html`, `demo/agentHost.main.ts` | host origin |
| Test verifier: registration, the protected read, its own security state | `tests/integration/agentResource.mjs` | test server |

## How a new identity is bound to its agent key

There is still a `.me` seed, but only for a moment and only inside the agent:
1. The agent generates a **random seed** (fresh material, never an imported or rebuilt one) and a `.me` kernel from
   it, gives it a handle (`@`), and generates a **random Ed25519 agent key** with WebCrypto, non-extractable.
2. It writes a v2 registration statement (`op: register`: identityHash, namespace, keyId, the agent public key,
   nonce, times, origin, audience) and signs it **twice**: with the agent key (v2 signature), and with the identity's
   own `.me` key through `prove()` (the old proof format, over exactly those bytes). The second signature is what
   binds the `identityHash` to the agent key: only the holder of that identity could produce it.
3. The verifier checks both signatures, that the request comes from the agent's origin (a hurdle, not a proof), the
   times and the nonce, and then creates **claim + agent key + `agent-only`** in one step, only for an identity it
   does not know yet.
4. The kernel and the seed are dropped. The identity keeps no seed anywhere: from then on only the agent key signs,
   and the verifier refuses v1 for it.

This fits the agreed design as the first cut: a new identity, generated in the agent, registered with its agent key and
without accepting v1 from the start. The seed of the GUI identity is not kept, so this identity has **no recovery**
(out of the cut, by design) and is not Sync/Scan/Recover material.

## What the run proves (`tests/integration/agent.browser.test.mjs`)

The full path (create → register with `agent-only` → visible approval → v2 proof → allowed read) and the rejections:
no permission (403), v1 for an `agent-only` identity (even with a valid v1 signature), v1 on a v2-only endpoint,
concurrent replay (exactly one execution), altered request, other origin, expired, navigated window, reject/close,
an invalid signature not burning the nonce, nonce store unavailable (fail-closed), verifier restart, revoked key, a
registration from a page that is not the agent. The key survives reloading the agent and stays non-exportable; the
host only ever receives `{bytes, signature}` and public identity fields. The run prints which Agent-Protocol.md
negative tests are covered, covered in part, or pending.

**Limits:** "non-exportable" does not stop compromised code **inside the agent** from using the key; there is no
unlock secret over the stored key yet; framing is refused by script only (CSP headers pending); the verifier is a
single-process test server, not `me_sig.lua` or the monad; the in-page signing paths are not retired; nothing here
isolates the production login or migrates existing identities.
