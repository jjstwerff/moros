#!/bin/sh
# P2 (plan 22) — CAN WE PUT OUR OWN JS IN A `--html` PAGE AND TALK TO LOFT?
#
#   probe/p2/run.sh          (or `make probe-p2`)
#
# `W5` — the interim storage bridge, standing in for loft#851 — rests entirely on
# the page's own claim that `host_output` a request / `loftPush` the completion is
# a supported pattern. This runs it.
#
# ⚠ IT IS A CLAIM ABOUT *OUR* JS, NOT ABOUT THE PATTERN IN THE ABSTRACT. The page
# is self-contained and we do not own its shell, so the question is whether a
# script we APPEND can define `globalThis.loftOutput` before loft boots and be
# called. The injection below is the whole experiment; if it has to become clever,
# that is itself the finding.
#
# ⚠ THE TWO SHELLS ARE NOT THE SAME, and this probe met both. `editor_client.loft`
# emits the FULL engine shell, where `loftPush` is created LAZILY inside
# `loft_host_input_len` on the first `host_input()` — so JS cannot push before loft
# has asked, unless it pre-creates `globalThis.__loftInQ`. A plain program like
# `ping.loft` emits the MINIMAL shell, where `loftPush` is defined EAGERLY over a
# module-local `inQ` and there is no `__loftInQ` at all. The shim below works on
# both: it only defines `loftOutput`, and pre-creates the full shell's queue.
set -e
cd "$(dirname "$0")/../.."
LOFT="${LOFT:-loft}"
OUT="probe/p2/.loft"

echo "── P2a  build the page ─────────────────────────────────────────────"
$LOFT --html --lib lib/ probe/p2/ping.loft >/dev/null 2>&1
test -f "$OUT/ping.html" || { echo "P2 FAIL — no page was emitted"; exit 1; }

echo "── P2b  inject OUR script ahead of loft's ──────────────────────────"
python3 - "$OUT/ping.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
shim = '''<script>
// P2's shim. It defines loftOutput and answers REQ: — and ignores SKIP:, which
// is the control: an answer to SKIP would mean the channel echoes rather than
// carries.
// ⚠ IT RECORDS WHAT WAS PUSHED, NOT A COUNT OF INTENTIONS. The first version kept
// `answered += 1` beside the push; sabotaging the push alone left the counter
// reporting 2 answers where none were delivered — a second instrument agreeing
// with a broken first. What is recorded here is the value handed to loftPush.
globalThis.__p2 = { seen: [], pushed: [] };
// The FULL engine shell creates `loftPush` lazily on the first host_input(); a
// consumer that pushes first must pre-create the queue. The MINIMAL shell defines
// loftPush eagerly and ignores this. Doing both is what makes one shim serve both.
if (!globalThis.__loftInQ) {
  globalThis.__loftInQ = [];
  globalThis.loftPush = (m) =>
    globalThis.__loftInQ.push(new TextEncoder().encode(String(m)));
}
globalThis.loftOutput = (m) => {
  globalThis.__p2.seen.push(m);
  if (String(m).startsWith('REQ:')) {
    const ans = 'ANS:' + String(m).slice(4);
    globalThis.loftPush(ans);
    globalThis.__p2.pushed.push(ans);
  }
};
</script>
'''
anchor = '<body>'
if anchor not in s:
    print('P2 FAIL — no <body> to inject before'); sys.exit(1)
if '__p2' in s.split(anchor)[0]:
    print('P2 FAIL — already injected; the build did not rerun'); sys.exit(1)
open(p, 'w', encoding='utf-8').write(s.replace(anchor, anchor + '\n' + shim, 1))
print('   injected %d bytes before the loft script' % len(shim))
PY

echo "── P2c  run it in a browser and read the page's OWN verdict ────────"
node probe/p2/drive.mjs "$OUT"
