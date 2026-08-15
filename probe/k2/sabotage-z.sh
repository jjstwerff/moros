#!/bin/sh
# SEVEN SABOTAGES FOR `K3` · `Z`, each aimed at ONE claim.
#
#   sh probe/k2/sabotage-z.sh
#
# Same harness as `sabotage-e.sh`, and it inherits that file's two lessons whole:
# ⛔ **restore from a COPY, never from `git checkout`** — the subject of a sweep is the
# step you have just built, so it is uncommitted by definition and `git checkout`
# deletes it — and **assert the subject is present before row 0**, because a tree with
# the gesture missing answers *nothing went red* to every question.
#
# ⚠ **AND THIS GESTURE NEEDS A SHARPER SWEEP THAN THE STAIR DID, BECAUSE THE USUAL
# INSTRUMENT IS BLIND.** A hole is `es_holes` — session state end to end — and reaches
# no store, so `probe/k2` check 2 compares two byte-identical worlds whatever was cut,
# and `w_tau` cannot move. The SENTENCE and the REGISTRY are the only two things that
# can see this gesture, and rows 3 and 4 exist to prove each of them separately.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
ROOT=lib/hex_editor/src/hex_editor.loft
SESS=lib/hex_editor/src/session.loft
GEST=lib/hex_editor/src/gesture.loft
KEYS=tools/scripts/slab.keys
OUT=probe/k2/out-sabotage-z
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

cp "$ROOT" "$OUT/root.orig"; cp "$SESS" "$OUT/sess.orig"
cp "$GEST" "$OUT/gest.orig"; cp "$KEYS" "$OUT/keys.orig"
restore() {
  cp "$OUT/root.orig" "$ROOT"; cp "$OUT/sess.orig" "$SESS"
  cp "$OUT/gest.orig" "$GEST"; cp "$OUT/keys.orig" "$KEYS"
}
# ⛔ **`PIPE` IS IN THAT LIST BECAUSE IT WAS NOT, AND A SABOTAGED TREE SURVIVED THE RUN.**
# Piping this script through `head` closes the pipe mid-row; the shell dies on SIGPIPE,
# the EXIT trap never fires, and the working tree is left with the sabotage APPLIED —
# which the next `make lib-test` reports as a real failure in a step you thought was
# green. Measured on 2026-08-15 at `M4`: `hex_editor` came back 11 failed with a
# `bind_of("5", "tunnel")` still in the source.
trap restore EXIT INT TERM PIPE

# ⚠ TWO FILES, because `Z`'s claims are split across them: `verb.loft` holds the verb
# layer and `session.loft` holds the refusal wording. `loft test a b` silently runs
# only the first (loft#916), so they are two invocations.
suite() {
  ( cd lib/hex_editor && $LOFT test verb 2>&1 )    >  "$OUT/$1.log"
  ( cd lib/hex_editor && $LOFT test session 2>&1 ) >> "$OUT/$1.log"
}

row() {
  tag=$1; label=$2; want=$3
  suite "$tag"
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
  if [ "$(grep -c '^test result:' "$OUT/$tag.log")" -lt 2 ]; then
    printf '    FAIL %s → a suite produced no result line (see %s.log)\n' "$label" "$tag"
    fails=$((fails + 1)); return
  fi
  if [ "$want" = "0" ]; then
    if [ "$got" = "0" ]; then printf '    ok   CONTROL — %s: nothing red\n' "$label"
    else printf '    FAIL CONTROL — %s: %s red, expected none\n' "$label" "$got"
         fails=$((fails + 1)); fi
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

printf '── the library: what the gesture does ─────────────────────────────────\n'
if ! grep -q '^pub fn session_hole_kind' "$SESS"; then
  printf '    FAIL the subject is absent — %s has no `session_hole_kind`\n' "$SESS"; exit 1
fi
if ! grep -q '^verb hole$' "$KEYS"; then
  printf '    FAIL the subject is absent — %s says no `verb hole`\n' "$KEYS"; exit 1
fi
printf '    ok   the subject is present: `session_hole_kind` and %s converted press(es)\n' \
  "$(grep -c '^verb hole$' "$KEYS")"
row control "unsabotaged" 0

# 1 — `Z` collapsed onto the slab, which is the mistake this slice refuses: two
# ACTIONS answering as one is the `25:1`/`25:3` defect rebuilt on a new id.
# ⛔ **THIS ROW WAS A SILENT NO-OP AFTER `M4` AND THE GUARD ABOVE COULD NOT SEE IT.**
# It sed'd `verb_of`'s `if key == "Z"`, which the deletion removed; the pattern stopped
# matching, the file was left untouched, and the row reported *NOTHING went red* — the
# same sentence a test that cannot fail produces. The guard names `session_hole_kind`,
# which is still there, so it passed. **A subject guard only sees what it names.**
sed -i 's/^    bind_of("Z", VB_HOLE),$/    bind_of("Z", VB_PLACE),/' "$ROOT"
row s1 "Z names another verb — the two actions merged" 1
restore

# 2 — the verb bound to nothing, which is what *built and never called* looks like
# from the outside: the gesture exists, compiles, is tested, and no key reaches it.
sed -i '/^  if verb == VB_HOLE {$/,/^  }$/d' "$ROOT"
row s2 "press_verb has no branch for hole — a gesture nothing calls" 1
restore

# 3 — THE REGISTRY. The gesture answers and files nothing, so the mesher draws an
# unbroken floor over a hole the author was told they cut. ⚠ NEITHER THE WORLD NOR
# `w_tau` CAN SEE THIS, which is the whole reason the count is asserted.
sed -i 's/^  s.es_holes.items += \[hk_cut.hx_hole\];$//' "$SESS"
row s3 "the void is reported and never filed — the mesher's only source" 1
restore

# 4 — THE REFUSAL NAMES A KEYSTROKE AGAIN. The regression this step fixed, put back:
# a library telling a script-driven author to *press X*.
sed -i 's/hx_why: "no slab to cut — lay a slab first" };/hx_why: "no slab to cut — press X first" };/' "$GEST"
row s4 "the library refusal names a key again" 1
restore

# 5 — the host is not the last slab. ⚠ THE POINT IS THAT IT STILL SUCCEEDS: cutting
# with no slab at all must refuse, and a gesture that invents a host would report a
# void through a floor that was never laid.
sed -i 's/^  hk_cut = slab_hole(s.es_slabs, kind, a.au_x, a.au_z, HOLE_HALF, HOLE_HALF);$/  hk_cut = HoleAt { hx_ok: true, hx_kind: kind };/' "$SESS"
row s5 "a void is cut with no slab under it" 1
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
