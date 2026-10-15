# A port in a namespace

Contract: a port belongs to the TRANSPORT, never to the namespace's identity. `name.space` and `name.space:8080` name
the same namespace; they are still two transports; nothing (verification, session, credentials) passes between them
automatically; the same person coming back in must be the same identity.

| File | Group | On the base |
|---|---|---|
| `characterization.test.ts` | documents today's behavior | passes |
| `contract.test.ts` | the wanted contract (vault key, full namespace) | fails: 0/4 |
| `live.test.ts` | the path against a DISPOSABLE monad with throwaway identities | 4/5 (one failure: see below) |

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
