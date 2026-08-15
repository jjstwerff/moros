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
#   DEMO_SABOTAGE=deadkey    press `z` instead of a raise. The page runs, draws and
#                            writes nothing, so a check that credits the mere passage
#                            of time with a gesture stays green here.
#                            ⚠ **THE REASON IT IS DEAD CHANGED, AND THE ROW READ AS
#                            STALE.** It said *"one of the twelve keys with no verb"*;
#                            the definition names `Z` `hole` since `K3` · `Z`. What makes
#                            `z` inert here is that **this CLIENT binds no key for it**
#                            — there is no `KEY_` for 122 — so no verb is ever looked
#                            up. Written down because the obvious repair is to pick a
#                            different letter, and every letter the client DOES bind is
#                            now a gesture.
#   DEMO_SABOTAGE=nosettle   `M3`'s own row: the rebind fence in `act` removed, so the
#                            key that COMPLETES a rebind fires the verb it has just
#                            been bound to. Red on M4 and on nothing else — every
#                            sentence, the bar and the old key are all correct.
#   DEMO_SABOTAGE=noarm      Escape reaches the rebinder no more. Red on M1–M6: the
#                            gesture is unreachable, and M6 — whose evidence is an
#                            ABSENCE — is caught by its vacuity guard rather than by
#                            its count.
#   DEMO_SABOTAGE=nopersist  `M5b`'s own row: the rebind is never written down, so the
#                            reloaded page comes back on the default. Red on N2 and N3;
#                            N1 stays green, which is what says the rebind itself worked
#                            and only the WRITING was removed. ⛔ **It scored N3 GREEN the
#                            first time it ran** — with one `5` and one `ArrowUp` after
#                            the reload, survived and not-survived both produce exactly
#                            one raise. See N3.
#
#   DEMO_SABOTAGE=nofresh    `M5a`'s own row: the scan binds whatever it finds DOWN
#                            instead of what was just pressed, which is the client as
#                            it stood before the step. Red on M7 and on nothing else —
#                            the held `w` names the verb before anything was chosen.
#
#   DEMO_SABOTAGE=nobarsay   the bar is rebuilt and never re-reported. Red on M3
#                            ALONE: the binding really moved, and the only line the
#                            transcript carries is the boot one.
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
#   DEMO_SABOTAGE=nochoose   the same `Q` run without the choosing key. If `Q2`
#                            were about pressing `h` at all rather than about the
#                            SELECTION, this would pass.
#   DEMO_SABOTAGE=norun      the same `R` walk with the run key removed. If `R1`–`R3`
#                            were reading the WALK's own lines rather than the run's,
#                            this would pass.
#   DEMO_SABOTAGE=nostorey   the same `B` run with the storey keys replaced by walk
#                            keys. If `B1`–`B3` were reading the boot's own lines
#                            rather than the storey's, this would pass.
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
  # ── `M3`'s three, all of which build a different client, `deadclock`'s pattern ──
  #
  # ⛔ `nosettle` IS THE ONE THIS STEP IS FOR: the fence in `act` removed, so the key
  # that completes a rebind fires the verb it has just been bound to. ⚠ The SAME line
  # stands in `wire` — two fences, one for verbs and one for everything with no verb —
  # so the substitution is addressed to `act`'s body rather than matched by text. A
  # sed that took both would be a broader sabotage wearing this one's name.
  *,nosettle,*)
    sed '/^fn act(h: web::WsHandler/,/^}/ s|^  if hex_editor::rebind_holds(st.rb) { return; }$|  // SABOTAGE nosettle|' \
      src/editor_client.loft > probe/b2/.nosettle.loft
    grep -q 'SABOTAGE nosettle' probe/b2/.nosettle.loft \
      || fail "the nosettle sabotage patched nothing: act's fence has been reshaped"
    grep -c 'rebind_holds(st.rb) { return; }' probe/b2/.nosettle.loft | grep -qx 1 \
      || fail "the nosettle sabotage took the wrong number of fences"
    echo "   SABOTAGE nosettle — act's rebind fence removed; the binding press acts"
    loft --html --lib lib/ probe/b2/.nosettle.loft > /dev/null 2>&1 \
      || fail "the sabotaged client did not build"
    mkdir -p _site && cp probe/b2/.loft/.nosettle.html "$SITE" \
      || fail "the sabotaged page was not emitted where expected"
    ;;
  # The arm key reaches nothing — the whole gesture is unreachable. ⚠ Its value is
  # that it must be red in FIVE places: a run where nothing armed also cannot pick,
  # cannot bind, and leaves `ArrowUp` live, so `M6` — whose evidence is an ABSENCE —
  # has to catch it through its vacuity guard rather than through the count.
  *,noarm,*)
    sed 's|^    hex_editor::rebind_arm(st.rb);$|    // SABOTAGE noarm|' \
      src/editor_client.loft > probe/b2/.noarm.loft
    grep -q 'SABOTAGE noarm' probe/b2/.noarm.loft \
      || fail "the noarm sabotage patched nothing: the arm handler has been reshaped"
    echo "   SABOTAGE noarm — Escape no longer reaches the rebinder"
    loft --html --lib lib/ probe/b2/.noarm.loft > /dev/null 2>&1 \
      || fail "the sabotaged client did not build"
    mkdir -p _site && cp probe/b2/.loft/.noarm.html "$SITE" \
      || fail "the sabotaged page was not emitted where expected"
    ;;
  # ⛔ `nofresh` IS `M5a`'s OWN ROW: the scan binds the first key it finds DOWN, which is
  # exactly the client as it stood before the step. ⚠ It replaces the CALL rather than
  # patching the library, because the claim being tested here is that the client asks —
  # a sabotage inside `hex_editor` would be `probe/k2/sabotage-m5.sh`'s job and would
  # tell this file nothing about whether anything calls it.
  *,nofresh,*)
    sed 's|^    fresh = hex_editor::rebind_scan(st.rb, downs);$|    fresh = downs[0] ?? hex_editor::KEY_NONE;   // SABOTAGE nofresh|' \
      src/editor_client.loft > probe/b2/.nofresh.loft
    grep -q 'SABOTAGE nofresh' probe/b2/.nofresh.loft \
      || fail "the nofresh sabotage patched nothing: the scan call has been reshaped"
    echo "   SABOTAGE nofresh — the scan binds whatever is DOWN, not what was pressed"
    loft --html --lib lib/ probe/b2/.nofresh.loft > /dev/null 2>&1 \
      || fail "the sabotaged client did not build"
    mkdir -p _site && cp probe/b2/.loft/.nofresh.html "$SITE" \
      || fail "the sabotaged page was not emitted where expected"
    ;;
  # ⛔ `nopersist` IS `M5b`'s OWN ROW: the rebind is never written down, so a reloaded
  # page comes back on the default. ⚠ It patches the SAVE and not the load, because
  # *nothing was written* and *nothing was read* look identical from the second page and
  # only the first half of the run can tell them apart — which is why `N1` asks about the
  # write in its own words.
  *,nopersist,*)
    sed 's|^        if !hex_editor::keymap_save(st.keys, hex_editor::keymap_default(), KEYMAP_PATH) {$|        if false {   // SABOTAGE nopersist|' \
      src/editor_client.loft > probe/b2/.nopersist.loft
    grep -q 'SABOTAGE nopersist' probe/b2/.nopersist.loft \
      || fail "the nopersist sabotage patched nothing: the save call has been reshaped"
    echo "   SABOTAGE nopersist — a rebind is never written down"
    loft --html --lib lib/ probe/b2/.nopersist.loft > /dev/null 2>&1 \
      || fail "the sabotaged client did not build"
    mkdir -p _site && cp probe/b2/.loft/.nopersist.html "$SITE" \
      || fail "the sabotaged page was not emitted where expected"
    ;;
  # The INSTRUMENT rather than the subject: the bar is rebuilt and not re-reported, so
  # the only bar line in the transcript is the boot one. ⚠ It exists to prove `M3`
  # reads the REBUILT bar — a check that took the first line would call the starting
  # state a result, and this is the sabotage that would pass it.
  *,nobarsay,*)
    sed 's|^      say_verb_bar(ui_bar);$|      // SABOTAGE nobarsay|' \
      src/editor_client.loft > probe/b2/.nobarsay.loft
    grep -q 'SABOTAGE nobarsay' probe/b2/.nobarsay.loft \
      || fail "the nobarsay sabotage patched nothing: the panel rebuild has been reshaped"
    echo "   SABOTAGE nobarsay — the bar is rebuilt and never re-reported"
    loft --html --lib lib/ probe/b2/.nobarsay.loft > /dev/null 2>&1 \
      || fail "the sabotaged client did not build"
    mkdir -p _site && cp probe/b2/.loft/.nobarsay.html "$SITE" \
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
  # ⚠ EVERY SOURCE SABOTAGE LANDS HERE, and they share one side effect worth stating
  # once: `build-pages` reads a FIXED engine path, so a sabotaged client is copied over
  # `$SITE` raw and carries **no part-library prelude**. The `P` rows therefore go red
  # in these runs for a reason that is not the subject — read the block the sabotage
  # names, not the exit code. (`deadclock` set this precedent; `M3`'s three follow it.)
  *,deadclock,*|*,nosettle,*|*,noarm,*|*,nobarsay,*|*,nofresh,*|*,nopersist,*)
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
p_th=$(grep -m1 'swatches and' "$OUT/demo.log" | sed -n 's/.*and \([0-9]*\) thumbnails.*/\1/p')
p_arr=$(grep -m1 'swatches and' "$OUT/demo.log" | sed -n 's/.*(\([0-9]*\) thumbnail meshes arrived.*/\1/p')

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

# P3 — and every part row carries a PICTURE, which is what makes it usable.
#
# ⚠ THIS IS THE CHECK `P2` COULD NOT MAKE. Swatches are material rows and exist with
# no library at all (`noparts` proved it by staying green); a THUMBNAIL is a part
# meshed, framed and drawn, so a count above zero cannot come from anywhere else.
#
# ⚠ AND `arrived` MUST BE ZERO, WHICH IS THE HALF THAT SAYS WHERE THEY CAME FROM.
# That counter is incremented by the `Y:` WIRE handler; a page composing its own
# thumbnails and feeding the same store leaves it at 0 while `held` and `cameras`
# rise. A non-zero here would mean a server was answering, and this run has none.
if [ -n "$p_th" ] && [ "$p_th" -gt 0 ] 2>/dev/null && [ "$p_arr" = "0" ]; then
  say "P3 pictures: $p_th thumbnails drawn, $p_arr arrived over a wire"
else
  no "P3 the catalogue drew $p_th thumbnails ($p_arr off the wire) — a part row without a picture is a row an author cannot use"
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

# ── Q  the SELECTION decides what `place` makes — plan 22 `B2e` ────────────
#
# ⚠ THE CONTROL IS THE `F` BLOCK, ALREADY RUN. F presses `d` then `h` with nothing
# chosen and builds the procedural house: **27 cells, world `41145:1306471549`**.
# This presses `d`, then `k` to choose a part, then the SAME `h` at the same pose —
# so a different world can only be the selection, not the key, the facing or the
# place.
#
# ⚠ AND IT IS `S2b`'s SHAPE ONE FAMILY OVER: *picking a profile must change what the
# next opening cuts*, asserted by building two and diffing them — never by reading
# the line that says what is picked.
echo
echo "── Q   choose a part, and place THAT instead of a house ────────────"
# ⚠ IT RETRIES THE PLACE, for the reason `F` and `G` both had to: one key press is
# 3 OR 4 fixed steps, and a footprint fits only the six EVEN rotations — so a single
# `h` lands on an inadmissible facing about half the time and NOTHING is built.
# ⚠ `Tab` AND NOT `k` — plan 22 `K3`. `k` is BALCONY in `tools/script.mjs`'s KEYMAP,
# and the client briefly bound it to part-cycling too: one letter, two meanings,
# which is the four-sites defect rebuilt in the file that documents it. ⚠ There was
# no free LETTER to move to — all 26 are taken — and `.` turned out to be
# unrepresentable: the page's `mapKey` handles `Key*`, `Digit*` and eight named keys,
# and returns 0 for everything else, so a punctuation press cannot be told from no
# press. `Tab` is in that table and already means cycle.
Q_KEYS="d,Tab,h,d,h,d,h"
case ",$SAB," in *,nochoose,*) Q_KEYS="d,h,d,h,d,h"; echo "   SABOTAGE nochoose — the same run without the choosing key" ;; esac
timeout 300 node probe/b1b/press.mjs "file://$SITE" "$Q_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/part.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/part.raw" > "$OUT/part.log" || true
grep -E "^client: local (part|place)" "$OUT/part.log" | sed 's/^/   /'

q_chosen=$(grep -m1 "client: local part '" "$OUT/part.log" || true)
q_placed=$(grep -m1 'client: local place — ' "$OUT/part.log" || true)
q_key=$(printf '%s' "$q_placed" | sed -n 's/.*world \([0-9]*:[0-9]*\).*/\1/p')
q_n=$(printf '%s' "$q_placed" | sed -n 's/.*place — \([0-9]*\) .*/\1/p')

if [ -n "$q_chosen" ]; then say "Q1 chosen: ${q_chosen#client: local }"
else no "Q1 no part was chosen — the choosing key did nothing"; fi

# ⚠ THE VERDICT IS THE WORLD, NOT THE COUNT. A cell count says the gesture did
# something; only the world says it did something ELSE than the house F built at
# this very pose.
#
# ⚠ AND THREE OUTCOMES, NOT TWO — the split `G2` and `P2` each needed after saying
# something they had not measured. A run that placed NOTHING cannot speak about the
# selection at all, and reporting it as *the selection changed nothing* is an
# instrument describing a failure it did not see. This is the third time in this
# file; the shape is now the default rather than a correction.
if [ -z "$q_key" ]; then
  no "Q2 nothing was placed in this run, so it cannot say whether the selection changed what `place` makes (the turn may have landed short of an admissible facing)"
elif [ "$q_key" != "41145:1306471549" ]; then
  say "Q2 the same key built $q_key ($q_n cells) where F4 built 41145:1306471549 (27)"
else
  no "Q2 place built F4's own house world ($q_key) — the selection changed nothing"
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
# ⚠ 60 PRESSES, NOT 44, AND THE DIFFERENCE IS A FLAKE THIS CHECK ALREADY SHIPPED.
# At 44 the walker reaches the crest of the raised patch and stops there about half
# the time — `feet` up, `landed` 0 — because one press is 3 OR 4 fixed steps. It
# passed three runs in a row with 1, 2 and 3 landings, which is not evidence of
# reliability: it is a coin that came up heads three times. The walk has to CLEAR
# the crest for a descent to exist at all.
H_KEYS=$(python3 -c "print(','.join(['ArrowUp'] + ['w']*60))")
case ",$SAB," in *,noraise,*) H_KEYS=$(python3 -c "print(','.join(['w']*60))"); echo "   SABOTAGE noraise — the same walk with nothing raised to fall off" ;; esac
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
  no "H2 the feet never landed (landed '$h_landed') though they reached $h_feet. A height that merely tracks the terrain is the CLIMB; only a landing is the fall — and a walker still ON the crest has had nothing to fall off yet, which is what too short a walk looks like"
fi

if [ "$g_feet" = "0" ] && [ "$g_landed" = "0" ]; then
  say "H3 control: the same walk over FLAT ground kept feet 0 and landed 0"
else
  no "H3 the flat-ground walk reported feet '$g_feet' landed '$g_landed' — it should have neither, so H1/H2 prove nothing"
fi

# ── R  the demo can lay a WALL RUN — plan 22 `K3` ──────────────────────────
#
# ⚠ **THE DEMO'S MOST-PRESSED KEY WAS ITS DEADEST ONE.** `R` is 22 of the 40
# non-arrow presses across `tools/scripts/*.keys`, and until `K3` local mode answered
# it with *"'25:' is a server message and this page has no gesture for it yet"* — the
# gesture lived in `editor_server.loft` where a page with no socket could not reach it.
#
# ⚠ **AND IT IS THE ONLY VERB WHOSE FIRST PRESS WRITES NOTHING**, which is what makes
# these three checks possible and what makes them necessary. A run has two ends: press
# one records the near end, press two lays the line between them. So *the world did not
# move* is the CORRECT answer to the first press and the wrong one to the second, and a
# wiring that ran the ring instead — the gesture `run` is easiest to confuse with —
# would write on both.
echo
echo "── R   start a run, walk, and close it ─────────────────────────────"
R_KEYS="r,w,w,w,w,w,w,r"
case ",$SAB," in *,norun,*) R_KEYS="w,w,w,w,w,w"; echo "   SABOTAGE norun — the same walk with the run key removed" ;; esac
timeout 300 node probe/b1b/press.mjs "file://$SITE" "$R_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/run.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/run.raw" > "$OUT/run.log" || true
grep -E '^client: local run' "$OUT/run.log" | sed 's/^/   /'

r_first=$(grep -m1 'client: local run' "$OUT/run.log" || true)
r_last=$(grep 'client: local run' "$OUT/run.log" | tail -1 || true)
r_n1=$(printf '%s' "$r_first" | sed -n 's/.*local run — \([0-9]*\) .*/\1/p')
r_n2=$(printf '%s' "$r_last"  | sed -n 's/.*local run — \([0-9]*\) .*/\1/p')
r_k1=$(printf '%s' "$r_first" | sed -n 's/.*world \([0-9]*:[0-9]*\).*/\1/p')
r_k2=$(printf '%s' "$r_last"  | sed -n 's/.*world \([0-9]*:[0-9]*\).*/\1/p')

# R1 — the page ran the gesture at all, rather than saying it has no gesture for `25:`.
if [ -n "$r_first" ]; then
  say "R1 the run key reached a gesture: ${r_first#client: local }"
else
  no "R1 the page never ran a run — $(grep -m1 "no gesture for it yet" "$OUT/run.log" || echo 'the key printed nothing')"
fi

# R2 — the first press RECORDS and the second LAYS, which is one claim in two numbers.
# ⚠ THREE OUTCOMES: a run that never got its second press says nothing about either.
if [ -z "$r_n2" ] || [ "$r_first" = "$r_last" ]; then
  no "R2 only one run press landed in this transcript, so it cannot say what the second one does"
elif [ "$r_n1" = "0" ] && [ -n "$r_n2" ] && [ "$r_n2" -gt 0 ] 2>/dev/null; then
  say "R2 the first press wrote $r_n1 and the second laid $r_n2"
else
  no "R2 the two presses wrote '$r_n1' then '$r_n2' — a run records on the first and lays on the second"
fi

# R3 — and the STORE agrees, which a count cannot say on its own: the count is the
# gesture's own number, and `world_key` is `hex_voxel`'s.
if [ -n "$r_k1" ] && [ -n "$r_k2" ] && [ "$r_k1" != "$r_k2" ]; then
  say "R3 and the world moved between them: $r_k1 → $r_k2"
elif [ -n "$r_k1" ]; then
  no "R3 the world is $r_k1 before and after — the second press reported $r_n2 and wrote nothing"
else
  no "R3 no world key was printed beside either run press"
fi

# ── B  a STOREY above, and a CELLAR that gets a reason — plan 22 `K3` ──────
#
# ⚠ **THESE WERE THE LAST TWO RAW `wire` SENDS IN THE CLIENT'S INPUT BLOCK, AND THAT
# MADE THEM THE DEAD ONES.** Every neighbour — the arrows, `f`, `g`, `e`, `q`, `r`,
# `h` — went through `act(… verb_of(key))` at its own slice, and `b`/`c` kept putting
# `12:1`/`12:-1` straight on the socket. Local, there is no socket: the page answered
# *"'12:' is a server message and this page has no gesture for it yet"* and the demo
# could not build a storey or dig a cellar at all. `R`'s finding and `E`'s, still live
# on the one pair nobody had converted.
#
# ⛔ **AND THE WALK IS NOT DECORATION — THE FIRST VERSION OF THIS BLOCK PRESSED `b` AT
# BOOT AND MEASURED A REFUSAL WHILE BELIEVING IT MEASURED THE VERB.** A storey needs
# WRITTEN cells under it, and this page boots on the defaulted ground plane where
# nothing is stored (`E1γ`), so `b` at the origin is *"storey refused (-1) no cells
# here"* — correct, and it says nothing about whether the key works. ⚠ Nor does
# raising fix it on the spot: `raise_ahead` lands the brush **10 hexes ahead** with a
# radius of 7, so the patch spans hexes 3–17 and the author's own radius-2 disc is
# entirely outside it. The walk is what puts the author ON what was raised.
#
# ⚠ **30 PRESSES, MEASURED, WITH THE MARGIN WRITTEN DOWN** — `H`'s flake is the reason
# this row is not left at "some walking". It arrives at ~10.5 world units, and the
# patch runs from about 4 to 22, so the disc sits well inside at either end of the
# press-to-step jitter that made `H` 60 presses instead of 44.
#
# ⚠ **AND THE CELLAR HALF ASSERTS REACHING THE GESTURE, NOT DIGGING — SAID OUT LOUD
# RATHER THAN LEFT TO LOOK LIKE COVERAGE.** One raise stands the ground at 1 and a
# cellar wants 12 of headroom, so the honest outcome here is a refusal — and that is
# still the whole claim: *"floor at 1 leaves no room for a storey of 12"* is a sentence
# only `hex_editor` can produce, where the thing it replaces said the page had no
# gesture at all. The digging itself is covered where a fixture can stand the ground
# up: the library rows in `verb.loft`, and `cellar.keys` through a server and its gate.
echo
echo "── B   a storey above, and a cellar told why not ───────────────────"
B_KEYS=$(python3 -c "print(','.join(['ArrowUp'] + ['w']*30 + ['b','c']))")
case ",$SAB," in *,nostorey,*) B_KEYS=$(python3 -c "print(','.join(['ArrowUp'] + ['w']*30))"); echo "   SABOTAGE nostorey — the same raise and walk with the storey keys removed" ;; esac
timeout 400 node probe/b1b/press.mjs "file://$SITE" "$B_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/storey.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/storey.raw" > "$OUT/storey.log" || true
grep -E '^client: local (storey|cellar)|^client: local —' "$OUT/storey.log" | sed 's/^/   /'

b_up=$(grep -m1 'client: local storey — ' "$OUT/storey.log" || true)
b_dn=$(grep -m1 'client: local cellar' "$OUT/storey.log" || true)
b_n=$(printf '%s' "$b_up" | sed -n 's/.*local storey — \([0-9]*\) .*/\1/p')
b_k=$(printf '%s' "$b_up" | sed -n 's/.*world \([0-9]*:[0-9]*\).*/\1/p')

# B1 — the storey key reached a gesture, rather than the page saying it has none.
if [ -n "$b_up" ]; then
  say "B1 the storey key reached a gesture: ${b_up#client: local }"
else
  no "B1 the page never built a storey — $(grep -m1 "no gesture for it yet" "$OUT/storey.log" || echo 'the key printed nothing')"
fi

# B2 — …and it WROTE. ⚠ THE DISC IS THE NUMBER, not merely non-zero: a storey is a
# radius-2 disc, which is 19 cells in every gate in this tree, so a gesture that wrote
# one cell or the whole neighbourhood would pass a `> 0` and fail this.
if [ "$b_n" = "19" ] && [ -n "$b_k" ]; then
  say "B2 and it wrote the disc: $b_n cells · world $b_k"
elif [ -n "$b_n" ]; then
  no "B2 the storey wrote $b_n cells where a radius-2 disc is 19"
else
  no "B2 no cell count was printed beside the storey"
fi

# B3 — and the cellar reached the SAME layer, which its refusal is the proof of: the
# wording is the library's and names the height it wanted. ⚠ THREE OUTCOMES — a run
# that printed nothing for `c` says nothing either way, and must not read as a pass.
# ⚠ AND THE REFUSAL IS ACCEPTED ONLY IF IT IS THE LIBRARY'S. *"no gesture for it yet"*
# is also a line about `c` not working, and it is the exact defect this block exists
# to catch — so the wording is matched rather than the mere presence of a refusal.
if [ -z "$b_dn" ]; then
  no "B3 the cellar key printed nothing — $(grep -m1 "no gesture for it yet" "$OUT/storey.log" || echo 'it reached no layer at all')"
elif printf '%s' "$b_dn" | grep -q 'leaves no room for a storey'; then
  say "B3 and the cellar got the library's own reason: ${b_dn#client: local }"
elif printf '%s' "$b_dn" | grep -q 'local cellar — '; then
  say "B3 the cellar reached a gesture and dug: ${b_dn#client: local }"
else
  no "B3 the cellar printed '${b_dn#client: local }' — neither a dig nor the library's own refusal"
fi

# ── K  the VERB BAR says what you can press and what presses it — `M2` ─────
#
# ⛔ **WHAT THIS REPLACES WAS WRONG ON SCREEN FOR MONTHS.** The side panel's toolbar
# drew a hotkey glyph per button as a literal — `e` beside *Stencil* where `e` is
# `stair_up`, `c` beside *Cart* where `c` is `cellar`, `f` beside *Field* where `f` is
# `fence`. Three of six, and nothing could notice, because a literal glyph is connected
# to nothing that can disagree with it.
#
# ⚠ **A PICTURE CANNOT MAKE THIS CLAIM, WHICH IS WHY THE CHECK READS A SENTENCE.** A
# screenshot shows a strip of squares reached the canvas; it cannot show that the glyph
# in one of them is the key `cellar` is actually bound to. The client prints the pairs
# out of the BUILT bar — a line that re-derived them from the map would agree with
# itself however the layout had gone.
echo
echo "── K   the verb bar, and the keys in it ────────────────────────────"
grep -m1 '^client: verb bar' "$OUT/storey.log" | sed 's/^/   /'
k_line=$(grep -m1 '^client: verb bar' "$OUT/storey.log" || true)

# K1 — it exists at all, and it is not empty.
k_n=$(printf '%s' "$k_line" | sed -n 's/.*verb bar \([0-9]*\) slots.*/\1/p')
if [ -n "$k_n" ] && [ "$k_n" -gt 0 ] 2>/dev/null; then
  say "K1 the bar is drawn with $k_n slots"
else
  no "K1 no verb bar was built — the page reported '${k_line:-nothing}'"
fi

# K2 — and the pairs are the DEFINITION's, spot-checked against keys this probe
# already pressed. ⚠ `b` and `c` are the two the `B` block drove, so a bar that agreed
# with the map but disagreed with what the keyboard does would still fail here.
if printf '%s' "$k_line" | grep -q 'B:storey' && printf '%s' "$k_line" | grep -q 'C:cellar'; then
  say "K2 the glyphs are the bindings: B:storey and C:cellar, the two keys B drove"
else
  no "K2 the bar does not pair B with storey and C with cellar — '${k_line#client: }'"
fi

# K3 — one row, and it says what it could not show. ⚠ THREE OUTCOMES: a bar that fits
# everything reports 0 hidden, which is a pass; a bar that hid some must SAY so; a bar
# with no count at all is the silent truncation this field exists to prevent.
k_h=$(printf '%s' "$k_line" | sed -n 's/.*slots, \([0-9]*\) hidden.*/\1/p')
if [ -z "$k_h" ]; then
  no "K3 the bar reports no hidden count — an overflow would be invisible"
elif [ "$k_h" = "0" ]; then
  say "K3 and all $k_n fit this window, with nothing hidden"
else
  say "K3 and it says what it could not show: $k_h hidden"
fi

# ── M  the KEYBOARD IS THE PERSON'S — arm, pick a slot, press a key — `M3` ──
#
# The bar above says what the binding IS; this says a person can CHANGE it, in the
# editor, with no toolchain and no file to edit. Two runs, because one number cannot
# carry three claims.
#
# ⛔ **THE CLAIM THIS STEP EXISTS FOR IS `M4`, AND IT IS NOT THE OBVIOUS ONE.** The
# client POLLS: `poll_input` asks `gl_key_pressed(code_for(map, verb))` every frame and
# acts on the rising edge. So the key that COMPLETES a rebind is still physically down
# on the very next frame, and the verb it has just been bound to sees an edge — **the
# rebind performs the verb it was defining**. A raise fired that way is
# indistinguishable from a correct one at every other instrument in this tree.
# `RB_SETTLE` holds the keyboard until the finger comes up, and `M4` is the row that
# would see it go.
#
# ⚠ **`5`, AND THE DIGIT IS NOT ARBITRARY.** All 26 letters are bound, so a digit is
# the only genuinely free key — which is also why no probe in this tree had ever
# pressed one, and why the driver's letter heuristic had been quietly turning `5` into
# code 85 (`'Key5'.charCodeAt(3) + 32`) since it was written. Found here, because this
# is the first check that needed a digit to arrive.
#
# ⚠ **AND THE CONTROL IS ALREADY IN THIS FILE, WHICH IS WHY THERE IS NO FOURTH RUN.**
# `D5` presses `ArrowUp` at boot with the rebinder never armed and reads the raise out
# of the picture. With the rebinder off not one byte of the input path changes, and
# `D5` is what says so on every run.
echo
echo "── M   rebinding, from inside the editor ───────────────────────────"
# Arm · click the `raise` slot · press `5` to bind it · press `5` again to USE it.
M_KEYS="Escape,@raise,5,5"
case ",$SAB," in *,noarm,*) echo "   SABOTAGE noarm — Escape reaches the rebinder no more" ;; esac
timeout 400 node probe/b1b/press.mjs "file://$SITE" "$M_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/rebind.raw" 2>&1 || true
grep -E '^(client|canvas|click)' "$OUT/rebind.raw" > "$OUT/rebind.log" || true
grep -E '^client: rebind' "$OUT/rebind.log" | sed 's/^/   /'

m_arm=$(grep -m1 'client: rebind — rebinding — pick a verb' "$OUT/rebind.log" || true)
m_pick=$(grep -m1 'client: rebind — press a key for ' "$OUT/rebind.log" || true)
m_bound=$(grep -m1 'client: rebind — raise is on ' "$OUT/rebind.log" || true)
# ⚠ THE **LAST** BAR LINE, NOT THE FIRST. The bar is reprinted on every rebuild, and
# the boot line necessarily says `Up:raise` — reading that one would report the
# starting state as the result and pass whatever happened.
m_bar=$(grep '^client: verb bar' "$OUT/rebind.log" | tail -1)
m_raises=$(grep -c '^client: local raise — ' "$OUT/rebind.log" || true)

# M1 — the arm key reached the rebinder at all.
if [ -n "$m_arm" ]; then
  say "M1 the arm key reached the rebinder: ${m_arm#client: rebind — }"
else
  no "M1 Escape reached nothing — the page never armed"
fi

# M2 — a CLICK picked a verb. ⚠ AND THE PROMPT MUST NAME THE KEY THE VERB HAS NOW:
# a pick that answered a bare *press a key* would pass a presence test while having
# hit-tested the wrong slot entirely.
if printf '%s' "$m_pick" | grep -q 'for raise — it is on ArrowUp'; then
  say "M2 the click picked a slot, and it named the binding: ${m_pick#client: rebind — }"
elif [ -n "$m_pick" ]; then
  no "M2 the click picked '${m_pick#client: rebind — }' — not raise on ArrowUp"
else
  no "M2 the click on the raise slot picked nothing — $(grep -m1 '^click ' "$OUT/rebind.log" || echo 'and the driver never reported a click')"
fi

# M3 — the BAR moved. ⚠ BOTH HALVES, because either alone is satisfied by a bug: a bar
# showing `5:raise` AND `Up:raise` is `keymap_bind` adding a row instead of moving one,
# which is exactly the defect that leaves the old key live.
if printf '%s' "$m_bar" | grep -q '5:raise' && ! printf '%s' "$m_bar" | grep -q 'Up:raise'; then
  say "M3 and the bar followed it: raise draws under 5, and Up is gone from the strip"
else
  no "M3 the bar reads '${m_bar#client: verb bar }' — raise did not move to 5 alone"
fi

# ⛔ M4/M5 — ONE COUNT, THREE DIAGNOSES, AND THE BRANCHES ARE WHY IT IS ONE RUN.
# Two `5` presses: the first BINDS and must not act, the second ACTS. So 1 is the only
# right answer, and 0 and 2 are different bugs — a total that could only say "not 1"
# would send the next reader to the wrong half.
if [ -z "$m_bound" ]; then
  no "M4 nothing was ever bound — $(grep -m1 'client: rebind' "$OUT/rebind.log" || echo 'the rebinder said nothing at all')"
elif [ "$m_raises" = "1" ]; then
  say "M4 the press that BOUND the key did not fire the verb — 2 presses of 5, 1 raise"
  say "M5 …and the new key does the verb: $(grep -m1 '^client: local raise — ' "$OUT/rebind.log" | sed 's/^client: local //')"
elif [ "$m_raises" = "2" ]; then
  no "M4 both presses of 5 raised — the key that completed the rebind fired the verb it had just bound"
elif [ "$m_raises" = "0" ]; then
  no "M5 the key was bound and does nothing — 2 presses of 5, no raise"
else
  no "M4 2 presses of 5 produced $m_raises raises"
fi

# ── M6 — and the OLD key is dead. A separate run, because *no raise happened* is
# only evidence when nothing else in the sequence could have raised.
echo
M6_KEYS="Escape,@raise,5,ArrowUp,ArrowUp"
timeout 400 node probe/b1b/press.mjs "file://$SITE" "$M6_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/rebind2.raw" 2>&1 || true
grep -E '^(client|canvas|click)' "$OUT/rebind2.raw" > "$OUT/rebind2.log" || true
m6_bound=$(grep -m1 'client: rebind — raise is on ' "$OUT/rebind2.log" || true)
m6_raises=$(grep -c '^client: local raise — ' "$OUT/rebind2.log" || true)
# ⚠ **THE BIND IS ASSERTED FIRST, AND THAT IS THE WHOLE GUARD ON THIS ROW.** *No raise
# happened* is what a page that never armed, never picked and never bound reports too —
# a run where the rebinding failed entirely would score this row green for the worst
# possible reason. It is only evidence once the rebind is known to have happened.
#
# ⛔ **AND THE COUNT IS BRANCHED BECAUSE THE FIRST VERSION OF THIS ROW BLAMED THE WRONG
# HALF — found by the `nosettle` sweep.** This run holds ONE `5` (the bind) and TWO
# `ArrowUp`, so a non-zero count has two possible causes and the row said *the old
# binding is live* for both. With the settle fence removed the bind press raises once
# and `ArrowUp` is correctly dead — a true report of `1` under a false headline, which
# would send the next reader to `keymap_bind` for a defect that is in `act`. The counts
# separate cleanly: **1 is the bind firing, 2 is the old key, 3 is both.** *A total
# cannot say WHICH* — this plan's own `B1b.2c.4c` finding, arriving in an instrument
# written after it.
if [ -z "$m6_bound" ]; then
  no "M6 vacuous — nothing was rebound in this run, so 'ArrowUp did nothing' says nothing"
elif [ "$m6_raises" = "0" ]; then
  say "M6 and the old key is dead: 2 presses of ArrowUp after the rebind, no raise"
elif [ "$m6_raises" = "1" ]; then
  no "M6 one raise from a run with one 5 and two ArrowUp — that is the BIND firing, not the old key (see M4); ArrowUp itself is dead"
elif [ "$m6_raises" = "2" ]; then
  no "M6 ArrowUp raised twice after raise moved to 5 — the old binding is still live"
else
  no "M6 $m6_raises raises where the run holds one 5 and two ArrowUp — the old key is live AND the bind fired"
fi

# ── M7/M8 — A KEY HELD FROM BEFORE THE PICK NAMES NOTHING — plan 22 `M5a` ───
#
# ⛔ **THE STORY IS ORDINARY AND THE OLD EDITOR GOT IT WRONG EVERY TIME.** Walk forward
# on `w`, press `Escape` with the other hand, click a slot — and `w` was bound before the
# person had chosen anything. `gl_key_pressed` answers *is it down*, never *did it just
# go down*, so the scan could not tell the key they are leaning on from the key they
# struck. `RB_SETTLE` is the same missing edge at the far end of the gesture, and `M3`
# shipped that half alone.
#
# ⚠ **THE DRIVER COULD NOT SAY THIS SENTENCE BEFORE.** Every press it makes is
# down-then-up inside one step, so *already down when the slot was clicked* was
# unreachable — `+w` / `-w` (plan 22 `M5a`) is what holds a key across a click, and the
# run is one gesture from the hold to the release.
#
# ⚠ **AND THE THIRD BRANCH IS THE VACUITY GUARD.** *`raise` was not bound to `W`* is
# what a page that never armed, never picked and never scanned reports too — so the run
# must also show the key struck AFTER the release taking it.
echo
M7_KEYS="+w,Escape,@raise,-w,5,5"
timeout 400 node probe/b1b/press.mjs "file://$SITE" "$M7_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/rebind3.raw" 2>&1 || true
grep -E '^(client|canvas|click|hold|release)' "$OUT/rebind3.raw" > "$OUT/rebind3.log" || true
grep -E '^client: rebind' "$OUT/rebind3.log" | sed 's/^/   /'
m7_onw=$(grep -c 'client: rebind — raise is on W' "$OUT/rebind3.log" || true)
m7_said=$(grep -m1 'client: rebind — .*already down' "$OUT/rebind3.log" || true)
m7_on5=$(grep -m1 'client: rebind — raise is on 5' "$OUT/rebind3.log" || true)
m7_raises=$(grep -c '^client: local raise — ' "$OUT/rebind3.log" || true)

if [ "$m7_onw" != "0" ]; then
  no "M7 the key held from before the pick named the verb — 'raise is on W' with nothing chosen"
elif [ -z "$m7_on5" ]; then
  no "M7 vacuous — nothing was bound in this run at all, so 'W did not take it' says nothing: $(grep -m1 'client: rebind' "$OUT/rebind3.log" || echo 'the rebinder said nothing')"
elif [ -z "$m7_said" ]; then
  # ⚠ A SEPARATE BRANCH, because it is a separate failure. The binding is right and the
  # person holding the key they meant is told nothing — which is the silence this step
  # INTRODUCES, since before it that key bound itself: wrong, and visible.
  no "M7 the held key was ignored in silence — the page never said it was already down"
else
  say "M7 the key held across the click named nothing, and the page said why: ${m7_said#client: rebind — }"
  say "M8 …and the key struck after the release took it: ${m7_on5#client: rebind — }"
fi
# ⚠ THE SAME COUNT `M4` READS, on a run that also holds a walk key. Two presses of `5`:
# the first binds and must not act, the second acts.
if [ -n "$m7_on5" ] && [ "$m7_raises" != "1" ]; then
  no "M8 2 presses of 5 after the release produced $m7_raises raises, not 1"
fi

# ── N — THE KEYBOARD SURVIVES A RELOAD — plan 22 `M5b` ─────────────────────
#
# **Bind it, close the tab, come back, and the key still works.** One run, because it is
# one sentence: `!reload` re-opens the page mid-gesture rather than splitting the claim
# across two invocations of the driver with a browser restart between them.
#
# ⚠ **THE FIRST HALF'S TRANSCRIPT IS DUMPED BEFORE THE NAVIGATE**, because the page's
# `<pre id=out>` is part of the document and navigating destroys it — so without that
# the evidence that anything was ever saved would be gone from the log this block reads,
# and `N2` would be asserting persistence with nothing to persist.
#
# ⚠ **AND `N3` IS WHAT MAKES `N2` MORE THAN A SENTENCE.** *The page said it restored a
# binding* is a `println`; *the key that was rebound before the reload raises ground
# after it, and the key it displaced does not* is the binding actually working.
echo
N_KEYS="Escape,@raise,5,!reload,5,5,ArrowUp"
timeout 400 node probe/b1b/press.mjs "file://$SITE" "$N_KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/persist.raw" 2>&1 || true
grep -E '^(client|canvas|click|hold|release|---)' "$OUT/persist.raw" > "$OUT/persist.log" || true
sed -n '1,/^--- reloading ---/p' "$OUT/persist.log" > "$OUT/persist1.log"
sed -n '/^--- reloading ---/,$p' "$OUT/persist.log" > "$OUT/persist2.log"
grep -E '^client: (rebind|keymap)' "$OUT/persist.log" | sed 's/^/   /'

n_bound=$(grep -m1 'client: rebind — raise is on 5' "$OUT/persist1.log" || true)
n_wrote=$(grep -c 'client: keymap ⚠' "$OUT/persist1.log" || true)
n_back=$(grep -m1 'client: keymap — ' "$OUT/persist2.log" || true)
n_rebinds=$(grep -c 'client: rebind' "$OUT/persist2.log" || true)
n_raises=$(grep -c '^client: local raise — ' "$OUT/persist2.log" || true)

# N1 — the first half rebound something AND wrote it down. ⚠ Both, because a page that
# bound the key and failed to save says so in its own words, and that is a different
# fault from one that never bound anything.
if [ -z "$n_bound" ]; then
  no "N1 nothing was rebound before the reload — $(grep -m1 'client: rebind' "$OUT/persist1.log" || echo 'the rebinder said nothing at all')"
elif [ "$n_wrote" != "0" ]; then
  no "N1 the rebind happened and could not be written: $(grep -m1 'client: keymap ⚠' "$OUT/persist1.log")"
else
  say "N1 the rebind happened and was written: ${n_bound#client: rebind — }"
fi

# N2 — …and the reloaded page found it. ⚠ THE COUNT IS IN THE SENTENCE: *no saved key
# map* is what a page with no persistence at all prints, and it is not an error — so a
# presence test on `client: keymap —` would pass on exactly the failure being hunted.
case "$n_back" in
  *'1 binding(s) restored'*)
    say "N2 the reloaded page read the keyboard back: ${n_back#client: keymap — }" ;;
  *'no saved key map'*)
    no "N2 the reloaded page found NO key map — the rebind did not survive" ;;
  '') no "N2 the reloaded page never said what it did about a key map" ;;
  *)  no "N2 the reloaded page said '${n_back#client: keymap — }'" ;;
esac

# N3 — and the restored binding WORKS, with the displaced key dead.
#
# ⛔ **TWO PRESSES OF `5` AND ONE OF `ArrowUp`, BECAUSE A TOTAL CANNOT SAY WHICH — and
# the first version of this row could not, measured.** With one of each, *the map
# survived* and *the map did not survive* BOTH produce exactly one raise: one from `5`,
# one from `ArrowUp`, and no line in the transcript names the key. `DEMO_SABOTAGE=nopersist`
# scored this row GREEN while its own N2 read *the reloaded page found NO key map* —
# a true count under a false headline. ⚠ That is this plan's `M6` finding arriving in an
# instrument written after it was recorded, which is why the counts are asymmetric now:
# **2 is the restored key, 1 is the old one, 3 is both, 0 is neither.**
#
# ⚠ And the vacuity guard is that nothing rebound anything after the reload: a run where
# `Escape` leaked through would raise for a reason that is not persistence.
if [ "$n_rebinds" != "0" ]; then
  no "N3 vacuous — something rebound a key AFTER the reload, so the raises say nothing about the saved map"
elif [ "$n_raises" = "2" ]; then
  say "N3 …and it works: after the reload 2 presses of 5 raise twice and ArrowUp does not"
elif [ "$n_raises" = "1" ]; then
  no "N3 one raise from two 5 and one ArrowUp — that is the OLD key still live and 5 dead: the map did not survive"
elif [ "$n_raises" = "3" ]; then
  no "N3 three raises — 5 works AND ArrowUp is still live, so the restored map added a row instead of moving one"
elif [ "$n_raises" = "0" ]; then
  no "N3 nothing raised after the reload — neither the restored key nor the old one"
else
  no "N3 $n_raises raises from two 5 and one ArrowUp after the reload"
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
