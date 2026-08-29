#!/bin/sh
# ── THE SABOTAGE SWEEP FOR `B4y` — THE CORNER TWO RUNS LEAVE OPEN ───────────
#
# ⚠ Restores from a COPY, never `git checkout` — the subject of a sweep is uncommitted by
# definition, and reverting it between rows makes every row report a miss. Every sabotage
# asserts that it APPLIED: a replace that matches nothing is silent, and a row that cut
# nothing reports green in the same words as a row that cut something and was not caught.
#
# ⚠ **AND A ROW THAT WILL NOT BUILD IS VOID, NOT A CATCH.** Plan 26 `B4l` learned this the
# expensive way: a sabotage naming something the module cannot see turns every file red,
# which reads as the strongest row in the table and is worth nothing.
#
# ⛔ **ROW 8 IS THE ONE THAT MAKES THE OTHERS READABLE**: a change in the same neighbourhood
# that changes no answer must go GREEN, or the table only says *these tests notice edits*.
#
# ⚠ **AND ROWS 2 TO 5 ARE EXPECTED GREEN, WHICH IS WHY 6 AND 7 EXIST.** The first version of
# this sweep had one catching row and four blind ones — every guard it cut is defensive, so
# the table said nothing about whether the tests can see the rule COMPUTED WRONG as against
# ABSENT. Rows 6 and 7 are that question: a join that writes the wrong edge, and a join that
# picks the wrong vertices.
set -e
cd "$(dirname "$0")/../.."
SRC=lib/hex_editor/src/gesture.loft
KEEP=$(mktemp -d)
cp "$SRC" "$KEEP/gesture.loft"
restore() { cp "$KEEP/gesture.loft" "$SRC"; }
trap 'restore; rm -rf "$KEEP"' EXIT

grep -q 'cc = wall_corner_close(wld, eg, q0, r0, w, h, mat, grade);' "$SRC" \
  || { echo "row 0: the corner close is NOT CALLED from wall_stamp — this sweep would answer nothing"; exit 2; }

run() {
  out=$(loft --interpret --lib lib/ --tests lib/hex_editor/tests/corner_close.loft 2>&1) || true
  out="$out
$(loft --interpret --lib lib/ --tests lib/hex_editor/tests/peel.loft 2>&1 || true)"
  if printf '%s' "$out" | grep -q "parse errors\|^Error:\|error:"; then
    echo "  ⛔ DOES NOT BUILD — row void"; return
  fi
  red=$(printf '%s\n' "$out" | grep -oP '(corner_close|peel)\.loft::\K[a-z_]+' | sort -u | tr '\n' ' ')
  if [ -z "$red" ]; then echo "  green"; else echo "  RED: $red"; fi
}

cut() {
  python3 - "$SRC" "$1" "$2" <<'PY'
import sys
p, a, b = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read()
n = s.count(a)
assert n == 1, f'SABOTAGE DID NOT APPLY: {n} matches for {a!r}'
open(p, 'w').write(s.replace(a, b, 1))
PY
}

echo "row 0 — control, nothing cut"
restore; run

echo "row 1 — the corner close is never called (the feature absent)"
restore
cut 'if n > 0 {
    cc = wall_corner_close' 'if false {
    cc = wall_corner_close'
run

echo "row 2 — ONE HEX EDGE becomes ANY distance (the join loses its integer)"
restore
cut '(da == 0 && db == 3) || (da == 3 && db == 0) || (da == 3 && db == 0 - 3)' \
    'true || (da == 3 && db == 0) || (da == 3 && db == 0 - 3)'
run

echo "row 3 — the join is not scoped to this run's own field"
restore
cut '      if !(cm[i] ?? false) && !(cm[j] ?? false) { continue; }
' ''
run

echo 'row 4 — corner_write matches only one vertex ORDER'
restore
cut '        cw_hit = (cw_pa == a1 && cw_pb == b1 && cw_qa == a2 && cw_qb == b2)
              || (cw_qa == a1 && cw_qb == b1 && cw_pa == a2 && cw_pb == b2);' \
    '        cw_hit = (cw_pa == a1 && cw_pb == b1 && cw_qa == a2 && cw_qb == b2);'
run

echo "row 5 — a vertex may be spent twice (the guard removed)"
restore
cut '    if cu[i] ?? false { continue; }
    for j in i + 1..len(ca) {
      if cu[i] ?? false { continue; }
      if cu[j] ?? false { continue; }' \
    '    for j in i + 1..len(ca) {'
run

echo 'row 6 — corner_write writes the first unmarked edge it finds (the match ignored)'
restore
cut '        if !cw_hit { continue; }' '        if false { continue; }'
run

echo 'row 7 — a FREE END becomes a mid-chain vertex (degree 2 instead of 1)'
restore
cut '    if cc_deg != 1 { continue; }' '    if cc_deg != 2 { continue; }'
run

echo 'row 8 — ✅ THE GREEN CONTROL: the corner pair is spelled the other way round'
restore
cut '        cc_mine = edge_mat(eg, q, r, cc_nq, cc_nr) != 0;
        (cc_e1, cc_e2) = hex_grid::hex_edge_corners(cc_d);
        for cc_k in 0..2 {
          cc_c = if cc_k == 0 { cc_e1 } else { cc_e2 };' \
    '        cc_mine = edge_mat(eg, q, r, cc_nq, cc_nr) != 0;
        (cc_e1, cc_e2) = hex_grid::hex_edge_corners(cc_d);
        for cc_k in 0..2 {
          cc_c = if cc_k == 1 { cc_e2 } else { cc_e1 };'
run

restore
echo "restored"
