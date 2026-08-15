#!/bin/sh
# EIGHT SABOTAGES FOR `K3` · `X`, each aimed at ONE claim.
#
#   sh probe/k2/sabotage-x.sh
#
# Same harness as `sabotage-z.sh`, and it inherits that file's two lessons whole:
# ⛔ **restore from a COPY, never from `git checkout`** — the subject of a sweep is the
# step you have just built, so it is uncommitted by definition and `git checkout`
# deletes it — and **assert the subject is present before row 0**, because a tree with
# the gesture missing answers *nothing went red* to every question.
#
# ⚠ **AND IT INHERITS `Z`'s BLINDNESS TOO, FOR THE SAME REASON.** A slab is `es_slabs`
# — session state end to end — and reaches no store, so `probe/k2` check 2 compares two
# byte-identical worlds whatever was laid, and `w_tau` cannot move. The SENTENCE and the
# REGISTRY are the only two things that can see this gesture. Rows 3 and 5 take one
# each.
#
# ⚠ **AND ROW 9 CARRIES A CONTROL THAT IS EXPECTED TO STAY GREEN.** It moves the slab
# a cell and asserts the SENTENCE changed while the saved WORLD did not — which is the
# blindness stated above, measured rather than asserted. A row 9 whose control went red
# would mean the store can see this gesture after all, and every ⚠ in this file about
# `es_slabs` being the only source would need rewriting.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
ROOT=lib/hex_editor/src/hex_editor.loft
SESS=lib/hex_editor/src/session.loft
SAY=lib/hex_editor/src/say.loft
KEYS=tools/scripts/slab.keys
OUT=probe/k2/out-sabotage-x
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

cp "$ROOT" "$OUT/root.orig"; cp "$SESS" "$OUT/sess.orig"
cp "$SAY" "$OUT/say.orig";   cp "$KEYS" "$OUT/keys.orig"
restore() {
  cp "$OUT/root.orig" "$ROOT"; cp "$OUT/sess.orig" "$SESS"
  cp "$OUT/say.orig" "$SAY";   cp "$OUT/keys.orig" "$KEYS"
}
trap restore EXIT INT TERM

# ⚠ TWO FILES, because the claims are split across them: `verb.loft` holds the verb
# layer and `session.loft` the session's own rows. `loft test a b` silently runs only
# the first (loft#916), so they are two invocations.
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

# ⚠ THE SCRIPTED ROWS NAME THE CHECK THEY EXPECT, not just "a failure". A sweep row
# that accepts any red passes when the probe breaks for an unrelated reason — which is
# a green sweep over a broken instrument.
scripted() {
  label=$1; want=$2; tag=$3
  sh probe/k2/run.sh slab > "$OUT/$tag.log" 2>&1
  if grep -q "$want" "$OUT/$tag.log"; then
    printf '    ok   %s → %s\n' "$label" \
      "$(grep -m1 "$want" "$OUT/$tag.log" | sed 's/^ *//' | cut -c1-96)"
  else
    printf '    FAIL %s went unnoticed (see %s.log)\n' "$label" "$tag"
    fails=$((fails + 1))
  fi
}

printf '── the library: what the gesture does ─────────────────────────────────\n'
if ! grep -q '^pub fn session_slab' "$SESS"; then
  printf '    FAIL the subject is absent — %s has no `session_slab`\n' "$SESS"; exit 1
fi
if ! grep -q '^  if key == "X" { return VB_SLAB; }$' "$ROOT"; then
  printf '    FAIL the subject is absent — %s does not bind `X`\n' "$ROOT"; exit 1
fi
if ! grep -q '^verb slab$' "$KEYS"; then
  printf '    FAIL the subject is absent — %s says no `verb slab`\n' "$KEYS"; exit 1
fi
printf '    ok   the subject is present: `session_slab`, `X` bound, %s converted press(es)\n' \
  "$(grep -c '^verb slab$' "$KEYS")"
row control "unsabotaged" 0

# 1 — `X` collapsed onto the other half of its own pair, which is the mistake this
# slice refuses: two ACTIONS answering as one is the `25:1`/`25:3` defect rebuilt.
sed -i 's/^  if key == "X" { return VB_SLAB; }$/  if key == "X" { return VB_HOLE; }/' "$ROOT"
row s1 "X names the hole verb — the two actions merged" 1
restore

# 2 — the verb bound to nothing, which is what *built and never called* looks like
# from the outside: the gesture exists, compiles, is tested, and no key reaches it.
sed -i '/^  if verb == VB_SLAB {$/,/^  }$/d' "$ROOT"
row s2 "press_verb has no branch for slab — a gesture nothing calls" 1
restore

# 3 — THE REGISTRY. The gesture answers and files nothing, so the mesher draws no
# floor and every later hole is refused over a slab the author was told they laid.
# ⚠ NEITHER THE WORLD NOR `w_tau` CAN SEE THIS, which is why the count is asserted.
sed -i 's/^  s.es_slabs.items += \[sb_new\];$//' "$SESS"
row s3 "the floor is reported and never filed — the mesher's only source" 1
restore

# 4 — THE PAD GOES BACK TO BEING TWO NUMBERS: the slab takes a literal where the
# shared footprint belongs, exactly as the socket used to write it out by hand.
sed -i 's/sb_pad: SLAB_PAD, sb_say:/sb_pad: 3, sb_say:/' "$SESS"
row s4 "the slab picks its own pad again" 1
restore

# 5 — THE SENTENCE loses the number the whole band exists for. ⚠ `probe/k2` IS BLIND
# TO THIS BY CONSTRUCTION — both spellings run against one server, so a wording change
# is common-mode and checks 1 and 12 compare two equally-wrong runs. Only the library
# test can see it, which is what *the sentences are gates* stops being true about the
# moment a sentence becomes a library function.
sed -i 's/+ "floor above {s.sl_hi}, clear {slab_clear(floor, s)}"/+ "floor above {s.sl_hi}"/' "$SAY"
row s5 "the clear height drops out of the sentence" 1
restore

# 6 — THE FLOOR IS NOT THE AUTHOR'S GROUND. A slab laid from a datum of nothing sits
# at the world's zero instead of over the ground the author stands on, and on flat
# ground at height 20 that is a clear height of −10.
sed -i 's/^                 grade_under(w, a));$/                 0);/' "$ROOT"
row s6 "the slab is laid from zero instead of the ground under the author" 1
restore

printf '── the probe: whether the script was transcribed faithfully ───────────\n'

# 7 — the conversion half done: the live script still presses the key.
sed -i '0,/^verb slab$/s//key X/' "$KEYS"
scripted "a half-done conversion" 'still presses .key X./.key Z.' s7

# 8 — …and both actions flattened onto one verb, which is the mistake the pair
# invites. ⚠ This is `sabotage-z.sh`'s retired row 7 turned the right way up: with
# `slab` bound, the failure is no longer *a verb that reaches nothing* but *a verb
# that reaches the wrong one of two*.
restore
sed -i 's/^verb hole$/verb slab/' "$KEYS"
scripted "both actions spelled as one verb" 'a press was lost or gained' s8
restore

# 9 — THE SLAB LAID SOMEWHERE ELSE. The pose moves one cell before the floor goes
# down, so the slab lands off the hole's centre and the void that follows is refused
# for reaching past its edge. ⚠ **CHECK 2 IS BLIND** — neither a slab nor a hole
# reaches the store, so the two worlds stay byte-identical through this; only the
# sentence moves, which is the blindness `sabotage-z.sh` recorded and this re-measures
# from the other side of the pair.
sed -i '0,/^at 0 0 90$/s//at 1 0 90/' "$KEYS"
scripted "the floor laid a cell off" 'said different things' s9
if grep -q 'and the same world' "$OUT/s9.log"; then
  printf '    ok   …and CONTROL — check 2 saw nothing, as it cannot: %s\n' \
    "$(grep -m1 'and the same world' "$OUT/s9.log" | sed 's/^ *//')"
else
  printf '    FAIL CONTROL — check 2 went red too, so the store is not blind here \
after all and the note above is wrong\n'
  fails=$((fails + 1))
fi
restore

printf '\n'
if [ "$fails" -eq 0 ]; then
  printf 'SABOTAGE: every row went red on the test that claims it.\n'
else
  printf 'SABOTAGE: %s row(s) did not.\n' "$fails"
fi
exit "$fails"
