#!/bin/sh
# K2 — DOES A CONVERTED SCRIPT BUILD WHAT IT BUILT BEFORE IT WAS CONVERTED?
#
#   sh probe/k2/run.sh                 # all eight
#   sh probe/k2/run.sh niche profiles  # named ones
#
# plan 22 `K2`. `K1` gave the scripts a second spelling; this converts the presses
# that **lose information** under it. `verb_of` maps `O P I U N M` to one `opening`
# verb, so those eighteen presses become `select <kind>` + `verb opening` — and
# every other key maps one-to-one and is left alone until it has a verb of its own.
#
# ── ⚠ WHY THIS PROBE EXISTS AT ALL: THE EIGHT SCRIPTS HAVE NO GATE ────────────
#
# `annex` `door` `embrasure` `furnish` `house` `niche` `opening` `profiles` are
# **driven by nobody automatically** — the gate suite runs `cache`, `indoors`,
# `cellar`, `clientmesh` and `deck`, and `make headless-same` runs `house` through
# the runner. So `make gate` staying green after this conversion says nothing about
# it, and a transcription slip (`select 3` where the key was `U`) would ship.
#
# `probe/k2/orig/` holds each script **as it was**, in the key spelling. Both are
# driven through a server and compared. When `K3` drops the key form those baselines
# are what records what was converted from.
#
# ── WHAT EACH CHECK MEANS IF IT FLIPS ─────────────────────────────────────────
#
#   1  the two say the same things   → red means a kind was transcribed wrongly;
#      the sentence names the profile (`opened profile 3 at (q,r)`), which is the
#      only instrument that can see it — the world cannot, measured in `probe/k1`
#   2  the two save the same world   → red means a press moved, was lost, or landed
#      somewhere else. This is the half blind to the profile and sighted everywhere
#      else, which is why both run
#   3  CONTROL — the baseline really is the OLD spelling
#      → red means `probe/k2/orig/` has been converted too and check 1 is comparing
#        a file with itself
#   4  CONTROL — the converted script really has no opening KEY left
#      → red means the conversion is half done and the pair agrees for that reason
#   5  the kinds themselves, against the wire's own `KEYMAP`
#      → red means a tens digit was transcribed wrongly. ⚠ **THIS IS NOT BELT AND
#        BRACES: CHECKS 1 AND 2 ARE BOTH BLIND TO IT.** The server prints
#        `om_kind`, which its own field comment describes as *"the profile, after
#        the tens and twenties are read off"* — so a doorway, a NICHE and an
#        EMBRASURE all report `opened profile 1`, and the store gets `DOOR_MAT`
#        whatever the depth, so the saved worlds are byte-identical too. Measured:
#        `niche.keys` cuts a doorway and two niches and says `profile 1` three
#        times. Converting `select 11` as `select 1` would have passed everything
#        above.
#
# ⚠ AND THE HEADLESS RUNNER CANNOT STAND IN FOR THAT, WHICH WAS THE FIRST IDEA.
# `hex_editor::press` has no `R` — the wall run, the second most pressed key in this
# tree — so seven of these eight scripts build **no wall at all** in `editor_run` and
# every opening in them is refused with *"no wall here to open"*. The session
# read-back `K1` added is the instrument that WOULD see a depth; it has nothing to
# look at here until `press` grows the rest of its keys.
#
# ⚠ PICTURES ARE STRIPPED FROM BOTH SIDES. `snap` photographs; it writes nothing and
# decides nothing, and eight scripts × two runs × a headless browser is minutes of
# nothing. The shots are a function of the world, and the world is check 2.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/k2/out
ALL="annex door embrasure furnish house niche opening profiles"
list=${*:-$ALL}
rm -rf "$OUT" && mkdir -p "$OUT"
fails=0

say() { printf '%s\n' "$*"; }
ok()  { say "    ok   $*"; }
bad() { say "    FAIL $*"; fails=$((fails + 1)); }

# A script with its photographs removed and a save appended, so the run ends with the
# world on disk under a name of our choosing.
prep() {
  grep -vE '^(snap|frame)( |$)' "$1" > "$2"
  printf 'save %s\n' "$3" >> "$2"
}

# One run against a server of its own. ⚠ A FRESH ONE PER SCRIPT: two runs against one
# process differ in every streaming line, because the second is told about chunks the
# first already has — `probe/k1/run.sh` has the measurement.
wire() {
  script=$1; tag=$2
  make -s port-free > /dev/null 2>&1
  : > "$OUT/$tag.server"
  nohup $LOFT --interpret --lib lib/ src/editor_server.loft > "$OUT/$tag.server" 2>&1 &
  wsrv=$!
  for _ in $(seq 1 120); do
    grep -q 'listening on port' "$OUT/$tag.server" && break
    kill -0 "$wsrv" 2>/dev/null || break
    sleep 1
  done
  if ! grep -q 'listening on port' "$OUT/$tag.server"; then
    bad "the server never listened for $tag"; tail -4 "$OUT/$tag.server"
    kill "$wsrv" 2>/dev/null; return 1
  fi
  node tools/script.mjs "$script" > "$OUT/$tag.wire" 2>&1
  # ⚠ WAIT FOR THE LOG TO SETTLE. `script.mjs` returns 250 ms after its last send and
  # the server is still writing; killing it here loses the last gesture of the run,
  # and two runs truncated at the same place agree perfectly.
  prev=-1; same=0
  for _ in $(seq 1 20); do
    now=$(wc -c < "$OUT/$tag.server")
    if [ "$now" = "$prev" ]; then same=$((same + 1)); [ "$same" -ge 2 ] && break
    else same=0; fi
    prev=$now; sleep 1
  done
  make -s stop-editor > /dev/null 2>&1
  wait "$wsrv" 2>/dev/null
  # From `listening on port` onward — everything said once the server was open for
  # business. Before that line it prints 21 lines of part-library thumbnails, and a
  # comparison that is mostly boilerplate reads as coverage.
  sed -n '/listening on port/,$p' "$OUT/$tag.server" | grep '^editor: ' \
    | grep -vE '^editor: (rebuilt|hex \(|brush |client )' \
    | grep -v '^editor: opening [0-9]* selected' \
    | sed 's/-> k2-[a-z]*-[ab]/-> <name>/' > "$OUT/$tag.said"
  return 0
}

for s in $list; do
  say "── $s.keys ──────────────────────────────────────────────────────────────"
  if [ ! -f "probe/k2/orig/$s.keys" ]; then
    bad "no baseline at probe/k2/orig/$s.keys — nothing to compare against"
    continue
  fi

  # 3 — the baseline has to still be the OLD spelling, or check 1 compares a file
  # with itself and passes for the worst possible reason.
  if grep -qE '^key [OPIUNM]$' "probe/k2/orig/$s.keys"; then
    ok "the baseline still presses $(grep -cE '^key [OPIUNM]$' "probe/k2/orig/$s.keys") opening key(s)"
  else
    bad "probe/k2/orig/$s.keys has no opening key — it is not the old spelling"
    continue
  fi
  # 4 — …and the live one has to have none left.
  if grep -qE '^key [OPIUNM]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses an opening key — the conversion is half done"
  else
    ok "the converted script cuts $(grep -c '^verb opening$' "tools/scripts/$s.keys") opening(s) by verb"
  fi

  # 5 — the kinds, through the wire's own table rather than through mine.
  #
  # The baseline's keys are mapped by `tools/script.mjs`'s `KEYMAP` (`O: '36:1'` …
  # `M: '36:21'`), which is what the server was actually sent before the conversion.
  # The converted sequence is walked with the selection carried forward, because a
  # `select` stands until something moves it — `niche.keys` chooses once and cuts
  # twice, and a check that expected one `select` per opening would call that wrong.
  sed -n "s/^ *\([A-Z]\): '36:\([0-9]*\)',.*/\1 \2/p" tools/script.mjs > "$OUT/keymap.txt"
  awk 'NR==FNR { map[$1] = $2; next }
       /^key [OPIUNM]$/ { print map[$2] }' \
      "$OUT/keymap.txt" "probe/k2/orig/$s.keys" > "$OUT/$s.kinds-a"
  awk '/^select /  { sel = $2 }
       /^verb opening$/ { print sel }' "tools/scripts/$s.keys" > "$OUT/$s.kinds-b"
  if [ ! -s "$OUT/keymap.txt" ]; then
    bad "no KEYMAP could be read out of tools/script.mjs — check 5 is vacuous"
  elif [ ! -s "$OUT/$s.kinds-a" ]; then
    bad "the baseline's keys mapped to no kinds at all"
  elif cmp -s "$OUT/$s.kinds-a" "$OUT/$s.kinds-b"; then
    ok "and the kinds themselves: $(tr '\n' ' ' < "$OUT/$s.kinds-a")"
  else
    bad "the keys named [$(tr '\n' ' ' < "$OUT/$s.kinds-a")] and the script \
selects [$(tr '\n' ' ' < "$OUT/$s.kinds-b")]"
  fi

  prep "probe/k2/orig/$s.keys" "$OUT/$s-a.keys" "k2-$s-a"
  prep "tools/scripts/$s.keys" "$OUT/$s-b.keys" "k2-$s-b"
  rm -f "worlds/k2-$s-a.hxw" "worlds/k2-$s-b.hxw"
  wire "$OUT/$s-a.keys" "$s-a" || continue
  wire "$OUT/$s-b.keys" "$s-b" || continue

  # 1 — the sentences, which are the only thing that names a profile.
  if [ ! -s "$OUT/$s-a.said" ]; then
    bad "the server said nothing about the baseline run"
  elif diff -u "$OUT/$s-a.said" "$OUT/$s-b.said" > "$OUT/$s.diff"; then
    ok "$(wc -l < "$OUT/$s-a.said") sentences identical"
  else
    bad "the two spellings said different things:"
    sed -n '1,24p' "$OUT/$s.diff" | sed 's/^/      /'
  fi
  # …and they have to have NAMED a profile, or check 1 could not have disagreed
  # about the one thing this conversion changes.
  cut=$(grep -c 'opened profile' "$OUT/$s-a.said")
  want=$(grep -cE '^key [OPIUNM]$' "probe/k2/orig/$s.keys")
  if [ "$cut" = "$want" ]; then
    ok "and they name every profile: $(grep 'opened profile' "$OUT/$s-a.said" \
        | sed 's/^editor: //' | tr '\n' ';' | cut -c1-72)"
  else
    bad "$cut 'opened profile' sentences for $want presses — a press was refused"
    grep 'refused\|no wall' "$OUT/$s-a.said" | head -3 | sed 's/^/      /'
  fi

  # 2 — the world, which is blind to the profile and sighted everywhere else.
  if [ ! -s "worlds/k2-$s-a.hxw" ] || [ ! -s "worlds/k2-$s-b.hxw" ]; then
    bad "the server saved no world"
  elif cmp -s "worlds/k2-$s-a.hxw" "worlds/k2-$s-b.hxw"; then
    ok "and the same world: $(md5sum < "worlds/k2-$s-a.hxw" | cut -c1-12), \
$(wc -c < "worlds/k2-$s-a.hxw") bytes"
  else
    bad "different worlds — $(cmp "worlds/k2-$s-a.hxw" "worlds/k2-$s-b.hxw" 2>&1 | head -1)"
  fi
done

say ""
if [ "$fails" -eq 0 ]; then
  say "K2: every converted script builds and says what it did before."
else
  say "K2: $fails FAILED"
fi
exit "$fails"
