# WHICH LOFT AM I ON? — two cells, three states, no ambiguity.
#
#   sh probe/loftstate/run.sh        (or `make loft-state`)
#
# ⚠ **`loft --version` CANNOT ANSWER THIS.** Every build on this box since 2026-08-16 says
# `loft 2026.8.0` — five of them in two days, three in one morning. The sha is the handle,
# and a STATE is a property of a binary: a result cached from before a swap reads as the
# wrong state with no indication that it is stale. So every line below is stamped.
#
# ── WHY THIS EXISTS ────────────────────────────────────────────────────────
#
# loft widened how arithmetic on a forward-declared callee is typed (correctly: declaration
# order should not decide whether a program compiles). The consequence is that
# `s[start..start + 2]`, with `start` derived from a callee declared LOWER, has no type on
# pass 1 — and the text-slice checks refused an unknown outright. A deferral was needed at
# each site that reads a bound.
#
# ⛔ **A ONE-CELL PROBE CANNOT ANSWER THIS, AND MINE COULD NOT.** `via_variable` alone passes
# on a binary that is FIXED and on one that is simply OLDER THAN THE DEFECT, and those want
# opposite actions. `callee_direct` is the cell that must FAIL on a pre-widening build; the
# pair is what separates three states from two. That correction came from the loft side and
# it is the whole reason this file works.
#
# ⚠ **AND THE TWO CELLS LEAVE DIFFERENT BOUNDS UNRESOLVED, WHICH IS NOT DECORATION.** The
# start bound and the range END are checked in two places with two messages. The first fix
# deferred only the start, and a guard whose end bound was always known never reached the
# second site — it passed while testing nothing. Both cells here derive BOTH bounds from an
# unresolved value.
set -u
LOFT="${LOFT:-loft}"
BIN=$(command -v "$LOFT" 2>/dev/null || echo "$LOFT")
SHA=$(sha256sum "$BIN" 2>/dev/null | cut -c1-16)
err() { timeout 200 "$LOFT" --interpret "probe/loftstate/$1.loft" 2>&1 | grep -c '^error:'; }

v=$(err via_variable); d=$(err callee_direct)
echo "loft-state: $BIN"
echo "            sha $SHA · $("$LOFT" --version 2>/dev/null) ⚠ the version cannot tell builds apart"
printf '            via_variable  %s\n' "$([ "$v" -eq 0 ] && echo PASS || echo FAIL)"
printf '            callee_direct %s\n' "$([ "$d" -eq 0 ] && echo PASS || echo FAIL)"
if   [ "$v" -gt 0 ]; then
  echo "⛔ WIDENING WITHOUT A COMPLETE DEFERRAL — a text slice whose bound comes from a"
  echo "   lower declaration will not compile. Not ours to fix; report it and pin a build."
  exit 1
elif [ "$d" -gt 0 ]; then
  echo "⚠  PRE-WIDENING — older than the defect. Safe by age, not by cure: the class is"
  echo "   dormant and returns the moment this box installs a build from the wrong branch."
  exit 0
else
  echo "✅ WIDENING + DEFERRAL, COMPLETE — both bounds defer on pass 1."
  exit 0
fi
