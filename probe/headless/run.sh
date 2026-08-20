# THE STORE CLAIMS OF `probe/b2`, WITH NO BROWSER AT ALL.
#
#   sh probe/headless/run.sh        (or `make probe-headless`)
#
# ⚠ **THESE ARE PORTS, AND EVERY BLOCK THEY CAME FROM STAYS.** Move before you
# remove. What the browser keeps is the claim no script can make — that pressing a
# KEY reaches a verb — because `editor_run` speaks verbs and held-key BITS and skips
# the keymap layer by design. What moved here is everything that never needed a
# browser: cells written, worlds keyed, refusals worded, feet, landings.
#
# ⚠ **WHY IT IS WORTH DOING.** One `probe-demo` boots a browser sixteen times and
# rebuilds a 7 MB wasm client first. These seven scripts run in seconds, in `make
# fast`, and they can be sabotaged without a rebuild — which is what made the browser
# rows expensive to trust rather than merely slow.
#
# ── ⛔ WHAT A CLAIM HERE MAY NOT BE ─────────────────────────────────────────
#
# **Never the value of a per-tick counter.** `landed` and the client's `lv_stamped`
# both count TICKS in a state, so their value is a fact about the driver's sampling
# and not about the world. Measured: at an identical walked distance the browser
# answers `landed 34` and a held-key script answers `28` — and replaying the same
# distance as pulses of moving-then-idle ticks answers 34 exactly. So `> 0`, never
# `-eq`. A world KEY is the honest instrument: it is what was emitted.
set -u
LOFT="${LOFT:-loft}"
ok=1
say() { echo "   $1"; }
no()  { echo "   ✗ $1"; ok=0; }
run() { SCRIPT="tools/scripts/$1.keys" $LOFT --lib lib/ src/editor_run.loft 2>/dev/null \
        | grep -vE '^[[:space:]]*(advice|[0-9]+ \|)'; }
key() { printf '%s' "$1" | grep -m1 -oE 'editor_run: world [0-9]+:[0-9]+' | awk '{print $3}'; }
# ⚠ THE LAST WALKER LINE, NOT THE FIRST. `hfall.keys` reports once after the raise
# and once after the walk, and the first one is necessarily feet 0 landed 0 — reading
# it scores the fixture's STARTING state as the result. Cost two red rows to notice,
# in a runner whose own header is about instruments that answer the wrong question.
walker() { printf '%s' "$1" | grep '^[[:space:]]*walker ' | tail -1 ; }

echo "── H   raise the ground, walk over it, and fall ────────────────────"
h_o=$(run hfall); c_o=$(run hflat)
h_feet=$(walker "$h_o" | sed -n 's/.*feet \([0-9.]*\) .*/\1/p')
h_land=$(walker "$h_o" | sed -n 's/.*landed \([0-9]*\).*/\1/p')
c_feet=$(walker "$c_o" | sed -n 's/.*feet \([0-9.]*\) .*/\1/p')
c_land=$(walker "$c_o" | sed -n 's/.*landed \([0-9]*\).*/\1/p')
[ -n "$h_feet" ] && [ "$h_feet" != "0" ] \
  && say "H1 the feet left the ground plane: $h_feet world units up" \
  || no "H1 the feet never left 0 (feet '$h_feet') — nothing was under them to climb"
# ⚠ `-gt 0`, NEVER `-eq`. See the header.
{ [ -n "$h_land" ] && [ "$h_land" -gt 0 ] 2>/dev/null; } \
  && say "H2 a fall COMPLETED $h_land time(s) — airborne, then touched down" \
  || no "H2 the feet never landed (landed '$h_land') though they reached $h_feet — a height that merely tracks the terrain is the CLIMB"
{ [ "$c_feet" = "0" ] && [ "$c_land" = "0" ]; } \
  && say "H3 control: the same walk with nothing raised kept feet 0 and landed 0" \
  || no "H3 the flat walk reported feet '$c_feet' landed '$c_land' — H1/H2 prove nothing"

echo
echo "── F   turn, and build a house where it was refused ────────────────"
f_o=$(run bf); f_key=$(key "$f_o")
printf '%s' "$f_o" | grep -q 'no mitred corners' \
  && say "F1 at boot the facing was refused: $(printf '%s' "$f_o" | grep -m1 -oE 'rot [0-9]+ of [0-9]+')" \
  || no "F1 the boot facing was NOT refused — the turn below proves nothing"
f_cells=$(printf '%s' "$f_o" | grep -m1 -oE 'house placed [0-9]+ cells' | grep -oE '[0-9]+')
{ [ -n "$f_cells" ] && [ "$f_cells" -gt 0 ] 2>/dev/null; } \
  && say "F3 after ONE turn the same verb built: $f_cells cells · world $f_key" \
  || no "F3 the house never landed after the turn"

echo
echo "── Q   choose a part, and place THAT instead of a house ────────────"
q_o=$(run bq); q_key=$(key "$q_o")
printf '%s' "$q_o" | grep -q "placed 'door/doorway'" \
  && say "Q1 chosen: $(printf '%s' "$q_o" | grep -m1 -oE "placed '[^']*' — [0-9]+ cells")" \
  || no "Q1 the selection never reached the verb — no part was placed"
# ⚠ SAME VERB, SAME FACING, DIFFERENT SELECTION. A different world is the
# selection's doing and nothing else's, which is why `bq` turns exactly as `bf` does.
[ -n "$q_key" ] && [ "$q_key" != "$f_key" ] \
  && say "Q2 …and it is not F's house: $q_key against $f_key" \
  || no "Q2 the part built F's world ($q_key) — the selection changed nothing"

echo
echo "── G   walk, and place a house somewhere else ──────────────────────"
g_o=$(run bg); g_key=$(key "$g_o")
g_walked=$(walker "$g_o" | sed -n 's/.*walked \([0-9.]*\) .*/\1/p')
{ [ -n "$g_walked" ] && [ "${g_walked%%.*}" -gt 0 ] 2>/dev/null; } \
  && say "G1 walked $g_walked world units before placing" \
  || no "G1 the walk moved nothing (walked '$g_walked')"
[ -n "$g_key" ] && [ "$g_key" != "$f_key" ] \
  && say "G2 …and the house landed elsewhere: $g_key against F's $f_key" \
  || no "G2 the walked house built F's world — the walk moved the author but not the house"

echo
echo "── R   start a run, walk, and close it ─────────────────────────────"
r_o=$(run br)
printf '%s' "$r_o" | grep -q 'road started' \
  && say "R1 the run key reached a gesture: $(printf '%s' "$r_o" | grep -m1 -oE 'road started at [0-9,-]*')" \
  || no "R1 the run never opened"
r_edges=$(printf '%s' "$r_o" | grep -m1 -oE 'wall laid [0-9]+ edges' | grep -oE '[0-9]+')
{ [ -n "$r_edges" ] && [ "$r_edges" -gt 0 ] 2>/dev/null; } \
  && say "R2 …and the second press LAID it: $r_edges edges · world $(key "$r_o")" \
  || no "R2 the run opened and never closed — nothing was laid"

echo
echo "── B   a storey above, and a cellar told why not ───────────────────"
b_o=$(run bb)
# ⚠ THE NUMBER BEFORE `cells`, AND THE OBVIOUS EXTRACTION TAKES THE WRONG ONE.
# `storey +1 on 19 cells` holds two numbers and `grep -oE '[0-9]+' | head -1` answers
# **1** — the `+1` — which is greater than zero, so the row PASSED while printing a
# figure that was never the cell count. A check that passes with the wrong number in
# its own sentence is worse than one that fails.
b_cells=$(printf '%s' "$b_o" | sed -n 's/.*storey +1 on \([0-9]*\) cells.*/\1/p' | head -1)
{ [ -n "$b_cells" ] && [ "$b_cells" -gt 0 ] 2>/dev/null; } \
  && say "B2 the storey wrote the disc: $b_cells cells · world $(key "$b_o")" \
  || no "B2 the storey wrote nothing"
# ⚠ THE REASON, NOT THE REFUSAL. A bare no is what §C2 forbids, and a gate that only
# checked for `refused:` would pass a blank one.
b_why=$(printf '%s' "$b_o" | grep -m1 -oE 'refused: storey refused \(-2\)[^$]*' | head -1)
[ -n "$b_why" ] \
  && say "B3 and the cellar got the library's OWN reason: ${b_why#refused: }" \
  || no "B3 the cellar refused without a reason, or did not refuse at all"

echo
echo "── L   level while walking, and cut the raised ground ──────────────"
l_o=$(run bl); lc_o=$(run bl_flat)
l_key=$(key "$l_o"); lc_key=$(key "$lc_o")
printf '%s' "$l_o" | grep -q 'level true at height' \
  && say "L1 the walker froze a grade: $(printf '%s' "$l_o" | grep -m1 -oE 'level true at height [0-9-]*')" \
  || no "L1 levelling never came on"
# ⚠ THE WORLD, NOT A STAMP COUNT. See the header: a count of dirty TICKS is the
# driver's shape. What levelling does is CUT, and a cut is in the store.
[ -n "$l_key" ] && [ "$l_key" != "$lc_key" ] \
  && say "L3 …and the STORE moved: $l_key against $lc_key for the same walk unlevelled" \
  || no "L3 the levelled walk built the same world as the unlevelled one ($l_key) — nothing was cut"

echo
[ "$ok" -eq 1 ] && echo "headless PASS — seven of probe/b2's blocks, no browser, no client build." \
                || { echo "headless FAILED"; exit 1; }
