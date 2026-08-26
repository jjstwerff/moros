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
echo "G  aiming draws the spot, authors nothing, and says why when it names none"
ka=$(run_one probe/plan/aim.keys    b4aim)
ko=$(run_one probe/plan/aimoff.keys b4aimoff)
AIMSVG=worlds/b4aim-pick.svg
OFFSVG=worlds/b4aimoff-pick.svg

if [ "$ka" = "$kb" ]; then
  ok "an aim left the bare world untouched ($ka)"
else
  bad "aiming authored something: $ka against the bare $kb"
fi

# ⚠ THE RUNNER'S LINE IS COMPUTED FROM THE PICK; THE FOOTER IS WRITTEN INTO THE FILE.
# Comparing them is two paths, the same discipline row C uses.
said=$(grep -oE "^  aim L[0-9]+ \([-0-9]+,[-0-9]+\)" "$OUT/b4aim.log" | head -1 | sed 's/^  aim //')
drawn=$(grep -oE "aim L[0-9]+ \([-0-9]+,[-0-9]+\)" "$AIMSVG" 2>/dev/null | head -1 | sed 's/^aim //')
if [ -z "$said" ] || [ -z "$drawn" ]; then
  bad "the aim said '$said' and the picture says '$drawn' — one of them is missing, and \
a comparison of nothing passes silently"
elif [ "$said" = "$drawn" ]; then
  ok "the runner and the picture both name $said"
else
  bad "the runner says $said and the picture says $drawn"
fi

# ⚠ AND THE INSTRUMENT: the two pictures must actually differ, or "the footer says X"
# would be true of a file nothing wrote.
if grep -q "class='aimcell'" "$AIMSVG" 2>/dev/null; then
  ok "the aimed picture carries the highlight"
else
  bad "no highlight in $AIMSVG — the footer above could be about anything"
fi
if grep -q "class='aimcell'" "$OFFSVG" 2>/dev/null; then
  bad "the refused aim drew a highlight in $OFFSVG"
elif grep -q "aim refused (" "$OFFSVG" 2>/dev/null; then
  ok "the refused aim drew no highlight and its caption says why"
else
  bad "the refused aim's picture says neither — an absent highlight means *nothing was \
picked* and *that named no cell* at once"
fi
if [ "$ko" = "$kb" ]; then
  ok "…and it authored nothing either ($ko)"
else
  bad "a refused aim changed the world: $ko against $kb"
fi

echo ""
echo "H  two DECLARED wall types stand in one world, at their own two widths"
# ⚠ **THE ACCEPTANCE `B4e` NAMES, AND IT IS READ OUT OF THE PICTURE.** Not the runner's
# sentence — `wall laid 12 edges` says the same thing for either type — and not the
# store, which `lib/hex_editor/tests/wall_type.loft` already reads. What only the file
# can say is that the two walls were PAINTED differently, which is the whole point of a
# plan view: `declare edge <slot> …` says what an id means, `select wall <slot>` says
# which id the verb stamps, and the widths are what says the pair reached the world.
run_one probe/plan/walltype.keys b4etype >/dev/null
TWOSVG=worlds/b4etype-two.svg

# `mat=<byte> width=<stroke>` for every drawn edge, deduplicated — an edge is stored
# once and drawn once per owning cell, so the counts are not the subject here.
if [ -f "$TWOSVG" ]; then
  grep -oE "<line class='edge'[^/]*" "$TWOSVG" \
    | sed -E "s/.*data-mat='([0-9]+)'.*stroke='([^']*)' stroke-width='([^']*)'.*/\1 \2 \3/" \
    | sort -u > "$OUT/walltype.txt"
else
  : > "$OUT/walltype.txt"
fi

w5=$(awk '$1 == 5 { print $3 }' "$OUT/walltype.txt" | head -1)
w6=$(awk '$1 == 6 { print $3 }' "$OUT/walltype.txt" | head -1)
c5=$(awk '$1 == 5 { print $2 }' "$OUT/walltype.txt" | head -1)
c6=$(awk '$1 == 6 { print $2 }' "$OUT/walltype.txt" | head -1)

if [ -n "$w5" ] && [ -n "$w6" ]; then
  ok "both types are in the picture: slot 5 and slot 6"
else
  bad "the picture holds slot 5 '$w5' and slot 6 '$w6' — a selection that reached the \
sentence and not the world draws ONE type twice, and the runner's own line cannot see it"
fi

if [ "$w5" = "0.2" ] && [ "$w6" = "0.7" ]; then
  ok "painted 0.2 and 0.7 — each at the thickness its own declaration states"
else
  bad "painted '$w5' and '$w6' against the declared 0.2 and 0.7 — the picture is not \
resolving the id through the edge palette"
fi

# ⚠ AND NEITHER IS MAGENTA. A slot outside the numeric vocabulary used to draw as *I
# cannot explain this* however fully the palette explained it; `B4e` moved the
# loudness onto UNDECLARED, and this is the half of that pair the file can show.
if [ "$c5" = "rgb(230,0,190)" ] || [ "$c6" = "rgb(230,0,190)" ]; then
  bad "a DECLARED wall type drew in the unexplained-material magenta ($c5 / $c6)"
else
  ok "…and both drew as the walls they are, not as unexplained bytes"
fi

# The control: the SAME verb with nothing chosen must draw at the drawing's own width,
# or the two numbers above would be true of a picture that ignored the selection.
if [ "$w5" = "0.13" ] || [ "$w6" = "0.13" ]; then
  bad "one of the two is the drawing's own default width — the palette decided nothing"
else
  ok "neither is the drawing's own 0.13 default"
fi

echo ""
if [ "$BAD" -eq 0 ]; then
  echo "PLAN: green — the plan draws the person, shows what you aim at, authors it, and"
  echo "      stands two declared wall types side by side at their own two widths"
  exit 0
fi
echo "PLAN: $BAD FAILED"
exit 1
