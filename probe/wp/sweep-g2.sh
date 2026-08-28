#!/bin/sh
# ── THE SABOTAGE SWEEP FOR `WALL_PUSH` `G2` — THE HELD TOGGLE OVER A WALK ────
#
# ⚠ Restores from copies, never `git checkout` — the subject of a sweep is uncommitted by
# definition. Every sabotage asserts that it APPLIED: a replace that matches nothing is
# silent, and a row that cut nothing reports green in the words a row that cut something
# and was not caught would use.
#
# ⛔ **ROW 2 IS THE ONE THIS SWEEP EXISTS FOR.** `G2`'s trigger is every tick and not once
# per hex ENTERED, and the argument is a deadlock: the thing a push moves is the thing
# stopping the walk. Row 2 IS the level stamp's trigger, applied to the push. If it goes
# green the argument is decoration.
set -e
cd "$(dirname "$0")/../.."
SRC=lib/hex_editor/src/tick.loft
VRB=lib/hex_editor/src/hex_editor.loft
RUN=src/editor_run.loft
KEEP=$(mktemp -d)
cp "$SRC" "$KEEP/tick.loft"
cp "$VRB" "$KEEP/hex_editor.loft"
cp "$RUN" "$KEEP/editor_run.loft"
restore() { cp "$KEEP/tick.loft" "$SRC"; cp "$KEEP/hex_editor.loft" "$VRB"; cp "$KEEP/editor_run.loft" "$RUN"; }
trap 'restore; rm -rf "$KEEP"' EXIT

grep -q 'if pushing {' "$SRC" || { echo "row 0: the push block is ABSENT from walk_tick — this sweep would answer nothing"; exit 2; }

run() {
  out=$(cd lib/hex_editor && loft test push 2>&1) || true
  if printf '%s' "$out" | grep -q "parse errors\|Error:"; then
    echo "  ⛔ DOES NOT BUILD — row void"; return
  fi
  red=$(printf '%s\n' "$out" | grep -oP 'push\.loft::\K[a-z_]+' | sort -u | tr '\n' ' ')
  if [ -z "$red" ]; then echo "  green"; else echo "  RED: $red"; fi
}

# The driver join has its own instrument: `tools/scripts/push.keys` against its baseline.
runk3d() {
  if sh probe/k3d/run.sh 2>&1 | grep -q '^  FAIL .*push'; then echo "  k3d RED: push.keys"
  else echo "  k3d green"; fi
}

echo "row 0 — control, nothing cut"
run

echo "row 1 — the push block removed from walk_tick (the feature absent)"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("  if pushing {\n","  if false {\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 2 — ⛔ the LEVEL STAMP'S TRIGGER: once per hex ENTERED instead of every tick"
restore
python3 - "$SRC" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
a="  (nq, nr) = hex_grid::px_to_hex(wk.wk_x, wk.wk_z);\n  if !wk.wk_have_hex || nq != wk.wk_hq || nr != wk.wk_hr {\n    wk.wk_have_hex = true;"
b="  sab_entered = false;\n  (nq, nr) = hex_grid::px_to_hex(wk.wk_x, wk.wk_z);\n  if !wk.wk_have_hex || nq != wk.wk_hq || nr != wk.wk_hr {\n    sab_entered = true;\n    wk.wk_have_hex = true;"
n0=len(s); s=s.replace(a,b,1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY (hex block)'
n1=len(s); s=s.replace("  if pushing {\n","  if pushing && sab_entered {\n",1)
assert len(s)!=n1, 'SABOTAGE DID NOT APPLY (trigger)'
open(p,'w').write(s)
PY
run

echo "row 3 — the second press does not disarm the toggle"
restore
python3 - "$VRB" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    if sess.es_pushing {\n      sess.es_pushing = false;\n","    if false {\n      sess.es_pushing = false;\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 4 — the arming press no longer transfers"
restore
python3 - "$VRB" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("    sess.es_pushing = true;\n    vp_made = session_push(w, a);\n",
                       "    sess.es_pushing = true;\n    return ack_about(0, \"push on\", 0);\n    vp_made = session_push(w, a);\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run

echo "row 5 — CONTROL: the push block moved above the level stamp instead of below it"
restore
python3 - "$SRC" <<'PY'
import sys, re
p=sys.argv[1]; s=open(p).read()
i=s.index("  // ── THE PUSH — `WALL_PUSH` `G2`, and it is EVERY TICK ───────────────────")
j=s.index("  // ── THE FALL ──")
block=s[i:j]
s=s[:i]+s[j:]
k=s.index("  // ── THE LEVEL STAMP — once per hex ENTERED ──")
s=s[:k]+block+s[k:]
open(p,'w').write(s)
PY
run

echo "row 6 — the RUNNER stops carrying the mode (the driver join, seen by k3d alone)"
restore
python3 - "$RUN" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace("                          sess.es_pushing,\n","                          false,\n",1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
echo "        (the library suite cannot see a driver — both instruments are read)"
run
runk3d

echo "row 7 — CONTROL: the runner's own report line deleted, the mode still carried"
restore
python3 - "$RUN" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
n0=len(s); s=s.replace('      println("  push ({rt_tk.tk_pq},{rt_tk.tk_pr}) {rt_tk.tk_pmarks} wall edges");\n','',1)
assert len(s)!=n0, 'SABOTAGE DID NOT APPLY'
open(p,'w').write(s)
PY
run
runk3d

restore
echo "restored"
