# Root endpoint publication review (pending)

**Status:** pending, opened 2026-11-11. Steps 1–2 written; step 3 policy proposed, not closed. Nothing changed.

## Observation that opened it

On 2026-11-11, `GET https://cleaker.me/` without `Accept: text/html` (curl's default) answered with the monad's JSON
for the namespace root (about 1.4 MB): the target (`nrp: me://cleaker.me:read/_`), `users` (username, identityHash,
public key, timestamps) and `blocks` of the chain, including signed telemetry entries. With `Accept: text/html` the
same URL serves the front end. That the endpoint answers this way says what it does today, not what it should
publish.

## To do

1. **Inventory** what the root endpoint (and the other anonymous read endpoints of a door) publishes, by category.
2. **Justify** each category: why it is public, to whom it is useful, what it allows to correlate.
3. **Define the access policy** per category (public, authenticated, owner-only, not served), and the test that
   checks it.

Users, public keys and telemetry do not necessarily share one publication policy.

Step 1 evidence: [evidence/2026-11-11-root-endpoint-inventory.md](evidence/2026-11-11-root-endpoint-inventory.md)
(also covers `/blocks`, `/blockchain` and `/@*`, which serve the same blocks).

## Step 2: justification per category (2026-11-11)

Analysis, not a decision. "Justification found" means a reason in the code or the documented design for publishing it
to anyone, anonymously; "none found" means only that the search found none.

Context that applies to all of them: the GUI document (`GUI.document.json`) puts **Users** and **Blockchain** in the
left bar with no `requires`. That is interface visibility: it shows the pages without a session. **It does not
authorize their data**; what each endpoint may return is decided by its own policy.

Not secret is not the same as publishable. A public key, an `admin` flag or a hash is not secret by nature; publishing
it still needs a purpose and a context, and hashes and keys also allow correlation.

| Category | What it is for | Who reads it today | What anonymous publication allows | Narrower thing that already exists | Justification found |
|---|---|---|---|---|---|
| **Users** (username, identityHash, publicKey, dates) | the namespace's directory: search and Users page | `Namespace.tsx` search, `Usernames.tsx` | enumerate every handle; link a public key to a name across every ledger it is linked to (GUI `AGENTS.md`: same key → correlatable) | none | **purpose found for the directory** (search, Users page); publicKey and identityHash: plausible for recognizing or verifying an identity, not stated anywhere; dates: no purpose found |
| **Request telemetry** (`surface.usage.*`) | resource accounting ("resource crypto", `usageLedger.ts` header) | none found | the door's traffic: paths, hosts, status, timings; **with `identityHash` set on signed-in requests, a public activity log of a person** | aggregated `gateway-usage.json` (not served publicly) | **none found** for anonymous publication; the stated purpose is accounting, which needs provenance, not public reading |
| **Mesh / host telemetry** (`_.mesh.*`, `surface.host.*`) | monad index, last seen; host CPU/RAM/disk | the monad itself | internal topology (`http://127.0.0.1:8161`, tags, monad public key) and machine load over time | `/__surface` already answers liveness | **none found** |
| **Gateway authority** (`daemon.gateways.<id>`) | who may administer the gateway (owner, admins, grants, pubkeys, usernames, namespaces) | netget's cache refresh (`materializeFromGatewayAuthority`), which is authenticated | the full admin list, their keys and grants | `/gateway-identity` deliberately shows only `owner`, `ownerUsername`, `adminCount` | **none found**; the deliberate public view is narrower than what the blocks expose |
| **Keychain key** (`keychain.keys.<keyId>`) | the active keys of an identity, with `admin` and `authorization` | the keychain verifier (server-side) | which keys exist, their labels (here "netget.site mainserver": names a device/setup), which are admin | the keychain's own endpoints | **no purpose found** for anonymous publication; none of these fields is secret by nature, which does not by itself justify publishing it |
| **Sessions** (`session.opened_at`) | written by `POST /claims/open` (`claims.ts:214`) on every opened session | none found | **when a person signs in**, for every namespace, over time | none | **none found** |
| **Domains** (`domains.*`, `domainIndex.*`) | the gateway's routing table | netget | the domains this gateway serves | production `GET /domains` requires the bearer (verifier map, 2026-11-10) | **contradicted**: the endpoint for this data is authenticated; the blocks bypass it |
| **Claims and pointers** (`daemon.claims.*`, `daemon.users.*`, `users.<h>` `__ptr`) | which namespaces are claimed, by which key | claim verification (server-side) | same as Users (namespace ↔ key) | Users | same as Users |
| **`read` memories** | none: written by an NRP read (`nrpHandler.ts:92`), **confirmed by test** (below) | none | which namespaces were resolved over NRP, when | — | **not data**: a defect to fix, independent of publication |
| **Block metadata** (`memoryHash`, `prevMemoryHash`, `timestamp`, `operator`) | chain integrity, the Blockchain page | `BlocksTable` | the timing of every write | — | **yes** if the chain itself is meant to be inspectable; author fields are empty today |

Observations:
- Three cases publish more than a narrower, deliberate interface for the same data: gateway authority
  (`/gateway-identity`), domains (`/domains` with the bearer) and telemetry (`gateway-usage.json`). There the blocks
  undo a decision that was already made.
- The two that can follow a person over time are **request telemetry with `identityHash`** and **`session.opened_at`**.
- Restricting `/` alone changes nothing: the same blocks are served by `/blocks`, `/blockchain` and `/@*`.

## Main finding

**The chain works as a second way to reach data that other endpoints restrict.** A policy has to apply to the data in
every place it comes out, not to one endpoint.

## Step 3: proposed policy (2026-11-11, not closed)

| Surface | Proposed policy |
|---|---|
| Public directory | The name and the identifiers needed to recognize or verify the identity. Dates only with a defined purpose. |
| Public blockchain | An explicit projection of publishable records; no general access to the internal chain. |
| Telemetry and sessions | Authorized access; public aggregates only if designed for it. |
| Authority, keychain and domains | Follow the policy of their specific endpoints, also when they appear in blocks. |
| Search and Users | A dedicated directory read, without downloading blocks. |

Rules that come with it:
- **The chain is not edited or deleted to hide anything.** The internal record and its publication are separate; the
  policy acts on the publication.
- If filtering blocks prevents verifying the whole chain, the interface says what the projection does let you verify.

Still to close: the exact fields per surface, and the tests. The tests run against `/`, `/blocks`, `/blockchain` and
`/@*`, without a session and with different permissions.

## Test: an NRP read adds memories (2026-11-11)

Disposable monad (the F1 release-tree build, `MONAD_NETGET_DISABLED=1`) on a copy of the cleaned VM snapshot; script
`~/.get/local/nrp-read-test/run.sh`. `read` memories counted in the snapshot saved at each stop:

| Step | Memories | `read` memories |
|---|---|---|
| copy of the snapshot | 1,041 | 158 |
| start and stop, no NRP (control) | 1,205 | 158 |
| start, 5 × `nrp.open` for `me://jabellae.cleaker.me` over `/nrp`, stop | 1,374 | 163 |

Each NRP open wrote one memory at `read` with value `["jabellae","cleaker","me"]`: the read writes to the chain.
Consistent with `nrpHandler.ts:92`, `(kernel as any).read?.(segments)` acting as a path builder on the `.me` proxy.

Also seen, not investigated: each start added about 160 memories with no request (1,041 → 1,205; the second start
added 169, five of them `read`). Both are growth sources independent of telemetry.

Related: [Interface-Binding-Principle.md](Interface-Binding-Principle.md).
