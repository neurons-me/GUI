#!/usr/bin/env bash
# Builds and checks the port-is-the-transport CANDIDATE from pinned SHAs, in clean detached trees (no reliance on any
# checkout's dist), and writes a manifest. Publishes, deploys and merges NOTHING.
#
#   CLEAKER_SHA=... GUI_SHA=... MONAD_SHA=... bash build-candidate.sh <out-dir>
#
# Dependencies are NOT re-resolved: node_modules entries are symlinked from the workspace's installed set (the monorepo
# links cleaker/this.me as workspace packages and has no offline lockfile install). What is pinned is recorded in deps.tsv.
set -uo pipefail
OUT=${1:?out dir}; ALL=${ALL_THIS:-$HOME/Desktop/Neuroverse/all.this}
: "${CLEAKER_SHA:?}" "${GUI_SHA:?}" "${MONAD_SHA:?}" "${NETGET_SHA:?}"
THISME=${THISME_TREE:-$HOME/.get/releases/r20261014-1/me/Typescript}
mkdir -p "$OUT/src" "$OUT/logs"; cd "$OUT"
log() { echo "== $*"; }
sha256() { shasum -a 256 "$@" | awk '{print $1"  "$2}'; }
overlay() { # overlay <tree> <deps-from> [cleaker-path] [thisme-path]
  local tree=$1 from; from=$(readlink -f "$2"); rm -rf "$tree/node_modules"; mkdir "$tree/node_modules"
  for e in $(ls -A "$from"); do ln -s "$from/$e" "$tree/node_modules/$e"; done
  [ -n "${3:-}" ] && { rm -f "$tree/node_modules/cleaker"; ln -s "$3" "$tree/node_modules/cleaker"; }
  [ -n "${4:-}" ] && { rm -f "$tree/node_modules/this.me"; ln -s "$4" "$tree/node_modules/this.me"; }
}
wt() { git -C "$1" worktree add -q --detach "$2" "$3"; }

log "clean trees at the pinned SHAs"
wt "$ALL/cleaker-port-namespace" "$OUT/src/cleaker" "$CLEAKER_SHA"
wt "$ALL/gui-port-isolated"      "$OUT/src/gui"     "$GUI_SHA"
wt "$ALL/monad-candidate"        "$OUT/src/monad"   "$MONAD_SHA"
wt "$ALL/netget-main-entry"      "$OUT/src/netget"  "$NETGET_SHA"
CL="$OUT/src/cleaker/Typescript"; GU="$OUT/src/gui/Typescript"; MO="$OUT/src/monad/Typescript"; NG="$OUT/src/netget/Typescript"
overlay "$NG" "$ALL/netget-main-entry/Typescript/node_modules"

log "cleaker: build from the clean tree"
overlay "$CL" "$ALL/modules/cleaker/Typescript/node_modules"
( cd "$CL" && npx vite build > "$OUT/logs/cleaker-build.log" 2>&1 ) && echo ok || echo "BUILD FAILED"
sha256 "$CL"/dist/cleaker.es.js "$CL"/dist/cleaker.cjs "$CL"/dist/cleaker.umd.js > "$OUT/cleaker.dist.sha256"

log "cleaker: tests from the clean tree"
( cd "$CL" && for t in axioms bind namespace-expression nrp-target me-target space namespace-fallback namespace-constant-resolution port-namespace.contract group; do
    printf "%-34s" "$t"; npx tsx tests/$t.test.ts > "$OUT/logs/cleaker-$t.log" 2>&1 && echo ok || echo FAIL; done ) | tee "$OUT/cleaker.tests.txt"

log "GUI: node_modules = the workspace set, cleaker = the clean cleaker build"
overlay "$GU" "$ALL/gui-integration/Typescript/node_modules" "$CL"
( cd "$GU" && npx vite build > "$OUT/logs/gui-build.log" 2>&1 ) && echo "gui build ok" || echo "GUI BUILD FAILED"
( cd "$GU" && find dist -maxdepth 1 -type f \( -name '*.js' -o -name '*.css' \) -print0 | sort -z | xargs -0 shasum -a 256 ) > "$OUT/gui.dist.sha256" 2>/dev/null

log "GUI: test:runtime from the clean tree (unit + browser integration)"
( cd "$GU" && npm run test:runtime > "$OUT/logs/gui-test-runtime.log" 2>&1 ) && echo "test:runtime ok" || echo "test:runtime FAILED"
tail -12 "$OUT/logs/gui-test-runtime.log" | sed 's/^/   /'

log "monad: clean tree, cleaker under test (and the base cleaker for comparison), this.me from the release"
# the monad's tests import ../../../me/Typescript/dist/me.es.js: a sibling `me` must exist next to the monad tree
mkdir -p "$OUT/src/me" && ln -sfn "$THISME" "$OUT/src/me/Typescript"
overlay "$MO" "$ALL/modules/monad/Typescript/node_modules" "$CL" "$THISME"
( cd "$MO" && npx vitest run --reporter=json --outputFile="$OUT/monad.suite.new.json" > "$OUT/logs/monad-suite-new.log" 2>&1 )
rm -f "$MO/node_modules/cleaker" && ln -s "${BASE_CLEAKER_TREE:-$ALL/modules/cleaker/Typescript}" "$MO/node_modules/cleaker"
( cd "$MO" && npx vitest run --reporter=json --outputFile="$OUT/monad.suite.base.json" > "$OUT/logs/monad-suite-base.log" 2>&1 )
rm -f "$MO/node_modules/cleaker" && ln -s "$CL" "$MO/node_modules/cleaker"
python3 - "$OUT/monad.suite.base.json" "$OUT/monad.suite.new.json" <<'PY' | tee "$OUT/monad.compare.txt"
import json,sys
def load(p):
    d=json.load(open(p)); r={}
    for f in d['testResults']:
        for t in f['assertionResults']:
            r[(f['name'].split('/Typescript/')[-1], t['fullName'])]=t['status']
    return d,r
bd,b=load(sys.argv[1]); nd,n=load(sys.argv[2])
for nm,d in (('base cleaker',bd),('new  cleaker',nd)):
    print(f"   monad suite, {nm}: {d['numPassedTests']} pass / {d['numFailedTests']} fail / {d['numTotalTests']} total; suites failed {d['numFailedTestSuites']} of {d['numTotalTestSuites']}")
ch=[(k,b.get(k),n.get(k)) for k in sorted(set(b)|set(n)) if b.get(k)!=n.get(k)]
print(f"   tests whose status differs between base and new cleaker: {len(ch)}")
for k,x,y in ch: print('     ',k[0].split('tests/')[-1],'|',k[1][:70],'|',x,'->',y)
PY

log "development path, disposable: stub monad and REAL monad"
( cd "$GU" && NETGET_TREE="$NG" CLEAKER_TREE="$CL" npx tsx tests/port-namespace/recorrido.netget.test.ts 2>&1 | tail -20 ) | tee "$OUT/recorrido.netget.txt"
( cd "$GU" && NETGET_TREE="$NG" CLEAKER_TREE="$CL" REAL_MONAD_SRC="$MO" npx tsx tests/port-namespace/recorrido.real-monad.test.ts 2>&1 | tail -16 ) | tee "$OUT/recorrido.real-monad.txt"

log "pinned inputs"
{
  printf "piece\tsha\tversion\n"
  printf "cleaker\t%s\t%s\n" "$CLEAKER_SHA" "$(node -p "require('$CL/package.json').version")"
  printf "gui\t%s\t%s\n" "$GUI_SHA" "$(node -p "require('$GU/package.json').version")"
  printf "monad\t%s\t%s\n" "$MONAD_SHA" "$(node -p "require('$MO/package.json').version")"
  printf "netget\t%s\t%s\n" "$NETGET_SHA" "$(node -p "require('$NG/package.json').version")"
  printf "this.me(tests)\t%s\t%s\n" "$(git -C "$THISME" rev-parse --short HEAD 2>/dev/null || echo release-tree)" "$(node -p "require('$THISME/package.json').version")"
  printf "node\t-\t%s\n" "$(node -v)"
  printf "openresty\t-\t%s\n" "$(/opt/homebrew/bin/openresty -v 2>&1 | head -1)"
} > "$OUT/sources.tsv"
cat "$OUT/sources.tsv"
log "done (nothing published, deployed or merged)"
