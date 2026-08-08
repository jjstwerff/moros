#!/bin/sh
# `A8.3` / `A8.8` / `A8.9` — IS THE LEAF DRAWN, WHAT IS IT MADE OF, AND HAS THE
# DOORWAY A HEAD. See README.md.
#
# It began as a diagnosis — `A8.3`'s leaf is drawn, and it is drawn AS the wall —
# and is now the regression gate for the two fixes that followed: §P9.13 (a part
# says how tall its walls are and what they are made of) and §P9.14 (the opening is
# a wall with a hole in it, and the hole has a head).
#
#   probe/a83/leaf_visible/run.sh        # exit 0 = all eleven behaved as on 2026-08-08
#
# ⚠ THIS IS THE WIRE HALF ONLY, and that is deliberate rather than a gap: the eleven
# claims below are exact integers and need no browser. The PICTURE half is
# `leaf_field.keys` and `early_late.keys` beside this file, `tools/scripts/doorway.keys`
# is the acceptance shot, and `shots/a89-arch-{s,sw}.png` is the arch — ⚠ which a
# count CANNOT see, because a curved head and a flat one emit the same band per
# slice. That one is a picture claim and is marked as such below.
#
# ⚠ IT WRITES NOTHING INSIDE `data/parts/`. That directory is committed and this
# tree is worked by more than one agent, so each variant is a `mktemp -d` copy
# reached through `EDITOR_PARTS`.
set -eu

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PORT=${PROBE_PORT:-18097}
TMP=$(mktemp -d)
PID=""
fails=0

cleanup() {
  # Only ever the pid we started. This box runs other agents' work.
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    sleep 2
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  fi
  PID=""
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

say() { echo "  $1 $2"; [ "$1" = "FAIL" ] && fails=$((fails + 1)) || true; }

start() {   # start(parts_dir_or_empty)
  if [ -n "$1" ]; then
    EDITOR_PORT="$PORT" EDITOR_PARTS="$1" \
      nohup loft --interpret --lib lib/ src/editor_server.loft >"$TMP/editor.log" 2>&1 &
  else
    EDITOR_PORT="$PORT" \
      nohup loft --interpret --lib lib/ src/editor_server.loft >"$TMP/editor.log" 2>&1 &
  fi
  PID=$!
  i=0
  while [ "$i" -lt 90 ]; do
    grep -q 'listening on port' "$TMP/editor.log" 2>/dev/null && return 0
    kill -0 "$PID" 2>/dev/null || { echo "FAIL — the server exited"; tail -5 "$TMP/editor.log"; exit 1; }
    sleep 1
    i=$((i + 1))
  done
  echo "FAIL — SERVER NEVER LISTENED"; exit 1
}

stop() {
  [ -n "$PID" ] || return 0
  kill "$PID" 2>/dev/null || true
  sleep 2
  kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  PID=""
}

variant() {   # variant(name) -> a library in $TMP/<name>, built from a patched builder
  mkdir -p "$TMP/$1"
  cp -r data/parts/* "$TMP/$1/"
  python3 probe/a83/leaf_visible/variant.py "$TMP" "$1"
  PROP_OUT="$TMP/$1" loft --interpret --lib lib/ "$TMP/variant_build.loft" \
    >"$TMP/build-$1.log" 2>&1 \
    || { echo "FAIL — the '$1' library did not build"; tail -20 "$TMP/build-$1.log"; exit 1; }
}

cd "$ROOT"

echo "── the committed library ──"
start ""
node probe/a83/leaf_visible/panels.mjs  "$PORT" door/frame door/leaf door/hung door/gated \
  | tee "$TMP/panels.out"
node probe/a83/leaf_visible/limbwire.mjs "$PORT" door/hung door/leaf | tee "$TMP/wire.out"
node probe/a83/leaf_visible/limbwhere.mjs "$PORT" door/hung          | tee "$TMP/where.out"
stop

# 1. THE DOORWAY EDGE DRAWS — `A8.9`. Nine plain panels are 9 x 12 = 108, and the
#    doorway edge adds `OPEN_SUB` = 8 slices carrying a head band AND a skirt band
#    (its far neighbour is outside the part, so the ground steps): 8 x 24 = 192.
#    Before `A8.9` this was 108 and the opening had nothing at all over it.
grep -q '^door/frame .*0.55,0.52,0.46=300' "$TMP/panels.out" \
  && say PASS "door/frame is 300 — nine panels plus a doorway edge that draws its head" \
  || say FAIL "door/frame's wall is not 300 vertices — read panels.out"

# 2. AND IT SURVIVES COMPOSITION, which is where the first build failed. `door/hung`
#    INSTANCES the frame; expansion STAMPS its cells, and a stamped cell has no
#    owner left to ask — so the profile has to live on the world being DRAWN.
#    108 + 8 x 12 (head only: the paving is continuous here, so no skirt) = 204.
grep -q '^door/hung .*0.55,0.52,0.46=204' "$TMP/panels.out" \
  && say PASS "door/hung is 204 — the composed doorway has a head" \
  || say FAIL "the composed doorway lost its head — read panels.out"

# 3. TWO EDGES, BOTH CUT. `door/gated` opens both north edges of one cell: eight
#    plain panels (96) plus two doorway edges of 8 slices x 24 = 384.
#    ⚠ THE COUNT CANNOT SEE THE CURVE — a round head and a flat one emit the same
#    band per slice. This proves both edges are cut and subdivided; that the head is
#    an ARCH is `shots/a89-arch-{s,sw}.png` and `opening_cuts`' own tests.
grep -q '^door/gated .*0.55,0.52,0.46=312' "$TMP/panels.out" \
  && say PASS "door/gated is 312 — two doorway edges, subdivided" \
  || say FAIL "the gateway's two heads are not 312 vertices — read panels.out"

# 4. THE WHOLE LEAF IS TIMBER — `A8.8`'s fix. 30 = an 18-vertex plate and a
#    12-vertex panel, both in `floor`, and NOTHING in the wall surface.
grep -q '^door/leaf .*0.65,0.4,0.25=30' "$TMP/panels.out" \
  && say PASS "door/leaf is 30 vertices of timber" \
  || say FAIL "door/leaf is no longer entirely timber — read panels.out"
grep -q '^door/leaf .*0.55,0.52,0.46' "$TMP/panels.out" \
  && say FAIL "door/leaf still puts something in the WALL surface" \
  || say PASS "door/leaf puts nothing in the wall surface at all"

# 5. …and it reaches the composed doorway as a LIMB, in that colour.
grep -q 'id 8: colour (0.65,0.4,0.25)' "$TMP/where.out" \
  && say PASS "the leaf reaches door/hung's limb block as timber" \
  || say FAIL "the leaf's limb colour moved — read where.out"

# 6. THE ATTRIBUTION CONTROL — a part opened as the SUBJECT uses the chunk space,
#    not the limb block. Without it, "id 8 is populated" says nothing about which
#    part filled it.
grep -q '^door/leaf .*NONE' "$TMP/wire.out" \
  && say PASS "door/leaf opened as a subject puts NOTHING in the limb block" \
  || say FAIL "door/leaf filled the limb block — the probe cannot attribute what it sees"

echo
echo "── the cart is world dressing, and does not stand in a part ──"
start ""
node probe/a83/leaf_visible/held.mjs "$PORT" door/frame | tee "$TMP/cart.out"
stop

# 7/8. HIDDEN IN A PART, AND BACK IN THE WORLD — `A8.9b`, and BOTH halves matter.
#    Part open empties eight registries because *a part has no dressing of its own*;
#    the cart is the ninth. ⚠ The restore is the control: without it "hidden" is
#    satisfied by a server that never sends the cart at all, and the fault would be
#    a cart nobody ever sees again after the first `44:`.
#    ⚠ AND THE TEST IS BY ID, NOT BY COLOUR. The cart's brown sits next to the
#    figure's in chromaticity — which is exactly why it was read as part geometry
#    twice before anyone counted its wheels.
grep -q "under door/frame .*cart ids NONE" "$TMP/cart.out" \
  && say PASS "no cart stands in an open part" \
  || say FAIL "the cart is still drawn in part mode — read cart.out"
grep -q "back in the world .*cart ids 5,6,7" "$TMP/cart.out" \
  && say PASS "and it is back the moment the world is" \
  || say FAIL "the cart did not come back on close — read cart.out"

echo
echo "── a variant library: door/hung states NO opening profile ──"
variant no-open
start "$TMP/no-open"
node probe/a83/leaf_visible/panels.mjs "$PORT" door/hung | tee "$TMP/no-open.out"
stop

# 9. THE HEAD IS THE PROFILE'S DOING AND NOTHING ELSE'S. Take the `OPEN` section
#    away and the composed doorway drops from 204 straight back to 108 — the
#    pre-`A8.9` number, an opening running the full height of its wall. ⚠ Without
#    this, claim 2 is satisfied by any change that happened to add geometry.
grep -q '^door/hung .*0.55,0.52,0.46=108' "$TMP/no-open.out" \
  && say PASS "with no OPEN section the doorway is 108 again — full height, no head" \
  || say FAIL "a doorway with no profile is not 108 vertices — read no-open.out"

echo
echo "── a variant library: door/frame states up=6 surface=frame ──"
variant frame-wall
start "$TMP/frame-wall"
node probe/a83/leaf_visible/panels.mjs "$PORT" door/frame | tee "$TMP/frame-wall.out"
stop

# 10/11. THE SURFACE ROUTING IS WHOLESALE — `A8.8`. Every panel the frame draws moves to
#    dressed stone and none is left behind in the wall surface. ⚠ The COUNT moves too
#    and that is not a regression: `up=6` is below the `head=10` this frame carries,
#    so the head band is empty and only the skirt is drawn — the wall height and the
#    opening profile interacting exactly as §P9.13 and §P9.14 say they do.
grep -q '^door/frame .*0.78,0.74,0.65=' "$TMP/frame-wall.out" \
  && say PASS "the profiled frame draws its panels in 'frame'" \
  || say FAIL "the profiled frame is not drawing in dressed stone — read frame-wall.out"
grep -q '^door/frame .*0.55,0.52,0.46' "$TMP/frame-wall.out" \
  && say FAIL "the profiled frame still puts panels in the WALL surface" \
  || say PASS "nothing is left in the wall surface — the routing is wholesale"

echo
if [ "$fails" -eq 0 ]; then
  echo "all eleven behaved as on 2026-08-08"
  exit 0
fi
echo "$fails changed — read probe/a83/leaf_visible/README.md before assuming a regression"
exit 1
