#!/bin/sh
# THE PRE-FLIGHT FOR STARTING A PLAN — are its steps small AND validated?
#
#   sh tools/plans.sh <plan-dir>      e.g. 22-pages-client
#   make plan-check P=22-pages-client
#
# ⚠ THIS IS NOT A SUITE CHECK AND MUST NOT BECOME ONE. It is run at ONE moment —
# when a plan stops being a design and starts being work. **Until then a design may
# be anything**: a sketch, a paragraph, a table of half-formed rows. Demanding cut
# steps of every idea is how a gate becomes something people route around, and a
# design that cannot be rough is a design nobody writes down.
#
# So it is deliberately absent from `make fast`. What it costs is one command at the
# moment of starting, and what it buys is that the moment exists at all.
#
# ── WHAT IT CHECKS, AND THE HALF IT CANNOT ──────────────────────────────────
#
# The rule is [plans/README.md § What makes a step SAFE], and it has two bounds:
#
#   upper (safety)    the old path and the new one both run and are COMPARED
#                     exactly — otherwise the failure mode is `git revert`
#   lower (validity)  the step can go red ON ITS OWN, for a real reason —
#                     otherwise it is "built and never called", manufactured
#                     on purpose
#
# ⚠ ONLY THE MECHANICAL HALF IS HERE, AND SAYING SO IS THE POINT. Whether a
# `Verify` cell names a REAL comparison is judgement, and no script has it. What a
# script CAN see is a phase with no verification at all, and a phase whose effort
# letter says it is a lump — which are the two ways the judgement gets skipped in
# practice. A gate claiming to check the rule would be the "gate that restates a
# connection" this tree already refuses.
set -u

PLAN=${1:-}
if [ -z "$PLAN" ]; then
  echo "usage: sh tools/plans.sh <plan-dir>      (e.g. 22-pages-client)"
  echo "       run this WHEN STARTING a plan; a design may be rough until then."
  exit 2
fi

DIR="plans/$PLAN"
README="$DIR/README.md"
[ -d "$DIR" ] || { echo "PLANS: no such plan '$PLAN' — plans/ holds $(ls -d plans/*/ 2>/dev/null | wc -l)"; exit 1; }
[ -f "$README" ] || { echo "PLANS: $PLAN has no README.md"; exit 1; }

# ⚠ A LUMP, BY THE ONLY MEASURE A SCRIPT HAS. An `H`/`VH` phase cannot have a
# parallel run — there is no "half done" state of a thing that big with anything
# exact to compare against. Split it before starting, or a revert will split it.
LUMP="H VH"

work=${TMPDIR:-/tmp}/plans.$$
: > "$work"

# ⚠ ONE GATE, ONE CLAIM. This used to also require `## Status` and `## Goal` and
# failed four plans for lacking them — true, and NOT what this gate is about. Those
# are the template's business (`plans/_TEMPLATE.md`); mixing them in here buys a
# check nobody can read the verdict of. What this gate needs is steps, so the only
# section it asks for is the one that holds them.
grep -q "^## Phase" "$README" || echo "no '## Phase…' section — a plan being started has steps" >> "$work"

# `| **`X1`** — title | EFFORT | VERIFY | STATUS |`
#
# ⚠ THE `\*\*` AT THE END IS LOAD-BEARING and was missing. Without it the pattern
# matched a FINDINGS row — plan 20's `| **`A8`'s fill squeezed a shelf...` — and
# reported a finished plan's prose as an open phase with no Verify. A gate that
# cries wolf gets a blanket exemption, which is how `layering.sh` lost its teeth
# for months.
grep -E '^\| *\*\*`?[A-Z][A-Za-z]*[0-9][0-9a-z.]*`?\*\*' "$README" 2>/dev/null \
| while IFS='|' read -r _ title effort verify status rest; do
    tidy=$(printf '%s' "$title" | sed 's/^ *//;s/ *$//' | cut -c1-44)
    eff=$(printf '%s' "$effort" | tr -d ' ')
    # ⚠ THE STATUS IS THE LAST CELLS JOINED, not `$5`. A `Verify` holding a `|`
    # shifts every field after it, and several rows do — a parser that read `$5`
    # would call a finished phase open and cry wolf on the plans that are DONE.
    st="$status$rest"
    case "$st" in *"✅"*|*Done*|*done*|*complete*|*Withdrawn*) continue ;; esac

    [ -z "$(printf '%s' "$verify" | tr -d ' ')" ] && \
      echo "open phase '$tidy' has an EMPTY Verify — nothing about it could go red" >> "$work"
    for l in $LUMP; do
      [ "$eff" = "$l" ] && \
        echo "open phase '$tidy' is effort $l — too big for a parallel run; split it" >> "$work"
    done
  done

if [ -s "$work" ]; then
  echo "PLANS: $PLAN is NOT ready to start —"
  sed 's/^/     /' "$work"
  rm -f "$work"
  echo
  echo "Every open phase needs a step small enough to have something exact to compare"
  echo "against, and big enough to go red on its own — plans/README.md."
  exit 1
fi
rm -f "$work"
