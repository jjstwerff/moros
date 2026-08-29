#!/bin/sh
# RUN A PACKAGE'S TESTS WITHOUT HITTING `loft test`'s 300-SECOND WALL.
#
#   tools/suite.sh                  every lib/ package that has tests
#   tools/suite.sh hex_editor       one package
#   SUITE_JOBS=6 tools/suite.sh     …in parallel (default 4)
#   SUITE_NATIVE=1 tools/suite.sh   …on the native backend as well
#   SUITE_TIMEOUT=600 tools/suite.sh  …a longer per-file deadline (default 300)
#
# ── ⛔ THE WALL, AND WHY A WHOLE-PACKAGE RUN CANNOT CLEAR IT ─────────────────
#
# `loft test` applies a **300-second deadline to the whole `run-interpret` phase**,
# not to a test. `hex_editor` is 775 tests and exceeds it, so a full-package run
# ends:
#
#     [timeout] deadline reached after 300s (graceful): phase=run-interpret
#               fn=opening_none entry=test_an_embrasure_starts_where_its_niche_stops
#
# ⛔ **AND IT EXITS 0 WITH NO `test result:` LINE AT ALL.** Measured 2026-08-28: the
# run stopped in `tests/opening.loft`, which passes 21 of 21 in **4.3 seconds** when
# it is run on its own. Nothing was wrong with that file; it was simply where the
# clock ran out. So the package's own suite has not been runnable in one process for
# some time, and the failure mode is **silence** rather than a red line.
#
# This script runs **one file per process**, which is the whole fix: the deadline is
# per process, no file is anywhere near it, and the slowest file becomes the bound
# instead of the sum.
#
# ── ⚠ ABSENCE IS RED HERE, WHICH IS THE POINT ───────────────────────────────
#
# CLAUDE.md's standing warning: *a grep over a log is an instrument, and its default
# answer is "absent"* — and it names this exact trap, `test result: .*total` scoring
# four PASSING runs as "no result" because only the FAILED line carries a total.
# Both shapes are matched here:
#
#     test result: ok. 21 passed; 1 file
#     test result: FAILED. 1 failed; 10 passed; 11 total; 1 file
#
# and **a file that produces neither is a FAILURE**, reported as `NO RESULT`, never
# skipped and never counted green. A timeout is the case that produces neither, so
# treating absence as anything but red would rebuild the very wall this exists for.
#
# ── ✅ WHAT `make lib-test` DOES *NOT* GET WRONG, CHECKED BEFORE IT WAS CLAIMED ──
#
# ⚠ **THIS COMMENT FIRST SAID `lib-test` SWALLOWS FAILURES, AND THAT WAS FALSE.**
# The reasoning looked solid — it runs `loft test … | tee … | grep -viE '^  Warning'`
# and tests the pipeline with `||`, so the status should be grep's. Measured with a
# planted failing assertion: **exit 2, `FAILED: hex_cam (interpreter)`.** The Makefile
# sets `SHELL := /bin/bash` and `.SHELLFLAGS := -o pipefail -c` at line 6, with a
# comment naming that exact trap. Planted a timeout too: **also exit 2.**
#
# So `lib-test` is not blind, and the difference this script makes is narrower and
# worth stating exactly: **`lib-test` reports the wall correctly and cannot get past
# it.** `hex_editor` goes red there for a reason that is not a defect in the code, and
# a gate that can only ever be red is a gate nobody can use. This runs the same tests
# in a shape that fits.
#
# ⚠ The general lesson is this tree's own: *a coherent explanation is a hypothesis.*
# Checking it cost one planted assertion and thirty seconds.
#
# ── ⚠ THE DEADLINE IS LOFT'S OWN, AND THAT IS A DELIBERATE CHOICE ────────────
#
# The first version wrapped each run in `timeout 400`. It worked, and it was the
# wrong instrument: an outer `timeout` sends a signal and the process dies with
# **nothing to say**, while loft's own deadline names the phase, the function, the
# file and the entry point —
#
#     [timeout] hard-kill after 300s+2s grace: phase=run-interpret
#               fn=t_5float_cos file=…/01_code.loft:449
#               entry=test_planted_slow_the_runner_must_call_no_result
#
# That line is the difference between *something took too long* and *this test, in
# this function, on this backend*. So the deadline is set with `--timeout`
# (`LOFT_TIMEOUT`) and there is **no outer kill at all**: every overrun, at any
# length, comes back as a diagnostic rather than as a corpse. `loft` hard-kills
# itself after its own grace period, so nothing is left running.
#
# ⚠ AND IT IS PER FILE, so raising it is cheap and safe: `SUITE_TIMEOUT` bounds one
# file rather than a package, which is exactly the property a whole-package run did
# not have.
set -u

JOBS=${SUITE_JOBS:-4}
NATIVE=${SUITE_NATIVE:-0}
DEADLINE=${SUITE_TIMEOUT:-300}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
# ⛔ **THE LOGS ARE KEPT, AND DELETING THEM COST A RERUN EVERY TIME.** This wrote each
# file's full output to a temp dir and then `rm -rf`'d it on exit, so a red summary named
# a failure whose detail no longer existed — the only way to read it was to run the whole
# suite again. Minutes, twice, for one line. They live under `.test-logs/suite/` now and
# are cleared at the START of a run, so what is on disk is always the last run and never a
# mixture of two.
OUT=$ROOT/.test-logs/suite
rm -rf "$OUT"
mkdir -p "$OUT" || exit 1

packages=""
if [ $# -gt 0 ]; then
  packages="$*"
else
  for d in "$ROOT"/lib/*/; do
    [ -d "$d/tests" ] || continue
    packages="$packages $(basename "$d")"
  done
fi

# One file, one process, one line of result. Written to a file rather than echoed so
# that parallel workers cannot interleave half a line into the report.
run_one() {
  pkg=$1; file=$2; mode=$3; slot=$4
  base=$(basename "$file")
  args=""; [ "$mode" = native ] && args="--native"
  log="$OUT/$pkg-$base-$mode.log"
  # ⚠ NO OUTER `timeout` — see the header. loft's own deadline is what reports.
  ( cd "$ROOT/lib/$pkg" && loft test --timeout "$DEADLINE" $args "tests/$base" ) > "$log" 2>&1
  rc=$?
  # ⚠ loft appends `[ran on the interpreter only — native not exercised: …]` to every
  # result line. It is the same 90 characters on every row and it is what turns a
  # failure block into something nobody reads; the mode is already a column here.
  line=$(grep -E '^test result:' "$log" | tail -1 | sed 's/  *\[ran on.*//')
  if [ -z "$line" ]; then
    # ⛔ The timeout case, and the one this script exists for. `rc` is often 0 here.
    why=$(grep -E '^\[timeout\]' "$log" | tail -1)
    [ -z "$why" ] && why="no 'test result:' line and no [timeout] — see $log"
    printf 'RED  %-12s %-24s %-6s NO RESULT — %s\n' "$pkg" "$base" "$mode" "$why" > "$OUT/r$slot"
    printf '%s\n' "$log" > "$OUT/l$slot"
    return
  fi
  case "$line" in
    *"result: ok."*)
      n=$(printf '%s' "$line" | sed -n 's/.*ok\. \([0-9]*\) passed.*/\1/p')
      printf 'ok   %-12s %-24s %-6s %s passed\n' "$pkg" "$base" "$mode" "${n:-?}" > "$OUT/r$slot" ;;
    *)
      printf 'RED  %-12s %-24s %-6s %s\n' "$pkg" "$base" "$mode" "$line" > "$OUT/r$slot"
      printf '%s\n' "$log" > "$OUT/l$slot" ;;
  esac
}

slot=0
running=0
for pkg in $packages; do
  [ -d "$ROOT/lib/$pkg/tests" ] || { echo "suite: lib/$pkg has no tests/"; exit 2; }
  for f in "$ROOT/lib/$pkg"/tests/*.loft; do
    [ -f "$f" ] || continue
    for mode in interpret $( [ "$NATIVE" = 1 ] && echo native ); do
      slot=$((slot + 1))
      run_one "$pkg" "$f" "$mode" "$slot" &
      running=$((running + 1))
      if [ "$running" -ge "$JOBS" ]; then wait; running=0; fi
    done
  done
done
wait

files=0; red=0; passed=0
for i in $(seq 1 "$slot"); do
  [ -f "$OUT/r$i" ] || { echo "RED  worker $i produced no row at all"; red=$((red + 1)); files=$((files+1)); continue; }
  cat "$OUT/r$i"
  files=$((files + 1))
  # ⚠ **A RED FILE'S PASSING TESTS COUNT TOO, AND THEY WERE BEING DROPPED.** Only `ok`
  # rows were totalled, so one planted failure in a 10-test file reported
  # `1 RED — 0 tests passed` while its own row said `1 failed; 9 passed`. A total that
  # disagrees with the rows above it is worse than no total.
  n=$(sed -n 's/.*[; ]\([0-9][0-9]*\) passed.*/\1/p' "$OUT/r$i")
  passed=$((passed + ${n:-0}))
  case "$(cat "$OUT/r$i")" in
    ok*) ;;
    *)   red=$((red + 1)) ;;
  esac
done

echo
# ⚠ THE FILE COUNT IS PART OF THE VERDICT. A run that found no files would otherwise
# print `0 red` and read exactly like a clean sweep.
if [ "$files" -eq 0 ]; then
  echo "suite: NO TEST FILES RAN — that is a failure, not a pass"
  exit 1
fi
if [ "$red" -eq 0 ]; then
  echo "suite: ✅ ALL GREEN — $files files, $passed tests passed"
  echo "suite: full output kept in .test-logs/suite/ (one log per file)"
  exit 0
fi

# ⛔ **THE DETAIL COMES OUT WITH THE VERDICT, NOT ON A SECOND RUN.** A summary that says
# only *3 red* sends the reader back through the whole suite to find out which assertion
# failed — which is the same wasted minutes twice, and it is exactly what happened before
# this block existed.
echo "suite: ⛔ $red RED of $files files — $passed tests passed"
echo
for i in $(seq 1 "$slot"); do
  [ -f "$OUT/l$i" ] || continue
  log=$(cat "$OUT/l$i")
  # `RED  hex_cam  clearance.loft  interpret  test result: FAILED. 1 failed; 9 passed; …`
  set -- $(cat "$OUT/r$i")
  printf '  %s %s (%s)  %s\n' "$2" "$3" "$4" \
    "$(sed -n 's/.*result: FAILED\. \(.*\); [0-9]* total.*/\1/p' "$OUT/r$i")"
  # ⚠ ONE LINE PER FAILING TEST — the name and what it said, nothing else. The full
  # output is on disk and named below; this block is for deciding WHERE to look.
  sed -n 's/^ *FAIL  tests\/[^:]*::\([a-z_0-9]*\)  *—  *\(.*\)/    \1\n      \2/p' \
    "$log" | head -12
  # ⚠ **THE TEST SOURCE, WITH A LINE.** The log says what happened; this says where to go.
  fn1=$(sed -n 's/^ *FAIL  tests\/[^:]*::\([a-z_0-9]*\).*/\1/p' "$log" | head -1)
  src="lib/$2/tests/$3"
  if [ -n "$fn1" ] && [ -f "$ROOT/$src" ]; then
    n1=$(grep -n "^fn $fn1(" "$ROOT/$src" | head -1 | cut -d: -f1)
    [ -n "$n1" ] && src="$src:$n1"
  fi
  printf '    %s\n' "$src"
  grep -E '^ *Error|^\[timeout\]' "$log" | head -3 | sed 's/^ */    /'
  printf '    log: %s\n\n' "${log#$ROOT/}"
done
exit 1
