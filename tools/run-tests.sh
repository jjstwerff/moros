#!/bin/sh
# RUN EVERY PACKAGE'S TESTS IN PARALLEL, ONE JOB PER TEST FILE.
#
# WHY. `make lib-test` walks eleven packages one at a time on both backends and takes
# minutes; interpreted alone it is ~140 s. That is a pre-commit check, and it was also
# the only whole-tree check there was — so the thing you run after every step was the
# thing that takes minutes. The gates are worse and are not on this path at all.
#
# Test FILES are independent: measured, `loft test` over `hex_part` and the sum of its
# sixteen files run one at a time agree at 35-39 s, so there is no per-file penalty to
# pay for the parallelism. The whole tree is 113 files on 24 cores, and the floor is
# the slowest single file.
#
#   tools/run-tests.sh                  every package
#   tools/run-tests.sh hex_part hex_voxel     only these
#   TEST_JOBS=8 tools/run-tests.sh      fewer jobs, for a loaded box
#   TEST_VERBOSE=1 tools/run-tests.sh   per-file seconds, for profiling
#   TEST_NATIVE=1 tools/run-tests.sh    the OTHER backend, per file
#
# ⚠ THE INTERPRETER BY DEFAULT, DELIBERATELY. `make lib-test` is what runs both backends
# in one command, and it stays the pre-commit gate — the two are two implementations of one language
# and a per-backend green says nothing about the other (loft#760 took `hex_voxel` from
# 114 green to 96 failed while `--native` passed all 114 on the same source). This is
# the fast loop, not the proof.
#
# ⚠ SILENT WHEN GREEN, which is `run-gates.sh`'s rule and loft's own Goal F: a tool
# that reports its good health teaches the reader to skip the line where it eventually
# reports the opposite.
set -u

self=$0
# ⛔ **EVERY FILE'S FULL OUTPUT IS KEPT, BECAUSE `tail -12` IS NOT THE FAILURE.** This
# printed the LAST twelve lines of a red run, which is loft's coverage dump — the
# `FAIL …::` lines sit above it — so a red gate showed a list of uncovered functions and
# the only way to see which assertion failed was to run the whole tier again. Minutes,
# twice, for one line. The logs live here and the block below names the failing tests.
LOGDIR=${LOGDIR:-$PWD/.test-logs/fast}

if [ "${1:-}" = "--one" ]; then
  f=$2
  pkg=$(echo "$f" | cut -d/ -f2)
  rel=${f#lib/"$pkg"/}
  name="$pkg/$(basename "$f" .loft)"
  start=$(date +%s%N)
  # ⚠ RUN FROM THE PACKAGE DIRECTORY, as `loft test` does. `loft test` resolves a
  # relative path from the TEST FILE's directory, but a fixture written by a test goes
  # to the process's cwd — so a file that passes under `loft test` and fails here would
  # be a difference in the harness rather than in the code.
  # ⚠ **`TEST_NATIVE=1` RUNS THE OTHER BACKEND, PER FILE — plan 26 `B4n`.** `make
  # lib-test` is the pre-push proof and the only thing that runs `--native`, and it
  # calls `loft test` once per PACKAGE: one process, one 300-second deadline. On
  # 2026-08-27 `hex_editor` outgrew it — 59 files, 733 tests, `octagon.loft` alone 117 s
  # — and the run answers `[timeout] deadline reached after 300s (graceful)`, which
  # `make` catches but which a bare `loft test` reports by **printing no result line and
  # exiting 0**. Per file the budget is per file, and the wall clock is the slowest
  # single file rather than the sum.
  if [ -n "${TEST_NATIVE:-}" ]; then
    out=$(cd "lib/$pkg" && loft --lib ../ --tests "$rel" --native 2>&1)
  else
    out=$(cd "lib/$pkg" && loft --lib ../ --tests "$rel" 2>&1)
  fi
  rc=$?
  end=$(date +%s%N)
  secs=$(( (end - start) / 100000000 ))

  # ⚠ THE VERDICT COMES FROM THE RESULT LINE, NOT ONLY FROM `$?`. `run-gates.sh` learnt
  # this the hard way in the other direction — a gate that printed FAIL and exited 0.
  # Both are read here, and either one saying no is a failure.
  verdict=PASS
  [ "$rc" -eq 0 ] || verdict=FAIL
  case "$out" in *'FAILED'*|*'test result: FAILED'*) verdict=FAIL ;; esac
  # ⚠ A FILE THAT REPORTS NO RESULT AT ALL IS A FAILURE, not a pass. A compile error
  # prints diagnostics and never reaches a `test result:` line, and treating a missing
  # line as green is how a package that will not build reports as healthy.
  case "$out" in *'test result:'*) ;; *) verdict=FAIL ;; esac

  if [ "$verdict" != PASS ] || [ -n "${TEST_VERBOSE:-}" ]; then
    printf '%-4s %-28s %3d.%ds  %s\n' "$verdict" "$name" "$((secs / 10))" "$((secs % 10))" \
           "$(printf '%s' "$out" | grep -E 'test result:' | head -1 \
              | sed 's/  *\[ran on.*//' | cut -c1-64)"
  fi
  if [ "$verdict" != PASS ]; then
    # ⚠ **THE DETAIL GOES TO A FILE AND THE TERMINAL GETS A REPORT.** Sixteen workers
    # printing their own failure blocks interleave into something nobody can read, and
    # the interesting question during a long run is *how many and which*, not the text
    # of every assertion. Each worker leaves its full output and one machine-readable
    # row; the parent sorts them and prints the offenders.
    log="$LOGDIR/$(echo "$name" | tr / -).log"
    printf '%s\n' "$out" > "$log"
    nf=$(printf '%s' "$out" | sed -n 's/.*result: FAILED\. \([0-9]*\) failed.*/\1/p' | head -1)
    np=$(printf '%s' "$out" | sed -n 's/.*result: FAILED\..*; \([0-9]*\) passed.*/\1/p' | head -1)
    fname=$(printf '%s\n' "$out" \
      | sed -n 's/^ *FAIL  tests\/[^:]*::\([a-z_0-9]*\).*/\1/p' | head -1)
    first=$(printf '%s\n' "$out" \
      | sed -n 's/^ *FAIL  tests\/[^:]*::\([a-z_0-9]*\)  *—  *\(.*\)/\1: \2/p' | head -1)
    # ⚠ **THE TEST SOURCE, WITH A LINE — that is the path somebody actually opens.** The
    # log says what happened; this says where to go and fix it. loft's `FAIL` line names
    # the function and not its line, so the line comes from the file itself.
    src="$f"
    if [ -n "$fname" ]; then
      ln=$(grep -n "^fn $fname(" "$f" 2>/dev/null | head -1 | cut -d: -f1)
      [ -n "$ln" ] && src="$f:$ln"
    fi
    [ -n "$first" ] || first=$(printf '%s\n' "$out" \
      | grep -E '^ *Error|^\[timeout\]|^error' | head -1 | sed 's/^ *//')
    [ -n "$first" ] || first="no test result line at all — see the log"
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "${nf:-1}" "${np:-0}" "$name" "${log#$PWD/}" "$src" "$first" \
      > "$LOGDIR/rows/$(echo "$name" | tr / -)"
  fi
  [ "$verdict" = PASS ] || exit 1
  exit 0
fi

jobs=${TEST_JOBS:-16}

# Named packages, or all of them.
if [ "$#" -gt 0 ]; then
  set -- $(for p in "$@"; do ls lib/"$p"/tests/*.loft 2>/dev/null; done)
else
  set -- $(ls lib/*/tests/*.loft 2>/dev/null)
fi
[ "$#" -gt 0 ] || { echo "no test files found"; exit 2; }

n=$#
# ⚠ CLEARED AT THE START, so what is on disk is always the last run and never a mixture.
rm -rf "$LOGDIR"
mkdir -p "$LOGDIR/rows" || exit 2
start=$(date +%s%N)
printf '%s\n' "$@" | xargs -P "$jobs" -n1 sh -c 'exec "$0" --one "$1"' "$self"
rc=$?
end=$(date +%s%N)
printf '%d test files, %d.%ds wall at %s jobs\n' \
  "$n" "$(( (end - start) / 1000000000 ))" "$(( ((end - start) / 100000000) % 10 ))" "$jobs"

nred=$(ls "$LOGDIR/rows" 2>/dev/null | wc -l | tr -d ' ')
if [ "$nred" -eq 0 ]; then
  [ "$rc" -eq 0 ] && { echo "tests: ✅ ALL GREEN — $n files"; exit 0; }
  echo "tests: ⛔ a worker failed without leaving a row — see $rc above"
  exit "$rc"
fi

# ⛔ **THE REPORT IS THE POINT: how many, and which are worst.** Sorted by failures, so
# the file to open first is the first line. Everything else is on disk.
echo
echo "tests: ⛔ $nred of $n files FAILED — full output in ${LOGDIR#$PWD/}/"
echo
cat "$LOGDIR"/rows/* | sort -rn -k1 | head -8 | while IFS="$(printf '\t')" read -r nf np name log src first; do
  printf '  %-28s %2s failed, %3s passed\n' "$name" "$nf" "$np"
  printf '      %s\n' "$first"
  printf '      %s\n' "$src"
  printf '      log: %s\n' "$log"
done
[ "$nred" -gt 8 ] && printf '  … and %d more (one row per file in %s/rows/)\n' \
  "$((nred - 8))" "${LOGDIR#$PWD/}"
exit 1
