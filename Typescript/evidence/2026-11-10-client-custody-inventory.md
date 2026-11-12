# Evidence · client custody inventory · 2026-11-10

**Kind:** dated evidence, not a requirement. What the code does on this date. The requirements are in
[Identity-Custody-Contract.md](../Identity-Custody-Contract.md) (gate 5). The migration proposal built on this
is in [Identity-Proof-Migration.md](../Identity-Proof-Migration.md).

**Method:** read-only. No servers or tests were run. No secret, key or snapshot file was opened. Each
file cited below was compared (`cmp`) against the production source tree. Server verifiers are in
[2026-11-10-server-verifier-map.md](2026-11-10-server-verifier-map.md).

## Revisions examined

| Repo | Local | Production |
| --- | --- | --- |
| GUI | `d1e72270` main. 15 dirty files, none of them signing code: `Namespace.tsx` is dirty, but the diff touches no sign, seed, vault, key or storage code; only its line numbers shift. | source `a774da33` (r20261108-3). The interface the VM serves was rebuilt from `d3d22c77` (bundle `index-DwjEXdsx.js`). |
| me | `1831c65` main | `fed754b` (`me.ts` prove and `crypto.ts` unchanged) |
| cleaker | `ee519ef` (fix/normalize-surface-origin-port) | `7b598e8` (`binder.ts` differs in lines, not in signing logic) |
| netget front end | `e683571` | `dc34f45` |

"Prod = yes" means the code is in r20261108-3. For the interface it also means the marker strings were
found in `index-DwjEXdsx.js`. The marker check was run against the copy in `~/.get/releases/r20261109-1`, not
against the file the VM serves.

Paths are relative to `packages/GUI/Typescript/src` unless they name a repo.

## A · Where the secret is received (typed into the page)

| Where | What | Flow | Prod |
| --- | --- | --- | --- |
| `react/session/MeLauncher.tsx:110-121,363` → `gui/All.This/Cleaker/QRConnect.tsx:542-549,851` | username + password | sign-in | yes |
| `gui/All.This/Cleaker/Claim/Claim.tsx:68,113,138,268,277` | 12-word phrase generated and shown in the page; password | registration | yes |
| `react/session/RecoverAccount.tsx:62,83,113,123` | phrase typed in the page; new password | recovery | yes |
| `gui/All.This/Cleaker/Claim/LinkIdentity.tsx:59,127` | username + password | identity linking | yes |
| `react/session/Namespace.tsx:976,1272` (fields of `CleakerKeychain`) | keychain passphrase | gateway admin / keychain | yes |
| `react/session/SessionSurface.tsx:7-16` | nothing typed: **generates a root seed and stores it in plaintext** | anonymous "operator" sign-in (npx scaffold) | in the tree; not used by netget |
| `SignUp/Modal.tsx`, `hooks/useCleakerSignUp.ts`, `access/ui/PinVerificationModal.tsx` | password / PIN | old registration | no consumer outside stories |
| netget `frontend_local/src/session/resolveNetgetSeed.js:36-41` | username + password → compound seed | sign-in | present but bypassed (`App.jsx:203` forces `sessionBackend="cleaker"`) |

## B · Where private material is derived or stored

| Where | What | Lifetime |
| --- | --- | --- |
| `me/src/me.ts:155-157` | `compoundSeed = keccak256("me.seed/compound:v1::"+user+"::"+password)` | memory |
| `core/identity/recoveryPhrase.ts:80-87` | root = HKDF(BIP-39 seed; `this.me/bip39-recovery:v1`) | memory |
| `me/src/crypto.ts:1259-1272` | signing key = HKDF(root, info `me.prove.v1`, salt = expression). **It does not depend on the gateway or the root namespace**: the same key everywhere. | re-derived on every signature |
| `me/src/crypto.ts:1274-1285` | Ed25519 key imported with **`extractable = true`** (verified) | transient |
| `me/src/me.ts:352-356, 404-416` | **The kernel exposes its root seed** through `Symbol.for('me.seed')` and `Symbol.for('nodejs.util.inspect.custom')`. Both are global symbols, readable by any code that holds the `me` object (verified). | as long as the kernel lives |
| `core/session/createCleakerSession.ts:214`, `core/session/heldIdentities.ts` | root in hex inside the session closure / WeakMap. `logout()` does not clear it. | memory |
| `core/identity/localIdentityVault.ts:16,33-48` | root encrypted (PBKDF2 600k + AES-GCM) in **localStorage** `this.me.identity-vault:v1:<ns>` | persistent |
| `Keychain/localKeychainKeyVault.ts:87-148` | random Ed25519 seed per keychain key, encrypted the same way in localStorage. Once unlocked it sits in a module `Map`. | persistent / until reload |
| `react/session/SessionSurface.tsx:7-16` | **root in plaintext in localStorage**. The scaffold uses `${app.id}.operator.seed:v1` (`npx/template/src/main.tsx`). | persistent |
| `me/src/me.ts:122,169-189` | anonymous `new ME()` seed in plaintext `this.me.seed:v1` | persistent; not an identity unless claimed |

No key is kept as a stored, non-extractable `CryptoKey`. No IndexedDB was found.

## C · Who signs (Ed25519; canonicalization `normalizeProofMessage`, sorted JSON, `me/src/crypto.ts:1170-1182`)

| Signer | Key | What it signs | Prod |
| --- | --- | --- | --- |
| `me.prove()` `me/src/me.ts:673-706` | branch key | `{challenge, expression, identityHash, namespace, rootNamespace, timestamp}` — no version, origin, audience or expiry | yes |
| cleaker `proveKernelNamespace` (`binder.ts`), claim (`challenge:null`), signIn (`"open:"+uuid`) | branch | the same | yes |
| `signedRequest()` `gui/All.This/Cleaker/signedRequest.ts:221-258` → `X-Me-Proof` | branch | challenge = `{method,path,query,bodyHash,nonce,timestamp}`. **If `prove()` fails, it sends the request unsigned** (:255-257, verified). | yes (netget `Domains.jsx`) |
| `createCleakerSession.signPayload(message)` `:435-439` | **the same branch key** | **any string from the caller** (verified) | yes |
| `createCleakerSession.signAndWrite` `:468-480` | branch | `{operation:'write', expression, value, identityHash, namespace, expectedHeadHash}` | yes |
| `groupsApi.ts:77` → `/api/v1/commit` | branch (signPayload) | `{events, identityHash, namespace}` | yes |
| `keychainClient.ts:238-381` | root or keychain key | `{op: keychain-register\|sign\|revoke\|recovery, namespace, …, nonce, timestamp}` | yes |
| `keychainClient.ts:403` `signWithKeychainKey` | keychain key | **any string** | yes |
| `react/session/Namespace.tsx:812-835` | keychain key | `{op:'netget-claim-gateway', gatewayId, namespace, identityHash, keyId, challenge, timestamp}`; **the signature travels in the `returnTo` query** (verified in production) | yes |
| `react/session/Namespace.tsx:1150` | keychain key | the server's raw challenge → `/admin-session/verify` | yes |
| `gatewayAuthorityClient.ts:60,86,108` | keychain key | `gateway-grant-admin\|revoke-admin\|transfer-owner` | no (stories only) |
| `agent/prove.ts` + `agent/protocol.ts:119-130` | **the same branch key as `prove()`** | `me-agent/1` challenge (adds `v`, origin, audience, expiresAt) | not wired or exported |

## D · Consumers (what would break if in-page signing were removed)

| Surface | Exposed APIs that can sign | Production consumers |
| --- | --- | --- |
| `this.gui/cleaker` (`cleaker-entry.ts`) | `deriveCleakerNode(user, secret, host)`, `deriveCleakerNodeFromMe`, `deriveCompoundSeed`, `signedRequest` | netget `Domains.jsx` (`/domains/metadata`, `/check-auth`) |
| `this.gui/react` (`react-entry.ts`) | `SeedSessionProvider` and `useSeedSession` (expose `session` and `me`), `loginWithCredentials`, `registerWithCredentials`, `recoverWithPhrase`, `linkExistingIdentity`, `SessionSurface`, `Namespace`, `Cleaker` | netget `App.jsx`; npx scaffold |
| `this.gui` / UMD `window.GUI` (`index.ts`, `vite.config.js:255-263`) | `createSeedSession`, `SeedSessionProvider`, `CleakerGroup`, `writeForAudience` | **netget `assets/namespace-surface/assets/this.gui.umd.js`** (Oct 5 build, the same in production; contains `signPayload`/`signAndWrite`/`X-Me-Proof`), served at `/ns-assets/` |
| `cleaker.js` (`cleaker-standalone.ts`, `window.Cleaker`) | none (public only) | — |
| internal | `audienceWrite.ts`, `AudienceLab.tsx`, `sidebarCompositionIO.ts` (signAndWrite) | sidebar in the bundle |
| cleaker node | `node.kernel` returns the full `me` (`binder.ts:2001`) | — |

## Answers

1. **Can code running on an ordinary page that loads this.gui or cleaker use the identity today? Yes, in four independent ways:**
   - It can read the root seed from any kernel it holds (`Symbol.for('me.seed')`).
   - It can call signing oracles: `signPayload(any string)`, `me['!'].prove(any challenge)`, `signedRequest`, `signWithKeychainKey`.
   - It can read localStorage: the encrypted root and keys can be taken out and guessed offline, and the scaffold's root is in plaintext.
   - Secrets are typed into the page's DOM.

   **Consequence for the agent:** `signPayload` signs any string with the same key as `prove()`, and `prove()` signs sorted JSON. So a page that holds `signPayload` can manufacture any `prove()` proof, any `X-Me-Proof` and any `me-agent/1` challenge for that identity. While a page holds a kernel or `signPayload`, the agent isolates nothing.
2. **Is it persisted across reloads? Yes, all in localStorage:**
   - `this.me.identity-vault:v1:<ns>` (encrypted root);
   - keychain keys (encrypted);
   - the SessionSurface root (plaintext);
   - `this.me.seed:v1` (anonymous seed, plaintext).
3. **Formats.** The table in C. Two signers sign any string with no field structure: `signPayload` and `signWithKeychainKey`. Outside the unwired agent, no proof carries a version, origin, audience or expiry.
4. **What breaks.** Every consumer in D:
   - sign-in, registration, recovery and linking;
   - netget's `Domains.jsx`;
   - groups, `writeForAudience` and the sidebar;
   - keychain, gateway claim and admin session;
   - the exports of `this.gui`, `this.gui/cleaker` and `window.GUI`.

## Verified by re-reading (not only reported)

- `Symbol.for('me.seed')` and `inspect.custom` expose the seed (`me.ts:352-356, 404-416`).
- `extractable=true` (`crypto.ts:1280-1284`).
- `signPayload` = the same branch key over any string.
- `signedRequest`'s unsigned fallback.
- SessionSurface's plaintext seed.
- The signature in `returnTo` (production tree).
- `sessionBackend="cleaker"` in netget `App.jsx:203`.

## Not examined

- The npm tarballs third-party sites actually load.
- Whether the VM serves exactly `index-DwjEXdsx.js` (not read on the VM).
- The old bundles in netget's `main-server-ui/dist/assets`.
- The logins of FullTrailer, Polls and other apps.
- Whether `<Me>`/`MeField` anonymous kernels end up claimed and signing.
- The secret branches and recipient keys of `.me` (decryption, not signing).
