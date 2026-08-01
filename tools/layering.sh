#!/bin/sh
# WHICH WAY THE ARROW POINTS — lavition may not depend on Moros.
#
# Two projects share this tree. **lavition** is the universal hex-world editor —
# `hex_editor`, `hex_world` and the `hex_*` family — and **Moros** is one consumer
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
set -u

fail=0

for manifest in lib/*/loft.toml; do
  pkg=$(basename "$(dirname "$manifest")")
  case "$pkg" in moros_*) continue ;; esac        # a consumer may depend on anything

  # A declared dependency on a Moros package.
  deps=$(sed -n '/^\[dependencies\]/,$p' "$manifest" | grep -oE '^moros_[a-z_]+' || true)
  if [ -n "$deps" ]; then
    echo "LAYERING: $pkg (lavition) declares a Moros dependency:"
    echo "$deps" | sed 's/^/     /'
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
  if [ -n "$used" ]; then
    echo "LAYERING: $pkg (lavition) reaches into a Moros package:"
    echo "$used" | cut -c1-120 | sed 's/^/     /'
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo
  echo "A lavition package may not depend on Moros — see the head of this script."
  exit 1
fi
