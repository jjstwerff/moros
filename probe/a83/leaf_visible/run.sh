#!/bin/sh
# `A8.3` — IS THE LEAF DRAWN, AND WHY CAN NOBODY SEE IT. See README.md.
#
# ⚠ THIS IS THE WIRE HALF ONLY, and that is deliberate rather than a gap: the four
# claims below are exact and need no browser, so they run in seconds and cannot
# report the machine. The PICTURE half is `leaf_field.keys` and `early_late.keys`
# beside this file — run those by hand with `--shots` when a person wants to look.
#
#   probe/a83/leaf_visible/run.sh        # exit 0 = all four behaved as on 2026-08-08
#
# ⚠ IT WRITES NOTHING INSIDE `data/parts/`. That directory is committed and this
# tree is worked by more than one agent, so the variant library is a `mktemp -d`
# copy reached through `EDITOR_PARTS`.
set -eu

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PORT=${PROBE_PORT:-18097}
TMP=$(mktemp -d)
PID=""

cleanup() {
  # Only ever the pid we started. This box runs other agents' work.
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    sleep 2
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

cd "$ROOT"

echo "── the variant library: door/leaf's cell FLOOR_MAT -> FIELD_MAT ──"
mkdir -p "$TMP/parts"
cp -r data/parts/* "$TMP/parts/"
python3 - "$TMP" <<'PY'
import sys
tmp = sys.argv[1]
src = open('src/prop_build.loft').read()
i, j = src.index('fn write_cell_leaf'), src.index('fn write_hung')
body = src[i:j]
# One site, and asserted: a silent zero-replacement would build the committed leaf
# and the whole run would read as "the recolour is invisible".
assert body.count('hex_editor::FLOOR_MAT') == 1, 'write_cell_leaf changed shape'
open(f'{tmp}/leafprobe.loft', 'w').write(
    src[:i] + body.replace('hex_editor::FLOOR_MAT', 'hex_editor::FIELD_MAT') + src[j:])
PY
PROP_OUT="$TMP/parts" loft --interpret --lib lib/ "$TMP/leafprobe.loft" >"$TMP/build.log" 2>&1 \
  || { echo "FAIL — the variant library did not build"; tail -20 "$TMP/build.log"; exit 1; }
cmp -s data/parts/door/leaf.hxw "$TMP/parts/door/leaf.hxw" \
  && { echo "FAIL — the variant leaf is byte-identical to the committed one"; exit 1; }
echo "  built, and the leaf differs from the committed one"

echo "── the server, on the variant library ──"
EDITOR_PORT="$PORT" EDITOR_PARTS="$TMP/parts" \
  nohup loft --interpret --lib lib/ src/editor_server.loft >"$TMP/editor.log" 2>&1 &
PID=$!
i=0
while [ "$i" -lt 90 ]; do
  grep -q 'listening on port' "$TMP/editor.log" 2>/dev/null && break
  kill -0 "$PID" 2>/dev/null || { echo "FAIL — the server exited"; tail -5 "$TMP/editor.log"; exit 1; }
  sleep 1
  i=$((i + 1))
done
grep -q 'listening on port' "$TMP/editor.log" || { echo "FAIL — SERVER NEVER LISTENED"; exit 1; }
echo "  listening on $PORT (pid $PID)"

echo "── what reaches the limb block, and what it says ──"
node probe/a83/leaf_visible/limbwire.mjs  "$PORT" door/hung door/leaf   | tee "$TMP/wire.out"
node probe/a83/leaf_visible/limbwhere.mjs "$PORT" door/hung             | tee "$TMP/where.out"

fails=0
say() { echo "  $1 $2"; [ "$1" = "FAIL" ] && fails=$((fails + 1)) || true; }

# 1. the leaf reaches the wire as TWO limb meshes
grep -q '^door/hung .*8(.*B) 9(.*B)' "$TMP/wire.out" \
  && say PASS "door/hung puts two meshes in the limb block" \
  || say FAIL "door/hung did not put two meshes in the limb block"

# 2. THE CONTROL — a part opened as the subject uses the chunk space, not this block.
#    Without it, "ids 8 and 9 are populated" says nothing about which part filled them.
grep -q '^door/leaf .*NONE' "$TMP/wire.out" \
  && say PASS "door/leaf opened as a subject puts NOTHING in the limb block" \
  || say FAIL "door/leaf filled the limb block — the probe cannot attribute what it sees"

# 3. the leaf's panel is painted in the WALL surface's own colour
grep -q 'id 9: colour (0.55,0.52,0.46)' "$TMP/where.out" \
  && say PASS "the leaf's panel is the wall's colour, 0.55,0.52,0.46" \
  || say FAIL "the leaf's panel is no longer the wall's colour — read where.out"

# 4. …and one WALL_UP tall (12 * HEIGHT_SCALE 0.25 = 3.0) on the 0.25 paving
grep -q 'id 9:.*y 0.00\.\.3\.25' "$TMP/where.out" \
  && say PASS "the leaf's panel is the wall's height, y 0.00..3.25" \
  || say FAIL "the leaf's panel is no longer the wall's height — read where.out"

echo
if [ "$fails" -eq 0 ]; then
  echo "all four behaved as on 2026-08-08 — the leaf IS drawn, as the wall"
  exit 0
fi
echo "$fails of 4 changed — read probe/a83/leaf_visible/README.md before assuming a regression"
exit 1
