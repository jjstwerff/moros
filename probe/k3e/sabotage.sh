#!/bin/sh
# K3E — CAN THE PROBE FAIL? Six sabotages, each aimed at one row, and a control.
#
#   sh probe/k3e/sabotage.sh
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
# ── WHAT THE SIX ARE AIMED AT ─────────────────────────────────────────────────
#
# ⚠ **TWO OF THEM ARE THE DESIGN FORKS RATHER THAN TYPOS.** `atarrival` is the cheaper
# implementation this step deliberately did not take — a refusal where the movement
# lands — and it passes rows A, B and E perfectly. `refuseall` is the shape row A alone
# cannot tell from a working fence. A sweep of six typos would have said nothing about
# either.
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
  '  if cmd == "hold" || cmd == "keys" || cmd == "turn" {' \
  '    if walked == "" { walked = t; }' \
  '    if walked != "" {' ; do
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
  out=$(sh probe/k3e/run.sh 2>&1)
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

# A + E — the fence gone. This is the state the tree was in yesterday, and the one the
# whole step exists to leave.
row nofence "A and E: a gesture lands wherever the last \`at\` put the author again" \
  's|    if walked != "" {|    if false {|'

# B + D — the opposite failure, and the one row A alone cannot see: a runner that
# refuses every gesture passes every check on an exit code.
row refuseall "B and D: every gesture refused, and three live scripts stop running" \
  's|    if walked != "" {|    if true {|'

# B + D — the fence never lifts. A teleport stops clearing, so the first walk in a
# script poisons every gesture after it forever.
row noclear "B and D: an \`at\` after the walk no longer clears the fence" \
  's|^    walked = "";$|    // sabotage: the teleport does not clear|'

# ⚠ **THE DESIGN FORK, NOT A TYPO.** Refusing the movement where it ARRIVES is the
# cheaper implementation, and this is what it costs, measured: `cellar.keys` goes from
# 2 complaints to **10** — eight walks refused after which it teleports anyway — and
# `fall`/`determinism` stop running entirely. Row C is the one written for this and
# nothing else; it reds all five, which is what a wrong fence position looks like.
row atarrival "C: the fence moved to where the movement arrives — cellar 2 -> 10" \
  's|    if walked == "" { walked = t; }|    said = "no walking here"; return false;|'

# A — the fence written against the one word the live corpus happens to use. `hold` and
# `turn` compile to the same `4:` frame and would go on dropping silently.
# ⚠ **THE DELIMITER IS `#`, AND THAT IS NOT TASTE** — this pattern contains `||`, which
# ends a `s|…|` expression mid-word. Written with `|` first and the row's own
# did-it-apply guard is what said so, out loud, instead of scoring a run of the
# unmodified tree as *the probe cannot see this*.
row onlykeys "A: \`hold\` and \`turn\` drop silently, because only \`keys\` was fenced" \
  's#  if cmd == "hold" || cmd == "keys" || cmd == "turn" {#  if cmd == "keys" {#'

# A + E — the complaint names the LAST movement instead of the first. The run still
# fails, so an exit-code check is green; what is lost is the line a person needs, and
# for `deck.keys` that is the difference between `keys 1` and the `keys 0` that stopped
# a walk 90 units long.
row lastnotfirst "A and E: the complaint points at the line that STOPPED the walk" \
  's|    if walked == "" { walked = t; }|    walked = t;|'

# ── the control ───────────────────────────────────────────────────────────────
# ⚠ WITHOUT THIS THE SIX ABOVE ARE SATISFIED BY A PROBE THAT IS SIMPLY BROKEN, and it is
# placed LAST so it also proves the tree came back from six edits.
restore
echo ""
if sh probe/k3e/run.sh > /dev/null 2>&1; then
  echo "  ok   control — the restored tree is green"
else
  echo "  FAIL control — the tree did not come back, or the probe is red on its own"
  miss=$((miss + 1))
fi

echo ""
echo "K3E sabotage: $red red, $miss missed"
[ "$miss" -eq 0 ] || exit 1
