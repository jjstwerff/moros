#!/bin/sh
# FIVE SABOTAGES FOR `M5a` — the fresh-press requirement, and what has to go red.
#
#   sh probe/k2/sabotage-m5.sh
#
# ⛔ **THE SUBJECT IS AN EDGE THAT DOES NOT EXIST IN THE HARDWARE.** `graphics` answers
# *is this key down* and nothing else, so *did they just press it* is built in
# `rebind_scan` out of two looks. Every row below breaks one clause of that
# construction, and each has to go red on its OWN row — a sweep where one sabotage
# reddens everything is measuring that the suite runs, not what it covers.
#
# ⚠ **WHY THIS IS NOT A `verb_of`-SHAPED SWEEP.** The siblings here sed a TABLE and read
# a suite; this seds a state machine, so the guard below asserts the two lines the rows
# actually patch are present, by their exact text. `M4` is the entry that earned that:
# four sweeps went on printing rows for months after the code they sed'd was deleted,
# and only the two whose guard NAMED the subject said so.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
SRC=lib/hex_editor/src/keymap.loft
OUT=probe/k2/out-sabotage-m5
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

suites() { ( cd lib/hex_editor && $LOFT test keymap ) > "$OUT/$1.log" 2>&1; }

row() {
  tag=$1; label=$2; want=$3
  suites "$tag"
  got=$(grep -c 'FAIL  tests/.*::' "$OUT/$tag.log")
  # ⛔ A SABOTAGE THAT DOES NOT BUILD IS NOT A SABOTAGE NOTHING NOTICED — `K3` · `B`.
  # `loft test` writes `FAIL  tests/keymap.loft  (parse errors)` with no `::`, so the
  # count above is 0 and the row would print *NOTHING went red* — the same sentence a
  # suite with a hole in it produces.
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
# just built, so it is uncommitted by definition and `git checkout` deletes it.
cp "$SRC" "$OUT/keymap.loft.orig"
restore() { cp "$OUT/keymap.loft.orig" "$SRC"; }
# ⛔ `PIPE` IS IN THAT LIST BECAUSE IT WAS NOT, and a sabotaged tree survived a run —
# see `sabotage-m4.sh`. Piping this script through `head` kills the shell on SIGPIPE
# without firing the trap, and the next `make lib-test` reports the leftover sabotage
# as a real regression.
trap restore EXIT INT TERM PIPE

printf -- '── `M5a`: down is not pressed, and the edge is built here ─────────────\n'
# ⚠ **THE GUARD NAMES EVERY LINE THE ROWS BELOW PATCH**, because a sabotage that does
# not APPLY reads exactly like a sabotage nothing noticed.
if ! grep -q '^pub fn rebind_scan' "$SRC"; then
  printf '    FAIL the subject is absent — %s has no `rebind_scan`\n' "$SRC"; exit 1
fi
for line in \
  '  if rb.rb_at != RB_PICKED { return KEY_NONE; }' \
  '  if !rb.rb_seen {' \
  '  rb.rb_down = downs;' \
  '    if len(downs) > 0 {' \
  '  rb.rb_down = \[\];' \
  '  rb.rb_verb = verb;'
do
  if ! grep -q -- "^$line" "$SRC"; then
    printf '    FAIL the subject is absent — %s has no line `%s`\n' "$SRC" "$line"; exit 1
  fi
done
printf '    ok   the subject is present: `rebind_scan`, its state guard, its seed, its\n'
printf '         memory write, its sentence, and the reset in `rebind_arm`\n'
row control "unsabotaged" 0

# 1 — THE SEED FIRES. Delete the seeding branch and the scan answers the first key it
# finds DOWN, which is exactly the editor as it stood before this step: hold `w`, arm,
# click a slot, and `w` names the verb.
perl -0pi -e 's/  if !rb\.rb_seen \{\n(?:.*\n)*?  \}\n//' "$SRC"
row s1 "the first look fires instead of seeding — a held key names the verb" 1
restore

# 2 — THE MEMORY IS NEVER UPDATED after the seed, so `rb_down` freezes at the keyboard
# as it was when the pick was made. ⚠ Only ONE row can see this: a key released and
# struck again is the single case where the seed and the previous frame differ.
perl -0pi -e 's/  rb\.rb_down = downs;\n  fresh\n/  fresh\n/' "$SRC"
row s2 "a released key stays stale forever — the memory is frozen at the seed" 1
restore

# 3 — ARMING KEEPS THE MEMORY. Nothing watches the keyboard between a cancel and the
# next pick, so a `rb_down` carried across that gap describes a keyboard the person has
# since changed — and the key they took up in between reads as already seen.
perl -0pi -e 's/  rb\.rb_down = \[\];\n  rb\.rb_seen = false;\n  if rb\.rb_at == RB_OFF \{/  if rb.rb_at == RB_OFF {/' "$SRC"
row s3 "arming keeps the last gesture's memory — the gap nothing watches" 1
restore

# 4 — THE SCAN READS THE KEYBOARD IN EVERY STATE. Without the guard the machine seeds
# itself while merely ARMED, so the observation that becomes the seed was taken before
# the person had chosen anything.
sed -i 's|^  if rb.rb_at != RB_PICKED { return KEY_NONE; }$|  if false { return KEY_NONE; }|' "$SRC"
row s4 "the scan reads the keyboard with nothing picked" 1
restore

# 5 — THE SILENCE THIS STEP INTRODUCES GOES UNSAID. ⚠ It is a separate row because it
# is a separate failure: the binding is correct and the person is not told why the key
# they were holding did nothing. Before `M5` that key bound itself — wrong, and visible.
perl -0pi -e 's/    if len\(downs\) > 0 \{\n(?:.*\n)*?    \}\n//' "$SRC"
row s5 "a key already down is ignored in silence" 1
restore

# 6 — THE OBVIOUS SYMMETRY, ADDED BACK. `rebind_pick` reseeding on every pick looks
# right and costs a press: the edge detector has been running continuously since the
# FIRST pick, so a key struck in the same frame as a corrected mis-click is fresh, and a
# reseed swallows it. ⛔ **This row exists because the mis-click test could not fail
# without it** — it was green under all five sabotages above, since a reseed makes the
# held key stale too. Falsifying the SYMMETRY needs the direction a reseed breaks.
sed -i 's|^  rb.rb_verb = verb;$|  rb.rb_verb = verb;\n  rb.rb_down = [];\n  rb.rb_seen = false;|' "$SRC"
row s6 "a re-pick reseeds the scan — the corrected mis-click eats a press" 1
restore

# ⚠ THE CONTROL AT BOTH ENDS, because a restore that silently failed would make every
# row after it report the previous row's sabotage.
row control2 "unsabotaged, after every restore" 0

printf '\n'
if [ "$fails" = "0" ]; then
  printf 'sabotage-m5 PASS — 8 rows, 6 sabotages red on their own claim, 2 clean controls\n'
  exit 0
fi
printf 'sabotage-m5 FAIL — %s row(s); logs in %s\n' "$fails" "$OUT"
exit 1
