#!/bin/sh
# L4 — WHAT `hex_world` MEANS, MEASURED.
#
# ⚠ THIS RUNNER OWNS THE EXPECTATIONS, unlike `probe/s3/run.sh`, and that is not
# sloppiness: the quantity being measured IS whether the COMPILER accepted the file.
# A program that printed its own verdict could only speak for the case that built.
#
# It stages a renamed copy of `lib/hex_world` as `hex_voxel` in a temp dir — the split's
# rename, done cheaply — so the two lineages can be put in one graph without touching
# the tree. Nothing here writes inside the repo.
#
#   probe/l4/run.sh
#
# Every line says what the outcome MEANS if it flips, because a probe whose failure
# reads as "something changed" is not one.
set -u
cd "$(dirname "$0")/../.." || exit 1

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT INT TERM
mkdir -p "$STAGE/lib/hex_voxel/src"
cp lib/hex_world/src/hex_world.loft "$STAGE/lib/hex_voxel/src/hex_voxel.loft"
cat > "$STAGE/lib/hex_voxel/loft.toml" <<'TOML'
[package]
name    = "hex_voxel"
version = "0.1.0"
loft    = ">=0.8"

[library]
entry = "src/hex_voxel.loft"
TOML

fail=0

# $1 label  $2 expect (ok|err)  $3 the exact words expected  $4 meaning-if-flipped  $5.. loft args
#
# ⚠ THE WORDS ARE CHECKED, NOT JUST THE EXIT CODE, and that is not belt-and-braces.
# The first version of this runner passed `--lib lib/` alongside the stage dir, which
# made `hex_world` resolve to OURS — so `F` never had both lineages in the graph and
# "failed correctly" on `Unknown function cell_count`, a different bug entirely. An
# error that is expected is still an instrument reading, and a reading nobody looks at
# is how a probe reports on a case it never ran.
check() {
  label=$1; expect=$2; words=$3; meaning=$4; shift 4
  out=$(loft "$@" 2>&1); rc=$?
  got=err; [ $rc -eq 0 ] && got=ok
  detail=$(printf '%s\n' "$out" | grep -E '^(error:|PROBE )' | head -1)
  if [ "$got" != "$expect" ]; then
    printf 'FAIL  %-24s expected %s, got %s — %s\n      %s\n' \
      "$label" "$expect" "$got" "$meaning" "$detail"
    fail=1
  elif ! printf '%s\n' "$out" | grep -qF "$words"; then
    printf 'FAIL  %-24s %s, but not for the measured reason — wanted "%s"\n      %s\n' \
      "$label" "$expect" "$words" "$detail"
    fail=1
  else
    printf 'PASS  %-24s %s\n' "$label" "$detail"
  fi
}

echo "── one import line, two lineages ─────────────────────────────────────────"
check "A ours   --lib lib/"  ok  "PROBE built OUR world" \
  "our own package no longer answers to its own name in its own tree" \
  --lib lib/ probe/l4/ours_api.loft
check "B ours   registry"    err "Unknown function world_new" \
  "the registry's hex_world grew a world_new — the lineages are converging, re-read L4" \
  probe/l4/ours_api.loft
check "C theirs registry"    ok  "PROBE built THEIR world" \
  "the registry's hex_world is not the package L4 measured" \
  probe/l4/theirs_api.loft
check "D theirs --lib lib/"  err "Unknown function world_empty" \
  "ours grew a world_empty — the collision is now wider than four names" \
  --lib lib/ probe/l4/theirs_api.loft

# ⚠ NO `--lib lib/` BELOW THIS LINE. The stage dir carries `hex_voxel` alone, so
# `hex_world` resolves from the REGISTRY — which is the whole point: the two lineages
# must be the two things in the graph. Adding `--lib lib/` puts ours under both names.
echo
echo "── both lineages in one graph, after the package rename ──────────────────"
check "E both packages"      ok  "PROBE both loaded" \
  "a package rename is NOT enough to co-install them; L4's recommendation changes" \
  --lib "$STAGE/lib" probe/l4/both.loft
check "F World structs merge" err "expected World, got World" \
  "the two World types MERGED — that is L1's bug at library scale, file it at once" \
  --lib "$STAGE/lib" probe/l4/merge.loft

echo
echo "── the bare type name, at both import orders ─────────────────────────────"
# ⚠ THESE TWO FLIPPED ON 2026-08-07, AND THE FLIP IS THE FIX. loft#788 was that a bare
# `Chunk { … }` bound silently to whichever package was `use`d FIRST — so `H` (world
# first) compiled and took theirs, and only `G` failed, on a missing field. loft 2026.8.0
# refuses the bare name at BOTH orders and names the two packages. What these now hold is
# the fix itself: the order no longer decides, and the diagnostic says why.
check "G voxel first"        err "declared by more than one package" \
  "the ambiguity error is gone — bare-name binding went back to preferring one use, and loft#788 is back" \
  --lib "$STAGE/lib" probe/l4/literal_voxel_first.loft
check "H world first"        err "declared by more than one package" \
  "the import ORDER decides again — that is loft#788 exactly, re-file it against this build" \
  --lib "$STAGE/lib" probe/l4/literal_world_first.loft

echo
if [ $fail -eq 0 ]; then
  echo "all 8 controls behaved as L4 measured (A-F on 2026-08-06; G/H re-measured 2026-08-07, loft#788 fixed)"
else
  echo "a control flipped — read the line above before believing anything downstream"
fi
exit $fail
