# Identity proof migration (proposal)

**Status:** proposal, 2026-11-10. It is not normative and nothing here is implemented. It is based on two
dated pieces of evidence:
- [client inventory](evidence/2026-11-10-client-custody-inventory.md);
- [verifier map](evidence/2026-11-10-server-verifier-map.md).

When it is accepted, the parts that become requirements move into
[Identity-Custody-Contract.md](Identity-Custody-Contract.md) (gates 2 and 5).

## What the evidence requires

- **The agent's proof is the same message signed with the same key as `prove()`.** `me_sig.lua` already accepts it as an old proof and ignores `v`, `origin`, `audience` and `expiresAt`. Adding fields does not separate anything.
- **The signing key does not depend on the gateway or the origin.** Any page that obtains the root, `signPayload` or a kernel can produce any proof, including the agent's.
- **The old formats are told apart by coincidence, not by declaration.** `expectedHeadHash`, `op` and `open:` happen to be required by one verifier and absent from another; no explicit context says which is which.

## Proposal

### 1. Versioned protocol with explicit separation

- **The context goes in the bytes.**
  - A v2 proof signs `"me-proof/2\n" + canonicalJson(fields)`.
  - Every v1 verifier parses the message as JSON or rebuilds it on the server, so a v2 message cannot pass as v1.
  - A negative test per v1 verifier proves it.
- **The verifier chooses by tag, never by field presence:**
  - an unknown tag is rejected;
  - v2 never falls back to v1;
  - a v1 message that carries `v` is rejected.
- **v2 requires every field:** `v, method, path, query, bodyHash, nonce, issuedAt, expiresAt, origin, audience, keyId`.
  - `audience` = the verifier's own identity (`gatewayId` or the monad's root), compared to its local value.
  - `expiresAt − issuedAt` has a short maximum (e.g. 60 s).

### 2. A separate key, held by the agent

- **v2 is signed by an agent key, not by the HKDF branch key.**
  - It is random, generated inside the agent and registered in the keychain.
  - It is checked **live** (`active`), as the admin session already does.
  - A page that derives the branch key from a typed password cannot sign v2.
- **Limit:** while the root is still typed into ordinary pages, a page can register its own key. That is why step 4 exists.

### 3. Verifiers (each its own change, with tests)

- **v2 nonce store:**
  - atomic (`add` in Lua, check-and-set in Node);
  - consumed **after** the signature check;
  - fail-closed if the store is missing.
- **Replay after a restart:** reject any proof whose `issuedAt` is earlier than the store's start. This avoids persisting nonces.
- **Authorization:** separate from authentication (as it is today).
- **First resource:** the domain list, read by the gateway itself, with no `pubkeys` cache in the decision.

### 4. Downgrade and retirement

- **Policy per endpoint:** `v1` → `v1+v2` → `v2`. This is declared in the generator and in the monad, not inferred.
- **Policy per identity:**
  - Once a person enrolls an agent, their claim record carries `proof: agent-only`.
  - From then on, every verifier rejects v1 from that identity, **including `keychain-register` and recovery**, so a page that obtains the password cannot create a key or come back down to v1.
  - Only an operation signed by the agent changes that flag.
  - Recovery by phrase also happens inside the agent.
- **Retiring v1, one path at a time:** a path is retired when its consumer row in the inventory (D) has been migrated and its negative test is green. Suggested order:
  1. the domain read;
  2. `/logs` and `/check-auth`;
  3. the admin session;
  4. the keychain;
  5. writes (`signAndWrite`, groups, sidebar);
  6. sign-in / registration / recovery / linking;
  7. last, `signPayload`, `deriveCleakerNode*`, the kernel's seed exposure, and the UMD and scaffold exports.
- **When it can be called isolated:** not before step 7 for that identity. That is the condition in section 10.5 of the contract.

### 5. Independent fixes to the current path

These do not depend on the agent, and each needs its own go-ahead:
- **F1:** freshness reads the outer, unsigned `timestamp` (`records.ts:109-113`). It should read only the signed one. Affects production.
- **`me_sig.lua`:**
  - nonce consumed after the signature check;
  - `add` instead of `get`/`set`;
  - fail-closed without the dict.
- **monad:**
  - `openNamespace` consumes the nonce before the signature check;
  - `POST /claims` accepts any challenge.
- **Client:**
  - `signedRequest` sends unsigned when `prove()` fails;
  - the signature travels in the `returnTo` query.

## Corrections to the premises

- **"Non-extractable" does not protect the identity on its own.** The contract already says so (§2): hostile code in the same origin can *use* a non-extractable key without exporting it. Beyond that:
  - `.me` derives its keys deterministically from the root: HKDF → bytes → Ed25519 PKCS8 import (`crypto.ts:1259-1285`). WebCrypto cannot derive an Ed25519 key without the derived bytes passing through JavaScript, so that path cannot be non-extractable.
  - Non-extractability only applies to the agent's **random** key: `generateKey`, kept as a `CryptoKey` in the agent origin's IndexedDB.
  - Recovery would then be: phrase → root inside the agent → **register a new key** (rotation), never re-deriving the old one.
  - Confirm in a test: Ed25519 support in `generateKey` and IndexedDB storage in the target browsers.
- **What is needed is a controlled origin, not another domain.**
  - A subdomain can serve, but `<label>.cleaker.me` is today the grammar of `<handle>.<root>`. Only `www` and `api` are reserved (`monad namespace/identity.ts:18`, the same in production).
  - Whichever label is chosen must be reserved explicitly in:
    - the grammar (cleaker);
    - claim refusal (monad);
    - routing (netget: its own server block, before the wildcard; and no monad behind it).
  - The wildcard certificate covers the TLS name; it does not resolve that collision.

## Decisions after this

1. **The agent's origin**, together with the reservation in the grammar and routing.
2. **The exact v2 format**: fields, maximums, tag.
3. **Fixing F1 and the `me_sig.lua` hardening now**, or with the agent.
