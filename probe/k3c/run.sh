#!/bin/sh
# K3C — IS A `send` STILL ONE WORD TO THIS RUNNER, OR IS IT WHATEVER IT CARRIES?
#
#   sh probe/k3c/run.sh
#
# `send <id>:<payload>` sat on `editor_run`'s skip list beside `snap` and `wait`, and
# those words are one thing each while this one is as many things as there are message
# ids. [WIRE_PROTOCOL.md](../../doc/claude/WIRE_PROTOCOL.md) sorts every id into **A**
# (authoring — *survives as a store write*), **V**, **S**, **R**, **X** and **K**; the
# runner skipped all of them alike.
#
# ⛔ **THE DROP WAS VISIBLE AS A COLLISION AND NOBODY HAD LOOKED.** Measured over the
# whole live corpus on the commit before this step, world keys through `editor_run`:
#
#     32952:3318286153  τ 3813   doorparts, doorway, cache, slab, early_late, leaf_field
#     32952:115861739   τ 3722   plane, probe/b1a/save
#
# Six scripts to one world, because everything that made them different was inside a
# `44:` that never opened — and `plane.keys`, whose entire subject is the ground it
# stands on, was byte-identical to a script that does nothing but raise a hill.
#
# ── WHAT EACH ROW MEANS IF IT FLIPS ───────────────────────────────────────────
#
#   A  a script carrying an authoring id FAILS the run, naming the id
#      → green→red means a gesture can be lost again with the run reporting success,
#        which is `K3a`'s hole re-opened one word further in
#   B  a script carrying only quiet ids still runs
#      → red means the classification widened past what it can defend, and every
#        camera script in the tree stopped running headless for nothing
#   C  the default is DENY
#      → red means an id nobody has classified reads as harmless, which is the shape
#        `CLAUDE.md` calls a grep whose default answer is *absent*
#   D  `ground` is performed, and both spellings of it agree
#      → red means either the one authoring message this runner CAN do went back to
#        being skipped, or the two spellings have drifted into two floors
#   E  a world with a ground SAVES
#      → red means `world_file_size` has stopped counting the `GRND` section again —
#        see below, it is the defect this step surfaced
#
# ⛔ **`E` IS HERE BECAUSE PERFORMING `ground` IS WHAT FOUND IT.** `world_to_bytes`
# writes `GRND` from the field `w_ground` and `world_file_size` counted only
# `w_sections`, so the closed form was 16 bytes short and `world_save` answered
# **`WS_IO` — the bytes did not reach the disk** over a file it had written perfectly.
# `lib/hex_voxel/tests/file.loft` holds the rule with its control; this row is the
# consumer's half, and it is the one that would have been believed: an author is told
# their scene was lost while it sits on disk.
#
# ⚠ **WHAT THIS PROBE DOES NOT CLAIM, said rather than left quiet.** It never starts a
# server, so it does not check that the runner's floor is the SERVER's floor. Both call
# `hex_voxel::world_set_ground` and the only thing that could differ is the parse, so
# `D` compares the two spellings against each other and the sentence against the
# server's own literal instead. A run of `plane.keys` through both drivers would settle
# it outright and costs a server start; it is not worth one for a four-line parse.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/k3c/out
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

# ── EVERY RUN IS LAUNCHED FIRST AND EVERY ASSERTION READS A FILE ──────────────
#
# ⚠ **BECAUSE THE COST IS THE COMPILER, NOT THE SCRIPT.** Measured: a script of one
# line costs 1.8 s and a real one 2.1 s, so eighteen runs in series is 38 s of which
# 29 s is loft starting up eighteen times. In a pool it is under ten, which is what
# puts this probe in `make fast` — and a probe outside `make fast` is an instrument
# nobody reads, which this tree has now paid for twice (`probe/k1` red for days,
# `probe/b1b` `B9` red since `B1c.1`).
#
# ⚠ **THE POOL IS CAPPED, AND NOT AT THE NUMBER OF RUNS.** This box carries other
# agents' work; a fan-out sized by the work rather than by the machine is a way of
# taking it. ⚠ **AND EVERY RUN OWNS ITS OWN WORLD NAME** — `probe/k2b` had two copies
# of itself sharing `worlds/k2b-a.hxw`, so a byte comparison could have passed on a
# world the other process built.
JOBS=${K3C_JOBS:-6}
started=0

launch() {       # launch <script-path> <world-name> [GROUND]
  ( SCRIPT="$1" WORLD="$2" GROUND="${3:-}" $LOFT --lib lib/ src/editor_run.loft \
      > "$OUT/$2.log" 2>"$OUT/$2.err"
    echo $? > "$OUT/$2.rc"
    sed -n 's/^editor_run: world //p' "$OUT/$2.log" | tail -1 > "$OUT/$2.key" ) &
  started=$((started + 1))
  if [ "$((started % JOBS))" -eq 0 ]; then wait; fi
}

rc_of()  { cat "$OUT/$1.rc"; }
key_of() { cat "$OUT/$1.key"; }

AUTHORS="tools/scripts/bridge.keys:47 \
tools/scripts/cave.keys:10 \
tools/scripts/cellar.keys:6 \
tools/scripts/deck.keys:6 \
tools/scripts/doorparts.keys:44 \
tools/scripts/doorway.keys:44 \
probe/a83/leaf_visible/early_late.keys:44 \
probe/a83/leaf_visible/leaf_field.keys:44"
QUIET="tools/scripts/cutaway.keys tools/scripts/eyes.keys \
tools/scripts/floorprobe.keys tools/scripts/indoors.keys"

# The fixtures rows C, D and E read. Written before anything is launched, so the
# pool below is one wave rather than four.
printf 'at 0 0 0\nsend 40:1\nsend 7:1,2,0\nverb raise\n'  > "$OUT/deny7.keys"
printf 'at 0 0 0\nsend 99:xyz\nverb raise\n'              > "$OUT/deny99.keys"
printf 'at 0 0 0\nverb raise\n'                           > "$OUT/g-none.keys"
printf 'at 0 0 0\nground 60 2\nverb raise\n'              > "$OUT/g-word.keys"
printf 'at 0 0 0\nsend 50:60,2\nverb raise\n'             > "$OUT/g-wire.keys"
printf 'at 0 0 0\nground 60 2\nground off\nverb raise\n'  > "$OUT/g-off.keys"

for pair in $AUTHORS; do
  s=${pair%:*}
  launch "$s" "k3c-a-$(basename "$s" .keys)"
done
for s in $QUIET; do launch "$s" "k3c-b-$(basename "$s" .keys)"; done
launch "$PWD/$OUT/deny7.keys"  k3c-deny7
launch "$PWD/$OUT/deny99.keys" k3c-deny99
for v in none word wire off; do launch "$PWD/$OUT/g-$v.keys" "k3c-g$v" 0; done
wait

say "A  a script carrying an AUTHORING id fails the run, and names the id"
# ⚠ THE ID IS ASSERTED, NOT JUST THE FAILURE. A runner that refused every `send`
# would pass a check on the exit code alone, and that runner is row B's fault.
# Each pair is a live script and the first authoring id it reaches.
for pair in $AUTHORS; do
  s=${pair%:*}; want=${pair##*:}
  n="a-$(basename "$s" .keys)"
  rc=$(rc_of "k3c-$n")
  if [ "$rc" -eq 0 ]; then
    bad "$s exited 0 — its \`send $want:\` went on the floor"
  elif grep -q "send $want: is not something this runner can do" "$OUT/k3c-$n.log"; then
    ok "$(basename "$s"): rc=$rc, refused \`send $want:\`"
  else
    bad "$s failed with rc=$rc but never named \`send $want:\` — \
$(grep -m1 'is not something' "$OUT/k3c-$n.log" | sed 's/^ *//' | cut -c1-70)"
  fi
done

say ""
say "B  a script carrying only QUIET ids still runs — the control"
# ⚠ WITHOUT THIS ROW, `A` IS SATISFIED BY REFUSING EVERY `send`. These four are the
# camera and read-back scripts: `3` LOOK, `26` CELL, `27` TRACE, `40` MODE, and not an
# authoring id between them.
for s in $QUIET; do
  n="b-$(basename "$s" .keys)"
  rc=$(rc_of "k3c-$n")
  if [ "$rc" -eq 0 ]; then
    ok "$(basename "$s"): rc=0, world $(key_of "k3c-$n")"
  else
    bad "$s exited $rc — the classification refuses a message that writes nothing: \
$(grep -m1 'is not something' "$OUT/k3c-$n.log" | sed 's/^ *//' | cut -c1-70)"
  fi
done

say ""
say "C  the default is DENY — an unclassified id and an id that does not exist"
# ⚠ `7` IS THE ONE THAT MATTERS. It is filed **X** in the protocol — a character pose,
# not world — so a classifier that whitelisted by class LETTER would wave it through,
# and it moves the datum every gesture reads. `99` is nothing at all.
rc=$(rc_of k3c-deny7)
if [ "$rc" -ne 0 ] && grep -q 'send 7: is not something' "$OUT/k3c-deny7.log"; then
  ok "\`send 7:\` (filed X, and it moves the author) is refused: rc=$rc"
else
  bad "\`send 7:\` left rc=$rc — a pose message reads as harmless"
fi
rc=$(rc_of k3c-deny99)
if [ "$rc" -ne 0 ] && grep -q 'send 99: is not something' "$OUT/k3c-deny99.log"; then
  ok "an id nobody has classified is refused: rc=$rc"
else
  bad "\`send 99:\` left rc=$rc — the default answer is *harmless*, which is no answer"
fi
# ⚠ AND THE SAME FIXTURE'S QUIET LINE MUST STILL BE QUIET, or `C` is passing because
# the runner refuses everything with a colon in it.
if grep -q 'send 40: is not something' "$OUT/k3c-deny7.log"; then
  bad "\`send 40:\` was refused in the same script — the whitelist is not being read"
else
  ok "…and \`send 40:\` in the same script is not"
fi

say ""
say "D  \`ground\` is PERFORMED, and both spellings say the same floor"
# The same scene four ways: no ground, the friendly spelling, the raw frame, and the
# ground put back. ⚠ At `GROUND=0`, so the runner's own seeded patch is not the floor
# under the comparison — *start where the editor starts*.
for v in none word wire off; do
  [ "$(rc_of "k3c-g$v")" -eq 0 ] \
    || bad "the $v fixture did not run: $(head -3 "$OUT/k3c-g$v.err")"
done
gnone=$(key_of k3c-gnone); gword=$(key_of k3c-gword)
gwire=$(key_of k3c-gwire); goff=$(key_of k3c-goff)
# ⚠ THE FIXTURE HAS TO BE ABLE TO SHOW A DIFFERENCE. Without this the three
# comparisons below are all satisfied by three empty worlds agreeing.
if [ -n "$gnone" ] && [ -n "$gword" ]; then
  ok "fixture: the three runs keyed worlds ($gnone / $gword)"
else
  bad "fixture: a run keyed nothing — the comparisons below mean nothing"
fi
if [ "$gword" != "$gnone" ]; then
  ok "a ground CHANGES the world: $gnone -> $gword"
else
  bad "\`ground 60 2\` left the same world as no ground at all — it is being skipped"
fi
if [ "$gword" = "$gwire" ]; then
  ok "…and \`send 50:60,2\` builds the same floor: $gwire"
else
  bad "the two spellings of one message build different worlds: $gword vs $gwire"
fi
if [ "$goff" = "$gnone" ]; then
  ok "…and \`ground off\` puts it back: $goff"
else
  bad "\`ground off\` did not clear — $goff against $gnone with no ground ever set"
fi
# ⚠ THE SENTENCE IS THE SERVER'S, AND THIS IS THE ONLY NON-CIRCULAR CHECK OF THAT
# HERE. Two files, written apart, saying one thing: if either moves, this reds.
if grep -q 'ground {gh} material {gm}' src/editor_run.loft \
   && grep -q 'ground {gh} material {gm}' src/editor_server.loft; then
  ok "…and the runner says what the server says, word for word"
else
  bad "the two drivers no longer share the ground sentence — a gate comparing \
transcripts will read one as a refusal"
fi

say ""
say "E  a world with a ground SAVES, and says so"
# ⛔ `world_file_size` did not count the `GRND` section, so this was `code 3` —
# `WS_IO`, *the bytes did not reach the disk* — over a file that was written
# correctly. The library rule is `lib/hex_voxel/tests/file.loft`; this is the half a
# person would have believed.
code=$(sed -n 's/.*-> k3c-gword.hxw (code \([0-9]*\)).*/\1/p' "$OUT/k3c-gword.log")
if [ "$code" = "0" ]; then
  ok "the save of a world with a ground reports code 0"
else
  bad "a world with a ground saved with code $code — the file is on disk and the \
runner says it is not (WS_IO is 3)"
fi
# And the control: the same scene with no ground was never in doubt, so a failure
# here means something else entirely broke.
codeb=$(sed -n 's/.*-> k3c-gnone.hxw (code \([0-9]*\)).*/\1/p' "$OUT/k3c-gnone.log")
if [ "$codeb" = "0" ]; then
  ok "…and the control without one still does"
else
  bad "even a world with NO ground now saves with code $codeb — this is not the \
ground defect"
fi

say ""
if [ "$fails" -eq 0 ]; then
  say "K3C: green — a \`send\` is what it carries"
else
  say "K3C: $fails FAILED"
fi
exit "$fails"
