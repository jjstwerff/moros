#!/bin/sh
# ── K2b — EVERY SCRIPT SAYS A VERB, and the WORLD is what says it is the same ──
#
# Plan 22 `K2b`. `K2a` converted the presses that LOSE information — the eighteen
# opening keys, where `O` and `P` differ by a profile the key spelling carried and a
# `select` line had to take over. What was left is the mechanical remainder: **90
# lines across 31 scripts**, `key ArrowUp` → `verb raise`, `key H` → `verb place`,
# `key G` → `verb wall`, none of which loses or gains anything.
#
# ⚠ **AND *MECHANICAL* IS EXACTLY WHY IT NEEDS AN EXACT INSTRUMENT RATHER THAN A
# GATE.** A conversion that is obviously right is one nobody looks at twice; the
# failure it can still have is a mis-typed verb on ONE line of ninety, in a script no
# gate runs, discovered as a scene that quietly builds something else. So every
# converted script is run in BOTH spellings and compared on the world, the session and
# the transcript.
#
# ⚠ **THE BASELINE IS A COMMIT, NOT A COPY** — and that is a decision with a cost.
# `probe/k2/orig/` keeps twelve scripts as FILES because it compares both spellings
# forever; this comparison is a one-time conversion proof, and thirty-one duplicated
# scripts would be thirty-one files to keep in step with an editor that keeps growing
# gestures. `git show $BASE:<path>` cannot drift and cannot be converted by accident.
# ⚠ **What it costs is that this probe stops being runnable the day `$BASE` leaves the
# history**, which is what the vacuity guard below is really watching for: a baseline
# with no `key` line in it is not a baseline.
#
# ⚠ **WHAT IT CANNOT SEE** — the same blind spot `probe/k1` names, said again because
# it is the one that matters here: a world key is blind to everything the SESSION
# holds, so the session digest is printed and compared beside it. Both come off
# `editor_run`, which is one driver — this probe says the two spellings agree, and
# `probe/k2` is what says the SERVER agrees with them.
#
# ⛔ **AND THE SECOND THING IT CANNOT SEE IS THE ONE THAT GOT AWAY: A SCRIPT THAT IS
# NOT A FILE.** The loop below globs `*.keys`, so its idea of *every script in the
# tree* is every script somebody stored as one. `probe/a83/leaf_visible/switch.sh`
# writes its script into a **heredoc** and drives it from there — it pressed
# `key ArrowUp` and was invisible to this comparison, to `grep -rn '^key ' --include=*.keys`,
# and to the plan row that claimed zero remained. It was found by dropping the
# `--include` and greping the whole tree, which is the check this file's coverage
# claim is worth. ⚠ **A glob is an instrument and its default answer is *absent***,
# which is the same sentence this tree keeps re-learning about greps.
set -eu
cd "$(dirname "$0")/../.."

LOFT=${LOFT:-loft}
BASE=${BASE:-0e2d48a}
SAB=${K2B_SABOTAGE:-}
OUT=probe/k2b/out

# ── ⛔ TWO OF THESE RAN AT ONCE AND NEITHER OF THEM SAID SO ────────────────────
#
# Measured, not feared: a queued run and a hand-started one overlapped, and the
# damage was in two places at once. `rm -rf "$OUT"` under the second deleted the
# first's baselines mid-flight, so a script was compared against **a file that no
# longer existed** — that one is loud, and it is the harmless half. The dangerous
# half is silent: both runs wrote `worlds/k2b-a.hxw` and both took an md5 of it, so
# a byte comparison could pass on a world the OTHER process built. **That is a
# false PASS on the step's central claim**, produced by nothing either run did
# wrong.
#
# Both are closed here, and deliberately in two different ways, because they are
# two different failures:
#
#   · the LOCK stops a second run from starting, which is the only fix for `$OUT`
#     — the output directory is named so a person can read the diffs afterwards.
#   · the world name carries the **PID** anyway, so even a run that defeats the
#     lock (a stale directory removed by hand, two checkouts of this tree) cannot
#     read a world it did not write. ⚠ A guard that can be bypassed must not be
#     the only thing standing between an md5 and the wrong file.
if ! mkdir "$OUT.lock" 2>/dev/null; then
  echo "k2b FAIL — another run holds $OUT.lock; if none is running, remove it."
  exit 1
fi

# ⚠ **ONE NAME FOR BOTH SPELLINGS, AND THE MD5 IS TAKEN BETWEEN THE RUNS.** It was
# `k2b-a` and `k2b-b` first, which put the FILENAME in the runner's own summary line
# (`… τ 3813 -> k2b-a.hxw`) and made the transcript comparison below red on every
# single script, forever, for a reason that has nothing to do with a spelling. The
# fix is to remove the difference rather than to teach the diff to ignore it.
WORLD=k2b-$$
rm -rf "$OUT" && mkdir -p "$OUT"
trap 'rm -rf "$OUT.lock"; rm -f "worlds/$WORLD.hxw"' EXIT INT TERM PIPE

fails=0
compared=0
rewrote=0
skipped=""
say() { echo "   $*"; }
bad() { echo "   ✗ $*"; fails=$((fails + 1)); }

# The baseline has to BE a baseline. ⚠ `git show` of a missing path exits non-zero and
# an empty file compares equal to nothing, so both are checked before a run is spent.
base_of() {  # $1 path → $2 destination
  git show "$BASE:$1" > "$2" 2>/dev/null || return 1
  [ -s "$2" ] || return 1
  return 0
}

# One script through the runner. ⚠ **ABSOLUTE, BECAUSE `editor_run` RESOLVES A
# RELATIVE `SCRIPT` AGAINST `src/`** — its own comment says so, and a path it cannot
# read is reported as one line and an empty world, which compares equal to another
# empty world.
#
# ⚠ **AND THE OUTPUT IS REMOVED FIRST.** `world_save` on a run that never got that far
# leaves the PREVIOUS script's file sitting there, and an md5 of a stale world is a
# number that gets believed — the worst kind of wrong answer this tree keeps meeting.
run_one() {  # $1 script path · $2 world name · $3 log
  rm -f "worlds/$2.hxw"
  SCRIPT="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")" WORLD="$2" \
    $LOFT --lib lib/ src/editor_run.loft > "$3" 2>&1 || true
}

# ── THE ONE DIFFERENCE THE CONVERSION IS ALLOWED TO MAKE ──────────────────────
#
# A gesture that has nothing of its own to say is acknowledged by the runner as
# `"{what}: {n}"`, where `what` is **the word the script used** (`said_ack` in
# `src/editor_run.loft`). So `key ArrowUp` prints `  ArrowUp: 1` and `verb raise`
# prints `  raise: 1` — the label is the subject of this step, and comparing the
# raw transcripts asserts the step did not happen.
#
# ⚠ **SO THE BASE SIDE IS REWRITTEN BY THE SAME MAP THE CONVERSION USED, AND
# NOTHING ELSE IS TOUCHED.** What survives the rewrite is everything that could
# carry a mistake: the COUNT after the colon, every refusal, every `no gesture
# for <verb>` (which is what a mistyped verb produces), the order of the lines and
# every other sentence in the file. What it can no longer see is a `raise` that
# was spelled `ArrowUp` — which is the equivalence being claimed, and which the
# world, the session and the saved bytes are what actually carry.
#
# ⚠ **ONE-SIDED ON PURPOSE.** Rewriting the CONVERTED side too would let a `key H`
# left behind in a converted script read as agreement; that case is refused above
# instead, before a run is spent on it.
#
# ✅ **AND MEASURED, IT REACHES 80 OF THE 90 CONVERTED LINES — THE OTHER TEN ARE
# COMPARED WORD FOR WORD.** Counted over the base logs of a full green run:
# `  ArrowUp: ` **79 lines across all 31 scripts**, `  G: ` **1**, and `  H: `
# **NONE AT ALL**. A gesture only wears this bare label when it has nothing of its
# own to say, and `place` always does — `house placed 27 cells, 84 wall edges,
# ridge at 21, seated at 0 …`, a sentence carrying the seat and the cut-and-fill,
# identical on both sides and never touched by the rewrite. So the gesture with the
# most to get wrong is the one the normaliser is not involved in.
#
# ⚠ **THE DEAD `H` ROW IS KEPT ON PURPOSE**, exactly as `hex_voxel`'s unreachable
# window sweep is: it is dead because `place` answers with a sentence TODAY, which
# is a fact about a gesture rather than about this comparison. Deleting it would be
# a subtraction justified by somebody else's current behaviour, and the day
# `press_verb` hands `place` an empty `ak_why` this file would silently go red on
# all ten.
trap 'rm -rf "$OUT.lock"; rm -f "worlds/$WORLD.hxw"' EXIT INT TERM PIPE
# ⚠ The normalised copy lands in `$OUT` beside the raw logs rather than in a
# temporary directory, because it is **what was actually compared** — a reader
# following a red row needs the file the diff was taken from, not a reconstruction.
norm() {  # $1 log in · $2 log out → echoes how many labels it rewrote
  sed -e 's/^  ArrowUp: /  raise: /' \
      -e 's/^  H: /  place: /' \
      -e 's/^  G: /  wall: /' "$1" > "$2"
  diff "$1" "$2" 2>/dev/null | grep -c '^< ' || true
}

echo "── the two spellings, script by script (baseline $BASE) ────────────"

for f in tools/scripts/*.keys probe/a83/*/*.keys; do
  [ -f "$f" ] || continue
  tag=$(echo "$f" | tr '/.' '--')

  if ! base_of "$f" "$OUT/$tag.base.keys"; then
    skipped="$skipped\n   · $f — no such path at $BASE"
    continue
  fi
  nb=$(grep -c '^key ' "$OUT/$tag.base.keys" || true)
  nc=$(grep -c '^key ' "$f" || true)

  # ⚠ **A SCRIPT THAT PRESSED NO KEY AT `$BASE` IS NOT PART OF THIS CONVERSION**, and
  # it is LISTED rather than dropped: a silent skip is how a comparison that covers
  # three files reads as one that covers thirty-one.
  if [ "$nb" -eq 0 ]; then
    skipped="$skipped\n   · $f — pressed no key at $BASE, so there is nothing to convert"
    continue
  fi
  # ⚠ AND THE OTHER DIRECTION IS A FAILURE, NOT A SKIP: the step's claim is that the
  # key spelling is GONE from these files.
  if [ "$nc" -ne 0 ]; then
    bad "$f still spells $nc press(es) as a key"
    continue
  fi

  cp "$f" "$OUT/$tag.conv.keys"
  # ⛔ THE NEGATIVE CONTROL, applied to the CONVERTED side only: one verb becomes its
  # opposite. It must be red on the world, and it is the one row that says this whole
  # comparison can fail at all.
  if [ "$SAB" = "lower" ] && [ "$tag" = "tools-scripts-house-keys" ]; then
    sed -i '0,/^verb raise$/s//verb lower/' "$OUT/$tag.conv.keys"
    say "SABOTAGE lower — one raise in $f is a lower"
  fi
  # ⛔ THE SECOND CONTROL, AND IT EXISTS BECAUSE THE FIRST CANNOT VALIDATE THE
  # TRANSCRIPT. `lower` moves the world, the bytes AND the sentences, so it goes red
  # even on a transcript comparison that has silently stopped working — which is
  # exactly the state this probe was in when it was first run, red on all 31 scripts
  # for a reason that was nothing to do with a conversion. A gesture the world
  # REFUSES writes nothing: same world key, same bytes, same session, and one extra
  # sentence. **If this row is green, the transcript check is decoration.**
  if [ "$SAB" = "refuse" ] && [ "$tag" = "tools-scripts-house-keys" ]; then
    printf 'verb hole\n' >> "$OUT/$tag.conv.keys"
    say "SABOTAGE refuse — $f gains a gesture the world refuses (no slab to cut)"
  fi

  # ⚠ **`^session:` AND NOT `^session ` — THE COLON IS THE WHOLE INSTRUMENT.** Written
  # the other way first: `session_digest` opens `session: runs …`, so the pattern
  # matched nothing, both sides came back EMPTY, and empty compares equal to empty on
  # every script in the list. A grep's default answer is *absent*, and absent is what
  # agreement looks like from inside a comparison.
  # ⚠ **THE SAME WORLD NAME FOR BOTH, SO THE MD5 IS TAKEN BETWEEN THE RUNS RATHER
  # THAN AFTER THEM.** `run_one` removes the file first, so the reading below
  # belongs to the run that just finished — and the runner's summary line names the
  # same file on both sides, which is what lets the transcripts be compared at all.
  run_one "$OUT/$tag.base.keys" "$WORLD" "$OUT/$tag.base.log"
  bkey=$(grep -m1 '^editor_run: world ' "$OUT/$tag.base.log" | sed 's/^editor_run: world //' || true)
  bses=$(grep -m1 '^session: ' "$OUT/$tag.base.log" || true)
  bmd5=$(md5sum "worlds/$WORLD.hxw" 2>/dev/null | cut -d' ' -f1 || true)

  run_one "$OUT/$tag.conv.keys" "$WORLD" "$OUT/$tag.conv.log"
  ckey=$(grep -m1 '^editor_run: world ' "$OUT/$tag.conv.log" | sed 's/^editor_run: world //' || true)
  cses=$(grep -m1 '^session: ' "$OUT/$tag.conv.log" || true)
  cmd5=$(md5sum "worlds/$WORLD.hxw" 2>/dev/null | cut -d' ' -f1 || true)

  # ⚠ **THE RUN HAS TO HAVE HAPPENED, AND EVERY FIELD OF IT.** A runner that could not
  # read its script prints one line and saves the world it booted with — and two of
  # those compare equal, which is a pass with nothing in it. Each of the three
  # comparisons below is worthless when its own reading is empty, so emptiness is
  # checked here rather than trusted to differ.
  if [ -z "$bkey" ] || [ -z "$ckey" ]; then
    bad "$f — a run produced no world line (base '$bkey', converted '$ckey'); see $OUT/$tag.*.log"
    continue
  fi
  if [ -z "$bses" ] || [ -z "$cses" ]; then
    bad "$f — a run printed no session digest (base '$bses', converted '$cses'); see $OUT/$tag.*.log"
    continue
  fi
  if [ -z "$bmd5" ] || [ -z "$cmd5" ]; then
    bad "$f — a run saved no world file (base '$bmd5', converted '$cmd5'); see $OUT/$tag.*.log"
    continue
  fi

  compared=$((compared + 1))
  ok=1
  [ "$bkey" = "$ckey" ] || { bad "$f — world $bkey → $ckey"; ok=0; }
  [ "$bses" = "$cses" ] || { bad "$f — session '$bses' → '$cses'"; ok=0; }
  [ "$bmd5" = "$cmd5" ] || { bad "$f — the saved bytes differ ($bmd5 → $cmd5)"; ok=0; }

  # ⚠ **AND THE TRANSCRIPT, WHICH IS THE ONLY THING THAT SEES A REFUSAL.** A gesture
  # both spellings refuse leaves the world identical and says so in words — that is a
  # true equality and a weak one, so the SENTENCES are compared and the refusals are
  # counted out loud below.
  nrw=$(norm "$OUT/$tag.base.log" "$OUT/$tag.base.norm")
  rewrote=$((rewrote + nrw))
  if ! diff -q "$OUT/$tag.base.norm" "$OUT/$tag.conv.log" > /dev/null 2>&1; then
    diff "$OUT/$tag.base.norm" "$OUT/$tag.conv.log" > "$OUT/$tag.diff" || true
    bad "$f — the two runs said different things; see $OUT/$tag.diff"
    ok=0
  fi

  # ⚠ **COVERAGE IS REPORTED, BECAUSE AN EQUALITY CAN BE TRUE AND EMPTY.** These
  # scripts are written for a SERVER: `send`, `snap`, `step`, `cam` and nine other
  # commands are the driver's vocabulary and this runner says it cannot do them, line
  # by line. A converted press sitting after one of those may be refused in BOTH runs
  # for a reason that has nothing to do with the spelling — a true comparison with
  # nothing in it. So two numbers go beside every row: how many gestures were REFUSED
  # (they ran, the world said no) and how many converted lines resolved to no gesture
  # at all, which would be a mistyped verb and is red above rather than counted here.
  nog=$(grep -c '^editor_run: verb ' "$OUT/$tag.conv.log" || true)
  refd=$(grep -c '^  refused: ' "$OUT/$tag.conv.log" || true)
  # ⚠ `if`, NOT `[ … ] && …` — under `set -e` a bare AND-list whose test is FALSE is a
  # failing command, and the sweep would exit 0 having reported the scripts it had got
  # to. Caught by reading; it would have looked exactly like a short list.
  if [ "$ok" -eq 1 ]; then
    note=""
    if [ "$refd" -ne 0 ]; then note=" · $refd refused"; fi
    if [ "$nog" -ne 0 ]; then note="$note ⚠ $nog line(s) named no gesture"; fi
    # ⚠ **`relabelled` IS PRINTED BESIDE `converted` BECAUSE THEY CAN DISAGREE, AND
    # A ROW WHERE THEY DO IS THE INTERESTING ONE.** A converted line that was
    # REFUSED prints its refusal instead of a label, so `3 converted · 1 relabelled`
    # says two of those presses never reached the world — a true comparison with
    # very little in it, and invisible if only the first number is shown.
    say "$f — $nb converted · $nrw relabelled · world $ckey$note"
  fi
done

echo
if [ "$compared" -eq 0 ]; then
  echo "k2b FAIL — nothing was compared: every baseline at $BASE was already converted"
  exit 1
fi
# ⚠ **AND THE NORMALISER HAS TO HAVE FIRED.** If it rewrote nothing across the whole
# run, then no press in any baseline produced an acknowledgement this probe knows the
# shape of — a map that has drifted from `said_ack`, or a set of scripts whose every
# gesture was refused. Either way the transcript comparison agreed about a file with
# the subject missing from it, which is this tree's most familiar false pass.
if [ "$rewrote" -eq 0 ]; then
  echo "k2b FAIL — the label map rewrote NOTHING over $compared script(s): the"
  echo "           transcripts were compared without the presses in them."
  exit 1
fi
if [ -n "$skipped" ]; then
  echo "── not part of this conversion ─────────────────────────────────────"
  printf '%b\n' "$skipped"
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "k2b PASS — $compared script(s) build the same world, the same session and the"
  echo "           same transcript in both spellings."
else
  echo "k2b FAIL — $fails difference(s) over $compared script(s)"
  exit 1
fi
