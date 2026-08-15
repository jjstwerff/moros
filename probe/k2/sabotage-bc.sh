#!/bin/sh
# NINE SABOTAGES FOR `K3` · `B`+`C`, each aimed at ONE claim.
#
#   sh probe/k2/sabotage-bc.sh
#
# Same harness as `sabotage-x.sh`, and it inherits that file's two lessons whole:
# ⛔ **restore from a COPY, never from `git checkout`** — the subject of a sweep is the
# step you have just built, so it is uncommitted by definition and `git checkout`
# deletes it — and **assert the subject is present before row 0**, because a tree with
# the gesture missing answers *nothing went red* to every question.
#
# ⚠ **AND THIS PAIR IS THE FIRST WHOSE SCRIPTS HAVE A REAL GATE**, which changes what
# the sweep has to cover rather than reducing it. `deck.keys` and `cellar.keys` are run
# by `tools/gates/world/deck_soffit.mjs` and `cellar_ceiling.mjs`, so a broken disc or
# a lost stair goes red in `make gate` on its own. What a gate CANNOT see is row 4 —
# the stride — because a landscape is 0.25 units either way and the frozen constant
# gives the identical answer. That row is the reason this file exists.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
ROOT=lib/hex_editor/src/hex_editor.loft
DECK=tools/scripts/deck.keys
CELL=tools/scripts/cellar.keys
OUT=probe/k2/out-sabotage-bc
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

cp "$ROOT" "$OUT/root.orig"
cp "$DECK" "$OUT/deck.orig"; cp "$CELL" "$OUT/cell.orig"
restore() {
  cp "$OUT/root.orig" "$ROOT"
  cp "$OUT/deck.orig" "$DECK"; cp "$OUT/cell.orig" "$CELL"
}
trap restore EXIT INT TERM

# ⚠ ONE FILE THIS TIME, and that is a fact about the step rather than a shortcut:
# every claim `B`/`C` makes lives in `verb.loft`, because `storey_here` is a gesture
# and not a session assembly — nothing about a storey is session state. `loft test a b`
# silently runs only the first (loft#916), so a second file would be a second call.
suite() {
  ( cd lib/hex_editor && $LOFT test verb 2>&1 ) > "$OUT/$1.log"
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
  if [ "$(grep -c '^test result:' "$OUT/$tag.log")" -lt 1 ]; then
    printf '    FAIL %s → the suite produced no result line (see %s.log)\n' "$label" "$tag"
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

# ⚠ THE SCRIPTED ROWS NAME THE CHECK THEY EXPECT, not just "a failure". A row that
# accepts any red passes when the probe breaks for an unrelated reason — a green sweep
# over a broken instrument.
scripted() {
  label=$1; want=$2; tag=$3
  sh probe/k2/run.sh cellar deck > "$OUT/$tag.log" 2>&1
  if grep -q "$want" "$OUT/$tag.log"; then
    printf '    ok   %s → %s\n' "$label" \
      "$(grep -m1 "$want" "$OUT/$tag.log" | sed 's/^ *//' | cut -c1-96)"
  else
    printf '    FAIL %s went unnoticed (see %s.log)\n' "$label" "$tag"
    fails=$((fails + 1))
  fi
}

printf '── the library: what the gesture does ─────────────────────────────────\n'
if ! grep -q '^pub fn storey_here' "$ROOT"; then
  printf '    FAIL the subject is absent — %s has no `storey_here`\n' "$ROOT"; exit 1
fi
if ! grep -q '^  if key == "B" { return VB_STOREY; }$' "$ROOT"; then
  printf '    FAIL the subject is absent — %s does not bind `B`\n' "$ROOT"; exit 1
fi
if ! grep -q '^verb storey$' "$DECK" || ! grep -q '^verb cellar$' "$CELL"; then
  printf '    FAIL the subject is absent — the two scripts are not converted\n'; exit 1
fi
printf '    ok   the subject is present: `storey_here`, `B`/`C` bound, both scripts converted\n'
row control "unsabotaged" 0

# 1 — the pair collapsed onto one verb, which is what a DIRECTION in a selection would
# look like from here: two keys, one name, and the sign gone.
sed -i 's/^  if key == "C" { return VB_CELLAR; }$/  if key == "C" { return VB_STOREY; }/' "$ROOT"
row s1 "C names the storey verb — the pair merged" 1
restore

# 2 — the verbs bound to nothing, which is what *built and never called* looks like
# from outside: the gesture exists, compiles, is tested, and no key reaches it.
sed -i '/^  if verb == VB_STOREY || verb == VB_CELLAR {$/,/^  }$/d' "$ROOT"
row s2 "press_verb has no branch for the pair — a gesture nothing calls" 1
restore

# 3 — THE STAIR. The cellar digs its room and does not open the way in, which is the
# defect this whole rung exists to close and the reason the pair is not one verb with a
# sign. ⚠ The room is still dug, so a check that only asked *did it work* stays green.
sed -i 's/^  sy_s = cellar_stair(w, a, walker_step(w.w_unit), sy_swhy);$/  sy_s = 0;/' "$ROOT"
row s3 "the cellar digs a room with no way into it" 1
restore

# 4 — THE STRIDE GOES BACK TO A PROGRAM CONSTANT — the row this file exists for.
# ⚠ **NO GATE AND NO SCRIPT CAN SEE THIS.** A landscape is 0.25 units, `W_UNIT` is
# 0.25, and the two expressions give the identical answer there — so `make gate`,
# `probe/k2` and every screenshot in the tree stay green while a cellar on a PART world
# gets treads of half the height a walker can climb. Only the two-worlds row can fail.
#
# ⛔ **AND THE FIRST SPELLING OF THIS ROW WAS `walker_step(W_UNIT)`, WHICH DOES NOT
# BUILD** — `W_UNIT` is the SERVER's constant and the library cannot see it. The row
# reported *NOTHING went red* and read as a hole in the tests; it is what put the
# parse-error guard in `row()` above, and every sweep in this directory needed it.
# `0.25` is the same number `W_UNIT` carries, written where the library can see it.
sed -i 's/walker_step(w.w_unit), sy_swhy);/walker_step(0.25), sy_swhy);/' "$ROOT"
row s4 "the stride is a program constant again — invisible to every other instrument" 1
restore

# 5 — THE DISC. A radius of 3 is 37 cells where every gate in the tree reads 19, and
# the library said 19 nowhere until this slice: the socket passed a literal `2`.
sed -i 's/^pub const STOREY_R = 2;$/pub const STOREY_R = 3;/' "$ROOT"
row s5 "the storey covers a different disc" 1
restore

# 6 — THE PAD. A cellar's stair leaves the disc it was dug in, so its stale region has
# to reach further; the socket knew that and nothing could read it.
sed -i 's/sy_pad: CELLAR_PAD,$/sy_pad: STOREY_PAD,/' "$ROOT"
row s6 "the cellar marks a storey's stale region" 1
restore

printf '── the probe: whether the scripts were transcribed faithfully ─────────\n'

# 7 — the conversion half done: the live script still presses the key.
sed -i '0,/^verb storey$/s//key B/' "$DECK"
scripted "a half-done conversion" 'still presses a storey key' s7
restore

# 8 — …and the pair swapped, which is the mistake two keys on one message invite and
# the one a total would hide: `cellar.keys` says `storey` and the count still balances
# across the two scripts unless each key is counted against its OWN verb.
sed -i 's/^verb cellar$/verb storey/' "$CELL"
scripted "a cellar transcribed as a storey" 'a floor changed direction' s8
restore

# 9 — and the direction back in a payload, which is what a reader reaching for `36:`'s
# *empty means the one I chose* contract would write. `VERBMAP` carries no argument, so
# `verb cellar -1` reaches `12:-1` and the `-1` is silently dropped — it happens to be
# right here, and would be a lie the moment anyone wrote `verb storey -1`.
sed -i 's/^verb storey$/verb storey -1/' "$DECK"
scripted "the direction written as an argument" 'gone back into a payload' s9
restore

printf '\n'
if [ "$fails" -eq 0 ]; then
  printf 'SABOTAGE: every row went red on the test that claims it.\n'
else
  printf 'SABOTAGE: %s row(s) did not.\n' "$fails"
fi
exit "$fails"
