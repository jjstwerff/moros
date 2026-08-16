#!/bin/sh
# T3 — THE RUNNER WALKS, AND A GESTURE LANDS WHERE THE WALK PUT THE PERSON.
#
#   sh probe/t3/run.sh
#
# Plan 22 `T3`, [WALK_TICK.md](../../doc/claude/WALK_TICK.md). `editor_run`'s `step <n>`
# is exactly n `hex_editor::walk_tick` calls now, `keys <bits>` holds the wire's own
# bits, and the author every gesture reads is derived from the walker rather than from
# the last teleport.
#
# ⛔ **THIS FILE REPLACES `probe/k3e`, WHICH WAS THE SAME CLAIM WITH THE OPPOSITE SIGN.**
# That probe held the fence: a `verb` after a movement this runner had SKIPPED was
# refused, because the author it would have been applied at was stale. `T3` performs the
# movement, so the fence has nothing left to guard — and *move before you remove* is why
# the rows came here rather than being deleted. Three of `k3e`'s five survive verbatim
# in meaning, one inverts, and one is retired with its reason written down:
#
#   k3e A  a gesture after a skipped movement FAILS      -> **A**, inverted: it now lands
#                                                           at the walk, and the world
#                                                           says which
#   k3e B  an `at` after the walk CLEARS it              -> **B**, unchanged. Still the
#                                                           row that stops A being
#                                                           satisfied by refusing
#                                                           everything
#   k3e C  a bare walk is not refused                    -> retired. It said the fence
#                                                           was at the VALUE and not at
#                                                           the arrival; with no fence
#                                                           left it cannot fail
#   k3e D  the live scripts that walk are UNMOVED        -> **D**, and it is stronger now:
#                                                           they are unmoved because a
#                                                           walk that does not level
#                                                           WRITES NOTHING, not because
#                                                           it was skipped
#   k3e E  `deck.keys` names the movement, 3 complaints  -> **D**, as 3 -> 2
#
# ── WHAT EACH ROW MEANS IF IT FLIPS ───────────────────────────────────────────
#
#   A  a walk moves where a gesture lands
#      → red means `step` produced no tick, or the author is still read off the last
#        `at` — which is a runner that reports a walk and builds the unwalked world
#   B  an `at` after a walk still fixes the pose exactly
#      → red means the teleport no longer overwrites the walker, and every script that
#        walks and then says `at` builds something that depends on the walk before it
#   C  `step` is EXACTLY n ticks, and n is additive
#      → red means a clock got in. `step 45` twice must equal `step 90` to the byte;
#        that is the one property this runner has that the server does not
#   D  the live corpus moves exactly as predicted, and no further
#      → red means a script that walks and writes nothing has started writing something
#   E  `hold` and `turn` are refused where they arrive, naming the reason
#      → red means a feedback loop on a live pose is being faked, which at `rate 0`
#        walks where the driver it is compared against stands still
#
# ⏭ **THE BYTE-EQUALITY WITH THE SERVER IS NOT HERE — it is `probe/t3/vs_server.sh`**,
# because it costs a native build and a live socket. `probe/t1/run.sh` drew the same
# line for the same reason: a probe inside `make fast` has to be affordable, and an md5
# compared by hand against a number in a document is not a PASS/FAIL gate.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/t3/out
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

# ── EVERY RUN IS LAUNCHED FIRST AND EVERY ASSERTION READS A FILE ──────────────
#
# `probe/k3e`'s pool, kept: the cost is the compiler rather than the script, so a wave
# is what makes this affordable inside `make fast`. ⚠ **EVERY RUN OWNS ITS OWN WORLD
# NAME** — two copies sharing one world file is how a byte comparison comes to pass on a
# world the other process built.
JOBS=${T3_JOBS:-6}
started=0

launch() {       # launch <script-path> <world-name> [ground]
  ( GROUND="${3:-0}" SCRIPT="$1" WORLD="$2" $LOFT --lib lib/ src/editor_run.loft \
      > "$OUT/$2.log" 2>"$OUT/$2.err"
    echo $? > "$OUT/$2.rc"
    sed -n 's/^editor_run: world //p' "$OUT/$2.log" | tail -1 > "$OUT/$2.key" ) &
  started=$((started + 1))
  if [ "$((started % JOBS))" -eq 0 ]; then wait; fi
}

rc_of()  { cat "$OUT/$1.rc"; }
key_of() { cat "$OUT/$1.key"; }
# Complaints, one per bad line after `editor_run: `. ⚠ **THE TWO SUMMARY LINES WEAR THE
# SAME PREFIX**, so they are excluded BY NAME rather than subtracted — written the
# arithmetic way first, in `k3e`, and it read `printed 3 complaints, not 3`.
bads_of() {
  grep '^editor_run: ' "$OUT/$1.log" \
    | grep -vc '^editor_run: world \|^editor_run: [0-9][0-9]* lines,'
}

# ── THE FIXTURES ──────────────────────────────────────────────────────────────
#
# ⚠ **YAW 30, NOT 0, IN EVERY ONE OF THEM.** `verb place` at yaw 0 is refused — *"a
# footprint at this facing has no mitred corners"* — and a refusal writes nothing, so a
# fixture whose subject is a POSITION would compare two worlds that both contain
# nothing. Six mitre facings, and `tools/scripts/house.keys` uses this one.
#
# ⚠ AND `verb raise` FIRST IN EVERY ONE. On flat ground the feet are 0 wherever you
# stand, so the height half of this step — the author's `au_y` coming off the walker
# instead of off the cell — would be invisible.
WALK='keys 1\nstep 90\nkeys 0\nstep 30\n'
printf "at 0 0 30\nverb raise\n${WALK}verb place\n"        > "$OUT/walked.keys"
printf 'at 0 0 30\nverb raise\nverb place\n'               > "$OUT/still.keys"
# B: the same walk with a teleport after it, against the same pose never walked at all.
printf "at 0 0 30\nverb raise\n${WALK}at 5 0 30\nverb place\n" > "$OUT/w-at.keys"
printf 'at 0 0 30\nverb raise\nat 5 0 30\nverb place\n'    > "$OUT/at-only.keys"
# C: n ticks, exactly, and additive. ⚠ THE SPLIT PAIR IS THE ASSERTION AND THE SHORT
# ONE IS ITS CONTROL — without `step 45` alone, `45 + 45 == 90` is also satisfied by a
# runner whose `step` ignores its argument entirely.
printf "at 0 0 30\nverb raise\nkeys 1\nstep 45\nstep 45\nkeys 0\nstep 30\nverb place\n" \
  > "$OUT/split.keys"
printf "at 0 0 30\nverb raise\nkeys 1\nstep 45\nkeys 0\nstep 30\nverb place\n" \
  > "$OUT/short.keys"
# E: both words, and neither is in the live corpus — which is why they need fixtures.
printf 'at 0 0 30\nhold W 3\nverb raise\n'                 > "$OUT/w-hold.keys"
printf 'at 0 0 30\nturn 90\nverb raise\n'                  > "$OUT/w-turn.keys"
# F: a walk into a fence ring, against the same walk with nothing in its way.
# ⚠ **THE PAIR EXISTS BECAUSE THE WORLD CANNOT ANSWER THIS.** A fence ring changes the
# saved world whether or not it stops anybody — its own 42 cells are in there — so
# `fenced != free` is satisfied by a walk that sailed straight through. Only where the
# person ENDED can tell the two apart, which is what `feet` is for.
printf "at 0 0 30\nverb raise\nverb fence\nkeys 1\nstep 90\nkeys 0\nstep 30\nfeet\n" \
  > "$OUT/fenced.keys"
printf "at 0 0 30\nverb raise\nkeys 1\nstep 90\nkeys 0\nstep 30\nfeet\n" \
  > "$OUT/free.keys"

for v in walked still w-at at-only split short w-hold w-turn fenced free; do
  launch "$PWD/$OUT/$v.keys" "t3-$v"
done
# D: the four live scripts that contain a movement word at all.
for s in cellar determinism fall deck; do
  launch "tools/scripts/$s.keys" "t3-live-$s"
done
wait

say "A  a walk moves where a gesture LANDS"
# ⚠ THE FIXTURE HAS TO BE ABLE TO SHOW A DIFFERENCE FIRST. Both runs must build a house
# at all — a refused `verb place` writes nothing, and two nothings are equal.
kw=$(key_of t3-walked); ks=$(key_of t3-still)
if [ "$(rc_of t3-walked)" -ne 0 ] || [ "$(rc_of t3-still)" -ne 0 ]; then
  bad "a fixture failed to run: walked rc=$(rc_of t3-walked), still rc=$(rc_of t3-still)"
elif ! grep -q 'house placed' "$OUT/t3-walked.log" \
  || ! grep -q 'house placed' "$OUT/t3-still.log"; then
  bad "fixture: a \`verb place\` was refused, so the comparison below is two empty worlds — \
$(grep -m1 'refused' "$OUT/t3-walked.log" "$OUT/t3-still.log" | cut -c1-90)"
elif [ "$kw" = "$ks" ]; then
  bad "the walked run and the never-walked one keyed the SAME world ($kw) — \
either \`step\` produced no tick, or the author is still read off the last \`at\`"
else
  ok "walked $kw against never-walked $ks — the house is at the walk, not at the teleport"
fi

say ""
say "B  an \`at\` after the walk fixes the pose EXACTLY"
# ⚠ WITHOUT THIS ROW, A IS SATISFIED BY A WALK THAT LANDS ANYWHERE AT ALL. A teleport
# overwrites the walker outright, so a run that walked first must be byte-identical to
# one that never moved — and `cellar.keys` is four live instances of exactly that shape.
kat=$(key_of t3-w-at); kao=$(key_of t3-at-only)
if [ "$kat" = "$kao" ] && [ -n "$kat" ]; then
  ok "walk-then-\`at 5 0 30\` equals never-walked-\`at 5 0 30\`: $kat"
else
  bad "a walk left a mark across the teleport: $kat against $kao — \
the \`at\` no longer overwrites the walker"
fi

say ""
say "C  \`step\` is EXACTLY n ticks, and n is additive"
# ⛔ THE ROW THIS RUNNER EXISTS FOR. The server cannot make this claim about itself: its
# ticks are paced by a wall clock, and `T0` measured the world as a STEP FUNCTION of the
# count with `deck.keys` sitting one to two ticks above a cliff. Here the count is the
# script's, so `45 + 45` and `90` are the same world or something has a clock in it.
ksp=$(key_of t3-split); ksh=$(key_of t3-short)
if [ "$ksh" = "$kw" ]; then
  bad "control: \`step 45\` keyed the same world as \`step 90\` ($kw) — \
this fixture cannot see a tick count at all, so the equality below means nothing"
elif [ "$ksp" = "$kw" ]; then
  ok "\`step 45\` twice == \`step 90\`: $ksp, and \`step 45\` alone is $ksh"
else
  bad "\`step 45\` twice keyed $ksp against \`step 90\`'s $kw — a tick is being lost or \
invented at the seam between two \`step\` lines"
fi

say ""
say "D  the live corpus moves exactly as predicted, and no further"
# ⚠ **THE PREDICTION IS THE ASSERTION.** `determinism` and `fall` walk and then teleport,
# and their walks LEVEL NOTHING — so a walk that is now performed must leave their worlds
# byte-identical to what they were when it was skipped. That is `T0`'s finding about
# `determinism.keys` read forwards: *the walk contributes nothing its saved world can
# see*. If either moves, a walk has started writing something nobody asked it to.
for pair in determinism:23d3f79779eb8177a6353e169d07f9ab fall:- ; do
  s=${pair%%:*}
  rc=$(rc_of "t3-live-$s")
  if [ "$rc" -eq 0 ]; then
    ok "$s.keys: rc=0, world $(key_of "t3-live-$s")"
  else
    bad "$s.keys exited $rc — a script that walks and then teleports lost a line"
  fi
done
# ⛔ **`cellar` AND `deck` PRINTED 2 COMPLAINTS EACH AT `T3` AND PRINT NONE AT `T4`.**
# The two were their `send 6:` refusals, and `6:` LEVEL is performed now. ⚠ **THE COUNT
# IS STILL THE ASSERTION AND NOT THE EXIT CODE** — a runner that stopped counting bad
# lines would exit 0 for every script in the tree. What their WORLDS are is `probe/t4`
# rows A and B, which is a stronger claim than either could make here.
for s in cellar deck; do
  n=$(bads_of "t3-live-$s")
  if [ "$(rc_of "t3-live-$s")" -eq 0 ] && [ "$n" -eq 0 ]; then
    ok "$s.keys: rc=0, 0 complaints — it printed 2 \`send 6:\` at \`T3\`"
  else
    bad "$s.keys: rc=$(rc_of "t3-live-$s"), $n complaints — \
$(grep -m1 '^editor_run: ' "$OUT/t3-live-$s.log" | cut -c1-80)"
  fi
done

say ""
say "E  \`hold\` and \`turn\` are refused where they arrive, and say why"
# ⚠ REFUSED AT THE ARRIVAL, WHICH IS THE OPPOSITE OF WHERE `K3e` PUT THE FENCE — and the
# difference is that these two cannot be performed at all. Both are feedback loops that
# read the character's matrix off a wire between ticks; at `rate 0` they are no-ops even
# on the server, so faking them would walk where the driver being compared stood still.
for pair in hold:'hold W 3' turn:'turn 90'; do
  v=${pair%%:*}; want=${pair#*:}
  rc=$(rc_of "t3-w-$v")
  if [ "$rc" -eq 0 ]; then
    bad "the \`$v\` fixture exited 0 — a feedback loop on a live pose was performed as \
something, and whatever it was is not what the server does"
  elif grep -q "is a feedback loop on a live pose" "$OUT/t3-w-$v.log"; then
    ok "\`$want\`: rc=$rc, and the complaint says what to write instead"
  else
    bad "the \`$v\` fixture failed with rc=$rc but never explained itself: \
$(grep -m1 'editor_run:' "$OUT/t3-w-$v.log" | cut -c1-70)"
  fi
done

say ""
say "F  \`feet\` says where the person ENDED, and a fence is what makes that a claim"
# ⛔ THE ROW THAT EXISTS BECAUSE A WORLD KEY COULD NOT ANSWER. `feet` sat on the skip
# list defended as *it only reads where the walker is*, which stopped being harmless the
# moment the walker moved: asked whether the collision proxy's reach reaches the world,
# the saved world said *no* at reach 8, 4, 2 and 1 — and says the same to a walk that
# never met the fence. Where the walk STOPPED is the instrument, and it is a number.
ff=$(sed -n 's/^  feet //p' "$OUT/t3-fenced.log" | tail -1)
fr=$(sed -n 's/^  feet //p' "$OUT/t3-free.log" | tail -1)
if [ -z "$ff" ] || [ -z "$fr" ]; then
  bad "\`feet\` printed nothing (fenced '$ff', free '$fr') — the runner skipped it again, \
and the reach question goes back to being unanswerable"
elif [ "$ff" = "$fr" ]; then
  bad "the fenced walk and the free one ended in the same place ($ff) — the ring is not \
stopping anybody, so every claim this probe makes about collision is vacuous"
else
  ok "fenced ended at '$ff' against free '$fr' — the ring stops the walk, and \`feet\` sees it"
fi

say ""
if [ "$fails" -eq 0 ]; then
  say "T3: green — the runner walks, and it is the script that says how far"
else
  say "T3: $fails FAILED"
fi
[ "$fails" -eq 0 ]
