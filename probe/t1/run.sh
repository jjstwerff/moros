#!/bin/sh
# RUN ONE `.keys` SCRIPT AGAINST A FRESH NATIVE SERVER, AND MD5 THE WORLD IT SAVED.
# Plan 22 `T1`.
#
#   sh probe/t1/run.sh probe/t1/deck_full.keys t1deckfull
#   sh probe/t1/run.sh probe/t1/coll_pad.keys  t1pad
#
# WHY IT EXISTS. `T1`'s acceptance is byte-equality of a saved world against a running
# sibling, so every question costs one server run — build, listen, drive, save, compare.
# `tools/run-gates.sh` already knows how to do that correctly and would not be the right
# place for it: a gate reports PASS/FAIL, and this reports an md5 that is compared by
# hand against a number in a document.
#
# ⚠ IT TAKES `run-gates.sh`'s PATH EXACTLY, and each step of it was learned there:
#   · the server is BUILT first, because loft's cache is content-addressed and a stale
#     binary otherwise runs old code silently — a whole suite green against yesterday;
#   · it is COPIED to `.gatebin/server`, because a compiled loft program roots its file
#     I/O at its own directory's parent, so from `src/.loft/cache/` every saved world
#     goes somewhere that does not exist;
#   · every server is killed BY PID, never by pattern, because this box runs other
#     agents' work and a port is not an identity.
set -e
cd "$(dirname "$0")/../.."

script=$1
world=${2:-}
[ -n "$script" ] || { echo "usage: run.sh <script.keys> [world-to-md5]"; exit 2; }

free_port() {
  p=$1
  while [ "$p" -lt $((${1} + 200)) ]; do
    if ! ss -ltn "sport = :$p" 2>/dev/null | grep -q ":$p"; then echo "$p"; return 0; fi
    p=$((p + 1))
  done
  echo ""; return 1
}

bport=$(free_port 18760)
blog=$(mktemp)
EDITOR_PORT="$bport" loft --native --lib lib/ src/editor_server.loft > "$blog" 2>&1 &
bpid=$!
i=0
while [ "$i" -lt 2400 ]; do
  grep -q 'listening on port' "$blog" 2>/dev/null && break
  kill -0 "$bpid" 2>/dev/null || break
  sleep 0.25; i=$((i + 1))
done
ok=0; grep -q 'listening on port' "$blog" 2>/dev/null && ok=1
kill "$bpid" 2>/dev/null || true
wait "$bpid" 2>/dev/null || true
# ⚠ `loft --native` FORKS, so the child is reparented and `pgrep -P` cannot see it once
# the wrapper is dead. It is found by the port it holds and killed by pid.
for c in $(ss -lptn "sport = :$bport" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u); do
  kill "$c" 2>/dev/null || true
done
if [ "$ok" -eq 0 ]; then
  echo "t1: the server would not build"
  grep -vE '^warning|^ *\||^ *-->|^ *=|^advice|^note:' "$blog" | tail -20
  rm -f "$blog"; exit 1
fi
rm -f "$blog"

found=$(ls -1d src/.loft/cache/editor_server-* 2>/dev/null | wc -l)
[ "$found" -eq 1 ] || { echo "t1: expected one built server, found $found"; exit 1; }
cand=$(ls -1d src/.loft/cache/editor_server-*)
mkdir -p .gatebin/.loft
cp "$cand" .gatebin/server.new && mv .gatebin/server.new .gatebin/server
[ -f src/.loft/editor_client.html ] \
  && cp src/.loft/editor_client.html .gatebin/.loft/editor_client.html || true

port=$(free_port 18820)
parts=$(mktemp -d)
cp -r data/parts/. "$parts/" 2>/dev/null || true
log=$(mktemp)
EDITOR_PORT="$port" EDITOR_PARTS="$parts" "$(pwd)/.gatebin/server" > "$log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null; rm -rf "$parts"' EXIT INT TERM HUP
i=0
while [ "$i" -lt 240 ]; do
  grep -q 'listening on port' "$log" 2>/dev/null && break
  kill -0 "$pid" 2>/dev/null || break
  sleep 0.25; i=$((i + 1))
done
# ⚠ TWO FAILURES, TOLD APART BY THE PID RATHER THAN THE CLOCK — `probe/k1`'s finding,
# 2026-08-29. *Still starting* and *died on the way up* read identically in a log tail,
# and one of them is a defect in the binary this probe just built.
grep -q 'listening on port' "$log" 2>/dev/null || {
  if kill -0 "$pid" 2>/dev/null; then
    echo "t1: the server is STILL STARTING after 60 s — it never listened"
  else
    echo "t1: the server EXITED without listening — the built binary died on the way up:"
  fi
  tail -20 "$log"; exit 1; }

EDITOR_PORT="$port" node tools/script.mjs "$script" || echo "t1: script.mjs exit $?"
kill "$pid" 2>/dev/null || true
wait "$pid" 2>/dev/null || true
[ -n "$world" ] && md5sum "worlds/$world.hxw"
