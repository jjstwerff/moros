#!/bin/sh
# T4 — CAN THE PROBE FAIL? Four sabotages, each aimed at one row, and a control.
#
#   sh probe/t4/sabotage.sh
#
# ⚠ **THE TREE IS COPIED ASIDE AND RESTORED FROM THE COPIES, NEVER WITH
# `git checkout`.** The subject of a sweep is the step you have just built, so it is
# uncommitted by definition; a checkout between rows deletes it and every row then
# scores as a miss — clean catches reading as *these tests cannot fail*.
#
# ⚠ **NOTHING ELSE MAY TOUCH `$RUN` WHILE THIS RUNS — INCLUDING READING IT.**
#
# ── ⚠ WHY A SWEEP AT ALL, WHEN THE ROWS COMPARE AGAINST AN INDEPENDENT CONSTANT ──
#
# Rows A and B match md5s a NATIVE SERVER produced, which is close to unfalsifiable by
# accident — you do not hit `cea971a07899e420b344c0054567f4e1` by writing the wrong
# world. What a sweep can still find is the other half: whether rows C, D and E are
# doing anything, and whether a change that leaves A and B green can quietly cost
# something. `nolevelon` is the row for that — it reds A and B and leaves D *green*,
# because D asks whether the level lines matter and a runner that ignores them answers
# *yes, they matter* just as loudly by breaking both ways.
set -u
cd "$(dirname "$0")/../.." || exit 1

RUN=src/editor_run.loft
KEEP=$(mktemp -d)
red=0; miss=0

PRB=probe/t4/run.sh
restore() { cp "$KEEP/editor_run.loft" "$RUN"; cp "$KEEP/run.sh" "$PRB"; }
trap 'restore; rm -rf "$KEEP"' EXIT INT TERM PIPE
cp "$RUN" "$KEEP/editor_run.loft"
cp "$PRB" "$KEEP/run.sh"

# ── row 0: the subject is here ────────────────────────────────────────────────
for n in \
  '      hex_editor::level_on(wk, w, lvres);' \
  '    hex_editor::level_off(wk, fn(gx: float, gz: float, gref: float) -> float {' \
  '  if sid == 6 {' ; do
  if ! grep -qF "$n" "$RUN"; then
    echo "SUBJECT ABSENT from $RUN: '$n' — this sweep would answer 'nothing went red' to"
    echo "every row below without touching the thing it is aimed at. Stopping."
    exit 2
  fi
done
echo "subject present — the sweep can mean something"
echo ""

# ⚠ **IT TAKES A TARGET, BECAUSE ONE ROW'S SUBJECT IS THE PROBE AND NOT THE RUNNER.**
# Row D asserts that a CONTROL fixture differs from the acceptance one, and a control
# that stopped being a control would leave the row comparing a file with itself —
# green, forever, testing nothing. That is `CLAUDE.md`'s *a test that performs the fix
# cannot see that nothing else does*, aimed at a fixture instead of at code, and the
# only way to sweep for it is to be able to sabotage the probe.
row() {                       # row <name> <what should go red> <sed script> [target]
  name=$1; want=$2; script=$3; tgt=${4:-$RUN}
  restore
  # ⚠ **A SED THAT NO LONGER MATCHES IS A SILENT NO-OP, AND IT READS AS *THE PROBE
  # CANNOT SEE THIS*.** The edit is proved to have LANDED before its result is believed.
  before=$(md5sum < "$tgt")
  sed -i "$script" "$tgt"
  if [ "$before" = "$(md5sum < "$tgt")" ]; then
    echo "  ???  $name — THE SABOTAGE DID NOT APPLY: '$script' matches nothing in"
    echo "       $tgt. This row ran the unmodified tree; its answer means nothing."
    miss=$((miss + 1))
    restore
    return
  fi
  out=$(sh probe/t4/run.sh 2>&1)
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

# A + B — the freeze never happens, so the walk lays no pad. ⚠ THE RUN STILL EXITS 0 and
# still prints `level true at height 0`: the sentence is this driver's and the state
# machine is the library's, so a missing call is invisible in the transcript.
row nolevelon "A and B: the grade is never frozen, and the transcript still says it was" \
  's|^      hex_editor::level_on(wk, w, lvres);$|      // sabotage: no freeze|'

# A + B — the release never happens. ⚠ THE OPPOSITE END, and it is a different defect:
# the walker keeps the frozen height after `6:0`, so every later gesture stands in the
# air over ground it just cut. `cellar.keys` is four teleports past that point.
# ⚠ AND IT REPLACES THE WHOLE CALL RATHER THAN COMMENTING ITS FIRST LINE, which would
# open a brace that never closes: a sabotage that fails to COMPILE reds every row for a
# reason that is not the one it was aimed at, and reads as a catch.
# ⛔ **AND THIS ROW IS WHY `probe/t4` HAS AN `F` — the first pass MISSED it.** Dropping
# the release left both acceptance worlds byte-identical AND all five of `cellar`'s `feet`
# stations unmoved, so three green rows sat over an untested clause. It is unobservable in
# those two scripts for two reasons that are both about what levelling IS: levelling
# brings the ground TO the feet, so where a walk just levelled the release is a no-op; and
# every `feet` in `cellar.keys` follows a teleport, which re-reads the ground itself.
# `release.keys` is the second instrument — freeze on the flat, teleport onto a hill.
row noleveloff "F: the release never happens, and the feet stay frozen inside a hill" \
  '/^    hex_editor::level_off(wk, fn(gx/,/^                                hex_mesh::ground_under/c\    wk.wk_levelling = false;'

# ⚠ **THE DESIGN FORK, AND IT IS YESTERDAY'S TREE.** `6:` back on the deny list: rows A
# and B fail the RUN rather than the comparison, and row E is the one that says which —
# `deck.keys` back to rc 101 with its 2 complaints, which is exactly where `K3c` left it.
row denysix "A, B and E: \`6:\` is refused again — the tree as it stood before this step" \
  's|^  if sid == 6 {$|  if sid == 6 \&\& false {|'

# D — the control that proves the pad is the LEVELLING's. ⚠ Aimed at the probe rather
# than at the runner: with the two `send 6:` lines left in, row D compares the fixture
# against itself and cannot fail. It is the row's own fixture that is load-bearing.
row deadctl "D: the no-level control stops removing the level lines" \
  "s#^grep -v '\^send 6:'#cat #" "$PRB"

# ── the control ───────────────────────────────────────────────────────────────
restore
echo ""
if sh probe/t4/run.sh > /dev/null 2>&1; then
  echo "  ok   control — the restored tree is green"
else
  echo "  FAIL control — the tree did not come back, or the probe is red on its own"
  miss=$((miss + 1))
fi

echo ""
echo "T4 sabotage: $red red, $miss missed"
[ "$miss" -eq 0 ] || exit 1
