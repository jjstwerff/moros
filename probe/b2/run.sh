#!/bin/sh
# B2/B3 (plan 22) — THE QUICK-START DEMO: `_site/index.html` FROM `file://`,
# WITH NO SERVER ANYWHERE.
#
#   probe/b2/run.sh          (or `make probe-demo`)
#
# ⚠ THIS IS THE FIRST CHECK IN THIS TREE THAT NEEDS NO PORT. Every one of the 48
# gates dials `EDITOR_PORT`; `make probe-auth`'s three runs each start a server of
# some kind, even the ones whose subject is a server that does not answer. Here
# there is no listener at either end of the wire — the page is opened off a disk,
# exactly as a person double-clicking it would.
#
# [PAGES_EDITOR § And local mode is PERMANENT](../../doc/claude/PAGES_EDITOR.md)
# is why it exists at all: *"it is a supported configuration, so it gets a gate …
# if that gate does not exist, the demo is broken the first week nobody opens
# it."*
#
# ⚠ AND THE DEMO IS THE CLIENT ENGINE BUILD, so this checks that too — `_site/`
# must be byte-identical to what the server serves at `/`. The moment those differ
# there are two pages to keep in step, which is the one thing the design refuses.
#
# ── ⚠ WHAT THE VERDICT READS, so nobody thins it by symmetry ────────────────
#
# A PICTURE gate, plus two sentences. `D3`–`D5` are read off screenshot regions
# (the drawn result belongs to a gate, per CLAUDE.md); `D6`/`D7` read the client's
# own console, because a colour cannot see WHICH surface was drawn — that is
# `B1b.2c.4c`'s finding, and this is its consumer.
#
# ⚠ THE PANEL REGION IS THE POSITIVE CONTROL IN EVERY SHOT. A capture that came
# back black would "prove" a blank world; `[].every(...)` is `true` and this tree
# has shipped a row that reported `ok` on a picture with no panel at all. If the
# panel is not busy, the shot says nothing about the world and the run fails.
set -e
cd "$(dirname "$0")/../.."
OUT="probe/b2/.out"
mkdir -p "$OUT"
SITE="$PWD/_site/index.html"
ENGINE="$PWD/src/.loft/editor_client.html"
fail() { echo "demo FAIL — $1"; exit 1; }

# ── The sabotages ───────────────────────────────────────────────────────────
#
#   DEMO_SABOTAGE=emptypage  `_site/index.html` is replaced by a page with the
#                            right ELEMENTS and no editor in it. This is `B3`'s
#                            own warning made runnable: a gate that reports `ok`
#                            on an empty page is not a gate.
#   DEMO_SABOTAGE=deadkey    press `z` — one of the twelve keys with no verb —
#                            instead of a raise. The page runs, draws and writes
#                            nothing, so a check that credits the mere passage of
#                            time with a gesture stays green here.
SAB="${DEMO_SABOTAGE:-}"
KEYS="ArrowUp"
case ",$SAB," in *,deadkey,*) KEYS="z" ;; esac

echo "── D0  the demo is the client engine build ─────────────────────────"
test -f "$ENGINE" || fail "no client engine build — run \`make client\`"
node tools/build-pages.mjs || fail "build-pages refused"
case ",$SAB," in
  *,emptypage,*)
    # ⚠ THE RIGHT ELEMENTS AND NO EDITOR. A blank file would be caught by anything;
    # the trap being guarded against is a page that LOOKS like the real one to
    # every selector the driver uses.
    printf '%s' '<!doctype html><meta charset=utf8><canvas id=c width=1200 height=660></canvas><pre id=out></pre>' > "$SITE"
    echo "   SABOTAGE emptypage — _site/index.html has the elements and no editor"
    ;;
  *)
    if ! cmp -s "$SITE" "$ENGINE"; then
      fail "_site/index.html is not the engine build — there are two pages to keep in step"
    fi
    echo "   _site/index.html is byte-identical to what the server serves at /"
    ;;
esac
echo "   $(wc -c < "$SITE") bytes"

echo
echo "── D1  open it from file://, no server at either end ───────────────"
# ⚠ IT WAITS FOR THE PAGE'S OWN SENTENCE, NEVER FOR A CLOCK. The authority is
# decided `LOCAL_AFTER` frames after boot; a key pressed before then lands in the
# wrong authority and produces a transcript that reads exactly like a demo that
# does not work.
timeout 300 node probe/b1b/press.mjs "file://$SITE" "$KEYS" \
  --await 'no server answered' --wait-ms 90000 > "$OUT/demo.raw" 2>&1 || true
grep -E '^(client|moros editor client)' "$OUT/demo.raw" > "$OUT/demo.log" || true
grep -E '^SHOT ' "$OUT/demo.raw" > "$OUT/demo.shots" || true
sed -n '1,40p' "$OUT/demo.log" | sed 's/^/   /'
cat "$OUT/demo.shots" | sed 's/^/   /'

# One field out of a `SHOT <tag> ... <region> <colours>:<crc>` line.
field() { awk -v t="$1" -v r="$2" -v f="$3" \
  '$2==t { for (i=3;i<NF;i++) if ($i==r) { split($(i+1),p,":"); print p[f]; } }' "$OUT/demo.shots"; }

boot=$(grep -c '^moros editor client' "$OUT/demo.log" || true)
local_line=$(grep -m1 'no server answered' "$OUT/demo.log" || true)
drew=$(grep -m1 'client: local drew' "$OUT/demo.log" || true)
wrote=$(grep -m1 'client: local raise' "$OUT/demo.log" || true)

echo
echo "── the verdict ─────────────────────────────────────────────────────"
ok=1
say() { echo "   $1"; }
no() { echo "   ✗ $1"; ok=0; }

# D1 — the page ran at all.
if [ "$boot" -ge 1 ]; then say "D1 booted: the engine printed its own banner"
else no "D1 the page never booted — nothing printed a banner"; fi

# D2 — and it decided it is on its own.
if [ -n "$local_line" ]; then say "D2 authority: ${local_line#client: }"
else no "D2 the page never went local — it is still dialling, or it never ran"; fi

# D3 — the world half is DRAWN. ⚠ 2 colours, not 1: an unwritten world is a flat
# plane at one height under a constant ambient, so its interior really is ONE
# colour — the region spans the HORIZON, and sky-over-ground is what `drawn` means.
wb=$(field before world 1); pb=$(field before panel 1); gb=$(field before ground 1)
if [ -n "$wb" ] && [ "$pb" -ge 50 ] 2>/dev/null; then
  if [ "$wb" -ge 2 ]; then say "D3 drawn: world $wb colours over the horizon (panel $pb, the control)"
  else no "D3 the world half is ONE colour — nothing is drawn (panel $pb)"; fi
else
  no "D3 no readable shot, or the panel is not busy — the capture says nothing (world '$wb' panel '$pb')"
fi

# D4 — and it HOLDS STILL. Without this, `the picture changed` could be anything.
ws=$(field steady world 2)
if [ -n "$wb" ] && [ "$(field before world 2)" = "$ws" ]; then
  say "D4 steady: the picture is unchanged 1.2 s later with nothing pressed"
else
  no "D4 the picture moved on its own — a change after a key would prove nothing"
fi

# D5 — a key moved it.
wa=$(field after-first world 2)
if [ -n "$wa" ] && [ "$wa" != "$ws" ]; then say "D5 the key redrew the world half ($ws → $wa)"
else no "D5 the picture did not change when the key was pressed ($ws → $wa)"; fi

# D6 — and it moved because something was WRITTEN, which a colour cannot say.
if [ -n "$wrote" ]; then say "D6 wrote: ${wrote#client: }"
else no "D6 no gesture reached the world — the page drew but did not edit"; fi

# D7 — WHICH surfaces reached the picture. A float total cannot answer this; a
# raise moves the GROUND, so `floats redrawn` rises whether or not anything else
# is drawn (`B1b.2c.4c`).
if [ -n "$drew" ]; then say "D7 surfaces: ${drew#client: }"
else no "D7 the page never named a surface it drew"; fi


# ── E  the demo can be TOLD where a server is — plan 22 `B2b` ───────────────
#
# ⚠ THREE RUNS, AND TWO OF THEM ARE CONTROLS. *The page connected* means nothing
# on its own: a client that reported a connection it had not made is the exact
# defect `B1b.1a` was written for, and it went unnoticed for months. So `E2` takes
# the listener away and `E3` takes the FILE away, and each must fail differently.
#
# ⚠ THE OTHER SIDE'S LOG IS THE NON-CIRCULAR EVIDENCE. `E1` is believed because
# `static.mjs` printed `UPGRADE COMPLETED` — a fact this side holds — and not
# because the client said so about itself.
E_PORT=19555
if ss -ltn "sport = :$E_PORT" 2>/dev/null | grep -q ":$E_PORT"; then
  echo
  echo "── E   SKIPPED — port $E_PORT is busy; this box runs other agents' work ──"
else
  echo
  echo "── E   told where a server is: 3 runs, 2 of them controls ──────────"
  E_URL="ws://127.0.0.1:$E_PORT/ws"

  # $1 tag · $2 --await text · $3 build args · $4 'up' to run the listener
  e_run() {
    node tools/build-pages.mjs $3 > "$OUT/$1.build" 2>&1 || fail "build-pages refused: $(cat "$OUT/$1.build")"
    : > "$OUT/$1.listener"
    e_pid=""
    if [ "$4" = "up" ]; then
      node probe/b1b/static.mjs probe/b2 "$E_PORT" --ws-silent > "$OUT/$1.listener" 2>&1 &
      e_pid=$!
      # ⚠ POLL FOR `listening`, NEVER SLEEP. A run whose listener had not bound yet
      # would report *the page found no server* about a race in this script.
      i=0
      while [ "$i" -lt 100 ] && ! grep -q '^static: ' "$OUT/$1.listener"; do i=$((i + 1)); sleep 0.1; done
      grep -q '^static: ' "$OUT/$1.listener" || { kill "$e_pid" 2>/dev/null; fail "the E listener never bound"; }
    fi
    timeout 300 node probe/b1b/press.mjs "file://$SITE" ArrowUp \
      --await "$2" --wait-ms 90000 > "$OUT/$1.raw" 2>&1 || true
    grep -E '^(client|moros editor client)' "$OUT/$1.raw" > "$OUT/$1.log" || true
    # ⚠ KILL BY THE PID WE RECORDED, AND THEN WAIT FOR THE PORT — NOT FOR THE
    # PROCESS. `wait "$e_pid"` hung this script for the whole of an 800-second
    # timeout with `E1` already green in its log: the browser still holds the
    # socket the listener accepted, so the shell sat on a job that had been
    # signalled and had not finished dying. The next run needs one thing only —
    # the port back — so that is what is waited for, with a bound.
    if [ -n "$e_pid" ]; then
      kill "$e_pid" 2>/dev/null || true
      i=0
      while [ "$i" -lt 100 ] && ss -ltn "sport = :$E_PORT" 2>/dev/null | grep -q ":$E_PORT"; do
        i=$((i + 1)); sleep 0.1
      done
    fi
    return 0
  }

  e_says() { grep -q "$2" "$OUT/$1.log"; }

  e_run e1 "connected to" "--servers $E_URL" up
  e_run e2 "no server answered" "--servers $E_URL" down
  e_run e3 "no server answered" "" up

  echo "   E1 (told, listener up):   $(grep -m1 -e 'connected to' -e 'no server answered' "$OUT/e1.log" | sed 's/^client: //')"
  echo "      the wire's own words:  $(grep -c 'UPGRADE COMPLETED' "$OUT/e1.listener" || true) upgrade(s) completed"
  echo "   E2 (told, listener down): $(grep -m1 -e 'connected to' -e 'no server answered' "$OUT/e2.log" | sed 's/^client: //')"
  echo "   E3 (not told, up):        $(grep -m1 -e 'connected to' -e 'no server answered' "$OUT/e3.log" | sed 's/^client: //')"

  # E1 — it attached, and the far side agrees.
  if e_says e1 "connected to '$E_URL'" && ! e_says e1 'no server answered' \
     && grep -q 'UPGRADE COMPLETED' "$OUT/e1.listener"; then
    say "E1 a demo opened from a DISK attached to an editor it was told about"
  else
    no "E1 the page did not attach to $E_URL, or the far side never saw it"
  fi

  # E2 — the control for E1. Same page, nothing listening.
  #
  # ⚠ IT MUST HAVE REACHED THE SECOND CANDIDATE, and that is not implied by going
  # local: a page that gave up after `/ws` would also print `no server answered`,
  # and would then be a control for nothing — E1's connection would be the only
  # evidence that the second candidate is ever dialled at all. The `trying` line is
  # what says it was.
  if e_says e2 'no server answered' && ! e_says e2 "connected to" \
     && e_says e2 "trying '$E_URL'"; then
    say "E2 control: it dialled the same candidate and, with nothing there, went local"
  else
    no "E2 the page claimed a connection with nothing behind the wire, or never reached $E_URL"
  fi

  # E3 — the control for the MECHANISM. The candidate is data, not a constant: a
  # page nobody told must not find a server that is sitting right there.
  if e_says e3 'no server answered' && ! e_says e3 "$E_PORT"; then
    say "E3 control: a page nobody told never dials $E_PORT, with a server on it"
  else
    no "E3 an untold page reached $E_PORT — the candidate is compiled in, not given"
  fi

  # ⚠ THE TREE IS LEFT HOLDING THE PLAIN DEMO. `make pages` means *the quick start*,
  # and a `_site/` carrying a probe's port would attach somebody's demo to a listener
  # that stopped existing when this script exited.
  node tools/build-pages.mjs > /dev/null || fail "could not restore the plain demo"
fi

echo
if [ "$ok" -eq 1 ]; then
  echo "demo PASS — _site/index.html opens from file://, edits its own world and draws it."
  echo "            No server, no toolchain, no port — and it attaches to one it is told about."
else
  fail "the quick-start demo did not hold (see $OUT/)"
fi
