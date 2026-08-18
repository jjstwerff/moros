#!/bin/sh
# ⛔ TWO PACKAGES MUST NOT EACH CLAIM ONE MODULE FILE NAME — loft#912.
#
# A module's BASENAME is global across the whole dependency graph, so when two
# packages each hold `src/<x>.loft` AND each say a bare `use <x>;`, only one of them
# gets its own file — and **the consumer's `use` line order decides which**. Measured
# 2026-08-18 on `skin`, held by `moros_sim` and `hex_part`:
#
#   use moros_sim; use hex_part;   ->  hex_part loses:  unknown type 'PartBox'
#   use hex_part; use moros_sim;   ->  moros_sim loses: Unknown function skin_overlap
#
# ⚠ **A QUALIFIED NAME DOES NOT HELP** — `hex_part::skin_covers` fails too, because the
# module never loads and there is no name to disambiguate between. So a published
# library's public surface can be silently amputated by an unrelated sibling in
# somebody else's graph.
#
# ✅ **THE FIX IS `use self::<x>;`**, which the compiler's own advice suggests and which
# is measured to work in both orders. This guard exists because that advice is not
# something to rely on: CLAUDE.md records the half of loft#912 where it is **silent
# exactly when the build goes red**, and a guard that only repeats a warning adds
# nothing.
#
# ⚠ IT ONLY FLAGS A BARE `use`. A package holding `src/skin.loft` and never saying
# `use skin;` claims nothing, so a same-named file elsewhere costs it nothing — that is
# why `render.loft` (lavition_ui and graphics) and `wall.loft` (hex_part and hex_world)
# are not on this list and are not defects.
set -u
cd "$(dirname "$0")/.."
ROOTS="lib/*/ ../loft-libs-world/*/"
# ⚠ THE REGISTRY IS SCANNED AT ITS NEWEST VERSION ONLY. Two versions of one package are
# never in one graph, so listing all of them would report a package colliding with
# itself — noise that trains a reader to skip the output.
for p in $(ls -d ~/.loft/registry/*/ 2>/dev/null | sed 's|.*/registry/||;s|/$||;s|-[0-9].*||' | sort -u); do
  newest=$(ls -d ~/.loft/registry/$p-*/ 2>/dev/null | sort -V | tail -1)
  [ -n "$newest" ] && ROOTS="$ROOTS $newest"
done

claims=$(for pk in $ROOTS; do
  [ -d "$pk/src" ] || continue
  for u in $(grep -ho "^use [a-z_][a-z_0-9]*;" $pk/src/*.loft 2>/dev/null \
             | sed 's/use //;s/;//' | sort -u); do
    # ⚠ **THE PACKAGE NAME, NOT THE DIRECTORY.** `../loft-libs-world/hex_place` and
    # `~/.loft/registry/hex_place-0.1.0` are ONE package — a working-tree copy and a
    # published one — and never both in a graph. The first draft compared directories
    # and reported fourteen collisions, every one of them a package with itself.
    [ -f "$pk/src/$u.loft" ] && echo "$u $(basename ${pk%/} | sed 's/-[0-9][0-9.]*$//')"
  done
done | sort -u)

bad=$(echo "$claims" | awk '{n[$1]++; a[$1]=a[$1]" "$2} END{for(k in n) if(n[k]>1) print k":"a[k]}')

# ⚠ THE VACUITY GUARD. An empty `claims` set has no duplicates in it either, and
# *nothing collides* is the sentence a run that scanned nothing produces.
if [ -z "$claims" ]; then
  echo "basenames: NOTHING WAS SCANNED — this run says nothing"; exit 1
fi
if [ -n "$bad" ]; then
  echo "basenames: two packages each claim one module file name — loft#912"
  echo "$bad" | sed 's/^/  ⛔ /'
  echo '  fix: use self::<name>; in each package that owns the file'
  exit 1
fi
echo "basenames: $(echo "$claims" | wc -l) module claim(s), no name claimed twice"
