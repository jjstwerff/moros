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

# ⚠ THE TRACKED DEBTS ARE PRINTED, NOT SILENT — a skip nobody can see is what this
# script's own history is about. They do not fail the build; they are named every
# run so the list cannot quietly become permanent.
if [ -n "$KNOWN" ]; then
  echo "layering: tracked, not fixed — $KNOWN  (see the head of this script)"
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "A lavition package may not depend on Moros — see the head of this script."
  exit 1
fi
