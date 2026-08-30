#!/bin/sh
# CAN THE DOCKET SEE WHAT IT CLAIMS TO COUNT? — plan 21 `R5a`.
#
#   sh probe/roles/run.sh
#
# `tools/roles.sh` reports an ABSENCE — *nothing new decides an identity in code* — and
# CLAUDE.md's standing rule is that an instrument gets checked against something it
# SHOULD find before its silence is believed. This one was wrong twice on the afternoon
# it was written, and both mistakes read as a clean pass:
#
#   · a greedy `sed` took the LAST constant on a line, so `m == DOOR_MAT || m ==
#     WINDOW_MAT` reported `WINDOW_MAT` alone and `DOOR_MAT` was never in the docket;
#   · awk has no `\b`, so a pattern ending `_MAT` matched `PAL_MATERIAL` as `PAL_MAT`
#     and a palette AXIS constant was docketed as a material identity.
#
# ⚠ **NOTHING IN THE TREE IS EDITED.** The scan target is a variable and this points it
# at `probe/roles/fixtures/`, so there is no subject to restore and no `git checkout` to
# get wrong. The fixtures are not under `lib/*/src/`, so they can never reach the real
# baseline either.
set -u
cd "$(dirname "$0")/../.." || exit 1

fails=0
ok()  { printf '  ok   %s\n' "$*"; }
bad() { printf '  FAIL %s\n' "$*"; fails=$((fails + 1)); }

FIX=probe/roles/fixtures/bypass.loft

# ⚠ Run the scan through the script's own BLESS path into a throwaway baseline, so what
# is asserted is what the script would RECORD — not a second copy of its regex here.
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT INT TERM
cp tools/roles.tsv "$TMP/keep.tsv"
ROLES_SCAN="$FIX" ROLES_BLESS=1 sh tools/roles.sh >/dev/null 2>&1
cp tools/roles.tsv "$TMP/found.tsv"
cp "$TMP/keep.tsv" tools/roles.tsv

say() { awk -F'\t' -v g="$1" -v c="$2" '$2==g && $3==c {print $4}' "$TMP/found.tsv"; }

echo "A  every occurrence on a line is walked"
[ "$(say two_on_one_line DOOR_MAT)"   = 1 ] && ok "DOOR_MAT — the one the greedy scan lost" \
  || bad "DOOR_MAT on a two-comparison line: got '$(say two_on_one_line DOOR_MAT)', want 1"
[ "$(say two_on_one_line WINDOW_MAT)" = 1 ] && ok "WINDOW_MAT beside it" \
  || bad "WINDOW_MAT: got '$(say two_on_one_line WINDOW_MAT)', want 1"

echo
echo "B  the control: a single site is one row"
[ "$(say one_site FLOOR_MAT)" = 1 ] && ok "one_site FLOOR_MAT 1" \
  || bad "one_site: got '$(say one_site FLOOR_MAT)', want 1"

echo
echo "C  a constant a material name is only a PREFIX of is not one"
n=$(awk -F'\t' '$3 ~ /^PAL_/' "$TMP/found.tsv" | wc -l | tr -d ' ')
[ "$n" = 0 ] && ok "PAL_MATERIAL is absent — the axis is not an identity" \
  || bad "a PAL_* constant reached the docket ($n row(s))"

echo
echo "D  prose about the rule is not a use of it"
n=$(awk -F'\t' '$3=="ROOF_MAT"' "$TMP/found.tsv" | wc -l | tr -d ' ')
[ "$n" = 0 ] && ok "the commented ROOF_MAT is not counted" \
  || bad "a comment line was docketed ($n row(s))"

echo
echo "E  two comparisons of one constant in one function are one row of count 2"
[ "$(say twice_the_same ROAD_MAT)" = 2 ] && ok "twice_the_same ROAD_MAT 2" \
  || bad "twice_the_same: got '$(say twice_the_same ROAD_MAT)', want 2"

echo
echo "F  and the real tree is unchanged by having run this"
# ⚠ TWO ASSERTIONS, NOT ONE, AND THE FIRST SWEEP IS WHY. Sabotaging the scanner made a
# single combined row say *"the probe left the docket changed"* — which is false and sends
# the reader to the wrong file. A row guarded on another row's subject reports the first
# failure's shadow; this tree has written that finding once already (`3c51bd6`).
if diff -q "$TMP/keep.tsv" tools/roles.tsv >/dev/null 2>&1; then
  ok "tools/roles.tsv is byte-identical to what this probe found it as"
else
  bad "the probe left tools/roles.tsv changed — restore it from git"
fi
if sh tools/roles.sh >/dev/null 2>&1; then
  ok "…and the real docket still passes"
else
  bad "the real docket does NOT pass — the scanner, not this probe, is what moved"
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "roles: the docket sees every shape it claims to count."
  exit 0
fi
echo "roles: $fails row(s) FAILED — the docket's silence cannot be believed."
exit 1
