#!/bin/sh
# Serve ONE page from a real editor server and report what the page did.
#
#   sh probe/t5/attach.sh <page.html> <tag> [keys]
#
# The smallest thing that can answer *does this page attach* — a real server, the
# real `/client` route, headless chrome, and the page's own console beside the
# server's. It exists because `probe/t5/run.sh`'s first run came back with the page
# booted, connected, and then dead on `RuntimeError: unreachable`, which is a
# question about the PAGE and not about probe 5.
#
# ⚠ IT RESTORES NOTHING. The caller owns `src/.loft/editor_client.html`, because the
# point of this script is to run pages the tree does not currently hold.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/t5/out
PAGE=src/.loft/editor_client.html
PORT=${EDITOR_PORT:-18090}
mkdir -p "$OUT"

SRC=$1; TAG=$2; KEYS=${3:-ArrowUp}

cp "$SRC" "$PAGE"
printf '%s\n' "── $TAG — $(( $(wc -c < "$PAGE") / 1024 )) KB from $SRC"
make -s port-free > /dev/null 2>&1 || true
: > "$OUT/$TAG.server"
nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/$TAG.server" 2>&1 &
pid=$!
i=0
while [ "$i" -lt 240 ]; do
  grep -q 'listening on port' "$OUT/$TAG.server" && break
  kill -0 "$pid" 2>/dev/null || break
  sleep 1
  i=$((i + 1))
done
if ! grep -q 'listening on port' "$OUT/$TAG.server"; then
  printf '%s\n' "  server never listened:"; tail -10 "$OUT/$TAG.server"
  kill "$pid" 2>/dev/null; exit 1
fi

timeout 300 node probe/b1b/press.mjs "http://127.0.0.1:$PORT/client" "$KEYS" \
  --await 'edits go to the server' --wait-ms 60000 > "$OUT/$TAG.raw" 2>&1
rc=$?
make -s stop-editor > /dev/null 2>&1 || true
wait "$pid" 2>/dev/null || true

printf '%s\n' "  press.mjs rc $rc"
printf '%s\n' "  exceptions: $(grep -c '^\[exception\]' "$OUT/$TAG.raw")  $(grep -m1 '^\[exception\]' "$OUT/$TAG.raw")"
printf '%s\n' "  connected:  $(grep -c 'client: connected to' "$OUT/$TAG.raw")"
printf '%s\n' "  attached:   $(grep -c 'edits go to the server' "$OUT/$TAG.raw")"
printf '%s\n' "  last client line: $(grep '^client' "$OUT/$TAG.raw" | tail -1)"
printf '%s\n' "  frames:     $(grep -c '^client: [0-9]* frames' "$OUT/$TAG.raw")"
printf '%s\n' "  server saw: $(grep -c '^editor: client' "$OUT/$TAG.server") client line(s), digests $(grep -c '^editor: client cache' "$OUT/$TAG.server")"
