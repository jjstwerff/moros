#!/bin/sh
# ⛔ WHAT `R5b.2` COSTS THE PEEL — plan 21, and this is the step rather than a detail.
#
#   sh probe/r5b/cost.sh
#
# `R5a` is the argument for measuring: moving FIVE window scans onto `ground_is` put
# `hex_mesh/tests/planview.loft` through `loft test`'s 300-second wall and took two
# commits to recover. `R5b.2` moves EIGHT, and `peel.loft` was brought from 70% of that
# deadline to 26% the day before.
#
# ⚠ **A-B-B-A AT THE BUILD LEVEL** — which predicate the readers call is a source-level
# fact — with `/proc/loadavg` beside every row, because this box runs other agents' work
# and `probe/r5b/run.sh` measured the same binary 2.5x apart between two rows.
# ⚠ **RESTORED FROM COPIES, NEVER `git checkout`.**
set -u
cd "$(dirname "$0")/../.." || exit 1
G=lib/hex_editor/src/gesture.loft
TMP=$(mktemp -d); trap 'cp "$TMP/g" "$G"; rm -rf "$TMP"' EXIT INT TERM
cp "$G" "$TMP/g"

grep -q 'edge_is_wall_at(wld, q, r' "$G" || { echo "⛔ the readers are not wired — nothing to measure"; exit 1; }

# ⚠ The four gesture.loft readers are swapped TOGETHER: they are one change, and a
# per-site clock would be four times the runs for a number nobody acts on per site.
swap() {
  python3 - "$G" "$1" <<'PY'
import io, sys
p, want = sys.argv[1], sys.argv[2]
s = io.open(p, encoding='utf-8').read()
pairs = [
 ('  if !edge_is_wall_at(wld, q, r, wall_of(wld, q, r, d, ref)) { return false; }',
  '  if !edge_is_wall(wall_of(wld, q, r, d, ref)) { return false; }'),
 ('        if !edge_is_wall_at(wld, q, r, wall_of(wld, q, r, d, ref)) { continue; }',
  '        if !edge_is_wall(wall_of(wld, q, r, d, ref)) { continue; }'),
 ('        got = edge_is_wall_at(wld, q, r, wall_of(wld, q, r, d, ref));',
  '        got = edge_is_wall(wall_of(wld, q, r, d, ref));'),
 ('        rg_got = edge_is_wall_at(wld, q, r, wall_of(wld, q, r, rg_d, ref));',
  '        rg_got = edge_is_wall(wall_of(wld, q, r, rg_d, ref));'),
 ('        if !edge_is_wall_at(wld, q, r, wall_of(wld, q, r, cc_d, cc_ref)) { continue; }',
  '        if !edge_is_wall(wall_of(wld, q, r, cc_d, cc_ref)) { continue; }'),
]
n = 0
for at, by in pairs:
    need, have = (at, by) if want == 'wired' else (by, at)
    if s.count(need) == 1: n += 1; continue
    if s.count(have) != 1: sys.exit('neither form found for: ' + at.strip()[:40])
    s = s.replace(have, need); n += 1
io.open(p, 'w', encoding='utf-8').write(s)
PY
}

row() {   # $1 = label, $2 = package dir, $3 = test file
  printf '%-34s load %-6s ' "$1" "$(cut -d' ' -f1 /proc/loadavg)"
  t0=$(date +%s.%N)
  o=$(cd "$2" && loft --timeout 300 --lib ../ --tests "$3" 2>&1)
  t1=$(date +%s.%N)
  printf '%6.1f s   %s\n' "$(echo "$t1 - $t0" | bc)" \
    "$(printf '%s' "$o" | grep -E '^test result' | cut -c1-38)"
}

for f in "lib/hex_editor tests/peel.loft" "lib/hex_mesh tests/planview_region.loft"; do
  # shellcheck disable=SC2086
  set -- $f
  printf '\n── %s ──────────────────────────────\n' "$2"
  swap wired; row "A1 AFTER  (edge_is_wall_at)" "$1" "$2"
  swap bytes; row "B1 BEFORE (edge_is_wall)"    "$1" "$2"
  swap bytes; row "B2 BEFORE again"             "$1" "$2"
  swap wired; row "A2 AFTER  again"             "$1" "$2"
done

cp "$TMP/g" "$G"
printf '\nrestored: '; diff -q "$TMP/g" "$G" >/dev/null && echo "gesture.loft identical to the saved subject"
