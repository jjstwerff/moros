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
set -u

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

  EDITOR_PORT="$port" EDITOR_PARTS="$parts" \
    loft ${GATE_LOFT:---interpret} --lib lib/ src/editor_server.loft > "$log" 2>&1 &
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

i=0
for g in "$@"; do
  echo "$g $((base + i))"
  i=$((i + 1))
done | xargs -P "$jobs" -n2 sh -c 'exec "$0" --one "$1" "$2"' "$self"
