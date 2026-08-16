#!/bin/sh
# K3E — A LINE THAT MOVES THE AUTHOR MUST NOT BE SILENTLY DROPPED EITHER.
#
#   sh probe/k3e/run.sh
#
# `hold`, `keys` and `turn` sat on `editor_run`'s skip list under the defence *"not one
# of them writes a cell"*. True, and never the question. `tools/script.mjs` compiles all
# three to `4:<bits>`, the server WALKS, and the character is the datum every gesture
# reads — which is the same argument `K3c` used to refuse `6:` LEVEL two lines above
# them. This is that defect one word over.
#
# ⛔ **AND ONE LIVE SCRIPT WAS HIT.** Measured over the whole corpus before anything
# moved, asking *is there a `verb` after a movement with no `at` between*:
# `tools/scripts/deck.keys` walks 90 units and then says `verb storey`, so the deck this
# runner built stood at the origin on unlevelled ground.
#
# ── WHERE THE FENCE GOES, WHICH IS THE WHOLE DESIGN ───────────────────────────
#
# `CLAUDE.md`: *a guard where the thing arrives, a fence where the value is USED.*
# Refusing `hold` on its own line would red every walking script in the tree — and
# measured, **three of the four walk and then say `at`**, where the drop is provably
# harmless because the teleport re-fixes the author exactly. So the movement is
# remembered, not refused, and only `verb` pays: it is the one word applied AT the
# author. Row C is the half that proves the fence did not slide back to the movement.
#
# ── WHAT EACH ROW MEANS IF IT FLIPS ───────────────────────────────────────────
#
#   A  a gesture after a skipped movement FAILS, naming the movement
#      → green→red means a gesture can again land wherever the last `at` put the
#        author, in a run reporting success
#   B  an `at` after the walk CLEARS it, and the world it then builds is the pose's
#      → red means either the fence never lifts (every walking script dies for
#        nothing) or the clearing is unsound
#   C  a walk with no gesture after it is not refused at all
#      → red means the fence slid from the value back to the arrival, which is the
#        design this step deliberately did not take
#   D  the three live scripts that walk and then say `at` are UNMOVED
#      → red means the fence costs a correct script something, which is row B on real
#        files rather than fixtures
#   E  `deck.keys` names the movement, as a THIRD complaint beside its two `send 6:`
#      → ⚠ **THE COUNT IS THE ASSERTION, NOT THE FAILURE.** `deck.keys` has exited 101
#        since `K3c` refused its `send 6:`, so a row reading *deck fails* would have
#        passed before this step existed and could never go red. Two drops at once, and
#        only one of them is this step's.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/k3e/out
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

# ── EVERY RUN IS LAUNCHED FIRST AND EVERY ASSERTION READS A FILE ──────────────
#
# ⚠ The cost is the compiler, not the script — `probe/k3c` measured 1.8 s for a one-line
# run — so a pool is what makes this affordable inside `make fast`, and a probe outside
# `make fast` is an instrument nobody reads. ⚠ **EVERY RUN OWNS ITS OWN WORLD NAME**:
# `probe/k2b` had two copies of itself sharing one world file, so a byte comparison
# could have passed on a world the other process built.
JOBS=${K3E_JOBS:-6}
started=0

launch() {       # launch <script-path> <world-name>
  ( SCRIPT="$1" WORLD="$2" $LOFT --lib lib/ src/editor_run.loft \
      > "$OUT/$2.log" 2>"$OUT/$2.err"
    echo $? > "$OUT/$2.rc"
    sed -n 's/^editor_run: world //p' "$OUT/$2.log" | tail -1 > "$OUT/$2.key" ) &
  started=$((started + 1))
  if [ "$((started % JOBS))" -eq 0 ]; then wait; fi
}

rc_of()  { cat "$OUT/$1.rc"; }
key_of() { cat "$OUT/$1.key"; }
# Complaints, which `main` prints one per bad line after `editor_run: `. ⚠ **THE TWO
# SUMMARY LINES WEAR THE SAME PREFIX** — `editor_run: world …` and `editor_run: N lines,
# …` — so they are excluded BY NAME rather than subtracted. Written the arithmetic way
# first and it read `printed 3 complaints, not 3`, which is what an off-by-two looks
# like when the number in the message is not the number in the test.
bads_of() {
  grep '^editor_run: ' "$OUT/$1.log" \
    | grep -vc '^editor_run: world \|^editor_run: [0-9][0-9]* lines,'
}

# ── THE FIXTURES ──────────────────────────────────────────────────────────────
#
# ⚠ **ALL THREE WORDS, NOT JUST THE ONE THE CORPUS USES.** `deck.keys` says `keys`; a
# fence written against that word alone would leave `hold` and `turn` dropping silently,
# and nothing in the tree would say so until somebody wrote the script.
printf 'at 0 0 0\nkeys 1\nstep 90\nkeys 0\nverb raise\n' > "$OUT/w-keys.keys"
printf 'at 0 0 0\nhold W 3\nverb raise\n'                > "$OUT/w-hold.keys"
printf 'at 0 0 0\nturn 90\nverb raise\n'                 > "$OUT/w-turn.keys"
# B: the same walk with a teleport after it, against the SAME pose never walked at all,
# and against a different pose. The first pair must agree and the second must not.
printf 'at 0 0 0\nkeys 1\nstep 90\nkeys 0\nat 5 0 0\nverb raise\n' > "$OUT/w-at.keys"
printf 'at 5 0 0\nverb raise\n'                          > "$OUT/w-still.keys"
printf 'at 0 0 0\nverb raise\n'                          > "$OUT/w-orig.keys"
# C: a walk that no gesture follows. The fence must not reach it.
printf 'at 0 0 0\nkeys 1\nstep 90\nkeys 0\n'             > "$OUT/w-only.keys"

for v in keys hold turn at still orig only; do
  launch "$PWD/$OUT/w-$v.keys" "k3e-$v"
done
# D and E: the four live scripts that contain a movement word at all.
for s in cellar determinism fall deck; do
  launch "tools/scripts/$s.keys" "k3e-live-$s"
done
wait

WANT='is applied AT the author'

say "A  a gesture after a skipped movement FAILS, and names the movement"
# ⚠ THE MOVEMENT IS ASSERTED, NOT JUST THE FAILURE. A runner that refused every `verb`
# would pass a check on the exit code alone, and rows B and D are what catch that one.
# The line named is the FIRST since the last `at`: a walk is a block, and the line a
# person needs is where the author started diverging rather than the one that stopped it.
for pair in keys:'keys 1' hold:'hold W 3' turn:'turn 90'; do
  v=${pair%%:*}; want=${pair#*:}
  rc=$(rc_of "k3e-$v")
  if [ "$rc" -eq 0 ]; then
    bad "the \`$v\` fixture exited 0 — its walk went on the floor and the raise landed at the last \`at\`"
  elif grep -q "$WANT, and \`$want\` moved them" "$OUT/k3e-$v.log"; then
    ok "\`$want\` then \`verb raise\`: rc=$rc, and the complaint names the movement"
  else
    bad "the \`$v\` fixture failed with rc=$rc but never named \`$want\` — \
$(grep -m1 "$WANT" "$OUT/k3e-$v.log" | sed 's/^ *//' | cut -c1-70)"
  fi
done

say ""
say "B  an \`at\` after the walk clears it, and the world it builds is the POSE's"
# ⚠ WITHOUT THIS ROW, A IS SATISFIED BY REFUSING EVERY GESTURE. And the equality is the
# argument for skipping a movement at all: a teleport overwrites the author outright, so
# whatever the walk did is no longer readable in what the next gesture sees.
if [ "$(rc_of k3e-at)" -eq 0 ]; then
  ok "a walk followed by \`at 5 0 0\` runs: rc=0, world $(key_of k3e-at)"
else
  bad "a walk with a teleport after it still failed — the fence never lifts: \
$(grep -m1 "$WANT" "$OUT/k3e-at.log" | sed 's/^ *//' | cut -c1-70)"
fi
kat=$(key_of k3e-at); kstill=$(key_of k3e-still); korig=$(key_of k3e-orig)
# ⚠ THE FIXTURE HAS TO BE ABLE TO SHOW A DIFFERENCE, or the equality below is satisfied
# by two empty worlds agreeing — `probe/k3c` row D's guard, one probe over.
if [ -n "$kat" ] && [ "$korig" != "$kstill" ]; then
  ok "fixture: the pose is legible in the world ($korig at the origin / $kstill at 5)"
else
  bad "fixture: two poses keyed the same world ($korig / $kstill) — the comparison below means nothing"
fi
if [ "$kat" = "$kstill" ]; then
  ok "…and the walked run equals the never-walked one at that pose: $kat"
else
  bad "a skipped walk left a mark after the \`at\`: $kat against $kstill — the clearing is unsound"
fi

say ""
say "C  a walk with NO gesture after it is not refused — the fence is at the VALUE"
# ⚠ THIS IS THE ROW THAT SAYS WHICH DESIGN WAS TAKEN. Refusing `hold` where it arrives
# passes every row above and reds this one, and it is the cheaper implementation — so
# without this the sweep cannot tell the two apart.
if [ "$(rc_of k3e-only)" -eq 0 ]; then
  ok "\`keys 1 / step 90 / keys 0\` with nothing reading the author: rc=0"
else
  bad "a bare walk was refused — the fence moved to where the movement ARRIVES, and \
every walking script in the tree pays for a drop that reaches nothing"
fi

say ""
say "D  the live scripts that walk and then say \`at\` are UNMOVED"
# ⚠ REAL FILES, NOT FIXTURES, and `cellar.keys` is the one that matters: it walks FOUR
# times and teleports after every one, so a fence at the movement would cost it eight
# complaints. Its two `send 6:` refusals are `K3c`'s and must stay exactly two.
for s in determinism fall; do
  rc=$(rc_of "k3e-live-$s")
  if [ "$rc" -eq 0 ] && ! grep -q "$WANT" "$OUT/k3e-live-$s.log"; then
    ok "$s.keys: rc=0, world $(key_of "k3e-live-$s")"
  else
    bad "$s.keys exited $rc — a script that walks and then teleports lost a gesture"
  fi
done
nc=$(bads_of k3e-live-cellar)
if [ "$nc" -eq 2 ] && ! grep -q "$WANT" "$OUT/k3e-live-cellar.log"; then
  ok "cellar.keys: four walks, four teleports, and its complaints are still \
$(grep -c '^editor_run: send' "$OUT/k3e-live-cellar.log") x \`send 6:\` and nothing else"
else
  bad "cellar.keys gained a complaint — $nc against 2 \`send 6:\`, and it \
teleports after every one of its four walks"
fi

say ""
say "E  \`deck.keys\` names the movement, as a THIRD complaint beside its two sends"
# ⛔ THE COUNT IS THE ASSERTION. `deck.keys` has exited 101 since `K3c` refused its
# `send 6:`, so *deck fails* was already true before this step and a row asserting it
# could never have gone red. What is new is the third line, and which line it names.
nd=$(bads_of k3e-live-deck)
if [ "$nd" -ne 3 ]; then
  bad "deck.keys printed $nd complaints, not 3 — before this step it printed 2 \
(\`send 6:1\` and \`send 6:0\`) and the walk went quiet"
elif grep -q "$WANT, and \`keys 1\` moved them" "$OUT/k3e-live-deck.log"; then
  ok "deck.keys: 3 complaints, and the third names \`keys 1\` — the 90-unit walk its \
\`verb storey\` was standing on"
else
  bad "deck.keys printed 3 complaints but none names its walk: \
$(grep -m1 "$WANT" "$OUT/k3e-live-deck.log" | sed 's/^ *//' | cut -c1-70)"
fi
# ⚠ AND THE TWO IT ALREADY HAD MUST STILL BE THERE, or the count above is passing
# because this step broke something else in the same file.
if [ "$(grep -c '^editor_run: send' "$OUT/k3e-live-deck.log")" -eq 2 ]; then
  ok "…and \`K3c\`'s two \`send 6:\` refusals are untouched"
else
  bad "deck.keys no longer refuses its two \`send 6:\` — this step moved \`K3c\`'s half"
fi

say ""
if [ "$fails" -eq 0 ]; then
  say "K3E: green — a movement is remembered, and the gesture is where it is paid for"
else
  say "K3E: $fails FAILED"
fi
exit "$fails"
