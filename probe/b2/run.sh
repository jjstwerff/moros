#!/bin/sh
# B2/B3 (plan 22) — THE QUICK-START DEMO: `_site/index.html` FROM `file://`,
# WITH NO SERVER ANYWHERE.
#
#   probe/b2/run.sh          (or `make probe-demo`)
#
# ⚠ THIS IS THE FIRST CHECK IN THIS TREE THAT NEEDS NO PORT. Every one of the 48
# gates dials `EDITOR_PORT`; `make probe-auth`'s three runs each start a server of
# some kind, even the ones whose subject is a server that does not answer. Here
# there is no listener at either end of the wire — the page is opened off a disk,
# exactly as a person double-clicking it would.
#
# [PAGES_EDITOR § And local mode is PERMANENT](../../doc/claude/PAGES_EDITOR.md)
# is why it exists at all: *"it is a supported configuration, so it gets a gate …
# if that gate does not exist, the demo is broken the first week nobody opens
# it."*
#
# ⚠ AND THE DEMO IS THE CLIENT ENGINE BUILD, so this checks that too — every byte
# the server serves at `/` must be present in `_site/index.html`, in order, with
# only the base-tree prelude in front of it. The moment the ENGINE halves differ
# there are two pages to keep in step, which is the one thing the design refuses.
#
# ── ⚠ WHAT THE VERDICT READS, so nobody thins it by symmetry ────────────────
#
# A PICTURE gate, plus two sentences. `D3`–`D5` are read off screenshot regions
# (the drawn result belongs to a gate, per CLAUDE.md); `D6`/`D7` read the client's
# own console, because a colour cannot see WHICH surface was drawn — that is
# `B1b.2c.4c`'s finding, and this is its consumer.
#
# ⚠ THE PANEL REGION IS THE POSITIVE CONTROL IN EVERY SHOT. A capture that came
# back black would "prove" a blank world; `[].every(...)` is `true` and this tree
# has shipped a row that reported `ok` on a picture with no panel at all. If the
# panel is not busy, the shot says nothing about the world and the run fails.
set -e
cd "$(dirname "$0")/../.."
OUT="probe/b2/.out"
mkdir -p "$OUT"
SITE="$PWD/_site/index.html"
ENGINE="$PWD/src/.loft/editor_client.html"
fail() { echo "demo FAIL — $1"; exit 1; }

# ── The sabotages ───────────────────────────────────────────────────────────
#
#   DEMO_SABOTAGE=emptypage  `_site/index.html` is replaced by a page with the
#                            right ELEMENTS and no editor in it. This is `B3`'s
#                            own warning made runnable: a gate that reports `ok`
#                            on an empty page is not a gate.
#   DEMO_SABOTAGE=deadkey    press `z` — one of the twelve keys with no verb —
#                            instead of a raise. The page runs, draws and writes
#                            nothing, so a check that credits the mere passage of
#                            time with a gesture stays green here.
#   DEMO_SABOTAGE=noturn     the same five `h` attempts with nothing turning
#                            between them. If `F3` were really about pressing the
#                            key often enough rather than about the TURN, this
#                            would pass. ⚠ SEEN RED on `F2b` alone while `F2a`
#                            stayed green at 213 steps — which is why `F2` is two
#                            checks and not one.
#   DEMO_SABOTAGE=nowalk     the same G run with the walk keys removed. If `G2`
#                            were really about *placing a house at all* rather than
#                            about the WALK, this would pass.
#   DEMO_SABOTAGE=noraise    the same H walk with nothing raised to fall off. If
#                            `H1`/`H2` were about walking rather than about the
#                            GROUND, this would pass.
#   DEMO_SABOTAGE=noparts    the demo built with `--no-parts`. If the catalogue's
#                            rows came from the page rather than from the baked
#                            library, this would pass.
#   DEMO_SABOTAGE=deadclock  a client built with a `ticks()` that never advances,
#                            which is what a missing time bridge looks like from
#                            inside loft. ⚠ COMPOSE IT WITH NOTHING: the guard it
#                            checks fires only when keys are HELD, so
#                            `deadclock,noturn` removes the very presses it needs
#                            and reports the guard silent. A sabotage composed with
#                            another sabotage is a third experiment.
SAB="${DEMO_SABOTAGE:-}"
KEYS="ArrowUp"
case ",$SAB," in *,deadkey,*) KEYS="z" ;; esac

echo "── D0  the demo is the client engine build ─────────────────────────"
test -f "$ENGINE" || fail "no client engine build — run \`make client\`"
# ⚠ `deadclock` BUILDS A DIFFERENT CLIENT, which is `probe/b1a`'s pattern and the
# only way to reach this one. The hazard is measured and real — the emitted page
# fills any name the host did NOT bind with a constant, and
# `loft_host_time_ticks_us`'s fallback is 0 — but it lives inside the wasm import
# table, where nothing outside the page can reach in and break it. So the SOURCE is
# sabotaged instead: a `ticks()` that never advances, exactly as a missing bridge
# would look from inside loft.
case ",$SAB," in
  *,deadclock,*)
    sed 's/^  now = ticks();/  now = 0;   \/\/ SABOTAGE deadclock/' src/editor_client.loft \
      > probe/b2/.deadclock.loft
    grep -q 'SABOTAGE deadclock' probe/b2/.deadclock.loft \
      || fail "the deadclock sabotage patched nothing: local_tick has been reshaped"
    echo "   SABOTAGE deadclock — building a client whose ticks() never advances"
    loft --html --lib lib/ probe/b2/.deadclock.loft > /dev/null 2>&1 \
      || fail "the sabotaged client did not build"
    mkdir -p _site && cp probe/b2/.loft/.deadclock.html "$SITE" \
      || fail "the sabotaged page was not emitted where expected"
    ;;
  *,noparts,*)
    node tools/build-pages.mjs --no-parts || fail "build-pages refused"
    echo "   SABOTAGE noparts — the demo is built without its part library"
    ;;
  *) node tools/build-pages.mjs || fail "build-pages refused" ;;
esac
case ",$SAB," in
  *,emptypage,*)
    # ⚠ THE RIGHT ELEMENTS AND NO EDITOR. A blank file would be caught by anything;
    # the trap being guarded against is a page that LOOKS like the real one to
    # every selector the driver uses.
    printf '%s' '<!doctype html><meta charset=utf8><canvas id=c width=1200 height=660></canvas><pre id=out></pre>' > "$SITE"
    echo "   SABOTAGE emptypage — _site/index.html has the elements and no editor"
    ;;
  *,deadclock,*)
    echo "   (the engine-identity check is skipped: this page is deliberately not it)"
    ;;
  *)
    # ⚠ THE CLAIM IS "THE ENGINE BUILD PLUS A PRELUDE", NOT "BYTE-IDENTICAL" — plan
    # 22 `B2c`, and the difference is exact rather than a loosening. The demo now
    # carries its part library as a `globalThis.loftBaseFS` prelude, so it cannot be
    # `cmp`-equal to the page the server serves; what must still hold is that **every
    # engine byte is present, in order, untouched**, with one contiguous run inserted
    # in front of them. A page that had been recompiled, patched or truncated fails
    # this exactly as it failed the old one — what it no longer does is fail merely
    # for carrying a base tree.
    node -e '
      const fs = require("fs");
      const site = fs.readFileSync(process.argv[1]), eng = fs.readFileSync(process.argv[2]);
      const plen = site.length - eng.length;
      if (plen < 0) { console.log("SHORTER than the engine build"); process.exit(1); }
      const at = eng.indexOf(Buffer.from("<script>"));
      if (at < 0) { console.log("no <script> in the engine build"); process.exit(1); }
      const head = site.subarray(0, at).equals(eng.subarray(0, at));
      const tail = site.subarray(at + plen).equals(eng.subarray(at));
      if (!head || !tail) { console.log("the engine bytes are NOT intact (head " + head + ", tail " + tail + ")"); process.exit(1); }
      console.log("   the engine build is present verbatim, plus " + plen + " bytes of prelude");
    ' "$SITE" "$ENGINE" || fail "_site/index.html is not the engine build plus a prelude — there are two pages to keep in step"
    ;;
esac
echo "   $(wc -c < "$SITE") bytes"

echo
echo "── D1  open it from file://, no server at either end ───────────────"
# ⚠ IT WAITS FOR THE PAGE'S OWN SENTENCE, NEVER FOR A CLOCK. The authority is
# decided `LOCAL_AFTER` frames after boot; a key pressed before then lands in the
# wrong authority and produces a transcript that reads exactly like a demo that
# does not work.
timeout 300 node probe/b1b/press.mjs "file://$SITE" "$KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/demo.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/demo.raw" > "$OUT/demo.log" || true
grep -E '^SHOT ' "$OUT/demo.raw" > "$OUT/demo.shots" || true
sed -n '1,40p' "$OUT/demo.log" | sed 's/^/   /'
cat "$OUT/demo.shots" | sed 's/^/   /'

# One field out of a `SHOT <tag> ... <region> <colours>:<crc>` line.
field() { awk -v t="$1" -v r="$2" -v f="$3" \
  '$2==t { for (i=3;i<NF;i++) if ($i==r) { split($(i+1),p,":"); print p[f]; } }' "$OUT/demo.shots"; }

boot=$(grep -c '^moros editor client' "$OUT/demo.log" || true)
local_line=$(grep -m1 'no server answered' "$OUT/demo.log" || true)
drew=$(grep -m1 'client: local drew' "$OUT/demo.log" || true)
wrote=$(grep -m1 'client: local raise' "$OUT/demo.log" || true)

echo
echo "── the verdict ─────────────────────────────────────────────────────"
ok=1
say() { echo "   $1"; }
no() { echo "   ✗ $1"; ok=0; }

# D1 — the page ran at all.
if [ "$boot" -ge 1 ]; then say "D1 booted: the engine printed its own banner"
else no "D1 the page never booted — nothing printed a banner"; fi

# D2 — and it decided it is on its own.
if [ -n "$local_line" ]; then say "D2 authority: ${local_line#client: }"
else no "D2 the page never went local — it is still dialling, or it never ran"; fi

# D3 — the world half is DRAWN. ⚠ 2 colours, not 1: an unwritten world is a flat
# plane at one height under a constant ambient, so its interior really is ONE
# colour — the region spans the HORIZON, and sky-over-ground is what `drawn` means.
wb=$(field before world 1); pb=$(field before panel 1); gb=$(field before ground 1)
if [ -n "$wb" ] && [ "$pb" -ge 50 ] 2>/dev/null; then
  if [ "$wb" -ge 2 ]; then say "D3 drawn: world $wb colours over the horizon (panel $pb, the control)"
  else no "D3 the world half is ONE colour — nothing is drawn (panel $pb)"; fi
else
  no "D3 no readable shot, or the panel is not busy — the capture says nothing (world '$wb' panel '$pb')"
fi

# D4 — and it HOLDS STILL. Without this, `the picture changed` could be anything.
ws=$(field steady world 2)
if [ -n "$wb" ] && [ "$(field before world 2)" = "$ws" ]; then
  say "D4 steady: the picture is unchanged 1.2 s later with nothing pressed"
else
  no "D4 the picture moved on its own — a change after a key would prove nothing"
fi

# D5 — a key moved it.
wa=$(field after-first world 2)
if [ -n "$wa" ] && [ "$wa" != "$ws" ]; then say "D5 the key redrew the world half ($ws → $wa)"
else no "D5 the picture did not change when the key was pressed ($ws → $wa)"; fi

# D6 — and it moved because something was WRITTEN, which a colour cannot say.
if [ -n "$wrote" ]; then say "D6 wrote: ${wrote#client: }"
else no "D6 no gesture reached the world — the page drew but did not edit"; fi

# D7 — WHICH surfaces reached the picture. A float total cannot answer this; a
# raise moves the GROUND, so `floats redrawn` rises whether or not anything else
# is drawn (`B1b.2c.4c`).
if [ -n "$drew" ]; then say "D7 surfaces: ${drew#client: }"
else no "D7 the page never named a surface it drew"; fi


# ── P  the demo carries its PART LIBRARY — plan 22 `B2c` ───────────────────
#
# ⚠ READ OFF THE `D` RUN, which already booted this page — no extra browser pass.
#
# ⚠ AND THE CLAIM IS THE PAGE'S OWN READ, NOT THE BUILD'S REPORT. `build-pages`
# printing "23 files baked" says what it put in; only the page saying `local library
# — N parts` says the bytes are reachable through `list_dir`/`is_dir` at the root
# the client actually looks at. Those are two different facts and the build cannot
# have the second.
p_lib=$(grep -m1 'client: local library' "$OUT/demo.log" || true)
p_n=$(printf '%s' "$p_lib" | sed -n 's/.*library — \([0-9]*\) parts.*/\1/p')
p_sw=$(grep -m1 'swatches and' "$OUT/demo.log" | sed -n 's/^client: \([0-9]*\) swatches.*/\1/p')

if [ -n "$p_n" ] && [ "$p_n" -gt 0 ] 2>/dev/null; then
  say "P1 library: ${p_lib#client: local }"
else
  no "P1 the page found no parts in its own base tree (read '$p_n') — the library is not baked, or not at the root the client looks at"
fi

# ⚠ P2 IS ABOUT THE CATALOGUE REACHING THE PANEL, AND IT IS BLIND TO THE PARTS —
# which the `noparts` sabotage proved by staying GREEN. The swatches are the
# MATERIAL rows, and a page with no part library still has all eleven of them. It is
# kept because it is the only thing that says the composed string was accepted by
# the panel at all — a page that read 20 parts and rendered an empty catalogue would
# pass `P1` and fail here — but it must not be read as *the parts are on screen*.
#
# ⏭ WHAT WOULD SEE A PART ROW IS ITS THUMBNAIL, and there are none yet: the page
# lists parts it cannot draw a picture of. That is the next step, and the reason
# this check says `materials` in its own verdict rather than `catalogue`.
if [ -n "$p_sw" ] && [ "$p_sw" -gt 0 ] 2>/dev/null; then
  say "P2 the panel took it: $p_sw material swatches rendered (⚠ blind to the parts — see noparts)"
else
  no "P2 the panel rendered $p_sw material swatches — the composed catalogue never reached it"
fi

# ── F  the demo can BUILD A HOUSE — plan 22 `B1c.1`, the turn ───────────────
#
# ⚠ THE NEGATIVE CONTROL IS THE FIRST KEY OF THE SAME RUN. `place` is refused at
# yaw 0 — *"a footprint at this facing has no mitred corners; turn one step"* — and
# that refusal was the live fact standing between this page and a house. So the
# sequence presses `h` BEFORE anything has turned, and the run holds both halves:
# the same key, the same page, refused and then accepted.
#
# ⚠ AND IT PRESSES `d` BETWEEN ATTEMPTS BECAUSE THE REFUSAL SAYS TO. A footprint
# fits only the six lattice rotations (`rot 9 of 12, offer 8` — the even ones), and
# one key press is 3 or 4 fixed steps depending on when the browser delivers it, so
# *how far one press turns* is not reproducible. Retrying is the product's own
# instruction rather than a way round a flaky check.
echo
echo "── F   turn, and build a house where it was refused ────────────────"
F_KEYS="h,d,h,d,h,d,h,d,h"
# ⚠ `noturn` IS THE CONTROL FOR THE WHOLE SECTION: the same five `h` presses with
# nothing turning between them. If F3 were really about pressing `h` often enough,
# this would pass.
case ",$SAB," in *,noturn,*) F_KEYS="h,h,h,h,h"; echo "   SABOTAGE noturn — the same attempts with no turn between them" ;; esac
timeout 300 node probe/b1b/press.mjs "file://$SITE" "$F_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/house.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/house.raw" > "$OUT/house.log" || true
grep -E '^client: local (place|walker|drew)' "$OUT/house.log" | sed 's/^/   /'

f_first_refusal=$(grep -m1 'local place refused' "$OUT/house.log" || true)
f_placed=$(grep -m1 'local place — 27' "$OUT/house.log" || true)
f_walker=$(grep 'local walker' "$OUT/house.log" | tail -1 || true)
# ⚠ THE FIRST `h` OF THE RUN, not any refusal: a page that placed a house and then
# refused a second one would satisfy a "there was a refusal" test.
f_first_act=$(grep -m1 -e 'local place' "$OUT/house.log" || true)

# F1 — refused before anything turned, and the reason names the fix.
case "$f_first_act" in
  *'place refused'*'turn one step'*)
    say "F1 at boot: ${f_first_refusal#client: local }" ;;
  *) no "F1 the first press was not a refusal naming the turn: '$f_first_act'" ;;
esac

# F2 — TWO CHECKS, BECAUSE ONE NUMBER CANNOT ANSWER, and the `noturn` sabotage is
# what proved it: with nothing turning, the page still consumed **213 steps**. A
# step count says the CLOCK advanced — the thing a missing time bridge takes away
# silently — and says nothing whatever about the keys. Only the radians can.
f_steps=$(printf '%s' "$f_walker" | sed -n 's/.*walker — \([0-9]*\) steps.*/\1/p')
f_turn=$(printf '%s' "$f_walker" | sed -n 's/.*(turned \([-0-9.]*\)).*/\1/p')
if [ -n "$f_steps" ] && [ "$f_steps" -gt 0 ] 2>/dev/null; then
  say "F2a clock: $f_steps fixed steps consumed"
else
  no "F2a the clock never advanced (steps '$f_steps') — ticks() is stuck, and a page whose time bridge is missing draws perfectly and stands still"
fi
if [ -n "$f_turn" ] && [ "$f_turn" != "0" ]; then
  say "F2b keys: the yaw moved $f_turn radians"
else
  no "F2b the clock ran and the pose did not move (turned '$f_turn') — the held bits never reached the walker"
fi

# ⚠ THE DEAD-CLOCK RUN JUDGES A DIFFERENT THING, and says so rather than reporting
# the house checks as failures of the product. What is being asked is whether a page
# whose clock never advances SAYS SO — the guard exists for a hazard that is real
# (the emitted page's import shim answers 0 for any name the host did not bind) and
# it was written wrong first: keyed on `tick_at == 0`, it returned early on every
# frame of exactly the page it was written for.
case ",$SAB," in *,deadclock,*)
  if grep -q 'the clock has not advanced' "$OUT/house.log"; then
    say "F* deadclock: $(grep -m1 'clock has not advanced' "$OUT/house.log" | sed 's/^client: local //')"
  else
    no "F* a page whose clock never advances said nothing — it draws perfectly and stands still"
  fi
  ;;
esac

# F3 — and then the same key placed a house.
if [ -n "$f_placed" ]; then say "F3 after turning: ${f_placed#client: local }"
else no "F3 no house was ever placed — the turn did not reach an admissible facing"; fi

# F4 — the WORLD it built, exactly. ⚠ The yaw is continuous and NOT reproducible
# (3 or 4 steps per press, browser-dependent); the world is, because the gesture
# takes a lattice ROTATION rather than the raw yaw. That quantisation is what lets
# a demo driven by wall-clock key presses be asserted byte for byte.
f_key=$(printf '%s' "$f_placed" | sed -n 's/.*world \([0-9]*:[0-9]*\).*/\1/p')
if [ "$f_key" = "41145:1306471549" ]; then
  say "F4 and the world is exactly $f_key — a continuous turn, a quantised gesture"
else
  no "F4 the first house built world '$f_key', not 41145:1306471549"
fi

# F5 — and it reached the PICTURE. ⚠ A world key cannot see a drawing, and this is
# `B1b.2c.4c`'s instrument: the page names the surfaces it installed.
if grep -q 'local drew .*wall' "$OUT/house.log"; then
  say "F5 drawn: $(grep -m1 'local drew .*wall' "$OUT/house.log" | sed 's/^client: local //')"
else
  no "F5 a house was placed and no wall was ever drawn"
fi

# ── G  the demo can WALK, and it moves where a house lands — `B1c.2c` ──────
#
# ⚠ THE CLAIM IS NOT *the numbers moved*, IT IS *the walk reaches the gesture*.
# A page whose walker updated a pose nothing consulted would report a distance and
# a position exactly like this one, and every picture would look right — the
# "built and never called" defect wearing a walker's clothes. So the verdict is a
# WORLD: the same house, placed after walking, must land somewhere else.
#
# ⚠ AND THE BASELINE IS `F4`'s, MEASURED IN THIS SAME RUN. `41145:1306471549` is
# what the F block builds by turning and placing WITHOUT walking, so the two
# differ in exactly one thing.
#
# ⚠ IT RETRIES THE TURN LIKE `F` DOES, AND THE FIRST VERSION DID NOT — which cost a
# red run. One key press is 3 OR 4 fixed steps depending on when the browser
# delivers it (`B1c.1` measured exactly that), and `w x6, d, h` landed on 3: the
# facing stayed at rot 9, the place was refused, and nothing was built. ⚠ `G2`'s
# three-outcome split is what made it legible — it reported *"no house was placed …
# the turn may have landed short of an admissible facing"* rather than blaming the
# walk. **The instrument diagnosed its own harness**, which is the whole reason the
# third outcome exists.
#
# ⚠ WHAT THIS DOES NOT CHECK, said so nobody reads it as covered: whether the walk
# is CORRECT — that a wall stops it, that a cliff does, that a slide works. Those
# are `hex_editor::walk_to`'s own, and `make gate-character`'s `collide`, `cliff`
# and `climb` drive them against the server. The page calls the same function; the
# point of the move was that there is only one to be right.
echo
echo "── G   walk, and place a house somewhere else ──────────────────────"
G_KEYS="w,w,w,w,w,w,d,h,d,h,d,h"
# ⚠ IT RETRIES LIKE `F` DOES, and the first version did not — `d,h` alone left the
# turn one step short of an admissible facing on some runs, so the house was never
# placed and `G2` went red saying *the same world*, about a run with no world in it.
# A sabotage has to fail for ITS OWN reason.
case ",$SAB," in *,nowalk,*) G_KEYS="d,h,d,h,d,h"; echo "   SABOTAGE nowalk — the same run with the walk keys removed" ;; esac
timeout 300 node probe/b1b/press.mjs "file://$SITE" "$G_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/walk.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/walk.raw" > "$OUT/walk.log" || true
grep -E '^client: local (walker|place)' "$OUT/walk.log" | sed 's/^/   /'

g_walker=$(grep 'local walker' "$OUT/walk.log" | tail -1 || true)
g_dist=$(printf '%s' "$g_walker" | sed -n 's/.*walked \([0-9.]*\) at.*/\1/p')
g_at=$(printf '%s' "$g_walker" | sed -n 's/.*at (\([-0-9.,]*\)).*/\1/p')
g_placed=$(grep -m1 'local place — 27' "$OUT/walk.log" || true)
g_key=$(printf '%s' "$g_placed" | sed -n 's/.*world \([0-9]*:[0-9]*\).*/\1/p')

# G1 — the author moved, and it is the WALK keys that did it.
if [ -n "$g_dist" ] && [ "$g_dist" != "0" ] && [ "$g_at" != "0,0" ]; then
  say "G1 walked $g_dist world units, to ($g_at)"
else
  no "G1 the author never left the origin — walked '$g_dist', at '($g_at)'"
fi

# G2 — and the world knows. This is the whole step: a pose nothing reads is a pose
# that was not built.
#
# ⚠ THREE OUTCOMES, NOT TWO, and the third is why. A run that placed NO house says
# nothing about the walk at all — the turn can land one step short of an admissible
# facing — and reporting that as *the same world* is an instrument describing a
# failure it did not measure. `F2` needed the same split.
if [ -z "$g_key" ]; then
  no "G2 no house was placed in this run, so it cannot say whether the walk reached the gesture (the turn may have landed short of an admissible facing)"
elif [ "$g_key" != "41145:1306471549" ]; then
  say "G2 the house landed elsewhere: $g_key against F4's 41145:1306471549"
else
  no "G2 the house landed at $g_key — exactly the world F4 builds standing still, so the walk did not reach the gesture"
fi

# ── H  the demo's feet FALL — plan 22 `B1c.3` ──────────────────────────────
#
# ⚠ THE CONTROL IS THE `G` RUN, WHICH ALREADY HAPPENED. G walks the same distance
# over FLAT ground and reports `feet 0 landed 0`; this raises the ground first and
# walks over it. Same page, same keys but one, opposite outcomes — so *the feet
# moved* cannot be an artefact of walking, of time passing, or of the report.
#
# ⚠ AND `landed` IS THE CLAIM, NOT `feet`. A height that tracks the terrain is the
# CLIMB — `fall_step`'s `y <= gnd` branch, which a plain lookup would also produce.
# `fl_landed` is only reachable by being AIRBORNE and then touching down, which is
# the fall itself.
#
# ⚠ THE RAISE LANDS TEN HEXES AHEAD (the editor's own help line says so), so the
# walk has to cover that before anything is under the feet — 44 presses, measured,
# not guessed. ⚠ And it is ONE raise: three make a step of ~11 height units against
# a cliff threshold of 4, and the walker is then fenced ON the plateau by its own
# cliffs — `cliff.loft`'s recorded cost, reproduced here the first time this was
# driven.
echo
echo "── H   raise the ground, walk over it, and fall ────────────────────"
H_KEYS=$(python3 -c "print(','.join(['ArrowUp'] + ['w']*44))")
case ",$SAB," in *,noraise,*) H_KEYS=$(python3 -c "print(','.join(['w']*44))"); echo "   SABOTAGE noraise — the same walk with nothing raised to fall off" ;; esac
timeout 400 node probe/b1b/press.mjs "file://$SITE" "$H_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/fall.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/fall.raw" > "$OUT/fall.log" || true
grep -E '^client: local walker' "$OUT/fall.log" | tail -3 | sed 's/^/   /'

h_line=$(grep 'local walker' "$OUT/fall.log" | tail -1 || true)
h_feet=$(printf '%s' "$h_line" | sed -n 's/.*feet \([0-9.]*\) .*/\1/p')
h_landed=$(printf '%s' "$h_line" | sed -n 's/.*landed \([0-9]*\).*/\1/p')
# The flat-ground control, out of the G run captured above.
g_line=$(grep 'local walker' "$OUT/walk.log" | tail -1 || true)
g_feet=$(printf '%s' "$g_line" | sed -n 's/.*feet \([0-9.]*\) .*/\1/p')
g_landed=$(printf '%s' "$g_line" | sed -n 's/.*landed \([0-9]*\).*/\1/p')

if [ -n "$h_feet" ] && [ "$h_feet" != "0" ]; then
  say "H1 the feet left the ground plane: $h_feet world units up"
else
  no "H1 the feet never left 0 (feet '$h_feet') — nothing was under them to climb"
fi

if [ -n "$h_landed" ] && [ "$h_landed" -gt 0 ] 2>/dev/null; then
  say "H2 a fall COMPLETED $h_landed time(s) — airborne, then touched down"
else
  no "H2 the feet never landed (landed '$h_landed'). A height that merely tracks the terrain is the CLIMB; only a landing is the fall"
fi

if [ "$g_feet" = "0" ] && [ "$g_landed" = "0" ]; then
  say "H3 control: the same walk over FLAT ground kept feet 0 and landed 0"
else
  no "H3 the flat-ground walk reported feet '$g_feet' landed '$g_landed' — it should have neither, so H1/H2 prove nothing"
fi

# ── E  the demo can be TOLD where a server is — plan 22 `B2b` ───────────────
#
# ⚠ THREE RUNS, AND TWO OF THEM ARE CONTROLS. *The page connected* means nothing
# on its own: a client that reported a connection it had not made is the exact
# defect `B1b.1a` was written for, and it went unnoticed for months. So `E2` takes
# the listener away and `E3` takes the FILE away, and each must fail differently.
#
# ⚠ THE OTHER SIDE'S LOG IS THE NON-CIRCULAR EVIDENCE. `E1` is believed because
# `static.mjs` printed `UPGRADE COMPLETED` — a fact this side holds — and not
# because the client said so about itself.
E_PORT=19555
if ss -ltn "sport = :$E_PORT" 2>/dev/null | grep -q ":$E_PORT"; then
  echo
  echo "── E   SKIPPED — port $E_PORT is busy; this box runs other agents' work ──"
else
  echo
  echo "── E   told where a server is: 3 runs, 2 of them controls ──────────"
  E_URL="ws://127.0.0.1:$E_PORT/ws"

  # $1 tag · $2 --await text · $3 build args · $4 'up' to run the listener
  e_run() {
    node tools/build-pages.mjs $3 > "$OUT/$1.build" 2>&1 || fail "build-pages refused: $(cat "$OUT/$1.build")"
    : > "$OUT/$1.listener"
    e_pid=""
    if [ "$4" = "up" ]; then
      node probe/b1b/static.mjs probe/b2 "$E_PORT" --ws-silent > "$OUT/$1.listener" 2>&1 &
      e_pid=$!
      # ⚠ POLL FOR `listening`, NEVER SLEEP. A run whose listener had not bound yet
      # would report *the page found no server* about a race in this script.
      i=0
      while [ "$i" -lt 100 ] && ! grep -q '^static: ' "$OUT/$1.listener"; do i=$((i + 1)); sleep 0.1; done
      grep -q '^static: ' "$OUT/$1.listener" || { kill "$e_pid" 2>/dev/null; fail "the E listener never bound"; }
    fi
    timeout 300 node probe/b1b/press.mjs "file://$SITE" ArrowUp \
      --await "$2" --wait-ms 90000 > "$OUT/$1.raw" 2>&1 || true
    grep -E '^(client|moros editor client)' "$OUT/$1.raw" > "$OUT/$1.log" || true
    # ⚠ KILL BY THE PID WE RECORDED, AND THEN WAIT FOR THE PORT — NOT FOR THE
    # PROCESS. `wait "$e_pid"` hung this script for the whole of an 800-second
    # timeout with `E1` already green in its log: the browser still holds the
    # socket the listener accepted, so the shell sat on a job that had been
    # signalled and had not finished dying. The next run needs one thing only —
    # the port back — so that is what is waited for, with a bound.
    if [ -n "$e_pid" ]; then
      kill "$e_pid" 2>/dev/null || true
      i=0
      while [ "$i" -lt 100 ] && ss -ltn "sport = :$E_PORT" 2>/dev/null | grep -q ":$E_PORT"; do
        i=$((i + 1)); sleep 0.1
      done
    fi
    return 0
  }

  e_says() { grep -q "$2" "$OUT/$1.log"; }

  e_run e1 "connected to" "--servers $E_URL" up
  e_run e2 "no server answered" "--servers $E_URL" down
  e_run e3 "no server answered" "" up

  echo "   E1 (told, listener up):   $(grep -m1 -e 'connected to' -e 'no server answered' "$OUT/e1.log" | sed 's/^client: //')"
  echo "      the wire's own words:  $(grep -c 'UPGRADE COMPLETED' "$OUT/e1.listener" || true) upgrade(s) completed"
  echo "   E2 (told, listener down): $(grep -m1 -e 'connected to' -e 'no server answered' "$OUT/e2.log" | sed 's/^client: //')"
  echo "   E3 (not told, up):        $(grep -m1 -e 'connected to' -e 'no server answered' "$OUT/e3.log" | sed 's/^client: //')"

  # E1 — it attached, and the far side agrees.
  if e_says e1 "connected to '$E_URL'" && ! e_says e1 'no server answered' \
     && grep -q 'UPGRADE COMPLETED' "$OUT/e1.listener"; then
    say "E1 a demo opened from a DISK attached to an editor it was told about"
  else
    no "E1 the page did not attach to $E_URL, or the far side never saw it"
  fi

  # E2 — the control for E1. Same page, nothing listening.
  #
  # ⚠ IT MUST HAVE REACHED THE SECOND CANDIDATE, and that is not implied by going
  # local: a page that gave up after `/ws` would also print `no server answered`,
  # and would then be a control for nothing — E1's connection would be the only
  # evidence that the second candidate is ever dialled at all. The `trying` line is
  # what says it was.
  if e_says e2 'no server answered' && ! e_says e2 "connected to" \
     && e_says e2 "trying '$E_URL'"; then
    say "E2 control: it dialled the same candidate and, with nothing there, went local"
  else
    no "E2 the page claimed a connection with nothing behind the wire, or never reached $E_URL"
  fi

  # E3 — the control for the MECHANISM. The candidate is data, not a constant: a
  # page nobody told must not find a server that is sitting right there.
  if e_says e3 'no server answered' && ! e_says e3 "$E_PORT"; then
    say "E3 control: a page nobody told never dials $E_PORT, with a server on it"
  else
    no "E3 an untold page reached $E_PORT — the candidate is compiled in, not given"
  fi

  # ⚠ THE TREE IS LEFT HOLDING THE PLAIN DEMO. `make pages` means *the quick start*,
  # and a `_site/` carrying a probe's port would attach somebody's demo to a listener
  # that stopped existing when this script exited.
  node tools/build-pages.mjs > /dev/null || fail "could not restore the plain demo"
fi

echo
if [ "$ok" -eq 1 ]; then
  echo "demo PASS — _site/index.html opens from file://, edits its own world and draws it."
  echo "            No server, no toolchain, no port — and it attaches to one it is told about."
else
  fail "the quick-start demo did not hold (see $OUT/)"
fi
