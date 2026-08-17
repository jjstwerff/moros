#!/bin/sh
# SABOTAGES FOR THE ROOF REGISTRY — the plan the gesture files, and what has to go red.
#
#   sh probe/k2/sabotage-roof.sh
#
# ⛔ **THE DEFECT THIS STEP CLOSES IS THE TREE'S COMMONEST ONE, ONE LAYER OVER.** The
# roof PLAN had exactly one writer and it sat at the SOCKET, five lines after the
# gesture returned — so `editor_run` and the page placed houses that entered no
# registry, and the registry is what `hex_mesh` draws a gable from. Measured on one
# house, meshed both ways: **189 vertices and 162 triangles** of per-cell hex staircase
# without a plan against **18 and 6** with it.
#
# ⚠ **AND THE ROWS ARE NOT INTERCHANGEABLE, WHICH IS THE POINT OF RUNNING THEM
# SEPARATELY.** `nofile` takes the whole registry away and reds almost everything —
# which is what a sabotage that trips every instrument always does, and it cannot tell
# you which instrument works. `feet` and `global` each move ONE number and each has
# exactly one row that can see it.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
SRC=lib/hex_editor/src/hex_editor.loft
OUT=probe/k2/out-sabotage-roof
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0
missed=0

# ⛔ **ONE TARGET PER RUN, AND THE FIRST VERSION OF THIS PASSED THREE.** `loft test`
# answers *"one target per run, but 3 were given"* and exits — so every row ran NOTHING
# and the sweep scored all five as *nothing went red*, which is the same sentence a
# feature that is not being tested produces. The vacuity guard below is what tells the
# two apart, and it is the reason `FILES` is a loop.
FILES='tests/roof_plan.loft tests/footprint.loft tests/press.loft'
NFILES=3

suites() {
  : > "$OUT/$1.log"
  for f in $FILES; do
    ( cd lib/hex_editor && $LOFT test "$f" ) >> "$OUT/$1.log" 2>&1
  done
}

row() {
  tag=$1; label=$2; want=$3
  suites "$tag"
  got=$(grep -c 'FAIL  tests/.*::' "$OUT/$tag.log")
  # ⛔ A SABOTAGE THAT DOES NOT BUILD IS NOT A SABOTAGE NOTHING NOTICED.
  if grep -q 'parse errors\|^error' "$OUT/$tag.log"; then
    printf '    FAIL %s → THE SABOTAGE DOES NOT BUILD, so this row asked nothing:\n' "$label"
    grep -m2 -E '^  Error|^error' "$OUT/$tag.log" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
  # ⛔ **AND A SUITE THAT NEVER RAN IS NOT A SUITE THAT PASSED.** Count the result
  # lines rather than trusting the absence of failures: one per file, every row.
  ran=$(grep -c '^test result:' "$OUT/$tag.log")
  if [ "$ran" != "$NFILES" ]; then
    printf '    FAIL %s → %s of %s suites produced a result line — this row asked nothing:\n' \
      "$label" "$ran" "$NFILES"
    grep -m2 -vE '^$|^ ' "$OUT/$tag.log" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
  if [ "$want" = "0" ]; then
    if [ "$got" = "0" ]; then
      printf '    ok   CONTROL — %s: nothing red\n' "$label"
    else
      printf '    FAIL CONTROL — %s: %s red, expected none\n' "$label" "$got"
      fails=$((fails + 1))
    fi
    return
  fi
  if [ "$got" -gt 0 ]; then
    printf '    ok   %s → %s red\n' "$label" "$got"
    grep 'FAIL  tests/.*::' "$OUT/$tag.log" \
      | sed 's/.*:://; s/  —  assertion failed: /\n             ↳ /' | sed 's/^/           /'
  else
    printf '    FAIL %s → NOTHING went red\n' "$label"
    fails=$((fails + 1)); missed=$((missed + 1))
  fi
}

# ⛔ RESTORE FROM A COPY, NEVER FROM `git checkout` — the subject of a sweep is the step
# just built, so it is uncommitted by definition, and a checkout between rows deletes it
# and scores every row as a miss.
cp "$SRC" "$OUT/hex_editor.loft.orig"
restore() { cp "$OUT/hex_editor.loft.orig" "$SRC"; }
trap restore EXIT INT TERM PIPE

printf -- '── the roof plan is the GESTURE'\''s ───────────────────────────────────\n'
# ⚠ **THE SUBJECT IS ASSERTED PRESENT BEFORE ROW 0.** A sweep over an absent feature
# answers *nothing went red* to every question, which is the sentence a useless test
# suite produces.
for line in \
  '  roofs.items += \[roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),' \
  'pub fn roof_eave_y(floor_h: integer, eave_up: integer, unit: float) -> float {' \
  '  eave = roof_eave_y(floor_h, eave_up, w.w_unit);' \
  ; do
  if ! grep -q "$line" "$SRC"; then
    printf '    FAIL the subject is ABSENT — no line matching:\n           %s\n' "$line"
    printf '    (a sweep over an absent feature says nothing went red to every row)\n'
    exit 1
  fi
done
printf '    ok   the subject is present — 3 lines named\n'

row control 'the tree as it stands' 0

# 1 — the registry loses its writer again: the state before this step.
restore
sed -i 's|^  roofs.items += \[roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),$|  if false { roofs.items += [roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),|' "$SRC"
sed -i 's|^                               ROOF_PITCH_DEFAULT)\];$|                               ROOF_PITCH_DEFAULT)]; }|' "$SRC"
row nofile 'nofile — the gesture files nothing, as before this step' 1

# 2 — filed off the AUTHOR'S FEET rather than the seated floor. Invisible on flat
#     ground, which is every fixture that existed before `roof_plan.loft`.
restore
sed -i 's|roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit)|roof_eave_y(grade, ROOF_EAVE_UP, w.w_unit)|' "$SRC"
row feet 'feet — the eave off the feet, not the seat (needs a SLOPE to see)' 1

# 3 — the global standing in for the world, which is what the socket did. Invisible on
#     the landscape, where the two are both 0.25.
restore
sed -i 's|roofs.items += \[roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),|roofs.items += [roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, 0.25),|' "$SRC"
row global 'global — the eave at a fixed 0.25 (needs a PART world to see)' 1

# 4 — the plan filed twice for one house: a registry that grows faster than the scene.
restore
sed -i 's|^  rf = roof_over(w, f, cells, seat, ROOF_EAVE_UP, ROOF_PITCH_DEFAULT, 0);$|  roofs.items += [roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit), ROOF_PITCH_DEFAULT)];\n  rf = roof_over(w, f, cells, seat, ROOF_EAVE_UP, ROOF_PITCH_DEFAULT, 0);|' "$SRC"
# ⚠ **THIS ROW WAS LABELLED `early` AND THAT LABEL WAS A LIE, WHICH RUNNING IT IS WHAT
# SAID.** It adds a second append rather than moving the first, so what goes red is the
# COUNT — one house, two plans — and not the ordering it claimed to test. Renamed to
# what it measures. `probe/k3d`'s rule: a row's name is part of its result.
row twice 'twice — one house files two plans' 1

# 5 — a slot rather than a registry: the second house replaces the first.
restore
sed -i 's|^  roofs.items += \[roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),$|  roofs.items = [roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),|' "$SRC"
row slot 'slot — the registry keeps one plan, so a second house replaces the first' 1

# 6 — ⛔ **A DECLARED BLIND SPOT, AND IT MUST STAY GREEN.** Move the append ABOVE the
#     roof's own refusal check, so a house whose walls stand and whose roof was refused
#     files a gable over open walls. Nothing here can see it: the only refusal any
#     fixture produces is the un-mitred facing, which returns at `!f.fp_ok` long before
#     `roof_over` is reached, and no fixture makes `world_merge_band_as` refuse a band.
#     ⚠ This row exists so the gap is a printed fact rather than an absence — it is
#     `probe/k3d`'s `blindcam` shape, a sabotage required to pass.
restore
sed -i 's|^  roofs.items += \[roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),$|  if false { roofs.items += [roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit),|' "$SRC"
sed -i 's|^                               ROOF_PITCH_DEFAULT)\];$|                               ROOF_PITCH_DEFAULT)]; }|' "$SRC"
sed -i 's|^  if !rf.ak_ok { return ack_no("the walls stand but the roof was refused: {rf.ak_why}"); }$|  roofs.items += [roof_plan_of(f, roof_eave_y(seat, ROOF_EAVE_UP, w.w_unit), ROOF_PITCH_DEFAULT)];\n  if !rf.ak_ok { return ack_no("the walls stand but the roof was refused: {rf.ak_why}"); }|' "$SRC"
row blindrefusal 'BLIND SPOT — filed above the roof refusal; no fixture refuses a roof' 0

restore
row restored 'the tree restored from the copy' 0

printf -- '───────────────────────────────────────────────────────────────────────\n'
if [ "$fails" -gt 0 ]; then
  printf 'sabotage-roof: %s row(s) wrong, %s of them a MISS\n' "$fails" "$missed"
  exit 1
fi
printf 'sabotage-roof: every row red on its own claim, both controls green\n'
