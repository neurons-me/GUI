# Root endpoint inventory — 2026-11-11

**Kind:** dated evidence (what the code and the live door do), not a requirement or a decision. Input for
[Root-Endpoint-Publication-Review.md](../Root-Endpoint-Publication-Review.md).

## What was examined

- **Live:** `GET https://cleaker.me/` without `Accept: text/html`, 2026-11-11 after the flood cleanup (VM release
  r20261108-3 + F1 hotfix). Copy kept privately at `~/.get/evidence/root-endpoint-2026-11/` (mode 700, not in git).
- **Code:** monad `b710c5ed` (same as deployed): `app.ts:185-191`, `handlers/ledgerHandler.ts` (`root`, `rootRead`,
  `usersVisibleFrom`, `readBlocks`), `http/shell.ts` (`wantsHtml`), `http/namespace.ts` (`filterBlocksByNamespace`).
- **Consumers searched:** GUI `src`, cleaker `src`, netget `main` (front end + modules), `apps/`. Tests, stories and
  `dist/` excluded.

## How the endpoint decides

- `GET /` with `Accept` containing `text/html` → the HTML shell with the provider boot (`ledger.root`).
- Anything else → `ledger.rootRead`: JSON `{ ok, target, rootNamespace, lens, users, blocks, count }`.
- No authentication. Headers: `Access-Control-Allow-Origin: *`, `Cache-Control: no-store`.
- `blocks`: the chain filtered by the request's namespace, newest first, `?limit` default and maximum **5000**;
  `?identityHash=` filters by author.
- `users`: the root's directory when the address is the monad's own root or a bare network address; otherwise only the
  handle that the address names, or nothing.

## What it published (live response, 1.58 MB)

| Category | In the response | Count |
|---|---|---|
| Users | `username`, `identityHash`, `publicKey`, `createdAt`, `updatedAt` | 1 |
| Request telemetry | `surface.usage.*`: method, url, status, host, timings, CPU/RAM ratios, signed | 2,171 blocks |
| Mesh / host telemetry | `_.mesh.*` (monad id, endpoint, public key, tags, last seen); `surface.host.*` | 169 + 30 |
| `read` memories | value = the segments of a namespace (e.g. `["jabellae","cleaker","me"]`) | 324 |
| Domains | `domains.<name>.registered/identity`, `domainIndex.<name>.owner` | ~35 |
| Gateway authority | `daemon.gateways.<id>`: owner, admins, grants, pubkeys, usernames, namespaces | 1 |
| Keychain | `keychain.keys.<keyId>`: label, publicKey, `admin`, `authorization`, addedAt, addedBy | 1 |
| Claims and pointers | `daemon.claims.*` (namespace, identityHash, publicKey), `daemon.users.*`, `users.<h>` `__ptr` | few |
| Sessions | `session.opened_at` (timestamps of session opens) | 6 |
| Root | `@` `{__id: "netget"}` | 1 |

Every block also carries `memoryHash`, `prevMemoryHash`, `timestamp`, `namespace`, `operator`; `authorIdentityHash`,
`authorPublicKey` and `signature` were empty in all 2,744.

**The same blocks are served by `/blocks` and `/blockchain`** (same `readBlocks`, limit up to 5000) and per path by
`/@*`. Restricting `/` alone would not change what is published.

## Consumers found

| Consumer | Calls | Uses |
|---|---|---|
| `src/react/session/Namespace.tsx:320` (`CleakerTopSearch`, the top search) | `GET <monad>/` | `users` only |
| `src/gui/All.This/Cleaker/Namespace/Usernames/Usernames.tsx` (Users page) | `GET <endpoint>/` | `users` only |
| `src/gui/All.This/Cleaker/Namespace/Blocks/BlocksTable.tsx:432-434` (Blockchain page) | `/blockchain?limit=`, else `/blocks?limit=` (120–500) | `blocks` |

Nothing found in cleaker, netget `main` or `apps/` reading the root JSON. Both root consumers download the whole
response (1.58 MB here) to use `users` (about 300 B). No consumer of `blocks` from the root itself was found.

## Contrast (input for the review, not a decision)

- **Users:** consumed (search, Users page). The question is which fields and to whom.
- **Blocks from `/`:** no consumer found. The Blockchain page uses `/blockchain` or `/blocks`, so the policy for blocks
  belongs to those endpoints too.
- **Telemetry, gateway authority, keychain, sessions, domains:** published as part of the blocks. No consumer found
  that needs them anonymously. Each needs its own justification.

## Side finding (not part of the publication question)

The 324 `read` memories match `http/nrpHandler.ts:92` (`classifyNamespace`): `(kernel as any).read?.(segments)`. On
the `.me` proxy that appears to act as a path builder, so the call **writes** a memory at `read` with the segments
instead of reading. Inferred from the stored values; not reproduced in a test. If confirmed, a read causes a write in
the chain (the same class as the `me.subscribe` path-builder issue in GUI `AGENTS.md`).

Later the same day: confirmed by a test on a disposable monad (5 `nrp.open` → 5 new `read` memories; control 0). See
the test section in [Root-Endpoint-Publication-Review.md](../Root-Endpoint-Publication-Review.md).
