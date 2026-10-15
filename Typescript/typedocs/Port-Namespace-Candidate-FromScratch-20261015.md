# Port-is-the-transport — the candidate rebuilt FROM SCRATCH (2026-10-15)

Not published, not deployed, not merged. Produced by `tests/port-namespace/candidate/assemble-from-scratch.sh` in
`/Users/suign/.get/candidates/port-is-transport-scratch-20261015-1539` (kept as the verified reference).

## Method (the release method, with no installed workspace and no dist of any checkout)
1. skeleton (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`) from an all.this commit;
2. each package as `git archive <sha>` of a COMMITTED tree;
3. `pnpm install` from the lockfile, then `vite build` / `tsc`, then the tests and both disposable development paths.

## Pinned inputs
```
.	fbd536dca3bb914b3a978fb2a2542a2bf68e4073	all.this skeleton	/Users/suign/Desktop/Neuroverse/all.this
me	3e7dc8cec340e36fdfeaa033e652585c2e9e369c	Merge feat/known-root-single-label (declared roots) onto origin/main 4.2.0	/Users/suign/Desktop/Neuroverse/all.this/me
modules/cleaker	d044746beb0dd2776009c128008fb52716739fae	binder: discovery and the authorization to send a signature are separate (authorizeDiscove	/Users/suign/Desktop/Neuroverse/all.this/cleaker-port-namespace
modules/monad	ef4320e7286cac22bc169f5e4eb4d7a52475d44b	root read: a name this monad does not resolve is not answered from the root's storage	/Users/suign/Desktop/Neuroverse/all.this/monad-candidate
modules/netget	f0d4b8b72cbf5254f18b4a4b56735ce834d1f950	front end: the main-server door declares its namespace; other doors resolve it	/Users/suign/Desktop/Neuroverse/all.this/netget-main-entry
packages/GUI	413d09d5c65ddb5597c90c1b80bf6370435ff771	candidate: assemble-from-scratch (release method: skeleton + git archive trees + pnpm inst	/Users/suign/Desktop/Neuroverse/all.this/gui-port-isolated
```
Tools: node v24.13.1, pnpm 10.33.2, OpenResty 1.29.2.3 (the disposable door).

### Provenance of the `this.me` artifact
`me/` is the `me` repository at **`3e7dc8cec340e36fdfeaa033e652585c2e9e369c`** (`this.me@4.2.0`, "Merge feat/known-root-single-label
(declared roots) onto origin/main 4.2.0"), built in the assembled workspace by `npx vite build --config vite.config.ts`; the
same commit r20261014-1 shipped. Nothing is taken from `me/Typescript/dist` of any checkout (that `dist` is stale). The four
files it produces, identical across three from-scratch installs:
```
379348618b576283457d553a603e5a032390c23737d01d6a9a3ca3e64ba78ef2  me/Typescript/dist/index.js
7aee90468318503f91d6732f3f6f4dcc31864120b5d5c1013ae8c459e4b37b68  me/Typescript/dist/me.cjs
b2ba84e1ce504cfd8b07e7817a6c534ef3346bc7d862f25e2d2ee1dad7ce084f  me/Typescript/dist/me.es.js
141568166d22d9c14ffc1c369093f623228d4d10a8277dc31a5185fdd5537c77  me/Typescript/dist/me.umd.js
```
cleaker (`vite build`), identical across the same three installs:
```
f35aff83e6c91b14a38d382164ee3193072a3d858f7545e80aa463a45fb05807  modules/cleaker/Typescript/dist/cleaker.cjs
5b6bf624ddddcd2226fe6b2f2a481085f8d2060db15a8235e66e3b679f5d91cb  modules/cleaker/Typescript/dist/cleaker.es.js
df126af162357b3e7646f0ab7eccca54b70a90015078e73b8dbc39fd03e198de  modules/cleaker/Typescript/dist/cleaker.umd.js
```
Aggregate sha256 of the file lists: monad dist (82 files) `8495af047c2dd332bc134ff286e6caf6180c9b0ae8423c46ca6af5e0ab16acfc`;
GUI dist (76 files) `15589ecb74da2516b843e907a9327c8bc21bf4d257106fa42001bd29e3cb315f`.

## Dependencies: what is and is not pinned
- The skeleton's lockfile (`fbd536dc`) does NOT match the manifests of the pinned trees: `pnpm install --frozen-lockfile` fails on
  two specifiers (`this.gui` lockfile `^2.4.0` vs manifest `^4.0.0`; `this.me` `workspace:*` vs `workspace:^4.2.0`).
  The regenerated lockfile differs in 36 lines (`pnpm-lock.diff`); it is kept here as `pnpm-lock.regenerated.yaml`, and
  `pnpm install --frozen-lockfile` from IT succeeds (installs #2 and #3). **Pin this lockfile with the candidate.**
- netget's `this.gui ^4.0.0` now resolves to the PUBLISHED `this.gui@4.2.0` (with npm `cleaker@4.0.0` and `this.me@4.2.1`), not to
  the workspace GUI. netget's front end therefore does not exercise the candidate GUI; the development-path tests use only netget's
  generator and Lua.
- Registry was reachable; this is not an offline build.

## Reproducibility, measured
| piece | installs compared | result |
|---|---|---|
| `me` (4 files), `cleaker` (3), `monad` (82) | 3 from-scratch installs + builds | byte-identical |
| GUI (`vite build`) | same install, rebuilt twice | byte-identical |
| GUI (`vite build`) | across fresh installs #1/#2/#3 | **NOT bit-identical**: 10 files (a shared `index-*` chunk and the entries that name it) differ in the minifier's identifier assignment; same byte length, 42 differing lines, #1 and #3 equal, #2 differs |

So the GUI is pinned by source SHA plus test results, not by a dist hash.

## Results from the assembled workspace
- cleaker suite + contract (K1–K17, L1–L6):
```
axioms                            ok
bind                              ok
namespace-expression              ok
nrp-target                        ok
me-target                         ok
space                             ok
namespace-fallback                ok
namespace-constant-resolution     ok
port-namespace.contract           ok
group                             ok
```
- GUI `test:runtime` (unit, vault 11, parser 7, mechanism 4, contract 4, browser integration 32): ok
- monad, whole suite: `monad suite: 667 pass / 5 fail / 673 total; suites failed 9 of 227`  (the 5 failures and the one file that does not collect also fail with the base cleaker; see CANDIDATE.md of the reference candidate)
- development path, disposable, stub monad:
```
PASS  5.3 the GUI says the same (conflict)
PASS  6.1 two doors are two links
PASS  6.2 the door that answered is ready; the API's is not
PASS  6.3 a reading for one door does not confirm the other

17/17
```
- development path, disposable, REAL monad:
```
PASS  0. the door and the real monad are up  — door :54380, monad :54378, API :54379
PASS  1.1 claim + open through the door, against a real monad  — identity 0767763a72be
PASS  2.1 back in through the door: the same identity and namespace
PASS  3.1 the same identity and namespace through the monad's own port
PASS  4.1 a contradictory written port is refused  — TRANSPORT_PORT_CONFLICT
PASS  4.2 nothing was sent for it
PASS  5.1 the declared door is down: the attempt fails  — NETWORK_ERROR
PASS  5.2 only that door was contacted (not the page's door, not the monad, not cleaker.me/localhost)  — fulltrailer.suis-macbook-air.local:54381
PASS  6.1 one identity, one namespace, three transports
disposable monad port: gone

9/9
```
