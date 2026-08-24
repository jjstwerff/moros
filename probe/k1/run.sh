#!/bin/sh
# K1 — CAN ANYTHING HERE SEE A WRONG PROFILE, AND DOES A WORD NEITHER DRIVER KNOWS
# FAIL THE RUN?
#
#   sh probe/k1/run.sh            # both drivers
#   K1_WIRE=0 sh probe/k1/run.sh  # the headless half only, no port
#
# ⛔ **THIS FILE ASKED A DIFFERENT QUESTION UNTIL 2026-08-16, AND THE QUESTION IS
# ANSWERED — plan 22 `K3b`.** It was *does a script saying `verb` build what the same
# script saying `key` built?*, and it existed to be the upper bound of a safe step:
# the old path and the new one both running and compared exactly, before `K2`
# converted one real script. `K2a`, `K2b` and `K3` converted all of them, `K3b`
# deleted the `key` branch from both readers, and a comparison needs two things.
#
# **What retired with the spelling**, named so nobody looks for it:
#
#   A/B  `keyed` and `verbed` leave the same world and the same scene
#   G    a key no longer carries a PROFILE (`carried.keys`: choose 2, press `O`)
#   D    …and a key does not RE-choose
#   F    the same pair through the SERVER says the same things and saves one world
#
# ⚠ **`A` AND `B` HAD BEEN RED SINCE `S3` COLLAPSED THE OPENING KEYS, AND THAT IS THE
# LESSON WORTH MORE THAN THE CHECKS.** `keyed.keys` pressed `key P`, one of the eight
# keys the collapse left bound to nothing, so it built **openings 1, τ 3994** against
# `verbed`'s **2, τ 3995** — measured on HEAD, under the probe's own conditions,
# before it was attributed to anything. It stayed red for days because `probe-verbs`
# is in neither `make fast` nor `make gate`: **a manual probe is an instrument nobody
# reads.** `probe/b1b/auth.sh` `B9` was the same story in the same week.
#
# ⚠ **AND `D`'s CLAIM DID NOT RETIRE — IT MOVED.** *A gesture does not move the
# standing selection* is a library rule, and every test in `opening.loft` chose once
# and cut once, so all of them were satisfied by a gesture that CONSUMES its choice.
# It is `test_a_gesture_does_not_move_the_standing_selection` now, seen red on a
# sabotage that resets the kind after each cut — with the other 17 green, which is
# what says the gap was real. **Move before you remove.**
#
# ── WHAT EACH CHECK MEANS IF IT FLIPS ─────────────────────────────────────────
#
#   C  `wrong` leaves the same world as `verbed` and a DIFFERENT scene
#      → the first half red means the STORE has learned to carry a profile — good
#        news, and every ⚠ in this tree about the world being blind to one would need
#        rewriting; the second half red means the session read-back has gone blind,
#        and with it the only instrument that can see a mis-transcribed kind
#   E  an unknown verb is refused out loud AND fails the run, in BOTH drivers
#      → red means a typo in a script builds a world silently, or builds nothing and
#        reports success
#
# ⚠ **`C` IS WHY THIS FILE OUTLIVED ITS OWN QUESTION.** The phase table's negative
# control read *"run one converted script and its original and diff the world"*, and
# measured, that cannot see the mistake a hand conversion actually makes: six keys
# named one `opening`, so getting the kind wrong leaves a world equal **byte for
# byte** — `open_ahead` writes `DOOR_MAT` whatever the profile and the head lives in
# the session's `Opening`. `S1` measured that none of the session is in the world
# format, so no world instrument at any strength can answer it. The runner grew a
# session read-back for that, and this checks it against something it SHOULD find
# (`wrong.keys`) before trusting it to report agreement.
#
# ⚠ **AND `E` IS THE FLOOR UNDER THE DELETION ABOVE.** With `key` gone from both
# readers a stale `key H` is an unknown word, and an unknown word that exits 0 is a
# silent no-op in a run that reports success. Both readers printed a complaint and
# exited **0** until the day before this file changed — `K3a` on `src/editor_run.loft`
# and `K3b.1` on `tools/script.mjs`, each measured at rc=0 first. ⚠ This check was
# written against the COMPLAINT alone and could not have seen either.
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
  # script's LINE COUNT and the world's file name, which are properties of the file
  # rather than of what it built. The two numbers on it that are claims about the
  # world (chunks and the edit clock) are pulled out on their own below.
  sed -n '/^session:/,$p' "$OUT/$1.log" \
    | grep -v '^chosen:' | grep -v '^editor_run:' > "$OUT/$1.scene"
  grep '^chosen:' "$OUT/$1.log" > "$OUT/$1.chosen"
  sed -n 's/^editor_run: [0-9]* lines, \([0-9]*\) chunks, τ \([0-9]*\) .*/\1 chunks τ \2/p' \
    "$OUT/$1.log" > "$OUT/$1.tau"
  md5sum < "worlds/k1-$1.hxw" > "$OUT/$1.md5"
}

say "── the headless runner ───────────────────────────────────────────────────"
for s in verbed wrong; do
  run_headless "$s"
  if [ ! -s "$OUT/$s.scene" ]; then
    bad "$s.keys produced no session read-back at all"
    sed -n '1,20p' "$OUT/$s.err"
  fi
done

# ⚠ THE FIXTURE HAS TO HAVE DONE SOMETHING, or `C` below is an assertion about two
# empty worlds agreeing. Six gestures, two of them openings — and it is `verbed` that
# is asserted rather than `wrong`, because they differ only in a kind and this is the
# side `C` treats as correct.
if grep -q 'openings 2' "$OUT/verbed.scene"; then
  ok "fixture: verbed.keys cut 2 openings and raised a house"
else
  bad "fixture: verbed.keys built no openings — $(head -1 "$OUT/verbed.scene")"
fi

say "C  the world cannot see a profile and the scene can"
if cmp -s "$OUT/verbed.md5" "$OUT/wrong.md5"; then
  ok "a round window where a pointed one was meant: same world, byte for byte \
($(cut -c1-12 < "$OUT/verbed.md5"))"
else
  bad "the store now distinguishes two profiles — every note in this tree about the \
world being blind to one needs rewriting"
fi
if diff -q "$OUT/verbed.scene" "$OUT/wrong.scene" > /dev/null 2>&1; then
  bad "the read-back cannot see a wrong profile either — nothing here can"
else
  ok "the read-back sees it: $(diff "$OUT/verbed.scene" "$OUT/wrong.scene" \
      | grep '^>' | head -1 | cut -c1-72)"
fi
# ⚠ AND THE EDIT CLOCK IS THE THIRD ANSWER, NAMED RATHER THAN ASSUMED. Two openings
# of different kinds cost the same writes, so `w_tau` agrees as flatly as the bytes
# do — worth stating, because a reader reaching for a cheap discriminator reaches for
# this one first.
if cmp -s "$OUT/verbed.tau" "$OUT/wrong.tau"; then
  ok "…and the edit clock cannot see it either: $(cat "$OUT/verbed.tau")"
else
  bad "the clock separates two profiles — [$(cat "$OUT/verbed.tau")] vs \
[$(cat "$OUT/wrong.tau")] — which contradicts the byte equality above"
fi

say "E  an unknown verb is refused out loud, and the run FAILS (the runner)"
printf 'at 0 0 0\nverb hoist\n' > "$OUT/typo.keys"
SCRIPT="$PWD/$OUT/typo.keys" WORLD=k1-typo $LOFT --lib lib/ src/editor_run.loft \
  > "$OUT/typo.log" 2>&1
trc=$?
if grep -q 'no gesture for hoist' "$OUT/typo.log"; then
  ok "the runner: $(grep -m1 'no gesture' "$OUT/typo.log" | sed 's/^ *//')"
else
  bad "the runner accepted 'verb hoist' silently"
fi
# ⚠ **OUT LOUD IS NOT ENOUGH — THE RUN HAS TO FAIL**, and this half is `K3a`. The
# complaint went to stdout and the process exited 0 for as long as the runner had
# existed, so a caller checking rc was told the script ran.
if [ "$trc" -ne 0 ]; then
  ok "…and the run FAILED on it: rc=$trc"
else
  bad "the runner printed its complaint and exited 0 — a lost line reads as success"
fi
# ⚠ AND THE WORD THE DELETION CREATED, ASKED DIRECTLY — plan 22 `K3b`. `key H` was
# valid vocabulary in this reader until the branch went; every converted script in
# the tree would fail the same way if one line had been missed, which is the whole
# reason the guard above had to land first.
printf 'at 0 0 0\nkey H\n' > "$OUT/stale.keys"
SCRIPT="$PWD/$OUT/stale.keys" WORLD=k1-stale $LOFT --lib lib/ src/editor_run.loft \
  > "$OUT/stale.log" 2>&1
src=$?
if grep -q "unknown command 'key'" "$OUT/stale.log" && [ "$src" -ne 0 ]; then
  ok "a stale \`key H\` is an unknown word and fails: rc=$src"
else
  bad "\`key H\` left rc=$src saying '$(grep -m1 'unknown command' "$OUT/stale.log" \
      | sed 's/^ *//')' — the key spelling is still readable here"
fi

if [ "$WIRE" = "0" ]; then
  say ""
  say "E  the wire half — SKIPPED (K1_WIRE=0)"
  say ""
  [ "$fails" -eq 0 ] && say "K1: headless half green" || say "K1: $fails FAILED"
  exit "$fails"
fi

say ""
say "── the wire, through the server ──────────────────────────────────────────"

# ⚠ ONE SERVER, WHERE THIS USED TO START THREE. `F` compared two spellings through
# the socket and retired with them; what is left needs a socket for one reason — a
# driver's refusal is only a real refusal if the server was not asked.
#
# ⚠ A FRESH SERVER PER SCRIPT WAS NOT THE FIRST ATTEMPT, and the reason survives for
# whoever adds a second run here: two runs against one process differ in every
# `hex (q,r) — +N −M chunks` line, because the streaming set carries over and the
# second run is told about chunks the first already has. That is a fact about a
# viewer, not about a gesture.
wire_run() {
  make -s port-free > /dev/null 2>&1
  : > "$OUT/$1.server"
  nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/$1.server" 2>&1 &
  wsrv=$!
  # ⚠ 240 s, NOT 120 — and the reason is a measurement. These servers are
  # INTERPRETED from source, so the first one after any library edit recompiles; a
  # run gave up at 120 s with its log ending mid-advice while the run three minutes
  # later listened fine. A window that is sometimes long enough is a flake generator,
  # and this tree already pays for those.
  for _ in $(seq 1 240); do
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
  # ⚠ THE DRIVER'S EXIT CODE IS KEPT, NOT DISCARDED — plan 22 `K3b.1`. The check
  # below asserts it, and a `wire_run` that threw it away could only ever check what
  # the driver PRINTED.
  node tools/script.mjs "probe/k1/$1.keys" > "$OUT/$1.wire" 2>&1
  echo $? > "$OUT/$1.rc"
  # ⚠ AND IT WAITS FOR THE LOG TO SETTLE BEFORE KILLING THE SERVER. The first version
  # did not, and it **silently lost the last gesture of every run**: `script.mjs`
  # returns 250 ms after its last send and the server is still writing. Stability,
  # not a duration — two equal sizes a second apart, capped.
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
  # an earlier version compared those too: it reported **25 sentences identical** of
  # which four were anything a gesture did. A count that is mostly boilerplate reads
  # as coverage, which is worse than a small number.
  # ⚠ `no gesture for` IS EXCLUDED BECAUSE A REFUSAL IS NOT THE SERVER ACTING, and
  # leaving it in is what made row E red for four days (see there). It is not swept
  # under the filter: row E asserts it is PRESENT, which the filter cannot do.
  sed -n '/listening on port/,$p' "$OUT/$1.server" | grep '^editor: ' \
    | grep -vE '^editor: (rebuilt|hex \(|brush |client |no gesture for )' > "$OUT/$1.said"
  # ⚠ EXPLICIT, BECAUSE `grep` EXITS 1 WHEN IT MATCHES NOTHING. Without this the
  # function's status is the last filter's, so the run that is SUPPOSED to produce an
  # empty capture — this one — reported failure to its caller and had its whole `if`
  # body skipped. It printed a heading and no verdict, which reads as a check that
  # passed.
  return 0
}

say "E  …and the wire driver refuses one too, and fails"
printf 'echo --- a verb nobody bound\nverb hoist\n' > probe/k1/typo-wire.keys
wire_run typo-wire
if grep -q "no verb 'hoist'" "$OUT/typo-wire.wire"; then
  ok "the driver: $(grep -m1 "no verb 'hoist'" "$OUT/typo-wire.wire" | sed 's/^ *//')"
else
  bad "tools/script.mjs sent something for 'verb hoist'"
  sed -n '1,10p' "$OUT/typo-wire.wire"
fi
# ⚠ THE SERVER IS THE NON-CIRCULAR HALF: the driver's own complaint proves only what
# the driver thinks.
#
# ⛔ **THIS ROW ASSERTED A DESIGN THAT WAS DELIBERATELY REPLACED, AND WENT RED FOR FOUR
# DAYS UNSEEN.** It read *"and the server was asked nothing"* — written 2026-08-12,
# when `script.mjs` held a constant verb table and refused an unknown word locally.
# `T1d` (2026-08-20) changed that on purpose: a house type declares verbs no compiler
# ever saw, so a table cannot have a row for them, and the word now travels verbatim on
# `55:` for the SERVER to resolve. The server then prints `no gesture for hoist` — its
# refusal — which this row read as *the server acted*.
#
# ⚠ **SO THE CLAIM IS REWRITTEN RATHER THAN THE FILTER WIDENED.** Being asked is no
# longer the fault; ACTING is. And the refusal must be PRESENT, because the old shape
# asked only whether a capture was empty — a question whose default answer is *pass*,
# so a server that silently swallowed an unknown verb would have satisfied it.
if [ -s "$OUT/typo-wire.said" ]; then
  bad "the server ACTED on an unknown verb: $(head -1 "$OUT/typo-wire.said")"
else
  ok "the server did not act on it"
fi
#
# ── THE SWEEP THAT CHECKED THESE TWO, 2026-08-24 ────────────────────────────
#
#   row 0  control                          all four ok
#   row 1  the server's refusal `println`   ONLY "refused BY NAME" red
#          deleted — a SILENT server
#   row 2  `hoist` routed to `raise` — a    all four red, incl.
#          server that genuinely ACTS       "the server ACTED: editor: hoist: 1"
#   control  restored                       all four ok
#
# ⚠ **ROW 1 IS WHY THE SECOND CHECK EXISTS.** A silent server passes every other row
# here — the driver still complains, the run still fails, nothing was acted on — and
# before this half was added it passed row E outright. The two checks are
# INDEPENDENTLY sensitive, which is what makes them two checks rather than one written
# twice.
if grep -q '^editor: no gesture for hoist$' "$OUT/typo-wire.server"; then
  ok "…and refused it BY NAME: no gesture for hoist"
else
  bad "the server never said it refused 'hoist' — silence is not a refusal, and this"
  bad "  row cannot tell it apart from a server that quietly did nothing"
fi
# ⚠ `K3b.1`, and it is `K3a`'s finding rebuilt in JavaScript. Measured against a real
# server before the guard was written: `verb hoist` printed `!! no verb 'hoist'` and
# came back **rc=0**. A driver that says it does not know a word and then reports
# success is the one thing a script corpus cannot survive a vocabulary change with.
wrc=$(cat "$OUT/typo-wire.rc" 2>/dev/null)
if [ "${wrc:-0}" -ne 0 ] 2>/dev/null; then
  ok "…and the wire driver FAILED the run too: rc=$wrc"
else
  bad "tools/script.mjs printed its complaint and exited ${wrc:-0}"
fi
rm -f probe/k1/typo-wire.keys

say ""
if [ "$fails" -eq 0 ]; then
  say "K1: the read-back sees what the world cannot, and neither driver survives a typo."
else
  say "K1: $fails FAILED"
fi
exit "$fails"
