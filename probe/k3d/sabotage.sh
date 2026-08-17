#!/bin/sh
# K3D — CAN THE PROBE FAIL? Seven sabotages, a declared blind spot, and a control.
#
#   sh probe/k3d/sabotage.sh
#
# ⚠ **THE FILES ARE COPIED ASIDE AND RESTORED FROM THE COPIES, NEVER WITH
# `git checkout`.** The subject of a sweep is the step just built, so it is uncommitted
# by definition; a checkout between rows deletes it and every row then scores as a miss —
# five clean catches reading as *these tests cannot fail*.
#
# ⚠ **AND IT DELETES ONLY WHAT IT CREATED.** `tools/scripts/` is restored file by file
# from the copies rather than wiped and replaced, because this box carries other agents'
# in-flight work and a wholesale `rm -rf` of a shared directory is how that gets lost.
#
# ⚠ **NOTHING ELSE MAY TOUCH THE CORPUS, `lib/hex_editor/src/say.loft` OR
# `probe/k3d/` WHILE THIS RUNS — INCLUDING READING THEM.**
#
# ── ⚠ ONE ROW MUST STAY GREEN, AND IT IS THE HONEST HALF OF THE COVERAGE CLAIM ──
#
# `blindcam` changes CUTAWAY to FOLLOW in `cutaway.keys` — a mode change that is the
# whole subject of that script — and this probe **cannot see it**. The README says the
# six camera scripts are invisible here; this row is what makes that a measurement
# instead of a sentence, and it is scored the other way round: green is the pass.
set -u
cd "$(dirname "$0")/../.." || exit 1

PRB=probe/k3d/run.sh
SAY=lib/hex_editor/src/say.loft
KEEP=$(mktemp -d)
red=0; miss=0; added=""

mkdir -p "$KEEP/scripts" "$KEEP/base"
cp -a tools/scripts/. "$KEEP/scripts/"
cp -a probe/k3d/base/. "$KEEP/base/"
cp "$PRB" "$KEEP/run.sh"
cp "$SAY" "$KEEP/say.loft"

restore() {
  cp -a "$KEEP/scripts/." tools/scripts/
  cp -a "$KEEP/base/." probe/k3d/base/
  cp "$KEEP/run.sh" "$PRB"
  cp "$KEEP/say.loft" "$SAY"
  for f in $added; do rm -f "$f"; done
  added=""
}
trap 'restore; rm -rf "$KEEP"' EXIT INT TERM PIPE

# ── row 0: the subject is here ────────────────────────────────────────────────
#
# ⚠ A SWEEP OVER AN ABSENT FEATURE ANSWERS *NOTHING WENT RED* TO EVERY QUESTION, which
# is the same sentence a useless probe produces. Each anchor below is something a row
# depends on, and one missing means the sweep says nothing.
#
# ⚠ **THE ANCHORS ARE FIXED STRINGS AND CARRY NO `^`/`$`, BECAUSE THIS GUARD CAUGHT
# ITSELF ONCE.** Written with anchors and `grep -qF`, six of the seven "were absent" —
# `-F` reads `^verb place$` as a literal — and the sweep refused to run over a tree
# where every anchor was present. It failed SAFE, which is the direction to fail in, and
# it is `CLAUDE.md`'s *a grep is an instrument whose default answer is absent* exactly.
# What holds the precise line is each row's own did-it-apply guard.
absent=0
for pair in \
  "$PRB:A  every live script builds what it built" \
  "$PRB:D  the coverage report" \
  "tools/scripts/house.keys:verb place" \
  "tools/scripts/door.keys:select 2" \
  "tools/scripts/cutaway.keys:send 40:3" \
  "$SAY:{slab_thick(s)} units thick" \
  "probe/k3d/base/niche.txt:md5: " ; do
  f=${pair%%:*}; pat=${pair#*:}
  if ! grep -qF -e "$pat" "$f" 2>/dev/null; then
    echo "SUBJECT ABSENT: '$pat' is not in $f."
    absent=$((absent + 1))
  fi
done
if [ "$absent" -gt 0 ]; then
  echo "This sweep would answer 'nothing went red' without touching what it aims at."
  exit 2
fi
echo "subject present — the sweep can mean something"
echo ""

# ⚠ **A SED THAT NO LONGER MATCHES IS A SILENT NO-OP, AND IT READS AS *THE PROBE CANNOT
# SEE THIS*.** Every row proves its edit LANDED before its result is believed. `K3e`'s
# sweep caught its own `|` delimiter colliding with a `||` in the line it was editing
# this way, rather than scoring it as a miss.
apply_ok() {                  # apply_ok <file> <before-md5> <name>
  if [ "$2" = "$(md5sum < "$1")" ]; then
    echo "  ???  $3 — THE SABOTAGE DID NOT APPLY to $1. This row ran the"
    echo "       unmodified tree; its answer means nothing."
    miss=$((miss + 1))
    restore
    return 1
  fi
  return 0
}

judge() {                     # judge <name> <want-red-description>
  out=$(sh "$PRB" 2>&1)
  if [ "$?" -ne 0 ]; then
    echo "  RED  $1 — $2"
    printf '%s\n' "$out" | grep '^  FAIL' | head -2 | sed 's/^/         /'
    red=$((red + 1))
  else
    echo "  ---  $1 — GREEN, and it should have caught: $2"
    miss=$((miss + 1))
  fi
  restore
}

row() {                       # row <name> <want> <sed-script> <target>
  restore
  before=$(md5sum < "$4")
  sed -i "$3" "$4"
  apply_ok "$4" "$before" "$1" || return
  judge "$1" "$2"
}

echo "── the sweep ────────────────────────────────────────────────────────────"

# A — `K3d`'s OWN ACCEPTANCE, and the failure `probe/k2` used to catch: a press deleted
# from a LIVE script. Row C does this to a derived fixture every run, which proves the
# comparison has teeth; this proves it on the file a person would actually break.
row nopress "A: \`verb place\` deleted from \`house.keys\` — a whole house gone" \
  '/^verb place$/d' tools/scripts/house.keys

# A — ⚠ THE `K1` CLAIM, AND THE WORLD IS BLIND TO IT BY CONSTRUCTION. `open_ahead`
# writes `DOOR_MAT` whatever the profile, so a door and a window leave worlds that are
# equal byte for byte; the head lives in the session's `Opening` and none of the session
# is in the world format. What moves is `chosen:` and the read-back line.
row noselect "A: \`select 2\` becomes \`select 1\` in \`door.keys\` — the window is a door" \
  's/^select 2$/select 1/' tools/scripts/door.keys

# A — ⛔ THE THIRD INSTRUMENT, AND NEITHER OTHER HALF CAN SEE IT. A gesture's reported
# NUMBER drifting is a real regression class in this tree, not a hypothetical: three
# handlers were found passing a global height scale where the world's own unit belongs
# (`K3`'s `J`, `E` and `B` rows), and each was a wrong number in a correct-looking
# sentence. The world and the session are untouched by this edit.
row saysentence "A: the slab's reported thickness becomes a literal — world and session unmoved" \
  's/{slab_thick(s)} units thick/9 units thick/' "$SAY"

# B — a script that arrives with no baseline. ⚠ Without this row a new script sits in a
# directory that LOOKS covered and is covered by nothing, which is `tools/layering.sh`'s
# exemption defect with the exemption written by omission.
restore
printf 'at 0 0 0\nverb raise\n' > tools/scripts/sweepnew.keys
added="tools/scripts/sweepnew.keys"
judge newscript "B: a new script with no baseline"

# A, then B — a baseline that has been damaged, and one that is gone. ⚠ THE TWO ROWS
# LAND ON DIFFERENT ROWS OF THE PROBE, and the first one taught me that: a MUTILATED
# baseline is a diff, so it reds **A**, while only a MISSING file reaches B's set
# comparison. Written as one B row, half of this would have been mislabelled in a sweep
# whose output is the record of what was checked.
row basedamaged "A: a baseline with its \`md5:\` line cut out" \
  '/^md5: /d' probe/k3d/base/niche.txt
restore
rm -f probe/k3d/base/niche.txt
judge basegone "B: the baseline FILE deleted outright"

# D — two scripts that build the same thing, arriving quietly. ⛔ This is `K3c`'s
# finding as a live event: six scripts keyed one world and the collision was visible to
# anyone who ran the corpus for months.
restore
cp tools/scripts/door.keys tools/scripts/embrasure.keys
judge twinscript "D: \`embrasure.keys\` becomes a copy of \`door.keys\` — a new group"

# C — ⚠ AIMED AT THE PROBE, NOT AT THE TREE. Row C1 derives its fixture by deleting a
# `verb run` line; a fixture that stops deleting anything leaves the row comparing a
# file with itself, green forever. `probe/t4` needed the same row for the same reason.
row deadctl "C1: the store-half fixture stops deleting anything" \
  's/verb run\$/NEVERMATCHES/' "$PRB"

# ── the declared blind spot: GREEN is the pass ────────────────────────────────
restore
before=$(md5sum < tools/scripts/cutaway.keys)
sed -i 's/^send 40:3$/send 40:1/' tools/scripts/cutaway.keys
if apply_ok tools/scripts/cutaway.keys "$before" blindcam; then
  echo ""
  if sh "$PRB" > /dev/null 2>&1; then
    echo "  ok   blindcam — CUTAWAY became FOLLOW and this probe is green, as the"
    echo "       README says: of the six camera scripts only \`indoors\` has a check"
    echo "       that can see a camera, and no headless baseline can be the others'"
  else
    echo "  ???  blindcam — RED. The probe caught a camera-mode change, so the"
    echo "       coverage report in row D is understating what it can see."
    miss=$((miss + 1))
  fi
  restore
fi

# ── the control ───────────────────────────────────────────────────────────────
restore
echo ""
if sh "$PRB" > /dev/null 2>&1; then
  echo "  ok   control — the restored tree is green"
else
  echo "  FAIL control — the tree did not come back, or the probe is red on its own"
  miss=$((miss + 1))
fi

echo ""
echo "K3d sabotage: $red red, $miss missed"
[ "$miss" -eq 0 ] || exit 1
