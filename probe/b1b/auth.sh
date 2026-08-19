#!/bin/sh
# B1b.1a / B1b.1b (plan 22) — WHICH AUTHORITY DOES THE PAGE HAVE, DOES IT SAY SO,
# AND DOES THE SECOND ONE BUILD THE SAME WORLD AS THE RUNNER?
#
#   probe/b1b/auth.sh                    (or `make probe-auth`)
#   AUTH_SABOTAGE=literal probe/b1b/auth.sh   the client as it WAS, with the
#                                             instrument that can see it
#   AUTH_SABOTAGE=nodirty …              the fact changes and the panel is not told
#   AUTH_SABOTAGE=assume  …              the authority read off the SEND, not off
#                                        the send SUCCEEDING
#   AUTH_SABOTAGE=nolocal …              it never gives up dialling
#   AUTH_SABOTAGE=nolocaldirty …         it goes local and the panel is not told
#   AUTH_SABOTAGE=sendlocal …            local mode SENDS instead of pressing
#   AUTH_SABOTAGE=elsewhere …            local mode presses at another author
#   AUTH_SABOTAGE=scratchsession …       it presses into a session nobody keeps
#   AUTH_SABOTAGE=eager …                one unanswered dial is enough to give up
#   AUTH_SABOTAGE=nocam …                local mode writes and never sets a camera
#   AUTH_SABOTAGE=camdrift …             the camera is re-solved on every write
#   AUTH_SABOTAGE=camquiet …             …and one that never says where it is
#   AUTH_SABOTAGE=nomesh …               …and never meshes its own ground
#   AUTH_SABOTAGE=stale …                it writes and does not redraw
#   AUTH_SABOTAGE=groundonly …          it meshes the GROUND and nothing else
#
# `src/editor_client.loft:1680` read `ps_status: "moros editor — connected"` — a
# literal, set at panel construction, before any socket existed, with no other
# writer anywhere in the file. **The panel claimed a connection it had never
# checked**, and it went on claiming it with the server down. `B1b.1a` derived it
# from the client's own evidence; `B1b.1b` then let the authority VARY — no socket
# means the page edits its own world — which is the hazard route 2 was rejected
# for, and the line is what turns it into a fact on screen.
#
# ⚠ THREE RUNS OVER THE SAME PAGE BYTES, and that is the comparison. One file is
# built and served three times; the only difference is what answers the socket. So
# a difference in what the panel says is a difference the client derived, not a
# difference between two builds.
#
#   run A — the real editor server   sees the TRANSITION: the panel is built
#                                    before the socket opens, so it must say
#                                    `connecting` first and `server` after — and
#                                    it must NEVER give up on a server that is
#                                    there
#   run B — a static server, no /ws  sees the SECOND AUTHORITY. With nothing
#                                    behind the wire the page must stop dialling,
#                                    say so, and then WRITE what it is pressed —
#                                    into a world `editor_run` can be held against
#   run C — /ws opens, says nothing  sees WHO TOLD THE PANEL, and is the bound's
#                                    negative control: a socket that opens and
#                                    then says nothing must not be mistaken for
#                                    no socket at all
#
# ⚠ AND AN ABSENCE IS ONLY WORTH READING BESIDE POSITIVE CONTROLS. A page that
# never booted, or one that froze on frame 1, also "never claims a server". So B
# asserts the boot line and asserts the frame counter got past 600 — and C asserts
# that every message counter is still ZERO, which is what turns "the panel was
# told by the socket" from a story into the only remaining explanation.
#
# ⚠ THE CONTROL FOR *WAS THERE A SOCKET* IS THE OTHER SIDE'S LOG, NOT THE CLIENT'S.
# B's first version read the client's own `connected` line as proof that nothing
# had opened — the very claim under test — so `AUTH_SABOTAGE=assume` made the
# control agree with the lie it existed to catch. The static server counts the
# dials it refused and the ones it completed, and that is the evidence.
#
# ⚠ THE STATUS IS READ OUT OF THE BUILT PANEL (`p_status.ss_text`), never
# re-composed. A println calling `authority_line(st)` a second time agrees with
# itself for as long as it is copied correctly and says nothing about what the
# panel holds — `K1`'s finding. `ss_text` is post-`fit_text`, so a status too long
# for its strip arrives here carrying its own `..` rather than being discovered in
# a screenshot later.
#
# ⚠ AND THE WORLD IS COMPARED AGAINST A RUNNER, NOT AGAINST ITSELF. `editor_run`
# presses the same six verbs at the same author over `GROUND=0` — the world the
# server starts from, which is the one local mode holds — and `hex_voxel::world_key`
# is called by both, so neither side can spell its own digest.
#
# ⚠ IN TWO HALVES, BLIND IN OPPOSITE DIRECTIONS. The world says what was written to
# the store; `hex_editor::session_digest` says what the editor REMEMBERS, and a ring
# puts its trunk only in the second. `scratchsession` is that pair as a measurement:
# byte-identical world, different scene.
#
# ⏭ WHAT THIS DOES NOT CHECK: the wire. `B1a` owns that, and `make probe-b1a` is
# what says the same key sequence still sends what it always sent when a server IS
# there — this step must move nothing about attached mode at all.
set -e
cd "$(dirname "$0")/../.."
LOFT="${LOFT:-loft}"
OUT="probe/b1b/.out"
PAGE="src/.loft/editor_client.html"
PORT="${EDITOR_PORT:-18090}"
SPORT="${AUTH_STATIC_PORT:-18099}"
SAB="${AUTH_SABOTAGE:-}"
mkdir -p "$OUT"

CONNECTING="moros editor — connecting to the server"
SERVER="moros editor — edits go to the server"
LOCAL="moros editor — edits stay in this page"

# The keys run B presses, and the verbs they name. ⚠ `w` IS LAST AND IS NOT A
# GESTURE: it is the walk, which local mode has no answer for (`B1c`), and it is
# here so that *a key with nothing behind it says so* is measured rather than
# assumed.
KEYS="ArrowUp,ArrowUp,h,f,g,ArrowDown,w"
LOCAL_AFTER=$(sed -n 's/^const LOCAL_AFTER = \([0-9]*\);.*/\1/p' src/editor_client.loft)

pass=0; fail=0
ok()  { pass=$((pass + 1)); echo "  ok   $1"; }
bad() { fail=$((fail + 1)); echo "  FAIL $1"; }

SRC=src/editor_client.loft
if [ -n "$SAB" ]; then
  SRC="$OUT/sab_client.loft"
  cp src/editor_client.loft "$SRC"
  case "$SAB" in
    # The client exactly as it was before this step: a literal, and a true one
    # only by luck. ⚠ Caught by run A as well as run B — a panel that claims a
    # connection at boot is wrong before the socket has had a chance to open.
    # ⚠ THE TARGET MOVED AT `M3` — it was `authority_line(st)` until a modal rebind
    # prompt went in front of it. A sabotage whose `sed` no longer matches edits
    # nothing and reports a clean run, which is the *NOTHING went red* sentence a
    # useless control produces; the guard below is what refuses to run one.
    literal) sed -i 's/^    ps_status: status_line(st),$/    ps_status: "moros editor — edits go to the server",/' "$SRC" ;;
    # The fact moves and nothing tells the panel. ⚠ INVISIBLE TO A AND B BOTH,
    # measured — A's server marks the panel a frame later with `N:`/`H:` for its
    # own reasons, and B has no change to miss. Run C exists because of this one.
    nodirty) sed -i '/^        st.panel_dirty = true;$/d' "$SRC" ;;
    # The authority read off HAVING SENT rather than off the send SUCCEEDING —
    # the trap the client's own comment at `ws_handler` warns about, one layer
    # in. ⚠ INVISIBLE TO RUN A: with a server there, assuming is right.
    assume)  sed -i 's/^      st.hello = web::send(h, "1:");$/      web::send(h, "1:"); st.hello = true;/' "$SRC" ;;
    # ── B1b.1b ──────────────────────────────────────────────────────────────
    # It dials for ever: the page with no server behind it stays `connecting`
    # and a key press goes nowhere, which is exactly the state this step ends.
    nolocal) sed -i '/^          st.local = true;$/d' "$SRC" ;;
    # It goes local — the sentence is printed, the keys write — and the PANEL is
    # never told. ⚠ The mirror of `nodirty` one authority over, and run B is
    # where it has to be caught, because with no server nothing else can mark
    # the panel at all.
    nolocaldirty) sed -i '/^          st.panel_dirty = true;$/d' "$SRC" ;;
    # Local mode is announced and then sends anyway, into a socket that is not
    # there. ⚠ The panel is right, the transcript is right, and not one gesture
    # happens — which is what a status line alone would call a pass.
    sendlocal) sed -i '/^  if st.local { local_act(sess, st, a, verb); return; }$/d' "$SRC" ;;
    # The gestures all happen, at an author one world-unit away. ⚠ EVERY COUNT
    # IS UNCHANGED — a ring of the same radius writes 42 edges wherever it is
    # laid — so only the world comparison can see this, which is the whole
    # reason the runner is beside it.
    elsewhere) sed -i 's/^  author = hex_editor::author_on(st.cache, 0.0, 0.0, 0.0);$/  author = hex_editor::author_on(st.cache, 1.0, 0.0, 0.0);/' "$SRC" ;;
    # One unanswered dial and it gives up. ⚠ Runs A and C are where this is
    # visible: a page that goes local while a server is coming up has taken an
    # author's edits somewhere nobody else will ever see them.
    eager) sed -i 's/^const LOCAL_AFTER = [0-9]*;$/const LOCAL_AFTER = 1;/' "$SRC" ;;
    # The gesture is handed a session that is thrown away the moment it returns.
    # ⚠ THE WORLD IS BYTE-IDENTICAL — a ring's edges go to the store either way —
    # so B10 stays green and only the session half can see it. It is the pair
    # `V1` measured, one driver out.
    scratchsession) sed -i 's/^  ack = hex_editor::press_verb(sess, st.cache, a, verb);$/  ack = hex_editor::press_verb(hex_editor::EditSession {}, st.cache, a, verb);/' "$SRC" ;;
    # ── B1b.2 ───────────────────────────────────────────────────────────────
    # No camera: `draw_world` returns on its first line and the world half is the
    # clear colour. ⚠ This is the page as `B1b.1b` shipped it — every number right
    # and nothing on screen.
    nocam) sed -i '/^          local_camera(st, author);$/d' "$SRC" ;;
    # A camera and no ground at boot: the same blank half, reached the other way,
    # which is why D1 asks for a HORIZON rather than for a camera.
    # ⛔ ITS FIRST FORM WAS A NO-OP AND THE RUN CAME BACK GREEN: it appended
    # `return;` after the LAST statement of `local_camera`, which changes the file
    # and nothing else — and the `cmp` guard below proves a change was made, never
    # that the change matters. A sabotage that is red nowhere is either a blind
    # instrument or a no-op, and only reading tells you which.
    # ── D4's two failure modes, 2026-08-19 ──────────────────────────────────
    # A camera re-solved on every tick that moved, not only on a TURN: the picture
    # then changes for TWO reasons
    # and D3 alone cannot say which. ⚠ This is the drift D4 was written for, and the
    # old pixel form could not tell it from the gesture — which is how it came to
    # report *the camera moved* on a run where the camera cannot move.
    camdrift) sed -i 's/^    if turned.au_yaw != a.au_yaw {$/    if true {/' "$SRC" ;;
    # …and the instrument going silent. ⚠ Without D4's `-eq 1` this one is INVISIBLE:
    # *the camera was not re-solved* is trivially true of a page that never says so.
    camquiet) sed -i '/^  println("client: local cam/,+1d' "$SRC" ;;
    nomesh) sed -i 's/^          lg_boot = local_surfaces(st, sess, author);$/          lg_boot = 0;/' "$SRC" ;;
    # It writes and does not redraw — the picture is a photograph of the world
    # before the gesture, with every count and both digests correct.
    stale) sed -i 's/^  redrawn = local_surfaces(st, sess, a);$/  redrawn = 0;/' "$SRC" ;;
    # ── B1b.2c.4c ───────────────────────────────────────────────────────────
    # The page as it was one commit ago: it meshes the GROUND and files nothing
    # else, so a fence is written, keyed, byte-identical to the runner's — and
    # invisible. ⚠ EVERY CHECK ABOVE STAYS GREEN, which is why the `E` block
    # exists: B8 counts the sentences, B10 keys the world, B11 diffs the session
    # and D3 sees a raise move the ground, and not one of them is about whether a
    # WALL reached the picture.
    groundonly) sed -i 's/^      for lg_si in 1..SURFACES {$/      for lg_si in 1..1 {/' "$SRC" ;;
    *) echo "auth: unknown AUTH_SABOTAGE '$SAB'"; exit 2 ;;
  esac
  if cmp -s "$SRC" src/editor_client.loft; then
    echo "auth FAIL — sabotage '$SAB' changed NOTHING; its pattern has drifted"
    exit 1
  fi
  echo "   sabotage: $SAB"
fi

echo "── B1b  build the page ONCE; all three runs load these bytes ───────"
$LOFT --html --lib lib/ "$SRC" > "$OUT/build.log" 2>&1 \
  || { echo "auth FAIL — the client did not build:"; tail -20 "$OUT/build.log"; exit 1; }
built=$(sed -n 's/^wrote \(.*\.html\) .*/\1/p' "$OUT/build.log" | tail -1)
[ -n "$built" ] || { echo "auth FAIL — the build named no page"; tail -5 "$OUT/build.log"; exit 1; }
case "$built" in
  */src/.loft/editor_client.html) ;;
  *) cp "$built" "$PAGE"; echo "   copied $(basename "$built") into $PAGE" ;;
esac
echo "   page: $PAGE ($(( $(wc -c < "$PAGE") / 1024 )) KB)"
echo "   the page gives up dialling after $LOCAL_AFTER unanswered dials"

# ── the oracle ──────────────────────────────────────────────────────────
# ⚠ THE RUNNER IS RUN FIRST AND ON THE UNSABOTAGED TREE — it is `editor_run`, and
# every sabotage above is in the client. If a sabotage could move this number the
# comparison would be between two broken things agreeing.
echo
echo "── B1b.1b  what the RUNNER builds from the same six verbs ──────────"
SCRIPT=probe/b1b/scripts/local.keys WORLD=b1blocal GROUND=0 \
  $LOFT --lib lib/ src/editor_run.loft > "$OUT/run.log" 2>/dev/null || true
want=$(sed -n 's/^editor_run: world //p' "$OUT/run.log" | tail -1)
if [ -n "$want" ]; then
  echo "   editor_run at GROUND=0: world $want"
  sed -n 's/^  /     /p' "$OUT/run.log" | head -8
else
  echo "auth FAIL — the runner printed no world key; there is nothing to compare against"
  tail -5 "$OUT/run.log"
  exit 1
fi

# Every `client: status ←` line, in order, with the prefix stripped.
statuses() { grep '^client: status ← ' "$1" | sed 's/^client: status ← //'; }

# ── run A ───────────────────────────────────────────────────────────
echo
echo "── B1b.1a  run A — the real server, and the panel must MOVE ────────"
make -s port-free > /dev/null 2>&1 || true
: > "$OUT/server.log"
nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/server.log" 2>&1 &
srv=$!
# 240 s: these servers are interpreted from source, so the first after a library
# edit recompiles — `V3` measured a 120 s window giving up mid-compile.
for _ in $(seq 1 240); do
  grep -q 'listening on port' "$OUT/server.log" && break
  kill -0 "$srv" 2>/dev/null || break
  sleep 1
done
if ! grep -q 'listening on port' "$OUT/server.log"; then
  if kill -0 "$srv" 2>/dev/null; then
    echo "auth FAIL — the server is STILL BUILDING after 240 s"; kill "$srv" 2>/dev/null
  else
    echo "auth FAIL — the server DIED before it listened:"; tail -20 "$OUT/server.log"
  fi
  exit 1
fi
node tools/page_console.mjs "http://127.0.0.1:$PORT/client" \
  --wait-ms 25000 --tail 100000 > "$OUT/a.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/a.raw" > "$OUT/a.log" || true
make -s stop-editor > /dev/null 2>&1 || true
wait "$srv" 2>/dev/null || true

echo "   what the panel said:"
statuses "$OUT/a.log" | sort | uniq -c | sed 's/^/     /'
echo "   $(grep '^client: connected' "$OUT/a.log" | head -1)"

if grep -q '^moros editor client' "$OUT/a.log"; then
  ok "A0 the page booted, so what follows is about a running client"
else
  bad "A0 the page never booted — every check below is vacuous"
fi
a_first=$(statuses "$OUT/a.log" | head -1)
if [ "$a_first" = "$CONNECTING" ]; then
  ok "A1 the FIRST thing the panel said is '$CONNECTING'"
else
  bad "A1 the panel's first word was '$a_first' — it claimed something before the socket"
fi
# ⚠ AFTER the client's own connect line, not merely present. A panel that showed
# `server` before the send succeeded would satisfy a presence test.
# ⚠ THE SENTENCE GREW A CANDIDATE — plan 22 `B2b`, and this is one of the two
# places that read it as a literal. It was `connected — asked for the world`; the
# client dials a LIST now, so it names which one landed. Both sites moved together
# and both are STRICTER than before, because a line naming no candidate no longer
# matches at all. ⚠ This is what went red when `B2b` landed, and it is the whole
# argument for a probe reading a sentence: the sentence changed, and something said
# so on the same afternoon.
if [ -n "$(sed -n "/^client: connected to '.*' — asked for the world/,\$p" "$OUT/a.log" \
           | grep -F "client: status ← $SERVER")" ]; then
  ok "A2 and after the send landed it says '$SERVER'"
else
  bad "A2 the socket opened and the panel never said so — nothing rebuilt it"
fi
if [ "$(statuses "$OUT/a.log" | tail -1)" = "$SERVER" ]; then
  ok "A3 and it stayed there — the authority does not flicker"
else
  bad "A3 the panel ended on '$(statuses "$OUT/a.log" | tail -1)'"
fi
# ⚠ B1b.1b's claim about run A, and it is the one that costs an author their work
# if it is false: a server that IS there must never be given up on.
if grep -q '^client: no server answered' "$OUT/a.log"; then
  bad "A4 the page gave up on a server that was answering: $(grep '^client: no server answered' "$OUT/a.log" | head -1)"
else
  ok "A4 and it never gave up dialling — a live server is never mistaken for none"
fi

# One page, one static server, one transcript. `$1` is the tag, `$2` the extra
# flag to the static server, `$3` the keys to press (empty for none).
static_run() {
  sr_tag=$1; sr_flag=$2; sr_keys=$3
  : > "$OUT/$sr_tag.static"
  node probe/b1b/static.mjs src/.loft "$SPORT" $sr_flag > "$OUT/$sr_tag.static" 2>&1 &
  sr_pid=$!
  for _ in $(seq 1 40); do
    grep -q '^static: /' "$OUT/$sr_tag.static" && break
    sleep 0.25
  done
  if ! grep -q '^static: /' "$OUT/$sr_tag.static"; then
    echo "auth FAIL — the static server never listened on $SPORT:"
    cat "$OUT/$sr_tag.static"
    kill "$sr_pid" 2>/dev/null || true
    exit 1
  fi
  if [ -n "$sr_keys" ]; then
    # ⚠ IT WAITS FOR THE CLIENT'S OWN SENTENCE BEFORE PRESSING. The decision is
    # `LOCAL_AFTER` frames after boot, and a key pressed before it lands in the
    # other authority — which produces a transcript with no local lines in it,
    # exactly what a broken local mode produces.
    node probe/b1b/press.mjs "http://127.0.0.1:$SPORT/editor_client.html" \
      "$sr_keys" --await 'no server answered' --wait-ms 45000 \
      > "$OUT/$sr_tag.raw" 2>&1 || true
  else
    node tools/page_console.mjs "http://127.0.0.1:$SPORT/editor_client.html" \
      --wait-ms 25000 --tail 100000 > "$OUT/$sr_tag.raw" 2>&1 || true
  fi
  grep -E '^(client|moros editor client)' "$OUT/$sr_tag.raw" > "$OUT/$sr_tag.log" || true
  grep -E '^SHOT ' "$OUT/$sr_tag.raw" > "$OUT/$sr_tag.shots" || true
  kill "$sr_pid" 2>/dev/null || true
  wait "$sr_pid" 2>/dev/null || true
  echo "   what the panel said:"
  statuses "$OUT/$sr_tag.log" | sort | uniq -c | sed 's/^/     /'
  echo "   what the wire did:  $(grep -c 'UPGRADE REFUSED' "$OUT/$sr_tag.static" || true) refused, $(grep -c 'UPGRADE COMPLETED' "$OUT/$sr_tag.static" || true) completed"
}

# ── run B ───────────────────────────────────────────────────────────
echo
echo "── B1b  run B — the SAME page, nothing behind the wire ─────────────"
static_run b "" "$KEYS"
echo "   what local mode did:"
grep '^client: local' "$OUT/b.log" | sed 's/^/     /' || true

if grep -q '^moros editor client' "$OUT/b.log"; then
  ok "B0 the page booted with no server — the run has a subject"
else
  bad "B0 the page never booted; 'it never claimed a server' would be vacuous"
fi
# ⚠ THE FRAME COUNTER, because an absence measured over a page that froze is not
# an absence. The client prints one every 300 frames.
if grep -q '^client: 600 frames' "$OUT/b.log"; then
  ok "B1 and it ran — past 600 frames"
else
  bad "B1 the client never reached 600 frames; it did not run long enough to decide anything"
fi
# ⚠ THE CONTROL IS THE SERVER'S LOG, NOT THE CLIENT'S. The first version of this
# read the client's own `connected` line as proof that no socket had opened — the
# very claim under test, so the `assume` sabotage made the control agree with the
# lie it was there to catch. What happened on the wire is the other side's fact.
if [ "$(grep -c 'UPGRADE REFUSED' "$OUT/b.static" || true)" -ge 1 ] \
   && [ "$(grep -c 'UPGRADE COMPLETED' "$OUT/b.static" || true)" -eq 0 ]; then
  ok "B2 the wire says the client dialled and was refused — no socket ever opened"
else
  bad "B2 the wire does not show a refused dial; this run is not the no-server case"
fi
if grep -q '^client: connected — asked for the world' "$OUT/b.log"; then
  bad "B3 the client says it CONNECTED, and the wire above says nothing opened"
else
  ok "B3 and the client agrees with the wire — it never claimed a send had landed"
fi
# ── B1b.1a's claim, now in its final shape: the panel must say `connecting`
#    while it is dialling and never `server`.
if [ "$(statuses "$OUT/b.log" | head -1)" = "$CONNECTING" ] \
   && [ -z "$(statuses "$OUT/b.log" | grep -xF "$SERVER" || true)" ]; then
  ok "B4 the panel said '$CONNECTING' first and never once claimed the server"
else
  bad "B4 the panel said: $(statuses "$OUT/b.log" | sort -u | tr '\n' '|') — with no server behind it"
fi

# ── B1b.1b — the second authority ───────────────────────────────────
gave=$(sed -n 's/^client: no server answered in \([0-9]*\) dials.*/\1/p' "$OUT/b.log" | head -1)
if [ -n "$gave" ]; then
  ok "B5 it stopped dialling and said so, after $gave unanswered dials"
else
  bad "B5 the page never gave up — with nothing behind the wire it dialled for ever"
fi
# ⚠ NOT MERELY *IT WENT LOCAL* BUT *IT WAITED FIRST*. A page that gives up on the
# first unanswered dial reaches this line too, and it is the one that would take a
# slow server's author into a different authority — `AUTH_SABOTAGE=eager`.
if [ "$gave" = "$LOCAL_AFTER" ]; then
  ok "B6 and it waited the whole bound — $LOCAL_AFTER dials, not one"
else
  bad "B6 it gave up after '$gave' dials where the source says $LOCAL_AFTER"
fi
if [ "$(statuses "$OUT/b.log" | tail -1)" = "$LOCAL" ]; then
  ok "B7 and the panel says '$LOCAL' — the swap is not silent"
else
  bad "B7 the panel ended on '$(statuses "$OUT/b.log" | tail -1)' after going local"
fi

# ⚠ NAMED ONE AT A TIME, NEVER COUNTED — `B1a`'s finding. A count of six cannot
# say WHICH gesture lost its trace, and the first version of that probe read
# `3 sentences` for a run where both arrows had been pressed.
saw() {
  if [ "$(grep -c "^client: local $1" "$OUT/b.log" || true)" -ge "$2" ]; then
    ok "B8 $3"
  else
    bad "B8 $3 — the transcript has $(grep -c "^client: local $1" "$OUT/b.log" || true)"
  fi
}
saw "raise — "  2 "the two raises wrote, in the page's own world"
saw "fence — "  1 "the fence ring wrote"
saw "wall — "   1 "the wall ring wrote"
saw "lower — "  1 "the lower wrote"
saw "place refused" 1 "and the house was REFUSED, in the same words the runner uses"
# ⛔ **B9 IS INVERTED, AND IT HAD BEEN RED SINCE `B1c.1` — found while `M3` was
# touching the line it guards, and measured on the PRE-`M3` commit before it was
# blamed on anything.** It asserted the walk key says *"'4:' is a server message and
# this page has no gesture for it yet"* exactly once. `B1c.1` gave local mode a walk —
# `local_tick` integrates `st.held` — and guarded the send with `if !st.local`, so the
# apology became unreachable **and untrue in the same commit**. The client's own
# comment beside that line says so: *"a page that went on apologising for a key that
# now works is the `ps_status` literal a third time"*. The code was corrected and the
# gate asserting the old sentence was not, so `make probe-auth` has read `1 of 36`
# ever since.
#
# ⚠ **THE CLAIM IS KEPT, INVERTED, RATHER THAN DELETED** — *move before you remove*.
# What it says now is the thing `B1c.2c` actually earned: **local mode has a gesture
# for the walk and does not apologise for it.** ⚠ And the ORIGINAL claim — *once, not
# per frame* — is not lost: `wire`'s dedupe is what implements it, and it is still
# asserted, on a message that really has no local gesture.
if [ "$(grep -c "^client: local — '4:'" "$OUT/b.log" || true)" -eq 0 ]; then
  ok "B9 local mode never apologised for the walk key — it has a gesture for it"
else
  bad "B9 the walk key still says it has no local gesture $(grep -c "^client: local — '4:'" "$OUT/b.log" || true) time(s) — a stale apology for a key that works"
fi
# …and the dedupe itself, on a message that genuinely has no local gesture. ⚠ THREE
# OUTCOMES: absent says nothing (nothing pressed it), once is the claim, more than once
# is the per-frame flood `wire`'s `said_local` list exists to stop.
b9b=$(grep -c "^client: local — '" "$OUT/b.log" || true)
b9u=$(grep "^client: local — '" "$OUT/b.log" | sort -u | wc -l)
if [ "$b9b" -eq 0 ]; then
  ok "B9b (no server-only message was reached in this run — nothing to dedupe)"
elif [ "$b9b" -eq "$b9u" ]; then
  ok "B9b and each server-only message apologised ONCE, not per frame — $b9b of them"
else
  bad "B9b $b9b apologies for $b9u distinct messages — the per-frame flood is back"
fi

# ⚠ THE CLAIM, AND IT IS IN TWO HALVES BECAUSE ONE INSTRUMENT CANNOT ANSWER. The
# last world the page keyed against the world `editor_run` built from the same six
# verbs at the same author — one `hex_voxel::world_key` called by both, so a
# difference is a difference in what they BUILT.
# ⚠ THE FIELD, NOT THE TAIL OF THE LINE. `B1b.2` added ` · N floats redrawn` after
# the key and this took the whole remainder, so a correct page reported
# `32952:1545220309 · 338688 floats redrawn` against the runner's bare key. A
# greedy extractor is a comparison that breaks whenever its subject grows a word.
got=$(grep '^client: local ' "$OUT/b.log" | sed -n 's/.*· world \([^ ]*\).*/\1/p' | tail -1)
echo "   the page: world ${got:-<none>}"
echo "   the runner: world $want"
if [ -n "$got" ] && [ "$got" = "$want" ]; then
  ok "B10 the page and the runner built the SAME world — $got"
else
  bad "B10 the page built '${got:-nothing}' where the runner built '$want'"
fi

# ⚠ AND THE SESSION, WHICH THE WORLD CANNOT SEE. A ring writes its edges into the
# store and its TRUNK into the session, so a page that pressed with a scratch
# session builds a byte-identical world and holds a different scene — `V1`'s
# finding, and `AUTH_SABOTAGE=scratchsession` is it, red HERE and green on B10.
sed -n '/^session: /,$p' "$OUT/run.log" | grep -v '^editor_run:' | sed 's/^ *//' \
  > "$OUT/want.sess"
tac "$OUT/b.log" | sed -n '1,/^client: local session: /p' | tac \
  | sed -n 's/^client: local //p' | grep -E '^(session:|opening |chosen:)' \
  | sed 's/^ *//' > "$OUT/got.sess"
echo "   the page's session:   $(head -1 "$OUT/got.sess" || true)"
echo "   the runner's session: $(head -1 "$OUT/want.sess" || true)"
if [ -s "$OUT/got.sess" ] && diff -q "$OUT/want.sess" "$OUT/got.sess" > /dev/null; then
  ok "B11 and the same SESSION — every registry, the trunk and the standing choice"
else
  bad "B11 the sessions differ:"
  diff "$OUT/want.sess" "$OUT/got.sess" 2>&1 | sed 's/^/       /' || true
fi

# ── B1b.2 — and can any of it be SEEN ───────────────────────────────
# ⚠ THE WORLD REGION, NOT THE CANVAS. The panel is drawn into the same canvas, so
# a whole-canvas colour count reads hundreds of colours over a blank world — which
# is exactly the page `B1b.1b` shipped. `press.mjs` reads three rectangles.
#
# ⚠ AND A FLAT GROUND IS ONE COLOUR. The first version of this read one rectangle
# in the middle of the world half, counted **1**, and reported that the page saw
# nothing — while the full-frame capture showed green ground under a blue sky. An
# unwritten world is a flat plane at one height under a constant ambient, so it is
# genuinely one colour; the horizon is the only thing in that half of the picture
# that is not. So the region that answers *is anything drawn* SPANS the horizon.
echo
echo "── B1b.2  what the page could actually SEE ─────────────────────────"
sed 's/^/     /' "$OUT/b.shots" 2>/dev/null || true
field() { sed -n "s/^SHOT $1 .*$2 \([0-9]*\):\([0-9]*\).*/\\$3/p" "$OUT/b.shots" | head -1; }
w_before=$(field before world 1);       w_sum_before=$(field before world 2)
w_sum_steady=$(field steady world 2)
w_sum_first=$(field after-first world 2)
# ⚠ **THE `ground` RECT IS PRINTED AND NO LONGER JUDGED — see D4.** `press.mjs`'s own
# comment calls it *"what a gesture has to move"* while D4 used to require that it did
# NOT move: two comments in one probe asserting opposite things about one rectangle,
# which is how the stale one survived. It stays in the transcript because a reader
# chasing a framing change wants it; nothing asserts on it.
p_before=$(field before panel 1)

# ⚠ THE POSITIVE CONTROL FIRST. A capture that failed, or a decoder that answered
# 1 for everything, would make every claim below "true" by breaking — and the panel
# is drawn by a path this step does not touch at all. ⚠ It was worth having: with
# `--use-gl=swiftshader` (this driver's inherited flag) the whole canvas
# photographed WHITE while the client ran 300 frames without an exception.
if [ -n "$p_before" ] && [ "$p_before" -gt 4 ]; then
  ok "D0 the capture works — the panel region has $p_before colours"
else
  bad "D0 the panel region reads '$p_before' colours; the instrument is blind, not the world"
fi
if [ -n "$w_before" ] && [ "$w_before" -ge 2 ]; then
  ok "D1 and the world half has a HORIZON in it — $w_before colours, ground under sky"
else
  bad "D1 the world half reads '$w_before' colour(s): sky alone, so the page drew no ground"
fi
# ⚠ *IT CHANGED* MEANS NOTHING UNTIL *IT HOLDS STILL* IS MEASURED. Same page, same
# capture path, 1.2 s apart, nothing pressed.
if [ -n "$w_sum_steady" ] && [ "$w_sum_steady" = "$w_sum_before" ]; then
  ok "D2 and it holds still when nothing is pressed — $w_sum_steady twice"
else
  bad "D2 the picture moved with no key pressed ($w_sum_before then $w_sum_steady); 'it changed' cannot be read"
fi
if [ -n "$w_sum_first" ] && [ "$w_sum_first" != "$w_sum_before" ]; then
  ok "D3 and the first raise REDREW it — $w_sum_before → $w_sum_first"
else
  bad "D3 the raise left the picture at $w_sum_before — the page wrote a world it does not draw"
fi
# ⚠ AND NOT BECAUSE THE CAMERA MOVED, WHICH IS WHAT SEPARATES A GESTURE FROM A DRIFT.
# D3 says the picture changed; a stray drag from the focus click would change it too,
# and D3 alone would call that a pass.
#
# ⛔ **THIS USED TO ASK A SECOND RECTANGLE TO HOLD STILL, AND THAT WAS A PIXEL
# ANSWERING A QUESTION ABOUT A CAMERA — 2026-08-19.** *The world changed here* and *the
# view moved* arrive as one number in a screen rect, so the check could only ever infer.
# It inferred correctly until `C3` re-seated the camera (`cam_boom`, a leading pivot, a
# clearance lift), after which the rect framed terrain the raise reaches and the check
# went red saying **"the camera moved, not the world"** — which was FALSE: `local_camera`
# is called at boot and on a YAW change only, and the sequence presses no turn before
# this shot, so the camera provably could not have moved. A check that names the wrong
# cause is worse than one that fails, because the next reader believes it.
#
# ⚠ **SO THE CAMERA IS ASKED DIRECTLY.** `client: local cam — eye … aim …` is printed
# where the matrix is solved, and the claim is a COUNT: solved once, at boot, and not
# again across the raise. ⚠ **`-eq 1`, NOT `-le 1`** — a lost report would make *it did
# not move again* true by absence, which is the vacuity this whole file is built to
# refuse. One line means the instrument spoke AND the camera stayed put.
cam_n=$(grep -c '^client: local cam — ' "$OUT/b.log" || true)
cam_at=$(grep -m1 '^client: local cam — ' "$OUT/b.log" | sed 's/^client: local cam — //')
if [ "$cam_n" -eq 1 ]; then
  ok "D4 …and the camera never moved to do it — solved once, at $cam_at"
elif [ "$cam_n" -eq 0 ]; then
  bad "D4 the page never said where its camera is — the instrument is absent, so D3's change is unattributed"
else
  bad "D4 the camera was re-solved $cam_n times during the run, so D3's change is not the world's alone"
fi

# ── B1b.2c.4c — and is it the WHOLE picture, or the ground alone ─────
#
# ⚠ WHICH SURFACES, NOT HOW MANY FLOATS, AND THAT IS THE WHOLE OF THIS PHASE. Until
# `c.4c` the page meshed the GROUND alone: a fence rung in local mode was written,
# keyed, byte-identical to the runner's — and INVISIBLE, because the recipe that
# composes walls, roofs and the rest was a program-local function in
# `editor_server.loft`. Every check above stayed green through all of that, which is
# what makes them the wrong instrument for it: a raise moves the ground, so a total
# and a checksum both rise on a page that draws nothing else.
#
# ⚠ SO THE CLIENT NAMES THEM. `client: local drew <names>` is read off what was
# UPLOADED — the same `>= 6` floats that decide whether a buffer is installed —
# rather than off what was asked for, so a surface that meshed to nothing cannot
# appear. `probe-mesher` learnt this one step back, where *"63 of them had geometry"*
# could not say which and its first run passed over five surfaces of eleven.
echo
echo "── B1b.2c.4c  did the page draw more than the GROUND ───────────────"
drew_first=$(grep -m1 '^client: local drew ' "$OUT/b.log" | sed 's/^client: local drew //')
drew_last=$(grep '^client: local drew ' "$OUT/b.log" | tail -1 | sed 's/^client: local drew //')
echo "   at boot:      ${drew_first:-<nothing>}"
echo "   at the end:   ${drew_last:-<nothing>}"
# ⚠ THE BOOT LINE IS THE NEGATIVE CONTROL AND IT IS NOT DECORATION. An unwritten
# world really is grass and nothing else, so *the page draws walls* means nothing
# until *it did not draw walls before anything was pressed* is on the same run: a
# page that filed a wall mesh for every tile unconditionally would satisfy the check
# below and be drawing furniture nobody put there.
if [ "$drew_first" = "grass" ]; then
  ok "E1 an unwritten world is grass and nothing else — '$drew_first'"
else
  bad "E1 the page drew '${drew_first:-nothing}' before a key was pressed, not 'grass' alone"
fi
# The fence and the wall are both drawn in the `wall` surface — `hex_mesh::wall_up`
# gives a fence 4 and a wall 12, one surface, two heights.
case "$drew_last" in
  *wall*) ok "E2 …and after the fence and the wall it draws MASONRY too — '$drew_last'" ;;
  *)      bad "E2 the page ends drawing '${drew_last:-nothing}': the rings wrote and nothing shows them" ;;
esac
# ⚠ AND THE PICTURE, BECAUSE A COUNTER IN THE PRODUCER IS NOT A PICTURE. The page
# says it uploaded a wall mesh; the world region has to have CHANGED between the
# first raise and the end, and the two rings are the only gestures between them.
if [ -n "$w_sum_first" ] && [ -n "$(field after-all world 2)" ] \
   && [ "$(field after-all world 2)" != "$w_sum_first" ]; then
  ok "E3 and the world half changed again over the two rings — $w_sum_first → $(field after-all world 2)"
else
  bad "E3 the world half is unchanged since the raise ($w_sum_first): the rings reached no picture"
fi

# ── run C ───────────────────────────────────────────────────────────
echo
echo "── B1b  run C — the socket OPENS and says nothing ──────────────────"
# ⚠ THIS RUN EXISTS BECAUSE RUN A COULD NOT SEE HALF THE STEP, MEASURED. Deleting
# the `panel_dirty` write at the connect site leaves run A entirely green: the real
# server answers `1:` with `N:` and `H:` within a frame or two, each of which marks
# the panel anyway, so the status reached the screen for a reason that had nothing
# to do with the authority changing. **A rebuild that happens for another reason
# reads exactly like a rebuild that was asked for.**
#
# Here the socket opens and not one byte comes back, so `panel_dirty` has exactly
# one possible writer. It is also a real situation rather than a contrived one — a
# server that accepts while its world is still loading is this, for as long as that
# takes — which is what makes it `B1b.1b`'s bound control too: a page that decided
# on SILENCE rather than on a refused dial would go local right here, with a server
# on the other end of an open socket.
static_run c "--ws-silent" ""

if grep -q '^moros editor client' "$OUT/c.log"; then
  ok "C0 the page booted"
else
  bad "C0 the page never booted"
fi
if [ "$(grep -c 'UPGRADE COMPLETED' "$OUT/c.static" || true)" -ge 1 ]; then
  ok "C1 the wire says the socket OPENED — the other side's fact, not the client's"
else
  bad "C1 the socket never opened, so there is no authority change to observe"
fi
# ⚠ THE SECOND READER OF THAT SENTENCE — see A2 above for why it names a candidate.
if grep -qE "^client: connected to '.*' — asked for the world" "$OUT/c.log"; then
  ok "C2 and the client's send landed"
else
  bad "C2 the client never got a send away, though the wire opened"
fi
# ⚠ THE PROOF THAT NOTHING ELSE COULD HAVE DONE IT. Every counter on this line is
# a message the client received; all zero means `drain` set nothing, so the only
# hand that can have marked the panel is the one at the connect site.
c_last=$(grep '^client: [0-9]* frames' "$OUT/c.log" | tail -1)
echo "   what arrived:  ${c_last:-<the client never reported a frame count>}"
case "$c_last" in
  *"meshes 0, placements 0, drops 0, cameras 0, status 0, parts 0")
    ok "C3 and not one message arrived — nothing else can have marked the panel" ;;
  *) bad "C3 a message got through: ${c_last:-no frame line at all}" ;;
esac
if [ "$(statuses "$OUT/c.log" | tail -1)" = "$SERVER" ]; then
  ok "C4 the panel says '$SERVER' — told by the socket, by elimination"
else
  bad "C4 the panel ended on '$(statuses "$OUT/c.log" | tail -1)' with the socket open"
fi
if grep -q '^client: no server answered' "$OUT/c.log"; then
  bad "C5 a silent server was mistaken for none: $(grep '^client: no server answered' "$OUT/c.log" | head -1)"
else
  ok "C5 and silence is not absence — an open socket keeps the server's authority"
fi

# ── the strings themselves ──────────────────────────────────────────
# ⚠ EXACT EQUALITY, WHICH IS ALSO THE TRUNCATION CHECK. `ss_text` is what
# `fit_text` returned, so a status too long for its strip comes back cut and
# marked `..` — and a substring test would call that a pass.
echo
bad_str=$(cat "$OUT/a.log" "$OUT/b.log" "$OUT/c.log" 2>/dev/null \
          | grep '^client: status ← ' | sed 's/^client: status ← //' \
          | sort -u | grep -vxF "$CONNECTING" | grep -vxF "$SERVER" \
          | grep -vxF "$LOCAL" || true)
if [ -z "$bad_str" ]; then
  ok "the panel only ever showed the three whole strings, none of them fitted down"
else
  bad "the panel showed something else: $(echo "$bad_str" | tr '\n' '|')"
fi

echo
if [ "$fail" -eq 0 ]; then echo "auth PASS — $pass checks"; else echo "auth FAIL — $fail of $((pass + fail))"; fi
[ "$fail" -eq 0 ]
