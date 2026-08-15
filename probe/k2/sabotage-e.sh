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
  # ⛔ **A SABOTAGE THAT DOES NOT BUILD IS NOT A SABOTAGE NOTHING NOTICED, AND THIS
  # HARNESS REPORTED THE TWO IDENTICALLY** — measured at `K3` · `B`. `loft test` writes
  # `FAIL  tests/verb.loft  (parse errors)` with **no `::`**, so the count above is 0
  # and the row printed *NOTHING went red* — the same sentence a suite with a hole in
  # it produces. It cost a real diagnosis: a stride row substituted `W_UNIT`, which is
  # the SERVER's constant and unknown inside the library, and the sweep read as missing
  # coverage rather than as a typo. Every sweep in this directory had it.
  if grep -q 'parse errors' "$OUT/$tag.log"; then
    printf '    FAIL %s → THE SABOTAGE DOES NOT BUILD, so this row asked nothing:\n' "$label"
    grep -m2 '^  Error' "$OUT/$tag.log" | sed 's/^/           /'
    fails=$((fails + 1)); return
  fi
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
# ⛔ **`PIPE` IS IN THAT LIST BECAUSE IT WAS NOT, AND A SABOTAGED TREE SURVIVED THE RUN.**
# Piping this script through `head` closes the pipe mid-row; the shell dies on SIGPIPE,
# the EXIT trap never fires, and the working tree is left with the sabotage APPLIED —
# which the next `make lib-test` reports as a real failure in a step you thought was
# green. Measured on 2026-08-15 at `M4`: `hex_editor` came back 11 failed with a
# `bind_of("5", "tunnel")` still in the source.
trap restore EXIT INT TERM PIPE

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
# ⛔ **THIS ROW WAS A SILENT NO-OP AFTER `M4` AND THE GUARD ABOVE COULD NOT SEE IT.**
# It sed'd `verb_of`'s `if key == "Q"`, which the deletion removed; the pattern stopped
# matching and the row reported *NOTHING went red*. The guard names `stair_ahead`, which
# is still there, so it passed. **A subject guard only sees what it names** — and the
# two sweeps whose guard happened to name the binding exited loudly instead.
sed -i 's/^    bind_of("Q", VB_STAIR_DOWN),$/    bind_of("Q", VB_STAIR_UP),/' "$SRC"
row s1 "the definition gives Q the stair_up verb — the family collapsed" 1
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

# ⛔ **THE SCRIPTED ROWS ARE GONE — plan 22 `K3b`, and what they asked is worth
# recording.** They drove `probe/k2/run.sh`, which ran each converted script beside
# `probe/k2/orig/`'s copy of itself in the KEY spelling and diffed the sentences and
# the saved world. `K3b` deleted the key branch from both readers, so there is no
# second spelling to be the other half of that diff, and the baselines went with it.
#
# **Where each retired row's claim lives now:**
#
#   *a half-done conversion* — **stronger than it was.** A `key <K>` line is an
#   unknown word in both readers now, and `K3a`/`K3b.1` make an unknown word FAIL the
#   run. It is caught on every script in every driver rather than on one script in a
#   probe nobody runs; `probe/k1` asserts it directly.
#
#   *the transcription rows* — the SYSTEM claim under each is a library test and is
#   listed in the rows above (a direction stays in the verb; two actions stay two
#   verbs; a cellar is not a storey's mirror). What retired is transcription fidelity
#   of one FILE, and the conversion is a one-time event that is finished.
#
# ⚠ **AND ONE THING IS GENUINELY UNCOVERED, SAID OUT LOUD RATHER THAN IMPLIED.** Ten
# of the twelve scripts `probe/k2` drove have no gate behind them — that was the
# probe's own stated reason for existing — so a press deleted from one of them now
# goes unnoticed. `cellar.keys` and `deck.keys` are the exceptions, wrapped by
# `tools/gates/world/cellar_ceiling.mjs` and `deck_soffit.mjs`. Plan 22 `K3d`.

printf '\n'
if [ "$fails" -eq 0 ]; then
  printf 'SABOTAGE: every row went red on the test that claims it.\n'
else
  printf 'SABOTAGE: %s row(s) did not.\n' "$fails"
fi
exit "$fails"
