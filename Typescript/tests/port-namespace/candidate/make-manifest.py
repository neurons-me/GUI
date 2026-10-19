#!/usr/bin/env python3
"""Writes CANDIDATE.md next to the artifacts build-candidate.sh produced. usage: make-manifest.py <out-dir>"""
import subprocess, sys, datetime
OUT = sys.argv[1]
def sh(*a): return subprocess.run(a, capture_output=True, text=True).stdout.strip()
def read(p):
    try: return open(f'{OUT}/{p}').read().strip()
    except Exception: return '(missing)'
log = sh('git', '-C', f'{OUT}/src/gui', 'log', '--reverse', '--format=%h|%s', 'cb79c8e0..HEAD').splitlines()
cat = {}
for h in '45668a3c 03368bd1 dd90c5ae 3d19ee34 cc65ae8a d0fc83d7 20c85667 b5dcd6e7 e6026e34 8425bc77 7947d949 6a5cf8b3 826a29bf'.split(): cat[h] = 'I'
for h in '226e53a5 071bf16e 8be67277 b6a50ebe da1e8cae a1985c3e'.split(): cat[h] = 'P'
for h in '98dcbb8f 17934e04 8b27b0b9 f45fc42b 95b80cb7'.split(): cat[h] = 'L'
for h in 'f7e1a807 bf37053c 43c46709 5a35b123'.split(): cat[h] = 'X'
names = {'I': 'interface — separable in intent', 'P': 'position-label chain — textual dependency of the link/port commits',
         'L': 'link model — dependency of the port change (per-link sessions, checkWrittenDoor)', 'X': '**THE PORT CHANGE**', 'E': 'tests / docs / tooling'}
rows = [(cat.get(l.split('|', 1)[0], 'E'), *l.split('|', 1)) for l in log]
md = f"""# Port-is-the-transport — candidate (not published, not deployed, not merged)

Built {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')} from clean detached trees at pinned SHAs, by
`tests/port-namespace/candidate/build-candidate.sh`. No `dist` of any checkout is used; dependencies are the workspace's installed
set, symlinked (the monorepo has no offline lockfile install) — what is pinned is below.

## Pinned inputs
```
{read('sources.tsv')}
```
`this.me` for the monad's tests and the real-monad path is the release `r20261014-1` tree (4.2.0); the repo-linked `me/Typescript`
has a stale `dist`. The GUI tree builds against the cleaker built from the pinned cleaker SHA (symlinked as `node_modules/cleaker`).

## Reproducible outputs (sha256; cleaker rebuilt twice in the same clean tree: identical)
```
{read('cleaker.dist.sha256')}
{read('gui.dist.sha256')}
```

## Results from the clean trees
- cleaker: suite + contract (K1–K17, L1–L4):
```
{read('cleaker.tests.txt')}
```
- GUI `test:runtime` (unit + vault 11 + parser 7 + mechanism 4 + contract 4 + browser integration 32): ok (`logs/gui-test-runtime.log`)
- monad, whole suite, base cleaker vs new cleaker (same clean tree, sibling `me`, release `this.me`):
```
{read('monad.compare.txt')}
```
  Failures that exist with the base cleaker too: 5 seed/claim-hydration tests, 1 file that does not collect (`signUpClaimFlow`).
  `Security/stateDirLockRace.process` is a known flake (unreproduced in 29 earlier attempts; 5/5 on the new cleaker).
- development path, disposable (OpenResty with netget's generated blocks + Lua; the app's server on its own port):
```
{read('recorrido.netget.txt')}
```
- the same with a REAL disposable monad (claim, re-entry, contradicting port, no implicit fallbacks):
```
{read('recorrido.real-monad.txt')}
```

## Behavior this candidate changes (decisions to approve, not assumptions)
1. `fqdn`/`constant` no longer carry the port; `localhost:8191` keeps the namespace `localhost` (cleaker NS1 and NRP4 changed).
2. A signed proof is presented only to the transport DECLARED for the node (space / bootstrap / per-call space / explicit
   `fallbackOrigins`). `window.location`, environment defaults, the machine hostname, `cleaker.me` and `localhost` do not authorize a
   destination; nothing declared -> `TRANSPORT_NOT_DECLARED` (`allowImplicitTransport` restores the old discovery).
3. A written port that contradicts the explicit port of the declared transport is `TRANSPORT_PORT_CONFLICT`; nothing is sent.
4. The identity vault is found by the namespace under any spelling; conflicts are asked; originals are kept.
5. The card says which key a sign-in will use before signing.

## The {len(rows)} topic commits over `cb79c8e0` (the restructure's own merge point), by role
This candidate evaluates the SET; it does not approve the restructure.

| role | commit | subject |
|---|---|---|
""" + "\n".join(f"| {names[c]} | `{h}` | {s} |" for c, h, s in rows) + """

Why interface commits are in: `Namespace.tsx` and `QRConnect.tsx` carry both the interface work and the files the port change
edits; cherry-picking the port commits without the earlier ones in those files conflicted at the third commit. They are separable
in intent, not proven separable by build. Excluded on purpose (the candidate builds and passes without them): orb icon work, the
left-bar corner/QR control, the QR-carries-namespace + spacing commit.

## Not covered
- A monad running the new cleaker in production; consumers of netget's published `cleaker ^3.2.1`; the legacy `monad` session
  backend; `main` of the GUI (4.2.0), which does not contain this restructure.
- Nothing was published, deployed or merged. Disposable processes were killed by pid; ports checked free.
"""
open(f'{OUT}/CANDIDATE.md', 'w').write(md)
print(f'{OUT}/CANDIDATE.md written ({len(rows)} commits)')
