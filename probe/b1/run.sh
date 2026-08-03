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
node probe/b1/browser_shot.mjs src/.loft probe/b1/client_panel.png /editor_client.html
node probe/b1/panel.mjs probe/b1/client_panel.png

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
