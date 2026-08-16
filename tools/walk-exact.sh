#!/bin/sh
# A WALK'S LENGTH IS THE SCRIPT'S BUSINESS, NEVER THE BOX'S — plan 22 `T0`.
#
#   sh tools/walk-exact.sh
#
# `step <n>` under the default rate does not mean *n ticks*. It means *wait until n
# more ticks have been consumed*, and the consuming is paced by the WALL CLOCK — so the
# real count is n plus whatever the surrounding round-trips add. `rate 0` changes the
# pump: `may_tick = sim_pending > 0`, nothing advances except a `step`, and the count is
# exactly what the script asked for on any box.
#
# ⛔ **AND THE DIFFERENCE REACHES THE WORLD.** Measured on `tools/scripts/deck.keys`,
# exact stepping, one server run per tick count:
#
#     86, 88 ticks -> 3e7ef3b5f47649025b54ccac77244af4
#     90 … 98      -> cea971a07899e420b344c0054567f4e1
#
# The world is a **step function** of the tick count, and that script sat one to two
# ticks above the cliff. It reproduced only because every source of jitter *adds* ticks,
# so runs drifted up into a nine-tick plateau and never down over the edge.
#
# ── WHY THIS IS A RULE AND NOT A LIST OF FILENAMES ────────────────────────────
#
# ⚠ `tools/layering.sh` skipped every `moros_*` package for months, so the one check
# written to catch a mis-homed package exempted the packages that were mis-homed. **When
# a guard has an exemption rule, ask what it exempts by accident.** So this asks a
# question of the script instead of holding a list:
#
#   *can the world see where this walk ENDED?*
#
# Two ways it can, and either one demands `rate 0`:
#
#   1. the walk WRITES — a movement while an authoring mode is on (`6:` LEVEL,
#      `10:` ROAD, `47:` WATER). Every footfall stamps, so the tick count is the
#      shape of the ground. `cellar.keys` and `deck.keys`.
#   2. the walk POSITIONS a gesture — a `verb` after a movement with no `at` between.
#      This is plan 22 `K3e`'s predicate exactly, and `editor_run` refuses it at
#      runtime; here it is asked of the file. `deck.keys`.
#
# ✅ **AND THE EXEMPTION FALLS OUT OF THE RULE RATHER THAN BEING WRITTEN DOWN.**
# `determinism.keys` walks 90 ticks and is NOT flagged, because it says `at -3 -3 0`
# afterwards — a teleport overwrites the walker outright, so the walk contributes
# nothing the world can see. That is correct and it is also the warning:
#
# ⛔ **`determinism.keys` IS THE CLOCK-INDEPENDENCE CHECK THAT COULD NOT SEE THE
# CLOCK-DEPENDENCE.** Its header says *"run this at rate 1 and at rate 0 and the two
# world files must be byte-identical"* — performed for the first time on 2026-08-16 and
# it holds, `23d3f79779eb8177a6353e169d07f9ab` both ways. But its only walk is discarded
# by an `at`, so the one case where a clock DOES reach the world is the case it does not
# contain. A guard that works in one direction reads exactly like a guard — the third
# time this tree has written that sentence, after `faced_between` and
# `stroke_over_limit`.
set -u
cd "$(dirname "$0")/.." || exit 1

bad=0
seen=0
flagged=0

for f in $(find tools/scripts probe -name '*.keys' 2>/dev/null | grep -v '/out/' | sort); do
  seen=$((seen + 1))
  # One pass per file. `why` is empty unless the world can see where a walk ended.
  out=$(awk '
    function strip(l) { sub(/^[ \t]+/, "", l); sub(/#.*/, "", l); sub(/[ \t]+$/, "", l); return l }
    {
      l = strip($0)
      if (l == "") next
      n = split(l, a, /[ \t]+/); cmd = a[1]

      if (cmd == "rate" && a[2] + 0 == 0) { exact = 1 }

      # An authoring MODE the walk writes through. `6:1` on, `6:0` off; the road and
      # the water read the same way. A bare `send 6:` with no payload is an off.
      else if (cmd == "send") {
        split(a[2], m, ":")
        if (m[1] == 6 || m[1] == 10 || m[1] == 47) { mode = (m[2] + 0 != 0) }
      }

      else if (cmd == "hold" || cmd == "keys" || cmd == "turn") {
        walked = 1
        if (mode && !exact) { why = "walks while an authoring mode is on (`" l "`)"; exit }
      }
      else if (cmd == "at") { walked = 0 }
      else if (cmd == "verb") {
        if (walked && !exact) { why = "gestures after a walk with no `at` (`" l "`)"; exit }
      }
    }
    END { print why }
  ' "$f")
  if [ -n "$out" ]; then
    flagged=$((flagged + 1))
    echo "  WALK  $f"
    echo "        $out — and it never says \`rate 0\`, so the tick count is the box's."
    bad=$((bad + 1))
  fi
done

# ⚠ A CHECK OVER A CORPUS IT NEVER FOUND REPORTS A CLEAN RESULT. `CLAUDE.md`'s grep
# whose default answer is *absent*: if the glob breaks, every question below is answered
# "nothing is wrong" by a run that read no files at all.
if [ "$seen" -lt 30 ]; then
  echo "  ???  walk-exact read only $seen scripts — the corpus is ~36 files, so this"
  echo "       run means nothing. Check the find."
  exit 2
fi

if [ "$bad" -eq 0 ]; then
  echo "walk-exact: $seen scripts, every walk the world can see is at \`rate 0\`"
else
  echo "walk-exact: $flagged of $seen scripts let the wall clock decide a walk's length."
  echo "  Say \`rate 0\` before the walk. At the default rate \`step n\` means *wait for n"
  echo "  more ticks*, paced by the clock — and \`deck.keys\` sat one tick from keying a"
  echo "  different world because of it."
fi
exit "$bad"
