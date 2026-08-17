#!/bin/sh
# SABOTAGES FOR THE DERIVED MODE — plan 22 `D1`.
#
#   sh probe/k2/sabotage-mode.sh
#
# ⚠ **THE ROW THE STEP WAS WRITTEN WITH CANNOT FAIL, AND THAT IS WHY THIS EXISTS.**
# The phase table asks for *the derived mode never contradicts `shelter_at`* — and
# [EDITING_MODES](../../doc/claude/EDITING_MODES.md)' own rule is **do not add a second
# enclosure test**, so `mode_at` reads `shelter_at` and the contradiction is unreachable
# by construction. Every row below is about the half that verify never named: **WHICH of
# the two sheltered modes**, and where the datum is taken.
#
# ⚠ **TWO SUBJECTS, TWO INSTRUMENTS.** The derivation is `lib/hex_editor`'s and its rows
# are loft tests; the LOG is `src/editor_run.loft`'s and no loft test can see it, so its
# two rows run `probe/k3d` — the committed record of every indented line of every live
# script — against the corpus. A sweep that only ran the suites would have said nothing
# about whether the thing is called at all, which is this tree's commonest defect.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
SRC=lib/hex_editor/src/hex_editor.loft
RUN=src/editor_run.loft
OUT=probe/k2/out-sabotage-mode
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0
missed=0
NCORPUS=$(ls tools/scripts/*.keys | wc -l | tr -d ' ')

# ⛔ ONE TARGET PER `loft test` RUN — `sabotage-roof` scored all five rows as *nothing
# went red* by passing three, so the suites are a loop and the result lines are counted.
FILES='tests/mode.loft tests/shelter.loft'
NFILES=2

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
  if grep -q 'parse errors\|^error' "$OUT/$tag.log"; then
    printf '    FAIL %s → THE SABOTAGE DOES NOT BUILD, so this row asked nothing:\n' "$label"
    grep -m2 -E '^  Error|^error' "$OUT/$tag.log" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
  ran=$(grep -c '^test result:' "$OUT/$tag.log")
  if [ "$ran" != "$NFILES" ]; then
    printf '    FAIL %s → %s of %s suites produced a result line — this row asked nothing\n' \
      "$label" "$ran" "$NFILES"
    fails=$((fails + 1)); return
  fi
  if [ "$want" = "0" ]; then
    if [ "$got" = "0" ]; then
      printf '    ok   CONTROL — %s: nothing red\n' "$label"
    else
      printf '    FAIL CONTROL — %s: %s red, expected none\n' "$label" "$got"
      grep 'FAIL  tests/.*::' "$OUT/$tag.log" | sed 's/.*:://; s/^/           /'
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

# The LOG's instrument: the corpus record, which is the only thing that can see it.
#
# ⛔ **THE BUILD GUARD IS NOT BOILERPLATE HERE — THE FIRST VERSION OF THE `notick` ROW
# TRIPPED IT.** Deleting the call left `last: &integer` unused, which loft REFUSES, so
# `editor_run` did not compile and all thirty records moved by tens of lines each. The
# sweep scored that as a perfect catch. A sabotage that does not build is not a sabotage
# everything noticed — and over a corpus instrument it reads like the strongest possible
# result, which is the opposite of what `sabotage-roof`'s equivalent guard is for.
corpus() {
  tag=$1; label=$2; want=$3
  if ! GROUND=0 SCRIPT=tools/scripts/hut.keys WORLD=sabmode-build \
       $LOFT --lib lib/ src/editor_run.loft > "$OUT/$tag.build" 2>&1; then
    printf '    FAIL %s → THE SABOTAGE DOES NOT BUILD, so this row asked nothing:\n' "$label"
    grep -m2 '^error' "$OUT/$tag.build" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
  sh probe/k3d/run.sh > "$OUT/$tag.k3d" 2>&1
  # ⚠ THE SCRIPT ROWS ONLY. `probe/k3d` also prints `the groups moved` and a `C2 the
  # world moved too` line, and counting those made one row report **32 of 30**.
  moved=$(grep -cE '^  FAIL [a-z_]+ moved — [0-9]+ line' "$OUT/$tag.k3d")
  if [ "$want" = "0" ]; then
    if [ "$moved" = "0" ]; then
      printf '    ok   CONTROL — %s: 0 of %s records moved\n' "$label" "$NCORPUS"
    else
      printf '    FAIL CONTROL — %s: %s record(s) moved, expected none\n' "$label" "$moved"
      fails=$((fails + 1))
    fi
    return
  fi
  if [ "$moved" -gt 0 ]; then
    printf '    ok   %s → %s of %s records moved\n' "$label" "$moved" "$NCORPUS"
    grep '^  FAIL .* moved' "$OUT/$tag.k3d" | sed 's/^  FAIL /           /'
  else
    printf '    FAIL %s → NO record moved\n' "$label"
    fails=$((fails + 1)); missed=$((missed + 1))
  fi
}

# ⛔ RESTORE FROM COPIES, NEVER FROM `git checkout` — the subject is uncommitted by
# definition and a checkout between rows deletes it, scoring every row as a miss.
cp "$SRC" "$OUT/hex_editor.loft.orig"
cp "$RUN" "$OUT/editor_run.loft.orig"
restore() { cp "$OUT/hex_editor.loft.orig" "$SRC"; cp "$OUT/editor_run.loft.orig" "$RUN"; }
trap restore EXIT INT TERM PIPE

# ⛔ **DID THE SABOTAGE APPLY AT ALL?** `K3e`'s finding, and this sweep reproduced it
# within the hour: a `sed` whose delimiter collides with the line's own `||` fails, the
# file is untouched, and the row reports *nothing went red* — indistinguishable from a
# claim nothing tests. Every row that edits a file says so before it is scored.
applied_in() {   # applied_in <file> <tag>
  if diff -q "$OUT/$(basename "$1").orig" "$1" > /dev/null 2>&1; then
    printf '    FAIL %s → THE SABOTAGE DID NOT APPLY — %s is unchanged\n' "$2" "$1"
    fails=$((fails + 1)); return 1
  fi
  return 0
}
applied() { applied_in "$SRC" "$1"; }

# ⚠ THE SUBJECT IS ASSERTED PRESENT BEFORE ROW 0 — a sweep over an absent feature
# answers *nothing went red* to every question.
for line in \
  '          fab = ground_kind_at(w, q, r, c.h_material as integer ?? 0).tr_fabric;' \
  '                 walk_h(mq, mr, w, a.au_y / w.w_unit ?? 0.0), w.w_unit);' \
  '  if s.sh_fabric { return MODE_INSIDE; }' \
  ; do
  if ! grep -qF "$line" "$SRC"; then
    printf '    FAIL the subject is ABSENT in %s — no line matching:\n           %s\n' "$SRC" "$line"
    exit 1
  fi
done
for line in \
  '    say_mode(w, wk, sess, last);' \
  '    say_mode(w, wk, sess, mode_last);' \
  ; do
  if ! grep -qF "$line" "$RUN"; then
    printf '    FAIL the subject is ABSENT in %s — no line matching:\n           %s\n' "$RUN" "$line"
    exit 1
  fi
done
printf '    ok   the subject is present — 3 lines in the library, 2 in the runner\n'

printf -- '── the derivation ─────────────────────────────────────────────────────\n'
row control 'the tree as it stands' 0

# 1 — every cover is built: the version that cannot tell a tunnel from a room.
restore
sed -i 's|          fab = ground_kind_at(w, q, r, c.h_material as integer ?? 0).tr_fabric;|          fab = true;|' "$SRC"
applied allfabric
row allfabric 'allfabric — rock counts as a ceiling' 1

# 2 — no cell is ever built: the cellar under a house becomes a hole in the ground.
restore
sed -i 's|          fab = ground_kind_at(w, q, r, c.h_material as integer ?? 0).tr_fabric;|          fab = false;|' "$SRC"
applied allrock
row allrock 'allrock — a floor overhead counts as earth' 1

# 3 — a roof PLAN stops being fabric. ⚠ The narrower half of row 2: a house's own
#     roof writes `ROOF_MAT` cells over the same columns its plan covers, so this
#     asks whether the plan half of the sweep is doing anything by itself.
restore
# ⚠ **THE DELIMITER IS `@` BECAUSE THE LINE CONTAINS `||`, AND `K3e` HAD ALREADY
#    WRITTEN THAT DOWN.** With `s|…|…|` the shell's own `||` closes the expression and
#    sed answers *unknown option to `s'* — which this sweep then scored as *nothing went
#    red*, a MISS wearing a clean result. The apply guard below is the other half.
sed -i 's@        if best < 0 || h - eye_units < best { best = h - eye_units; fab = true; }@        if best < 0 || h - eye_units < best { best = h - eye_units; fab = false; }@' "$SRC"
applied planrock
row planrock 'planrock — a filed roof plan is not fabric' 1

# 4 — the OUTERMOST cover wins instead of the innermost: the rule that makes *a house
#     in a cave switches to houses again* fall out for free, reversed.
restore
sed -i 's@        if best < 0 || ch - eye_units < best {@        if best < 0 || ch - eye_units > best {@' "$SRC"
applied outermost
row outermost 'outermost — the farthest cover decides, not the nearest' 1

# 5 — the datum goes back to the raw feet. ⛔ THIS ONE WAS REAL: the first version of
#     the step did exactly this, and `profiles.keys` reported `mode underground` for an
#     author standing on a hillside in the open air.
restore
sed -i 's|                 walk_h(mq, mr, w, a.au_y / w.w_unit ?? 0.0), w.w_unit);|                 (a.au_y / w.w_unit ?? 0.0) as integer, w.w_unit);|' "$SRC"
applied feetnotsurface
row feetnotsurface 'feetnotsurface — the interpolated feet, so your own ground is cover' 1

# 6 — ⛔ **A DECLARED BLIND SPOT, AND IT MUST STAY GREEN.** `shelter_room` drops the
#     new field on its way through, so the SERVER's camera would hold a `Shelter` whose
#     cover kind is always false. Nothing in this package can see it: `shelter_room` has
#     one caller and it is `src/editor_server.loft`, and no consumer reads `sh_fabric`
#     yet — `D2` is the step that gives it one. The row exists so the gap is a printed
#     fact rather than an absence.
restore
sed -i 's|  Shelter { sh_inside: s.sh_inside, sh_head: s.sh_head, sh_fabric: s.sh_fabric,|  Shelter { sh_inside: s.sh_inside, sh_head: s.sh_head, sh_fabric: false,|' "$SRC"
applied blindroom
row blindroom 'BLIND SPOT — shelter_room drops the field; nothing reads it yet' 0

restore
row restored 'the tree restored from the copies' 0

printf -- '── the log, over the live corpus ──────────────────────────────────────\n'
# 7 — the per-LINE call goes: every crossing in this corpus is a teleport, so this is
#     the one that carries the whole signal today.
restore
sed -i 's|^    say_mode(w, wk, sess, mode_last);$|    if false { say_mode(w, wk, sess, mode_last); }|' "$RUN"
applied_in "$RUN" noline
corpus noline 'noline — the mode is not read after a script line' 1

# 8 — the per-TICK call goes. ⚠ **WHAT THIS ROW MEASURES IS WHETHER ANY LIVE SCRIPT
#     CROSSES A MODE BOUNDARY BY WALKING**, and the answer is printed rather than
#     assumed. A `0 record moved` here is not a bug in the log — it is a fact about the
#     corpus, and it is why this row's expectation is written where it is.
restore
# ⚠ `if false`, NOT A DELETION — see the build guard in `corpus`: removing the call
#    leaves the reference parameter unused and loft refuses the program.
sed -i 's|^    say_mode(w, wk, sess, last);$|    if false { say_mode(w, wk, sess, last); }|' "$RUN"
applied_in "$RUN" notick
# ⚠ **THE EXPECTATION IS 1 BECAUSE `tools/scripts/threshold.keys` EXISTS, AND IT EXISTS
#    BECAUSE THIS ROW MEASURED 0.** Before it, every mode crossing in the corpus was a
#    teleport and the tick call was correct, reachable and observed by nothing. The
#    script's header carries the finding; this row is what would say so again.
corpus notick 'notick — the mode is not read inside a tick' 1

restore
corpus corpus_restored 'the tree restored — the corpus records stand' 0

printf -- '───────────────────────────────────────────────────────────────────────\n'
if [ "$fails" -gt 0 ]; then
  printf 'sabotage-mode: %s row(s) wrong, %s of them a MISS\n' "$fails" "$missed"
  exit 1
fi
printf 'sabotage-mode: every row red on its own claim, every control green\n'
