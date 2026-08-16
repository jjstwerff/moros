#!/bin/sh
# K3C — CAN THE PROBE FAIL? Six sabotages, each aimed at one row, and a control.
#
#   sh probe/k3c/sabotage.sh
#
# ⚠ **THE TREE IS COPIED ASIDE AND RESTORED FROM THE COPIES, NEVER WITH
# `git checkout`.** The subject of a sweep is the step you have just built, so it is
# uncommitted by definition; a checkout between rows deletes it and every row then
# scores as a miss — five clean catches reading as *these tests cannot fail*. The
# control cannot see it either, because the probe is reverted along with the code.
# `CLAUDE.md` says this in bold and it is written here because a sweep is exactly
# where somebody reaches for the short way.
#
# ⚠ **AND THE SUBJECT IS ASSERTED PRESENT BEFORE ROW 0.** A sweep over a feature that
# is not in the tree answers *nothing went red* to every question, which is the same
# sentence a useless probe produces.
#
# ⚠ **NOTHING ELSE MAY TOUCH `$RUN` OR `$VOX` WHILE THIS RUNS — INCLUDING READING
# THEM.** For most of its ten minutes the working tree holds a deliberate defect, so a
# build started beside it compiles the sabotage and a person opening the file reads it.
# Found the honest way: `src/editor_run.loft` was read mid-sweep and the reader took
# `if id == 6 { return true; }` for the shipped classification. It is the same hazard
# `probe/k2b` met from the other side — two copies of one probe sharing a world file —
# and the same answer: **one at a time, and know what is in the tree while it runs.**
set -u
cd "$(dirname "$0")/../.." || exit 1

RUN=src/editor_run.loft
VOX=lib/hex_voxel/src/hex_voxel.loft
KEEP=$(mktemp -d)
red=0; miss=0

restore() { cp "$KEEP/editor_run.loft" "$RUN"; cp "$KEEP/hex_voxel.loft" "$VOX"; }
# ⚠ `PIPE` IS IN THIS LIST ON PURPOSE — plan 22 `M4` left a sabotage in the working
# tree because a sweep was read through `head` and the trap did not cover it.
trap 'restore; rm -rf "$KEEP"' EXIT INT TERM PIPE

cp "$RUN" "$KEEP/editor_run.loft"
cp "$VOX" "$KEEP/hex_voxel.loft"

# ── row 0: the subject is here ────────────────────────────────────────────────
for probe_needle in \
  "fn send_quiet(id: integer) -> boolean {:$RUN" \
  "gset = world_set_ground(w, cell);:$RUN" \
  "if hex_present(w.w_ground) { n = n + SZ_SECTION_HEAD + SZ_GROUND; }:$VOX" ; do
  n=${probe_needle%:*}; f=${probe_needle##*:}
  if ! grep -qF "$n" "$f"; then
    echo "SUBJECT ABSENT from $f: '$n' — this sweep would answer 'nothing went red' to"
    echo "every row below without touching the thing it is aimed at. Stopping."
    exit 2
  fi
done
echo "subject present in both files — the sweep can mean something"
echo ""

row() {                       # row <name> <what should go red> <sed script> <file>
  name=$1; want=$2; script=$3; file=$4
  restore
  # ⚠ **A SED THAT NO LONGER MATCHES IS A SILENT NO-OP, AND IT READS AS *THE PROBE
  # CANNOT SEE THIS*.** Every pattern here quotes a line of the subject, so any
  # reshaping of that code — an extraction, a rename, one space — turns a row into a
  # run of the unmodified tree scored as a miss. Found the honest way: extracting
  # `run_send` out of `run_line` moved `pi = pay.find(",")` by two columns. So the
  # edit is proved to have LANDED before its result is believed, which is this tree's
  # own rule about instruments applied to the instrument.
  before=$(md5sum < "$file")
  sed -i "$script" "$file"
  if [ "$before" = "$(md5sum < "$file")" ]; then
    echo "  ???  $name — THE SABOTAGE DID NOT APPLY: '$script' matches nothing in"
    echo "       $file. This row ran the unmodified tree; its answer means nothing."
    miss=$((miss + 1))
    restore
    return
  fi
  out=$(sh probe/k3c/run.sh 2>&1)
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

# A — one authoring id declared quiet. The narrowest possible lie, and the one a
# person would actually make: `6:` looks like a mode rather than a write.
row quiet6 "A: cellar and deck lose their \`send 6:\`" \
  's|fn send_quiet(id: integer) -> boolean {|fn send_quiet(id: integer) -> boolean {\n  if id == 6 { return true; }|' "$RUN"

# A + C — the whole classification off. This is the state the tree was in yesterday.
row allowall "A and C: every send skipped, which is where this step started" \
  's|fn send_quiet(id: integer) -> boolean {|fn send_quiet(id: integer) -> boolean {\n  return true;|' "$RUN"

# B — the opposite failure, and the one a check on exit codes alone cannot see: a
# runner that refuses every `send` passes row A perfectly.
row denyall "B: the camera scripts stop running headless for nothing" \
  's|fn send_quiet(id: integer) -> boolean {|fn send_quiet(id: integer) -> boolean {\n  return false;|' "$RUN"

# D — the word is read and the ground is not set. The gesture goes through the motions.
row noplane "D: \`ground 60 2\` builds the world of no ground at all" \
  's|gset = world_set_ground(w, cell);|gset = world_set_ground(w, hex_voxel::Hex {});|' "$RUN"

# D — the two spellings drift apart. `ground <h> <m>` keeps working and the raw frame
# stops, which is exactly the divergence a one-spelling check cannot see.
row wiresep "D: \`send 50:60,2\` and \`ground 60 2\` build different floors" \
  's|pi = pay.find(",");|pi = pay.find(" ");|' "$RUN"

# E — the library defect this step surfaced, put back.
row nosize "E: a world with a ground saves as WS_IO over a file that is correct" \
  's|  if hex_present(w.w_ground) { n = n + SZ_SECTION_HEAD + SZ_GROUND; }|  // sabotage: the ground is not counted|' "$VOX"

# ── the control ───────────────────────────────────────────────────────────────
# ⚠ WITHOUT THIS THE SIX ABOVE ARE SATISFIED BY A PROBE THAT IS SIMPLY BROKEN, and
# it is placed LAST so it also proves the tree came back from six edits.
restore
echo ""
if sh probe/k3c/run.sh > /dev/null 2>&1; then
  echo "  ok   control — the restored tree is green"
else
  echo "  FAIL control — the tree did not come back, or the probe is red on its own"
  miss=$((miss + 1))
fi

echo ""
echo "K3C sabotage: $red red, $miss missed"
[ "$miss" -eq 0 ] || exit 1
