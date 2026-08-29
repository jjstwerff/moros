#!/bin/sh
# ── THE SABOTAGE SWEEP FOR `C2` — A ROOM IS THE HOUSE AGAIN, ADJACENT ───────
#
# ⚠ Restores from a COPY, never `git checkout` — the subject is uncommitted by definition.
# Every sabotage asserts it APPLIED, and a row that will not build is VOID rather than a catch.
set -e
cd "$(dirname "$0")/../.."
SRC=lib/hex_editor/src/hex_editor.loft
KEEP=$(mktemp -d)
cp "$SRC" "$KEEP/hex_editor.loft"
restore() { cp "$KEEP/hex_editor.loft" "$SRC"; }
trap 'restore; rm -rf "$KEEP"' EXIT

grep -q 'pub fn room_add' "$SRC" || { echo "row 0: room_add is ABSENT — this sweep answers nothing"; exit 2; }

run() {
  out=$(loft --interpret --lib lib/ --tests lib/hex_editor/tests/footprint.loft 2>&1) || true
  if printf '%s' "$out" | grep -q "parse errors\|^Error:"; then echo "  ⛔ DOES NOT BUILD — row void"; return; fi
  red=$(printf '%s\n' "$out" | grep -oP 'footprint\.loft::\K[a-z_]+' | sort -u | tr '\n' ' ')
  if [ -z "$red" ]; then echo "  green"; else echo "  RED: $red"; fi
}

cut() {
  python3 - "$SRC" "$1" "$2" <<'PY'
import sys
p, a, b = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read()
n = s.count(a)
assert n == 1, f'SABOTAGE DID NOT APPLY: {n} matches'
open(p, 'w').write(s.replace(a, b, 1))
PY
}

echo "row 0 — control, nothing cut"
restore; run

echo "row 1 — the seam is never cleared (the fuse becomes an overlay)"
restore
cut '        if !ra_want && ra_has && hexset_get(ra_un, q, r) && hexset_get(ra_un, ra_eq, ra_er) {' \
    '        if false {'
run

echo "row 2 — the union boundary is never written (the new box has no walls)"
restore
cut '        if ra_want && !ra_has {' '        if false {'
run

echo 'row 3 — a box with nothing to join is accepted (the gesture becomes place)'
restore
cut '  if ra_meets == 0 {' '  if false {'
run

echo "row 4 — the clear is not limited to what the union makes interior"
restore
cut 'if !ra_want && ra_has && hexset_get(ra_un, q, r) && hexset_get(ra_un, ra_eq, ra_er) {' \
    'if !ra_want && ra_has {'
run

echo "row 5 — ✅ THE GREEN CONTROL: the edge scan runs in a different order"
restore
cut '      for ra_e in [4, 5, 0] {' '      for ra_e in [0, 5, 4] {'
run

restore
echo "restored"
