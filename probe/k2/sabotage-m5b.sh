#!/bin/sh
# SIX SABOTAGES FOR `M5b` — the map on a disk, and what has to go red.
#
#   sh probe/k2/sabotage-m5b.sh
#
# ⛔ **THE CLAIM THIS STEP EXISTS FOR IS NOT THE OBVIOUS ONE, and the first version of
# its test was green for the wrong reason.** *A verb the editor GAINED keeps its key* is
# true of a whole-table file too — applying assigns per named verb and leaves an
# unmentioned one alone — so that row could not see the delta it was written to state.
# What only a delta gives is the other direction: **a verb the author never rebound
# follows the editor's default, including when that default MOVES.** Row 2 is that one.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
SRC=lib/hex_editor/src/keymap.loft
OUT=probe/k2/out-sabotage-m5b
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

suites() { ( cd lib/hex_editor && $LOFT test keymap ) > "$OUT/$1.log" 2>&1; }

row() {
  tag=$1; label=$2; want=$3
  suites "$tag"
  got=$(grep -c 'FAIL  tests/.*::' "$OUT/$tag.log")
  # ⛔ A SABOTAGE THAT DOES NOT BUILD IS NOT A SABOTAGE NOTHING NOTICED — `K3` · `B`.
  if grep -q 'parse errors' "$OUT/$tag.log"; then
    printf '    FAIL %s → THE SABOTAGE DOES NOT BUILD, so this row asked nothing:\n' "$label"
    grep -m2 '^  Error' "$OUT/$tag.log" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
  if [ "$(grep -c '^test result:' "$OUT/$tag.log")" != "1" ]; then
    printf '    FAIL %s → the suite produced %s result line(s) (see %s.log)\n' \
      "$label" "$(grep -c '^test result:' "$OUT/$tag.log")" "$tag"
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
    fails=$((fails + 1))
  fi
}

# ⛔ RESTORE FROM A COPY, NEVER FROM `git checkout` — the subject of a sweep is the step
# just built, so it is uncommitted by definition.
cp "$SRC" "$OUT/keymap.loft.orig"
restore() { cp "$OUT/keymap.loft.orig" "$SRC"; }
# ⛔ `PIPE` IS IN THAT LIST BECAUSE IT WAS NOT — see `sabotage-m4.sh`.
trap restore EXIT INT TERM PIPE

printf -- '── `M5b`: the map is a DELTA on a disk ────────────────────────────────\n'
# ⚠ **THE GUARD NAMES EVERY LINE THE ROWS BELOW PATCH**, because a sabotage that does
# not APPLY reads exactly like a sabotage nothing noticed.
for line in \
  'pub fn keymap_delta' \
  'pub fn keymap_apply' \
  'pub fn keymap_save' \
  'pub fn keymap_load' \
  '    if key_for(base, b.kb_verb) == b.kb_key { continue; }' \
  '    if b.kb_key == "" { out = out + "\\n" + b.kb_verb; }' \
  '  for b in m.km_items { next += \[b\]; }' \
  '    if n > 1 {' \
  '  if exists(path) { delete(path); }' \
  '  if f.format == Format.NotExists {'
do
  if ! grep -q -- "^$line" "$SRC"; then
    printf '    FAIL the subject is absent — %s has no line `%s`\n' "$SRC" "$line"; exit 1
  fi
done
printf '    ok   the subject is present: the four functions, the delta filter, the\n'
printf '         absence row, the base copy, the collision check, and both file guards\n'
row control "unsabotaged" 0

# 1 — THE ABSENCES ARE NOT RECORDED, so the document holds only the rows that still have
# a key. ⛔ Worked on paper before it was written: default `A=1 B=2 C=3`, bind `B` to
# `1`, then `B` to `3` — the map is `A="" B=3 C=""` and the only keyed non-default row is
# `B=3`, which replayed onto a default leaves `A` on a key its owner lost two gestures
# ago.
sed -i 's|^    if b.kb_key == "" { out = out + "\\n" + b.kb_verb; }$|    if b.kb_key == "" { }|' "$SRC"
row s1 "a verb left with no key is not written down" 1
restore

# 2 — THE DOCUMENT IS THE WHOLE TABLE. ⛔ **The row this step is actually for.** It is
# invisible to *a verb the editor gained keeps its key* — a whole table passes that too —
# and visible only where the EDITOR's own default has moved under a verb the author never
# touched, which the whole table pins to the layout of the day it was written.
sed -i 's|^    if key_for(base, b.kb_verb) == b.kb_key { continue; }$|    if false { continue; }|' "$SRC"
row s2 "the document is the whole table — the editor's new default is overwritten" 1
restore

# 3 — APPLYING REPLACES INSTEAD OF ASSIGNING: `next` starts empty, so every verb the
# document does not name is dropped from the map. Same symptom as row 2, different
# mistake — a verb that vanished from the bar rather than one on the wrong key.
sed -i 's|^  for b in m.km_items { next += \[b\]; }$|  // SABOTAGE: next starts empty|' "$SRC"
row s3 "applying replaces the map instead of assigning onto it" 1
restore

# 4 — NOTHING CHECKS FOR A COLLISION, so a hand-edited file can put two verbs on one key
# and every reader of the map that assumes one-row-per-verb is quietly wrong afterwards.
sed -i 's|^    if n > 1 {$|    if false {|' "$SRC"
row s4 "two verbs on one key are loaded without complaint" 1
restore

# 5 — THE VERSION LINE IS NOT CHECKED, so any text file at that path is read as a key
# map. ⚠ What is being refused is not a corrupt file but a file some OTHER program wrote.
perl -0pi -e 's/  if len\(lines\) == 0 \|\| \(lines\[0\] \?\? ""\)\.trim\(\) != KEYMAP_DOC \{\n(?:.*\n)*?  \}\n//' "$SRC"
row s5 "any text file at that path is read as a key map" 1
restore

# 6 — A SAVE APPENDS INSTEAD OF REPLACING. ⚠ `world_save_as` carries this exact scar, and
# a rebind is written on EVERY bind, so the second save is the normal case rather than an
# edge: the file ends up holding two documents and reads back only the first.
sed -i 's|^  if exists(path) { delete(path); }$|  // SABOTAGE: the save appends|' "$SRC"
row s6 "a second save appends a second document to the file" 1
restore

row control2 "unsabotaged, after every restore" 0

printf '\n'
if [ "$fails" = "0" ]; then
  printf 'sabotage-m5b PASS — 8 rows, 6 sabotages red on their own claim, 2 clean controls\n'
  exit 0
fi
printf 'sabotage-m5b FAIL — %s row(s); logs in %s\n' "$fails" "$OUT"
exit 1
