#!/bin/sh
# CONTROLS §6 `C1`/`C2` — THE STICKS ON THE PAGE, AND A KEYBOARD SHAPED LIKE THEM.
#
#   sh probe/stick/run.sh            (or `make probe-stick`)
#   STICK_SABOTAGE=<name> sh probe/stick/run.sh
#
# Assembles `_site/index.html` from the client engine build, opens it from `file://`
# with no listener, installs a FAKE gamepad into the page and drives it: the left
# stick walks and strafes, the right stick turns, a centred stick does nothing, `d`
# strafes instead of turning, and a mouse drag turns the character locally. Every
# row is a difference between two of the walker's own lines.
#
#   STICK_SABOTAGE=nopad     the page's reader pushes nothing (JS)     → B0 B1 C1 D1 red
#   STICK_SABOTAGE=noturn    the client maps A/D to the TURN bits again → F1 red — the old keyboard
#   STICK_SABOTAGE=nolook    the local drag no longer turns              → G1 red
#
# ⚠ The two loft rows each cost a wasm build (~3 min). `sweep.sh` runs all three.
set -u
cd "$(dirname "$0")/../.." || exit 1
OUT=probe/stick/out
mkdir -p "$OUT"
SITE="$PWD/_site/index.html"
ENGINE=src/.loft/editor_client.html
SAB="${STICK_SABOTAGE:-}"
NAME="${SAB:-control}"
fail() { echo "STICK FAIL — $1"; exit 1; }
test -f "$ENGINE" || fail "no client engine build — run \`make client\`"

sab_loft() {
  sed "$2" src/editor_client.loft > "probe/stick/.$1.loft"
  grep -q "SABOTAGE $1" "probe/stick/.$1.loft" \
    || fail "the $1 sabotage patched nothing: the line it addresses has been reshaped"
  echo "   SABOTAGE $1 — $3"
  loft --html --lib lib/ "probe/stick/.$1.loft" > "$OUT/$1.build" 2>&1 \
    || fail "the sabotaged client did not build — see $OUT/$1.build"
  test -f "probe/stick/.loft/.$1.html" || fail "the sabotaged page was not emitted where expected"
  node tools/build-pages.mjs --engine "probe/stick/.loft/.$1.html" > /dev/null || fail "build-pages refused the sabotaged engine"
}
case "$SAB" in
  "")     node tools/build-pages.mjs > /dev/null || fail "build-pages failed" ;;
  nopad)  echo "   SABOTAGE nopad — the page half"
          node tools/build-pages.mjs --pad-sabotage nopad > /dev/null || fail "build-pages failed" ;;
  noturn) sab_loft noturn 's|^  if graphics::gl_key_pressed(KEY_STRAFE_R) { bits = bits \| hex_editor::HELD_STRAFE_R; }$|  if graphics::gl_key_pressed(KEY_STRAFE_R) { bits = bits \| hex_editor::HELD_RIGHT; }   // SABOTAGE noturn|' \
            "d turns again, as the old keyboard did" ;;
  nolook) sab_loft nolook 's|^        st.wk.wk_yaw = st.wk.wk_yaw + (ddx as float) \* hex_editor::LOOK_PER_PX;$|        // SABOTAGE nolook|' \
            "the drag no longer turns the character locally" ;;
  *)      fail "unknown STICK_SABOTAGE '$SAB'" ;;
esac
node probe/stick/drive.mjs "file://$SITE" > "$OUT/$NAME.log" 2>&1
rc=$?
grep -E '^(STICK |start:|\[)' "$OUT/$NAME.log"
if [ "$rc" -ne 0 ]; then echo "STICK ($NAME): RED — transcript in $OUT/$NAME.log"
else echo "STICK ($NAME): green — the sticks walk, strafe and turn the page's walker, and the keyboard is shaped like them"; fi
if [ -n "$SAB" ]; then node tools/build-pages.mjs > /dev/null; fi
exit $rc
