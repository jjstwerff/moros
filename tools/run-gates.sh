#!/bin/sh
# RUN THE GATES IN PARALLEL, EACH WITH ITS OWN SERVER ON ITS OWN PORT.
#
# WHY. The suite was 28 gates on one port, one at a time: kill the server, start
# it, drive it, kill it. Measured, that is ~40 minutes on a 24-core box — and it
# also means nobody can touch the editor while it runs, because the port is the
# single resource everything contends for. Both problems are the same problem.
#
# A server starts in 1.4 s, so startup was never the cost; the cost is that a gate
# DRIVES a world and the next one waits for it. They are independent, so they run
# together: one server per gate, `EDITOR_PORT` apart, `GATE_JOBS` at a time.
#
#   tools/run-gates.sh tools/gates/world/*.mjs
#   GATE_JOBS=12 tools/run-gates.sh tools/gates/character/*.mjs
#
# ⚠ EVERY GATE MUST READ `EDITOR_PORT`, or they all dial 18090 and trip over each
# other's worlds. The one-line form is in every gate file; a new gate that hardcodes
# the port will pass alone and fail in the suite, which is the worst way round.
#
# Each gate's server log is `.gate-<name>.log`, kept on failure and otherwise just
# overwritten next run. The per-gate seconds are printed because a suite that takes
# minutes deserves to say WHERE they went.
#
# ── ⚠ WHAT BELONGS IN A GATE AT ALL — audited 2026-08-06, all 44 ─────────────
#
# CLAUDE.md's rule: *the store's rules are loft tests; the drawn result and the
# sentences are gates*, and every gate says at its top which it is — **because
# without that the next reader thins the honest ones by symmetry.** Seventeen said
# nothing. All 44 now do.
#
# ⚠ CLASSIFY BY WHAT THE VERDICT ASSERTS, NEVER BY WHAT THE HEADER SAYS. Two gates
# were found claiming more than they check — `vegetation` argues four properties and
# judges three, and `cart` argues the wheel law while its verdict is
# `grounded && banked && bankSigned`. A header describing coverage that has already
# moved is worse than none: the next person to thin the file would be thinning
# something already gone. The discriminator is what the verdict READS:
#
#   acknowledgement strings only   a WIRE gate. The rule is a loft test; this is the
#                                  gesture reaching it. `fence`, `field`, `storey`.
#   the store, via `26:`/`15:`     a claim that COULD move — check whether it has.
#                                  Kept in three places, each for a stated reason:
#                                  `doorstep` (the sentence and the store must be
#                                  shown disagreeing), `part_inst` (one message,
#                                  two meanings, decided by the mode) and
#                                  `part_mode` (the world came back exactly).
#   a file's bytes                 a claim about disk after a gesture — routing and
#                                  null-edits. `part_save`, `part_check`, `part_new`.
#   the emitted mesh or a picture  needs a server by construction. The five browser
#                                  gates, plus `part_mode`'s registry comparison —
#                                  the wall runs, roof plans, annexes and props that
#                                  NO message reads back, so the only instrument
#                                  that can see them restored is every surface
#                                  re-meshing to what it was.
#
# ⚠ AND A FIXED WAIT IS RIGHT WHEN THE CLAIM IS AN ABSENCE. Everything else polls for
# evidence — a gate that sleeps reports the machine. But *an unchanged library sends
# nothing in 4 s* (`library`) and *a refused toggle sends no `H:` at all* (`subject`)
# have no event to wait for, and polling would either return at once, proving nothing,
# or hang. There the window IS the instrument, and both say so where they sit.
# ── ⚠ THE SERVER IS BUILT ONCE AND EXEC'D 44 TIMES ──────────────────────────
#
# Startup was 5-6 s a gate — ~220 s of the suite — because every one of them started
# an INTERPRETED server: `loft` parsing a 5,900-line file, 44 times, for a program
# that had already been compiled. Exec'ing the compiled binary straight out of loft's
# cache reaches `listening` in **217-273 ms**, measured; `loft --native` is ~3500 ms
# and `loft --interpret` ~6000 ms. Nothing is shared and no isolation is given up:
# every gate still gets its own process, its own port and its own `EDITOR_PARTS`.
#
# ⚠ AND A STALE BINARY RUNS OLD CODE SILENTLY, which is the one way this is fatally
# wrong. Measured: with `editor_server.loft` edited to answer `placed 0,0 STALEPROBE`,
# exec'ing the cached path still answered `placed 0,0` — a whole suite green against
# yesterday's server.
#
# What makes it safe is that loft's cache is CONTENT-ADDRESSED AND SELF-CLEANING:
# editing the source produced `editor_server-879386d85355772e` and REMOVED
# `editor_server-25acec083708faca`; reverting the source restored `25acec083708faca`
# exactly. So the binary is rebuilt HERE, once, before anything fans out — a stale one
# cannot survive that, and the glob below cannot find one that does not exist.
#
# ⚠ THE BUILD IS NEVER SKIPPED ON A GUESS. A timestamp comparison against the source
# would be a heuristic standing in for a content hash, and the failure it admits is the
# silent one above. It costs ~3.5 s when nothing changed and ~29 s when it did, against
# ~220 s saved.
#
# ⚠ AND THE BINARY IS COPIED TO `.gatebin/server` BEFORE IT IS RUN, WHICH IS NOT
# TIDINESS — IT IS THE WHOLE THING WORKING AT ALL.
#
# A compiled loft program roots its relative file I/O at **its own directory's parent**,
# baked in at compile time. Exec'd from `src/.loft/cache/`, that root is `src/.loft/`,
# so `shots/`, `recordings/` and every saved world go somewhere that does not exist:
# `loft: cannot create .../src/.loft/cache/../shots/shot-1.txt — write skipped`. Neither
# `--project` nor an environment variable overrides it; measured, both are ignored.
#
# ⚠ AND IT DOES NOT ANNOUNCE ITSELF AS A PATH FAULT. The first full suite this way was
# **7 gates red**, and their verdicts read like rendering and streaming defects:
# `cache` and `client_mesh` reported nothing at all, `camera_indoors` and `deck_soffit`
# came back `subject 0.0001` — a near-empty frame — and `persist` failed both its acks.
# Every one of them was a file the server could not read or write.
#
# A copy at `<repo>/.gatebin/server` puts that baked-in root back on the repository.
# Measured: zero path errors from the same probe that produced them.
#
# ⚠ `GATE_LOFT` STILL WINS, so the old path is one variable away — `GATE_LOFT=--interpret`
# is how you compare the two backends, and it is what a bisect wants.
free_port() {
  p=$1
  while [ "$p" -lt $((${1} + 200)) ]; do
    if ! ss -ltn "sport = :$p" 2>/dev/null | grep -q ":$p"; then echo "$p"; return 0; fi
    p=$((p + 1))
  done
  echo ""; return 1
}

build_server() {
  bport=$(free_port 18700)
  [ -n "$bport" ] || { echo "gates: no free port to build the server on"; return 1; }
  blog=$(mktemp)
  # ⚠ THE PID IS KEPT AND THE KILL IS BY PID. This box runs other agents' work, and a
  # port is not an identity — `pkill -f` matches the shell running it as well.
  EDITOR_PORT="$bport" loft --native --lib lib/ src/editor_server.loft > "$blog" 2>&1 &
  bpid=$!
  i=0
  while [ "$i" -lt 1200 ]; do
    grep -q 'listening on port' "$blog" 2>/dev/null && break
    kill -0 "$bpid" 2>/dev/null || break
    sleep 0.25
    i=$((i + 1))
  done
  ok=0
  grep -q 'listening on port' "$blog" 2>/dev/null && ok=1
  kill "$bpid" 2>/dev/null
  wait "$bpid" 2>/dev/null
  # ⚠ `loft --native` FORKS, AND `pgrep -P` CANNOT SEE THE CHILD ONCE THE WRAPPER IS
  # DEAD — it has been reparented, so the first version of this leaked one server per
  # invocation. Five were found running at 189 s to 1039 s old, all on this port range,
  # after a handful of suite runs: the "stop what you start" rule broken by the code
  # written to enforce it.
  #
  # So the child is found by the PORT IT HOLDS and killed by pid — and only after its
  # command line is checked, because a port is not an identity and this box runs other
  # agents' editors. That is `run-gates.sh`'s own rule, one function up.
  for c in $(ss -lptn "sport = :$bport" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u); do
    case "$(tr '\0' ' ' < "/proc/$c/cmdline" 2>/dev/null)" in
      *editor_server*|*loft_native_bin_*) kill "$c" 2>/dev/null ;;
    esac
  done
  if [ "$ok" -eq 0 ]; then
    echo "gates: the server would not build — falling back to the interpreter"
    grep -vE '^warning|^ *\||^ *-->|^ *=|^advice|^note:' "$blog" | tail -6
    rm -f "$blog"; return 1
  fi
  rm -f "$blog"; return 0
}

self=$0

if [ "${1:-}" = "--one" ]; then
  gate=$2
  port=$3
  name=$(basename "$gate" .mjs)
  log=".gate-$name.log"
  : > "$log"
  start=$(date +%s%N)

  # ⚠ FREE THE PORT FIRST, AND ONLY IF IT IS OURS. A run that was killed leaves a
  # server holding its port, and the next run's server then dies on `cannot bind`
  # — reported as "SERVER NEVER LISTENED", which reads like a compile error. Kill
  # only a process whose command line says it is an editor: this box runs other
  # people's work, and a port number is not an identity.
  for pid in $(ss -lptn "sport = :$port" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u); do
    case "$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null)" in
      *editor_server*|*loft_native_bin_*) kill "$pid" 2>/dev/null ;;
    esac
  done

  # ⚠ EVERY GATE GETS ITS OWN COPY OF THE PART LIBRARY — plan 17 `A7.1`.
  #
  # `data/parts/` is COMMITTED and this tree is worked by more than one agent, so a
  # gate that writes there corrupts somebody's working copy and leaves the
  # repository dirty when it fails. `probe/b1`'s `B5.3` already hand-rolled a
  # scratch root for exactly that reason; this makes it the rule instead of the
  # exception, and it is what lets a gate ADD or REMOVE a part while the editor
  # watches — which is the only way to test that the catalogue can change at all.
  #
  # ⚠ ABSOLUTE, because the server resolves `EDITOR_PARTS` as given and a gate's
  # own cwd is not the server's guarantee. And cleaned up on every exit path below,
  # including the one where the server never listened.
  parts=$(mktemp -d)
  cp -r data/parts/. "$parts/" 2>/dev/null || true

  # The parent set `GATE_SERVER_BIN` if it built one; otherwise this is the old path,
  # unchanged, which is what `GATE_LOFT=--interpret` and every fallback below take.
  if [ -n "${GATE_SERVER_BIN:-}" ]; then
    EDITOR_PORT="$port" EDITOR_PARTS="$parts" "$GATE_SERVER_BIN" > "$log" 2>&1 &
  else
    EDITOR_PORT="$port" EDITOR_PARTS="$parts" \
      loft ${GATE_LOFT:---interpret} --lib lib/ src/editor_server.loft > "$log" 2>&1 &
  fi
  pid=$!
  listening=0
  i=0
  while [ "$i" -lt 240 ]; do
    if grep -q 'listening on port' "$log" 2>/dev/null; then listening=1; break; fi
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.25
    i=$((i + 1))
  done

  if [ "$listening" -eq 0 ]; then
    printf '%-34s %s\n' "$name" "SERVER NEVER LISTENED — see $log"
    grep -vE '^warning|^ *\||^ *-->|^ *=|^advice' "$log" | tail -6
    kill "$pid" 2>/dev/null
    rm -rf "$parts"
    exit 1
  fi

  # ⚠ STDERR TO ITS OWN FILE. A gate that times out waiting for an ack it will
  # never get says so on stderr and then carries on green — folding that into the
  # captured stdout hid it behind the one line this prints.
  out=$(EDITOR_PORT="$port" EDITOR_PARTS="$parts" node "$gate" 2>".gate-$name.err")
  rc=$?
  kill "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null
  rm -rf "$parts"
  end=$(date +%s%N)
  secs=$(( (end - start) / 100000000 ))

  # ⚠ THE VERDICT, NOT THE FIRST 110 CHARACTERS OF IT. A gate's `ok` sits at the
  # END of its JSON, so truncating the line to fit a terminal hid exactly the field
  # the suite exists to report — `grep -c ok:true` counted 3 of 28 passing runs.
  verdict=PASS
  [ "$rc" -eq 0 ] || verdict=FAIL
  case "$out" in *'"ok":false'*) verdict=FAIL ;; esac
  # ⚠ SILENT WHEN IT PASSES. loft's own Goal F says a tool that reports its good
  # health teaches the reader to skip the line where it eventually reports the
  # opposite — so a green gate says nothing, and a red one says everything.
  # `GATE_VERBOSE=1` brings the timings back for profiling, which is a different
  # question from "is it green".
  if [ "$verdict" != PASS ] || [ -n "${GATE_VERBOSE:-}" ]; then
    printf '%-4s %-20s %3d.%ds  %s\n' "$verdict" "$name" "$((secs / 10))" "$((secs % 10))" \
           "$(printf '%s' "$out" | tail -1 | cut -c1-100)"
  fi
  if [ "$verdict" != PASS ] && [ -s ".gate-$name.err" ]; then
    sed 's/^/     /' ".gate-$name.err" | head -5
  fi
  [ "$verdict" = PASS ] || exit 1
  exit 0
fi

jobs=${GATE_JOBS:-8}
base=${GATE_PORT_BASE:-18200}

# ── build the server once, and resolve it by GLOB rather than by a name ─────
#
# ⚠ EXACTLY ONE, OR THE OLD PATH. loft removes the previous binary when it makes a new
# one, so two matches means something else is going on — a concurrent build, a partial
# write — and picking one of them arbitrarily is how the stale case gets in through the
# side door. Zero matches means the build did not produce what it said it did.
# ⚠ COUNTED WITHOUT `set --`, which would eat the gate list this script was called
# with. That is not a style point: it silently ran zero gates and reported success.
GATE_SERVER_BIN=""
if [ -z "${GATE_LOFT:-}" ]; then
  if build_server; then
    found=$(ls -1d src/.loft/cache/editor_server-* 2>/dev/null | wc -l)
    if [ "$found" -eq 1 ]; then
      cand=$(ls -1d src/.loft/cache/editor_server-* 2>/dev/null)
      if [ -x "$cand" ]; then
        # ⚠ AND THE CLIENT PAGE TRAVELS WITH IT. `read_client()` looks in
        # `{source_dir()}/.loft/editor_client.html`, and `source_dir()` follows the
        # binary — so from `.gatebin/` the server served its own *404, the wasm client
        # is not built* page, 178 bytes instead of 2.3 MB. The browser then drew
        # nothing, which reached the verdicts as `subject 0.0001` and *(no cache
        # report)*: a missing FILE wearing a renderer's clothes.
        mkdir -p .gatebin/.loft
        cp "$cand" .gatebin/server.new && mv .gatebin/server.new .gatebin/server \
          && GATE_SERVER_BIN=$(pwd)/.gatebin/server
        if [ -f src/.loft/editor_client.html ]; then
          cp src/.loft/editor_client.html .gatebin/.loft/editor_client.html.new \
            && mv .gatebin/.loft/editor_client.html.new .gatebin/.loft/editor_client.html
        else
          echo "gates: src/.loft/editor_client.html is missing — run 'make client'"
          GATE_SERVER_BIN=""
        fi
      fi
    else
      echo "gates: expected one built server, found $found — using the interpreter"
    fi
  fi
fi
export GATE_SERVER_BIN

i=0
for g in "$@"; do
  echo "$g $((base + i))"
  i=$((i + 1))
done | xargs -P "$jobs" -n2 sh -c 'exec "$0" --one "$1" "$2"' "$self"
