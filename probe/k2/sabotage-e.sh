#!/bin/sh
# SEVEN SABOTAGES FOR `K3` · `E`, each aimed at ONE claim.
#
#   sh probe/k2/sabotage-e.sh
#
# A test that has never been seen red is a test about nothing, and this file is the
# record of WHICH instrument sees WHICH mistake. Row 0 is the CONTROL: the
# unsabotaged tree must report zero, because a broken harness reports the same zero
# a vacuous test does and would otherwise score every row below as a catch.
#
# ⚠ THE SCORER MATCHES A LINE THAT IS KNOWN TO BE THERE. loft prints one
# `FAIL  tests/<file>.loft::<test_name>  —  assertion failed: …` per failing test and
# one `FAIL  tests/<file>.loft  (n failed, m passed)` for the file — so the `::` is
# what separates the per-test lines from the per-file summary. A count of zero from a
# pattern nobody has seen match is not a result. (CLAUDE.md: *a grep over a log is an
# instrument, and its default answer is absent*.)
#
# ⚠ THE FIRST FOUR PATCH THE LIBRARY AND THE LAST THREE PATCH THE PROBE'S OWN INPUT,
# because the claims live in two places: what the gesture DOES is `lib/hex_editor`'s,
# and whether a script was TRANSCRIBED faithfully is `probe/k2`'s. A sweep over one of
# them would report the other's coverage as complete.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
SRC=lib/hex_editor/src/hex_editor.loft
KEYS=tools/scripts/determinism.keys
OUT=probe/k2/out-sabotage
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

verbs() { ( cd lib/hex_editor && $LOFT test verb 2>&1 ) > "$OUT/$1.log"; }

row() {
  tag=$1; label=$2; want=$3
  verbs "$tag"
  got=$(grep -c 'FAIL  tests/.*::' "$OUT/$tag.log")
  # The positive control on the pattern itself: a run that produced no result line at
  # all is a run that did not happen, and it reads as "nothing went red".
  if ! grep -q '^test result:' "$OUT/$tag.log"; then
    printf '    FAIL %s → the suite produced no result line (see %s.log)\n' "$label" "$tag"
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

# One converted script through a server, both spellings, scored on a named failure.
scripted() {
  label=$1; want=$2
  sh probe/k2/run.sh determinism > "$OUT/$3.log" 2>&1
  if grep -q "$want" "$OUT/$3.log"; then
    printf '    ok   %s → %s\n' "$label" "$(grep -m1 "$want" "$OUT/$3.log" | sed 's/^ *//')"
  else
    printf '    FAIL %s went unnoticed (see %s.log)\n' "$label" "$3"
    fails=$((fails + 1))
  fi
}

# ⛔ **RESTORE FROM A COPY, NEVER FROM `git checkout`** — and this line cost the work
# it was protecting. The first version restored with `git checkout -- $SRC $KEYS`,
# which is correct only if the subject is already committed; the subject of a sabotage
# sweep is the step you have just built, so `git checkout` **deleted the
# implementation**, and every row then reported *NOTHING went red* — a sweep that reads
# as *the tests are useless* when what happened is that the feature was removed.
# ⚠ The CONTROL row could not see it either: with the whole gesture gone the suite
# still compiles and still reports a result, because the tests were reverted too.
cp "$SRC" "$OUT/hex_editor.loft.orig"
cp "$KEYS" "$OUT/determinism.keys.orig"
restore() {
  cp "$OUT/hex_editor.loft.orig" "$SRC"
  cp "$OUT/determinism.keys.orig" "$KEYS"
}
trap restore EXIT INT TERM

printf '── the library: what the gesture does ─────────────────────────────────\n'
# ⚠ **THE SUBJECT HAS TO BE THERE BEFORE A SWEEP MEANS ANYTHING.** Every row below
# reads *did this test go red*, and a tree with the gesture missing answers *no* to all
# of them — indistinguishable, from the scorer's side, from tests that cannot fail.
# This is the row that separates them, and it is here because the restore above once
# removed the subject and the sweep reported five clean catches as five misses.
if ! grep -q '^pub fn stair_ahead' "$SRC"; then
  printf '    FAIL the subject is absent — %s has no `stair_ahead`\n' "$SRC"
  exit 1
fi
if ! grep -q '^verb stair_up$' "$KEYS"; then
  printf '    FAIL the subject is absent — %s presses no `verb stair_up`\n' "$KEYS"
  exit 1
fi
printf '    ok   the subject is present: `stair_ahead` and %s converted press(es)\n' \
  "$(grep -c '^verb stair_up$' "$KEYS")"
row control "unsabotaged" 0

# 1 — collapse the pair in the DEFINITION, which is the mistake this whole slice
# exists to refuse: three families collapsed before it and this one must not.
sed -i 's/^  if key == "Q" { return VB_STAIR_DOWN; }$/  if key == "Q" { return VB_STAIR_UP; }/' "$SRC"
row s1 "verb_of(Q) answers stair_up — the family collapsed" 1
restore

# 2 — …and the same collapse one layer DOWN, where the two names still differ and the
# gesture does not. ⚠ THE NAME TEST CANNOT SEE THIS ONE, which is why the row above it
# asserts the two worlds as bytes rather than stopping at `verb_of`.
sed -i 's/^  if verb == VB_STAIR_DOWN { return stair_ahead(w, a, 0 - 1); }$/  if verb == VB_STAIR_DOWN { return stair_ahead(w, a, 1); }/' "$SRC"
row s2 "stair_down cuts UPWARD — two names, one direction" 1
restore

# 3 — the cell underfoot instead of the cell ahead. The author cuts the floor they are
# standing on and the gesture reports success, which is the failure `cell_ahead`'s own
# comment refuses to have ("never a silent fallback to the author's own cell").
sed -i 's/^  sa_why = "";$/  sa_why = "";\n  sa_q = sa_hq;\n  sa_r = sa_hr;/' "$SRC"
row s3 "the tread is cut underfoot rather than ahead" 1
restore

# 4 — the old global back where the world's own unit belongs. ⚠ IDENTICAL ON EVERY
# LANDSCAPE FIXTURE, so only the two-unit world can see it — which is the finding
# itself, not a remark about the test.
sed -i 's/^                     walker_step(w.w_unit), sa_why);$/                     walker_step(0.25), sa_why);/' "$SRC"
row s4 "the stride is the old global instead of w_unit" 1
restore

printf '── the probe: whether the script was transcribed faithfully ───────────\n'

# 5 — the conversion half done: the live script still presses the key.
sed -i '0,/^verb stair_up$/s//key E/' "$KEYS"
scripted "a half-done conversion" 'still presses a stair key' s5
restore

# 6 — a press that changed DIRECTION. ⚠ THE TOTAL IS STILL TWO, which is exactly what
# check 10 counting `E` and `Q` separately rather than summing them exists to catch.
sed -i '0,/^verb stair_up$/s//verb stair_down/' "$KEYS"
scripted "an up transcribed as a down" 'a tread changed direction' s6
restore

# 7 — a press LOST altogether. ⚠ **CHECK 10 IS WHAT REPORTS IT, NOT CHECKS 1 AND 2** —
# measured, and this comment said the opposite before the sweep ran. The counter fires
# on the file, before either server is started, so the sentence-and-world comparison
# never gets to speak. That is fine and it is worth writing down: the cheap instrument
# answers first, and a reader who assumed the expensive one caught it would think this
# row proves something it does not.
sed -i '0,/^verb stair_up$/s//echo a tread that is not cut/' "$KEYS"
scripted "a lost tread" 'FAIL' s7
restore

printf '\n'
if [ "$fails" -eq 0 ]; then
  printf 'SABOTAGE: every row went red on the test that claims it.\n'
else
  printf 'SABOTAGE: %s row(s) did not.\n' "$fails"
fi
exit "$fails"
