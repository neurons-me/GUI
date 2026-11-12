# Identity access: sync, scan, recover (proposed design)

**Status:** proposed design, 2026-11-12, agreed in direction with the owner. Nothing here is implemented by this
document, and it authorizes no code change, deployment or new operation. It builds on, and does not restate:
- `.me` Identity-Bound Secrets: `me/Typescript/typedocs/Identity-Bound-Secrets.md`, `me/Typescript/src/identity-root.ts`;
- the identity vault design of 2026-09-20 (monad branch `design/identity-vault`,
  `Typescript/typedocs/architecture/identity-vault-design.md`);
- [Identity-Custody-Contract.md](Identity-Custody-Contract.md) (custody of keys, the isolated agent) and
  [Identity-Proof-Migration.md](Identity-Proof-Migration.md) (proof formats).

## The problem it solves (observed 2026-11-12)

A registered identity could be opened only in the browser, and at the address, where its key was saved. Chrome on
`www.cleaker.me` held an old key the namespace rejects (403 `CLAIM_VERIFICATION_FAILED`); Chrome on `cleaker.me` held
none, so the sign-in tried the identity derived from name + secret, which is not the registered one. The person's only
way in was the 12-word phrase, and the screen explained this in a long red paragraph. Correct, but not usable.

## What `.me` already has

- **A random identity root.** 32 bytes from a CSPRNG (`generateIdentityRoot`), never derived from name and secret.
  Branch keys derive from the root. The public key in the directory therefore says nothing about the secret.
- **An envelope.** The root wrapped under a key derived from the secret (PBKDF2-HMAC-SHA256, 600,000 iterations,
  AES-GCM; `wrapIdentityRoot` / `unwrapIdentityRoot`). Ciphertext, designed to be stored.
- **Changing the secret re-wraps the envelope** (`changeIdentityRootPassword`); the root, and so the identity, stay.

What is missing is where the envelope lives: today only in the browser that registered (the local vault).

## Three ways into an identity

When this browser (at this address) has no key for the name, the form offers a choice instead of the error paragraph:

```
This browser doesn't have your key yet.

  [ Sync ]   with your name and secret, from <namespace>
  [ Scan ]   from a device where you are already signed in

  Lost both?  Recover with your 12 words
```

| | Sync | Scan | Recover |
|---|---|---|---|
| Needs | name + secret | a device with an open session | the 12 words |
| What travels | the envelope (ciphertext), opened in this browser | the root, device to device | nothing: the root is rebuilt here |
| Main risk | a weak secret against a stolen envelope (see limits) | none new | the phrase itself |

### Sync

1. The envelope is stored in the person's namespace (the monad), written by the identity itself (signed), never by
   anyone else.
2. A new browser asks the namespace for the envelope **through an online step with rate limits** (per name and per
   client), and opens it locally with the secret. The namespace never sees the secret or the root.
3. The opened root is kept in this browser's local vault, as today; later sign-ins here need no download.

### Scan

A signed-in device shows a QR; the new device scans it and the root (or a key the identity authorizes for that device)
passes between them over a channel bound to both screens. The namespace is not involved and stores nothing new.

### Recover

Unchanged: the 12 words rebuild the root in this browser.

## Two separate actions on an identity

| | Change secret | Close all sessions and rotate the key |
|---|---|---|
| What changes | the envelope's wrapping only | a new random root |
| The tree | nothing is re-encrypted | what is encrypted under keys derived from the root is re-encrypted |
| Old copies of the envelope | still open with the old secret and still give the same root | useless: they hold the retired root |
| Other devices / sessions | stay connected | disconnected: old keys revoked in the keychain (live revocation, already in the monad) |
| Use it for | a secret that is not compromised | someone may have the old secret, an envelope, or a device |
| Authorized by | the current secret | secret + 12 words, or a linked device; never the old root alone |

Rotation also has to settle:
- **Continuity:** if `identityHash` and the public key come from the root, they change. Either the old root signs
  "my successor is this key" before it retires, or the namespace claim is updated to the new key. The name must keep
  pointing to the person.
- **What was shared with others** under the old keys cannot be re-encrypted from this side.
- **A compromised old root** must not be able to rotate first: rotation needs the phrase or a linked device.

## Limits, stated

- **Sync exposes the envelope to offline guessing** by whoever obtains it: from the namespace, or a stolen snapshot.
  PBKDF2 makes each guess costly; a weak secret still falls. Rate limits on the online step stop guessing through the
  namespace, not guessing against a stolen copy.
- **The stronger form is OPRF/OPAQUE:** the namespace contributes an ingredient to the wrapping key that it gives only
  online, so neither a stolen envelope nor the operator can guess offline. Proposed as the second stage of Sync.
- **Address separation:** `cleaker.me` and `www.cleaker.me` are different browser stores. A redirect of www to the
  apex removes that case (gateway configuration, separate change).
- **This is identity access, not isolation.** Pages that receive the root can still use it. The isolated agent
  (custody contract) is a separate track; when it exists, Sync and Scan land the root in the agent instead of the page.

## Decisions still open

1. Where exactly the envelope lives in the namespace and how its read is gated (path, who may read, rate-limit policy).
2. Sync stage 1 (envelope + rate limits) first, or straight to OPRF.
3. What Scan transfers: the root itself, or a device key the identity authorizes (revocable per device).
4. Rotation continuity: signed succession, claim update, or both.
5. The minimum secret strength for Sync, and what the form says about it.
