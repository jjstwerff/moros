#!/bin/sh
# ONE NAME, ONE THING — a public name is GLOBAL, and nothing else in the build says so.
#
# loft has no per-package namespace for a *bare* name. Two packages in one dependency
# graph may each declare `Chunk`, and a bare `Chunk { … }` binds to whichever was
# `use`d FIRST — the same file with its two imports swapped compiles something
# different, at either order, with no ambiguity error
# ([loft#788](https://github.com/loft-lang/loft/issues/788)). So a collision is not a
# build failure that finds itself; it is a silence.
#
# ⚠ IT IS NOT HYPOTHETICAL, AND EVERY CASE BELOW WAS FOUND BY RUNNING THIS.
#
#   · `Surface` was declared by `hex_world` and `moros_terrain`, and in
#     `editor_server.loft` the two had merged. It went unnoticed for MONTHS because
#     every caller reads `surface_at(i).sf_r` and never names the type. Plan 19 `L1`.
#   · `Fit` sat in `hex_editor` while `hex_part` was re-deriving the same question.
#   · `hex_world` itself names two unrelated published packages — plan 19 `L4`.
#
# ⚠ AND A PACKAGE SUITE CANNOT SEE ANY OF IT. `hex_part` was 131 green while
# `hex_editor` would not build at all. The collision lives in the CONSUMER's graph, so
# the check has to run over the graph — which is what this does and `loft test` cannot.
#
# Silent when it passes (loft's Goal F).
#
# ── the two questions, which are different ────────────────────────────────────
#
# LIVE     two packages that a program ALREADY imports both declare a name. One of
#          them is unreachable from that file, and which one is decided by the order
#          of the `use` block. This is a defect now.
# LATENT   a name lavition will PUBLISH is already taken in the registry. Nothing is
#          broken today; it becomes unfixable the day the package is published,
#          because a published name cannot be renamed.
#
set -u

# The packages that travel to lavition and will be published under their own names.
# ⚠ Named, not matched — the pattern skip is what let `moros_ui` and `moros_terrain`
# out from under `tools/layering.sh` for months.
LAVITION="hex_world hex_editor hex_part hex_mesh hex_proj lavition_ui glb_read"

# The programs whose import lists are checked for LIVE shadowing.
PROGRAMS="src/editor_server.loft src/editor_client.loft src/editor_run.loft src/part_build.loft src/prop_build.loft"

# ⚠ COLLISIONS THAT ARE TRACKED RATHER THAN INVISIBLE, as `layering.sh` tracks a
# layering debt: `name:pkg:pkg` for a LIVE pair, `name:pkg` for a LATENT one. Each
# needs a reason and the step that removes it.
#
# ✅ EMPTY. Everything this found on 2026-08-06 was fixed rather than tracked:
# two dead imports in `editor_server.loft` (`moros_map`, `hex_shape`), one re-derived
# `hex_dist` in `hex_part`, and the `hex_world` rename of plan 19 `L4`/`L6`.
KNOWN=""

fail=0
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

# Every public name a package exports, whether it lives in `lib/` or the registry.
# ⚠ THE REGISTRY COPY IS THE ONE THAT MATTERS for a latent check: `lib/` may hold a
# package of the same name on a different lineage, which is the whole of `L4`.
#
# ⚠ A METHOD IS NOT A BARE NAME, and leaving that out was this script's first false
# positive class: it reported `close`, `send`, `send_binary` and `last_opcode` as live
# collisions between `server` and `web`. They are not. Those are `pub fn close(self: T)`,
# called as `x.close()`, and resolution is by the RECEIVER's type — **`server` declares
# `close` twice by itself**, on `Server` and on `WebSocket`, which it could not if the
# name alone decided. So `self:`-style declarations are excluded here.
names_of() {
  if [ -d "lib/$1/src" ]; then
    grep -hoE '^pub (struct|enum|fn|const) [A-Za-z_][A-Za-z_0-9]*\(?[a-z]*:?' lib/"$1"/src/*.loft 2>/dev/null
  else
    d=$(ls -d "$HOME"/.loft/registry/"$1"-*/ 2>/dev/null | sort -V | tail -1)
    [ -n "$d" ] && grep -hoE '^pub (struct|enum|fn|const) [A-Za-z_][A-Za-z_0-9]*\(?[a-z]*:?' "$d"src/*.loft 2>/dev/null
  fi | grep -v '(self:$' | awk '{print $3}' | sed 's/(.*$//' | sort -u
}

tracked() { case " $KNOWN " in *" $1 "*) return 0 ;; esac; return 1; }

# ── LIVE: one program, two packages, one name ─────────────────────────────────
#
# ⚠ ONLY THE PLAIN `use X;` FORM COUNTS. `use moros_sim as msim;` does **not** put its
# names in scope bare — measured: a file with `use hex_world as hw;` calling
# `world_new(…)` fails with `Unknown function world_new`, and `hw::world_new(…)` works.
# The first version of this script counted aliased imports and reported `seg_len` as a
# live collision between `gridmesh`, `hex_way` and `moros_sim`. It is not one: `msim` is
# aliased, so it contributes no bare name at all. **An alias is a namespace; a plain
# `use` is not.**
for prog in $PROGRAMS; do
  [ -f "$prog" ] || continue
  : > "$tmp/all"
  imports=$(grep -hoE '^use [a-z_][a-z_0-9]* *;' "$prog" | awk '{print $2}' | tr -d ';')
  for p in $imports; do names_of "$p" | sed "s/\$/ $p/" >> "$tmp/all"; done
  dups=$(awk '{print $1}' "$tmp/all" | sort | uniq -d)
  [ -z "$dups" ] && continue
  hits=""
  for n in $dups; do
    owners=$(grep -E "^$n " "$tmp/all" | awk '{print $2}' | sort | tr '\n' ':' | sed 's/:$//')
    tracked "$n:$owners" && continue
    # Which `use` wins is the FIRST one in the file — say so, because that is the
    # thing a reader cannot see and the thing an innocent reorder changes.
    first=$(for o in $(echo "$owners" | tr ':' ' '); do
              ln=$(grep -nE "^use $o *;" "$prog" | head -1 | cut -d: -f1)
              printf '%s %s\n' "${ln:-999999}" "$o"
            done | sort -n | head -1 | awk '{print $2}')
    hits="$hits\n     $n — declared by $(echo "$owners" | tr ':' ' '); \`$first\` wins, by import order"
  done
  if [ -n "$hits" ]; then
    echo "NAMES (live): $prog imports two packages that declare the same name:"
    printf '%b\n' "$hits"
    fail=1
  fi
done

# ── LATENT: a name lavition publishes is already taken in the registry ────────
for pkg in $LAVITION; do
  [ -d "lib/$pkg/src" ] || continue
  names_of "$pkg" > "$tmp/mine"
  [ -s "$tmp/mine" ] || continue
  hits=""
  for other in $(ls -d "$HOME"/.loft/registry/*/ 2>/dev/null |
                 sed -E 's#.*/([a-z_0-9]+)-[0-9]+\.[0-9]+\.[0-9]+/#\1#' | sort -u); do
    [ "$other" = "$pkg" ] && continue
    names_of "$other" > "$tmp/theirs"
    shared=$(comm -12 "$tmp/mine" "$tmp/theirs")
    for n in $shared; do
      tracked "$n:$pkg" && continue
      hits="$hits\n     $n — also in the registry's \`$other\`"
    done
  done
  if [ -n "$hits" ]; then
    echo "NAMES (latent): \`$pkg\` exports a name the registry already has:"
    printf '%b\n' "$hits"
    fail=1
  fi
done

# ⚠ TRACKED, NOT SILENT — printed every run so the list cannot quietly become
# permanent. This is `layering.sh`'s rule and it is here for the same reason.
[ -n "$KNOWN" ] && echo "names: tracked, not fixed — $KNOWN  (see the head of this script)"

if [ "$fail" -ne 0 ]; then
  echo
  echo "A public name is global — see the head of this script. Fix it, or write it into"
  echo "KNOWN with a reason and the step that removes it."
  exit 1
fi
exit 0
