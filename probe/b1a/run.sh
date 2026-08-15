#!/bin/sh
# B1a (plan 22) — DOES THE CLIENT SEND WHAT IT ALWAYS SENT, NOW THAT ITS KEYS
# NAME VERBS?
#
#   probe/b1a/run.sh                 (or `make probe-b1a`)
#   B1A_BASELINE=1 probe/b1a/run.sh  rewrite the committed baseline
#   B1A_SOURCE=<file> …              build a DIFFERENT client (the sabotages)
#
# `src/editor_client.loft` was `W4`'s fourth site: a table saying what a key means
# AND how it travels, in one row. `B1a` splits it — `hex_editor`'s DEFINITION for the
# first half, a local `act` for the second — for the five keys where the definition is
# one-to-one. **The wire must not move.** (It was `hex_editor::verb_of` when this was
# written and it is `verb_in(st.keys, …)` since `M1`/`M4`.)
#
# ⚠ AND THERE IS NO GATE BETWEEN THE CLIENT'S KEYS AND ANYTHING. `make gate` drives
# the SERVER through `tools/script.mjs`; `make client-check` counts colours in a
# picture. Neither presses a key in the client, so both stay green whatever this
# file's table says — which is exactly how a table diverges for months. This probe
# is the only check, and it is `probe/k2`'s shape: the client beside a COMMITTED
# BASELINE of itself, through a server of its own.
#
# ⚠ THE INSTRUMENT IS TWO THINGS, BECAUSE `K1` MEASURED EACH BLIND ON ITS OWN:
#
#   the server's own println stream   sees a raise, a house, an opening's profile
#                                     — and CANNOT see fence versus wall, because
#                                     `do_fence` says the same sentence for both
#   the world the server saved        sees the material — and cannot see a profile,
#                                     because `open_ahead` writes DOOR_MAT whatever
#                                     the kind
set -e
cd "$(dirname "$0")/../.."
LOFT="${LOFT:-loft}"
OUT="probe/b1a/.out"
SRC="${B1A_SOURCE:-src/editor_client.loft}"
PORT="${EDITOR_PORT:-18090}"
PAGE="src/.loft/editor_client.html"
mkdir -p "$OUT"

pass=0; fail=0
ok()  { pass=$((pass + 1)); echo "  ok   $1"; }
bad() { fail=$((fail + 1)); echo "  FAIL $1"; }

# ⚠ THE KEYS ARE THE FIVE `B1a` CONVERTED AND NOTHING ELSE. `O`/`P` are left out
# because the step leaves them alone; `E Q B C L R` have no verb at all, so
# pressing them would only prove that untouched lines are untouched — and the
# transcript would grow noise that hides the rows that matter.
#
# ⚠ TWO UPs AND ONE DOWN, on purpose: raise and lower are exact inverses, so an
# equal count leaves the ground where it started and a swapped pair would be
# INVISIBLE in the saved world. The imbalance is what makes the world able to see
# it, and the sentences see it either way.
SEQ="ArrowUp,ArrowUp,h,f,g,ArrowDown"

echo "── B1a  build the client under test ────────────────────────────────"
echo "   source: $SRC"
$LOFT --html --lib lib/ "$SRC" > "$OUT/build.log" 2>&1 \
  || { echo "B1a FAIL — the client did not build:"; tail -20 "$OUT/build.log"; exit 1; }
# A source outside `src/` emits beside itself; the server serves exactly one path.
built=$(sed -n 's/^wrote \(.*\.html\) .*/\1/p' "$OUT/build.log" | tail -1)
[ -n "$built" ] || { echo "B1a FAIL — the build named no page"; tail -5 "$OUT/build.log"; exit 1; }
case "$built" in
  */src/.loft/editor_client.html) ;;
  *) cp "$built" "$PAGE"; echo "   copied $(basename "$built") into $PAGE" ;;
esac

echo "── B1a  a fresh server, and the browser drives it ──────────────────"
# ⚠ A FRESH SERVER, WHICH IS `K1`'s FINDING NOT A PRECAUTION. Two runs against one
# process differ in every `hex (q,r) — +N −M chunks` line, because the streaming
# set carries over — a fact about a viewer, not about a gesture.
make -s port-free > /dev/null 2>&1 || true
: > "$OUT/server.log"
rm -f worlds/b1a.hxw
nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/server.log" 2>&1 &
srv=$!
# 240 s: these servers are interpreted from source, so the first after any library
# edit recompiles. `V3` measured a 120 s window giving up mid-compile and printing
# four lines of *advice*, which reads as an error whichever happened.
for _ in $(seq 1 240); do
  grep -q 'listening on port' "$OUT/server.log" && break
  kill -0 "$srv" 2>/dev/null || break
  sleep 1
done
if ! grep -q 'listening on port' "$OUT/server.log"; then
  if kill -0 "$srv" 2>/dev/null; then
    echo "B1a FAIL — the server is STILL BUILDING after 240 s"; kill "$srv" 2>/dev/null
  else
    echo "B1a FAIL — the server DIED before it listened:"; tail -20 "$OUT/server.log"
  fi
  exit 1
fi

node probe/b1a/drive.mjs "http://127.0.0.1:$PORT/client" "$SEQ" || {
  echo "B1a FAIL — the browser half did not run"; make -s stop-editor >/dev/null 2>&1; exit 1;
}
# The save comes from a SECOND client, because the browser has no save key.
node tools/script.mjs probe/b1a/save.keys > "$OUT/save.log" 2>&1 || true

# ⚠ WAIT FOR THE LOG TO SETTLE BEFORE KILLING THE SERVER. `K1` lost the last
# gesture of every run this way: the driver returns while the server is still
# writing, and two runs truncated at the same place agree perfectly.
prev=-1; same=0
for _ in $(seq 1 20); do
  now=$(wc -c < "$OUT/server.log")
  if [ "$now" = "$prev" ]; then same=$((same + 1)); [ "$same" -ge 2 ] && break; else same=0; fi
  prev=$now
  sleep 1
done
make -s stop-editor > /dev/null 2>&1 || true
wait "$srv" 2>/dev/null || true

# From `listening on port` onward — before it the server prints 21 lines of part
# thumbnails, and counting those as coverage is `K1`'s "25 sentences of which 21
# were boilerplate". What is filtered after it is bookkeeping no gesture decides.
#
# ⚠ AND THE FIRST FILTER HERE WAS BLIND TO HALF THE STEP. It was copied from
# `probe/k1`, which drops `brush ` — and `brush (10,0) — 2 chunks, 10 dirty` is the
# ONLY thing a raise says. Both arrows vanished and the capture read `3 sentences`
# as if they had never been pressed. **A filter inherited from a probe with a
# different subject is an instrument nobody aimed.**
#
# What is dropped, and why each: `rebuilt … in NNNN ms` is a wall clock, `hex (q,r)
# — +N −M chunks` is the streaming set, and `client …` is per-connection
# bookkeeping whose counters move with how many frames went by.
#
# ⚠ AND THE BRUSH LINE IS TRUNCATED TO ITS CELL, because its tail is a QUEUE
# LENGTH. `brush (10,0) — 4 chunks, 10 dirty` became `… 12 dirty` on a busier box
# **with the saved world byte-identical** — which is the proof, not a suspicion: a
# number that moves while the world does not is not a fact about the gesture. It is
# how much of the dirty set the rebuild had drained by then, and that is a wall
# clock wearing a count's clothes.
#
# ⚠ THE CELL IS KEPT AND THAT IS THE WHOLE POINT. `(10,0)` is what the gesture
# DECIDED; dropping the line entirely is what made the first version blind to both
# arrows. Truncate to the decision, not to nothing.
#
# ⏭ And it costs the transcript its view of raise-versus-lower — both spell
# `brush (10,0)`. That half is the world's: the sequence is two UPs and one DOWN so
# the ground does not return to where it started, and a swapped pair moves the md5.
sed -n '/listening on port/,$p' "$OUT/server.log" | grep '^editor: ' \
  | grep -vE '^editor: (rebuilt|hex \(|client )' \
  | sed 's/^\(editor: brush ([-0-9]*,[-0-9]*)\) .*$/\1/' > "$OUT/said" || true

echo "── B1a  what the server heard ──────────────────────────────────────"
sed 's/^/   /' "$OUT/said"
if [ -f worlds/b1a.hxw ]; then
  md5sum < worlds/b1a.hxw > "$OUT/md5"
  echo "   world: $(cut -c1-12 < "$OUT/md5")  ($(wc -c < worlds/b1a.hxw) bytes)"
else
  echo "   world: NONE — the save did not reach the server"
  : > "$OUT/md5"
fi

if [ "${B1A_BASELINE:-0}" = "1" ]; then
  cp "$OUT/said" probe/b1a/baseline.said
  cp "$OUT/md5"  probe/b1a/baseline.md5
  echo
  echo "B1a BASELINE WRITTEN — $(wc -l < probe/b1a/baseline.said) sentences,"
  echo "  world $(cut -c1-12 < probe/b1a/baseline.md5)"
  exit 0
fi

echo "── B1a  against the committed baseline ─────────────────────────────"
# ⚠ AN EMPTY TRANSCRIPT MUST NOT COMPARE EQUAL TO AN EMPTY TRANSCRIPT. If the
# browser never connected, `said` is empty — and so is a baseline captured the same
# way, so `cmp` would call two failures a match. This tree has shipped a row that
# reported `ok` on a picture with no panel in it.
#
# ⚠ AND IT IS A PRESENCE CHECK PER GESTURE, NOT A COUNT, because a count is what
# was wrong the first time: three sentences looked like a transcript while both
# arrows were missing from it. Each converted key has to be visible AS ITSELF —
# three brushes for the three arrows, a house for `h`, two rings for `f` and `g`.
nb=$(grep -c '^editor: brush ' "$OUT/said" || true)
nh=$(grep -c '^editor: house ' "$OUT/said" || true)
nf=$(grep -c '^editor: fenced ' "$OUT/said" || true)
echo "   brush $nb (want 3) · house $nh (want 1) · fenced $nf (want 2)"
if [ "$nb" -eq 3 ] && [ "$nh" -eq 1 ] && [ "$nf" -eq 2 ]; then
  ok "every converted key is visible in the transcript as itself"
else
  bad "a converted key left no trace — the wire below cannot be compared"
fi
if cmp -s "$OUT/said" probe/b1a/baseline.said; then
  ok "the server heard EXACTLY what it heard before the keys named verbs"
else
  bad "the server heard something else:"
  diff probe/b1a/baseline.said "$OUT/said" | sed 's/^/       /' || true
fi
if [ ! -s "$OUT/md5" ]; then
  bad "no world was saved, so the material half is unmeasured"
elif cmp -s "$OUT/md5" probe/b1a/baseline.md5; then
  ok "and the world it saved: $(cut -c1-12 < "$OUT/md5")"
else
  bad "the saved world differs — $(cut -c1-12 < probe/b1a/baseline.md5) then $(cut -c1-12 < "$OUT/md5")"
fi

echo
if [ "$fail" -eq 0 ]; then echo "B1a PASS — $pass checks"; else echo "B1a FAIL — $fail of $((pass + fail))"; fi
[ "$fail" -eq 0 ]
