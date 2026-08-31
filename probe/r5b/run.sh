#!/bin/sh
# WHAT `R5b` COSTS THE WALK — plan 21.
#
#   sh probe/r5b/run.sh
#
# ⛔ **`B4e` REFUSED TO RESOLVE AN EDGE BYTE FOR THIS EXACT REASON**, in its own
# words: *"every caller holds a byte and no world — the walk asks this per edge per
# step."* `R5b` pays that cost, so it is measured rather than argued, and the subject
# is `edges_around` itself rather than a copy of its loop — a body copied into a probe
# is evidence about the copy (`probe/a0q`).
#
# ⛔ **THE A/B IS ACROSS TWO BUILDS**, because which predicate the walk calls is a
# source-level fact. So it is **A-B-B-A at the build level**, and each run is
# internally A-B-B-A over the same call.
#
# ⛔ **AND THE LOAD IS PRINTED WITH EVERY ROW, WHICH IS NOT DECORATION.** The first
# version of this script read AFTER / BEFORE / AFTER and its two AFTER rows came back
# **186 ms and 474 ms — the same binary, the same program, 2.5× apart**, because this
# box runs other agents' work. `peel.loft`'s lesson one probe over: *an extrapolation
# is not a measurement even when every point in it was.* ⚠ **The load-robust number is
# `probe/roles/cost.loft`'s**, which is A-B-B-A inside ONE process; this one says
# whether that per-call cost shows up in the scan at all.
#
# ⚠ **THE SWAP IS RESTORED FROM A COPY, NEVER `git checkout`** — CLAUDE.md's sweep
# rule: the subject is uncommitted while this is written, and a revert would delete it
# and make every row read as *nothing changed*.
set -u
cd "$(dirname "$0")/../.." || exit 1
W=lib/hex_editor/src/walk.loft
TMP=$(mktemp -d); trap 'cp "$TMP/walk.loft" "$W"; rm -rf "$TMP"' EXIT INT TERM
cp "$W" "$TMP/walk.loft"

# The subject must be PRESENT before the first row, or this measures nothing.
grep -q 'wall_stops_walk_at(wld, q, r' "$W" || { echo "⛔ the walk is not wired — nothing to measure"; exit 1; }

wire() { python3 probe/r5b/wire.py "$W" "$1" || exit 1; }
say()  { printf '\n== %s ==   load %s\n' "$1" "$(cut -d' ' -f1 /proc/loadavg)"
         (cd probe/r5b && loft edges.loft --lib ../../lib 2>&1) \
           | grep -E '^(blocked|open|walled)'; }

wire wired; say "A1  AFTER  — edges_around asks edge_role_at"
wire bytes; say "B1  BEFORE — edges_around asks the byte pair"
wire bytes; say "B2  BEFORE — again"
wire wired; say "A2  AFTER  — again"

cp "$TMP/walk.loft" "$W"
printf '\nrestored: '
diff -q "$TMP/walk.loft" "$W" >/dev/null && echo "walk.loft identical to the saved subject"
