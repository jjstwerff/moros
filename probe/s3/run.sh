#!/bin/sh
# RUN EVERY S3 PROBE AND SHOW WHAT THE GUARD DECIDED.
#
# ⚠ IT KNOWS NOTHING ABOUT ANY PROBE. Each one prints its own `PROBE PASS`/`PROBE FAIL`
# line, because a runner holding the pass conditions is a second place for them to drift
# from — and the probe is the only thing that knows what it measured.
set -u
cd "$(dirname "$0")/../.." || exit 1
fail=0
for p in probe/s3/*.loft; do
  name=$(basename "$p" .loft)
  out=$(loft --interpret --lib lib/ "$p" 2>/dev/null)
  # The map, when a probe drew one — this is the point of the tool, not a side effect.
  printf '%s' "$out" | grep -E '^   [#Xo.~ ]+$|ready\+correct|^  [a-z].*ready\+correct' 2>/dev/null
  verdict=$(printf '%s' "$out" | grep -E '^PROBE (PASS|FAIL)' | head -1)
  case "$verdict" in
    "PROBE PASS"*) printf 'PASS  %-22s %s\n' "$name" "$(printf '%s' "$verdict" | cut -c12-)" ;;
    "PROBE FAIL"*) printf 'FAIL  %-22s %s\n' "$name" "$(printf '%s' "$verdict" | cut -c12-)"; fail=1 ;;
    *) printf 'FAIL  %-22s (printed no verdict — a probe that cannot say is a probe that did not run)\n' "$name"; fail=1 ;;
  esac
done
exit $fail
