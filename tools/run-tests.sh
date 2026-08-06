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
#   tools/run-tests.sh hex_part hex_world     only these
#   TEST_JOBS=8 tools/run-tests.sh      fewer jobs, for a loaded box
#   TEST_VERBOSE=1 tools/run-tests.sh   per-file seconds, for profiling
#
# ⚠ THE INTERPRETER ONLY, DELIBERATELY. `make lib-test` is what runs both backends,
# and it stays the pre-commit gate — the two are two implementations of one language
# and a per-backend green says nothing about the other (loft#760 took `hex_world` from
# 114 green to 96 failed while `--native` passed all 114 on the same source). This is
# the fast loop, not the proof.
#
# ⚠ SILENT WHEN GREEN, which is `run-gates.sh`'s rule and loft's own Goal F: a tool
# that reports its good health teaches the reader to skip the line where it eventually
# reports the opposite.
set -u

self=$0

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
  out=$(cd "lib/$pkg" && loft --lib ../ --tests "$rel" 2>&1)
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
           "$(printf '%s' "$out" | grep -E 'test result:' | head -1 | cut -c1-60)"
  fi
  if [ "$verdict" != PASS ]; then
    printf '%s' "$out" | grep -vE '^ *Advice|^ *Warning|^warning|^ *\||^ *-->|^ *=|^advice|^note:' \
      | tail -12 | sed 's/^/     /'
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
start=$(date +%s%N)
printf '%s\n' "$@" | xargs -P "$jobs" -n1 sh -c 'exec "$0" --one "$1"' "$self"
rc=$?
end=$(date +%s%N)
printf '%d test files, %d.%ds wall at %s jobs\n' \
  "$n" "$(( (end - start) / 1000000000 ))" "$(( ((end - start) / 100000000) % 10 ))" "$jobs"
exit $rc
