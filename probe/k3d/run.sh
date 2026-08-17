#!/bin/sh
# K3D — WHAT DOES EVERY LIVE SCRIPT BUILD, AND WOULD ANYTHING SAY IF IT STOPPED?
#
#   sh probe/k3d/run.sh               every script in `tools/scripts/`, against its baseline
#   K3D_BLESS=1 sh probe/k3d/run.sh   re-record the baselines, on purpose, diff shown first
#
# Plan 22 `K3d`. `K3b` deleted the `key <K>` spelling and took `probe/k2` with it — and
# `probe/k2`'s whole reason for existing was that ten of these scripts are driven by
# **nobody** automatically. `make gate` runs `cache`, `indoors`, `cellar`, `clientmesh`
# and `deck`; measured over the corpus, **fourteen** of the thirty are named by no check
# in this tree at all. This is their regression check, and it is deliberately NOT a diff
# against a second spelling — that is the instrument that just retired.
#
# ── ⛔ THE WORLD ALONE WOULD HAVE BEEN BLIND, AND THAT IS MEASURED, NOT FEARED ──
#
# The obvious baseline is the saved world. Measured on the corpus at `GROUND=0`:
#
#     a7da870fc0b92932dd190d41d54e94a2   cache, slab, doorparts, doorway
#
# ⛔ **`slab.keys`, whose entire subject is a floor with a thickness, keys the world a
# bare `verb raise` keys** — and it is not broken: it prints `a slab 2 units thick at
# 0,6 — ceiling 10, floor above 12, clear 10`, and a slab is a SESSION record like a
# prop or a seat, not a store write. So deleting `verb hole` from it leaves the saved
# bytes **identical** and moves `holes 1 -> 0` in the session digest, which is why the
# record below is a PAIR and row C sabotages both halves.
#
# ⚠ **AND THE SESSION DIGEST IS COUNTS, NOT GEOMETRY** — `slabs 1 holes 1` says nothing
# about the height the slab landed at. The gestures' own printed sentences are the only
# place those numbers appear, so the record keeps them. It drops the `--- ` echoes: a
# script's own comment played back is the script's input, and an instrument that reads
# its input can be surprised by nothing.
#
# ── WHAT EACH ROW MEANS IF IT FLIPS ───────────────────────────────────────────
#
#   A  every live script still builds what it built
#      → red means a gesture, a reported number, a τ or a refusal moved. That is either
#        a regression or a change worth blessing on purpose — the diff says which
#   B  the corpus and the baselines are the SAME SET
#      → red means a script was added with no baseline (and would otherwise be covered
#        by nothing while sitting in a directory that looks covered), or a baseline
#        outlived its script. `tools/layering.sh` skipped every `moros_*` package for
#        months; a guard with a quiet exemption is the failure mode being avoided here
#   C  the pair has TEETH — a press deleted from a live script goes red
#      → red means this whole probe has become a set of constants agreeing about
#        emptiness. This is `K3d`'s own acceptance: *it must go red on a press DELETED
#        from a live script*
#   D  the coverage report — which scripts this instrument CANNOT tell apart
#      → red means two scripts became indistinguishable in what they build, or stopped
#        being. Either is a fact about coverage and neither may arrive silently
#
# ⚠ **ROW D IS `K3c`'s FINDING MADE PERMANENT.** Six scripts keyed one world there and
# nobody had looked; the collision was visible the whole time to anyone who ran the
# corpus. It is now printed and asserted every run, so *thirty scripts have a baseline*
# can never be read as *thirty subjects are covered*.
#
# ── WHAT THIS PROBE DOES NOT CLAIM, SAID RATHER THAN LEFT QUIET ───────────────
#
# ⛔ **IT CANNOT SEE A CAMERA, A LIGHT OR A PICTURE, AND SIX SCRIPTS ARE NOTHING ELSE.**
# `ceiling`, `cutaway`, `eyes`, `floorprobe`, `indoors` and `lamp` raise ground, place a
# house, and spend every remaining line on `send 40:` modes, `send 3:` looks, `snap` and
# `frame` — so all six leave the SAME world and the SAME session, to the byte. Row A
# still separates them, but only by the stations the author stood at. Their subject needs
# a server and a browser, and exactly ONE of them has a check that can see it:
#   `indoors`                        `camera_indoors.mjs` — the pictures themselves
#   `cutaway` `eyes` `floorprobe`    `probe/k3c` row B, which asserts `rc = 0` and
#                                    NOTHING else: they are that row's control
#   `ceiling` `lamp`                 nothing at all
# **That is a live coverage hole this probe does not fill and must not appear to** — it
# is row D's first group for exactly that reason, and plan 22 `K3f`.
#
# ⚠ It runs no server and opens no socket, so it says nothing about what the SERVER
# builds from the same script. `probe/t4` is where that comparison lives, for the two
# scripts whose worlds have been measured through both drivers.
#
# ⚠ It baselines at `GROUND=0` — *start where the editor starts*, `editor_run`'s own
# words, and the setting under which `deck` and `cellar` equal the server byte for byte.
# The default seeds a photographable patch and would key a different world for every
# script in the corpus.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/k3d/out
BASE=probe/k3d/base
CORPUS=tools/scripts

rm -rf "$OUT" && mkdir -p "$OUT" "$BASE"
# ⚠ **A STALE WORLD MUST NEVER BE READ, AND A CONCURRENT RUN IS THE WAY THAT HAPPENS.**
# `probe/k2b` had two copies of itself sharing `worlds/k2b-a.hxw`, so a byte comparison
# could have passed on a world the OTHER process built — and this probe is in `make fast`
# while its own sweep runs it nine times, on a box that carries other agents' work.
#
# ⚠ **THE PID IN THE NAME RATHER THAN A LOCK, DELIBERATELY.** A lock directory is the
# atomic test-and-set a shell has, and it also outlives a run that was killed — which is
# how it becomes a file that refuses every future run with *another run holds this*
# (`.gitignore` says so, from `probe/k2b`). Distinct names need no release.
TAG=k3d-$$
rm -f "worlds/$TAG-"*.hxw
# …and a killed run's worlds are swept by age, which cannot touch a live one.
find worlds -maxdepth 1 -name 'k3d-*.hxw' -mmin +60 -delete 2>/dev/null
fails=0

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok   $*"; }
bad()  { say "  FAIL $*"; fails=$((fails + 1)); }

# ⚠ THE COST IS THE COMPILER, NOT THE SCRIPT — `probe/k3c`'s measurement, and it holds
# here: thirty runs in a pool of six is 17 s, in series it would be over a minute. The
# pool is capped by the box and not by the work; this machine carries other agents'.
JOBS=${K3D_JOBS:-6}
started=0

launch() {       # launch <script-path> <tag>
  ( GROUND=0 SCRIPT="$1" WORLD="$TAG-$2" $LOFT --lib lib/ src/editor_run.loft \
      > "$OUT/$2.log" 2>"$OUT/$2.err"
    echo $? > "$OUT/$2.rc" ) &
  started=$((started + 1))
  if [ "$((started % JOBS))" -eq 0 ]; then wait; fi
}

# ── THE RECORD: EVERYTHING THIS DRIVER CAN HONESTLY SEE, AND NOTHING ELSE ─────
#
# ⚠ **THE SCRIPT'S LINE COUNT IS DELIBERATELY NOT IN IT.** `editor_run` prints
# `42 lines, 2 chunks, τ 92`, and these scripts are documentation as much as fixtures —
# a baseline that goes red when somebody adds a comment gets blessed reflexively, and a
# check that is blessed without being read is not a check. τ, the chunk count and the
# save code are behaviour; the line count is prose.
#
# ⚠ **AND THE WORLD'S FILENAME IS NOT IN IT EITHER.** `probe/k2b` was red on all 31
# scripts the first time it ran partly because the two sides wrote worlds under
# different names and the runner prints its own summary line.
record() {       # record <tag> — a normalised, diffable record of one run
  t=$1
  log=$OUT/$t.log
  sum=$(grep -m1 ' chunks, ' "$log")
  echo "rc: $(cat "$OUT/$t.rc")"
  echo "world: $(sed -n 's/^editor_run: world //p' "$log" | tail -1)"
  echo "md5: $(md5sum < "worlds/$TAG-$t.hxw" 2>/dev/null | cut -d' ' -f1)"
  echo "tau: $(printf '%s' "$sum" | sed -n 's/.*τ \([0-9-]*\).*/\1/p')"
  echo "chunks: $(printf '%s' "$sum" | sed -n 's/.*, \([0-9]*\) chunks.*/\1/p')"
  echo "code: $(printf '%s' "$sum" | sed -n 's/.*(code \([0-9-]*\)).*/\1/p')"
  echo "$(grep -m1 '^session: ' "$log")"
  echo "$(grep -m1 '^chosen: ' "$log")"
  echo '--- what the gestures reported'
  grep '^  ' "$log" | grep -v '^  --- '
  echo '--- what the runner refused'
  grep '^editor_run: ' "$log" | grep -v '^editor_run: world \|^editor_run: [0-9][0-9]* lines,'
}

# The two sabotage fixtures row C reads, written before anything is launched so the
# pool below is one wave rather than three.
awk '/^verb run$/ && !cut { cut = 1; next } { print }' \
    "$CORPUS/wall.keys" > "$OUT/sab-wall.keys"
grep -v '^verb hole$' "$CORPUS/slab.keys" > "$OUT/sab-slab.keys"

names=""
for s in "$CORPUS"/*.keys; do
  n=$(basename "$s" .keys)
  names="$names $n"
  launch "$s" "$n"
done
launch "$PWD/$OUT/sab-wall.keys" sab-wall
launch "$PWD/$OUT/sab-slab.keys" sab-slab
wait

for n in $names sab-wall sab-slab; do record "$n" > "$OUT/$n.txt"; done

# ── BLESS ─────────────────────────────────────────────────────────────────────
#
# ⚠ REGENERABLE ON PURPOSE, AND IT SHOWS WHAT IT IS ABOUT TO OVERWRITE. A baseline
# that can be refreshed silently is a baseline that gets refreshed instead of read.
if [ "${K3D_BLESS:-}" = "1" ]; then
  moved=0
  for n in $names; do
    if [ -f "$BASE/$n.txt" ] && diff -q "$BASE/$n.txt" "$OUT/$n.txt" > /dev/null; then
      continue
    fi
    if [ -f "$BASE/$n.txt" ]; then
      say "--- $n"
      diff -u "$BASE/$n.txt" "$OUT/$n.txt" | sed '1,2d; s/^/    /'
    else
      say "--- $n (new)"
      sed 's/^/    /' "$OUT/$n.txt"
    fi
    cp "$OUT/$n.txt" "$BASE/$n.txt"
    moved=$((moved + 1))
  done
  # A baseline whose script is gone goes too, or row B would never come back green.
  for f in "$BASE"/*.txt; do
    n=$(basename "$f" .txt)
    case " $names " in *" $n "*) ;; *) say "--- $n: script gone, baseline removed"
      rm -f "$f"; moved=$((moved + 1)) ;;
    esac
  done
  say ""
  say "blessed: $moved baseline(s) written, $(ls "$BASE"/*.txt 2>/dev/null | wc -l) in all"
  rm -f "worlds/$TAG-"*.hxw
  exit 0
fi

say "A  every live script builds what it built — the diff IS the report"
# ⚠ THE WHOLE RECORD IS COMPARED, NOT A CHOSEN FIELD. A regression in this tree has
# arrived as a moved world (a wall run lost), as a moved session (a slab that stopped
# being recorded), as a moved NUMBER in a sentence (three separate gestures were found
# passing a global height scale where the world's own unit belongs — `K3`'s `J`/`E`/`B`
# findings), and as a refusal that stopped happening. One record sees all four.
for n in $names; do
  if [ ! -f "$BASE/$n.txt" ]; then
    bad "$n: no baseline — run K3D_BLESS=1 (row B is where this is counted)"
  elif diff -u "$BASE/$n.txt" "$OUT/$n.txt" > "$OUT/$n.diff"; then
    ok "$n: rc $(sed -n 's/^rc: //p' "$OUT/$n.txt"), md5 $(sed -n 's/^md5: //p' "$OUT/$n.txt" | cut -c1-12)"
  else
    bad "$n moved — $(grep -c '^[+-][^+-]' "$OUT/$n.diff") line(s) of its record:"
    sed '1,2d; s/^/       /' "$OUT/$n.diff" | head -12
  fi
done

say ""
say "B  the corpus and the baselines are the same set"
# ⚠ BOTH DIRECTIONS. A new script with no baseline is a script that looks covered
# because it sits in a covered directory — which is `tools/layering.sh`'s exemption
# defect exactly. And a baseline whose script is gone is a file nothing can ever
# falsify, sitting among files that can.
have=$(ls "$BASE"/*.txt 2>/dev/null | sed 's|.*/||; s|\.txt$||' | sort | tr '\n' ' ')
want=$(printf '%s\n' $names | sort | tr '\n' ' ')
if [ "$have" = "$want" ]; then
  ok "$(printf '%s\n' $names | wc -l) scripts, $(ls "$BASE"/*.txt | wc -l) baselines, name for name"
else
  bad "the sets differ:"
  say "       corpus:    $want"
  say "       baselines: $have"
fi

say ""
say "C  the pair has TEETH — a press deleted from a live script goes red"
# ⛔ **`K3d`'s OWN ACCEPTANCE, AND IT IS TWO ROWS BECAUSE THE RECORD IS A PAIR.** One
# sabotage per half, because a probe that only ever deleted a store write would ship a
# session digest nothing had asked a question of — and `slab`'s is the half the world
# is blind to.
if cmp -s "$OUT/sab-wall.keys" "$CORPUS/wall.keys"; then
  # ⚠ TWO CAUSES, AND THE MESSAGE MUST NAME BOTH. Measured in the sweep: `deadctl`
  # sabotages the `awk` above and this branch fires, so a message blaming only the
  # script would send the next reader to the wrong file.
  bad "C1 the store-half fixture deletes nothing — either \`wall.keys\` no longer has a \
bare \`verb run\` line, or the \`awk\` that removes one has stopped matching. Either way \
C1 is comparing a file with itself"
elif ! [ -f "$BASE/wall.txt" ]; then
  bad "no wall baseline to compare against"
else
  w_live=$(sed -n 's/^md5: //p' "$BASE/wall.txt")
  w_sab=$(sed -n 's/^md5: //p' "$OUT/sab-wall.txt")
  s_live=$(sed -n 's/^session: //p' "$BASE/wall.txt")
  s_sab=$(sed -n 's/^session: //p' "$OUT/sab-wall.txt")
  if [ "$w_sab" = "$w_live" ]; then
    bad "C1 the STORE half is blind: one \`verb run\` deleted from \`wall.keys\` and the \
saved world is still $w_live"
  elif [ "$s_sab" = "$s_live" ]; then
    bad "C1 the world moved but the session did not — \`runs\` is not being counted"
  else
    ok "C1 store half: one \`verb run\` gone -> md5 $(printf '%s' "$w_sab" | cut -c1-12) \
against $(printf '%s' "$w_live" | cut -c1-12), and $s_sab"
  fi
fi
if cmp -s "$OUT/sab-slab.keys" "$CORPUS/slab.keys"; then
  bad "the slab fixture deletes nothing — \`slab.keys\` has no \`verb hole\` line any more"
elif ! [ -f "$BASE/slab.txt" ]; then
  bad "no slab baseline to compare against"
else
  w_live=$(sed -n 's/^md5: //p' "$BASE/slab.txt")
  w_sab=$(sed -n 's/^md5: //p' "$OUT/sab-slab.txt")
  s_live=$(sed -n 's/^session: //p' "$BASE/slab.txt")
  s_sab=$(sed -n 's/^session: //p' "$OUT/sab-slab.txt")
  if [ "$s_sab" = "$s_live" ]; then
    bad "C2 the SESSION half is blind: \`verb hole\` deleted and the digest still reads \
$s_live — with the world identical either way, nothing in this probe can see a hole"
  elif [ "$w_sab" != "$w_live" ]; then
    # Not a failure of the probe — a change in what a slab IS. Said out loud, because
    # the row's argument for existing is that this world does NOT move.
    bad "C2 the world moved too ($w_sab against $w_live) — a hole has become a store \
write, so this row's premise is stale even though the deletion was caught"
  else
    ok "C2 session half: \`verb hole\` gone -> $s_sab, with the world \
$(printf '%s' "$w_sab" | cut -c1-12) UNCHANGED — the half a world key cannot see"
  fi
fi

say ""
say "D  the coverage report — what this instrument cannot tell apart"
# ⚠ COMPUTED FROM THIS RUN, NOT FROM THE BASELINES. A group list derived from the
# committed files would be a table checked against itself; these are the worlds and
# sessions just built.
for n in $names; do
  printf '%s|%s|%s %s\n' \
    "$(sed -n 's/^md5: //p' "$OUT/$n.txt")" \
    "$(sed -n 's/^session: //p' "$OUT/$n.txt" | tr -d ' ')" \
    "$(sed -n 's/^chosen: //p' "$OUT/$n.txt" | tr -d ' ')" "$n"
done | sort | awk '{ g[$1] = g[$1] " " $2 }
  END { for (k in g) { if (split(g[k], x, " ") > 1) print substr(g[k], 2) } }' \
  | sort > "$OUT/groups"
# ⛔ THE EXPECTATION, AND EVERY LINE OF IT IS A COVERAGE STATEMENT.
#   1  the camera scripts — a house on flat ground and then nothing the store or the
#      session can see. Five of the six are checked by NOTHING in this tree; `indoors`
#      has `camera_indoors.mjs`. Row A separates them only by where the author stood
#   2  `doorparts` and `doorway` are refused at their first `send 44:` (part mode is
#      beyond this driver — `probe/k3c` row A), so what they build is `cache`'s prefix
#   3  `fall` walks and falls with no authoring mode on, so the world cannot see the
#      walk at all — `tools/walk-exact.sh` explains which walks it can
#   4  `door` and `opening` are the same wall and the same two openings, photographed
#      from two stations
cat > "$OUT/groups.want" <<'EOF'
cache doorparts doorway
ceiling cutaway eyes floorprobe indoors lamp
clientmesh fall
door opening
EOF
if diff -u "$OUT/groups.want" "$OUT/groups" > "$OUT/groups.diff"; then
  ok "$(wc -l < "$OUT/groups") known group(s) of scripts that build the same thing:"
  sed 's/^/       /' "$OUT/groups"
else
  bad "the groups moved — two scripts became indistinguishable, or stopped being:"
  sed '1,2d; s/^/       /' "$OUT/groups.diff"
fi

rm -f "worlds/$TAG-"*.hxw
say ""
if [ "$fails" -eq 0 ]; then
  say "k3d: PASS — $(printf '%s\n' $names | wc -l) scripts against their baselines"
else
  say "k3d: $fails FAILED"
fi
exit $((fails > 0))
