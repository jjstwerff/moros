#!/bin/sh
# SIX SABOTAGES FOR `M4` — the deletion of `verb_of`, and what still has to go red.
#
#   sh probe/k2/sabotage-m4.sh
#
# ⚠ **A DELETION IS THE ONE CHANGE A GREEN SUITE CANNOT VALIDATE**, because removing a
# subject makes its tests pass by removing the question. `V3` established the
# instrument — the **test-name diff**, with every retired claim named where it went —
# and this file is the other half: proof that the rows which SURVIVED the deletion can
# still fail. `M4` moved the key→verb definition from `verb_of`'s `if` chain to
# `keymap_default()`'s `bind_of` rows, so every row below patches the table.
#
# ⚠ **IT LIVES HERE RATHER THAN IN A DIRECTORY OF ITS OWN** because `row()`, the
# restore-from-a-copy rule and the two harness guards below were all paid for by the
# `K3` sweeps beside it, and a second copy of that harness is the duplication this plan
# spends its time removing.
#
# ⛔ **AND `M4` DISARMED FOUR OF THOSE SIBLINGS, IN TWO DIFFERENT WAYS.** All four sed
# `verb_of`'s chain, so all four became no-ops the moment it was deleted —
# `sabotage-x` and `sabotage-bc` said so loudly (their subject guard named the binding,
# so they exit *the subject is absent*), and `sabotage-e` and `sabotage-z` did not
# (their guards name `stair_ahead` and `session_hole_kind`, both still present, so the
# rows ran and reported *NOTHING went red*). **A subject guard only sees what it
# names.** All four are retargeted; measured before and after.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
ROOT=lib/hex_editor/src/hex_editor.loft
OUT=probe/k2/out-sabotage-m4
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

# ⚠ BOTH FILES, because `M4`'s claims are split across them: `verb.loft` holds the
# vocabulary and the families, `keymap.loft` holds the freed aliases and the table.
# A sweep over one would report the other's coverage as complete.
suites() { ( cd lib/hex_editor && $LOFT test verb; $LOFT test keymap ) > "$OUT/$1.log" 2>&1; }

row() {
  tag=$1; label=$2; want=$3
  suites "$tag"
  got=$(grep -c 'FAIL  tests/.*::' "$OUT/$tag.log")
  # ⛔ A SABOTAGE THAT DOES NOT BUILD IS NOT A SABOTAGE NOTHING NOTICED — `K3` · `B`.
  # `loft test` writes `FAIL  tests/verb.loft  (parse errors)` with no `::`, so the
  # count above is 0 and the row would print *NOTHING went red*, which is the sentence
  # a suite with a hole in it produces.
  if grep -q 'parse errors' "$OUT/$tag.log"; then
    printf '    FAIL %s → THE SABOTAGE DOES NOT BUILD, so this row asked nothing:\n' "$label"
    grep -m2 '^  Error' "$OUT/$tag.log" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
  # …and the positive control on the pattern: two result lines are expected, one per
  # suite. A run that produced fewer did not happen, and reads as "nothing went red".
  if [ "$(grep -c '^test result:' "$OUT/$tag.log")" != "2" ]; then
    printf '    FAIL %s → the two suites produced %s result line(s) (see %s.log)\n' \
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

# ⛔ RESTORE FROM A COPY, NEVER FROM `git checkout` — the subject of a sweep is the
# step just built, so it is uncommitted by definition and `git checkout` deletes it.
cp "$ROOT" "$OUT/hex_editor.loft.orig"
restore() { cp "$OUT/hex_editor.loft.orig" "$ROOT"; }
# ⛔ **`PIPE` IS IN THAT LIST BECAUSE IT WAS NOT, AND A SABOTAGED TREE SURVIVED THE RUN.**
# Piping this script through `head` closes the pipe mid-row; the shell dies on SIGPIPE,
# the EXIT trap never fires, and the working tree is left with the sabotage APPLIED —
# which the next `make lib-test` reports as a real failure in a step you thought was
# green. Measured on 2026-08-15 at `M4`: `hex_editor` came back 11 failed with a
# `bind_of("5", "tunnel")` still in the source.
trap restore EXIT INT TERM PIPE

printf '── `M4`: the chain is gone and the table has to carry it ──────────────\n'
# ⚠ **THE SUBJECT OF A DELETION IS AN ABSENCE, SO THE GUARD IS INVERTED.** Every row
# below asks *did this go red*, and a tree where `verb_of` had been restored would be
# answering a different question entirely — the two-body comparison is back and the
# rows would be measuring it. This is the one guard shape the siblings here do not
# have, because none of them removed anything.
if grep -q '^pub fn verb_of' "$ROOT"; then
  printf '    FAIL the subject is absent — `verb_of` is back in %s, so this sweep is\n' "$ROOT"
  printf '         measuring the two-body tree `M4` deleted\n'; exit 1
fi
if ! grep -q '^pub fn keymap_default' "$ROOT"; then
  printf '    FAIL the subject is absent — %s has no `keymap_default`\n' "$ROOT"; exit 1
fi
if ! grep -q '^fn the_vocabulary' lib/hex_editor/tests/verb.loft; then
  printf '    FAIL the subject is absent — verb.loft has no `the_vocabulary`\n'; exit 1
fi
printf '    ok   the subject is present: `verb_of` gone, `keymap_default` and\n'
printf '         `the_vocabulary()` standing, %s bindings in the table\n' \
  "$(grep -c '^    bind_of(' "$ROOT")"
row control "unsabotaged" 0

# 1 — A VERB WITH NO KEY, which is the case the retired row in `keymap.loft` claimed to
# catch and could not. It is *built and never called* one layer up: the gesture exists,
# compiles, is tested, and no keyboard can reach it.
sed -i '/^    bind_of("O", VB_OPENING),$/d' "$ROOT"
row s1 "the opening verb has no key at all — a gesture nobody can press" 1
restore

# 2 — A FREED ALIAS BOUND AGAIN. `S3` collapsed six opening keys onto one verb and `M1`
# made the table one row per verb; a second `opening` row is the key table growing with
# the CONTENT again, which is the tell that a selection has gone missing.
sed -i 's/^    bind_of("O", VB_OPENING),$/    bind_of("O", VB_OPENING),\n    bind_of("P", VB_OPENING),/' "$ROOT"
row s2 "P is bound to opening again — the collapse half undone" 1
restore

# 3 — A KEY BOUND TO A VERB THE EDITOR DOES NOT HAVE. This is the direction that keeps
# `the_vocabulary()` from going stale: a row added to the definition and not to the list
# draws a slot in the bar that nothing else in the tree has heard of.
sed -i 's/^    bind_of("C", VB_CELLAR),$/    bind_of("C", VB_CELLAR),\n    bind_of("5", "tunnel"),/' "$ROOT"
row s3 "the definition binds a verb that does not exist" 1
restore

# 4 — THE STAIR PAIR COLLAPSED. `K3` · `E`'s claim, moved onto the table at `M4`: two
# keys separated by a DIRECTION stay two verbs. ⚠ It goes red twice over — the pair row
# sees the names agree, and the vocabulary row sees `stair_down` lose its only key.
sed -i 's/^    bind_of("Q", VB_STAIR_DOWN),$/    bind_of("Q", VB_STAIR_UP),/' "$ROOT"
row s4 "Q names stair_up — a direction flattened into a selection" 1
restore

# 5 — THE SEAT FAMILY GIVEN A SECOND KEY. `K3` · `Y`+`T`'s claim, moved the same way:
# `T` was freed because the kind comes from the selection, and a table that binds it
# again has put the thing back in the key.
sed -i 's/^    bind_of("Y", VB_SEAT),$/    bind_of("Y", VB_SEAT),\n    bind_of("T", VB_SEAT),/' "$ROOT"
row s5 "T is bound to seat again — the kind is back in the key" 1
restore

# ⚠ THE CONTROL AT BOTH ENDS, because a restore that silently failed would make every
# row after it report the previous row's sabotage.
row control2 "unsabotaged, after every restore" 0

printf '\n'
if [ "$fails" = "0" ]; then
  printf 'sabotage-m4 PASS — 6 rows, 5 sabotages red on their own claim, 2 clean controls\n'
  exit 0
fi
printf 'sabotage-m4 FAIL — %s row(s); logs in %s\n' "$fails" "$OUT"
exit 1
