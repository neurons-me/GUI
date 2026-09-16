# Set Chemistry — findings log

Working notes for the "Set Chemistry" test suite (verifying what the NRP set
algebra actually does today, vs. what it's designed to eventually mean).
Each entry: the case, what's real, what's pending, where the evidence lives.

## Terminology collision: `∩` means two different things

`Beatle`'s NRP grammar (`NRPExpression.ts`) uses `∩` for **audience
intersection** — "these identities must jointly hold the requirements to
open this" (per the public Set-Chemistry cryptographic design doc). Cleaker's
own `intersectRegions()` (`modules/cleaker/Typescript/src/algebra/refinement.ts:21`)
also uses `∩`, for a **completely unrelated** concept — namespace
specificity/subset (`sub.domain.com ⊑ domain.com`). Same symbol, same
repo, two meanings. Neither reads the other. Flagging so nobody assumes
one implements the other, or unifies them without deciding on purpose.

## Case: relative-name resolution context

| Input | Context | Expected |
|---|---|---|
| `jabellae` | explicit `cleaker.me` | Interpreted per the protocol's own expansion rule (see NRP-v0.3.0.md — not yet cross-checked against this case). |
| `jabellae` | none given | Do not invent a single root by guessing. See the resolved rule below — the fix for "no context" is never "pick one silently," it's "expand against every context that's genuinely active, as a union." |
| an absolute destination | any context | The declared destination wins; context never overrides an already-qualified address. |
| same expression + context, different identity | — | Permissions differ; the name's meaning does not change automatically with who's asking. |

**Confirmed gap (code, not design doc):** `Beatle.tsx`'s `handleSubmit()` →
`useBeatle.ts`'s `open()` calls `parseNRPExpression(raw)` directly — never
`parseNRPURI`, never `expandBareHandles()` (the function that exists
specifically to expand `jabellae` → `jabellae.<root>`). A bare handle is
sent to the server completely unexpanded today. The resolver combobox in
`Beatle.tsx` (`resolverLabel`/`namespaceToWs()`) picks which server the
WebSocket connects to — it is NOT used as an expansion root either. Nothing
in the current wiring decides "context of resolution" at all; it's an open
question, not an implemented default (see the rule below for what filling
it in should look like, once someone implements `expandBareHandles`' real
call site).

**Resolved rule (design, not implemented) — 2026-09-15/16 conversation:**
There are exactly two legitimate, simultaneously-active contexts for a bare
handle, never one "correct" context to guess between:
- **Location** — `window.location.host` (client) / `req.headers['host']`
  (server). A physical fact about which page/request this is. Always safe
  to read, never a semantic decision — see this file's own note above on
  why `local.cleaker/apps/netget` and `me://` addressing are different
  mechanisms; this is the same "physical fact vs. protocol meaning" split.
- **Identity** — the currently-claimed namespace (whatever `.me` identity
  is actually signed in), independent of which host happens to be loaded.
  These two genuinely diverge in practice: you can browse `local.cleaker`
  while claimed as `jabellae.cleaker.me` — location and identity are not
  the same namespace just because one page happens to serve both roles.

A bare handle with no explicit root (`alex`) does **not** resolve by
picking whichever of these two "feels right" — it expands into the
**union of both**: `alex.<location-host> + alex.<identity-namespace>`,
using NRP's own `+` operator to represent "could be either" instead of a
client silently deciding it's one specific thing. This is the same shape
as the per-path-layers note below (root layer vs. personal layer over one
path) — same dual-context pattern, applied here to a bare handle instead
of a shared path. It generalizes with zero hardcoded domain names: nothing
here ever needs to know a literal `cleaker.me`/`local.cleaker` — those were
never special, just two ordinary values `location`/`identity` happened to
hold in this session's dev environment. Any deployment, any pair of
location/identity namespaces, same rule.

If only one context is active (no signed-in identity, or identity ===
location), the union degenerates to that single term — not a special case,
just what `+` does with one side missing.

**Generalizes past 2 — 2026-09-16 follow-up:** location and identity are
just the two contexts that happen to exist in this session's dev
environment, not a hardcoded pair the rule is limited to. The real shape is
`me₁ + me₂ + … + meₙ` (and, wherever the actual data calls for it instead
of "could be either," `∩`/`~` too) over however many `.me` contexts are
genuinely active for whoever's asking — a second signed-in identity, a
second relevant location, a delegated namespace, anything real, each one
just another operand. What each `me` operand actually **means** in the
algebra is its claim scope — what that specific namespace can rightfully
read/prove — not the raw string. That's the same semantics the public
Set-Chemistry design doc already assigns these operators (union =
multi-recipient key wrap over multiple claim scopes, intersection =
XOR-share reconstruction requiring more than one claim scope jointly) — see
this file's own "terminology collision" note above for where that meaning
and cleaker's own unrelated `∩` (namespace subset) diverge. None of this
is implemented (same gap as everywhere else in this doc: `handleNrpOpen`
ignores `ast`) — this section just fixes what the correct N-ary expansion
rule actually is, generalized from the location/identity example.

**Order is a separate, undecided question — 2026-09-16.** Writing the
example as `alex.<location-host> + alex.<identity-namespace>` put location
first, but that's an artifact of how it happened to get typed here, not a
rule that location goes first (or that any operand has a canonical
position). `+` is commutative as a set — `A + B` and `B + A` name the same
resulting set of claim scopes — but a real implementation is not obligated
to treat the two orderings identically: if resolution is eager (first
candidate to answer wins) or the response preserves order (`resolved`'s
own `payload.endpoints: string[]` already does, per `nrpHandler.ts`), then
which operand is listed first can decide which one is *primary* —
displayed first, tried first, shown as canonical on conflict — even though
the underlying set is the same either way. Nothing here decides that
ordering rule yet; it's a distinct open question from which contexts get
unioned at all, not something to default silently just because an example
had to be written down in *some* order.

**The output of a resolved expression is a hash, not a readable string —
and that's what the `.me` QR should encode, not built yet.** Everything
above describes *which* contexts get combined; this is about what
combining them actually *produces*. A resolved `me₁ + me₂` (real
multi-recipient key wrap) or `me₁ ∩ me₂` (real XOR-share reconstruction)
naturally yields combined key material — a fingerprint of that specific
combination — the same way `me/Typescript/src/me.ts`'s `deriveIdentityHash`
(`keccak256(IDENTITY_HASH_DOMAIN + seed)`) is the fingerprint of one seed
today. There's no equivalent "combined claim-scope hash" anywhere in the
kernel yet — only ever computed for a single identity, never for a
resolved expression.

Where this lands once real resolution exists: `QRme`
(`packages/GUI/Typescript/src/gui/All.This/me/QR/QR.me.tsx`) already takes
a plain `value: string` with no assumption about its shape — today
`CleakerLanding.tsx`'s `qrValue` is a readable claim URL
(`buildCleakerNamespaceUrl(resolvedEndpoint, username)`, the residue this
file's own "window.location is where set chemistry's ash settles" note
describes). A resolved set-chemistry expression's QR would encode that
result hash instead — same component, same prop, no structural change
needed — a scannable fingerprint of one specific combination of claim
scopes, verifiable, not just a pointer to a single identity's own address.
Not implemented: no combined-scope hash function exists, and nothing
decides yet whether the QR would show the hash alone, or the hash
alongside the readable expression that produced it.

**Test split required:** local interpretation (parsing/expansion, pure
client-side, no network) and real resolution (does a server holding that
namespace actually answer, and how) are separate claims — getting a
fully-qualified name string proves nothing about whether an authorized
service exists to answer it. Test both, separately, never conflate a pass
on one as evidence for the other.

## Per-operator status (from direct code investigation, not the design doc)

| Operator | Parsed (client) | Resolved (server) | Cryptographic backing |
|---|---|---|---|
| `+` (union) | yes | no — `handleNrpOpen` ignores `ast` entirely | no — no multi-recipient key-wrap path in `me/Typescript` |
| `∩` (intersection) | yes | no | no — no threshold/XOR-share reconstruction anywhere in the kernel |
| `@` (overlay) | yes | no | n/a |
| `~` (complement) | yes | no | n/a (also: `~` already names an unrelated kernel concept, "noise reset," per axiom A3b) |

Single bare namespace (no operators) IS resolved for real —
`handleNrpOpen()` → `classifyNamespace()` → real `kernel.read`/`kernel.get`
disclosure check, tested in `modules/monad/Typescript/tests/NRP/nrpHandler.test.ts`
(with `ast: null` — that test never exercises algebra). This is the one
case safe to build on right now.

## Design note (not implemented): per-path layers, root vs. username-scoped

Not a new mechanism — this is the existing model (composeNamespace's
`prefix.constant`, plus the `+`/`∩` operators above) applied at a finer
grain than "pick one namespace": the same `/path` can be addressed through
several different namespaces at once, each one a genuinely separate `.me`
branch, and the union operator is what would let a client view them
together.

- `local.cleaker/url` — the **root layer**: whatever lives at `/url` under
  the bare, unclaimed root. No username prefix, no owner — "the version
  that belongs to cleaker itself," per the 2026-09-15 conversation that
  raised this.
- `username.local.cleaker/url` — **a personal layer** over the exact same
  path, but a fully distinct namespace (`username.local.cleaker` per
  `composeNamespace`) from the root above. Writing here never touches
  `local.cleaker/url` — they're different claims/branches, they only share
  the trailing path string.
- `otherUsername.local.cleaker/url` — a third party's own layer, same
  shape, equally isolated from the other two.
- Combining them (e.g. "show me the root layer AND my own layer for this
  path") is exactly what NRP's `+` (union) already parses —
  `local.cleaker/url + username.local.cleaker/url` — no new grammar needed.
  What's missing is everything the per-operator status table above already
  lists as unresolved: `+` parses client-side but `handleNrpOpen` ignores
  `ast` entirely, so today nothing actually fetches and merges two layers'
  data. This note just pins the intended shape for when that gets built.

## Design note (not implemented): every URL has a `me://` alter ego

From the 2026-09-15 conversation about `this.url`/`this.DOM` and a
hyperlink-graph explorer component: every plain web URL a crawl visits
(`this.url`'s `URL.crawl()`/`hyperlinks()`, see that repo's design notes)
has a parallel `me://` address using the exact same string —
`cleaker.me/docs` and `me://cleaker.me/docs` are "the same place," one
resolved as a raw web fetch (`this.url`/`this.DOM`, no `.me` involved at
all), the other resolved as an NRP namespace (kernel disclosure, claims,
the per-path-layers model above). Same path, two resolution paths — an
"alter ego," not a duplicate.

This pairing is exactly `isValidDomainShape` from cleaker: a URL's alter
ego is only ever a *valid address* — not necessarily one that resolves to
data — when the URL's own host+path already has real FQDN shape. A crawled
URL that doesn't (e.g. a same-origin relative link that only ever looked
like a path fragment) would show `me://` alter ego lands in the `'invalid'`
`ResolutionState` (see useBeatle.ts) rather than being treated as
resolvable, same rule as everywhere else in NRP — no special case for
"this one came from a crawl."

**Where this belongs when a real `HyperlinkGraph` component gets built**:
each graph node renders both forms — the plain URL (from `this.url`) and
its `me://` alter ego, colored/greyed by whether `isValidDomainShape`
passes for that node, exactly like Beatle's own error/invalid states. Not
built yet — this pins the intended shape.

**Explicitly not decided here:** whether a client should ever default to a
user's OWN layer (`username.root/path`) instead of the root layer
(`root/path`) when opening something — the resolution-context question this
file already flags above ("never silently derived from the active
identity... must be explicit once implemented") applies here too. Layer
selection is a choice to surface, not a default to guess.

## Closing principle (2026-09-16): no module owns a domain

Everything in this file traces back to one rule, confirmed by removing the
last hardcoded root (`local.cleaker`/`cleaker.me`) from `CleakerLanding.tsx`
this session: no layer — `this.me`, `cleaker`, `monad.ai`, `netget`, `GUI`,
`this.url`, `this.DOM` — is tied to a specific hostname. Each is a direct,
portable load, same behavior regardless of which domain serves it (see
`CLAUDE.md`'s own "No module owns a domain" note, same principle stated at
the repo-architecture level).

The one legitimate anchor is the physical location of whatever's running —
`window.location` in a browser, `req.headers['host']` server-side (`window`
doesn't exist in Node; this is exactly why `nrpHandler.ts`'s own
`deriveEndpoints()` reads the request's Host header instead). Neither is a
semantic guess about namespace meaning, both are just a physical fact about
the current page/request. `window.location`'s own shape mirrors
`me://namespace/path` almost exactly:
`location.origin` ↔ `namespace` (which root), `location.pathname` ↔ `path`
(what specifically, within that root) — `CleakerLanding.tsx`'s own routes
(`/users`, `/blockchain`, `/keychain`, `/url`) are that mirroring made
concrete: each is a real `path` segment carrying resolved state, exactly
the role `path` plays in `me://` itself, just surfaced in the one address
bar a browser tab actually has. Reading `location.origin`/`.pathname` for
"where am I" is always safe; using either to guess "what does this
namespace mean" is exactly the mistake the "relative-name resolution
context" case above and the location/identity union rule two sections up
both exist to rule out.
