#!/bin/sh
# P6 (plan 22) — DOES A `--html` PAGE HAVE A FILESYSTEM, AND DOES IT SURVIVE A
# RELOAD?
#
#   probe/p6/run.sh          (or `make probe-p6`)
#
# [PAGES_EDITOR § The filesystem correction](../../doc/claude/PAGES_EDITOR.md)
# measured `--html` binding **0 of 20** `fs_*` names — a page that draws could not
# store — and raised [loft#851](https://github.com/loft-lang/loft/issues/851) for
# it. The design then wrote `W5`, an interim localStorage shim, with the note:
# *"if #851 lands before this is built, SKIP `W5` entirely."*
#
# #851 is closed and merged (`28e85b42`, 2026-08-11). ⚠ THAT IS A CHANGELOG, NOT A
# MEASUREMENT, and this tree's rule is to check the toolchain rather than believe
# one. This is the check, and it decides whether a whole phase exists.
#
# Five parts, and the middle two are the claim:
#
#   P6a  the ORACLE — `--interpret`, run twice. loft#851's contract is *the page
#        answers what --interpret answers*, so the baseline is what to compare to.
#   P6b  the emitted page's `fs_*` names, the successor to the 0-of-20 grep.
#   P6c  the page over http, loaded TWICE.
#   P6d  the page from `file://`, loaded TWICE — the quick start's own scheme.
#   P6e  `P3`'s open number: does a BUILT world fit in localStorage?
#
# ⚠ `P6c`/`P6d` CARRY A SECOND CLAIM, and it is `W2`'s: a page reads its BASE TREE
# — a file it was given rather than one it wrote — and `list_dir`s it, answering
# byte for byte what the interpreter answers for a real directory. If that holds,
# the part catalogue needs no *fetched manifest* and no second code path in a page.
# Its control is `P6_SABOTAGE=nobase`.
set -e
cd "$(dirname "$0")/../.."
LOFT="${LOFT:-loft}"
OUT="probe/p6/.loft"
# ⚠ loft resolves a relative path against the program's SOURCE directory, not the
# process's cwd — measured here, and it is why the world lands beside `store.loft`.
WORLD="probe/p6/p6_world.hxw"
fail() { echo "$1"; exit 1; }

echo "── P6a  the oracle: --interpret, twice ─────────────────────────────"
rm -f "$WORLD"
# The base tree the page will be GIVEN, as a real directory for the interpreter.
mkdir -p probe/p6/base
printf 'hello from the base tree\n' > probe/p6/base/hello.txt
o1=$($LOFT --lib lib/ probe/p6/store.loft 2>/dev/null)
o2=$($LOFT --lib lib/ probe/p6/store.loft 2>/dev/null)
a1=$(printf '%s\n' "$o1" | grep '^P6 RESULT' || true)
a2=$(printf '%s\n' "$o2" | grep '^P6 RESULT' || true)
# ⚠ THE EXPECTED BASE LINE IS TAKEN FROM THE INTERPRETER'S OWN OUTPUT, never typed
# out here. loft#851's contract is *the page answers what --interpret answers*, so
# a second hand-written copy would be a table checked against itself.
base=$(printf '%s\n' "$o1" | sed -n 's/.*\(base file .*\)$/\1/p' | head -1)
echo "   run 1: $a1"
echo "   run 2: $a2"
echo "   base:  $base"
case "$a1" in 'P6 RESULT pass1 ok'*) ;; *) fail "P6 FAIL — the interpreter cannot even do pass 1: $a1";; esac
case "$a2" in 'P6 RESULT pass2 ok'*) ;; *) fail "P6 FAIL — the interpreter lost the file between runs: $a2";; esac
case "$base" in 'base file '[0-9]*) ;; *) fail "P6 FAIL — the interpreter cannot read its own base directory: $base";; esac
rm -f "$WORLD"

echo "── P6b  the page's fs_* names ──────────────────────────────────────"
$LOFT --html --lib lib/ probe/p6/store.loft >/dev/null 2>&1
test -f "$OUT/store.html" || fail "P6 FAIL — no page was emitted"
n=$(grep -ao 'fs_[a-z_][a-z_]*' "$OUT/store.html" | sort -u | wc -l)
# ⚠ THE GREP IS CHECKED AGAINST SOMETHING IT SHOULD FIND AND SOMETHING IT SHOULD
# NOT, because its default answer is "absent" and this tree has shipped three
# greps whose zero read as a clean result. `host_output` was bound before #851 and
# must appear; `fs_chmod` is not a loft builtin and must not.
c_yes=$(grep -aoc 'host_output' "$OUT/store.html" || true)
c_no=$(grep -aoc 'fs_chmod' "$OUT/store.html" || true)
echo "   distinct fs_* names: $n   (the design measured 0 of 20)"
echo "   control: host_output $c_yes   fs_chmod $c_no"
test "$c_yes" -gt 0 || fail "P6 FAIL — the grep cannot see a name that IS there; its zero means nothing"
test "$c_no" -eq 0 || fail "P6 FAIL — the grep matches a name that is not bound; it is not reading imports"
test "$n" -ge 20 || fail "P6 FAIL — only $n fs_* names in the page: #851 is not in this toolchain"

echo "── P6c  the page over http, twice ──────────────────────────────────"
node probe/p6/drive.mjs http "$OUT" "$base"

echo "── P6d  the page from file://, twice ───────────────────────────────"
node probe/p6/drive.mjs file "$OUT" "$base"

echo "── P6e  P3: does a BUILT world fit in localStorage? ────────────────"
# ⚠ THE FILE IS NOT THE COST. `LayeredFS` keeps its delta as a `localStorage`
# string, and P6c measured 11092 characters for an 8277-byte world — 1.34x. The
# budget is ~5 MB per origin, so the number that matters is the encoded one.
if [ -f worlds/headless.hxw ]; then
  b=$(wc -c < worlds/headless.hxw)
  echo "   the house scene (tools/scripts/house.keys): $b bytes on disk, ~$((b * 134 / 100)) encoded"
  echo "   against a ~5 MB localStorage budget: $((b * 134 / 100 * 100 / 5000000)) %"
else
  echo "   SKIPPED — no worlds/headless.hxw; run \`make headless-same\` first"
fi

echo
echo "P6 PASS — a --html page has a filesystem, and a world saved in it survives a reload."
echo "          It reads its BASE TREE exactly as the interpreter reads a directory."
echo "          W5 (the interim storage shim) is not needed: SKIP it."
