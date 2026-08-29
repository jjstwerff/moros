#!/bin/sh
# ⛔ EVERY PROGRAM UNDER `src/` STILL COMPILES — the check the fast loop did not have.
#
# The package suites compile `lib/` and nothing else, so a change to a LIBRARY can
# break a CONSUMER under `src/` while 180 test files stay green. Measured 2026-08-29:
# a `hex_fit` dependency added to `hex_editor` put a second `HEIGHT_SCALE` into
# `src/editor_server.loft`'s graph beside `hex_proj`'s, and the server did not compile
# for a session.
#
# ⚠ **AND THE FAST LOOP DID GO RED — IT SAID THE WRONG WORDS.** `probe-k1` and
# `headless-same` both START the server, so both saw it; what k1 printed was `FAIL the
# server never listened`, which is verbatim the shape CLAUDE.md documents for the
# sibling emptying `~/.loft/build-cache`. It was read as the sibling's flake and waited
# out. This guard exists to say the other sentence — *it did not compile* — with loft's
# own diagnostic under it, in seconds rather than at minute four.
#
# ⚠ IT IS A COMPILE, NOT A RUN. `--dump` stops after bytecode generation, so it sees
# name resolution, types and arity — the whole class above — and nothing that needs the
# program to execute. The run half is still `probe-k1`, `probe-headless` and
# `headless-same`, and they stay where they are.
#
# ⚠ AND ONE BACKEND, DELIBERATELY, for `run-tests.sh`'s reason: this is the fast loop,
# not the proof. `make lib-test` is what runs both.
set -u
cd "$(dirname "$0")/.."

LOFT=${LOFT:-loft}

# ⚠ **AN EXPLICIT SKIP LIST, SO A NEW PROGRAM IS CHECKED UNLESS SOMEBODY NAMES IT ON
# PURPOSE.** That is `tools/layering.sh`'s lesson paid forward: its `moros_*` skip was a
# PATTERN, so a universal package wearing a Moros prefix was exempt from the one check
# written to catch exactly that, for months.
#
#   editor_client.loft  the `--html` program, and it is 169 s to compile here against
#                       3-10 s for the rest — the graphics library dominates. `make
#                       page-check` is the tier that builds it, and it builds it for
#                       the BROWSER, which is the target that matters for this file.
SKIP="src/editor_client.loft"

# ⚠ THE EXEMPTION MUST NOT OUTLIVE ITS SUBJECT. A skip naming a deleted file is a line
# nobody re-reads that quietly widens if the name is ever taken again.
for s in $SKIP; do
  [ -f "$s" ] || { echo "src-build: skip list names $s, which does not exist"; exit 1; }
done

fails=0
n=0
rcfile=$(mktemp)
trap 'rm -f "$rcfile"' EXIT INT TERM HUP

for f in src/*.loft; do
  case " $SKIP " in *" $f "*) continue ;; esac
  n=$((n + 1))
  # ⚠ `--dump` WRITES THE BYTECODE TO STDERR, which is where the diagnostic goes too —
  # so stderr is piped through the filter and stdout dropped. The exit code cannot come
  # from the pipeline (its status is the filter's), so it is written aside.
  diag=$( { $LOFT --dump --lib lib/ "$f" 2>&1 >/dev/null; echo $? > "$rcfile"; } \
          | grep -E '^error' -A6 | head -40 )
  rc=$(cat "$rcfile")
  if [ "${rc:-1}" -ne 0 ]; then
    echo "src-build: ⛔ $f DID NOT COMPILE (rc=$rc)"
    printf '%s\n' "$diag" | sed 's/^/  /'
    fails=$((fails + 1))
  fi
done

# ⚠ THE VACUITY GUARD, `basenames.sh`'s. *Nothing failed to compile* is also what a run
# that compiled nothing says.
if [ "$n" -eq 0 ]; then
  echo "src-build: NOTHING WAS COMPILED — this run says nothing"; exit 1
fi
[ "$fails" -eq 0 ] || exit 1
echo "src-build: $n program(s) under src/ compile"
