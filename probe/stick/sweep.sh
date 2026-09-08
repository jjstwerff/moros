#!/bin/sh
# The sabotage sweep for `probe/stick` — the control first, and it stops the sweep.
cd "$(dirname "$0")/../.." || exit 1
mkdir -p probe/stick/out
echo "── control ──"
sh probe/stick/run.sh > probe/stick/out/sweep-control.txt 2>&1
if [ $? -ne 0 ]; then cat probe/stick/out/sweep-control.txt; echo "STICK SWEEP: the control is red"; exit 1; fi
grep '^STICK ' probe/stick/out/sweep-control.txt | grep -c ' ok ' | sed 's/^/   green rows: /'
for s in nopad noturn nolook; do
  echo "── $s ──"
  STICK_SABOTAGE=$s sh probe/stick/run.sh > "probe/stick/out/sweep-$s.txt" 2>&1
  rc=$?
  reds=$(grep '^STICK ' "probe/stick/out/sweep-$s.txt" | grep ' FAIL ' | awk '{print $2}' | tr '\n' ' ')
  if [ "$rc" -eq 0 ]; then echo "   ⚠ GREEN — this sabotage is not seen"; else echo "   red on: ${reds:-(the run died before a row)}"; fi
done
node tools/build-pages.mjs > /dev/null
