#!/bin/sh
# L6.3 — DOES THE EDITOR PROGRAM BUILD WITH THE MOROS TREE ABSENT?
#
#   probe/l6/run.sh
#
# ⚠ THIS IS PLAN 19'S ONE INVARIANT, AND UNTIL 2026-08-11 NOTHING MEASURED IT.
# LAVITION_SPLIT.md states it in bold — *"With `L2` and `L3′` done,
# `src/editor_server.loft` has zero Moros dependencies and the program, its client,
# its gates and its content can all travel together"* — and the plan's own status
# line repeats it: *"one 8,283-line editor program with none left either"*.
#
# **Both are false.** The program imports `moros_render` (6 names, 42 call sites)
# and `moros_sim` (10 names, 11 sites, behind `as msim`), and through them the
# other two Moros packages. With `lib/moros_*` absent it does not compile.
#
# ── ⚠ WHY IT SURVIVED EVERY CHECK IN THE TREE, WHICH IS THE DURABLE PART ───────
#
#   · `tools/layering.sh` looped over `lib/*/loft.toml` and never saw `src/`. A
#     consumer program may call anything — true while the program is Moros's, and
#     the whole of plan 19 is the claim that it stops being. ✅ Fixed: that script
#     now carries `PROGRAM_DEBT` and fails in both directions.
#   · the 2026-08-06 coupling measurement said *"`moros_terrain`, and nothing else
#     … plus 3 unqualified calls from `moros_render`"* — a sentence carrying its own
#     refutation ("nothing else … plus") — and **never mentioned `moros_sim` at
#     all**, because an aliased import exposes no bare name to grep for. That is
#     `L6.1`'s own finding, unspent against the measurement that needed it.
#   · `L3′` cured `world_to_hex` in the PACKAGES, where `layering.sh` looks —
#     `tools/layering.sh`'s header names that fix. The program kept **29 calls to
#     the same function**, unlooked at, the whole time.
#
# ── WHAT THIS PROBE DOES NOT MEASURE, SAID OUT LOUD ───────────────────────────
#
# The invariant's other half is *the 39 gates green with `lib/moros_*` deleted*.
# It is **unreachable today and this probe cannot fake it**: every one of those
# gates drives `src/editor_server.loft`, which is the file that does not build. So
# the gate half is blocked on the program half, and `E` measures the nearest thing
# that IS decidable — that no gate carries Moros in code rather than in prose.
#
# ⚠ A silence here would mean the staging failed, so every check states what its
# outcome MEANS if it flips, and `A`/`B` are controls that must PASS before any
# expected failure below them is worth reading. An expected error is still an
# instrument reading.
set -u
cd "$(dirname "$0")/../.." || exit 1

STAGE=${TMPDIR:-/tmp}/l6-lavition-only
fail=0

# ── Stage a lavition-only `lib/` ──────────────────────────────────────────────
# ⚠ `.loft` IS EXCLUDED ON PURPOSE — it is loft's build cache, and `find -name
# '*.loft'` matching that directory is the trap `L6.2` recorded. Here it would only
# make the copy large, but the same name means two things and it is worth saying.
rm -rf "$STAGE"; mkdir -p "$STAGE" || exit 1
staged=0
for p in lib/*/; do
  n=$(basename "$p")
  case "$n" in moros_*) continue ;; esac
  cp -r "$p" "$STAGE/$n" || exit 1
  rm -rf "$STAGE/$n/.loft"
  staged=$((staged + 1))
done
if [ "$staged" -lt 5 ]; then
  echo "FAIL  staging          only $staged packages staged — the copy failed, and every"
  echo "                       expected error below would be that failure wearing a finding's clothes"
  exit 1
fi
if [ -n "$(ls -d "$STAGE"/moros_* 2>/dev/null)" ]; then
  echo "FAIL  staging          a moros_* package reached the staged tree — nothing below measures anything"
  exit 1
fi

# $1 label  $2 expect (ok|err)  $3 words that must appear  $4 meaning-if-flipped  $5.. loft args
check() {
  label=$1; expect=$2; words=$3; meaning=$4; shift 4
  # The file under test is the last argument — named so a passing line says WHAT
  # passed rather than only that something did.
  subject=""; for a in "$@"; do subject=$a; done
  out=$(loft "$@" 2>&1); rc=$?
  got=err; [ $rc -eq 0 ] && got=ok
  detail=$(printf '%s\n' "$out" | grep -E '^error:' | head -1)
  if [ "$got" != "$expect" ]; then
    printf 'FAIL  %-22s expected %s, got %s — %s\n      %s\n' \
      "$label" "$expect" "$got" "$meaning" "$detail"
    fail=1
  elif ! printf '%s\n' "$out" | grep -qF "$words"; then
    # ⚠ THE MEANING IS PRINTED HERE TOO, and it was not at first. Pay ONE of the
    # two imports and the file still fails to compile on the other, so `got` stays
    # `err`, the expect-branch above never fires, and the only line a reader got
    # was "not for the measured reason" — the least informative reading of the most
    # interesting event this probe can witness. A partial payment is progress and
    # has to say so.
    printf 'FAIL  %-22s %s, but not for the measured reason — wanted "%s"\n      %s\n      %s\n' \
      "$label" "$got" "$words" "$meaning" "$detail"
    fail=1
  else
    printf 'ok    %-22s %s\n' "$label" "$subject"
  fi
}

# ── A — THE CONTROL. The instrument has to accept the file it is about to refuse ─
# Without this, `C` and `D` below could be reporting a broken `--check`, a bad path
# or a toolchain that refuses everything, and would read as a clean finding.
check "A full-lib control" ok "" \
  "the instrument is blind — --check cannot compile the server even WITH lib/" \
  --check --lib lib/ src/editor_server.loft

# ── B — the four programs that ALREADY travel ────────────────────────────────
# ⚠ These are the reason the finding is precise rather than alarming: the split is
# ONE FILE away, not four. If one of these flips to `err`, a program has picked up
# a Moros dependency and `L6.3` just got dearer.
for prog in editor_client editor_run part_build prop_build; do
  check "B $prog" ok "" \
    "src/$prog.loft has taken on a Moros dependency — L6.3 grew" \
    --check --lib "$STAGE/" "src/$prog.loft"
done

# ── C, D — THE SUBJECT ───────────────────────────────────────────────────────
# ⚠ EACH IMPORT IS ASKED FOR BY NAME. A bare `expected err` would pass on any
# error at all, including the staging failures guarded above — and the two imports
# are on different footings, so collapsing them would lose the distinction: the
# `moros_render` half is a projection that `L3′` half-moved, the `moros_sim` half
# is open question 5 and is not settled.
check "C moros_render" err "Library 'moros_render' not found" \
  "the server no longer imports moros_render — PAID; lower PROGRAM_DEBT in tools/layering.sh" \
  --check --lib "$STAGE/" src/editor_server.loft

check "D moros_sim" err "Library 'moros_sim' not found" \
  "the server no longer imports moros_sim — PAID; lower PROGRAM_DEBT in tools/layering.sh" \
  --check --lib "$STAGE/" src/editor_server.loft

# ── E — the gates carry Moros in PROSE only ──────────────────────────────────
# 21 of the 53 gate files say "moros"; every one of them is inside a comment. That
# is a real result and not a weak one: it is why the gate half of the invariant is
# blocked ONLY on the program, and why `L6.3` does not also have to rewrite 39
# gates. ⚠ Its own control is below — a grep whose answer is "absent" is worthless
# until it has been shown finding something.
gate_code=$(grep -rn "moros" tools/gates/ 2>/dev/null \
  | awk -F: '{ l=$0; sub(/^[^:]*:[0-9]*:/,"",l); gsub(/^[ \t]*/,"",l);
               if (l !~ /^(\/\/|\*|\/\*)/) print $1":"$2 }')
if [ -n "$gate_code" ]; then
  printf 'FAIL  %-22s a gate names Moros outside a comment — the gates no longer travel free\n' "E gates prose-only"
  printf '%s\n' "$gate_code" | sed 's/^/      /'
  fail=1
else
  printf 'ok    %-22s every "moros" in tools/gates/ is inside a comment\n' "E gates prose-only"
fi

# ── E′ — that grep, checked against something it MUST find ───────────────────
# ⚠ THE RULE THIS TREE PAID FOR: an instrument gets checked against something it
# SHOULD find before it is trusted to report an absence. `E`'s comment filter is
# exactly the kind that reported this script's own header as a violation once
# (see `tools/layering.sh`), so it is fed a planted line and must catch it.
planted=$(printf 'x\n  // moros_sim is fine here\n  const p = "moros_sim";\n' \
  | awk -F: '{ l=$0; gsub(/^[ \t]*/,"",l);
               if (l ~ /moros/ && l !~ /^(\/\/|\*|\/\*)/) print NR }')
if [ "$planted" != "3" ]; then
  printf 'FAIL  %-22s the comment filter answered "%s" for a fixture whose only code line is 3 —\n' "E' filter control" "$planted"
  printf '      %-22s so E cannot be trusted to report an absence\n' ""
  fail=1
else
  printf 'ok    %-22s the comment filter finds a planted code line and skips the comment beside it\n' "E' filter control"
fi

rm -rf "$STAGE"

echo
if [ "$fail" -ne 0 ]; then
  echo "probe/l6: FAILED — read each line above; every one says what its flip means."
  exit 1
fi
echo "probe/l6: the split is ONE FILE away — src/editor_server.loft, 2 imports, 53 call sites."
echo "          Four programs and 53 gates already travel. Plan 19 L6.3 is what pays it."
exit 0
