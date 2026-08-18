#!/bin/sh
# WHICH PACKAGES MUST BE RE-TESTED WHEN THIS ONE CHANGES — plan 22, 2026-08-18.
#
#     sh tools/rdeps.sh hex_editor      -> hex_editor hex_mesh
#
# The package itself plus every package that depends on it, directly or
# transitively, **topologically sorted** so a dependency is always tested before
# its dependent.
#
# ⚠ **`LIB_PACKAGES` ORDER WOULD NOT DO, AND ITS OWN COMMENT SAYS OTHERWISE.** The
# Makefile calls that list "in dependency order" and FOUR edges contradict it —
# `moros_render` before `hex_proj`, `hex_editor` before `hex_part`, and `hex_part`
# and `hex_mesh` both before `glb_read`. Emitting in list order was this script's
# first version and it put `hex_editor` ahead of the `hex_part` it depends on.
# Nothing breaks (each `loft test` resolves its own dependencies), which is exactly
# why the claim survived: it costs nothing to be wrong about.
#
# ⚠ **COMPUTED FROM THE MANIFESTS, NEVER A LIST KEPT HERE.** A hand-written map
# is right the day it is written and wrong the first time somebody adds a
# dependency — which is `tools/layering.sh`'s own history: its skip list exempted
# every `moros_*` package, so a universal package wearing a Moros prefix was
# waved through for months. A derived answer cannot go stale that way.
#
# ⚠ **AN UNKNOWN NAME FAILS, AND THAT IS THE POINT.** `L=hex_edtior` returning
# nothing would run ZERO packages and report success — a green that means "I
# tested your typo". This exits 2 and names what it knows instead.
set -eu
cd "$(dirname "$0")/.."

want=${1:-}
if [ -z "$want" ]; then echo "usage: rdeps.sh <package>" >&2; exit 2; fi

order=$(sed -n '/^LIB_PACKAGES/,/[^\\]$/p' Makefile \
        | sed 's/^LIB_PACKAGES *= *//' | tr -d '\\' | tr '\n' ' ')

known=0
for p in $order; do [ "$p" = "$want" ] && known=1; done
if [ "$known" -eq 0 ]; then
  echo "rdeps: '$want' is not a package in LIB_PACKAGES — known: $order" >&2
  exit 2
fi

# The local dependency edges, read out of each package's own manifest: a `path`
# dependency is a package in this tree, a version dependency is the registry's
# and cannot be affected by a local edit.
deps_of() {
  sed -n '/^\[dependencies\]/,$p' "lib/$1/loft.toml" 2>/dev/null \
    | grep -oE '^[a-z_]+ *= *\{ *path' | awk '{print $1}'
}

# Grow the set until it stops growing: a package joins when any of its local
# dependencies is already in. Bounded by the package count, so it terminates.
set_has() { for s in $1; do [ "$s" = "$2" ] && return 0; done; return 1; }

sel="$want"
changed=1
while [ "$changed" -eq 1 ]; do
  changed=0
  for p in $order; do
    if set_has "$sel" "$p"; then continue; fi
    for d in $(deps_of "$p"); do
      if set_has "$sel" "$d"; then sel="$sel $p"; changed=1; break; fi
    done
  done
done

# Emit topologically: a package goes out once every local dependency it has that
# is ALSO in the set has gone out. Bounded by the set size, so a cycle cannot spin
# — it drops out with the remainder named rather than looping.
out=""
left="$sel"
guard=0
while [ -n "$(echo $left)" ]; do
  guard=$((guard + 1))
  if [ "$guard" -gt 64 ]; then
    echo "rdeps: dependency cycle among:$left" >&2; exit 3
  fi
  next=""
  for p in $left; do
    ready=1
    for d in $(deps_of "$p"); do
      if set_has "$left" "$d"; then ready=0; break; fi
    done
    if [ "$ready" -eq 1 ]; then out="$out $p"; else next="$next $p"; fi
  done
  left="$next"
done
echo "${out# }"
