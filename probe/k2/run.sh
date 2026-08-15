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
# The verb layer had no `R` — the wall run, the second most pressed key in this tree —
# so seven of these eight scripts built **no wall at all** in `editor_run` and every
# opening in them was refused with *"no wall here to open"*. The session read-back
# `K1` added is the instrument that WOULD see a depth; it had nothing to look at.
#
# ✅ **HALF OF THAT IS FIXED — plan 22 `K3`.** `verb_of("R")` names `run` and
# `press_verb` builds it, so `editor_run` lays walls now: measured, `wall.keys`
# headless answers *"wall laid 20 edges, heading 0 of 24 (snapped, residual 0°),
# length 8"*, which is the server's own sentence because it is the server's own
# function. This probe still drives a socket, because check 1's subject is what the
# SERVER says and check 2's is the world a save wrote — but the reason it *had* to is
# gone, and a headless second opinion is now possible where it was not.
#
# ── ⛔ AND CHECK 1 READS THE SERVER'S LOG, NOT THE WIRE — MEASURED, `K3` · `X` ───
#
# A twelfth check was written and **removed the same hour**, and what it cost is worth
# more than it was: *compare what the CLIENT was told*. The reasoning was sound — every
# `K3` slice moves an `S:` reply into `hex_editor` (`say_slab` is `X`'s), and check 1
# cannot see any of them, because it greps `^editor: `, which is the `println` BESIDE
# the reply. On the slab those two say different things (*slab at (0,6) 10..12* against
# *a slab 2 units thick at 0,6 — ceiling 10, floor above 12, clear 10*).
#
# ⛔ **THE WIRE CAPTURE IS NOT A DIFFABLE CHANNEL, AND THAT IS A PROPERTY OF THE
# DRIVER.** `tools/script.mjs` prints, after each line it sends, whatever message
# arrives NEXT — which is routinely a push left over from the line before — and it
# returns 250 ms after its last send with replies still in flight. So the log LAGS and
# TRUNCATES, and two scripts of different lengths (a converted one sends an extra
# `select` per press) lag by different amounts and lose different tails. Measured over
# all ten pairs: `door`, `house`, `opening` and `slab` matched; `annex`, `embrasure`,
# `niche` and `profiles` were each missing one or two `opened a profile …` replies from
# the converted side **whose worlds and server sentences were identical**; and
# `determinism` had three EXTRA lines on the converted side. Every one of those is the
# pairing shifting, not a gesture changing.
#
# ⏭ It is fixable — drain the socket to quiescence before `script.mjs` exits — and
# that is a change to the driver every gate in the tree runs, so it is not this step's.
# ✅ **What the removed check would have covered is covered**: `say_slab` is a library
# function now, and `lib/hex_editor/tests/verb.loft` asserts all three of its numbers.
# That is the division `CLAUDE.md` draws working as intended — a sentence that becomes
# a library function gets a library test, and the gate keeps the drawn result.
#
# ⚠ PICTURES ARE STRIPPED FROM BOTH SIDES. `snap` photographs; it writes nothing and
# decides nothing, and eight scripts × two runs × a headless browser is minutes of
# nothing. The shots are a function of the world, and the world is check 2.
set -u
cd "$(dirname "$0")/../.." || exit 1

LOFT=${LOFT:-loft}
OUT=probe/k2/out
# ⚠ **`determinism` JOINED THE LIST AT `K3` · `E`, AND IT HAD TO** — plan 22. It is the
# only script in the tree that presses `E`, so without it that conversion would have had
# **no both-spellings comparison at all**: `R` was in seven of the eight, `Y`/`T` and
# `J`/`K`/`V` in two, and `E` in none. ⚠ Its baseline is the script as it stood before
# `R` was converted, not before `E` was — a baseline that is half converted would make
# check 6 report a lost press.
#
# ⚠ AND IT IS THE FIRST SCRIPT HERE WITH NO OPENING IN IT, which is what turned checks
# 3, 4 and 5 conditional. They were unconditional and `continue`d on failure, so adding
# a script with nothing to open would have skipped its whole run — reported as one loud
# failure rather than silently, but skipped.
# ⚠ AND `slab` JOINED AT `K3` · `Z`, for `determinism`'s reason one gesture over: it is
# the only script that presses `Z`. ⚠ **AND CHECK 2 IS STRUCTURALLY BLIND TO WHAT IT
# CHECKS** — a hole is `es_holes`, a SESSION registry, and reaches no store at all, so
# the two saved worlds are byte-identical whether the script cut a stairwell, a coffer
# or nothing. That is the seats' blindness exactly (check 8's ⚠), and check 11 plus the
# sentences are what carry it.
# ⚠ AND `cellar` AND `deck` JOINED AT `K3` · `B`, for `determinism`'s reason — they are
# the only scripts that press `C` and `B` — but they are **unlike every other script in
# this list in one way worth knowing**: they are the only two with a REAL GATE behind
# them. `tools/gates/world/cellar_ceiling.mjs` and `deck_soffit.mjs` are thin wrappers
# that run exactly these files, so `make gate` is a second, independent instrument on
# this conversion where it says nothing at all about the other ten.
ALL="annex cellar deck determinism door embrasure furnish house niche opening profiles slab"
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
  # ⚠ 240 s, NOT 120 — and the reason is a measurement, not caution. These servers
  # are INTERPRETED from source, so the first one after any library edit recompiles;
  # `probe/k1`'s `verbed` run gave up at 120 s with its log ending mid-advice while a
  # run three minutes later listened fine. A window that is sometimes long enough is
  # a flake generator.
  for _ in $(seq 1 240); do
    grep -q 'listening on port' "$OUT/$tag.server" && break
    kill -0 "$wsrv" 2>/dev/null || break
    sleep 1
  done
  if ! grep -q 'listening on port' "$OUT/$tag.server"; then
    if kill -0 "$wsrv" 2>/dev/null; then
      bad "the server for $tag was still building after 240 s (alive, no 'listening')"
    else
      bad "the server for $tag died before listening"
    fi
    grep -vE '^advice|^warning|^ *[0-9]* \||^ *--> |^ *\^|^note:|^$' "$OUT/$tag.server" | tail -4
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
  # ⚠ **THE SELECTION LINES ARE DROPPED, AND THAT IS A COVERAGE MOVE RATHER THAN A
  # LOOSENING.** A converted script SAYS what the key implied, so it prints one extra
  # `… selected` per press and check 1 would fail every conversion for succeeding. What
  # that exclusion costs is exactly *did it select the right thing*, which is why
  # checks 5 and 8 exist and read the kinds against `tools/script.mjs`'s own table.
  # Remove either of those and this line silently becomes the blind spot it looks like.
  #
  # ⚠ AND THE SEAT PATTERN WAS ADDED WITH `K3`, MEASURED RATHER THAN ANTICIPATED:
  # `furnish` and `annex` came back red with a diff whose every line was `+editor: seat
  # <n> selected` and nothing else — same sentences, same world, same everything.
  sed -n '/listening on port/,$p' "$OUT/$tag.server" | grep '^editor: ' \
    | grep -vE '^editor: (rebuilt|hex \(|brush |client )' \
    | grep -vE '^editor: (opening|seat|annex) [0-9]* selected' \
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
  #
  # ⚠ CONDITIONAL SINCE `K3` · `E`, in the shape checks 6, 7 and 9 already had: a
  # script with no opening in EITHER spelling has nothing to say here, and demanding
  # one of every script would fail `determinism` for having nothing to do with
  # openings. What it must never become is *silent* — the `no opening` row below is
  # what says this script's checks 1 and 2 are not covering a profile.
  obase=$(grep -cE '^key [OPIUNM]$' "probe/k2/orig/$s.keys")
  oconv=$(grep -c '^verb opening$' "tools/scripts/$s.keys")
  if [ "$obase" -eq 0 ] && [ "$oconv" -eq 0 ]; then
    ok "no opening in this script — checks 1, 2 and 5 say nothing about a profile here"
  elif [ "$obase" -eq 0 ]; then
    bad "probe/k2/orig/$s.keys has no opening key — it is not the old spelling"
    continue
  else
    ok "the baseline still presses $obase opening key(s)"
  fi
  # 4 — …and the live one has to have none left.
  if grep -qE '^key [OPIUNM]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses an opening key — the conversion is half done"
  else
    ok "the converted script cuts $oconv opening(s) by verb"
  fi

  # 6 — the SAME PAIR OF CONTROLS FOR `R`, plan 22 `K3`. The run key converts
  # one-to-one, so it needs no `select` and check 5 has nothing to say about it — but
  # checks 1 and 2 are only comparing two spellings if the baseline still presses the
  # key and the live script no longer does. ⚠ `house.keys` presses no `R` at all,
  # which is why this is conditional rather than required: demanding a run of every
  # script would fail the one that has nothing to do with runs.
  rbase=$(grep -cE '^key R$' "probe/k2/orig/$s.keys")
  rconv=$(grep -c '^verb run$' "tools/scripts/$s.keys")
  if [ "$rbase" -eq 0 ] && [ "$rconv" -eq 0 ]; then
    ok "no run in this script — checks 1 and 2 say nothing about \`R\` here"
  elif grep -qE '^key R$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses \`key R\` — the run conversion is half done"
  elif [ "$rbase" != "$rconv" ]; then
    bad "the baseline presses \`key R\` $rbase time(s) and the script says \
\`verb run\` $rconv — a press was lost or gained"
  else
    ok "and it walks $rconv run press(es) by verb, where the baseline pressed \`R\`"
  fi

  # 7 — the same pair of controls for the SEAT family, plan 22 `K3`. `Y` and `T` are
  # two keys on one message differing by the thing seated, so unlike `R` they convert
  # to `select seat <kind>` + `verb seat` — the opening family's shape, one gesture over.
  sbase=$(grep -cE '^key [YT]$' "probe/k2/orig/$s.keys")
  sconv=$(grep -c '^verb seat$' "tools/scripts/$s.keys")
  if [ "$sbase" -eq 0 ] && [ "$sconv" -eq 0 ]; then
    ok "no seat in this script"
  elif grep -qE '^key [YT]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses a seat key — the conversion is half done"
  elif [ "$sbase" != "$sconv" ]; then
    bad "the baseline presses \`Y\`/\`T\` $sbase time(s) and the script says \
\`verb seat\` $sconv — a press was lost or gained"
  else
    ok "and it seats $sconv thing(s) by verb, where the baseline pressed \`Y\`/\`T\`"
  fi

  # 8 — the seat KINDS, through the wire's own table, exactly as check 5 does for
  # profiles.
  #
  # ⚠ **AND CHECK 2 IS STRUCTURALLY BLIND HERE, WHICH CHECK 5 ONLY WAS BY ACCIDENT.**
  # A seat writes into `es_props` — a SESSION registry — and nothing at all into the
  # store, so `k2-<s>-a.hxw` and `k2-<s>-b.hxw` are byte-identical whether the script
  # seated a bed, a figure, or nothing. The saved world cannot fail for a seat. Check 1
  # can (the two sentences differ: *a bed … long in the box* against *a figure … units
  # tall in the niche*), and this can. Two instruments, because one is blind by
  # construction — not for symmetry with the block above.
  # 9 — and the same pair for the ANNEX family, plan 22 `K3`. Three keys this time
  # (`J` a bedstee, `K` a balcony, `V` a cupboard), and unlike the seats the annexes DO
  # reach the store — `annexes_runs` writes wall runs — so check 2 is sighted here.
  abase=$(grep -cE '^key [JKV]$' "probe/k2/orig/$s.keys")
  aconv=$(grep -c '^verb annex$' "tools/scripts/$s.keys")
  if [ "$abase" -eq 0 ] && [ "$aconv" -eq 0 ]; then
    ok "no annex in this script"
  elif grep -qE '^key [JKV]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses an annex key — the conversion is half done"
  elif [ "$abase" != "$aconv" ]; then
    bad "the baseline presses \`J\`/\`K\`/\`V\` $abase time(s) and the script says \
\`verb annex\` $aconv — a press was lost or gained"
  else
    ok "and it hangs $aconv volume(s) by verb, where the baseline pressed \`J\`/\`K\`/\`V\`"
  fi

  # 10 — the STAIR pair, plan 22 `K3` · `E`, and it is the check whose shape is
  # deliberately UNLIKE 7, 8 and 9. `E` and `Q` differ by a DIRECTION, so they stay two
  # verbs and there is no `select` to compare kinds against — the direction has to be
  # in the verb NAME. So this counts each key against its own verb, and the red it
  # exists for is a conversion that collapsed the pair: `verb stair` twice, or
  # `stair_up` where the baseline pressed `Q`.
  #
  # ⚠ AND IT COUNTS THE TWO SEPARATELY RATHER THAN SUMMING THEM. A transcription that
  # swapped an up for a down would leave the total right, which is the order-blindness
  # check 9 was written against, one gesture over.
  ubase=$(grep -cE '^key E$' "probe/k2/orig/$s.keys")
  uconv=$(grep -c '^verb stair_up$' "tools/scripts/$s.keys")
  dbase=$(grep -cE '^key Q$' "probe/k2/orig/$s.keys")
  dconv=$(grep -c '^verb stair_down$' "tools/scripts/$s.keys")
  if [ "$ubase" -eq 0 ] && [ "$uconv" -eq 0 ] && [ "$dbase" -eq 0 ] && [ "$dconv" -eq 0 ]; then
    ok "no stair in this script"
  elif grep -qE '^key [EQ]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses a stair key — the conversion is half done"
  elif [ "$ubase" != "$uconv" ] || [ "$dbase" != "$dconv" ]; then
    bad "the baseline presses \`E\` $ubase and \`Q\` $dbase time(s) and the script says \
\`verb stair_up\` $uconv and \`verb stair_down\` $dconv — a tread changed direction"
  elif grep -q '^verb stair$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys says \`verb stair\` — the direction has been flattened \
out of the verb and into nothing"
  else
    ok "and it cuts $uconv tread(s) up and $dconv down, by two verbs where the \
baseline pressed two keys"
  fi

  # 11 — the SLAB AND THE HOLE, plan 22 `K3` · `Z` then `X`, and their shape is a third
  # one again. Not a family with kinds to compare (checks 8 and 9) and not a direction
  # pair (check 10): `X` and `Z` are two ACTIONS on one message id, so what this
  # asserts is that they converted to **two verbs that stayed apart**. A conversion
  # that turned both into one verb would be the `25:1`/`25:3` defect rebuilt — two
  # gestures answering as one — and that is what the `verb slab` line below the
  # `verb hole` count is written to catch.
  #
  # ⚠ THE TWO ARE COUNTED SEPARATELY AND THE ORDER IS NOT CHECKED HERE. It cannot be
  # from a count, and it does not need to be: a script that cut before it laid is
  # refused by the library with *lay a slab first*, so check 1 reports a sentence the
  # baseline never said. The counts catch a LOST press, which is the failure a refusal
  # would otherwise be blamed for.
  zbase=$(grep -cE '^key Z$' "probe/k2/orig/$s.keys")
  zconv=$(grep -c '^verb hole$' "tools/scripts/$s.keys")
  xbase=$(grep -cE '^key X$' "probe/k2/orig/$s.keys")
  xconv=$(grep -c '^verb slab$' "tools/scripts/$s.keys")
  if [ "$zbase" -eq 0 ] && [ "$zconv" -eq 0 ] && [ "$xbase" -eq 0 ] && [ "$xconv" -eq 0 ]
  then
    ok "no slab or hole in this script"
  elif grep -qE '^key [XZ]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses \`key X\`/\`key Z\` — the conversion is \
half done"
  elif [ "$zbase" != "$zconv" ] || [ "$xbase" != "$xconv" ]; then
    bad "the baseline presses \`X\` $xbase and \`Z\` $zbase time(s) and the script says \
\`verb slab\` $xconv and \`verb hole\` $zconv — a press was lost or gained"
  elif grep -qE '^verb slab [0-9]' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys says \`verb slab <kind>\` — the two actions have been \
flattened onto one verb with a payload"
  else
    ok "and it lays $xconv slab(s) and cuts $zconv void(s), by two verbs where the \
baseline pressed two keys"
  fi

  # 13 — the STOREY pair, plan 22 `K3` · `B`, and its shape is check 10's: two keys
  # differing by a DIRECTION stay two verbs, so there is no `select` and no kind to
  # compare — the difference has to be in the verb NAME. Each key is counted against
  # its own verb, separately, because a transcription that swapped a storey for a
  # cellar would leave the total right.
  #
  # ⚠ AND THE LAST `elif` IS THE ONE THAT MATTERS HERE, unlike at check 10. `storey`
  # and `cellar` are two DIFFERENT WORDS rather than one word with a sign, so the
  # collapse this refuses is not `verb storey` twice — it is anything that puts the
  # direction back into a payload. A script saying `verb storey -1` would read as a
  # cellar to a person and reach `12:1` on the wire, because `VERBMAP` has no argument.
  ybase=$(grep -cE '^key B$' "probe/k2/orig/$s.keys")
  yconv=$(grep -c '^verb storey$' "tools/scripts/$s.keys")
  cbase=$(grep -cE '^key C$' "probe/k2/orig/$s.keys")
  cconv=$(grep -c '^verb cellar$' "tools/scripts/$s.keys")
  if [ "$ybase" -eq 0 ] && [ "$yconv" -eq 0 ] && [ "$cbase" -eq 0 ] && [ "$cconv" -eq 0 ]
  then
    ok "no storey in this script"
  elif grep -qE '^key [BC]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys still presses a storey key — the conversion is half done"
  # ⚠ **THIS ARM COMES BEFORE THE COUNTS, AND THE ORDER IS A MEASUREMENT.** A line
  # reading `verb storey -1` matches neither `^verb storey$` nor `^verb cellar$`, so
  # the counts see a press that vanished and report *a floor changed direction* —
  # true, useless, and pointing at the wrong file. The specific diagnosis has to be
  # asked first or it is unreachable.
  elif grep -qE '^verb (storey|cellar) ' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys gives the storey verb an argument — the direction has \
gone back into a payload the wire table cannot carry"
  elif [ "$ybase" != "$yconv" ] || [ "$cbase" != "$cconv" ]; then
    bad "the baseline presses \`B\` $ybase and \`C\` $cbase time(s) and the script says \
\`verb storey\` $yconv and \`verb cellar\` $cconv — a floor changed direction"
  else
    ok "and it builds $yconv storey(s) and digs $cconv cellar(s), by two verbs where \
the baseline pressed two keys"
  fi

  # 14 — NO LIVE SCRIPT PRESSES A FREED ALIAS, plan 22 `M1`. `verb_of` bound 23 keys to
  # 15 verbs — `O P I U N M` all `opening`, `Y T` both `seat`, `J K V` all `annex` —
  # and the definition-as-data carries ONE row per verb, so those eight keys resolve to
  # nothing now. That is safe exactly while no script presses one, and this is the
  # grep that keeps it true.
  #
  # ⚠ THE BASELINES ARE NOT CHECKED AND MUST NOT BE. `probe/k2/orig/*.keys` press them
  # on purpose — they are the pre-`K2a` spelling — and they reach the server through
  # `script.mjs`'s `KEYMAP`, which sends `36:2` directly and never asks `verb_of`. A
  # check that swept them too would demand the baselines be converted, which is the one
  # thing that would make checks 1 and 2 compare a file with itself.
  if grep -qE '^key [PIUNMTKV]$' "tools/scripts/$s.keys"; then
    bad "tools/scripts/$s.keys presses a freed alias key — \
$(grep -E '^key [PIUNMTKV]$' "tools/scripts/$s.keys" | sort -u | tr '\n' ' ')— \
these resolve to no verb since the definition became data"
  else
    ok "no freed alias key is pressed here"
  fi

  sed -n "s/^ *\([A-Z]\): '37:\([0-9]*\)',.*/\1 \2/p" tools/script.mjs > "$OUT/annexmap.txt"
  awk 'NR==FNR { map[$1] = $2; next }
       /^key [JKV]$/ { print map[$2] }' \
      "$OUT/annexmap.txt" "probe/k2/orig/$s.keys" > "$OUT/$s.annex-a"
  awk '/^select annex / { asel = $3 }
       /^verb annex$/   { print asel }' "tools/scripts/$s.keys" > "$OUT/$s.annex-b"
  if [ "$abase" -eq 0 ]; then
    :
  elif [ ! -s "$OUT/annexmap.txt" ]; then
    bad "no 37: rows could be read out of tools/script.mjs — check 9 is vacuous"
  elif [ ! -s "$OUT/$s.annex-a" ]; then
    bad "the baseline's annex keys mapped to no kinds at all"
  elif cmp -s "$OUT/$s.annex-a" "$OUT/$s.annex-b"; then
    ok "and the annex kinds themselves: $(tr '\n' ' ' < "$OUT/$s.annex-a")"
  else
    bad "the annex keys named [$(tr '\n' ' ' < "$OUT/$s.annex-a")] and the script \
selects [$(tr '\n' ' ' < "$OUT/$s.annex-b")]"
  fi

  sed -n "s/^ *\([A-Z]\): '38:\([0-9]*\)',.*/\1 \2/p" tools/script.mjs > "$OUT/seatmap.txt"
  awk 'NR==FNR { map[$1] = $2; next }
       /^key [YT]$/ { print map[$2] }' \
      "$OUT/seatmap.txt" "probe/k2/orig/$s.keys" > "$OUT/$s.seats-a"
  awk '/^select seat / { ssel = $3 }
       /^verb seat$/   { print ssel }' "tools/scripts/$s.keys" > "$OUT/$s.seats-b"
  if [ "$sbase" -eq 0 ]; then
    :
  elif [ ! -s "$OUT/seatmap.txt" ]; then
    bad "no 38: rows could be read out of tools/script.mjs — check 8 is vacuous"
  elif [ ! -s "$OUT/$s.seats-a" ]; then
    bad "the baseline's seat keys mapped to no kinds — check 8 is vacuous"
  elif cmp -s "$OUT/$s.seats-a" "$OUT/$s.seats-b"; then
    ok "and the seat kinds themselves: $(tr '\n' ' ' < "$OUT/$s.seats-a")"
  else
    bad "the seat keys named [$(tr '\n' ' ' < "$OUT/$s.seats-a")] and the script \
selects [$(tr '\n' ' ' < "$OUT/$s.seats-b")]"
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
  if [ "$obase" -eq 0 ]; then
    :
  elif [ ! -s "$OUT/keymap.txt" ]; then
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
  # ⚠ THE EMPTY CASE IS SAID OUT LOUD RATHER THAN PASSING AS A CLEAN RESULT — plan 22
  # `K3` · `E`, and it was `determinism` joining the list that exposed it. `0 == 0` is
  # true, so this row printed *"and they name every profile:"* with nothing after the
  # colon — an instrument reporting success for having been asked nothing, which is
  # the shape CLAUDE.md warns about at *a grep over a log is an instrument, and its
  # default answer is absent*.
  if [ "$want" -eq 0 ]; then
    ok "no profile to name here"
  elif [ "$cut" = "$want" ]; then
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
