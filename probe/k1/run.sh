#!/bin/sh
# K1 — DOES A SCRIPT SAYING `verb` BUILD WHAT THE SAME SCRIPT SAYING `key` BUILT?
#
#   sh probe/k1/run.sh            # both drivers
#   K1_WIRE=0 sh probe/k1/run.sh  # the headless half only, no port
#
# plan 22 `K1`. `tools/scripts/*.keys` now accepts two spellings — `key H` and
# `verb place` — and both readers had to learn it: `src/editor_run.loft`, which
# calls the gestures directly, and `tools/script.mjs`, which drives a socket. This
# probe is the upper bound of a safe step made concrete: **the old path and the new
# one both run and are compared exactly**, before `K2` converts one real script.
#
# ── ⚠ THE OBVIOUS INSTRUMENT IS BLIND, AND CONTROL `C` IS WHY THIS FILE EXISTS ──
#
# The phase table's own negative control reads *"run one converted script and its
# original and diff the world"*. **Measured, that cannot see the mistake a hand
# conversion actually makes.** `verb_of` maps six keys to one `opening`, so `key P`
# becomes `select 2` + `verb opening` — and getting that number wrong leaves a world
# that is equal **byte for byte**, because `open_ahead` writes `DOOR_MAT` whatever
# the profile is and the head lives in the session's `Opening`. `S1` measured that
# none of the session is in the world format, so no world instrument at any strength
# can answer this. `V1` found the same blindness one layer down.
#
# So the runner grew a session read-back — the second of the two ways out
# [EDITING_MODES § phase 3](../../doc/claude/EDITING_MODES.md) names — and this probe
# checks it against something it SHOULD find (`wrong.keys`) before trusting it to
# report agreement.
#
# ── WHAT EACH CHECK MEANS IF IT FLIPS ─────────────────────────────────────────
#
#   A  the runner: `keyed` and `verbed` leave the same WORLD
#      → red means a verb resolves to a different gesture than its key
#   B  the runner: `keyed` and `verbed` leave the same SCENE
#      → red means a verb resolves to the same gesture with different parameters —
#        the profile case, which A cannot see
#   C  CONTROL — `wrong` leaves the same world as `verbed` and a DIFFERENT scene
#      → the first half red means the store has learned to carry a profile (good
#        news, and this file's argument for B would need rewriting); the second half
#        red means the read-back has gone blind and B is worthless
#   D  CONTROL — a key does NOT re-choose, so the two spellings must leave DIFFERENT
#      standing selections
#      → red means `key O` moved the selection, which is the fork `S3` refused
#   E  CONTROL — an unknown verb is refused out loud in both drivers
#      → red means a typo in a converted script builds a world silently
#   F  the wire: the same pair through the SERVER says the same things AND saves the
#      same world
#      → red means `script.mjs`'s verb table disagrees with its key table. ⚠ **It
#        takes two instruments for the same reason the headless half does, and they
#        are blind in opposite directions**: the sentences name the profile
#        (`opened profile 2`) and say nothing about a material — `do_fence` reports
#        `fenced 42 edges … radius 3` for a fence ring and a wall ring alike — while
#        the saved world knows the material and not the profile.
#
# ⚠ `A` AND `C`'s FIRST HALF ARE THE SAME EQUALITY WITH OPPOSITE MEANINGS, which is
# the point: one says the conversion lost nothing, the other says the instrument
# proving it could not have noticed if it had.
#
# ── ⚠ THE THREE SABOTAGES, RUN, AND TWO OF THEM SETTLE F's SHAPE ──────────────
#
#   `VERBMAP.wall` → `23:3,3`      all SIX sentences identical; the saved world
#   (a wall ring in fence material) differs at byte 54068. Only the world saw it.
#
#   `VERBMAP.opening` → `36:1`     the saved world is byte-identical (same md5);
#   (a fixed profile, not the      the sentence says `opened profile 1` where the
#    selection)                    original said `2`. Only the sentence saw it.
#
#   `editor_run`'s verb branch     A red at the world, B red at the scene, τ 3979
#   wired to a constant            against 3995. The runner's dispatch is
#                                  load-bearing rather than decorative.
#
# The first two are a mirror pair and they are why `F` is two checks: **on the wire
# the sentences name a profile and never a material, and the saved world knows the
# material and not the profile.** Neither could have been argued from the source —
# `do_fence` prints `fenced 42 edges … radius 3` for both rings, and nobody reading
# it notices what is missing.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
WIRE=${K1_WIRE:-1}
PORT=${EDITOR_PORT:-8080}
OUT=probe/k1/out
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

# One run of the headless runner: the saved world's md5, the scene without the
# standing selection, and the selection on its own.
run_headless() {
  SCRIPT=probe/k1/$1.keys WORLD=k1-$1 $LOFT --lib lib/ src/editor_run.loft \
    > "$OUT/$1.log" 2>"$OUT/$1.err"
  # ⚠ THE `editor_run:` FOOTER IS EXCLUDED AND ITS NUMBERS ARE NOT. It carries the
  # script's LINE COUNT and the world's file name, which differ between the twins by
  # construction — a converted script says `select` out loud, so it is longer. The
  # two numbers on it that are claims about the world (chunks and the edit clock) are
  # compared on their own below.
  sed -n '/^session:/,$p' "$OUT/$1.log" \
    | grep -v '^chosen:' | grep -v '^editor_run:' > "$OUT/$1.scene"
  grep '^chosen:' "$OUT/$1.log" > "$OUT/$1.chosen"
  sed -n 's/^editor_run: [0-9]* lines, \([0-9]*\) chunks, τ \([0-9]*\) .*/\1 chunks τ \2/p' \
    "$OUT/$1.log" > "$OUT/$1.tau"
  md5sum < "worlds/k1-$1.hxw" > "$OUT/$1.md5"
}

say "── the headless runner ───────────────────────────────────────────────────"
for s in keyed verbed wrong; do
  run_headless "$s"
  if [ ! -s "$OUT/$s.scene" ]; then
    bad "$s.keys produced no session read-back at all"
    sed -n '1,20p' "$OUT/$s.err"
  fi
done

# ⚠ THE FIXTURE HAS TO HAVE DONE SOMETHING, or every equality below is an assertion
# about two empty worlds agreeing. Six gestures, two of them openings.
if grep -q 'openings 2' "$OUT/keyed.scene"; then
  ok "fixture: the key spelling cut 2 openings and raised a house"
else
  bad "fixture: keyed.keys built no openings — $(head -1 "$OUT/keyed.scene")"
fi

say "A  the same world from both spellings"
if cmp -s "$OUT/keyed.md5" "$OUT/verbed.md5"; then
  ok "keyed and verbed: $(cut -c1-12 < "$OUT/keyed.md5")"
else
  bad "keyed $(cat "$OUT/keyed.md5") vs verbed $(cat "$OUT/verbed.md5")"
fi

if [ -s "$OUT/keyed.tau" ] && cmp -s "$OUT/keyed.tau" "$OUT/verbed.tau"; then
  ok "and the same work to get there: $(cat "$OUT/keyed.tau")"
else
  bad "keyed did [$(cat "$OUT/keyed.tau")] and verbed [$(cat "$OUT/verbed.tau")]"
fi

say "B  the same scene from both spellings"
if diff -u "$OUT/keyed.scene" "$OUT/verbed.scene" > "$OUT/scene.diff"; then
  ok "$(wc -l < "$OUT/keyed.scene") lines of session identical"
else
  bad "the session differs:"; sed -n '1,30p' "$OUT/scene.diff"
fi

say "C  CONTROL — the world cannot see a profile and the scene can"
if cmp -s "$OUT/verbed.md5" "$OUT/wrong.md5"; then
  ok "a round window where a pointed one was meant: same world, byte for byte"
else
  bad "the store now distinguishes two profiles — B's argument needs rewriting"
fi
if diff -q "$OUT/verbed.scene" "$OUT/wrong.scene" > /dev/null 2>&1; then
  bad "the read-back cannot see a wrong profile either — B proves nothing"
else
  ok "the read-back sees it: $(diff "$OUT/verbed.scene" "$OUT/wrong.scene" \
      | grep '^>' | head -1 | cut -c1-72)"
fi

say "D  CONTROL — a key does not re-choose, so the selections must differ"
kc=$(cat "$OUT/keyed.chosen")
vc=$(cat "$OUT/verbed.chosen")
if [ -z "$kc" ] || [ -z "$vc" ]; then
  bad "no standing selection was reported at all"
elif [ "$kc" = "$vc" ]; then
  bad "both spellings ended on '$kc' — a key moved the selection, which S3 refused"
else
  ok "keyed ended on '$kc', verbed on '$vc'"
fi

say "E  CONTROL — an unknown verb is refused out loud (the runner)"
printf 'at 0 0 0\nverb hoist\n' > "$OUT/typo.keys"
SCRIPT="$PWD/$OUT/typo.keys" WORLD=k1-typo $LOFT --lib lib/ src/editor_run.loft \
  > "$OUT/typo.log" 2>&1
if grep -q 'no gesture for hoist' "$OUT/typo.log"; then
  ok "the runner: $(grep -m1 'no gesture' "$OUT/typo.log" | sed 's/^ *//')"
else
  bad "the runner accepted 'verb hoist' silently"
fi

if [ "$WIRE" = "0" ]; then
  say ""
  say "F  the wire — SKIPPED (K1_WIRE=0)"
  say ""
  [ "$fails" -eq 0 ] && say "K1: headless half green" || say "K1: $fails FAILED"
  exit "$fails"
fi

say ""
say "── the wire, through the server ──────────────────────────────────────────"

# ⚠ THE SERVER'S OWN `println` STREAM IS THE INSTRUMENT, NOT `script.mjs`'s output.
# `S2a` measured why: `key` sleeps 250 ms and then reads the LAST status line, so
# which broadcast it catches is a race, and a diff of the driver's transcript reports
# `rebuilt N chunks` moving rather than anything a gesture did.
#
# ⚠ AND A FRESH SERVER PER SCRIPT, WHICH WAS NOT THE FIRST ATTEMPT. Two runs against
# one process differ in every `hex (q,r) — +N −M chunks` line, because the streaming
# set carries over: the second run is told about chunks the first already has. That
# is a fact about a viewer, not about a gesture, and separating them by filtering
# would mean choosing what counts as noise. A new process has no history to carry.
#
# What IS filtered is the bookkeeping a gesture does not decide: the milliseconds a
# rebuild took (a wall clock measures the box), the streaming counts, and the
# connection lines. What is left is what each gesture SAID.
wire_run() {
  make -s port-free > /dev/null 2>&1
  : > "$OUT/$1.server"
  nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/$1.server" 2>&1 &
  wsrv=$!
  for _ in $(seq 1 120); do
    grep -q 'listening on port' "$OUT/$1.server" && break
    kill -0 "$wsrv" 2>/dev/null || break
    sleep 1
  done
  if ! grep -q 'listening on port' "$OUT/$1.server"; then
    bad "the server never listened for $1"
    tail -5 "$OUT/$1.server"
    kill "$wsrv" 2>/dev/null
    return 1
  fi
  node tools/script.mjs "probe/k1/$1.keys" > "$OUT/$1.wire" 2>&1
  # ⚠ AND IT WAITS FOR THE LOG TO SETTLE BEFORE KILLING THE SERVER. The first
  # version did not, and it **silently lost the last gesture of every run** — the
  # second ring never reached the file, so the comparison was over four sentences
  # while reporting twenty-five. `script.mjs` returns 250 ms after its last send and
  # the server is still writing. Stability, not a duration: two equal sizes a second
  # apart, capped.
  prev=-1; same=0
  for _ in $(seq 1 20); do
    now=$(wc -c < "$OUT/$1.server")
    if [ "$now" = "$prev" ]; then
      same=$((same + 1)); [ "$same" -ge 2 ] && break
    else
      same=0
    fi
    prev=$now
    sleep 1
  done
  make -s stop-editor > /dev/null 2>&1
  wait "$wsrv" 2>/dev/null
  # ⚠ FROM `listening on port` ONWARD — everything the server said once it was open
  # for business. Before that line it prints 21 lines of part-library thumbnails, and
  # the first version compared those too: it reported **25 sentences identical** of
  # which only four were anything a gesture did. A count that is mostly boilerplate
  # reads as coverage, which is worse than a small number.
  sed -n '/listening on port/,$p' "$OUT/$1.server" | grep '^editor: ' \
    | grep -vE '^editor: (rebuilt|hex \(|brush |client )' > "$OUT/$1.said"
  # ⚠ EXPLICIT, BECAUSE `grep` EXITS 1 WHEN IT MATCHES NOTHING. Without this the
  # function's status is the last filter's, so the one run that is SUPPOSED to
  # produce an empty capture — the unknown-verb control — reported failure to its
  # caller and had its whole `if` body skipped. It printed a heading and no verdict,
  # which reads as a check that passed.
  return 0
}
wire_run keyed
wire_run verbed

# ⚠ E's SECOND HALF RUNS HERE BECAUSE IT NEEDS A SOCKET. The first draft grepped
# `tools/script.mjs` for the string `no verb` — a check on the source rather than on
# the behaviour, which cannot be surprised by a refusal that is written and never
# reached. `verbed`'s server is already down, so this borrows `keyed`'s wire run:
# the driver must SAY it does not know the verb, and the server must not have been
# asked anything (`undefined` on the wire is a message id of its own kind).
say "E  CONTROL — and the wire driver refuses one too"
printf 'echo --- a verb nobody bound\nverb hoist\n' > probe/k1/typo-wire.keys
wire_run typo-wire
if grep -q "no verb 'hoist'" "$OUT/typo-wire.wire"; then
  ok "the driver: $(grep -m1 "no verb 'hoist'" "$OUT/typo-wire.wire" | sed 's/^ *//')"
else
  bad "tools/script.mjs sent something for 'verb hoist'"
  sed -n '1,10p' "$OUT/typo-wire.wire"
fi
if [ -s "$OUT/typo-wire.said" ]; then
  bad "the server acted on an unknown verb: $(head -1 "$OUT/typo-wire.said")"
else
  ok "and the server was asked nothing"
fi
rm -f probe/k1/typo-wire.keys

say "F  the same sentences from both spellings"
# Two differences are there by construction and both are named rather than tolerated:
# the converted script CHOOSES out loud, which the original never does, and each
# script saves under its own file name so the two worlds can be compared. The save's
# chunk count and return code still compare — only the destination is normalised.
norm() { sed -e 's/-> k1w-[a-z]*/-> <name>/' "$1"; }
grep -v '^editor: opening [0-9]* selected' "$OUT/verbed.said" | norm /dev/stdin \
  > "$OUT/verbed.said.cmp"
norm "$OUT/keyed.said" > "$OUT/keyed.said.cmp"
if [ ! -s "$OUT/keyed.said.cmp" ]; then
  bad "the server said nothing about the key run"
elif diff -u "$OUT/keyed.said.cmp" "$OUT/verbed.said.cmp" > "$OUT/said.diff"; then
  ok "$(wc -l < "$OUT/keyed.said.cmp") sentences identical, including the profiles"
else
  bad "the server said different things:"; sed -n '1,30p' "$OUT/said.diff"
fi

# ⚠ AND THE COMPARISON HAS TO HAVE SEEN EVERY GESTURE, which is not something a diff
# of two truncated files can tell you — two runs cut off at the same place agree
# perfectly. Named one at a time, because the first version of this probe lost the
# LAST gesture of every run to the shutdown and reported the pair identical.
for want in 'house placed' 'opened profile 1' 'opened profile 2'; do
  if grep -q "$want" "$OUT/keyed.said"; then
    ok "the wire said it: $(grep -m1 "$want" "$OUT/keyed.said" | cut -c1-64)"
  else
    bad "nothing on the wire matched '$want' — F is comparing a truncated run"
  fi
done
rings=$(grep -c 'fenced ' "$OUT/keyed.said")
if [ "$rings" = "2" ]; then
  ok "and both rings: $rings"
else
  bad "$rings ring sentences where the script laid 2 — the capture is short"
fi

# ⚠ …AND THE WORLD THE SERVER SAVED, which is the half the sentences cannot judge.
# Two rings differ only in their material and `do_fence` names no material, so a
# `VERBMAP` row pointing `wall` at `23:3,3` would leave every sentence above
# identical. Verified by doing exactly that: F's world row goes red and nothing else
# moves.
if [ ! -s worlds/k1w-keyed.hxw ] || [ ! -s worlds/k1w-verbed.hxw ]; then
  bad "the server saved no world — `save` did not reach it"
elif cmp -s worlds/k1w-keyed.hxw worlds/k1w-verbed.hxw; then
  ok "and the world it saved: $(md5sum < worlds/k1w-keyed.hxw | cut -c1-12), \
$(wc -c < worlds/k1w-keyed.hxw) bytes"
else
  bad "the two spellings saved different worlds — $(cmp worlds/k1w-keyed.hxw \
       worlds/k1w-verbed.hxw 2>&1 | head -1)"
fi

say ""
if [ "$fails" -eq 0 ]; then
  say "K1: both drivers agree, and the instrument that proves it is checked."
else
  say "K1: $fails FAILED"
fi
exit "$fails"
