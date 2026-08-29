#!/bin/sh
# PROBE 5 — A PAGE IN REMOTE MODE MUST NOT TICK.
#
#   sh probe/t5/run.sh
#
# Plan 22, [WALK_TICK.md § probe 5](../../doc/claude/WALK_TICK.md). The design's
# cleanest sentence is *"one `walk_tick` serves all three drivers"*, and the design
# itself says it is one sentence too wide:
#
#   > **The page ticks where it is the AUTHORITY.** Attached, `st.cache` is a cache
#   > of the server's world, not the world; a page ticking its own walker would
#   > level its own copy and diverge silently from the authority that owns it.
#
# The guard is ONE LINE — `src/editor_client.loft`, `if st.local { author =
# local_tick(…) }`. `T2` left it alone and wrote an ARGUMENT for it into the source
# beside `local_restore` (*"…and it is probe 5's answer"*). ⚠ **An argument is not a
# measurement**, which `T2` said about itself and is what this file is for.
#
# ── ⚠ WHY THE INSTRUMENT IS NOT A WORLD KEY ─────────────────────────────────
#
# The page cannot be asked for an md5. It holds a CACHE, and a cache legitimately
# differs from the world by whatever has not been streamed to it yet — so an
# inequality would mean nothing and an equality would mean less.
#
# What it CAN be asked is the question it is already asked once a second:
# `D:<cx>,<cz>,<li>,<crc>;…`, the server's digest of the visible set, answered by the
# page with `41:agree N bad M layers L` and written down by the server as
# **`editor: client cache agree N bad M layers L`**. A per-layer CRC comparison of the
# page's cache against the server's world, computed by the page, carried on the wire,
# recorded on the OTHER SIDE of it — which is the non-circularity `probe/b1b` had to
# learn when its first version read the client's own claim about the client.
#
# ── ⚠ THE FIXTURE RAISES GROUND FIRST, AND THAT IS PROBE 4's SCAR ───────────
#
# `level_on` is **never called on the page in remote mode**: the `l` key's attached
# branch flips `wk_levelling` and sends `6:1`, so `wk_level_h` keeps `walker_new`'s
# **0**. On ground already at 0 the stamp's `cur_h != level_h` is false at every cell
# and levelling correctly writes NOTHING — so a sabotaged page walking flat ground
# would diverge by nothing at all, and the run would come back green while measuring
# emptiness. `probe/b2`'s `L` block raises first for the same reason.
#
# ── WHAT EACH RUN IS ────────────────────────────────────────────────────────
#
#   run C — the page as built            the guard is there; the digest must stay clean
#   run S — `if st.local` DELETED        the elegant version, *"now every driver has a
#                                        walker"*, which is what a reader deletes
#
# ⚠ THE SABOTAGE IS THE MINIMAL ONE ON PURPOSE. It does not seed the page's walker
# from the server's pose and it does not call `level_on` on the page. A sabotage that
# also built the missing seeding would be measuring a design nobody proposed.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/t5/out
PAGE=src/.loft/editor_client.html
PORT=${EDITOR_PORT:-18090}
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

command -v node > /dev/null 2>&1 || { say "t5 SKIP — no node"; exit 0; }

# Raise the ground, freeze the grade ON it, walk, release. ⚠ THE `ArrowUp`s ARE NOT
# DECORATION — see the scar above: without them the sabotaged page stamps height 0
# onto ground that is already 0 and writes nothing.
KEYS=$(python3 -c "print(','.join(['ArrowUp']*3 + ['l'] + ['w']*60 + ['l']))")
ATTACHED="edits go to the server"

# ── the two pages ───────────────────────────────────────────────────────────
#
# ⚠ BUILT FROM SOURCE COPIES, AND THE HONEST PAGE IS KEPT ASIDE RATHER THAN
# RESTORED WITH GIT. CLAUDE.md's rule: the subject of a sweep is uncommitted by
# definition, and `git checkout --` between rows deletes it.
build_page() {                    # build_page <src> <tag>
  bp_src=$1; bp_tag=$2
  $LOFT --html --lib lib/ "$bp_src" > "$OUT/$bp_tag.build" 2>&1 || {
    say "t5 FAIL — the $bp_tag page did not build:"; tail -20 "$OUT/$bp_tag.build"; exit 1; }
  bp_out=$(sed -n 's/^wrote \(.*\.html\) .*/\1/p' "$OUT/$bp_tag.build" | tail -1)
  [ -n "$bp_out" ] || bp_out=$(sed -n 's/^wrote \(.*\.html\)$/\1/p' "$OUT/$bp_tag.build" | tail -1)
  [ -n "$bp_out" ] || { say "t5 FAIL — the $bp_tag build named no page:"; cat "$OUT/$bp_tag.build"; exit 1; }
  cp "$bp_out" "$OUT/$bp_tag.html"
  say "   $bp_tag page: $(( $(wc -c < "$OUT/$bp_tag.html") / 1024 )) KB"
}

say "── probe 5  build both pages ───────────────────────────────────────"
build_page src/editor_client.loft control

SAB=$OUT/sab_client.loft
cp src/editor_client.loft "$SAB"
# ⚠ THE WHOLE SABOTAGE, AND THE `cmp` BELOW IS WHY IT IS ONE LINE. `probe/b1b`'s
# `nomesh` row is the warning: a pattern that has drifted edits nothing and reports a
# clean run, which is the *nothing went red* sentence a useless control produces.
sed -i 's/^    if st.local { author = local_tick(st, sess, author); }$/    author = local_tick(st, sess, author);/' "$SAB"
if cmp -s "$SAB" src/editor_client.loft; then
  say "t5 FAIL — the sabotage changed NOTHING; its pattern has drifted"; exit 1
fi
build_page "$SAB" sabotage

restore() { cp "$OUT/control.html" "$PAGE" 2>/dev/null || true; }
trap 'make -s stop-editor > /dev/null 2>&1 || true; restore' EXIT INT TERM

# ── one run ─────────────────────────────────────────────────────────────────
drive() {                          # drive <tag>
  dr_tag=$1
  cp "$OUT/$dr_tag.html" "$PAGE"
  make -s port-free > /dev/null 2>&1 || true
  : > "$OUT/$dr_tag.server"
  nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/$dr_tag.server" 2>&1 &
  dr_pid=$!
  echo "$dr_pid" > "$OUT/$dr_tag.pid"
  # 240 s, `probe/b1b`'s number: an interpreted server recompiles after a library
  # edit, and a 120 s window was measured giving up mid-compile.
  i=0
  while [ "$i" -lt 240 ]; do
    grep -q 'listening on port' "$OUT/$dr_tag.server" && break
    kill -0 "$dr_pid" 2>/dev/null || break
    sleep 1
    i=$((i + 1))
  done
  # ⚠ THE PID SEPARATES *still compiling* FROM *did not compile* — `probe/k1`'s finding,
  # 2026-08-29. The second wore the first's sentence for a session there.
  if ! grep -q 'listening on port' "$OUT/$dr_tag.server"; then
    if kill -0 "$dr_pid" 2>/dev/null; then
      say "t5 FAIL — the $dr_tag server is STILL BUILDING after 240 s:"
    else
      say "t5 FAIL — the $dr_tag server EXITED without listening — it did not build:"
    fi
    tail -20 "$OUT/$dr_tag.server"
    kill "$dr_pid" 2>/dev/null || true
    exit 1
  fi
  # ⚠ IT WAITS FOR THE PAGE'S OWN SENTENCE, NEVER FOR A CLOCK — `press.mjs`'s rule.
  # A key pressed before the panel says `server` lands in the other authority, which
  # produces exactly the transcript a broken remote mode produces.
  timeout 400 node probe/b1b/press.mjs "http://127.0.0.1:$PORT/client" "$KEYS" \
    --await "$ATTACHED" --wait-ms 60000 > "$OUT/$dr_tag.raw" 2>&1 || true
  grep -E '^(client|lavition editor client)' "$OUT/$dr_tag.raw" > "$OUT/$dr_tag.log" || true
  grep '^editor: client cache' "$OUT/$dr_tag.server" > "$OUT/$dr_tag.digest" || true
  make -s stop-editor > /dev/null 2>&1 || true
  wait "$dr_pid" 2>/dev/null || true
}

# The last digest answer, and the worst one. ⚠ TWO NUMBERS BECAUSE THEY ANSWER
# DIFFERENT QUESTIONS: a page whose cache lags a chunk mid-stream can report a
# transient `bad` that the next layer clears, while a page that stamped its own pad
# into a world nobody else is writing diverges FOR GOOD — the server has no dirty
# chunk there, so it never resends and never repairs it.
last_bad()  { sed -n 's/.*bad \([0-9]*\) layers.*/\1/p' "$OUT/$1.digest" | tail -1; }
max_bad()   { sed -n 's/.*bad \([0-9]*\) layers.*/\1/p' "$OUT/$1.digest" | sort -n | tail -1; }
last_agree(){ sed -n 's/.*agree \([0-9]*\) bad.*/\1/p' "$OUT/$1.digest" | tail -1; }
walker()    { grep '^client: attached walker' "$OUT/$1.log" | tail -1; }
num()       { v=$(cat 2>/dev/null); [ -n "$v" ] || v=-1; echo "$v"; }

say
say "── run C — the page as BUILT, attached to a real server ─────────────"
drive control
c_last=$(last_bad control | num); c_max=$(max_bad control | num)
c_agree=$(last_agree control | num); c_walk=$(walker control)
say "   digests: $(wc -l < "$OUT/control.digest") · last: $(tail -1 "$OUT/control.digest")"
say "   walker:  ${c_walk:-<none>}"

if grep -q '^lavition editor client' "$OUT/control.log"; then
  ok "C0 the page booted — what follows is about a running client"
else
  bad "C0 the page never booted; every row below would be vacuous"
fi
if grep -q "client: status ← lavition editor — $ATTACHED" "$OUT/control.log"; then
  ok "C1 and it ATTACHED — the authority is the server's, which is the subject"
else
  bad "C1 the page never attached: $(grep -c 'client: status ←' "$OUT/control.log") status lines, last '$(grep 'client: status ←' "$OUT/control.log" | tail -1)'"
fi
# ⚠ THE VACUITY GUARD ON THE WHOLE PROBE. `agree 0 bad 0` satisfies every `bad`
# test below while comparing nothing at all, and this tree has shipped a row that
# reported ok on a picture with no panel in it.
if [ "$c_agree" -gt 0 ]; then
  ok "C2 the digest actually compared something — agree $c_agree on the last answer"
else
  bad "C2 the digest compared NOTHING (agree $c_agree); 'bad 0' would be a fact about an empty set"
fi
if [ "$c_last" = "0" ] && [ "$c_max" = "0" ]; then
  ok "C3 the page's cache never disagreed with the server — bad 0 on every one of $(wc -l < "$OUT/control.digest")"
elif [ "$c_last" = "0" ]; then
  ok "C3 the page's cache ENDS in agreement — last bad 0, worst $c_max in flight"
else
  bad "C3 the attached page's cache diverged and stayed diverged — last bad $c_last"
fi
# The walker's own three numbers. ⚠ `asked` IS THE ONE THAT MUST NOT BE ZERO.
c_ticked=$(echo "$c_walk" | sed -n 's/.*idle: \([0-9]*\) steps.*/\1/p' | num)
c_stamp=$(echo "$c_walk" | sed -n 's/.*stamped \([0-9]*\),.*/\1/p' | num)
c_asked=$(echo "$c_walk" | sed -n 's/.*asked \([0-9]*\) .*/\1/p' | num)
if [ "$c_asked" -gt 0 ]; then
  ok "C4 the walk keys DID reach this page — asked $c_asked, so standing still is a refusal"
else
  bad "C4 no walk key ever reached the page (asked $c_asked) — 'it did not tick' is vacuous"
fi
if [ "$c_ticked" = "0" ] && [ "$c_stamp" = "0" ]; then
  ok "C5 …and it consumed 0 steps and stamped 0 cells: the guard held"
else
  bad "C5 the attached page ticked $c_ticked step(s) and stamped $c_stamp cell(s)"
fi

say
say "── run S — the SAME page with \`if st.local\` deleted ────────────────"
drive sabotage
s_last=$(last_bad sabotage | num); s_max=$(max_bad sabotage | num)
s_agree=$(last_agree sabotage | num); s_walk=$(walker sabotage)
say "   digests: $(wc -l < "$OUT/sabotage.digest") · last: $(tail -1 "$OUT/sabotage.digest")"
say "   walker:  ${s_walk:-<none>}"

# ⚠ THE SABOTAGE NEEDS ITS OWN POSITIVE CONTROLS. A page that crashed, or never
# attached, also reports no agreement — and that would read as the divergence this
# row is looking for.
if grep -q '^lavition editor client' "$OUT/sabotage.log" \
   && grep -q "client: status ← lavition editor — $ATTACHED" "$OUT/sabotage.log"; then
  ok "S0 the sabotaged page booted and attached — it diverged, it did not fall over"
else
  bad "S0 the sabotaged page never booted or never attached; S2 would be about a crash"
fi
s_ticked=$(echo "$s_walk" | sed -n 's/.*idle: \([0-9]*\) steps.*/\1/p' | num)
s_stamp=$(echo "$s_walk" | sed -n 's/.*stamped \([0-9]*\),.*/\1/p' | num)
# ⚠ DID-IT-APPLY, BEYOND `cmp`. `cmp` proves the FILE changed; this proves the change
# reached the running page — `probe/b1b`'s `nomesh` row is the one that edited a file
# and meant nothing.
if [ "$s_ticked" -gt 0 ]; then
  ok "S1 the sabotage took: the attached page consumed $s_ticked step(s)"
else
  bad "S1 the sabotaged page still ticked $s_ticked times — the edit did not reach the run"
fi
if [ "$s_stamp" -gt 0 ]; then
  ok "S2 …and stamped $s_stamp cell(s) into a world it does not own"
else
  bad "S2 the sabotaged page ticked and stamped NOTHING — the fixture cannot see the write (probe 4's shape: is the ground raised?)"
fi
if [ "$s_last" -gt 0 ]; then
  ok "S3 and the digest SAW IT — bad $s_last on the last answer, worst $s_max"
elif [ "$s_max" -gt 0 ]; then
  bad "S3 the divergence was TRANSIENT — worst bad $s_max, last bad $s_last. The server repaired it, so the digest cannot report this as permanent"
else
  bad "S3 the digest reported bad 0 with the guard REMOVED — this instrument is blind, and run C's green says nothing"
fi

say
if [ "$fails" -eq 0 ]; then
  say "probe 5: the guard is load-bearing and the instrument can see it — $(wc -l < "$OUT/control.digest") clean digests against bad $s_last without it"
else
  say "probe 5: $fails row(s) FAILED"
fi
exit $((fails > 0))
