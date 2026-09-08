#!/bin/sh
# The sabotage sweep for `probe/b6` — the control first, then each row, and the
# real page restored at the end. ⚠ THE CONTROL COMES FIRST AND STOPS THE SWEEP:
# five reds over an absent feature read exactly like five catches.
cd "$(dirname "$0")/../.." || exit 1
mkdir -p probe/b6/out
echo "── control ──"
sh probe/b6/run.sh > probe/b6/out/sweep-control.txt 2>&1
if [ $? -ne 0 ]; then
  cat probe/b6/out/sweep-control.txt
  echo "B6 SWEEP: the control is red — nothing below could mean anything"; exit 1
fi
grep '^B6 ' probe/b6/out/sweep-control.txt | grep -c ' ok ' | sed 's/^/   green rows: /'
for s in noshow nopush nopoll notarget nofollow; do
  echo "── $s ──"
  B6_SABOTAGE=$s sh probe/b6/run.sh > "probe/b6/out/sweep-$s.txt" 2>&1
  rc=$?
  reds=$(grep '^B6 ' "probe/b6/out/sweep-$s.txt" | grep ' FAIL ' | awk '{print $2}' | tr '\n' ' ')
  if [ "$rc" -eq 0 ]; then echo "   ⚠ GREEN — this sabotage is not seen"; else echo "   red on: ${reds:-(the run died before a row)}"; fi
  grep -E 'B6 FAIL —|SABOTAGE' "probe/b6/out/sweep-$s.txt" | head -3 | sed 's/^/   /'
done
node tools/build-pages.mjs > /dev/null
