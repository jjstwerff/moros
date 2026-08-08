#!/bin/sh
# DOES OPENING A SECOND PART LEAVE THE FIRST ONE ON SCREEN? — the picture half.
#
# ⚠ NO WIRE PROBE CAN ANSWER THIS, and that is the whole reason the file exists.
# The server's clear is CORRECT: `held.mjs` models the client's own bookkeeping and
# reports `door/leaf` holding 30 floor vertices and no wall. The browser drew 300
# vertices of wall anyway, because `add_mesh` returned on `len(mverts) < 6` — the
# clearing message, a colour and no vertices — **before** reaching `drop_part`.
# Wire says gone, picture says standing. Only pixels separate them.
#
#   probe/a83/leaf_visible/switch.sh      # exit 0 = the second part is drawn alone
#
# ⚠ THE THRESHOLD IS MEASURED, NOT CHOSEN. Broken: 13014 wall-classified pixels.
# Fixed: 394 — the cart's dark faces and the figure's shaded edges, which a
# chromaticity classifier puts nearest `wall` and which are in the frame either way.
# 2000 sits 5x above the noise and 6x below the fault; both numbers were taken on
# this box, by reverting the one line and rebuilding the client.
set -eu

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PORT=${PROBE_PORT:-18097}
TMP=$(mktemp -d)
PID=""
cleanup() {
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true; sleep 2
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM
cd "$ROOT"

cat > "$TMP/switch.keys" <<'EOF'
# `door/frame` first, then `door/leaf` — the order that showed the fault. The leaf
# is ONE cell and one panel; anything grey in this picture belongs to the frame.
send 44:
at 0 0 0
key ArrowUp
wait rebuilt
send 40:0
wait mode
send 44:door/frame
wait part 'door/frame' opened
at 0.0 -5.5 70
snap switch-frame
send 44:
send 44:door/leaf
wait part 'door/leaf' opened
at -2.5 -2.5 35
snap switch-leaf
snap switch-leaf
send 44:
EOF

EDITOR_PORT="$PORT" nohup loft --interpret --lib lib/ src/editor_server.loft \
  >"$TMP/editor.log" 2>&1 &
PID=$!
i=0
while [ "$i" -lt 120 ]; do
  grep -q 'listening on port' "$TMP/editor.log" 2>/dev/null && break
  kill -0 "$PID" 2>/dev/null || { echo "FAIL — the server exited"; tail -5 "$TMP/editor.log"; exit 1; }
  sleep 1; i=$((i + 1))
done
grep -q 'listening on port' "$TMP/editor.log" || { echo "FAIL — SERVER NEVER LISTENED"; exit 1; }

node tools/script.mjs "$TMP/switch.keys" --port "$PORT" --shots >"$TMP/script.log" 2>&1 \
  || { echo "FAIL — the script did not finish"; tail -10 "$TMP/script.log"; exit 1; }

python3 - <<'PY'
from PIL import Image
PAL = {'grass':(0.42,0.50,0.30),'road':(0.30,0.18,0.15),'field':(0.55,0.62,0.24),
       'tree':(0.16,0.34,0.14),'roof':(0.45,0.20,0.17),'wall':(0.55,0.52,0.46),
       'floor':(0.65,0.40,0.25),'frame':(0.78,0.74,0.65),'soffit':(0.34,0.30,0.36),
       'figure':(0.80,0.60,0.45),'sky':(0.48,0.55,0.64)}
def ch(c):
    t = sum(c)
    return (0, 0, 0) if t <= 0 else tuple(x / t for x in c)
PC = {k: ch(v) for k, v in PAL.items()}
def cl(p):
    if sum(p) < 12: return 'black'
    c = ch([v / 255 for v in p])
    return min(PC, key=lambda k: sum((a - b) ** 2 for a, b in zip(c, PC[k])))
def wall(name):
    im = Image.open(f'shots/{name}.png').convert('RGB'); W, H = im.size; px = im.load()
    return sum(1 for y in range(25, H - 20, 2) for x in range(240, W, 2) if cl(px[x, y]) == 'wall')
f, l = wall('switch-frame'), wall('switch-leaf')
print(f"  door/frame wall pixels {f}   door/leaf after it {l}")
# ⚠ THE FRAME'S OWN COUNT IS THE CONTROL. Without it a blank canvas passes: zero
# wall pixels everywhere would satisfy the leaf's claim and prove nothing drew.
if f < 3000:
    raise SystemExit(f"FAIL — door/frame drew only {f} wall pixels; the probe is blind")
if l > 2000:
    raise SystemExit(f"FAIL — door/leaf holds {l} wall pixels of the frame that preceded it")
print("  PASS the second part is drawn alone")
PY
