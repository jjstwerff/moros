#!/bin/sh
# IS A COLLIDING BARE NAME STILL A SILENCE? — the claim `tools/names.sh` was built on.
#
#   sh probe/names/run.sh
#
# That script's head said a bare name binds to whichever package was `use`d FIRST, with
# no ambiguity error ([loft#788](https://github.com/loft-lang/loft/issues/788)) — so a
# collision was *a silence*, and the check existed to break it. **It is not a silence any
# more.** This is that claim as a command rather than a sentence, because a capability
# claim about a toolchain is something to run, not to quote: CLAUDE.md says so about a
# named binary, and it holds for a named defect too.
#
# The pair is real and lives in this tree: `hex_rig::frames::seg_len` and
# `hex_way::seg_len`, both imported plainly by `src/editor_server.loft`.
#
# ⚠ **ROW B IS THE CONTROL AND IT IS NOT OPTIONAL.** Row A asserts an error message; an
# error is also what a malformed call gives, so with one import removed the same bare call
# must fail for a DIFFERENT reason. Without that, a probe that mistyped the function name
# would pass row A on any compiler.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/names/out
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0
ok()  { printf '  ok   %s\n' "$*"; }
bad() { printf '  FAIL %s\n' "$*"; fails=$((fails + 1)); }

# ⚠ THE FILE LIVES UNDER `probe/` SO `--lib lib/` RESOLVES THE SAME WAY IT DOES FOR THE
# SERVER. A program compiled from somewhere else is a different dependency graph, which is
# the whole subject here.
cat > "$OUT/both.loft" <<'LOFT'
use hex_rig;
use hex_way;

fn main() {
  x = seg_len();
  println("{x}");
}
LOFT
sed '1d' "$OUT/both.loft" > "$OUT/one.loft"   # hex_way alone

say_err() { $LOFT --dump --lib lib/ "$1" 2>&1 >/dev/null | grep -E '^error' | head -2; }

echo "A  both packages imported, the name written bare"
a=$(say_err "$OUT/both.loft")
if printf '%s' "$a" | grep -q 'declared by more than one module'; then
  ok "refused, and it names both: $(printf '%s' "$a" | head -1 | cut -c1-96)…"
else
  bad "loft#788's silence may be BACK — a bare colliding name did not raise an ambiguity:"
  printf '       %s\n' "$a"
fi
# ⚠ AND THE MESSAGE HAS TO CARRY THE FIX, because that is what makes a live row cheap.
if printf '%s' "$a" | grep -q 'hex_rig::frames::seg_len' && \
   printf '%s' "$a" | grep -q 'hex_way::seg_len'; then
  ok "…and both declarations are spelled out, so the fix is in the message"
else
  bad "the refusal does not name the two declarations — a reader still has to hunt"
fi

echo "B  the control — one import, the same bare call"
b=$(say_err "$OUT/one.loft")
if printf '%s' "$b" | grep -q 'declared by more than one module'; then
  bad "one import still reports an ambiguity — row A is measuring something else"
elif [ -n "$b" ]; then
  ok "fails for another reason, as it must: $(printf '%s' "$b" | head -1 | cut -c1-72)"
else
  bad "one import compiled a zero-argument \`seg_len()\` — this probe's fixture is wrong"
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "names: a colliding bare name is REFUSED, loudly, with the fix — loft#788 is closed"
else
  echo "names: $fails FAILED"
fi
exit "$fails"
