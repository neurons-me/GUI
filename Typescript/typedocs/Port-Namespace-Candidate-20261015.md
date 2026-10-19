# Port-is-the-transport — candidate (not published, not deployed, not merged)

Built 2026-10-15 15:32 from clean detached trees at pinned SHAs, by
`tests/port-namespace/candidate/build-candidate.sh`. No `dist` of any checkout is used; dependencies are the workspace's installed
set, symlinked (the monorepo has no offline lockfile install) — what is pinned is below.

## Pinned inputs
```
piece	sha	version
cleaker	7ab983ae2660a36cb91123122327e982f27def4c	4.0.0
gui	e0d0c8be90bab6648795d75db335309f1c6d2e04	4.1.0
monad	ef4320e7286cac22bc169f5e4eb4d7a52475d44b	3.0.0
netget	f0d4b8b72cbf5254f18b4a4b56735ce834d1f950	2.7.7
this.me(tests)	release-tree	4.2.0
node	-	v24.13.1
openresty	-	nginx version: openresty/1.29.2.3
```
`this.me` for the monad's tests and the real-monad path is the release `r20261014-1` tree (4.2.0); the repo-linked `me/Typescript`
has a stale `dist`. The GUI tree builds against the cleaker built from the pinned cleaker SHA (symlinked as `node_modules/cleaker`).

## Reproducible outputs (sha256; cleaker rebuilt twice in the same clean tree: identical)
```
134ec61f8c6fb0e6fac159e1cad405ebbd7bc970a244724a7e591cd4d2d8d53a  /Users/suign/.get/candidates/port-is-transport-20261015-1528/src/cleaker/Typescript/dist/cleaker.es.js
64d42f8d10c50e376a4196ad03718b05546a97b2097bc0c0c7e0ff803635cef9  /Users/suign/.get/candidates/port-is-transport-20261015-1528/src/cleaker/Typescript/dist/cleaker.cjs
df6e82a9d495125e150ae3817e8939ec24616464cafc6ce320deb1ca7c419100  /Users/suign/.get/candidates/port-is-transport-20261015-1528/src/cleaker/Typescript/dist/cleaker.umd.js
915581633326f2adb654a984bb592c1ab7b089d2c6a97c81061eda99381b24c5  dist/Cleaker--Kx5h02j.js
8d92257f3463c16d1412e4a7e309d1b092a3cdc3ef9e3dcf87af58d544193c5e  dist/CodeBlock-BvjqhfBB.js
4723a01395202b80a4f06be8c11143659cfc56fc3b9ca4258071fc91976e9e5a  dist/DevToolsLauncher-D4s5Zwzb.js
54d98c044f87f49631ff90698e8fdd4d014b0781219962a06edef2e083b16694  dist/Divider-DgQgJeRz.js
ecb229b9775ebb852158606b696207e61e34b4f2f95d9d065a4a7fd4139a891c  dist/Gauge-CBfDTmCD.js
8e27986d21e7b913ba6114a0e93c6df41d53dc9484f716b196238ff2f620a32d  dist/IconButton-K-zXJ1hF.js
7cb211e3d725294cfdd67e0aa1eaf29d88256711171b653f22da94cd3a07a22d  dist/Page-B18scjor.js
721070292a09383daf23d99044ba8fbce5cd57e6ce8f36f8beed26eef8e4ba3c  dist/Progress-BIB57VvU.js
cc4561e388043d35f81ece97ba81982d655886cf4aa2b282789379564bd8286e  dist/RubiksCube-BNaHRPZV.js
a08a817200e8ec88784b0930249cd61986b353d655df290b9f8ad8531f1b4883  dist/SearchBar-BZijTu_P.js
d397a25d54f8bdd427495e772b597ef2c021280d3dd69d7d9882bd6e34f500ed  dist/SearchField-sTqcWC6h.js
29ebd83b0fdb2c782379ebdbafc2ca9cd5c280063046fb3d5a2649d23c1d1786  dist/Section-BDvS_T1F.js
e6d34e7cd2db6145e7cef383e82074efb091fd68347f3419c6aa8bd53c327c20  dist/Slider-Bcuxctu-.js
00d8996a7c91a057de00cc497d11768e43ec39783df779435ea76c96167adf02  dist/Slider-CLG5PYBp.js
53299b190dfc31c06a440b831b3e1d421882493f78c99d5a240e43404b44182f  dist/SpecBoundary-BGoPFTMo.js
9e03ab594623d532b744f61c08e6cec15bbea01216d539b9fdd17cd6d4c1376b  dist/Tooltip-8rN14RCk.js
67c41220c870962dd2dce09ee0b2e4df1fa6fd03f638190e42e60f887d1c8761  dist/_commonjsHelpers-CjN-w5d0.js
0dd9069affdec1c2689632f3093fc48ca7bd596217fcb6f4c7f81f5d156fde8f  dist/adminView-Dc_0Uli2.js
62d5239bf324ec5c42334100b20b328035209271b512aac33c88ca04765fe938  dist/cleaker-entry-fVCqQzbW.js
0feb0290e3c20319496ac6cef3a91c3654bb9f199eb4b73bf6ff34cdc3eb596c  dist/compounds-DxCFVSTL.js
0d5c16a3da39551fddf703ab17e1769bc19f73be770f904205b2c17a908c3fd9  dist/controlSurface-C4LIxGfI.js
d631527fc3f3a84a3d1585278b47111ff982880d588cdc2879c43f70d28a2187  dist/index-FO5GUAhY.js
6796a1a9da15c957aa7f535ba87b142a341e1979652a3e5a69d1db369ab67312  dist/inspector-FekITnRb.js
717649f90831db7a1447191f0d46c15a5b9bf2bb93d65bd4cd069a785600b53b  dist/material-symbols.css
c67f28e05025c44ab2be2313a84a8385ab27007f1e4e3fadecb172b05760da32  dist/start-app-CPiNhSbU.js
bf5caffb896be65ad78d8124509e8ddd344d29d37363d658452aa9566ceaa094  dist/this.gui.es.js
6cbbdf1e38bcaaeb6df50437f7066b086a6b3d3854581c3286faf989114d4f9f  dist/useAddress-r3KItvIT.js
396907e3e37f558a1e595aec02c3af323155b7c24dec959894343365c4e5484b  dist/useInsets-h0sdZp0n.js
5a3067abeb6c9d6578521ad0cefbc037a12f6aa4c0e7d0507bf61ac0938f64e6  dist/useMeAction-BB0Vf7vQ.js
befa934df1d4fd6c1879615b9eda7cd277575e69fcf51f1f19d7c23c88f2fb43  dist/vision_bundle-Bv-Hj6v-.js
```

## Results from the clean trees
- cleaker: suite + contract (K1–K17, L1–L4):
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
- GUI `test:runtime` (unit + vault 11 + parser 7 + mechanism 4 + contract 4 + browser integration 32): ok (`logs/gui-test-runtime.log`)
- monad, whole suite, base cleaker vs new cleaker (same clean tree, sibling `me`, release `this.me`):
```
monad suite, base cleaker: 667 pass / 5 fail / 673 total; suites failed 9 of 227
   monad suite, new  cleaker: 667 pass / 5 fail / 673 total; suites failed 9 of 227
   tests whose status differs between base and new cleaker: 0
```
  Failures that exist with the base cleaker too: 5 seed/claim-hydration tests, 1 file that does not collect (`signUpClaimFlow`).
  `Security/stateDirLockRace.process` is a known flake (unreproduced in 29 earlier attempts; 5/5 on the new cleaker).
- development path, disposable (OpenResty with netget's generated blocks + Lua; the app's server on its own port):
```
PASS  0. the disposable door is up  — door :49697, API :49696, monad :49695
PASS  1.1 the interface comes through the door  — status 200
PASS  1.2 /api/fuel goes through the door to the app's server
PASS  1.3 the same server answers on its own port
PASS  2.1 one namespace through three addresses  — fulltrailer.suis-macbook-air.local | fulltrailer.suis-macbook-air.local | fulltrailer.suis-macbook-air.local
PASS  2.2 three transports
PASS  3.1 through the door: it signs in  — 1 sign-in(s)
PASS  3.2 the namespace that arrived is the bare one, signed  — ana.fulltrailer.suis-macbook-air.local
PASS  4.1 the API is not a monad: the attempt fails  — REQUEST_FAILED_404
PASS  4.2 every destination contacted is the API's port  — http://fulltrailer.suis-macbook-air.local:49696/claims/signIn, http://fulltrailer.suis-macbook-air.local:49696/
PASS  4.3 no signed proof reached the door's monad
PASS  5.1 the contradiction is reported, not resolved  — TRANSPORT_PORT_CONFLICT
PASS  5.2 nothing was sent for it
PASS  5.3 the GUI says the same (conflict)
PASS  6.1 two doors are two links
PASS  6.2 the door that answered is ready; the API's is not
PASS  6.3 a reading for one door does not confirm the other

17/17
```
- the same with a REAL disposable monad (claim, re-entry, contradicting port, no implicit fallbacks):
```
PASS  0. the door and the real monad are up  — door :49717, monad :49715, API :49716
PASS  1.1 claim + open through the door, against a real monad  — identity 64d13859ed87
PASS  2.1 back in through the door: the same identity and namespace
PASS  3.1 the same identity and namespace through the monad's own port
PASS  4.1 a contradictory written port is refused  — TRANSPORT_PORT_CONFLICT
PASS  4.2 nothing was sent for it
PASS  5.1 the declared door is down: the attempt fails  — NETWORK_ERROR
PASS  5.2 only that door was contacted (not the page's door, not the monad, not cleaker.me/localhost)  — fulltrailer.suis-macbook-air.local:49718
PASS  6.1 one identity, one namespace, three transports
disposable monad port: gone

9/9
```

## Behavior this candidate changes (decisions to approve, not assumptions)
1. `fqdn`/`constant` no longer carry the port; `localhost:8191` keeps the namespace `localhost` (cleaker NS1 and NRP4 changed).
2. A signed proof is presented only to the transport DECLARED for the node (space / bootstrap / per-call space / explicit
   `fallbackOrigins`). `window.location`, environment defaults, the machine hostname, `cleaker.me` and `localhost` do not authorize a
   destination; nothing declared -> `TRANSPORT_NOT_DECLARED` (`allowImplicitTransport` restores the old discovery).
3. A written port that contradicts the explicit port of the declared transport is `TRANSPORT_PORT_CONFLICT`; nothing is sent.
4. The identity vault is found by the namespace under any spelling; conflicts are asked; originals are kept.
5. The card says which key a sign-in will use before signing.

## The 34 topic commits over `cb79c8e0` (the restructure's own merge point), by role
This candidate evaluates the SET; it does not approve the restructure.

| role | commit | subject |
|---|---|---|
| interface — separable in intent | `45668a3c` | QR: declare cornerRadius (the clip radius QR.me already passes; default 12 keeps the old look) |
| interface — separable in intent | `03368bd1` | main-server view: say nothing before the first reads return; a refusal is 'not shown on this door' |
| interface — separable in intent | `dd90c5ae` | shell: the rail's QR opens the identity card over the current page instead of navigating to "/" |
| interface — separable in intent | `3d19ee34` | identity card: closing returns focus to the rail badge (explicitly, after the dialog has exited) |
| interface — separable in intent | `cc65ae8a` | main-server view: the public address says when it was observed and whether the latest check worked; no empty Local IP row |
| interface — separable in intent | `d0fc83d7` | shell: hideBarItems (icons only); main-server view: one line when the operator's port status is not for this caller |
| interface — separable in intent | `20c85667` | main-server view: the door and its namespace on one line, owner card with QR, operator part only for an accepted admin session |
| interface — separable in intent | `b5dcd6e7` | feat(identity card): Keys and Wallet icons between the name and the fingerprint |
| interface — separable in intent | `e6026e34` | identity card: icons closer to the QR (air above matches air below) |
| interface — separable in intent | `8425bc77` | Icon: glyph:<text> draws the text as the icon; the Netget link uses netget's glyph |
| position-label chain — textual dependency of the link/port commits | `da1e8cae` | QR: the namespace and the address bar are written together (namespace@host) when they are different places |
| position-label chain — textual dependency of the link/port commits | `226e53a5` | position expression: the NRP's overlay spelling (namespace/path @ surface), checked against the parser |
| position-label chain — textual dependency of the link/port commits | `071bf16e` | position label: abbreviate only a CHECKED binding; the semantic path is never a GUI route |
| position-label chain — textual dependency of the link/port commits | `8be67277` | position label: shorter -- no root slash, bare host:port, scheme only when it is news |
| position-label chain — textual dependency of the link/port commits | `b6a50ebe` | position label: a failed re-resolution cannot reuse the old confirmation; the scheme is shown when it is the reason; a full expression for copying |
| interface — separable in intent | `7947d949` | top bar: the namespace is written at its left, on every page |
| interface — separable in intent | `6a5cf8b3` | identity is a page (/.me), not a dialog; a Home icon sits next to the namespace in the top bar |
| interface — separable in intent | `826a29bf` | home: '/' is the welcome (Welcome to <namespace>), the identity card lives at /.me |
| position-label chain — textual dependency of the link/port commits | `a1985c3e` | the shell names the namespace the monad ANSWERED for, not the address |
| link model — dependency of the port change (per-link sessions, checkWrittenDoor) | `98dcbb8f` | card: the selected link decides the namespace, the hostname does not |
| link model — dependency of the port change (per-link sessions, checkWrittenDoor) | `17934e04` | link: links, sessions, context, location and surface as pure values |
| link model — dependency of the port change (per-link sessions, checkWrittenDoor) | `8b27b0b9` | test: the link conditions against the real <Cleaker> (red: selection while a session is open) |
| link model — dependency of the port change (per-link sessions, checkWrittenDoor) | `f45fc42b` | session: one session per link; the card selects a link while another keeps its session |
| link model — dependency of the port change (per-link sessions, checkWrittenDoor) | `95b80cb7` | link: workspace -- namespace contexts with zero, one or several open pages |
| **THE PORT CHANGE** | `f7e1a807` | tests: a port in the root -- the vault key and the live path (characterization, contract, disposable monad) |
| **THE PORT CHANGE** | `bf37053c` | identity vault: found by the namespace (a port is not part of it); conflicts are asked, never picked |
| **THE PORT CHANGE** | `43c46709` | port is the transport: GUI parser, typed root, door conflicts, and the identity a sign-in attempts |
| **THE PORT CHANGE** | `5a35b123` | card: say which key a sign-in will use BEFORE signing |
| tests / docs / tooling | `7c347f41` | docs: port-is-the-transport integration plan (exact inputs, monad routes measured, decisions, order, final check) |
| tests / docs / tooling | `c30a6e87` | topic: test entries re-added, plan updated (names/addresses/identity, proof destinations, the topic split) |
| tests / docs / tooling | `6feb4a92` | tests: the development path end to end, disposable (interface through the door, API on its own port, namespace independent of the port) |
| tests / docs / tooling | `c026c2b0` | tests: the development path with a REAL disposable monad behind the door (claim, re-entry, contradicting port, no implicit fallbacks) |
| tests / docs / tooling | `4f146481` | candidate: reproducible build-and-check script from pinned SHAs (clean detached trees) |
| tests / docs / tooling | `e0d0c8be` | candidate: netget tree pinned too; recorrido tests take NETGET_TREE / CLEAKER_TREE |

Why interface commits are in: `Namespace.tsx` and `QRConnect.tsx` carry both the interface work and the files the port change
edits; cherry-picking the port commits without the earlier ones in those files conflicted at the third commit. They are separable
in intent, not proven separable by build. Excluded on purpose (the candidate builds and passes without them): orb icon work, the
left-bar corner/QR control, the QR-carries-namespace + spacing commit.

## Not covered
- A monad running the new cleaker in production; consumers of netget's published `cleaker ^3.2.1`; the legacy `monad` session
  backend; `main` of the GUI (4.2.0), which does not contain this restructure.
- Nothing was published, deployed or merged. Disposable processes were killed by pid; ports checked free.
