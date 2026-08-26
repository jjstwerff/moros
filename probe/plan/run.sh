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

run_one () {   # <script> <world> -> prints the world key
  SCRIPT="$1" WORLD="$2" ${LOFT:-loft} --lib lib/ src/editor_run.loft \
    > "$OUT/$2.log" 2>&1
  grep -oE "^editor_run: world [0-9]+:[0-9]+" "$OUT/$2.log" | sed 's/.* //'
}

echo ""
echo "D  a gesture from a picked spot leaves the world standing there would"
kp=$(run_one probe/plan/pick.keys   b4pick)
ks=$(run_one probe/plan/stand.keys  b4stand)
kg=$(run_one probe/plan/gutter.keys b4gutter)
kb=$(run_one probe/plan/bare.keys   b4bare)
if [ -z "$kp" ] || [ -z "$ks" ] || [ -z "$kb" ] || [ -z "$kg" ]; then
  bad "one of the four runs printed no world key — nothing below is a comparison"
elif [ "$kp" = "$ks" ]; then
  ok "picked and stood-on both key $kp"
else
  bad "picked $kp against stood-on $ks — the plan authors something else than the editor"
fi

# ⚠ THE CONTROL THAT MAKES D MEAN SOMETHING: the fence has to CHANGE the world, or
# two runs that authored nothing would agree perfectly.
if [ "$kp" != "$kb" ]; then
  ok "…and the fence moved the world off the bare key ($kb)"
else
  bad "the picked fence left the world identical to no fence at all — D compares two \
worlds that were never authored in"
fi

echo ""
echo "E  a pick is a TARGET, not a teleport"
f1=$(grep -oE "^  feet [-0-9.]+ at [-0-9.]+,[-0-9.]+" "$OUT/b4pick.log" | head -1)
f2=$(grep -oE "^  feet [-0-9.]+ at [-0-9.]+,[-0-9.]+" "$OUT/b4pick.log" | tail -1)
if [ -n "$f1" ] && [ "$f1" = "$f2" ]; then
  ok "the walker is where it was: $f1"
else
  bad "the walker moved across a pick: '$f1' then '$f2' — clicking a plan to hang a \
door must not walk the person across the room"
fi

echo ""
echo "F  a pick that lands on no panel authors nothing"
if [ "$kg" = "$kb" ]; then
  ok "a pick off the page left the bare world untouched ($kg)"
else
  bad "a refused pick still changed the world: $kg against $kb"
fi

echo ""
if [ "$BAD" -eq 0 ]; then
  echo "PLAN: green — the plan draws the person the tick moved, and authors where you point"
  exit 0
fi
echo "PLAN: $BAD FAILED"
exit 1
