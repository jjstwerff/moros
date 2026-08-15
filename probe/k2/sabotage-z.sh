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
trap restore EXIT INT TERM

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

scripted() {
  label=$1; want=$2; tag=$3
  sh probe/k2/run.sh slab > "$OUT/$tag.log" 2>&1
  if grep -q "$want" "$OUT/$tag.log"; then
    printf '    ok   %s → %s\n' "$label" "$(grep -m1 "$want" "$OUT/$tag.log" | sed 's/^ *//')"
  else
    printf '    FAIL %s went unnoticed (see %s.log)\n' "$label" "$tag"
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
sed -i 's/^  if key == "Z" { return VB_HOLE; }$/  if key == "Z" { return VB_PLACE; }/' "$ROOT"
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

printf '── the probe: whether the script was transcribed faithfully ───────────\n'

# 6 — the conversion half done: the live script still presses the key.
sed -i '0,/^verb hole$/s//key Z/' "$KEYS"
scripted "a half-done conversion" 'still presses .key Z.' s6
restore

# 7 — RETIRED BY `K3` · `X`, and it is retired rather than deleted because its
# left-hand side is gone. It sabotaged the script by writing `verb slab` where `key X`
# stood, on the claim that `slab` was a verb nothing was bound to — and `X` is bound
# now, so that edit is the correct spelling and the row would be asserting a failure
# that must not happen.
#
# **What it proved is spent, not lost.** `probe/k2/sabotage-x.sh` row 8 is the same
# claim the right way up: with both verbs bound, the mistake the pair still invites is
# spelling the two ACTIONS as one verb, and that row goes red on check 11's count.

printf '\n'
if [ "$fails" -eq 0 ]; then
  printf 'SABOTAGE: every row went red on the test that claims it.\n'
else
  printf 'SABOTAGE: %s row(s) did not.\n' "$fails"
fi
exit "$fails"
