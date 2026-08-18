#!/bin/sh
# THE SAME SCRIPT BUILDS THE SAME WORLD, WITH AND WITHOUT A SERVER — plan 22 `S2c`.
#
# ⛔ **IT DID NOT, AND NOTHING IN THIS TREE WAS LOOKING.** `make headless-same`
# compares ONE SENTENCE — `house placed … cells, … wall edges, ridge at …` — which is
# `verb place`'s reckoning; no gate cuts an opening over the wire at all; and
# `probe/k3d` records the headless side only. So `src/editor_server.loft`'s `36:`
# handler could be, and was, a second body of `hex_editor::session_open_kind` that cut
# a different set of edges: measured over the eight scripts that open anything,
# **five diverged** — `niche` 6 edges headless against 3 served, `profiles` 6 against
# 4, `door` and `opening` 3 against 2, and `embrasure` 2 against **3**, the server
# opening one MORE because it wrote the store before it knew the shape was refused.
#
# ⚠ **THE VERDICT IS THE BYTES AND THE DIAGNOSIS IS THE COUNT.** A world key that
# moved says *something differs*; `edges.loft` then says WHICH boundary bytes changed
# hands, which is what names the gesture. Running the counts alone would have been the
# weaker check, and running the bytes alone would have made every failure a bisect.
#
# ⚠ **`GROUND=0` IS NOT A TEST HOOK — IT IS *START WHERE THE SERVER STARTS*.** The
# runner seeds a patch of `SURFACE_MAT` and the server seeds none (`E1γ`: absence is
# the floor), so with the default the two files differ before a gesture is performed.
# `editor_run` has carried the knob since `B1b.1b` for exactly this comparison.
#
#   sh probe/s2c/run.sh              # the eight scripts that open something
#   sh probe/s2c/run.sh niche        # …or name your own
set -u
cd "$(dirname "$0")/../.."
LOFT=${LOFT:-loft}
GROUND=${GROUND:-0}

# ⚠ EVERY LIVE SCRIPT THAT CUTS AN OPENING, not a sample. Three of the eight agreed
# even before the fix (`house`, `annex`, `furnish` — their walls come from
# `place_house`, whose runs sit on the edges they stamp), so a sample of those three
# would have reported the defect as absent.
SCRIPTS=${*:-"house door opening niche embrasure profiles annex furnish"}

ran=0
bad=0
for s in $SCRIPTS; do
  echo "=== $s ==="
  if [ ! -f "tools/scripts/$s.keys" ]; then echo "  no such script"; bad=$((bad + 1)); continue; fi
  SCRIPT=tools/scripts/$s.keys WORLD=s2c_run_$s GROUND=$GROUND $LOFT --lib lib/ \
    src/editor_run.loft >/dev/null 2>&1 \
    || { echo "  the runner failed"; bad=$((bad + 1)); continue; }
  # ⚠ `snap` IS DROPPED AND `save` APPENDED. A snapshot is the server's alone, so
  # leaving it in makes the served side pay for pictures nothing compares; the save is
  # how the world gets out, and `editor_run` writes its own at the end.
  sed 's/^snap .*$//' tools/scripts/$s.keys > probe/s2c/.$s.keys
  printf '\nsave s2c_srv_%s\n' "$s" >> probe/s2c/.$s.keys
  make -s port-free >/dev/null 2>&1; : > .editor.log
  nohup $LOFT --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 &
  srv=$!
  waited=0
  ok=1
  until grep -q 'listening on port' .editor.log 2>/dev/null; do
    sleep 1; waited=$((waited + 1))
    if ! kill -0 $srv 2>/dev/null; then
      echo "  the server EXITED without listening — it did not build:"
      grep -E '^error' -A4 .editor.log | head -12; ok=0; break
    fi
    if [ $waited -gt 600 ]; then echo "  the server never listened in 600s"; ok=0; break; fi
  done
  if [ $ok -eq 0 ]; then bad=$((bad + 1)); rm -f probe/s2c/.$s.keys; continue; fi
  node tools/script.mjs probe/s2c/.$s.keys >/dev/null 2>&1
  make -s stop-editor >/dev/null 2>&1
  rm -f probe/s2c/.$s.keys
  ran=$((ran + 1))
  if [ ! -s worlds/s2c_run_$s.hxw ] || [ ! -s worlds/s2c_srv_$s.hxw ]; then
    echo "  one of the two worlds was never written — this row says nothing"
    bad=$((bad + 1)); continue
  fi
  if cmp -s worlds/s2c_run_$s.hxw worlds/s2c_srv_$s.hxw; then
    echo "  IDENTICAL — $(md5sum < worlds/s2c_run_$s.hxw | cut -c1-32)"
  else
    echo "  ⛔ DIFFER — $(md5sum < worlds/s2c_run_$s.hxw | cut -c1-32)"
    echo "             $(md5sum < worlds/s2c_srv_$s.hxw | cut -c1-32)"
    RUNNER=$PWD/worlds/s2c_run_$s.hxw SERVED=$PWD/worlds/s2c_srv_$s.hxw \
      $LOFT --lib lib/ probe/s2c/edges.loft 2>/dev/null | grep -E '^s2c:' | sed 's/^/    /'
    bad=$((bad + 1))
  fi
done

# ⚠ THE VACUITY GUARD. A loop that compared nothing exits 0 without one, and *no
# script diverged* is the same sentence a run that never started produces — which is
# the trap `K3d`'s own sweep fell into and `D0`'s scored as five clean catches.
if [ $ran -eq 0 ]; then
  echo "s2c: NOTHING WAS COMPARED — this run says nothing"
  exit 1
fi
if [ $bad -gt 0 ]; then
  echo "s2c: $bad of $ran script(s) build a different world with a server than without"
  exit 1
fi
echo "s2c: $ran script(s), each byte-identical with and without a server"
