#!/bin/sh
# T4 — THE HEADLESS RUNNER BUILDS THE SERVER'S WORLD, TO THE BYTE.
#
#   sh probe/t4/run.sh
#
# Plan 22 `T4`, [WALK_TICK.md](../../doc/claude/WALK_TICK.md). `send 6:` LEVEL is a
# performed message now, so the pad `deck.keys` lays by WALKING can be laid with no
# server, no socket, no browser and no clock — which is the whole `T` sequence's claim
# and the acceptance the design has carried since `T0`.
#
# ── ⚠ THE OTHER SIDE OF EACH COMPARISON IS A RECORDED CONSTANT, AND THAT IS A CHOICE ──
#
# Rows A and B compare against md5s that a NATIVE SERVER produced, recorded in
# [probe/t1/README.md](../t1/README.md). They are constants here because re-deriving
# them costs a native build and a live socket — minutes — and this probe runs inside
# `make fast`. **`sh probe/t1/run.sh <script> <world>` is how the server's side is
# re-measured**, and it is the thing to run if a row here ever goes red for a reason
# that turns out to be the server's rather than the runner's.
#
# ⚠ **AND THAT IS WHY ROWS C AND D EXIST.** A constant compared against a program that
# writes nothing is satisfied the day the world stops being written at all — so C shows
# the number MOVES when the walk is shortened, and D shows it moves when the levelling
# is taken out. Without them, two green rows would be a pair of md5s agreeing about
# emptiness.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/t4/out
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

# The server's, from `probe/t1/README.md` — `sh probe/t1/run.sh` is how they were made.
DECK=cea971a07899e420b344c0054567f4e1
CELLAR=c96b2ce7a569fa2dd88577a71a507f48

JOBS=${T4_JOBS:-6}
started=0

launch() {       # launch <script-path> <world-name>
  ( GROUND=0 SCRIPT="$1" WORLD="$2" $LOFT --lib lib/ src/editor_run.loft \
      > "$OUT/$2.log" 2>"$OUT/$2.err"
    echo $? > "$OUT/$2.rc"
    md5sum < "worlds/$2.hxw" 2>/dev/null | cut -d' ' -f1 > "$OUT/$2.md5" ) &
  started=$((started + 1))
  if [ "$((started % JOBS))" -eq 0 ]; then wait; fi
}

rc_of()  { cat "$OUT/$1.rc"; }
md5_of() { cat "$OUT/$1.md5"; }
bads_of() {
  grep '^editor_run: ' "$OUT/$1.log" \
    | grep -vc '^editor_run: world \|^editor_run: [0-9][0-9]* lines,'
}

# C and D: the two controls, each one line away from the acceptance fixture.
sed 's/^step 90$/step 45/'   probe/t1/deck_full.keys > "$OUT/short.keys"
grep -v '^send 6:'           probe/t1/deck_full.keys > "$OUT/nolevel.keys"

launch probe/t1/deck_full.keys   t4-deck
launch probe/t1/cellar_full.keys t4-cellar
launch "$PWD/$OUT/short.keys"    t4-short
launch "$PWD/$OUT/nolevel.keys"  t4-nolevel
launch probe/t4/release.keys     t4-release
launch tools/scripts/deck.keys   t4-live-deck
launch tools/scripts/cellar.keys t4-live-cellar
wait

say "A  \`deck.keys\` headless == the server's world — a 90-tick walk with levelling ON"
# ⛔ THE NUMBER THIS DESIGN HAS CARRIED SINCE `T0`. A long walk is where the clock gets
# into the world, and `T0` measured this script sitting one to two ticks above a cliff at
# the default rate; at `rate 0` the walk is exactly 90 ticks by construction, on the
# server and here alike, and there is no clock in this program at all.
if [ "$(rc_of t4-deck)" -ne 0 ]; then
  bad "the run failed (rc=$(rc_of t4-deck)): $(grep -m1 '^editor_run: ' "$OUT/t4-deck.log" | cut -c1-90)"
elif [ "$(md5_of t4-deck)" = "$DECK" ]; then
  ok "$DECK — headless, no server, no socket, no clock"
else
  bad "$(md5_of t4-deck) against the server's $DECK"
fi

say ""
say "B  \`cellar.keys\` headless == the server's world — four TELEPORTS with levelling ON"
# ⚠ A DIFFERENT HALF, WHICH IS WHY IT IS A SECOND ROW AND NOT A SECOND RUN OF THE FIRST.
# `T1` moved the level stamp out of the streaming pass, which changes exactly what a
# teleport does: an `at` into a new cell while levelling used to stamp a pad on arrival
# with no tick at all, and the tick after it does now. This script is four of those.
if [ "$(rc_of t4-cellar)" -ne 0 ]; then
  bad "the run failed (rc=$(rc_of t4-cellar)): $(grep -m1 '^editor_run: ' "$OUT/t4-cellar.log" | cut -c1-90)"
elif [ "$(md5_of t4-cellar)" = "$CELLAR" ]; then
  ok "$CELLAR — and its five \`feet\` stations print"
else
  bad "$(md5_of t4-cellar) against the server's $CELLAR"
fi

say ""
say "C  the instrument is not blind — a SHORTER walk moves the world"
# ⚠ `probe/t1` ROW 2, ASKED OF THIS DRIVER. Without it, row A is satisfied by any world
# that happens to hash to a constant, including one nothing walked in.
if [ "$(md5_of t4-short)" = "$DECK" ]; then
  bad "\`step 45\` keyed the same world as \`step 90\` — this fixture cannot see the walk, \
so row A is a coincidence"
else
  ok "\`step 45\` -> $(md5_of t4-short), against \`step 90\`'s $DECK"
fi

say ""
say "D  …and the LEVELLING is what writes it — the walk alone would key nothing new"
# ⛔ THE CONTROL PROBE 4 EARNED. `deck.keys` answers `cea971a0…` to three different
# collision-proxy policies, because nothing in it blocks; the thing it CAN see is the
# stamp. With both `send 6:` lines gone the walk still happens and writes nothing, so a
# moved md5 here is the levelling being reached — and an unmoved one would mean this
# whole acceptance is about a storey and a raise.
if [ "$(md5_of t4-nolevel)" = "$DECK" ]; then
  bad "the same world with no \`send 6:\` at all — the pad in row A is not being laid \
by levelling, and the acceptance is measuring something else"
else
  ok "no \`send 6:\` -> $(md5_of t4-nolevel): the pad is the levelling's"
fi

say ""
say "E  the two live scripts run CLEAN — the last refusals are gone"
# ⛔ `deck.keys` HAS EXITED 101 SINCE `K3c` REFUSED ITS `send 6:`, and `cellar.keys` since
# the same day. ⚠ **THE COMPLAINT COUNT IS THE ASSERTION, NOT THE EXIT CODE** — a runner
# that stopped counting bad lines would exit 0 for every script in the tree.
for s in deck cellar; do
  n=$(bads_of "t4-live-$s")
  if [ "$(rc_of "t4-live-$s")" -eq 0 ] && [ "$n" -eq 0 ]; then
    ok "$s.keys: rc=0, 0 complaints (it printed 2 the day before this step)"
  else
    bad "$s.keys: rc=$(rc_of "t4-live-$s"), $n complaints — \
$(grep -m1 '^editor_run: ' "$OUT/t4-live-$s.log" | cut -c1-80)"
  fi
done

say ""
say "F  the RELEASE puts the feet back on the ground — the half A and B cannot see"
# ⛔ **THE SWEEP FOUND THIS ROW, NOT THE DESIGN.** Dropping `level_off`'s second clause —
# it clears the mode AND puts the feet down — leaves BOTH acceptance worlds byte-identical
# and all five of `cellar`'s `feet` stations unmoved, so three green rows were sitting
# over an untested clause. Levelling brings the ground TO the feet, so where a walk just
# levelled the release is a no-op; and every `feet` in `cellar.keys` follows a teleport,
# which re-reads the ground itself. `release.keys` freezes on the flat and teleports onto
# a hill, which is the one arrangement where the two heights differ and nothing has
# re-read them.
rel=$(sed -n 's/^  feet //p' "$OUT/t4-release.log" | tail -1)
if [ "$(rc_of t4-release)" -ne 0 ] || [ -z "$rel" ]; then
  bad "the release fixture did not run (rc=$(rc_of t4-release), feet [$rel])"
elif [ "${rel%% *}" = "0" ]; then
  bad "feet [$rel] — the release left them at the FROZEN height, standing inside the \
hill they were teleported onto: \`level_off\` cleared the mode and not the feet"
else
  ok "feet [$rel] — the hill's own surface, read back through the mesher"
fi

say ""
if [ "$fails" -eq 0 ]; then
  say "T4: green — one script, two drivers, one world, and no clock in either"
else
  say "T4: $fails FAILED"
fi
[ "$fails" -eq 0 ]
