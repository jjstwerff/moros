#!/bin/sh
# WHO STILL DECIDES AN IDENTITY IN CODE — plan 21 `R5`.
#
# ⛔ **A STORED BYTE MEANS WHAT ITS REGION SAYS IT MEANS, AND 22 SITES SAID OTHERWISE.**
# `hex_editor::ground_kind_at` resolves a cell's byte through its own region's palette
# and has shipped since `R1`; `ground_is(w, q, r, mat, ROLE_*)` is that resolver asked
# the one question a rule may have. A site writing `mat == FLOOR_MAT` instead is asking
# *what does MOROS number a floor* — right only for a world that happens to agree, and
# the exact reason an adopter inherits this project's village
# ([FOCUS](../doc/claude/FOCUS.md) §2·3).
#
# ⚠ **IT WAS INVISIBLE BECAUSE IT IS NOT A BUG IN ANY WORLD WE OWN.** No world in the
# corpus carries a material palette, so every bypass resolves to the same answer the
# resolver would give and every suite is green. The defect only appears in somebody
# else's world — which is precisely the class no test here will ever reach.
#
# ── the docket, not the exemption ─────────────────────────────────────────────
#
# ⚠ **EVERY ROW CARRIES A VERDICT AND NOTHING IS PATTERN-SKIPPED**, which is
# `tools/dups.tsv`'s shape and `tools/layering.sh`'s lesson: a guard with a rule-shaped
# exemption exempts things by accident. `moros_ui` sat outside the layering check for
# months because a PATTERN waved it through.
#
#   definition  this site IS the role, not a use of it — `edge_is_wall` is what `wall`
#               MEANS, and the byte it names is the built-in numbering the palette
#               falls back to. Moving it would be circular.
#   debt        a rule deciding an identity from a constant. Open work; the count is
#               what the next cut of `R5` reduces.
#
# ⚠ **THE ROW IS KEYED ON THE ENCLOSING FUNCTION, NOT ON A LINE NUMBER.** Line numbers
# drift with every edit above them and a baseline keyed on one is a baseline nobody
# keeps. ⛔ **And the function is in the key because a FILE is not fine enough to carry a
# verdict**: `gesture.loft` holds four `== SURFACE_MAT`, one of which is
# `ground_kind_default` reading the grass row out of the table it is the home of. One
# row for the file would have to call all four `debt` or all four `definition`, and both
# are false — a docket whose verdict is a lie is worse than none.
#
# Silent when it passes.
set -u

BASE=tools/roles.tsv
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

# ⚠ **THE COMMENT LINES ARE DROPPED, AND THAT IS AN INSTRUMENT DECISION.** This tree
# writes `⚠ ask `edge_is_wall`, NOT `== WALL_MAT`` in its own source — prose about the
# rule, in the shape the rule forbids. Counting those would make the docket grow every
# time somebody documents it correctly.
#
# ⛔ **AND THE FIRST VERSION OF THIS FUNCTION COULD NOT SEE A LINE'S FIRST COMPARISON.**
# It pulled the constant with a `sed` whose `.*` is greedy, so `slot == DOOR_MAT || slot
# == WINDOW_MAT` reported **`WINDOW_MAT` only** and `DOOR_MAT` was absent from the
# docket — a check whose answer for a real bypass was *nothing here*. Found by reading
# the first baseline against the grep it came from. **Every occurrence on a line is
# walked now**, and `probe/roles` asserts the two-on-one-line case is counted twice
# before this script's silence is believed anywhere.
# ⚠ **THE SCAN TARGET IS A VARIABLE SO THE INSTRUMENT CAN BE CHECKED WITHOUT TOUCHING
# THE TREE.** `probe/roles` points it at fixtures instead; CLAUDE.md's sabotage rule is
# about a sweep that restores with `git checkout`, and the way not to need one at all is
# not to edit the subject.
SCAN=${ROLES_SCAN:-}
[ -z "$SCAN" ] && SCAN="lib/*/src/*.loft src/*.loft"

scan() {
  # shellcheck disable=SC2086
  awk '
    FNR == 1 { fn = "(file)" }
    /^[[:space:]]*(pub )?fn [A-Za-z_]/ {
      fn = $0
      sub(/^[[:space:]]*(pub )?fn /, "", fn)
      sub(/\(.*$/, "", fn)
    }
    /^[[:space:]]*\/\// { next }
    {
      rest = $0
      while (match(rest, /(==|!=)[ \t]*[A-Z][A-Z_0-9]*/)) {
        m = substr(rest, RSTART, RLENGTH)
        sub(/^(==|!=)[ \t]*/, "", m)
        # ⛔ THE WHOLE IDENTIFIER, THEN THE SUFFIX — awk has no \b, so a pattern
        # ending `_MAT` matched PAL_MATERIAL as `PAL_MAT` and put a palette AXIS
        # constant in the docket as a material identity. Found in the first baseline.
        if (m ~ /_MAT$/) print FILENAME "\t" fn "\t" m
        rest = substr(rest, RSTART + RLENGTH)
      }
    }
  ' $SCAN 2>/dev/null \
  | sort | uniq -c \
  | sed -E 's/^ *([0-9]+) (.*)$/\2\t\1/' \
  | sort
}

scan > "$tmp/found"

if [ "${ROLES_BLESS:-0}" = "1" ]; then
  # ⚠ Re-recording keeps whatever verdict a row already had, so blessing cannot
  # silently downgrade a `debt` to nothing. A row it has never seen arrives as `debt`,
  # which is the answer that asks for a reader rather than the one that closes a
  # question.
  : > "$tmp/next"
  while IFS="$(printf '\t')" read -r f g c n; do
    old=$(awk -F'\t' -v f="$f" -v g="$g" -v c="$c" '$1==f && $2==g && $3==c {print $5}' "$BASE" 2>/dev/null)
    [ -z "$old" ] && old=debt
    printf '%s\t%s\t%s\t%s\t%s\n' "$f" "$g" "$c" "$n" "$old" >> "$tmp/next"
  done < "$tmp/found"
  mv "$tmp/next" "$BASE"
  echo "roles: baseline re-recorded — $(wc -l < "$BASE" | tr -d ' ') row(s) in $BASE"
  exit 0
fi

[ -f "$BASE" ] || { echo "roles: no baseline at $BASE — ROLES_BLESS=1 sh tools/roles.sh"; exit 1; }
cut -f1,2,3,4 "$BASE" | sort > "$tmp/base"

debt=$(awk -F'\t' '$5=="debt" {n += $4} END {print n + 0}' "$BASE")
defn=$(awk -F'\t' '$5=="definition" {n += $4} END {print n + 0}' "$BASE")

if diff -q "$tmp/base" "$tmp/found" >/dev/null 2>&1; then
  [ "${ROLES_ADVISORY:-0}" = "1" ] \
    && echo "roles: $debt identity comparison(s) still in code, $defn definition(s) — as recorded"
  exit 0
fi

echo "roles: ⚠ THE IDENTITY COMPARISONS MOVED — against $BASE:"
diff "$tmp/base" "$tmp/found" 2>/dev/null | grep '^[<>]' | sed 's/^/       /'
echo
echo "       A '>' row is a NEW site deciding an identity from a compile-time byte."
echo "       Ask ground_is(w, q, r, mat, ROLE_*) instead — plan 21 \`R5\`, and the head"
echo "       of this script. A '<' row is one that went away: ROLES_BLESS=1 sh"
echo "       tools/roles.sh re-records, keeping each row's verdict."
[ "${ROLES_ADVISORY:-0}" = "1" ] && exit 0
exit 1
