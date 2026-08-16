#!/bin/sh
# T3 — CAN THE PROBE FAIL? Seven sabotages, each aimed at one row, and a control.
#
#   sh probe/t3/sabotage.sh
#
# ⚠ **THE TREE IS COPIED ASIDE AND RESTORED FROM THE COPIES, NEVER WITH
# `git checkout`.** The subject of a sweep is the step you have just built, so it is
# uncommitted by definition; a checkout between rows deletes it and every row then
# scores as a miss — clean catches reading as *these tests cannot fail*. The control
# cannot see it either, because the probe is reverted along with the code.
#
# ⚠ **AND THE SUBJECT IS ASSERTED PRESENT BEFORE ROW 0.** A sweep over a feature that is
# not in the tree answers *nothing went red* to every question, which is the same
# sentence a useless probe produces.
#
# ⚠ **NOTHING ELSE MAY TOUCH `$RUN` WHILE THIS RUNS — INCLUDING READING IT.** For most of
# its minutes the working tree holds a deliberate defect, so a build started beside it
# compiles the sabotage and a person opening the file reads it.
#
# ── WHAT THE SEVEN ARE AIMED AT ─────────────────────────────────────────────────
#
# ⚠ **THREE OF THEM ARE DESIGN FORKS RATHER THAN TYPOS**, which is the half a sweep of
# slips cannot supply. `noauthor` is the runner as it was yesterday — walking, and still
# reading the author off the last teleport, which is the state where `step` looks like it
# works and builds the unwalked world. `fakehold` is the tempting version of `hold`, an
# exact feedback loop, which is right at `rate 1` and walks where the server stands still
# at `rate 0`. `onestep` is a `step` that ticks once however many were asked for, and it
# is the one row A alone cannot tell from a working walk.
set -u
cd "$(dirname "$0")/../.." || exit 1

RUN=src/editor_run.loft
KEEP=$(mktemp -d)
red=0; miss=0

restore() { cp "$KEEP/editor_run.loft" "$RUN"; }
# ⚠ `PIPE` IS IN THIS LIST ON PURPOSE — plan 22 `M4` left a sabotage in the working tree
# because a sweep was read through `head` and the trap did not cover it.
trap 'restore; rm -rf "$KEEP"' EXIT INT TERM PIPE

cp "$RUN" "$KEEP/editor_run.loft"

# ── row 0: the subject is here ────────────────────────────────────────────────
for n in \
  '  if cmd == "keys" {' \
  '    run_ticks(w, wk, sess, rest as integer ?? 0);' \
  '  if cmd == "hold" || cmd == "turn" {' \
  '  if cmd == "feet" {' \
  '  for _t in 0..n {' ; do
  if ! grep -qF "$n" "$RUN"; then
    echo "SUBJECT ABSENT from $RUN: '$n' — this sweep would answer 'nothing went red' to"
    echo "every row below without touching the thing it is aimed at. Stopping."
    exit 2
  fi
done
echo "subject present — the sweep can mean something"
echo ""

row() {                       # row <name> <what should go red> <sed script>
  name=$1; want=$2; script=$3
  restore
  # ⚠ **A SED THAT NO LONGER MATCHES IS A SILENT NO-OP, AND IT READS AS *THE PROBE
  # CANNOT SEE THIS*.** Every pattern here quotes a line of the subject, so any
  # reshaping of that code turns a row into a run of the unmodified tree scored as a
  # miss. The edit is proved to have LANDED before its result is believed.
  before=$(md5sum < "$RUN")
  sed -i "$script" "$RUN"
  if [ "$before" = "$(md5sum < "$RUN")" ]; then
    echo "  ???  $name — THE SABOTAGE DID NOT APPLY: '$script' matches nothing in"
    echo "       $RUN. This row ran the unmodified tree; its answer means nothing."
    miss=$((miss + 1))
    restore
    return
  fi
  out=$(sh probe/t3/run.sh 2>&1)
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "  RED  $name — $want"
    printf '%s\n' "$out" | grep '^  FAIL' | head -3 | sed 's/^/         /'
    red=$((red + 1))
  else
    echo "  ---  $name — GREEN, and it should have caught: $want"
    miss=$((miss + 1))
  fi
  restore
}

echo "── the sweep ────────────────────────────────────────────────────────────"

# A + C — no tick at all. `step` accepts its argument, says `stepped n`, and walks
# nobody: the sentence in the transcript is identical to a working run.
row notick "A and C: \`step\` reports the ticks it did not take" \
  's|^    run_ticks(w, wk, sess, rest as integer ?? 0);$|    // sabotage: no tick|'

# ⚠ **THE DESIGN FORK.** The runner walks and the gesture still reads the last teleport —
# which is exactly `K3e`'s world with the fence taken out, and the state a reader would
# reach by performing `step` and forgetting that `verb` had a second half.
row noauthor "A: the walk happens and the gesture lands at the last \`at\` anyway" \
  's|hex_editor::press_verb(sess, w, walk_author(wk), rest,|hex_editor::press_verb(sess, w, hex_editor::author_on(w, wk.wk_x, 0.0 - 99.0, wk.wk_yaw), rest,|'

# C — a `step` that ticks once however many were asked for. Row A cannot see this (the
# walker still moves, so the house still lands somewhere else); only additivity can.
row onestep "C: \`step n\` takes ONE tick, so 45+45 and 90 stop agreeing" \
  's|^  for _t in 0..n {$|  for _t in 0..1 {|'

# B — the teleport stops overwriting the walker, so a walk poisons every gesture after
# it for the rest of the script. ⚠ THE `x` LINE ONLY: leaving `z` and the yaw makes it a
# partial teleport, which is what a real slip looks like.
row noplace "B: an \`at\` after the walk no longer fixes the pose" \
  's|^  wk.wk_x = x;$|  // sabotage: the teleport does not move x|'

# ⚠ **THE OTHER DESIGN FORK, AND THE EXPENSIVE ONE.** `hold` performed as an exact
# feedback loop: right at `rate 1`, and at `rate 0` — which `T0` pinned every walking
# script to — the server does NOTHING and this walks. Row E is the only row that can
# tell a refusal from a plausible implementation.
# ⚠ **THE DELIMITER IS `#`, AND THAT IS NOT TASTE** — this pattern contains `||`, which
# ends a `s|…|` expression mid-word. `probe/k3e`'s sweep wrote that sentence down and this
# one repeated the mistake anyway; the row's own did-it-apply guard is what said so, out
# loud, instead of scoring a run of the unmodified tree as *the probe cannot see this*.
row fakehold "E: \`hold\` is performed as a loop the server does not run at \`rate 0\`" \
  's#^  if cmd == "hold" || cmd == "turn" {$#  if cmd == "hold" { wk.wk_held = 1; run_ticks(w, wk, sess, 30); wk.wk_held = 0; said = "held"; return true; }\n  if cmd == "turn" {#'

# D — the held bits are ignored, so every walk is a stand. ⚠ This is the row that keeps
# D honest: three live scripts stay green under it (their walks write nothing either
# way), and A and C go red, which is exactly the split D is written to preserve.
row nokeys "A and C: \`keys\` sets nothing, so every walk is a stand" \
  's|^    wk.wk_held = rest as integer ?? 0;$|    wk.wk_held = 0;|'

# F — the instrument lies. `feet` reports the origin however far the walk went, which
# is the shape every blind instrument in this tree has had: a number that gets believed.
# ⚠ Row F is the ONLY row that can catch this — the worlds are untouched, so A, B, C
# and D are all still perfectly green.
# ⚠ **AND IT REPLACES THE WHOLE EXPRESSION, WHICH THE FIRST VERSION DID NOT.** Aimed at
# the first of the two lines it left `at {x},{z}` live, so a fenced walk and a free one
# still read differently and row F stayed green — a sabotage that applied cleanly, ran,
# and tested nothing. *A miss can be the sweep's aim rather than the probe's blindness*,
# and the two are told apart by reading what the edit actually left behind.
row deadfeet "F: \`feet\` reports a constant, so a blocked walk and a free one read alike" \
  '/^    said = "feet {round/,/^         + "at {round/c\    said = "feet 0.0 at 0,0";'

# ── the control ───────────────────────────────────────────────────────────────
# ⚠ WITHOUT THIS THE SEVEN ABOVE ARE SATISFIED BY A PROBE THAT IS SIMPLY BROKEN, and it is
# placed LAST so it also proves the tree came back from seven edits.
restore
echo ""
if sh probe/t3/run.sh > /dev/null 2>&1; then
  echo "  ok   control — the restored tree is green"
else
  echo "  FAIL control — the tree did not come back, or the probe is red on its own"
  miss=$((miss + 1))
fi

echo ""
echo "T3 sabotage: $red red, $miss missed"
[ "$miss" -eq 0 ] || exit 1
