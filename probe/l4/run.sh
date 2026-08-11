#!/bin/sh
# L4/L6.2 — WHAT `hex_voxel` AND `hex_world` MEAN, MEASURED.
#
# ⚠ THIS RUNNER OWNS THE EXPECTATIONS, unlike `probe/s3/run.sh`, and that is not
# sloppiness: the quantity being measured IS whether the COMPILER accepted the file.
# A program that printed its own verdict could only speak for the case that built.
#
#   probe/l4/run.sh
#
# ⚠ IT NO LONGER STAGES ANYTHING. Until `L6.2` this script copied `lib/hex_world`
# into a temp dir under the name `hex_voxel` to rehearse the rename. The rename has
# LANDED, so `lib/` carries `hex_voxel` and carries no `hex_world` at all — which
# means `--lib lib/` now IS the two-lineage graph the staging was faking. A probe
# that keeps rehearsing something already true is measuring its own scaffolding.
#
# Every line says what the outcome MEANS if it flips, because a probe whose failure
# reads as "something changed" is not one.
set -u
cd "$(dirname "$0")/../.." || exit 1

fail=0

# $1 label  $2 expect (ok|err)  $3 the exact words expected  $4 meaning-if-flipped  $5.. loft args
#
# ⚠ THE WORDS ARE CHECKED, NOT JUST THE EXIT CODE, and that is not belt-and-braces.
# An earlier version passed `--lib lib/` where it should not have, so `F` never had
# both lineages in the graph and "failed correctly" for a different reason entirely.
# An error that is expected is still an instrument reading, and a reading nobody
# looks at is how a probe reports on a case it never ran.
check() {
  label=$1; expect=$2; words=$3; meaning=$4; shift 4
  out=$(loft "$@" 2>&1); rc=$?
  got=err; [ $rc -eq 0 ] && got=ok
  detail=$(printf '%s\n' "$out" | grep -E '^(error:|PROBE )' | head -1)
  if [ "$got" != "$expect" ]; then
    printf 'FAIL  %-26s expected %s, got %s — %s\n      %s\n' \
      "$label" "$expect" "$got" "$meaning" "$detail"
    fail=1
  elif ! printf '%s\n' "$out" | grep -qF "$words"; then
    printf 'FAIL  %-26s %s, but not for the measured reason — wanted "%s"\n      %s\n' \
      "$label" "$expect" "$words" "$detail"
    fail=1
  else
    printf 'PASS  %-26s %s\n' "$label" "$detail"
  fi
}

echo "── two names, two packages — the ambiguity L6.2 removed ──────────────────"
check "A ours   --lib lib/"   ok  "PROBE built OUR world" \
  "our own package no longer answers to its own name in its own tree" \
  --lib lib/ probe/l4/ours_api.loft
check "B ours   registry"     err "Library 'hex_voxel' not found" \
  "a hex_voxel appeared in the registry — somebody published the name, re-read L4 before publishing ours" \
  probe/l4/ours_api.loft
check "C theirs registry"     ok  "PROBE built THEIR world" \
  "the registry's hex_world is not the package L4 measured" \
  probe/l4/theirs_api.loft
# ⚠ D IS THE RENAME'S OWN PROOF, and it is the one line here that CHANGED at L6.2.
# Before the rename this same command gave `error: Unknown function world_empty`,
# because `hex_world` resolved to OURS out of `lib/`. It resolves to THEIRS now, which
# is the whole of what L6.2 bought: one name, one package, whatever the flags say.
check "D theirs --lib lib/"   ok  "PROBE built THEIR world" \
  "a hex_world is back in lib/ — the L6.2 rename has been undone or half-applied" \
  --lib lib/ probe/l4/theirs_api.loft

echo
echo "── both lineages in one graph ────────────────────────────────────────────"
check "E both packages"       ok  "PROBE both loaded" \
  "the two lineages stopped being co-installable; L4's recommendation changes" \
  --lib lib/ probe/l4/both.loft
# ⚠ F's WORDS CHANGED AT L6.2 AND THE CHANGE IS THE POINT. It used to read
# `expected World, got World` — the `Surface` diagnostic of `L1` verbatim, and the
# least useful sentence the compiler can produce. Ours is `VoxelWorld` now, so the
# same mistake reports two names a reader can tell apart. ⚠ The file's DIRECTION had
# to be reversed to keep measuring this at all; `merge.loft` says why.
check "F world types distinct" err "expected VoxelWorld, got World" \
  "the two world types MERGED, or ours answers to World again — that is L1's bug at library scale, file it at once" \
  --lib lib/ probe/l4/merge.loft

echo
echo "── the bare type name, at both import orders ─────────────────────────────"
# ⚠ THESE TWO HAVE NOW FLIPPED TWICE, AND EACH FLIP WAS A FIX.
#   · originally: a bare `Chunk { … }` bound silently to whichever package was `use`d
#     FIRST, so the two orders compiled DIFFERENT programs — loft#788.
#   · 2026-08-07: loft 2026.8.0 refused the bare name at both orders and named the two
#     packages. The order stopped deciding.
#   · L6.2: ours is `VoxelChunk`, so `Chunk` is declared by ONE package again and the
#     literal simply compiles — at either order, meaning the same thing. That is what
#     the struct half of the rename bought, and these two lines are where it is visible.
check "G voxel first"         ok  "PROBE bare literal took THEIRS" \
  "a second Chunk is back in the graph — ours answers to the bare name again, and the import order decides once more" \
  --lib lib/ probe/l4/literal_voxel_first.loft
check "H world first"         ok  "PROBE bare literal took THEIRS" \
  "the import ORDER decides again — that is loft#788, re-file it against this build" \
  --lib lib/ probe/l4/literal_world_first.loft

echo
if [ $fail -eq 0 ]; then
  echo "all 8 controls behaved as L6.2 left them (A-C/E on 2026-08-06; D/F/G/H re-measured at the rename)"
else
  echo "a control flipped — read the line above before believing anything downstream"
fi
exit $fail
