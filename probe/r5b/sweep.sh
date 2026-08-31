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
C=lib/hex_editor/tests/corner_close.loft
E=lib/hex_editor/src/hex_editor.loft
S=lib/hex_editor/src/session.loft
SAVE=$(mktemp -d)
save()    { cp "$G" "$SAVE/g"; cp "$W" "$SAVE/w"; cp "$T" "$SAVE/t"; cp "$C" "$SAVE/c"; cp "$E" "$SAVE/e"; cp "$S" "$SAVE/s"; }
restore() { cp "$SAVE/g" "$G"; cp "$SAVE/w" "$W"; cp "$SAVE/t" "$T"; cp "$SAVE/c" "$C"; cp "$SAVE/e" "$E"; cp "$SAVE/s" "$S"; }
save
trap 'restore; rm -rf "$SAVE"' EXIT INT TERM

# ⛔ **AN UNAPPLIED CUT MUST NOT READ AS A GREEN ROW**, and it did once: `edge_role_at`'s
# body changed under row 1 and the row came back `green` with a warning line above it that a
# skimming reader would miss. *A sabotage that silently fails to apply says "the tests cannot
# see this"*, which is the one answer a sweep exists to distinguish from "nothing was cut".
cut() { python3 probe/r5b/cut.py "$1" 2>&1 || return 1; }

# ⚠ **TWO TEST FILES, AND WHICH ONE WENT RED IS PART OF THE ANSWER.** `role_mat.loft`
# carries the roles; `corner_close.loft` carries `B4y`'s corner rule, and the door the
# fix stopped it deleting is only visible there.
one() {   # $1 = test file basename; echoes "ok" | "red:<n>" | "build" | "noresult"
  out=$(cd lib/hex_editor && loft test "tests/$1" 2>&1)
  if printf '%s' "$out" | grep -qE '^error|Unknown (function|type|field)|declared by more than one'; then
    echo build; return
  fi
  res=$(printf '%s' "$out" | grep -E '^test result' | head -1)
  [ -z "$res" ] && { echo noresult; return; }
  case "$res" in
    *"result: ok."*) echo ok ;;
    *) echo "red:$(printf '%s' "$out" | grep -cE "^  FAIL  tests/$1::")" ;;
  esac
}

run() {
  a=$(one role_mat.loft)
  b=$(one corner_close.loft)
  case "$a$b" in
    *build*)    printf '%s | ⛔ DID NOT BUILD — the row is worthless\n' "$1"; return ;;
    *noresult*) printf '%s | ⛔ NO RESULT LINE\n' "$1"; return ;;
  esac
  case "$a:$b" in
    ok:ok) printf '%s | green\n' "$1" ;;
    ok:*)  printf '%s | RED corner_close (%s)\n' "$1" "${b#red:}" ;;
    *:ok)  printf '%s | RED role_mat (%s)\n'     "$1" "${a#red:}" ;;
    *)     printf '%s | RED both (%s/%s)\n'      "$1" "${a#red:}" "${b#red:}" ;;
  esac
}

echo "── the subject is PRESENT before row 0 ─────────────────────────────────"
grep -q 'pub fn edge_role_at'            "$G" && echo "  edge_role_at         present" || echo "  edge_role_at         ⛔ ABSENT"
grep -q 'pub fn is_opening_at'           "$G" && echo "  is_opening_at        present" || echo "  is_opening_at        ⛔ ABSENT"
grep -q 'pub fn wall_stops_walk_at'      "$W" && echo "  wall_stops_walk_at   present" || echo "  wall_stops_walk_at   ⛔ ABSENT"
grep -q 'wall_stops_walk_at(wld, q, r'   "$W" && echo "  the walk CALLS it    present" || echo "  the walk CALLS it    ⛔ ABSENT"
grep -q 'pub fn edge_is_wall_at'        "$G" && echo "  edge_is_wall_at      present" || echo "  edge_is_wall_at      ⛔ ABSENT"
n8=$(grep -ho 'edge_is_wall_at(' "$G" "$E" "$S" | wc -l)
echo "  …called at            $n8 site(s) — 1 definition + 8 readers = 9"
echo
echo "row | what was cut                                       | result"
echo "----|----------------------------------------------------|-------"
# ⚠ Rows can be named on the command line while a step is being written — `sh
# probe/r5b/sweep.sh 14 15 17`. The default is the whole table, which is what the
# record quotes.
ROWS=${*:-0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20}
for row in $ROWS; do
  restore
  lbl=$(python3 probe/r5b/cut.py --label "$row")
  if [ "$row" != 0 ] && ! cut "$row"; then
    printf '%s | ⛔ THE CUT DID NOT APPLY — the row is worthless, refresh it\n' "$lbl"
    continue
  fi
  run "$lbl"
done
restore
printf '\nrestored from copies: '
ok=1
for pair in "$SAVE/g $G" "$SAVE/w $W" "$SAVE/t $T" "$SAVE/c $C" "$SAVE/e $E" "$SAVE/s $S"; do
  # shellcheck disable=SC2086
  diff -q $pair >/dev/null || ok=0
done
[ "$ok" = 1 ] && echo "all five files identical to the saved subject" \
              || echo "⛔ THE TREE DID NOT COME BACK"
