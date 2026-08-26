#!/bin/sh
# `B3` — DOES THE PLAN DRAW THE PERSON THE TICK MOVED?
#
#   sh probe/plan/run.sh          (or `make probe-plan`)
#
# `editor_run`'s `plan` command emits the plan view at the current tick and prints the
# marker READ BACK OUT of the SVG. `feet` prints the walker. This compares them at
# three stations.
#
# ⚠ THE COMPARISON IS THE POINT AND SO IS ITS CONTROL. A `plan` line that re-printed
# `wk_x` would agree with `feet` for any drawing at all — including one that put the
# marker at the origin — so the runner parses the picture, and this probe checks that
# the three stations are not the same point before believing three agreements.
set -u
cd "$(dirname "$0")/../.." || exit 1
OUT=probe/plan/out
rm -rf "$OUT"; mkdir -p "$OUT"
LOG="$OUT/run.log"
BAD=0

ok()  { echo "  ok   $*"; }
bad() { echo "  FAIL $*"; BAD=$((BAD + 1)); }

SCRIPT=probe/plan/plan.keys WORLD=b3plan ${LOFT:-loft} --lib lib/ src/editor_run.loft \
  > "$LOG" 2>&1
rc=$?
if [ "$rc" -ne 0 ]; then
  echo "PLAN: the run exited $rc — no comparison is possible:"
  grep -E '^error|editor_run:' "$LOG" | head -5
  exit 1
fi

# `  feet <y> at <x>,<z>` and `  plan <file> author <x>,<z>`, in script order.
grep -oE '^  feet [-0-9.]+ at [-0-9.]+,[-0-9.]+' "$LOG" \
  | sed -E 's/.* at ([-0-9.]+),([-0-9.]+)/\1 \2/' > "$OUT/walker.txt"
grep -oE "^  plan [^ ]+ author [-0-9.]+,[-0-9.]+" "$LOG" \
  | sed -E 's/.* author ([-0-9.]+),([-0-9.]+)/\1 \2/' > "$OUT/drawn.txt"

nw=$(wc -l < "$OUT/walker.txt")
nd=$(wc -l < "$OUT/drawn.txt")

echo "A  the run produced stations to compare"
if [ "$nw" -eq 3 ] && [ "$nd" -eq 3 ]; then
  ok 'three feet lines and three plan lines'
else
  bad "$nw walker lines and $nd drawn lines — a comparison of nothing passes silently, \
so this row fails before the rows below can be believed"
  echo "PLAN: 1 FAILED"
  exit 1
fi

echo ""
echo "B  the stations are not all the same point — the control"
uniq_n=$(sort -u "$OUT/walker.txt" | wc -l)
if [ "$uniq_n" -ge 2 ]; then
  ok "$uniq_n distinct positions across the three stations"
else
  bad "every station is the same point, so a marker nailed to one place would pass C"
fi

echo ""
echo "C  the marker is where the walker is, station by station"
i=0
while [ "$i" -lt 3 ]; do
  i=$((i + 1))
  wl=$(sed -n "${i}p" "$OUT/walker.txt")
  dl=$(sed -n "${i}p" "$OUT/drawn.txt")
  verdict=$(echo "$wl $dl" | awk '{
    dx = $1 - $3; if (dx < 0) dx = -dx;
    dz = $2 - $4; if (dz < 0) dz = -dz;
    # `feet` rounds to 2 decimals and the picture carries 4, so the bar is that
    # rounding and not a tolerance chosen to make the row pass.
    if (dx <= 0.005 && dz <= 0.005) print "ok"; else printf "off by %.4f,%.4f", dx, dz;
  }')
  if [ "$verdict" = "ok" ]; then
    ok "station $i: walker ($wl) and marker ($dl) agree"
  else
    bad "station $i: walker ($wl) against marker ($dl) — $verdict"
  fi
done

echo ""
if [ "$BAD" -eq 0 ]; then
  echo "PLAN: green — the plan draws the person the tick moved"
  exit 0
fi
echo "PLAN: $BAD FAILED"
exit 1
