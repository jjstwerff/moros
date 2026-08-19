#!/bin/sh
# WHAT WE BUILD AGAINST, AGAINST WHAT THE SIBLING HAS — plan-free, run it any time.
#
# ⛔ **THREE MANIFESTS IN THIS TREE SAID THE REGISTRY WAS *byte-identical to the
# checkout (diffed, not assumed)*, AND ON 2026-08-18 THAT WAS FALSE FOR ALL FOURTEEN
# `hex_*` PACKAGES.** The claim was true when written; a byte-identity claim written
# once is a claim about the day it was written, which is what this script replaces.
#
# It separates prose drift from CODE drift, because they mean different things: a
# comment that moved is housekeeping, a line of code that moved means the tests the
# sibling runs are not testing what we build.
set -u
cd "$(dirname "$0")/../.."
SIB=${SIB:-../loft-libs-world}
[ -d "$SIB" ] || { echo "drift: no sibling checkout at $SIB — nothing to compare"; exit 1; }
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM
seen=0
code=0
out=""
for d in "$SIB"/*/; do
  p=$(basename "$d")
  reg=$(ls -d ~/.loft/registry/$p-*/ 2>/dev/null | sort -V | tail -1)
  [ -n "$reg" ] || continue
  seen=$((seen + 1))
  n=0
  for f in "$d"src/*.loft; do
    b=$(basename "$f")
    if [ ! -f "$reg/src/$b" ]; then n=$((n + 1)); continue; fi
    # ⚠ COMMENTS AND BLANKS STRIPPED, so `differs` means the compiler would see it.
    # ⚠ TEMP FILES RATHER THAN `<(…)`: this repo's scripts run under `sh`, and process
    # substitution is a bashism that dies with `Syntax error: "(" unexpected`.
    grep -vE '^[[:space:]]*//|^[[:space:]]*$' "$reg/src/$b" > "$TMP/a" 2>/dev/null
    grep -vE '^[[:space:]]*//|^[[:space:]]*$' "$f" > "$TMP/b" 2>/dev/null
    k=$(diff "$TMP/a" "$TMP/b" | grep -c '^[<>]')
    n=$((n + k))
  done
  if [ "$n" -gt 0 ]; then
    out="$out$p $n
"
    code=$((code + 1))
  fi
done
# ⚠ THE VACUITY GUARD. *Nothing drifted* and *nothing was compared* are the same
# sentence otherwise, and this script's whole subject is a claim that went stale.
if [ "$seen" -eq 0 ]; then
  echo "drift: NOTHING WAS COMPARED — no registry copy of any sibling package"; exit 1
fi

# ⚠ **A BASELINE, NOT A THRESHOLD, AND THAT IS WHAT LETS THIS LIVE IN `make fast`.**
# The drift is real today and it is not this tree's to fix: a republish is the sibling's
# call. A guard that is red on purpose trains people to ignore it — and `probe/k1` and
# `probe/k2` rotted for exactly that reason. So what is checked is that the drift is
# **the drift we recorded**: it goes red when the sibling's code moves further, and it
# goes red when a republish closes the gap. Both are things this tree wants to be told.
#
#   DRIFT_BLESS=1 sh probe/way/drift.sh    re-record, after reading the diff
BASE=probe/way/drift.txt
if [ "${DRIFT_BLESS:-0}" = "1" ]; then
  printf '%s' "$out" > "$BASE"
  echo "drift: baseline re-recorded — $code of $seen package(s) differ in code"
  exit 0
fi
if [ ! -f "$BASE" ]; then
  echo "drift: no baseline at $BASE — run DRIFT_BLESS=1 sh probe/way/drift.sh"; exit 1
fi
printf '%s' "$out" > "$TMP/now"
# ⛔ **ADVISORY IN `make fast`, AND THAT IS A CORRECTION OF THIS SCRIPT'S FIRST DAY.**
# It was written as a GATE in the fast tier on 2026-08-18 and was red by the next
# morning — not because anything here moved, but because the sibling landed @PLN141
# Phase E rows 6–12 overnight and six packages drifted at once. A check that goes red on
# somebody else's commit rate makes this tree's loop hostage to theirs, which is the
# *red on purpose* trap this script's own comment warns about, walked into while writing
# the warning. So `fast` gets one line and never a failure; `make drift` is the gate,
# for the moment somebody is about to trust a `hex_*` answer.
if [ "${DRIFT_ADVISORY:-0}" = "1" ]; then
  if diff -q "$BASE" "$TMP/now" >/dev/null 2>&1; then
    echo "drift: $seen package(s), $code differing in code — as recorded"
  else
    echo "drift: ⚠ the drift MOVED since it was recorded — $code of $seen package(s) differ in code now."
    echo '       make drift shows which; DRIFT_BLESS=1 sh probe/way/drift.sh re-records.'
  fi
  exit 0
fi
if ! diff -q "$BASE" "$TMP/now" >/dev/null 2>&1; then
  echo "drift: THE DRIFT MOVED — the sibling's code changed, or a republish landed"
  diff "$BASE" "$TMP/now" | sed 's/^/  /'
  echo "  read it, then: DRIFT_BLESS=1 sh probe/way/drift.sh"
  exit 1
fi
echo "drift: $seen package(s) compared, $code differing in code — as recorded"
