# Port is the transport — integration plan

Status 2026-10-15. Nothing here is integrated, published or deployed. Everything below was measured in isolated worktrees
and disposable processes.

## Contract

A port belongs to the transport, never to the namespace. `name.space` and `name.space:8080` name the same namespace and are
two transports; nothing (verification, session, credentials) passes between them; an explicit door is the only door; the
same person coming back in is the same identity, and the identity a sign-in attempts is said before anything is signed.

## Names, addresses and identity are three different things

- A **canonical name** (`name.space`, what the monad canonicalizes a loopback to) is a spelling the system agrees on.
- A **network address** (a host, a port, an origin) is where a request goes.
- A **verifiable identity** is evidence that the actor behind a name is the same one as before (a signature, a claim, an
  authority record).

Canonicalizing a name proves none of the other two. `suis-macbook-air.local` is not globally unique (another network can
have the same `.local` name); `localhost` and `127.0.0.1` mean "this machine" wherever they are read; `cleaker.me` is a DNS
name whose control can change. "The same namespace" in this plan means "the same name", not "the same actor or tree": that
continuity needs the evidence the claim flow already asks for (signed proofs against a claim), and nothing in this change
weakens or replaces it.

## A signed proof goes only to a destination that was selected

`signIn`/`claim` present a signature. Discovery may list candidates; a signature is presented only to: the origins the node was
built for (preferred/space/bootstrap), the explicit `fallbackOrigins` (empty by default), what the page location or the
operator's environment names, and the origin the signed namespace itself names. The machine hostname and the built-in defaults
(public `cleaker.me`, `localhost`) are guesses: they no longer receive a proof when the primary fails (cleaker K13–K16). An
explicit door (`name.space:9901`) is the ONLY door.

## Exact inputs

| Piece | Where | Version | Commit |
|---|---|---|---|
| cleaker | `all.this/cleaker-port-namespace` (`fix/port-not-in-namespace`, cut from `fix/normalize-surface-origin-port` @ `ee519ef`) | `cleaker@4.0.0` (field unchanged; bump on integration) | `4f66f4b` |
| GUI | `all.this/gui-port-namespace` (`fix/port-not-in-namespace`, cut from `feat/rail-beetle-icon` @ `4765d81b`) | `this.gui@4.1.0` | `d8519bf0` |
| monad | `all.this/monad-candidate` (`candidate/r20261014-1`) — **no source change** | `monad.ai@3.0.0` | `ef4320e7` |
| this.me used to run monad's tests | release `r20261014-1` | `this.me@4.2.0` | (release tree) |
| netget | `all.this/netget-main-entry` (`feat/door-connections`) — **no source change** | `netget@2.7.7` (depends on published `cleaker ^3.2.1`) | `f0d4b8b` |

GUI and monad depend on cleaker as `workspace:*` (no version pin). **netget depends on the published `cleaker ^3.2.1`, so it
does not see this change until a cleaker release exists.**

## What each repo changes

- **cleaker** (4 commits): parser (`fqdn`/`constant` bare, port in `transport`, `expression` round-trips); binder (written
  port applied to the transport it names, scheme kept; `TRANSPORT_PORT_CONFLICT`; an explicit door is the ONLY door — no
  fallback receives a signed proof; namespaces signed/sent/compared bare). Tests NS1 and NRP4 changed on purpose.
- **GUI**: parser mirror; `splitTypedNamespace` ignores a root's port; identity vault found by namespace (any spelling),
  conflicts asked (`VAULT_CONFLICT`), originals kept; `chooseIdentityMechanism`; `TRANSPORT_PORT_CONFLICT` on the card; the
  mechanism is said before signing; `checkWrittenDoor` in `link.ts`.
- **monad**: none. Its parser consumers read `constant`/`prefix`/`fqdn` and already strip ports (`stripPort`,
  `canonicalizeNamespaceConstant`); measured below.

## Monad routes that consume the parser (measured, not assumed)

| File | Reads | Suite (new cleaker) |
|---|---|---|
| `namespace/identity.ts` | `constant`, `prefix` (+ `stripPort`) | via the suites below |
| `kernel/manager.ts` | `constant`, `prefix` → kernel prefix / root test | `kernelManagerNamespace` 3/3, `namespaceRootIsolation` 9/9 |
| `claim/gatewayAuthority.ts` | `constant` | `gatewayAuthority` 10/10 |
| `claim/appAuthorization.ts`, `groupAuthorization.ts` | namespace identity | `appAuthorization` 3/3, `namespaceCollisionAuthorization` 3/3 |
| `runtime/bridge.ts` | `parseNrpTarget(...).fqdn` → `normalizeNamespaceIdentity` | `NRP/bridge.parse` 16/16 |
| `http/nrpHandler.ts` | wire AST `parsed.fqdn` | `NRP/nrpHandler` 5/5, `NRP/nrpDeclaredRoot` 7/7 |

Whole monad-candidate suite, same `this.me@4.2.0`: **cleaker `ee519ef` 669 pass / 5 fail; cleaker `9587508` 669 pass / 5 fail;
0 tests change status.** The 5 failures exist before this change and are not parser-related (a polls id, a deep-equal, a
fingerprint, an array match). Caveat: with the repo-linked `this.me` (stale `dist`) 126 tests cannot run at all
(`IncompatibleMeError`); the numbers above are from the release's `this.me`.

## Behaviors worth a decision before integrating

1. **Fallback policy for addresses that named NO door.** Measured (K14): with `name.space` unreachable, signed open proofs
   are sent to `https://cleaker.me/claims/signIn` and `http://localhost/claims/signIn`. This predates the change. An explicit
   door no longer does this; a bare address still does. Proposal: an explicit `fallbackOrigins` option, default empty for
   non-public roots.
2. **`localhost` is one namespace across ports** (NS1 compat change). Several local monads that were distinguished only by
   port now need distinct names.
3. **Legacy `monad` session backend** (`createSeedSession.buildProof`): not characterized, not claimed compatible.

## The GUI topic branch (separated from the large branch)

`feat/rail-beetle-icon` is 127 commits over `7213a2c1` and mixes themes. The port work needs the **shell restructure**
(`<Me>`/`<Cleaker>`/`QRConnect`/per-link sessions, commits 6–82 and the `origin/main` merge `cb79c8e0`) and not the rail,
orb or corner work. Built by cherry-pick, `topic/port-namespace` (worktree `all.this/gui-port-isolated`):

    cb79c8e0  (shell restructure + origin/main merge)
      + identity card / position label chain (84–98, `fad683fd` … `c89f29c4`)
      + top bar address, /.me page, welcome (110–113), `f85468a0` card namespace
      + link model (`d7804e94`), integration harness (`862e90d8`), per-link sessions (`c1a158c8`), workspace (`4765d81b`)
      + port: tests, vault, parser/door conflict, mechanism note, this plan

Left out on purpose: orb icon work (99–109), left-bar corner/QR control (118–121), `13152626` (QR carries the namespace +
spacing; the IPv4 parser fix inside it was folded into the parser commit). Conflicts resolved by hand: `package.json`
(kept as it was; test entries re-added), `namespaceExpression.ts` (the IPv4 branch), `QRConnect.tsx` (one import),
`links.browser.test.mjs` (sections 6–7 belong to the skipped commits).

Verified on the topic: link 3 groups, port-namespace vault 11 / parser 7 / mechanism 4 / contract 4, browser integration
32/32 (sections 1–5, 8–10). NOT verified: that this topic also builds against today's `main` (4.2.0, deps from npm, no
`QRConnect`): `main` does not contain the shell restructure either, so the topic is based on the restructure's own merge
point; landing on `main` needs the restructure to land first.

## Order

1. GUI: land the link model first (`link.ts`, per-link sessions in `SeedSessionProvider`) — the port commits build on it
   (`checkWrittenDoor`, `explicit`/`openLinks`). `feat/rail-beetle-icon` is still 126 commits and mixed (WP0); split before
   merging, then cherry-pick the 5 port commits (`63fdef82`, `c87e7c63`, `b26cec18`, `d8519bf0`, + docs).
2. cleaker: merge `fix/port-not-in-namespace` after `fix/normalize-surface-origin-port`; bump a minor (behavioral change in
   `fqdn`/`constant`) and publish; then netget's `^3.2.1` range needs an explicit decision (it is a different major line).
3. monad: no source change; rebuild its release against the new cleaker and run the suite above plus the live path.
4. Release candidate assembled from exact SHAs (no floating `workspace:*` between rehearsal and activation).

## Final check (disposable, nothing in production)

The development path, on a disposable OpenResty/netget and disposable monads, throwaway identities, killed by PID:

1. Interface served by netget at the dev door (`fulltrailer.<host>:80`), API on `:9901` as a separate monad/server.
2. Namespace of the interface is the same whether it is reached on `:80` or `:9901`; verification and session do NOT cross.
3. `name.space:9901` unreachable → fails there; the destinations contacted are recorded; no signed proof elsewhere.
4. Phrase identity and password identity both re-enter through either spelling; two old vaults → conflict asked.
5. Rollback = the previous release; cleaker/GUI changes are additive to stored data (vault originals kept).
