#!/bin/sh
# THE SABOTAGE SWEEP FOR `tools/src-build.sh` — can the guard go red, per program, for
# a real reason, and does it stay green for a change in the neighbourhood?
#
#   sh probe/srcb/sweep.sh        # writes probe/srcb/sweep.txt
#
# ⚠ **IT EDITS `src/*.loft` AND RESTORES FROM COPIES, NEVER FROM `git checkout`.** The
# subject of a sweep is the step you have just built, so it is uncommitted by
# definition; a checkout between rows deletes it and every row then reads as a miss.
# The copies are taken before row 0 and the tree is diffed against them at the end.
set -u
cd "$(dirname "$0")/../.."

# ⚠ THE FINAL ROW COMPARES `src/` AGAINST GIT, so a tree that was already dirty there
# would report this script's own restore as a failure. Say so up front rather than
# leaving the last row to lie about it.
if [ -n "$(git status --porcelain src/ 2>/dev/null)" ]; then
  echo "srcb: src/ has uncommitted edits — commit or stash them first"; exit 1
fi

BAK=$(mktemp -d)
trap 'cp "$BAK"/*.loft src/ 2>/dev/null; rm -rf "$BAK"' EXIT INT TERM HUP
cp src/*.loft "$BAK/"

OUT=probe/srcb/sweep.txt
: > "$OUT"
say() { printf '%s\n' "$*" | tee -a "$OUT"; }

# ⚠ **ASSERT THE SUBJECT IS PRESENT BEFORE ROW 0.** A sweep over an absent guard
# answers *nothing went red* to every question, which is the sentence a useless one
# produces.
[ -x tools/src-build.sh ] || { echo "srcb: tools/src-build.sh is missing — this sweep says nothing"; exit 1; }

# One row: apply $2 to $1, run the guard, report whether it named $1.
row() {
  tag=$1; file=$2; frag=$3; want=$4
  printf '%s' "$frag" >> "$file"
  log=$(sh tools/src-build.sh 2>&1); rc=$?
  cp "$BAK/$(basename "$file")" "$file"
  got=red; [ "$rc" -eq 0 ] && got=green
  named=no
  printf '%s\n' "$log" | grep -q "⛔ $file DID NOT COMPILE" && named=yes
  verdict=ok; [ "$got" = "$want" ] || verdict=MISS
  say "$(printf '%-8s %-24s want=%-5s got=%-5s named=%-3s %s' \
        "$tag" "$file" "$want" "$got" "$named" "$verdict")"
  [ "$verdict" = ok ] || fails=$((fails + 1))
}

fails=0
BAD='
fn sabotage_probe_unknown() -> integer {
  return no_such_function_anywhere(3);
}
'
GOOD='
fn sabotage_probe_valid(a: integer) -> integer {
  return a + 1;
}
'

say "── the guard's own sweep ─────────────────────────────────────────────────"
say "row 0   control — nothing edited"
log=$(sh tools/src-build.sh 2>&1); rc=$?
say "$(printf '%-8s %-24s want=%-5s got=%-5s %s' 'row 0' '(none)' green \
      "$([ $rc -eq 0 ] && echo green || echo red)" \
      "$([ $rc -eq 0 ] && echo ok || echo MISS)")"
[ $rc -eq 0 ] || fails=$((fails + 1))
printf '%s\n' "$log" | sed 's/^/         /' | tee -a "$OUT"

say ""
say "rows 1-5  one program at a time calls a function nobody declares"
i=0
for f in src/*.loft; do
  [ "$f" = src/editor_client.loft ] && continue
  i=$((i + 1))
  row "row $i" "$f" "$BAD" red
done

say ""
# ⚠ **THE OTHER DIRECTION, AND IT IS NOT OPTIONAL.** A guard that goes red on any edit
# at all is not seeing the defect — it is seeing that something changed. Plan 26 `B4l`
# is the anti-example: a sabotage the package could not COMPILE turned every row red,
# which reads as the strongest catch in the table and is worth nothing.
say "row N   the neighbourhood — a valid function added to each"
for f in src/*.loft; do
  [ "$f" = src/editor_client.loft ] && continue
  row "row N" "$f" "$GOOD" green
done

say ""
# ⚠ THE SKIP LIST IS PART OF THE SUBJECT. A guard that silently stopped scanning would
# pass every row above by never looking.
say "row S   the skipped program is NOT checked (and the skip is deliberate)"
printf '%s' "$BAD" >> src/editor_client.loft
sh tools/src-build.sh >/dev/null 2>&1; rc=$?
cp "$BAK/editor_client.loft" src/editor_client.loft
if [ "$rc" -eq 0 ]; then
  say "row S    src/editor_client.loft       want=green got=green  ok   (make page-check builds it)"
else
  say "row S    src/editor_client.loft       want=green got=red    MISS"; fails=$((fails + 1))
fi

say ""
# ⚠ AND THE TREE IS CHECKED BACK TO WHAT IT WAS. Every row above edits a real source
# file; a restore that missed one would leave the next reader a defect this script
# wrote.
cp "$BAK"/*.loft src/
if [ -n "$(git status --porcelain src/ 2>/dev/null)" ]; then
  say "srcb: ⛔ src/ IS NOT AS IT WAS — this sweep left an edit behind:"
  git status --porcelain src/ | tee -a "$OUT"
  fails=$((fails + 1))
else
  say "srcb: src/ restored, git-clean"
fi

say ""
[ "$fails" -eq 0 ] && say "srcb: every row as predicted" || say "srcb: $fails row(s) MISSED"
exit "$fails"
