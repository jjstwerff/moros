#!/bin/sh
# T3's ACCEPTANCE — ONE SCRIPT, TWO DRIVERS, ONE WORLD.
#
#   sh probe/t3/vs_server.sh probe/t3/walk_place.keys t3walk
#
# Plan 22 `T3`. `probe/t3/run.sh` asks whether the runner walks; this asks whether it
# walks the way the SERVER does, which is the only question byte-equality can answer.
# The script is driven twice — once through `probe/t1/run.sh`, which builds a native
# server and drives it over a socket, and once through `editor_run` at `GROUND=0` — and
# the two saved worlds are compared.
#
# ⚠ **IT IS NOT IN `make fast` AND SHOULD NOT BE.** A native build plus a live socket is
# minutes, and `probe/t1/run.sh` drew this line first for the same reason: a gate reports
# PASS/FAIL and this reports an md5 that a person compares against a number in a
# document. The number is in `README.md` beside this file.
#
# ⚠ **`GROUND=0` IS THE COMPARISON AND NOT A TEST HOOK.** `editor_run` seeds a patch of
# surface so a scripted scene has something to photograph; the server seeds nothing,
# because an unwritten cell reads as absent and absence IS the floor (`E1γ`). Measured
# at `K3c`: the same verbs at the same pose leave τ 4079 seeded and τ 358 not.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
script=${1:-probe/t3/walk_place.keys}
world=${2:-t3walk}

[ -f "$script" ] || { echo "t3: no such script: $script"; exit 2; }
grep -q "^save $world\$" "$script" || {
  echo "t3: $script must end in \`save $world\` — the SERVER side saves by that line,"
  echo "    and the runner saves by \$WORLD. A mismatch compares two different runs."
  exit 2; }

echo "── the server ────────────────────────────────────────────────────────────"
sh probe/t1/run.sh "$script" "$world" | tail -3
srv=$(md5sum < "worlds/$world.hxw" | cut -d' ' -f1)

echo ""
echo "── the runner ────────────────────────────────────────────────────────────"
GROUND=0 SCRIPT="$script" WORLD="$world-run" $LOFT --lib lib/ src/editor_run.loft \
  2>/dev/null | grep -E '^  |^editor_run: ' | tail -12
run=$(md5sum < "worlds/$world-run.hxw" | cut -d' ' -f1)

echo ""
echo "  server $srv"
echo "  runner $run"
if [ "$srv" = "$run" ]; then
  echo "T3 ACCEPTANCE: green — one script, two drivers, one world"
else
  echo "T3 ACCEPTANCE: FAILED — the two drivers built different worlds"
  exit 1
fi
