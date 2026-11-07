# Roles and territories

Status: **design reference** (2026-11-06). It records what was agreed about who does what and where things live, so
that what is built next has one place to read it from. What is built is marked **Built**; everything else is a
direction, not a commitment, and is gated as stated. It complements
[Identity-Custody-Contract.md](Identity-Custody-Contract.md) (who holds keys and signs) and
[Modules-Plan.md](Modules-Plan.md) (how apps register into a shell).

## 1. Three things that are not the same

| | What it answers | Where it lives |
|---|---|---|
| **Identity** | *Who* is acting | The person's `.me` root, held only by their identity agent. `jabellae.cleaker.me` is an identity's **address**. |
| **Path** | *Where* a piece of information lives | A place in the tree: `cleaker.me/apps/fullTrailer/trips/…`, `jabellae.cleaker.me/profile/…`. |
| **Territory** | *Who may enter* a part of the tree | Each branch has an owner and its own rules: what it discloses, who may write. |

- **Cleaker signs; it does not hold.** Cleaker is the identity door: it proves who you are and signs what you approve.
  `cleaker.js` starting on `cleaker.me` only says which root identities are resolved against. It does not mean an
  app's data, or yours, lives "in cleaker".
- **Information lives on its path.** An app's information lives under the app's path. A person's own information lives
  under their own path. One tree, many territories; an identity having an address under `cleaker.me` does not merge
  the territories.
- **Navigating is not accessing.** Anyone can walk the tree and reach an app's territory (it is the same tree), but
  each territory decides what it shows and who may write, by the `.me` disclosure rules (public answers; closed and
  secret branches do not). A valid signature proves who you are; it is not a key to someone else's territory. So an
  app's information cannot be used "without the app" beyond what the app's territory has chosen to disclose.

```
cleaker.me
├── jabellae                 identity address (who)
│   └── profile, notes, …    jabellae's own territory: theirs to disclose
└── apps
    └── fullTrailer          the app's territory: its owner's rules
        ├── trips, rates     the business's records
        └── …                what the app keeps under its own rules
```

## 2. Roles

| Role | Who | Needs | Status |
|---|---|---|---|
| **Client** | Most people | A browser. Their `.me` resolves in it; a public namespace (e.g. `cleaker.me`) is the bridge. No local nginx or monad. | Works today for public reads (`cleaker.me @ localhost`). Sign-in needs the agent (§4). |
| **Device that serves** | Someone publishing apps or a namespace from their own machine | Something that listens and routes locally — a light netget inside an app is enough — reporting to a main server. | Gated: cross-host registration needs signed heartbeats first (CLAUDE.md gaps 1–2); NAT needs a relay through the main server. |
| **Main server** | `netget.site` (the VM) | nginx/OpenResty, public IP, certificates, domains, logs. The heavy setup belongs here. | Running. |
| **Software agent (AI)** | Claude, ChatGPT, others | A **delegated identity** of its own (`claude.jabellae.cleaker.me`), created and signed by the person, with limited, revocable grants; reached through one MCP server that speaks NRP. | Direction. Needs delegation (§6) before any connection. |

## 3. Levels: from nothing to a full shell

| Level | On the page | How | Status |
|---|---|---|---|
| **0** | Nothing of .GUI | No import | — |
| **1** | Only Cleaker: a QR in a corner, `me @ where`, movable to four corners, a namespace panel | One line: `<script src="…/cleaker.js">` or `mountCleaker()` from `this.gui/cleaker` | **Built** (GUI `0f822c95`, `7cf56af2`, `7baf9620`; npm 4.4.0, 4.4.1 ready) |
| **2** | Bars unfolding from the QR, each a collection: open, icons only, or closed | From the QR, in the person's layer | Next |
| **3** | The full shell: bars, pages, routes (what netget runs today) | The app declares it whole | Exists (netget); extraction per Modules-Plan |

Level 1 details (built): drawn in a Shadow DOM (appearance isolation, not security); React-free; starts on `cleaker.me`
with no setup (the author may start it with none, the person may choose another or none); the label and the QR say
the same — the namespace and where you are (`at=` the page's origin, or for a file the whole `file:///…`); the
person's corner and namespace are kept in their browser (their local layer). It shows public things only.

**The person's layer.** What a person sees is `base @ overlay(person)`: the author sets defaults (the corner, which
bars exist, their initial state); the person's choices win and are kept by them — locally first, later in their own
`.me`, signed through their agent, so they follow the person across devices and nobody else can change them.

## 4. Apps are shells; holes are filled from territories

An app declares **holes** in the `.me` grammar, and the page fills them from a territory instead of from the app's own
database:

```html
<p>{{ me("profile.name") }}</p>        <!-- read -->
<button data-me-write='me.profile.name("Ana")'>…</button>   <!-- write: an operation, approved in the agent -->
```

- **Which territory a hole reads from is part of the hole.** By default the visitor's own territory (their profile);
  an app hole names the app's territory (`me("apps.fullTrailer.trips")`). It is never "whatever cleaker has".
- **Public fills directly; private is asked.** A private read is approved in the person's agent before it fills.
  Filling a hole discloses the value to the page's script, so it needs the person's consent; a value can be shown
  without disclosing it only through an isolated frame of the agent's origin.
- **Writes are operations.** `me.profile.name("Ana")` from a page goes to the agent, shown exactly, signed only if
  approved, and verified by the territory's server.
- **Templates are parsed, never executed.** The hole is read with the `.me` expression parser; page code does not run.
- **Apps are shells.** The same app serves many industries without owning personal data; the business is its own
  namespace for its records (orders, invoices, what the law requires it to keep). What must exist for this to hold:
  someone serving each territory (availability), shared vocabularies per industry (paths that mean the same thing),
  consented aggregation for computations over many people, and the understanding that consent controls access, not
  copying of what was already shown.

## 5. Devices and places

- A page opened as a file (`file:///…`) is a place on this device; Cleaker says so (its name, the whole file in the QR).
  **Built.**
- Encrypted branches of `.me` (`me.path["_"]("key")`) keep content readable only with the person's identity.
- Placement — "this document only on my phone", "on my phone and my computer" — is a signed decision about which
  enrolled devices keep a copy. It needs: device enrollment (a one-time, expiring QR pairing, per the custody
  contract), file access (the person picks files, or a local monad holds that permission), and a channel between
  devices (the mesh work, gated as in §2).

## 6. Delegation and automation (later)

- **Standing grants.** The first cut of the agent asks every time. Later, a person may grant "this site may read my
  domains for one hour": signed automatically **within** that grant only, shown in the agent (which sites hold what,
  what was signed), revocable at once; anything outside it — another site, action or resource, and every write — asks.
- **Delegated identities.** A sub-identity per software agent, signed by the person, scoped and revocable. Required
  before any AI connects (MCP), so that an assistant never acts *as* the person.

## 7. Cost and traffic

- **Reads** (the namespace probe `cleaker.js` makes on load) need an answer now: cache them — in the browser for a few
  minutes, and at `cleaker.me` (`/__surface` is public and the same for everyone) so few reach the monad and
  `cleaker.me` stops seeing each visit.
- **Writes and sync** can be batched: a trusted proxy of the person's own (their monad or local netget) assembles
  blocks — `.me` memories are already hash-chained (A8) and merge deterministically (A9) — and submits them in one
  request when the person chooses. The block is signed by the person's identity (agent) or a device key they
  delegated explicitly; a proxy never signs for someone because it holds their data. Accepting blocks from another
  host is the mesh-trust problem (§2), solved first.
- **Hosted vs own.** `cleaker.me` can be a paid service by usage (free up to a volume), tied to the wallet/resource
  marketplace direction; anyone wanting privacy or no cost runs their own proxy and only syncs blocks.

## 8. Order

1. **Level 2**: bars unfolding from the QR, in the person's local layer.
2. **Browser cache** for the namespace probe in `cleaker.js`.
3. **Agent by namespace**: discover a namespace's agent (`/.well-known/me-agent`, same registrable domain), finishing
   the custody contract's first cut; then the person's layer stored in their `.me`.
4. **Holes**: `me("…")` reads with their territory, private reads approved in the agent.
5. **Standing grants**, then **delegated identities**, then **MCP**.
6. **Device that serves** (light netget, signed heartbeats), then **placement across devices** and **batched sync**.

Alongside, when there is room: the card's failure messages, the NRP channel keepalive (`useNrpChannel`), netget's
`/nrp` timeout and its empty `OPTIONS` answer, `dev:test-backend`, the font contract per theme.
