# A port in a namespace

Contract: a port belongs to the TRANSPORT, never to the namespace's identity. `name.space` and `name.space:8080` name
the same namespace; they are still two transports; nothing (verification, session, credentials) passes between them
automatically; the same person coming back in must be the same identity.

| File | Group | On the base |
|---|---|---|
| `characterization.test.ts` | documents today's behavior | passes |
| `contract.test.ts` | the wanted contract | base: 0/4; now H3/H4 (vault) pass, H1/H2 pending the next change (parser/naming) |
| `vault.test.ts` | the vault lookup: both migration directions, conflict, originals kept | new, 11/11 |
| `live.test.ts` | the path against a DISPOSABLE monad with throwaway identities | base 4/5; now 11/11 |

(The parser/binder side lives in `cleaker`, branch `fix/port-not-in-namespace`: `tests/port-namespace.*.test.ts`,
characterization 7/7 pass, contract 2/7 pass.)

## What was measured (base)

- cleaker's binder (the `cleaker` session backend that `<Cleaker>` uses) already signs the BARE root and the monad
  canonicalizes without the port: a password-made identity re-enters with the same identity and namespace through either
  spelling (live, 3/3).
- A written port is DROPPED from the request when the node was built without it (the request goes to the base's port).
- The parser's `constant`/`fqdn` carry the port, and everything the GUI derives from them inherits it: the full
  namespace (`ana.name.space:8080`) and with it the key of the local identity vault.
- Live consequence: an identity made from a recovery PHRASE (its root lives in the vault, keyed by the full namespace)
  cannot re-enter when the root is written with the port: vault miss -> compound seed -> `CLAIM_VERIFICATION_FAILED`.
  Password-made identities are not affected (their seed does not depend on the namespace).
- Not measured: the legacy `monad` session backend (`createSeedSession`'s `buildProof` signs `parsed.constant`, i.e. with
  the port) -- it fails here before signing with the current `this.me` (`ME_SET_ACTIVE_EXPRESSION` is not a function),
  so its behavior could not be characterized; it is not what `<Cleaker>` uses.

## Open decision

`cleaker/tests/namespace-expression.test.ts` NS1 asserts `localhost:8191` has constant `localhost:8191`: a port IS part of
a local namespace there (several local monads on one machine). The contract (K7) says otherwise. That is a design
decision for the owner, not a bug to fix silently.

## Run

```
npx tsx tests/port-namespace/characterization.test.ts
npx tsx tests/port-namespace/contract.test.ts
# live: a disposable monad on a free port, killed by its PID afterwards
PT_ORIGIN=http://127.0.0.1:<port> PT_ROOT=port-test.local npx tsx tests/port-namespace/live.test.ts
```

## Change 1 (this branch): finding the vault

`findLocalIdentityVault` (core/identity/localIdentityVault.ts) finds an identity's vault by the namespace without its port,
under any stored spelling; writes go to the canonical key; originals are never removed or rewritten. If spellings unlock
to different identities it is a conflict: `loginWithCredentials` fails with `VAULT_CONFLICT` (candidates with an offline
fingerprint, no network) and the card asks; `vaultChoice` is the pick. A missing vault is not turned into another
identity: the compound seed is tried only as an OPEN (never a claim), and a refusal offers Recover Account.

NOT in this change (next, separate): the parser's `constant`/`fqdn`, the transport dropping a written port, NS1.

## Change 2 (this branch): the port is the transport

Parser (GUI `namespaceExpression.ts`, and `cleaker` branch `fix/port-not-in-namespace`): `fqdn` and `constant` no longer
include the port; it lives in `transport.port` / `transport.origin` and in the written `expression` (round trip).
`splitTypedNamespace` ignores a port written in the root. A port written against a link whose transport names a DIFFERENT
explicit port is `TRANSPORT_PORT_CONFLICT`: reported, nothing sent (`checkWrittenDoor` in `src/react/link.ts`).

COMPATIBILITY CHANGE: cleaker's NS1 asserted `localhost:8191` has constant `localhost:8191` (several local monads, one
namespace each). It now asserts `localhost` + `transport.port 8191`: `localhost` keeps its namespace when the port changes and
each origin is a distinct transport. Namespaces that must differ need different names.

"No vault": `chooseIdentityMechanism` (core/identity/localIdentityVault.ts). Exactly two sources sign an open: the stored vault
root, or the identity DERIVED from name + secret (the form's own mechanism; used only when no vault exists under any spelling,
never after a vault was found or in conflict, only as an `open`). The failure message states that the derived identity was
tried. The legacy `monad` session backend is NOT covered and is not claimed compatible.

Not in the parser change on purpose: `useCleakerNamespace`'s seed fallback (`normalizeNamespaceSeed(constant)`) would derive from
a port-free root now; it has no consumers (the hook is not wired in), so no identity is affected today. Documented here before
anyone wires it.

Live (disposable monad, new cleaker): 11/11. Browser integration: 43/43.
