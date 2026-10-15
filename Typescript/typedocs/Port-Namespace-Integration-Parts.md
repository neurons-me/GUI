# Port-is-the-transport — integration by reviewable parts (2026-10-15)

Nothing here is merged, published or deployed. The reference candidate (`~/.get/candidates/port-is-transport-*`) stays as the
verified whole; this document splits it so each part can be reviewed and landed on its own.

Separation criterion: **functional dependency** (a later commit uses something an earlier one introduced; removing the earlier
one breaks types or tests) is not the same as **textual coupling** (two commits edit the same lines of `Namespace.tsx` /
`QRConnect.tsx`; reverting one conflicts). Only the first forces an order.

## Part A — cleaker (its own repository; independent of every GUI part)
Branch `fix/port-not-in-namespace`, over `fix/normalize-surface-origin-port` @ `ee519ef`:

| commit | what |
|---|---|
| `c1c9c18` | tests: a port in a namespace -- characterization (passes on base) and contract (fails where it contaminates) |
| `4e270a7` | port is the transport, never the namespace: constant/fqdn bare, written port reaches the transport |
| `9587508` | binder: an explicit door is the only door -- no fallback destination receives a signed proof |
| `4f66f4b` | binder: a signed proof is presented only to SELECTED destinations; fallbackOrigins is explicit (empty by default) |
| `a03c7cc` | binder: the namespace's own origin takes its scheme from the parser's host rule (loopback and .local: http) |
| `d6ea6bd` | binder: the page's location and the environment do not authorize a destination for a signature |
| `7ab983a` | binder: the declared origins ARE the transport; a written port is checked against them, not against a host match |
| `d044746` | binder: discovery and the authorization to send a signature are separate (authorizeDiscovered) |

Review as one unit; it needs nothing from the GUI. Checked against the monad: the whole suite with the base and with this
cleaker gives the same 667 pass / 5 fail (0 tests change). netget depends on the PUBLISHED `cleaker ^3.2.1`: it does not see this
part until a release exists and its range is moved on purpose. Behavior changes to approve: `fqdn`/`constant` carry no port
(NS1, NRP4); a signature goes only to the declared transport plus the sources listed in `authorizeDiscovered`
(`TRANSPORT_NOT_DECLARED` otherwise); a contradicting written port is `TRANSPORT_PORT_CONFLICT`.

## Part B — GUI: the position label and the link model (functional prerequisites of the port change)
| commits | role | evidence |
|---|---|---|
| `226e53a5` `071bf16e` `8be67277` `b6a50ebe` `da1e8cae` `a1985c3e` | position label chain (`positionExpression.ts`, `RootCheck`, `sharedRootBinding`, `confirmedLabel`, `lastAttemptFailed`) | later link commits `98dcbb8f` and `f45fc42b` use identifiers these introduce |
| `98dcbb8f` | the card's namespace follows the selected link | uses the label chain; carries the `hideBarItems` prop and `topBarLeftElements` |
| `17934e04` `95b80cb7` | `link.ts`: link, session, context, workspace as pure values | pure; `checkWrittenDoor` (port part) is appended later |
| `8b27b0b9` | browser integration harness (`demo/links.*`, fake monads) | test infrastructure |
| `f45fc42b` | one session per link; the card selects a link | `SeedSessionProvider.tsx` + `QRConnect.tsx` |

## Part C — GUI: the port change (4 commits)
`f7e1a807` tests; `bf37053c` identity vault found by namespace (conflicts asked, originals kept); `43c46709` parser mirror,
typed root, `TRANSPORT_PORT_CONFLICT`, `chooseIdentityMechanism`; `5a35b123` the card says which key will be used before signing.
Needs Part B (`f45fc42b`: the per-link `op` scope the vault/door code uses; `link.ts` for `checkWrittenDoor`).

## Part D — GUI: interface, separable in intent (review independently)
| commit | verdict from the evidence |
|---|---|
| `20c85667` main-server view: door and namespace on one line | reverts CLEANLY; types and unit tests unchanged — independent |
| `e6026e34` identity card icons spacing | reverts cleanly — independent |
| `8425bc77` `glyph:<text>` icon, Netget link | reverts cleanly — independent |
| `45668a3c` QR declares `cornerRadius` | reverting adds 2 type errors: it is a type FIX the tree needs to compile; carry it with Part B |
| `03368bd1` `cc65ae8a` main-server view reads / observed state | edit `MainServerView.tsx` + `mainServerPresentation` only; no later commit of B/C uses what they introduce; revert conflicts only because later `main-server view` commits edit the same lines — review as one `main-server view` group |
| `b5dcd6e7` keys/wallet icons | no later use; textual overlap with `e6026e34` and `Namespace.tsx` |
| `dd90c5ae` `3d19ee34` the rail QR opens the card over the page; focus returns | used only by the `/.me` page chain below; textual (`Namespace.tsx`) |
| `6a5cf8b3` `826a29bf` `/.me` as a page, Welcome at `/` | no use by B/C beyond `Namespace.tsx` context |
| `7947d949` top bar writes the namespace at its left | `98dcbb8f` edits `topBarLeftElements`: carry with Part B or re-do that hunk |
| `d0fc83d7` `hideBarItems` + main-server line | `98dcbb8f` uses `hideBarItems`: the prop (not the main-server hunk) is a prerequisite |

Not in the candidate and not needed: the orb icon work (99–109 of the large branch), the left-bar corner/QR control, and the
QR-carries-namespace/spacing commit (`13152626`; its IPv4 parser fix is inside the port parser commit).

## Evidence and its limits
- Revert matrix (`separability.revert-matrix.tsv` in the from-scratch candidate): revert ONE commit from the topic head, then
  `tsc` and the unit suites. 3 interface commits revert cleanly; 1 is functional (types); the rest conflict textually.
  A revert conflict says later commits touch the same lines, not that they depend on it.
- Identifier analysis: for each interface/position commit, the identifiers it introduces that a later link/port commit uses.
  It is a heuristic (a few hits are ordinary words); the real hits are `hideBarItems`, `topBarLeftElements`, `RootCheck`,
  `sharedRootBinding`, `confirmedLabel`, `lastAttemptFailed`, `composePosition`, `positionComposed`.
- NOT done: building Part B and Part C as standalone stacked branches over `cb79c8e0` WITHOUT Part D. The conflicts it needs are
  hand resolutions in `Namespace.tsx` and `QRConnect.tsx`; that is the next piece of work and would be reviewed hunk by hunk.

## Order
A (anytime, independent) → the restructure that makes `<Me>`/`<Cleaker>`/`QRConnect` exist on `main` (a separate decision) →
B → C → D in any order and independently. Acceptance per part: A `npm test` of cleaker (contract 22/22); B + C
`npm run test:runtime` (vault 11, parser 7, mechanism 4, contract 4, integration 32) and `npm run test:recorrido`; the
real-monad path with `REAL_MONAD_SRC` set (9/9).
