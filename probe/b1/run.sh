#!/bin/sh
# B1.1 — does the loft text bridge put legible pixels on the canvas, on BOTH targets?
#
# The probe #18's whole B1 arc rests on. Until 2026-08-03 the `--html` text
# bridge was a no-op stub, so a HUD built on it would have compiled, run, and
# drawn nothing. This answers the question before four steps are built on it.
#
# Three instruments, because no one of them can see all three failures:
#
#   text_cpu.loft   the rasteriser writes coverage        (an exact pixel COUNT)
#   text_gl.loft    the GL route reaches the back buffer  (desktop, gl_screenshot)
#   browser_shot    the same route reaches the CANVAS     (headless Chrome + CDP)
#
# Each carries its control IN THE SAME FRAME: text goes in the left half and
# nothing in the right, so "it drew something" cannot pass for "it drew
# something where asked". `shot.mjs` is checked against a blank frame and an
# all-white one before it is trusted to report either.
set -e
cd "$(dirname "$0")/../.."
LOFT="${LOFT:-loft}"

# ⚠ STOP THE SERVER WHATEVER HAPPENS. Two stages below start one, and with
# `set -e` a failing check exits between the start and the stop — leaving an
# editor holding port 18090 and a core busy until somebody notices. A forgotten
# one sat at 76% of a core indefinitely once, which is why CLAUDE.md says to stop
# what you start; a trap is that rule where it cannot be skipped.
trap 'make -s stop-editor >/dev/null 2>&1 || true' EXIT

echo "── B1.1a  the rasteriser (desktop, CPU, no window) ─────────────────"
$LOFT --interpret --path ../loft/ --lib lib/ probe/b1/text_cpu.loft 2>/dev/null \
  | grep -E 'font handle|measure:|RESULT|B1.1-cpu'

echo
echo "── B1.1b  the GL route (desktop, headless via xvfb) ────────────────"
xvfb-run -a $LOFT --interpret --path ../loft/ --lib lib/ probe/b1/text_gl.loft 2>/dev/null \
  | grep -E 'metrics:|MONO check|RESULT'
node probe/b1/shot.mjs probe/b1/gl_text.png

echo
echo "── B1.1c  the instrument, checked against what it SHOULD reject ────"
# ⚠ Before believing either verdict above. A reader that passes everything and a
# reader that fails everything are both useless, and they look identical from
# one green run.
#
# The all-white control is BUILT HERE rather than committed, so the check cannot
# quietly rot into "compare a file against itself". Nothing in this directory is
# committed except the sources: every picture is an output.
python3 - <<'EOF'
import zlib, struct
w, h = 480, 120
raw = b''.join(b'\x00' + b'\xff' * (w * 3) for _ in range(h))
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(raw))
       + chunk(b'IEND', b''))
open('probe/b1/ctrl_white.png', 'wb').write(png)
EOF
node probe/b1/shot.mjs probe/b1/cpu_blank.png  && echo "  !! blank frame PASSED — the reader is blind" && exit 1
node probe/b1/shot.mjs probe/b1/ctrl_white.png && echo "  !! all-white PASSED — the reader is blind" && exit 1
node probe/b1/shot.mjs probe/b1/cpu_text.png   || { echo "  !! real text FAILED — the reader rejects everything"; exit 1; }
echo "  reader verified: rejects blank, rejects all-white, accepts real text"

echo
echo "── B1.1d  the browser (the half that was actually broken) ──────────"
( cd probe/b1 && $LOFT --html --path ../../../loft/ text_gl.loft >/dev/null 2>&1 )
node probe/b1/browser_shot.mjs probe/b1/.loft probe/b1/html_text.png
node probe/b1/shot.mjs probe/b1/html_text.png

echo
echo "── B1.3  the PANEL, in the client's own picture ────────────────────"
# ⚠ THE CLIENT, NOT A PROBE. Everything above tests the bridge; this tests the
# thing #18 is actually building, in the program that will ship it. It needs no
# server: the panel draws whether or not a world has arrived, which is itself
# worth knowing — a HUD that only appears once the world does is a HUD that
# cannot report the world failing to arrive.
$LOFT --html --lib lib/ src/editor_client.loft >/dev/null 2>&1
shot_out=$(node probe/b1/browser_shot.mjs src/.loft probe/b1/client_panel.png /editor_client.html)
echo "$shot_out"
node probe/b1/panel.mjs probe/b1/client_panel.png

echo
echo "── B1.6  the library's widths against the bridge's ─────────────────"
# The whole metrics seam in one number. lavition_ui lays out every box with
# text_width(s, metrics); the bridge is what rasterises the string. If they
# disagree, every label is fitted against a number that is not the font -- and
# the picture still draws, just in the wrong place.
#
# ⚠ SEEN RED FOR REAL: a whole-pixel advance read 31px narrow on the subject
# line, because 9.6px truncates to 9 and the error is per character. The advance
# is kept in 1/64px now and rounded UP, since an over-estimate reserves a pixel
# too many while an under-estimate overflows a box measured as fitting.
drift=$(printf '%s\n' "$shot_out" | sed -n 's/.*metrics drift \([0-9][0-9]*\)px.*/\1/p' | head -1)
ctrl=$(printf '%s\n' "$shot_out" | sed -n 's/.*control \([0-9][0-9]*\)px.*/\1/p' | head -1)
[ -n "$drift" ] || { echo "  !! the client reported no drift line at all"; exit 1; }
[ "$drift" -le 1 ] || { echo "  !! drift ${drift}px - the library and the bridge disagree"; exit 1; }
# ⚠ The control, and it is why a 0 here means anything: bend the advance by a
# tenth and the same measurement must move. Without it, a broken comparison and
# a perfect agreement are the same number.
[ "$ctrl" -ge 5 ] || { echo "  !! control ${ctrl}px - a 10% wrong advance was NOT caught"; exit 1; }
echo "  ok    drift ${drift}px, and a 10% wrong advance reads ${ctrl}px"

echo
echo "── B2  the subject line comes from the SERVER, in the client ────────"
# ⚠ AGAINST A LIVE SERVER, and served BY it. The client opens
# ws://127.0.0.1:18090/ws as a compile-time constant (a --html program cannot
# read `location`), so a page served from anywhere else loads, draws its panel
# perfectly, and never connects -- 300 frames, 0 meshes, and a subject line still
# saying "awaiting the server". It reads as a broken client and is a page served
# by the wrong host.
make -s stop-editor >/dev/null 2>&1 || true
: > .editor.log
nohup $LOFT --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 &
until grep -q 'listening on port' .editor.log 2>/dev/null; do sleep 0.5; done
b2_out=$(SHOT_SETTLE_MS=9000 node probe/b1/browser_shot.mjs http://127.0.0.1:18090/ probe/b1/client_live.png)
make -s stop-editor >/dev/null 2>&1 || true
printf '%s\n' "$b2_out" | sed -n 's/^  | client: \(subject line\|connected\).*/  \0/p'
printf '%s\n' "$b2_out" | grep -q 'client: connected' \
  || { echo "  !! the client never connected - nothing here measures the server"; exit 1; }
# The client keeps `H:` VERBATIM and has no code path that composes a line of its
# own, so seeing the server's exact words in its log is what says the picture is
# the server's line rather than the client's guess.
printf '%s\n' "$b2_out" | grep -q 'subject line ← world ' \
  || { echo "  !! the client never took a subject line from the server"; exit 1; }
printf '%s\n' "$b2_out" | grep -q 'awaiting the server' \
  && { echo "  !! the client is still showing its placeholder"; exit 1; }
node probe/b1/panel.mjs probe/b1/client_live.png --swatches >/dev/null \
  || { echo "  !! the live client's panel does not measure up"; exit 1; }
echo "  ok    the client shows the server's line and its panel measures up"

echo
echo "── B5.2  the part thumbnail, and the two pictures it must not be ───"
# §C4: a catalogue image is RENDERED, so a part's row carries the PART -- meshed
# by the server (its walls come from `chunk_mesh_props`, which the client has no
# access to) and drawn by the client with the world's own shader, through a
# canonical three-quarter camera the server fitted to the part's own vertices.
#
# ⚠ THE CLIENT'S COUNT IS NOT THE PICTURE, and this exact function has taught that
# twice: nine swatches "rendered" that collapsed to a line in clip space, and nine
# more dropped whole when a shared framebuffer got a mismatched depth attachment.
# The count is checked because it is cheap and it names WHICH family failed; the
# picture is checked because it is the claim.
printf '%s\n' "$b2_out" | grep -qE 'client: [0-9]+ swatches and [1-9][0-9]* thumbnails' \
  || { echo "  !! the client rendered no thumbnail at all"; exit 1; }
printf '%s\n' "$b2_out" | grep 'swatches and' | sed 's/^  |/   |/'
# ⚠ THE PER-ROW NUMBERS ARE PRINTED, not just a verdict. `1,1,1,1,1,1,1,1,1,4`
# says at a glance which row is a part and which are flat swatches; a bare "ok"
# says only that today's threshold was met.
#
# ⚠ AND THE GAP IS `  *`, NOT TWO SPACES. `check()` pads its verdict to four
# characters, so a pattern written with the two spaces the source appears to have
# matched nothing — this filter silently printed no lines at all for as long as it
# has existed, and the surrounding `ok` made that look like a quiet pass.
node probe/b1/panel.mjs probe/b1/client_live.png --swatches \
  | sed -n 's/^  \(ok\|FAIL\)  *\(every catalogue\|no row.s image\|the images are\|at least one row\|and the material\).*/  &/p'

# ⚠ THE CONTROLS, AND THE SECOND ONE IS WHY THE FIRST IS NOT ENOUGH. A blank row
# is the failure a thumbnail HAS; a BLACK row is the failure `B5.1` actually
# shipped, and it is not blank -- it has as much ink as any swatch. A reader that
# only asked "is there something there" passed it for a day.
node probe/b1/deface.mjs probe/b1/client_live.png probe/b1/ctrl_blank_row.png blank >/dev/null
node probe/b1/panel.mjs probe/b1/ctrl_blank_row.png --swatches >/dev/null 2>&1 \
  && { echo "  !! a catalogue with a BLANK part row PASSED -- the reader is blind"; exit 1; }
node probe/b1/deface.mjs probe/b1/client_live.png probe/b1/ctrl_black_row.png black >/dev/null
node probe/b1/panel.mjs probe/b1/ctrl_black_row.png --swatches >/dev/null 2>&1 \
  && { echo "  !! a catalogue with a BLACK part row PASSED -- the reader cannot see"; \
       echo "     the defect B5.1 shipped, which is the one it exists for"; exit 1; }
echo "  reader verified: rejects a blank part row, and rejects a black one"

echo
echo "── B5.3  the thumbnail follows the part on disk ─────────────────────"
# The claim: change a part while the author is looking at it, and the picture in
# the catalogue changes. ⚠ **That it CHANGES, not that it is non-blank** — a
# thumbnail that never invalidates is non-blank on every frame of its life, so
# "there is a picture there" is exactly the check a broken cache passes.
#
# ⚠ ONE PAGE LOAD SPANS THE CHANGE, and two runs of the shot script would not do.
# A second run reconnects, and a fresh connection is served the server's cache
# like any new tab: it would prove the server re-meshed and say nothing about
# whether a live client ever hears. Those are different code paths and only one of
# them is the feature. `SHOT_BETWEEN` runs while the page stays up.
#
# ⚠ AND IT RUNS AGAINST A SCRATCH PARTS ROOT (`EDITOR_PARTS`), never
# `data/parts/`. Editing a committed file under a running gate would corrupt
# whatever else is in this tree -- two agents work here -- and a gate that leaves
# the repository dirty when it fails is worse than no gate.
b53=$(mktemp -d)
mkdir -p "$b53/parts/house"
cp data/parts/house/cottage.hxw "$b53/parts/house/cottage.hxw"
# The other part: the same house at a wider radius. ⚠ NOT a taller roof, which was
# the first choice and is a shape the editor should not make: measured in the part
# files, `roof_up` lifts the roof's EAVE while the walls stay at WALL_UP=12, so
# `14:28` gives roof cells at 28..36 over a wall head of 12 -- a roof floating 16
# units above its own house. The roof fence admits up to 400. That is a stencil
# defect (see OPEN_ISSUES) and a fixture must not encode one; radius changes the
# house without changing whether it is a house.
PART_RADIUS=4 PART_OUT="$b53/wide.hxw" $LOFT --interpret --lib lib/ src/part_build.loft >/dev/null 2>&1
make -s stop-editor >/dev/null 2>&1 || true
: > .editor.log
EDITOR_PARTS="$b53/parts" nohup $LOFT --interpret --lib lib/ src/editor_server.loft > .editor.log 2>&1 &
until grep -q 'listening on port' .editor.log 2>/dev/null; do sleep 0.5; done
b53_out=$(SHOT_SETTLE_MS=9000 SHOT_AGAIN=probe/b1/thumb_after.png SHOT_AGAIN_MS=4000 \
  SHOT_BETWEEN="cp $b53/wide.hxw $b53/parts/house/cottage.hxw" \
  node probe/b1/browser_shot.mjs http://127.0.0.1:18090/ probe/b1/thumb_before.png)
printf '%s\n' "$b53_out" | grep 'thumbnails rendered' | sed 's/^  |/   |/'
node probe/b1/rowdiff.mjs probe/b1/thumb_before.png probe/b1/thumb_after.png differ \
  || { echo "  !! the part changed on disk and the picture did not"; exit 1; }

# ⚠ AND THE OLD GEOMETRY WENT AWAY, which the picture cannot say. A replacement
# that failed to DROP the previous meshes would draw both houses on top of each
# other -- a picture that has certainly changed, so the row-diff above passes it
# happily, and a leak of a vertex buffer per surface per rebuild besides. Only
# `arrived` against `held` can see it.
b53_last=$(printf '%s\n' "$b53_out" | grep -o '[0-9]* thumbnail meshes arrived, [0-9]* held' | tail -1)
b53_arr=$(printf '%s' "$b53_last" | sed 's/ thumbnail meshes arrived,.*//')
b53_held=$(printf '%s' "$b53_last" | sed 's/.*arrived, //; s/ held//')
[ -n "$b53_arr" ] && [ -n "$b53_held" ] \
  || { echo "  !! the client never reported what it holds"; exit 1; }
[ "$b53_arr" -gt "$b53_held" ] \
  || { echo "  !! $b53_arr meshes arrived and $b53_held are held - the old set was never dropped"; exit 1; }
echo "  ok    $b53_arr thumbnail meshes arrived and $b53_held are held - the old set was retired"

# ⚠ THE CONTROL, and without it "it changed" is measuring the renderer's noise
# rather than the cache. Two shots of an UNCHANGED part must be identical in that
# row -- not close, identical -- or anti-aliasing landing differently would read
# as an invalidation.
b53_out2=$(SHOT_SETTLE_MS=9000 SHOT_AGAIN=probe/b1/thumb_still2.png SHOT_AGAIN_MS=4000 \
  SHOT_BETWEEN="true" \
  node probe/b1/browser_shot.mjs http://127.0.0.1:18090/ probe/b1/thumb_still1.png)
node probe/b1/rowdiff.mjs probe/b1/thumb_still1.png probe/b1/thumb_still2.png same \
  || { echo "  !! the thumbnail moved with nothing to move it - the diff is noise"; exit 1; }
make -s stop-editor >/dev/null 2>&1 || true
rm -rf "$b53"

echo
echo "── B1.3c  and the panel reader, against pictures with no panel ─────"
node probe/b1/panel.mjs probe/b1/gl_text.png >/dev/null 2>&1 \
  && { echo "  !! a panel-less picture PASSED — the reader is blind"; exit 1; }
node probe/b1/panel.mjs probe/b1/ctrl_white.png >/dev/null 2>&1 \
  && { echo "  !! an all-white frame PASSED — the reader is blind"; exit 1; }
echo "  reader verified: rejects a picture with no panel in it"

echo
echo "B1.1 PASS — text reaches the canvas on both targets."
echo "B1.3 PASS — the panel is in the client's picture, measured not eyeballed."
echo "⚠ See probe/b1/README.md: it drew, and the FONT is not what was asked for."
