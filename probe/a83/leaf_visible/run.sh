#!/bin/sh
# `A8.3`/`A8.8` — IS THE LEAF DRAWN, AND IS IT DRAWN AS THE WALL. See README.md.
#
# It began as a diagnosis (`A8.3`: the leaf is drawn, and it is drawn as the wall)
# and is now the regression gate for the fix (`A8.8`, §P9.13: a part says how tall
# its walls are and what they are made of). The before-state is in the README.
#
#   probe/a83/leaf_visible/run.sh        # exit 0 = all seven behaved as on 2026-08-08
#
# ⚠ THIS IS THE WIRE HALF ONLY, and that is deliberate rather than a gap: the seven
# seven claims below are exact integers and need no browser, so they run in a couple of
# minutes and cannot report the machine. The PICTURE half is `leaf_field.keys` and
# `early_late.keys` beside this file, and `tools/scripts/doorway.keys` is the
# acceptance shot itself.
#
# ⚠ IT WRITES NOTHING INSIDE `data/parts/`. That directory is committed and this
# tree is worked by more than one agent, so the variant library the last control
# needs is a `mktemp -d` copy reached through `EDITOR_PARTS`.
set -eu

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PORT=${PROBE_PORT:-18097}
TMP=$(mktemp -d)
PID=""
fails=0

cleanup() {
  # Only ever the pid we started. This box runs other agents' work.
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    sleep 2
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  fi
  PID=""
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

say() { echo "  $1 $2"; [ "$1" = "FAIL" ] && fails=$((fails + 1)) || true; }

start() {   # start(parts_dir_or_empty)
  if [ -n "$1" ]; then
    EDITOR_PORT="$PORT" EDITOR_PARTS="$1" \
      nohup loft --interpret --lib lib/ src/editor_server.loft >"$TMP/editor.log" 2>&1 &
  else
    EDITOR_PORT="$PORT" \
      nohup loft --interpret --lib lib/ src/editor_server.loft >"$TMP/editor.log" 2>&1 &
  fi
  PID=$!
  i=0
  while [ "$i" -lt 90 ]; do
    grep -q 'listening on port' "$TMP/editor.log" 2>/dev/null && return 0
    kill -0 "$PID" 2>/dev/null || { echo "FAIL — the server exited"; tail -5 "$TMP/editor.log"; exit 1; }
    sleep 1
    i=$((i + 1))
  done
  echo "FAIL — SERVER NEVER LISTENED"; exit 1
}

stop() {
  [ -n "$PID" ] || return 0
  kill "$PID" 2>/dev/null || true
  sleep 2
  kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  PID=""
}

cd "$ROOT"

echo "── the committed library ──"
start ""
node probe/a83/leaf_visible/panels.mjs  "$PORT" door/frame door/leaf | tee "$TMP/panels.out"
node probe/a83/leaf_visible/limbwire.mjs "$PORT" door/hung door/leaf | tee "$TMP/wire.out"
node probe/a83/leaf_visible/limbwhere.mjs "$PORT" door/hung          | tee "$TMP/where.out"
stop

# 1. NINE PANELS, NOT TEN — the doorway is a hole. ⚠ No picture can tell this from
#    "the opening is a panel the same colour as the wall", which is the trap A8.3
#    spent four days in. One panel is 12 vertices; 9 x 12 = 108.
grep -q '^door/frame .*0.55,0.52,0.46=108' "$TMP/panels.out" \
  && say PASS "door/frame draws NINE wall panels — the doorway is still a hole" \
  || say FAIL "door/frame's wall panels are not 108 vertices — read panels.out"

# 2. THE WHOLE LEAF IS TIMBER — `A8.8`'s fix. 30 = an 18-vertex plate and a
#    12-vertex panel, both in `floor`, and NOTHING in the wall surface.
grep -q '^door/leaf .*0.65,0.4,0.25=30' "$TMP/panels.out" \
  && say PASS "door/leaf is 30 vertices of timber" \
  || say FAIL "door/leaf is no longer entirely timber — read panels.out"
grep -q '^door/leaf .*0.55,0.52,0.46' "$TMP/panels.out" \
  && say FAIL "door/leaf still puts something in the WALL surface" \
  || say PASS "door/leaf puts nothing in the wall surface at all"

# 3. …and it reaches the composed doorway as a LIMB, in that colour.
grep -q 'id 8: colour (0.65,0.4,0.25)' "$TMP/where.out" \
  && say PASS "the leaf reaches door/hung's limb block as timber" \
  || say FAIL "the leaf's limb colour moved — read where.out"

# 4. THE CONTROL — a part opened as the SUBJECT uses the chunk space, not the limb
#    block. Without it, "id 8 is populated" says nothing about which part filled it.
grep -q '^door/leaf .*NONE' "$TMP/wire.out" \
  && say PASS "door/leaf opened as a subject puts NOTHING in the limb block" \
  || say FAIL "door/leaf filled the limb block — the probe cannot attribute what it sees"

echo
echo "── a variant library: door/frame states up=6 surface=frame ──"
mkdir -p "$TMP/parts"
cp -r data/parts/* "$TMP/parts/"
python3 - "$TMP" <<'PY'
import sys
tmp = sys.argv[1]
src = open('src/prop_build.loft').read()
i, j = src.index('fn write_frame'), src.index('fn write_cell_leaf')
body = src[i:j]
old = '''  assert(part_set_meta(w, PartMeta {
    pm_kind: PK_FITTING, pm_name: "frame",'''
new = '''  assert(part_set_wall(w, PartWall { wa_up: 6, wa_surface: "frame" }) == WA_OK,
         "the frame's wall profile was refused");
''' + old
# A silent zero-replacement would build the committed frame and the control below
# would compare a thing against itself.
assert body.count(old) == 1, 'write_frame changed shape'
open(f'{tmp}/frameprobe.loft', 'w').write(src[:i] + body.replace(old, new) + src[j:])
PY
PROP_OUT="$TMP/parts" loft --interpret --lib lib/ "$TMP/frameprobe.loft" >"$TMP/build.log" 2>&1 \
  || { echo "FAIL — the variant library did not build"; tail -20 "$TMP/build.log"; exit 1; }

start "$TMP/parts"
node probe/a83/leaf_visible/panels.mjs "$PORT" door/frame | tee "$TMP/variant.out"
stop

# 5. THE COUNT IS UNCHANGED AND THE COLOUR MOVED, and both halves matter.
#    Moved  -> the surface routing works.
#    108    -> `up=6` did NOT override `DOOR_MAT`. A profile that did would put a
#              panel across the opening: 10 x 12 = 120, a part whose whole purpose
#              is a hole drawn solid with the document still saying `door`.
grep -q '^door/frame .*0.78,0.74,0.65=108' "$TMP/variant.out" \
  && say PASS "the panels moved to 'frame' and are STILL 108 — the doorway survived up=6" \
  || say FAIL "the profiled frame is not 108 vertices of dressed stone — read variant.out"
grep -q '^door/frame .*0.55,0.52,0.46' "$TMP/variant.out" \
  && say FAIL "the profiled frame still puts panels in the WALL surface" \
  || say PASS "nothing is left in the wall surface — the routing is wholesale"

echo
if [ "$fails" -eq 0 ]; then
  echo "all seven behaved as on 2026-08-08"
  exit 0
fi
echo "$fails changed — read probe/a83/leaf_visible/README.md before assuming a regression"
exit 1
