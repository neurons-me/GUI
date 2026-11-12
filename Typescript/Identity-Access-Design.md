# Identity access: sync, scan, recover (proposed design)

**Status:** proposed design, revised twice 2026-11-12 after review. First cut: no rotation (see "First cut"). Sync / Scan / Recover stand as an **interface proposal**.
Before anything is implemented, three things have to be closed: what material each flow custodies, how recovery works
after a rotation, and what servers actually revoke (sections 2, 5, 6). Nothing here is implemented by this document, and
it authorizes no code change, deployment or new operation.

It builds on, and does not restate:
- [Identity-Custody-Contract.md](Identity-Custody-Contract.md) (custody of keys, the isolated agent) and
  [Identity-Proof-Migration.md](Identity-Proof-Migration.md) (proof formats, keychain revocation);
- the identity vault design of 2026-09-20 (monad branch `design/identity-vault`,
  `Typescript/typedocs/architecture/identity-vault-design.md`);
- `.me` Identity-Bound Secrets (`me/Typescript/typedocs/Identity-Bound-Secrets.md`).

## 1. The problem (observed 2026-11-12)

A registered identity could be opened only in the browser, and at the address, where it was saved. Chrome on
`www.cleaker.me` held an old saved identity the namespace rejects (403 `CLAIM_VERIFICATION_FAILED`); Chrome on
`cleaker.me` held none, so the sign-in tried the identity derived from name + secret, which is not the registered one.
The only way in was the 12-word phrase, explained in a long red paragraph.

## 2. The materials (two roots, not one)

| Material | Where it comes from | What it is for | Where it is today |
|---|---|---|---|
| **Identity seed** | derived from the 12 words: BIP-39 seed (empty passphrase) -> HKDF -> 32 bytes (`core/identity/recoveryPhrase.ts`) | the `#seed` of `new ME(...)`: identityHash, the proof keys, everything signed as this identity | the local vault (`core/identity/localIdentityVault.ts`), wrapped with `wrapIdentityRoot` under the secret; the `rootId` there is a random label only |
| **Kernel identity root** | CSPRNG (`me/Typescript/src/identity-root.ts` `generateIdentityRoot`) | encryption of branches inside a kernel (Identity-Bound Secrets) | the kernel's `identityRootEnvelope` |

They are not the same material, and wrapping both with `wrapIdentityRoot` does not make them equivalent.

The **identity** is not the seed. The namespace claim **links a name to identifiers and keys** (identityHash, public
keys); it does not by itself define the whole identity. The **GUI identity seed** is the secret material those keys are
derived from. This document is about moving that
seed (or authorizing keys derived from it), never about recovering the identity as a whole. The kernel root is out of
scope.

- **Sync** would carry the **wrapped GUI identity seed** (the same envelope the local vault holds).
- **Recover** rebuilds the **GUI identity seed** from the 12 words; it rebuilds nothing else.
- **Scan** carries either the GUI identity seed or a device key (section 4); that choice is open.

## First cut (scope)

Sync, Scan and Recover keep the **existing** identity. **Rotation of the seed is out of the first cut** (section 5
stays as analysis for later). Changing the secret only re-wraps the seed and revokes no earlier copy.

**Decided (2026-11-12): the seed is unlocked only in the trusted agent.** No cut delivers it to the host page: that
would gain portability while keeping exactly the exposure the custody contract removes. This leaves two distinct
permissions:

| Permission | Where | Status |
|---|---|---|
| **Obtain the encrypted envelope** | from the namespace | a delivery policy, to be defined |
| **Unlock it and use the seed** | inside the agent only | the app receives only the result, or the proof, of an operation the agent authorized |

**Order:** first choose the agent's origin and its trust mechanism (custody contract, decision 1); then design Sync to
end there. No other unlock path is added to apps in the meantime.

**Agent origin and the shape around it, decided by the owner (2026-11-12, refined the same day):**

- **`cleaker.me` is the namespace seeing itself, and the identity agent lives there.** The case "the page is the
  namespace" is kept: at its own door the namespace shows its own view (who it is, sign in, its keys, approvals, its own
  routes such as `/users`, `/blockchain`, `/@handle/...`), drawn as `cleaker.me`, without `@ surface`. The custody
  boundary does not ask for an empty origin; it asks that the code running there be **small, reviewed and trusted**:
  no app modules, no third-party scripts, no remote UI documents, strict CSP, `frame-ancestors 'none'` for approval
  screens.
- **`neurons.me` is the environment:** the full .GUI, the gateway panels, the apps. A namespace is seen from outside
  there (`cleaker.me @ neurons.me`), its routes opening over the site's view. For anything signed, it asks the agent at
  `cleaker.me` and receives only results or proofs.
- **netget is what serves, not what is served.** The gateway routes each domain to its composition. `netget.site`
  redirects to `neurons.me` (one address for the interface, one browser store), or keeps only the gateway's API.
  `www.cleaker.me` redirects to `cleaker.me`.
- **`all.this` is the source of the modules** (`this.me`, `cleaker`, `this.gui`, netget's GUI, apps), published as
  packages. Each address is a composition of them:
  - **`cleaker.me` receives them compiled and pinned inside its own release** (exact versions, reviewed), never loaded
    live from a CDN: a CDN or registry serving that origin would be inside the agent's trust boundary. Publishing a new
    `this.gui` does not change the agent; only a new `cleaker.me` release the owner activates does.
  - `neurons.me` and the apps may load modules from a CDN (pinned versions, SRI preferred): they are outside the agent's
    boundary.
  - **No third-party scripts in the agent origin**, including analytics and tracking (Meta Pixel, GTM): the agent's
    page is built from its own HTML, never from a shared site template that carries them. The public sites (docs,
    `neurons.me`) may carry them; the agent may not. Checked by `tests/integration/agent.browser.test.mjs` (15.1).
- **Deployment and updates of `cleaker.me`:** whoever can change the code served there is inside the trust boundary;
  releases follow the hash-guarded kit and rollback procedure, activated only by the owner.

**In one sentence:** `cleaker.me` custodies and asks for approval; `neurons.me` presents the apps; each server
verifies and authorizes.

Precisions:
- **`cleaker.me` is not the identity.** It is the namespace and the origin chosen to custody and use the identity's
  material. The identity must not depend on that domain staying available: the 12 words allow rebuilding the seed
  without depending on that domain, using a compatible and trusted implementation. In this design they are entered
  only in the agent. Cryptographic independence does not mean entering them in any page, and it does not recover data,
  the claim or the server's permissions.
- **A minimal view does not create isolation by itself.** Isolation exists only when the apps no longer sign (their
  signing paths retired) and the servers verify the new proofs, permissions and revocation. The agent prototype exists
  (`src/agent`, `me-agent/1`); it still has to be integrated and hardened (proof format and migration:
  [Identity-Proof-Migration.md](Identity-Proof-Migration.md)).
- **Handles stay an open decision.** Redirecting `<handle>.cleaker.me` to `cleaker.me/@<handle>` is a proposal, not a
  condition of isolation: a public view can live on another origin and ask the agent for signatures.
- **Redirects do not move saved identities.** Before `www.cleaker.me -> cleaker.me` is activated, anyone whose only
  saved copy is on `www` needs an explicit recovery or migration.

Open, before implementation:
- **Handles:** where a handle's own view lives (the `/@handle` redirect above is one proposal); the name grammar
  `<handle>.<root>` does not change either way.
- **What exactly belongs to `cleaker.me`'s own view** and what stays in `neurons.me` (the namespace's directory and
  chain are the namespace's; gateway panels are the environment's).
- **Reads from `neurons.me` to `cleaker.me`:** cross-origin from now on; CORS for public reads only, never for signing
  or sign-in.

**Order of execution:**
1. Close the agent–app–server protocol and its security tests.
2. Prepare the trusted view (`cleaker.me`) and the external environment (`neurons.me`), without activating them.
3. Migrate existing access (saved identities, including `www`) and test it.
4. Activate the new interfaces and the approved redirects.
5. Add Sync / Scan / Recover according to their contracts.

## 3. Interface: a choice instead of the error paragraph

When this browser (at this address) has no saved identity for the name, the form offers:

```
This browser doesn't have your key yet.

  [ Sync ]   with your name and secret, from <namespace>
  [ Scan ]   from a device where you are already signed in

  Lost both?  Recover with your 12 words
```

| | Sync | Scan | Recover |
|---|---|---|---|
| Needs | name + secret | a device with an open session, at hand | the 12 words |
| What travels | the wrapped GUI identity seed (ciphertext), opened in the agent | the seed or a device key, device to device (landing in the agent) | nothing: the seed is rebuilt in the agent |
| Main risks | offline guessing of the secret against any copy of the envelope (section 4) | binding to the right device, approval, expiry, replay (section 4) | the phrase itself |

## 4. The flows, with what each still has to define

### Sync

1. **The envelope** (the wrapped identity seed) is stored in the person's namespace, written by the identity itself.
   Stored with: the identityHash it belongs to, a version (monotonic), and a signature by the identity over
   `{identityHash, version, envelope}`.
2. **Reading it** is an online step. A rate limit on it limits downloads; it **does not prove identity** and does
   **not protect a copy already obtained**. What the step proves (and to whom the envelope is served) is to be defined:
   anyone who knows the name, or only after a challenge.
3. **Opening it** happens only inside the trusted agent, with the secret. Before using the seed, the agent checks
   that it derives the identityHash the claim links to the name and that the signature verifies under that identity.
   **Freshness is not solved by a version number alone.** A new browser does not know the latest version, and an old
   envelope carries a valid signature. A signed statement "current version = N" is not enough either if it can be
   replayed later: it must be bound to a **fresh request** (a challenge the agent chooses) and checked against the
   current state. **Trust stated:** the challenge stops a replayed old answer; it does **not** protect against a
   compromised authority that signs false information (e.g. "N is current" for an old envelope). The agent trusts that
   authority to report the current version honestly. Which authority, and how far it is trusted, is an open decision.
   Until then a new browser can be served an old envelope (e.g. one wrapped under a secret the person changed because
   it leaked).
4. **Limits.** Anyone who obtains the envelope (from the namespace, a backup, a stolen snapshot) can guess the secret
   offline; PBKDF2 makes each guess costly, a weak secret still falls.
5. **These limits are properties of the current Sync** (a stored envelope). A future flow could be **OPAQUE (RFC 9807)**,
   an aPAKE protocol whose guarantees come from the **whole protocol**, not from adding an OPRF to an envelope. If it
   were chosen, its properties would be those of that flow (as stated in the RFC, which also considers dictionary
   attacks after server compromise), not of the current Sync. Whether to adopt it is an open decision.

### Scan

New risks it introduces, each to be designed: binding to the right device (the code shown is consumed by the device
that is meant to consume it), **visible approval** on the signed-in device, **expiry**, and **replay protection**.
What is transferred changes the consequences:
- **the identity seed itself**: every device holds the same secret, and no device can be cut off without rotation;
- **a key the identity authorizes for that device**: revocable per device in the keychain, the seed never leaves.
The second fits the keychain and the custody contract better; the choice is open.

### Recover

Unchanged today: the 12 words rebuild the identity seed in this browser. Section 5 says what this means after a rotation.

## 5. Change secret and rotate: what each really does (rotation: not in the first cut)

### Change secret

Re-wraps the envelope under a new secret. The identity seed does not change, nothing is re-encrypted, nothing is
disconnected. Copies of the envelope wrapped under the **old** secret still open with it (hence the version check in
Sync step 3, and why a suspected leak needs rotation, not this).

### Rotate (a new identity seed)

What rotation can and cannot do, kept apart:
- **Old copies are not made useless.** Anyone holding the old seed (or an old envelope and its secret) can still
  decrypt data that was encrypted under it, and can still produce signatures with it.
- **Rejecting old signatures** requires every verifier to apply revocation of the old keys (keychain status, checked
  live). A verifier that does not check revocation keeps accepting them.
- **Closing existing sessions** is a third, separate operation: sessions already issued must be invalidated where they
  are held (the monad's admin session already dies on its next use when its key is revoked; other session kinds must be
  listed and checked).
- **Re-encrypting data** under the new material is a fourth; data shared with others under old keys cannot be
  re-encrypted from this side.

### Recovery after a rotation (to design before rotation is offered)

The 12 words rebuild **one** identity seed. If rotation generates a new random seed, the old words do not recover it.
Options: rotation issues new words for the new seed (and the person must store them); or the new seed derives from the
same words plus a rotation counter (then the words are a long-term master, and a leak of the words defeats rotation).
Until this is chosen, rotation must not be offered.

### "Secret + 12 words" is not two independent factors

If the words rebuild the identity seed, anyone who has stolen the seed can produce proofs equivalent to having the
words. Requiring "recovery" as an extra factor for rotation only means something if the server holds an **independent
recovery authority** registered beforehand (a separate key, kept apart from the seed), and checks it.

## 6. What servers revoke (to inventory)

Before rotation is designed: per verifier (the verifier map of 2026-11-10 is the starting list), whether it checks key
revocation live, which sessions it issues and how they end, and what it caches. This sets what "close all sessions"
can honestly promise.

## 7. Separate, small

- **Address separation:** `cleaker.me` and `www.cleaker.me` are different browser stores. A redirect of www to the
  apex removes that case (gateway configuration).
- **This is identity access, not isolation.** Pages that receive the seed can still use it. When the isolated agent
  exists, Sync / Scan / Recover land the material in the agent, not in the page.

## 8. Decisions still open

Decided: the seed is unlocked only in the trusted agent (see "First cut").

First cut, in order:
1. **The agent's origin and its trust mechanism** (custody contract, decision 1). Sync is designed after this.
2. The delivery policy for the encrypted envelope: what the online step proves, and to whom it is served.
3. Envelope binding, and **which authority reports the current version**, answering a fresh challenge.
4. What Scan transfers: the seed, or a device key authorized by the identity.
5. The minimum secret strength for Sync, and what the form says about it.

Later (rotation):
6. Whether a future flow is OPAQUE, with its own stated properties.
7. Recovery after rotation: new words, or words + counter.
8. An independent recovery authority: whether to have one, where it is registered, who checks it.
9. The revocation inventory per verifier (section 6).

The agent–app–server protocol these flows end in: [Agent-Protocol.md](Agent-Protocol.md).
