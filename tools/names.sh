#!/bin/sh
# ONE NAME, ONE THING — a public name is GLOBAL, and nothing else in the build says so.
#
# loft has no per-package namespace for a *bare* name: two packages in one dependency
# graph may each declare `Chunk`, and nothing in `loft test` looks across a graph.
#
# ✅ **THE SILENCE IS FIXED, AND THAT CHANGES WHAT THIS SCRIPT IS FOR — measured
# 2026-08-29 against the installed toolchain.** This file was written when a bare name
# bound to whichever package was `use`d FIRST, so the same file with its imports swapped
# compiled something different with no error
# ([loft#788](https://github.com/loft-lang/loft/issues/788)). It no longer does. A
# two-package repro over the very pair this reports — `use hex_rig; use hex_way;` then a
# bare `seg_len()` — is REFUSED, naming both declarations and the fix:
#
#     error: `seg_len` is declared by more than one module here — hex_rig::frames::seg_len
#     and hex_way::seg_len. … alias yours (`use self::frames as m;` then `m::seg_len`), or
#     import the other one by name so only one `seg_len` is in scope
#
# ⚠ **AND THAT MEASUREMENT IS A COMMAND, NOT A QUOTE — `probe/names/run.sh`, in
# `make fast`, 2 s.** This file carried loft#788's behaviour in its head for three weeks
# after it was fixed and would have gone on carrying it; the probe is what makes the
# reverse impossible too, because the day the silence returns row A goes red.
#
# ⚠ **SO A LIVE ROW IS NO LONGER A SILENT WRONG ANSWER — IT IS A NAME YOU CANNOT WRITE
# BARE IN THAT PROGRAM.** Loud, at compile time, with the fix in the message. That is a
# smaller defect than this file was built for, and it is worth saying out loud rather
# than leaving the reader to over-rate a row. ⛔ **The LATENT half did not change at
# all**, and it is now the greater share of the value: a name a package will PUBLISH,
# already taken in the registry, is unfixable the day it ships — no compiler sees it,
# because the two packages are not in one graph yet.
#
# ⚠ IT IS NOT HYPOTHETICAL, AND EVERY CASE BELOW WAS FOUND BY RUNNING THIS.
#
# ⚠ The bullets below name the packages as they were CALLED at the time; two have
# been renamed since, by the very findings they record.
#
#   · `Surface` was declared by `hex_world` (now `hex_voxel`) and `moros_terrain`
#     (now `hex_mesh`), and in `editor_server.loft` the two had merged. It went
#     unnoticed for MONTHS because every caller reads `surface_at(i).sf_r` and never
#     names the type. Plan 19 `L1`.
#   · `Fit` sat in `hex_editor` while `hex_part` was re-deriving the same question.
#   · `hex_world` itself named two unrelated published packages — plan 19 `L4`.
#     ✅ CLOSED by `L6.2`: ours is `hex_voxel`, and its `World` and `Chunk` went with
#     it. `probe/l4/run.sh` is the eight-control measurement, and control `D` is the
#     one that changed — `--lib lib/` used to mean OURS and now means theirs.
#
# ⚠ AND A PACKAGE SUITE CANNOT SEE ANY OF IT. `hex_part` was 131 green while
# `hex_editor` would not build at all. The collision lives in the CONSUMER's graph, so
# the check has to run over the graph — which is what this does and `loft test` cannot.
#
# Silent when it passes (loft's Goal F).
#
# ── the two questions, which are different ────────────────────────────────────
#
# LIVE     two packages that a program ALREADY imports both declare a name. Neither is
#          reachable BARE from that file — the compiler refuses the call and names both
#          (see the ✅ above; it used to pick one silently). Qualify, or alias one
#          import, which is what `use gridmesh as gm;` in `editor_server.loft` does.
# LATENT   a name lavition will PUBLISH is already taken in the registry. Nothing is
#          broken today; it becomes unfixable the day the package is published,
#          because a published name cannot be renamed.
#
set -u

# The packages that travel to lavition and will be published under their own names.
# ⚠ Named, not matched — the pattern skip is what let `moros_ui` and `moros_terrain`
# out from under `tools/layering.sh` for months.
#
# ⛔ **AND THE NAMED LIST WENT STALE ANYWAY, WHICH IS THE OTHER HALF OF THAT LESSON.**
# `hex_rig` and `hex_cam` were missing — both lavition packages, both taking no brand
# prefix, both added after this line was written. Found 2026-08-29 by running a script
# nothing runs. **A list is exempt from the check it feeds**, whether it exempts by
# pattern or by omission; what saves it is being DERIVED or being run often enough to
# be noticed. This one is now in `make fast`, which is the second of those.
LAVITION="hex_voxel hex_editor hex_part hex_mesh hex_proj lavition_ui glb_read hex_rig hex_cam"

# The programs whose import lists are checked for LIVE shadowing.
# ⚠ `src/plan_view.loft` was missing here and from `tools/layering.sh`'s copy of this
# list, whose comment says the two are *"the same one … one place to add a program"* —
# they were the same, and both short.
PROGRAMS="src/editor_server.loft src/editor_client.loft src/editor_run.loft src/part_build.loft src/prop_build.loft src/plan_view.loft"

# ⚠ COLLISIONS THAT ARE TRACKED RATHER THAN INVISIBLE, as `layering.sh` tracks a
# layering debt: `name:pkg:pkg` for a LIVE pair, `name:pkg` for a LATENT one. Each
# needs a reason and the step that removes it.
#
# ✅ EMPTY. Everything this found on 2026-08-06 was fixed rather than tracked:
# two dead imports in `editor_server.loft` (`moros_map`, `hex_shape`), one re-derived
# `hex_dist` in `hex_part`, and the `hex_world` → `hex_voxel` rename, which `L6.2`
# then carried out along with the `World` and `Chunk` that travelled under it.
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
# names in scope bare — measured: a file with `use hex_voxel as hw;` calling
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
    # The first `use` is still named, because it is the one an alias should go on —
    # not because it "wins" any more. It does not; the compiler refuses the bare call.
    first=$(for o in $(echo "$owners" | tr ':' ' '); do
              ln=$(grep -nE "^use $o *;" "$prog" | head -1 | cut -d: -f1)
              printf '%s %s\n' "${ln:-999999}" "$o"
            done | sort -n | head -1 | awk '{print $2}')
    hits="$hits\n     $n — declared by $(echo "$owners" | tr ':' ' '); bare use is refused, \`$first\` is first"
    echo "live $prog $n $owners" >> "$tmp/found"
  done
  if [ -n "$hits" ]; then
    # ⚠ ADVISORY MODE PRINTS ONE LINE AND NOT THE ROWS. A `fast` loop that reprints the
    # same eleven findings every run teaches the reader to scroll past the place where a
    # NEW one would appear — `run-tests.sh`'s *silent when green* rule, applied to a
    # check that is not green and is not going to be this week.
    if [ "${NAMES_ADVISORY:-0}" != "1" ]; then
      echo "NAMES (live): $prog imports two packages that declare the same name:"
      printf '%b\n' "$hits"
    fi
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
      echo "latent $pkg $n $other" >> "$tmp/found"
    done
  done
  if [ -n "$hits" ]; then
    if [ "${NAMES_ADVISORY:-0}" != "1" ]; then
      echo "NAMES (latent): \`$pkg\` exports a name the registry already has:"
      printf '%b\n' "$hits"
    fi
    fail=1
  fi
done

# ⚠ TRACKED, NOT SILENT — printed every run so the list cannot quietly become
# permanent. This is `layering.sh`'s rule and it is here for the same reason.
[ -n "$KNOWN" ] && [ "${NAMES_ADVISORY:-0}" != "1" ] \
  && echo "names: tracked, not fixed — $KNOWN  (see the head of this script)"

# ── THE BASELINE, AND WHY THIS IS ADVISORY IN `make fast` ─────────────────────
#
# ⛔ **THIS SCRIPT WAS RUN BY NOTHING AND WAS RED — found 2026-08-29.** No target, no
# tier, no caller: `make fast` never ran it, `make gate` never ran it, and its LIVE row
# and eight LATENT ones had been sitting there unread. That is *a check nobody runs
# drifts red in silence*, the fifth time this tree has found it.
#
# ⚠ **IT GOES IN `fast` ADVISORY, NOT AS A GATE, AND THE REASON IS THE LATENT HALF.**
# Those rows are naming decisions about a public surface — `hex_voxel::Layer` against the
# registry's `stage`, and `lavition_ui`'s six against `text2d` — and they are somebody's
# call to make before publishing, not a build failure to clear this afternoon. Blessing
# them into `KNOWN` to get a green would be silencing the check, which is the one thing
# its own head tells you not to do. So `fast` runs it every loop and never fails on it,
# `sh tools/names.sh` is the gate, and the BASELINE below is what makes the advisory line
# worth reading: it says *as recorded* or it says a name is NEW. `probe/way/drift.sh`
# drew this same line for the same reason.
BASE=tools/names.txt
sort -o "$tmp/found" "$tmp/found" 2>/dev/null || : > "$tmp/found"

if [ "${NAMES_BLESS:-0}" = "1" ]; then
  cp "$tmp/found" "$BASE"
  echo "names: baseline re-recorded — $(wc -l < "$BASE") row(s) in $BASE"
  exit 0
fi

if [ "${NAMES_ADVISORY:-0}" = "1" ]; then
  # ⚠ `grep -c` PRINTS 0 *AND* EXITS 1, so `$(grep -c … || echo 0)` yields "0 0" on the
  # one day this matters — the day every collision is fixed and the line should read
  # cleanest. Counted with `wc` instead.
  live=$(awk '$1=="live"' "$tmp/found" 2>/dev/null | wc -l | tr -d ' ')
  lat=$(awk '$1=="latent"' "$tmp/found" 2>/dev/null | wc -l | tr -d ' ')
  if [ -f "$BASE" ] && diff -q "$BASE" "$tmp/found" >/dev/null 2>&1; then
    echo "names: $live live, $lat latent — as recorded"
  else
    echo "names: ⚠ THE COLLISIONS MOVED — $live live, $lat latent, against $BASE:"
    diff "$BASE" "$tmp/found" 2>/dev/null | grep '^[<>]' | sed 's/^/       /'
    echo "       sh tools/names.sh shows them; NAMES_BLESS=1 sh tools/names.sh re-records."
  fi
  exit 0
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "A public name is global — see the head of this script. Fix it, or write it into"
  echo "KNOWN with a reason and the step that removes it."
  exit 1
fi
exit 0
