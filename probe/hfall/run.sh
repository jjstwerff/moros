# H, HEADLESS — the fall, with no browser at all.
#
#   sh probe/hfall/run.sh        (or `make probe-hfall`)
#
# ⚠ **THIS IS A PORT OF `probe/b2`'s `H` BLOCK, AND `H` STAYS.** Move before you
# remove: the browser block keeps the claim that pressing `w` reaches the walk at
# all, which no script can make — `editor_run` speaks verbs and held-key BITS, so it
# skips the keymap layer by design. What moves here is the part that never needed a
# browser: the feet, the landing, and the control.
#
# ⚠ **`wk_fell` LIVED ON THE SHARED WALKER AND WAS PRINTED IN ONE PLACE.**
# `hex_editor::Walker` carries it, `editor_run` holds that walker, and the only line
# in the tree that printed it was the browser client's own summary. So *a fall
# completed* was a browser-only claim by accident of where a `println` was written:
# `H` rebuilt a 7 MB wasm client to read a counter this program had all along.
#
# ── WHAT THE NUMBERS DO AND DO NOT AGREE ON ─────────────────────────────────
#
# Measured against the browser's own `client: local walker` line at the SAME walked
# distance (`step 227`):
#
#     walked   24.219612852397255   ==   24.219612852397255     bit for bit
#     feet      0.5027999999999875  ==    0.5027999999999875    bit for bit
#     landed   28                   !=   34
#
# ⚠ **THE TRAJECTORY IS IDENTICAL AND THE EVENT COUNT IS NOT, AND THAT IS NOT A
# DEFECT.** `fl_landed` is a genuine edge — *this step is the one that touched down*
# — but walking down a slope touches down many times, and how many depends on how
# finely the walk was sampled. The browser presses `w` sixty times over ~1505 frames;
# the idle frames between presses let each micro-fall COMPLETE. Proved rather than
# argued: replaying the same distance as 57 pulses of 4 moving ticks with 21 idle
# ticks between them answers **34** — the browser's number exactly.
#
# ⛔ **SO NEVER ASSERT THE VALUE OF `landed`.** It measures the driver's tick shape,
# not the world. `probe/b2`'s `H2` asks `> 0`, which is right; the obvious
# "improvement" of pinning the count would gate the clock.
set -u
LOFT="${LOFT:-loft}"
ok=1
say() { echo "   $1"; }
no()  { echo "   ✗ $1"; ok=0; }

run() { SCRIPT="tools/scripts/$1.keys" $LOFT --lib lib/ src/editor_run.loft 2>/dev/null \
        | grep -E '^\s*walker ' | tail -1; }

echo "── H headless   raise the ground, walk over it, and fall ───────────"
f_line=$(run hfall)
c_line=$(run hflat)
echo "   fall: $f_line"
echo "   flat: $c_line"

f_feet=$(printf '%s' "$f_line" | sed -n 's/.*feet \([0-9.]*\) .*/\1/p')
f_land=$(printf '%s' "$f_line" | sed -n 's/.*landed \([0-9]*\).*/\1/p')
c_feet=$(printf '%s' "$c_line" | sed -n 's/.*feet \([0-9.]*\) .*/\1/p')
c_land=$(printf '%s' "$c_line" | sed -n 's/.*landed \([0-9]*\).*/\1/p')

if [ -n "$f_feet" ] && [ "$f_feet" != "0" ]; then
  say "H1 the feet left the ground plane: $f_feet world units up"
else
  no "H1 the feet never left 0 (feet '$f_feet') — nothing was under them to climb"
fi

# ⚠ `-gt 0`, NEVER `-eq`. See the header: the count is the driver's, the fact is the
# world's.
if [ -n "$f_land" ] && [ "$f_land" -gt 0 ] 2>/dev/null; then
  say "H2 a fall COMPLETED $f_land time(s) — airborne, then touched down"
else
  no "H2 the feet never landed (landed '$f_land') though they reached $f_feet — a height that merely tracks the terrain is the CLIMB, and a walker still on the crest has had nothing to fall off yet"
fi

# ⚠ THE CONTROL IS ONE LINE DIFFERENT FROM ITS SUBJECT — `hflat.keys` is `hfall.keys`
# without the raise. `probe/b2` takes this control from block `G`'s log, a different
# run of a different block with a different walk in it.
if [ "$c_feet" = "0" ] && [ "$c_land" = "0" ]; then
  say "H3 control: the same walk with nothing raised kept feet 0 and landed 0"
else
  no "H3 the flat walk reported feet '$c_feet' landed '$c_land' — it should have neither, so H1/H2 prove nothing"
fi

echo
[ "$ok" -eq 1 ] && echo "hfall PASS — the fall, its landing and its control, with no browser." \
                || { echo "hfall FAILED"; exit 1; }
