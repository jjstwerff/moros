#!/bin/sh
# ── THE SABOTAGE SWEEP FOR `WALL_PUSH` LAW L1 ────────────────────────────────
#
# ⚠ **IT RESTORES FROM COPIES, NEVER FROM `git checkout`.** The subject of a sweep is the
# step just built, so it is uncommitted by definition and a checkout between rows deletes
# it — the sweep then reports every row as a miss, which reads as *these tests cannot
# fail*. The tests go with the code, so the control row cannot see it either.
#
# ⚠ **AND EVERY ROW ASSERTS THE PACKAGE STILL BUILDS BEFORE ITS RESULT IS READ.** A
# sabotage that will not compile turns every file red, which is the strongest-looking table
# in the world and answers nothing: *the tests cannot run* is the same sentence whatever
# you asked.
set -e
cd "$(dirname "$0")/../.."
ROOT=$(pwd)
SRC=lib/hex_editor/src/gesture.loft
TST=lib/hex_editor/tests/push.loft
KEEP=$(mktemp -d)
cp "$SRC" "$KEEP/gesture.loft"
cp "$TST" "$KEEP/push.loft"
restore() { cp "$KEEP/gesture.loft" "$SRC"; cp "$KEEP/push.loft" "$TST"; }
trap 'restore; rm -rf "$KEEP"' EXIT

# ── row 0: THE SUBJECT IS PRESENT ────────────────────────────────────────────
grep -q "fn boundary_follow" "$SRC" || { echo "row 0: boundary_follow is ABSENT — this sweep would answer nothing"; exit 2; }

run() {                       # run() <label> — prints the failing test names, or 'green'
  out=$(cd lib/hex_editor && loft test push 2>&1) || true
  if printf '%s' "$out" | grep -q "parse errors\|Error:"; then
    echo "  ⛔ DOES NOT BUILD — row void"
    return
  fi
  red=$(printf '%s\n' "$out" | grep -oP 'push\.loft::\K[a-z_]+' | sort -u | tr '\n' ' ')
  if [ -z "$red" ]; then echo "  green"; else echo "  RED: $red"; fi
}

echo "row 0 — control, nothing cut"
run

echo "row 1 — boundary_follow does nothing (the feature absent)"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("  if id == 0 { return 0; }\n","  if id == 0 { return 0; }\n  return 0;\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 2 — the never-repaint guard dropped"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    if bf_want != 0 && bf_held != 0 { continue; }\n","",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 3 — the R6 refusal dropped"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("""  if is_opening(pc_id) {
    return push_no("you are facing a doorway, not a wall — a push carries the wall's own "
                 + "id and an opening is a hole in one, so step along the face and push "
                 + "from beside it");
  }
""","",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 4 — it never creates a wall, only clears"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    bf_want = id;\n","    bf_want = 0;\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 5 — it never clears a wall, only creates"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    bf_held = wall_of(wld, q, r, bf_d, ref);\n    if bf_held == bf_want { continue; }\n",
            "    bf_held = wall_of(wld, q, r, bf_d, ref);\n    if bf_held == bf_want { continue; }\n    if bf_want == 0 { continue; }\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 6 — it creates a FENCE instead of the id it carried"
echo "        (only the digest's wall bytes can see this: the materials come back)"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    wall_set(wld, q, r, bf_d, bf_want, h, ref);\n",
            "    if bf_want != 0 { bf_want = FENCE_MAT; }\n    wall_set(wld, q, r, bf_d, bf_want, h, ref);\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 7 — CONTROL: the six directions walked in the other order"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("  for bf_d in 0..6 {\n    (bf_q, bf_r) = hex_grid::hex_neighbor(q, r, bf_d);\n",
            "  for bf_i in 0..6 {\n    bf_d = 5 - bf_i;\n    (bf_q, bf_r) = hex_grid::hex_neighbor(q, r, bf_d);\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 8 — CONTROL: the digest's wall bytes removed (the instrument, not the subject)"
restore
python3 - "$TST" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("""            + (q + 40) * 15485863 * (c.h_wall_nw as integer ?? 0)
            + (r + 40) * 32452843 * (c.h_wall_ne as integer ?? 0)
            + (q + r + 80) * 49979687 * (c.h_wall_e as integer ?? 0);""",";",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 9 — CONTROL PAIR: row 6's fence AND row 8's blind digest, together"
echo "        (green here is what proves row 6 was caught by the wall bytes and nothing else)"
restore
python3 - "$SRC" <<'PY2'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    wall_set(wld, q, r, bf_d, bf_want, h, ref);\n",
            "    if bf_want != 0 { bf_want = FENCE_MAT; }\n    wall_set(wld, q, r, bf_d, bf_want, h, ref);\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY2
python3 - "$TST" <<'PY2'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("""            + (q + 40) * 15485863 * (c.h_wall_nw as integer ?? 0)
            + (r + 40) * 32452843 * (c.h_wall_ne as integer ?? 0)
            + (q + r + 80) * 49979687 * (c.h_wall_e as integer ?? 0);""",";",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY2
run

restore
echo "restored"
