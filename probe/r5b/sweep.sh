#!/bin/sh
# CAN `role_mat.loft` SEE `R5b` GO WRONG? — plan 21.
#
#   sh probe/r5b/sweep.sh
#
# ⚠ **RESTORE IS FROM COPIES, NEVER `git checkout`** — CLAUDE.md's rule. The subject
# of a sweep is the step just built, so it is uncommitted by definition and a revert
# between rows deletes it, scoring every row a miss *and* taking the tests with it.
# ⚠ **THE SUBJECT IS ASSERTED PRESENT BEFORE ROW 0**: a sweep over an absent feature
# answers *nothing went red* to every question.
# ⚠ **AND EVERY ROW ASSERTS THE PACKAGE STILL BUILT** before its result is read — a
# row that will not compile goes red everywhere and reads as the strongest catch in
# the table, worth nothing.
set -u
cd "$(dirname "$0")/../.." || exit 1
G=lib/hex_editor/src/gesture.loft
W=lib/hex_editor/src/walk.loft
T=lib/hex_editor/tests/role_mat.loft
SAVE=$(mktemp -d); trap 'cp "$SAVE/gesture.loft" "$G"; cp "$SAVE/walk.loft" "$W"; cp "$SAVE/role_mat.loft" "$T"; rm -rf "$SAVE"' EXIT INT TERM
cp "$G" "$SAVE/gesture.loft"; cp "$W" "$SAVE/walk.loft"; cp "$T" "$SAVE/role_mat.loft"
restore() { cp "$SAVE/gesture.loft" "$G"; cp "$SAVE/walk.loft" "$W"; cp "$SAVE/role_mat.loft" "$T"; }

cut() { python3 probe/r5b/cut.py "$1" || echo "  ⛔ the cut did not apply"; }

run() {
  out=$(cd lib/hex_editor && loft test tests/role_mat.loft 2>&1)
  if printf '%s' "$out" | grep -qE '^error|Unknown (function|type|field)|declared by more than one'; then
    printf '%s | ⛔ DID NOT BUILD — the row is worthless\n' "$1"
    printf '%s\n' "$out" | grep -E '^error|Unknown ' | head -2
    return
  fi
  res=$(printf '%s' "$out" | grep -E '^test result' | head -1)
  if [ -z "$res" ]; then printf '%s | ⛔ NO RESULT LINE\n' "$1"; return; fi
  n=$(printf '%s' "$out" | grep -cE '^  FAIL  tests/role_mat.loft::')
  case "$res" in
    *"result: ok."*) printf '%s | green\n'   "$1" ;;
    *)               printf '%s | RED (%s)\n' "$1" "$n" ;;
  esac
}

echo "── the subject is PRESENT before row 0 ─────────────────────────────────"
grep -q 'pub fn edge_role_at'            "$G" && echo "  edge_role_at         present" || echo "  edge_role_at         ⛔ ABSENT"
grep -q 'pub fn is_opening_at'           "$G" && echo "  is_opening_at        present" || echo "  is_opening_at        ⛔ ABSENT"
grep -q 'pub fn wall_stops_walk_at'      "$W" && echo "  wall_stops_walk_at   present" || echo "  wall_stops_walk_at   ⛔ ABSENT"
grep -q 'wall_stops_walk_at(wld, q, r'   "$W" && echo "  the walk CALLS it    present" || echo "  the walk CALLS it    ⛔ ABSENT"
echo
echo "row | what was cut                                       | result"
echo "----|----------------------------------------------------|-------"
for row in 0 1 2 3 4 5 6 7 8 9; do
  restore
  [ "$row" = 0 ] || cut "$row"
  run "$(python3 probe/r5b/cut.py --label "$row")"
done
restore
printf '\nrestored from copies: '
diff -q "$SAVE/gesture.loft" "$G" >/dev/null && diff -q "$SAVE/walk.loft" "$W" >/dev/null \
  && diff -q "$SAVE/role_mat.loft" "$T" >/dev/null && echo "identical to the saved subject"
