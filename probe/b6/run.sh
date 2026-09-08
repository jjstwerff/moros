#!/bin/sh
# Plan 26 `B6` — THE PLAN ON THE PAGE, AND A PICK ON IT.
#
#   sh probe/b6/run.sh            (or `make probe-b6`)
#   B6_SABOTAGE=<name> sh probe/b6/run.sh
#
# Assembles `_site/index.html` from the client engine build, opens it from
# `file://` with no listener at either end, and drives one sentence in a headless
# browser: `m` opens the plan, a click on a cell picks it, `ArrowUp` raises THAT
# cell, `m` closes the plan, `ArrowUp` raises the cell under the feet again.
# Every row reads the SVG the page holds and the client's own console.
#
# ⚠ THE SUBJECT IS TWO HALVES AND THE SWEEP HAS A ROW FOR EACH. The loft half is
# `editor_client.loft` (`plan_open`/`plan_poll`/`plan_target`), sabotaged the way
# `probe/b2` does it — a `sed` into a copy, built beside the real client, the
# source never touched; the page half is the overlay in `tools/build-pages.mjs`,
# sabotaged by its own `--plan-sabotage` flag.
#
#   B6_SABOTAGE=noshow    the overlay never appears           → B1 red, and nothing to click
#   B6_SABOTAGE=nopush    the click pushes nothing to loft    → C1 C2 D1 D2 red
#   B6_SABOTAGE=nopoll    the client never reads the queue    → C1 C2 D1 D2 red
#   B6_SABOTAGE=notarget  a verb ignores the pick             → D1 D2 red, C green — SEEING is not AUTHORING
#   B6_SABOTAGE=nofollow  the picture does not follow w_tau   → D1 E3 red — the world is right, the picture is stale
#
# ⚠ The three loft rows each cost a wasm build (~3 min). `sweep.sh` runs them all
# and restores the real page afterwards; this script restores it too.
set -u
cd "$(dirname "$0")/../.." || exit 1
OUT=probe/b6/out
mkdir -p "$OUT"
SITE="$PWD/_site/index.html"
ENGINE=src/.loft/editor_client.html
SAB="${B6_SABOTAGE:-}"
NAME="${SAB:-control}"
fail() { echo "B6 FAIL — $1"; exit 1; }

test -f "$ENGINE" || fail "no client engine build — run \`make client\`"

sab_loft() {
  # $1 name, $2 sed expression, $3 what it removes
  sed "$2" src/editor_client.loft > "probe/b6/.$1.loft"
  grep -q "SABOTAGE $1" "probe/b6/.$1.loft" \
    || fail "the $1 sabotage patched nothing: the line it addresses has been reshaped"
  echo "   SABOTAGE $1 — $3"
  loft --html --lib lib/ "probe/b6/.$1.loft" > "$OUT/$1.build" 2>&1 \
    || fail "the sabotaged client did not build — see $OUT/$1.build"
  test -f "probe/b6/.loft/.$1.html" || fail "the sabotaged page was not emitted where expected"
  node tools/build-pages.mjs --engine "probe/b6/.loft/.$1.html" > /dev/null || fail "build-pages refused the sabotaged engine"
}

case "$SAB" in
  "")      node tools/build-pages.mjs > /dev/null || fail "build-pages failed" ;;
  noshow|nopush)
           echo "   SABOTAGE $SAB — the page half"
           node tools/build-pages.mjs --plan-sabotage "$SAB" > /dev/null || fail "build-pages failed" ;;
  nopoll)  sab_loft nopoll 's|^  msg = host_input(0);$|  msg = "";   // SABOTAGE nopoll|' \
             "the client never reads what the page pushed" ;;
  notarget) sab_loft notarget 's|^  if !st.plan_on \|\| !st.plan_pick.pk_ok { return a; }$|  if true { return a; }   // SABOTAGE notarget|' \
             "a verb lands under the feet whatever was picked" ;;
  nofollow) sab_loft nofollow 's|^    if st.plan_on \&\& st.cache.w_tau != st.plan_tau { plan_draw(st, author); }$|    // SABOTAGE nofollow|' \
             "the picture is not redrawn when the world moves" ;;
  *)       fail "unknown B6_SABOTAGE '$SAB'" ;;
esac

node probe/b6/drive.mjs "file://$SITE" > "$OUT/$NAME.log" 2>&1
rc=$?
grep -E '^(B6 |click |picture |\[)' "$OUT/$NAME.log"
if [ "$rc" -ne 0 ]; then
  echo "B6 ($NAME): RED — transcript in $OUT/$NAME.log"
else
  echo "B6 ($NAME): green — the plan is on the page, a click is a pick, a verb lands on it"
fi
# The real page back, whatever was assembled above.
if [ -n "$SAB" ]; then node tools/build-pages.mjs > /dev/null; fi
exit $rc
