#!/bin/sh
# ── B4's SABOTAGE SWEEP — the world outliving the tab, taken apart three ways ──
#
# Plan 22 `B4`. Each row removes ONE thing and names the check that must go red for
# it; a row that goes red somewhere else is as much a finding as one that stays green,
# because it says the check is not measuring what its sentence claims.
#
# ⚠ **THE CONTROL IS RUN AT BOTH ENDS AND IT IS NOT CEREMONY** — `CLAUDE.md`'s sweep
# rule. A sabotage that fails to BUILD, or a `sed` that patches nothing, produces the
# same *NOTHING went red* as a check that cannot fail; and `M4` found four sibling
# sweeps silently disarmed by a deletion, two of which said nothing about it. The
# subject guard below is checked against the source before any row runs.
#
# ⚠ **AND IT TRAPS `PIPE`.** `M4`'s sweep piped through `head`, took a SIGPIPE, and
# left its sabotage in the working tree — the next suite run came back red for a
# reason that had nothing to do with the code.
#
# Each row is a FULL `make probe-demo`, because a sabotaged client is a different page
# and every block runs against it. Expect this to take an hour.
set -eu
cd "$(dirname "$0")/../.."

OUT=probe/b2/out-sabotage-b4
mkdir -p "$OUT"
trap 'rm -f probe/b2/.noworldsave.loft probe/b2/.noworldload.loft probe/b2/.nopose.loft' EXIT INT TERM PIPE

fail() { echo "SWEEP ABORTED — $1"; exit 1; }

# ── THE SUBJECT MUST BE PRESENT BEFORE ROW 0 ────────────────────────────────
#
# ⚠ A sweep over an absent feature answers *nothing went red* to every question, which
# is the same sentence a useless test suite produces. Each guard names the exact line
# its row seds, so a reshape of the client disarms the row LOUDLY.
grep -q '^  if st.cache.w_tau == st.saved_tau { return; }$' src/editor_client.loft \
  || fail "local_persist's tau guard is not where noworldsave patches it"
grep -q '^  if ld.wl_code == WL_MISSING {$' src/editor_client.loft \
  || fail "local_restore's missing branch is not where noworldload patches it"
grep -q '^  ra = hex_editor::author_on(st.cache, a.au_x, a.au_z, a.au_yaw);$' src/editor_client.loft \
  || fail "the pose rebuild is not where nopose patches it"

run() {   # $1 tag · $2 the checks that must go red
  echo
  echo "══ $1 — expected red: $2"
  if DEMO_SABOTAGE="$1" make probe-demo > "$OUT/$1.log" 2>&1; then
    echo "   ⛔ NOTHING WENT RED — the whole demo passed with '$1' applied"
  else
    grep -E '^ *✗' "$OUT/$1.log" | sed 's/^/   /' \
      || echo "   ⛔ the run failed and NO check reported ✗ — read $OUT/$1.log"
  fi
}

echo "── control: the tree as it stands ──────────────────────────────────"
if make probe-demo > "$OUT/control.log" 2>&1; then
  echo "   PASS — every check green with nothing sabotaged"
else
  fail "the CONTROL is already red; nothing below can be attributed (see $OUT/control.log)"
fi

# ⚠ **THE UNCERTAIN ROW RUNS FIRST, ON PURPOSE.** `nopose` is the one this sweep exists
# to settle — its predecessor `nofeet` was green under everything — and a sweep that
# answers its own open question last is one that spends an hour before it says anything.
run nopose      "O3 ALONE — the world is saved, restored and keyed BYTE-IDENTICALLY"
run noworldsave "O1 (in its own half of the run), then O2, O3 and O4"
run noworldload "O2, O3 and O4 — O1 stays GREEN, which is what separates it from its twin"

echo
echo "── control: the tree as it stands, again ───────────────────────────"
if make probe-demo > "$OUT/control2.log" 2>&1; then
  echo "   PASS — the sweep left the working tree as it found it"
else
  fail "the tree is RED after the sweep: a sabotage was left behind (see $OUT/control2.log)"
fi
