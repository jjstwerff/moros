#!/bin/sh
# WHICH WAY THE ARROW POINTS — lavition may not depend on Moros.
#
# Two projects share this tree. **lavition** is the universal hex-world editor —
# `hex_editor`, `hex_voxel` and the `hex_*` family — and **Moros** is one consumer
# of it. So a Moros package may name a lavition one, and a lavition package may
# never name a Moros one. Reversed, the editor stops being a product and becomes a
# part of this game.
#
# ⚠ IT IS NOT A HYPOTHETICAL. Moving the gestures out of `src/editor_server.loft`
# found the arrow backwards twice, in code that had compiled happily for months:
#
#   · the stair read `moros_sim::stair_height` — the rule about what a WALKER can
#     climb, which belongs to whoever owns the walker, not to the library that
#     writes the step. The caller passes it now.
#   · the wall run and the road read `moros_render`'s `world_to_hex` /
#     `hex_to_world`. They read `hex_grid::px_to_hex` / `hex_to_px` now, which is
#     where the lattice actually lives.
#
# Neither was visible while the code sat in a Moros program: a server may call
# anything. They only became wrong on the way out, which is exactly when nobody is
# looking for them. Hence a check rather than a habit.
#
# Silent when it passes (loft's Goal F: a tool that reports its own good health
# teaches the reader to skip the line where it eventually reports the opposite).
#
# ── ⚠ THE DEFAULT IS *CHECKED*, AND IT USED TO BE THE OTHER WAY — plan 19 `L2` ──
#
# This script used to skip every package matching `moros_*`, on the reasoning that
# a consumer may depend on anything. True, and it made **the NAME decide whether
# the check applied** — so a universal package wearing a Moros prefix was exempt
# from the one check written to catch exactly that. It is not hypothetical twice
# over:
#
#   · `moros_ui` was lavition's panel for months, exempt the whole time. Renaming
#     it to `lavition_ui` is what put it back under this script (plan 18 `B1.2b`).
#   · `moros_terrain` was lavition's mesher — `emit_tri`, `chunk_mesh_mat`,
#     `surface_at`, not one game concept in any name — and likewise exempt. It is
#     `hex_mesh` now (plan 19 `L2`), and renaming it is **what made its own
#     `moros_render` dependency visible at all** — which `L3′` then removed. The
#     rename did not create that dependency; it had been there, unseen, the whole
#     time.
#
# So the lists are explicit and the default is to CHECK. A new package is checked
# unless somebody writes it into `CONSUMERS` on purpose, and a violation is either
# fixed or written into `KNOWN` **with a reason and a plan step** — never skipped
# by matching a pattern.
#
# ── ⚠ AND THE PROGRAMS ARE CHECKED TOO, WHICH THEY WERE NOT — plan 19 `L6.3` ────
#
# This script's loop was `for manifest in lib/*/loft.toml`, so it saw the packages
# and never `src/`. That is the exemption shape one layer up: a consumer program
# may call anything, which is true *while it is Moros's* — and plan 19's whole
# invariant is that **the editor program travels**. So the one file whose coupling
# decides the split was the one file nothing measured.
#
# ⚠ IT COST EXACTLY WHAT THE PACKAGE VERSION COST, AND THE HEADER ABOVE NAMES IT.
# *"the wall run and the road read `moros_render`'s `world_to_hex`… they read
# `hex_grid::px_to_hex` now"* — that leak was cured in the packages, where this
# script looks. `src/editor_server.loft` still holds **29 calls to the same
# function**, plus `moros_sim` behind an alias, and both survived every run of
# every check in this tree. Measured 2026-08-11: with `lib/moros_*` absent the
# program does not compile, while the design document says in bold that it does.
#
# The debt is recorded EXACTLY rather than merely allowed, and it fails in **both**
# directions — a new import is a regression, and a removed one is progress the
# budget has to be told about, or the number rots into decoration.
set -u

# Moros's own packages. A consumer may depend on anything, so these are not
# checked — but they are named, not matched, so adding one is a deliberate act.
CONSUMERS="moros_map moros_editor moros_render moros_sim"

# ⚠ VIOLATIONS THAT ARE TRACKED RATHER THAN INVISIBLE. Each needs a reason and the
# step that removes it. An entry here is a debt with a name on it; a pattern skip
# was a debt nobody could see.
#
# ✅ **EMPTY, AND IT HELD ONE ENTRY FOR THE LENGTH OF ONE SESSION.**
# `hex_mesh -> moros_render` was the last Moros dependency in the whole lavition
# stack — `HEIGHT_SCALE`, `hex_to_world`, `hex_corner_world`. Plan 19 `L3′` moved
# them into `hex_proj` (hex_grid + graphics, nothing else) and the debt is paid.
# ⚠ Keep this list EMPTY if you can: it works because it is short enough to read.
KNOWN=""

# The programs in `src/`. Every one of these has to build with the Moros tree
# absent before plan 19 `L6.3` can move the editor into its own repository, so the
# list is the same one `tools/names.sh` scans — one place to add a program.
PROGRAMS="src/editor_server.loft src/editor_client.loft src/editor_run.loft
          src/part_build.loft src/prop_build.loft"

# ⚠ THE PROGRAMS' MOROS IMPORTS, RECORDED EXACTLY — `<file>:<package>` pairs.
#
# This is a BUDGET, not a permission list. It is what `L6.3` has to pay, written
# down so it is a number a reader meets on every run instead of a discovery made on
# the day the repository is split. Four of the five programs are already clear.
#
# ⚠ THE COUNT BEHIND EACH ENTRY IS THE PART THAT SURPRISES — measured 2026-08-11:
#
#   · `moros_render`  6 names, **42 call sites**, and they are BARE names because
#     the import is unaliased — so no `moros_render::` grep can see one of them.
#     29 of the 42 are `world_to_hex`, whose body is `hex_grid::px_to_hex` and
#     whose only Moros content is its RETURN TYPE, `moros_map::HexAddress`.
#     `L3′` moved `hex_to_world` into `hex_proj` and left its inverse behind.
#   · `moros_sim`  10 names, 11 call sites, behind `as msim` — the cart, the fall
#     and the cliff edges. ⚠ **The alias is why it was never counted at all**: the
#     2026-08-06 coupling measurement reads *"`moros_terrain`, and nothing else …
#     plus 3 unqualified calls from `moros_render`"* and does not mention
#     `moros_sim`, because an aliased import exposes no bare name to grep for.
#     That is `L6.1`'s own finding, spent against the measurement that needed it.
#
# Neither package holds a game concept in any name — `camera_*`, `emit_*`,
# `asm_cart`, `body_axle`, `fall_step` — which makes this the THIRD instance of the
# rule `moros_ui` and `moros_terrain` already taught: a universal package wearing a
# consumer's prefix. Whether they are renamed or the program is weaned off them is
# plan 19 `L6.3` and its open question 5, and it is not decided here.
# ⚠ `moros_render` IS PAID — plan 19 `L6.3a`, 2026-08-21. `world_to_hex` was a Moros
# wrapper around `hex_grid::px_to_hex` returning a struct whose third field no caller read;
# the 13 sites take the pair directly, which is what `hex_mesh` had already done and
# recorded. `Aabb`/`mesh_aabb` had no Moros content at all and joined the drawing
# primitives in `hex_proj`. ⚠ A REMOVED DEBT HAS TO BE RECORDED AS PROGRESS OR THE NUMBER
# ROTS — this list fails in BOTH directions.
PROGRAM_DEBT="src/editor_server.loft:moros_sim"

fail=0

for manifest in lib/*/loft.toml; do
  pkg=$(basename "$(dirname "$manifest")")
  skip=0
  for c in $CONSUMERS; do [ "$pkg" = "$c" ] && skip=1; done
  [ "$skip" -eq 1 ] && continue

  # A declared dependency on a Moros package.
  deps=$(sed -n '/^\[dependencies\]/,$p' "$manifest" | grep -oE '^moros_[a-z_]+' || true)
  fresh=""
  for d in $deps; do
    case " $KNOWN " in *" $pkg:$d "*) continue ;; esac
    fresh="$fresh $d"
  done
  if [ -n "$fresh" ]; then
    echo "LAYERING: $pkg (lavition) declares a Moros dependency:"
    for d in $fresh; do echo "     $d"; done
    fail=1
  fi

  # A Moros package named in the source, qualified or aliased.
  # ⚠ SKIP COMMENTS, and match on `file:line:` rather than the first colon — the
  # first version's filter only cleared a `//` sitting immediately after the
  # filename, so every indented comment counted as a violation. This script's own
  # header, which NAMES the two leaks it was written for, was its first false
  # positive.
  used=$(grep -rnE '(^|[^a-z_])(moros_[a-z_]+|msim)::' "lib/$pkg/src/" 2>/dev/null \
         | grep -vE '^[^:]*:[0-9]+:[[:space:]]*//' || true)
  # ⚠ A KNOWN dependency clears its own call sites too, or a tracked debt would
  # still fail the build on every line it is spent at. The manifest entry is what
  # is tracked; the call sites follow it.
  for pair in $KNOWN; do
    kp=${pair%%:*}; kd=${pair#*:}
    [ "$kp" = "$pkg" ] && used=$(printf '%s\n' "$used" | grep -v "$kd::" || true)
  done
  used=$(printf '%s' "$used" | grep -v '^$' || true)
  if [ -n "$used" ]; then
    echo "LAYERING: $pkg (lavition) reaches into a Moros package:"
    echo "$used" | cut -c1-120 | sed 's/^/     /'
    fail=1
  fi
done

# ── THE PROGRAMS — plan 19 `L6.3`'s invariant, as a number ────────────────────
#
# ⚠ THE INSTRUMENT IS THE IMPORT LINE, NOT THE CALL SITE, and that is deliberate.
# `use moros_render;` is unaliased, so its 42 call sites are BARE names and a grep
# for `moros_render::` finds none of them — the same blindness that hid an entire
# package from the coupling measurement. An import is where the dependency ARRIVES;
# a call site is only where it is spent. Guard the arrival.
found=""
for prog in $PROGRAMS; do
  [ -f "$prog" ] || { echo "LAYERING: $prog is in PROGRAMS and does not exist"; fail=1; continue; }
  for d in $(grep -oE '^use +moros_[a-z_]+' "$prog" | awk '{print $2}'); do
    found="$found $prog:$d"
  done
done

# Exact match in both directions. A `sort` on each side so the comparison is about
# the SET and not about the order either list happens to be written in.
want=$(printf '%s\n' $PROGRAM_DEBT | sort)
got=$(printf '%s\n' $found | grep -v '^$' | sort)
if [ "$want" != "$got" ]; then
  echo "LAYERING: the programs' Moros imports are not what the budget records."
  printf '%s\n' "$want" | sed 's/^/     budget: /'
  printf '%s\n' "$got"  | sed 's/^/     actual: /'
  echo "     A NEW import is a regression — the editor program has to travel (plan 19 L6.3)."
  echo "     A REMOVED one is progress: lower PROGRAM_DEBT at the head of this script,"
  echo "     on purpose, so the number cannot rot into decoration."
  fail=1
fi

# ⚠ THE TRACKED DEBTS ARE PRINTED, NOT SILENT — a skip nobody can see is what this
# script's own history is about. They do not fail the build; they are named every
# run so the list cannot quietly become permanent.
if [ -n "$KNOWN" ]; then
  echo "layering: tracked, not fixed — $KNOWN  (see the head of this script)"
fi
if [ -n "$PROGRAM_DEBT" ]; then
  echo "layering: the editor program still imports Moros — $(printf '%s\n' $PROGRAM_DEBT | wc -l) of them; plan 19 L6.3 is what pays it"
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "A lavition package may not depend on Moros, and the programs' debt is fixed"
  echo "at what PROGRAM_DEBT records — see the head of this script."
  exit 1
fi
